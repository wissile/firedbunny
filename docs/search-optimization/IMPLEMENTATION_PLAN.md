# FiredBunny search implementation plan

**Date:** 12 November 2026. Findings referenced as F01–F18 are in [AUDIT.md](AUDIT.md). Target URLs are in
[URL_INVENTORY.csv](URL_INVENTORY.csv) (`recommended_url`, `recommended_robots`).

**How to read the estimates:**
- **Impact** describes what a task makes possible. It is an **estimate**, not a forecast of traffic. Traffic depends
  on content quality, competition and time, and a new domain usually needs weeks to months to be crawled and indexed.
- **Complexity:** S = under a day, M = 1–3 days, L = more than 3 days of focused work. These are also estimates.
- **Owner:** "owner" means a dashboard or account setting only the site owner can change; "dev" means a code change.

Every code change follows the repo rule in `CLAUDE.md`: build, test, commit, push to `main`, confirm the deploy. The
URL migration (T6–T7) should be built on a branch and merged once its acceptance checks pass. A dated backup branch
already exists (`backup-2026-11-11`).

## Order at a glance

| Phase | Tasks | Why this order |
|---|---|---|
| 0. Measure | T25, T5 | Search Console and Bing must be verified before launch to see indexing; `SITE_URL` fixes previews and the deploy check |
| 1. Host hygiene | T1, T2, T3, T4 | Low-risk, independent; removes duplicate hosts and soft 404s before new URLs exist |
| 2. Crawlable URLs | T6 → T7 → T8, T9, T11 | The core fix. T7 depends on T6; metadata ships with T7 |
| 3. Discovery | T10, T12, T26 | Sitemap and IndexNow only make sense once real URLs exist; CI checks protect them |
| 4. Understanding | T13, T15, T17, T21 | Structured data and semantics on top of pre-built pages |
| 5. Trust and depth | T14, T16, T18, T19, T20 | Editorial work for a "your money" site; can start in parallel with phase 2 |
| 6. Speed | T22, T24, T23 | Content-first loading is cheap once pages are pre-built; code splitting is the big job |
| 7. Iterate | Monthly review (BASELINE.md) | Replace keyword estimates with real queries |

Dependencies: T7 needs T6. T8, T9, T11, T13 and T22 are implemented inside T7's templates. T10, T12 and T26 need T7.
T3 needs T5 (the deploy check must stop using workers.dev). T4 can ship now. T14 and T16–T20 are independent.

---

## Phase 0: measurement

### T25 · Verify Google Search Console and Bing Webmaster Tools (owner, S)

- **Why:** without them, indexing, queries, Core Web Vitals and AI citations (Bing's AI Performance report) cannot be
  measured. The audit had no access, so index status is unknown (BASELINE.md).
- **Affects:** Cloudflare DNS (a TXT record), no code.
- **Impact (estimate):** no ranking effect; enables every measurement in BASELINE.md.
- **How:**
  1. In Search Console, add a **Domain** property for `firedbunny.com` and verify with the TXT record. Cloudflare
     can add it automatically when you approve.
  2. In Bing Webmaster Tools, import from Search Console.
  3. After T10, submit `https://firedbunny.com/sitemap.xml` in both.
- **Verify:** both show the property as verified; after T10, sitemap status is "Success" in both.

### T5 · Set the `SITE_URL` repository variable (owner, S)

- **Why:** F07. `tools/build.py` writes an absolute `og:image` and `og:url` only when `SITE_URL` is set, and the
  deploy check uses it instead of workers.dev.
- **Affects:** GitHub repository settings (Settings › Secrets and variables › Actions › Variables:
  `SITE_URL = https://firedbunny.com`).
- **Impact (estimate):** correct link previews on social and chat apps; prerequisite for T3.
- **Verify:** after the next deploy, `curl -s https://firedbunny.com/ | grep og:image` shows
  `https://firedbunny.com/og-image.jpg`; the deploy annotation names firedbunny.com.

## Phase 1: host hygiene

### T1 · Redirect HTTP to HTTPS and add HSTS (owner, S)

- **Why:** F05. `http://firedbunny.com/` returns 200 with no redirect. Google treats redirects as a strong canonical
  signal and prefers HTTPS.
- **Affects:** Cloudflare dashboard › SSL/TLS › Edge Certificates: **Always Use HTTPS** on. Then **HSTS**
  (`max-age` 6 months to start, no preload until stable).
- **Impact (estimate):** removes one duplicate host; small trust and security gain.
- **Verify:** `curl -sI http://firedbunny.com/` shows `301` with `location: https://firedbunny.com/`;
  `curl -sI https://firedbunny.com/` shows `strict-transport-security`.

### T2 · Make `www` resolve and redirect to the apex (owner, S)

- **Why:** F05. `www.firedbunny.com` has no DNS record, so anyone typing it gets an error, and links to it are lost.
- **Affects:** Cloudflare DNS: a proxied record for `www`, plus a Redirect Rule
  `www.firedbunny.com/*` → `https://firedbunny.com/$1` (301, keep the query string).
- **Verify:** `curl -sI https://www.firedbunny.com/lessons/` shows `301` to `https://firedbunny.com/lessons/`.

### T3 · Retire the workers.dev duplicate (dev, S; after T5)

- **Why:** F05. `firedbunny.dosfirm.workers.dev` serves a byte-identical copy.
- **Affects:** `wrangler.jsonc` (add `"workers_dev": false`), `.github/workflows/deploy.yml` (check `SITE_URL`
  only; drop the workers.dev fallback). Alternative if the address must stay: in `worker/index.js`, 301 every
  request whose host ends in `.workers.dev` to `https://firedbunny.com` (requires `run_worker_first: true`, which
  routes all requests through the Worker).
- **Impact (estimate):** one canonical host; avoids split signals.
- **Verify:** `curl -sI https://firedbunny.dosfirm.workers.dev/` returns 404 (disabled) or 301 to the apex; the
  deploy check still passes against firedbunny.com.

### T4 · Return real 404s (dev, S; can ship now)

- **Why:** F03. Every unknown path returns the home page with 200 (`/sitemap.xml`, `/llms.txt`, made-up paths). These
  are soft 404s and unlimited duplicates. Routing is by hash today, so the single-page fallback is not needed.
- **Affects:** `wrangler.jsonc` (`"not_found_handling": "404-page"`), new `public/404.html` (branded, links to
  Home, Lessons and Tools, `<meta name="robots" content="noindex">`), `src/sw.js` (navigation handler: serve
  the cached shell only for known app paths; let unknown paths reach the network so the 404 status shows).
- **Impact (estimate):** removes an unlimited duplicate space; correct signals for broken links.
- **Verify:**
  - `curl -s -o /dev/null -w '%{http_code}' https://firedbunny.com/no-such-page` returns `404`.
  - `/` and `/#l-wheel` still work.
  - The offline test (`offline-test.js`) still passes.

## Phase 2: crawlable URLs (the core fix)

### T6 · Real path URLs with the History API (dev, L)

- **Why:** F01, F17. Google: "don't use fragments to load different page content"; use the History API. Today the
  whole site is one URL.
- **Affects:**
  - `src/pages.js`: router `render()` (`:689`), `SML.go` (`:726`), boot (`:747`).
  - Content data: `src/content*.js`, adding a permanent `slug` per lesson, course and tool.
  - `tools/build.py`: emit a route table.
  - `src/sw.js`, `src/mod-a-analytics.js` (`describe()` builds `page_location` from the token).
  - `public/site.webmanifest` shortcuts.
  - Every template that writes `href="#token"`.
- **Impact (estimate):** indexable URLs go from **1 to about 261** (count from URL_INVENTORY.csv). Each lesson,
  calculator and course becomes rankable, citable by AI answer engines, and shareable with its own preview.
- **How:**
  1. **Freeze the URL scheme.** Use `recommended_url` from URL_INVENTORY.csv: `/lessons/<slug>/`,
     `/courses/<slug>/`, `/tools/<slug>/`, `/tracks/<slug>/`, `/notes/<slug>/`, named pages. Store `slug` in the
     content data so URLs never change when a title changes. No years in URLs. Trailing slash, lowercase.
  2. **Route table.** At build time, generate `{token: path}` and its reverse, used by the router, the prerender and
     the sitemap.
  3. **Router (web build only).**
     - Resolve the token from `location.pathname`.
     - Intercept clicks on same-origin route links, then `history.pushState` and render; re-render on `popstate`.
     - After each render, rewrite in-view `href="#token"` to the path, so templates can stay as they are and the
       pre-built HTML contains real links.
     - In-page anchors (`#quiz`, glossary terms) stay fragments.
  4. **Legacy links.** On load, if `location.hash` is a route token, call
     `history.replaceState(null, '', path + location.search)` and render. Old shared `/#l-wheel` links keep working.
     The server never sees fragments, so this cannot be a 301.
  5. **claude.ai copy.** `build/fragment.html` keeps hash routing. Choose the mode by host (`SML.host`).
  6. **Service worker.** Serve the cached shell for known app paths when offline. The head script must hide the home
     snapshot (`fb-deep`) when `pathname !== '/'`, not only when there is a hash.
  7. **Analytics.** Set `page_location` to `location.origin + location.pathname`. Keep GA4's "Page changes based on
     browser history events" **off**, or `pushState` double-counts page views. The Google tag's own first page view
     then has the right path automatically.
  8. **Manifest.** Shortcuts become `/learn/` and `/offline/`.
- **Verify:**
  - All 267 routes load at their new path with no console errors (`tools/sitetest.py` adapted to paths).
  - Back and forward work.
  - `/#l-wheel` ends at `/lessons/wheel-strategy/`.
  - The audio player autoplay and next/previous still work (`nartest.py`) and analytics tests pass (`antest.py`).
  - Offline mode passes (`offline-test.js`).
  - The claude.ai copy still navigates by hash.

### T7 · Pre-build every public route to static HTML (dev, L; needs T6)

- **Why:** F02. Only the home page's content is in the HTML. Google recommends server-side rendering or prerendering
  because "not all bots can run JavaScript", and its rendering queue is not instant. Answer engines need the text in
  the response.
- **Affects:** `tools/prerender.py` (extend from `home` to every `index` route), `tools/build.py` (per-route head
  template), `src/pages.js` (generalise the snapshot takeover from home to any route), `wrangler.jsonc` (static
  files served by path; default `html_handling` handles trailing slashes).
- **Impact (estimate):** the full lesson text, headings, links and labelled charts are visible to every crawler on the
  first response. This is necessary for indexing quality and AI citation.
- **How:**
  1. For each route with `recommended_robots = index,follow`, render it in Chromium, as `prerender.py` already does
     for home. Capture header, view and footer HTML, and write `dist/<path>/index.html`.
  2. Shared critical CSS: collect the union of rules used across all snapshots into one hashed stylesheet
     (`/pre.<hash>.css`, cached for a year) rather than inlining per page.
  3. The head of each file comes from the route table and content data, implementing T8, T9, T11 and T13 there.
  4. Takeover: when the script boots on a route whose pre-built HTML is present, render it and swap without
     animation, as home does today (no flash, no layout shift).
  5. Run the prerender with 4 parallel pages. **[EST]** About 261 routes should finish in a few minutes in CI.
  6. Fail the build if any route renders an error or an empty view.
- **Verify:**
  - `curl -A Googlebot https://firedbunny.com/lessons/wheel-strategy/` contains the lesson H1, the "idea"
    paragraph, the section headings and the quiz question text.
  - The words in the raw HTML are within 10% of the rendered count in URL_INVENTORY.csv (`rendered_words`).
  - Search Console URL Inspection (live test) shows the content in the rendered HTML.
  - Lighthouse CLS stays 0.

### T8 · Unique titles and meta descriptions (dev, S; inside T7)

- **Why:** F06. The initial HTML has one title and one description for all pages. The data for better ones already
  exists: every lesson has `summary` (median 76 characters) and `idea` (median 115); courses and tools have `blurb`.
- **Affects:** head template in `tools/build.py`/`tools/prerender.py`; optional `seoTitle` field in content data;
  `src/pages.js` (keep `document.title` in sync and update the meta description on navigation).
- **How:**
  - **Titles:** `{title} | FiredBunny`, as descriptive as the page. 18 lesson titles and 18 tool titles are one or
    two words ("VWAP", "RSI", "Volume", "Mortgage", "Position size"…). Give those a plain, accurate `seoTitle` that
    says what the page does, for example "VWAP explained: what it shows and how day traders use it" or "Position
    size calculator: shares to buy for a fixed risk". Describe; don't stuff.
  - **Home:** a descriptive title such as "FiredBunny: free interactive lessons on trading, retirement and FIRE".
  - **Descriptions:** lesson `idea` (or `summary` + `idea`, about 150 characters); course and tool `blurb`, expanded
    to one useful sentence.
  - **Fix the duplicate titles:**
    - `learn` vs `track-trading`: make `/learn/` an all-tracks hub, or redirect `/learn/` to the last-used track
      and keep `/tracks/trading/` canonical.
    - The wheel-tax lesson vs the tool: "How the wheel strategy is taxed" (lesson) vs "Wheel strategy tax calculator"
      (tool).
- **Verify:** a CI script over `dist/**/index.html` finds 0 duplicate titles and 0 duplicate descriptions among
  indexable pages, with every description between 70 and 170 characters.

### T9 · Canonicals and social tags (dev, S; inside T7)

- **Why:** F05, F07. There are no canonicals, `og:image` is relative, and every page shares one preview.
- **How:** on every indexable page:
  - `<link rel="canonical" href="https://firedbunny.com<path>">` (self-referencing, absolute, https, trailing slash).
  - `og:url` equal to the canonical; per-page `og:title` and `og:description`.
  - Absolute `og:image` (one shared image is fine to start; per-track images later); `twitter:card`.
- **Verify:** for every sitemap URL, the canonical equals the URL; the Facebook Sharing Debugger and a Slack paste show
  the lesson title and description.

### T11 · Keep private pages out of the index (dev, S; inside T7)

- **Why:** dashboard, profile, settings, sign-in, results and offline are per-visitor or utility views (6 routes,
  `recommended_robots = noindex` in the inventory).
- **How:** `<meta name="robots" content="noindex, follow">` in their pre-built HTML (or a minimal shell), and leave
  them out of the sitemap. Don't block them in robots.txt: Google must be able to crawl a page to see its `noindex`.
- **Verify:** URL Inspection reports "Excluded by 'noindex' tag"; the sitemap contains none of the 6 paths.

## Phase 3: discovery

### T10 · XML sitemap and robots.txt (dev, S; needs T7)

- **Why:** F04. There is no sitemap. Google and Bing use sitemaps as the main discovery signal and use `lastmod`
  only when it is accurate. Both ignore `priority` and `changefreq`.
- **Affects:** `tools/build.py` (write `dist/sitemap.xml`), `public/robots.txt`.
- **How:**
  - One `<url>` per indexable route (about 261, well under the 50,000 limit).
  - `lastmod` from a real date: the content's `reviewed` date (T16) or the last git commit touching that page's
    content, never the build time.
  - robots.txt:
    ```
    User-agent: *
    Allow: /

    Sitemap: https://firedbunny.com/sitemap.xml
    ```
- **Verify:** the sitemap validates; its URL count equals the indexable route count; Search Console and Bing report it
  read with 0 errors; every listed URL returns 200 with a matching canonical (T26).

### T12 · IndexNow on deploy (dev, S; needs T10)

- **Why:** Bing documents IndexNow for notifying it and other participating engines "when individual URLs are added,
  updated, or removed". It feeds Bing and Copilot. Google does not use IndexNow; the sitemap covers Google.
- **Affects:** `public/<key>.txt` (key file), `.github/workflows/deploy.yml` (after a successful deploy, POST the
  URLs whose `lastmod` changed to `https://api.indexnow.org/indexnow`).
- **Verify:** the IndexNow response is `200` or `202`; Bing Webmaster Tools › IndexNow shows received URLs.

### T26 · Automated search checks in CI (dev, M; needs T7, T10)

- **Why:** protects everything above from regressions. The current deploy check only compares the home page.
- **Affects:** `.github/workflows/deploy.yml`; adapt `docs/search-optimization/tools/crawl_routes.py` into a
  pre-deploy check over `dist/`.
- **Checks:**
  - **Pre-deploy, on `dist/`:** every indexable page has a unique title and description, one H1, a self canonical,
    and valid JSON-LD; no `noindex` page is in the sitemap.
  - **Post-deploy, live:** 20 random sitemap URLs return 200 with the expected canonical; `/no-such-page` returns
    404; `http://` returns 301; workers.dev returns 301 or 404.
- **Verify:** a deliberately broken title fails the build on a test branch.

## Phase 4: understanding

### T13 · Structured data that Google still supports (dev, M; inside T7)

- **Why:** F08, F14. There is no JSON-LD. Structured data helps engines understand the page and qualifies breadcrumbs
  and article features. It is not a ranking shortcut.
- **How (JSON-LD in the pre-built head):**
  - **Home:**
    - `Organization`: name, url, logo (512 px icon), the canonical description, and `sameAs` only for real
      profiles.
    - `WebSite`: name `FiredBunny`, url. This supports the site name shown in results.
  - **Lessons, courses, tools:** `BreadcrumbList` matching the visible breadcrumb (Track › Course › Lesson;
    Tools › Track › Tool).
  - **Lessons and trade notes:** `Article` with `headline`, `description`, `image`, `datePublished`,
    `dateModified` (the real review date from T16), `author` and `publisher` as the FiredBunny `Organization`.
    Don't invent a person.
  - **Optional, unproven for Google:** `LearningResource` properties (`educationalLevel` from `level`,
    `timeRequired` from `mins`, `teaches`) for other engines' understanding.
  - **Don't add:**
    - `FAQPage`: rich results ended May 2026.
    - `HowTo` or `Course info`: retired.
    - `SoftwareApplication` ratings: no genuine reviews exist; never fabricate.
    - `Course list`: hold until confirmed eligible. Google limits `Course` to curricula with instructors leading a
      roster of students.
- **Verify:** Rich Results Test passes for a home, lesson, course, tool and note URL with no errors; Search Console
  Enhancements shows Breadcrumbs valid.

### T15 · Heading order and skip link (dev, S)

- **Why:** F13. Heading levels skip on 19 routes; Lighthouse fails `skip-link` everywhere and `heading-order` on a
  tool. These matter for accessibility and clean document outlines.
- **Affects:** the templates for the affected routes (route tokens with heading skips are in the crawl output);
  the skip link in the page shell (`src/pages.js`).
- **Verify:** Lighthouse accessibility passes `heading-order` and `skip-link` on home, a lesson and a tool; the crawl
  reports 0 heading skips.

### T17 · Answer-first, quotable lesson openings (editorial + dev, M)

- **Why:** AI answer engines and featured snippets quote short, self-contained answers. Every lesson already renders
  its `idea` right under the H1 (`src/pages.js:520`, `.l-sum`).
- **How:**
  - Keep `.l-sum` in the pre-built HTML directly after the H1.
  - Review the 159 `idea` sentences so each reads as a standalone definition. For example, "The wheel strategy sells
    cash-secured puts on a stock you'd be glad to own, then covered calls after assignment" works better than one
    that depends on the page's context.
  - Where a lesson answers a common question, add one sentence of direct answer at the top of the relevant section.
    Don't add Q&A blocks for markup.
- **Verify:** spot-check 20 lessons: the first paragraph answers the title's question without needing the widget.

### T21 · Contextual internal links (dev + editorial, S)

- **Why:** F14. 21 calculators receive at most one in-content link; the wheel and tax clusters are spread across
  lessons, tools, the simulator and notes.
- **How:**
  - Each lesson links to its calculator (`tool.lesson` already maps them); each calculator links back.
  - Trade notes link to the lessons they illustrate.
  - Clusters cross-link (KEYWORD_STRATEGY.md): wheel lesson ↔ wheel tax ↔ wheel in an IRA ↔ wheel income tool
    ↔ simulator ↔ $40-stock note.
  - Use descriptive anchor text.
- **Verify:** the crawl reports every indexable page with at least 2 in-content inbound links, excluding nav and
  footer.

## Phase 5: trust and depth (financial content)

### T14 · Editorial standards, methodology and transparent About (owner + editorial, M)

- **Why:** F09, F18. Google weights trust most heavily for topics affecting financial stability, encourages explaining
  who made content and how (including AI use), and calls fabricated creator profiles deceptive.
- **Affects:** new page `/editorial-standards/` (or a section of `/about/`), footer link, Organization `description`,
  `src/mod-y-about.js`.
- **Content (all of it must be true):**
  - Who runs FiredBunny. A pseudonym is acceptable if stated as one; give real experience only.
  - How lessons are researched: primary sources such as IRS, SEC, SSA, Federal Reserve, BLS, CMS and DOL.
  - The fact-check process (the repo's `factcheck/` workflow) and the review cadence.
  - How AI tools are used in drafting and in the narrated audio (computer-generated voice).
  - How to report an error (the feedback form) and a corrections note when something changes.
  - Advertising or affiliate status.
  - The education-only disclaimer and the US focus of tax rules.
  - One canonical one-sentence brand description, reused everywhere.
- **Never:** invent credentials, reviewers, testimonials or "as seen in" badges.
- **Verify:** the page is live and linked from the footer and About; the Organization JSON-LD `description` matches
  it.

### T16 · Sources, review dates and risk caveats on every lesson (editorial, L)

- **Why:** F09. 57 of 159 lessons cite no external source (filter URL_INVENTORY.csv: `page_type = lesson`,
  `external_source_links = 0`). About 9 lessons show a date; the only review date is site-wide ("checked October
  2026").
- **Affects:** content data (`src/content*.js`, `src/mod-*.js`): a `sources: [{title, url}]` list and a
  `reviewed: 'YYYY-MM-DD'` field per lesson; the lesson template renders "Sources" and "Last reviewed".
- **How:**
  - Prefer primary sources.
  - Set `reviewed` only after an actual review.
  - Prioritise time-sensitive and high-risk lessons first: contribution limits, tax brackets, Social Security,
    Medicare and IRMAA, PDT rules, crypto, and the automated-trading lessons. The automated-trading lessons need
    explicit risk and responsibility caveats and no performance claims.
- **Verify:** 159/159 lessons render a Sources block and a review date; `dateModified` in the Article JSON-LD matches
  it.

### T18 · Calculator write-ups (editorial + dev, L)

- **Why:** F10. The 50 calculators have a median of 357 words of explanation. Calculator results are crowded with
  bare tools, and the explanation is what makes a calculator page useful and citable.
- **How:** below each tool, add:
  - What it calculates.
  - The formula in plain words.
  - Default assumptions and their sources.
  - One worked example with numbers.
  - Limitations and when to ask a professional.
  - A link to the lesson.

  Text must be server-rendered (T7).
- **Verify:** every tool page has these sections in its raw HTML; review a sample for accuracy against the tool's
  code.

### T19 · Course hub pages (editorial, M)

- **Why:** F10. 31 course pages have a median of 154 words.
- **How:** add what you will be able to do afterwards, who it is for, prerequisites, time to complete (sum of
  `mins`), and a one-line summary per lesson (`summary` exists).
- **Verify:** every course page has outcomes and lesson summaries in its raw HTML.

### T20 · Glossary as a crawlable reference (dev, M)

- **Why:** F11. 463 terms exist only after JavaScript; one-line definitions are too thin for separate pages.
- **How:**
  - Pre-build `/glossary/` with `<dl>`, `<dt id="term-slug">` and `<dd>` (definition plus a link to its lesson).
  - Keep search as an enhancement.
  - Optionally split into A–Z pages if the single page is too heavy.
  - Write a standalone term page only when it has substantial unique content.
  - Optional: a flashcard view of glossary terms (term on one side, definition on the other) could be eligible
    for Google's Education Q&A rich result (English; education queries).
- **Verify:** `curl https://firedbunny.com/glossary/ | grep -c '<dt'` returns 463; deep links like
  `/glossary/#vwap` jump to the term.

## Phase 6: speed

### T22 · Content-first loading on pre-built pages (dev, S–M; inside T7)

- **Why:** F12. Lab LCP is about 10.8 s on simulated mobile. The 1.4 MB app script is preloaded at high priority
  alongside 10 font preloads, so on slow links it competes with the content's fonts. With `font-display: block`, text
  waits.
- **How:**
  - On pre-built pages, drop the high-priority script preload (load the app with `defer` or `fetchpriority="low"`).
  - Preload only the 2–3 fonts used above the fold.
  - Consider `font-display: optional`. It keeps the no-flicker behaviour the owner asked for (no visible font swap),
    while not blocking text on slow first visits.
  - Re-run Lighthouse with the same setup as BASELINE.md.
- **Verify:** lab LCP on simulated mobile improves materially from the baseline for home, a lesson and a tool;
  CLS stays 0; no font swap is visible on a normal connection.

### T23 · Split the 4.5 MB bundle by route (dev, L)

- **Why:** F12. Lighthouse estimates ~757 KiB of unused JavaScript on load. Every visit downloads every course's
  widgets.
- **How:**
  - Keep `core.js`, `pages.js` and the shell in the main chunk.
  - Build each course group's `mod-*.js` into its own hashed chunk, loaded when a route needs it.
  - Give the service worker the chunk list so offline still works.
- **Verify:** main chunk transfer drops substantially (measure before and after); sitetest, nartest, offline and
  analytics tests pass; the offline install still caches everything needed.

### T24 · Measure real-user Core Web Vitals (dev, S)

- **Why:** there is no field data (CrUX) for a new domain, and lab numbers can mislead.
- **How:** add the `web-vitals` library and send LCP, INP and CLS to GA4 as events with `page_type`. Later, compare
  with the Search Console Core Web Vitals report once traffic qualifies.
- **Verify:** GA4 shows vitals events by page type within a day of deploy.

---

## Risks and how to contain them

| Risk | Mitigation |
|---|---|
| URL migration breaks shared `#` links | Client-side hash-to-path redirect (T6 step 4); test a sample of old links |
| Offline mode or the installed app breaks | Update the service worker navigation logic in the same change; run `offline-test.js` and `updtest.py` |
| Analytics double-counts page views after `pushState` | GA4 history-based page views off; `antest.py` checks one page view per navigation |
| Pre-built HTML diverges from the live render | Generated from the same code in Chromium at build time; CI compares word counts |
| Build time grows | Parallel prerender; fail fast on errors |
| claude.ai copy stops working | Host-based router mode; fragment build keeps hashes |
| Thin or unhelpful pages get indexed | Only `index` routes from the inventory; no per-term or per-keyword pages; noindex private views |

## Acceptance for the whole programme

1. About 261 indexable URLs, each returning 200 with unique title, description, self canonical and pre-built content.
2. Unknown paths return 404; `http` and `www` redirect to `https://firedbunny.com`; workers.dev is retired.
3. The sitemap is submitted and read in Search Console and Bing; IndexNow runs on deploy.
4. Structured data validates for each page type.
5. Every lesson shows sources and a real review date; the editorial standards page is live.
6. The baseline re-measured in BASELINE.md shows the changes; Search Console's Pages report trends toward the sitemap
   count. **[EST]** Expect weeks to months on a new domain.
