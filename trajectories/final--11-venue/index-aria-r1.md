# Trajectory: aria:index.html:r1

**Page:** `index.html`  
**Task:** ARIA repair  
**Started:** 2026-08-31T12:03:23.446Z

## Instructions given to the agent

<details><summary>System prompt</summary>

```
You are StepFree's "ARIA repair" specialist — an expert accessibility engineer fixing real WCAG violations in a small business's website source code.

Working rules (non-negotiable):
- You are editing a SANDBOXED working copy; the original site is untouched. Still, edit with production care.
- Preserve the page's visual design and all its content: never delete visible text or images, never change copy, never alter where links go or what forms submit. Your diff should be the smallest one that fixes the assigned issues.
- After making your fixes, run scan_file on the page and confirm every assigned violation is resolved and NO new violations appeared. Deterministic verification will re-check everything you claim.
- If an assigned issue requires a judgment call you cannot ground in the page itself, make your best safe fix AND flag_for_review with your reasoning — or flag without fixing if no safe fix exists.
- Do not fix issues assigned to other specialists unless your change resolves them incidentally.

## Your expertise
# ARIA repair — fix guide

Your scope: `aria-hidden-focus`, `aria-required-attr`, `aria-valid-attr-value`, `aria-valid-attr`, `aria-allowed-attr`, `aria-allowed-role`, `aria-roles`, `aria-command-name`, `aria-toggle-field-name`, `scrollable-region-focusable`, `frame-title`, `nested-interactive`.

## The first rule of ARIA

**No ARIA is better than bad ARIA** (W3C). Pages using ARIA average ~41% MORE detected errors than pages without (WebAIM Million). Your default move is to REMOVE or CORRECT wrong ARIA — adding new roles is a last resort, and native HTML elements always win over role attributes.

## Rule-by-rule

- **`aria-hidden-focus`** (aria-hidden element contains focusable children): decide what the element IS.
  - Genuinely hidden/decorative for everyone → also make children unfocusable (`tabindex="-1"` on links/buttons inside) or hide interactively (`inert`), keeping the visual unchanged.
  - Actually meaningful content wrongly hidden from AT (common: a promo/banner someone hid to quiet a scanner) → remove the `aria-hidden="true"`; the content should be exposed. Look at the rendered page (`view_page`) to judge which case you're in; if still ambiguous, fix conservatively (remove `aria-hidden`) and `flag_for_review`.
- **`aria-required-attr`**: a role promised state it doesn't declare (e.g. `role="checkbox"` without `aria-checked`). The BEST fix is usually the native element: replace `<div role="checkbox">` with a real `<input type="checkbox">` + label, styled to match. If the div carries JS behavior you'd break, add the missing attribute (`aria-checked="false"`) AND `flag_for_review` noting the element still lacks keyboard support.
- **`aria-valid-attr-value` / `aria-valid-attr` / `aria-allowed-attr`**: correct obvious typos (`aria-lable` → `aria-label`; `aria-labelledby` pointing at a missing id → point at the right id or switch to `aria-label`). If the attribute serves no purpose, delete it.
- **`frame-title`**: give iframes a `title` describing their content ("Map to our office").
- **`scrollable-region-focusable`**: add `tabindex="0"` to the scrollable container (with a role and name if it's a meaningful region).
- **`nested-interactive`**: unwrap — a button inside a link is two fights in one element; keep the outer or inner control, whichever matches the visual intent, without losing either destination/action.

## Never

- Never add `aria-hidden="true"` to anything visible to silence a rule.
- Never add a `role` that duplicates the native element's role.
- Never leave a custom widget half-ARIA'd: state attributes without keyboard behavior mislead worse than nothing — that's what `flag_for_review` is for.

```

</details>

**Task prompt:**

```
Fix the following accessibility violations in `index.html` (a self-contained HTML page in your working directory).

## Site conventions already agreed (FOLLOW these exactly; record new ones with record_convention)
- h1:hero-title-image: Wrap the decorative hero title image (images/hero-title.svg) in an <h1>, and give it alt text matching the rendered heading copy ("Host unforgettable events at The Foundry") instead of alt="". (Page had no h1 (page-has-heading-one); the hero image is the visual page title, so promoting it to a real h1 with descriptive alt text (rather than a separate hidden h1) preserves design and gives the heading an accessible name.)
- alt-style:informative-space-images: "The [Space Name] [scene]: [key visual details]" — mirrors the pattern already used for the Main Hall image, keeps room name + concrete details, no "image of". (Establishes a consistent alt-text pattern for the three space photos (Main Hall, Loft, Courtyard) so future edits stay uniform.)

## Assigned violations (from axe-core)
- aria-hidden-focus (serious, wcag) — ARIA hidden element must not be focusable or contain focusable elements
    - selector: .scroll-cue
      html: <div class="scroll-cue" aria-hidden="true"><a href="#spaces">▾</a></div>
      why: Fix all of the following:   Focusable content should have tabindex="-1" or be removed from the DOM

Read the file, understand the design, apply your fixes, then verify with scan_file that all assigned violations are gone and nothing new was introduced. Finish with a one-paragraph summary of exactly what you changed and why.
```

> Model: `claude-sonnet-5` — available tools: `Edit`, `Glob`, `Grep`, `Read`, `Write`, `mcp__stepfree__check_contrast`, `mcp__stepfree__contrast_suggest`, `mcp__stepfree__flag_for_review`, `mcp__stepfree__record_convention`, `mcp__stepfree__scan_file`, `mcp__stepfree__view_image`, `mcp__stepfree__view_page`

**🔧 Tool call — `Grep`**
```json
{
  "pattern": "scroll-cue",
  "path": "index.html",
  "output_mode": "content",
  "-n": true
}
```

<details><summary>↩️ Tool result</summary>

```
30:  .scroll-cue { text-align: center; margin-top: 46px; }
31:  .scroll-cue a { color: #b87333; font-size: 26px; text-decoration: none; display: inline-block; padding: 6px 16px; }
89:      <div class="scroll-cue" aria-hidden="true"><a href="#spaces">&#9662;</a></div>
```

</details>

**🔧 Tool call — `Read`**
```json
{
  "file_path": "index.html",
  "offset": 70,
  "limit": 30
}
```

<details><summary>↩️ Tool result</summary>

```
70	          <a href="#main-hall">The Main Hall</a>
71	          <a href="#loft">The Loft</a>
72	          <a href="#courtyard">The Courtyard</a>
73	        </div>
74	      </div>
75	      <a href="#included">What's included</a>
76	      <a href="#book">Book</a>
77	    </nav>
78	  </div>
79	</header>
80	<main>
81	  <div class="hero">
82	    <div class="wrap">
83	      <h1><img src="images/hero-title.svg" alt="Host unforgettable events at The Foundry"></h1>
84	      <p>A 1912 iron foundry on the river, stripped to its bones and rebuilt for celebrations. Exposed brick, forty-foot trusses, and staff who have seen every kind of party go right.</p>
85	      <div class="actions">
86	        <a class="btn" href="#book">Check availability</a>
87	        <span class="btn-ghost" onclick="location.href='virtual-tour.html'">Take the virtual tour</span>
88	      </div>
89	      <div class="scroll-cue" aria-hidden="true"><a href="#spaces">&#9662;</a></div>
90	    </div>
91	  </div>
92	
93	  <section id="spaces">
94	    <div class="wrap">
95	      <h2>Three rooms, one address</h2>
96	      <p class="lede">Rent one space or run the whole building. Every hire includes tables, chairs, and a floor plan session with our events team three weeks out.</p>
97	      <div class="spaces">
98	        <div class="space" id="main-hall">
99	          <img src="images/main-hall.svg" alt="The Main Hall set for a reception: long tables under steel roof trusses and rows of string lights">
```

</details>

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "      <div class=\"scroll-cue\" aria-hidden=\"true\"><a href=\"#spaces\">&#9662;</a></div>",
  "new_string": "      <div class=\"scroll-cue\"><a href=\"#spaces\" aria-label=\"Scroll to spaces\">&#9662;</a></div>"
}
```

<details><summary>↩️ Tool result</summary>

```
The file index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🤖 Agent:** This scroll-cue arrow is a real, visible, functional link to `#spaces` (not decorative), so the correct fix per the scoping rule is to expose it rather than making it unfocusable. I removed `aria-hidden="true"` from the `.scroll-cue` div and added `aria-label="Scroll to spaces"` to the anchor so assistive tech gets a clear accessible name for the glyph-only link (▾), preserving the visual design exactly.

**🔧 Tool call — `mcp__stepfree__scan_file`**
```json
{
  "path": "index.html"
}
```

<details><summary>↩️ Tool result</summary>

```
WCAG A/AA violations: 4 instance(s) | best-practice: 0

[wcag] color-contrast (serious) — Elements must meet minimum color contrast ratio thresholds
  • #main-hall > .space-body > .specs
    <p class="specs">Seats 180 · Standing 250 · 4,100 sq ft</p>
  • #loft > .space-body > .specs
    <p class="specs">Seats 60 · Standing 90 · 1,400 sq ft</p>
  • #courtyard > .space-body > .specs
    <p class="specs">Standing 120 · Covered bar · 2,000 sq ft</p>
  • .reach
    <p class="reach">(555) 014-7788 · events@thefoundryhall.example</p>
```

</details>

**🤖 Agent:** The `aria-hidden-focus` violation is resolved — no new violations were introduced by my change. The remaining `color-contrast` issues are outside my assigned scope (belongs to a color/contrast specialist), so I'm leaving those untouched.

**Summary:** Fixed the `aria-hidden-focus` violation on `.scroll-cue`. The div contained a real, visible link (▾ scroll-down arrow to `#spaces`) that was wrongly marked `aria-hidden="true"`, hiding a functional, focusable control from assistive tech while still leaving it in the tab order — the exact conflict axe flags. Since this is genuine functional content (not decorative), I removed the `aria-hidden="true"` attribute and added `aria-label="Scroll to spaces"` to the anchor so screen reader users get a meaningful name for the glyph-only link, with no change to visual appearance or behavior. Verified via `scan_file` that this violation no longer appears and no new violations were introduced.

---
**Run result:** success — 5 turns, 17.5s, $0.0334

**🛡️ Orchestrator verification (deterministic):** aria r1: fixed 1, introduced 0, assigned-remaining 0, integrity OK