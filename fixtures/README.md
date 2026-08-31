# Fixture suite - 12 synthetic small-business websites

The evaluation corpus: 12 fictional small-business sites (13 pages total) written the way real small-business sites actually get built - by a freelancer years ago, visually decent, never audited. All content is synthetic; business names, people, addresses and phone numbers are invented.

## Why synthetic?

- **Legal/ethical**: no real business is named as non-compliant (hackathon ground rule 7).
- **Ground truth**: every seeded violation is verified by axe-core, so "fixed" is deterministic, not a judgment call.
- **Realistic distribution**: the violation mix mirrors the [WebAIM Million 2026](https://webaim.org/projects/million/) findings for the top-1M home pages - low contrast on ~84% of pages, missing alt on ~53%, missing form labels on ~51%, empty links on ~46%, empty buttons on ~31%, missing document language on ~14%.

## The suite

| # | Fixture | Business | Focus violations | Notes |
|---|---------|----------|------------------|-------|
| 01 | `01-bakery` | Wildflour Bakery | image-alt, color-contrast, link-name | classic brochure site |
| 02 | `02-dental` | Brightside Dental | label, select-name, button-name, html-has-lang | appointment form built on placeholders |
| 03 | `03-trattoria` | Osteria del Ponte | color-contrast (dark theme), listitem, document-title | menu page, moody palette |
| 04 | `04-lawfirm` | Harrison & Vance LLP | link-name, color-contrast (gold-on-white), meta-viewport | disabled pinch-zoom |
| 05 | `05-yoga` | Moonrise Yoga | button-name, aria-hidden-focus, html-lang-valid | slider controls, `lang="english"` |
| 06 | `06-autoshop` | TorqueWorks Auto Repair | label, listitem, color-contrast | quote form |
| 07 | `07-candles` | Ember & Oak Candle Co. | **two pages** sharing one brand palette | tests cross-page consistency (memory) |
| 08 | `08-shelter` | Second Chance Animal Rescue | image-alt (animal photos), label, aria-required-attr | vision test: real illustrations to describe |
| 09 | `09-salon` | Velvet & Vine Hair Studio | color-contrast, label, document-title | booking form |
| 10 | `10-news` | The Maple Street Journal | heading-order, link-name, image-alt | local news layout |
| 11 | `11-venue` | The Foundry Event Hall | **challenge**: image-of-text hero, div-soup dropdown, aria-hidden trap | scanner-invisible issues |
| 12 | `12-clinic` | Lakeside Family Medicine | **challenge**: decorative-vs-informative images, fake `<div>` buttons | judgment-call issues |

## Layout of each fixture

```
NN-name/
├── index.html        # the site (self-contained; inline CSS; relative image paths)
├── *.html            # additional pages (07 only)
├── images/*.svg      # meaningful illustrations (the vision fixer really looks at them)
└── meta.json         # ground truth: scanner-verified violation counts + seeding notes
```

`meta.json` schema:

```json
{
  "name": "Wildflour Bakery",
  "kind": "standard | challenge",
  "pages": ["index.html"],
  "expected": { "wcagNodes": 11, "bestPracticeNodes": 4 },
  "seeded": [ { "rule": "image-alt", "count": 4, "where": "hero + gallery" } ],
  "beyondScanner": [ "notes on issues axe cannot detect (challenge fixtures)" ]
}
```

`expected` counts are **verified** against `node stepfree/eval/scan-fixture.mjs fixtures/NN-name` - the eval refuses to run on a fixture whose live scan disagrees with its meta.json, so results can't drift from ground truth.

## Rules the suite covers

WCAG A/AA (primary metric): `image-alt`, `color-contrast`, `label`, `select-name`, `button-name`, `link-name`, `html-has-lang`, `html-lang-valid`, `document-title`, `meta-viewport`, `listitem`, `list`, `aria-hidden-focus`, `aria-required-attr`, `aria-valid-attr-value`.
Best-practice (secondary tier): `heading-order`, `landmark-one-main`, `region`, `page-has-heading-one`, `tabindex`, `empty-heading`.

Challenge fixtures additionally seed issues **no scanner can detect** (image-of-text heroes, click-handler `<div>` "buttons", ambiguous decorative images) to measure how each system behaves at the edge of automation - the honest boundary our product claims respect.
