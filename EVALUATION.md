# Evaluation

*This document defines the evaluation before interpreting it, per the hackathon guidelines. All tables are backed by JSON in `stepfree/eval/results/` (regenerable via `stepfree/eval/run-all-stages.sh`); nothing here is hand-estimated except where a stated assumption is cited from `docs/research/cost-model.md`.*

## Corpus

12 synthetic small-business sites, 13 pages, **134 scanner-verified WCAG A/AA violation instances** (plus 39 best-practice instances), seeded to mirror the WebAIM Million 2026 distribution. Two challenge fixtures additionally contain issues **no scanner can detect** (an image-of-text hero, click-handler `<div>` "buttons", a decorative-vs-informative image ambiguity trio). Ground truth is locked by `verify-fixtures` — the evaluator refuses to run if any fixture's live scan disagrees with its recorded counts. See `fixtures/README.md`.

## Systems compared

Same model (`claude-sonnet-5`), same pages, same information available on the page itself:

- **baseline** — one direct prompt: the page's HTML pasted to the model, "fix all WCAG 2.2 A/AA violations, return the fixed HTML." No scanner, no tools, no verification. This is what a busy developer does today.
- **v1 … final** — the ladder of StepFree configurations, each adding one mechanism (see `CHANGELOG.md`). Every stage is reproducible: `node stepfree/src/cli.mjs fix <site> --stage <s>`.

The one resource difference: agentic stages see the axe report and may run tools (scanner, contrast math, image rendering). That asymmetry is the point of the comparison — it prices what the workflow adds over the raw model. The baseline's information disadvantage on *images* is not an artifact either: a one-shot prompt over HTML **cannot** see images, and that is precisely the real-world failure mode we measure.

## Metrics (defined before the runs)

**Primary: WCAG A/AA violation instances remediated and independently verified.** Measured by an evaluator that re-scans every page itself (instance-level diff keyed by rule + selector); run ledgers are never trusted for outcomes.

**Guard metrics** — a fix that ships damage is not a fix:
- new violation instances introduced (re-scan)
- pages with content damage (word-inventory loss, visible-image loss)
- pages shippable (zero WCAG violations AND zero damage AND zero regressions)

**Quality-beyond-the-scanner** — axe verifies an alt *exists*; it cannot verify it is *true*:
- alt-text truthfulness: every agent-written alt scored 0–2 against the rendered image by a vision judge (Claude **Opus** — a different tier than the fixer, to reduce same-model bias); rubric in `stepfree/eval/judge-alts.mjs`
- challenge-fixture behavior: what each system did about the scanner-invisible issues (fixed / flagged for human / silently ignored / made worse)

**Economics**: measured API cost per site (`run.json`), wall time, and human minutes under the stated model (`docs/research/cost-model.md`).

## Results — the scanner-visible layer

<!-- RESULTS_TABLE -->

**The headline finding is not the one we designed for.** We built StepFree expecting the research-documented failure pattern (unverified LLM edits regressing pages ~as often as improving them, arXiv:2608.24913). On this corpus, a 2026 frontier model one-shots the scanner-visible layer: the baseline remediated **134/134** instances with zero introduced violations and zero content damage — and re-run variance was RESULT_VARIANCE. On small, clean, static pages, one-shot capability on axe-detectable issues is effectively saturated. We report that plainly rather than burying it.

## Results — where the layers separate

What the primary metric cannot see is where the systems diverge:

<!-- QUALITY_TABLE -->

**Exhibit A.** The baseline resolved 12-clinic's missing-alt violations by marking the booking infographic decorative (`alt=""`):

<img src="docs/img/exhibit-booking-steps.png" alt="Infographic titled with three steps: 1 Call the front desk, (555) 014-6090; 2 Choose a time, most visits within two weeks; 3 Come visit us, 18 Lakeshore Drive" width="600">

That image contains the clinic's **booking phone number**. After the baseline's "fix", a screen-reader user can no longer find it — and the scanner reports the page as cleaner (11 → 0 violations). The fix made the metric better and the page worse. StepFree's media specialist renders every image before writing alt text (see the trajectories), and its beyond-scanner reviewer routes exactly this class of judgment to a human.

## The challenging case, as required

Fixture 12-clinic (the decorative / informative / portrait ambiguity trio + fake `<div>` buttons) is the designated challenging case. What it revealed: <!-- CHALLENGE_FINDING -->

## Variance

LLM outputs vary run to run; the deterministic layers (scanner, integrity checks) do not. We ran the baseline twice on all 12 fixtures: <!-- VARIANCE_DETAIL -->

## Human time & cost per site

Assumptions and formulas in `docs/research/cost-model.md`; measured values from `run.json`:

<!-- ECON_TABLE -->

## Honest limitations

1. **Corpus difficulty.** Small, self-contained, syntactically clean static pages are the *easiest* remediation setting; they were chosen so ground truth could be scanner-locked and the whole evaluation reproduced in an afternoon. Real sites — templated CMS output, minified bundles, JS-rendered DOMs, hundreds of pages — are where the baseline's paste-a-page workflow stops scaling and StepFree's crawl/verify/rollback machinery is designed to matter more. The eval measures the mechanisms; it does not yet measure that scaling claim.
2. **n=1 per (stage, page)** for agentic stages (cost); the baseline got a variance re-run because its result was surprising.
3. **The alt judge is an LLM.** Mitigations: different model tier than the fixer, a rubric with anchored scores, per-image reasons in `stepfree/eval/results/alts-*.json` so any score can be audited by a human, and the headline exhibit (the silenced infographic) verifiable by eye.
4. Axe-core is one scanner; "verified" means verified against the industry-standard automatable layer (Deque's coverage study: ~57% of issues by volume), never "fully compliant". The remaining layer is routed to humans by design.
