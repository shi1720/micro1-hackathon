# Trajectory: forms:index.html:r1

**Page:** `index.html`  
**Task:** Forms, labels & accessible names  
**Started:** 2026-08-31T11:57:15.564Z

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
- landmark:donate-band: Moved .donate-band div inside <main>, right after the last <section>, instead of leaving it as a sibling between </main> and <footer>. (The donate call-to-action is part of the primary page content, not header/footer chrome, so it belongs inside the main landmark to satisfy the 'region' rule without altering visual layout or content order.)
- alt-style:pet-avatar-illustrations: "Cartoon portrait of [Name], a [color/notable feature] [species] [wearing a [color] collar, if present]" (Pet card images are decorative-illustration avatars carrying identity info not otherwise stated (color, breed cues, collar); concise consistent phrasing avoids redundant 'image of' and matches the informative-image style used across the adoption grid.)

## Assigned violations (from axe-core)
- label (critical, wcag) — Form elements must have labels
    - selector: input[type="text"]
      html: <input type="text" name="name">
      why: Fix any of the following:   Element does not have an implicit (wrapped) <label>   Element does not have an explicit <label>
    - selector: input[type="tel"]
      html: <input type="tel" name="phone">
      why: Fix any of the following:   Element does not have an implicit (wrapped) <label>   Element does not have an explicit <label>
    - selector: textarea
      html: <textarea name="home"></textarea>
      why: Fix any of the following:   Element does not have an implicit (wrapped) <label>   Element does not have an explicit <label>
- link-name (serious, wcag) — Links must have discernible text
    - selector: .social
      html: <a class="social" href="https://instagram.com/secondchancecf.example"><span class="cam"></span></a>
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
6	<title>Second Chance Animal Rescue — Adopt a Pet in Cedar Falls</title>
7	<style>
8	  * { box-sizing: border-box; margin: 0; padding: 0; }
9	  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
10	         background: #fdfbf6; color: #59534a; line-height: 1.65; }
11	  h1, h2, h3 { color: #2e5d43; font-weight: 700; }
12	  a { color: #446b52; }
13	  .wrap { max-width: 1060px; margin: 0 auto; padding: 0 24px; }
14	  header.site { background: #2e5d43; padding: 14px 0; }
15	  header.site .wrap { display: flex; align-items: center; gap: 16px; }
16	  .brand { display: flex; align-items: center; gap: 12px; color: #ffffff; text-decoration: none;
17	           font-weight: 800; font-size: 1.25rem; flex: 1; }
18	  .brand img { width: 40px; height: 40px; }
19	  nav ul { list-style: none; display: flex; gap: 24px; }
20	  nav a { color: #ffffff; text-decoration: none; font-size: 0.95rem; letter-spacing: 0.5px; }
21	  nav a:hover { text-decoration: underline; }
22	  .hero { padding: 60px 0 48px; }
23	  .hero h1 { font-size: 2.5rem; line-height: 1.2; margin-bottom: 14px; }
24	  .hero p { max-width: 58ch; margin-bottom: 24px; font-size: 1.05rem; }
25	  .btn { display: inline-block; background: #2e5d43; color: #ffffff; text-decoration: none;
26	         padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 0.98rem; border: 0; cursor: pointer; }
27	  .btn:hover { background: #244a35; }
28	  section { padding: 48px 0; }
29	  section h2 { font-size: 1.85rem; margin-bottom: 8px; }
30	  .section-lead { margin-bottom: 26px; max-width: 62ch; }
31	  .pet-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 26px; }
32	  .pet-card { background: #ffffff; border: 1px solid #e7e0d2; border-radius: 12px; overflow: hidden; }
33	  .pet-card img { width: 100%; height: 230px; object-fit: cover; display: block; }
34	  .pet-card .pad { padding: 18px 22px 24px; }
35	  .pet-card h3 { font-size: 1.3rem; margin-bottom: 4px; }
36	  .pet-age { color: #8ab98f; font-size: 0.92rem; font-weight: 400; margin-bottom: 10px; }
37	  .pet-card p { font-size: 0.95rem; margin-bottom: 14px; }
38	  .involved .wrap { display: flex; gap: 44px; align-items: center; flex-wrap: wrap; }
39	  .involved img { flex: 1 1 380px; max-width: 540px; width: 100%; border-radius: 12px; 
```

</details>

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "            <div class=\"field-name\">Full name</div>\n            <input type=\"text\" name=\"name\">\n          </div>\n          <div>\n            <div class=\"field-name\">Phone</div>\n            <input type=\"tel\" name=\"phone\">\n          </div>",
  "new_string": "            <label class=\"field-name\" for=\"name\">Full name</label>\n            <input type=\"text\" id=\"name\" name=\"name\">\n          </div>\n          <div>\n            <label class=\"field-name\" for=\"phone\">Phone</label>\n            <input type=\"tel\" id=\"phone\" name=\"phone\">\n          </div>"
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
  "old_string": "        <div class=\"field-name\">Tell us about your home</div>\n        <textarea name=\"home\"></textarea>",
  "new_string": "        <label class=\"field-name\" for=\"home\">Tell us about your home</label>\n        <textarea id=\"home\" name=\"home\"></textarea>"
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
  "old_string": "<a class=\"social\" href=\"https://instagram.com/secondchancecf.example\"><span class=\"cam\"></span></a>",
  "new_string": "<a class=\"social\" href=\"https://instagram.com/secondchancecf.example\" aria-label=\"Second Chance Animal Rescue on Instagram\"><span class=\"cam\"></span></a>"
}
```

<details><summary>↩️ Tool result</summary>

```
The file index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🤖 Agent:** Now the `label` CSS rule (`display: block; ... margin-bottom: 6px;`) already matches `.field-name` styling closely, but since I kept the `field-name` class on the labels, styling is preserved exactly regardless of the generic `label` rule. Let's verify with a scan.

**🔧 Tool call — `mcp__stepfree__scan_file`**
```json
{
  "path": "index.html"
}
```

<details><summary>↩️ Tool result</summary>

```
WCAG A/AA violations: 4 instance(s) | best-practice: 0

[wcag] aria-required-attr (critical) — Required ARIA attributes must be provided
  • .consent
    <div class="consent" role="checkbox" tabindex="0">
          <span class="box"></span>
          I understand that adopting includes a brief home visit and a follow-up call from a
          Second Chance volunteer.
     

[wcag] color-contrast (serious) — Elements must meet minimum color contrast ratio thresholds
  • .pet-card:nth-child(1) > .pad > .pet-age
    <p class="pet-age">Dog · 2 years old · 38 lbs · house-trained</p>
  • .pet-card:nth-child(2) > .pad > .pet-age
    <p class="pet-age">Cat · 4 years old · indoor only · quiet home preferred</p>
  • .pet-card:nth-child(3) > .pad > .pet-age
    <p class="pet-age">Rabbit · 1 year old · litter-trained · bonded pair optional</p>
```

</details>

**🤖 Agent:** Good — my assigned violations (`label`, `link-name`) are resolved. The remaining `aria-required-attr` and `color-contrast` issues are out of my scope (custom checkbox ARIA and color contrast are handled by other specialists) and were pre-existing, not introduced by my changes.

**🔧 Tool call — `mcp__stepfree__record_convention`**
```json
{
  "key": "label-style:field-name-div-to-label",
  "value": "Converted `.field-name` divs into `<label class=\"field-name\" for=\"...\">` elements associated via id, rather than adding aria-label, to preserve visible styling and satisfy WCAG 3.3.2.",
  "rationale": "Nearby text already visually served as a label; converting it to a real <label> keeps the design identical while fixing the missing accessible name."
}
```

<details><summary>↩️ Tool result</summary>

```
Convention recorded: label-style:field-name-div-to-label → Converted `.field-name` divs into `<label class="field-name" for="...">` elements associated via id, rather than adding aria-label, to preserve visible styling and satisfy WCAG 3.3.2.
```

</details>

**🤖 Agent:** **Summary of changes made to `index.html`:**

1. **`label` violations (Full name, Phone, Home textarea inputs):** The visible field captions were plain `<div class="field-name">` elements with no programmatic association to their inputs. I converted each into a real `<label class="field-name" for="...">`, keeping the exact same CSS class so the visual design is unchanged, and added matching `id` attributes (`id="name"`, `id="phone"`, `id="home"`) to the `<input>`/`<textarea>` elements. No names, values, or form structure were altered.

2. **`link-name` violation (Instagram social icon link):** The icon-only link `<a class="social">` wrapped only a decorative `<span class="cam">` with no text, giving it no accessible name. I added `aria-label="Second Chance Animal Rescue on Instagram"` to name the destination clearly for screen-reader users, consistent with the icon-link naming pattern in the fix guide.

Verified with `scan_file`: both assigned violations (`label`, `link-name`) are gone, and no new violations were introduced — the two remaining findings (`aria-required-attr` on the custom checkbox, and `color-contrast` on `.pet-age` text) are pre-existing issues outside my assigned scope (ARIA/state and color-contrast specialists) and were not caused by my edits.

---
**Run result:** success — 7 turns, 21.7s, $0.0647

**🛡️ Orchestrator verification (deterministic):** forms r1: fixed 4, introduced 0, assigned-remaining 0, integrity OK