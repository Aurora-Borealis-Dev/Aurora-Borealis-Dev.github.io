---
name: translate
description: Add, change or fix translated text on the site, tag new content for translation, or add a whole new language. Use whenever copy changes in index.html, a translation looks wrong, the translations CI run fails, or the user asks for another language version.
---

# Translations

`index.html` is English and the markup source. `translations/<lang>.json` holds the other
languages. `tools/build-translations.mjs` writes `<lang>/index.html`. Generated pages are
never edited by hand; CI regenerates and commits them on push to master.

## Change existing copy

- English: edit `index.html`. If the meaning changed, update the same key in every
  `translations/*.json` too. The build can't detect a stale translation, only a missing one.
- Other language: edit only `translations/<lang>.json`. Keep the key, change the value.
- Values may contain HTML. Keep inline markup that JS or CSS depends on, e.g.
  `<span data-years>5</span>` (years counter) and `<strong>`.
- Escape `"` as `\"` in JSON values. Typographic quotes („“) need no escaping.

## Tag new content

1. Pick a key named by section and role, following existing ones: `services.title`,
   `web.f1`, `p2.image.alt`, `meta.og.title`.
2. Tag the element in `index.html`:
   - text: `<h3 data-i18n="web.title">Web Development</h3>`
   - attributes: `data-i18n-attr="alt:p1.image.alt"` or `"content:meta.description"`;
     several pairs separated by `;`
   - JSON-LD fields: `data-i18n-json="description:meta.description"`
3. `data-i18n` elements must not contain a nested element with the same tag name (the
   builder matches up to the first closing tag). Tag the inner element instead.
4. Add the key to every `translations/*.json`, near related keys.
5. Run `node tools/build-translations.mjs`. It must exit 0 and print no "missing" line.
6. Find leftover English text on generated pages:

   ```bash
   strip(){ sed -e '/<svg/,/<\/svg>/d' -e '/<script/,/<\/script>/d' -e '/<style/,/<\/style>/d' "$1" \
     | sed -e 's/<[^>]*>/\n/g' | sed 's/^ *//;s/ *$//' | grep -v '^$' | sort -u; }
   comm -12 <(strip index.html) <(strip bs/index.html)
   ```

   Only brand, client and product names, numbers and emoji should be listed.

## Writing Bosnian copy

- Write naturally in ijekavian Bosnian (rješenje, vrijeme, cijena), not word-for-word
  translations. Use the formal "vi" when addressing the reader, as the existing copy does.
- `meta.title` and `meta.description` target local searches ("izrada web stranica",
  "Sarajevo"). Keep titles to about 60 characters and descriptions to about 155.
- Flag new copy to the user for review by a native speaker.

## Add a language (e.g. `de`)

1. Copy `translations/bs.json` to `translations/de.json` and translate every value. Set
   `meta.url` to `https://auroraborealis.dev/de/`, plus `meta.locale` and `meta.locale.alt`.
2. In `index.html` `<head>`, add `<link rel="alternate" hreflang="de" href=".../de/">`.
   The generator copies it into every language.
3. Add the same `xhtml:link` to **every** `<url>` in `sitemap.xml`, and add a `<url>` for `/de/`.
4. In the inline head script, add `de: '/de/'` to `pages` and add `de` to the cookie regex.
5. Add a `.lang-option` link for the new language to the nav switcher, and adjust the CSS
   rule that shows only the other language's flag (look near `.lang-toggle` in
   `styles.css`); with three languages it needs a dropdown or all flags.
6. Add the language's number words to `numberWords` in `script.js`.
7. Build, then follow the checks in the `seo-audit` skill.
