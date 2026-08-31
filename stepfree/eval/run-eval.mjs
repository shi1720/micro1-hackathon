#!/usr/bin/env node
/**
 * Evaluation harness. Measurement is INDEPENDENT of the system under test:
 * it re-scans and re-snapshots pages itself and never trusts run ledgers for
 * outcome numbers (ledgers are used only for cost/time/process stats).
 *
 * Subcommands:
 *   verify-fixtures  — scan every fixture, check meta.json ground truth, write results/ground-truth.json
 *   run              — execute a stage over fixtures:      --stage baseline|v1|v2|v3|v4|final [--only a,b] [--concurrency 2]
 *   measure          — measure a stage's outputs:          --stage <s> [--only a,b]
 *   tables           — regenerate results/summary.md from all measured stages
 *
 * Layout: runs/<stage>/<fixture>/ … measured into eval/results/<stage>.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join, basename, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanPage, diffScans } from '../src/lib/scan.mjs';
import { snapshotPage } from '../src/lib/snapshot.mjs';
import { checkIntegrity } from '../src/lib/integrity.mjs';
import { closeBrowser } from '../src/lib/browser.mjs';
import { listFixtures, listFixturePages } from './fixtures.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RESULTS_DIR = join(ROOT, 'stepfree', 'eval', 'results');
const STAGE_ORDER = ['baseline', 'v1', 'v2', 'v3', 'v4', 'final'];

const [cmd] = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : dflt;
};
const fixturesRoot = resolve(flag('fixtures', join(ROOT, 'fixtures')));
const runsRoot = resolve(flag('out', join(ROOT, 'runs')));
const only = flag('only', '').split(',').filter(Boolean);

function fixtureDirs() {
  return listFixtures(fixturesRoot).filter((d) => !only.length || only.includes(basename(d)));
}

async function verifyFixtures() {
  const truth = { verifiedAt: new Date().toISOString(), fixtures: {} };
  let ok = true;
  for (const dir of fixtureDirs()) {
    const name = basename(dir);
    const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
    let wcag = 0, bp = 0;
    const pages = {};
    for (const p of listFixturePages(dir)) {
      const scan = await scanPage(p);
      wcag += scan.counts.wcag.nodes;
      bp += scan.counts.bestPractice.nodes;
      pages[relative(dir, p)] = {
        wcag: scan.counts.wcag.nodes,
        bp: scan.counts.bestPractice.nodes,
        rules: Object.fromEntries(scan.violations.map((v) => [v.id, v.nodes.length])),
      };
    }
    const match = wcag === meta.expected.wcagNodes && bp === meta.expected.bestPracticeNodes;
    if (!match) ok = false;
    truth.fixtures[name] = { pages, wcag, bp, expected: meta.expected, match };
    console.log(`${match ? '✅' : '❌'} ${name}: wcag=${wcag} bp=${bp} (meta says ${meta.expected.wcagNodes}/${meta.expected.bestPracticeNodes})`);
  }
  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(join(RESULTS_DIR, 'ground-truth.json'), JSON.stringify(truth, null, 2));
  if (!ok) {
    console.error('\nGround truth mismatch — fix the fixtures or their meta.json before running evals.');
    process.exit(2);
  }
  console.log(`\nGround truth locked: ${Object.values(truth.fixtures).reduce((s, f) => s + f.wcag, 0)} WCAG instances across ${Object.keys(truth.fixtures).length} fixtures.`);
}

async function runStage() {
  const stage = flag('stage');
  if (!stage) throw new Error('--stage required');
  if (!existsSync(join(RESULTS_DIR, 'ground-truth.json'))) {
    throw new Error('Run `verify-fixtures` first to lock ground truth.');
  }
  const concurrency = parseInt(flag('concurrency', '2'), 10);
  const model = flag('model', undefined) || undefined;
  const dirs = fixtureDirs();
  console.log(`Running stage "${stage}" over ${dirs.length} fixture(s), concurrency ${concurrency}`);

  const queue = [...dirs];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const dir = queue.shift();
      const name = basename(dir);
      const outDir = join(runsRoot, stage, name);
      try {
        if (stage === 'baseline') {
          const { runBaseline } = await import('../baseline/lib.mjs');
          await runBaseline({ siteDir: dir, outDir, model });
        } else {
          const { fixSite } = await import('../src/orchestrator.mjs');
          await fixSite({ siteDir: dir, outDir, stage, model });
        }
      } catch (e) {
        console.error(`✖ ${name} failed: ${e.message}`);
        writeFileSync(join(runsRoot, stage, `${name}.FAILED`), String(e.stack || e));
      }
    }
  });
  await Promise.all(workers);
  console.log(`\nStage "${stage}" complete. Now: node stepfree/eval/run-eval.mjs measure --stage ${stage}`);
}

async function measureStage() {
  const stage = flag('stage');
  if (!stage) throw new Error('--stage required');
  const out = { stage, measuredAt: new Date().toISOString(), fixtures: [] };

  for (const dir of fixtureDirs()) {
    const name = basename(dir);
    const runDir = join(runsRoot, stage, name);
    const siteAfter = join(runDir, 'site');
    if (!existsSync(siteAfter)) {
      console.warn(`⚠ no run output for ${name} — skipping`);
      continue;
    }
    const ledger = existsSync(join(runDir, 'run.json')) ? JSON.parse(readFileSync(join(runDir, 'run.json'), 'utf8')) : null;

    const fx = { fixture: name, pages: [], totals: {} };
    for (const beforePath of listFixturePages(dir)) {
      const rel = relative(dir, beforePath);
      const afterPath = join(siteAfter, rel);
      const scanB = await scanPage(beforePath);
      const scanA = await scanPage(afterPath);
      const snapB = await snapshotPage(beforePath);
      const snapA = await snapshotPage(afterPath);
      const d = diffScans(scanB, scanA);
      const integ = checkIntegrity(snapB, snapA);
      const tier = (list, t) => list.filter((i) => i.tier === t).length;
      fx.pages.push({
        page: rel,
        wcagBefore: scanB.counts.wcag.nodes, wcagAfter: scanA.counts.wcag.nodes,
        bpBefore: scanB.counts.bestPractice.nodes, bpAfter: scanA.counts.bestPractice.nodes,
        fixed: tier(d.fixed, 'wcag'), introduced: tier(d.introduced, 'wcag'), remaining: tier(d.remaining, 'wcag'),
        fixedBp: tier(d.fixed, 'best-practice'), introducedBp: tier(d.introduced, 'best-practice'), remainingBp: tier(d.remaining, 'best-practice'),
        introducedRules: [...new Set(d.introduced.map((i) => i.rule))],
        remainingRules: [...new Set(d.remaining.map((i) => i.rule))],
        integrityOk: integ.ok,
        integrityFailures: integ.hardFailures,
        pixelDiffRatio: integ.metrics.pixelDiffRatio,
        missingWords: integ.metrics.missingWords,
        removedImages: integ.metrics.removedImages,
      });
    }
    const t = fx.totals;
    for (const k of ['wcagBefore', 'wcagAfter', 'bpBefore', 'bpAfter', 'fixed', 'introduced', 'remaining', 'fixedBp', 'introducedBp', 'remainingBp']) {
      t[k] = fx.pages.reduce((s, p) => s + p[k], 0);
    }
    t.pages = fx.pages.length;
    t.pagesDamaged = fx.pages.filter((p) => !p.integrityOk).length;
    t.pagesFullyClean = fx.pages.filter((p) => p.wcagAfter === 0).length;
    t.pagesShippable = fx.pages.filter((p) => p.wcagAfter === 0 && p.integrityOk && p.introduced === 0).length;
    t.costUsd = ledger?.totals?.costUsd ?? null;
    t.wallMs = ledger ? new Date(ledger.finishedAt) - new Date(ledger.startedAt) : null;
    t.rollbacks = ledger?.totals?.rollbacks ?? 0;
    t.retries = ledger?.totals?.retries ?? 0;
    t.reviewItems = ledger?.reviewQueue?.length ?? 0;
    out.fixtures.push(fx);
    console.log(
      `${name}: ${t.wcagBefore}→${t.wcagAfter} wcag | fixed ${t.fixed}, introduced ${t.introduced} | damaged pages ${t.pagesDamaged} | $${t.costUsd?.toFixed(3) ?? '—'}`
    );
  }

  const agg = { fixtures: out.fixtures.length };
  for (const k of ['pages', 'wcagBefore', 'wcagAfter', 'bpBefore', 'bpAfter', 'fixed', 'introduced', 'remaining', 'fixedBp', 'introducedBp', 'remainingBp', 'pagesDamaged', 'pagesFullyClean', 'pagesShippable', 'rollbacks', 'retries', 'reviewItems']) {
    agg[k] = out.fixtures.reduce((s, f) => s + (f.totals[k] ?? 0), 0);
  }
  agg.costUsd = out.fixtures.reduce((s, f) => s + (f.totals.costUsd ?? 0), 0);
  agg.wallMs = out.fixtures.reduce((s, f) => s + (f.totals.wallMs ?? 0), 0);
  agg.remediationRate = agg.wcagBefore ? +(agg.fixed / agg.wcagBefore).toFixed(4) : null;
  out.aggregate = agg;

  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(join(RESULTS_DIR, `${stage}.json`), JSON.stringify(out, null, 2));
  console.log(
    `\n${stage}: remediation ${(agg.remediationRate * 100).toFixed(1)}% (${agg.fixed}/${agg.wcagBefore}), introduced ${agg.introduced}, damaged pages ${agg.pagesDamaged}/${agg.pages}, shippable ${agg.pagesShippable}/${agg.pages}, cost $${agg.costUsd.toFixed(2)}`
  );
}

function tables() {
  const stages = STAGE_ORDER.filter((s) => existsSync(join(RESULTS_DIR, `${s}.json`)));
  const data = stages.map((s) => JSON.parse(readFileSync(join(RESULTS_DIR, `${s}.json`), 'utf8')));
  const lines = [];
  lines.push('# Evaluation results (auto-generated)\n');
  lines.push(`_Regenerate with \`node stepfree/eval/run-eval.mjs tables\`. Measured: ${new Date().toISOString()}_\n`);
  lines.push('## Stage comparison — all fixtures\n');
  lines.push('| Stage | WCAG instances (before → after) | Remediated | Introduced | Best-practice (before → after) | Pages damaged | Pages shippable | Rollbacks | Review items | API cost | Wall time |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const d of data) {
    const a = d.aggregate;
    lines.push(
      `| **${d.stage}** | ${a.wcagBefore} → ${a.wcagAfter} | ${(a.remediationRate * 100).toFixed(1)}% (${a.fixed}) | ${a.introduced} | ${a.bpBefore} → ${a.bpAfter} | ${a.pagesDamaged}/${a.pages} | ${a.pagesShippable}/${a.pages} | ${a.rollbacks} | ${a.reviewItems} | $${a.costUsd.toFixed(2)} | ${(a.wallMs / 60000).toFixed(0)} min |`
    );
  }
  lines.push('\n## Per-fixture detail\n');
  for (const d of data) {
    lines.push(`### ${d.stage}\n`);
    lines.push('| Fixture | WCAG before → after | Fixed | Introduced | Damaged pages | Shippable | Cost |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const f of d.fixtures) {
      const t = f.totals;
      lines.push(
        `| ${f.fixture} | ${t.wcagBefore} → ${t.wcagAfter} | ${t.fixed} | ${t.introduced} | ${t.pagesDamaged} | ${t.pagesShippable}/${t.pages} | $${t.costUsd?.toFixed(2) ?? '—'} |`
      );
    }
    lines.push('');
  }
  writeFileSync(join(RESULTS_DIR, 'summary.md'), lines.join('\n'));
  console.log(`written ${join(RESULTS_DIR, 'summary.md')} (${stages.length} stage(s))`);
}

try {
  if (cmd === 'verify-fixtures') await verifyFixtures();
  else if (cmd === 'run') await runStage();
  else if (cmd === 'measure') await measureStage();
  else if (cmd === 'tables') tables();
  else {
    console.log('subcommands: verify-fixtures | run --stage <s> | measure --stage <s> | tables');
    process.exit(1);
  }
} finally {
  await closeBrowser();
}
