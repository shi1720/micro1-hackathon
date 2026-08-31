# Trajectory: forms:index.html:r1

**Page:** `index.html`  
**Task:** Forms, labels & accessible names  
**Started:** 2026-08-31T12:03:07.639Z

## Instructions given to the agent

<details><summary>System prompt</summary>

```
You are StepFree's "Forms, labels & accessible names" specialist — an expert accessibility engineer fixing real WCAG violations in a small business's website source code.

Working rules (non-negotiable):
- You are editing a SANDBOXED working copy; the original site is untouched. Still, edit with production care.
- Preserve the page's visual design and all its content: never delete visible text or images, never change copy, never alter where links go or what forms submit. Your diff should be the smallest one that fixes the assigned issues.
- After making your fixes, run scan_file on the page and confirm every assigned violation is resolved and NO new violations appeared. Deterministic verification will re-check everything you claim.
- If an assigned issue requires a judgment call you cannot ground in the page itself, make your best safe fix AND flag_for_review with your reasoning — or flag without fixing if no safe fix exists.
- Do not fix issues assigned to other specialists unless your change resolves them incidentally.

## Your expertise
# Forms, labels & accessible names — fix guide

Your scope: `label`, `select-name`, `button-name`, `link-name`, `input-button-name`, `form-field-multiple-labels`, `autocomplete-valid`.

## Labels (`label`, `select-name`)

Preference order — use the FIRST that fits the existing design:

1. **A visible text label already sits next to the control** → associate it: `<label for="phone">Phone</label>` + `id="phone"`. This is the best fix: visible labels help everyone (WCAG 3.3.2), including voice-control users.
2. **Nearby text exists but isn't a `<label>`** (a heading, a table cell, a styled `<div>` naming the field) → convert that text into a real `<label for>` keeping its exact styling (move the class onto the label, or add a CSS rule so rendering is identical).
3. **Nothing visible names the field** → add `aria-label` with the field's evident purpose ("Email address" for the input beside a "Sign up" button).
4. Note: axe accepts a placeholder as an accessible name, so placeholder-only inputs won't appear in your assigned list — but if you touch one anyway, know that placeholders disappear on input; a real label is the better fix. Never label with `title` alone.

Label text = what the user must enter ("Preferred appointment time"), not instructions ("Click to select").

## Buttons (`button-name`)

Icon-only buttons need an accessible name that states the ACTION:
- `<button aria-label="Search">` for a magnifier, `aria-label="Previous testimonial"` / `"Next testimonial"` for arrows, `aria-label="Add Ember No. 4 to wishlist"` for a heart on a product card (include the item when identifiable — "Add to wishlist" ×6 is useless in a rotor list).
- If the button contains an `<svg>`, also add `aria-hidden="true"` (or `focusable="false"`) to the svg so the icon doesn't leak junk to AT.

## Links (`link-name`)

- Icon-only social links: `aria-label` naming the destination — `aria-label="Wildflour Bakery on Instagram"`.
- A link whose only content is an image: fix the image's alt to describe the destination (that becomes the link name).
- Repeated "→" or "Read more" links: name them per target, e.g. `aria-label="Read more: Council approves bike lanes"` — screen-reader users navigate by a list of link names.

## `autocomplete-valid`

Use tokens from the HTML spec: `name`, `email`, `tel`, `street-address`, `postal-code`… Fix invalid values, don't delete the attribute.

## Never

- Never remove a control to silence a rule.
- Never give two controls the same accessible name if they do different things.
- Never change what a form submits (names/values/action) — only how it is labeled.

```

</details>

**Task prompt:**

```
Fix the following accessibility violations in `index.html` (a self-contained HTML page in your working directory).

## Site conventions already agreed (FOLLOW these exactly; record new ones with record_convention)
- h1:hero-title-image: Wrap the decorative hero title image (images/hero-title.svg) in an <h1>, and give it alt text matching the rendered heading copy ("Host unforgettable events at The Foundry") instead of alt="". (Page had no h1 (page-has-heading-one); the hero image is the visual page title, so promoting it to a real h1 with descriptive alt text (rather than a separate hidden h1) preserves design and gives the heading an accessible name.)
- alt-style:informative-space-images: "The [Space Name] [scene]: [key visual details]" — mirrors the pattern already used for the Main Hall image, keeps room name + concrete details, no "image of". (Establishes a consistent alt-text pattern for the three space photos (Main Hall, Loft, Courtyard) so future edits stay uniform.)

## Assigned violations (from axe-core)
- button-name (critical, wcag) — Buttons must have discernible text
    - selector: .to-top
      html: <button class="to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1509" stroke-width="3"><path d="M4 15 L12 7 L20 15"></path></svg></button>
      why: Fix any of the following:   Element does not have inner text that is visible to screen readers   aria-label attribute does not exist or is empty

Read the file, understand the design, apply your fixes, then verify with scan_file that all assigned violations are gone and nothing new was introduced. Finish with a one-paragraph summary of exactly what you changed and why.
```

> Model: `claude-sonnet-5` — available tools: `Edit`, `Glob`, `Grep`, `Read`, `Write`, `mcp__stepfree__check_contrast`, `mcp__stepfree__contrast_suggest`, `mcp__stepfree__flag_for_review`, `mcp__stepfree__record_convention`, `mcp__stepfree__scan_file`, `mcp__stepfree__view_image`, `mcp__stepfree__view_page`

**🔧 Tool call — `Grep`**
```json
{
  "pattern": "to-top",
  "path": "index.html",
  "output_mode": "content",
  "-n": true
}
```

<details><summary>↩️ Tool result</summary>

```
55:  .to-top { position: fixed; right: 26px; bottom: 26px; width: 46px; height: 46px; background: #b87333; border: 0; cursor: pointer; }
175:  <button class="to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1509" stroke-width="3"><path d="M4 15 L12 7 L20 15"/></svg></button>
```

</details>

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "  <button class=\"to-top\" onclick=\"window.scrollTo({top:0,behavior:'smooth'})\"><svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#1d1509\" stroke-width=\"3\"><path d=\"M4 15 L12 7 L20 15\"/></svg></button>",
  "new_string": "  <button class=\"to-top\" aria-label=\"Back to top\" onclick=\"window.scrollTo({top:0,behavior:'smooth'})\"><svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#1d1509\" stroke-width=\"3\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M4 15 L12 7 L20 15\"/></svg></button>"
}
```

<details><summary>↩️ Tool result</summary>

```
The file index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🔧 Tool call — `mcp__stepfree__scan_file`**
```json
{
  "path": "index.html"
}
```

<details><summary>↩️ Tool result</summary>

```
WCAG A/AA violations: 5 instance(s) | best-practice: 0

[wcag] aria-hidden-focus (serious) — ARIA hidden element must not be focusable or contain focusable elements
  • .scroll-cue
    <div class="scroll-cue" aria-hidden="true"><a href="#spaces">▾</a></div>

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

**🤖 Agent:** Button-name violation is resolved and no new violations were introduced (the remaining `aria-hidden-focus` and `color-contrast` issues are pre-existing and outside my assigned scope for other specialists). Summary: I fixed the icon-only `.to-top` "scroll to top" button by adding `aria-label="Back to top"` describing its action, and added `aria-hidden="true" focusable="false"` to its inner SVG so the decorative arrow icon doesn't leak redundant content to assistive technology — matching the guide's icon-button pattern without changing the button's visual design or click behavior.

---
**Run result:** success — 4 turns, 10.6s, $0.0236

**🛡️ Orchestrator verification (deterministic):** forms r1: fixed 1, introduced 0, assigned-remaining 0, integrity OK