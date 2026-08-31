#!/usr/bin/env node
/**
 * BASELINE: one direct prompt with basic instructions.
 *
 * This represents the reasonable thing a busy developer does today: paste the
 * page into an LLM and ask it to "make it accessible". Same model as StepFree,
 * same pages, no scanner, no tools, no verification — the comparison isolates
 * the value of the agentic workflow, not the model.
 *
 * Usage: node stepfree/baseline/run.mjs <site-dir> --out <dir> [--model id]
 */
import { resolve, join, basename } from 'node:path';
import { runBaseline } from './lib.mjs';
import { closeBrowser } from '../src/lib/browser.mjs';

const target = process.argv[2];
const flag = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : dflt;
};
if (!target) {
  console.error('usage: node stepfree/baseline/run.mjs <site-dir> --out <dir> [--model id]');
  process.exit(1);
}

const siteDir = resolve(target);
const outDir = resolve(flag('out', join('runs', 'baseline', basename(siteDir))));
await runBaseline({ siteDir, outDir, model: flag('model', undefined) || undefined });
await closeBrowser();
