# FiredBunny keyword and content strategy

**Date:** 12 November 2026. Target URLs use the proposed paths from [URL_INVENTORY.csv](URL_INVENTORY.csv)
(`recommended_url`). None of these pages can rank until the URL and prerender work in
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) (T6–T7) ships.

## Method and limits (read first)

- **No search volumes, difficulty scores or rankings appear in this file.** No keyword tool, Search Console or Bing
  Webmaster Tools data was available, so none are given and none are implied.
- **Competitor evidence** comes from results returned by the web search tool used for this audit, on 2026-11-12.
  **That tool is not Google**, so its result order is not a Google ranking. It shows which *kinds* of sites publish
  on a topic, not who ranks first.
- **Priorities** (A, B, C) are **estimates**. They combine fit with FiredBunny's existing pages, how differentiated
  FiredBunny's interactive version is, and how crowded the observed results were with large publishers.
- **Validation:** once pages are indexed, replace these estimates with real queries and impressions from Search
  Console (Performance report), Bing Webmaster Tools (Search Performance and Keyword Research), Google Keyword
  Planner and Google Trends. See BASELINE.md.

## Search intent model

| Intent | What the searcher wants | FiredBunny page type | Example topics |
|---|---|---|---|
| Informational / definitional | A precise answer to "what is X" | Lesson (answer-first intro), glossary | what VWAP is, what theta means |
| Educational / how-to | To understand a method or process | Lesson + widget + quiz; course hub | how the wheel strategy works, how a backdoor Roth works step by step |
| Calculator / tool | To compute something for their own numbers | Calculator page with method, assumptions and a worked example | position size, FIRE number, compound interest, Social Security claiming age |
| Comparison / decision | To choose between options | Lesson framed as a decision, with a tool | Roth vs traditional, rent vs buy, claim at 62 vs 67 vs 70 |
| Practice / simulator | A safe place to try | Playground, wheel simulator | trading simulator, practise the wheel with fake money |
| Navigational / brand | FiredBunny itself | Home, About | "FiredBunny", "FiredBunny wheel calculator" |

FiredBunny's advantage is in the **educational** and **calculator** intents. Every lesson pairs an explanation with
something to play with, and most calculators link back to a lesson. Generic finance publishers rarely combine both
on one page.

## Competitor landscape (observed, not ranked)

| Type | Examples seen in results | What they do well | Where FiredBunny can differ |
|---|---|---|---|
| Large finance publishers | Bankrate, NerdWallet, Motley Fool, Morningstar, Britannica Money, Nasdaq | Authority, breadth, frequent updates | Interactive, plain-English, fewer ads; one concept per page with a widget and a quiz |
| Brokerage education | Schwab, moomoo, Questrade, Empower, capital.com, tastylive | Credibility on product mechanics | Broker-neutral; ties trading and long-term planning together |
| Government tools | Investor.gov (compound interest calculator), SSA, IRS | Highest trust; often the reference answer | Explain the *why* and link to these as sources rather than compete head-on |
| FIRE communities | ChooseFI (FI number calculator, Roth conversion ladder, HSA) | Community, depth on FIRE | FIRE taxes abroad, ACA subsidy cliff, sequence risk, all interactive |
| Trading education and tools | Option Alpha, TradingView, LuxAlgo, Tradezella, Trade Ideas, TradingSim, Bear Bull Traders | Strategy depth, charting | Free, structured curriculum from candles to risk to taxes; not selling signals |
| Simulators | Investopedia Simulator, HowTheMarketWorks, StockTrak | Full paper-trading accounts | Guided replay and wheel simulator tied to lessons |
| Single-purpose calculator sites | Many small sites, often on `pages.dev` or similar hosts | Speed of answer | Explanation, assumptions and a connected lesson. Calculator results looked crowded, so text quality is the differentiator |

## Topic clusters

Each cluster lists its intent mix, FiredBunny's existing pages, observed competitors, achievable long-tail angles,
gaps, and an estimated priority. **A** means best fit and most differentiated; start here once indexable.

### 1. Beginner stock market education. Priority: C (broad, crowded)

- **Intent:** informational and educational.
- **Pages:** `/courses/market-basics/`, `/lessons/what-a-stock-is/`, `/lessons/index-funds-and-etfs/`,
  `/lessons/risk-ladder/`, `/lessons/choosing-a-broker/`, `/investor-assessment/`.
- **Observed competitors:** Bankrate, Nasdaq, Motley Fool, GOBankingRates, capital.com, plus many low-quality content
  sites.
- **Achievable angles:**
  - Interactive explanations of mechanics ("what happens to my share when the company grows": the ownership lab).
  - The risk ladder comparing savings, bonds, index funds and single stocks.
  - "Which investor am I" (the self-assessment).
- **Gap:** broad head terms are dominated by large publishers. Win the long tail through the widgets and link up to
  the course hub.

### 2. Technical analysis and indicators. Priority: A for niche day-trading levels, B for general indicators

- **Intent:** educational and definitional.
- **Pages:** `/lessons/pdh-pdl-pmh-pml/`, `/lessons/13-48-and-200-ema/`, `/lessons/vwap/`, `/lessons/rsi/`,
  `/lessons/sma-vs-ema/`, `/lessons/candlesticks/`, `/lessons/2-min-vs-15-min/`, `/lessons/support-and-resistance/`,
  `/lessons/breakouts-and-fakeouts/`, `/lessons/volume/`, `/tradingview-indicator/`, plus trade notes
  `/notes/pmh-retest/`, `/notes/first-five/` and `/notes/premarket-routine/`.
- **Observed competitors:**
  - **PDH/PDL:** capital.com, TradingView scripts, LuxAlgo, forums.
  - **13/48/200 EMA:** Substack posts, a Scribd document, TradingView scripts. **[EST]** This looks like thin
    competition for an exact, community-specific setup.
  - **VWAP:** tastylive, Trade Ideas, TradingSim, many small blogs.
- **Achievable angles:**
  - "PDH PDL PMH PML explained" as one page with an interactive chart.
  - "why the 13, 48 and 200 EMA".
  - "2-minute vs 15-minute chart".
  - "level retest vs false breakout, wait for confirmation".
  - The free TradingView indicator as a linkable asset.
- **Gaps:**
  - A "VWAP vs moving average" comparison inside the VWAP lesson (not a new page).
  - Worked replay examples linking the notes to the lessons.

### 3. Options and the wheel strategy. Priority: A (strongest owned cluster)

- **Intent:** educational, calculator and practice.
- **Pages:** `/courses/options-and-the-wheel/`, `/lessons/wheel-strategy/`, `/lessons/how-the-wheel-is-taxed/`,
  `/lessons/run-the-wheel-in-an-ira/`, `/lessons/calls-and-puts/`, `/lessons/delta-and-gamma/`,
  `/lessons/theta-time-decay/`, `/lessons/iv-and-earnings/`, `/tools/wheel-income/`, `/tools/how-the-wheel-is-taxed/`,
  `/tools/option-profit/`, `/tools/expected-move/`, `/tools/wheel-simulator/`, `/notes/wheel-40/`.
- **Observed competitors:**
  - **Wheel strategy:** moomoo, Questrade, Barchart, SteadyOptions, MarketXLS, quantwheel, newsletters.
  - **Options tax:** Schwab, Bankrate, Option Alpha, OptionsTradingIQ.
- **Achievable angles:**
  - **Wheel strategy taxes**: assignment cost basis, covered call holding periods, wash sales. The observed results
    were mostly generic "how options are taxed" pages, and FiredBunny has both a lesson and a calculator. **[EST]**
    A good opening.
  - "wheel strategy in an IRA".
  - "wheel strategy example with real numbers" (the $40-stock note).
  - "wheel simulator".
- **Gaps:**
  - Give the lesson and the tool named "How the wheel is taxed" distinct titles and roles: the lesson explains, the
    calculator computes (T8).
  - Link the wheel lessons, tools, simulator and note as one cluster (T21).

### 4. Risk management and position sizing. Priority: A

- **Intent:** calculator and educational.
- **Pages:** `/lessons/1-percent-rule/`, `/lessons/position-sizing/`, `/lessons/win-rate-and-reward/`,
  `/lessons/losses-are-lopsided/`, `/tools/position-size/`, `/tools/win-rate-and-r-simulator/`,
  `/tools/drawdown-recovery/`.
- **Observed competitors:** Tradezella, Britannica Money, Liberated Stock Trader, daytrading.com, CrossTrade and many
  single-purpose calculator sites.
- **Achievable angles:**
  - "position size calculator with stop loss explained".
  - "win rate vs risk reward" (the simulator).
  - "how much you need to gain to recover a drawdown" (the drawdown table).
- **Gap:** each calculator needs its formula, assumptions and a worked example in text (T18). That is what separates
  it from bare calculators.

### 5. Trading simulators and interactive lessons. Priority: B

- **Intent:** practice and navigational.
- **Pages:** `/playground/` (trade replay), `/tools/wheel-simulator/`, all lessons (widgets).
- **Observed competitors:** Investopedia Simulator, HowTheMarketWorks, StockTrak, TradingSim, stock market game apps.
- **Achievable angles:** "practise reading a 2-minute chart" and "replay a trade candle by candle" (guided replay is
  not the same product as a paper-trading account), plus "options wheel simulator".
- **Gap:** the playground's text should state plainly what it is (a replay of simulated prices, not live trading).

### 6. Retirement planning. Priority: B

- **Intent:** decision, calculator and educational.
- **Pages:** `/lessons/social-security-when-to-claim/`, `/tools/social-security-age/`,
  `/lessons/retire-at-55-62-67-or-70/`, `/lessons/your-retirement-plan-on-one-page/`,
  `/lessons/turn-savings-into-a-paycheck/`, `/tools/retirement-planner/`, `/lessons/medicare-rmds-and-irmaa/`.
- **Observed competitors:** Clark.com, many tax-calculator sites, annuity sellers. SSA is the authoritative source.
- **Achievable angles:** "claim at 62 vs 67 vs 70 break-even explained" with the interactive tool, and "retirement
  plan on one page".
- **Gap:** cite SSA rules on the page and show the review date. These are YMYL decisions (T16).

### 7. 401(k), Roth IRA, HSA and employee benefits. Priority: A for the specific how-tos, C for the basics

- **Intent:** educational how-to and calculator.
- **Pages:** `/lessons/401k-match-is-free-money/`, `/lessons/max-your-401k-the-limits-most-people-miss/`,
  `/lessons/mega-backdoor-roth/`, `/lessons/backdoor-roth-ira-step-by-step/`, `/lessons/hsa-a-triple-tax-break/`,
  `/lessons/traditional-or-roth/`, `/lessons/rsus-taxes-at-vest-and-when-to-sell/`,
  `/lessons/espp-the-15-percent-discount/`, `/lessons/stock-options-isos-and-nsos/`, `/tools/401k-match/`,
  `/tools/401k-limit-stack/`, `/tools/roth-or-traditional/`, `/tools/backdoor-roth-check/`, `/tools/rsu-tax-gap/`,
  `/tools/espp-return/`.
- **Observed competitors:** Morningstar, NerdWallet, Schwab, Empower, ChooseFI, CPA firms. Several pages already
  target "2026" limits.
- **Achievable angles:**
  - "RSU tax gap at vest" (the withholding shortfall).
  - "ESPP return calculator".
  - "401(k) limit stack: employee, employer, after-tax".
  - "backdoor Roth pro-rata check".
- **Gap:** year-specific figures need a visible "checked" date and IRS sources. Keep URLs year-free and update the
  numbers in place.

### 8. Compound interest and money calculators. Priority: B (crowded; Investor.gov is the reference)

- **Intent:** calculator.
- **Pages:** `/tools/compound-interest/`, `/lessons/power-of-compound-interest/`, `/tools/what-habits-really-cost/`,
  `/lessons/small-habits-big-numbers/`, `/tools/debt-payoff-plan/`, `/tools/mortgage/`, `/tools/rent-or-buy/`.
- **Observed competitors:** Investor.gov's calculator dominated the observed results, followed by many small
  calculator sites.
- **Achievable angles:** "what a daily habit costs over 30 years", "compound interest explained with a slider",
  "rent vs buy with your own numbers".
- **Gap:** cite Investor.gov rather than compete with it on the generic term. Win with explanation and connected
  lessons.

### 9. Financial independence and FIRE. Priority: A for the niche topics, B for the FIRE number

- **Intent:** educational, calculator and decision.
- **Pages:**
  - Basics: `/tracks/fire/`, `/lessons/your-fire-number/`, `/tools/fire-number/`, `/tools/years-to-freedom/`,
    `/lessons/savings-rate-is-the-lever/`, `/lessons/coast-fire-and-barista-fire/`.
  - Withdrawals: `/lessons/4-percent-rule-and-its-limits/`, `/tools/safe-withdrawal-rate/`,
    `/lessons/sequence-of-returns-risk/`.
  - Taxes and early access: `/lessons/money-out-before-59-half/`, `/tools/early-access-planner/`,
    `/lessons/0-percent-capital-gains-bracket/`.
  - Health: `/lessons/health-insurance-before-65/`, `/tools/health-subsidy-cliff/`.
  - Abroad: `/lessons/tax-treaties-the-france-example/`, `/tools/france-and-us-tax-estimate/`,
    `/lessons/where-your-money-goes-furthest/`, `/tools/cost-of-living-by-place/`.
- **Observed competitors:** ChooseFI (dominant on FI number and Roth conversion ladder topics), many FIRE calculator
  sites.
- **Achievable angles:**
  - "ACA subsidy cliff for early retirees".
  - "0% capital gains bracket early retirement".
  - "access retirement money before 59½" (Rule of 55, 72(t), Roth ladder).
  - "US expat in France tax treaty".
  - "van life vs house cost".
- **Gap:** strong niche coverage already exists. Make the tools' assumptions explicit and date the tax figures.

### 10. AI-assisted trading and backtesting. Priority: B (emerging, fast-changing, high risk)

- **Intent:** educational and how-to.
- **Pages:** `/lessons/what-ai-can-and-cant-do/`, `/lessons/backtest-before-you-trust/`,
  `/lessons/build-a-tradingview-indicator-with-ai/`, `/lessons/automate-trades-with-robinhood-and-mcp/`,
  `/lessons/benefits-and-risks-of-trading-bots/`, `/lessons/ai-mistakes-to-avoid/`, `/tradingview-indicator/`.
- **Observed competitors:** Tradezella, LuxAlgo, TradingView ideas, QuantifiedStrategies, many "make money with
  ChatGPT" pages.
- **Achievable angles:**
  - "how to backtest a strategy with AI without overfitting".
  - "what AI gets wrong about backtesting".
  - "build a Pine Script indicator with AI".
  - "risks of trading bots".
- **Note:** many competing pages promise returns. FiredBunny's balanced, risk-first framing is the differentiator.
  Keep strong caveats and avoid any performance claims (T16).

### Taxes for traders (cross-cluster). Priority: A

- **Pages:** `/lessons/tax-loss-harvesting/`, `/lessons/wash-sale-rule/`,
  `/lessons/short-vs-long-term-gains/`, `/tools/tax-loss-harvest/`, `/notes/tax-loss-checklist/`,
  `/lessons/tax-loss-harvesting-with-fund-pairs/`.
- **Achievable angles:** "tax-loss harvesting fund pairs", "December tax-loss harvesting checklist" (seasonal;
  refresh it each year at the same URL).

## Brand and navigational

- **Brand query "FiredBunny":** current performance is unknown (no Search Console).
- Use one consistent one-sentence description on every surface (meta, manifest, About, Organization schema, social
  profiles). Link only real profiles in `sameAs`.
- `/about/` and the planned methodology page (T14) should answer "who is behind FiredBunny and how is it checked".

## Content gaps worth filling (no mass production)

1. **Calculator write-ups** (50 tools): formula, assumptions, worked example, limitations, linked lesson. These are
   genuinely useful additions, not keyword pages (T18).
2. **Course hub pages** (31): learning outcomes, who it is for, prerequisites, one-line lesson summaries (T19).
3. **Sources and dates** on the 57 lessons without sources (T16).
4. **Glossary**, server-rendered with stable anchors. Expand only the top terms that need more than one sentence (T20).
5. **Comparison sections inside existing lessons** where searchers compare (VWAP vs EMA, Roth vs traditional, claim at
   62 vs 70), not new thin pages.
6. **Seasonal refreshes** at stable URLs: December tax-loss checklist, new-year contribution limits, open enrollment.

## What not to do

- Don't create pages per keyword variant, per city or per year. Google flags content made "primarily to attract visits
  from search engines" and mass-produced content as unhelpful.
- Don't add FAQ blocks for rich results (retired in Google), keyword-stuffed titles, or hidden text.
- Don't publish AI-generated articles without expert review. Don't invent authors, credentials, testimonials, reviews,
  ratings, backlinks or performance results.
- Don't put years in evergreen URLs. Update figures in place and show the review date.

## Search results consulted (2026-11-12, research tool; not Google rankings)

- Wheel strategy: [moomoo](https://www.moomoo.com/us/learn/options-wheel-strategy), [Questrade](https://www.questrade.com/learning/options-active-trading/wheel-strategy-options), [quantwheel](https://quantwheel.com/learn/wheel-strategy-explained), [SteadyOptions](https://steadyoptions.com/articles/the-wheel-trade-r632), [Barchart](https://www.barchart.com/story/news/1246952/what-is-the-options-wheel-strategy-and-how-are-traders-making-passive-income-using-it)
- Options tax: [Schwab](https://www.schwab.com/learn/story/how-are-options-taxed), [Bankrate](https://www.bankrate.com/investing/how-are-options-taxed), [Option Alpha](https://optionalpha.com/blog/taxes-on-options-trading), [quantwheel](https://quantwheel.com/learn/how-are-options-taxed)
- Position sizing: [Tradezella](https://www.tradezella.com/tools/position-size-calculator), [Britannica Money](https://www.britannica.com/money/calculating-position-size), [Liberated Stock Trader](https://www.liberatedstocktrader.com/position-size-calculator/)
- 1% rule and drawdowns: [daytrading.com](https://www.daytrading.com/one-percent-rule), [CrossTrade](https://crosstrade.io/learn/risk-management/one-percent-rule)
- VWAP: [tastylive](https://www.tastylive.com/news-insights/vwap-what-is-it-and-how-to-trade-it), [Trade Ideas](https://www.trade-ideas.com/learning-center/technical-indicators/vwap-explained/), [TradingSim](https://tradingsim.com/blog/vwap-boulevard/)
- PDH/PDL: [capital.com](https://capital.com/day-traders-toolbox-previous-days-high-and-low-pdh-pdl), [LuxAlgo](https://www.luxalgo.com/library/indicator/dmOXGLnF-pdh-pdl-indicator-previous-days-high-low-with-alerts/)
- EMA 13/48/200: [Option Alpha](https://optionalpha.com/learn/exponential-moving-average), [Investing.com Academy](https://www.investing.com/academy/analysis/beginners-guide-to-using-exponential-moving-averages), [NexusFi](https://nexusfi.com/a/indicators/exponential-moving-average-ema)
- Simulators: [HowTheMarketWorks](https://www.howthemarketworks.com/), [StockTrak](https://www.stocktrak.com/stocktrak-product/), [TradingSim](https://tradingsim.com/features)
- Beginner stocks: [Nasdaq](https://www.nasdaq.com/articles/what-are-stocks-and-how-do-they-work), [Bankrate](https://www.bankrate.com/investing/stock-market-basics-for-beginners), [capital.com](https://capital.com/stock-market-for-beginners)
- Compound interest: [Investor.gov](https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator)
- Mega backdoor Roth: [Morningstar](https://www.morningstar.com/retirement/how-mega-backdoor-roth-works), [NerdWallet](https://www.nerdwallet.com/retirement/learn/mega-backdoor-roths-work), [Schwab](https://www.schwab.com/learn/story/mega-backdoor-roth)
- Social Security claiming: [Clark.com](https://clark.com/social-security-breakeven-calculator/), [ustax.tools](https://ustax.tools/social-security-62-vs-67-vs-70/)
- FIRE: [ChooseFI FI number](https://choosefi.com/fi-number-calculator), [ChooseFI mega backdoor Roth](https://choosefi.com/tax-strategies/mega-backdoor-roth)
- AI backtesting: [Tradezella](https://www.tradezella.com/blog/chatgpt-claude-backtesting), [LuxAlgo](https://luxalgo.com/blog/optimize-trading-strategies-with-ai/)
