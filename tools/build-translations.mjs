/* ============================================
   Aurora Borealis Dev - Translated page builder

   index.html (English) is the source of truth. For every
   translations/<lang>.json this writes <lang>/index.html, swapping:
     data-i18n="key"                  -> element contents (HTML allowed)
     data-i18n-attr="attr:key;attr:key" -> attribute values
     data-i18n-json="field:key;field:key" -> top-level fields of a JSON-LD
                                             <script>
   Relative asset paths get a "../" prefix so they resolve from /<lang>/.

   Run after editing index.html or a translation file:
     node tools/build-translations.mjs
   CI (.github/workflows/translations.yml) also runs it on every push to
   master and commits the result, so a forgotten rebuild fixes itself.
   ============================================ */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(ROOT, 'index.html'), 'utf8');

const escapeAttr = value => value.replace(/&(?!#?\w+;)/g, '&amp;').replace(/"/g, '&quot;');

function translate(html, dict, lang) {
  const missing = new Set();
  const lookup = key => {
    if (!(key in dict)) missing.add(key);
    return dict[key];
  };

  // Tagged elements never nest an element of the same tag, so a lazy match
  // up to the first matching close tag is enough.
  html = html.replace(
    /<([a-z][a-z0-9]*)([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g,
    (match, tag, before, key, after, content) => `<${tag}${before}${after}>${lookup(key) ?? content}</${tag}>`
  );

  html = html.replace(/<[a-z][^>]*\sdata-i18n-attr="([^"]+)"[^>]*>/g, (tag, spec) => {
    tag = tag.replace(/\sdata-i18n-attr="[^"]+"/, '');
    for (const [attr, key] of spec.split(';').map(pair => pair.split(':'))) {
      const value = lookup(key);
      if (value !== undefined) {
        tag = tag.replace(new RegExp(`(\\s${attr}=")[^"]*"`), `$1${escapeAttr(value)}"`);
      }
    }
    return tag;
  });

  html = html.replace(/<script([^>]*?)\sdata-i18n-json="([^"]+)"([^>]*)>([\s\S]*?)<\/script>/g, (match, before, spec, after, json) => {
    const data = JSON.parse(json);
    for (const [field, key] of spec.split(';').map(pair => pair.split(':'))) {
      const value = lookup(key);
      if (value !== undefined) data[field] = value;
    }
    const body = JSON.stringify(data, null, 2).replace(/^/gm, '  ');
    return `<script${before}${after}>\n${body}\n  </script>`;
  });

  // Missing keys keep the English text so the page still builds, but the
  // run exits non-zero so CI flags it
  if (missing.size) {
    console.error(`${lang}: missing translations (English kept) for ${[...missing].join(', ')}`);
    process.exitCode = 1;
  }

  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(/(\s(?:href|src)=")(?![a-z]+:|\/|#)/g, '$1../')
    .replace('<!DOCTYPE html>', `<!DOCTYPE html>\n<!-- Generated from index.html + translations/${lang}.json by tools/build-translations.mjs. Do not edit by hand. -->`);
}

for (const file of readdirSync(join(ROOT, 'translations')).filter(f => f.endsWith('.json'))) {
  const lang = file.replace(/\.json$/, '');
  const dict = JSON.parse(readFileSync(join(ROOT, 'translations', file), 'utf8'));
  const outDir = join(ROOT, lang);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), translate(source, dict, lang));
  console.log(`Wrote ${lang}/index.html`);
}
