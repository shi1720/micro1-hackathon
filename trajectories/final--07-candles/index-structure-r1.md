# Trajectory: structure:index.html:r1

**Page:** `index.html`  
**Task:** Structure & semantics  
**Started:** 2026-08-31T11:56:15.829Z

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
- html-has-lang (serious, wcag) — <html> element must have a lang attribute
    - selector: html
      html: <html>
      why: Fix any of the following:   The <html> element does not have a lang attribute

Read the file, understand the design, apply your fixes, then verify with scan_file that all assigned violations are gone and nothing new was introduced. Finish with a one-paragraph summary of exactly what you changed and why.
```

> Model: `claude-sonnet-5` — available tools: `Edit`, `Glob`, `Grep`, `Read`, `Write`, `mcp__stepfree__check_contrast`, `mcp__stepfree__contrast_suggest`, `mcp__stepfree__flag_for_review`, `mcp__stepfree__record_convention`, `mcp__stepfree__scan_file`, `mcp__stepfree__view_image`, `mcp__stepfree__view_page`

**🔧 Tool call — `Read`**
```json
{
  "file_path": "/index.html",
  "limit": 50
}
```

<details><summary>↩️ Tool result (error)</summary>

```
Denied: /index.html is outside the working copy. This agent may only touch files under /home/user/micro1-hackathon/runs/final/07-candles/site.
```

</details>

**🔧 Tool call — `Read`**
```json
{
  "file_path": "/home/user/micro1-hackathon/runs/final/07-candles/site/index.html",
  "limit": 50
}
```

<details><summary>↩️ Tool result</summary>

```
1	<!DOCTYPE html>
2	<html>
3	<head>
4	<meta charset="utf-8">
5	<meta name="viewport" content="width=device-width, initial-scale=1">
6	<title>Ember &amp; Oak Candle Co. — Hand-poured Soy Candles</title>
7	<style>
8	  * { box-sizing: border-box; margin: 0; padding: 0; }
9	  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
10	         background: #f7f1e6; color: #5a4632; line-height: 1.65; }
11	  h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; color: #3d3128; font-weight: 400; }
12	  a { color: #5a4632; }
13	  .wrap { max-width: 1060px; margin: 0 auto; padding: 0 24px; }
14	  header.site { padding: 20px 0; border-bottom: 1px solid #e2d6bd; }
15	  header.site .wrap { display: flex; align-items: baseline; justify-content: space-between; }
16	  .logo { font-family: Georgia, serif; font-size: 1.6rem; color: #3d3128; text-decoration: none; }
17	  .logo em { font-style: normal; color: #8a5a1c; }
18	  nav ul { list-style: none; display: flex; gap: 26px; }
19	  nav a { text-decoration: none; font-size: 0.95rem; letter-spacing: 0.6px; text-transform: uppercase; }
20	  nav a:hover { color: #8a5a1c; }
21	  .eyebrow { color: #c17f24; font-size: 0.82rem; letter-spacing: 3px; text-transform: uppercase;
22	             font-weight: 600; margin-bottom: 10px; }
23	  .hero { padding: 72px 0 56px; text-align: center; }
24	  .hero h1 { font-size: 2.7rem; margin-bottom: 14px; }
25	  .hero p { max-width: 54ch; margin: 0 auto 26px; }
26	  .btn { display: inline-block; background: #8a5a1c; color: #ffffff; text-decoration: none;
27	         padding: 12px 28px; border-radius: 3px; font-size: 0.95rem; letter-spacing: 1px;
28	         text-transform: uppercase; border: 0; cursor: pointer; }
29	  .btn:hover { background: #6f4715; }
30	  section { padding: 48px 0; }
31	  section h2 { font-size: 1.8rem; margin-bottom: 22px; }
32	  .featured { display: flex; gap: 28px; flex-wrap: wrap; }
33	  .feat-card { flex: 1 1 380px; background: #fffdf8; border: 1px solid #e8dcc2; border-radius: 8px;
34	               overflow: hidden; position: relative; }
35	  .feat-card img { width: 100%; height: 260px; object-fit: cover; display: block; }
36	  .feat-card .pad { padding: 20px 24px 26px; }
37	  .wish-btn { position: absolute; top: 14px; right: 14px; width: 40px; height: 40px; border-radius: 50%;
38	              border: 1px solid #d8c9ac; background: #fffdf8; cursor: pointer;
39	              display: flex; align-items: center; just
```

</details>

**🤖 Agent:** Page content is English. I'll add `lang="en"` to the `<html>` element.

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "/home/user/micro1-hackathon/runs/final/07-candles/site/index.html",
  "old_string": "<html>\n<head>",
  "new_string": "<html lang=\"en\">\n<head>"
}
```

<details><summary>↩️ Tool result</summary>

```
The file /home/user/micro1-hackathon/runs/final/07-candles/site/index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🔧 Tool call — `mcp__stepfree__scan_file`**
```json
{
  "path": "index.html"
}
```

**🔧 Tool call — `mcp__stepfree__record_convention`**
```json
{
  "key": "html-lang",
  "value": "lang=\"en\" on <html>",
  "rationale": "Page copy is written in English throughout."
}
```

<details><summary>↩️ Tool result</summary>

```
WCAG A/AA violations: 10 instance(s) | best-practice: 0

[wcag] button-name (critical) — Buttons must have discernible text
  • .feat-card:nth-child(1) > .wish-btn
    <button class="wish-btn" type="button"><span class="heart"></span></button>
  • .feat-card:nth-child(2) > .wish-btn
    <button class="wish-btn" type="button"><span class="heart"></span></button>

[wcag] color-contrast (serious) — Elements must meet minimum color contrast ratio thresholds
  • .hero > .wrap > .eyebrow
    <p class="eyebrow">Hand-poured in small batches</p>
  • #shop > .wrap > .eyebrow
    <p class="eyebrow">The autumn collection</p>
  • .fine-print
    <p class="fine-print">Free shipping on orders over $60 — every order ships in 2–3 business days
         from our workshop in Beacon, NY.</p>

[wcag] image-alt (critical) — Images must have alternative text
  • img[src$="amber-jar.svg"]
    <img src="images/amber-jar.svg">
  • img[src$="pine-tin.svg"]
    <img src="images/pine-tin.svg">
  • img[src$="lavender-jar.svg"]
    <img src="images/lavender-jar.svg">

[wcag] link-name (serious) — Links must have discernible text
  • .social
    <a class="social" href="https://instagram.com/emberandoak.example"><span class="insta"></span></a>

[wcag] select-name (critical) — Select element must have an accessible name
  • select[name="scent-family"]
    <select name="scent-family">
            <option>All scents</option>
            <option>Woody</option>
            <option>Floral</option>
            <option>Citrus</option>
            <option>Fresh</option>
         
```

</details>

<details><summary>↩️ Tool result</summary>

```
Convention recorded: html-lang → lang="en" on <html>
```

</details>

**🤖 Agent:** The `html-has-lang` violation is resolved — it no longer appears in the scan. The remaining 10 violations listed (button-name, color-contrast, image-alt, link-name, select-name) are outside my assigned scope (structure & semantics) and belong to other specialists, so I left them untouched.

**Summary:** I added `lang="en"` to the `<html>` element in `index.html`, since the entire page content is written in English. This resolves the `html-has-lang` violation with no visual or content changes. I verified via `scan_file` that this violation is gone and confirmed no new violations were introduced by the change (the remaining reported issues are pre-existing and out of scope for this task).

---
**Run result:** success — 6 turns, 12.2s, $0.0298

**🛡️ Orchestrator verification (deterministic):** structure r1: fixed 1, introduced 0, assigned-remaining 0, integrity OK