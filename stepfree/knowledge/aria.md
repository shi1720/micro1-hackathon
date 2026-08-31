# ARIA repair — fix guide

Your scope: `aria-hidden-focus`, `aria-required-attr`, `aria-valid-attr-value`, `aria-valid-attr`, `aria-allowed-attr`, `aria-allowed-role`, `aria-roles`, `aria-command-name`, `aria-toggle-field-name`, `scrollable-region-focusable`, `frame-title`, `nested-interactive`.

## The first rule of ARIA

**No ARIA is better than bad ARIA** (W3C). Pages using ARIA average ~41% MORE detected errors than pages without (WebAIM Million). Your default move is to REMOVE or CORRECT wrong ARIA — adding new roles is a last resort, and native HTML elements always win over role attributes.

## Rule-by-rule

- **`aria-hidden-focus`** (aria-hidden element contains focusable children): decide what the element IS.
  - Genuinely hidden/decorative for everyone → also make children unfocusable (`tabindex="-1"` on links/buttons inside) or hide interactively (`inert`), keeping the visual unchanged.
  - Actually meaningful content wrongly hidden from AT (common: a promo/banner someone hid to quiet a scanner) → remove the `aria-hidden="true"`; the content should be exposed. Look at the rendered page (`view_page`) to judge which case you're in; if still ambiguous, fix conservatively (remove `aria-hidden`) and `flag_for_review`.
- **`aria-required-attr`**: a role promised state it doesn't declare (e.g. `role="checkbox"` without `aria-checked`). The BEST fix is usually the native element: replace `<div role="checkbox">` with a real `<input type="checkbox">` + label, styled to match. If the div carries JS behavior you'd break, add the missing attribute (`aria-checked="false"`) AND `flag_for_review` noting the element still lacks keyboard support.
- **`aria-valid-attr-value` / `aria-valid-attr` / `aria-allowed-attr`**: correct obvious typos (`aria-lable` → `aria-label`; `aria-labelledby` pointing at a missing id → point at the right id or switch to `aria-label`). If the attribute serves no purpose, delete it.
- **`frame-title`**: give iframes a `title` describing their content ("Map to our office").
- **`scrollable-region-focusable`**: add `tabindex="0"` to the scrollable container (with a role and name if it's a meaningful region).
- **`nested-interactive`**: unwrap — a button inside a link is two fights in one element; keep the outer or inner control, whichever matches the visual intent, without losing either destination/action.

## Never

- Never add `aria-hidden="true"` to anything visible to silence a rule.
- Never add a `role` that duplicates the native element's role.
- Never leave a custom widget half-ARIA'd: state attributes without keyboard behavior mislead worse than nothing — that's what `flag_for_review` is for.
