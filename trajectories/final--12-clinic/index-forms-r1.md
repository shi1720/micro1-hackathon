# Trajectory: forms:index.html:r1

**Page:** `index.html`  
**Task:** Forms, labels & accessible names  
**Started:** 2026-08-31T12:04:33.634Z

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
- html-lang: lang="en" on <html> (Page content is written in English (US clinic site), so BCP-47 code "en" is correct.)
- alt-style:provider-photo: "Dr. [Name], smiling in a white coat with a stethoscope around [his/her] neck" — matches existing Dr. Omar Reyes alt text pattern (Keeps provider photo descriptions consistent across the providers section)

## Assigned violations (from axe-core)
- label (critical, wcag) — Form elements must have labels
    - selector: input[type="text"]
      html: <input type="text" name="name">
      why: Fix any of the following:   Element does not have an implicit (wrapped) <label>   Element does not have an explicit <label>
    - selector: input[type="tel"]
      html: <input type="tel" name="phone">
      why: Fix any of the following:   Element does not have an implicit (wrapped) <label>   Element does not have an explicit <label>
    - selector: textarea
      html: <textarea name="message"></textarea>
      why: Fix any of the following:   Element does not have an implicit (wrapped) <label>   Element does not have an explicit <label>
- link-name (serious, wcag) — Links must have discernible text
    - selector: .icon-link
      html: <a class="icon-link" href="https://facebook.com/lakesidefamilymed"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1z"></path></svg></a>
      why: Fix all of the following:   Element is in tab order and does not have accessible text 

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
5	<meta name="viewport" content="width=device-width, initial-scale=1">
6	<title>Lakeside Family Medicine — Family care in Fairview Heights</title>
7	<style>
8	  * { box-sizing: border-box; margin: 0; padding: 0; }
9	  body { font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; background: #ffffff; color: #24333a; line-height: 1.65; }
10	  .wrap { max-width: 1060px; margin: 0 auto; padding: 0 24px; }
11	  header { border-bottom: 1px solid #dcebe9; }
12	  .bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
13	  .brand { font-size: 21px; font-weight: 600; color: #17605c; text-decoration: none; letter-spacing: .3px; }
14	  .brand small { display: block; font-size: 12px; font-weight: 400; color: #24333a; letter-spacing: 1.5px; text-transform: uppercase; }
15	  nav { display: flex; align-items: center; gap: 4px; }
16	  nav a { color: #24333a; text-decoration: none; font-size: 15px; padding: 10px 13px; display: inline-block; }
17	  nav a:hover { color: #17605c; }
18	  .portal { background: #ffffff; color: #17605c; border: 2px solid #17605c; border-radius: 6px; padding: 9px 18px; font-size: 15px; font-weight: 600; cursor: pointer; margin-left: 10px; }
19	  .hero { display: flex; align-items: center; gap: 52px; padding: 64px 0 58px; }
20	  .hero-copy { flex: 1.15; }
21	  h1 { font-size: 42px; line-height: 1.15; color: #17605c; margin-bottom: 16px; }
22	  .hero-copy > p { font-size: 18px; max-width: 48ch; margin-bottom: 26px; }
23	  .cta-row { display: flex; align-items: center; gap: 20px; margin-bottom: 14px; }
24	  .btn { background: #17605c; color: #ffffff; border-radius: 6px; padding: 14px 28px; font-size: 16px; font-weight: 600; cursor: pointer; display: inline-block; }
25	  .cta-row strong { font-size: 17px; color: #17605c; }
26	  .avail { font-size: 15px; color: #4d9e99; }
27	  .hero-art { flex: 1; }
28	  .hero-art img { width: 100%; display: block; border-radius: 10px; }
29	  .divider { display: block; width: 100%; }
30	  section { padding: 58px 0; }
31	  .tinted { background: #eef7f6; }
32	  h2 { font-size: 30px; color: #17605c; margin-bottom: 10px; }
33	  .lede { max-width: 62ch; margin-bottom: 34px; color: #48575e; }
34	  .services { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
35	  .service { background: #ffffff; border: 1px solid #dcebe9; border-radius: 10px; padding: 24px; }
36	  .service h3 { f
```

</details>

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "          <div class=\"field\">\n            <span>Your name</span>\n            <input type=\"text\" name=\"name\">\n          </div>\n          <div class=\"field\">\n            <span>Phone number</span>\n            <input type=\"tel\" name=\"phone\">\n          </div>",
  "new_string": "          <div class=\"field\">\n            <label for=\"name\">Your name</label>\n            <input type=\"text\" id=\"name\" name=\"name\" autocomplete=\"name\">\n          </div>\n          <div class=\"field\">\n            <label for=\"phone\">Phone number</label>\n            <input type=\"tel\" id=\"phone\" name=\"phone\" autocomplete=\"tel\">\n          </div>"
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
  "old_string": "            <input type=\"text\" id=\"name\" name=\"name\" autocomplete=\"name\">\n          </div>\n          <div class=\"field\">\n            <label for=\"phone\">Phone number</label>\n            <input type=\"tel\" id=\"phone\" name=\"phone\" autocomplete=\"tel\">",
  "new_string": "            <input type=\"text\" id=\"name\" name=\"name\">\n          </div>\n          <div class=\"field\">\n            <label for=\"phone\">Phone number</label>\n            <input type=\"tel\" id=\"phone\" name=\"phone\">"
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
  "old_string": "          <span>How can we help?</span>\n          <textarea name=\"message\"></textarea>",
  "new_string": "          <label for=\"message\">How can we help?</label>\n          <textarea id=\"message\" name=\"message\"></textarea>"
}
```

<details><summary>↩️ Tool result</summary>

```
The file index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🤖 Agent:** Now the CSS rule `.field label, .field > span { ... }` already covers label styling since it targets both label and span — so visual style is preserved. Now fix the icon-link.

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "<a class=\"icon-link\" href=\"https://facebook.com/lakesidefamilymed\"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1z\"/></svg></a>",
  "new_string": "<a class=\"icon-link\" href=\"https://facebook.com/lakesidefamilymed\" aria-label=\"Lakeside Family Medicine on Facebook\"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1z\"/></svg></a>"
}
```

<details><summary>↩️ Tool result</summary>

```
The file index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🤖 Agent:** Now let's scan the file to verify.

**🔧 Tool call — `mcp__stepfree__scan_file`**
```json
{
  "path": "index.html"
}
```

<details><summary>↩️ Tool result</summary>

```
WCAG A/AA violations: 3 instance(s) | best-practice: 0

[wcag] color-contrast (serious) — Elements must meet minimum color contrast ratio thresholds
  • .avail
    <p class="avail">Same-day sick visits held every weekday morning.</p>
  • .coverage
    <p class="coverage">Not sure about your plan? Call us — a coverage check takes about five minutes.</p>
  • .motto
    <p class="motto">Healthy starts here, and it starts early.</p>
```

</details>

**🤖 Agent:** All assigned violations (`label`, `link-name`) are resolved, and no new violations were introduced — the remaining `color-contrast` issues are outside my assigned scope (belongs to a color/contrast specialist).

**🔧 Tool call — `mcp__stepfree__record_convention`**
```json
{
  "key": "alt-style:icon-link-social",
  "value": "aria-label=\"[Business name] on [Platform]\" for icon-only social links, e.g. \"Lakeside Family Medicine on Facebook\"; pair with aria-hidden=\"true\" on the inner svg",
  "rationale": "Establishes a consistent, reusable pattern for naming icon-only social links across the site"
}
```

<details><summary>↩️ Tool result</summary>

```
Convention recorded: alt-style:icon-link-social → aria-label="[Business name] on [Platform]" for icon-only social links, e.g. "Lakeside Family Medicine on Facebook"; pair with aria-hidden="true" on the inner svg
```

</details>

**🤖 Agent:** Summary of changes made to `index.html`:

1. **`label` violations (3 instances)** — The contact form had three fields whose visible captions were plain `<span>` elements rather than real `<label>` elements, so they weren't programmatically associated with their controls:
   - "Your name" span → `<label for="name">`, with `id="name"` added to the text input.
   - "Phone number" span → `<label for="phone">`, with `id="phone"` added to the tel input.
   - "How can we help?" span → `<label for="message">`, with `id="message"` added to the textarea.
   
   No styling changed because the existing CSS rule (`.field label, .field > span`) already applied identical styling to both `label` and `span`, so converting the element tag preserves the exact visual design.

2. **`link-name` violation (1 instance)** — The Facebook icon link in the footer contained only an SVG with no accessible text. Added `aria-label="Lakeside Family Medicine on Facebook"` to the `<a class="icon-link">` and `aria-hidden="true"` to its inner `<svg>` so the icon doesn't leak redundant content to assistive tech while the link now announces its destination clearly.

Verified with `scan_file`: all three assigned `label` instances and the `link-name` instance are gone, and no new violations were introduced (the only remaining findings are pre-existing `color-contrast` issues, which are outside this task's scope and belong to the color/contrast specialist). I also recorded a new convention for icon-only social link labeling for consistency with future pages.

---
**Run result:** success — 8 turns, 29.4s, $0.0861

**🛡️ Orchestrator verification (deterministic):** forms r1: fixed 4, introduced 0, assigned-remaining 0, integrity OK