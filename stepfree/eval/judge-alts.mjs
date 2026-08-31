#!/usr/bin/env node
/**
 * Alt-text quality judging — the dimension axe cannot measure.
 *
 * axe verifies an alt EXISTS; it cannot verify it is TRUE. This script finds
 * every image whose alt text was written by the system under test (differs
 * from the original fixture), renders the actual image, and has a vision
 * judge (Claude Opus by default — a different tier than the fixer, to reduce
 * same-model bias) score each alt against what the image really shows:
 *
 *   2 = accurate and useful in context (or correctly marked decorative)
 *   1 = technically present but generic/vague ("image", "photo", "a dog")
 *   0 = wrong, hallucinated, or harmful (describes things not in the image;
 *       or verbose noise on a purely decorative element)
 *
 * Usage: node stepfree/eval/judge-alts.mjs --stage baseline [--model claude-opus-5]
 * Writes stepfree/eval/results/alts-<stage>.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, join, basename, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { withPage, toUrl, closeBrowser } from '../src/lib/browser.mjs';
import { runAgent } from '../src/agents/harness.mjs';
import { listFixtures, listFixturePages } from './fixtures.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RESULTS_DIR = join(ROOT, 'stepfree', 'eval', 'results');
const flag = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : dflt;
};
const stage = flag('stage');
const model = flag('model', 'claude-opus-5');
const runsRoot = resolve(flag('out', join(ROOT, 'runs')));
const fixturesRoot = resolve(flag('fixtures', join(ROOT, 'fixtures')));
if (!stage) {
  console.error('usage: node stepfree/eval/judge-alts.mjs --stage <s> [--model claude-opus-5]');
  process.exit(1);
}

const IMG_RE = /<img\b[^>]*>/gi;
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3]) : undefined;
};

async function renderToPng(absPath, outPath) {
  await withPage(
    async (page) => {
      await page.setContent(
        `<html><body style="margin:0;display:grid;place-items:center;background:#fff">
         <img src="${toUrl(absPath)}" style="max-width:640px;max-height:640px"/></body></html>`
      );
      await page.waitForTimeout(120);
      const el = await page.$('img');
      const buf = await el.screenshot();
      writeFileSync(outPath, buf);
    },
    { viewport: { width: 700, height: 700 } }
  );
}

const results = { stage, model, judgedAt: new Date().toISOString(), pages: [] };

for (const fixtureDir of listFixtures(fixturesRoot)) {
  const name = basename(fixtureDir);
  const siteAfter = join(runsRoot, stage, name, 'site');
  if (!existsSync(siteAfter)) continue;

  for (const origPage of listFixturePages(fixtureDir)) {
    const rel = relative(fixtureDir, origPage);
    const fixedPage = join(siteAfter, rel);
    if (!existsSync(fixedPage)) continue;

    const origImgs = new Map();
    for (const tag of readFileSync(origPage, 'utf8').match(IMG_RE) || []) {
      const src = attr(tag, 'src');
      if (src) origImgs.set(src, attr(tag, 'alt'));
    }
    const items = [];
    for (const tag of readFileSync(fixedPage, 'utf8').match(IMG_RE) || []) {
      const src = attr(tag, 'src');
      if (!src) continue;
      const alt = attr(tag, 'alt');
      const origAlt = origImgs.get(src);
      // Judge only images whose alt the system WROTE (was absent/changed).
      if (alt === undefined || alt === origAlt) continue;
      items.push({ src, alt });
    }
    if (!items.length) continue;

    // Prepare a judge workspace with rendered images.
    const ws = join(tmpdir(), `stepfree-judge-${stage}-${name}-${rel.replace(/\W+/g, '_')}`);
    rmSync(ws, { recursive: true, force: true });
    mkdirSync(ws, { recursive: true });
    const manifest = [];
    for (let i = 0; i < items.length; i++) {
      const absImg = join(siteAfter, dirname(rel), items[i].src);
      if (!existsSync(absImg)) continue;
      const png = `img${i + 1}.png`;
      try {
        await renderToPng(absImg, join(ws, png));
        manifest.push({ file: png, src: items[i].src, alt: items[i].alt });
      } catch { /* unrenderable image — skip */ }
    }
    if (!manifest.length) continue;

    const pageTitle = (readFileSync(fixedPage, 'utf8').match(/<title>([^<]*)<\/title>/i) || [])[1] || rel;
    const prompt = `You are judging alt text quality for images on the page "${pageTitle}" (${name}).

For EACH numbered item: use the Read tool to LOOK at the image file, then score the alt text that was written for it.

Scoring rubric:
- 2 = accurate and useful: describes what the image actually shows, appropriately concise, right for its context. An empty alt ("") scores 2 ONLY if the image is genuinely decorative (abstract divider, background flourish). For an image inside a link, describing the destination is correct.
- 1 = present but weak: generic ("image", "logo", "a dog" for a distinctive illustration), redundant ("image of..."), or missing the image's evident key content.
- 0 = wrong or harmful: describes content NOT in the image (hallucination), contradicts it, or buries a decorative element in verbose description.

Items:
${manifest.map((m, i) => `${i + 1}. file: ${m.file} — alt text written: ${m.alt === '' ? '(empty alt="")' : JSON.stringify(m.alt)}`).join('\n')}

After viewing ALL images, output ONLY a JSON array (no fences): [{"item":1,"score":2,"reason":"..."}, ...]`;

    const res = await runAgent({
      name: `alt-judge:${name}/${rel}`, task: 'judge alt quality',
      systemPrompt: 'You are a meticulous accessibility QA expert. You always look at images before judging descriptions of them. Output exactly the JSON requested.',
      prompt, workdir: ws, model, maxTurns: 20,
      fileTools: ['Read'], mcpToolNames: [],
    });
    let scores = [];
    try {
      scores = JSON.parse((res.text.match(/\[[\s\S]*\]/) || ['[]'])[0]);
    } catch { /* judge output unparseable */ }
    const page = {
      fixture: name, page: rel,
      items: manifest.map((m, i) => ({
        src: m.src, alt: m.alt,
        score: scores.find((s) => s.item === i + 1)?.score ?? null,
        reason: scores.find((s) => s.item === i + 1)?.reason ?? 'unjudged',
      })),
      costUsd: res.costUsd,
    };
    results.pages.push(page);
    console.log(`${name}/${rel}: ${page.items.map((it) => it.score ?? '?').join(' ')} ($${res.costUsd.toFixed(3)})`);
    rmSync(ws, { recursive: true, force: true });
  }
}

const all = results.pages.flatMap((p) => p.items).filter((i) => i.score !== null);
results.aggregate = {
  judged: all.length,
  mean: all.length ? +(all.reduce((s, i) => s + i.score, 0) / all.length).toFixed(3) : null,
  dist: { 0: all.filter((i) => i.score === 0).length, 1: all.filter((i) => i.score === 1).length, 2: all.filter((i) => i.score === 2).length },
  costUsd: +results.pages.reduce((s, p) => s + p.costUsd, 0).toFixed(3),
};
mkdirSync(RESULTS_DIR, { recursive: true });
writeFileSync(join(RESULTS_DIR, `alts-${stage}.json`), JSON.stringify(results, null, 2));
console.log(`\n${stage}: mean alt quality ${results.aggregate.mean} over ${results.aggregate.judged} agent-written alts (0:${results.aggregate.dist[0]} 1:${results.aggregate.dist[1]} 2:${results.aggregate.dist[2]})`);
await closeBrowser();
