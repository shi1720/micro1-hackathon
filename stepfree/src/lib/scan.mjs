import { AxeBuilder } from '@axe-core/playwright';
import { withPage, gotoStable } from './browser.mjs';

// WCAG 2.x A/AA — the conformance target with legal weight (ADA / EN 301 549 / EAA).
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
// Best-practice rules (landmarks, heading order…) matter for real usability; we
// track them as a second tier so the headline metric stays legally grounded.
export const SCAN_TAGS = [...WCAG_TAGS, 'best-practice'];

function isWcag(tags) {
  return tags.some((t) => WCAG_TAGS.includes(t));
}

/**
 * Run axe-core against a file path or URL.
 * Returns a normalized, JSON-serializable result:
 * {
 *   target, timestamp,
 *   violations: [{ id, impact, tier: 'wcag'|'best-practice', wcagRefs, help,
 *                  helpUrl, nodes: [{ target, html, failureSummary }] }],
 *   counts: { wcag: { rules, nodes }, bestPractice: { rules, nodes }, incomplete },
 * }
 */
export async function scanPage(target) {
  return withPage(async (page) => {
    await gotoStable(page, target);
    const raw = await new AxeBuilder({ page }).withTags(SCAN_TAGS).analyze();

    const violations = raw.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      tier: isWcag(v.tags) ? 'wcag' : 'best-practice',
      wcagRefs: v.tags.filter((t) => /^wcag\d/.test(t)),
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        target: n.target.join(' '),
        html: n.html.length > 400 ? n.html.slice(0, 400) + '…' : n.html,
        failureSummary: n.failureSummary,
      })),
    }));

    const tally = (tier) => {
      const list = violations.filter((v) => v.tier === tier);
      return {
        rules: list.length,
        nodes: list.reduce((s, v) => s + v.nodes.length, 0),
      };
    };

    return {
      target: String(target),
      timestamp: new Date().toISOString(),
      violations,
      counts: {
        wcag: tally('wcag'),
        bestPractice: tally('best-practice'),
        incomplete: raw.incomplete.length,
      },
    };
  });
}

/** Flatten a scan into per-instance records: one row per failing node. */
export function violationInstances(scan) {
  return scan.violations.flatMap((v) =>
    v.nodes.map((n) => ({ rule: v.id, impact: v.impact, tier: v.tier, target: n.target }))
  );
}

/** Diff two scans: which instances were fixed, which are new. Keyed by rule+selector. */
export function diffScans(before, after) {
  const key = (i) => `${i.rule}::${i.target}`;
  const beforeSet = new Map(violationInstances(before).map((i) => [key(i), i]));
  const afterSet = new Map(violationInstances(after).map((i) => [key(i), i]));
  const fixed = [...beforeSet.values()].filter((i) => !afterSet.has(key(i)));
  const introduced = [...afterSet.values()].filter((i) => !beforeSet.has(key(i)));
  const remaining = [...afterSet.values()].filter((i) => beforeSet.has(key(i)));
  return { fixed, introduced, remaining };
}
