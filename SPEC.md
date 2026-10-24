# Stock Market Lessons: build spec

A single-page website (one HTML file when bundled) that teaches complete beginners to trade and invest through
interactive illustrations. Look: the "Stock Market Lessons" guide (chart-paper panels, Big Shoulders Display uppercase
headlines, IBM Plex Sans body, IBM Plex Mono numbers, the green/red/amber/blue/violet palette). All design tokens and
component classes are in `src/style.css`. All helpers are in `src/core.js` (read it; it is the API reference).

## Files and ownership

| File | Owner | Contents |
|---|---|---|
| `src/style.css`, `src/core.js` | main | tokens, components, helpers (do not edit; if you need extra CSS use `SML.css(...)` in your module, tokens only, selectors prefixed with your module name e.g. `.mc-...`) |
| `src/content.js` | main | `SML.courses`, `SML.tools`, `SML.glossary` |
| `src/pages.js`, `src/hero.js` | main | router pages: home, learn, course, lesson, tools, glossary; `heroChart` widget |
| `src/mod-charts.js` | fork A | courses `charts` + `indicators` |
| `src/mod-options.js` | fork B | courses `basics` + `options`, tool widgets `optionCalc`, `wheelCalc` |
| `src/mod-risk.js` | fork C | courses `risk` + `styles`, tool widgets `compoundCalc`, `styleQuiz` |
| `src/mod-company.js` | fork D | courses `fundamentals` + `taxes` + `habits` |
| `src/mod-play.js` | fork E | pages `play` (trade replay game), `blog` + posts, `sheets`, `apps` |

Bundle order: style.css, core.js, content.js, mod-*.js, hero.js, pages.js. Modules must not depend on each other.

## Module skeleton

```js
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;

  SML.widgets.candleBuilder = function (root, opts) {
    const id = SML.uid('cb');
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-o', label: 'Open', min: 90, max: 110, step: 0.1, value: 98, fmt: 'usd' })}
        ...
      </div>
      <div class="wg-read">${ui.stat('Body', id + '-body')}${ui.stat('Range', id + '-rng')}</div>
      <div class="wg-msg" id="${id}-msg"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const H = Math.round(SML.clamp(W * 0.48, 230, 340));
      const o = st.n(id + '-o');   // read controls
      // ... compute, then:
      fig.innerHTML = S.wrap(W, H, 'Candle built from your open, high, low and close', body);
      document.getElementById(id + '-msg').innerHTML = ui.msg('up', 'Hammer', 'Sellers pushed price down and buyers pushed it back up.');
    });
  };

  SML.lessons.push({ /* lesson object, see below */ });
})();
```

## Widget rules

1. `root` is a `<div class="wg">`. Fill it with sections in this order (all optional except the figure):
   `.wg-bar` (segmented controls / chips / title), `.wg-fig` (the drawing), `.wg-ctrl` (sliders / fields),
   `.wg-read` (stat tiles via `ui.stat`), `.wg-msg` (coach line: `ui.msg(pillClass, pillText, sentence)` explaining the
   current state in plain words, updated live), `.wg-actions` (buttons), `.wg-note` (small print).
   Dividers between sections are automatic.
2. **Draw 1:1 in pixels.** Use `ui.responsive(fig, W => ...)`; it passes the figure's content width and re-runs on resize.
   Pick H from W and draw with `S.wrap(W, H, ariaLabel, body)`. Text classes are then real pixel sizes:
   `xs` 10px (axis only), `sm` 11.5px, `md` 13px, `lg` 15px, `xl` 18px. Design for W from 300 to 840 px; below ~480 px
   switch to a compact layout (shorter labels, fewer ticks, labels inside the plot instead of a wide right margin).
   Leave room for every label inside the viewBox. No overlapping labels at any width.
3. **Colors only through classes** (`s-*` strokes, `f-*` fills, `wk`/`bd` candles, text classes `ink up dn acc info vio mut`).
   Never write a literal color. Both light and dark themes must read well. Up = green, down = red, levels = amber dashed,
   VWAP = blue, 13 EMA amber, 48 EMA blue, 200 EMA ink, RSI violet, IV violet.
4. **Every widget is playable**: sliders, segs, chips, draggable handles (`ui.drag(fig, {sel:'.handle', move(pt){}})`,
   draw handles with class `handle`), hover crosshair readouts (`ui.pt(svg, e)` on pointermove over the figure; hide on
   pointerleave), step / play buttons, or animation. Every change updates drawing + stats + coach line. Make it obvious
   what can be touched (a "drag me" label near a handle, hover hint in `.wg-note`).
5. Animation: `requestAnimationFrame` or `SML.every(ms, fn)`; stop with `SML.onCleanup`. If `SML.reduced()` is true do
   not autoplay; render a complete still state. The first frame must already show something meaningful.
6. Ids from `SML.uid('xx')`; never hardcode global ids. Each widget can be mounted more than once on a page.
7. Accessibility: `aria-label` on each svg says what it shows; buttons have text; controls labeled.
8. No external libraries, no fetch, no alert/confirm/prompt. `SML.store` only for per-viewer conveniences.
9. Format numbers with `SML.fmt` (usd, susd, pct, spct, R, num, time).
10. Data: `SML.data.path(anchors, n, seed, noise)` + `SML.data.candles(closes, seed, opts)` or `SML.data.session(seed)`,
    fixed seeds so drawings are stable; a "New example" button may reseed.
11. Never show made-up numbers for real companies. If you need tickers use obviously fictional ones and label "sample data".
12. Keep each widget focused; quality over quantity. Big clear shapes, generous whitespace, few labels, every label
    meaningful (the guide's figures are the quality bar: annotated, uncluttered, numbered badges for sequences).

## Lesson object

```js
SML.lessons.push({
  id: 'l-candles',            // route token, must start with l-
  course: 'charts',           // course id (see table below)
  order: 1,                   // order inside the course
  title: 'Candlesticks',      // short, 1-4 words
  mins: 4,                    // reading time
  level: 'Beginner',          // 'Beginner' | 'Intermediate'
  summary: 'What one candle tells you about buyers and sellers.',   // <= 80 chars, used in lists
  idea: 'Each candle shows one slice of time: where price opened, closed, and how far it travelled.', // <= 22 words
  widget: 'candleBuilder', opts: {},                 // main interactive illustration
  try: 'Drag the sliders and watch the candle change shape and name.',  // one sentence
  body: ['<p>…</p>', '<p>…</p>'],                     // 2-4 short paragraphs, 1-3 sentences each (HTML allowed: <b>, <i>)
  extra: [{ widget: 'candleSignals', opts: {}, try: '…' }],  // optional second illustration after the body
  points: ['…', '…', '…'],                             // 3-5 short takeaways
  quiz: { q: '…?', options: ['…', '…', '…'], answer: 1, why: 'One sentence.' },
  terms: ['Candlestick', 'Wick', 'Doji', 'Hammer'],   // glossary terms (exact names from the list below)
});
```

Courses (ids are fixed): `basics` Market Basics · `charts` Reading Charts · `indicators` Indicators ·
`options` Options & the Wheel · `risk` Risk & Sizing · `styles` Trading Styles · `fundamentals` Company Fundamentals ·
`taxes` Taxes for Traders · `habits` Execution & Habits.

Glossary term names (use exactly): Stock, Share, Dividend, Bond, Yield, Coupon, ETF, Index fund, Diversification,
Option, Call, Put, Strike, Expiration, Premium, Contract, ITM, ATM, OTM, Intrinsic value, Time value, Delta, Gamma,
Theta, Vega, IV, IV crush, Assignment, Cash-secured put, Covered call, Wheel, Candlestick, Wick, Doji, Hammer,
Timeframe, PDH, PDL, PMH, PML, Premarket, Support, Resistance, Breakout, False breakout, Retest, Confirmation, Volume,
Relative volume, SMA, EMA, VWAP, RSI, Overbought, Oversold, ATR, Volatility, Expected move, Position size, R multiple,
Risk:reward, Stop loss, Drawdown, Win rate, Expectancy, Liquidity, Bid-ask spread, Market order, Limit order,
Stop order, EPS, Revenue, Guidance, P/E, Free cash flow, Balance sheet, Income statement, Cash flow statement,
Margin of safety, Capital gain, Short-term gain, Long-term gain, Tax-loss harvesting, Wash sale, PDT rule,
Margin account, Cash account, Settlement, Day trading, Swing trading, Value investing, Compounding.

## Voice and facts

* Readers know nothing. Plain words, short sentences, second person. Explain each term the first time it appears.
  No hype, no profit promises, no em-dash asides, no "not X, but Y" constructions. Education only, never "buy this".
* Facts to keep straight (as of October 2026):
  * Option quotes are per share; one contract = 100 shares.
  * US taxes: short-term = held 1 year or less, taxed as ordinary income (10%-37%); long-term = more than 1 year,
    0%/15%/20%. Net capital losses offset up to $3,000 of ordinary income per year ($1,500 married filing separately);
    the rest carries forward. Wash sale: buying the same or substantially identical security within 30 days before or
    after selling at a loss defers the loss (added to the new shares' cost basis); purchases in IRAs count too.
  * The FINRA $25,000 pattern-day-trader rule was eliminated in 2026 (SEC approved FINRA Rule 4210 amendments; brokers
    switched over around June 2026). Margin accounts need $2,000 minimum equity and intraday buying power is checked in
    real time. Cash accounts trade with settled cash; stocks settle T+1. Brokers can set stricter rules.
  * VWAP resets every session. RSI default period 14, 70/30 thresholds. EMA weights recent prices more than SMA.

## Testing

`python3 /home/claude/site/tools/harness.py mod-yours.js` renders every lesson and widget your module registers,
fuzzes all controls, checks for horizontal overflow at 1100 px and 360 px, and saves per-widget screenshots
(desktop light, mobile dark) to `/home/claude/site/shots/<module>/`. Use `--only name1,name2` to re-test a few
widgets fast and `--no-shots` to skip screenshots. Fix every error, overflow and visual problem (overlapping or clipped
labels, cramped mobile layouts, unreadable dark mode). Look at the screenshots with Read. Fonts fall back to system
faces in the harness (no network); ignore that.

---

# Addendum (October 21, 2026): night-desk design, end-of-lesson sections, new lessons

The site is now a single dark theme ("night desk": navy, Bebas Neue display, IBM Plex Sans/Mono, amber accent).
All tokens/classes above still apply; the harness screenshots are both dark now. Copy voice rules are unchanged
(no em-dash asides, plain words, second person).

## Every lesson now ends with four blocks (required on every lesson)

```js
example: {                       // WORKED EXAMPLE, rendered as big numbered rows
  title: 'Hammer at support',    // short, concrete, title case
  intro: 'Optional one sentence of setup.',
  steps: ['Stock pulls back to $50, a level that held twice last week.', '...', '...', '...'],  // 4-6 steps, concrete made-up numbers, each 1-2 sentences, math must be right
  result: 'Optional one-sentence outcome, e.g. risk $1.20 to make $1.50 = 1.25R.',
},
mistakes: ['3-4 common mistakes, 1-2 sentences each, specific to this lesson'],   // COMMON MISTAKES (red)
points: ['3-5 key takeaways'],                                                    // KEY TAKEAWAYS (green), already exists
terms: ['3-6 names from SML.glossary'],                                           // GLOSSARY rows
glossary: [{ t: 'Ticker', d: 'The short symbol for a stock.' }],                  // optional lesson-only terms not in SML.glossary
```
Use obviously fictional tickers in examples (e.g. DEMO, ACME-style made-up names labelled as examples), never made-up
numbers for real companies. `body` may now also contain `<h3>`, `<ul>/<li>`, `<code>` and `<pre><code>` for longer lessons.

New SML.glossary names you may use in `terms` (added to content.js): Brokerage, Commission, Payment for order flow, SIPC,
Fractional share, API, MCP, LLM, AI agent, Agentic account, Prompt, Hallucination, Prompt injection, Paper trading,
Kill switch, Webhook, Backtest, Overfitting, Out-of-sample, Look-ahead bias, Survivorship bias, Slippage, Profit factor,
Pine Script, Sentiment analysis, Rate limit, Tilt, Loss aversion, FOMO, Confirmation bias.

New course: `ai` "Trading with AI" (n=10, Intermediate). Lesson ids and orders are fixed:
l-ai-basics 1 · l-ai-research 2 · l-ai-mistakes 3 · l-ai-automate 4 · l-ai-bots 5 · l-ai-setups 6 · l-backtest 7 ·
l-ai-pine 8 · l-ai-news 9 · l-ai-security 10 · l-ai-journal 11. Other new lessons: `l-broker` (basics, order 5),
`l-emotions` (habits). Cross-link with `href="#l-..."`.

## Verified facts to use (checked October 2026; say "check the broker's site, fees change")

Brokers (brokerage-review.com, updated Sep 6 2026; NerdWallet Jul 2026). Online stock/ETF trades are $0 at all of these;
regulatory fees still apply on sells.
| Broker | Options per contract | Notes |
|---|---|---|
| Robinhood | $0 | no mutual funds or bonds; crypto; IRA match (1%, 3% with Gold); $75 transfer-out fee; Agentic Trading via MCP (beta) |
| Webull | $0 | regulatory/exchange fees apply |
| Public | $0 | offers options rebates |
| moomoo | $0 | |
| Charles Schwab | $0.65 | full service, research; developer API |
| Fidelity | $0.65 | branches, 24/7 support, strong for long-term investing |
| E*TRADE | $0.65 | |
| Interactive Brokers | ~$0.65 | pro tools, global markets, powerful API |
| tastytrade | $0.50 to open, capped $10 per leg, $0 to close | built for options |
| TradeStation | $0.50 | |
| Merrill Edge | $0.65 | |
| Vanguard | $1.00 | built for long-term index investing |
| Alpaca | $0 | API-first broker; official MCP server; paper trading by default |
How $0 brokers earn: payment for order flow, interest on cash and margin loans, subscriptions (e.g. Robinhood Gold),
stock lending. SIPC covers up to $500,000 per customer incl. $250,000 cash if the broker fails, not market losses.
Margin accounts need $2,000; the old $25,000 PDT rule was removed in 2026.

Robinhood Agentic Trading (Robinhood newsroom May 27 2026; support article "Onboarding an external agent", Oct 2026):
* Beta, US only. Free for eligible customers. Launched May 27 2026; crypto added July 20 2026 (needs a crypto account; not in some states, e.g. NY).
* Official MCP server URL: `https://agent.robinhood.com/mcp/trading` (HTTP transport, sign-in through Robinhood, no password sharing).
* Claude Code: `claude mcp add robinhood-trading --transport http https://agent.robinhood.com/mcp/trading`, then type `/mcp`, select `robinhood-trading` and authenticate.
* Claude Desktop: Settings > Connectors > Add custom connector > paste the link. Also works with ChatGPT, Codex, Cursor, Grok and other MCP clients.
* Needs a primary individual investing account in good standing. During authentication you are prompted to open an MCP ("agentic") account: a separate self-directed individual account (up to 10 self-directed individual accounts in total).
* The agent can READ all your Robinhood accounts (positions, balances, order history, account numbers) but can only PLACE trades in the agentic account, so the money you move there is its budget.
* Tools: account/portfolio, watchlists, market data, equities, options, crypto. Orders: market (shares or dollars), limit, stop limit, stop market.
* Controls: you can review what the agent is about to do before it acts; push notification for every trade; real-time activity feed and P&L; disconnect any time. If you tell the agent to act without asking, it can trade without confirmation.
* Robinhood's warnings: you are responsible for every trade; agents can make errors, misread instructions or use outdated information; strategies can move fast and be hard to stop; you can lose your entire deposit.
* Prefer the official server over community wrappers that ask for your username and password.
Alpaca MCP server (docs.alpaca.markets): official; paper trading is the default (`ALPACA_PAPER_TRADE=true`); stocks, ETFs, crypto, options; install with `uvx alpaca-mcp-server`; put API keys only in the client's env block, never in chat.

Other facts: SEC EDGAR APIs (data.sec.gov) are free, limit 10 requests per second and require a User-Agent with your
name and email. Pine Script's current version is v6 (released Dec 2024); many AI models still write v4/v5 syntax, which
causes compile errors. TradingView's Strategy Tester backtests `strategy()` scripts. News moves prices in seconds, faster
than a retail AI pipeline. Trading on material non-public information and manipulation (spoofing, pump schemes) is
illegal no matter what tool you use. Bots that trade the same ticker repeatedly can trigger many wash sales.
