#!/usr/bin/env node
/** Render an HTML file to PDF via Chromium. Usage: node stepfree/eval/render-pdf.mjs in.html out.pdf [landscape] */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [input, output, orientation] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node stepfree/eval/render-pdf.mjs <in.html> <out.pdf> [landscape]');
  process.exit(1);
}
const exec = process.env.STEPFREE_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath: exec });
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(250);
await page.pdf({
  path: resolve(output),
  format: 'A4',
  landscape: orientation === 'landscape',
  printBackground: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
});
await browser.close();
console.log(`rendered ${output}`);
