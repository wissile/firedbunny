# FiredBunny search baseline

**Measured:** 12 November 2026, build `1cc5ad68e9` (commit `5d2a081`), live at https://firedbunny.com.
Re-measure with the same methods after each phase of [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) so changes are
comparable.

## Methods

| Method | What it measures | How to repeat |
|---|---|---|
| Live HTTP probe | Status codes, redirects, headers, robots.txt, crawler user agents, host duplicates | `curl` from a GitHub-hosted runner with the Googlebot user agent; the commands are listed under "Live HTTP behaviour" below |
| Rendered crawl | Per-route title, H1, words, headings, links, sources, images, widgets | `python3 tools/build.py && python3 docs/search-optimization/tools/crawl_routes.py` (Playwright + Chromium; writes `crawl.json`) |
| Lighthouse (lab) | Performance, SEO, accessibility on simulated mobile | Lighthouse 12.8.2 CLI, default mobile settings (simulated slow 4G, CPU throttling), against `dist/` served locally **with gzip** |
| Deploy check | Live transfer sizes (brotli) | Annotations on the "Deploy to Cloudflare" check run |

## Indexability

| Metric | Baseline | Evidence |
|---|---|---|
| Routes in the app | 267 (19 pages, 3 tracks, 31 courses, 159 lessons, 50 tools, 5 notes) | crawl |
| URLs a search engine can index separately | **1** (`/`); the other 266 are `#fragments` | source + live |
| Routes recommended for indexing after the fix | 261 (6 private or utility routes get `noindex`) | URL_INVENTORY.csv |
| Unique `<title>` in the initial HTML | 1 (`FiredBunny`) | live |
| Unique titles after JavaScript | 265 of 267 (2 duplicate pairs) | crawl |
| Unique meta descriptions | 1 | crawl + live |
| Canonical tags | 0 | crawl + live |
| JSON-LD blocks | 0 | crawl + live |
| XML sitemap | none (`/sitemap.xml` returns the home page, 200 `text/html`) | live |
| robots.txt | `User-agent: * / Allow: /`, no `Sitemap:` line | live |
| Content in the initial HTML | home only: 2,179 visible words, 142 `#` links, 0 content path links | live + build |
| Pages indexed in Google or Bing | **unknown**: no Search Console or Bing access. A third-party (non-Google) search for `site:firedbunny.com` returned no FiredBunny pages; weak evidence | — |

## Live HTTP behaviour (2026-11-12, Googlebot user agent)

| Request | Result |
|---|---|
| `https://firedbunny.com/` | 200, `text/html`, 158,922 bytes, `cache-control: public, max-age=0, must-revalidate`, TTFB 0.18 s (one sample) |
| `http://firedbunny.com/` | 200, no redirect, no HSTS |
| `https://www.firedbunny.com/` | no DNS record (connection fails) |
| `https://firedbunny.dosfirm.workers.dev/` | 200, byte-identical to the apex |
| `/robots.txt` | 200 `text/plain`, 23 bytes |
| `/sitemap.xml`, `/sitemap_index.xml`, `/llms.txt` | 200 `text/html`: the home page |
| `/l-wheel`, `/lessons/wheel-strategy`, `/this-page-does-not-exist-12345` | 200 `text/html`: the home page (soft 404) |
| `/og-image.jpg` | 200 `image/jpeg`, 64,142 bytes |
| `/api/health` | 200 JSON |
| Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Applebot, CCBot | all 200 with the same 158,922-byte page (no bot blocking) |
| TLS | Google Trust Services certificate, valid 2026-11-05 to 2027-02-03 |
| DNS | Cloudflare nameservers; apex A records on Cloudflare |

## Content and trust

| Metric | Baseline |
|---|---|
| Lessons with an external source link | 102 / 159 (57 without) |
| Most-cited source domains (pages citing) | irs.gov 41, federalreserve.gov 11, ssa.gov 9, sec.gov 8, apple.com 8, bls.gov 7, schwab.com 6, fool.com 6 |
| Lessons showing a review or update date in the content | about 9 / 159 (pattern match); site-wide footer: "Rules and tax figures checked October 2026 (US)" |
| Education-only disclaimer | site-wide footer on every view |
| Author or methodology page | none; About is first-person under the pseudonym "FiredBunny" |
| Lessons with an interactive widget / a quiz | 159 / 159 · 159 / 159 |
| Rendered words, median (range) | lessons 1,332 (553–4,184); tools 357 (174–1,723); courses 154 (94–307); notes 429; tracks 1,579 |
| Glossary | 463 terms on one JavaScript-only page |
| One H1 per route | 267 / 267 |
| Routes with heading-level skips | 19 (13 lessons, 4 tools, 2 pages) |
| Images without `alt` | 0 |
| Large SVG charts with an accessible label | 263 / 263 |
| Routes with no in-content inbound link | 2 (home, about: linked from nav and footer only) |
| Indexable routes with at most one in-content inbound link | 23, including 21 calculators |

## Performance (lab, not field)

Lighthouse 12.8.2, simulated mobile, local server with gzip (the live site uses brotli, slightly smaller):

| View | Performance | Accessibility | Best practices | SEO* | FCP | LCP | TBT | CLS | Speed Index | Transfer |
|---|---|---|---|---|---|---|---|---|---|---|
| Home `/` | 49 | 99 | 100 | 100 | 8.7 s | 10.8 s | 320 ms | 0 | 8.7 s | 1,800 KiB |
| Lesson `/#l-wheel` | 66 | 99 | 100 | 100 | 0.8 s | 10.8 s | 350 ms | 0 | 3.2 s | 1,800 KiB |
| Tool `/#tool-size` | 61 | 97 | 100 | 100 | 0.8 s | 10.9 s | 470 ms | 0 | 4.3 s | 1,800 KiB |

\* Lighthouse SEO checks one URL's basics and cannot detect fragment routing. A score of 100 here does not mean the
site is indexable.

| Live sizes (deploy check, brotli) | Value |
|---|---|
| First visit download | 1,431 KB (page 34 KB + `app.1cc5ad68e9.js` 1,397 KB) |
| App script, uncompressed | 4,554 KB |
| Unused JavaScript on load (Lighthouse estimate) | ~757 KiB |
| Real-user Core Web Vitals (CrUX / Search Console) | **unknown**: no field data for this new domain |

## Unknowns (not guessed)

- Index coverage, impressions, clicks, queries and average position (needs Search Console and Bing, T25).
- Backlinks and referring domains (Search Console › Links once verified; third-party tools are estimates).
- Search demand per topic (needs Keyword Planner, Bing Keyword Research or Search Console queries).
- Real-user Core Web Vitals (T24, then Search Console CWV).
- Citations in AI answers (Bing AI Performance report after T25; manual spot checks below).
- Whether specific AI crawlers execute JavaScript (not documented by them).
- Eligibility for Google's Course list rich result.

## What to track

| KPI | Baseline | Where | Cadence | Suggested target (not a forecast) |
|---|---|---|---|---|
| Indexable URLs (200, self canonical, in sitemap) | 1 | CI check (T26) | every deploy | ≈261 after T6–T10 |
| Pages indexed | unknown | Search Console › Pages; Bing › Index | weekly for 3 months, then monthly | rising toward the sitemap count; investigate "Crawled – currently not indexed" |
| Sitemap status | none | Search Console, Bing | after each change | read, 0 errors |
| Soft 404s / duplicate pages | every unknown path | Search Console › Pages; CI | monthly | 0 soft 404s |
| Organic clicks and impressions by page type | unknown | Search Console Performance (filter by `/lessons/`, `/tools/`…), GA4 organic landing pages | monthly | trend only |
| Queries per topic cluster | unknown | Search Console queries mapped to KEYWORD_STRATEGY.md clusters | monthly | use to re-rank priorities |
| Rich result validity | none | Search Console Enhancements; Rich Results Test | after T13 | Breadcrumbs valid, 0 errors |
| AI citations | unknown | Bing Webmaster Tools AI Performance (citations, cited pages, grounding queries) | monthly | trend only |
| AI answer spot check | not done | Ask 10 fixed questions from the clusters in ChatGPT search, Perplexity, Gemini/AI Mode and Copilot; record whether FiredBunny is cited and which URL | monthly, same questions | qualitative |
| Lab performance | LCP ≈10.8 s (simulated mobile) | Lighthouse, same settings | each phase | materially lower after T22–T23 |
| Field Core Web Vitals | unknown | GA4 `web-vitals` events (T24), later Search Console CWV | weekly | "Good" for LCP, INP and CLS at the 75th percentile |
| Lessons with sources / review date | 102 / ~9 | crawl | each content batch | 159 / 159 |
| Titles / descriptions unique (indexable pages) | 1 / 1 in the initial HTML | CI (T26) | every deploy | 100% unique |

GA4 is already collecting page views (as virtual paths such as `/l-wheel`), lesson completions, audio, calculator use
and searches. Once real paths ship (T6), GA4 landing pages from organic search join directly with Search Console data.
