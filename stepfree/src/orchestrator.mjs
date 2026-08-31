import { cpSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { scanPage, diffScans } from './lib/scan.mjs';
import { snapshotPage, measureSelectors } from './lib/snapshot.mjs';
import { checkIntegrity } from './lib/integrity.mjs';
import { renderTrajectoryMarkdown } from './lib/trajectory.mjs';
import { makeStepfreeTools, makeMcpServer } from './agents/tools.mjs';
import { runAgent, DEFAULT_MODEL } from './agents/harness.mjs';
import {
  routeViolations, buildSpecialistPrompts, buildGenericPrompts, buildReviewPrompts,
} from './agents/specialists.mjs';
import { listFixturePages } from '../eval/fixtures.mjs';
import { generateReport } from './report/report.mjs';

/**
 * Stage configurations — each maps to an entry in the improvement changelog.
 * `node stepfree/src/cli.mjs fix <site> --stage v1` reproduces any iteration.
 */
export const STAGES = {
  v1: { label: 'Naive agent (single generalist, no verification)', specialists: false, verify: false, guardrails: false, memory: false, review: false, report: false },
  v2: { label: '+ deterministic verification loop', specialists: false, verify: true, guardrails: false, memory: false, review: false, report: false },
  v3: { label: '+ specialist fixers, knowledge & tools', specialists: true, verify: true, guardrails: false, memory: false, review: false, report: false },
  v4: { label: '+ integrity guardrails & rollback', specialists: true, verify: true, guardrails: true, memory: false, review: false, report: false },
  final: { label: 'StepFree (memory, human review lane, report)', specialists: true, verify: true, guardrails: true, memory: true, review: true, report: true },
};

const MAX_ROUNDS = 2; // initial attempt + one feedback retry per fixer

function log(msg) {
  console.log(`  ${msg}`);
}

export async function fixSite({ siteDir, outDir, stage = 'final', model = DEFAULT_MODEL }) {
  const cfg = STAGES[stage];
  if (!cfg) throw new Error(`Unknown stage: ${stage}. Available: ${Object.keys(STAGES).join(', ')}`);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const workdir = join(outDir, 'site');
  // meta.json documents the seeded ground truth — agents must never see it.
  cpSync(siteDir, workdir, { recursive: true, filter: (src) => !src.endsWith('meta.json') });
  const evidenceDir = join(outDir, 'evidence');
  const trajDir = join(outDir, 'trajectories');
  mkdirSync(evidenceDir, { recursive: true });
  mkdirSync(trajDir, { recursive: true });

  const ledger = {
    product: 'StepFree',
    stage,
    stageLabel: cfg.label,
    model,
    siteDir,
    startedAt: new Date().toISOString(),
    pages: [],
    conventions: {},
    reviewQueue: [],
    totals: { costUsd: 0, agentRuns: 0, rollbacks: 0, retries: 0 },
  };

  const tools = makeStepfreeTools({ workdir, ledger });
  const mcpServer = makeMcpServer(
    Object.fromEntries(Object.entries(tools).filter(([k]) => cfg.memory || (k !== 'record_convention')))
  );

  const pages = listFixturePages(workdir);
  console.log(`\nStepFree [stage=${stage}] fixing ${basename(siteDir)} — ${pages.length} page(s), model ${model}`);

  for (const pagePath of pages) {
    const pageRel = relative(workdir, pagePath);
    const pageEntry = { file: pageRel, rounds: [], flagged: [] };
    ledger.pages.push(pageEntry);

    console.log(`\n▸ ${pageRel}`);
    const scan0 = await scanPage(pagePath);
    const snap0 = await snapshotPage(pagePath);
    writeFileSync(join(evidenceDir, `${safe(pageRel)}-before.png`), snap0.screenshotFull);
    pageEntry.before = scan0.counts;
    log(`initial scan: ${scan0.counts.wcag.nodes} WCAG + ${scan0.counts.bestPractice.nodes} best-practice instances`);

    if (scan0.violations.length === 0) {
      log('nothing to fix');
    } else if (!cfg.specialists) {
      await runGenericFixer({ cfg, ledger, pageEntry, pagePath, pageRel, workdir, scan0, snap0, mcpServer, tools, trajDir, model });
    } else {
      await runSpecialistPipeline({ cfg, ledger, pageEntry, pagePath, pageRel, workdir, scan0, snap0, mcpServer, trajDir, model });
    }

    // Beyond-scanner review lane (final stage): read-only expert pass.
    if (cfg.review) {
      const queueSummary = ledger.reviewQueue.map((i) => `- [${i.page}] ${i.issue}`).join('\n');
      const { systemPrompt, prompt } = buildReviewPrompts({ pageRel, conventions: ledger.conventions, queueSummary });
      const res = await runAgent({
        name: `review:${pageRel}`, task: 'beyond-scanner review', page: pageRel,
        systemPrompt, prompt, workdir, mcpServer,
        mcpToolNames: ['scan_file', 'view_image', 'view_page', 'flag_for_review'],
        fileTools: ['Read', 'Glob', 'Grep'], model,
        trajectoryPath: join(trajDir, `${safe(pageRel)}-review.jsonl`),
      });
      ledger.totals.costUsd += res.costUsd;
      ledger.totals.agentRuns += 1;
      log(`review pass: ${ledger.reviewQueue.filter((i) => i.page === pageRel || i.page.endsWith(pageRel)).length} finding(s) queued ($${res.costUsd.toFixed(3)})`);
    }

    const scanFinal = await scanPage(pagePath);
    const snapFinal = await snapshotPage(pagePath);
    writeFileSync(join(evidenceDir, `${safe(pageRel)}-after.png`), snapFinal.screenshotFull);
    pageEntry.after = scanFinal.counts;
    const d = diffScans(scan0, scanFinal);
    pageEntry.outcome = { fixed: d.fixed.length, introduced: d.introduced.length, remaining: d.remaining.length };
    const integrity = checkIntegrity(snap0, snapFinal);
    pageEntry.finalIntegrity = { ok: integrity.ok, hardFailures: integrity.hardFailures, metrics: integrity.metrics };
    log(`done: ${d.fixed.length} fixed, ${d.introduced.length} introduced, ${d.remaining.length} remaining | integrity ${integrity.ok ? 'OK' : 'FAILED'}`);
  }

  ledger.finishedAt = new Date().toISOString();
  writeFileSync(join(outDir, 'run.json'), JSON.stringify(ledger, null, 2));
  writeFileSync(join(outDir, 'conventions.json'), JSON.stringify(ledger.conventions, null, 2));
  writeFileSync(join(outDir, 'review-queue.json'), JSON.stringify(ledger.reviewQueue, null, 2));

  // Render human-readable trajectories.
  for (const f of (await import('node:fs')).readdirSync(trajDir).filter((f) => f.endsWith('.jsonl'))) {
    try {
      writeFileSync(join(trajDir, f.replace(/\.jsonl$/, '.md')), renderTrajectoryMarkdown(join(trajDir, f)));
    } catch (e) {
      console.warn(`trajectory render failed for ${f}: ${e.message}`);
    }
  }

  if (cfg.report) {
    await generateReport({ ledger, outDir, workdir, model, mcpServer });
  }

  console.log(`\n✔ run complete — cost $${ledger.totals.costUsd.toFixed(3)}, output in ${outDir}`);
  return ledger;
}

async function runGenericFixer(ctx) {
  const { cfg, ledger, pageEntry, pagePath, pageRel, workdir, scan0, mcpServer, trajDir, model } = ctx;
  let currentScan = scan0;
  for (let round = 1; round <= (cfg.verify ? MAX_ROUNDS : 1); round++) {
    const withTools = cfg.verify; // v2 gets scan_file to self-check; v1 flies blind
    const { systemPrompt, prompt: basePrompt } = buildGenericPrompts({ pageRel, violations: currentScan.violations, withTools });
    const prompt = round === 1 ? basePrompt : `${basePrompt}\n\nNOTE: this is retry ${round - 1} — a previous attempt left the violations above unresolved (or introduced them). Address every one.`;
    const res = await runAgent({
      name: `fixer:${pageRel}:r${round}`, task: 'generic fix', page: pageRel,
      systemPrompt, prompt, workdir, mcpServer: withTools ? mcpServer : undefined,
      mcpToolNames: withTools ? ['scan_file'] : [], model,
      trajectoryPath: join(trajDir, `${safe(pageRel)}-generic-r${round}.jsonl`),
    });
    ledger.totals.costUsd += res.costUsd;
    ledger.totals.agentRuns += 1;
    const roundEntry = { round, agent: 'generic', costUsd: res.costUsd, turns: res.turns, durationMs: res.durationMs };
    pageEntry.rounds.push(roundEntry);

    if (!cfg.verify) return;
    const rescan = await scanPage(pagePath);
    const d = diffScans(scan0, rescan);
    roundEntry.verify = { fixed: d.fixed.length, introduced: d.introduced.length, remaining: d.remaining.length };
    log(`round ${round}: ${d.fixed.length} fixed, ${d.introduced.length} introduced, ${d.remaining.length} remaining ($${res.costUsd.toFixed(3)})`);
    if (d.remaining.length === 0 && d.introduced.length === 0) return;
    if (round < MAX_ROUNDS) ledger.totals.retries += 1;
    currentScan = rescan;
  }
}

async function runSpecialistPipeline(ctx) {
  const { cfg, ledger, pageEntry, pagePath, pageRel, workdir, scan0, mcpServer, trajDir, model } = ctx;
  const buckets = routeViolations(scan0.violations);
  log(`routing: ${buckets.map((b) => `${b.specialist.key}(${b.violations.reduce((s, v) => s + v.nodes.length, 0)})`).join(', ')}`);

  for (const { specialist, violations } of buckets) {
    const assignedRules = new Set(violations.map((v) => v.id));
    const backup = readFileSync(pagePath, 'utf8');
    const preScan = await scanPage(pagePath);
    const preSnap = cfg.guardrails ? await snapshotPage(pagePath) : null;
    const targets = violations.flatMap((v) => v.nodes.map((n) => n.target));
    const allowedRegions = cfg.guardrails ? await measureSelectors(pagePath, targets) : [];

    // Re-derive this specialist's violations from the CURRENT page state
    // (earlier specialists may have incidentally resolved some).
    const liveViolations = preScan.violations.filter((v) => assignedRules.has(v.id));
    if (!liveViolations.length) {
      log(`${specialist.key}: already clean, skipping`);
      continue;
    }

    let accepted = false;
    let feedback = '';
    for (let round = 1; round <= MAX_ROUNDS; round++) {
      const { systemPrompt, prompt } = buildSpecialistPrompts({
        specialist, pageRel, violations: liveViolations,
        conventions: ledger.conventions, memoryEnabled: cfg.memory,
        reviewSummary: feedback,
      });
      const trajectoryPath = join(trajDir, `${safe(pageRel)}-${specialist.key}-r${round}.jsonl`);
      const res = await runAgent({
        name: `${specialist.key}:${pageRel}:r${round}`, task: specialist.title, page: pageRel,
        systemPrompt, prompt, workdir, mcpServer,
        mcpToolNames: specialist.tools.filter((t) => cfg.memory || t !== 'record_convention'),
        model, trajectoryPath,
      });
      ledger.totals.costUsd += res.costUsd;
      ledger.totals.agentRuns += 1;
      const roundEntry = { round, agent: specialist.key, costUsd: res.costUsd, turns: res.turns, durationMs: res.durationMs };
      pageEntry.rounds.push(roundEntry);

      // Fault injection (STEPFREE_CHAOS=1): simulate the destructive-fix
      // failure class documented in arXiv:2605.27716 (~30% of unguarded LLM
      // patches damage structure) by sabotaging the media round's output —
      // so the verification → retry → rollback machinery can be observed
      // firing end-to-end. Never active in normal runs.
      if (process.env.STEPFREE_CHAOS === '1' && specialist.key === 'media' && round === 1) {
        const html = readFileSync(pagePath, 'utf8');
        const img = html.match(/<img\b[^>]*>/i);
        const para = html.match(/<p\b[^>]*>[\s\S]{80,400}?<\/p>/i);
        if (img && para) {
          writeFileSync(pagePath, html.replace(img[0], '').replace(para[0], ''));
          roundEntry.chaosInjected = true;
          res.logger?.log('verification', { summary: 'CHAOS: destructive mutation injected after agent round (removed one <img> and one <p>) to exercise the gates' });
          log('💥 chaos: destructive mutation injected (removed an image and a paragraph)');
        }
      }

      if (!cfg.verify) { accepted = true; break; }

      // --- deterministic verification ---
      const rescan = await scanPage(pagePath);
      const d = diffScans(preScan, rescan);
      const assignedRemaining = d.remaining.filter((i) => assignedRules.has(i.rule));
      const verify = { fixed: d.fixed.length, introduced: d.introduced.length, assignedRemaining: assignedRemaining.length };
      roundEntry.verify = verify;

      let integrity = null;
      if (cfg.guardrails) {
        const postSnap = await snapshotPage(pagePath);
        integrity = checkIntegrity(preSnap, postSnap, {
          allowedRegions,
          strictVisual: process.env.STEPFREE_STRICT_VISUAL === '1',
        });
        roundEntry.integrity = { ok: integrity.ok, hardFailures: integrity.hardFailures, advisories: integrity.advisories, metrics: integrity.metrics };
      }

      const axeOk = verify.introduced === 0 && verify.assignedRemaining === 0;
      const integrityOk = !cfg.guardrails || integrity.ok;
      const summary = `${specialist.key} r${round}: fixed ${verify.fixed}, introduced ${verify.introduced}, assigned-remaining ${verify.assignedRemaining}` +
        (integrity ? `, integrity ${integrity.ok ? 'OK' : 'FAILED: ' + integrity.hardFailures.map((f) => f.kind).join(',')}` : '');
      res.logger?.log('verification', { summary });
      log(`${summary} ($${res.costUsd.toFixed(3)})`);

      if (axeOk && integrityOk) { accepted = true; break; }

      if (round < MAX_ROUNDS) {
        ledger.totals.retries += 1;
        feedback = `## Verification feedback from the previous attempt (deterministic re-scan)\n` +
          (verify.assignedRemaining ? `- Still failing: ${assignedRemaining.map((i) => `${i.rule} at ${i.target}`).join('; ')}\n` : '') +
          (verify.introduced ? `- Your changes INTRODUCED new violations: ${d.introduced.map((i) => `${i.rule} at ${i.target}`).join('; ')} — undo or repair these.\n` : '') +
          (integrity && !integrity.ok ? `- Integrity check failed: ${integrity.hardFailures.map((f) => `${f.kind}: ${f.detail}`).join('; ')} — restore the lost content.\n` : '');
        res.logger?.log('feedback', { summary: feedback });
      } else if (cfg.guardrails && (!integrityOk || verify.introduced > 0)) {
        // Roll back this specialist's changes entirely; queue for humans.
        writeFileSync(pagePath, backup);
        ledger.totals.rollbacks += 1;
        roundEntry.rolledBack = true;
        res.logger?.log('rollback', {
          reason: !integrityOk
            ? `integrity hard failure (${integrity.hardFailures.map((f) => f.kind).join(', ')})`
            : `${verify.introduced} new violation(s) introduced and not repaired within budget`,
        });
        for (const v of liveViolations) {
          ledger.reviewQueue.push({
            page: pageRel,
            selector: v.nodes.map((n) => n.target).join(', '),
            issue: `${v.id}: ${v.help} — automated fix was rolled back (${!integrityOk ? 'it damaged page content/layout' : 'it caused new violations'})`,
            wcag: v.wcagRefs.join(', ') || v.tier,
            proposedFix: 'See trajectory log for the attempted fix; needs human judgment.',
            confidence: 'low',
            flaggedAt: new Date().toISOString(),
            source: 'rollback',
          });
        }
        log(`⏪ ${specialist.key}: rolled back, ${liveViolations.length} rule(s) queued for human review`);
      }
    }
    if (accepted && pageEntry.flagged) {
      // nothing extra; conventions persist in ledger via tool
    }
  }
}

function safe(s) {
  return s.replace(/[^\w.-]+/g, '_').replace(/\.html$/, '');
}
