# Trajectory: structure:index.html:r1

**Page:** `index.html`  
**Task:** Structure & semantics  
**Started:** 2026-08-31T11:56:23.720Z

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
- region (moderate, best-practice) — All page content should be contained by landmarks
    - selector: .donate-band
      html: <div class="donate-band">
      why: Fix any of the following:   Some page content is not contained by landmarks

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
  "old_string": "  </section>\n</main>\n<div class=\"donate-band\">\n  <div class=\"wrap\">\n    <h2>$20 feeds a foster animal for a week.</h2>\n    <p>Second Chance is a registered 501(c)(3), and every dollar goes to food, vet care, and\n       transport — our volunteers even buy their own coffee.</p>\n    <a class=\"btn\" href=\"#inquiry\">Donate</a>\n  </div>\n</div>\n<footer class=\"site\">",
  "new_string": "  </section>\n  <div class=\"donate-band\">\n    <div class=\"wrap\">\n      <h2>$20 feeds a foster animal for a week.</h2>\n      <p>Second Chance is a registered 501(c)(3), and every dollar goes to food, vet care, and\n         transport — our volunteers even buy their own coffee.</p>\n      <a class=\"btn\" href=\"#inquiry\">Donate</a>\n    </div>\n  </div>\n</main>\n<footer class=\"site\">"
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
WCAG A/AA violations: 11 instance(s) | best-practice: 0

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

[wcag] image-alt (critical) — Images must have alternative text
  • img[src$="dog-biscuit.svg"]
    <img src="images/dog-biscuit.svg">
  • img[src$="cat-luna.svg"]
    <img src="images/cat-luna.svg">
  • img[src$="rabbit-clover.svg"]
    <img src="images/rabbit-clover.svg">

[wcag] label (critical) — Form elements must have labels
  • input[type="text"]
    <input type="text" name="name">
  • input[type="tel"]
    <input type="tel" name="phone">
  • textarea
    <textarea name="home"></textarea>

[wcag] link-name (serious) — Links must have discernible text
  • .social
    <a class="social" href="https://instagram.com/secondchancecf.example"><span class="cam"></span></a>
```

</details>

**🤖 Agent:** These remaining violations are outside my assigned scope (aria-required-attr, color-contrast, image-alt, label, link-name belong to other specialists). My assigned `region` violation for `.donate-band` is no longer listed, confirming it's resolved. Let me double check region specifically isn't present.

**🔧 Tool call — `mcp__stepfree__record_convention`**
```json
{
  "key": "landmark:donate-band",
  "value": "Moved .donate-band div inside <main>, right after the last <section>, instead of leaving it as a sibling between </main> and <footer>.",
  "rationale": "The donate call-to-action is part of the primary page content, not header/footer chrome, so it belongs inside the main landmark to satisfy the 'region' rule without altering visual layout or content order."
}
```

<details><summary>↩️ Tool result</summary>

```
Convention recorded: landmark:donate-band → Moved .donate-band div inside <main>, right after the last <section>, instead of leaving it as a sibling between </main> and <footer>.
```

</details>

**🤖 Agent:** **Summary:** The `.donate-band` div sat between `</main>` and `<footer>`, so it wasn't contained in any landmark, triggering the `region` violation. I moved the `.donate-band` div (and its contents) to be the last child inside `<main>`, right after the closing `</section>` of the inquiry form, and moved `</main>` to after it. This keeps the visual layout, DOM order, and all content/links identical (no styling or copy changed) while ensuring the donate call-to-action is now contained within the `<main>` landmark. Verified with `scan_file` that the `region` violation for `.donate-band` no longer appears; remaining reported issues (aria-required-attr, color-contrast, image-alt, label, link-name) fall outside this task's assigned scope and were left untouched for the appropriate specialists.

---
**Run result:** success — 5 turns, 18.1s, $0.0554

**🛡️ Orchestrator verification (deterministic):** structure r1: fixed 1, introduced 0, assigned-remaining 0, integrity OK