# Final SEO, AEO and GEO quality-assurance audit

**Date:** 13 November 2026. **Auditor role:** independent QA, separate from the implementation work.
**Scope:** https://firedbunny.com as deployed from `main` at commit `28a70c8`, plus the fixes in this audit on branch
`qa-final-audit`. **Nothing was deployed.** The fixes wait on that branch for the owner's go-ahead.

The audit ran in two sittings on 13 November (about 09:15–09:50 UTC, then about 10:25–11:30 UTC, after an
interruption). The second sitting re-checked the first one's live evidence against the GitHub Actions logs, found and
fixed one regression the first sitting had introduced (section C), corrected one diagnosis (section E), and re-ran every
suite on the final branch build.

## Evidence and method

| Source of evidence | What it covers | Where it ran |
|---|---|---|
| **Live probe**: a temporary workflow on branch `qa-probe` that deploys nothing | Every sitemap URL fetched as raw HTML; redirects; status codes; 12 crawler user agents; all 281 external links; DNS; verification files; response headers; Lighthouse (9 runs) | GitHub Actions runner (US), 13 Nov 2026 09:19 and 09:36 UTC. This container cannot reach the site directly. |
| **WebFetch** (an AI fetch tool) | Whether an AI agent can read pages, and a second check on links that failed from the runner | 13 Nov 2026 |
| **WebSearch** (the search tool available to this session) | Whether FiredBunny shows up for representative questions | 13 Nov 2026 |
| **Local build** (`dist/`), served the way Cloudflare serves it | Rendered DOM, structured data, accessibility (axe-core 4.10.2), keyboard, 390 px phone layouts, Lighthouse 12.8.2, LCP under real throttling, every automated test | This container |
| **Source review** | Analytics, routing, the deploy workflow, content | Repository |

"Live" below means the production site on 13 November. "Branch" means `qa-final-audit` after the fixes.

---

## A. PASS / FAIL / NOT VERIFIED

### Technical SEO

| # | Check | Result | Evidence |
|---|---|---|---|
| T1 | HTTP status of every sitemap URL | **PASS** | 261/261 answered 200 (live probe). Median response time 205 ms, p90 259 ms, max 478 ms, from the runner. |
| T2 | Raw HTML carries the content | **PASS** | All 261 pages are pre-built: each has the snapshot, exactly one `<h1>`, at least 150 words, and no leftover `#token` links. Twelve crawler user agents got the same HTML (T13). |
| T3 | JavaScript-rendered content matches the raw HTML | **PASS** | `seo/parity.py`: raw response compared with the rendered DOM, one page per content type, all checks passed (see section C). |
| T4 | Unique titles and descriptions | **PASS** | No duplicates among the 261 live pages, and none in the build check. |
| T5 | Canonicals | **PASS** | All 261 are self-canonical. `/learn/` points to `/tracks/trading/` by design. The workers.dev copy points to firedbunny.com and sends `X-Robots-Tag: noindex`. |
| T6 | Robots directives | **PASS** | robots.txt allows everything and lists the sitemap. Per-visitor pages (`/dashboard/`, `/settings/`, `/offline/`, `/results/`) are `noindex, follow`. 404 pages are `noindex`. No sitemap URL is noindex. |
| T7 | Sitemap coverage | **PASS** | 261 URLs, all unique, all pre-built and indexable. The live sitemap matches the build (deploy check on `28a70c8`). Since this morning the editorial page carries its correct date. |
| T8 | Internal links | **PASS** | Every internal link on the 261 pages resolves. The only targets outside the sitemap are the 3 noindex utility pages and `/learn/` (canonicalized). No broken internal links. |
| T9 | Schema validity | **PASS** (syntax and required fields) / **NOT VERIFIED** (Google Rich Results Test) | 411 JSON-LD blocks parse: Organization 1, WebSite 1, BreadcrumbList 245, Article 164. Article has author, publisher, description, url, image and dateModified. Google's own validator needs a browser session with Google and was not run. |
| T10 | Structured data matches visible content | **PASS** | Every Article headline matches the page's H1. Every breadcrumb name appears on the page, and every breadcrumb URL is on firedbunny.com. `publishingPrinciples` points to a visible page. |
| T11 | Indexing decisions | **PASS** | Indexable: lessons, courses, tracks, tools, notes and hubs. Noindex: per-visitor pages and 404s. Unknown addresses return a real 404. |
| T12 | Redirects | **PASS, with a warning** | http → https is a 301. www → apex is a 301 that keeps the path and query. HSTS max-age is 15,552,000 (180 days). **Warning:** a missing trailing slash (`/lessons/wheel-strategy`) and `/index.html` get a **307** (temporary) from Cloudflare's asset handling rather than a 301. Internal links and canonicals always use the slash, so the impact is low (see G9). The literal `/404` answers 200 with the noindex Not-found page; nothing links to it. |
| T13 | Crawler and AI-agent access | **PASS** | Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, CCBot, Applebot, Bytespider and meta-externalagent all got 200 with the full pre-built page. No Cloudflare bot block, and no managed robots rules added. |
| T14 | Public content without an account | **PASS** | Every lesson, tool, note and hub answers 200 with full content to anonymous requests. Progress and the dashboard live in the visitor's browser; there is no login wall. |
| T15 | Mobile responsiveness | **PASS** | 21 representative pages at 390 px: no horizontal scroll. The widget harness fuzzed 181 widgets at 360 px and 1100 px with no overflow. |
| T16 | Accessibility (WCAG 2.1 A/AA, automated) | **FAIL on live → fixed on branch** | axe-core found 4 issues across 21 pages × 2 viewports: the option-profit table's scroll area was not keyboard-focusable; the assessment Back button had no name on phones; the calendar used an invalid `grid` role; and out-of-month calendar text had 2.86:1 contrast. Lighthouse also flagged `heading-order` (footer `h4` after `h2`). All five are fixed on the branch (section C). |
| T17 | Keyboard interaction | **PASS, with 2 fixes** | Tab order is logical and every focused element has a visible focus style. Quiz answers work with Enter; sliders with the arrow keys; number fields by typing. The phone menu opens with Enter. **Fixed on branch:** Escape did not close the phone menu; the skip link pointed at `/` (it worked only through a click handler) and now targets `#view`. |
| T18 | Core Web Vitals (lab) | **FAIL in Lighthouse for the home page on mobile (live) → fixed on branch; live re-measure needed** | Lighthouse and PageSpeed Insights reported 9.9–10.3 s LCP. Real Chrome with the same throttling paints the pre-built page in about 1.6 s, so this is a lab-measurement problem, not a slow page for real visitors. Section E has the evidence. |
| T19 | Core Web Vitals (field) | **NOT VERIFIED** | The PageSpeed Insights API refused requests (quota exceeded for keyless use). A site this new is unlikely to have Chrome UX Report data yet. |
| T20 | External links | **PASS, with warnings** | 281 checked. None confirmed dead. 4 returned 404 and 59 returned 403 to the runner, typical of .gov and bot protection. The 4 "404s" (2 FTC pages, the SSGA notice, the Hargreaves Lansdown article) all load normally through WebFetch. 24 links redirect to a moved address; update them over time (G7). |
| T21 | Security headers | **PASS** | HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`. HTML is served from the Cloudflare cache (`CF-Cache-Status: HIT`). |

### Content (AEO/GEO)

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Answers the intended question | **PASS** | Every lesson opens with a one-line answer under the H1 (76–160 characters). The 15-question map in CONTENT_OPPORTUNITIES.md points each question to the sentence that answers it. An AI fetch tool read the position-size page's formula, worked example, sources and checked date correctly. |
| C2 | Accurate descriptions | **PASS** | Lesson descriptions are the lesson's own answer line. The 10 main calculators state their formula. No duplicates. |
| C3 | Source references | **PARTIAL** | 109 of 159 lessons cite sources: FIRE 25/25, Retirement & Wealth 48/51, Trading 36/83. The trading-track gap, including the tax lessons, is the largest remaining content weakness (G4). |
| C4 | Credible financial assumptions | **PASS** | Returns are stated as assumptions (7% nominal, or 5% after inflation), and inflation is 3%. Withdrawal rates are sourced (Bengen, ERN, Morningstar). The calculator guides list their assumptions. Spot checks are recomputed in CONTENT_OPPORTUNITIES.md, Phase 4; the ESPP 38% and 90% annualized figures check out (1.176² − 1 and 1.176⁴ − 1). |
| C5 | Hypothetical figures disclosed | **FAIL on live → fixed on branch** | Only 68 of 159 worked examples said they were made up ("DEMO", "example"); 91 relied on the site-wide footer note. The branch adds "Hypothetical example for illustration, not a forecast or a recommendation." to every worked example except the 8 Read a Real Company lessons, which use real reported figures. Two examples use a fund's **actual** past returns with a made-up investor (index funds, 2022–2025; stocks and bonds, 2022–2023). Calling them hypothetical would be wrong, so they say instead: "Real past fund returns with a made-up investor. Past returns do not predict future returns." The other 35 examples that mention real years or rules use made-up people under real 2026 rules, so the default note is accurate for them. |
| C6 | False or unsupported claims | **PASS (scan) / open items** | A scan for "guaranteed", "risk-free", "can't lose", "easy money" and "passive income" found 15 hits, all in warnings or neutral context (e.g. "promises of guaranteed returns" as a scam sign). Known open items: the 1% rule streak wording, a VWAP source, tax sources (CONTENT_OPPORTUNITIES.md, Human review). |
| C7 | Duplicated or over-templated text | **PASS** | No pair of lessons shares more than 8% of 5-word phrases, and no sentence of 60+ characters repeats in 4 or more lessons. The calculator guides share a structure but each has its own text and example. |
| C8 | Authorship and editorial transparency | **PASS** | `/editorial-standards/` covers the pen name, AI disclosure, sources, corrections and the computer narration voice. The page is linked sitewide and from the Organization JSON-LD. |

### Measurement

| # | Check | Result | Evidence |
|---|---|---|---|
| M1 | Google Search Console | **Partly verified** | A `google-site-verification` TXT record is live in DNS (observed with `dig`), so the domain-property token is in place. Whether the property is verified, and the sitemap accepted, can only be seen in the owner's account. The owner reported submitting the sitemap. |
| M2 | Bing Webmaster Tools | **NOT VERIFIED** | No `BingSiteAuth.xml` and no `msvalidate.01` tag. Importing from Search Console needs no file. Nothing shows that Bing is set up. |
| M3 | Sitemap submission (Google, Bing) | **NOT VERIFIED** | Needs the owners' accounts. robots.txt advertises the sitemap to every crawler. |
| M4 | IndexNow | **Not set up live → ready on branch** | The branch adds key file `public/d3c82bf17a1f276a356f6570fc665f22.txt` and a post-deploy step. That step sends pages changed in the last day to `api.indexnow.org` and never fails the deploy. Its logic was dry-run against the build without sending: it picked 172 changed URLs. |
| M5 | Core Web Vitals monitoring | **NOT SET UP** | No real-user measurement. Search Console's CWV report and CrUX need traffic first (G10). |
| M6 | Organic search monitoring | **Partly ready** | GA4 (`G-XVRHV7GTZ9`, through GTM `GTM-PJR6KKW9`) is in the code with correct page paths. Search Console reports need the owner's verified property. |
| M7 | AI referral monitoring | **FAIL on live → fixed on branch** | The site's own page views dropped the query string, so `utm_source=chatgpt.com` (which ChatGPT adds to links) and other campaign tags never reached GA4. The branch keeps only recognized campaign keys (`utm_*`, `gclid`, `gbraid`, `wbraid`, `dclid`, `msclkid`) on the landing page view, and nothing else from the query string. The referrer was already passed. |
| M8 | Periodic AI prompt review | **Ready** | AI_VISIBILITY_TEST_PLAN.md (22 prompts) and `ai_visibility_log.csv`. The first observations are recorded (section F). |

---

## B. Critical remaining issues

No critical SEO blockers remain. Everything that decides whether search engines and AI systems can find and read the
pages works on the live site: status codes, pre-built HTML, canonicals, sitemap, robots and crawler access.

The issues that matter most, in order:

1. **Home page mobile LCP in Lighthouse / PageSpeed Insights (live): 9.9 s and 10.3 s.** Real browsers are not slow
   here: the pre-built page paints in about 1.6 s on a throttled phone. The lab tools charge the 1.4 MB script to the
   first paint because it is requested early. The branch requests it only after the first paint (section E). Re-measure
   live after the merge.
2. **Campaign and AI referral tags were stripped before reaching analytics (live).** Fixed on the branch. Until it
   ships, ChatGPT-tagged visits cannot be attributed in GA4.
3. **Search engines have not indexed the site yet** (section F). It went live with real addresses this week, so this is
   expected, but every growth decision depends on Search Console and Bing access.
4. **Source coverage in the trading track** (36/83), including the tax lessons. This is a content-trust issue, not a
   technical defect.

---

## C. Regression test results

Run on the branch build after all fixes. All the automated suites below ran twice: once mid-audit and once after the
final fix.

RESULTS_PLACEHOLDER

**Fixes made in this audit (branch `qa-final-audit`):**

| Fix | Files | Retest |
|---|---|---|
| The site script now starts only after the pre-built page has painted with its fonts. Before, its long first task could hold back the first paint until the live page replaced it, so first paint and LCP waited for the whole 1.4 MB script. | `tools/build.py` (starter script) | Local Lighthouse, see E |
| Campaign tags kept on the landing page view; every other query value dropped | `src/mod-a-analytics.js` | `utmcheck.py`, `antest.py` |
| Tool page H1 no longer starts with a hidden "Chapter 01:". Before, crawlers read "Chapter 01: Position size". | `src/pages.js` | build + snapshot check |
| "Hypothetical example" note on worked examples (not the real-company course) | `src/pages.js`, `src/style.css` | build, sitetest |
| Footer headings `h4` → `h2`, same look, so heading levels no longer jump | `src/pages.js`, `src/style.css` | heading scan, axe |
| Option-profit table scroll area focusable, with a label | `src/mod-options.js` | axe |
| Assessment Back button has a name on phones | `src/mod-y-assess.js` | axe |
| Calendar month uses `role="group"`; out-of-month text contrast raised from 2.86:1 to 4.5:1 or better | `src/mod-x-calendar.js` | axe |
| Escape closes the phone menu; skip link targets `#view`; the menu's call-to-action gets a real address | `src/pages.js` | keyboard check |
| IndexNow key file and post-deploy step | `public/…txt`, `.github/workflows/deploy.yml` | dry run |

No formula, default input or calculation was changed. The narration hashes are unchanged: none of these fixes touch
narrated text.

---

## D. Indexing readiness

| Item | Status |
|---|---|
| Crawlable, pre-built HTML for every public page | Ready (261/261) |
| Sitemap with real lastmod dates, listed in robots.txt | Ready |
| Canonicals, noindex for private pages, real 404s | Ready |
| workers.dev duplicate kept out of the index | Ready (`X-Robots-Tag: noindex` plus canonical) |
| One host, HTTPS only (www and http redirect permanently) | Ready |
| Crawler and AI-bot access | Ready (12 agents tested) |
| Structured data consistent with the page | Ready |
| Google Search Console | DNS token present; property and sitemap status need the owner's login |
| Bing Webmaster Tools | Not evidenced; owner action |
| IndexNow | Ready on the branch; goes live when merged |
| Observed indexing | **None observed yet.** The session's search tool showed no firedbunny.com result for 12 queries, including the brand name. That tool is not Google or Bing; check URL Inspection in Search Console and Bing. |

**Verdict:** the site is technically ready to be indexed. Discovery now depends on the search engines crawling it,
which Search Console and Bing submission (and IndexNow, once merged) speed up.

---

## E. Performance measurements with evidence

### Live, Lighthouse 12 (lab), from the GitHub runner, 13 Nov 2026

Mobile figures are simulated Moto G Power on slow 4G.

| Page | Device | Perf | FCP | LCP | TBT | CLS | A11y | SEO |
|---|---|---|---|---|---|---|---|---|
| Home (run 1) | Mobile | 45 | 9.3 s | 9.9 s | 470 ms | 0 | 100 | 100 |
| Home (run 2) | Mobile | 71 | 1.7 s | 10.3 s | 190 ms | 0 | 100 | 100 |
| Wheel strategy lesson (run 1) | Mobile | 92 | 1.7 s | 2.4 s | 240 ms | 0 | 100 | 100 |
| Wheel strategy lesson (run 2) | Mobile | 94 | 1.7 s | 2.7 s | 130 ms | 0 | 100 | 100 |
| Position size tool | Mobile | 94 | 1.7 s | 2.6 s | 160 ms | 0 | 98 | 100 |
| Glossary | Mobile | 86 | 1.8 s | 2.8 s | 360 ms | 0 | 98 | 100 |
| Editorial standards | Mobile | 94 | 1.7 s | 2.5 s | 150 ms | 0 | 98 | 100 |
| Home | Desktop | 84 | 1.6 s | 1.9 s | 10 ms | 0 | 100 | 100 |
| Wheel strategy lesson | Desktop | 100 | 0.5 s | 0.7 s | 20 ms | 0 | 100 | 100 |

Best practices scored 100 on every run. CLS is 0 everywhere.

### Diagnosis

- Fonts use `font-display: block`, so the pre-built text stays invisible until its fonts arrive.
- The script starter waited only two frames before loading the 1.4 MB (brotli; 4.6 MB raw) app bundle.
- On a fast connection, the bundle's long first task ran before the fonts painted. The live page then replaced the
  snapshot, so first paint and LCP were charged to the whole script download.
- Measured locally on the old build with Lighthouse's simulated throttling: lesson FCP 24.8 s and LCP 26.5 s; glossary
  LCP 27.4 s. The local server sends the bundle uncompressed, so these are worse than live, but the mechanism is the
  same.
- Under real throttling (Chrome network and CPU emulation, 1.6 Mbps, 150 ms, 4× CPU), the snapshot did paint first
  (home LCP 1.6 s). Real slow-connection visitors were mostly unaffected. Fast connections and lab tools were not.

### Fix (branch): load the script only after the fonts are in and two frames have painted

Local Lighthouse, same machine, before → after:

LIGHTHOUSE_PLACEHOLDER

**Still open:** total blocking time of 300–600 ms on mobile comes from the single 4.6 MB bundle (G8). LCP of about
2.7–3.5 s locally is bounded by `font-display: block`.

---

## F. AI discoverability findings

**Observed, 13 November 2026. Nothing here is inferred.**

| Test | Tool | Result |
|---|---|---|
| 12 searches: P01, P02, P06, P07, P11, P12, P17, P19, the brand name (3 forms) and `site:firedbunny.com` | WebSearch (this session's search tool; it returns result lists, not AI answers, and is not Google or Bing) | **0 results from firedbunny.com.** Logged in `ai_visibility_log.csv` with the top competing domains. |
| AI agent reads a calculator page | WebFetch | Read the H1, the formula `shares = (account × risk %) ÷ (entry − stop)`, the worked example (166 shares, $8,300, $249), both sources and "Formulas checked … November 2026". |
| AI agent reads a long lesson | WebFetch | Got the definition and the worked example right ("About 4.5% in two months"), but **said the page cites no sources**, although the live page lists 4 near the end. The likely cause is the fetch tool cutting long pages; the wheel lesson is about 135 KB of HTML. See G11. |
| Brand and headline searches, second check (about 10:50 UTC) | WebSearch | `"firedbunny.com"` and the home page headline in quotes: **0 results from firedbunny.com** (logged as P21 runs 2 and 3). |
| robots.txt as an AI agent sees it | WebFetch | `User-agent: *` / `Allow: /` plus the sitemap line. No Disallow, no AI-crawler rules, no Cloudflare-managed content signals. |
| AI crawlers can fetch pages | Live probe | Yes. All AI crawler user agents received the full page (T13). |

**Not tested, because there is no direct access from this session:** ChatGPT, Perplexity, Google AI Overviews / AI Mode,
Copilot, Gemini and Claude's consumer app. Use the manual matrix in AI_VISIBILITY_TEST_PLAN.md (22 prompts × 6
engines × 3 runs, screenshot each) and record every run in the log. **No AI citation of FiredBunny has been observed,
so none is claimed.**

---

## G. Recommended fixes

Priority 1 means do now; 3 means later.

| # | Priority | Fix | Who |
|---|---|---|---|
| G1 | 1 | Merge `qa-final-audit` (this audit's fixes), then re-run Lighthouse on the live home page and a lesson | Owner approval, then automatic deploy |
| G2 | 1 | Search Console: confirm the domain property is verified, the sitemap is "Success", and URL Inspection → Request indexing for /, /tools/ and 5 key pages | Owner (Google account) |
| G3 | 1 | Bing Webmaster Tools: import from Search Console, submit the sitemap, check the IndexNow page after the first deploy | Owner (Microsoft account) |
| G4 | 2 | Sources for the 47 trading lessons without them, tax lessons first (CONTENT_OPPORTUNITIES.md A1) | Editor |
| G5 | 2 | GA4: build an "AI referrals" exploration (session source contains chatgpt, perplexity, copilot, gemini, claude) after G1 ships | Owner (GA4) |
| G6 | 2 | Calculator guides for the other 40 tools (CONTENT_OPPORTUNITIES.md A2) | Editor |
| G7 | 3 | Update the 24 external links that now redirect, e.g. the IRS pages renamed to "Working Families Tax Cuts" and the NYSE hours page | Editor |
| G8 | 3 | Split the 4.6 MB app bundle by track or course, so a lesson loads only its own widgets. This is the main remaining TBT cost. | Developer |
| G9 | 3 | Optional: a Cloudflare redirect rule turning the 307 trailing-slash redirect into a 301 | Owner (Cloudflare) |
| G10 | 3 | Real-user Core Web Vitals: send LCP, CLS and INP to GA4 with the `web-vitals` library, or rely on Search Console's CWV report once traffic exists | Developer / owner |
| G11 | 3 | For AI fetchers that cut long pages: consider a one-line "Sources: …" pointer near the top of long lessons | Editor |
| G12 | 3 | Small tap targets on phones: the home ticker and glossary letter filters are under 24 px. Inline text links are exempt from WCAG 2.5.8. | Developer |

---

## H. Deployment checklist (for merging `qa-final-audit`)

1. [ ] The owner approves the merge. This audit does not deploy.
2. [ ] `python3 tools/build.py`: 268 pages, 261 in the sitemap, seo check 0 errors.
3. [ ] The automated suites pass: sitetest, the widget harness, navigation, hash mode, analytics, campaign tags,
   narration, update flow, parity and offline (section C).
4. [ ] Commit `tools/seo-lastmod.json` with the change. Pages whose visible text changed (the hypothetical note, tool
   H1s) take today's date.
5. [ ] Merge to `main` and push. The workflow deploys and checks the live site.
6. [ ] Confirm the "Deploy to Cloudflare" check run and its notes. IndexNow should report "Sent N changed page(s)" with
   status 200 or 202. If it reports the key file is missing, re-run the workflow once the deploy has propagated.
7. [ ] Live spot checks:
   - `curl -I https://firedbunny.com/d3c82bf17a1f276a356f6570fc665f22.txt` returns 200;
   - a tool page's H1 has no "Chapter";
   - a lesson shows the hypothetical-example note;
   - the phone menu closes with Escape.
8. [ ] Re-run Lighthouse mobile on `/` and `/lessons/wheel-strategy/` (PageSpeed Insights web UI) and record the
   results in this file.
9. [ ] Republish the claude.ai copy from `build/fragment.html`.
10. [ ] Delete the temporary `qa-probe` branch (it deploys nothing).

---

## I. Post-deployment monitoring plan

| When | What | Tool | Signal to act on |
|---|---|---|---|
| Day 1 | Deploy check notes, IndexNow status, Lighthouse home and lesson | GitHub check run, PageSpeed Insights | Home mobile LCP above 4 s, or any deploy warning |
| Week 1 | Pages indexed and sitemap status; Bing's URL inspection | Search Console (Pages, Sitemaps), Bing Webmaster Tools | "Discovered, not indexed" on most URLs after 2 weeks; sitemap errors |
| Weekly | Queries, impressions, CTR by page type | Search Console Performance | Pages with impressions but CTR under 1%: rewrite title and answer line |
| Weekly | AI referrals | GA4 exploration (G5) | First sessions from chatgpt.com or perplexity.ai: note the landing pages |
| Monthly | The 22 AI prompts × engines × 3 runs, with screenshots | AI_VISIBILITY_TEST_PLAN.md, `ai_visibility_log.csv` | Citations, wrong descriptions (`accurate = no`), competitor patterns |
| Monthly | Core Web Vitals (field) once Search Console has data | Search Console CWV report, CrUX | Any URL group "Poor" or "Needs improvement" |
| Monthly | External link check and source recency | Re-run the probe script, or a link checker | New confirmed 404s; rules or limits changed (e.g. the 2027 IRS limits) |
| Every content release | Build seo check, sitemap lastmod, CONTENT_CHANGELOG.md entry | Build output | Any seo check error stops the deploy automatically |

---

## GO / NO-GO

RECOMMENDATION_PLACEHOLDER
