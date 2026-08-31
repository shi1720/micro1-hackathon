/**
 * WCAG contrast math + brand-preserving fix suggestions.
 *
 * Rather than letting a language model guess colors, we compute the smallest
 * lightness adjustment (hue and saturation held fixed) that reaches the
 * required contrast ratio — so a brand's terracotta stays terracotta, just
 * legible. Exposed to the contrast fixer agent as a tool.
 */

export function parseColor(input) {
  const s = String(input).trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) {
    const [r, g, b] = m[1].split('').map((c) => parseInt(c + c, 16));
    return [r, g, b];
  }
  m = s.match(/^#([0-9a-f]{6})$/);
  if (m) {
    return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  }
  m = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  const named = { white: [255, 255, 255], black: [0, 0, 0] };
  if (named[s]) return named[s];
  throw new Error(`Cannot parse color: ${input}`);
}

export function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function channelLum(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance([r, g, b]) {
  return 0.2126 * channelLum(r) + 0.7152 * channelLum(g) + 0.0722 * channelLum(b);
}

export function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(parseColor(c1));
  const l2 = relativeLuminance(parseColor(c2));
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG 1.4.3: large text = ≥24px, or ≥18.66px bold. */
export function requiredRatio(fontSizePx, bold = false) {
  const large = fontSizePx >= 24 || (bold && fontSizePx >= 18.66);
  return large ? 3.0 : 4.5;
}

export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

export function hslToRgb([h, s, l]) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * Find the closest compliant variant of `color` against `against`, moving
 * lightness only. Direction is chosen automatically; returns null if even
 * pure black/white cannot reach the ratio (caller must adjust the other side).
 */
function adjustLightness(color, against, target) {
  const [h, s, l0] = rgbToHsl(parseColor(color));
  let best = null;
  for (const dir of [-1, +1]) {
    // Walk L in 0.5% steps away from the original value.
    for (let step = 0; step <= 200; step++) {
      const l = l0 + dir * step * 0.005;
      if (l < 0 || l > 1) break;
      const candidate = toHex(hslToRgb([h, s, l]));
      if (contrastRatio(candidate, against) >= target) {
        if (!best || step < best.steps) best = { color: candidate, steps: step, ratio: contrastRatio(candidate, against) };
        break;
      }
    }
  }
  return best ? { color: best.color, ratio: +best.ratio.toFixed(2), deltaL: +(best.steps * 0.005).toFixed(3) } : null;
}

/**
 * Suggest brand-preserving fixes for a failing pair.
 * Returns { current, required, fixForeground, fixBackground } where each fix
 * is { color, ratio, deltaL } or null when impossible in that direction.
 */
export function suggestContrastFix({ foreground, background, fontSizePx = 16, bold = false, minRatio = null }) {
  const target = minRatio || requiredRatio(fontSizePx, bold);
  return {
    current: +contrastRatio(foreground, background).toFixed(2),
    required: target,
    fixForeground: adjustLightness(foreground, background, target),
    fixBackground: adjustLightness(background, foreground, target),
  };
}
