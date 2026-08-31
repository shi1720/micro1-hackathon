/** Quick self-test of the deterministic core. Run: node stepfree/eval/selftest.mjs */
import assert from 'node:assert';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { contrastRatio, suggestContrastFix } from '../src/lib/contrast.mjs';
import { scanPage, diffScans } from '../src/lib/scan.mjs';
import { snapshotPage } from '../src/lib/snapshot.mjs';
import { checkIntegrity } from '../src/lib/integrity.mjs';
import { closeBrowser } from '../src/lib/browser.mjs';

// --- contrast math against known WCAG reference values
assert.ok(Math.abs(contrastRatio('#777777', '#ffffff') - 4.48) < 0.02, '#777 vs white ≈ 4.48');
assert.ok(Math.abs(contrastRatio('#767676', '#ffffff') - 4.54) < 0.02, '#767676 vs white ≈ 4.54');
assert.equal(contrastRatio('#000000', '#ffffff').toFixed(0), '21');
const fix = suggestContrastFix({ foreground: '#999999', background: '#ffffff', fontSizePx: 16 });
assert.ok(fix.fixForeground && fix.fixForeground.ratio >= 4.5, 'suggested fg meets 4.5');
assert.ok(fix.current < 4.5, 'original fails');
console.log('contrast ✅  (e.g. #999 on white →', fix.fixForeground.color, '@', fix.fixForeground.ratio + ':1)');

// --- scan + snapshot + integrity on generated pages
const dir = mkdtempSync(join(tmpdir(), 'stepfree-selftest-'));
const bad = join(dir, 'bad.html');
writeFileSync(
  bad,
  `<html><head></head><body><img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>">
   <p style="color:#aaa;background:#fff">Fresh sourdough daily specials</p><a href="#"></a></body></html>`
);
const scan1 = await scanPage(bad);
assert.ok(scan1.counts.wcag.nodes >= 4, `expected ≥4 wcag instances, got ${scan1.counts.wcag.nodes}`);

const fixedPage = join(dir, 'good.html');
writeFileSync(
  fixedPage,
  `<html lang="en"><head><title>Bakery</title></head><body><main><h1>Bakery</h1><img alt="" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>">
   <p style="color:#595959;background:#fff">Fresh sourdough daily specials</p><a href="#">Menu</a></main></body></html>`
);
const scan2 = await scanPage(fixedPage);
assert.equal(scan2.counts.wcag.nodes, 0, 'fixed page has 0 wcag violations');
const d = diffScans(scan1, scan2);
assert.ok(d.fixed.length >= 4 && d.introduced.length === 0);
console.log('scan/diff ✅  (', scan1.counts.wcag.nodes, '→', scan2.counts.wcag.nodes, 'instances )');

const snapA = await snapshotPage(bad);
const broken = join(dir, 'broken.html');
writeFileSync(broken, `<html><head></head><body><a href="#"></a></body></html>`); // text + image removed
const snapB = await snapshotPage(broken);
const verdict = checkIntegrity(snapA, snapB);
assert.ok(!verdict.ok && verdict.hardFailures.some((f) => f.kind === 'text-loss'), 'detects text loss');
const snapSame = await snapshotPage(bad);
const verdictSame = checkIntegrity(snapA, snapSame);
assert.ok(verdictSame.ok && verdictSame.metrics.pixelDiffRatio < 0.001, 'identical page passes');
console.log('integrity ✅  (destructive edit caught, identical page clean)');

await closeBrowser();
console.log('\nALL SELF-TESTS PASSED');
