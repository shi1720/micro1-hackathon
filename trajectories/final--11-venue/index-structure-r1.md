# Trajectory: structure:index.html:r1

**Page:** `index.html`  
**Task:** Structure & semantics  
**Started:** 2026-08-31T12:02:02.992Z

## Instructions given to the agent

<details><summary>System prompt</summary>

```
You are StepFree's "Structure & semantics" specialist — an expert accessibility engineer fixing real WCAG violations in a small business's website source code.

Working rules (non-negotiable):
- You are editing a SANDBOXED working copy; the original site is untouched. Still, edit with production care.
- Preserve the page's visual design and all its content: never delete visible text or images, never change copy, never alter where links go or what forms submit. Your diff should be the smallest one that fixes the assigned issues.
- After making your fixes, run scan_file on the page and confirm every assigned violation is resolved and NO new violations appeared. Deterministic verification will re-check everything you claim.
- If an assigned issue requires a judgment call you cannot ground in the page itself, make your best safe fix AND flag_for_review with your reasoning — or flag without fixing if no safe fix exists.
- Do not fix issues assigned to other specialists unless your change resolves them incidentally.

## Your expertise
# Document structure & semantics — fix guide

Your scope: `html-has-lang`, `html-lang-valid`, `document-title`, `meta-viewport`, `list`, `listitem`, `heading-order`, `page-has-heading-one`, `landmark-one-main`, `region`, `empty-heading`, `tabindex`, `duplicate-id`, `duplicate-id-aria`.

## Safe mechanical fixes (do these directly)

- **`html-has-lang` / `html-lang-valid`**: set `lang` on `<html>` to the BCP-47 code of the page's actual language (`en`, not `english`, not `en-english`). Read the copy to confirm the language.
- **`document-title`**: write a `<title>` of the form "Primary purpose — Business name" derived from the page's own h1/branding (e.g. `Menu — Osteria del Ponte`). Never invent claims that aren't on the page.
- **`meta-viewport`**: remove `user-scalable=no` and any `maximum-scale` below 5. Keep `width=device-width, initial-scale=1`. Low-vision users must be able to pinch-zoom (WCAG 1.4.4).
- **`tabindex`**: replace any positive `tabindex` with `0` (or remove it if the element is natively focusable). Positive values hijack focus order.

## Fixes that need care

- **`list` / `listitem`**: `<li>` must have a `<ul>`/`<ol>` parent. Prefer wrapping the existing `<li>` run in a `<ul>` and moving any layout classes from a wrapper `<div>` onto the `<ul>` (add `list-style:none; margin:0; padding:0` if the design showed no bullets). Do NOT convert `<li>` to `<div>` — that destroys semantics instead of repairing them.
- **`heading-order`**: headings must descend without skips (h1 → h2 → h3). Retag the heading to the correct level and preserve its VISUAL size by carrying the old styling (e.g. `<h2 class="section-title">` keeping the class, or adding a font-size rule for the new tag). A retag that changes rendered size will be caught by visual verification.
- **`landmark-one-main` / `region`**: wrap the main content in `<main>`, keep header/nav/footer in `<header>`/`<nav>`/`<footer>`. Add landmarks around existing markup — never reorder content. If CSS targets `body > div`-style selectors, update those selectors to keep rendering identical.
- **`duplicate-id`**: rename the *less-referenced* id and update every reference (`for=`, `href="#..."`, `aria-labelledby`, CSS `#id`, JS `getElementById`) — search the whole file before renaming.
- **`empty-heading`**: if the heading is decorative leftover, remove the empty tag; if a heading is genuinely missing, write one that reflects the section's content.

## Never

- Never remove visible content to silence a rule.
- Never change heading text while retagging.
- Never add `role` attributes when a native element (`<main>`, `<nav>`, `<button>`) does the job.

```

</details>

**Task prompt:**

```
Fix the following accessibility violations in `index.html` (a self-contained HTML page in your working directory).

## Site conventions
None recorded yet — record any site-wide decision you make with record_convention.

## Assigned violations (from axe-core)
- meta-viewport (moderate, wcag) — Zooming and scaling must not be disabled
    - selector: meta[name="viewport"]
      html: <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      why: Fix any of the following:   user-scalable=no on <meta> tag disables zooming on mobile devices
- page-has-heading-one (moderate, best-practice) — Page should contain a level-one heading
    - selector: html
      html: <html lang="en">
      why: Fix all of the following:   Page must have a level-one heading
- tabindex (serious, best-practice) — Elements should not have tabindex greater than zero
    - selector: .btn
      html: <a class="btn" href="#book" tabindex="1">Check availability</a>
      why: Fix any of the following:   Element has a tabindex greater than 0

Read the file, understand the design, apply your fixes, then verify with scan_file that all assigned violations are gone and nothing new was introduced. Finish with a one-paragraph summary of exactly what you changed and why.
```

> Model: `claude-sonnet-5` — available tools: `Edit`, `Glob`, `Grep`, `Read`, `Write`, `mcp__stepfree__check_contrast`, `mcp__stepfree__contrast_suggest`, `mcp__stepfree__flag_for_review`, `mcp__stepfree__record_convention`, `mcp__stepfree__scan_file`, `mcp__stepfree__view_image`, `mcp__stepfree__view_page`

**🔧 Tool call — `Read`**
```json
{
  "file_path": "index.html"
}
```

<details><summary>↩️ Tool result</summary>

```
1	<!DOCTYPE html>
2	<html lang="en">
3	<head>
4	<meta charset="utf-8">
5	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
6	<title>The Foundry Event Hall — Weddings, galas &amp; corporate events</title>
7	<style>
8	  * { box-sizing: border-box; margin: 0; padding: 0; }
9	  body { font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; background: #2f3640; color: #e8e4dc; line-height: 1.6; }
10	  h2, h3, .brand { font-family: Georgia, "Times New Roman", serif; font-weight: normal; }
11	  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
12	  header { border-bottom: 1px solid #454d59; background: #2f3640; }
13	  .bar { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
14	  .brand { font-size: 24px; letter-spacing: 4px; text-transform: uppercase; color: #e8e4dc; text-decoration: none; }
15	  .brand span { color: #b87333; }
16	  .menu { display: flex; align-items: center; gap: 6px; }
17	  .menu a { color: #e8e4dc; text-decoration: none; font-size: 14.5px; letter-spacing: 1px; padding: 10px 14px; display: inline-block; }
18	  .menu a:hover { color: #b87333; }
19	  .nav-drop { position: relative; color: #e8e4dc; font-size: 14.5px; letter-spacing: 1px; padding: 10px 14px; cursor: pointer; }
20	  .nav-drop .caret { font-size: 11px; color: #b87333; padding-left: 4px; }
21	  .drop-menu { display: none; position: absolute; top: 100%; left: 0; min-width: 200px; background: #262d38; border: 1px solid #454d59; padding: 8px 0; z-index: 5; }
22	  .nav-drop.open .drop-menu { display: block; }
23	  .drop-menu a { display: block; padding: 11px 18px; }
24	  .hero { text-align: center; padding: 96px 0 72px; background: #262d38; }
25	  .hero img { max-width: 640px; width: 90%; display: block; margin: 0 auto 26px; }
26	  .hero p { max-width: 56ch; margin: 0 auto 34px; font-size: 18px; color: #aab2bd; }
27	  .actions { display: flex; gap: 18px; justify-content: center; align-items: center; }
28	  .btn { display: inline-block; background: #b87333; color: #1d1509; text-decoration: none; padding: 14px 32px; font-size: 15px; letter-spacing: 1.5px; text-transform: uppercase; }
29	  .btn-ghost { display: inline-block; color: #e8e4dc; border: 1px solid #b87333; padding: 13px 30px; font-size: 15px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; }
30	  .scroll-cue { text-align: center; margin-top: 46px; }
31	  .scroll-cue a { color: #b87333; fon
```

</details>

**🔧 Tool call — `mcp__stepfree__view_image`**
```json
{
  "path": "images/hero-title.svg"
}
```

**🔧 Tool call — `mcp__stepfree__view_page`**
```json
{
  "path": "index.html"
}
```

<details><summary>↩️ Tool result</summary>

```
Rendered images/hero-title.svg:
[image]
```

</details>

<details><summary>↩️ Tool result</summary>

```
Viewport screenshot of index.html:
[image]
```

</details>

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no\">",
  "new_string": "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
}
```

<details><summary>↩️ Tool result</summary>

```
The file index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "        <a class=\"btn\" href=\"#book\" tabindex=\"1\">Check availability</a>",
  "new_string": "        <a class=\"btn\" href=\"#book\">Check availability</a>"
}
```

<details><summary>↩️ Tool result</summary>

```
The file index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "      <img src=\"images/hero-title.svg\" alt=\"\">",
  "new_string": "      <h1><img src=\"images/hero-title.svg\" alt=\"Host unforgettable events at The Foundry\"></h1>"
}
```

<details><summary>↩️ Tool result</summary>

```
The file index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🤖 Agent:** Now let's add minimal CSS reset so the h1 doesn't introduce default margins that break layout (since `*` already resets margins globally, h1 inherits margin:0 from the universal selector, so no visual change). Let's verify and scan.

**🔧 Tool call — `mcp__stepfree__scan_file`**
```json
{
  "path": "index.html"
}
```

**🔧 Tool call — `mcp__stepfree__view_page`**
```json
{
  "path": "index.html"
}
```

<details><summary>↩️ Tool result</summary>

```
WCAG A/AA violations: 8 instance(s) | best-practice: 0

[wcag] aria-hidden-focus (serious) — ARIA hidden element must not be focusable or contain focusable elements
  • .scroll-cue
    <div class="scroll-cue" aria-hidden="true"><a href="#spaces">▾</a></div>

[wcag] button-name (critical) — Buttons must have discernible text
  • .to-top
    <button class="to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1509" stroke-width="3"><path d="M4 15 L12 7 L20 15"></path></svg></button

[wcag] color-contrast (serious) — Elements must meet minimum color contrast ratio thresholds
  • #main-hall > .space-body > .specs
    <p class="specs">Seats 180 · Standing 250 · 4,100 sq ft</p>
  • #loft > .space-body > .specs
    <p class="specs">Seats 60 · Standing 90 · 1,400 sq ft</p>
  • #courtyard > .space-body > .specs
    <p class="specs">Standing 120 · Covered bar · 2,000 sq ft</p>
  • .reach
    <p class="reach">(555) 014-7788 · events@thefoundryhall.example</p>

[wcag] image-alt (critical) — Images must have alternative text
  • img[src$="loft.svg"]
    <img src="images/loft.svg">
  • img[src$="courtyard.svg"]
    <img src="images/courtyard.svg">
```

</details>

<details><summary>↩️ Tool result</summary>

```
Viewport screenshot of index.html:
[image]
```

</details>

**🤖 Agent:** All three assigned violations (meta-viewport, page-has-heading-one, tabindex) are resolved. The remaining reported issues (aria-hidden-focus, button-name, color-contrast, image-alt) are outside my assigned scope and belong to other specialists, and my changes didn't introduce them — visual layout is unchanged. Let's record the convention and finish.

**🔧 Tool call — `mcp__stepfree__record_convention`**
```json
{
  "key": "h1:hero-title-image",
  "value": "Wrap the decorative hero title image (images/hero-title.svg) in an <h1>, and give it alt text matching the rendered heading copy (\"Host unforgettable events at The Foundry\") instead of alt=\"\".",
  "rationale": "Page had no h1 (page-has-heading-one); the hero image is the visual page title, so promoting it to a real h1 with descriptive alt text (rather than a separate hidden h1) preserves design and gives the heading an accessible name."
}
```

<details><summary>↩️ Tool result</summary>

```
Convention recorded: h1:hero-title-image → Wrap the decorative hero title image (images/hero-title.svg) in an <h1>, and give it alt text matching the rendered heading copy ("Host unforgettable events at The Foundry") instead of alt="".
```

</details>

**🤖 Agent:** **Summary:** I fixed the three assigned violations in `index.html`: (1) **meta-viewport** — removed `maximum-scale=1, user-scalable=no` from the viewport meta tag, keeping only `width=device-width, initial-scale=1`, so low-vision users can pinch-zoom; (2) **page-has-heading-one** — the page had no `<h1>` even though the hero image visually serves as the page title, so I wrapped `images/hero-title.svg` in a new `<h1>` and replaced its empty `alt=""` with descriptive alt text ("Host unforgettable events at The Foundry") matching the rendered copy, giving the heading a real accessible name without changing any visible layout (the global `* { margin:0 }` reset keeps the `<h1>` visually identical to the old bare `<img>`); (3) **tabindex** — removed the invalid `tabindex="1"` from the "Check availability" link so it follows natural DOM focus order instead of being hijacked to the front. I verified with `scan_file` that all three assigned rules now pass and no new violations were introduced by these changes; the remaining findings in the scan (button-name, color-contrast, image-alt on other images, aria-hidden-focus) are pre-existing issues outside my assigned scope for other specialists to address.

---
**Run result:** success — 10 turns, 32.2s, $0.0908

**🛡️ Orchestrator verification (deterministic):** structure r1: fixed 3, introduced 0, assigned-remaining 0, integrity OK