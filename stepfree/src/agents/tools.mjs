import { z } from 'zod';
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { scanPage } from '../lib/scan.mjs';
import { suggestContrastFix, contrastRatio } from '../lib/contrast.mjs';
import { withPage, gotoStable, toUrl } from '../lib/browser.mjs';

/**
 * Custom tools exposed to StepFree's agents. Design principle: anything that
 * can be computed deterministically (contrast math, axe scans, rendering) is
 * a tool — the model supplies judgment, never arithmetic.
 */

function insideWorkdir(workdir, p) {
  const abs = resolve(workdir, p);
  return abs.startsWith(resolve(workdir) + '/') || abs === resolve(workdir) ? abs : null;
}

export function makeStepfreeTools({ workdir, ledger }) {
  const scan_file = tool(
    'scan_file',
    'Run the axe-core accessibility scanner on an HTML file in the working copy and get the current list of violations. Use this to check your work — the orchestrator will verify with the same scanner.',
    { path: z.string().describe('Path to the HTML file, relative to the working copy root') },
    async ({ path }) => {
      const abs = insideWorkdir(workdir, path);
      if (!abs || !existsSync(abs)) {
        return { content: [{ type: 'text', text: `File not found in working copy: ${path}` }], isError: true };
      }
      const scan = await scanPage(abs);
      const lines = [];
      lines.push(`WCAG A/AA violations: ${scan.counts.wcag.nodes} instance(s) | best-practice: ${scan.counts.bestPractice.nodes}`);
      for (const v of scan.violations) {
        lines.push(`\n[${v.tier}] ${v.id} (${v.impact}) — ${v.help}`);
        for (const n of v.nodes.slice(0, 10)) {
          lines.push(`  • ${n.target}\n    ${n.html.slice(0, 220)}`);
        }
        if (v.nodes.length > 10) lines.push(`  … and ${v.nodes.length - 10} more`);
      }
      return { content: [{ type: 'text', text: lines.join('\n').slice(0, 9000) }] };
    }
  );

  const contrast_suggest = tool(
    'contrast_suggest',
    'Compute WCAG contrast ratio for a color pair and get the closest compliant alternatives that preserve the brand hue (lightness-only adjustment). Always use this instead of guessing colors.',
    {
      foreground: z.string().describe('CSS color of the text, e.g. #c9a227'),
      background: z.string().describe('CSS color behind it, e.g. #ffffff'),
      fontSizePx: z.number().optional().describe('Font size in px (default 16)'),
      bold: z.boolean().optional().describe('Whether the text is bold (default false)'),
    },
    async ({ foreground, background, fontSizePx = 16, bold = false }) => {
      try {
        const res = suggestContrastFix({ foreground, background, fontSizePx, bold });
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
      }
    }
  );

  const check_contrast = tool(
    'check_contrast',
    'Just compute the contrast ratio between two colors (no suggestions).',
    { foreground: z.string(), background: z.string() },
    async ({ foreground, background }) => {
      try {
        return { content: [{ type: 'text', text: `${contrastRatio(foreground, background).toFixed(2)}:1` }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
      }
    }
  );

  const view_image = tool(
    'view_image',
    'Render an image file (SVG/PNG/JPG) from the working copy and SEE it. Always look at an image before writing alt text for it — never guess from the filename.',
    { path: z.string().describe('Path to the image, relative to the working copy root') },
    async ({ path }) => {
      const abs = insideWorkdir(workdir, path);
      if (!abs || !existsSync(abs)) {
        return { content: [{ type: 'text', text: `Image not found in working copy: ${path}` }], isError: true };
      }
      try {
        const png = await renderImageToPng(abs);
        return {
          content: [
            { type: 'text', text: `Rendered ${path}:` },
            { type: 'image', data: png.toString('base64'), mimeType: 'image/png' },
          ],
        };
      } catch (e) {
        return { content: [{ type: 'text', text: `Could not render image: ${e.message}` }], isError: true };
      }
    }
  );

  const view_page = tool(
    'view_page',
    'Render an HTML file from the working copy in a real browser and SEE the resulting page (viewport screenshot). Use to understand layout and visual context.',
    { path: z.string().describe('Path to the HTML file, relative to the working copy root') },
    async ({ path }) => {
      const abs = insideWorkdir(workdir, path);
      if (!abs || !existsSync(abs)) {
        return { content: [{ type: 'text', text: `File not found: ${path}` }], isError: true };
      }
      const png = await withPage(async (page) => {
        await gotoStable(page, abs);
        return page.screenshot({ fullPage: false });
      });
      return {
        content: [
          { type: 'text', text: `Viewport screenshot of ${path}:` },
          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' },
        ],
      };
    }
  );

  const record_convention = tool(
    'record_convention',
    'Record a site-wide decision so later fixes (and other pages) stay consistent, e.g. a brand color substitution or an alt-text style. Check existing conventions in your instructions before inventing a new one.',
    {
      key: z.string().describe('Stable identifier, e.g. "color:#c9a227-on-#ffffff" or "alt-style"'),
      value: z.string().describe('The decision, e.g. "replace with #8a6d0f" or "concise, no leading \'image of\'"'),
      rationale: z.string().describe('One sentence on why'),
    },
    async ({ key, value, rationale }) => {
      ledger.conventions[key] = { value, rationale, recordedAt: new Date().toISOString() };
      return { content: [{ type: 'text', text: `Convention recorded: ${key} → ${value}` }] };
    }
  );

  const flag_for_review = tool(
    'flag_for_review',
    'Queue an issue for the human reviewer instead of changing the page — for judgment calls (brand-affecting choices, ambiguous image purpose, content meaning) or issues you cannot fix safely. Include a concrete proposed fix so the human only has to approve or adjust it.',
    {
      page: z.string().describe('The HTML file concerned'),
      selector: z.string().describe('CSS selector or description locating the issue'),
      issue: z.string().describe('What is wrong, in plain language'),
      wcag: z.string().describe('WCAG success criterion, e.g. "1.4.5 Images of Text"'),
      proposedFix: z.string().describe('The exact change you propose (code or clear instructions)'),
      confidence: z.enum(['high', 'medium', 'low']).describe('Your confidence in the proposed fix'),
    },
    async (item) => {
      ledger.reviewQueue.push({ ...item, flaggedAt: new Date().toISOString() });
      return { content: [{ type: 'text', text: `Queued for human review (${ledger.reviewQueue.length} item(s) in queue).` }] };
    }
  );

  return { scan_file, contrast_suggest, check_contrast, view_image, view_page, record_convention, flag_for_review };
}

export async function renderImageToPng(absPath) {
  const ext = extname(absPath).toLowerCase();
  if (ext === '.png') {
    const buf = readFileSync(absPath);
    if (buf.length < 1_500_000) return buf;
  }
  // Navigate to the image file directly — file:// subresources inside a
  // setContent() page are blocked by Chromium, which silently yields a
  // broken-image glyph. Direct navigation renders reliably (SVG included).
  return withPage(
    async (page) => {
      await page.goto(toUrl(absPath));
      await page.waitForTimeout(150);
      const img = await page.$('img'); // raster files are wrapped in an <img>
      if (img) return img.screenshot();
      return page.screenshot(); // SVG documents render as the page itself
    },
    { viewport: { width: 680, height: 520 } }
  );
}

export function makeMcpServer(tools) {
  return createSdkMcpServer({ name: 'stepfree', version: '1.0.0', tools: Object.values(tools) });
}
