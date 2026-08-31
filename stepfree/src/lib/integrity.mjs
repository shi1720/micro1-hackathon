import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * Content-integrity comparison between two page snapshots.
 *
 * Research context: unverified LLM accessibility edits regress pages about as
 * often as they improve them, and ~30% of one-shot patches introduce
 * structural damage (arXiv:2608.24913, arXiv:2605.27716). These checks are the
 * deterministic guardrail that catches that damage — the model is never
 * trusted to verify itself.
 *
 * Hard failures (any of these → the fix round is rejected and rolled back):
 *   - textLoss:  visible words that existed before are gone after
 *   - imageLoss: a visible image was removed
 * Advisory signals (reported, escalated to human review when extreme):
 *   - pixelDiffRatio: fraction of viewport pixels that changed
 *   - outsideRatio:   fraction of changed pixels OUTSIDE the regions the
 *                     fixer legitimately touched (per-category expectation:
 *                     a contrast fix must change pixels only where it worked)
 *   - overflowIntroduced: page gained a horizontal scrollbar
 */

const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'with', 'at', 'by']);

function wordBag(text) {
  const bag = new Map();
  for (const w of text.toLowerCase().replace(/[^\p{L}\p{N}'@.-]+/gu, ' ').split(/\s+/)) {
    if (!w || w.length < 2 || STOPWORDS.has(w)) continue;
    bag.set(w, (bag.get(w) || 0) + 1);
  }
  return bag;
}

export function compareText(beforeText, afterText) {
  const before = wordBag(beforeText);
  const after = wordBag(afterText);
  const missing = [];
  for (const [w, n] of before) {
    const deficit = n - (after.get(w) || 0);
    for (let i = 0; i < deficit; i++) missing.push(w);
  }
  const added = [];
  for (const [w, n] of after) {
    const surplus = n - (before.get(w) || 0);
    for (let i = 0; i < surplus; i++) added.push(w);
  }
  return { missing, added };
}

export function compareImages(beforeImages, afterImages) {
  const afterSrcs = new Set(afterImages.filter((i) => i.visible).map((i) => i.src));
  const removed = beforeImages
    .filter((i) => i.visible && !afterSrcs.has(i.src))
    .map((i) => i.src);
  return { removed };
}

/**
 * Pixel-level diff of the viewport screenshots.
 * `allowedRegions` are {x,y,w,h} boxes (page coordinates) the fix was allowed
 * to repaint — changed pixels are classified inside/outside those boxes.
 */
export function comparePixels(beforePng, afterPng, allowedRegions = [], { threshold = 0.1, pad = 8 } = {}) {
  const a = PNG.sync.read(beforePng);
  const b = PNG.sync.read(afterPng);
  if (a.width !== b.width || a.height !== b.height) {
    return { comparable: false, pixelDiffRatio: 1, outsideRatio: 1, diffPixels: -1 };
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold });

  let outside = 0;
  if (diffPixels > 0) {
    const boxes = allowedRegions.map((r) => ({
      x1: r.x - pad, y1: r.y - pad, x2: r.x + r.w + pad, y2: r.y + r.h + pad,
    }));
    const data = diff.data;
    for (let y = 0; y < a.height; y++) {
      for (let x = 0; x < a.width; x++) {
        const idx = (y * a.width + x) * 4;
        // pixelmatch paints differing pixels red (255, 0, 0)
        if (data[idx] === 255 && data[idx + 1] === 0 && data[idx + 2] === 0) {
          const inAllowed = boxes.some((bx) => x >= bx.x1 && x <= bx.x2 && y >= bx.y1 && y <= bx.y2);
          if (!inAllowed) outside++;
        }
      }
    }
  }

  const total = a.width * a.height;
  return {
    comparable: true,
    diffPixels,
    pixelDiffRatio: diffPixels / total,
    outsidePixels: outside,
    outsideRatio: outside / total,
    diffPng: PNG.sync.write(diff),
  };
}

/**
 * Full integrity verdict for one fix round.
 * Returns { ok, hardFailures: [...], advisories: [...], metrics }.
 */
export function checkIntegrity(before, after, { allowedRegions = [], maxMissingWords = 2 } = {}) {
  const hardFailures = [];
  const advisories = [];

  const text = compareText(before.text, after.text);
  if (text.missing.length > maxMissingWords) {
    hardFailures.push({
      kind: 'text-loss',
      detail: `${text.missing.length} visible word(s) disappeared, e.g. ${text.missing.slice(0, 8).join(', ')}`,
    });
  }

  const images = compareImages(before.images, after.images);
  if (images.removed.length > 0) {
    hardFailures.push({
      kind: 'image-loss',
      detail: `visible image(s) removed: ${images.removed.join(', ')}`,
    });
  }

  const px = comparePixels(before.screenshotViewport, after.screenshotViewport, allowedRegions);
  if (px.comparable && px.pixelDiffRatio > 0.15) {
    advisories.push({
      kind: 'large-visual-change',
      detail: `${(px.pixelDiffRatio * 100).toFixed(1)}% of viewport pixels changed`,
    });
  }
  if (px.comparable && allowedRegions.length > 0 && px.outsideRatio > 0.02) {
    advisories.push({
      kind: 'diff-outside-touched-elements',
      detail: `${(px.outsideRatio * 100).toFixed(1)}% of viewport changed outside the elements this fix targeted`,
    });
  }

  if (!before.scrollWidth || !after.scrollWidth) {
    // older snapshots may lack it; skip
  } else if (after.scrollWidth > before.scrollWidth + 24 && after.scrollWidth > after.viewport.width) {
    advisories.push({ kind: 'overflow-introduced', detail: `horizontal scroll grew to ${after.scrollWidth}px` });
  }

  return {
    ok: hardFailures.length === 0,
    hardFailures,
    advisories,
    metrics: {
      missingWords: text.missing.length,
      addedWords: text.added.length,
      removedImages: images.removed.length,
      pixelDiffRatio: px.comparable ? +px.pixelDiffRatio.toFixed(4) : null,
      outsideRatio: px.comparable ? +px.outsideRatio.toFixed(4) : null,
    },
    diffPng: px.diffPng,
  };
}
