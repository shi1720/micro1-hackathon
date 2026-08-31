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
