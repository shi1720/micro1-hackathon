import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KNOWLEDGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'knowledge');

/**
 * Specialist fixers. Order matters: structural semantics first (they may retag
 * elements), colors last (so contrast fixes land on the final DOM).
 * Each specialist gets only the tools it needs.
 */
export const SPECIALISTS = [
  {
    key: 'structure',
    title: 'Structure & semantics',
    knowledge: 'structure.md',
    rules: [
      'html-has-lang', 'html-lang-valid', 'html-xml-lang-mismatch', 'document-title', 'meta-viewport',
      'list', 'listitem', 'definition-list', 'dlitem', 'heading-order', 'page-has-heading-one',
      'landmark-one-main', 'landmark-unique', 'landmark-no-duplicate-banner', 'landmark-no-duplicate-contentinfo',
      'landmark-banner-is-top-level', 'landmark-contentinfo-is-top-level', 'landmark-main-is-top-level',
      'landmark-complementary-is-top-level', 'region', 'bypass', 'empty-heading', 'tabindex',
      'duplicate-id', 'duplicate-id-active', 'duplicate-id-aria', 'meta-refresh',
    ],
    tools: ['scan_file', 'record_convention', 'flag_for_review'],
  },
  {
    key: 'media',
    title: 'Images & non-text content',
    knowledge: 'media.md',
    rules: ['image-alt', 'svg-img-alt', 'area-alt', 'object-alt', 'role-img-alt', 'input-image-alt', 'image-redundant-alt'],
    tools: ['scan_file', 'view_image', 'view_page', 'record_convention', 'flag_for_review'],
  },
  {
    key: 'forms',
    title: 'Forms, labels & accessible names',
    knowledge: 'forms.md',
    rules: [
      'label', 'select-name', 'button-name', 'link-name', 'input-button-name', 'label-title-only',
      'form-field-multiple-labels', 'autocomplete-valid', 'empty-table-header',
    ],
    tools: ['scan_file', 'view_page', 'record_convention', 'flag_for_review'],
  },
  {
    key: 'aria',
    title: 'ARIA repair',
    knowledge: 'aria.md',
    rules: [
      'aria-hidden-focus', 'aria-hidden-body', 'aria-required-attr', 'aria-required-children', 'aria-required-parent',
      'aria-valid-attr', 'aria-valid-attr-value', 'aria-allowed-attr', 'aria-allowed-role', 'aria-roles',
      'aria-command-name', 'aria-input-field-name', 'aria-toggle-field-name', 'aria-meter-name', 'aria-progressbar-name',
      'aria-tooltip-name', 'aria-text', 'aria-treeitem-name', 'aria-dialog-name', 'aria-deprecated-role',
      'aria-prohibited-attr', 'aria-conditional-attr', 'aria-braille-equivalent', 'scrollable-region-focusable',
      'frame-title', 'frame-title-unique', 'frame-focusable-content', 'nested-interactive', 'presentation-role-conflict',
    ],
    tools: ['scan_file', 'view_page', 'record_convention', 'flag_for_review'],
  },
  {
    key: 'contrast',
    title: 'Color contrast',
    knowledge: 'contrast.md',
    rules: ['color-contrast', 'color-contrast-enhanced', 'link-in-text-block'],
    tools: ['scan_file', 'contrast_suggest', 'check_contrast', 'view_page', 'record_convention', 'flag_for_review'],
  },
];

export const GENERAL_SPECIALIST = {
  key: 'general',
  title: 'General fixes',
  knowledge: 'general.md',
  rules: [],
  tools: ['scan_file', 'view_page', 'record_convention', 'flag_for_review'],
};

export const REVIEW_SPECIALIST = {
  key: 'review',
  title: 'Beyond-scanner expert review',
  knowledge: 'review.md',
  rules: [],
  tools: ['scan_file', 'view_image', 'view_page', 'flag_for_review'],
};

export function loadKnowledge(file) {
  return readFileSync(join(KNOWLEDGE_DIR, file), 'utf8');
}

/** Route scan violations to specialists. Returns ordered [{ specialist, violations }]. */
export function routeViolations(violations) {
  const buckets = new Map();
  for (const spec of SPECIALISTS) buckets.set(spec.key, []);
  const general = [];
  for (const v of violations) {
    const spec = SPECIALISTS.find((s) => s.rules.includes(v.id));
    if (spec) buckets.get(spec.key).push(v);
    else general.push(v);
  }
  const out = [];
  for (const spec of SPECIALISTS) {
    if (buckets.get(spec.key).length) out.push({ specialist: spec, violations: buckets.get(spec.key) });
  }
  if (general.length) out.push({ specialist: GENERAL_SPECIALIST, violations: general });
  return out;
}

const COMMON_RULES = `
Working rules (non-negotiable):
- You are editing a SANDBOXED working copy; the original site is untouched. Still, edit with production care.
- Preserve the page's visual design and all its content: never delete visible text or images, never change copy, never alter where links go or what forms submit. Your diff should be the smallest one that fixes the assigned issues.
- After making your fixes, run scan_file on the page and confirm every assigned violation is resolved and NO new violations appeared. Deterministic verification will re-check everything you claim.
- If an assigned issue requires a judgment call you cannot ground in the page itself, make your best safe fix AND flag_for_review with your reasoning — or flag without fixing if no safe fix exists.
- Do not fix issues assigned to other specialists unless your change resolves them incidentally.`;

export function buildSpecialistPrompts({ specialist, pageRel, violations, conventions, memoryEnabled, reviewSummary }) {
  const knowledge = loadKnowledge(specialist.knowledge);

  const systemPrompt = `You are StepFree's "${specialist.title}" specialist — an expert accessibility engineer fixing real WCAG violations in a small business's website source code.
${COMMON_RULES}

## Your expertise
${knowledge}`;

  const conventionLines =
    memoryEnabled && conventions && Object.keys(conventions).length
      ? `\n## Site conventions already agreed (FOLLOW these exactly; record new ones with record_convention)\n` +
        Object.entries(conventions)
          .map(([k, v]) => `- ${k}: ${v.value} (${v.rationale})`)
          .join('\n')
      : memoryEnabled
        ? `\n## Site conventions\nNone recorded yet — record any site-wide decision you make with record_convention.`
        : '';

  const violationLines = violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    - selector: ${n.target}\n      html: ${n.html.slice(0, 260)}\n      why: ${(n.failureSummary || '').split('\n').slice(0, 3).join(' ').slice(0, 300)}`)
        .join('\n');
      return `- ${v.id} (${v.impact}, ${v.tier}) — ${v.help}\n${nodes}`;
    })
    .join('\n');

  const prompt = `Fix the following accessibility violations in \`${pageRel}\` (a self-contained HTML page in your working directory).
${conventionLines}
${reviewSummary ? `\n${reviewSummary}\n` : ''}
## Assigned violations (from axe-core)
${violationLines}

Read the file, understand the design, apply your fixes, then verify with scan_file that all assigned violations are gone and nothing new was introduced. Finish with a one-paragraph summary of exactly what you changed and why.`;

  return { systemPrompt, prompt };
}

export function buildGenericPrompts({ pageRel, violations, withTools }) {
  const systemPrompt = `You are an accessibility engineer. Fix WCAG violations in a website's source code. Preserve the page's visual design and content; make the smallest change that fixes each issue.${
    withTools ? ' After fixing, verify with scan_file.' : ''
  }`;
  const violationLines = violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `    - ${n.target}: ${n.html.slice(0, 200)}`).join('\n');
      return `- ${v.id} (${v.impact}) — ${v.help}\n${nodes}`;
    })
    .join('\n');
  const prompt = `Fix all of the following accessibility violations in \`${pageRel}\`:\n\n${violationLines}\n\nEdit the file to fix every violation. Finish with a short summary of your changes.`;
  return { systemPrompt, prompt };
}

export function buildReviewPrompts({ pageRel, conventions, queueSummary }) {
  const knowledge = loadKnowledge(REVIEW_SPECIALIST.knowledge);
  const systemPrompt = `You are StepFree's beyond-scanner expert reviewer.
- You NEVER edit files. Your only output channel is the flag_for_review tool (plus a final summary).
- Ground every finding in what you actually observe in the code and rendered page.

${knowledge}`;
  const prompt = `Review \`${pageRel}\` for accessibility issues that automated scanners cannot detect. The automated fixes have already been applied to this working copy.

Steps: read the source; view the rendered page (view_page); view any suspicious images (view_image); check onclick/tabindex/aria patterns; then flag_for_review each real finding with a concrete proposed fix.
${queueSummary ? `\nAlready in the review queue (do not duplicate):\n${queueSummary}` : ''}
Finish with a one-paragraph summary of what you found.`;
  return { systemPrompt, prompt };
}
