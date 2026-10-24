# Addendum 3 (October 21, 2026): macro, commodities, crypto and the calendar

Everything in SPEC.md and SPEC-money.md still applies (widget rules, night-desk look, lesson object with `example`,
`mistakes`, `points`, `terms`, optional `glossary`, `quiz`, `sources`; voice; harness; module-prefixed CSS; no edits
outside your own module file). Read this file fully.

## Already done by main (do not edit)

* `src/content-macro.js`: four new Trading-track courses (`fed` n=11, `econ` n=12, `commod` n=13, `crypto` n=14),
  five tool entries pointing at widget names below, and ~85 new glossary terms. **Read it**: only names there, in
  content-money.js or content.js may go in `terms`.
* `pages.js`: a nav entry and footer link for the `#calendar` page (the page itself is built by fork C1), and the
  harness and build load content-macro.js.

## Facts

Research files (being written now; check with `ls /home/claude/site/research/` and read when present):
`macro.md` (Fed, current data, rates, dollar, commodities, geopolitics, cycle, data-day reactions),
`calendar.md` (official release dates Oct 2026 to Dec 2027, tax and benefit deadlines, market holidays),
`crypto.md` (market data, how it works, US rules and taxes, risks, trading mechanics). Also `core-2026.md` and others.

* Build widgets and structure first, then read the research before writing any number, date or rule.
* Use only facts the research marks verified/CONFIRMED. Never state a number from memory. For anything missing,
  write around it ("check the BLS schedule") or label it clearly as an estimate.
* Market levels (oil, gold, BTC, yields) change daily: present them as "about X in October 2026" and make widget
  inputs adjustable with that as the default.
* Politics and geopolitics: neutral, factual, no opinions on leaders, parties or policies; describe mechanisms and
  documented market reactions. Crypto: no hype, no price predictions; be frank about risk, scams and losses.
* Education only, not advice. US-focused.

## Lessons, owners and widgets (fixed ids and names; ★ = also a tool, must work with no opts at 300-840 px)

| Fork | Module | Course | Order | Lesson id | Title (you may polish) | Widget |
|---|---|---|---|---|---|---|
| M1 | mod-x-fed.js | fed | 1 | l-macro-intro | How the economy moves stocks | macroMap |
| M1 | | fed | 2 | l-fed | How the Federal Reserve works | fedSim |
| M1 | | fed | 3 | l-rates | Rates, yields and the yield curve | rateValuation ★ |
| M2 | mod-x-data.js | econ | 1 | l-inflation | Inflation: CPI, PCE and PPI | inflationCalc ★ |
| M2 | | econ | 2 | l-jobs | The jobs report and jobless claims | jobsReport |
| M2 | | econ | 3 | l-pmi | PMI, GDP and retail sales | pmiGauge |
| M3 | mod-x-markets.js | econ | 4 | l-data-day | Trading data-release days | dataDayMove ★ |
| M3 | | econ | 5 | l-earnings-season | Earnings season and the economy | earningsSeason |
| M3 | | econ | 6 | l-cycle | The business cycle, sectors and recessions | cycleClock |
| C1 | mod-x-calendar.js | econ | 7 | l-key-dates | The investor's calendar | keyDates |
| M4 | mod-x-metals.js | commod | 1 | l-oil | Oil: prices, OPEC+ and the economy | oilShock |
| M4 | | commod | 2 | l-gold-silver | Gold and silver | metalsLab ★ |
| M4 | | commod | 3 | l-copper | Copper and industrial metals | copperGauge |
| M5 | mod-x-geo.js | commod | 4 | l-geopolitics | Tension, war, sanctions and tariffs | shockRecovery |
| M5 | | commod | 5 | l-dollar | The dollar and global money | dollarLab |
| K1 | mod-x-crypto1.js | crypto | 1 | l-blockchain | How a blockchain works | blockChainDemo |
| K1 | | crypto | 2 | l-crypto-coins | Bitcoin, Ethereum, stablecoins and altcoins | coinMap |
| K1 | | crypto | 3 | l-crypto-custody | Wallets, keys, exchanges and ETFs | custodyPicker |
| K2 | mod-x-crypto2.js | crypto | 4 | l-crypto-drivers | What moves crypto prices | cryptoDrivers |
| K2 | | crypto | 5 | l-crypto-trading | How to trade crypto | liqCalc ★ |
| K2 | | crypto | 6 | l-crypto-risks | Risks, scams and taxes | cryptoRisks |

Lesson `level`: 'Beginner', 'Intermediate' or 'Advanced'. Cross-link generously with `href="#l-..."` to these ids and
existing ones (e.g. #l-earnings, #l-statements, #l-bonds, #l-volatility, #l-expected-move is NOT an id — use
#l-volatility; #l-iv-crush, #l-wash-sale, #l-tax-loss, #l-cap-gains, #l-one-percent, #l-position-size, #l-drawdowns,
#l-psychology, #l-index-funds, #l-allocation, #l-ai-news, #l-broker) and to `#calendar` for dates.

## The calendar (fork C1)

* `SML.calendarEvents`: an array of `{ d: 'YYYY-MM-DD', time: '8:30 am ET' | '', cat, title, note, lesson, status, src }`
  with `cat` in fed | data | markets | tax | benefits | earnings | energy | crypto, `status` confirmed | rule | estimate,
  built from research/calendar.md for 2026-10-21 through 2027-12-31.
* `SML.pages.calendar = function (view) { ...; return 'Calendar'; }`: page header via `SML.pageHeader('', kicker,
  titleHTML, sideHTML)`, a month grid and an agenda list, category filter chips, previous/next/today, an event detail
  panel (what it is, why it matters, how markets often react, link to the lesson), recurring-rule explainer, and
  "Export to calendar (.ics)" for the filtered events. Use the real current date (`new Date()`) for "today"; say the
  data covers through December 2027 and mark rule/estimate items clearly.
* Downloads: the artifact declares the downloads capability. Pattern used elsewhere:
  `window.claude.use('downloads').then((d) => { dl = d; button.hidden = false })` (wrapped in try/catch), then
  `dl.save({ filename: 'investor-calendar.ics', data: icsText })`; handle rejection codes 'declined' and
  'rate_limited' with a toast. Fallback when unavailable: a Blob object-URL link with the download attribute.
* Widget `keyDates` (lesson l-key-dates): the monthly rhythm and the year at a glance, compact, linking to `#calendar`.

## Test and report

`python3 /home/claude/site/tools/harness.py mod-yours.js` until clean at both widths with no NO WORKED EXAMPLE /
NO MISTAKES / MISSING:term flags; look at screenshots. C1 also: build (`python3 tools/build.py`) and run
`python3 tools/sitetest.py --routes calendar --shots calendar --fuzz` and check the page screenshots. Report briefly:
lessons/widgets built, facts used with sources, anything unverified.
