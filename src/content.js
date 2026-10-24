/* Courses, tools and glossary. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg;
  const box = (body, label) => S.box(320, 150, label, body);
  const T = S.text, L = S.line, Rc = S.rect;

  /* ---------- course thumbnails (decorative, scale with the card) ---------- */
  function candlesThumb(list, xs, bw, y) { return S.candles(list, (i) => xs[i], bw, y); }
  const thumbs = {
    basics() {
      let b = '';
      const cx = 92, cy = 76, r = 50;
      for (let i = 0; i < 8; i++) {
        const a0 = (-90 + i * 45) * Math.PI / 180, a1 = (-90 + (i + 1) * 45) * Math.PI / 180, off = i === 0 ? 8 : 0, am = (a0 + a1) / 2;
        const ox = off * Math.cos(am), oy = off * Math.sin(am);
        b += S.path(`M${cx + ox},${cy + oy} L${(cx + ox + r * Math.cos(a0)).toFixed(1)},${(cy + oy + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 0 1 ${(cx + ox + r * Math.cos(a1)).toFixed(1)},${(cy + oy + r * Math.sin(a1)).toFixed(1)} Z`, (i === 0 ? 'f-acc' : 'f-shade2') + ' s-surf w2');
      }
      b += T(176, 52, 'your slice', 'md ink b') + T(176, 76, '▲ price', 'md up b') + T(176, 98, '$ dividends', 'md acc b');
      return box(b, 'A company as a pie with your slice pulled out');
    },
    charts() {
      const y = SML.lin(97, 105, 132, 18); const d = [[100, 101.2, 99.4, 100.9], [100.9, 101.6, 100.2, 100.5], [100.5, 102.9, 100.3, 102.6], [102.6, 103.1, 101.7, 102.0], [102.0, 104.4, 101.9, 104.1]].map((a) => ({ o: a[0], h: a[1], l: a[2], c: a[3] }));
      const xs = [70, 118, 166, 214, 262];
      return box(S.level(y(102.2), 30, 290, '', 's-acc') + T(34, y(102.2) - 6, 'level', 'sm acc b') + candlesThumb(d, xs, 22, y), 'Candles breaking above a dashed level');
    },
    indicators() {
      const p = SML.data.path([[0, 100], [20, 96], [40, 103], [60, 107]], 61, 4, 0.5);
      const e = SML.ind.ema(p, 10), s = SML.ind.ema(p, 25), v = p.map((_, i) => 99 + i * 0.09);
      const x = SML.lin(0, 60, 20, 300), y = SML.lin(93, 109, 136, 14);
      return box(S.poly(p.map((q, i) => [x(i), y(q)]), 's-mut w15') + S.poly(v.map((q, i) => [x(i), y(q)]), 's-info w25') + S.poly(s.map((q, i) => [x(i), y(q)]), 's-ink w25') + S.poly(e.map((q, i) => [x(i), y(q)]), 's-acc w25'), 'Price with EMA lines and VWAP');
    },
    options() {
      let b = L(20, 92, 300, 92, 's-line dash');
      b += S.poly([[24, 112], [130, 112], [160, 92]], 's-dn w3') + S.poly([[160, 92], [220, 30]], 's-up w3');
      b += T(222, 28, 'call', 'md up b') + T(26, 106, '−premium', 'sm dn');
      b += L(130, 86, 130, 98, 's-ink w15') + T(130, 128, 'strike', 'sm', 'middle');
      return box(b, 'Call option payoff: small fixed loss, open-ended gain');
    },
    risk() {
      const x = SML.lin(0, 10, 24, 300), y = SML.lin(0, 10000, 132, 18);
      const a = [], c = []; for (let i = 0; i <= 10; i++) { a.push([x(i), y(10000 * Math.pow(0.99, i))]); c.push([x(i), y(10000 * Math.pow(0.9, i))]); }
      return box(S.poly(a, 's-up w3') + S.poly(c, 's-dn w3') + T(170, 14, 'risk 1%', 'md up b', 'middle') + T(300, 112, 'risk 10%', 'md dn b', 'end'), 'Two equity curves through a losing streak');
    },
    styles() {
      const rows = [['Day', 24, 110, 'f-dn-t s-dn'], ['Swing', 96, 190, 'f-acc-t s-acc'], ['Wheel', 150, 250, 'f-vio-t s-vio'], ['Value', 206, 300, 'f-up-t s-up']];
      let b = '';
      rows.forEach((r, i) => { b += Rc(r[1], 10 + i * 28, r[2] - r[1], 21, r[3] + ' w15', 3) + T(r[1] + 8, 24.5 + i * 28, r[0], 'md ink b'); });
      b += L(20, 128, 300, 128, 's-mut w15') + T(22, 144, 'minutes', 'xs') + T(300, 144, 'years', 'xs', 'end');
      return box(b, 'Holding periods for each style');
    },
    fundamentals() {
      const y = SML.lin(0, 100, 126, 16);
      let b = Rc(40, y(100), 50, 110, 'f-info', 2) + Rc(110, y(100), 50, y(35) - y(100), 'f-dn', 2) + Rc(180, y(35), 50, 126 - y(35), 'f-up', 2);
      b += L(90, y(100), 110, y(100), 's-mut dash') + L(160, y(35), 180, y(35), 's-mut dash') + L(30, 126.5, 290, 126.5, 's-line');
      b += T(65, 142, 'sales', 'sm', 'middle') + T(135, 142, 'costs', 'sm', 'middle') + T(205, 142, 'profit', 'sm', 'middle');
      return box(b, 'Sales minus costs equals profit');
    },
    taxes() {
      let b = Rc(24, 52, 132, 32, 'f-dn-t s-dn w15', 3) + Rc(164, 52, 132, 32, 'f-up-t s-up w15', 3);
      b += T(90, 73, 'short-term', 'md ink b', 'middle') + T(230, 73, 'long-term', 'md ink b', 'middle');
      b += L(160, 30, 160, 104, 's-acc w2') + T(160, 24, '1 year', 'md acc b', 'middle');
      b += T(90, 112, '10–37%', 'md dn b mono', 'middle') + T(230, 112, '0/15/20%', 'md up b mono', 'middle');
      return box(b, 'Short-term versus long-term tax rates');
    },
    habits() {
      let b = L(80, 14, 80, 136, 's-mut w15');
      const rows = [[30, 'f-up', 'limit sell'], [62, 'f-acc', 'price now'], [92, 'f-info', 'limit buy'], [122, 'f-dn', 'stop']];
      rows.forEach((r) => { b += S.circle(80, r[0], 6, r[1]) + L(90, r[0], 104, r[0], 's-mut') + T(110, r[0] + 4, r[2], 'md ink'); });
      b += Rc(200, 20, 96, 110, 'f-paper s-line', 3);
      for (let i = 0; i < 5; i++) b += L(212, 40 + i * 18, 284, 40 + i * 18, 's-line') + S.circle(212, 34 + i * 18, 3, i < 3 ? 'f-up' : 'f-shade2');
      return box(b, 'Order types on a price ladder and a journal');
    },
  };

  thumbs.ai = function () {
    let b = S.rect(20, 34, 86, 54, 'f-vio-t s-vio w15', 8) + S.text(63, 58, 'AI', 'xl vio b', 'middle') + S.text(63, 76, 'agent', 'sm', 'middle');
    b += S.arrow(108, 61, 150, 61, 'mut') + S.rect(152, 40, 54, 42, 'f-surf s-line', 6) + S.text(179, 65, 'MCP', 'sm mono b ink', 'middle');
    b += S.arrow(208, 61, 240, 61, 'mut');
    const y = SML.lin(97, 104, 120, 24); const d = [[99, 99.8, 98.6, 99.6], [99.6, 100.9, 99.4, 100.7], [100.7, 101.0, 99.9, 100.2], [100.2, 102.3, 100.1, 102.0], [102.0, 103.4, 101.8, 103.1]].map((a) => ({ o: a[0], h: a[1], l: a[2], c: a[3] }));
    b += S.candles(d, (i) => 250 + i * 14, 8, y);
    b += S.text(160, 132, 'rules, limits, approvals', 'sm acc b', 'middle');
    return box(b, 'An AI agent connected through MCP to a broker');
  };
  SML.courses = [
    { id: 'basics', n: 1, title: 'Market Basics', blurb: 'Stocks, bonds, index funds and options in plain words.', level: 'Start here' },
    { id: 'charts', n: 2, title: 'Reading Charts', blurb: 'Candles, key levels, breakouts, fakeouts and volume.', level: 'Beginner' },
    { id: 'indicators', n: 3, title: 'Indicators', blurb: 'Moving averages, VWAP, RSI and volatility, and how to combine them.', level: 'Beginner' },
    { id: 'options', n: 4, title: 'Options & the Wheel', blurb: 'Calls, puts, the Greeks and a steady income strategy.', level: 'Intermediate' },
    { id: 'risk', n: 5, title: 'Risk & Sizing', blurb: 'Size every trade and survive the losing streaks.', level: 'Essential' },
    { id: 'styles', n: 6, title: 'Trading Styles', blurb: 'Day, swing, wheel and value investing, and how to blend them.', level: 'Beginner' },
    { id: 'fundamentals', n: 7, title: 'Company Fundamentals', blurb: 'Earnings and the three financial statements.', level: 'Beginner' },
    { id: 'taxes', n: 8, title: 'Taxes for Traders', blurb: 'Short vs long term, tax-loss harvesting and wash sales.', level: 'Beginner' },
    { id: 'habits', n: 9, title: 'Execution & Habits', blurb: 'Order types, account rules, psychology and journaling.', level: 'Essential' },
    { id: 'ai', n: 10, title: 'Trading with AI', blurb: 'Research, automation, backtesting and indicators with AI, and the mistakes to avoid.', level: 'Intermediate' },
  ];
  SML.courseThumb = (id) => (thumbs[id] ? thumbs[id]() : '');

  /* ---------- tools ---------- */
  const ic = {
    size: '<path d="M4 18h16M7 18V9M12 18V5M17 18v-6" class="nf s-ink w2"/>',
    options: '<path d="M3 15h8l6-9M3 15h18" class="nf s-ink w2"/><circle cx="11" cy="15" r="1.8" class="f-acc"/>',
    wheel: '<circle cx="12" cy="12" r="7.5" class="nf s-ink w2"/><path d="M12 4.5V9M19.5 12H15M12 19.5V15M4.5 12H9" class="nf s-ink w2"/>',
    risk: '<path d="M3 17c3-1 4-6 7-6s3 4 6 3 3-6 5-8" class="nf s-ink w2"/><path d="M3 20c4-2 6-3 9-3s6 1 9 0" class="nf s-mut w15"/>',
    compound: '<path d="M4 19h16" class="nf s-ink w2"/><path d="M6 19v-3M10 19v-5M14 19v-8M18 19v-12" class="nf s-ink w2"/>',
    tax: '<rect x="5" y="3.5" width="14" height="17" rx="1.5" class="nf s-ink w2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4" class="nf s-ink w15"/>',
    expected: '<path d="M3 12h4l12-7M7 12l12 7" class="nf s-ink w2"/><circle cx="7" cy="12" r="1.8" class="f-acc"/>',
    drawdown: '<path d="M3 6l6 8 3-3 9 7" class="nf s-ink w2"/>',
    value: '<path d="M3 16c3-6 5 2 8-4s5 1 10-5" class="nf s-ink w2"/><path d="M3 14l18-6" class="nf s-acc w15 dash2"/>',
    style: '<circle cx="12" cy="12" r="8" class="nf s-ink w2"/><path d="M12 4a8 8 0 0 1 7.5 5.3L12 12z" class="f-acc"/>',
    ratio: '<path d="M5 19L19 5" class="nf s-ink w2"/><circle cx="7" cy="7" r="2.5" class="nf s-ink w2"/><circle cx="17" cy="17" r="2.5" class="nf s-ink w2"/>',
  };
  SML.toolIcon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ic[k] || ic.size}</svg>`;
  SML.tools = [
    { id: 'tool-size', title: 'Position size', blurb: 'How many shares to buy so a loss stays at your risk limit.', widget: 'sizeCalc', cat: 'Risk', icon: 'size', lesson: 'l-position-size' },
    { id: 'tool-options', title: 'Option profit', blurb: 'Profit, breakeven and Greeks for any call or put.', widget: 'optionCalc', cat: 'Options', icon: 'options', lesson: 'l-payoff' },
    { id: 'tool-wheel', title: 'Wheel income', blurb: 'Return and annualized yield from selling puts or covered calls.', widget: 'wheelCalc', cat: 'Options', icon: 'wheel', lesson: 'l-wheel' },
    { id: 'tool-risk', title: 'Win rate & R simulator', blurb: 'Run hundreds of trades to see if your edge survives.', widget: 'riskSim', cat: 'Risk', icon: 'risk', lesson: 'l-risk-reward' },
    { id: 'tool-compound', title: 'Compounding & retirement', blurb: 'What steady saving and returns grow into over the years.', widget: 'compoundCalc', cat: 'Investing', icon: 'compound', lesson: 'l-blend' },
    { id: 'tool-expected', title: 'Expected move', blurb: 'The range options are pricing in for any date.', widget: 'expectedMove', cat: 'Options', icon: 'expected', lesson: 'l-volatility' },
    { id: 'tool-tlh', title: 'Tax-loss harvest', blurb: 'How much harvesting losses can cut this year’s tax bill.', widget: 'tlhCalc', cat: 'Taxes', icon: 'tax', lesson: 'l-tax-loss' },
    { id: 'tool-drawdown', title: 'Drawdown recovery', blurb: 'The gain you need to climb back from any loss.', widget: 'drawdownCalc', cat: 'Risk', icon: 'drawdown', lesson: 'l-drawdowns' },
    { id: 'tool-value', title: 'Margin of safety', blurb: 'Compare price to an estimate of what a business is worth.', widget: 'marginSafety', cat: 'Investing', icon: 'value', lesson: 'l-value' },
    { id: 'tool-ratios', title: 'Five-number check', blurb: 'P/E, growth, margin, debt and cash flow at a glance.', widget: 'ratioCalc', cat: 'Investing', icon: 'ratio', lesson: 'l-ratios' },
    { id: 'tool-style', title: 'Which style fits you?', blurb: 'Five questions, one suggested mix of styles.', widget: 'styleQuiz', cat: 'Getting started', icon: 'style', lesson: 'l-styles' },
  ];

  /* ---------- glossary ---------- */
  const G = (t, full, d, l) => ({ t, full, d, l });
  SML.glossary = [
    G('Stock', 'Equity', 'A small piece of ownership in a company. Its price moves with what investors think the company is worth.', 'l-stocks'),
    G('Share', '', 'One unit of a stock. Buying 10 shares means you own 10 units.', 'l-stocks'),
    G('Dividend', '', 'Cash a company pays to its shareholders, usually every quarter.', 'l-stocks'),
    G('Bond', '', 'A loan you make to a government or company. It pays you interest and returns your money at a set date.', 'l-bonds'),
    G('Coupon', '', 'The fixed interest a bond pays each year, as a percent of its face value.', 'l-bonds'),
    G('Yield', '', 'The yearly income from an investment as a percent of its price. When bond prices fall, yields rise.', 'l-bonds'),
    G('ETF', 'Exchange-traded fund', 'A fund that holds many investments and trades like one stock during the day.', 'l-etfs'),
    G('Index fund', '', 'A fund that copies a market index such as the S&P 500, so you own every company in it at low cost.', 'l-etfs'),
    G('Diversification', '', 'Spreading money across many investments so one failure cannot sink you.', 'l-etfs'),
    G('Option', '', 'A contract giving the right, but not the duty, to buy or sell 100 shares at a set price before a set date.', 'l-options-101'),
    G('Call', 'Call option', 'The right to buy 100 shares at the strike price. Gains when the stock rises.', 'l-options-101'),
    G('Put', 'Put option', 'The right to sell 100 shares at the strike price. Gains when the stock falls.', 'l-options-101'),
    G('Strike', 'Strike price', 'The price at which an option lets you buy or sell the shares.', 'l-contracts'),
    G('Expiration', 'Expiry', 'The last day an option exists. After that it is exercised or worthless.', 'l-contracts'),
    G('Premium', '', 'The price of an option. Quoted per share, so multiply by 100 for one contract.', 'l-contracts'),
    G('Contract', '', 'One option. It covers 100 shares.', 'l-contracts'),
    G('ITM', 'In the money', 'An option that would be worth something if it expired now: a call below the stock price, a put above it.', 'l-contracts'),
    G('ATM', 'At the money', 'An option whose strike is at or very near the current stock price.', 'l-contracts'),
    G('OTM', 'Out of the money', 'An option with no value if it expired now. Cheaper, and most of them expire worthless.', 'l-contracts'),
    G('Intrinsic value', '', 'The part of an option price that is real right now: how far it is in the money.', 'l-contracts'),
    G('Time value', 'Extrinsic value', 'The part of an option price paid for the chance of a move before expiry. It melts to zero by expiration.', 'l-theta'),
    G('Delta', '', 'How much an option price moves for a $1 move in the stock. Also a rough chance of finishing in the money.', 'l-delta-gamma'),
    G('Gamma', '', 'How fast delta changes as the stock moves. Highest near the strike and close to expiry.', 'l-delta-gamma'),
    G('Theta', '', 'How much value an option loses each day from the passage of time.', 'l-theta'),
    G('Vega', '', 'How much an option price changes for a 1-point change in implied volatility.', 'l-iv-crush'),
    G('IV', 'Implied volatility', 'The yearly move the options market is pricing in. High IV means expensive options.', 'l-iv-crush'),
    G('IV crush', '', 'The sharp drop in implied volatility after an event like earnings, which cuts option prices.', 'l-iv-crush'),
    G('Assignment', '', 'When an option seller must buy or sell the shares because the buyer exercised.', 'l-wheel'),
    G('Cash-secured put', 'CSP', 'Selling a put while holding enough cash to buy the 100 shares if assigned.', 'l-wheel'),
    G('Covered call', '', 'Selling a call against 100 shares you own, collecting premium in exchange for capping your upside.', 'l-wheel'),
    G('Wheel', 'Wheel strategy', 'Sell cash-secured puts until assigned, then sell covered calls until the shares are called away, and repeat.', 'l-wheel'),
    G('Candlestick', 'Candle', 'A chart bar showing the open, high, low and close for one period of time.', 'l-candles'),
    G('Wick', 'Shadow', 'The thin line above or below a candle body showing the highest and lowest prices reached.', 'l-candles'),
    G('Doji', '', 'A candle that opens and closes at almost the same price. Nobody won that period.', 'l-candles'),
    G('Hammer', '', 'A candle with a small body and a long lower wick. Sellers pushed down and buyers pushed back.', 'l-candles'),
    G('Timeframe', '', 'How much time each candle covers, such as 2 minutes or 15 minutes.', 'l-timeframes'),
    G('PDH', 'Previous day high', 'The highest price of the prior regular session. A common resistance level.', 'l-levels'),
    G('PDL', 'Previous day low', 'The lowest price of the prior regular session. A common support level.', 'l-levels'),
    G('PMH', 'Premarket high', 'The highest price traded before the 9:30 ET open. Often tested early in the day.', 'l-levels'),
    G('PML', 'Premarket low', 'The lowest price traded before the 9:30 ET open.', 'l-levels'),
    G('Premarket', '', 'Trading before the regular session, roughly 4:00 to 9:30 ET. Volume is thin.', 'l-levels'),
    G('Support', '', 'A price area where buyers have stepped in before, acting like a floor.', 'l-support'),
    G('Resistance', '', 'A price area where sellers have stepped in before, acting like a ceiling.', 'l-support'),
    G('Breakout', '', 'Price closing through a key level, often with a jump in volume.', 'l-breakouts'),
    G('False breakout', 'Fakeout', 'Price pokes through a level, then closes back inside and reverses.', 'l-breakouts'),
    G('Retest', '', 'Price returning to a level it just broke to check it from the other side.', 'l-breakouts'),
    G('Confirmation', '', 'Extra evidence before entering: a close past the level, strong volume, a retest that holds.', 'l-breakouts'),
    G('Volume', '', 'How many shares traded in a period. Volume shows how much conviction is behind a move.', 'l-volume'),
    G('Relative volume', 'RVOL', 'Today’s volume compared with the usual volume for that time. 2× means twice as busy as normal.', 'l-volume'),
    G('SMA', 'Simple moving average', 'The plain average of the last N closing prices.', 'l-moving-averages'),
    G('EMA', 'Exponential moving average', 'A moving average that gives more weight to recent prices, so it turns faster than an SMA.', 'l-moving-averages'),
    G('VWAP', 'Volume-weighted average price', 'The average price paid today, weighted by volume. Resets every session.', 'l-vwap'),
    G('RSI', 'Relative strength index', 'A 0 to 100 gauge of recent momentum. Above 70 is stretched up, below 30 stretched down.', 'l-rsi'),
    G('Overbought', '', 'RSI above about 70. Price has risen fast and may pause, though strong trends can stay there.', 'l-rsi'),
    G('Oversold', '', 'RSI below about 30. Price has fallen fast and may bounce, though downtrends can stay there.', 'l-rsi'),
    G('ATR', 'Average true range', 'The average size of a candle’s range in dollars. Useful for setting stops.', 'l-volatility'),
    G('Volatility', '', 'How much and how fast a price moves around.', 'l-volatility'),
    G('Expected move', '', 'The range options are pricing in by a date: price × IV × √(days ÷ 365).', 'l-volatility'),
    G('Position size', '', 'How many shares or contracts you trade, set so a stop-out loses only your planned risk.', 'l-position-size'),
    G('R multiple', 'R', 'Profit or loss measured in units of your planned risk. Risk $100 and make $200 = +2R.', 'l-risk-reward'),
    G('Risk:reward', 'R:R', 'How much you aim to make compared with how much you risk on a trade.', 'l-risk-reward'),
    G('Stop loss', 'Stop', 'A preset exit that closes the trade if price reaches the point that proves your idea wrong.', 'l-position-size'),
    G('Drawdown', '', 'The drop from an account’s peak to its lowest point before a new peak.', 'l-drawdowns'),
    G('Win rate', '', 'The share of trades that make money.', 'l-risk-reward'),
    G('Expectancy', '', 'The average result per trade in R: win rate × average win minus loss rate × average loss.', 'l-risk-reward'),
    G('Liquidity', '', 'How easily you can buy or sell without moving the price. High volume means high liquidity.', 'l-stock-picking'),
    G('Bid-ask spread', 'Spread', 'The gap between the highest buy offer and the lowest sell offer. A hidden cost on every trade.', 'l-orders'),
    G('Market order', '', 'Buy or sell right now at the best available price.', 'l-orders'),
    G('Limit order', '', 'Buy or sell only at your price or better.', 'l-orders'),
    G('Stop order', '', 'An order that becomes a market order once price touches your stop price.', 'l-orders'),
    G('EPS', 'Earnings per share', 'Company profit divided by the number of shares.', 'l-earnings'),
    G('Revenue', 'Sales', 'All the money a company takes in from selling its products before any costs.', 'l-statements'),
    G('Guidance', '', 'A company’s own forecast for coming quarters. It can move the stock more than past results.', 'l-earnings'),
    G('P/E', 'Price-to-earnings ratio', 'Share price divided by yearly EPS. Roughly how many years of profit you pay for.', 'l-ratios'),
    G('Free cash flow', 'FCF', 'Cash from operations minus spending on equipment and buildings. Money truly left over.', 'l-statements'),
    G('Balance sheet', '', 'What a company owns (assets) and owes (liabilities) on one day. Assets = liabilities + equity.', 'l-statements'),
    G('Income statement', '', 'Sales minus costs over a period, ending in net profit.', 'l-statements'),
    G('Cash flow statement', '', 'Where cash actually came from and went over a period.', 'l-statements'),
    G('Margin of safety', '', 'The gap between what you think a business is worth and the price you pay.', 'l-value'),
    G('Capital gain', '', 'Profit from selling an investment for more than you paid.', 'l-cap-gains'),
    G('Short-term gain', '', 'A gain on something held 1 year or less. Taxed like salary in the US.', 'l-cap-gains'),
    G('Long-term gain', '', 'A gain on something held more than 1 year. Taxed at 0%, 15% or 20% in the US.', 'l-cap-gains'),
    G('Tax-loss harvesting', '', 'Selling losing positions to offset gains, plus up to $3,000 of other income a year.', 'l-tax-loss'),
    G('Wash sale', '', 'Rebuying the same or a substantially identical security within 30 days of a loss sale. The loss is deferred.', 'l-wash-sale'),
    G('PDT rule', 'Pattern day trader rule', 'The old FINRA rule that required $25,000 to day trade often in a margin account. Removed in 2026.', 'l-pdt'),
    G('Margin account', '', 'A brokerage account that lets you borrow against your holdings. Needs at least $2,000.', 'l-pdt'),
    G('Cash account', '', 'An account that trades only with your own settled cash. No borrowing.', 'l-pdt'),
    G('Settlement', '', 'When a trade officially completes and cash or shares change hands. US stocks settle in 1 business day (T+1).', 'l-pdt'),
    G('Day trading', '', 'Opening and closing trades within the same day.', 'l-styles'),
    G('Swing trading', '', 'Holding trades for days to weeks to catch one swing in price.', 'l-styles'),
    G('Value investing', '', 'Buying good businesses below what they are worth and holding for years.', 'l-value'),
    G('Compounding', '', 'Earning returns on your past returns, so growth speeds up over time.', 'l-blend'),
    G('Brokerage', 'Broker', 'The company that holds your account and sends your orders to the market.', 'l-broker'),
    G('Commission', '', 'A fee per trade. Most US brokers now charge $0 for online stock and ETF trades.', 'l-broker'),
    G('Payment for order flow', 'PFOF', 'Money a broker receives from market makers for sending them customer orders. It is how many $0-commission brokers earn.', 'l-broker'),
    G('SIPC', 'Securities Investor Protection Corporation', 'Protects up to $500,000 per customer, including $250,000 of cash, if a member broker fails. It does not cover market losses.', 'l-broker'),
    G('Fractional share', '', 'A slice of one share, so you can invest by dollar amount instead of buying whole shares.', 'l-broker'),
    G('API', 'Application programming interface', 'A way for software to talk to a service, such as reading quotes or placing orders without opening the app.', 'l-ai-automate'),
    G('MCP', 'Model Context Protocol', 'An open standard that lets AI assistants connect to outside tools and data, such as a broker or a news feed.', 'l-ai-automate'),
    G('LLM', 'Large language model', 'An AI model trained on huge amounts of text that can read, write and reason in plain language. Claude and ChatGPT are LLMs.', 'l-ai-basics'),
    G('AI agent', '', 'An AI model that can take actions with tools, such as looking up a quote or placing an order, instead of only answering.', 'l-ai-automate'),
    G('Agentic account', '', 'At Robinhood, a separate account an outside AI agent can trade in. The agent can only spend the money you put there.', 'l-ai-automate'),
    G('Prompt', '', 'The instructions and context you give an AI model.', 'l-ai-research'),
    G('Hallucination', '', 'When an AI states something false with confidence, such as a made-up earnings number or a date that never happened.', 'l-ai-mistakes'),
    G('Prompt injection', '', 'Hidden instructions inside text an AI reads, such as a web page or news story, that try to make it do something you did not ask.', 'l-ai-news'),
    G('Paper trading', '', 'Trading with fake money in a simulated account to test a strategy or a bot safely.', 'l-ai-automate'),
    G('Kill switch', '', 'A fast way to stop an automated system, such as disconnecting the agent or cancelling every open order.', 'l-ai-bots'),
    G('Webhook', '', 'A message one app sends another when something happens, such as a TradingView alert that tells a bot to act.', 'l-ai-setups'),
    G('Backtest', '', 'Testing a strategy’s rules on past data to see how it would have done.', 'l-backtest'),
    G('Overfitting', 'Curve fitting', 'Tuning a strategy so closely to past data that it stops working on new data.', 'l-backtest'),
    G('Out-of-sample', '', 'Data held back from tuning and used only to check whether a strategy still works.', 'l-backtest'),
    G('Look-ahead bias', '', 'A backtest mistake where the rules use information that was not yet known at that moment.', 'l-backtest'),
    G('Survivorship bias', '', 'Testing only on companies that still exist today, which hides the ones that failed.', 'l-backtest'),
    G('Slippage', '', 'The gap between the price you expected and the price you actually got.', 'l-backtest'),
    G('Profit factor', '', 'Gross profit divided by gross loss. Above 1 means the strategy made money overall.', 'l-backtest'),
    G('Pine Script', '', 'TradingView’s programming language for indicators, strategies and alerts.', 'l-ai-pine'),
    G('Sentiment analysis', '', 'Scoring text, such as headlines, as positive, negative or neutral.', 'l-ai-news'),
    G('Rate limit', '', 'The most requests a service allows in a period. Going over gets you slowed down or blocked.', 'l-ai-news'),
    G('Tilt', '', 'Trading badly because of emotion, usually after a painful loss or a big win.', 'l-emotions'),
    G('Loss aversion', '', 'Feeling a loss about twice as strongly as a gain of the same size, which makes people hold losers too long.', 'l-emotions'),
    G('FOMO', 'Fear of missing out', 'Chasing a move because it feels like everyone else is making money.', 'l-psychology'),
    G('Confirmation bias', '', 'Noticing only the information that agrees with what you already believe.', 'l-psychology'),
  ];
})();
