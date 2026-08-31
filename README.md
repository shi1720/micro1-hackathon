# ⿻ StepFree

**The accessibility engineer that fixes your code - and proves it.**

StepFree is an agentic workflow that takes a small business's website source, repairs its WCAG accessibility violations *in the code* (not in a JavaScript overlay), and - this is the part that doesn't exist elsewhere - **verifies every fix with machinery the AI cannot sweet-talk**: an independent re-scan, word-level content-integrity checks, image inventories, and localized visual diffs. Fixes that fail verification are rolled back automatically. Judgment calls are routed to a human review queue, each with a drafted fix. The output is a fixed site plus an evidence report an owner can hand to their developer - or their lawyer.

*Built by Shivam Gupta for the [micro1 Agentic Workflows Hackathon](docs/pitch/StepFree-Submission.pdf) - and built the way it preaches: agents did the heavy lifting, deterministic checks kept them honest.*

---

## Who has this problem?

The owner of a bakery, a dental clinic, a hair salon, a small law firm - anyone whose website was built by a freelancer in 2019 and hasn't been touched since. Concretely:

- **5,114 web accessibility lawsuits** were filed in the US in 2025 - a record - and **64% of defendants had revenue under $25M** ([UsableNet 2025 year-end report](https://info.usablenet.com/hubfs/Remediated%20-%202025_Year-End_Digital_Accessibility_Lawsuit_Report_FINAL.pdf)). Typical all-in cost per suit: $18k-$40k in settlement plus defense.
- The **European Accessibility Act** has been in force since June 28, 2025, covering any business selling into the EU, with national penalties up to €100,000 (Germany) or 5% of turnover (Italy) ([EUR-Lex](https://eur-lex.europa.eu/eli/dir/2019/882/oj/eng), [details](docs/research/market-evidence.md)).
- **95.9% of the top 1M homepages** have detectable WCAG failures - averaging 56 errors per page ([WebAIM Million 2026](https://webaim.org/projects/million/)). The web is getting *worse*, not better.
- And behind the legal risk, the actual point: **~87 million people in the EU alone live with a disability** - for them a missing label isn't a compliance line-item, it's a door that doesn't open.

## What's the bottleneck?

The owner's real options today:

| Option | What it actually does | Why it fails them |
|---|---|---|
| **Overlay widgets** (accessiBe, UserWay…) | Inject a JS layer that *masks* issues | The FTC fined accessiBe **$1M** for its compliance claims (Jan 2025); **~25% of sued companies had a widget installed when sued**; 1,031 accessibility practitioners have signed a statement that overlays can't deliver compliance ([sources](docs/research/market-evidence.md)) |
| **Scanners** (WAVE, axe, Lighthouse) | Produce a report | The report is homework, not a fix - and automation detects only ~57% of issues by volume (Deque) |
| **Consultants** | Audit + remediate properly | $1,250-$2,750 for the audit, $350-$550 *per page* to fix, weeks of lead time - priced for enterprises, not bakeries |
| **Paste it into a chatbot** | Sometimes great, sometimes catastrophic | See our evaluation: same clinic page, two runs - one run hid the clinic's **booking phone number** from screen-reader users, the other didn't. Nothing tells you which run you got. |

The bottleneck is not finding problems, and in 2026 it is not even fixing most of them. **It is knowing, with evidence, that they were fixed and nothing was broken** - at a price a small business can pay.

## What StepFree does

```
scan (axe-core) ──► route by rule ──► 5 specialist agents ──► VERIFY every fix ──► accept / retry / ROLL BACK
                                      structure · images ·      • re-scan: violation gone,        │
                                      forms · ARIA · contrast     nothing new introduced          ▼
                                      (images agent LOOKS at    • content: word & image        conventions
                                      every image; contrast       inventories preserved         memory
                                      agent uses WCAG math,     • pixels: change only where       │
                                      not vibes)                  this fix was allowed            ▼
                                                                                          beyond-scanner
        fixed site  ◄──  evidence report  ◄──  human review queue  ◄──────────────────  expert reviewer
        (sandboxed       (before/after,        (every judgment call                     (hunts what axe
        working copy)     honest scope)         ships a drafted fix)                     can't see)
```

Full architecture with the component-by-component rationale: [docs/architecture.md](docs/architecture.md). Every design choice answers a *documented* failure mode of LLM accessibility repair - the mapping table is in [docs/research/prior-art.md](docs/research/prior-art.md).

Three principles carry the design:

1. **Models supply judgment; tools supply facts.** Contrast fixes come from luminance math that finds the closest compliant color while preserving the brand hue. Alt text may only be written after the agent has *rendered and looked at* the image. Scans are axe-core, not self-assessment.
2. **The verifier is not the fixer.** Acceptance is decided by deterministic re-scans and content inventories the model can't argue with. Failed fixes roll back automatically.
3. **Honesty is the product.** Automation covers ~57% of issues by volume (Deque). StepFree claims verified fixes for the detectable layer and routes the judgment layer to humans with drafted fixes - the exact claim discipline the FTC fined the market leader for lacking.

## Quickstart

```bash
cd stepfree && npm install && npx playwright install chromium && cd ..
export ANTHROPIC_API_KEY=sk-ant-...

node stepfree/eval/selftest.mjs                                        # deterministic core, ~30s
node stepfree/src/cli.mjs fix fixtures/08-shelter --out runs/demo      # one full run, ~6 min, ≈$1
open runs/demo/report.html                                             # the deliverable
```

Full clean-environment walkthrough, including the entire evaluation: **[REPRODUCTION.md](REPRODUCTION.md)**.

## Measured results

12 synthetic small-business sites (13 pages), **134 scanner-verified WCAG A/AA violation instances**, ground truth locked before any run. Baseline = the same model (`claude-sonnet-5`), one direct prompt, no tools. Full methodology and tables: **[EVALUATION.md](EVALUATION.md)**; raw JSON: `stepfree/eval/results/`.

**The finding we didn't expect - reported plainly:** the one-shot baseline remediated **134/134** scanner-detectable instances with zero regressions. On small static pages, frontier-model capability on the *scanner-visible* layer is saturated. The layers that decide whether a real person can use the site are where the systems separate:

| | Baseline (one-shot) | StepFree (final) |
|---|---|---|
| WCAG A/AA instances remediated & verified | 134/134 | 134/134 - and **13/13 pages shippable** (clean + undamaged + verified) |
| Alt-text truthfulness (vision-judged 0-2, Opus judge) | 1.53 - **4 hallucinated/destructive alts** | **1.80** (v3: 1.83) - **no fabricated content in any run**. All four deductions are enumerated in EVALUATION.md: two contested decorative calls on menu illustrations (the judge itself scored the same decision 1 or 0 across judging runs), and two attorney portraits scored 1 where the alt describes the link destination - which is *correct* WCAG practice for a linked image; the judge wasn't shown the surrounding markup |
| Hidden-content incidents (informative content silenced with `alt=""`) | **1 of 2 runs** - incl. the clinic's booking phone number | **0** - the image agent must render and look at every image before writing |
| Run-to-run stability of the above | a coin flip (run 1 silenced the infographic; run 2 didn't) | grounded by construction - perception precedes assertion |
| Scanner-invisible issues surfaced (images-of-text, fake buttons, keyboard traps) | 0 by definition | **32** - including **all 5 planted traps** (image-of-text hero, div-soup dropdown, `<span onclick>` fake button, both fake `<div>` buttons), each with a drafted fix |
| Evidence produced | none - you ship on faith | before/after report, per-fix verification, full agent trajectories |
| Cost per 13-page corpus (measured) | $2.03 | $5.78 (~$0.48/site) |

The exhibits behind those rows (the invented "two wine glasses", the fabricated groundbreaking ceremony, the silenced infographic with the phone number in it) are in [EVALUATION.md](EVALUATION.md) with the judge's reasoning per image.

## The improvement changelog

Six reproducible configurations, each isolating one mechanism, each measured identically - plus the experiment we removed (a strict visual-diff gate) with the controlled demo of *why* (pixel area measures reflow, not harm): **[CHANGELOG.md](CHANGELOG.md)**.

## Main failure mode & hot take

**The failure mode we found: confident blindness.** The baseline never "failed" in the way dashboards measure - it failed by *asserting things it had no way to know*: describing images it couldn't see ("golden butter croissant, flaky layers" for a file it never opened), and hiding an infographic containing a phone number behind `alt=""` - a change the scanner scores as an improvement.

**The hot take:** we built verification armor expecting to catch a clumsy model, and the model never stumbled where we watched. In 2026, *agentic scaffolding isn't primarily there to make models capable - it's there to make their failures visible, bounded, and impossible to ship silently.* Capability saturated; trust didn't. And a lesson our own tooling taught us mid-project (we shipped a broken image renderer; details in the changelog): when our vision judge couldn't see an image it said *"I cannot honestly score this"* - when the ungrounded baseline couldn't see an image it invented a croissant. **Groundedness is an architecture property, not a model property.** Build the workflow so that perception must precede assertion, and the hallucination class disappears instead of being caught.

## Commercial reality (why this is a company, not a demo)

- **Wedge:** $149 one-time "fix & prove" per site; $49/mo continuous monitoring; $499/mo agency tier (20 sites). Measured COGS **≈$0.50 per site run** → >90% gross margin at the wedge price.
- **Who pays first:** web agencies - they hold thousands of 2019-era SMB sites and already field the "we got a demand letter" call. One agency = hundreds of sites.
- **Market:** digital-accessibility software heading to ~$1B by 2030; incumbents making $40-50M/yr (AudioEye, accessiBe) prove willingness to pay - for products that *don't fix the code*. The FTC action and 1,000+ suits/year against widget users are the wind at the back of "actually fix it".
- **Moat:** anyone can prompt a model to fix HTML. The verification stack, the evidence trail, and the honesty posture are what a stranger can trust with their production site - and what survives a legal letter.

Details and every cited figure: [docs/research/market-evidence.md](docs/research/market-evidence.md) · one-page pitch: [docs/pitch/](docs/pitch/).

## Ground rules compliance (what existed before vs. what we added)

**Pre-existing components:** [axe-core](https://github.com/dequelabs/axe-core) (scanner, MPL-2.0), [Playwright](https://playwright.dev) (browser automation, Apache-2.0), [pixelmatch](https://github.com/mapbox/pixelmatch) (pixel diffing, ISC), [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview) (agent runtime), Claude models via API. All used per their licenses/terms.

**Built for this hackathon (everything else):** the orchestrator and verification loop, the integrity/geometry/word-inventory checks, the brand-preserving contrast solver, the five specialists and their knowledge files, the custom tool layer, conventions memory, the review lane, the report generator, the 12-fixture corpus with locked ground truth, the staged evaluation harness, the alt-truthfulness judge, and all documentation.

**Safety (ground rules 4-5):** every run edits a sandboxed working copy - the input site is never touched; deploying is a human's explicit act. Agents have no shell and no network; a permission guard denies file access outside the working copy. Judgment calls ship to a human reviewer with drafted fixes and confidence levels. All fixture data is synthetic; no real business is named as non-compliant; no credentials anywhere.

**AI use, disclosed:** this is an agentic-workflows hackathon and we used the tool under evaluation to build the tool - Claude agents wrote code, fixtures, and analysis under Shivam's direction and iteration, with every quantitative claim produced by the deterministic harness rather than by any model's say-so.

## Repository map

```
README.md                 ← you are here: problem, solution, results
CHANGELOG.md              ← the improvement story, stage by stage, with evidence
EVALUATION.md             ← metrics defined up front, full results, limitations
REPRODUCTION.md           ← clean-environment guide (commands, versions, costs)
stepfree/                 ← the product: src/ (orchestrator, agents, tools, report),
                            knowledge/ (specialist expertise), baseline/, eval/
fixtures/                 ← 12 synthetic small-business sites + locked ground truth
trajectories/             ← representative agent trajectories (readable + raw JSONL)
reports/                  ← sample generated audit report + evidence
docs/                     ← architecture, research dossiers (all citations), pitch
```

---

*StepFree - because the web should be step-free. Curb cuts were built for wheelchairs; everyone with a stroller, a suitcase, or a delivery cart uses them. Fix the code and everybody walks in.*
