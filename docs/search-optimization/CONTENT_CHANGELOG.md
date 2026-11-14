# Content changelog

What changed in FiredBunny's lessons, calculators and editorial pages for answer-engine and AI-search readiness
(AEO/GEO), what was checked, and what still needs a human editor. Newest first. Companion files:
[CONTENT_OPPORTUNITIES.md](CONTENT_OPPORTUNITIES.md) (the review and the plan) and
[AI_VISIBILITY_TEST_PLAN.md](AI_VISIBILITY_TEST_PLAN.md) (how to measure whether AI tools cite the site).

---

## 13 November 2026 (later): QA audit fixes, on branch `qa-final-audit`, not deployed

Details and evidence: [FINAL_AUDIT.md](FINAL_AUDIT.md).

- **Hypothetical-example note:** every worked example now carries "Hypothetical example for illustration, not a
  forecast or a recommendation", except in the Read a Real Company course, which uses real reported figures. The note
  is template text, not narrated.
- **Tool page H1s:** these no longer start with a screen-reader-only "Chapter NN:", so crawlers read "Position size",
  not "Chapter 01: Position size".
- **Accessibility:**
  - footer headings are now `h2`, so heading levels no longer jump;
  - the option-profit table's scroll area can be reached by keyboard;
  - the assessment Back button has a name;
  - the calendar has a valid role and readable contrast;
  - Escape closes the phone menu;
  - the skip link targets the content.
- **Performance:** the site script loads only after the pre-built page has painted with its fonts.
- **Analytics:** campaign tags such as `utm_source=chatgpt.com` are kept on the landing page view.
- **IndexNow:** a key file and a post-deploy submission step.

No formulas or narrated text changed.

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
