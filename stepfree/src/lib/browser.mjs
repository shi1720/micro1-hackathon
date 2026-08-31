import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Prefer an explicitly provided Chromium (STEPFREE_CHROMIUM), then the
// sandbox's pre-installed browser, then Playwright's own download.
const EXECUTABLE =
  process.env.STEPFREE_CHROMIUM ||
  (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export const VIEWPORT = { width: 1280, height: 900 };

let browserPromise = null;

export function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ executablePath: EXECUTABLE });
  }
  return browserPromise;
}

export async function closeBrowser() {
  if (browserPromise) {
    const b = await browserPromise;
    browserPromise = null;
    await b.close();
  }
}

export function toUrl(target) {
  if (/^https?:\/\//.test(target)) return target;
  return pathToFileURL(target).href;
}

/**
 * Run `fn(page)` in a fresh context with a stable, deterministic environment
 * (fixed viewport, reduced motion, animations frozen) and always clean up.
 */
export async function withPage(fn, { viewport = VIEWPORT } = {}) {
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await context.close();
  }
}

/** Navigate and settle: load + fonts + a short quiet period for determinism. */
export async function gotoStable(page, target) {
  await page.goto(toUrl(target), { waitUntil: 'load' });
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(150);
}
