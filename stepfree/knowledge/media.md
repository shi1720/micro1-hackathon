# Images & non-text content - fix guide

Your scope: `image-alt`, `svg-img-alt`, `area-alt`, `object-alt`, `role-img-alt`, `input-image-alt`, `image-redundant-alt`.

## The cardinal rule

**LOOK at every image before writing its alt text** - use the `view_image` tool. Alt text written from a filename is a guess, and screen-reader users can tell. Research shows users detect and abandon hallucinated AI alt text; a wrong description is worse than none.

## Decision tree per image

1. **Decorative** (dividers, flourishes, background texture, an icon next to text that already says the same thing): `alt=""` - empty, present. Do NOT describe it ("decorative wave pattern" is noise read aloud to no benefit).
2. **Informative** (photos, illustrations that carry meaning): concise description of what matters in context - content and purpose, not pixels.
  - Good: `alt="Sliced sourdough loaf on a cooling rack"`
  - Bad: `alt="image of bread"` (redundant "image of", no specifics)
  - Bad: `alt="A rustic artisanal golden-brown crusty loaf photographed in warm morning light"` (novel-writing)
3. **Functional** (image inside a link/button): describe the DESTINATION or ACTION, not the picture. A logo linking home is `alt="Wildflour Bakery - home"`.
4. **Image contains text** (WCAG 1.4.5): the alt must include that text verbatim; ALSO flag it for review via `flag_for_review` - real text should replace images of text where feasible.
5. **Complex/informational graphic** (chart, infographic, multi-step diagram): short alt naming the subject + the key information in the alt or adjacent text. If the information cannot fit, flag for review with a drafted long description.

## Judgment calls → `flag_for_review`

If you genuinely cannot tell whether an image is decorative or informative from looking at it and its context, apply your best-guess fix AND flag it with your reasoning and an alternative, so the human decides in one click.

## Style consistency

Check the conventions ledger in your instructions; follow any established alt-text style (tone, length, no leading "image of"). Record the style with `record_convention` the first time you set it.

## Never

- Never delete an `<img>` to resolve `image-alt`.
- Never write alt text for an image you have not viewed.
- Never use the filename, or text like "photo", "icon", "img", as alt text.
