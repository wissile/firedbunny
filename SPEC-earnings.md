# Addendum 6 (October 30, 2026): Earnings lookup (search any US stock, latest earnings explained)

Owner's request: "in the calendar section below add a section for earnings where you can search a stock like AAPL and
it will pull all of the data you need to know about the most recent earning of that stock, but more important there will
be graphs showing if the stock is improving or getting worse, it will provide the most recent update in a very simple
and well design illustrated form for those who are new to earnings and explain each concepts like GAAP what they stand
for what it means and why is important and how each metric affect the stock market in the short and what it means for
the future like value investing 10yr from now and everything else we need to know that is very important".

All earlier specs apply (SPEC.md, SPEC-money.md, SPEC-macro.md, SPEC-account.md, SPEC-realco.md): night-desk look,
SML.svg/ui helpers, module-prefixed CSS via `SML.css`, `SML.fmt`, no external libs, plain voice, no em-dash asides,
works at 300–1280 px, colors only via tokens/classes, `SML.onCleanup` for listeners, education not advice.

## Data: `SML.earn` (owned by main, in `src/mod-z-earn-data.js`)

Live data comes from the company's SEC filings (XBRL "company facts" + filing index) and a daily price history,
fetched through the site's own Cloudflare Worker (`/api/...`). It only works on the public website, not in the
claude.ai preview or the file:// test harness; there `load()` rejects with code `unavailable`.

* `SML.earn.load(ticker)` → `Promise<model>`; rejects with an Error that has `.code`:
  `bad_ticker` | `not_found` (no SEC filer with that ticker) | `no_quarterly` (files annual/IFRS reports only, e.g.
  many foreign companies, or no usable quarterly data) | `unavailable` (no API here: claude.ai preview, offline) |
  `sec_error` (SEC or price service failed; try again later). `.message` is a plain sentence you can show.
* `SML.earn.search(q)` → `Promise<[{ticker, name, cik}]>` (up to 8 matches by ticker prefix or name words).
* `SML.earn.sample()` → the SAMPLE model ("Demo Devices Inc. (SAMPLE DATA, NOT REAL)", ticker `DEMO`,
  `model.sample === true`). Use it for the preview when live data is unavailable, ALWAYS with a visible "Sample data,
  not a real company" banner. `load('DEMO')` also returns it.
* `SML.earn.live()` → true when the live API is expected to work (public website).

### Model shape (money in USD millions, EPS in USD per share, shares in millions; any number may be `null`)

```js
{
  ok: true, sample: false, ticker: 'AAPL', name: 'Apple Inc.', cik: 320193, sic: 'Electronic Computers',
  fiscalYearEnd: '0927', exchange: 'Nasdaq',
  latest: { end: '2026-06-27', label: 'Jun 2026', fq: 'Q3', fy: 2026, form: '10-Q', filed: '2026-07-31',
            accn: '0000320193-26-000020', url: 'https://www.sec.gov/Archives/...',  // filing index
            release: { date: '2026-07-30', url } | null },   // 8-K item 2.02 = the earnings press release
  quarters: [ // oldest → newest, up to 16
    { end, start, label: 'Jun 2026', fq: 'Q3', fy: 2026, derived: false /* true = Q4 computed from the 10-K */,
      revenue, cost, gross, rd, sga, opInc, netInc, epsDil, epsBasic, shDil,
      ocf, capex, fcf, buybacks, dividends, sbc, da, release: '2026-07-30' | null } ],
  balance: [ { end, cash, stInv, ltInv, debt, debtCur, debtLong, assets, liabilities, equity, assetsCur, liabCur,
               inventory, receivables } ],   // one per quarter end where available
  annual: [ { fy, end, revenue, netInc, epsDil, ocf, capex, fcf, shDil } ],   // up to 10 fiscal years, oldest → newest
  sharesOut: { value /* raw shares */, date } | null,
  price: { source, currency, last, lastDate, series: [['YYYY-MM-DD', close], ...] /* ~5 years */,
           reactions: [ { end, release, before, after, pct } ] /* close before the report → close the day after */ } | null,
  derived: { ttm: { revenue, netInc, eps, ocf, fcf }, ttmPrev: { … }, marketCap /* $M */, pe, ps, fcfYield /* % */,
             netCash /* $M */ },
  notes: [ 'Q4 figures are derived: full-year 10-K minus the first nine months.', … ],
  units: { money: 'USD millions', eps: 'USD per share', shares: 'millions' }
}
```
A realistic SAMPLE model is in `tools/fixtures/earn-model-sample.json` (and inside `SML.earn.sample()`); develop
against it. Real companies will have gaps (banks have no gross profit; some have no R&D; capex may be missing).
Every chart and card must handle `null`s gracefully (hide the row or say "not reported").

## UI (fork E, in `src/mod-z-earn-ui.js`)

1. **Placement:** a new section at the bottom of the Calendar page. Wrap the existing page function:
   `const base = SML.pages.calendar; SML.pages.calendar = (view, tok) => { const t = base(view, tok); /* append your
   section to view */ return t; }` (mod-z loads after mod-x-calendar.js). Section heading in the page's chapter style,
   e.g. "Earnings, explained: look up any stock". Also register a tool `tool-earnings` ("Earnings lookup", category
   'Stocks', icon 'value', lesson 'l-rc-words') in `SML.tools` with a widget `earnLookup` that renders the same thing,
   so it works at `#tool-earnings` too. Optional deep link: `#tool-earnings` + remember the last ticker per viewer in
   `SML.store` (try/catch).
2. **Search:** one big input ("Search a stock: AAPL, MSFT, NVDA…") with type-ahead from `SML.earn.search`, Enter or
   pick to load, plus quick chips (AAPL, MSFT, NVDA, AMZN, GOOGL, TSLA, JPM, KO). Loading skeleton; friendly errors per
   code. When `!SML.earn.live()` or a load rejects with `unavailable`, show a calm note ("Live lookups run on the
   FiredBunny website. Here is what a result looks like, with sample data.") and render the SAMPLE with a banner.
3. **The result, top to bottom** (simple, illustrated, for beginners; every figure computed from the model):
   * Header: company, ticker, latest quarter (calendar label + fiscal label, e.g. "June 2026 quarter · fiscal Q3 2026"),
     report date, form, links to the SEC filing and the earnings release.
   * **Report card**: 6–8 tiles with a verdict (Improving / Steady / Weakening, color + arrow + one plain sentence),
     at least: Sales (YoY growth now vs the last few quarters), Profit (net income YoY), EPS, Margins (operating margin
     vs a year ago), Cash generation (TTM free cash flow vs prior TTM), Balance sheet (net cash/debt trend), Share
     count (buybacks vs dilution), Valuation (P/E, P/S with context, no buy/sell call). Define thresholds in code
     comments and keep them simple and documented.
   * **Charts** (SVG, drawn 1:1, hover/tap tooltips): revenue by quarter with YoY % labels (seasonality note: compare
     with the same quarter last year); net income and EPS trend; margins over time (gross, operating, net); free cash
     flow (OCF − capex) bars; cash vs debt; share count; 10-year annual revenue, EPS and FCF; price chart (5 years)
     with earnings report markers and the stock's move around each report.
   * **"What happened this quarter"**: a short auto-written plain summary of the latest quarter (e.g. "Sales rose 16%
     from a year ago, faster than the 5% of the quarter before…"), generated from the numbers with neutral wording.
   * **Explainers**: for each metric/concept shown (GAAP vs non-GAAP, revenue, YoY/QoQ, TTM, gross/operating/net
     margin, net income, EPS (diluted), share count/buybacks/dilution, operating cash flow, capex, free cash flow,
     cash and debt/net cash, P/E, P/S, FCF yield, 10-Q/10-K/8-K, guidance and consensus (not in the data: explain and
     say where to find them)): **What it is** (spell out acronyms: GAAP = Generally Accepted Accounting Principles) ·
     **Why it matters** · **Short term** (how it tends to move the stock around earnings) · **Long term** (what it
     means for a 10-year owner / value investor). Tap-to-open cards next to the charts they explain, plus a compact
     glossary list. Reuse the Hoppy's Coffee Cart analogy from SPEC-realco.md where it helps (one line, not more).
   * **10-year lens**: an interactive "what would you need to believe" calculator using the company's real TTM free
     cash flow per share (or EPS) and price: sliders for growth for 10 years, the multiple in year 10, and (optional)
     dividends; shows the implied yearly return vs a simple benchmark, and the reverse view (the growth the current
     price implies). Clearly labelled educational, assumptions adjustable, never a recommendation.
   * Data notes and sources: "From the company's SEC filings (GAAP, as filed). The quarterly report (10-Q) usually
     appears a few days after the earnings release; analyst estimates and guidance are not included." Show
     `model.notes`. Links to the filing. Education only, not advice.
4. Cross-link the Read a Real Company course (#l-rc-words, #l-rc-apple-income, #l-rc-price, #l-rc-apple-call).

## Test and report

Develop against the sample (the harness and file:// tests have no API, so `load()` rejects `unavailable` and the
sample shows). `python3 tools/harness.py mod-z-earn-ui.js` (widget `earnLookup`), then
`python3 tools/build.py && python3 tools/sitetest.py --routes calendar,tool-earnings --shots calendar,tool-earnings --fuzz`
and check screenshots in `shots/site/` at both widths. Also run a Playwright script that stubs `SML.earn.load` to return
variants of the sample (nulls everywhere, only 3 quarters, a loss-making company with negative EPS, a bank-like company
with no gross profit/capex, no price) and confirm nothing breaks and empty states read well. Report briefly.
