# Prior art & design-input research

*Compiled 2026-08-31 via live web research (agent-assisted). We cite prior art openly: it documents the exact failure modes each stage of StepFree's pipeline is designed to prevent.*

## 1. Existing attempts at AI accessibility repair

| Project | Type | How far it goes |
|---|---|---|
| [AccessGuru](https://arxiv.org/abs/2507.19549) (ASSETS 2025, [code](https://github.com/NadeenAhmad/AccessGuruLLM)) | Research | Detects (axe + LLM) and corrects HTML violations with taxonomy-driven prompting; re-scores fixes; up to 84% avg violation-score decrease. HTML snippets only; no visual regression checks, no rollback pipeline, no orchestration. |
| ["From Blind Edits to Verified Repair"](https://arxiv.org/abs/2608.24913) (ICMI 2026) | Research | Closest to our loop: audit-inject-verify accepts a change only if axe violations strictly decrease, else rolls back. Key finding: **unverified LLM edits produced 24 improvements vs 20 regressions across 100 trials.** CSS-only, runtime-injected, no screenshots/visual diff. |
| [LLM-Based Web Accessibility Repair study](https://arxiv.org/abs/2605.27716) (2026) | Research | Empirical study: LLM repair improved compliance in ~80% of cases but **fully resolved <26%**; **~30% of patches introduced unintended structural changes**; naive iterative refinement raised cost +52% without improving results. |
| [GitHub Copilot accessibility agents](https://accessibility.github.com/documentation/guide/getting-started-with-agents/) | Pilot | Agents run axe-core, open PRs, and deliberately flag subjective items (alt text) for humans. No re-scan verification, no rollback, no visual regression per the docs. |
| [Community-Access/accessibility-agents](https://github.com/Community-Access/accessibility-agents) | OSS | 11 WCAG review agents for coding assistants — review during coding, not a fix-verify-rollback pipeline. |
| [a11y_agent gem](https://rubygems.org/gems/a11y_agent), [qed42/ai-accessibility-checker](https://github.com/qed42/ai-accessibility-checker/), misc hackathon entries | OSS | Scan + suggest/apply; no verification loops or visual guardrails. |

**What we did not find anywhere**: visual-regression + content-integrity guardrails around source-level a11y auto-fixes, per-fix-category visual expectations (a contrast fix must change pixels *only* where it worked), specialist agents per violation class with policy routing (auto / guarded / human), and cross-page convention memory — combined in one system. That integration is StepFree's contribution; each stage exists because a documented failure mode demands it.

## 2. Documented failure modes of LLM a11y fixes → the stage that answers each

| Documented failure | Evidence | StepFree stage that answers it |
|---|---|---|
| Unverified edits regress as often as they improve | 24 improvements vs 20 regressions ([arXiv:2608.24913](https://arxiv.org/html/2608.24913)) | Deterministic re-scan gate: a fix round is only accepted if violations strictly decrease and none are introduced |
| ~30% of patches break page structure | [arXiv:2605.27716](https://arxiv.org/html/2605.27716v1) | Content-integrity guardrails: text-loss, image-loss, geometry, overflow checks with automatic rollback |
| Bad ARIA is worse than no ARIA | [W3C first rule of ARIA](https://www.w3.org/TR/using-aria/#firstrule), [Deque](https://www.deque.com/blog/top-5-rules-of-aria/), WebAIM: pages with ARIA average ~41% more errors | ARIA specialist prefers *removing* invalid ARIA over adding; adding roles requires the guarded policy |
| Hallucinated / useless alt text; screen-reader users detect and abandon AI alt text | [Silktide](https://silktide.com/blog/the-downsides-of-ai-alt-text/), [CHI 2024](https://dl.acm.org/doi/10.1145/3613904.3642325) | Media specialist *looks at the rendered image* (vision) before writing alt; ambiguous images are drafted-for-human, not auto-committed |
| Overlays mask instead of fix; FTC fined the market leader | [FTC](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-order-requires-online-marketer-pay-1-million-deceptive-claims-its-ai-product-could-make-websites), [Overlay Fact Sheet](https://overlayfactsheet.com) (1,031 signatories) | StepFree edits the source in a sandboxed working copy, with human approval before anything ships |
| Passing axe ≠ accessible (automation covers ~57% by volume) | [Deque coverage report](https://www.deque.com/automated-accessibility-coverage-report/) | Beyond-scanner review lane: issues axe cannot see (image-of-text, fake buttons) are detected and routed to humans with drafted fixes |

## 3. Axe rule frequency × fix mechanizability (drives our policy routing)

Frequency: [WebAIM Million](https://webaim.org/projects/million/), [Web Almanac 2025](https://almanac.httparchive.org/en/2025/accessibility). Policy: **auto** (mechanically safe), **guarded** (safe only with verification), **human** (judgment required — draft + review).

| axe rule | WCAG | Prevalence | Policy |
|---|---|---|---|
| `color-contrast` | 1.4.3 | #1 — 83.9% of pages | **guarded** — nearest-compliant color is pure math (our `contrast_suggest` tool), but changes brand look → localized visual diff |
| `image-alt` | 1.1.1 | 53.1% of pages | **guarded/human** — decorative → `alt=""` is safe; meaningful alt = hallucination risk → vision + review flag |
| `label` / `select-name` | 1.3.1/4.1.2 | 51% of pages | **guarded** — associating an existing visible label is mechanical; inventing label text needs care |
| `link-name` / `button-name` | 2.4.4/4.1.2 | 46.3% / 30.6% | **guarded** — name inferrable from href/context/icon |
| `html-has-lang` / `html-lang-valid` | 3.1.1 | 13.5% | **auto** — zero visual impact |
| `document-title` | 2.4.2 | common | **auto** — generate from h1/content |
| `meta-viewport` | 1.4.4 | common | **auto** — remove `user-scalable=no` |
| `heading-order`, `region`, landmarks | 1.3.1/bp | top-3 in Almanac | **guarded** — retagging can restyle text; exactly what visual diff catches |
| `aria-*` family | 4.1.2 | common | **guarded** — removing invalid ARIA safe; adding roles is where LLMs do damage |
| `duplicate-id-aria` | 4.1.2 | common | **guarded** — renaming ids can break JS/CSS → repo-wide reference check |

## 4. Visual regression practice (informs our thresholds)

- Playwright wraps pixelmatch; per-pixel `threshold` (YIQ color distance) defaults to 0.2 in [Playwright](https://playwright.dev/docs/api/class-snapshotassertions); pixelmatch's library default is 0.1 (we use 0.1).
- Common practice: `maxDiffPixelRatio` 0.01–0.025 for strict UI tests; hygiene = disable animations, fixed viewport (we do both).
- **Our adaptation**: a naive "zero visual change" gate is wrong for accessibility fixes — contrast repairs *must* change pixels. StepFree uses per-fix-category expectations: contrast fixes may repaint only inside the touched elements' boxes (+8px pad); structural fixes are held to near-zero out-of-region change. We found no prior tool doing this.

## 5. Naming

The project was nearly named "CurbCut" after the curb-cut effect ([99% Invisible #308](https://99percentinvisible.org/episode/308-curb-cuts/)) — but [Curbcut](https://www.curbcutaccessibility.com/about/) is an existing accessibility remediation company with the same story, so we chose **StepFree** (from "step-free access," the wayfinding term for routes usable without stairs). The curb-cut effect remains the right story: accessible fixes help everyone — clearer labels, readable contrast, working keyboard navigation.
