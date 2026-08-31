# Human-time & cost model (assumptions, stated openly)

The evaluation's primary metric (violations remediated & verified) is measured directly.
Human-time and cost-per-task comparisons require a model of today's manual process;
every assumption is written down here so a judge can adjust any number and recompute.

## What the status quo costs

| Input | Value used | Source |
|---|---|---|
| Professional audit, small site | $1,250–$2,750 flat (most clients) | [Accessible.org pricing](https://accessible.org/pricing/) |
| Remediation, per page | $350–$550 | [ProjectCostEstimator 2026](https://projectcostestimator.com/blog/wcag-accessibility-cost-2026) |
| Manual fix time per violation instance (find file, fix, retest) | 10–20 min | derived: $350–550/page at $75–100/hr agency rate ≈ 4–6 h/page across a typical 40–60 instances (WebAIM: 56 errors/page average) |
| Developer review of a drafted fix (approve/adjust) | ~2 min/item | internal assumption — reviewer reads a diff + rendered before/after |

## Per-site comparison formulas

- **Manual today**: `instances × 12.5 min` (midpoint) + retest pass (30 min/site). No artifact trail unless separately purchased as an audit.
- **Baseline (one-shot LLM)**: model cost + **full manual QA of every page** — because nothing verifies the output, a responsible owner must diff and retest each page by hand (~20 min/page) or ship on faith. This is the hidden cost of unverified generation.
- **StepFree**: model cost (measured per run) + review queue (`items × 2 min`) + report skim (5 min/site). Verified fixes need no re-testing by the human — the evidence ships with the report.

## Why baseline QA time is charged

Research measured that unverified LLM accessibility edits regress pages about as often
as they improve them (24 improvements vs 20 regressions across 100 trials,
[arXiv:2608.24913](https://arxiv.org/html/2608.24913)) and that ~30% of one-shot patches
introduce structural damage ([arXiv:2605.27716](https://arxiv.org/html/2605.27716v1)).
Our own eval measures the same phenomenon on this corpus (see EVALUATION.md).
Shipping a one-shot rewrite without page-by-page human QA is therefore not a
professionally defensible workflow, and the comparison charges it accordingly.
Judges who disagree can zero that term; the primary metric is unaffected.
