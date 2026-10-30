---
name: add-section
description: Add or redesign a section of the site (e.g. testimonials, FAQ, a new service, a project card) in a way that stays translatable, themeable, accessible and SEO-friendly. Use for any new visible content or layout change in index.html.
---

# Adding or changing a section

## Markup (`index.html`)

- Copy the shape of a neighboring section: `<section id="..." class="...">` >
  `.container` > `.section-subtitle` / `h2.section-title` / `.section-description`.
- Give it an `id` if it should be linkable from the nav or footer, and add the links in
  both the desktop and mobile nav lists if it belongs there.
- Headings: one `<h2>` for the section, `<h3>` for cards inside it. Put the words people
  actually search for in headings and the first sentence, without keyword stuffing.
- Tag every visible string and translatable attribute for translation (see the `translate`
  skill). Build and fill `translations/*.json` in the same change.
- Images: put them in `images/`, compress them (AVIF/WebP for photos, under ~200KB, sized
  to their displayed width at 2x), and give each one translated `alt`, `width`/`height`,
  and `loading="lazy"`.
- Icons: inline SVG with `stroke="currentColor"`, matching the existing 24x24 icons.
- Interactive elements: `<a href>` for navigation, `<button type="button">` for actions,
  `aria-label` (translated through `data-i18n-attr`) when there's no visible text.

## FAQ and other rich-result content

For an FAQ, add a matching `FAQPage` JSON-LD block whose questions and answers mirror the
visible text exactly, and make its fields translatable with `data-i18n-json`. Note that the
builder only swaps **top-level** fields, so nested Q&A needs either a builder extension or a
per-language key that holds the whole `mainEntity` array; discuss this with the user first.

## Styles (`styles.css`)

- Mobile-first: base styles for phones, then `@media (min-width: 640px | 768px | 1024px)`.
- Use the existing tokens (`--color-*`, `--aurora-*`, `--radius`, `--transition`,
  `--section-padding`). Any new color token needs a `[data-theme="light"]` value too.
- Animations: wrap them in a `prefers-reduced-motion: reduce` override. To make cards fade
  in, add their selector to `fadeElements` in `script.js` instead of writing new observers.
- Avoid layout shift: reserve space for anything that loads late (embeds, images).

## Behavior (`script.js`)

Only if needed. Add a banner-commented block inside the existing `DOMContentLoaded` handler.
The section must be fully readable with JS disabled.

## Finish

1. `node tools/build-translations.mjs` exits 0.
2. Preview with `python3 -m http.server 8000`: `/` and `/bs/`, both themes, ~375px and
   desktop.
3. Run the `seo-audit` skill's static checks; run Lighthouse for larger changes.
4. If the change adds a new URL (not just a section), update `sitemap.xml` and the
   hreflang links.
