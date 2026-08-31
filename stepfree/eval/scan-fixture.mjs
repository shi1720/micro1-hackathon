#!/usr/bin/env node
/**
 * Scan one fixture directory (or a single .html file) and print the axe
 * ground truth. Used to verify seeded violations and to compare against
 * a fixture's meta.json expectations.
 *
 * Usage: node stepfree/eval/scan-fixture.mjs fixtures/01-bakery [--json]
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { scanPage } from '../src/lib/scan.mjs';
import { closeBrowser } from '../src/lib/browser.mjs';
import { listFixturePages } from './fixtures.mjs';

const arg = process.argv[2];
const asJson = process.argv.includes('--json');
if (!arg) {
  console.error('usage: node stepfree/eval/scan-fixture.mjs <fixture-dir|page.html> [--json]');
  process.exit(1);
}

const target = resolve(arg);
const pages = target.endsWith('.html') ? [target] : listFixturePages(target);

const out = [];
for (const pagePath of pages) {
  const scan = await scanPage(pagePath);
  out.push({ page: pagePath, counts: scan.counts, rules: scan.violations.map((v) => `${v.id} ×${v.nodes.length} [${v.tier}]`) });
}
await closeBrowser();

if (asJson) {
  console.log(JSON.stringify(out, null, 2));
} else {
  for (const p of out) {
    console.log(`\n${p.page}`);
    console.log(`  WCAG A/AA: ${p.counts.wcag.nodes} instance(s) across ${p.counts.wcag.rules} rule(s)`);
    console.log(`  Best-practice: ${p.counts.bestPractice.nodes} instance(s) across ${p.counts.bestPractice.rules} rule(s)`);
    for (const r of p.rules) console.log(`    - ${r}`);
  }
  const metaPath = join(target, 'meta.json');
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    if (meta.expected) {
      const totalWcag = out.reduce((s, p) => s + p.counts.wcag.nodes, 0);
      const totalBp = out.reduce((s, p) => s + p.counts.bestPractice.nodes, 0);
      const ok = totalWcag === meta.expected.wcagNodes && totalBp === meta.expected.bestPracticeNodes;
      console.log(`\nmeta.json expectation: wcag=${meta.expected.wcagNodes} bp=${meta.expected.bestPracticeNodes} → ${ok ? 'MATCH ✅' : `MISMATCH ❌ (got wcag=${totalWcag} bp=${totalBp})`}`);
      process.exit(ok ? 0 : 2);
    }
  }
}
