# AGENTS.md

Marketing site for Aurora Borealis Dev (web development, SEO, online marketing studio in
Sarajevo). Live at https://auroraborealis.dev, served by GitHub Pages from `master` (root),
custom domain in `CNAME`.

## Principles

- **Static and simple.** Plain HTML, one stylesheet, one script. No framework, no bundler,
  no npm dependencies. The only build step is the translation generator (Node, built-ins only).
  Don't add tooling unless it clearly pays for itself.
- **Every page is crawlable as-is.** All content must be in the HTML a crawler receives.
  Never render text with JavaScript; JS is for enhancement only (menu, theme, animations).
- **SEO and UX are the product.** This site is the studio's own showcase, so changes should
  keep or improve Lighthouse scores (performance, accessibility, best practices, SEO).

## Layout

| Path | What it is |
|---|---|
| `index.html` | English page and **source of truth** for markup |
| `bs/index.html` | Bosnian page, **generated**. Never edit by hand |
| `translations/bs.json` | Bosnian strings, keyed by `data-i18n*` attributes |
| `tools/build-translations.mjs` | Generates `<lang>/index.html` from `index.html` + `translations/<lang>.json` |
| `tools/og-image.html` | Source for `images/og-image.jpg` (1200x630 share image); regen command inside |
| `script.js` | Progressive enhancement, one `// ====` banner-commented block per feature |
| `styles.css` | All styles; theme tokens on `:root` (dark default) and `[data-theme="light"]` |
| `sitemap.xml`, `robots.txt` | Hand-maintained; update when URLs are added |
| `_config.yml` | Jekyll excludes: keeps repo-only files (this file, `tools/`, `translations/`...) off the live site. Add new repo-only files here |
| `.github/workflows/translations.yml` | On push to master: regenerates and commits translated pages; fails on missing keys |
| `text/descriptions` | Notes/draft copy, not served content |

## Translations (en, bs)

- Mark translatable content in `index.html`:
  - `data-i18n="key"` replaces element contents (HTML allowed in the value)
  - `data-i18n-attr="content:key;alt:key2"` replaces attribute values
  - `data-i18n-json="description:key"` replaces top-level fields in a JSON-LD `<script>`
- Add the key to every `translations/*.json`, then run `node tools/build-translations.mjs`.
  Missing keys keep the English text and make the build exit 1.
- Untagged text is copied verbatim into every language. Brand, client and product names are
  intentionally untagged.
- Language choice is stored in a `lang` cookie; the inline head script redirects to the chosen
  version. Crawlers have no cookie and see each URL as-is.
- hreflang: `en` -> `/`, `bs`, `hr`, `sr-Latn` -> `/bs/`, `x-default` -> `/`. Keep the
  `<head>` links and `sitemap.xml` in sync.
- Use the `translate` skill for anything translation-related.

## Conventions

- **CSS:** mobile-first (`min-width` media queries at 640/768/1024px). Colors only through
  the custom properties; every new color needs a light-theme value too. Respect
  `prefers-reduced-motion` for any animation.
- **JS:** vanilla, inside the single `DOMContentLoaded` handler, one banner-commented block
  per feature. Third-party embeds (Calendly) load lazily near the viewport.
- **HTML:** one `<h1>` (hero), `<h2>` per section, no skipped levels. Every `<img>` gets a
  translated `alt` (`data-i18n-attr="alt:..."`), `width`/`height`, and `loading="lazy"` below
  the fold. Use real `<a href>` links for navigation, `<button>` for actions.
- **Theme:** cookie `theme=light|dark`, applied in the head before first paint.
- Keep comments sparse and explanatory (why, not what), matching the existing files.

## Checking work

- Preview locally from the repo root so `/bs/` and root-relative links resolve:
  `python3 -m http.server 8000` then open http://localhost:8000/ and /bs/.
- After editing `index.html` or translations: `node tools/build-translations.mjs` (exit 0).
- Before shipping SEO/UX-relevant changes, use the `seo-audit` skill.
- Check both themes and a ~375px viewport for any visual change.
- Commit messages follow `feat:` / `fix:` / `hotfix:` / `chore:` prefixes.
