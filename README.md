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

## Deploy on Cloudflare (auto-deploy from GitHub)

The repo deploys as a **Cloudflare Worker with static assets** (what the dashboard creates by default when you
import a Git repository). `wrangler.jsonc` holds everything: the Worker name (`firedbunny`, must match the name in
the dashboard), the build command and the `dist` folder. In the dashboard keep the defaults: Deploy command
`npx wrangler deploy`, build command empty, root directory `/`. Every push to `main` deploys; other branches get
preview URLs if "non-production branch builds" is on.

Cloudflare **Pages** works too: Production branch `main`, Framework preset None, Build command
`python3 tools/build.py`, Build output directory `dist`.

Optional build variable: `SITE_URL` = your final address, e.g. `https://firedbunny.com` (used in link previews).

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

## Lesson narration (audio)

Every lesson page has a "Listen to this lesson" player (`src/mod-z-narration.js`): chapters, speed, a mini player
while you scroll, lock-screen controls. Recorded audio lives in `public/audio/lessons/<lesson-id>.mp4` and is listed
in the generated `src/mod-z-narration-data.js`; a lesson without a recording (or the claude.ai preview) reads the same
script with the device's own voice.

The voice is Kokoro-82M (Apache-2.0), voice `af_heart`, rendered offline:

```
pip install kokoro-onnx soundfile          # plus ffmpeg on PATH
# download kokoro-v1.0.onnx and voices-v1.0.bin from https://github.com/thewh1teagle/kokoro-onnx/releases into DIR
node tools/narration/make-scripts.js        # builds the spoken script from the lessons (same code as the player)
python3 tools/narration/render.py --model DIR [--max-minutes 100] [--ids l-a,l-b]
```

`render.py` only re-records lessons whose script changed (it keeps a hash per lesson in `tools/narration/manifest.json`).
Edit a lesson, run both commands again, commit the new `.mp4` files and the regenerated data file.

## Tests (optional, need Playwright + Chromium)

```bash
python3 tools/sitetest.py --fuzz          # every route at 1280 and 375 px
python3 tools/harness.py mod-x.js         # one module's widgets
```
