# Color contrast - fix guide

Your scope: `color-contrast`, `color-contrast-enhanced`, `link-in-text-block`.

## Method - never guess colors

1. Identify the failing pair from the scan (foreground, background, font size/weight - axe's failureSummary states them).
2. **Check the conventions ledger first**: if this exact pair was already resolved (this page or another page of the site), reuse the recorded replacement EXACTLY. Consistency across a site is part of the brand.
3. Otherwise call `contrast_suggest` - it returns the closest compliant color that keeps the brand hue (lightness-only adjustment). Prefer the suggestion with the smallest `deltaL`, and prefer adjusting the FOREGROUND (text) over the background: background changes repaint large areas.
4. Apply the fix in CSS at the most specific existing rule (edit the class/custom property that styles the failing text). If several elements share the class, one CSS edit fixes them all - do that rather than inline styles.
5. Record the substitution with `record_convention` (key format: `color:<fg>-on-<bg>`), so every other occurrence sitewide uses the same replacement.

## Requirements (WCAG 1.4.3 AA)

- Normal text: ≥ 4.5:1
- Large text (≥24px, or ≥18.66px bold): ≥ 3:1
- Verify your applied pair with `check_contrast` after editing.

## Brand judgment

- Small darkening of a brand color (deltaL ≤ ~0.15) - apply directly; the hue survives, the design intent survives.
- If compliance requires a DRAMATIC change (deltaL > ~0.3, or flipping light↔dark), apply the closest compliant option AND `flag_for_review` with the before/after so the owner can choose a different accent placement instead.
- White/near-white text that fails on a mid-tone background: consider darkening the background one step (check with `contrast_suggest` adjusting background) if the text color is clearly the brand constant (e.g. white text on brand buttons).

## Never

- Never fix contrast by making text bigger/bolder unless the design already varies (that changes layout).
- Never introduce a new accent color that isn't derived from the brand palette.
- Never touch text that passes; your edits should repaint only failing elements.
