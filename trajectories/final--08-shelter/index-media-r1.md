# Trajectory: media:index.html:r1

**Page:** `index.html`  
**Task:** Images & non-text content  
**Started:** 2026-08-31T11:56:46.867Z

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

## Site conventions already agreed (FOLLOW these exactly; record new ones with record_convention)
- landmark:donate-band: Moved .donate-band div inside <main>, right after the last <section>, instead of leaving it as a sibling between </main> and <footer>. (The donate call-to-action is part of the primary page content, not header/footer chrome, so it belongs inside the main landmark to satisfy the 'region' rule without altering visual layout or content order.)

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

> Model: `claude-sonnet-5` — available tools: `Edit`, `Glob`, `Grep`, `Read`, `Write`, `mcp__stepfree__check_contrast`, `mcp__stepfree__contrast_suggest`, `mcp__stepfree__flag_for_review`, `mcp__stepfree__record_convention`, `mcp__stepfree__scan_file`, `mcp__stepfree__view_image`, `mcp__stepfree__view_page`

**🔧 Tool call — `Grep`**
```json
{
  "pattern": "dog-biscuit|cat-luna|rabbit-clover",
  "path": "index.html",
  "output_mode": "content",
  "-C": 8
}
```

<details><summary>↩️ Tool result</summary>

```
98-  </div>
99-  <section id="adopt">
100-    <div class="wrap">
101-      <h2>Waiting for a home</h2>
102-      <p class="section-lead">All adoptions include spay/neuter, vaccinations, microchip, and two
103-         weeks of follow-up support. Adoption fees: dogs $175, cats $95, small animals $40.</p>
104-      <div class="pet-grid">
105-        <div class="pet-card">
106:          <img src="images/dog-biscuit.svg">
107-          <div class="pad">
108-            <h3>Biscuit</h3>
109-            <p class="pet-age">Dog · 2 years old · 38 lbs · house-trained</p>
110-            <p>A gentle brown hound mix with ears bigger than his ambitions. Biscuit loves car
111-               rides, children, and napping in sunbeams. Walks nicely on a leash and already
112-               knows sit, stay, and shake.</p>
113-            <a class="btn" href="#inquiry">Ask about Biscuit</a>
114-          </div>
115-        </div>
116-        <div class="pet-card">
117:          <img src="images/cat-luna.svg">
118-          <div class="pad">
119-            <h3>Luna</h3>
120-            <p class="pet-age">Cat · 4 years old · indoor only · quiet home preferred</p>
121-            <p>A sleek black cat with striking green eyes and strong opinions about closed
122-               doors. Luna is affectionate on her own schedule and would thrive as the only
123-               pet in a calm household.</p>
124-            <a class="btn" href="#inquiry">Ask about Luna</a>
125-          </div>
126-        </div>
127-        <div class="pet-card">
128:          <img src="images/rabbit-clover.svg">
129-          <div class="pad">
130-            <h3>Clover</h3>
131-            <p class="pet-age">Rabbit · 1 year old · litter-trained · bonded pair optional</p>
132-            <p>A lop-eared gray rabbit who flops over the moment you scratch behind her ears.
133-               Clover is litter-trained, loves cilantro, and can be adopted with her brother
134-               Basil at no extra fee.</p>
135-            <a class="btn" href="#inquiry">Ask about Clover</a>
136-          </div>
```

</details>

**🤖 Agent:** Now let me view each image before writing alt text.

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

**🔧 Tool call — `Edit`**
```json
{
  "replace_all": false,
  "file_path": "index.html",
  "old_string": "          <img src=\"images/dog-biscuit.svg\">",
  "new_string": "          <img src=\"images/dog-biscuit.svg\" alt=\"Cartoon portrait of Biscuit, a brown dog wearing a red collar\">"
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
  "new_string": "          <img src=\"images/cat-luna.svg\" alt=\"Cartoon portrait of Luna, a black cat with green eyes wearing a purple collar\">"
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
  "new_string": "          <img src=\"images/rabbit-clover.svg\" alt=\"Cartoon portrait of Clover, a gray lop-eared rabbit\">"
}
```

<details><summary>↩️ Tool result</summary>

```
The file index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**🔧 Tool call — `mcp__stepfree__record_convention`**
```json
{
  "key": "alt-style:pet-avatar-illustrations",
  "value": "\"Cartoon portrait of [Name], a [color/notable feature] [species] [wearing a [color] collar, if present]\"",
  "rationale": "Pet card images are decorative-illustration avatars carrying identity info not otherwise stated (color, breed cues, collar); concise consistent phrasing avoids redundant 'image of' and matches the informative-image style used across the adoption grid."
}
```

**🔧 Tool call — `mcp__stepfree__scan_file`**
```json
{
  "path": "index.html"
}
```

<details><summary>↩️ Tool result</summary>

```
Convention recorded: alt-style:pet-avatar-illustrations → "Cartoon portrait of [Name], a [color/notable feature] [species] [wearing a [color] collar, if present]"
```

</details>

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

**🤖 Agent:** The remaining violations (aria-required-attr, color-contrast, label, link-name) are outside my assigned scope (image-alt) and belong to other specialists. All three assigned `image-alt` violations are resolved — no image-alt findings remain in the scan.

I added descriptive `alt` text to the three pet-avatar SVGs in the adoption grid (`dog-biscuit.svg`, `cat-luna.svg`, `rabbit-clover.svg`) after visually inspecting each one, since they are informative illustrations conveying the pet's appearance (species, coloring, and collar) rather than purely decorative graphics. I recorded a new alt-text convention (`alt-style:pet-avatar-illustrations`) so any future pet-card images use the same "Cartoon portrait of [Name], a [feature] [species]..." phrasing. I verified via `scan_file` that all three assigned `image-alt` violations are gone; the remaining 8 violations reported (aria-required-attr, color-contrast, label, link-name) are pre-existing issues outside my assigned scope and were not introduced by my changes.

---
**Run result:** success — 10 turns, 23.8s, $0.0507

**🛡️ Orchestrator verification (deterministic):** media r1: fixed 3, introduced 0, assigned-remaining 0, integrity OK