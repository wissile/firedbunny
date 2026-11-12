# FiredBunny search audit

**Date:** 12 November 2026 · **Site:** https://firedbunny.com · **Scope:** technical SEO, rendering, metadata, structured data,
performance, AI search (AEO/GEO), trust for financial content · **Status:** audit only, no production changes made.

Companion files: [URL_INVENTORY.csv](URL_INVENTORY.csv) (every route), [KEYWORD_STRATEGY.md](KEYWORD_STRATEGY.md),
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) (tasks T1–T26 referenced below), [BASELINE.md](BASELINE.md).

## How this was checked

| Label | Meaning |
|---|---|
| **[LIVE]** | Verified on the production site on 2026-11-12 with `curl` from a GitHub-hosted runner, Googlebot user agent (log summarised in BASELINE.md) |
| **[SRC]** | Verified in the repository source (file and line given) |
| **[CRAWL]** | Verified by rendering every route of the built site (`dist/`) in Chromium and reading the DOM: 267 routes, 0 script errors. Script: [tools/crawl_routes.py](tools/crawl_routes.py) |
| **[LAB]** | Lab measurement: Lighthouse 12.8.2, simulated mobile (slow 4G, CPU throttling), local server with gzip. Not field data |
| **[DOC]** | Official Google, Bing, OpenAI or Perplexity documentation (sources at the end) |
| **[EST]** | Estimate or assumption, not verified |

Not available to this audit: Google Search Console, Bing Webmaster Tools, backlink data, keyword volume tools, Chrome UX
Report field data. Anything that depends on them is marked unknown, not guessed.

## Executive summary

FiredBunny has unusually strong material for search: 159 lessons (median 1,332 words when rendered), an interactive
widget and a quiz on every lesson, 50 calculators, primary-source citations (IRS, Federal Reserve, SSA, SEC) on most
lessons, and labelled charts. Search engines and AI answer engines can see almost none of it.

**The blocking problem is the URL design.** Every page except the home page lives behind a `#` fragment
(`https://firedbunny.com/#l-wheel`). Google's documentation says not to use fragments to load different page content,
and on the live site `https://firedbunny.com/l-wheel` returns byte-for-byte the same document as the home page. To a
search engine, FiredBunny is **one URL**. No lesson, calculator or course can be indexed, ranked, cited by an AI answer
engine or shared with its own preview.

The second problem is rendering. Only the home page is pre-built into the HTML; every other view needs a 4.5 MB
script. Google renders JavaScript (queued, not guaranteed), but Google notes that not all bots can run JavaScript.

The fix needs no framework migration. The site already has a Playwright prerender step (`tools/prerender.py`) that
produces the home page's HTML at build time. Extending it to every route, behind real paths, solves most of this
audit. Everything else (sitemap, canonicals, status codes, metadata, structured data, trust signals) follows from it.

## Project facts

| Item | Finding | Evidence |
|---|---|---|
| Framework | None. Hand-written vanilla JavaScript modules bundled by `tools/build.py` into `app.<hash>.js` (4,554 KB uncompressed) plus a small `index.html` | [SRC] build output |
| Routing | Client-side, hash-based: `render()` reads `location.hash`; `hashchange` listener | [SRC] `src/pages.js:689`, `:747` |
| Rendering | Client-side. `tools/prerender.py` snapshots the **home page only** into `<div id="pre">` with critical CSS; deep links show a loading screen until the script runs | [SRC] `tools/prerender.py`, README |
| Hosting | Cloudflare Worker with static assets (`wrangler.jsonc`), `not_found_handling: "single-page-application"`; Worker code only for `/api/*` and `/audio/*` | [SRC] `wrangler.jsonc` |
| Deploy | GitHub Actions on push to `main`; post-deploy check against `SITE_URL` or the workers.dev address | [SRC] `.github/workflows/deploy.yml` |
| Offline | Service worker serves the cached `/` for every navigation | [SRC] `src/sw.js:17,52,60` |
| Domain | Cloudflare DNS; TLS certificate issued 2026-11-05 (new domain) | [LIVE] |
| Analytics | GA4 through GTM, page views as virtual paths (`/l-wheel`) | [SRC] `src/mod-a-analytics.js` |
| claude.ai copy | Same app published as a single-file artifact; must keep hash routing there | [SRC] `build/fragment.html` |

## Content inventory

| Type | Count | Rendered words (median, min–max) | Notes | Evidence |
|---|---|---|---|---|
| Lessons | 159 | 1,332 (553–4,184) | 159/159 interactive widget, 159/159 quiz, 102/159 cite external sources | [CRAWL] |
| Calculators / tools | 50 | 357 (174–1,723) | Each linked to a lesson (`tool.lesson`) | [CRAWL][SRC] |
| Courses | 31 | 154 (94–307) | Hub pages listing lessons | [CRAWL] |
| Tracks | 3 | 1,579 (854–2,263) | Trading; Retirement & Wealth; FIRE | [CRAWL] |
| Trade notes (posts) | 5 | 429 (361–609) | Dated 2026-09-23 to 2026-10-16 | [CRAWL] |
| Other pages | 19 | 716 (197–10,949) | Includes glossary (463 terms, 10,949 words), playground, wheel simulator, calendar, about, assessment, 6 private/utility pages | [CRAWL] |
| **Routes total** | **267** | | All but `home` are `#fragment` URLs | [CRAWL] |

Full list with recommended URLs: [URL_INVENTORY.csv](URL_INVENTORY.csv).

## Findings

Severity: **Critical** blocks indexing · **High** large, direct effect · **Medium** meaningful · **Low** polish.

| ID | Severity | Finding | Evidence | Fix |
|---|---|---|---|---|
| F01 | Critical | All 266 non-home pages are `#fragment` URLs: one indexable URL for the whole site | [SRC][LIVE][DOC] | T6 |
| F02 | Critical | Only the home page's content is in the initial HTML; every other view needs JavaScript | [SRC][LIVE][DOC] | T7 |
| F03 | High | Any path returns the home page with HTTP 200 (soft 404s, unlimited duplicate URLs), including `/sitemap.xml` | [LIVE][SRC] | T4 |
| F04 | High | No XML sitemap; robots.txt has no `Sitemap:` line | [LIVE] | T10 |
| F05 | High | Duplicate hosts: `http://` serves 200 with no redirect; `firedbunny.dosfirm.workers.dev` serves an identical copy; `www` does not resolve; no canonical tags | [LIVE] | T1–T3, T9 |
| F06 | High | Initial HTML has one generic `<title>FiredBunny</title>` and one meta description for every route; JavaScript changes the title (265 unique of 267) but never the description (1 unique) | [LIVE][CRAWL] | T8 |
| F07 | Medium | Social tags: relative `og:image`, no `og:url`, the same preview for every page (the `SITE_URL` repository variable is not set) | [LIVE][SRC] | T5, T9 |
| F08 | Medium | No structured data at all (0 JSON-LD blocks) | [LIVE][CRAWL] | T13 |
| F09 | High (YMYL) | Weak trust signals for financial content: pseudonymous author with no methodology page, 57/159 lessons without sources, about 9/159 lessons show a date | [CRAWL][SRC][DOC] | T14, T16 |
| F10 | Medium | Thin hub pages: courses median 154 words; calculators carry little explanatory text (median 357 words) | [CRAWL] | T18, T19 |
| F11 | Medium | Glossary (463 terms) is one JavaScript-only page; its definitions are one-liners, too thin for per-term pages | [CRAWL] | T20 |
| F12 | Medium | Lab LCP ≈ 10.8 s on simulated mobile for home, a lesson and a tool; one 4.5 MB bundle; ~757 KiB unused JS on load | [LAB] | T22–T24 |
| F13 | Low | Heading-level skips on 19 routes; Lighthouse `skip-link` audit fails; `heading-order` fails on a tool | [CRAWL][LAB] | T15 |
| F14 | Low | Breadcrumbs exist visually but without structured data; 21 calculators get at most one contextual link | [SRC][CRAWL] | T13, T21 |
| F15 | Info | All search and AI crawlers get HTTP 200 (no bot blocking), but they only receive the home page | [LIVE] | T6–T7 |
| F16 | Info | Lighthouse SEO score is 100 on every tested view; it checks one URL's basics and cannot see the fragment problem | [LAB] | none |
| F17 | Low | PWA manifest shortcuts point to `/#learn` and `/#offline` | [SRC] | T6 |
| F18 | Low | Brand description varies slightly across meta, manifest, footer and About | [SRC] | T14 |

### F01 · Every page except home is a fragment URL (Critical)

- **What:** `render()` takes the page from `location.hash` (`src/pages.js:689`) and listens to `hashchange`
  (`:747`). Every internal link is `href="#token"`. The initial HTML contains 142 `#` links and no path links to
  content.
- **Live proof:** `curl -A Googlebot https://firedbunny.com/l-wheel` and `https://firedbunny.com/` return identical
  158,922-byte documents (and so does any other path; see F03).
- **Guidance:** Google: "don't use fragments to load different page content" and use "the History API to implement
  routing between different views" (JavaScript SEO basics, updated 2026-03-04). The fragment is not sent to the server
  and is not treated as a separate URL.
- **Impact:** Lessons, calculators and courses cannot appear in Google, Bing, AI Overviews, ChatGPT search, Perplexity
  or Copilot as their own result. Shared links all preview as the home page.

### F02 · Content is not in the initial HTML (Critical)

- Only `home` is pre-built (`tools/prerender.py`: header, home view, footer, 7 KB critical CSS). For a deep link the
  head script adds `fb-deep`, hides the snapshot and shows the loading screen until `app.<hash>.js` (1,397 KB brotli,
  4,554 KB raw) runs.
- Google queues 200-status pages for rendering; this may take "a few seconds" or longer, and Google calls server-side
  rendering or prerendering "still a great idea" because "not all bots can run JavaScript". **[EST]** Most AI crawlers
  (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot) are widely reported not to execute JavaScript. This is not
  confirmed in their documentation, so treat it as a risk, not a fact.
- The existing prerender is the right tool. It renders in real Chromium and already keeps the live page and the
  snapshot identical. Extending it to all routes is the core of the plan (T7).

### F03 · Soft 404s and unlimited duplicates (High)

`wrangler.jsonc` sets `not_found_handling: "single-page-application"`, so every unknown path serves `index.html` with
**200**: `/sitemap.xml`, `/sitemap_index.xml`, `/llms.txt`, `/lessons/wheel-strategy`, `/this-page-does-not-exist-12345`
[LIVE]. Any mistyped or spam link becomes another copy of the home page. The SPA fallback is not needed today (all
routing is by hash), so a real 404 can ship before the URL migration (T4). Google's guidance for single-page apps
is to return a real 404 or `noindex` error views.

### F04 · No sitemap (High)

`/sitemap.xml` does not exist (the 200 response is the home page, `text/html`). `robots.txt` is `User-agent: * /
Allow: /` with no `Sitemap:` line [LIVE]. Google and Bing both treat sitemaps as the main discovery signal for a new
site. Both ignore `priority` and `changefreq` and use `lastmod` only when it is accurate [DOC].

### F05 · Duplicate hosts, no canonicals (High)

| URL | Live result |
|---|---|
| `http://firedbunny.com/` | 200, same page, **no redirect to https**, no HSTS header |
| `https://www.firedbunny.com/` | No DNS record: the connection fails |
| `https://firedbunny.dosfirm.workers.dev/` | 200, byte-identical copy (robots.txt also allows all) |
| Any page | No `<link rel="canonical">` |

Google treats redirects and `rel=canonical` as strong canonical signals and prefers HTTPS [DOC]. The deploy check
currently uses the workers.dev address because the `SITE_URL` repository variable is unset
(`.github/workflows/deploy.yml:6-7,68`).

### F06 · One title and description for every page (High)

The initial HTML has `<title>FiredBunny</title>` (10 characters, no description of the site) and one meta
description. After JavaScript runs, titles are unique on 265 of 267 routes. The duplicates are `learn` and
`track-trading` ("Trading lessons"), and `l-wheel-tax` and `tool-wheeltax` ("How the wheel is taxed"). The meta
description never changes. The data for good descriptions already exists: every lesson has `summary` and `idea`,
every course and tool has `blurb` [SRC].

### F07 · Link previews (Medium)

`og:image` is `/og-image.jpg` (relative; Open Graph expects an absolute URL), and there is no `og:url`. Every page
shares one title, description and image. `tools/build.py:52,141-142` already writes absolute URLs when `SITE_URL` is
set (T5).

### F08 · No structured data (Medium)

There is no JSON-LD on any route. Current Google support, from the search gallery updated 2026-10-16, is relevant here:

| Type | Use on FiredBunny | Status |
|---|---|---|
| Organization, WebSite | Home: brand, logo, site name | Supported; recommended |
| BreadcrumbList | Lessons, courses, tools (breadcrumbs already exist in the HTML) | Supported; recommended |
| Article | Lessons and trade notes, with truthful `author` (the FiredBunny organization) and real `dateModified` | Supported; recommended |
| Course list | Course hubs | Supported in English, but Google limits `Course` to curricula with "instructors leading a roster of students". FiredBunny's self-paced courses may not qualify. **Do not add until eligibility is confirmed** |
| Education Q&A | Flashcard pages only | Lesson quizzes are multiple choice, not flashcards, so they are not eligible. A glossary flashcard mode could qualify (T20) |
| FAQPage | n/a | Google stopped showing FAQ rich results on 2026-05-07 |
| HowTo, Course info, Learning video, Practice problem | n/a | Retired by Google (HowTo in 2023; the others in 2025) |
| Software app | Calculators | Needs genuine ratings or reviews. **Never fabricate**; not applicable today |

### F09 · Trust for "your money" content (High for this site)

Google gives more weight to experience, expertise, authoritativeness and trust for topics that affect "financial
stability", and says "trust is most important". It encourages accurate bylines, explaining how content was made
(including automation or AI), and warns that fabricated creator profiles are deceptive (Creating helpful content,
updated 2026-10-05).

What exists:
- A site-wide footer: "Education only. Nothing here is financial, investment or tax advice…" and "Rules and tax
  figures checked October 2026 (US)".
- An About page written in the first person by "FiredBunny" ("For ten years I collected money lessons…").
- Strong primary sources on 102 lessons. Pages citing each: irs.gov 41, federalreserve.gov 11, ssa.gov 9, sec.gov 8,
  bls.gov 7, plus Treasury, CFPB, CMS and DOL.
- An internal fact-check workflow in the repo (`factcheck/`, `research/`).

What is missing:
- Who reviews the content and how (methodology, sources policy, review cadence, corrections, AI-assistance
  disclosure).
- Sources on 57 lessons.
- A visible "last reviewed" date per lesson (about 9 show one).

A pseudonymous brand can work, but it needs a transparent process. Never invent credentials, reviews or experts (T14,
T16).

**Content risk scan:** a pattern search of the lesson source found no guaranteed-return, "risk-free" or "get rich"
claims. The content warns against "Promises of guaranteed or fixed returns" and states its assumptions (for
example "5% a year after inflation"). Areas needing ongoing care:
- Year-specific figures (2026 contribution limits, "Day trading rules in 2026").
- Tax lessons.
- The automated-trading lessons ("Automate trades with Robinhood and MCP", "Benefits and risks of trading bots").

This was a scan, not a full fact check.

### F10 · Thin hub and calculator pages (Medium)

- **Course pages** are mostly a title, blurb and lesson list (median 154 words): add outcomes, who it is for, and a
  one-line summary per lesson (T19).
- **Calculators** have widgets but little indexable explanation: add the formula, assumptions, a worked example,
  limits and a link to the matching lesson (T18).

Calculator results pages are crowded with near-identical tools (KEYWORD_STRATEGY.md), so the explanation is the
differentiator.

### F11 · Glossary (Medium)

463 terms (fields: term, full name, definition, linked lesson) on one page that only exists after JavaScript.
Definitions are one sentence, so 463 separate pages would be thin and add little. Recommendation: one server-rendered
glossary page using `<dl>` with a stable `id` per term (in-page anchors are fine on a real URL), linking each term to
its lesson. Optionally split it into A–Z pages. Only create a standalone term page when it has substantial unique
content (T20).

### F12 · Performance (Medium; lab only)

| View (local, gzip) | Perf. score | FCP | LCP | TBT | CLS | Transfer |
|---|---|---|---|---|---|---|
| Home | 49 | 8.7 s | 10.8 s | 320 ms | 0 | 1,800 KiB |
| Lesson (`#l-wheel`) | 66 | 0.8 s | 10.8 s | 350 ms | 0 | 1,800 KiB |
| Tool (`#tool-size`) | 61 | 0.8 s | 10.9 s | 470 ms | 0 | 1,800 KiB |

Simulated slow 4G and a mid-range phone; the live site uses brotli (1,431 KB first visit per the deploy check), so
real transfer is a little smaller. **Why it is slow in the lab:** the 1.4 MB script is preloaded at high priority
next to 10 font preloads, so on a slow link it competes with the fonts and content. With `font-display: block`, the
home page's text waits for its fonts, and lesson content waits for the whole script. Repeat visits are fast (service
worker cache). There is no field data (CrUX) for this new domain, so real-user Core Web Vitals are **unknown**. Fixes:
T22 (content-first loading on prerendered pages), T23 (code splitting), T24 (measure field data).

### F13–F18 · Smaller items

- **Headings (F13):** one `<h1>` per route everywhere (good); heading-level skips on 2 pages, 13 lessons and 4
  tools; the skip link fails Lighthouse on all tested views.
- **Internal links (F14):**
  - Strong hierarchy: lessons, courses and tools carry breadcrumbs (`src/pages.js:483,516,630`), and lessons link
    to neighbours, glossary terms and their tool.
  - 21 calculators receive at most one in-content link, typically from the `/tools` hub (for example `tool-swr`,
    `tool-brackets`, `tool-mortgage`).
- **Images:** no `<img>` without `alt`; all 263 large SVG charts across lessons, tools, notes and pages carry an
  accessible label (good).
- **Crawler access (F15):** Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot,
  Applebot and CCBot all receive 200. Keep `OAI-SearchBot` and `PerplexityBot` allowed for AI search visibility.
  `GPTBot` and `Google-Extended` control training and grounding, not search inclusion [DOC]. That choice belongs to
  the owner.
- **Manifest (F17):** update shortcuts with the URL migration.
- **Brand text (F18):** pick one canonical one-sentence description and reuse it in the meta, manifest, About,
  Organization schema and social profiles.

## AI search (AEO/GEO) assessment

| Question | Answer today | Evidence |
|---|---|---|
| Can AI systems understand FiredBunny's purpose? | Partly: the home page HTML and meta description state it. About and all lessons are invisible without JavaScript; no Organization schema | [LIVE] |
| Do lessons answer specific questions clearly? | Yes: each lesson's `idea` (a one-to-two sentence answer) is the first paragraph under the H1 (`src/pages.js:520`), with `summary` as well. But both sit behind fragments and JavaScript | [SRC][CRAWL] |
| Do calculators have indexable explanations? | Thin, and JavaScript only | [CRAWL] |
| Precise definitions? | Yes: 463 glossary definitions plus per-lesson `terms`, all JavaScript only | [CRAWL] |
| Credible, verifiable sources? | On 102/159 lessons, mostly primary government sources. None on 57 | [CRAWL] |
| Expertise and transparent authorship? | Weak: pseudonymous, no methodology | [SRC] |
| Original, distinguishing features? | Strong: interactive widget plus quiz on every lesson, simulators, real-company walkthroughs (Apple, SpaceX), narrated audio | [CRAWL] |
| Easy to retrieve, quote and attribute? | No: there is no per-lesson URL to cite. Answer engines link to a URL, so today every citation could only be the home page | [LIVE] |
| Consistent brand description? | Mostly (F18) | [SRC] |
| Aligned with official guidance? | Google says AI Overviews and AI Mode have "no additional requirements" beyond being indexed and snippet-eligible, and that you don't need "AI text files" or special schema (AI features page, updated 2025-12-10). FiredBunny's blocker is indexability, not AI-specific markup | [DOC] |

On **llms.txt**: Google's AI features documentation says no AI text files are needed, and no major search
engine documents using it. It is optional and unproven. It is cheap to add only after real 404s exist (T4), so it
does not return the home page.

Bing documents IndexNow for instant URL updates and says sitemaps support "traditional search and AI experiences like
Copilot" (Bing Webmaster Blog, 31 July 2025). Bing Webmaster Tools also reports citations in Copilot and Bing AI
answers (AI Performance report, reported February 2026). That report is the only first-party AI-citation measurement
available, so verifying Bing matters (T25).

## Strengths to preserve

- Depth and originality: long, structured lessons with a working widget and a quiz each; 50 calculators; trade
  replay and wheel simulators; real-company earnings walkthroughs with audio.
- Plain-English writing and stated assumptions; consistent, responsible risk language.
- Primary-source citations where present; site-wide education-only disclaimer and review date.
- One `<h1>` per view, breadcrumbs, prev/next lesson links, labelled charts.
- Fast repeat visits (service worker); open crawler access; valid HTTPS certificate.
- A build-time Chromium prerender that already exists and is tested.

## Verified facts vs assumptions

- **Verified:** everything tagged [LIVE], [SRC] or [CRAWL] above, as of 2026-11-12.
- **Measured in lab only:** performance numbers [LAB].
- **Assumed or unknown:**
  - Index status (no Search Console). A third-party, non-Google search for `site:firedbunny.com` returned no
    FiredBunny pages; that is weak evidence only.
  - Backlinks and real-user Core Web Vitals.
  - Search demand. No keyword volumes were available and none are given anywhere in these files.
  - Whether specific AI crawlers execute JavaScript.
  - Course list eligibility.
- **Expected impact figures** in the plan are estimates, labelled as such.

## The 10 highest-impact opportunities

1. **Give every page a real path URL** (History API; `/#l-wheel` → `/lessons/wheel-strategy/`; old hash links
   redirect in the browser). Moves indexable URLs from 1 to about 261. *T6*
2. **Pre-build every public route to static HTML** with its own title, description, canonical, social tags and
   JSON-LD, so all crawlers, including those that do not run JavaScript, get the full lesson. *T7*
3. **Return real status codes:** a 404 page instead of the home page for unknown paths. *T4*
4. **Publish an XML sitemap** with accurate `lastmod`, list it in robots.txt, submit it to Search Console and Bing,
   and ping IndexNow on deploy. *T10, T12, T25*
5. **One canonical origin:** HTTPS redirect, www handling, retire the workers.dev duplicate, self-referencing
   canonicals. *T1–T3, T9*
6. **Unique titles and meta descriptions** from the existing `summary`, `idea` and `blurb` fields; fix the two
   duplicate titles. *T8*
7. **Trust layer for financial content:** an editorial standards and methodology page, sources on the 57 lessons
   without them, and real "last reviewed" dates. No fabricated credentials. *T14, T16*
8. **Answer-first, quotable content:** put each lesson's `idea` at the top of the pre-built HTML; give every
   calculator a written method, assumptions, worked example and limits. *T17, T18*
9. **Structured data that Google still supports:** Organization and WebSite, BreadcrumbList, Article with honest
   authorship and dates. Skip FAQ; hold Course list until eligibility is confirmed. *T13*
10. **Content-first performance:** stop the 1.4 MB script from competing with first paint on pre-built pages, split
    the bundle by route, and measure real-user Core Web Vitals. *T22–T24*

## Implementation order (summary; details in IMPLEMENTATION_PLAN.md)

0. Verify Search Console and Bing Webmaster Tools; set `SITE_URL` (owner tasks, no code).
1. Host hygiene: HTTPS redirect, www, workers.dev, real 404 page.
2. Freeze the URL scheme and slug map (`URL_INVENTORY.csv`, `recommended_url`).
3. Path routing with hash-to-path redirects (web build only; the claude.ai copy keeps hashes).
4. Per-route prerender with route-specific head tags; canonicals; noindex on private pages.
5. Sitemap, robots `Sitemap:` line, IndexNow; submit and monitor indexing.
6. Structured data.
7. Trust and content: methodology page, sources, dates, answer-first intros, calculator write-ups, course hubs,
   glossary.
8. Performance: content-first loading, code splitting, field Core Web Vitals.
9. Measure and refine keywords from real Search Console queries.

## Sources (official documentation, read 2026-11-12)

- Google, [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) (updated 2026-03-04)
- Google, [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) (updated 2025-12-10)
- Google, [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) (updated 2026-10-05)
- Google, [Structured data search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) (updated 2026-10-16)
- Google, [Course list structured data](https://developers.google.com/search/docs/appearance/structured-data/course) (updated 2026-09-08)
- Google, [Education Q&A structured data](https://developers.google.com/search/docs/appearance/structured-data/education-qa) (updated 2026-09-08)
- Google, [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) (updated 2026-07-08)
- Google, [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) (updated 2026-07-10)
- Google Search Central Blog, [Simplifying the search results page](https://developers.google.com/search/blog/2025/06/simplifying-search-results) (June 2025); FAQ rich results ending, reported by [Search Engine Journal](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/) (May 2026) quoting Google's FAQ documentation
- Bing Webmaster Blog, [Keeping content discoverable with sitemaps in AI powered search](https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search) (31 July 2025)
- OpenAI, [Overview of OpenAI crawlers](https://developers.openai.com/api/docs/bots)
- Perplexity, [Perplexity crawlers](https://docs.perplexity.ai/guides/perplexitybot)
- Bing Webmaster Tools AI Performance report: reported by [Previsible](https://previsible.com/seo-ai-news/bing-ai-performance-report/) (February 2026); the official announcement was not retrieved
