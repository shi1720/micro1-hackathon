#!/usr/bin/env node
/**
 * StepFree CLI
 *
 *   node stepfree/src/cli.mjs fix  <site-dir> [--out <dir>] [--stage v1|v2|v3|v4|final] [--model <id>]
 *   node stepfree/src/cli.mjs scan <site-dir-or-page.html>
 *
 * `fix` copies the site into a sandboxed working copy under --out and runs the
 * pipeline there; the input site is never modified (human approval happens by
 * deploying the working copy).
 */
import { resolve, join, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { closeBrowser } from './lib/browser.mjs';

const [cmd, target, ...rest] = process.argv.slice(2);

function flag(name, dflt) {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : dflt;
}

if (!cmd || !target) {
  console.log(`StepFree — the agentic accessibility engineer

Usage:
  node stepfree/src/cli.mjs fix  <site-dir> [--out <dir>] [--stage final] [--model claude-sonnet-5]
  node stepfree/src/cli.mjs scan <site-dir-or-page.html>`);
  process.exit(cmd ? 1 : 0);
}

try {
  if (cmd === 'scan') {
    const { scanPage } = await import('./lib/scan.mjs');
    const { listFixturePages } = await import('../eval/fixtures.mjs');
    const abs = resolve(target);
    const pages = abs.endsWith('.html') ? [abs] : listFixturePages(abs);
    for (const p of pages) {
      const scan = await scanPage(p);
      console.log(`\n${p}`);
      console.log(`  WCAG A/AA: ${scan.counts.wcag.nodes} instances | best-practice: ${scan.counts.bestPractice.nodes}`);
      for (const v of scan.violations) console.log(`  - [${v.tier}] ${v.id} ×${v.nodes.length} (${v.impact})`);
    }
  } else if (cmd === 'fix') {
    const { fixSite } = await import('./orchestrator.mjs');
    const siteDir = resolve(target);
    if (!existsSync(siteDir)) throw new Error(`No such site: ${siteDir}`);
    const stage = flag('stage', 'final');
    const out = resolve(flag('out', join('runs', `${basename(siteDir)}-${stage}`)));
    const model = flag('model', undefined);
    await fixSite({ siteDir, outDir: out, stage, model: model || undefined });
  } else {
    throw new Error(`Unknown command: ${cmd}`);
  }
} finally {
  await closeBrowser();
}
