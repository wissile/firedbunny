/* FiredBunny: "How this calculator works" for the main calculators, shown under each tool on its page (pages.js toolPage).
 *
 * Every formula and assumption here describes what the widget's code actually does (mod-risk.js sizeCalc, riskSim and
 * drawdownCalc; mod-options.js optionCalc and wheelCalc; mod-w-invest.js compoundPlus; mod-f-number.js fireNumber and
 * savingsRate; mod-f-swr.js swrSim; mod-charts.js expectedMove). If you change a widget's math, change its guide here in
 * the same commit. Worked examples use the widget's default inputs and were recomputed with the widget's own formulas.
 *
 * Fields: meta (search description, at most ~165 characters), what, formula[], assume[], example[] (steps), limits[],
 * sources[{t, u}] (primary sources where they exist; pure arithmetic has none), checked (month the guide was verified).
 * Text may contain simple HTML; links between pages use href="#token" like the rest of the site. Not narrated.
 */
(function () {
  const SML = window.SML;
  const SRC = {
    stop: { t: 'Investor.gov (SEC): Stop order', u: 'https://www.investor.gov/introduction-investing/investing-basics/glossary/stop-order' },
    finraIntraday: { t: 'FINRA: Frequent intraday trading, understanding the basics (June 2026)', u: 'https://www.finra.org/investors/insights/frequent-intraday-trading' },
    optBulletin: { t: 'Investor.gov (SEC): An introduction to options, investor bulletin (updated July 2026)', u: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-63' },
    odd: { t: 'OCC: Characteristics and Risks of Standardized Options (the options disclosure document)', u: 'https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document' },
    bs: { t: 'Black and Scholes (1973): The Pricing of Options and Corporate Liabilities, Journal of Political Economy 81(3)', u: 'https://econpapers.repec.org/RePEc:ucp:jpolec:v:81:y:1973:i:3:p:637-54' },
    oicPut: { t: 'Options Industry Council: Cash-secured put', u: 'https://www.optionseducation.org/strategies/all-strategies/cash-secured-put' },
    oicCall: { t: 'Options Industry Council: Covered call (buy/write)', u: 'https://www.optionseducation.org/strategies/all-strategies/covered-call-buy-write' },
    secCompound: { t: 'Investor.gov (SEC): Compound interest calculator, to cross-check a result', u: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
    cpi: { t: 'BLS via DOL: Consumer Price Index, September 2026', u: 'https://www.dol.gov/newsroom/economicdata/cpi_10142026.pdf' },
    ssa: { t: 'SSA: benefit reduction for early retirement', u: 'https://www.ssa.gov/benefits/retirement/planner/agereduction.html' },
    bengen: { t: 'Advisor Perspectives: Bill Bengen boosts the 4% rule to 4.7% (Aug 2025)', u: 'https://www.advisorperspectives.com/articles/2025/08/29/bill-bengen-boosts-the-4-rule-to-4-7' },
    ern1: { t: 'Early Retirement Now: the ultimate guide to safe withdrawal rates, part 1', u: 'https://earlyretirementnow.com/2016/12/07/the-ultimate-guide-to-safe-withdrawal-rates-part-1-intro/' },
    ern60: { t: 'Early Retirement Now: does a 4% withdrawal rate survive a 60-year retirement?', u: 'https://earlyretirementnow.com/2019/06/26/does-a-4-percent-withdrawal-rate-survive-a-60-year-retirement/' },
    mstar: { t: 'Morningstar: what is a safe retirement withdrawal rate for 2026?', u: 'https://www.morningstar.com/retirement/whats-safe-retirement-withdrawal-rate-2026' },
    cmeVol: { t: 'CME Group: Discover options volatility (annualized volatility and the square root of time)', u: 'https://www.cmegroup.com/education/courses/introduction-to-options/discover-options-volatility' },
    oic16: { t: 'Options Industry Council: Understanding the “rule of 16” in plain terms (July 2025)', u: 'https://www.optionseducation.org/news/understanding-the-rule-of-16-in-plain-terms' },
    mmm: { t: 'Mr. Money Mustache: the shockingly simple math behind early retirement (2012)', u: 'https://www.mrmoneymustache.com/2012/01/13/the-shockingly-simple-math-behind-early-retirement/' },
  };
  const C = 'November 2026';

  SML.toolGuides = {
    'tool-size': {
      meta: 'Position size calculator: shares = (account × risk %) ÷ (entry − stop). Size a trade so a stop-out costs only what you chose to risk. Free, with a chart.',
      what: 'How many shares to buy (or short) so that, if your stop is hit, you lose only the amount you decided to risk. You pick the stop first; the share count follows from it.',
      formula: [
        'Risk budget = account × risk %',
        'Risk per share = the distance between entry and stop',
        'Shares = risk budget ÷ risk per share, rounded down to a whole share',
        'Position = shares × entry. Target = entry plus (or minus, for a short) target R × risk per share',
      ],
      assume: [
        'A stop below the entry is a long trade; a stop above it is a short trade.',
        'The stop fills exactly at the stop price.',
        'No commissions, fees or slippage.',
        'Shares are rounded down, so the planned loss is at or just under your budget.',
      ],
      example: [
        'A $25,000 account risking 1% has a $250 budget.',
        'Entry $50.00, stop $48.50: $1.50 of risk per share.',
        '$250 ÷ $1.50 = 166.7, so 166 shares: an $8,300 position, 33% of the account.',
        'If the stop fills, the loss is 166 × $1.50 = $249. The 2R target is $53.00. The calculator flags the position as concentrated because it is more than a quarter of the account.',
      ],
      limits: [
        'A stop order turns into a market order when the stop price is reached, so in a fast market or an overnight gap you can be filled well past your stop and lose more than planned.',
        'It does not check your buying power or margin. It warns when the position is more than 25% of the account or more than the whole account.',
        'Risking about 1% per trade is a common rule of thumb among traders, not a rule from any regulator. See <a href="#l-one-percent">the 1% rule</a>.',
      ],
      sources: [SRC.stop, SRC.finraIntraday],
      checked: C,
    },
    'tool-options': {
      meta: 'Option profit calculator: breakeven, max profit and loss, and Greeks for buying or selling a call or put, using the Black-Scholes model. Free and visual.',
      what: 'Profit or loss at expiration for buying or selling a call or put, the breakeven price, the most you can make and lose, and the Greeks for the whole position.',
      formula: [
        'One contract covers 100 shares: cost or credit = premium × 100 × contracts',
        'Breakeven at expiration = strike + premium for a call, strike − premium for a put',
        'Buying: the most you can lose is the premium paid. A call’s profit has no cap; a put’s is at most (strike − premium) × 100 if the stock goes to zero',
        'Selling: the most you can make is the premium. A short call’s loss has no cap; a short put’s is at most (strike − premium) × 100',
        'The default premium, the dashed “today” line, delta, theta, vega and the chance of finishing in the money come from the Black-Scholes model with a 4% interest rate. Chance in the money is the model’s N(d2)',
      ],
      assume: [
        'Black-Scholes assumes exercise only at expiration, no dividends, a constant interest rate and volatility, and prices that move randomly with a lognormal distribution.',
        'Implied volatility is your input. Real quotes use a different IV at each strike and expiration.',
        'Type your broker’s quote in Premium to replace the model price.',
        'Greeks are for the whole position. Theta is per calendar day and vega is per 1 point of IV. No commissions.',
      ],
      example: [
        'Defaults: stock $100, buy one $105 call with 30 days left at 35% IV.',
        'The model prices the call at about $2.18, so it costs about $218.',
        'Breakeven at expiration is $105 + $2.18 = $107.18. The most you can lose is the $218.',
        'The model gives roughly a 31% chance of finishing above $105. Delta is about 34 shares and time decay costs about $6.50 a day.',
      ],
      limits: [
        'Chance in the money is a model figure, not a forecast of what the stock will do.',
        'US stock options can usually be exercised any day before expiration, so sellers can be assigned early, especially on a short call just before an ex-dividend date.',
        'Option sellers can lose far more than the premium they collect. Read the options disclosure document before you trade.',
      ],
      sources: [SRC.optBulletin, SRC.odd, SRC.bs],
      checked: C,
    },
    'tool-wheel': {
      meta: 'Wheel income calculator: premium, return on capital, annualized yield and breakeven for a cash-secured put or covered call, with the formulas shown.',
      what: 'The premium you collect, the return on the money the trade ties up, a simple annualized rate and the breakeven for one cash-secured put or covered call, the two halves of the wheel.',
      formula: [
        'Premium collected = premium × 100 × contracts',
        'Cash-secured put: money set aside = strike × 100 × contracts; return = premium ÷ strike; breakeven = strike − premium',
        'Covered call: capital = stock price × 100 × contracts; return = premium ÷ stock price; breakeven = your cost − premium; if called away, gain = (strike − your cost + premium) × 100 × contracts',
        'Annualized = return × 365 ÷ days to expiry (simple, not compounded)',
      ],
      assume: [
        'Annualized assumes you could repeat the same trade back to back all year at the same return, which rarely happens.',
        'No commissions or taxes.',
        'When you switch between put and call it fills in a strike about 5% out of the money and a model premium (Black-Scholes, 40% IV, 4% rate). Type your broker’s quote to replace it.',
      ],
      example: [
        'Defaults: sell one $38 put on a $40 stock for $0.95 with 30 days left.',
        'You collect $95 and set aside $3,800.',
        'Return = $0.95 ÷ $38 = 2.50%. Annualized: 2.50% × 365 ÷ 30 ≈ 30.4%, only if every month went the same way.',
        'Breakeven is $37.05. If assigned, you own 100 shares at an effective $37.05.',
      ],
      limits: [
        'The annualized figure is not an expected return. One big drop after assignment can wipe out many months of premium.',
        'A put seller must buy at the strike however far the stock has fallen, and a covered call caps your gain at the strike.',
        'Assignment can come before expiration. Taxes on premiums and assignments have their own rules: see the <a href="#tool-wheeltax">wheel tax walkthrough</a>.',
      ],
      sources: [SRC.oicPut, SRC.oicCall, SRC.odd],
      checked: C,
    },
    'tool-compound': {
      meta: 'Compound interest calculator: see what a starting sum plus monthly saving grows into by retirement, how much is growth, and what waiting 10 years costs.',
      what: 'What a starting amount plus a monthly saving grows into by your retirement age at a steady return, how much of that is growth, and what starting 10 years later would cost you.',
      formula: [
        'Each month: balance = balance × (1 + yearly return ÷ 12) + monthly saving',
        'You put in = starting money + monthly saving × 12 × years',
        'Growth = ending balance − what you put in',
        'Cost of waiting = ending balance − the balance if the same plan started 10 years later',
        'Doubles every ≈ 72 ÷ yearly return (the rule of 72)',
        'Today’s dollars: each year’s balance ÷ 1.03<sup>years</sup>',
      ],
      assume: [
        'The same return every year, with monthly compounding.',
        'Saving is added at the end of each month and never changes.',
        'No fees or taxes. “Today’s dollars” assumes 3% inflation a year.',
      ],
      example: [
        'The New grad preset: age 22, $1,000 to start, $300 a month, 7% a year, retiring at 65.',
        'At 65 the balance is about $1,003,000. Only $155,800 of it was saved; about $847,000 is growth.',
        'Starting the same plan at 32 ends near $473,000, so waiting ten years costs about $530,000.',
        'At 7% money doubles roughly every 10.3 years.',
      ],
      limits: [
        'Real returns jump around from year to year, and no return is promised. A crash just before you retire hurts most (see <a href="#l-sequence">sequence risk</a>).',
        'Fees and taxes come off the top and compound against you.',
        'Inflation is a fixed 3% here; recent inflation has run higher and lower than that.',
      ],
      sources: [SRC.secCompound, SRC.cpi],
      checked: C,
    },
    'tool-fire': {
      meta: 'FIRE number calculator: (spending − other income) ÷ withdrawal rate, plus a Social Security bridge, counting only money you can spend. Free and visual.',
      what: 'The invested money you need so that withdrawals, plus any other income, cover your yearly spending for good, how much of it you already have, and roughly when you get there.',
      formula: [
        'Spending = living costs + health insurance + taxes',
        'FIRE number = (spending − other income − Social Security) ÷ withdrawal rate + Social Security bridge',
        'Bridge = yearly Social Security × the years between your retirement age and the age benefits start',
        'You have = taxable + pre-tax (at 85% while that option is on) + Roth + HSA, plus cash and home equity only if you choose to count them, minus debts',
        'Years: each year the balance grows by the return and your yearly saving is added, until it reaches the FIRE number',
      ],
      assume: [
        'All amounts are in today’s dollars and the return is after inflation.',
        'Other income is after tax. Social Security counts only up to your spending.',
        'The bridge money just keeps pace with inflation.',
      ],
      example: [
        'The Couple preset spends $82,000 a year. At 4% that is $2.05 million before Social Security.',
        'With $28,000 a year of Social Security from 67, the long-run number drops to $1.35 million, plus a bridge for the years before 67.',
        'They have $395,500 that counts and save $45,000 a year at 5%: about 14.7 years, retiring near 53 with a bridge of about $400,000, for a target of about $1.75 million.',
      ],
      limits: [
        'A withdrawal rate is a rule of thumb from history and simulations, not a guarantee. For 40 to 60 year retirements, research points to about 3.25% to 3.5%; see <a href="#l-swr">the 4% rule and its limits</a>.',
        'Your SSA statement assumes you keep working until you claim. Stopping early lowers the benefit.',
        'Health insurance before 65 and taxes depend on your income and on laws that change.',
      ],
      sources: [SRC.ern1, SRC.bengen, SRC.mstar, SRC.ssa],
      checked: C,
    },
    'tool-swr': {
      meta: 'Safe withdrawal rate calculator: the share of 1,000 simulated retirements that lasted, by withdrawal rate, years, stock share and fees. Assumptions shown.',
      what: 'The share of 1,000 simulated retirements in which the money lasted the whole time, when you withdraw a set percentage in year one and raise that amount with inflation every year.',
      formula: [
        'Year one withdrawal = starting portfolio × withdrawal rate; later years take the same amount in today’s dollars',
        'Each year: withdraw at the start, then grow what is left by that year’s return after inflation, minus fees',
        'Portfolio return = stock share × stock return + bond share × bond return, rebalanced every year',
        'Success = the share of the 1,000 paths that never ran out',
      ],
      assume: [
        'Returns are after inflation and drawn at random each year: stocks average about 7% with swings of about 16%, bonds about 2% with swings of about 6%, and the two are only slightly related.',
        'Each year is independent: no streaks, recoveries or valuation effects.',
        'No taxes. Fees are your input.',
      ],
      example: [
        'With $1,000,000 at 4%, you withdraw $40,000 in year one.',
        'If prices rise 3% that year, you withdraw $41,200 in year two, whatever the market did.',
        'The chart counts how many of the 1,000 futures still had money left at the end of the period you picked.',
      ],
      limits: [
        'A simulation, not history. Real markets have streaks and recoveries that this simple model leaves out, and the result shifts slightly each time you roll new futures.',
        'Success only means money was left. It says nothing about how much.',
        'Being willing to cut spending in bad years supports a higher starting rate; see <a href="#l-guardrails">guardrails</a>.',
      ],
      sources: [SRC.bengen, SRC.ern1, SRC.ern60, SRC.mstar],
      checked: C,
    },
    'tool-expected': {
      meta: 'Expected move calculator: price × IV × √(days ÷ 365) gives the range options are pricing in, with 68% and 95% ranges. A rough guide, not a promise.',
      what: 'The price range that an option’s implied volatility points to over a number of days: about one standard deviation either side of today’s price.',
      formula: [
        'Expected move = price × IV × √(days ÷ 365)',
        '68% range = price ± one expected move',
        '95% range = price ± two expected moves',
      ],
      assume: [
        'IV is read as a yearly standard deviation and scaled by the square root of calendar days.',
        'Moves are equally likely up or down. The sample paths on the chart are simulated.',
      ],
      example: [
        'A $100 stock with 30% IV, 30 days out.',
        'Expected move = 100 × 0.30 × √(30 ÷ 365) ≈ $8.60.',
        'The 68% range is about $91.40 to $108.60; the 95% range about $82.80 to $117.20.',
      ],
      limits: [
        'Real prices have fatter tails than a bell curve: big moves happen more often than the 95% range suggests, especially around earnings.',
        'IV changes every day and differs by strike and expiration.',
        'Some traders scale by 252 trading days instead of 365 calendar days; the answers are close but not the same.',
      ],
      sources: [SRC.cmeVol, SRC.oic16],
      checked: C,
    },
    'tool-drawdown': {
      meta: 'Drawdown recovery calculator: gain needed = loss ÷ (1 − loss). See why a 50% loss needs a 100% gain, and how long recovery takes at 10% a year.',
      what: 'The gain you need to get back to even after a loss, and how many years that takes at 10% a year.',
      formula: [
        'Gain needed = loss ÷ (1 − loss)',
        'Years at 10% a year = ln(1 ÷ (1 − loss)) ÷ ln(1.10)',
      ],
      assume: [
        'A $10,000 account, so the dollar figures are easy to scale.',
        'The 10% a year is a fixed illustration.',
      ],
      example: [
        '$10,000 falls 30% to $7,000.',
        'Gain needed = 0.30 ÷ 0.70 ≈ 42.9%, which turns $7,000 back into $10,000.',
        'At a steady 10% a year that takes about 3.7 years.',
      ],
      limits: [
        '10% a year is not an expected return; real recoveries are faster or much slower.',
        'This is pure arithmetic, so it needs no outside source: check it with any calculator.',
      ],
      sources: [],
      checked: C,
    },
    'tool-risk': {
      meta: 'Trading expectancy simulator: edge per trade = win rate × reward:risk − loss rate. Run 20 futures to see drawdowns and losing streaks for your numbers.',
      what: 'Whether a win rate and a reward-to-risk ratio make money on average, and how bumpy the ride can be, across 20 simulated sequences of the same trades.',
      formula: [
        'Edge per trade (in R) = win rate × reward:risk − (1 − win rate)',
        'Breakeven win rate = 1 ÷ (1 + reward:risk)',
        'Each trade: a win grows the account by risk % × reward:risk; a loss shrinks it by risk %',
        'Worst drawdown = the biggest fall from a high in any of the 20 futures',
      ],
      assume: [
        'Every win hits the target exactly and every loss is exactly 1R.',
        'Trades are independent, and risk is a fixed percentage of the current balance.',
        'A $10,000 start and no costs.',
      ],
      example: [
        '45% winners at 2 : 1 reward to risk, risking 1% a trade.',
        'Edge = 0.45 × 2 − 0.55 = +0.35R per trade.',
        'The breakeven win rate at 2 : 1 is 1 ÷ 3, about 33%, so this sits about 12 points above it.',
      ],
      limits: [
        'Twenty futures is a small sample: press Run again to see different luck.',
        'Real wins and losses vary in size, and you only know a strategy’s real win rate after many trades.',
        'This is arithmetic and simulation, so it needs no outside source.',
      ],
      sources: [],
      checked: C,
    },
    'tool-years': {
      meta: 'Savings rate calculator: years to financial independence from your savings rate, return after inflation and withdrawal rate. The formula is shown.',
      what: 'How many years of saving it takes to reach financial independence, from your savings rate, the return after inflation and your withdrawal rate. Your pay level hardly matters; the rate does.',
      formula: [
        'Spending = take-home pay × (1 − savings rate)',
        'FIRE number = spending ÷ withdrawal rate',
        'Years = ln((T + s ÷ r) ÷ (N + s ÷ r)) ÷ ln(1 + r), where s is the savings rate, r the return, T the FIRE number and N what you have saved, both measured in years of take-home pay',
      ],
      assume: [
        'You spend the same in retirement as you do now.',
        'You save at the end of each year and earn a steady return after inflation.',
      ],
      example: [
        'Take-home pay $80,000, saving 30%, 5% after inflation, 4% withdrawal rate, nothing saved yet.',
        'Spending is $56,000, so the FIRE number is $1.4 million.',
        'Years = ln((17.5 + 6) ÷ 6) ÷ ln(1.05) ≈ 28 years.',
      ],
      limits: [
        'Real returns vary, so treat the years as a guide.',
        'Spending often changes in retirement: health insurance before 65 and taxes can add to it.',
      ],
      sources: [SRC.mmm],
      checked: C,
    },
  };
})();
