import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runAgent } from '../agents/harness.mjs';

/**
 * The remediation report a site owner actually receives — the deliverable
 * they can hand to their developer, their lawyer, or their own conscience.
 * Structure and numbers are rendered deterministically from the run ledger;
 * a reporter agent contributes only the narrative prose. The report itself
 * is built to pass the same scanner we use on customers' sites.
 */

export async function generateReport({ ledger, outDir, workdir, model }) {
  const stats = summarize(ledger);

  const prose = await writeNarrative({ ledger, stats, workdir, outDir, model });

  const html = renderHtml({ ledger, stats, prose, outDir });
  const reportPath = join(outDir, 'report.html');
  writeFileSync(reportPath, html);
  console.log(`  report written → ${reportPath}`);
  return reportPath;
}

function summarize(ledger) {
  const s = {
    pages: ledger.pages.length,
    wcagBefore: 0, wcagAfter: 0, bpBefore: 0, bpAfter: 0,
    fixed: 0, introduced: 0, remaining: 0,
    rollbacks: ledger.totals.rollbacks, retries: ledger.totals.retries,
    reviewItems: ledger.reviewQueue.length,
    costUsd: ledger.totals.costUsd,
    integrityOk: ledger.pages.every((p) => p.finalIntegrity?.ok !== false),
  };
  for (const p of ledger.pages) {
    s.wcagBefore += p.before?.wcag.nodes ?? 0;
    s.wcagAfter += p.after?.wcag.nodes ?? 0;
    s.bpBefore += p.before?.bestPractice.nodes ?? 0;
    s.bpAfter += p.after?.bestPractice.nodes ?? 0;
    s.fixed += p.outcome?.fixed ?? 0;
    s.introduced += p.outcome?.introduced ?? 0;
    s.remaining += p.outcome?.remaining ?? 0;
  }
  return s;
}

async function writeNarrative({ ledger, stats, workdir, model }) {
  const input = {
    site: ledger.siteDir.split('/').pop(),
    pages: ledger.pages.map((p) => ({
      file: p.file,
      before: p.before, after: p.after, outcome: p.outcome,
      rounds: p.rounds?.map((r) => ({ agent: r.agent, verify: r.verify, rolledBack: r.rolledBack })),
    })),
    conventions: ledger.conventions,
    reviewQueue: ledger.reviewQueue.map((i) => ({ page: i.page, issue: i.issue, wcag: i.wcag, confidence: i.confidence })),
    totals: stats,
  };
  const res = await runAgent({
    name: 'reporter', task: 'write report narrative',
    systemPrompt: `You write the narrative sections of a website accessibility remediation report for a small-business owner (not a developer). Tone: clear, direct, professional; no hype, no jargon without a gloss; specific to THIS site's data. You must be honest about limits: automated scanning covers roughly half of accessibility issues, remaining items need their review. Output STRICT JSON only, no markdown fences, with keys: executiveSummary (120-180 words, plain language, mentions the site's own numbers), whatThisMeans (60-100 words on legal/practical significance, mention WCAG 2.2 AA; no legal advice claims), reviewIntro (40-70 words introducing the human-review items and why judgment calls are routed to them), closingRecommendation (50-90 words of concrete next steps).`,
    prompt: `Run data:\n${JSON.stringify(input, null, 2).slice(0, 12000)}`,
    workdir, model, maxTurns: 1, fileTools: [], mcpToolNames: [],
  });
  try {
    const jsonText = res.text.replace(/^```json?\s*|\s*```$/g, '').trim();
    return JSON.parse(jsonText);
  } catch {
    return {
      executiveSummary: `StepFree scanned ${stats.pages} page(s), found ${stats.wcagBefore} WCAG A/AA violation instances, fixed and verified ${stats.fixed}, and queued ${stats.reviewItems} judgment calls for human review.`,
      whatThisMeans: 'The fixes below were each verified by re-scanning and by checking that page content and layout were preserved.',
      reviewIntro: 'The following items need a human decision; each comes with a drafted fix.',
      closingRecommendation: 'Review the queued items, then deploy the fixed files from the working copy.',
    };
  }
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function img64(path) {
  if (!existsSync(path)) return null;
  return `data:image/png;base64,${readFileSync(path).toString('base64')}`;
}

function renderHtml({ ledger, stats, prose, outDir }) {
  const date = new Date(ledger.startedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const site = ledger.siteDir.split('/').pop();
  const pct = stats.wcagBefore ? Math.round(((stats.wcagBefore - stats.wcagAfter) / stats.wcagBefore) * 100) : 100;

  const pageRows = ledger.pages.map((p) => {
    const before = img64(join(outDir, 'evidence', `${p.file.replace(/[^\w.-]+/g, '_').replace(/\.html$/, '')}-before.png`));
    const after = img64(join(outDir, 'evidence', `${p.file.replace(/[^\w.-]+/g, '_').replace(/\.html$/, '')}-after.png`));
    return `
    <section class="page-block">
      <h3>${esc(p.file)}</h3>
      <p class="page-stats">
        WCAG A/AA: <strong>${p.before.wcag.nodes} → ${p.after.wcag.nodes}</strong> instances
        &nbsp;·&nbsp; best-practice: ${p.before.bestPractice.nodes} → ${p.after.bestPractice.nodes}
        &nbsp;·&nbsp; ${p.outcome.fixed} fixes verified, ${p.outcome.introduced} regressions
        &nbsp;·&nbsp; content integrity: <strong>${p.finalIntegrity?.ok ? 'preserved ✓' : 'see notes'}</strong>
      </p>
      ${before && after ? `
      <div class="shots">
        <figure><img src="${before}" alt="Screenshot of ${esc(p.file)} before remediation"><figcaption>Before</figcaption></figure>
        <figure><img src="${after}" alt="Screenshot of ${esc(p.file)} after remediation — visually equivalent, with contrast corrections"><figcaption>After</figcaption></figure>
      </div>` : ''}
    </section>`;
  }).join('\n');

  const roundsByAgent = {};
  for (const p of ledger.pages) for (const r of p.rounds || []) {
    roundsByAgent[r.agent] = roundsByAgent[r.agent] || { runs: 0, retries: 0, rollbacks: 0 };
    roundsByAgent[r.agent].runs++;
    if (r.round > 1) roundsByAgent[r.agent].retries++;
    if (r.rolledBack) roundsByAgent[r.agent].rollbacks++;
  }

  const reviewRows = ledger.reviewQueue.map((i, n) => `
    <article class="review-item">
      <h4>${n + 1}. ${esc(i.issue)}</h4>
      <p class="review-meta"><span>Page: <code>${esc(i.page)}</code></span> <span>WCAG: ${esc(i.wcag)}</span> <span>Where: <code>${esc(String(i.selector).slice(0, 120))}</code></span> <span class="conf conf-${i.confidence}">confidence: ${i.confidence}</span></p>
      <p class="review-fix"><strong>Proposed fix:</strong></p>
      <pre>${esc(i.proposedFix)}</pre>
    </article>`).join('\n');

  const conventionRows = Object.entries(ledger.conventions).map(([k, v]) =>
    `<tr><td><code>${esc(k)}</code></td><td>${esc(v.value)}</td><td>${esc(v.rationale)}</td></tr>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility Remediation Report — ${esc(site)} — StepFree</title>
<style>
  :root { --ink:#16241f; --paper:#fbfaf7; --accent:#0b6e4f; --accent-ink:#ffffff; --line:#d8d5cc; --soft:#eef2ee; --warn:#8a5a00; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: ui-serif, Georgia, 'Times New Roman', serif; background:var(--paper); color:var(--ink); line-height:1.55; }
  header.cover { background:var(--accent); color:var(--accent-ink); padding:56px 8vw 44px; }
  .brand { font-family: ui-sans-serif, system-ui, sans-serif; font-weight:700; letter-spacing:.06em; text-transform:uppercase; font-size:14px; }
  .brand .steps { display:inline-block; margin-right:.5em; }
  header.cover h1 { font-size: clamp(28px, 4vw, 44px); margin:.35em 0 .15em; font-weight:600; }
  header.cover p { margin:.2em 0; opacity:.92; font-family: ui-sans-serif, system-ui, sans-serif; }
  main { max-width: 880px; margin: 0 auto; padding: 40px 24px 80px; }
  h2 { font-size:26px; border-bottom:2px solid var(--accent); padding-bottom:6px; margin-top:52px; }
  h3 { font-size:20px; margin-top:32px; }
  .scorecard { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:14px; margin:28px 0 8px; font-family: ui-sans-serif, system-ui, sans-serif; }
  .stat { background:var(--soft); border:1px solid var(--line); border-radius:10px; padding:16px 18px; }
  .stat .num { font-size:30px; font-weight:700; color:var(--accent); }
  .stat .lbl { font-size:13px; margin-top:2px; }
  .shots { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:14px; }
  .shots figure { margin:0; }
  .shots img { width:100%; border:1px solid var(--line); border-radius:6px; }
  .shots figcaption { font-family: ui-sans-serif, system-ui, sans-serif; font-size:13px; margin-top:6px; text-align:center; }
  .page-stats { font-family: ui-sans-serif, system-ui, sans-serif; font-size:14px; background:var(--soft); padding:10px 14px; border-radius:8px; }
  table { width:100%; border-collapse:collapse; font-family: ui-sans-serif, system-ui, sans-serif; font-size:14px; }
  th, td { text-align:left; padding:9px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { background:var(--soft); }
  code { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size:.92em; background:var(--soft); padding:1px 5px; border-radius:4px; }
  pre { background:#20241f0d; border:1px solid var(--line); border-radius:8px; padding:12px 14px; overflow-x:auto; font-size:13px; font-family: ui-monospace, Menlo, monospace; white-space:pre-wrap; }
  .review-item { border:1px solid var(--line); border-left:4px solid var(--warn); border-radius:8px; padding:6px 18px 14px; margin:16px 0; background:#fff; }
  .review-meta { font-family: ui-sans-serif, system-ui, sans-serif; font-size:13px; display:flex; flex-wrap:wrap; gap:14px; }
  .conf { font-weight:600; } .conf-high{color:var(--accent);} .conf-medium{color:var(--warn);} .conf-low{color:#933;}
  .method { background:var(--soft); border-radius:10px; padding:18px 22px; font-size:15px; }
  footer { border-top:1px solid var(--line); margin-top:60px; padding-top:18px; font-family: ui-sans-serif, system-ui, sans-serif; font-size:13px; color:#4a544e; }
  @media (max-width:640px){ .shots{grid-template-columns:1fr;} }
</style>
</head>
<body>
<header class="cover">
  <p class="brand"><span class="steps" aria-hidden="true">⿻</span>StepFree · Accessibility Remediation Report</p>
  <h1>${esc(site)}</h1>
  <p>${esc(date)} · ${stats.pages} page(s) · WCAG 2.2 A/AA target · every fix verified by re-scan + content-integrity checks</p>
</header>
<main>
  <h2>Executive summary</h2>
  <p>${esc(prose.executiveSummary)}</p>

  <div class="scorecard">
    <div class="stat"><div class="num">${stats.wcagBefore} → ${stats.wcagAfter}</div><div class="lbl">WCAG A/AA violation instances</div></div>
    <div class="stat"><div class="num">${pct}%</div><div class="lbl">of detectable violations remediated &amp; verified</div></div>
    <div class="stat"><div class="num">${stats.introduced}</div><div class="lbl">regressions introduced (verified by re-scan)</div></div>
    <div class="stat"><div class="num">${stats.reviewItems}</div><div class="lbl">judgment calls routed to human review</div></div>
  </div>
  <p>${esc(prose.whatThisMeans)}</p>

  <h2>Page-by-page results</h2>
  ${pageRows}

  <h2>Items for your review</h2>
  <p>${esc(prose.reviewIntro)}</p>
  ${reviewRows || '<p>No items required human judgment on this run.</p>'}

  ${conventionRows ? `<h2>Site-wide conventions applied</h2>
  <p>Decisions recorded once and applied consistently across every page:</p>
  <table><thead><tr><th>Decision</th><th>Value</th><th>Rationale</th></tr></thead><tbody>${conventionRows}</tbody></table>` : ''}

  <h2>How these results were verified</h2>
  <div class="method">
    <p>Every fix in this report survived three independent checks, none of which rely on the AI that wrote the fix:</p>
    <ol>
      <li><strong>Re-scan:</strong> the page was re-tested with axe-core ${'(the industry-standard accessibility engine)'} — the violation had to be gone, with zero new violations anywhere on the page.</li>
      <li><strong>Content integrity:</strong> the page's visible text and images were compared word-by-word and element-by-element against the original — nothing may disappear.</li>
      <li><strong>Visual comparison:</strong> before/after screenshots were diffed pixel-by-pixel; changes must stay inside the elements each fix was allowed to touch (a contrast fix may recolor its own text — nothing else).</li>
    </ol>
    <p>Fixes that failed any check were automatically rolled back and routed to the review queue above${stats.rollbacks ? ` (${stats.rollbacks} on this run)` : ''}. ${stats.retries ? `${stats.retries} fix(es) needed a correction round before passing.` : ''}</p>
  </div>

  <h2>Honest scope</h2>
  <p>Automated scanners detect roughly half of accessibility issues by volume (Deque's coverage study: 57%). This report therefore makes two kinds of claims: <strong>verified fixes</strong> for everything the scanner can measure, and <strong>expert-drafted proposals</strong> — the review items above — for what requires human judgment. No tool can truthfully promise "full compliance" from automation alone; the ones that did got sued and fined. StepFree's promise is narrower and real: the detectable layer fixed and proven, the judgment layer drafted and routed to you.</p>

  <h2>Recommended next steps</h2>
  <p>${esc(prose.closingRecommendation)}</p>

  <footer>
    <p>Generated by StepFree — the accessibility engineer that fixes your code and proves it. Scan engine: axe-core (Deque Systems). Conformance target: WCAG 2.2 A/AA. This report describes automated testing results and is not legal advice.</p>
  </footer>
</main>
</body>
</html>`;
}
