# FiredBunny technical SEO implementation

**Date:** 12 November 2026 · **Branch:** `seo-implementation` (not merged, **not deployed**: `main` deploys, and
deploying needs the owner's go-ahead) · Builds on [AUDIT.md](AUDIT.md) (findings F01–F18) and
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) (tasks T1–T26).

## What changed, in one paragraph

Every page now has a permanent, crawlable address (`/lessons/wheel-strategy/` instead of `/#l-wheel`) and its own
pre-built HTML file containing the page's content, its own title, description, canonical, robots, link-preview tags
and JSON-LD. Unknown addresses return a real 404. A sitemap lists the 260 indexable pages with real `lastmod` dates.
This was done inside the existing vanilla-JavaScript app, with no framework migration and no new runtime dependency.
The router uses the History API on the website, and the existing Playwright prerender step was extended from the
home page to every route. All metadata is generated from the content data, so new lessons, tools and notes get it
automatically. The claude.ai copy keeps `#token` routing, and user progress, interactions and calculators are
unchanged.

## Commits (branch `seo-implementation`)

| Commit | Batch |
|---|---|
| `4624372` | Permanent page addresses: real paths with the History API |
| `4c5e5f8` | Search metadata and a pre-built page for every address, sitemap and real 404s |
| `b867b11` | Performance: small bunny art on home and lessons pages, measured font and script loading |
| (this commit) | Search checks in the build and deploy workflow, documentation |

## Architecture

| Piece | File | What it does |
|---|---|---|
| Addresses | `src/routes.js` | `FROZEN`: the permanent path of all 267 pages (from URL_INVENTORY.csv `recommended_url`). New content gets an automatic path from its title until frozen. `PRIVATE`: the 6 per-visitor pages (noindex). `CANONICAL_OF`: `/learn/` points to `/tracks/trading/` (same content). Helpers: `path`, `token`, `href`, `fromHref`, `exists`, `all`. Mode `path` on the website, `hash` in the claude.ai copy and on `file://` |
| Router | `src/pages.js` | Reads `location.pathname`; `pushState` / `popstate`; handles clicks on internal links in place (modifier clicks and `target` are left to the browser); old `#token` links are moved to the real address with `replaceState`; code that still sets `location.hash` keeps working. Templates still write `href="#token"`: `linkify()` (after each render, plus a `MutationObserver` for links added later) rewrites them to real paths, so the pre-built HTML has crawlable links. In-page anchors (`#quiz`, `/glossary/#g-vwap`) are left alone. Unknown paths draw the Not found page |
| Metadata | `src/seo.js` | `SML.seo.meta(tok)`: title, description, canonical, robots, Open Graph/Twitter. `SML.seo.jsonld(tok, {lastmod})`: structured data. `SML.seo.apply(tok)`: keeps the live head in step after in-app navigation (website only). Descriptions come from lesson `idea`/`summary`, course and tool `blurb`, note `excerpt`; a short `TITLES` map gives 19 lessons and 23 tools with one- or two-word titles, plus 11 named pages and the Not found page, a descriptive title |
| Head block | `tools/seohead.py` | Writes the `<!--seo-->` … `<!--/seo-->` block; `tools/build.py` writes the home default and a basic `404.html` |
| Pre-built pages | `tools/prerender.py` | Opens the built site in Chromium, visits every route through the router, writes `dist/<path>/index.html` with the head block, a snapshot of header + page + footer, and the CSS rules it uses. Per-visitor pages get noindex and no snapshot. Writes `dist/404.html` (Not found snapshot) and `dist/sitemap.xml`. ~50 s for 267 pages |
| lastmod | `tools/seo-lastmod.json` | Per page: a hash of its text (widgets, charts and `data-volatile` parts excluded) and the date it last changed. A changed hash sets today's date; a new page takes the last git commit date of the file that defines it. Verified stable: an unchanged rebuild and a 40-day clock shift change nothing |
| Checks | `tools/seo_check.py` | Run by the build. Fails on a sitemap URL without its page, noindex in the sitemap, a wrong or missing canonical, a duplicate or missing title or description, a snapshot without exactly one H1, `#token` links left in a snapshot, invalid JSON-LD, robots.txt without the Sitemap line, or a `404.html` without noindex. In CI any error stops the deploy |
| Server | `wrangler.jsonc`, `public/_headers`, `public/robots.txt` | `not_found_handling: "404-page"`. `X-Robots-Tag: noindex` on the workers.dev host only. Sitemap and robots cached 1 h. robots.txt allows everything and lists the sitemap |
| CI | `.github/workflows/deploy.yml` | Playwright is now required (no pre-built pages, no deploy). After deploy it also checks a lesson page and its canonical, that the live sitemap matches the build, the robots Sitemap line, and a real 404 |

## Problems resolved

| Audit finding | Status | How |
|---|---|---|
| F01 fragment URLs (critical) | **Fixed** | Real paths for all 267 pages (T6) |
| F02 content not in initial HTML (critical) | **Fixed** | Every public page pre-built: lesson pages carry a median of 1,562 words in raw HTML (header and footer included), against 0 before (T7) |
| F03 soft 404s | **Fixed** | `404-page` handling + `404.html` (noindex): unknown paths, `/llms.txt` and `/l-wheel` return 404 (T4) |
| F04 no sitemap | **Fixed** | `sitemap.xml` with 260 URLs and real lastmod; robots `Sitemap:` line (T10) |
| F05 duplicate hosts, no canonicals | **Partly** | Self canonicals on every indexable page; workers.dev marked noindex. HTTP→HTTPS and `www` need the owner (Cloudflare dashboard, see below) (T1–T3, T9) |
| F06 one title/description | **Fixed** | 260 indexable pages: 0 duplicate titles, 0 duplicate descriptions, descriptions 76–164 characters (T8) |
| F07 link previews | **Fixed** | Absolute `og:image` with size and alt, `og:url`, per-page `og:title`/`og:description`, `og:type` article for lessons and notes; no longer depends on `SITE_URL` |
| F08 no structured data | **Fixed** | See "Structured data" below (T13) |
| F11 glossary not crawlable | **Fixed** | `/glossary/` pre-built with all 463 terms as `<dl>`; each term has a stable anchor (`/glossary/#g-vwap`) (T20) |
| F12 performance | **Improved** | Lab LCP on lesson and tool pages 10.9 s / 10.6 s → 2.3 s / 2.4 s; home bunny image 147 KB → 17 KB (see Performance) |
| F14 breadcrumbs without data | **Fixed** | BreadcrumbList JSON-LD matching the visible breadcrumbs |
| F15 crawlers get only the home page | **Fixed** | Every crawler now gets each page's own HTML |
| F17 manifest shortcuts | **Fixed** | `/learn/`, `/offline/` |
| F09 trust signals, F10 thin hubs, F13 heading skips, F18 brand text | **Not done** | Editorial work (T14–T19); heading skips (T15) not changed |

## Structured data: what was evaluated

Following Google's search gallery (updated 2026-10-16) and the feature pages:

| Type | Used | Where / why |
|---|---|---|
| Organization | Yes | Home: name, url, logo (512 px icon), description. No `sameAs` (no verified social profiles) |
| WebSite | Yes | Home: name `FiredBunny` (site-name signal), publisher reference |
| BreadcrumbList | Yes | Lessons (Track › Course › Lesson), courses (Track › Course), tools (Tools › Tool), notes (Trade notes › Note), matching the visible trail |
| Article | Yes | 159 lessons and 5 notes. Author and publisher: the FiredBunny organization (no invented person). `dateModified` = the page's lastmod; notes also `datePublished` (their real date) |
| LearningResource | As properties | `learningResourceType`, `educationalLevel`, `timeRequired`, `teaches` on the lesson Article (all valid CreativeWork properties). No Google feature uses them; added for clarity to other consumers |
| Course / Course list | **No** | Google limits Course markup to curricula with "instructors leading a roster of students"; FiredBunny's courses are self-paced |
| SoftwareApplication (calculators) | **No** | Google's software app result requires real ratings or reviews; there are none, and none will be invented |
| FAQPage, HowTo | **No** | FAQ rich results ended May 2026; HowTo retired 2023 |

Markup describes what each page visibly shows. It helps search engines understand pages; it does not guarantee rich
results or AI citations.

## Addresses, redirects and status codes (verified with `wrangler dev`, Cloudflare's runtime)

| Request | Result |
|---|---|
| `/`, `/lessons/wheel-strategy/`, `/tools/position-size/`, `/courses/options-and-the-wheel/`, `/glossary/`, `/notes/wheel-40/` | 200, page's own title |
| `/lessons/wheel-strategy` (no slash), `/lessons/wheel-strategy/index.html`, `/index.html` | 307 to the canonical slash form (Cloudflare `html_handling`) |
| `/this-page-does-not-exist`, `/l-wheel`, `/llms.txt` | 404, Not found page, `noindex` (navigation and non-navigation requests) |
| `/dashboard/` (and the other per-visitor pages) | 200, `noindex, follow`, not in the sitemap |
| `/sitemap.xml` | 200 `application/xml`, 260 URLs |
| `/robots.txt` | 200, `Sitemap: https://firedbunny.com/sitemap.xml` |
| `/audio/lessons/l-wheel.mp4` with `Range` | 206 (unchanged) |
| Host `firedbunny.dosfirm.workers.dev` | `X-Robots-Tag: noindex` |
| Old link `/#l-wheel` | Loading screen, then `/lessons/wheel-strategy/` (client-side; the server never sees fragments) |

## Performance (measured)

Lighthouse 12.8.2, simulated mobile (slow 4G, 4× CPU), local server with gzip, **median of 3 runs**, same method
for both builds. "Before" is `main` at `e526d2c`.

| Page | Before: perf / LCP / TBT | After: perf / LCP / TBT | CLS |
|---|---|---|---|
| Home `/` | 88 / 2.4 s / 391 ms | 86 / 2.3 s / 473 ms | 0 → 0 |
| Lesson (`/#l-wheel` → `/lessons/wheel-strategy/`) | 61 / 10.9 s / 513 ms | 85 / 2.3 s / 528 ms | 0 → 0 |
| Tool (`/#tool-size` → `/tools/position-size/`) | 69 / 10.6 s / 243 ms | 87 / 2.4 s / 424 ms | 0 → 0 |

- **What helped:** pre-built pages (content paints from HTML instead of after the 1.4 MB script). The home page
  showed the bunny art at 96–132 px but loaded the 1200 px original, so it now uses a 264 px copy: 147 KB → 17 KB.
- **Tried and reverted, with evidence:**
  - Preloading only the 7 font faces visible above the fold added ~300 ms of start-up blocking at 4× CPU, as fonts
    arriving during the first render force a second layout.
  - A low-priority script preload made no measurable difference.
  - Running modules in time slices increased blocking: each slice became its own long task under throttling.
- **Measured but not changed:** images are WebP with dimensions (no layout shift); text compression is on; static
  assets already carry one-year immutable caching; HTML is `max-age=0, must-revalidate` (correct for pages that
  change on deploy).
- **Start-up cost:** in a real browser at 4× CPU, the longest start-up task is ~490 ms against ~410 ms before
  (median of 6), plausibly the new route, metadata and link code. It is dominated by the single 4.6 MB bundle:
  about 0.4 s parse/compile and 0.4–0.7 s evaluation, simulated. The fix is code splitting (T23). INP field data
  does not exist yet; TBT is only a lab proxy.

## Tests performed

| Test | Result |
|---|---|
| Strict CI build (`CI=1 python3 tools/build.py`): 267 pages pre-built, search checks | Pass, 0 errors, 0 warnings |
| `tools/seo_check.py` negative test (broken canonical, duplicate title, `#token` link, noindex in sitemap, robots `Disallow: /`) | All detected, exit 1 |
| Path navigation: clicks, back/forward, old `#` links, `location.hash` from older code, `SML.go`, unknown path, ctrl-click, token↔path round trip for all 267 routes | 15/15 |
| claude.ai copy (host emulated): `#token` routing, links, head left alone | 6/6 |
| `tools/sitetest.py`, every route at 1280 and 375 px | 266/266 clean |
| Audio player (autoplay to next lesson, lock-screen next/previous, skip buttons) | 12/12 |
| Analytics (events, page views with real paths, first page view, consent, opt-out) | 41/41 |
| Offline (service worker, offline pages via old links and via direct real addresses, saved audio with seeking) | 31/31 |
| Update flow (new version bar, reload gives the new version, old cache removed) | 5/5 |
| Raw HTTP vs rendered DOM on 16 pages across all content types, at 390 and 1280 px: status, title, description, canonical, og:url, snapshot H1 = live H1, text parity, CLS on takeover, JSON-LD parses, no script errors | 156/156 at each width |
| Status codes, redirects, headers in Cloudflare's runtime (`wrangler dev`) | As in the table above |
| Deploy-check search step, run against the local server | Pass |
| `node --check` on all sources; `py_compile` on all build tools | Pass |

There is no linter or type checker configured in the repo; none was added.

## Remaining issues

1. **Code splitting (T23)**: the 4.6 MB bundle drives start-up blocking. Next performance step; large.
2. **Editorial trust work (T14, T16–T19)**:
   - An editorial standards and methodology page.
   - Sources on the 57 lessons without them, and real review dates per lesson.
   - Calculator write-ups and fuller course hub pages.
   - Contextual links to the 21 rarely linked calculators.
3. **Heading-level skips** on 19 routes (T15).
4. **IndexNow on deploy (T12)** and **real-user Core Web Vitals in GA4 (T24)**: not implemented.
5. **`lastmod` discipline**: build before committing content changes, so `tools/seo-lastmod.json` goes in with them.
   Otherwise a deploy dates changed pages to the deploy day.
6. **Returning visitors** briefly see the pre-built state (for example a progress counter at 0) until the script takes
   over in the same frame. This is unchanged from the home page's existing behaviour. `/learn/` shows the loading
   screen instead when the visitor's saved track is not Trading.
7. **Pre-built page weight**: 267 files, median 120 KB raw (~20–35 KB compressed), about 31 MB per deploy upload.
   Within Cloudflare's limits.
8. **Seed dates**: first-seen `lastmod` values come from file-level git dates. Most content shows 2026-10-24 (the
   initial import) because the history before then is squashed.

## Deployment and owner actions

**Before merging to `main` (which deploys):**

1. **GA4: turn off "Page changes based on browser history events"** (Admin › Data streams › web stream › Enhanced
   measurement › Page views › advanced). This matters more now: the site changes pages with `pushState`, so with
   that setting on every in-site page change is counted twice.
2. Give the go-ahead to merge `seo-implementation` into `main`. Rollback: revert the merge commit, or deploy
   `backup-2026-11-11`.

**After the deploy:**

3. Confirm the "Deploy to Cloudflare" check (its notes now include the search checks), and republish the claude.ai
   copy from `build/fragment.html`.
4. Set the repository variable `SITE_URL = https://firedbunny.com`. Link previews no longer need it, but the live
   check otherwise tests workers.dev.
5. **Google Search Console**: verify the Domain property (DNS TXT in Cloudflare), submit
   `https://firedbunny.com/sitemap.xml`, and URL-inspect a few pages (`/lessons/wheel-strategy/`,
   `/tools/position-size/`, `/glossary/`).
6. **Bing Webmaster Tools**: import from Search Console and submit the sitemap. Its AI Performance report shows
   Copilot citations.
7. **Cloudflare**: turn on SSL/TLS › Edge Certificates › **Always Use HTTPS**, then **HSTS**. Add a proxied `www`
   record and a Redirect Rule `www.firedbunny.com/*` → `https://firedbunny.com/$1` (301).
8. The Tag Manager `send_page_view` change suggested in the analytics guide is **no longer needed**: real paths
   mean the Google tag's own first page view already has the right address. The analytics guide doc should be updated
   once this is live.
9. Delete the leftover `seo-probe` branch on GitHub. It is harmless, but this session's GitHub access could not
   delete it.
