# Content changelog

What changed in FiredBunny's lessons, calculators and editorial pages for answer-engine and AI-search readiness
(AEO/GEO), what was checked, and what still needs a human editor. Newest first. Companion files:
[CONTENT_OPPORTUNITIES.md](CONTENT_OPPORTUNITIES.md) (the review and the plan) and
[AI_VISIBILITY_TEST_PLAN.md](AI_VISIBILITY_TEST_PLAN.md) (how to measure whether AI tools cite the site).

---

## 25 November 2026: download every lesson, 18 more sourced lessons, 9 deeper FIRE and tax lessons

- **Listen offline** (`SML.offlineBar`): one button saves every lesson's recording (163, about 299 MB) and a red
  "Delete downloads" button, greyed out when nothing is saved, clears them. On `/lessons/`, every lesson page, the
  profile page (guests too) and the Offline page. Download progress totals on the Offline page now show the real size
  (the size lookup did not understand full addresses, so totals read "0.0 MB").
- **Sources added to 18 lessons** (opened 25 November 2026): Robinhood's agentic trading announcement and support page,
  Genfinity and Finder on crypto support, the MCP introduction, Alpaca's MCP server, the SEC on EDGAR access, TradingView
  (webhooks, Pine Script v6), backtesting.py, FINRA Regulatory Notice 26-10 (the $25,000 pattern day trader minimum is
  gone, effective June 4, 2026), the SEC/NASAA/FINRA AI investor alert, Nasdaq system hours and FINRA on extended hours,
  Fidelity on P/E, the SEC guide to financial statements, NYU Stern S&P 500 returns, IRS Topic 409 and Publication 550,
  Investor.gov's types of orders and compound interest calculator, Kiplinger (50/30/20), the CFPB spending tracker.
- **Still without sources (9):** 2-min vs 15-min, win rate and reward, losses are lopsided, which stocks to trade,
  blending styles, trading psychology, fear and greed, keep a journal, AI as your trading coach. They are arithmetic or
  labelled rules of thumb; no outside page was found that supports their specific claims better than the math does.
- **Deeper lessons (brief, deep, FAQ; not narrated):** short vs long-term gains (2026 and 2027 rate bands from Kiplinger,
  the 3.8% tax from the IRS), tax-loss harvesting, the wash sale rule (Investor.gov, Kiplinger: spouse and IRA purchases,
  crypto not covered for now), what FIRE means, savings rate, Coast FIRE, sequence risk (Kitces: the red zone and the bond
  tent), real spending (BLS 2025: $81,905), the 4% rule (the 1998 Trinity study in the AAII Journal).

## 18 November 2026 (later): calculator guides, four options lessons and embeddable calculators

- **"How this calculator works"** now covers 46 of 55 tools (from 10). Each guide was written from the widget's own
  code, and its worked example was read from the live widget with its default inputs and recalculated by hand. The 9
  without a guide are explorers rather than calculators (the style quiz, cost of living by place, France and US tax,
  metals, the earnings call player, the statement explorer, earnings and the price, the earnings lookup).
- **New lessons and calculators** in Options & the Wheel: covered calls, cash-secured puts, rolling options, and
  assignment and early exercise, each with its own calculator (covered call, cash-secured put, option roll, early
  assignment risk) and narration. Sources opened on 18 November 2026: Options Industry Council (covered call,
  cash-secured put), Schwab (managing cash-secured puts; risks of assignment), Fidelity (dividends and assignment
  risk), E*TRADE (automatic exercise at $0.01 in the money), the OCC options disclosure document. Model figures
  (premiums, chances of assignment) come from the calculators' Black-Scholes helper and are labelled estimates.
- **Embeds:** every calculator page offers an iframe snippet (`/tools/<name>/?embed`): the calculator alone, a link
  back, no analytics, noindex, and framing allowed only for that address (worker/index.js).
- **Sources added to 10 lessons** (opened 18 November 2026): IRS Topic 409 (capital gains, tax-loss harvesting),
  IRS Publication 550 and Kitces on Rev. Rul. 2008-5 (wash sales, including IRA purchases), SEC Investor.gov (stocks,
  bonds, mutual funds and ETFs, types of orders), FINRA (ETFs), SIPC (what it protects), the SEC's guide to financial
  statements (statements, earnings). Investor.gov's bond page does not say longer bonds swing more; that sentence
  stands on the bond math in the lesson. 27 lessons still have no sources (habits, AI, budgeting, styles, risk).
- **Rules of thumb** in the rolling lesson ("when rolling makes sense") are labelled as such.

## 18 November 2026: 19 deeper lessons, course guides, privacy, terms and contact

- **Deeper lessons** (`brief`, `deep`, `faq`; not narrated): the six thin Options & the Wheel lessons (calls and puts,
  contracts, payoff diagrams, delta and gamma, theta, IV and earnings), nine chart and indicator lessons (candlesticks,
  the four day-trading levels, support and resistance, breakouts, volume, SMA vs EMA, the 13/48/200 EMA, VWAP, RSI)
  and four risk lessons (the 1% rule, position sizing, win rate and R, drawdowns).
- **Sources added**, each opened on 17 or 18 November 2026 and supporting a statement on the page: Options Industry
  Council (what is an option, delta, gamma, theta, vega), SEC Investor.gov (introduction to options; extended-hours
  trading; stop orders), FINRA (extended-hours trading), E*TRADE (expiration and automatic exercise), Cboe (expected
  move from the straddle), StockCharts ChartSchool (VWAP, RSI, moving averages, support and resistance), Schwab (reading
  charts). StockCharts' RSI page contained text addressed to AI tools; it was ignored and only its content was used.
- **Rules of thumb** (breakout checklist, volume thresholds, the EMA stack, premarket plans) are labelled on the page
  as FiredBunny's rules, not facts.
- **Arithmetic** in the new tables was recalculated: losing streaks at 1/2/5/10% risk (9.6/18.3/40.1/65.1%), recovery
  gains (11.1/25/42.9/100/300%), breakeven win rates (50/40/33.3/25%), the VWAP table and relative volume.
- **Course pages** show "What you'll learn": who the course is for (from its level) and each lesson's one-line idea and
  first two takeaways, taken from the lessons themselves.
- **Needs human review:** "Many day traders set a minimum average daily volume", "few experienced traders go above 2%",
  and the typical decay table for theta are general practice without a single source.

---

## 17 November 2026: search titles, hub pages and a deeper wheel lesson

Follows the site audit of 17 November 2026 (measured on commit 6aba670).

### What changed

- **Titles.** 87 lessons and 27 tools whose own title is a short curriculum name got a `TITLES` entry in
  `src/seo.js` that says what the page covers, written from the lesson's own one-line idea. Lesson headings,
  addresses and narrated text did not change. One title was reworded after the help chat's test showed it pulled
  "Roth IRA vs 401k" to the wrong lesson.
- **Calculator headings** are now the plain name ("Position size calculator"); the hidden "Chapter NN:" prefix is
  gone from every heading on the site.
- **Byline** under each lesson title: "By FiredBunny", the month its figures were checked (lessons with sources
  only) and a link to the editorial standards. It restates what the page already says at the bottom.
- **Hub pages** `/lessons/` and `/courses/` (`/tracks/` is the same page as `/courses/`).
- **Structured data:** `datePublished` on lessons (24 October 2026 for all 159: the day they first entered the
  repository), `WebApplication` on calculators (no ratings), `DefinedTermSet` on the glossary. Course markup was
  considered and left out: Google's course-list guideline requires courses "led by one or more instructors with a
  roster of students" (read 17 November 2026).
- **The wheel strategy lesson** grew from about 340 to about 1,500 words of explanation, using three new lesson
  fields that are shown but not narrated: `brief` (a short answer under the summary), `deep` (sections after the
  takeaways: strike and expiration, assignment, rolling, choosing stocks, returns) and `faq` ("Common questions",
  six questions with short answers, as visible text with no FAQ markup). Reading time 6 to 11 minutes.

### Rules followed

- Narrated fields (idea, body, example, mistakes, points) were not touched, so no audio was re-recorded.
- Every source added to the wheel lesson was opened on 17 November 2026 and supports a statement on the page:
  Options Industry Council (Delta: "Some traders view Delta as a percentage probability an option will wind up
  in-the-money at expiration"; cash-secured put: "primarily a stock acquisition strategy for a price-sensitive
  investor"), Schwab (assignment at any time, more likely in the money with little time value; rolling adds costs),
  Fidelity (a covered call is likely exercised the day before the ex-dividend date when the dividend exceeds the
  remaining time value, and the seller gives up shares and dividend), Cboe (PutWrite index 1986 to 2018: +1,835%,
  volatility 9.95% against 14.93% for the S&P 500).
- Rules of thumb are labelled as such on the page ("common practice, not a rule", "FiredBunny's rules of thumb, not
  facts"), as the editorial standards require.
- The earlier "no FAQ blocks" rule changed on purpose: questions with short answers are what searchers and answer
  engines look for. They are ordinary visible text; FAQ markup is still not used (Google retired the rich result).

### Needs human review

- "About 9.5% a year" for the PutWrite index is arithmetic on Cboe's 1,835% over 32.5 years, not a figure Cboe's
  page states.
- "Many wheel traders sell options about a month from expiration" is stated as common practice, without a source.
- The one-line tax and IRA answers restate the site's own wheel tax and wheel-in-an-IRA lessons.

---

## 13 November 2026: calculator method sections, lesson sources, editorial standards

### Rules followed

- Every new formula, assumption and worked example was checked against the widget's own code, and every example
  figure was recomputed. The examples were then compared with the live calculator at its default inputs (Playwright
  read the outputs); all matched.
- Every source added was opened and checked on 13 November 2026 for the claim it supports. A source that could not
  be checked was left out: VWAP has no source yet (see "Needs human review").
- Narrated lesson fields (idea, body, example, mistakes, points) were left alone, with one exception: the
  day-trading lesson, where a verified correction was needed. Its audio was re-recorded with the same Kokoro voice.
  The narration check reports "0 lessons still without current audio".
- No FAQ blocks were added, no keyword lists, no hidden text, and no new structured data beyond what the page shows
  (one property: `publishingPrinciples` on the Organization, pointing to the new visible editorial page).

### New: "How this calculator works" on 10 calculator pages

Each of these pages now has a section under the calculator with: what it calculates (a direct answer), the formula,
what it assumes, a worked example using the calculator's default inputs, its limits, sources, and the month it was
checked. Each page's search description now states the formula or the answer instead of the generic blurb.

| Page | Formula now stated on the page | Sources added |
|---|---|---|
| [/tools/position-size/](https://firedbunny.com/tools/position-size/) | shares = (account × risk %) ÷ (entry − stop), rounded down | Investor.gov stop order; FINRA intraday trading (Jun 2026) |
| [/tools/option-profit/](https://firedbunny.com/tools/option-profit/) | breakeven = strike ± premium; max profit and loss by side; Black-Scholes at 4% for the model price and Greeks | Investor.gov options bulletin (updated Jul 2026); OCC options disclosure document; Black and Scholes (1973) |
| [/tools/wheel-income/](https://firedbunny.com/tools/wheel-income/) | return = premium ÷ strike (put) or ÷ stock price (call); annualized = return × 365 ÷ days, simple | OIC cash-secured put; OIC covered call; OCC options disclosure document |
| [/tools/compound-interest/](https://firedbunny.com/tools/compound-interest/) | monthly compounding at return ÷ 12; cost of waiting 10 years; rule of 72; today's dollars at 3% | Investor.gov compound interest calculator; BLS CPI (Sep 2026) |
| [/tools/fire-number/](https://firedbunny.com/tools/fire-number/) | (spending − other income − Social Security) ÷ withdrawal rate + bridge | ERN; Advisor Perspectives (Bengen 2025); Morningstar 2026; SSA |
| [/tools/safe-withdrawal-rate/](https://firedbunny.com/tools/safe-withdrawal-rate/) | 1,000 simulated paths; inflation-adjusted withdrawals; the return assumptions in plain words | Advisor Perspectives (Bengen); ERN (2 articles); Morningstar 2026 |
| [/tools/expected-move/](https://firedbunny.com/tools/expected-move/) | price × IV × √(days ÷ 365); 68% and 95% ranges | CME Group options volatility; OIC "rule of 16" |
| [/tools/drawdown-recovery/](https://firedbunny.com/tools/drawdown-recovery/) | gain needed = loss ÷ (1 − loss); years at 10% | none needed (arithmetic) |
| [/tools/win-rate-and-r-simulator/](https://firedbunny.com/tools/win-rate-and-r-simulator/) | edge = win rate × R − loss rate; breakeven win rate = 1 ÷ (1 + R) | none needed (arithmetic and simulation) |
| [/tools/years-to-freedom/](https://firedbunny.com/tools/years-to-freedom/) | years from savings rate, return and withdrawal rate (formula shown) | Mr. Money Mustache (2012), labeled as a blog |

Data lives in `src/content-toolguide.js`; `pages.js` (`toolGuide`) draws it with existing styles plus one CSS rule.

### Lessons: sources, checked dates and calculator links

- **Primary sources added** to 7 lessons that had none, each with a "Figures checked November 2026" date:
  - [Calls and puts](https://firedbunny.com/lessons/calls-and-puts/): Investor.gov options bulletin, OCC disclosure document. It now also links the option profit calculator.
  - [Payoff diagrams](https://firedbunny.com/lessons/payoff-diagrams/): OIC cash-secured put, Investor.gov, OCC.
  - [The wheel strategy](https://firedbunny.com/lessons/wheel-strategy/): OIC cash-secured put and covered call, Investor.gov, OCC.
  - [The 1% rule](https://firedbunny.com/lessons/1-percent-rule/): Investor.gov stop order, FINRA. It now also links the position size calculator.
  - [Position sizing](https://firedbunny.com/lessons/position-sizing/): Investor.gov stop order, FINRA.
  - [Volatility & expected move](https://firedbunny.com/lessons/volatility-and-expected-move/): CME Group, OIC.
  - [Day trading rules in 2026](https://firedbunny.com/lessons/day-trading-rules/): FINRA Regulatory Notice 26-10, FINRA intraday trading page.
- **Correction (verified):** the day-trading lesson said brokers "switched over around June". FINRA Regulatory Notice
  26-10 says the SEC approved the change on 14 April 2026, it took effect on 4 June 2026, and firms have until
  20 October 2027 to finish the move. The sentence now says that. The narration was re-recorded.
- **Calculator links on lessons:** every lesson that has a matching calculator now shows a "Run your own numbers"
  link to it after the worked example. That is 52 lessons, and it adds crawlable links from lessons to tools.
- **The "Figures checked" note** now reads each lesson's own `checked` month (default October 2026, as before) and
  links to the editorial standards.

### New page: [/editorial-standards/](https://firedbunny.com/editorial-standards/)

Written to match the owner's decision: **pen name with AI disclosed.** It says:

- FiredBunny is a pen name, claims no professional credentials, and no page claims review by a licensed professional.
- Pages are drafted with AI tools and checked against the primary sources cited on each page.
- Not every lesson lists sources yet.
- The order of preference for sources, and that each sourced lesson shows the month it was checked.
- How facts, assumptions, rules of thumb and opinions are told apart.
- US federal focus.
- No ads and no affiliate links. This was checked in the code: no ad scripts and no referral parameters.
- The narration is a computer voice: Kokoro-82M, or the device's own voice.
- How to report a correction, using the About page form's "Correct an inaccuracy" option.

The page is linked from the footer, the About page, every sourced lesson and every calculator guide. It has its own
title and description, is in the sitemap (261 URLs) and has a frozen address.

### Brand and trust fixes

- The old name "Stock Market Lessons" was replaced with "FiredBunny" in visible text: the TradingView disclaimer, the
  Pine Script header comment, the AI Pine builder's output comment, and the calendar file's PRODID. Internal source
  comments were left as they were.
- **About page:** "Every figure checked against official sources" overstated it, because 54 of the 83
  trading lessons had no sources (47 after this change). It now says lessons link the sources their figures were checked against, with the month, and links to the
  editorial standards.

### Pages whose content changed (128 in total, per the prerender)

- 10 calculator pages: the method sections.
- 52 lessons: the calculator link.
- Every lesson with sources: the note now links to the editorial standards.
- The About, TradingView indicator and editorial pages.

`tools/seo-lastmod.json` records 2026-11-13 for these pages.

### Checks run

- `python3 tools/build.py`: 268 pages, 261 in the sitemap, seo check 0 errors and 0 warnings.
- `tools/sitetest.py`: 266/266 routes clean.
- Route, analytics, narration and hash-mode tests all pass. The route test now expects 268 routes.
- Phone (390 px) and desktop screenshots of the new sections show no horizontal scroll and no console errors.

### Needs human review

These are listed in priority order in [CONTENT_OPPORTUNITIES.md § Human editorial review](CONTENT_OPPORTUNITIES.md#human-editorial-review).
In short:

- A primary source for VWAP.
- Sources for 47 trading-track lessons, including the tax lessons.
- The 2027 IRS limits, once they are announced.
- The "SML Levels" indicator name.
- The About page's "ten years" persona.
- The corrections policy wording.
