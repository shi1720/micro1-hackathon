import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { runAgent, DEFAULT_MODEL } from '../src/agents/harness.mjs';
import { listFixturePages } from '../eval/fixtures.mjs';

/** One-shot baseline: paste the page into the model, ask for fixed HTML. */
export async function runBaseline({ siteDir, outDir, model = DEFAULT_MODEL }) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const workdir = join(outDir, 'site');
  // meta.json documents the seeded ground truth — the model must never see it.
  cpSync(siteDir, workdir, { recursive: true, filter: (src) => !src.endsWith('meta.json') });
  const trajDir = join(outDir, 'trajectories');
  mkdirSync(trajDir, { recursive: true });

  const ledger = {
    product: 'baseline-one-shot',
    stage: 'baseline',
    stageLabel: 'One direct prompt with basic instructions (no tools, no verification)',
    model, siteDir, startedAt: new Date().toISOString(),
    pages: [], totals: { costUsd: 0, agentRuns: 0, rollbacks: 0, retries: 0 },
    conventions: {}, reviewQueue: [],
  };

  console.log(`\nBaseline one-shot fixing ${basename(siteDir)} (model ${model})`);
  for (const pagePath of listFixturePages(workdir)) {
    const pageRel = relative(workdir, pagePath);
    const html = readFileSync(pagePath, 'utf8');
    const res = await runAgent({
      name: `baseline:${pageRel}`, task: 'one-shot fix', page: pageRel,
      systemPrompt: 'You are an expert web accessibility engineer.',
      prompt: `Fix all WCAG 2.2 A and AA accessibility violations in the following HTML page. Keep the visual design and content intact. Return the complete fixed HTML document and nothing else — no explanations, no markdown fences.\n\n${html}`,
      workdir, model, maxTurns: 4, fileTools: [], mcpToolNames: [],
      trajectoryPath: join(trajDir, `${pageRel.replace(/[^\w.-]+/g, '_').replace(/\.html$/, '')}-baseline.jsonl`),
    });
    ledger.totals.costUsd += res.costUsd;
    ledger.totals.agentRuns += 1;

    let out = res.text.trim();
    const fence = out.match(/```(?:html)?\s*([\s\S]*?)```/);
    if (fence) out = fence[1].trim();
    const looksLikeHtml = /<!doctype html/i.test(out) || /<html[\s>]/i.test(out);
    const complete = /<\/html>\s*$/i.test(out);
    const applied = looksLikeHtml && complete;
    if (applied) writeFileSync(pagePath, out);

    ledger.pages.push({
      file: pageRel,
      applied,
      note: applied ? 'model output written over page' : 'model output was not a complete HTML document — original kept',
      rounds: [{ round: 1, agent: 'baseline', costUsd: res.costUsd, turns: res.turns, durationMs: res.durationMs }],
    });
    console.log(`  ${pageRel}: ${applied ? 'rewritten' : 'FAILED to produce complete HTML'} ($${res.costUsd.toFixed(3)}, ${(res.durationMs / 1000).toFixed(0)}s)`);
  }

  ledger.finishedAt = new Date().toISOString();
  writeFileSync(join(outDir, 'run.json'), JSON.stringify(ledger, null, 2));
  return ledger;
}
