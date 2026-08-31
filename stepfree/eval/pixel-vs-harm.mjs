#!/usr/bin/env node
/**
 * The removed-experiment demo: why a global pixel-diff gate cannot be the
 * safety net for automated fixes. Two mechanical edits to the same page:
 *
 *   A) LEGITIMATE  — recolor the menu descriptions to a compliant color
 *                    (exactly what a contrast fix does)
 *   B) DESTRUCTIVE — delete an entire menu item (content gone for everyone)
 *
 * A repaints more pixels than B. A gate that orders edits by pixel area
 * ranks the harmless fix as MORE suspicious than the destructive one.
 * Content invariants (word inventory) order them correctly.
 *
 * Deterministic, no LLM. Usage: node stepfree/eval/pixel-vs-harm.mjs
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { cpSync } from 'node:fs';
import { snapshotPage } from '../src/lib/snapshot.mjs';
import { comparePixels, compareText } from '../src/lib/integrity.mjs';
import { closeBrowser } from '../src/lib/browser.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'fixtures', '03-trattoria');

const dir = mkdtempSync(join(tmpdir(), 'pixel-vs-harm-'));
cpSync(SRC, dir, { recursive: true });
const page = join(dir, 'index.html');
const original = readFileSync(page, 'utf8');

const base = await snapshotPage(page);

// A) the legitimate contrast fix: recolor every dim menu description/price.
writeFileSync(
  page,
  original.replace('</style>', `  .dish-desc, .dish-price, .muted { color: #cfc5b8 !important; }\n</style>`)
);
const snapA = await snapshotPage(page);
const pxA = comparePixels(base.screenshotViewport, snapA.screenshotViewport);
const textA = compareText(base.text, snapA.text);

// B) the destructive edit: delete one whole menu item (first <li>…</li> or dish block).
const liMatch = original.match(/<li[\s\S]*?<\/li>/);
writeFileSync(page, liMatch ? original.replace(liMatch[0], '') : original);
const snapB = await snapshotPage(page);
const pxB = comparePixels(base.screenshotViewport, snapB.screenshotViewport);
const textB = compareText(base.text, snapB.text);

// C) another LEGITIMATE fix, done the way a naive fixer does it: repair the
// bakery's heading-order (h1→h3 skip) by retagging h3→h2 without carrying
// the visual size. Correct semantics, zero content loss — big repaint.
const SRC_C = join(ROOT, 'fixtures', '01-bakery');
const dirC = mkdtempSync(join(tmpdir(), 'pixel-vs-harm-c-'));
cpSync(SRC_C, dirC, { recursive: true });
const pageC = join(dirC, 'index.html');
const originalC = readFileSync(pageC, 'utf8');
const baseC = await snapshotPage(pageC);
writeFileSync(pageC, originalC.replaceAll('<h3>', '<h2>').replaceAll('</h3>', '</h2>'));
const snapC = await snapshotPage(pageC);
const pxC = comparePixels(baseC.screenshotViewport, snapC.screenshotViewport);
const textC = compareText(baseC.text, snapC.text);

console.log('Edit                                        | viewport pixels changed | words lost');
console.log('--------------------------------------------|-------------------------|-----------');
console.log(`A) contrast recolor (legit, trattoria)      | ${(pxA.pixelDiffRatio * 100).toFixed(2).padStart(6)}%                 | ${textA.missing.length}`);
console.log(`B) whole menu item DELETED (harm, trattoria)| ${(pxB.pixelDiffRatio * 100).toFixed(2).padStart(6)}%                 | ${textB.missing.length}`);
console.log(`C) naive heading retag (legit, bakery)      | ${(pxC.pixelDiffRatio * 100).toFixed(2).padStart(6)}%                 | ${textC.missing.length}`);
console.log('');
console.log('Reading:');
console.log(`- A strict gate (≤0.5%) never even sees A (${(pxA.pixelDiffRatio * 100).toFixed(2)}%) — text recoloring is tiny in pixel area.`);
console.log(`- A loose gate that admits C (${(pxC.pixelDiffRatio * 100).toFixed(2)}%, a legitimate fix) must also admit B (${(pxB.pixelDiffRatio * 100).toFixed(2)}%, destroyed content).`);
console.log(`- Pixel area measures REFLOW, not harm. The word inventory orders them correctly: B loses ${textB.missing.length} words; A and C lose ${textA.missing.length + textC.missing.length}.`);
await closeBrowser();
