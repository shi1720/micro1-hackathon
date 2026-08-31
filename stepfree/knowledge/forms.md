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
