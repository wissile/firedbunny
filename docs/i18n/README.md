# FiredBunny in other languages

Plan (owner's decisions, Nov 27 2026): French for France (`/fr/`), Spanish for Mexico and Colombia (`/es/`), Portuguese
for Brazil (`/pt/`) and Danish for Denmark (`/da/`), launched together with narration. US-only lessons are rewritten
per country (sourced like the English ones) or hidden until a local version exists. Work happens on the `i18n` branch
and, once wired in, stays hidden on the live site (noindex, menu only with `?preview=languages`) until launch.

## How text gets translated

- `tools/i18n/segments.js` parses every `src/*.js` file (acorn) and finds the visible text: template-literal and string
  text between block-level HTML tags (inline tags and `${...}` placeholders, written `{0}`, stay inside a segment),
  plus `title` / `aria-label` / `placeholder` / `alt` attributes. Each segment is keyed by the sha1 of its English.
- Where a string sits decides how it is translated (`classify`):
  - **in the code**: sentences, HTML, lesson and page text are replaced in a translated copy of the source;
  - **on screen**: short labels the code may also use as values (button options, compared strings, table row names,
    state defaults) stay English in the code and `src/i18n.js` swaps them by exact match as pages draw;
  - **never**: keys, selectors, ids, classes, event names, CSS, URLs.
- A translation must keep every `{N}` placeholder and every tag, or it is ignored and the English stays.

## Checking the extractor

```
node tools/i18n/pseudo.js /tmp/xx/src                       # every segment becomes ⟦àççéñtéd⟧ text
FB_SRC=/tmp/xx/src FB_DIST=/tmp/xx/dist FB_BUILD=/tmp/xx/build python3 tools/build.py --no-prerender
python3 tools/i18n/crawl.py /tmp/xx/dist --compare dist     # script errors, pages that stopped drawing
```
`crawl.gaps()` lists visible English without a ⟦marker⟧ (text the extractor missed). Nov 27 2026: 286 pages, no
errors, about 470 missed strings left (calendar data rows, dates, a few concatenations), to be fixed in the source.

Install the parser once: `cd tools/i18n && npm ci`.

## Building the languages (Nov 28 2026)

- `tools/i18n/langs.json`: each language's address prefix, page names, section folders, countries (locale, currency,
  time zones, money scale) and `live` flag. French and Danish are `paused` (EU legal questions).
- `python3 tools/build.py` builds English, then each active language that has a `tools/i18n/<lang>/` folder:
  `make.js build` writes the translated copy, and build.py runs again with `FB_LANG` into `dist/<prefix>/`
  (`app-<lang>.<hash>.js`, its own 404 page, its pre-built pages). `FB_LANGS=es,pt` limits the languages,
  `FB_LANGS=none` skips them, `FB_PSEUDO=1` fills untranslated text with pseudo-text (testing).
- Until a language is `live`: every page is noindex, it has no sitemap, lastmod record, preview images or hreflang, and
  the footer language menu shows only in a browser that opened `?preview=languages`.
- Addresses: `/es/lecciones/<slug>/` etc., made from the translated titles (accents removed). They are frozen into
  `tools/i18n/<lang>/frozen.json` at launch. The language menu links `/<prefix>/?to=<token>`; that language's router
  opens the page and shows its own address.
- Money: `SML.fmt.usd` stays US dollars (US$ outside English: US stocks and options); `SML.fmt.loc` / slider formats
  `loc`, `loc0` are local money (MXN, COP, BRL), and local-money sliders scale their range by the country's
  `scale`. In English `loc` is dollars, so switching a personal-finance calculator to `loc` changes nothing there.
  Dates and numbers use `SML.locale` everywhere (no more hard-coded en-US).
- Spanish: Mexico and Colombia share `/es/`; the footer has a country picker (`fb-country`), and the first visit picks
  Colombia from the America/Bogota time zone.
- The service worker serves each language's own shell (`BUILD.langs`), saved on the first visit to that language.
- Text the code reads (a range written in a sentence, a label compared in code) must not depend on English: keep such
  values as data (example: `SML.realco.spacex.call.guide`).
