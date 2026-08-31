# Improvement changelog

*The story of how StepFree evolved, with the evidence behind each decision. Every stage is a reproducible configuration (`node stepfree/src/cli.mjs fix <site> --stage <s>`), measured by the same independent evaluator on the same 12 fixtures / 134 scanner-verified WCAG violation instances. Full numbers: `stepfree/eval/results/`.*

---

## Baseline — one direct prompt

**What we tried & why.** The honest starting point: paste each page into `claude-sonnet-5` with "fix all WCAG 2.2 A/AA violations, return the fixed HTML". No scanner, no tools, no verification. This is what a busy developer actually does today.

**Evidence.** **134/134 WCAG instances remediated (100%), 0 introduced, 0 pages damaged** — verified by independent re-scan + content-integrity checks. Best-practice tier: 34 → 2. Cost $2.03 / 13 pages, ~28 min wall.
Alt-text truthfulness (vision-judged, 0–2): **1.53 mean** over 30 written alts — **4 scored 0**, including: an alt describing *"two wine glasses beside an uncorked bottle"* for an image containing one glass and a sealed bottle; an entirely invented groundbreaking ceremony ("officials break ground with ceremonial shovels") for an illustration of a building; and the worst: the clinic's booking infographic — which contains the practice's **phone number and address** — marked `alt=""` (decorative), hiding it from screen-reader users entirely while *improving* the axe score.

**Decision / learning.** The 2026 plot twist, reported plainly: on small, clean, static pages a frontier model **saturates the scanner-visible layer one-shot** (134/134, zero regressions on this run). The research-documented failure mode (unverified edits regressing pages, arXiv:2608.24913) did not appear at this page scale. What did appear is worse, because it is invisible: the model **confidently describes images it cannot see, and silences content it shouldn't**. The problem to solve moved from *capability* to *groundedness and trust* — and you can only know a run was safe because we built the machinery that checks. A business owner pasting into a chatbot has no way to tell this run from a bad one.

---

## v1 — a basic agent: scanner report + file tools

**What we tried & why.** Give the same model the axe-core report and Read/Write/Edit tools on a working copy, one generalist agent per page, still no verification. Isolates the value of *seeing the scanner's findings*.

**Evidence.** 134/134 (100%), 0 introduced, 0 damaged; best-practice 34 → 0 (the report includes the tier the one-shot missed). Cost $1.48, ~12 min — **cheaper than the baseline**, because targeted edits beat full-page regeneration.

**Decision / learning.** Kept (as the chassis). The report-guided agent is more surgical than the full-page rewrite — it edits in place instead of regenerating every byte of the page, which is what makes the approach viable for real repos where a full-page rewrite is un-reviewable. Still image-blind.

---

## v2 — deterministic verification loop

**What we tried & why.** After each fix round: re-scan with axe, diff violations instance-by-instance (rule + selector), feed unfixed/introduced items back for a bounded retry. The design answer to "24 improvements vs 20 regressions" (arXiv:2608.24913).

**Evidence.** 134/134 (100%), 0 introduced, 0 damaged; cost $1.51. — the retry loop fired **zero times** on this corpus: `claude-sonnet-5` cleared every assigned violation on the first pass.

**Decision / learning.** Kept — with an honest note. On this corpus's happy path the loop rarely fires; its value is that it converts "probably fine" into "proven, per instance, by a tool the model can't sweet-talk". We capped retries at one after reading arXiv:2605.27716 (naive iterative refinement: +52% cost, no improvement) — bounded verification, not vibes-driven looping.

---

## v3 — specialist fixers, knowledge files, deterministic tools

**What we tried & why.** Five specialists (structure → images → forms → ARIA → contrast, in that order so colors land on the final DOM), each with a per-domain knowledge file and only the tools it needs. Two tools embody a principle — *models supply judgment, never arithmetic and never guesses about pixels*:
- `contrast_suggest`: WCAG luminance math finds the closest compliant color with the brand hue held fixed;
- `view_image`: the media specialist must **look at every image** (rendered in a real browser) before writing its alt.

**Evidence.** 134/134 (100%), 0 introduced, 0 damaged; cost $2.59 (the vision pass is the main cost driver); one judgment call proactively flagged for human review by a fixer.
Alt-text truthfulness: **1.83 mean vs the baseline's 1.53 — and, decisively, zero hallucinations (0 alts scored 0, vs 4 for the baseline)**. The clinic booking infographic the baseline silenced with `alt=""` scored 0 → 2: the vision-grounded specialist read the image and wrote alt text carrying the phone number and address. The five remaining 1-scores are defensible judgment disagreements (e.g. marking small menu illustrations decorative), not fabrications.

**Decision / learning.** Kept — this is the load-bearing iteration. The mechanism matters more than the score: v3 cannot hallucinate an alt because the workflow makes perception a precondition for assertion (`view_image` before writing). Grounding is an architecture property, not a model property.

---

## v4 — integrity guardrails & rollback

**What we tried & why.** Deterministic content invariants around every fix round: word-inventory (no visible text may vanish), image-inventory (no visible image may vanish), axe-regression gate, and pixel diffs *localized to the elements a fix was allowed to touch*. Hard failure → automatic rollback of that specialist's changes + routing to the human queue.

**Evidence.** 134/134 (100%), 0 introduced, 0 damaged; 0 rollbacks needed on-corpus; cost $2.34.

**Decision / learning.** Kept, precisely *because* it never fired here: the guardrails are the reason we can publish "0 pages damaged" as a measured fact instead of an assumption. A gate that stays quiet is doing its job; a gate that cannot exist cannot testify. (And the removed strict-visual experiment below shows how easily the *wrong* gate lies.)

### The experiment we removed: a strict visual-diff gate

We first shipped the obvious thing — "reject any fix changing more than 0.5% of pixels." It never fired on real fixes, and a controlled experiment (`node stepfree/eval/pixel-vs-harm.mjs`, deterministic, no LLM) showed why the whole idea is broken:

| Edit | Viewport pixels changed | Words lost |
|---|---|---|
| Contrast recolor (legitimate) | 0.27% | 0 |
| **Entire menu item deleted (destructive)** | **1.32%** | **13** |
| Naive heading retag (legitimate) | 1.93% | 0 |

A strict gate can't even see the class of change it was built to allow (text recoloring is tiny in pixel area), and any gate loose enough to admit a legitimate heading retag (1.93%) must also admit a deleted menu item (1.32%). **Pixel area measures reflow, not harm.** Removed as a gate; kept as a localized, per-category advisory. The safety net that works is the content inventory: it flags the deletion (13 words) and passes both legitimate fixes (0). The flag `STEPFREE_STRICT_VISUAL=1` reproduces the removed behavior.

---

## final — conventions memory, beyond-scanner review lane, evidence report

**What we tried & why.** (1) A conventions ledger: the first specialist to resolve a color pair or set an alt-text style records it; every later fixer — including on other pages of the site — is instructed to reuse it, so a two-page site gets one accessible palette, not two. (2) A read-only expert reviewer that hunts what axe cannot see (images of text, `<div onclick>` fake buttons, keyboard traps) and may only emit `flag_for_review` items with drafted fixes — it cannot edit. (3) The audit report: deterministic numbers + before/after screenshots, agent-written narrative, honest-scope section.

**Evidence.** FINAL_ROW
Review lane on the challenge fixtures: FINAL_REVIEW_RESULT

**Decision / learning.** FINAL_LEARNING

---

## The bug that proved the thesis

Mid-evaluation, our alt-text judge started scoring everything 0 or refusing to score. Cause: our image-rendering helper silently produced broken-image glyphs (Chromium blocks `file://` subresources inside `setContent()` pages). The episode was accidentally the whole project in miniature: shown an unviewable image, the **grounded** system (the Opus judge, required to look before scoring) answered *"I cannot honestly assign a score"* — while the **ungrounded** baseline, given the same information vacuum, had confidently written *"golden butter croissant with flaky, layered crescent shape."* Groundedness isn't a model property; it's an architecture property. We fixed the renderer, invalidated the affected measurements, and re-ran them (the invalid file is preserved in the session records; the corrected results are what `stepfree/eval/results/` contains).

---

## Main failure mode & hot take

→ See the **Hot take** section of [README.md](README.md).
