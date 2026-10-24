/* Investor calendar: SML.calendarEvents, the #calendar page, the keyDates widget and lesson l-key-dates. Fork C1. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, esc = SML.esc;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------------- categories ---------------- */
  const CATS = [
    { k: 'fed', label: 'Fed & rates', short: 'Fed' },
    { k: 'data', label: 'Economic data', short: 'Data' },
    { k: 'markets', label: 'Markets & options', short: 'Markets' },
    { k: 'earnings', label: 'Earnings', short: 'Earnings' },
    { k: 'tax', label: 'Taxes', short: 'Tax' },
    { k: 'benefits', label: 'Benefits & retirement', short: 'Benefits' },
    { k: 'energy', label: 'Oil & energy', short: 'Energy' },
    { k: 'crypto', label: 'Crypto', short: 'Crypto' },
  ];
  const CAT = Object.fromEntries(CATS.map((c) => [c.k, c]));
  const CC = { fed: 'var(--accent)', data: 'var(--info)', markets: 'var(--violet)', earnings: 'var(--up)', tax: 'var(--down)', benefits: 'color-mix(in srgb,var(--up) 45%,var(--info))', energy: 'color-mix(in srgb,var(--accent) 50%,var(--down))', crypto: 'color-mix(in srgb,var(--violet) 55%,var(--down))' };

  SML.css(`
.xc [hidden]{display:none!important}
${CATS.map((c) => `.xc [data-cat="${c.k}"],.xcl [data-cat="${c.k}"]{--cc:${CC[c.k]}}`).join('\n')}
.xc-f-fed{fill:var(--accent)}.xc-f-data{fill:var(--info)}.xc-f-markets{fill:var(--violet)}.xc-f-earnings{fill:var(--up)}.xc-f-tax{fill:var(--down)}
.xc-f-benefits{fill:${CC.benefits}}.xc-f-energy{fill:${CC.energy}}.xc-f-crypto{fill:${CC.crypto}}
.xc-s-fed{stroke:var(--accent)}.xc-s-data{stroke:var(--info)}.xc-s-markets{stroke:var(--violet)}.xc-s-earnings{stroke:var(--up)}.xc-s-tax{stroke:var(--down)}
.xc-s-benefits{stroke:${CC.benefits}}.xc-s-energy{stroke:${CC.energy}}.xc-s-crypto{stroke:${CC.crypto}}
.xc-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--cc,var(--muted));flex:0 0 8px}
.xc-tools{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center;justify-content:space-between;padding-block:20px;border-bottom:1px solid var(--line)}
.xc-tools .chips .chip .sw{border-radius:50%}
.xc-nav{display:flex;align-items:center;gap:6px}
.xc-nav button{min-height:36px;min-width:36px;border:1px solid var(--line);border-radius:var(--r);background:var(--bg);color:var(--ink);cursor:pointer;font:600 13px var(--sans);padding:0 10px}
.xc-nav button:hover{border-color:var(--input);background:var(--surface-2)}
.xc-mlabel{font-family:var(--display);font-size:34px;line-height:1;color:var(--ink);text-transform:uppercase;min-width:7.2ch;text-align:center}
.xc-main{display:grid;gap:24px;grid-template-columns:1fr;padding-block:24px 64px;align-items:start}
@media (min-width:1100px){.xc-main{grid-template-columns:minmax(0,1fr) 360px}}
.xc-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.xc-wd{background:var(--surface);padding:8px 8px;font:600 10px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.xc-cell{background:var(--bg);min-height:118px;padding:6px 6px 8px;display:flex;flex-direction:column;gap:4px;cursor:pointer;text-align:left;border:0;color:inherit;font:inherit;min-width:0;position:relative}
.xc-cell:hover{background:var(--surface)}
.xc-cell.out{background:color-mix(in srgb,var(--bg) 60%,var(--surface));opacity:.55}
.xc-cell.sel{box-shadow:inset 0 0 0 2px var(--accent);background:var(--surface)}
.xc-cell .dn{font:600 12px var(--mono);color:var(--muted);display:flex;align-items:center;gap:6px}
.xc-cell.today .dn b{background:var(--accent);color:var(--on-acc);border-radius:999px;padding:2px 7px}
.xc-cell .dn b{font-weight:600}
.xc-cell .hol{font:600 9.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.xc-ev{display:flex;align-items:center;gap:5px;font-size:11.5px;line-height:1.25;color:var(--ink);background:color-mix(in srgb,var(--cc) 14%,transparent);border-left:3px solid var(--cc);border-radius:3px;padding:2px 5px;min-width:0}
.xc-ev span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.xc-ev.rule{border-left-style:dashed}
.xc-more{font:600 10.5px var(--mono);color:var(--muted)}
.xc-dots{display:none;flex-wrap:wrap;gap:3px}
@media (max-width:719px){.xc-cell{min-height:56px;padding:4px}.xc-ev,.xc-more,.xc-cell .hol{display:none}.xc-dots{display:flex}.xc-wd{padding:6px 2px;text-align:center;letter-spacing:.04em}.xc-mlabel{font-size:26px}}
.xc-side{display:flex;flex-direction:column;gap:16px;min-width:0}
@media (min-width:1100px){.xc-side{position:sticky;top:84px}}
@media (max-width:1099px){.xc-side{display:contents}#xc-body{order:2}.xc-p-next{order:1}#xc-detail{order:3}}
.xc-panel{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);min-width:0}
.xc-panel h3{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line);font:600 11px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--ink)}
.xc-list{list-style:none}
.xc-list li + li{border-top:1px solid var(--line)}
.xc-row{display:grid;grid-template-columns:52px minmax(0,1fr);gap:12px;padding:10px 16px;width:100%;text-align:left;background:none;border:0;color:inherit;font:inherit;cursor:pointer;align-items:start}
.xc-row:hover,.xc-row.on{background:var(--surface-2)}
.xc-row .d{display:flex;flex-direction:column;align-items:flex-start;gap:2px;font:600 10px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.xc-row .d b{font-family:var(--display);font-weight:400;font-size:26px;line-height:.9;color:var(--ink);letter-spacing:0}
.xc-row .t{display:flex;flex-direction:column;gap:3px;min-width:0}
.xc-row .t b{font-weight:600;color:var(--ink);font-size:14.5px;line-height:1.3;display:flex;gap:7px;align-items:baseline}
.xc-row .t b .xc-dot{transform:translateY(-1px)}
.xc-row .t small{font-size:12.5px;color:var(--muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.xc-row.on .t small{-webkit-line-clamp:unset;display:block}
.xc-st{font:600 9.5px var(--mono);letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--line);border-radius:999px;padding:2px 7px;color:var(--muted);white-space:nowrap}
.xc-st.confirmed{color:var(--up);border-color:color-mix(in srgb,var(--up) 40%,transparent)}
.xc-st.rule{color:var(--info);border-color:color-mix(in srgb,var(--info) 40%,transparent)}
.xc-st.estimate{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)}
.xc-det{padding:16px;display:flex;flex-direction:column;gap:12px}
.xc-det .when{font:600 11px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.xc-det h4{font-family:var(--display);font-weight:400;font-size:30px;line-height:.95;text-transform:uppercase;color:var(--ink)}
.xc-det .pills{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.xc-det .catp{display:inline-flex;align-items:center;gap:6px;font:600 10px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:3px 9px}
.xc-det dl{display:flex;flex-direction:column;gap:10px}
.xc-det dt{font:600 10px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.xc-det dd{font-size:14px;line-height:1.55;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.xc-det .lnk{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:13.5px}
.xc-det .lnk a{color:var(--text)}
.xc-agenda{display:flex;flex-direction:column;gap:22px}
.xc-agenda h3.mh{font-family:var(--display);font-weight:400;font-size:30px;line-height:1;text-transform:uppercase;color:var(--ink);padding-bottom:8px;border-bottom:2px solid color-mix(in srgb,var(--ink) 90%,transparent)}
.xc-agenda .xc-list{background:var(--surface);border:1px solid var(--line);border-top:0;border-radius:0 0 var(--r) var(--r)}
.xc-agenda .xc-row{grid-template-columns:58px minmax(0,1fr) auto}
.xc-inl{border-top:1px dashed var(--line);background:var(--surface-2)}
.xc-empty{padding:16px;color:var(--muted);font-size:14px}
.xc-wk{display:flex;align-items:center;gap:10px;font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);cursor:pointer}
.xc-wk input{accent-color:var(--accent)}
.xc-rules{display:flex;flex-wrap:wrap;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.xc-rules > div{background:var(--surface);padding:18px;display:flex;flex-direction:column;gap:6px;flex:1 1 260px}
.xc-rules b{font-weight:600;color:var(--ink);display:flex;gap:8px;align-items:center}
.xc-rules p{font-size:13.5px;line-height:1.55;color:var(--muted)}
.xc-cov{font-size:13px;color:var(--muted);line-height:1.55}
.xc-hdr-stats{display:flex;gap:20px;flex-wrap:wrap}
.xc-hdr-stats div{display:flex;flex-direction:column;gap:4px}
.xc-hdr-stats b{font-family:var(--display);font-weight:400;font-size:44px;line-height:.85;color:var(--accent)}
.xc-hdr-stats span{font:500 10.5px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.xcl-month{display:flex;flex-wrap:wrap;gap:6px}
.xcl-leg{display:flex;flex-wrap:wrap;gap:6px 14px;font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.08em;padding:0 16px 12px}
.xcl-leg span{display:inline-flex;align-items:center;gap:6px}
.xcl-list{list-style:none;padding:4px 16px 14px;display:flex;flex-direction:column;gap:6px}
.xcl-list li{display:grid;grid-template-columns:62px minmax(0,1fr);gap:10px;font-size:13.5px;line-height:1.4;align-items:baseline}
.xcl-list li .d{font:600 11px var(--mono);color:var(--muted)}
.xcl-list li .d b{color:var(--ink)}
.xcl-list a{color:var(--text)}
`);

  /* ---------------- what each kind of event is ---------------- */
  /* K(cat, default title, what, why, react, lesson) */
  const K = (cat, title, what, why, react, lesson) => ({ cat, title, what, why, react, lesson });
  const KINDS = {
    fomc: K('fed', 'FOMC rate decision', 'The Federal Open Market Committee ends a two-day meeting and announces its interest-rate decision in a statement at 2:00 pm ET. The chair holds a press conference at 2:30 pm ET.', 'The fed funds rate sets the cost of short-term money. Mortgage, card and loan rates, bond yields and stock valuations all key off it, and the statement and press conference hint at the next moves.', 'Stocks, bonds and the dollar often swing in both directions between 2:00 and 3:30 pm as traders read the statement, then the press conference. The surprise versus expectations matters more than the decision itself.', 'l-fed'),
    fomcsep: K('fed', 'FOMC decision + dot plot', 'A two-day Fed meeting that also releases the Summary of Economic Projections: each official’s forecast for growth, unemployment, inflation and the rate path (the dot plot). Statement at 2:00 pm ET, press conference at 2:30 pm ET.', 'The dot plot shows where officials expect rates to go over the next few years. A shift in the dots can move markets more than the decision.', 'Expect bigger swings than at a normal meeting, especially in 2-year Treasury yields and rate-sensitive stocks such as small caps, banks and homebuilders.', 'l-fed'),
    minutes: K('fed', 'FOMC minutes', 'A detailed summary of the discussion at the last Fed meeting, released three weeks after it at 2:00 pm ET.', 'Shows how many officials leaned toward cutting or hiking, and what worried them.', 'Usually a smaller reaction than the meeting itself, unless the minutes reveal a clear tilt the statement hid.', 'l-fed'),
    beige: K('fed', 'Beige Book', 'The Fed’s report on business conditions gathered from contacts in its 12 districts, published eight times a year at 2:00 pm ET.', 'A plain-words snapshot of hiring, prices and demand around the country, two weeks before each Fed meeting.', 'Rarely moves markets much on its own.', 'l-fed'),
    fedtalk: K('fed', 'Fed chair testimony', 'The Fed chair’s semiannual monetary policy report and testimony to Congress.', 'Hours of questions often reveal how the chair sees inflation, jobs and the next rate moves.', 'Can move yields and stocks if the chair sounds more worried about inflation or jobs than expected.', 'l-fed'),
    jackson: K('fed', 'Jackson Hole symposium', 'The Kansas City Fed’s yearly economic conference in Wyoming, where the Fed chair often gives a closely watched speech.', 'Chairs have used it to signal big policy shifts.', 'The chair’s speech can move markets for days.', 'l-fed'),
    cpi: K('data', 'CPI inflation', 'The Consumer Price Index from the Bureau of Labor Statistics: what consumers pay for a basket of goods and services. Released at 8:30 am ET.', 'The most watched inflation report. Hot inflation pushes the Fed to keep rates high; cool inflation opens the door to cuts.', 'One of the biggest scheduled movers. Stock index futures, yields and the dollar can jump within seconds of 8:30. Core CPI (without food and energy) versus the forecast is what traders watch.', 'l-inflation'),
    ppi: K('data', 'PPI producer prices', 'The Producer Price Index: prices businesses receive for goods and services, released by the BLS at 8:30 am ET.', 'An early read on cost pressure that can flow into consumer prices and the PCE inflation gauge.', 'Usually a smaller move than CPI; bigger when it surprises a lot.', 'l-inflation'),
    jobs: K('data', 'Jobs report', 'The Employment Situation report from the BLS: nonfarm payrolls, the unemployment rate and wages. Released at 8:30 am ET, usually on the first Friday of the month.', 'The broadest monthly read on the job market, half of the Fed’s dual mandate.', 'Often the biggest monthly mover with CPI. Too hot can mean higher yields; too weak can stir recession worries.', 'l-jobs'),
    jolts: K('data', 'JOLTS job openings', 'The Job Openings and Labor Turnover Survey from the BLS at 10:00 am ET: openings, hires, quits and layoffs.', 'Openings and quits show how tight the job market is and where wages are heading.', 'Moderate reaction; larger when the jobs report is days away.', 'l-jobs'),
    eci: K('data', 'Employment Cost Index', 'A quarterly BLS measure of wages and benefits, released at 8:30 am ET.', 'The Fed watches it as the cleanest read on labor cost growth.', 'Usually modest, larger when wage growth surprises.', 'l-jobs'),
    gdp: K('data', 'GDP', 'Gross domestic product from the Bureau of Economic Analysis at 8:30 am ET. The advance estimate comes about a month after the quarter ends, then two revisions.', 'The broadest measure of how fast the economy is growing.', 'The advance estimate can move markets; revisions rarely do.', 'l-pmi'),
    pce: K('data', 'PCE inflation (personal income and outlays)', 'The BEA’s personal income, spending and PCE price index, released at 8:30 am ET.', 'Core PCE is the inflation measure the Fed targets at 2%.', 'Usually smaller than CPI because much of it can be estimated from CPI and PPI, but surprises matter.', 'l-inflation'),
    retail: K('data', 'Retail sales', 'Monthly spending at stores, restaurants and online from the Census Bureau at 8:30 am ET.', 'Consumers drive about two-thirds of the US economy.', 'Moves retail stocks and yields when it surprises.', 'l-pmi'),
    housing: K('data', 'Housing starts', 'New homes started and building permits from the Census Bureau at 8:30 am ET.', 'Housing reacts early to interest rates and leads parts of the economy.', 'Moves homebuilder stocks more than the broad market.', 'l-pmi'),
    durable: K('data', 'Durable goods orders', 'Orders for long-lasting goods such as machinery and aircraft, from the Census Bureau at 8:30 am ET.', 'A read on business investment.', 'Often noisy because of aircraft orders; core orders matter more.', 'l-pmi'),
    ismm: K('data', 'ISM Manufacturing PMI', 'A survey of factory purchasing managers from the Institute for Supply Management at 10:00 am ET. Above 50 means activity is growing.', 'One of the earliest reads on each month. New orders and prices paid are watched closely.', 'Can move cyclical stocks, yields and the dollar.', 'l-pmi'),
    isms: K('data', 'ISM Services PMI', 'The ISM survey of services businesses at 10:00 am ET. Above 50 means growth.', 'Services are most of the US economy, and its prices index tracks sticky inflation.', 'Moderate moves; larger when it crosses 50.', 'l-pmi'),
    flashpmi: K('data', 'S&P Global flash PMI', 'Early estimates of US manufacturing and services PMIs from S&P Global at 9:45 am ET, about a week before the month ends.', 'The first survey read on the current month.', 'Usually small reactions.', 'l-pmi'),
    umich: K('data', 'Consumer sentiment (U. of Michigan)', 'The University of Michigan survey of consumer mood and inflation expectations at 10:00 am ET, preliminary then final each month.', 'Inflation expectations matter to the Fed.', 'Usually small, unless inflation expectations jump.', 'l-pmi'),
    confboard: K('data', 'Consumer confidence (Conference Board)', 'The Conference Board’s monthly consumer confidence index at 10:00 am ET, usually the last Tuesday of the month.', 'A read on how households feel about jobs and the economy.', 'Usually small.', 'l-pmi'),
    claims: K('data', 'Weekly jobless claims', 'New filings for unemployment benefits from the Labor Department, Thursdays at 8:30 am ET (moved when a holiday interferes).', 'The fastest read on layoffs. A steady climb is an early recession warning.', 'Usually small; bigger when the labor market is the market’s main worry.', 'l-jobs'),
    eia: K('energy', 'EIA oil inventories', 'The Energy Information Administration’s Weekly Petroleum Status Report: US crude, gasoline and distillate stocks, Wednesdays at 10:30 am ET (moved after holidays).', 'Inventory builds or draws move oil prices, and oil feeds into inflation and energy stocks.', 'Moves oil and energy stocks for an hour or two; the broad market rarely cares.', 'l-oil'),
    opec: K('energy', 'OPEC+ meeting', 'OPEC and its allies meet to set production targets.', 'Output decisions move oil prices, which feed into gasoline, inflation and energy stocks.', 'Oil can gap several percent on a surprise; energy and airline stocks follow.', 'l-oil'),
    holiday: K('markets', 'Market holiday', 'US stock exchanges are closed.', 'No trading means no way to react to news until the next session. Settlement and data releases may shift.', 'The day before a long weekend is often quieter, and news over the break can cause a gap at the next open.', 'l-orders'),
    early: K('markets', 'Early close (1:00 pm ET)', 'Stock markets close early, at 1:00 pm ET. The bond market usually closes early too, often at 2:00 pm ET.', 'Thin volume and short hours: orders may fill differently than on a normal day.', 'Usually quiet, low-volume sessions.', 'l-orders'),
    opex: K('markets', 'Monthly options expiration', 'Standard monthly stock and ETF options expire at the close on the third Friday of the month (Thursday if that Friday is a market holiday).', 'Large open positions can pin prices near popular strikes, and volume often spikes into the close.', 'Choppy trading near big strikes; volatility can change the following week as hedges roll off.', 'l-contracts'),
    quad: K('markets', 'Quad witching', 'The third Friday of March, June, September and December, when stock options, index options, index futures and single-stock futures expire together. Index rebalances often happen the same day.', 'Some of the highest-volume days of the year.', 'Big volume at the close; prices can swing as positions roll or close.', 'l-contracts'),
    vix: K('markets', 'VIX options expiration', 'VIX futures and options settle on a Wednesday, usually 30 days before the next month’s standard options expiration.', 'Matters to volatility traders and hedgers.', 'Can affect volatility products for a day.', 'l-volatility'),
    refunding: K('markets', 'Treasury quarterly refunding', 'The Treasury announces how much it will borrow and in which bond maturities, at 8:30 am ET.', 'More long-term bond supply can push long-term yields up, which affects mortgage rates and stock valuations.', 'Can move the 10-year yield, and through it, stocks.', 'l-rates'),
    earnings: K('earnings', 'Earnings season kicks off', 'Big banks usually report first, about two weeks after the quarter ends. Most S&P 500 companies report over the following five to six weeks.', 'Results and guidance drive individual stocks, and together they show how the economy is treating companies.', 'Single stocks can gap 5% to 20%; options prices rise before reports and fall after (IV crush).', 'l-earnings-season'),
    esttax: K('tax', 'Estimated tax payment due', 'Quarterly estimated tax payment to the IRS for income without enough withholding: trading gains, self-employment, interest and dividends.', 'Paying too little during the year can mean an underpayment penalty.', '', 'l-cap-gains'),
    filing: K('tax', 'Tax filing deadline', 'Deadline to file your federal return and pay any tax owed for last year.', 'Late filing and late payment have separate penalties. An extension gives more time to file, not to pay.', '', 'l-cap-gains'),
    extension: K('tax', 'Extended filing deadline', 'Deadline for returns filed with an extension.', 'Any unpaid tax has been building interest since April.', '', 'l-cap-gains'),
    contrib: K('tax', 'IRA and HSA contribution deadline', 'Last day to make IRA (traditional or Roth) and HSA contributions for the previous tax year.', 'Missed years cannot be made up later.', '', 'l-ira'),
    forms: K('tax', 'Tax forms due to you', 'Employers must send W-2s and payers must send many 1099s by this date. Broker consolidated 1099s come a little later.', 'You need them to file. Brokers often send corrected 1099s in February and March, so wait before filing if you trade a lot.', '', 'l-cap-gains'),
    yearend: K('tax', 'Year-end tax deadline', 'Last day for moves that count for this tax year: harvesting losses or gains (trade date counts), Roth conversions, 401(k) payroll deferrals, required minimum distributions and many FSA balances.', 'Miss it and the move counts for next year instead.', 'Tax-loss selling can weigh on the year’s losers in December; some bounce in January.', 'l-tax-loss'),
    tlh: K('tax', 'Plan tax-loss harvesting', 'A practical reminder: review losers while there is time to sell, wait out the 30-day wash-sale window and still be invested by year end.', 'Rushing on the last day leads to wash sales and bad fills.', 'December is busy: mutual funds pay capital gains distributions and some stocks see tax-loss selling.', 'l-tax-loss'),
    expat: K('tax', 'Expat filing deadline', 'Americans living abroad get an automatic two-month extension to file (and to pay without the failure-to-pay penalty, though interest still runs).', '', '', 'l-us-tax-abroad'),
    fbar: K('tax', 'FBAR deadline', 'Report of foreign bank and financial accounts (FinCEN 114) when they total more than $10,000 at any time in the year. It is due with your return and extended automatically.', 'Penalties for not filing can be large.', '', 'l-us-tax-abroad'),
    rmd: K('benefits', 'Required minimum distribution', 'Deadline to take required minimum distributions from pre-tax retirement accounts. Your first one can wait until April 1 of the following year.', 'Missing an RMD triggers an excise tax on the amount not taken.', '', 'l-medicare-rmd'),
    medicare: K('benefits', 'Medicare open enrollment', 'Window to change Medicare Advantage or Part D drug plans for next year.', 'Plans change costs and drug lists every year.', '', 'l-medicare-rmd'),
    maoe: K('benefits', 'Medicare Advantage open enrollment', 'People already in a Medicare Advantage plan can switch plans or go back to Original Medicare once in this window.', '', '', 'l-medicare-rmd'),
    aca: K('benefits', 'Marketplace open enrollment', 'Window to buy or change an ACA marketplace health plan (HealthCare.gov or your state’s site).', 'Your income estimate sets your premium tax credit. In 2026 and 2027 the credit stops above 400% of the poverty line.', '', 'l-aca'),
    acadl: K('benefits', 'Marketplace deadline for January 1 coverage', 'Pick a marketplace plan by this date for coverage starting January 1.', '', '', 'l-aca'),
    employer: K('benefits', 'Employer open enrollment season', 'Most employers run benefits enrollment in the fall: health plan, HSA or FSA, life and disability insurance, ESPP and 401(k) changes.', 'The choices lock in for a year.', '', 'l-open-enrollment'),
    fsa: K('benefits', 'FSA grace period ends', 'If your employer offers a grace period, last year’s health FSA money must be used by this date (plans may use a carryover instead).', 'Unused money is lost.', '', 'l-open-enrollment'),
    cola: K('benefits', 'Social Security COLA announcement', 'SSA announces next year’s cost-of-living increase after the September CPI release.', 'Sets next year’s benefit increase, wage base and earnings-test limits.', '', 'l-social-security'),
    halving: K('crypto', 'Bitcoin halving (estimate)', 'Every 210,000 blocks the new bitcoin issued per block is cut in half. The next one is at block 1,050,000; the date depends on how fast blocks are mined.', 'Lower new supply is part of bitcoin’s design, and traders watch it closely.', 'Past halvings were followed by big rallies and deep crashes; the pattern is not guaranteed.', 'l-crypto-coins'),
    crypto: K('crypto', 'Crypto rule date', 'A scheduled crypto regulatory or reporting date.', '', '', 'l-crypto-risks'),
    bondclose: K('markets', 'Bond market closed', 'The bond market follows SIFMA’s holiday schedule, which can close it, or close it early, on days when stock exchanges stay open.', 'Treasury yields barely move, and mortgage and rate-sensitive markets go quiet.', 'Stocks often trade on lighter volume.', 'l-rates'),
    mfdist: K('tax', 'Mutual fund distribution season', 'Most mutual funds pay out the year’s realized capital gains in December, even if you did not sell anything.', 'Buy a fund in a taxable account just before its record date and you owe tax on a payout of your own money. ETFs rarely distribute gains.', '', 'l-asset-location'),
    irsopen: K('tax', 'IRS filing season opens', 'The day the IRS starts accepting the new year’s returns.', 'Filing early means a faster refund, but wait for all your 1099s, including corrected ones.', '', 'l-cap-gains'),
    crypto1099: K('crypto', 'Form 1099-DA', 'Crypto brokers report your sales to you and the IRS on Form 1099-DA.', 'From 2026 sales, brokers also report your cost basis for coins bought after 2025, so the IRS can match your gains.', '', 'l-crypto-risks'),
    spgpmi: K('data', 'S&P Global final PMI', 'Final readings of S&P Global’s US manufacturing or services PMI at 9:45 am ET, just before the ISM reports.', 'Confirms or revises the flash reading from the week before.', 'Usually small; ISM gets more attention.', 'l-pmi'),
    election: K('markets', 'Election Day', 'US federal elections for Congress (and in some years the presidency) plus many state offices. Markets stay open.', 'Results can change expectations about taxes, spending and regulation for some industries.', 'Moves around elections have varied a lot; some sectors swing more than the broad market as results come in.', 'l-macro-intro'),
    dst: K('markets', 'Clock change', 'US clocks change at 2:00 am local time on a Sunday.', 'US market hours do not change in Eastern Time, but other countries change clocks on different dates, so overlaps with Europe and Asia shift for a week or two.', '', 'l-timeframes'),
    note: K('markets', 'Market note', 'A trading-day schedule worth knowing.', '', '', 'l-orders'),
  };

  /* ---------------- data ----------------
     One line per event: date | time | kind | title (blank = default) | note | status (c|r|e) | source
     Built from /home/claude/site/research/calendar.md (official schedules, checked October 21, 2026). */
  const RAW = `
# Federal Reserve (federalreserve.gov FOMC calendar; 2027 meetings are tentative until confirmed at the meeting before)
2026-10-28|2:00 pm ET|fomc|FOMC rate decision|Meeting Oct 27–28. Statement 2:00 pm, press conference 2:30 pm. Kevin Warsh has chaired the Fed since May 22, 2026.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2026-11-18|2:00 pm ET|minutes|FOMC minutes (October meeting)||c|https://www.federalreserve.gov/newsevents/2026-november.htm
2026-11-25|2:00 pm ET|beige|Beige Book|The day before Thanksgiving.|c|https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm
2026-12-09|2:00 pm ET|fomcsep|FOMC decision + dot plot|Meeting Dec 8–9, with the Summary of Economic Projections.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2026-12-30|2:00 pm ET|minutes|FOMC minutes (December meeting)||c|https://www.federalreserve.gov/newsevents/2026-december.htm
2027-01-13|2:00 pm ET|beige|Beige Book|Two weeks before the January meeting; the 2027 list is not published yet.|r|https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm
2027-01-27|2:00 pm ET|fomc|FOMC rate decision|Meeting Jan 26–27. The Fed calls 2027 dates tentative until confirmed.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-02-17|2:00 pm ET|minutes|FOMC minutes (January meeting)|Three weeks after the decision.|r|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-03-03|2:00 pm ET|beige|Beige Book||r|https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm
2027-03-17|2:00 pm ET|fomcsep|FOMC decision + dot plot|Meeting Mar 16–17. Tentative per the Fed. VIX expiration is the same day.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-04-07|2:00 pm ET|minutes|FOMC minutes (March meeting)||r|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-04-14|2:00 pm ET|beige|Beige Book||r|https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm
2027-04-28|2:00 pm ET|fomc|FOMC rate decision|Meeting Apr 27–28. Tentative per the Fed.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-05-19|2:00 pm ET|minutes|FOMC minutes (April meeting)||r|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-05-26|2:00 pm ET|beige|Beige Book||r|https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm
2027-06-09|2:00 pm ET|fomcsep|FOMC decision + dot plot|Meeting Jun 8–9, earlier in June than usual. CPI follows the next morning. Tentative per the Fed.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-06-30|2:00 pm ET|minutes|FOMC minutes (June meeting)||r|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-07-14|2:00 pm ET|beige|Beige Book||r|https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm
2027-07-28|2:00 pm ET|fomc|FOMC rate decision|Meeting Jul 27–28. Tentative per the Fed.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-08-18|2:00 pm ET|minutes|FOMC minutes (July meeting)||r|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-09-01|2:00 pm ET|beige|Beige Book||r|https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm
2027-09-15|2:00 pm ET|fomcsep|FOMC decision + dot plot|Meeting Sep 14–15. Tentative per the Fed. VIX expiration the same day.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-10-06|2:00 pm ET|minutes|FOMC minutes (September meeting)||r|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-10-13|2:00 pm ET|beige|Beige Book||r|https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm
2027-10-27|2:00 pm ET|fomc|FOMC rate decision|Meeting Oct 26–27. Tentative per the Fed.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-11-17|2:00 pm ET|minutes|FOMC minutes (October meeting)||r|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-11-24|2:00 pm ET|beige|Beige Book|The day before Thanksgiving.|r|https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm
2027-12-08|2:00 pm ET|fomcsep|FOMC decision + dot plot|Meeting Dec 7–8. Tentative per the Fed.|c|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
2027-12-29|2:00 pm ET|minutes|FOMC minutes (December meeting)||r|https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
# BLS
2026-10-30|8:30 am ET|eci|Employment Cost Index (Q3 2026)||c|https://www.bls.gov/schedule/news_release/eci.htm
2026-11-03|10:00 am ET|jolts|JOLTS job openings (September)||c|https://www.bls.gov/schedule/news_release/jolts.htm
2026-11-06|8:30 am ET|jobs|Jobs report (October)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2026-11-10|8:30 am ET|cpi|CPI inflation (October)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2026-11-13|8:30 am ET|ppi|PPI producer prices (October)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2026-12-01|10:00 am ET|jolts|JOLTS job openings (October)||c|https://www.bls.gov/schedule/news_release/jolts.htm
2026-12-04|8:30 am ET|jobs|Jobs report (November)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2026-12-10|8:30 am ET|cpi|CPI inflation (November)|The morning after the December Fed decision.|c|https://www.bls.gov/schedule/news_release/cpi.htm
2026-12-15|8:30 am ET|ppi|PPI producer prices (November)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-01-08|8:30 am ET|jobs|Jobs report (December)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-01-13|8:30 am ET|cpi|CPI inflation (December)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-01-14|8:30 am ET|ppi|PPI producer prices (December)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-01-29|8:30 am ET|eci|Employment Cost Index (Q4 2026)||c|https://www.bls.gov/schedule/news_release/eci.htm
2027-02-05|8:30 am ET|jobs|Jobs report (January)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-02-11|8:30 am ET|cpi|CPI inflation (January)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-02-12|8:30 am ET|ppi|PPI producer prices (January)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-03-05|8:30 am ET|jobs|Jobs report (February)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-03-10|8:30 am ET|cpi|CPI inflation (February)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-03-12|8:30 am ET|ppi|PPI producer prices (February)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-04-02|8:30 am ET|jobs|Jobs report (March)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-04-13|8:30 am ET|cpi|CPI inflation (March)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-04-14|8:30 am ET|ppi|PPI producer prices (March)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-04-30|8:30 am ET|eci|Employment Cost Index (Q1 2027)||c|https://www.bls.gov/schedule/news_release/eci.htm
2027-05-07|8:30 am ET|jobs|Jobs report (April)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-05-12|8:30 am ET|cpi|CPI inflation (April)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-05-13|8:30 am ET|ppi|PPI producer prices (April)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-06-04|8:30 am ET|jobs|Jobs report (May)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-06-10|8:30 am ET|cpi|CPI inflation (May)|The morning after the June Fed decision.|c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-06-11|8:30 am ET|ppi|PPI producer prices (May)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-07-02|8:30 am ET|jobs|Jobs report (June)|Friday before the July 5 market holiday.|c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-07-14|8:30 am ET|cpi|CPI inflation (June)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-07-15|8:30 am ET|ppi|PPI producer prices (June)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-07-30|8:30 am ET|eci|Employment Cost Index (Q2 2027)||c|https://www.bls.gov/schedule/news_release/eci.htm
2027-08-06|8:30 am ET|jobs|Jobs report (July)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-08-10|8:30 am ET|ppi|PPI producer prices (July)|Comes out before CPI this month.|c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-08-11|8:30 am ET|cpi|CPI inflation (July)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-09-03|8:30 am ET|jobs|Jobs report (August)|Same morning as ISM Services.|c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-09-10|8:30 am ET|ppi|PPI producer prices (August)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-09-14|8:30 am ET|cpi|CPI inflation (August)|Day one of the September Fed meeting.|c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-10-08|8:30 am ET|jobs|Jobs report (September)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-10-14|8:30 am ET|cpi|CPI inflation (September)|Also sets the 2028 Social Security COLA.|c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-10-15|8:30 am ET|ppi|PPI producer prices (September)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-10-29|8:30 am ET|eci|Employment Cost Index (Q3 2027)||c|https://www.bls.gov/schedule/news_release/eci.htm
2027-11-05|8:30 am ET|jobs|Jobs report (October)||c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-11-10|8:30 am ET|cpi|CPI inflation (October)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-11-12|8:30 am ET|ppi|PPI producer prices (October)||c|https://www.bls.gov/schedule/news_release/ppi.htm
2027-12-03|8:30 am ET|jobs|Jobs report (November)|Same morning as ISM Services.|c|https://www.bls.gov/schedule/news_release/empsit.htm
2027-12-10|8:30 am ET|cpi|CPI inflation (November)||c|https://www.bls.gov/schedule/news_release/cpi.htm
2027-12-15|8:30 am ET|ppi|PPI producer prices (November)||c|https://www.bls.gov/schedule/news_release/ppi.htm
# BEA: GDP and PCE come out together
2026-10-29|8:30 am ET|gdp|GDP Q3 2026 (advance)|Released with personal income and PCE inflation for September.|c|https://www.bea.gov/news/schedule
2026-10-29|8:30 am ET|pce|PCE inflation (September)|Released with the advance GDP estimate.|c|https://www.bea.gov/news/schedule
2026-11-25|8:30 am ET|gdp|GDP Q3 2026 (second estimate)|With corporate profits.|c|https://www.bea.gov/news/schedule
2026-11-25|8:30 am ET|pce|PCE inflation (October)||c|https://www.bea.gov/news/schedule
2026-12-23|8:30 am ET|gdp|GDP Q3 2026 (third estimate)||c|https://www.bea.gov/news/schedule
2026-12-23|8:30 am ET|pce|PCE inflation (November)||c|https://www.bea.gov/news/schedule
2027-01-28|8:30 am ET|gdp|GDP Q4 and full-year 2026 (advance)|The day after the January Fed decision.|c|https://www.bea.gov/news/schedule/next-year
2027-01-28|8:30 am ET|pce|PCE inflation (December)||c|https://www.bea.gov/news/schedule/next-year
2027-02-25|8:30 am ET|gdp|GDP Q4 2026 (second estimate)||c|https://www.bea.gov/news/schedule/next-year
2027-02-25|8:30 am ET|pce|PCE inflation (January)||c|https://www.bea.gov/news/schedule/next-year
2027-03-31|8:30 am ET|gdp|GDP Q4 2026 (third estimate)|With corporate profits.|c|https://www.bea.gov/news/schedule/next-year
2027-03-31|8:30 am ET|pce|PCE inflation (February)||c|https://www.bea.gov/news/schedule/next-year
2027-04-29|8:30 am ET|gdp|GDP Q1 2027 (advance)|The day after the April Fed decision.|c|https://www.bea.gov/news/schedule/next-year
2027-04-29|8:30 am ET|pce|PCE inflation (March)||c|https://www.bea.gov/news/schedule/next-year
2027-05-27|8:30 am ET|gdp|GDP Q1 2027 (second estimate)|With corporate profits.|c|https://www.bea.gov/news/schedule/next-year
2027-05-27|8:30 am ET|pce|PCE inflation (April)||c|https://www.bea.gov/news/schedule/next-year
2027-06-25|8:30 am ET|gdp|GDP Q1 2027 (third estimate)||c|https://www.bea.gov/news/schedule/next-year
2027-06-25|8:30 am ET|pce|PCE inflation (May)||c|https://www.bea.gov/news/schedule/next-year
2027-07-29|8:30 am ET|gdp|GDP Q2 2027 (advance)|The day after the July Fed decision.|c|https://www.bea.gov/news/schedule/next-year
2027-07-29|8:30 am ET|pce|PCE inflation (June)||c|https://www.bea.gov/news/schedule/next-year
2027-08-25|8:30 am ET|gdp|GDP Q2 2027 (second estimate)|With corporate profits.|c|https://www.bea.gov/news/schedule/next-year
2027-08-25|8:30 am ET|pce|PCE inflation (July)||c|https://www.bea.gov/news/schedule/next-year
2027-09-30|8:30 am ET|gdp|GDP Q2 2027 (third estimate)||c|https://www.bea.gov/news/schedule/next-year
2027-09-30|8:30 am ET|pce|PCE inflation (August)||c|https://www.bea.gov/news/schedule/next-year
2027-10-28|8:30 am ET|gdp|GDP Q3 2027 (advance)|The day after the October Fed decision.|c|https://www.bea.gov/news/schedule/next-year
2027-10-28|8:30 am ET|pce|PCE inflation (September)||c|https://www.bea.gov/news/schedule/next-year
2027-11-24|8:30 am ET|gdp|GDP Q3 2027 (second estimate)|The day before Thanksgiving.|c|https://www.bea.gov/news/schedule/next-year
2027-11-24|8:30 am ET|pce|PCE inflation (October)||c|https://www.bea.gov/news/schedule/next-year
2027-12-22|8:30 am ET|gdp|GDP Q3 2027 (third estimate)||c|https://www.bea.gov/news/schedule/next-year
2027-12-22|8:30 am ET|pce|PCE inflation (November)||c|https://www.bea.gov/news/schedule/next-year
# Census
2026-10-27|8:30 am ET|durable|Durable goods orders (September)||c|https://www.census.gov/economic-indicators/calendar-listview-2026.html
2026-11-17|8:30 am ET|retail|Retail sales (October)||c|https://www.census.gov/economic-indicators/calendar-listview-2026.html
2026-11-18|8:30 am ET|housing|Housing starts (October)||c|https://www.census.gov/economic-indicators/calendar-listview-2026.html
2026-11-25|8:30 am ET|durable|Durable goods orders (October)||c|https://www.census.gov/economic-indicators/calendar-listview-2026.html
2026-12-16|8:30 am ET|retail|Retail sales (November)||c|https://www.census.gov/economic-indicators/calendar-listview-2026.html
2026-12-17|8:30 am ET|housing|Housing starts (November)||c|https://www.census.gov/economic-indicators/calendar-listview-2026.html
2026-12-23|8:30 am ET|durable|Durable goods orders (November)||c|https://www.census.gov/economic-indicators/calendar-listview-2026.html
2027-01-15|8:30 am ET|retail|Retail sales (December, holiday season)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-01-20|8:30 am ET|housing|Housing starts (December)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-01-27|8:30 am ET|durable|Durable goods orders (December)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-02-17|8:30 am ET|retail|Retail sales (January)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-02-18|8:30 am ET|housing|Housing starts (January)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-02-25|8:30 am ET|durable|Durable goods orders (January)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-03-16|8:30 am ET|retail|Retail sales (February)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-03-17|8:30 am ET|housing|Housing starts (February)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-03-25|8:30 am ET|durable|Durable goods orders (February)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-04-16|8:30 am ET|retail|Retail sales (March)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-04-20|8:30 am ET|housing|Housing starts (March)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-04-27|8:30 am ET|durable|Durable goods orders (March)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-05-14|8:30 am ET|retail|Retail sales (April)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-05-18|8:30 am ET|housing|Housing starts (April)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-05-27|8:30 am ET|durable|Durable goods orders (April)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-06-16|8:30 am ET|retail|Retail sales (May)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-06-17|8:30 am ET|housing|Housing starts (May)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-06-25|8:30 am ET|durable|Durable goods orders (May)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-07-16|8:30 am ET|retail|Retail sales (June)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-07-20|8:30 am ET|housing|Housing starts (June)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-07-28|8:30 am ET|durable|Durable goods orders (June)|July Fed decision day.|c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-08-16|8:30 am ET|retail|Retail sales (July)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-08-17|8:30 am ET|housing|Housing starts (July)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-08-25|8:30 am ET|durable|Durable goods orders (July)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-09-16|8:30 am ET|retail|Retail sales (August)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-09-21|8:30 am ET|housing|Housing starts (August)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-09-27|8:30 am ET|durable|Durable goods orders (August)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-10-15|8:30 am ET|retail|Retail sales (September)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-10-19|8:30 am ET|housing|Housing starts (September)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-10-27|8:30 am ET|durable|Durable goods orders (September)|October Fed decision day.|c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-11-16|8:30 am ET|retail|Retail sales (October)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-11-17|8:30 am ET|housing|Housing starts (October)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-11-24|8:30 am ET|durable|Durable goods orders (October)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-12-15|8:30 am ET|retail|Retail sales (November)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-12-16|8:30 am ET|housing|Housing starts (November)||c|https://www.census.gov/economic-indicators/calendar-listview.html
2027-12-22|8:30 am ET|durable|Durable goods orders (November)||c|https://www.census.gov/economic-indicators/calendar-listview.html
# PMIs
2026-10-23|9:45 am ET|flashpmi|S&P Global flash US PMI (October)||c|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2026-11-02|10:00 am ET|ismm|ISM Manufacturing PMI (October)||c|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2026-11-04|10:00 am ET|isms|ISM Services PMI (October)||c|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2026-12-01|10:00 am ET|ismm|ISM Manufacturing PMI (November)||c|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2026-12-03|10:00 am ET|isms|ISM Services PMI (November)||c|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-01-04|10:00 am ET|ismm|ISM Manufacturing PMI (December)|First business day; ISM has moved January dates before.|r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-01-06|10:00 am ET|isms|ISM Services PMI (December)|Third business day.|r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-02-01|10:00 am ET|ismm|ISM Manufacturing PMI (January)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-02-03|10:00 am ET|isms|ISM Services PMI (January)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-03-01|10:00 am ET|ismm|ISM Manufacturing PMI (February)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-03-03|10:00 am ET|isms|ISM Services PMI (February)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-04-01|10:00 am ET|ismm|ISM Manufacturing PMI (March)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-04-05|10:00 am ET|isms|ISM Services PMI (March)|Good Friday (Mar 26) is not in play; Apr 1, 2 and 5 are the first three business days.|r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-05-03|10:00 am ET|ismm|ISM Manufacturing PMI (April)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-05-05|10:00 am ET|isms|ISM Services PMI (April)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-06-01|10:00 am ET|ismm|ISM Manufacturing PMI (May)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-06-03|10:00 am ET|isms|ISM Services PMI (May)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-07-01|10:00 am ET|ismm|ISM Manufacturing PMI (June)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-07-06|10:00 am ET|isms|ISM Services PMI (June)|July 5 is a holiday.|r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-08-02|10:00 am ET|ismm|ISM Manufacturing PMI (July)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-08-04|10:00 am ET|isms|ISM Services PMI (July)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-09-01|10:00 am ET|ismm|ISM Manufacturing PMI (August)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-09-03|10:00 am ET|isms|ISM Services PMI (August)|Same morning as the jobs report.|r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-10-01|10:00 am ET|ismm|ISM Manufacturing PMI (September)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-10-05|10:00 am ET|isms|ISM Services PMI (September)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-11-01|10:00 am ET|ismm|ISM Manufacturing PMI (October)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-11-03|10:00 am ET|isms|ISM Services PMI (October)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-12-01|10:00 am ET|ismm|ISM Manufacturing PMI (November)||r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
2027-12-03|10:00 am ET|isms|ISM Services PMI (November)|Same morning as the jobs report.|r|https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/
# Consumer sentiment
2026-10-23|10:00 am ET|umich|Consumer sentiment, final (October)||c|https://www.sca.isr.umich.edu/
2026-10-27|10:00 am ET|confboard|Consumer confidence (October)||c|https://www.conference-board.org/topics/consumer-confidence
2026-11-06|10:00 am ET|umich|Consumer sentiment, preliminary (November)|Two weeks before the confirmed final.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2026
2026-11-20|10:00 am ET|umich|Consumer sentiment, final (November)||c|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2026
2026-11-24|10:00 am ET|confboard|Consumer confidence (November)|Last Tuesday of the month.|r|https://www.conference-board.org/topics/consumer-confidence
2026-12-04|10:00 am ET|umich|Consumer sentiment, preliminary (December)||e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2026
2026-12-18|10:00 am ET|umich|Consumer sentiment, final (December)||c|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2026
2026-12-29|10:00 am ET|confboard|Consumer confidence (December)|May move for the holidays.|r|https://www.conference-board.org/topics/consumer-confidence
2027-01-26|10:00 am ET|confboard|Consumer confidence (January)||r|https://www.conference-board.org/topics/consumer-confidence
2027-02-23|10:00 am ET|confboard|Consumer confidence (February)||r|https://www.conference-board.org/topics/consumer-confidence
2027-03-30|10:00 am ET|confboard|Consumer confidence (March)||r|https://www.conference-board.org/topics/consumer-confidence
2027-04-27|10:00 am ET|confboard|Consumer confidence (April)||r|https://www.conference-board.org/topics/consumer-confidence
2027-05-25|10:00 am ET|confboard|Consumer confidence (May)||r|https://www.conference-board.org/topics/consumer-confidence
2027-06-29|10:00 am ET|confboard|Consumer confidence (June)||r|https://www.conference-board.org/topics/consumer-confidence
2027-07-27|10:00 am ET|confboard|Consumer confidence (July)||r|https://www.conference-board.org/topics/consumer-confidence
2027-08-31|10:00 am ET|confboard|Consumer confidence (August)||r|https://www.conference-board.org/topics/consumer-confidence
2027-09-28|10:00 am ET|confboard|Consumer confidence (September)||r|https://www.conference-board.org/topics/consumer-confidence
2027-10-26|10:00 am ET|confboard|Consumer confidence (October)||r|https://www.conference-board.org/topics/consumer-confidence
2027-11-30|10:00 am ET|confboard|Consumer confidence (November)||r|https://www.conference-board.org/topics/consumer-confidence
2027-12-28|10:00 am ET|confboard|Consumer confidence (December)|May move for the holidays.|r|https://www.conference-board.org/topics/consumer-confidence
# Markets
2026-11-02||refunding|Treasury financing estimates|Borrowing estimates ahead of the refunding announcement.|c|https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding/most-recent-quarterly-refunding-documents
2026-11-04|8:30 am ET|refunding|Treasury quarterly refunding announcement||c|https://home.treasury.gov/news/press-releases/sb0590
2026-11-11||bondclose|Bond market closed (Veterans Day)|Stocks trade normally.|c|https://www.sifma.org/resources/guides-playbooks/holiday-schedule
2026-11-18||vix|VIX expiration (November)||c|https://www.cboe.com/us/futures/market_statistics/settlement/
2026-11-20|4:00 pm ET|opex|Monthly options expiration (November)|Third Friday.|r|https://www.cboe.com/about/hours/us-options/
2026-11-26||holiday|Markets closed: Thanksgiving|Stock and bond markets closed.|c|https://www.nyse.com/markets/hours-calendars
2026-11-27|1:00 pm ET|early|Early close: day after Thanksgiving|Stocks close 1:00 pm; bonds 2:00 pm.|c|https://www.nyse.com/markets/hours-calendars
2026-12-16||vix|VIX expiration (December)||c|https://www.cboe.com/us/futures/market_statistics/settlement/
2026-12-18|4:00 pm ET|quad|Quad witching (December)|Third Friday of a quarter-end month.|r|https://www.cboe.com/about/hours/us-options/
2026-12-24|1:00 pm ET|early|Early close: Christmas Eve|Stocks close 1:00 pm; bonds 2:00 pm.|c|https://www.nyse.com/markets/hours-calendars
2026-12-25||holiday|Markets closed: Christmas||c|https://www.nyse.com/markets/hours-calendars
2026-12-31|2:00 pm ET|bondclose|Last trading day of 2026: bond market closes early|Stocks trade a full day; bonds close at 2:00 pm.|c|https://www.sifma.org/resources/guides-playbooks/holiday-schedule
2027-01-01||holiday|Markets closed: New Year's Day||c|https://www.nyse.com/markets/hours-calendars
2027-01-14|~6:45 am ET (call 8:30 am)|earnings|Earnings season kicks off (Q4 2026)|JPMorgan Chase reports first; other big banks are expected the same week (estimate).|c|https://www.jpmorganchase.com/ir/news/2025/jpmc-announces-conference-calls-to-review-first-quarter-second-quarter-third-quarter-and-fourth-quarter-2026-earnings
2027-01-15|4:00 pm ET|opex|Monthly options expiration (January)||r|https://www.cboe.com/about/hours/us-options/
2027-01-18||holiday|Markets closed: Martin Luther King Jr. Day||c|https://www.nyse.com/markets/hours-calendars
2027-01-20||vix|VIX expiration (January)||c|https://www.cboe.com/us/futures/market_statistics/settlement/
2027-02-03|8:30 am ET|refunding|Treasury quarterly refunding announcement|Usually the first Wednesday of the refunding month.|e|https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding
2027-02-15||holiday|Markets closed: Washington's Birthday||c|https://www.nyse.com/markets/hours-calendars
2027-02-17||vix|VIX expiration (February)||c|https://www.cboe.com/us/futures/market_statistics/settlement/
2027-02-19|4:00 pm ET|opex|Monthly options expiration (February)||r|https://www.cboe.com/about/hours/us-options/
2027-03-17||vix|VIX expiration (March)|Same day as the March Fed decision.|c|https://www.cboe.com/us/futures/market_statistics/settlement/
2027-03-19|4:00 pm ET|quad|Quad witching (March)||r|https://www.cboe.com/about/hours/us-options/
2027-03-26||holiday|Markets closed: Good Friday||c|https://www.nyse.com/markets/hours-calendars
2027-04-13|~6:45 am ET (call 8:30 am)|earnings|Earnings season kicks off (Q1 2027)|JPMorgan Chase reports first; peers expected that week (estimate).|c|https://www.jpmorganchase.com/ir/news/2026/jpmc-announces-conference-calls-to-review-first-quarter-second-quarter-third-quarter-and-fourth-quarter-2027-earnings
2027-04-16|4:00 pm ET|opex|Monthly options expiration (April)||r|https://www.cboe.com/about/hours/us-options/
2027-04-21||vix|VIX expiration (April)||c|https://www.cboe.com/us/futures/market_statistics/settlement/
2027-05-05|8:30 am ET|refunding|Treasury quarterly refunding announcement||e|https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding
2027-05-18||vix|VIX expiration (May), on a Tuesday|Moved because the matching Friday is a holiday.|c|https://www.cboe.com/us/futures/market_statistics/settlement/
2027-05-21|4:00 pm ET|opex|Monthly options expiration (May)||r|https://www.cboe.com/about/hours/us-options/
2027-05-31||holiday|Markets closed: Memorial Day||c|https://www.nyse.com/markets/hours-calendars
2027-06-16||vix|VIX expiration (June)||c|https://www.cboe.com/us/futures/market_statistics/settlement/
2027-06-17|4:00 pm ET|quad|Quad witching (June), on a Thursday|Moved up a day because Friday June 18 is the Juneteenth holiday.|r|https://www.nyse.com/markets/hours-calendars
2027-06-18||holiday|Markets closed: Juneteenth (observed)||c|https://www.nyse.com/markets/hours-calendars
2027-07-05||holiday|Markets closed: Independence Day (observed)|No early close on July 2.|c|https://www.nyse.com/markets/hours-calendars
2027-07-13|~6:45 am ET (call 8:30 am)|earnings|Earnings season kicks off (Q2 2027)|JPMorgan Chase reports first; peers expected that week (estimate).|c|https://www.jpmorganchase.com/ir/news/2026/jpmc-announces-conference-calls-to-review-first-quarter-second-quarter-third-quarter-and-fourth-quarter-2027-earnings
2027-07-16|4:00 pm ET|opex|Monthly options expiration (July)||r|https://www.cboe.com/about/hours/us-options/
2027-07-21||vix|VIX expiration (July)||r|https://www.cboe.com/tradable_products/vix/vix_futures/specifications/
2027-08-04|8:30 am ET|refunding|Treasury quarterly refunding announcement||e|https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding
2027-08-18||vix|VIX expiration (August)||r|https://www.cboe.com/tradable_products/vix/vix_futures/specifications/
2027-08-20|4:00 pm ET|opex|Monthly options expiration (August)||r|https://www.cboe.com/about/hours/us-options/
2027-09-06||holiday|Markets closed: Labor Day||c|https://www.nyse.com/markets/hours-calendars
2027-09-15||vix|VIX expiration (September)|Same day as the September Fed decision.|r|https://www.cboe.com/tradable_products/vix/vix_futures/specifications/
2027-09-17|4:00 pm ET|quad|Quad witching (September)||r|https://www.cboe.com/about/hours/us-options/
2027-10-11||bondclose|Bond market closed (Columbus Day)|Stocks trade normally. Based on SIFMA's usual practice.|e|https://www.sifma.org/resources/guides-playbooks/holiday-schedule
2027-10-12|~6:45 am ET (call 8:30 am)|earnings|Earnings season kicks off (Q3 2027)|JPMorgan Chase reports first; peers expected that week (estimate).|c|https://www.jpmorganchase.com/ir/news/2026/jpmc-announces-conference-calls-to-review-first-quarter-second-quarter-third-quarter-and-fourth-quarter-2027-earnings
2027-10-15|4:00 pm ET|opex|Monthly options expiration (October)||r|https://www.cboe.com/about/hours/us-options/
2027-10-20||vix|VIX expiration (October)||r|https://www.cboe.com/tradable_products/vix/vix_futures/specifications/
2027-11-03|8:30 am ET|refunding|Treasury quarterly refunding announcement||e|https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding
2027-11-11||bondclose|Bond market closed (Veterans Day)|Stocks trade normally. Based on SIFMA's usual practice.|e|https://www.sifma.org/resources/guides-playbooks/holiday-schedule
2027-11-17||vix|VIX expiration (November)||r|https://www.cboe.com/tradable_products/vix/vix_futures/specifications/
2027-11-19|4:00 pm ET|opex|Monthly options expiration (November)||r|https://www.cboe.com/about/hours/us-options/
2027-11-25||holiday|Markets closed: Thanksgiving||c|https://www.nyse.com/markets/hours-calendars
2027-11-26|1:00 pm ET|early|Early close: day after Thanksgiving|Stocks close 1:00 pm; bonds likely 2:00 pm (estimate).|c|https://www.nyse.com/markets/hours-calendars
2027-12-17|4:00 pm ET|quad|Quad witching (December)||r|https://www.cboe.com/about/hours/us-options/
2027-12-22||vix|VIX expiration (December)||r|https://www.cboe.com/tradable_products/vix/vix_futures/specifications/
2027-12-24||holiday|Markets closed: Christmas (observed)||c|https://www.nyse.com/markets/hours-calendars
2027-12-31|4:00 pm ET|note|Last trading day of 2027: a full stock session|New Year's Day 2028 is a Saturday, so the NYSE observes no holiday. It is a federal holiday, so government data offices are closed.|c|https://www.nyse.com/markets/hours-calendars
# Energy
2026-11-01||opec|OPEC+ monthly meeting (seven-country group)|The seven OPEC+ countries making voluntary cuts meet monthly; October's meeting kept November output at September levels.|c|https://www.opec.org/pr-detail/616-4-october-2026.html
2026-11-29||opec|OPEC and non-OPEC Ministerial Meeting|The 42nd full ministerial meeting, which sets the group's wider policy.|c|https://opec.org/pr-detail/605-7-june-2026.html
# Taxes
2026-12-01||mfdist|Mutual fund distribution season|Funds usually pay capital-gain distributions in December. Check record dates before buying a fund in a taxable account.|e|
2026-12-01||tlh|Wash-sale window opens for a year-end loss|A loss sold on Dec 31 is disallowed if you buy the same or a substantially identical security from Dec 1 to Jan 30, in any of your accounts.|r|https://www.irs.gov/publications/p550
2026-12-31|4:00 pm ET|yearend|Year-end deadline for 2026|Last day to harvest losses or gains (trade date counts, not the Jan 4 settlement), make Roth conversions, defer 401(k) pay, take RMDs and qualified charitable distributions. Net losses offset gains plus up to $3,000 of income; the rest carries forward.|r|https://www.irs.gov/taxtopics/tc409
2027-01-15||esttax|Estimated tax due (Q4 2026)|Fourth payment for income earned September to December 2026.|c|https://www.irs.gov/faqs/estimated-tax/individuals/individuals-2
2027-01-25||irsopen|IRS filing season opens (estimate)|Not announced yet; the 2026 season opened January 26.|e|https://www.irs.gov/newsroom/irs-announces-first-day-of-2026-filing-season-online-tools-and-resources-help-with-tax-filing
2027-01-30||tlh|Wash-sale window closes for a Dec 31 loss|Buying back from January 31 on is safe for a December 31 sale.|r|https://www.irs.gov/publications/p550
2027-02-01||forms|W-2 and 1099-NEC due to you|January 31 is a Sunday, so the deadline moves to Monday. Standalone 1099-DIV and 1099-INT are due too.|r|https://www.irs.gov/instructions/i1099gi
2027-02-16||forms|Broker 1099s due (1099-B, 1099-DA, consolidated)|February 15 is Washington's Birthday, so the deadline moves to Tuesday. Brokers often send corrected forms later.|r|https://www.irs.gov/instructions/i1099gi
2027-03-15||forms|Partnership and S-corp returns and K-1s due|For calendar-year partnerships and S corporations.|r|https://www.irs.gov/publications/p509
2027-04-01||rmd|First RMD deadline (turned 73 in 2026)|Only your first RMD can wait until April 1; the second is still due by December 31, 2027.|r|https://www.irs.gov/retirement-plans/retirement-plan-and-ira-required-minimum-distributions-faqs
2027-04-15||filing|Tax Day: file 2026 return or extend|File Form 1040 and pay, or file Form 4868 for six more months to file (not to pay).|r|https://www.irs.gov/publications/p509
2027-04-15||contrib|Last day for 2026 IRA and HSA contributions|2026 limits: IRA $7,500 ($8,600 at 50+).|r|https://www.irs.gov/retirement-plans/ira-year-end-reminders
2027-04-15||esttax|Estimated tax due (Q1 2027)||r|https://www.irs.gov/faqs/estimated-tax/individuals/individuals-2
2027-04-15||fbar|FBAR due (2026), automatic extension to Oct 15|For foreign accounts totaling more than $10,000 at any time in 2026.|r|https://www.irs.gov/businesses/small-businesses-self-employed/report-of-foreign-bank-and-financial-accounts-fbar
2027-06-15||expat|Filing deadline for Americans abroad|Automatic two-month extension; interest still runs from April 15.|r|https://www.irs.gov/individuals/international-taxpayers/us-citizens-and-resident-aliens-abroad-automatic-2-month-extension-of-time-to-file
2027-06-15||esttax|Estimated tax due (Q2 2027)||r|https://www.irs.gov/faqs/estimated-tax/individuals/individuals-2
2027-09-15||esttax|Estimated tax due (Q3 2027)||r|https://www.irs.gov/faqs/estimated-tax/individuals/individuals-2
2027-10-15||extension|Extended 2026 returns due (and extended FBAR)||r|https://www.irs.gov/publications/p509
2027-12-01||mfdist|Mutual fund distribution season||e|
2027-12-01||tlh|Wash-sale window opens for a year-end loss|Purchases from today count against a December 31 loss sale.|r|https://www.irs.gov/publications/p550
2027-12-31|4:00 pm ET|yearend|Year-end deadline for 2027|Last full trading day of 2027. Harvest losses or gains, Roth conversions, 401(k) deferrals, RMDs and QCDs. Q4 2027 estimated tax is due Tuesday, January 18, 2028.|r|https://www.nyse.com/markets/hours-calendars
# Benefits
2026-11-01||aca|Marketplace open enrollment opens (2027 coverage)|Runs to January 15.|c|https://www.healthcare.gov/quick-guide/dates-and-deadlines/
2026-11-02||employer|Employer open enrollment season|Usually late October to early December; your employer sets the dates.|e|https://www.healthcare.gov/glossary/open-enrollment-period/
2026-12-07||medicare|Medicare open enrollment ends|Window was October 15 to December 7; changes start January 1.|c|https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan
2026-12-15||acadl|Marketplace deadline for January 1 coverage||c|https://www.healthcare.gov/quick-guide/dates-and-deadlines/
2026-12-31||fsa|Health FSA plan year ends|Use it or lose it, unless your plan has a grace period or a carryover.|r|https://www.irs.gov/publications/p969
2027-01-01||maoe|Medicare Advantage open enrollment begins|Runs January 1 to March 31, for people already in an Advantage plan.|c|https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan
2027-01-15||aca|Marketplace open enrollment ends|After this you need a special enrollment period. Some state marketplaces set other dates.|c|https://www.healthcare.gov/quick-guide/dates-and-deadlines/
2027-03-15||fsa|Health FSA grace period ends (if your plan has one)||r|https://www.irs.gov/publications/p969
2027-03-31||maoe|Medicare Advantage open enrollment ends||c|https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan
2027-10-14|8:30 am ET|cola|Social Security COLA for 2028 (expected)|SSA announced the 2027 increase on the day September CPI came out.|e|https://www.ssa.gov/news/en/advocates/2026-10-14.html
2027-10-15||medicare|Medicare open enrollment opens (2028 coverage)|Runs to December 7.|r|https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan
2027-11-01||aca|Marketplace open enrollment opens (2028 coverage)||e|https://www.healthcare.gov/glossary/open-enrollment-period/
2027-11-01||employer|Employer open enrollment season||e|https://www.healthcare.gov/glossary/open-enrollment-period/
2027-12-07||medicare|Medicare open enrollment ends||r|https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan
2027-12-15||acadl|Marketplace deadline for January 1, 2028 coverage||e|https://www.healthcare.gov/quick-guide/dates-and-deadlines/
# Crypto
2027-01-18||crypto|GENIUS Act stablecoin law takes effect|The 2025 payment-stablecoin law takes effect 18 months after enactment, since final rules came too late to start it earlier.|r|https://www.govinfo.gov/content/pkg/COMPS-18221/pdf/COMPS-18221.pdf
2027-02-16||crypto1099|First Form 1099-DA with cost basis|For crypto bought after 2025 and sold in 2026 at a broker. Check it against your own records.|r|https://www.irs.gov/instructions/i1099da
2028-04-11||halving|Bitcoin halving (estimate)|At block 1,050,000 the reward drops from 3.125 to 1.5625 BTC. About April 2028, give or take several weeks.|e|https://mempool.space/api/blocks/tip/height

# Added after fact-check: estimates for unpublished schedules and other dates
2026-11-02|9:45 am ET|spgpmi|S&P Global US Manufacturing PMI (final October)||c|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2026-11-04|9:45 am ET|spgpmi|S&P Global US Services PMI (final October)||c|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2026-11-03||election|US midterm Election Day|Federal law sets it on the first Tuesday after the first Monday in November. Stock and bond markets are open.|c|https://www.law.cornell.edu/uscode/text/2/7
2026-11-01||dst|Clocks fall back: daylight saving time ends|US market hours stay 9:30 am to 4:00 pm ET. Europe changed its clocks on October 25, so the gap to London and Frankfurt is an hour shorter for one week.|c|https://www.nist.gov/pml/time-and-frequency-division/popular-links/daylight-saving-time-dst
2027-03-14||dst|Clocks spring forward: daylight saving time begins|US market hours stay 9:30 am to 4:00 pm ET. Europe changes its clocks on March 28, so for two weeks the gap to European markets is an hour shorter.|c|https://www.nist.gov/pml/time-and-frequency-division/popular-links/daylight-saving-time-dst
2027-02-01||fedtalk|Fed chair testimony to Congress (February, date not set)|The chair delivers the semiannual Monetary Policy Report each February and June or July; the 2027 dates are not scheduled yet.|e|https://www.federalreserve.gov/monetarypolicy/publications/mpr_default.htm
2027-07-01||fedtalk|Fed chair testimony to Congress (June or July, date not set)|In 2026 the chair testified on July 14.|e|https://www.federalreserve.gov/monetarypolicy/publications/mpr_default.htm
2027-08-26||jackson|Jackson Hole symposium (expected late August)|Not announced yet; the 2026 symposium ran August 27 to 29.|e|https://www.kansascityfed.org/research/jackson-hole-economic-symposium/jackson-hole-faqs/
2027-09-15||forms|Extended partnership and S-corp returns due|For calendar-year partnerships and S corporations that filed an extension; also the Q3 estimated tax date.|r|https://www.irs.gov/publications/p509
2027-01-05|10:00 am ET|jolts|JOLTS job openings (November), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-02-02|10:00 am ET|jolts|JOLTS job openings (December), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-03-02|10:00 am ET|jolts|JOLTS job openings (January), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-04-06|10:00 am ET|jolts|JOLTS job openings (February), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-05-04|10:00 am ET|jolts|JOLTS job openings (March), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-06-01|10:00 am ET|jolts|JOLTS job openings (April), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-07-06|10:00 am ET|jolts|JOLTS job openings (May), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-08-03|10:00 am ET|jolts|JOLTS job openings (June), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-09-07|10:00 am ET|jolts|JOLTS job openings (July), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-10-05|10:00 am ET|jolts|JOLTS job openings (August), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-11-02|10:00 am ET|jolts|JOLTS job openings (September), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-12-07|10:00 am ET|jolts|JOLTS job openings (October), date not set|BLS has not published 2027 JOLTS dates. Recent releases came on a Tuesday about five weeks after the month; this is the usual window.|e|https://www.bls.gov/schedule/news_release/jolts.htm
2027-01-08|10:00 am ET|umich|Consumer sentiment, preliminary (January), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-01-22|10:00 am ET|umich|Consumer sentiment, final (January), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-02-12|10:00 am ET|umich|Consumer sentiment, preliminary (February), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-02-26|10:00 am ET|umich|Consumer sentiment, final (February), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-03-12|10:00 am ET|umich|Consumer sentiment, preliminary (March), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-03-25|10:00 am ET|umich|Consumer sentiment, final (March), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-04-09|10:00 am ET|umich|Consumer sentiment, preliminary (April), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-04-23|10:00 am ET|umich|Consumer sentiment, final (April), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-05-14|10:00 am ET|umich|Consumer sentiment, preliminary (May), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-05-28|10:00 am ET|umich|Consumer sentiment, final (May), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-06-11|10:00 am ET|umich|Consumer sentiment, preliminary (June), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-06-25|10:00 am ET|umich|Consumer sentiment, final (June), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-07-09|10:00 am ET|umich|Consumer sentiment, preliminary (July), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-07-23|10:00 am ET|umich|Consumer sentiment, final (July), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-08-13|10:00 am ET|umich|Consumer sentiment, preliminary (August), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-08-27|10:00 am ET|umich|Consumer sentiment, final (August), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-09-10|10:00 am ET|umich|Consumer sentiment, preliminary (September), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-09-24|10:00 am ET|umich|Consumer sentiment, final (September), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-10-08|10:00 am ET|umich|Consumer sentiment, preliminary (October), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-10-22|10:00 am ET|umich|Consumer sentiment, final (October), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-11-12|10:00 am ET|umich|Consumer sentiment, preliminary (November), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-11-19|10:00 am ET|umich|Consumer sentiment, final (November), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-12-10|10:00 am ET|umich|Consumer sentiment, preliminary (December), date not set|The 2027 schedule is not out. The preliminary reading usually comes on the second Friday.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2027-12-17|10:00 am ET|umich|Consumer sentiment, final (December), date not set|Usually the fourth Friday, earlier in November and December because of holidays.|e|https://fred.stlouisfed.org/releases/calendar?rid=91&y=2027
2026-11-23|9:45 am ET|flashpmi|S&P Global flash US PMI (November), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2026-12-22|9:45 am ET|flashpmi|S&P Global flash US PMI (December), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-01-22|9:45 am ET|flashpmi|S&P Global flash US PMI (January), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-02-22|9:45 am ET|flashpmi|S&P Global flash US PMI (February), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-03-22|9:45 am ET|flashpmi|S&P Global flash US PMI (March), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-04-22|9:45 am ET|flashpmi|S&P Global flash US PMI (April), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-05-21|9:45 am ET|flashpmi|S&P Global flash US PMI (May), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-06-22|9:45 am ET|flashpmi|S&P Global flash US PMI (June), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-07-22|9:45 am ET|flashpmi|S&P Global flash US PMI (July), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-08-23|9:45 am ET|flashpmi|S&P Global flash US PMI (August), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-09-22|9:45 am ET|flashpmi|S&P Global flash US PMI (September), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-10-22|9:45 am ET|flashpmi|S&P Global flash US PMI (October), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-11-22|9:45 am ET|flashpmi|S&P Global flash US PMI (November), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
2027-12-22|9:45 am ET|flashpmi|S&P Global flash US PMI (December), date not set|S&P Global has not posted this date yet; flash PMIs usually come in the third or fourth week of the month.|e|https://www.pmi.spglobal.com/Public/Release/ReleaseDates
`;

  const STATUS = { c: 'confirmed', r: 'rule', e: 'estimate' };
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };

  let _id = 0;
  function mk(d, time, kind, title, note, st, src, extra) {
    const k = KINDS[kind] || KINDS.note;
    return Object.assign({ id: 'ev' + (++_id), d, time: time || '', kind, cat: k.cat, title: title || k.title, note: note || '', status: STATUS[st] || st || 'confirmed', src: src || '', lesson: k.lesson || '' }, extra || {});
  }
  const events = [];
  RAW.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).forEach((l) => {
    const p = l.split('|').map((x) => x.trim());
    if (p.length < 6) return;
    events.push(mk(p[0], p[1], p[2], p[3], p[4], p[5], p[6] || ''));
  });
  /* weekly releases, generated from the published rules (holiday shifts listed in WEEKLY_SHIFT) */
  const WEEKLY_SHIFT = { // usual date -> [moved date, time, status]
    'eia:2026-11-11': ['2026-11-12', '12:00 pm ET', 'c'], 'eia:2027-01-20': ['2027-01-21', '12:00 pm ET', 'r'], 'eia:2027-02-17': ['2027-02-18', '12:00 pm ET', 'r'],
    'eia:2027-06-02': ['2027-06-03', '12:00 pm ET', 'r'], 'eia:2027-07-07': ['2027-07-08', '12:00 pm ET', 'r'], 'eia:2027-09-08': ['2027-09-09', '12:00 pm ET', 'r'], 'eia:2027-10-13': ['2027-10-14', '12:00 pm ET', 'r'],
    'claims:2026-11-26': ['2026-11-25', '8:30 am ET', 'e'], 'claims:2026-12-24': ['2026-12-24', '8:30 am ET', 'e', 'Expected on the usual Thursday; it moves if federal offices close on Christmas Eve.'], 'claims:2027-11-11': ['2027-11-10', '8:30 am ET', 'e'], 'claims:2027-11-25': ['2027-11-24', '8:30 am ET', 'e'],
  };
  (function weekly() {
    let d = parse('2026-10-21');
    const end = parse('2027-12-31');
    while (d <= end) {
      const s = iso(d), wd = d.getDay();
      if (wd === 4) { const sh = WEEKLY_SHIFT['claims:' + s]; events.push(mk(sh ? sh[0] : s, sh ? sh[1] : '8:30 am ET', 'claims', '', sh ? (sh[3] || 'Moved to Wednesday because Thursday is a federal holiday.') : '', sh ? sh[2] : 'r', 'https://www.dol.gov/ui/data.pdf', { weekly: true })); }
      if (wd === 3) { const sh = WEEKLY_SHIFT['eia:' + s]; events.push(mk(sh ? sh[0] : s, sh ? sh[1] : '10:30 am ET', 'eia', '', sh ? 'Moved to Thursday noon after a federal holiday.' : '', sh ? sh[2] : 'r', 'https://www.eia.gov/petroleum/supply/weekly/schedule.php', { weekly: true })); }
      d.setDate(d.getDate() + 1);
    }
  })();
  events.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.weekly ? 1 : 0) - (b.weekly ? 1 : 0)));
  SML.calendarEvents = events;
  const DATA_START = '2026-10-21', DATA_END = '2027-12-31'; // halving estimate sits beyond, in April 2028

  /* ---------------- helpers ---------------- */
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayISO = () => iso(new Date());
  const longDate = (s) => { const d = parse(s); return `${WDL[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
  const shortDate = (s) => { const d = parse(s); return `${MON[d.getMonth()].slice(0, 3)} ${d.getDate()}`; };
  const stLabel = { confirmed: 'Confirmed', rule: 'By rule', estimate: 'Estimate' };
  const stPill = (st) => `<span class="xc-st ${st}">${stLabel[st] || st}</span>`;
  const isClosed = (s) => events.some((e) => e.d === s && e.kind === 'holiday');

  /* ---------------- .ics export ---------------- */
  function icsEscape(t) { return String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) { const out = []; let s = line; while (s.length > 60) { out.push(s.slice(0, 60)); s = ' ' + s.slice(60); } out.push(s); return out.join('\r\n'); }
  function parseTime(t) { const m = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(t || ''); if (!m) return null; let h = Number(m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return [h, Number(m[2])]; }
  function toICS(list, name) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Stock Market Lessons//Investor Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + icsEscape(name || 'Investor calendar'), 'X-WR-TIMEZONE:America/New_York',
      'BEGIN:VTIMEZONE', 'TZID:America/New_York', 'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0400', 'TZNAME:EDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT', 'BEGIN:STANDARD', 'TZOFFSETFROM:-0400', 'TZOFFSETTO:-0500', 'TZNAME:EST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD', 'END:VTIMEZONE'];
    list.forEach((e) => {
      const k = KINDS[e.kind] || {}; const ymd = e.d.replace(/-/g, ''); const tm = parseTime(e.time);
      const desc = [e.note, k.what, k.why ? 'Why it matters: ' + k.why : '', 'Status: ' + (stLabel[e.status] || e.status) + '.', e.src ? 'Source: ' + e.src : ''].filter(Boolean).join('\n');
      L.push('BEGIN:VEVENT', 'UID:' + e.kind + '-' + ymd + '-' + e.id + '@stockmarketlessons', 'DTSTAMP:' + stamp);
      if (tm) { const st = `${ymd}T${pad(tm[0])}${pad(tm[1])}00`; const en = new Date(2000, 0, 1, tm[0], tm[1] + (e.kind === 'fomc' || e.kind === 'fomcsep' ? 90 : 30)); L.push('DTSTART;TZID=America/New_York:' + st, 'DTEND;TZID=America/New_York:' + `${ymd}T${pad(en.getHours())}${pad(en.getMinutes())}00`); }
      else { L.push('DTSTART;VALUE=DATE:' + ymd, 'DTEND;VALUE=DATE:' + addDays(e.d, 1).replace(/-/g, ''), 'TRANSP:TRANSPARENT'); }
      L.push('SUMMARY:' + icsEscape(e.title + (e.status !== 'confirmed' ? ` (${(stLabel[e.status] || '').toLowerCase()})` : '')), 'DESCRIPTION:' + icsEscape(desc), 'CATEGORIES:' + icsEscape((CAT[e.cat] || {}).label || ''), 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.map(fold).join('\r\n') + '\r\n';
  }
  let dlCap = null, dlAsked = false;
  function askDownloads(cb) {
    if (dlCap) { cb(dlCap); return; }
    if (dlAsked) { cb(null); return; }
    dlAsked = true;
    try { if (window.claude && typeof window.claude.use === 'function') { window.claude.use('downloads').then((d) => { dlCap = d || null; cb(dlCap); }).catch(() => cb(null)); return; } } catch (e) {}
    cb(null);
  }
  function blobSave(filename, text) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = filename; a.rel = 'noopener'; a.style.display = 'none';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      SML.toast('Calendar file ready: ' + filename);
    } catch (e) { SML.toast('Download blocked here. Try opening the page in a browser tab.'); }
  }
  function saveICS(filename, list, name) {
    if (!list.length) { SML.toast('No events match your filters.'); return; }
    const text = toICS(list, name);
    askDownloads((dl) => {
      if (dl && typeof dl.save === 'function') {
        dl.save({ filename, data: text }).then(() => SML.toast('Saved ' + filename)).catch((err) => { const c = err && err.code; if (c === 'declined') return; if (c === 'rate_limited') { SML.toast('A save is already waiting for you.'); return; } blobSave(filename, text); });
      } else blobSave(filename, text);
    });
  }
  SML.calendarICS = toICS;

  /* ---------------- detail block ---------------- */
  function detailHTML(e) {
    const k = KINDS[e.kind] || {}; const c = CAT[e.cat] || {};
    const lesson = e.lesson && SML.lessons.find((l) => l.id === e.lesson);
    return `<div class="xc-det" data-cat="${e.cat}">
      <p class="when">${longDate(e.d)}${e.time ? ' · ' + esc(e.time) : ''}</p>
      <h4>${esc(e.title)}</h4>
      <div class="pills"><span class="catp" data-cat="${e.cat}"><i class="xc-dot"></i>${esc(c.label || '')}</span>${stPill(e.status)}${isClosed(e.d) && e.kind !== 'holiday' ? '<span class="xc-st">Market closed</span>' : ''}</div>
      ${e.note ? `<p style="font-size:14px;line-height:1.55;color:var(--ink)">${esc(e.note)}</p>` : ''}
      <dl>${k.what ? `<div><dt>What it is</dt><dd>${esc(k.what)}</dd></div>` : ''}${k.why ? `<div><dt>Why it matters</dt><dd>${esc(k.why)}</dd></div>` : ''}${k.react ? `<div><dt>How markets often react</dt><dd>${esc(k.react)}</dd></div>` : ''}</dl>
      ${e.status !== 'confirmed' ? `<p class="note">${e.status === 'rule' ? 'Date worked out from the publisher’s standing rule; check the official schedule closer to the day.' : 'Approximate date. Check closer to the time.'}</p>` : ''}
      <div class="lnk">${lesson ? `<a href="#${lesson.id}">Lesson: ${esc(lesson.title)}</a>` : ''}${e.src ? `<a href="${esc(e.src)}" target="_blank" rel="noopener noreferrer">Official source</a>` : ''}</div>
      <div><button type="button" class="btn btn-g" data-ics="${e.id}" style="min-height:38px">Add to my calendar (.ics)</button></div>
    </div>`;
  }

  /* ---------------- the page ---------------- */
  const PREF = 'cal:prefs';
  function loadPrefs() { const p = SML.store.get(PREF, null); const on = {}; CATS.forEach((c) => { on[c.k] = !p || !p.on || p.on[c.k] !== false; }); const acctWeekly = SML.account ? !!SML.account.get().prefs.weeklyOnCalendar : false; return { on, weekly: p && typeof p.weekly === 'boolean' ? p.weekly : acctWeekly }; }
  function savePrefs(pr) { SML.store.set(PREF, { on: pr.on, weekly: pr.weekly }); }

  SML.pages.calendar = function (view) {
    const prefs = loadPrefs();
    const tISO = todayISO();
    const phone = (() => { try { return window.matchMedia('(max-width: 719px)').matches; } catch (e) { return false; } })();
    const startISO = tISO < DATA_START ? DATA_START : tISO > DATA_END ? DATA_START : tISO;
    const st = { y: parse(startISO).getFullYear(), m: parse(startISO).getMonth(), sel: startISO, ev: null, view: phone ? 'agenda' : 'month', ag: 3 };
    const visible = (e) => prefs.on[e.cat] && (prefs.weekly || !e.weekly);
    const upcoming = events.filter((e) => e.d >= tISO && !e.weekly);
    const nextFed = upcoming.find((e) => e.kind === 'fomc' || e.kind === 'fomcsep');
    const nextCPI = upcoming.find((e) => e.kind === 'cpi');
    const nextTax = upcoming.find((e) => ['esttax', 'filing', 'yearend', 'contrib', 'forms', 'extension'].includes(e.kind));
    const daysTo = (e) => (e ? Math.round((parse(e.d) - parse(tISO)) / 864e5) : null);
    const statTile = (e, lab) => (e ? `<div><b>${daysTo(e) === 0 ? 'Today' : daysTo(e) + 'd'}</b><span>${lab} · ${shortDate(e.d)}</span></div>` : '');
    view.innerHTML = `
      ${SML.pageHeader('', 'Market &amp; tax calendar', 'Every date that <em>moves</em> your money', `<p>Fed meetings, inflation and jobs reports, PMI, options expiration, market holidays, tax deadlines and open enrollment, from October 2026 through December 2027. Tap any date to see why it matters.</p>
        <div class="xc-hdr-stats">${statTile(nextFed, 'Next Fed decision')}${statTile(nextCPI, 'Next CPI')}${statTile(nextTax, 'Next tax date')}</div>`)}
      <div class="xc"><div class="wrap">
        <div class="xc-tools">
          ${ui.chips('xc-cats', CATS.map((c) => ({ k: c.k, label: c.short, color: CC[c.k], on: prefs.on[c.k] })))}
          <label class="xc-wk"><input type="checkbox" id="xc-weekly"${prefs.weekly ? ' checked' : ''}> Weekly releases</label>
        </div>
        <div class="xc-tools" style="border-bottom:0;padding-bottom:0">
          <div class="xc-nav"><button type="button" data-nav="-1" aria-label="Previous month">‹</button><span class="xc-mlabel" id="xc-ml" aria-live="polite"></span><button type="button" data-nav="1" aria-label="Next month">›</button><button type="button" data-nav="0">Today</button></div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${ui.seg('xc-view', [{ v: 'month', label: 'Month' }, { v: 'agenda', label: 'Agenda' }], st.view, 'View')}
          <button type="button" class="btn btn-p" id="xc-export" style="min-height:38px">Export to calendar (.ics)</button></div>
        </div>
        <div class="xc-main">
          <div id="xc-body" style="min-width:0"></div>
          <aside class="xc-side">
            <section class="xc-panel" id="xc-detail" aria-live="polite"></section>
            <section class="xc-panel xc-p-next"><h3><span>Next 7 days</span><span class="note" style="letter-spacing:.08em">${shortDate(tISO)} →</span></h3><ul class="xc-list" id="xc-next"></ul></section>
          </aside>
        </div>
        <section style="padding-bottom:72px;display:flex;flex-direction:column;gap:18px" aria-labelledby="xc-rh">
          ${SML.chapHead('', 'The rhythm behind the dates', 'Most releases follow a published rule, so you can plan months ahead.', SML.more('#l-key-dates', 'Lesson: the investor’s calendar'), 'xc-rh')}
          <div class="xc-rules">${[
            ['data', 'First business day', 'ISM Manufacturing PMI at 10:00 am ET. ISM Services follows on the third business day.'],
            ['data', 'First Friday', 'The jobs report at 8:30 am ET (moved when the schedule needs it).'],
            ['data', 'Around the middle of the month', 'CPI and PPI inflation, then retail sales, all at 8:30 am ET.'],
            ['data', 'Last week of the month', 'PCE inflation, and GDP in the month after each quarter ends.'],
            ['fed', 'Eight times a year', 'FOMC decisions at 2:00 pm ET; dot plot in March, June, September and December. Minutes three weeks later.'],
            ['markets', 'Third Friday', 'Monthly options expire; in March, June, September and December it is quad witching.'],
            ['data', 'Every week', 'Jobless claims Thursday 8:30 am ET; EIA oil inventories Wednesday 10:30 am ET.'],
            ['tax', 'Every quarter', 'Estimated taxes in mid-January, April, June and September; filing in mid-April; year-end moves by December 31.'],
            ['benefits', 'Social Security paydays', 'The 2nd, 3rd or 4th Wednesday, depending on your birthday (1st–10th, 11th–20th, 21st–31st). People entitled before May 1997 are paid on the 3rd; payments move earlier when a date falls on a weekend or holiday.'],
          ].map(([c, h, p]) => `<div data-cat="${c}"><b><i class="xc-dot"></i>${h}</b><p>${p}</p></div>`).join('')}</div>
          <p class="xc-cov">Dates come from official schedules (Federal Reserve, BLS, BEA, Census, ISM, NYSE, IRS, CMS, HealthCare.gov) checked on October 21, 2026. <b>Confirmed</b> means published by the agency; <b>By rule</b> means worked out from its standing rule; <b>Estimate</b> means approximate. Agencies sometimes move dates, so check the source link before you act. Times are Eastern.</p>
        </section>
      </div></div>`;
    const body = $('#xc-body', view), detail = $('#xc-detail', view), nextEl = $('#xc-next', view), ml = $('#xc-ml', view);
    const wired = ui.wire(view, (ev) => {
      const t = ev && ev.target;
      if (t && t.closest && t.closest('#xc-view')) { st.view = wired.seg('xc-view'); render(); return; }
      if (t && t.closest && t.closest('#xc-cats')) { CATS.forEach((c) => { prefs.on[c.k] = wired.on('xc-cats', c.k); }); savePrefs(prefs); render(); }
    });
    $('#xc-weekly', view).addEventListener('change', (e) => { prefs.weekly = e.target.checked; savePrefs(prefs); render(); });
    $$('[data-nav]', view).forEach((b) => b.addEventListener('click', () => {
      const n = Number(b.dataset.nav);
      st.ag = 3;
      if (!n) { const t = parse(startISO); st.y = t.getFullYear(); st.m = t.getMonth(); st.sel = startISO; st.ev = null; }
      else { st.m += n; if (st.m < 0) { st.m = 11; st.y--; } if (st.m > 11) { st.m = 0; st.y++; } }
      render();

    }));
    $('#xc-export', view).addEventListener('click', () => {
      const list = events.filter((e) => visible(e) && e.d >= tISO);
      saveICS('investor-calendar.ics', list, 'Investor calendar');
    });
    $('.xc', view).addEventListener('click', (e) => {
      if (e.target.closest('[data-more]')) { st.ag += 3; render(); return; }
      const ib = e.target.closest('[data-ics]'); if (ib) { const ev = events.find((x) => x.id === ib.dataset.ics); if (ev) saveICS(`${ev.kind}-${ev.d}.ics`, [ev], ev.title); return; }
      const cell = e.target.closest('.xc-cell'); if (cell) { st.sel = cell.dataset.d; const evs = events.filter((x) => x.d === st.sel && visible(x)); st.ev = evs.length === 1 ? evs[0].id : null; const d = parse(st.sel); if (d.getMonth() !== st.m) { st.m = d.getMonth(); st.y = d.getFullYear(); } render(); if (window.innerWidth < 1100) detail.scrollIntoView({ behavior: SML.reduced() ? 'auto' : 'smooth', block: 'nearest' }); return; }
      const row = e.target.closest('[data-ev]'); if (row) { const ev = events.find((x) => x.id === row.dataset.ev); if (ev) { st.ev = st.view === 'agenda' && st.ev === ev.id ? null : ev.id; st.sel = ev.d; render(); if (row.closest('#xc-next') && window.innerWidth < 1100) detail.scrollIntoView({ behavior: SML.reduced() ? 'auto' : 'smooth', block: 'nearest' }); } }
    });

    function rowHTML(e, withDate, opts) {
      const d = parse(e.d);
      return `<li><button type="button" class="xc-row${st.ev === e.id ? ' on' : ''}" data-ev="${e.id}" data-cat="${e.cat}" aria-expanded="${st.ev === e.id}">
        <span class="d">${withDate ? `${WD[d.getDay()]}<b>${d.getDate()}</b>` : `${WD[d.getDay()]}`}</span>
        <span class="t"><b><i class="xc-dot"></i><span>${esc(e.title)}</span></b><small>${e.time ? esc(e.time) + ' · ' : ''}${esc((CAT[e.cat] || {}).label || '')}${e.note ? ' · ' + esc(e.note) : ''}</small></span>
        ${opts && opts.st ? `<span>${stPill(e.status)}</span>` : ''}
      </button>${opts && opts.inline && st.ev === e.id ? `<div class="xc-inl">${detailHTML(e)}</div>` : ''}</li>`;
    }
    function monthHTML() {
      const first = new Date(st.y, st.m, 1, 12); const start = new Date(first); start.setDate(1 - first.getDay());
      const cells = [];
      for (let i = 0; i < 42; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i); const s = iso(d);
        if (i >= 35 && d.getMonth() !== st.m) break;
        const evs = events.filter((e) => e.d === s && visible(e));
        const hol = events.find((e) => e.d === s && (e.kind === 'holiday' || e.kind === 'early'));
        const show = evs.filter((e) => e.kind !== 'holiday' && e.kind !== 'early');
        const lim = 3;
        cells.push(`<button type="button" class="xc-cell${d.getMonth() !== st.m ? ' out' : ''}${s === tISO ? ' today' : ''}${s === st.sel ? ' sel' : ''}" data-d="${s}" aria-label="${longDate(s)}: ${evs.length} event${evs.length === 1 ? '' : 's'}">
          <span class="dn"><b>${d.getDate()}</b>${hol && prefs.on.markets ? `<span class="hol">${hol.kind === 'holiday' ? 'Closed' : 'Early close'}</span>` : ''}</span>
          ${show.slice(0, lim).map((e) => `<span class="xc-ev${e.status !== 'confirmed' ? ' rule' : ''}" data-cat="${e.cat}"><span>${esc(e.title)}</span></span>`).join('')}
          ${show.length > lim ? `<span class="xc-more">+${show.length - lim} more</span>` : ''}
          <span class="xc-dots">${evs.slice(0, 6).map((e) => `<i class="xc-dot" data-cat="${e.cat}"></i>`).join('')}</span>
        </button>`);
      }
      return `<div class="xc-grid" role="grid" aria-label="${MON[st.m]} ${st.y}">${WD.map((w) => `<span class="xc-wd">${w}</span>`).join('')}${cells.join('')}</div>`;
    }
    function agendaHTML() {
      const mStart = `${st.y}-${pad(st.m + 1)}-01`;
      const from = mStart > tISO ? mStart : (tISO.slice(0, 7) === mStart.slice(0, 7) ? tISO : mStart);
      const endD = new Date(st.y, st.m + st.ag, 1, 12); const to = iso(endD);
      const all = events.filter((e) => visible(e) && e.d >= from);
      const list = all.filter((e) => e.d < to);
      const rest = all.length - list.length;
      if (!list.length && !rest) return '<p class="xc-empty">Nothing matches these filters from here on.</p>';
      const by = {};
      list.forEach((e) => { const k = e.d.slice(0, 7); (by[k] = by[k] || []).push(e); });
      return `<div class="xc-agenda">${Object.keys(by).map((k) => { const [y, m] = k.split('-').map(Number); return `<section data-month="${k}"><h3 class="mh">${MON[m - 1]} ${y}</h3><ul class="xc-list">${by[k].map((e) => rowHTML(e, true, { st: true, inline: true })).join('')}</ul></section>`; }).join('') || '<p class="xc-empty">Nothing in these months with your filters.</p>'}
        ${rest ? `<button type="button" class="btn btn-g" data-more="1" style="align-self:flex-start">Show three more months <span class="note">(${rest} later dates)</span></button>` : ''}</div>`;
    }
    function render() {
      ml.textContent = `${MON[st.m].slice(0, 3)} ${st.y}`;
      body.innerHTML = st.view === 'month' ? monthHTML() : agendaHTML();
      // detail panel
      detail.hidden = st.view === 'agenda' && window.innerWidth < 1100;
      const dayEvs = events.filter((e) => e.d === st.sel && visible(e));
      const ev = st.ev && events.find((e) => e.id === st.ev);
      if (ev && st.view === 'month') detail.innerHTML = detailHTML(ev);
      else if (st.view === 'month') detail.innerHTML = `<h3><span>${longDate(st.sel)}</span></h3>${dayEvs.length ? `<ul class="xc-list">${dayEvs.map((e) => rowHTML(e, false, { st: true })).join('')}</ul>` : `<p class="xc-empty">${isClosed(st.sel) ? 'Markets closed.' : 'Nothing scheduled in your filters. Pick another day.'}</p>`}`;
      else detail.innerHTML = ev ? detailHTML(ev) : `<h3><span>How to use it</span></h3><p class="xc-empty">Tap any row to open why it matters and how markets often react. Use the colored chips to filter, and export what you see to Google, Apple or Outlook calendar.</p>`;
      const in7 = events.filter((e) => visible(e) && !e.weekly && e.d >= tISO && e.d <= addDays(tISO, 7));
      const wk = events.filter((e) => e.weekly && e.d >= tISO && e.d <= addDays(tISO, 7) && prefs.on[e.cat]);
      nextEl.innerHTML = (in7.length ? in7.map((e) => rowHTML(e, true)).join('') : '<li class="xc-empty">Nothing big in the next seven days with these filters.</li>') + (wk.length && !prefs.weekly ? `<li class="xc-empty" style="font-size:12.5px">Plus ${wk.length} weekly release${wk.length === 1 ? '' : 's'} (jobless claims, oil inventories). Tick “Weekly releases” to show them.</li>` : '');
    }
    render();
    return 'Calendar';
  };

  /* ---------------- keyDates widget (lesson) ---------------- */
  const RHYTHM = [
    { k: 'ismm', label: 'ISM Manufacturing', short: 'ISM Mfg', cat: 'data', lo: 1, hi: 3, rule: 'First business day, 10:00 am ET' },
    { k: 'isms', label: 'ISM Services', short: 'ISM Svc', cat: 'data', lo: 3, hi: 6, rule: 'Third business day, 10:00 am ET' },
    { k: 'jolts', label: 'JOLTS openings', short: 'JOLTS', cat: 'data', lo: 1, hi: 10, rule: 'Early in the month, 10:00 am ET' },
    { k: 'jobs', label: 'Jobs report', short: 'Jobs', cat: 'data', lo: 1, hi: 10, rule: 'Usually the first Friday, 8:30 am ET' },
    { k: 'cpi', label: 'CPI inflation', short: 'CPI', cat: 'data', lo: 10, hi: 16, rule: 'Around mid-month, 8:30 am ET' },
    { k: 'ppi', label: 'PPI inflation', short: 'PPI', cat: 'data', lo: 9, hi: 17, rule: 'Near CPI, 8:30 am ET' },
    { k: 'retail', label: 'Retail sales', short: 'Retail', cat: 'data', lo: 13, hi: 18, rule: 'Mid-month, 8:30 am ET' },
    { k: 'opex', label: 'Options expiration', short: 'OPEX', cat: 'markets', lo: 15, hi: 21, rule: 'Third Friday at the close' },
    { k: 'flashpmi', label: 'Flash PMI', short: 'Flash PMI', cat: 'data', lo: 19, hi: 25, rule: 'Late month, 9:45 am ET' },
    { k: 'pce', label: 'PCE inflation', short: 'PCE', cat: 'data', lo: 22, hi: 31, rule: 'Late in the month, 8:30 am ET' },
    { k: 'gdp', label: 'GDP', short: 'GDP', cat: 'data', lo: 22, hi: 31, rule: 'Late month (advance: month after the quarter)' },
    { k: 'fomc', label: 'Fed decision', short: 'FOMC', cat: 'fed', lo: 0, hi: 0, rule: 'Eight meetings a year, 2:00 pm ET' },
  ];
  SML.widgets.keyDates = function (root) {
    const id = SML.uid('kd');
    const tISO = todayISO();
    const base = tISO < DATA_START || tISO > DATA_END ? DATA_START : tISO;
    const months = []; { const d = parse(base); d.setDate(1); for (let i = 0; i < 4; i++) { months.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`); d.setMonth(d.getMonth() + 1); } }
    const mlabel = (k) => { const [y, m] = k.split('-').map(Number); return `${MON[m - 1].slice(0, 3)} ${String(y).slice(2)}`; };
    root.classList.add('xcl');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'm', label: 'Monthly rhythm' }, { v: 'y', label: 'Year at a glance' }], 'm', 'View')}<span class="grow"></span><span id="${id}-mw">${ui.seg(id + '-mo', months.map((k) => ({ v: k, label: mlabel(k) })), months[0], 'Month')}</span></div>
      <div class="wg-fig"></div>
      <div class="xcl-leg" id="${id}-leg"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <ul class="xcl-list" id="${id}-list"></ul>
      <div class="wg-note">Bands show the usual window for each release; dots are the real dates for the month you pick. Tap a row or a month for details. Full list on the <a href="#calendar">calendar page</a>.</div>`;
    const fig = root.querySelector('.wg-fig'), msg = $('#' + id + '-msg', root), list = $('#' + id + '-list', root), leg = $('#' + id + '-leg', root);
    let pick = null, ypick = null;
    const st = ui.wire(root, () => { pick = null; ypick = null; draw(); });
    root.addEventListener('click', (e) => {
      const r = e.target.closest('[data-row]'); if (r) { pick = r.dataset.row; draw(); return; }
      const m = e.target.closest('[data-ym]'); if (m) { ypick = Number(m.dataset.ym); draw(); }
    });
    const draw = ui.responsive(fig, (W) => {
      const v = st.seg(id + '-v') || 'm';
      $('#' + id + '-mw', root).hidden = v !== 'm';
      if (v === 'm') drawMonth(W); else drawYear(W);
    });
    function drawMonth(W) {
      const mk = st.seg(id + '-mo') || months[0];
      const [y, m] = mk.split('-').map(Number);
      const dim = new Date(y, m, 0).getDate();
      const compact = W < 520;
      const L = compact ? 70 : 150, R = 14, top = 34, rowH = compact ? 24 : 26;
      const H = top + RHYTHM.length * rowH + 28;
      const x = SML.lin(1, dim, L + 6, W - R - 6);
      const cw = (W - R - L) / dim;
      let b = '';
      // weekends + weekly ticks
      for (let d = 1; d <= dim; d++) {
        const dt = new Date(y, m - 1, d, 12); const wd = dt.getDay(); const s = iso(dt);
        if (wd === 0 || wd === 6 || isClosed(s)) b += S.rect(x(d) - cw / 2, top - 6, cw, RHYTHM.length * rowH + 6, 'f-shade', 0, ' opacity=".55"');
        if (wd === 4) b += S.circle(x(d), top - 14, 2.6, 'xc-f-data');
        if (wd === 3) b += S.circle(x(d), top - 14, 2.6, 'xc-f-energy');
      }
      b += S.text(L - 8, top - 10, compact ? 'weekly' : 'weekly: claims • oil', 'xs', 'end');
      RHYTHM.forEach((r, i) => {
        const yy = top + i * rowH + rowH / 2;
        const sel = pick === r.k;
        b += S.text(L - 8, yy + 4, compact ? r.short : r.label, (sel ? 'sm ink b' : 'sm'), 'end');
        b += S.line(L, yy, W - R, yy, 's-line');
        if (r.hi) b += S.rect(x(r.lo) - cw / 2, yy - 6, x(Math.min(r.hi, dim)) - x(r.lo) + cw, 12, `xc-f-${r.cat}`, 6, ' opacity=".32"');
        const real = events.filter((e) => e.kind === r.k || (r.k === 'fomc' && e.kind === 'fomcsep') || (r.k === 'opex' && e.kind === 'quad')).filter((e) => e.d.slice(0, 7) === mk);
        real.forEach((e) => { const d = parse(e.d).getDate(); b += S.circle(x(d), yy, sel ? 6.5 : 5.5, `xc-f-${r.cat}`) + (e.status !== 'confirmed' ? S.circle(x(d), yy, 2.2, 'f-bg') : ''); if (!compact || sel) b += S.text(x(d) + 9, yy - 7, String(d), 'xs ink b'); });
        b += `<rect x="0" y="${top + i * rowH}" width="${W}" height="${rowH}" fill="transparent" data-row="${r.k}" style="cursor:pointer"><title>${esc(r.label)}: ${esc(r.rule)}</title></rect>`;
      });
      [1, 8, 15, 22, dim].forEach((d) => { b += S.text(x(d), H - 8, String(d), 'xs', 'middle'); });
      const today = parse(todayISO()); if (today.getFullYear() === y && today.getMonth() === m - 1) { const tx = x(today.getDate()); b += S.line(tx, top - 6, tx, top + RHYTHM.length * rowH, 's-acc w15 dash2') + S.text(tx, H - 20, 'today', 'xs acc b', 'middle'); }
      fig.innerHTML = S.wrap(W, H, `Typical release windows and the real dates in ${MON[m - 1]} ${y}`, b);
      leg.innerHTML = ['data', 'fed', 'markets'].map((c) => `<span data-cat="${c}"><i class="xc-dot"></i>${CAT[c].label}</span>`).join('') + '<span>Hollow dot = by rule or estimate</span>';
      const r = RHYTHM.find((q) => q.k === pick);
      const inMonth = events.filter((e) => e.d.slice(0, 7) === mk && !e.weekly && e.cat !== 'energy');
      if (r) {
        const real = inMonth.filter((e) => e.kind === r.k || (r.k === 'fomc' && e.kind === 'fomcsep') || (r.k === 'opex' && e.kind === 'quad'));
        msg.innerHTML = ui.msg(r.cat === 'fed' ? 'acc' : r.cat === 'markets' ? 'vio' : 'info', r.short, `<b>${esc(r.label)}</b>: ${esc(r.rule)}. ${esc((KINDS[r.k] || {}).why || '')} ${real.length ? `In ${MON[m - 1]}: ${real.map((e) => shortDate(e.d)).join(', ')}.` : `None in ${MON[m - 1]}.`}`);
      } else msg.innerHTML = ui.msg('info', 'Rhythm', `Most months open with ISM and the jobs report, hit CPI around the middle, and close with PCE. Tap a row to see one release. ${MON[m - 1]} has ${inMonth.length} dated event${inMonth.length === 1 ? '' : 's'} below.`);
      list.innerHTML = inMonth.slice(0, 14).map((e) => `<li data-cat="${e.cat}"><span class="d"><b>${shortDate(e.d)}</b></span><span><i class="xc-dot"></i> ${esc(e.title)}${e.time ? ` <span class="note">${esc(e.time)}</span>` : ''}</span></li>`).join('') + (inMonth.length > 14 ? `<li><span></span><span><a href="#calendar">${inMonth.length - 14} more on the calendar page</a></span></li>` : '');
    }
    function drawYear(W) {
      const yr = (parse(todayISO()) > parse('2027-01-01') ? parse(todayISO()).getFullYear() : 2027);
      const rows = [
        { lab: 'Fed decisions', short: 'Fed', cat: 'fed', f: (e) => e.kind === 'fomc' || e.kind === 'fomcsep' },
        { lab: 'Inflation (CPI)', short: 'CPI', cat: 'data', f: (e) => e.kind === 'cpi' },
        { lab: 'Earnings season', short: 'Earnings', cat: 'earnings', band: [[0, 1], [3, 4], [6, 7], [9, 10]] },
        { lab: 'Quad witching', short: 'Quad', cat: 'markets', f: (e) => e.kind === 'quad' },
        { lab: 'Estimated taxes', short: 'Est. tax', cat: 'tax', f: (e) => e.kind === 'esttax' },
        { lab: 'Filing deadlines', short: 'Filing', cat: 'tax', f: (e) => e.kind === 'filing' || e.kind === 'extension' || e.kind === 'contrib' },
        { lab: 'Year-end moves', short: 'Year-end', cat: 'tax', f: (e) => e.kind === 'yearend' || e.kind === 'tlh' },
        { lab: 'Open enrollment', short: 'Enroll', cat: 'benefits', f: (e) => ['medicare', 'aca', 'acadl', 'employer', 'maoe'].includes(e.kind) },
      ];
      const compact = W < 520;
      const L = compact ? 66 : 130, R = 10, top = 30, rowH = compact ? 26 : 30;
      const H = top + rows.length * rowH + 16;
      const cw = (W - L - R) / 12;
      let b = '';
      for (let mi = 0; mi < 12; mi++) {
        const x0 = L + mi * cw;
        b += S.text(x0 + cw / 2, top - 12, compact ? MON[mi][0] : MON[mi].slice(0, 3), (ypick === mi ? 'xs ink b' : 'xs'), 'middle');
        if (ypick === mi) b += S.rect(x0, top - 4, cw, rows.length * rowH + 4, 'f-acc-t', 0, ' opacity=".6"');
      }
      rows.forEach((r, i) => {
        const yy = top + i * rowH + rowH / 2;
        b += S.text(L - 8, yy + 4, compact ? r.short : r.lab, 'sm', 'end') + S.line(L, yy, W - R, yy, 's-line');
        if (r.band) r.band.forEach(([a, z]) => { b += S.rect(L + a * cw + cw * 0.35, yy - 6, (z - a) * cw + cw * 0.3, 12, `xc-f-${r.cat}`, 6, ' opacity=".45"'); });
        else {
          const evs = events.filter((e) => r.f(e) && parse(e.d).getFullYear() === yr);
          evs.forEach((e) => { const d = parse(e.d); const xx = L + d.getMonth() * cw + ((d.getDate() - 0.5) / 31) * cw; b += S.circle(xx, yy, compact ? 4 : 5, `xc-f-${r.cat}`) + (e.status !== 'confirmed' ? S.circle(xx, yy, 1.8, 'f-bg') : ''); });
        }
      });
      for (let mi = 0; mi < 12; mi++) b += `<rect x="${L + mi * cw}" y="${top - 24}" width="${cw}" height="${rows.length * rowH + 24}" fill="transparent" data-ym="${mi}" style="cursor:pointer"><title>${MON[mi]} ${yr}</title></rect>`;
      fig.innerHTML = S.wrap(W, H, `Key dates across ${yr} by month`, b);
      leg.innerHTML = ['fed', 'data', 'earnings', 'markets', 'tax', 'benefits'].map((c) => `<span data-cat="${c}"><i class="xc-dot"></i>${CAT[c].label}</span>`).join('');
      if (ypick == null) {
        msg.innerHTML = ui.msg('acc', String(yr), 'Eight Fed meetings, four earnings seasons, four quad-witching days, four estimated-tax dates and one big December deadline. Tap a month to list what is in it.');
        list.innerHTML = '';
      } else {
        const evs = events.filter((e) => { if (e.weekly) return false; const d = parse(e.d); return d.getFullYear() === yr && d.getMonth() === ypick && (e.cat !== 'data' || e.kind === 'cpi' || e.kind === 'jobs'); });
        msg.innerHTML = ui.msg('acc', MON[ypick].slice(0, 3), `${MON[ypick]} ${yr}: ${evs.length} key dates (CPI and jobs included, other data on the calendar page).`);
        list.innerHTML = evs.slice(0, 16).map((e) => `<li data-cat="${e.cat}"><span class="d"><b>${shortDate(e.d)}</b></span><span><i class="xc-dot"></i> ${esc(e.title)}</span></li>`).join('');
      }
    }
  };

  /* ---------------- lesson ---------------- */
  SML.lessons.push({
    id: 'l-key-dates', course: 'econ', order: 7, title: 'The investor’s calendar', mins: 8, level: 'Beginner',
    summary: 'The monthly rhythm of data, the Fed’s meetings and the tax year in dates.',
    idea: 'Markets move on a schedule. Know which days carry big news so you can size, wait or act on purpose.',
    widget: 'keyDates', opts: {},
    try: 'Pick a month to see the real dates on the usual rhythm, then switch to the year view and tap a month.',
    body: [
      '<p>Markets run on a timetable. A handful of government reports, Fed meetings and expiration days cause most of the big <i>scheduled</i> moves, and almost all of them follow published rules. Put them in your calendar and you stop being surprised by the busiest minutes of the month. The full list, with export, is on the <a href="#calendar">calendar page</a>.</p>',
      '<h3>The monthly rhythm</h3><ul><li><b>First business day:</b> ISM Manufacturing PMI at 10:00 am ET. <b>Third business day:</b> ISM Services PMI.</li><li><b>Early in the month:</b> JOLTS job openings (10:00 am ET), then the <b>jobs report</b>, usually the first Friday at 8:30 am ET.</li><li><b>Around the middle:</b> CPI and PPI inflation, then retail sales, all at 8:30 am ET.</li><li><b>Third Friday:</b> monthly options expiration.</li><li><b>Late in the month:</b> flash PMIs, consumer confidence, PCE inflation, and GDP in the month after each quarter ends.</li><li><b>Every week:</b> jobless claims on Thursday at 8:30 am ET and EIA oil inventories on Wednesday at 10:30 am ET, moved when a holiday gets in the way.</li></ul><p>Most 8:30 am reports land an hour before the stock market opens at 9:30, so futures, bond yields and the dollar react first. See <a href="#l-data-day">trading data-release days</a> for how to handle them.</p>',
      '<h3>The Fed’s eight meetings</h3><p>The FOMC meets eight times a year, roughly every six weeks. Each meeting runs two days and ends with a statement at 2:00 pm ET and the chair’s press conference at 2:30 pm ET. The March, June, September and December meetings also publish the dot plot, each official’s rate forecast. Minutes follow three weeks after every meeting. More in <a href="#l-fed">how the Federal Reserve works</a>.</p>',
      '<h3>Expiration days and earnings seasons</h3><p>Standard monthly options expire on the third Friday (the Thursday before if that Friday is a market holiday). In March, June, September and December that same day is <b>quad witching</b>, one of the heaviest-volume days of the year. Earnings seasons start about two weeks after each quarter ends, when the big banks report first, and run for five to six weeks: mid-January, mid-April, mid-July and mid-October.</p>',
      '<h3>The tax year in dates</h3><ul><li><b>Estimated taxes</b> for income without withholding, such as trading gains: due around January 15, April 15, June 15 and September 15 (moved to the next business day when they fall on a weekend or holiday).</li><li><b>W-2s and many 1099s</b> arrive by the end of January; broker 1099-B forms by mid-February, often with corrections later. Heavy traders often wait before filing.</li><li><b>Filing deadline:</b> mid-April, or mid-October with an extension. An extension gives more time to file, not to pay.</li><li><b>IRA and HSA contributions</b> for last year are allowed until the April filing deadline, not the extension.</li><li><b>December 31:</b> last day to harvest losses or gains (the trade date counts), make Roth conversions, defer pay into a 401(k) and take required minimum distributions. Your very first RMD can wait until April 1 of the next year. See <a href="#l-tax-loss">tax-loss harvesting</a>.</li></ul>',
      '<h3>Benefits windows</h3><p>Medicare open enrollment runs from October 15 to December 7. The ACA marketplace opens on November 1; pick a plan by December 15 for coverage from January 1. Most employers run their benefits enrollment in October and November. The choices that lock in for the year are mainly your health plan and health FSA; you can usually change your 401(k) rate and HSA payroll contributions during the year, and an ESPP follows its own offering periods. Social Security announces next year’s cost-of-living increase each October.</p>',
      '<h3>How to use it</h3><ul><li>Every weekend, look at the week ahead: which days carry CPI, jobs or the Fed?</li><li>If you day trade, size down or stand aside for the first minutes after 8:30 am and 2:00 pm releases. Spreads widen and prices jump.</li><li>If you hold options, remember implied volatility climbs before big events and drops after (<a href="#l-iv-crush">IV crush</a>).</li><li>Do tax moves early in December, not on the last afternoon of the year.</li><li>Export the dates you care about to your phone’s calendar so the reminders come to you.</li></ul>',
    ],
    example: {
      title: 'Planning December 2026',
      intro: 'Maya trades part time with a $25,000 account and also invests for retirement. On Sunday, November 29 she spends ten minutes with the calendar.',
      steps: [
        'She filters Fed, Data, Markets and Tax and exports December to her phone. The busy stretch stands out: the jobs report on Friday, December 4, the Fed decision with a dot plot on Wednesday, December 9 at 2:00 pm ET, and CPI the next morning, December 10, at 8:30 am ET.',
        'She normally risks 1% per trade: 1% of $25,000 is $250. On December 4, 9 and 10 she halves that to $125 and waits 15 minutes after each release before entering.',
        'She does not open new option trades the day before December 9 or 10. Implied volatility usually rises into big events and drops right after, so buyers often lose to IV crush even when they guess the direction.',
        'She sells a fund with a $4,000 loss on Monday, December 14, not on December 31, and buys a similar fund that tracks a different index. The wash-sale window runs 30 days each way, November 14 to January 13, so she checks that none of her accounts bought the original fund in that span.',
        'She also notes the rest: Medicare open enrollment ends December 7 (for her parents), the marketplace deadline for January 1 coverage is December 15, quad witching is Friday, December 18, the market closes at 1:00 pm on December 24 and is shut on Christmas Day.',
      ],
      result: 'Ten minutes of planning puts every big December date in front of her before it arrives, and the $4,000 loss can offset gains, then up to $3,000 of income, with any rest carried forward.',
    },
    mistakes: [
      'Opening a big position a few minutes before a CPI report or an FOMC statement, then getting whipsawed when prices jump both ways.',
      'Treating the release itself as the news. Markets move on the gap between the actual number and the forecast, and on the press conference, not the headline alone.',
      'Waiting until December 31 to harvest losses: rushed orders, thin holiday trading and automatic purchases that trigger wash sales.',
      'Forgetting estimated taxes after a big trading year, then owing an underpayment penalty on top of the tax.',
    ],
    points: [
      'Most market-moving data arrives at 8:30 am ET (CPI, jobs, PPI, retail sales, GDP, PCE) or 10:00 am ET (ISM, JOLTS, sentiment).',
      'The Fed decides eight times a year at 2:00 pm ET; four of those meetings come with a dot plot.',
      'Third Friday means options expiration; in March, June, September and December it is quad witching.',
      'The tax year runs on quarterly estimated payments, a mid-April filing deadline and a hard December 31 for year-end moves.',
      'Most dates follow published rules, so you can plan months ahead and export them to your own calendar.',
    ],
    terms: ['Options expiration', 'Quad witching', 'CPI', 'FOMC', 'Nonfarm payrolls', 'Earnings season'],
    quiz: { q: 'What time are the CPI and jobs reports released?', options: ['8:30 am Eastern, before the stock market opens', '9:30 am Eastern, at the opening bell', '2:00 pm Eastern, with Fed decisions'], answer: 0, why: 'Both come out at 8:30 am ET, an hour before stocks open, so futures, yields and the dollar react first.' },
    sources: [
      { t: 'Federal Reserve: FOMC meeting calendars', u: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm' },
      { t: 'BLS: Consumer Price Index release schedule', u: 'https://www.bls.gov/schedule/news_release/cpi.htm' },
      { t: 'IRS Publication 509: Tax calendars', u: 'https://www.irs.gov/publications/p509' },
      { t: 'NYSE: Holidays and trading hours', u: 'https://www.nyse.com/markets/hours-calendars' },
    ],
  });
})();
