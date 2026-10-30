---
name: seo-audit
description: Audit the site for SEO, performance and accessibility before shipping, or when the user asks how the site ranks, loads, or could improve. Runs static checks on the HTML and Lighthouse via headless Chrome, then reports prioritized fixes.
---

# SEO and UX audit

Run from the repo root. Rebuild first so the generated pages are current:
`node tools/build-translations.mjs`.

## 1. Static checks (every page: `index.html`, `bs/index.html`, and any new page)

Inspect the `<head>` and markup for:

- `<html lang>` matches the page language.
- `<title>` is unique per page, about 60 characters or less, with the primary keyword
  near the start for local pages.
- `meta description` is unique and about 155 characters or less.
- `link rel="canonical"` points to the page itself (absolute URL, trailing slash).
- hreflang set is **identical** on every language version, includes `x-default`, and
  every target URL exists. `sitemap.xml` carries the same set for every `<url>`.
- `og:*` and `twitter:*` tags present; `og:image` is an absolute URL to a 1200x630 JPG/PNG.
- JSON-LD parses and uses only valid schema.org properties for its type:

  ```bash
  python3 -c "
  import re,json,sys
  for f in sys.argv[1:]:
    for m in re.findall(r'<script type=\"application/ld\+json\"[^>]*>(.*?)</script>', open(f).read(), re.S):
      json.loads(m); print(f, 'JSON-LD ok')
  " index.html bs/index.html
  ```

- Exactly one `<h1>`; `<h2>` per section; no skipped heading levels. The `<h1>` should
  carry meaning for search, not only a slogan.
- Every `<img>` has a meaningful, translated `alt`, plus `width`/`height`; below-the-fold
  images use `loading="lazy"`.
- Internal navigation uses real `<a href>`; no content is injected by JS.
- `sitemap.xml` is valid (`xmllint --noout sitemap.xml`), lists every public URL, and
  `robots.txt` references it.

## 2. Lighthouse (performance, accessibility, best practices, SEO)

Serve locally and run Lighthouse against both languages, mobile (default) and desktop:

```bash
python3 -m http.server 8000 >/dev/null 2>&1 &
SERVER=$!
OUT=$(mktemp -d)
mkdir -p "$OUT"
for path in "" "bs/"; do
  name=${path:-en}; name=${name%/}
  npx -y lighthouse "http://localhost:8000/$path" --quiet \
    --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path="$OUT/$name.json"
done
kill $SERVER
for f in "$OUT"/*.json; do
  node -e '
    const r = require(process.argv[1]);
    console.log(process.argv[1].split("/").pop(), Object.values(r.categories).map(c => `${c.title}: ${Math.round(c.score * 100)}`).join(" | "));
    for (const a of Object.values(r.audits)) if (a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative") console.log("  -", a.title);
  ' "$f"
done
```

Notes:
- Local scores ignore CDN and HTTPS effects; spot-check the live site too
  (`https://auroraborealis.dev/`, `/bs/`) when the change is deployed.
- Calendly is lazy-loaded near the contact section; don't flag it unless it loads early.
- Key Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms.

## 3. UX spot checks

- Both themes (`document.cookie = "theme=light"` / `dark`), at ~375px and desktop widths:
  no horizontal scroll, readable contrast, tap targets of 44px or more.
- Keyboard: Tab through nav, language switch, theme toggle, CTAs; focus is visible.
- `prefers-reduced-motion` disables the aurora and fade animations.

## 4. Report

List findings ordered by impact (indexing problems > ranking signals > performance > polish),
each with the file and line and a concrete fix. Fix only what the user approves, unless they
asked for fixes up front.

## Off-site items to remind the user about

Not fixable in code, but they matter for local ranking: a Google Business Profile for the
Sarajevo office, a LinkedIn company page (add it to JSON-LD `sameAs`), Search Console with
the sitemap submitted, and client reviews and backlinks.
