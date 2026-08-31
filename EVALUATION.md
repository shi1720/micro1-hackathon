# Evaluation

*This document defines the evaluation before interpreting it, per the hackathon guidelines. All tables are backed by JSON in `stepfree/eval/results/` (regenerable via `stepfree/eval/run-all-stages.sh`); nothing here is hand-estimated except where a stated assumption is cited from `docs/research/cost-model.md`.*

## Corpus

12 synthetic small-business sites, 13 pages, **134 scanner-verified WCAG A/AA violation instances** (plus 39 best-practice instances), seeded to mirror the WebAIM Million 2026 distribution. Two challenge fixtures additionally contain issues **no scanner can detect** (an image-of-text hero, click-handler `<div>` "buttons", a decorative-vs-informative image ambiguity trio). Ground truth is locked by `verify-fixtures` - the evaluator refuses to run if any fixture's live scan disagrees with its recorded counts. See `fixtures/README.md`.

## Systems compared

Same model (`claude-sonnet-5`), same pages, same information available on the page itself:

- **baseline** - one direct prompt: the page's HTML pasted to the model, "fix all WCAG 2.2 A/AA violations, return the fixed HTML." No scanner, no tools, no verification. This is what a busy developer does today.
- **v1 … final** - the ladder of StepFree configurations, each adding one mechanism (see `CHANGELOG.md`). Every stage is reproducible: `node stepfree/src/cli.mjs fix <site> --stage <s>`.

The one resource difference: agentic stages see the axe report and may run tools (scanner, contrast math, image rendering). That asymmetry is the point of the comparison - it prices what the workflow adds over the raw model. The baseline's information disadvantage on *images* is not an artifact either: a one-shot prompt over HTML **cannot** see images, and that is precisely the real-world failure mode we measure.

## Metrics (defined before the runs)

**Primary: WCAG A/AA violation instances remediated and independently verified.** Measured by an evaluator that re-scans every page itself (instance-level diff keyed by rule + selector); run ledgers are never trusted for outcomes.

**Guard metrics** - a fix that ships damage is not a fix:
- new violation instances introduced (re-scan)
- pages with content damage (word-inventory loss - tolerance ≤2 non-stopword words to absorb rewording noise - and visible-image loss)
- pages shippable (zero WCAG violations AND zero damage AND zero regressions)

**Quality-beyond-the-scanner** - axe verifies an alt *exists*; it cannot verify it is *true*:
- alt-text truthfulness: every agent-written alt scored 0-2 against the rendered image by a vision judge (Claude **Opus** - a different tier than the fixer, to reduce same-model bias); rubric in `stepfree/eval/judge-alts.mjs`
- challenge-fixture behavior: what each system did about the scanner-invisible issues (fixed / flagged for human / silently ignored / made worse)

**Economics**: measured API cost per site (`run.json`), wall time, and human minutes under the stated model (`docs/research/cost-model.md`).

## Results - the scanner-visible layer

| Stage | WCAG instances (before → after) | Remediated | Introduced | Best-practice | Pages damaged | Pages shippable | Rollbacks | Review items | API cost | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| baseline | 134 → 0 | 100.0% | 0 | 34 → 2 | 0/13 | 13/13 | - | 0 | $2.03 | 28 min |
| baseline (re-run) | 134 → 0 | 100.0% | 0 | 34 → 0 | 0/13 | 13/13 | - | 0 | $2.04 | 31 min |
| v1 | 134 → 0 | 100.0% | 0 | 34 → 0 | 0/13 | 13/13 | 0 | 0 | $1.48 | 12 min |
| v2 | 134 → 0 | 100.0% | 0 | 34 → 0 | 0/13 | 13/13 | 0 | 0 | $1.51 | 11 min |
| v3 | 134 → 0 | 100.0% | 0 | 34 → 0 | 0/13 | 13/13 | 0 | 1 | $2.59 | 20 min |
| v4 | 134 → 0 | 100.0% | 0 | 34 → 0 | 0/13 | 13/13 | 0 | 1 | $2.34 | 21 min |
| **final** | 134 → 0 | 100.0% | 0 | 34 → 0 | 0/13 | 13/13 | 0 | **32** | $5.78 | 54 min |

*(Auto-generated per-fixture detail: `stepfree/eval/results/summary.md`.)*

**The headline finding is not the one we designed for.** We built StepFree expecting the research-documented failure pattern (unverified LLM edits regressing pages ~as often as improving them, arXiv:2608.24913). On this corpus, a 2026 frontier model one-shots the scanner-visible layer: the baseline remediated **134/134** instances with zero introduced violations and zero content damage - and re-run variance was zero - a full re-run also scored 134/134 with nothing introduced and no damage. On small, clean, static pages, one-shot capability on axe-detectable issues is effectively saturated. We report that plainly rather than burying it.

## Results - where the layers separate

What the primary metric cannot see is where the systems diverge:

| Quality dimension (what axe cannot measure) | Baseline run 1 | Baseline run 2 | v1 (tools, no vision) | StepFree v3 | StepFree final |
|---|---|---|---|---|---|
| Alt-text truthfulness, mean 0-2 (30 agent-written alts) | 1.53 | 1.37 | 1.63 | **1.83** | **1.80** |
| of which **fabrications** (content invented or unique content destroyed) | **4** | **4** | **3** | 0 | 0 |
| Informative content silenced with `alt=""` (incl. the booking phone number) | 1 | 0 | 0 | 0 | 0 |
| Scanner-invisible issues surfaced for humans | 0 | 0 | 0 | 1 | **32** (5/5 planted traps found) |
| Evidence artifacts (report, per-fix verification, trajectories) | none | none | none | partial | full |

The v1 column is the control for the mechanism claim: giving the agent the scanner report and file tools (but no vision) still produced 3 fabricated alts. The fabrication count reaches zero exactly when `view_image` becomes mandatory (v3).

Every score carries the judge's per-image reasoning in `stepfree/eval/results/alts-*.json`, and we enumerate **all four** of StepFree-final's non-2 scores rather than round them away: (1-2) two small menu illustrations given `alt=""` - a contested decorative call (their content duplicates the adjacent menu text; the judge scored this same decision "1" in the v3 judging run and "0" in the final one); (3-4) two attorney portraits scored 1 for describing the link destination ("Marcus Harrison - request a consultation") rather than the picture - but those images are wrapped in `<a href="#consult">` in the page source, and describing the destination of a linked image is *correct* WCAG practice; the judge was not shown the surrounding markup (a judge limitation we've since addressed by passing parent-element context - see `judge-alts.mjs`). None of the four asserts content absent from an image. The baseline's zeros do: the wine-glass miscount and the invented groundbreaking ceremony **recur in both runs**, which is why we report the *fabrication count* (8 vs 0) as the decisive number rather than the mean.

**Exhibit A.** The baseline resolved 12-clinic's missing-alt violations by marking the booking infographic decorative (`alt=""`):

<img src="docs/img/exhibit-booking-steps.png" alt="Infographic titled with three steps: 1 Call the front desk, (555) 014-6090; 2 Choose a time, most visits within two weeks; 3 Come visit us, 18 Lakeshore Drive" width="600">

That image contains the clinic's **booking phone number**. After the baseline's "fix", a screen-reader user can no longer find it - and the scanner reports the page as cleaner (11 → 0 violations). The fix made the metric better and the page worse. StepFree's media specialist renders every image before writing alt text (see the trajectories), and its beyond-scanner reviewer routes exactly this class of judgment to a human.

## The challenging case, as required

Fixture 12-clinic (the decorative / informative / portrait ambiguity trio + fake `<div>` buttons) is the designated challenging case. What it revealed: the two systems behave identically where the scanner looks, and diverge completely where it doesn't. The baseline *converted the two fake `<div>` buttons to real `<button>`s* (genuinely good) - but in run 1 it silenced the booking infographic with `alt=""`, and in run 2 it described the infographic while dropping the phone number from the description. StepFree's media specialist read the image and carried its content; its reviewer then flagged the infographic as an image-of-text (WCAG 1.4.5) with a drafted HTML replacement, flagged both fake buttons with keyboard-complete rewrites, and - on 11-venue - caught the image-of-text hero, the keyboard-dead dropdown, and the `<span onclick>` fake button. 5/5 planted scanner-invisible traps (both fixtures' `meta.json` files enumerate them with ids so the recall is checkable), each with a copy-pasteable proposed fix and honest confidence. The 12-clinic image-ambiguity trio is a separate judgment test - scored through the alt-truthfulness metric above, where the vision-grounded fixer handled all three correctly.

## Do the gates actually fire? (fault injection)

In every normal run the verification and rollback machinery stayed quiet (0 retries, 0 rollbacks) because the fixer never caused damage; a skeptic could call the gates decorative. We tested that two ways. A run with a much smaller model (`claude-haiku-4-5`) also passed cleanly. So we added a fault-injection mode (`STEPFREE_CHAOS=1`, in `orchestrator.mjs`) that sabotages the media round with the documented destructive-fix damage class (an image and a paragraph deleted). Recorded outcome (`runs/fault-injection-chaos`, trajectory in `trajectories/`): the integrity gate failed the round (text-loss, image-loss), the bounded retry recovered the image but not the deleted text, and the orchestrator rolled the round back and queued the items for human review; unrelated specialists continued normally. The machinery works end to end; it is simply not needed when the fixer behaves.

## Variance

LLM outputs vary run to run; the deterministic layers (scanner, integrity checks) do not. We ran the baseline twice on all 12 fixtures: both runs scored 134/134 with zero introduced violations and zero damage - the scanner layer is stable. The *quality* layer is not: run 1 silenced the booking infographic, run 2 didn't; each run produced 4 fabricated alts - two of them (the wine-glass miscount, the invented groundbreaking ceremony) recurring in *both* runs, plus per-run inventions (run 2: a rabbit "lying flopped over" that sits upright, a wax-melter pouring station that isn't in the image). The catastrophic failures are nondeterministic - which is precisely why an unverified workflow can't be trusted even when its average looks fine. StepFree's fabrication count is structurally 0 because perception precedes assertion.

## Human time & cost per site

Assumptions and formulas in `docs/research/cost-model.md`; measured values from `run.json`:

| Whole corpus (12 sites / 13 pages) | Human time | Out-of-pocket |
|---|---|---|
| Manual remediation (status quo) | ~28 h (134 instances × 12.5 min + retest) | $4,550-$7,150 at $350-550/page |
| Baseline one-shot + responsible QA | ~4.3 h (20 min/page diff-and-retest - required, since nothing verifies the output) | ~$2 compute |
| **StepFree** | **~1.2 h** (32 review items × 2 min + report skim) | **$5.78 compute (~$0.48/site)** |

The asymmetry to notice: StepFree's human hour is spent on *judgment* (approving drafted decisions); the baseline's four hours are spent on *distrust* (re-checking everything because nothing was verified).

## Honest limitations

1. **Corpus difficulty.** Small, self-contained, syntactically clean static pages are the *easiest* remediation setting; they were chosen so ground truth could be scanner-locked and the whole evaluation reproduced in an afternoon. Real sites - templated CMS output, minified bundles, JS-rendered DOMs, hundreds of pages - are where the baseline's paste-a-page workflow stops scaling and StepFree's crawl/verify/rollback machinery is designed to matter more. The eval measures the mechanisms; it does not yet measure that scaling claim.
2. **n=1 per (stage, page)** for agentic stages (cost); the baseline got a variance re-run because its result was surprising.
3. **The alt judge is an LLM.** Mitigations: different model tier than the fixer, a rubric with anchored scores, per-image reasons in `stepfree/eval/results/alts-*.json` so any score can be audited by a human, and the headline exhibit (the silenced infographic) verifiable by eye.
4. Axe-core is one scanner; "verified" means verified against the industry-standard automatable layer (Deque's coverage study: ~57% of issues by volume), never "fully compliant". The remaining layer is routed to humans by design.
