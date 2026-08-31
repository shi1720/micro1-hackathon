# Trajectory: media:index.html:r1

**Page:** `index.html`  
**Task:** Images & non-text content  
**Started:** 2026-08-31T12:25:51.804Z

## Instructions given to the agent

<details><summary>System prompt</summary>

```
You are StepFree's "Images & non-text content" specialist — an expert accessibility engineer fixing real WCAG violations in a small business's website source code.

Working rules (non-negotiable):
- You are editing a SANDBOXED working copy; the original site is untouched. Still, edit with production care.
- Preserve the page's visual design and all its content: never delete visible text or images, never change copy, never alter where links go or what forms submit. Your diff should be the smallest one that fixes the assigned issues.
- After making your fixes, run scan_file on the page and confirm every assigned violation is resolved and NO new violations appeared. Deterministic verification will re-check everything you claim.
- If an assigned issue requires a judgment call you cannot ground in the page itself, make your best safe fix AND flag_for_review with your reasoning — or flag without fixing if no safe fix exists.
- Do not fix issues assigned to other specialists unless your change resolves them incidentally.

## Your expertise
# Images & non-text content — fix guide

Your scope: `image-alt`, `svg-img-alt`, `area-alt`, `object-alt`, `role-img-alt`, `input-image-alt`, `image-redundant-alt`.

## The cardinal rule

**LOOK at every image before writing its alt text** — use the `view_image` tool. Alt text written from a filename is a guess, and screen-reader users can tell. Research shows users detect and abandon hallucinated AI alt text; a wrong description is worse than none.

## Decision tree per image

1. **Decorative** (dividers, flourishes, background texture, an icon next to text that already says the same thing): `alt=""` — empty, present. Do NOT describe it ("decorative wave pattern" is noise read aloud to no benefit).
2. **Informative** (photos, illustrations that carry meaning): concise description of what matters in context — content and purpose, not pixels.
   - Good: `alt="Sliced sourdough loaf on a cooling rack"`
   - Bad: `alt="image of bread"` (redundant "image of", no specifics)
   - Bad: `alt="A rustic artisanal golden-brown crusty loaf photographed in warm morning light"` (novel-writing)
3. **Functional** (image inside a link/button): describe the DESTINATION or ACTION, not the picture. A logo linking home is `alt="Wildflour Bakery — home"`.
4. **Image contains text** (WCAG 1.4.5): the alt must include that text verbatim; ALSO flag it for review via `flag_for_review` — real text should replace images of text where feasible.
5. **Complex/informational graphic** (chart, infographic, multi-step diagram): short alt naming the subject + the key information in the alt or adjacent text. If the information cannot fit, flag for review with a drafted long description.

## Judgment calls → `flag_for_review`

If you genuinely cannot tell whether an image is decorative or informative from looking at it and its context, apply your best-guess fix AND flag it with your reasoning and an alternative, so the human decides in one click.

## Style consistency

Check the conventions ledger in your instructions; follow any established alt-text style (tone, length, no leading "image of"). Record the style with `record_convention` the first time you set it.

## Never

- Never delete an `<img>` to resolve `image-alt`.
- Never write alt text for an image you have not viewed.
- Never use the filename, or text like "photo", "icon", "img", as alt text.

```

</details>

**Task prompt:**

```
Fix the following accessibility violations in `index.html` (a self-contained HTML page in your working directory).


## Assigned violations (from axe-core)
- image-alt (critical, wcag) — Images must have alternative text
    - selector: img[src$="dog-biscuit.svg"]
      html: <img src="images/dog-biscuit.svg">
      why: Fix any of the following:   Element does not have an alt attribute   aria-label attribute does not exist or is empty
    - selector: img[src$="cat-luna.svg"]
      html: <img src="images/cat-luna.svg">
      why: Fix any of the following:   Element does not have an alt attribute   aria-label attribute does not exist or is empty
    - selector: img[src$="rabbit-clover.svg"]
      html: <img src="images/rabbit-clover.svg">
      why: Fix any of the following:   Element does not have an alt attribute   aria-label attribute does not exist or is empty

Read the file, understand the design, apply your fixes, then verify with scan_file that all assigned violations are gone and nothing new was introduced. Finish with a one-paragraph summary of exactly what you changed and why.
```

> Model: `claude-sonnet-5` — available tools: `Edit`, `Glob`, `Grep`, `Read`, `Write`, `mcp__stepfree__check_contrast`, `mcp__stepfree__contrast_suggest`, `mcp__stepfree__flag_for_review`, `mcp__stepfree__scan_file`, `mcp__stepfree__view_image`, `mcp__stepfree__view_page`

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

**🔧 Tool call — `mcp__stepfree__view_image`**
```json
{
  "path": "images/dog-biscuit.svg"
}
```

<details><summary>↩️ Tool result</summary>

```
Rendered images/dog-biscuit.svg:
[image]
```

</details>

**🔧 Tool call — `mcp__stepfree__view_image`**
```json
{
  "path": "images/cat-luna.svg"
}
```

**🔧 Tool call — `mcp__stepfree__view_image`**
```json
{
  "path": "images/rabbit-clover.svg"
}
```

<details><summary>↩️ Tool result</summary>

```
Rendered images/cat-luna.svg:
[image]
```

</details>

<details><summary>↩️ Tool result</summary>

```
Rendered images/rabbit-clover.svg:
[image]
```

</details>

**🤖 Agent:** These match the existing style used for `volunteer-walk.svg` ("Illustration of a volunteer walking a small brown dog..."). I'll follow that "Illustration of..." pattern.

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "          <img src=\"images/dog-biscuit.svg\">",
  "new_string": "          <img src=\"images/dog-biscuit.svg\" alt=\"Illustration of Biscuit, a brown dog with floppy ears wearing a red collar\">"
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
  "old_string": "          <img src=\"images/cat-luna.svg\">",
  "new_string": "          <img src=\"images/cat-luna.svg\" alt=\"Illustration of Luna, a black cat with green eyes wearing a purple collar\">"
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
  "old_string": "          <img src=\"images/rabbit-clover.svg\">",
  "new_string": "          <img src=\"images/rabbit-clover.svg\" alt=\"Illustration of Clover, a gray lop-eared rabbit\">"
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
WCAG A/AA violations: 8 instance(s) | best-practice: 0

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

**🤖 Agent:** All `image-alt` violations are resolved; remaining violations (aria-required-attr, color-contrast, label, link-name) are outside my assigned scope and belong to other specialists.

I fixed the three `image-alt` violations in `index.html` by viewing each SVG and adding descriptive alt text: `dog-biscuit.svg` → "Illustration of Biscuit, a brown dog with floppy ears wearing a red collar", `cat-luna.svg` → "Illustration of Luna, a black cat with green eyes wearing a purple collar", and `rabbit-clover.svg` → "Illustration of Clover, a gray lop-eared rabbit". These are informative pet portraits (not decorative), so each got a concise description matching the existing "Illustration of..." style already used on `volunteer-walk.svg`, keeping consistency across the page. I verified with `scan_file` that all three assigned `image-alt` violations are gone and no new violations were introduced; the scan's remaining findings (ARIA checkbox, color contrast, form labels, empty social link) are unrelated to images and fall under other specialists' scope.

---
**Run result:** success — 9 turns, 17.0s, $0.0586

**🛡️ Orchestrator verification (deterministic):** CHAOS: destructive mutation injected after agent round (removed one <img> and one <p>) to exercise the gates

**🛡️ Orchestrator verification (deterministic):** media r1: fixed 3, introduced 0, assigned-remaining 0, integrity FAILED: text-loss,image-loss

**🔁 Retry feedback sent to agent:** ## Verification feedback from the previous attempt (deterministic re-scan)
- Integrity check failed: text-loss: 38 visible word(s) disappeared, e.g. animal, rescue, every, we're, volunteer-run, cedar, falls, that; image-loss: visible image(s) removed: paw-heart.svg — restore the lost content.
