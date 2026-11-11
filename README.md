# FiredBunny: website source

"The money school they skipped." One static site, no server needed. `tools/build.py` bundles everything in `src/`
into a single page and copies the static files in `public/` next to it.

## Build

```bash
python3 tools/build.py        # Python 3.8+ standard library only
```

| Output | What it is |
|---|---|
| `dist/` | The website: `index.html`, `app.<hash>.js`, `sw.js` and everything from `public/` (audio, fonts, icons, `_headers`, manifest). Deploy this folder. |
| `build/fragment.html` | The same page without the document skeleton, used to publish the claude.ai artifact version. |

Preview locally: `python3 -m http.server 8000 --directory dist` and open http://localhost:8000.

## Deploy on Cloudflare (auto-deploy from GitHub)

The repo deploys as a **Cloudflare Worker with static assets**. `wrangler.jsonc` holds everything: the Worker name
(`firedbunny`), the build command and the `dist` folder.

Every push to `main` deploys through GitHub Actions (`.github/workflows/deploy.yml`): it builds the site, runs
`wrangler deploy`, then checks that the live page matches the build and reads `/api/health`. The result appears as
a green check or red cross on the commit, with the live address in the run's notes. Other branches do not deploy.

One-time setup in GitHub, **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Workers & Pages → Account ID in the right-hand column |

Optionally add a repository *variable* `SITE_URL` (your custom domain) on the Variables tab. Then run the workflow
once from the Actions tab (Run workflow) or push any commit. If Cloudflare's own Git integration (Workers Builds) is
also connected, disconnect it so pushes do not deploy twice.

Cloudflare **Pages** serves the lessons too (Production branch `main`, Framework preset None, Build command
`python3 tools/build.py`, Build output directory `dist`), but Pages does not run `worker/index.js`, so the
Earnings lookup has no live data there and shows its sample. Use the Worker deploy for live lookups.

`SITE_URL` = your final address, e.g. `https://firedbunny.com`, is used in link previews (GitHub repository variable
for the Worker deploy, build variable on Pages).

### Live earnings data (the `/api` relay)

The Earnings lookup reads the SEC's public filings and a price history through `worker/index.js`. The SEC turns
automated requests away (error 403) unless the User-Agent names a contact email, so set one variable in the
Cloudflare dashboard: **Workers & Pages → firedbunny → Settings → Variables and Secrets → Add**, type *Text*,
name `SEC_UA`, value `FiredBunny your@email.com`. `keep_vars` in `wrangler.jsonc` keeps it across deploys.

To check the relay, open **`/api/health`** on your site. It tests the SEC ticker list, company facts and filing
index plus both price sources (Yahoo Finance, Stooq) and gives a one-line verdict. It reports whether `SEC_UA` is
set, never its value. When a lookup fails, the page also shows the reason and a "For the site owner" hint.

## Offline and the app

The website works offline and installs as an app (phone home screen, or its own window on a computer):

- The website build is a small `index.html` (styles, the running-bunny loading screen, a starter) plus one script file
  named by its content, `app.<hash>.js`, cached for a year. The loading screen paints at once and keeps running while
  the script starts; browsers keep a compiled copy of the script between visits. (The claude.ai copy stays one file.)
- `src/sw.js` is the service worker; `tools/build.py` writes it to `dist/sw.js` with a build version and the list of
  files to save at install (page, script, fonts, icons, manifest). Every visit opens the saved copy at once. A new
  deploy changes `sw.js`, the browser installs it in the background, and the page shows "A new version of FiredBunny
  is ready" with a Reload button.
- The main fonts are preloaded and the loading screen stays until they are in (at most 1.2 s), so text never
  repaints in a fallback font.
- Lesson audio is saved only when the visitor asks: the Download button in each lesson's player, or the
  **Offline & app** page (`#offline`, `src/mod-z-offline.js`) with download all, per track, remove, storage use and
  install steps for Android, iPhone and computers. Saved audio plays offline in the natural voice, with seeking.
- Audio URLs carry `?v=<file hash>` (from `window.FB_ASSETS`, written by the build), so a re-recorded lesson never
  plays from an old copy and the Offline page offers to update it.
- Fonts are self-hosted in `public/fonts/` (`tools/vendor_fonts.py`); the claude.ai copy still uses Google Fonts and
  has no offline mode.
- `worker/index.js` answers byte-range requests for `/audio/*` (static assets alone always send the whole file, and
  iPhones and iPads need ranges to play and seek audio).
- If the service worker ever misbehaves, deploy a `src/sw.js` whose `activate` handler calls
  `self.registration.unregister()` and deletes its caches; browsers pick it up on the next visit (`/sw.js` is served
  with `Cache-Control: no-cache`).

## Where things live

| Path | What to edit there |
|---|---|
| `src/style.css` | Colors, fonts, every shared component style |
| `src/core.js`, `src/brand.js` | Helpers, the FiredBunny marks and art |
| `src/content*.js` | Tracks, courses, tools, glossary, real-company data (`content-realco.js`) |
| `src/mod-*.js` | Lessons and their interactive widgets, one file per group of courses |
| `src/account.js`, `src/mod-y-*.js` | Profile storage, self-assessment, results, dashboard, settings, About |
| `src/pages.js` | Navigation, footer, home, course, lesson, tools and glossary pages |
| `public/` | Files served as-is: `audio/` (lesson narration and earnings calls), `fonts/`, icons, `og-image.jpg`, `_headers`, `robots.txt`, `site.webmanifest` |
| `src/sw.js`, `src/mod-z-offline.js` | Offline mode: the service worker, audio downloads, install steps and the Offline & app page |
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
