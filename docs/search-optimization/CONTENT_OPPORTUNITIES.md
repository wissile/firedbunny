# Content review and opportunity plan (AEO/GEO)

**Date:** 13 November 2026. **Scope:** lessons, calculators and concept pages on firedbunny.com. The question is
whether each page gives people, search engines and AI answer engines a clear, correct, well-sourced answer, and
then leads them into the interactive tool. The changes already made are in
[CONTENT_CHANGELOG.md](CONTENT_CHANGELOG.md).

## Method and limits

- **The content was read from the source** (`src/*.js`) with a script that loads the site's data the same way the
  narration builder does, and from the built pages (`dist/`).
- **Calculator formulas were read from each widget's code**, and every worked example was recomputed. Examples on the
  calculator pages were also compared with the live calculator at its default inputs.
- **Sources were checked by opening them** on 13 November 2026 (WebFetch or WebSearch). Anything not checked is
  marked as unchecked.
- **The question phrasings below are representative, not measured.** No Search Console, Bing or keyword-tool query
  data was available. Treat them as hypotheses, and replace them with real queries from Search Console
  (Performance → Queries) once the pages have impressions. See [BASELINE.md](BASELINE.md).
- No claim is made here about rankings or AI citations. Measuring those is the job of
  [AI_VISIBILITY_TEST_PLAN.md](AI_VISIBILITY_TEST_PLAN.md).

---

## Phase 1: how the pages are structured

### The lesson template is strong

Every lesson uses the same structure, drawn by `pages.js` `lessonPage`:

| Element | Present | Notes |
|---|---|---|
| Descriptive H1 | 159/159 | The H1 is the lesson title. Short titles (VWAP, RSI) get a fuller `<title>` from `seo.js` `TITLES`. |
| Concise answer near the start | 159/159 | The `idea` line sits under the H1, one or two sentences, and doubles as the meta description when it is 70–165 characters. |
| Beginner explanation | 159/159 | "How it works", in plain English, with terms explained on first use. |
| Formulas and assumptions | Most | Formulas are in the body or the takeaways, e.g. breakeven, expectancy, shares = risk ÷ stop distance. |
| Worked example | 159/159 | Numbered steps and a result, using made-up tickers (DEMO). |
| Risks and limits | 159/159 | "Common mistakes" on every lesson. |
| Questions | 159/159 | A one-question quiz with an explanation. There are no FAQ blocks, which is right: none would add anything. |
| Related lessons and tools | Lessons yes; tools now 52 | Inline links to other lessons. As of this change, every lesson with a matching calculator links to it. |
| Credible references | 109/159 | Trading 36/83, Retirement & Wealth 48/51, FIRE 25/25. The trading track is the gap. |

### Calculators were the weakest page type (now partly fixed)

Before this change, a calculator page had a title, a one-line blurb, the widget, a lesson link and "For learning
only". Some widgets showed the formula in a small note; none listed assumptions, limits or sources. An answer engine
had little text to quote, and a reader had no way to check the method.

**Now 10 of 50 calculators** have a "How this calculator works" section: what it calculates, the formula, what it
assumes, a worked example, its limits, sources and the month checked. **40 calculators still need one** (Phase 5, A2).

### Concept pages

- **The glossary** is strong: each term has a stable anchor (`/glossary/#vwap`) and links to the lesson where you can
  try it.
- **Course and track hubs** describe their lessons in order, which is fine. They have no "start here" answer of their
  own, but they do not need one: they are navigation pages.

---

## Phase 2: real questions mapped to pages

The "where the answer is" column names the sentence an answer engine can quote. Each page leads into an interactive
tool.

| Question (representative phrasing) | Best page | Where the direct answer is | Tool it leads to | Status |
|---|---|---|---|---|
| What is the wheel strategy? | [/lessons/wheel-strategy/](https://firedbunny.com/lessons/wheel-strategy/) | The idea line, then steps one to three in the body | [Wheel income](https://firedbunny.com/tools/wheel-income/), [wheel simulator](https://firedbunny.com/tools/wheel-simulator/) | Answered; sources added |
| How do covered calls work? | the wheel lesson, step three; wheel income in covered call mode | Step three of the wheel body, and the wheel income formula | Wheel income | **Partial: no dedicated page** (B1) |
| What is a cash-secured put? | [/lessons/payoff-diagrams/](https://firedbunny.com/lessons/payoff-diagrams/), wheel lesson | Payoff example: sell a $47 put, breakeven $46 | Wheel income, option profit | Answered; OIC source added |
| How do you calculate an option's breakeven? | [/lessons/calls-and-puts/](https://firedbunny.com/lessons/calls-and-puts/) | Takeaway: "Breakeven = strike + premium for a call, strike − premium for a put" | [Option profit](https://firedbunny.com/tools/option-profit/) (formula stated) | Answered |
| What is VWAP and how is it calculated? | [/lessons/vwap/](https://firedbunny.com/lessons/vwap/) | The idea line; the body gives typical price × volume ÷ cumulative volume, reset daily | Lesson widget (no stand-alone tool) | Answered; **no source yet** (review) |
| How do I calculate position size? | [/tools/position-size/](https://firedbunny.com/tools/position-size/) | "shares = (account × risk %) ÷ (entry − stop)" in the description and the guide | Itself | Answered |
| How much should I risk per trade? | [/lessons/1-percent-rule/](https://firedbunny.com/lessons/1-percent-rule/) | The idea line; the guide calls it a rule of thumb | Position size | Answered |
| How much money do I need to retire early? | [/lessons/your-fire-number/](https://firedbunny.com/lessons/your-fire-number/) | "FIRE number = (yearly spending − other yearly income) ÷ withdrawal rate" | [FIRE number](https://firedbunny.com/tools/fire-number/) | Answered; sourced |
| How does compound interest work? | [/lessons/power-of-compound-interest/](https://firedbunny.com/lessons/power-of-compound-interest/) | The idea line; $10,000 at 7% example | [Compound interest](https://firedbunny.com/tools/compound-interest/) (formula stated) | Answered |
| What is a safe withdrawal rate? Is the 4% rule still valid? | [/lessons/4-percent-rule-and-its-limits/](https://firedbunny.com/lessons/4-percent-rule-and-its-limits/) | The idea line; Bengen 4.15%, ERN 3.25–3.5%, Morningstar 3.9% for 2026 | [Safe withdrawal rate](https://firedbunny.com/tools/safe-withdrawal-rate/) | Answered; sourced |
| How long until I can retire at a 30% savings rate? | [/lessons/savings-rate-is-the-lever/](https://firedbunny.com/lessons/savings-rate-is-the-lever/) | Lesson body; the calculator guide gives about 28 years at 5% and 4% | [Years to freedom](https://firedbunny.com/tools/years-to-freedom/) | Answered |
| How big a move are options pricing in? | [/lessons/volatility-and-expected-move/](https://firedbunny.com/lessons/volatility-and-expected-move/) | "Expected move = price × IV × √(days ÷ 365)" | [Expected move](https://firedbunny.com/tools/expected-move/) | Answered; sources added |
| What gain do I need to recover from a 50% loss? | [/lessons/losses-are-lopsided/](https://firedbunny.com/lessons/losses-are-lopsided/) | "Gain needed = loss ÷ (1 − loss)" | [Drawdown recovery](https://firedbunny.com/tools/drawdown-recovery/) | Answered |
| Is the pattern day trader rule gone? | [/lessons/day-trading-rules/](https://firedbunny.com/lessons/day-trading-rules/) | The idea line, with the FINRA dates in the body | Lesson widget | Answered; corrected and sourced |
| What is the wash sale rule? | [/lessons/wash-sale-rule/](https://firedbunny.com/lessons/wash-sale-rule/) | The idea line: 30 days before or after | Lesson widget | Answered; **no IRS source yet** (review) |

---

## Phase 3: GEO signals

| Signal | Status | Where |
|---|---|---|
| Original examples | Strong | Every lesson has its own worked example; calculator guides use the calculator's default inputs. |
| Tool descriptions | 10/50 rich | Calculator guides plus formula-first meta descriptions. 40 still use the blurb (A2). |
| Transparent formulas and assumptions | 10/50 tools; most lessons | A2 covers the remaining tools. |
| Primary citations | 109/159 lessons; 8/10 guides | IRS, SSA, SEC/Investor.gov, FINRA, OCC/OIC, BLS and the Fed are preferred; secondary sources are named (ERN, Morningstar, Advisor Perspectives, Mr. Money Mustache). |
| Accurate authorship and editorial information | **New** | [/editorial-standards/](https://firedbunny.com/editorial-standards/): a pen name, AI disclosed, no credentials claimed. Organization JSON-LD `publishingPrinciples` points to it. |
| Consistent brand description | Good | `seo.js` `ABOUT` is used for Organization and WebSite. The About page description says the same thing in the owner's voice. The old "Stock Market Lessons" name is gone from visible text. |
| Contextual links | Improved | Lesson → calculator links (52 lessons), calculator → lesson links in the guides, editorial page linked from footer, About, lessons and guides. |
| Fact vs assumption vs opinion | Stated as policy | On the editorial page. Calculator guides separate "the formula" from "what it assumes"; rules of thumb (1% risk) are labeled as such. |
| Comparisons | Present | Roth vs traditional, rent vs buy, claim ages, safe-withdrawal-rate research side by side. A covered-call vs cash-secured-put comparison is missing (B1). |
| llms.txt | Not added | Optional, and it has no proven effect. Pre-built HTML, the sitemap and plain-language pages matter more. |

---

## Phase 4: financial accuracy review

### Verified in this round

- **Arithmetic of the worked examples** in: the wheel (the $170 profit and 4.5% return, and the $630 loss at $30),
  payoff diagrams, calls and puts, position sizing, the 1% rule (the $14,265 and $8,857 streaks), win rate & reward,
  compound interest ($19,672, $38,697 and $76,123; Alex $421,453; Bo $365,991; Maya $1,049,925; Jordan $487,988),
  your FIRE number ($1.75M with a ~$400K bridge, matching the calculator) and the 4% rule ($1.71M and $1.85M).
- **Calculator examples against the live widgets at their defaults:** wheel income, compound interest, years to
  freedom, drawdown, expected move, FIRE number, the win rate & R simulator and option profit all match.
- **2026 retirement limits** are consistent across lessons ($24,500 401(k); $7,500 IRA; $8,000 catch-up; $11,250
  for ages 60–63; $8,600 IRA at 50+), and the lessons cite the IRS announcement.
- **The day-trading rule change** was checked against FINRA Regulatory Notice 26-10 (SEC approval 14 April 2026,
  effective 4 June 2026, transition to 20 October 2027) and the FINRA intraday trading page ($2,000 margin minimum).
  One sentence was corrected and the audio re-recorded.
- **Options risk and assignment** wording on the wheel, payoff and calculator pages matches the Investor.gov
  bulletin (buyers risk the premium; writers can face very large losses and get assignment notices) and OIC (early
  assignment risk, especially before an ex-dividend date).
- **No guaranteed returns** were found in the reviewed pages. The wheel calculator shows an annualized figure, but
  the widget note and the guide both say it assumes the trade could be repeated all year, which rarely happens.

### Flags (not changed; see the review list)

- **The 1% rule, body text:** "a trader who wins half the time will see about 8 losses in a row somewhere in a few
  hundred trades". At a 50% win rate, the chance of at least 8 losses in a row is about 32% in 200 trades, 44% in
  300 and 62% in 500, and the typical longest losing run in 300 trades is about 7 to 8. "Will see" overstates the
  certainty. A suggested fix: "is likely to hit 7 or 8 losses in a row". This text is narrated.
- **Tax lessons in the trading track** (short vs long-term gains, tax-loss harvesting, wash sale) state IRS rules
  without sources: the $3,000 / $1,500 capital-loss limit, the 61-day wash-sale window and IRA purchases washing a
  loss. They match the editor's understanding of the rules but were **not source-checked this round**. Add IRS
  Publication 550 and Topic 409 after checking them.
- **2027 limits:** the 401(k) lesson says the IRS "had not yet announced 2027 401(k) limits as of October 21, 2026".
  On 13 November 2026 a search found only projections. When irs.gov publishes the 2027 figures (usually in
  November), update the lessons, tools and calendar that use 2026 limits.
- **"Figures checked October 2026"** on 102 lessons is an existing claim. This round did not re-check those lessons.
- **The option profit and wheel model prices** use Black-Scholes with no dividends, while US stock options are
  American-style. The guides say so. The model premium is only a default: users can type their broker's quote.
- **VWAP:** the formula is correct and standard, but no primary source was found that could be checked. One
  candidate is Berkowitz, Logue and Noser (1988), "The Total Cost of Transactions on the NYSE", *Journal of
  Finance*, the paper usually credited with introducing VWAP as a benchmark. Its publisher page could not be
  opened, so it was not added.

---

## Phase 5: opportunity plan

### A. Improve existing pages first (highest value per hour)

| # | Work | Why | Effort |
|---|---|---|---|
| A1 | **Sources for the 47 trading lessons without them.** Start with the tax lessons (IRS Pub 550, Topic 409), then contracts, theta and IV crush (OCC disclosure document, OIC), order types (Investor.gov), ETFs, stocks and bonds (Investor.gov), earnings and statements (SEC "Beginners' guide to financial statements"). | Primary citations are the strongest trust signal, and the trading track is the gap (36/83). Sources are not narrated, so no audio work. | 1–2 days |
| A2 | **Calculator guides for the other 40 tools**, in priority order: tax-loss harvest, Roth vs traditional, Social Security claiming age, 401(k) match, mortgage, rent vs buy, retirement planner, tax brackets, rental property, margin of safety. | Same structure as the first 10; they are the pages people use, and the ones answer engines can quote. | 0.5–1 h per tool |
| A3 | **Fix the 1% rule streak sentence** and re-record its audio. | Small accuracy fix (above). | 15 min |
| A4 | **Re-date the October 2026 lessons as they are re-checked**, by giving each its own `checked` month. | "Checked" dates are only worth something if they are true. | Ongoing |
| A5 | **2027 limits** once the IRS publishes them. | Time-sensitive figures in several lesson, tool and calendar files. | 2–3 h |
| A6 | **The tool hub (`/tools/`)**: group the calculators by question ("How much to risk?", "When can I retire?") with one-line answers. | Helps people and crawlers find the right tool. | 2 h |

### B. New pages, only where nothing existing answers the question

**B1. Covered calls (lesson, Options & the Wheel course)**
- Intent: educational ("how do covered calls work", "covered call vs cash-secured put").
- Audience: investors who already own 100 shares and want income; people learning the wheel.
- Learning goal: understand the trade-off (premium versus capped upside), the breakeven, assignment, and when not to sell a call.
- Unique value: an interactive payoff with your own cost basis; a side-by-side with the cash-secured put; ties into the wheel simulator.
- Sources: OIC covered call (checked), OCC options disclosure document (checked), Investor.gov options bulletin (checked). For taxes, IRS Publication 550 on qualified covered calls (check before citing).
- Tools: wheel income (covered call mode), option profit, wheel tax walkthrough.
- Links: from the wheel lesson (step three), payoff diagrams, calls and puts; to theta, assignment and the wheel simulator.

**B2. Cash-secured puts (lesson), or a section in B1**
- Intent: "what is a cash-secured put", "is selling puts risky".
- Audience: wheel beginners.
- Learning goal: understand the obligation to buy at the strike, the cash set aside, breakeven = strike − premium, and assignment.
- Unique value: an assignment walk-through with your own numbers.
- Sources: OIC cash-secured put (checked), OCC options disclosure document.
- Tools: wheel income (put mode).
- Links: wheel lesson, payoff diagrams.
- **Recommendation:** make it part of B1 as a comparison, unless Search Console later shows separate demand.

**B3. VWAP calculator (tool)**
- Intent: "how to calculate VWAP", "VWAP formula".
- Audience: day traders checking their charting platform's line.
- Learning goal: see how each bar's typical price and volume move the line.
- Unique value: paste or edit a few bars and watch the running VWAP update; show why it resets each session.
- Sources: needs a checked primary source first (see Phase 4).
- Tools: itself; the VWAP lesson widget.
- Links: the VWAP, volume and indicators lessons.
- Build only after A1 and A2.

Pages that do **not** need to be created, because existing ones answer the question: option breakeven (calls and
puts, plus the option profit guide), money needed to retire early (your FIRE number), safe withdrawal rate (the 4%
rule lesson and tool), compound interest and position size.

---

## Human editorial review

In priority order. None of these were changed automatically because each needs an owner decision or a source that
could not be checked.

1. **The VWAP source.** Find and check a primary or authoritative source (an exchange, a regulator or the 1988
   paper), then add it to the VWAP lesson.
2. **Tax lesson sources** (short vs long-term gains, tax-loss harvesting, wash sale): check each rule against IRS
   Publication 550 and Topic 409 and add the sources. Confirm the IRA wash-sale statement against the IRS guidance.
3. **The 1% rule streak sentence:** approve the wording fix, then re-record its audio.
4. **2027 IRS limits:** update when the IRS releases them.
5. **The editorial standards page:** confirm the corrections policy is one you will follow ("Confirmed corrections
   are made on the page itself, and its last-checked date is updated"). Confirm the "pen name" and "no ads, no
   affiliate links" statements stay true. If a licensed professional ever reviews pages, say so there and on those
   pages.
6. **The About page persona** ("For ten years I collected money lessons..."): it is your first-person story under
   the pen name. Keep it only if it is true.
7. **The TradingView indicator name** is still "SML Levels" (from the old brand). Renaming it to "FiredBunny Levels"
   changes what users see in TradingView and in alert names. Decide before the next indicator update.
8. **October 2026 checked dates** on the 102 lessons not re-checked this round: re-check them over time (A4).
