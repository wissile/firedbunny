# FiredBunny: website source

"The money school they skipped." One static site, no server needed. `tools/build.py` bundles everything in `src/`
into a single page and copies the static files in `public/` next to it.

## Build

```bash
python3 tools/build.py        # Python 3.8+ standard library only
```

| Output | What it is |
|---|---|
| `dist/` | The website: `index.html` plus everything from `public/` (audio, icons, `_headers`, manifest). Deploy this folder. |
| `build/fragment.html` | The same page without the document skeleton, used to publish the claude.ai artifact version. |

Preview locally: `python3 -m http.server 8000 --directory dist` and open http://localhost:8000.

## Deploy on Cloudflare Pages (auto-deploy from GitHub)

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick this repository, then:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Build command | `python3 tools/build.py` |
| Build output directory | `dist` |
| Root directory | (leave empty) |
| Environment variable (optional) | `SITE_URL` = your final address, e.g. `https://firedbunny.com` (used in link previews) |

Every push to `main` deploys to production; pushes to any other branch get their own preview URL.

## Where things live

| Path | What to edit there |
|---|---|
| `src/style.css` | Colors, fonts, every shared component style |
| `src/core.js`, `src/brand.js` | Helpers, the FiredBunny marks and art |
| `src/content*.js` | Tracks, courses, tools, glossary, real-company data (`content-realco.js`) |
| `src/mod-*.js` | Lessons and their interactive widgets, one file per group of courses |
| `src/account.js`, `src/mod-y-*.js` | Profile storage, self-assessment, results, dashboard, settings, About |
| `src/pages.js` | Navigation, footer, home, course, lesson, tools and glossary pages |
| `public/` | Files served as-is: `audio/` (narrated earnings calls), icons, `og-image.jpg`, `_headers`, `robots.txt` |
| `research/` | Sources and verified figures behind the lessons |
| `SPEC*.md` | Conventions for lessons and widgets |

## Accounts and storage

On a normal website (Cloudflare Pages) every visitor's progress, profile and assessments are saved in their own
browser, with export/import in Settings; the sign-in page explains this. When the same page runs as a claude.ai
artifact it can also save to a private per-person profile through the viewer's Claude account. Real accounts on the
public site (and the feedback inbox) need a backend, for example Cloudflare Pages Functions with KV or D1.

## Tests (optional, need Playwright + Chromium)

```bash
python3 tools/sitetest.py --fuzz          # every route at 1280 and 375 px
python3 tools/harness.py mod-x.js         # one module's widgets
```
