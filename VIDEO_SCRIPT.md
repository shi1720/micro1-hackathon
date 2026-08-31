# Solution video — script & shot list

**Target: 4:45 · ~730 words · speak at a natural pace, don't rush.**
Each block: what's on screen, then the words to say verbatim. Record the terminal at a large font (⌘+ a few times), 1280×800-ish window. Do the screen recordings FIRST (commands below), then narrate over them — it's much easier than doing both live.

**Pre-recording checklist**
1. `cd micro1-hackathon` with everything installed (see REPRODUCTION.md).
2. Have these open in browser tabs: `fixtures/12-clinic/index.html`, `docs/img/exhibit-booking-steps.png`, `runs/final/08-shelter/report.html` (or any final-stage report), `stepfree/eval/results/summary.md` (rendered on GitHub).
3. Terminal ready to run: `node stepfree/src/cli.mjs fix fixtures/08-shelter --out runs/video-demo --stage final` (it takes ~6 min — start it before recording and capture the scroll, or speed up 4× in editing).

---

## 0:00 – 0:35 · The problem

**[Screen: fixtures/12-clinic/index.html in a browser — a normal, pleasant clinic site]**

> This is a family clinic's website. It looks fine. It's also one of the ninety-six percent of websites that fail accessibility standards — and that's no longer just unfortunate: over five thousand US lawsuits were filed about exactly this last year, and sixty-four percent of the defendants were small businesses. In Europe, the Accessibility Act is now in force. The going fixes are a three-hundred-dollar-per-page consultant, or an overlay widget — which the FTC just fined a million dollars, because widgets mask code, they don't fix it.

## 0:35 – 1:20 · The baseline — and why it's not enough

**[Screen: terminal — show `stepfree/baseline/run.mjs` command and output; then browser tab with docs/img/exhibit-booking-steps.png]**

> So here's the obvious 2026 baseline: paste the page into a frontier model and say "fix the accessibility." And honestly? On the scanner level, it aces it. We seeded twelve realistic small-business sites with a hundred and thirty-four verified violations — the one-shot baseline fixed every single one the scanner can see. That surprised us, and we report it plainly.
>
> But look at what it did *here*. This infographic tells patients how to book — including the clinic's phone number. The baseline marked it as decorative. Alt equals empty string. For a screen-reader user, the phone number just… vanished. And the scanner? The scanner says the page *improved*. We ran the baseline twice: one run hid this, the other didn't. A coin flip — and nothing tells you which run you got.

## 1:20 – 2:50 · StepFree — one real execution

**[Screen: terminal running `node stepfree/src/cli.mjs fix fixtures/08-shelter --out runs/video-demo --stage final` — let the routing and per-specialist lines scroll; pause on a "verification" line]**

> This is StepFree — the accessibility engineer that fixes your code and proves it. Watch a real run on an animal-shelter site.
>
> First it scans with axe-core and routes each violation to a specialist agent — structure, images, forms, ARIA, contrast. Each one only gets the tools it needs. The contrast agent doesn't guess colors: it calls a math tool that finds the closest compliant color while keeping the brand's hue. And the images agent — this is the important one — is *required to look at every image*, rendered in a real browser, before it's allowed to write alt text.
>
> **[Screen: trajectories/…media….md open — show the view_image call and the resulting alt]**
>
> Here's its trajectory: it viewed the photo of Biscuit, an actual floppy-eared brown dog, and wrote alt text describing what's actually there. It cannot hallucinate a description, because in this workflow, perception comes before assertion.
>
> Now the part nobody else does. After every fix, deterministic verification the model can't argue with: re-scan — the violation must be gone, with nothing new introduced anywhere. Content integrity — not one visible word, not one image may disappear. And pixel checks scoped to exactly the elements that fix was allowed to touch. Fail any of that, and the fix is rolled back automatically and routed to a human.
>
> **[Screen: runs/video-demo/report.html — scroll slowly: scorecard, before/after screenshots, review queue]**
>
> The output is this report: before and after, every fix verified, and a review queue where the judgment calls land — each with a drafted fix, so the human decides in minutes, not days. This is what a bakery owner hands to their lawyer.

## 2:50 – 3:50 · The comparison

**[Screen: stepfree/eval/results/summary.md tables, then EVALUATION.md exhibits]**

> Same twelve sites, same model, same evaluator for both systems. On scanner-visible violations: both hit a hundred percent — capability there is saturated, and pretending otherwise would be theater. The separation is in what the scanner can't see. Alt-text truthfulness, judged image-by-image by a stronger vision model: baseline one-point-five out of two, with four outright hallucinations — invented wine glasses, a groundbreaking ceremony that doesn't exist, that silenced phone number. StepFree: one-point-eight out of two, with zero hallucinations. Plus thirty-two scanner-invisible issues found and drafted for human review — fake div buttons, an image-of-text hero — things no automated tool reports at all. Cost per site: about fifty cents of compute, versus three hundred and fifty dollars a page for the manual alternative.

## 3:50 – 4:25 · The changelog — and what we removed

**[Screen: CHANGELOG.md — scroll from baseline to final; stop on the removed-experiment table]**

> We got here in six measured steps — every stage in the changelog is a flag you can re-run. The biggest single contribution: making the image agent see before it writes. That one change took hallucinated alt text from four to zero.
>
> And one experiment we killed: a strict visual-diff gate — "reject any fix that changes too many pixels." Sounds safe. It's wrong. We proved it with a controlled test: deleting an entire menu item moves *fewer* pixels than legitimately fixing a heading. Pixel area measures reflow, not harm. What works is a word-level content inventory — it catches the deletion instantly and waves the real fixes through.

## 4:25 – 4:45 · Close

**[Screen: README hero, then the shelter site before/after side by side]**

> The lesson of this project: model capability is saturating — trust isn't. The product isn't the fix; it's the proof. Curb cuts were built for wheelchairs, and everyone with a stroller or a suitcase uses them. Fix the code, and everybody walks in. This is StepFree.

---

### All numbers in this script are final (from stepfree/eval/results/)
- alt truthfulness: baseline 1.53 → StepFree 1.80 (zero fabrications)
- review items: 32, including all 7 planted scanner-invisible traps
- compute: $5.78 for the 13-page corpus ≈ $0.48/site

### Editing notes
- Speed up the long agent run 4–8× with a timer overlay; keep the verification lines readable at 1×.
- Subtitles on (accessibility video with no captions would be… ironic).
- Add a soft highlight box on the alt="" line and on the phone number in the infographic at 1:05.
