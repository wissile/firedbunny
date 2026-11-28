/* Page metadata for search engines and link previews, built from the content itself (lessons, courses, tools, tracks,
   notes) so every new page gets it automatically: title, description, canonical address, robots, Open Graph / Twitter
   tags and JSON-LD structured data.

   - tools/prerender.py writes this into each page's pre-built HTML (what crawlers read), from SML.seo.meta() and
     SML.seo.jsonld(); on the website the router calls SML.seo.apply() after drawing a page so the live document says
     the same thing.
   - Titles are the page's own title. TITLES below gives lesson and tool pages whose own title is a short curriculum
     name a plain description of what the page covers, in the words people search with; keep them accurate and short,
     never a list of keywords. A calculator's visible heading is the plain name from its TITLES entry (heading()).
   - Structured data only describes what the page visibly shows: Organization and WebSite on the home page,
     BreadcrumbList where the page shows breadcrumbs, Article for lessons and trade notes (author and publisher:
     FiredBunny, the organization; dates only when they are real: a lesson's published date is the day it first
     shipped, from the repository history), WebApplication for calculators (free, no ratings: there are no real reviews
     to mark up), DefinedTermSet for the glossary. No Course markup (Google limits it to courses with instructors and a
     roster of students), no FAQ (retired).
   Markup helps search engines understand a page; it never guarantees a rich result or a citation. */
(function () {
  'use strict';
  const SML = window.SML;
  const ORIGIN = 'https://firedbunny.com'; // the one canonical address of the site
  const BRAND = 'FiredBunny';
  const IMAGE = ORIGIN + '/og-image.jpg'; // 1200 x 630
  const LOGO = ORIGIN + '/icon-512.png';
  const ABOUT = 'FiredBunny is a free, interactive money school: lessons, calculators and simulators on trading, investing, retirement and FIRE, in plain English.';

  // more descriptive titles for pages whose own title is one or two words (the page itself keeps its heading)
  const TITLES = {
    'l-contracts': 'Option contracts and moneyness: in, at and out of the money',
    'l-payoff': 'Option payoff diagrams: profit, loss and breakeven',
    'l-delta-gamma': 'Delta and gamma: how an option moves with the stock',
    'l-iv-crush': 'IV crush: why options can lose value after earnings',
    'l-candles': 'Candlestick charts: what one candle tells you',
    'l-support': 'Support and resistance: floors, ceilings and why they swap',
    'l-breakouts': 'Breakouts and fakeouts: wait for confirmation',
    'l-volume': 'Trading volume: why big moves need big volume',
    'l-vwap': 'VWAP explained: the volume-weighted average price',
    'l-rsi': 'RSI explained: how stretched a move is, from 0 to 100',
    'l-position-size': 'Position sizing: turn your stop and risk into a share count',
    'l-value': 'Value investing: buy a business for less than it is worth',
    'l-blend': 'Blending trading styles: one account, separate buckets',
    'l-earnings': 'Earnings reports: why stocks jump or drop on results',
    'l-tax-loss': 'Tax-loss harvesting: use losses to cut the tax on gains',
    'l-orders': 'Order types: market, limit and stop orders',
    'l-psychology': 'Trading psychology: fear, greed and broken rules',
    'l-mortgage': 'Mortgage basics: payments, amortization, PMI and refinancing',
    'l-wheel-tax': 'How the wheel strategy is taxed',
    // lessons whose own title is a curriculum name: the title tag says what the page covers (the page keeps its heading)
    'l-stocks': 'What is a stock? Shares, prices and ownership explained',
    'l-bonds': 'Bonds and interest rates: why bond prices fall when rates rise',
    'l-etfs': 'Index funds and ETFs: own hundreds of companies in one fund',
    'l-risk-ladder': 'The investment risk ladder: more reward, bigger and faster losses',
    'l-broker': 'How to choose a broker: fees, order fills and what you can trade',
    'l-options-101': 'Calls and puts explained: how option buyers make and lose money',
    'l-theta': 'Theta explained: how time decay drains an option’s value',
    'l-wheel': 'The wheel strategy: sell puts, take shares, sell covered calls',
    'l-covered-call': 'Covered calls: how they work, best case, breakeven and risks',
    'l-cash-secured-put': 'Cash-secured puts: getting paid to buy a stock you want',
    'l-rolling': 'Rolling options: rolling out, down and up, for a credit or a debit',
    'l-assignment': 'Option assignment and early exercise: when it happens and why',
    'l-timeframes': '2-minute vs 15-minute charts: direction on one, timing on the other',
    'l-levels': 'PDH, PDL, PMH and PML: the four key day-trading levels',
    'l-moving-averages': 'SMA vs EMA: how the two moving averages differ',
    'l-ema-stack': 'The 13, 48 and 200 EMA: how to read the EMA stack',
    'l-volatility': 'Volatility and expected move: the range options price in',
    'l-one-percent': 'The 1% rule: how much to risk on each trade',
    'l-risk-reward': 'Win rate and risk-reward: how to profit while losing more often',
    'l-drawdowns': 'Drawdown recovery: why losses need bigger gains to break even',
    'l-stock-picking': 'Which stocks to trade: liquidity, a catalyst and low costs',
    'l-styles': 'Day trading, swing trading, the wheel and value investing compared',
    'l-game-plan': 'A day-trading game plan: prepare before the market opens',
    'l-statements': 'The three financial statements: income, balance sheet, cash flow',
    'l-ratios': 'Five numbers to check before you buy a stock',
    'l-cap-gains': 'Short-term vs long-term capital gains tax',
    'l-wash-sale': 'The wash sale rule: the 30-day rule for claiming a loss',
    'l-pdt': 'Day trading rules in 2026: after the $25,000 PDT rule',
    'l-emotions': 'Fear, greed and tilt: how emotions swing a trading day',
    'l-journal': 'Trading journal: log every trade in R multiples',
    'l-ai-setups': 'Trading setups worth automating: turn rules into numbers',
    'l-backtest': 'Backtesting a strategy: what a backtest can and can’t prove',
    'l-ai-news': 'Use AI to read financial news, filings and data',
    'l-ai-basics': 'What AI can and can’t do for traders',
    'l-ai-research': 'AI as a research assistant: how to write a strong prompt',
    'l-ai-mistakes': 'AI trading mistakes to avoid: trusting it too much',
    'l-ai-security': 'AI trading safety: API keys, privacy and the rules',
    'l-ai-journal': 'AI as a trading coach: find the leaks in your journal',
    'l-key-dates': 'The investor’s calendar: market-moving dates through the year',
    'l-crypto-drivers': 'What moves crypto prices: money flows, leverage and mood',
    'l-crypto-trading': 'How to trade crypto: leverage, position size and liquidation',
    'l-crypto-risks': 'Crypto risks, scams and taxes',
    'l-inflation': 'Inflation explained: CPI, PCE and PPI',
    'l-pmi': 'PMI, GDP and retail sales: reading the economy’s health',
    'l-macro-intro': 'How the economy moves stocks: profits and interest rates',
    'l-dollar': 'The US dollar and global money: what a strong dollar does',
    'l-data-day': 'Trading data-release days: CPI, jobs and the priced-in move',
    'l-gold-silver': 'Gold and silver: what moves precious metal prices',
    'l-copper': 'Copper and industrial metals: a read on the economy',
    'l-wheel-ira': 'Running the wheel strategy in an IRA or Roth IRA',
    'l-401k-limits': '401(k) limits for 2026 and 2027: deferral, catch-up and total cap',
    'l-ira': 'IRA limits for 2026 and 2027, and the order to save in',
    'l-mega-backdoor': 'The mega backdoor Roth: after-tax 401(k) money into a Roth',
    'l-hsa': 'HSA limits for 2026 and 2027, and the triple tax break',
    'l-trad-vs-roth': 'Traditional vs Roth 401(k) and IRA: pay tax now or later?',
    'l-credit-score': 'How credit scores work: the five habits that set your score',
    'l-balance-transfer': '0% APR balance transfers: the fee, the deadline and the math',
    'l-espp': 'ESPP explained: the 15% discount and when to sell',
    'l-stock-options': 'Employee stock options: ISOs vs NSOs and when to exercise',
    'l-rent-vs-buy': 'Rent vs buy: how to compare the real costs',
    'l-home-taxes': 'Your home and taxes: the $250,000 exclusion and deductions',
    'l-house-invest': 'Is a house an investment? Leverage, costs and returns',
    'l-allocation': 'Asset allocation by age: stocks, bonds and cash',
    'l-budget': 'How to build a monthly budget around your savings rate',
    'l-track-spending': 'How to track your spending with a short weekly check',
    'l-latte': 'Small daily spending, big numbers: the cost over decades',
    'l-net-worth': 'Net worth: what you own minus what you owe',
    'l-insurance': 'Insurance you actually need: protect against the big disasters',
    'l-scams': 'Scams that target savers: the warning signs to spot',
    'l-airbnb': 'Airbnb income: gross bookings vs real profit',
    'l-smart-leverage': 'Using leverage wisely: cheap, fixed debt that can’t be called',
    'l-retire-age': 'When to retire: 55, 62, 67 or 70 compared',
    'l-retire-countdown': 'The last ten years before retirement: a countdown plan',
    'l-medicare-rmd': 'Medicare, RMDs and IRMAA: how income drives costs after 65',
    'l-retire-income': 'Retirement income: turn savings into a monthly paycheck',
    'l-tax-brackets': '2026 and 2027 tax brackets: how marginal rates really work',
    'l-us-tax-abroad': 'US taxes when you live abroad: exclusions and credits',
    'l-aca': 'Health insurance before 65: ACA subsidies and your income',
    'l-health-bridge': 'Health coverage until Medicare: pricing the years before 65',
    'l-fire-intro': 'What is FIRE? Financial independence, retire early explained',
    'l-avg-spending': 'Find your real yearly spending for a FIRE plan',
    'l-fire-number': 'Your FIRE number: how much you need to retire early',
    'l-savings-rate': 'Savings rate: the lever that sets your years to retirement',
    'l-coast-fire': 'Coast FIRE and Barista FIRE explained',
    'l-fire-planner': 'A full FIRE plan: saving, spending and accounts, year by year',
    'l-fire-whatif': 'Stress-test your FIRE plan: what if things go wrong?',
    'l-swr': 'The 4% rule and its limits for early retirees',
    'l-sequence': 'Sequence of returns risk: why the order of returns matters',
    'l-zero-bracket': 'The 0% capital gains bracket: gain harvesting and Roth conversions',
    'l-early-access': 'Access retirement money before 59½: Roth conversions and 72(t)',
    'l-van-life': 'Van, RV or trailer living: the real costs against a house',
    'l-travel-budget': 'Budgeting for long-term travel: slow travel costs less',
    'l-visas': 'Retirement visas: how early retirees can live abroad',
    'tool-size': 'Position size calculator',
    'tool-options': 'Option profit calculator: breakeven and Greeks',
    'tool-wheel': 'Wheel income calculator: premium return and annualized yield',
    'tool-covered-call': 'Covered call calculator: return if called, breakeven and odds',
    'tool-csp': 'Cash-secured put calculator: return on cash and cost if assigned',
    'tool-roll': 'Option roll calculator: net credit, total premium and new breakeven',
    'tool-assignment': 'Early assignment risk checker: time value and dividends',
    'tool-compound': 'Compound interest calculator',
    'tool-expected': 'Expected move calculator for options',
    'tool-tlh': 'Tax-loss harvesting calculator',
    'tool-drawdown': 'Drawdown recovery calculator',
    'tool-value': 'Margin of safety calculator',
    'tool-ratios': 'Five-number stock check: P/E, growth, margins and debt',
    'tool-budget': 'Monthly budget calculator: needs, wants and saving',
    'tool-match': '401(k) match calculator',
    'tool-espp': 'ESPP return calculator',
    'tool-roth': 'Roth or traditional calculator',
    'tool-ss': 'Social Security claiming age calculator',
    'tool-retire': 'Retirement planner: savings and Social Security to age 95',
    'tool-brackets': 'Tax bracket calculator: marginal and effective rate',
    'tool-wheeltax': 'Wheel strategy tax walkthrough: puts, assignment and calls',
    'tool-mortgage': 'Mortgage calculator: payment, interest, PMI and extra payments',
    'tool-rental': 'Rental property calculator: cash flow and cap rate',
    'tool-fire': 'FIRE number calculator',
    'tool-swr': 'Safe withdrawal rate calculator',
    'tool-dataday': 'Data-day move: the market move priced in for CPI and jobs days',
    'tool-earnings': 'Earnings lookup: any US stock’s results in plain words',
    'tool-risk': 'Win rate and R simulator: test your edge over hundreds of trades',
    'tool-style': 'Which trading style fits you? Five questions',
    'tool-habits': 'Daily habit cost calculator: yearly cost and invested value',
    'tool-cash': 'Where to park cash: savings, money market or T-bills after tax',
    'tool-payoff': 'Debt payoff calculator: avalanche vs snowball',
    'tool-transfer': 'Balance transfer calculator: fee, promo period and payment',
    'tool-car': 'Car loan vs cash calculator',
    'tool-fx': 'Foreign transaction fee calculator: card and ATM costs abroad',
    'tool-limits': '401(k) contribution limit calculator: deferral, match, after-tax',
    'tool-rsu': 'RSU tax calculator: the gap withholding leaves at vest',
    'tool-backdoor': 'Backdoor Roth pro-rata calculator: how much is taxable',
    'tool-rentbuy': 'Rent vs buy calculator: net worth year by year',
    'tool-airbnb': 'Airbnb profit calculator: from gross bookings to what you keep',
    'tool-years': 'Savings rate calculator: years to financial independence',
    'tool-cities': 'Cost of living by place: monthly budgets for cities and countries',
    'tool-firetax': 'FIRE withdrawal tax calculator: federal tax on what you take out',
    'tool-ladder': 'Early access planner: Roth ladder, 72(t) and the Rule of 55',
    'tool-aca': 'Health subsidy cliff calculator: marketplace and Medicaid lines',
    'tool-france': 'France and US tax estimate for a US citizen in France',
    'tool-fireplan': 'Full FIRE plan calculator: every account, year by year',
    'tool-rates': 'Interest rates and stock values: fair value and bond price',
    'tool-inflation': 'Inflation calculator: what it does to cash, bonds and stocks',
    'tool-metals': 'Gold, silver and copper: the gold-silver ratio and price drivers',
    'tool-liq': 'Crypto liquidation price calculator: leverage and a safer size',
    'tool-call': 'Earnings call player: Apple and SpaceX calls in plain words',
    'tool-statements': 'Real statement explorer: Apple and SpaceX financials, line by line',
    'tool-earnings-price': 'How earnings set a stock price: EPS, growth and the P/E multiple',
    home: 'FiredBunny: learn trading, investing, retirement and FIRE by playing',
    lessons: 'All FiredBunny lessons: trading, retirement and FIRE',
    courses: 'All FiredBunny courses, by track',
    tracks: 'All FiredBunny courses, by track',
    tools: 'Free financial calculators and trading tools',
    glossary: 'Trading and personal finance glossary',
    play: 'Trade replay: practise day trading with fake money',
    wheel: 'Wheel strategy simulator',
    indicator: 'Free TradingView indicator: key levels, VWAP and EMAs',
    sheets: 'Free trading spreadsheet templates',
    apps: 'FiredBunny apps (in development)',
    blog: 'Trade notes: trade breakdowns, wheel logs and checklists',
    calendar: 'Market and tax calendar: Fed, inflation, jobs and tax dates',
    assessment: 'Investor self-assessment: what kind of investor are you?',
    editorial: 'Editorial standards: how FiredBunny lessons are written and checked',
    support: 'Support FiredBunny: how the free site is paid for',
    plans: 'Plans: free for everyone, and a waitlist for optional extras',
    privacy: 'Privacy policy: what FiredBunny stores and how to remove it',
    terms: 'Terms of use: education, not advice',
    contact: 'Contact FiredBunny: corrections, ideas and privacy requests',
    'not-found': 'Page not found',
  };

  const find = (list, id) => (list || []).find((x) => x.id === id);
  const lessonsOf = (cid) => (SML.lessons || []).filter((l) => l.course === cid).sort((a, b) => (a.order || 0) - (b.order || 0));
  const coursesOf = (tid) => (SML.courses || []).filter((c) => (c.track || 'trading') === tid).sort((a, b) => a.n - b.n);
  const trackOf = (c) => find(SML.tracks, (c && c.track) || 'trading');
  const R = () => SML.routes;
  const url = (tok) => { const p = R() && R().path(tok); return p ? ORIGIN + p : ORIGIN + '/'; };
  const clean = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  // a description of at most `max` characters, cut at a word boundary
  function fit(s, max) {
    s = clean(s); max = max || 165;
    if (s.length <= max) return s;
    const cut = s.slice(0, max - 1).replace(/[\s,;:–-]+\S*$/, '');
    return cut + '…';
  }
  const count = () => ({ L: (SML.lessons || []).length, T: (SML.tools || []).length, G: (SML.glossary || []).length });

  const PAGES = {
    home: () => `Free interactive lessons on trading, options, retirement, taxes and FIRE: ${count().L} lessons you can play with, each with a quick quiz, plus ${count().T} calculators.`,
    tools: () => `${count().T} free interactive calculators and simulators for trading, retirement, taxes and FIRE. Each draws a picture of its answer. No sign-up, nothing stored.`,
    glossary: () => `${count().G} trading, investing and personal finance terms in plain English, from VWAP and theta to the wash sale rule, each linked to the lesson where you can try it.`,
    play: () => 'Practise day trading with fake money: replay a trading morning one 2-minute candle at a time, mark your levels, and get coaching on every trade. Prices are simulated.',
    wheel: () => 'Practise the options wheel with fake money: sell a put, maybe take the shares, sell calls and repeat, one month per click. Prices are simulated.',
    indicator: () => 'A free Pine Script indicator for TradingView that draws the four key levels, VWAP, the 13/48/200 EMA ribbon and volume breaks, with alerts.',
    sheets: () => 'Copy-ready trading spreadsheet templates with live formulas, starting with a trade journal. Edit them here, then copy them into Google Sheets or Excel.',
    apps: () => 'Three FiredBunny mobile apps are in development. Until launch, every tool is free on the web, and each preview on this page works.',
    blog: () => 'Trade breakdowns, wheel logs, checklists and routines, each with an interactive chart you can step through.',
    calendar: () => 'Fed meetings, inflation and jobs reports, PMI, options expiration, market holidays, tax deadlines and open enrollment, with why each date matters.',
    about: () => 'FiredBunny is a free, plain-English money school: ten years of money lessons turned into interactive lessons and tools on trading, retirement and FIRE.',
    editorial: () => 'Who writes FiredBunny (a pen name), how lessons are drafted with AI and checked against primary sources, and how to report an error.',
    assessment: () => 'Seven short parts, about 7 minutes: get your investor type, a risk profile, a starting mix, your FIRE number and a learning path. Answers stay in your browser.',
    results: () => 'Your FiredBunny investor profile from the self-assessment.',
    dashboard: () => 'Your goals, net worth, investor profile and lessons in one place, saved in this browser.',
    profile: () => 'The basics FiredBunny uses to tailor your dashboard, goals and assessment.',
    settings: () => 'Sync, preferences, lesson progress and your data: export, import or delete it.',
    signin: () => 'How FiredBunny saves your progress in your browser, with no account or password.',
    offline: () => 'Use FiredBunny without a connection: save lesson audio for offline listening and install the site as an app.',
    portfolio: () => 'Your brokerage accounts, connected read-only, seen the way the lessons teach: allocation, concentration, taxes, options and income.',
    support: () => 'FiredBunny is free, with no ads or affiliate links. What running it costs, where optional reader support goes, and why it is not tax-deductible.',
    'support-thanks': () => 'A thank-you from FiredBunny.',
    plans: () => 'Every lesson, tool and simulator on FiredBunny is free and stays free. An optional paid plan for extras that cost money per person to run is being considered.',
    privacy: () => 'What FiredBunny stores about you as a guest, with an account, in feedback and in usage statistics, who handles it, how long it is kept and how to delete it.',
    terms: () => 'The terms for using FiredBunny: everything is general education, not investment, tax or legal advice; figures are checked but not guaranteed; the site is free.',
    contact: () => 'How to reach FiredBunny: report a mistake, suggest a topic, or make a privacy request through the feedback form. No personal financial advice.',
    lessons: () => `All ${count().L} FiredBunny lessons in one list, grouped by track and course: trading, options, retirement, taxes and FIRE. Each has something to play with and a quick quiz.`,
    courses: () => `All ${(SML.courses || []).length} FiredBunny courses in ${(SML.tracks || []).length} tracks: trading, retirement and wealth, and FIRE. Open a course to see its lessons, level and reading time.`,
    'not-found': () => 'This page does not exist. Browse the lessons and tools instead.',
  };

  function describe(tok) {
    if (tok.indexOf('l-') === 0) {
      const l = find(SML.lessons, tok); if (!l) return '';
      const idea = clean(l.idea), sum = clean(l.summary);
      if (idea.length >= 70 && idea.length <= 165) return idea;
      if (idea.length < 70) return fit(sum && sum !== idea ? idea + ' ' + sum : idea);
      return fit(sum.length >= 60 ? sum : idea);
    }
    if (tok.indexOf('c-') === 0) {
      const c = find(SML.courses, tok.slice(2)); if (!c) return '';
      const ls = lessonsOf(c.id); const first = ls[0], last = ls[ls.length - 1];
      return fit(`${clean(c.blurb)} ${ls.length} interactive lesson${ls.length === 1 ? '' : 's'}${ls.length > 1 ? `, from ${clean(first.title)} to ${clean(last.title)}` : ''}.`);
    }
    if (tok.indexOf('tool-') === 0) {
      const t = find(SML.tools, tok); if (!t) return '';
      const l = t.lesson && find(SML.lessons, t.lesson);
      const g = SML.toolGuides && SML.toolGuides[tok]; if (g && g.meta) return fit(g.meta);
      return fit(`${clean(t.blurb)} A free interactive tool${l ? ` from the ${clean(l.title)} lesson` : ''}.`);
    }
    if (tok.indexOf('track-') === 0) {
      const tr = find(SML.tracks, tok.slice(6)); if (!tr) return '';
      const cs = coursesOf(tr.id); const n = cs.reduce((s, c) => s + lessonsOf(c.id).length, 0);
      return fit(`${clean(tr.blurb)} ${cs.length} courses, ${n} interactive lessons.`);
    }
    if (tok.indexOf('post-') === 0) { const p = find(SML.posts, tok); return p ? fit(p.excerpt) : ''; }
    if (tok === 'learn') return describe('track-trading');
    if (tok === 'tracks') return describe('courses');
    return PAGES[tok] ? fit(PAGES[tok]()) : fit(ABOUT);
  }

  // the visible title of a page, before any SEO wording
  function ownTitle(tok) {
    const r = tok.indexOf('c-') === 0 ? find(SML.courses, tok.slice(2)) : tok.indexOf('track-') === 0 ? find(SML.tracks, tok.slice(6)) : find(SML.lessons, tok) || find(SML.tools, tok) || find(SML.posts, tok);
    if (r) return tok.indexOf('track-') === 0 ? r.title + ' lessons' : r.title;
    return '';
  }
  // The visible main heading of a calculator or tool page: the plain name from its title tag ("Position size
  // calculator", the part before any colon), so the heading says what the page is. Tiles and links keep the short name.
  function heading(tok) {
    const own = ownTitle(tok), t = TITLES[tok];
    if (!t || tok.indexOf('tool-') !== 0) return own;
    const i = t.indexOf(':');
    if (i > 0) return t.slice(0, i);
    return t.length <= 40 ? t : own;
  }
  // Glossary terms in A to Z order, each with its stable anchor on the glossary page (/glossary/#g-vwap), unique even
  // when two terms make the same slug. The page and its structured data both use this list.
  function glossaryTerms() {
    const ids = new Set();
    return (SML.glossary || []).slice().sort((a, b) => a.t.localeCompare(b.t)).map((g) => {
      const base = 'g-' + (R() ? R().slugify(g.t) : String(g.t).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      let id = base; for (let i = 2; ids.has(id); i++) id = base + '-' + i;
      ids.add(id);
      return { g, id };
    });
  }
  // the document <title>: the page's descriptive title, then the brand
  function title(tok, pageTitle) {
    if (tok === 'home') return TITLES.home;
    const t = TITLES[tok] || clean(pageTitle) || ownTitle(tok) || BRAND;
    return t === BRAND ? BRAND : t + ' · ' + BRAND;
  }
  // a language that hasn't launched (SML.LANG.live false, tools/i18n/langs.json) keeps every page out of search
  const LANG = SML.LANG || null;
  const isNoindex = (tok) => tok === 'not-found' || (R() && R().isPrivate(tok)) || !!(LANG && !LANG.live);
  const isArticle = (tok) => tok.indexOf('l-') === 0 || tok.indexOf('post-') === 0;

  // Each indexable page has its own preview image, drawn by the build (tools/prerender.py) from card() at
  // /og/<its address>.jpg (for /lessons/wheel-strategy/: /og/lessons/wheel-strategy.jpg). The home page and per-visitor
  // pages keep the site image.
  function imageOf(tok) {
    if (tok === 'home' || isNoindex(tok) || !R() || R().canonicalOf(tok) !== tok) return IMAGE;
    return ORIGIN + '/og' + R().path(tok).replace(/\/$/, '') + '.jpg';
  }
  // what the preview image says: a small label, the page's name and one line about it
  function card(tok) {
    const strip = (x) => clean(String(x || '').replace(/<[^>]+>/g, ''));
    const tr = (id) => find(SML.tracks, id), co = (id) => find(SML.courses, id);
    if (tok.indexOf('l-') === 0) {
      const l = find(SML.lessons, tok); const c = l && co(l.course);
      return { kind: 'Lesson' + (c ? ' · ' + c.title : ''), title: l ? l.title : ownTitle(tok), sub: strip(l && (l.idea || l.summary)) };
    }
    if (tok.indexOf('tool-') === 0) { const t = find(SML.tools, tok); return { kind: 'Free calculator', title: heading(tok), sub: strip(t && t.blurb) }; }
    if (tok.indexOf('c-') === 0) { const c = co(tok.slice(2)); return { kind: 'Course' + (c && tr(c.track || 'trading') ? ' · ' + tr(c.track || 'trading').title + ' track' : ''), title: c ? c.title : ownTitle(tok), sub: strip(c && c.blurb) }; }
    if (tok.indexOf('track-') === 0) { const t = tr(tok.slice(6)); return { kind: 'Track', title: t ? t.title + ' track' : ownTitle(tok), sub: strip(t && t.blurb) }; }
    if (tok.indexOf('post-') === 0) { const p = find(SML.posts, tok); return { kind: 'Trade note', title: p ? p.title : ownTitle(tok), sub: strip(p && p.excerpt) }; }
    const t = TITLES[tok] || ownTitle(tok) || BRAND; const i = t.indexOf(':');
    return { kind: 'FiredBunny', title: i > 0 ? t.slice(0, i) : t, sub: i > 0 ? t.slice(i + 1).trim() : describe(tok) };
  }
  function meta(tok, pageTitle) {
    const canonTok = R() ? R().canonicalOf(tok) : tok;
    const img = imageOf(tok);
    return {
      title: title(tok, pageTitle),
      description: describe(tok),
      canonical: tok === 'not-found' ? '' : url(canonTok),
      url: tok === 'not-found' ? '' : url(tok),
      robots: isNoindex(tok) ? 'noindex, follow' : 'index, follow, max-image-preview:large',
      indexable: !isNoindex(tok) && canonTok === tok,
      type: isArticle(tok) ? 'article' : 'website',
      image: img, imageWidth: 1200, imageHeight: 630, imageAlt: img === IMAGE ? 'FiredBunny: learn the market by playing with it' : clean(card(tok).title) + ' · FiredBunny',
      locale: LANG ? LANG.ogLocale || LANG.locale.replace('-', '_') : 'en_US',
    };
  }

  const ORG = { '@type': 'Organization', '@id': ORIGIN + '/#organization', name: BRAND, legalName: 'FluidWeb LLC', url: ORIGIN + '/', logo: LOGO, description: ABOUT, publishingPrinciples: ORIGIN + '/editorial-standards/' };
  const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: it[1] })) });
  // structured data that matches what the page shows; opts.lastmod is the date its content last changed and
  // opts.published the date the page first shipped (both YYYY-MM-DD, kept by the build in tools/seo-lastmod.json)
  function jsonld(tok, opts) {
    opts = opts || {};
    const m = meta(tok);
    if (isNoindex(tok)) return [];
    if (tok === 'home') return [
      Object.assign({ '@context': 'https://schema.org' }, ORG),
      { '@context': 'https://schema.org', '@type': 'WebSite', '@id': ORIGIN + '/#website', name: BRAND, url: ORIGIN + '/', description: ABOUT, inLanguage: LANG ? LANG.locale : 'en-US', publisher: { '@id': ORIGIN + '/#organization' } },
    ];
    const article = (headline, extra) => Object.assign({
      '@context': 'https://schema.org', '@type': 'Article', headline: fit(headline, 110), description: m.description, url: m.url, mainEntityOfPage: m.url,
      image: [m.image], inLanguage: LANG ? LANG.locale : 'en-US', isAccessibleForFree: true,
      author: { '@type': 'Organization', name: BRAND, url: ORIGIN + '/' }, publisher: ORG,
    }, extra);
    if (tok.indexOf('l-') === 0) {
      const l = find(SML.lessons, tok); if (!l) return [];
      const c = find(SML.courses, l.course), tr = trackOf(c);
      const out = [];
      if (c && tr) out.push(crumbs([[tr.title, url('track-' + tr.id)], [c.title, url('c-' + c.id)], [l.title, m.url]]));
      const extra = { learningResourceType: 'Lesson', educationalLevel: l.level || 'Beginner', teaches: clean(l.idea) };
      if (l.mins) extra.timeRequired = 'PT' + l.mins + 'M';
      if (opts.published && (!opts.lastmod || opts.published <= opts.lastmod)) extra.datePublished = opts.published;
      if (opts.lastmod) extra.dateModified = opts.lastmod;
      out.push(article(l.title, extra));
      return out;
    }
    if (tok.indexOf('c-') === 0) {
      const c = find(SML.courses, tok.slice(2)), tr = trackOf(c);
      return c && tr ? [crumbs([[tr.title, url('track-' + tr.id)], [c.title, m.url]])] : [];
    }
    if (tok.indexOf('tool-') === 0) {
      const t = find(SML.tools, tok); if (!t) return [];
      // a free web calculator; no rating or review is marked up because there are none
      return [crumbs([['Tools', url('tools')], [heading(tok), m.url]]), {
        '@context': 'https://schema.org', '@type': 'WebApplication', name: heading(tok), description: m.description, url: m.url,
        applicationCategory: 'FinanceApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript', inLanguage: LANG ? LANG.locale : 'en-US',
        isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': ORIGIN + '/#organization', '@type': 'Organization', name: BRAND, url: ORIGIN + '/' },
      }];
    }
    if (tok === 'glossary') {
      const set = m.url + '#terms';
      return [{
        '@context': 'https://schema.org', '@type': 'DefinedTermSet', '@id': set, name: 'FiredBunny glossary', description: m.description, url: m.url, inLanguage: LANG ? LANG.locale : 'en-US',
        hasDefinedTerm: glossaryTerms().map((x) => { const o = { '@type': 'DefinedTerm', name: x.g.t, description: clean(x.g.d), url: m.url + '#' + x.id }; if (x.g.full) o.alternateName = x.g.full; return o; }),
      }];
    }
    if (tok.indexOf('post-') === 0) {
      const p = find(SML.posts, tok); if (!p) return [];
      const extra = {};
      if (/^\d{4}-\d{2}-\d{2}$/.test(p.date || '')) extra.datePublished = p.date;
      const mod = opts.lastmod && (!extra.datePublished || opts.lastmod >= extra.datePublished) ? opts.lastmod : extra.datePublished;
      if (mod) extra.dateModified = mod;
      return [crumbs([['Trade notes', url('blog')], [p.title, m.url]]), article(p.title, extra)];
    }
    return [];
  }

  /* Keep the live document's head in step with the page drawn (website only). The pre-built HTML already carries the
     right tags for its own address; this matters when a page is reached by a link inside the site, or opened from the
     offline copy. Structured data from another page is removed, never left behind. */
  function setTag(sel, make, attr, value) {
    let el = document.head.querySelector(sel);
    if (value == null || value === '') { if (el) el.remove(); return; }
    if (!el) { el = make(); document.head.appendChild(el); }
    el.setAttribute(attr, value);
  }
  const metaEl = (k, v) => () => { const e = document.createElement('meta'); e.setAttribute(k, v); return e; };
  function apply(tok) {
    if (!R() || R().mode !== 'path' || !document.head) return;
    const m = meta(tok, null);
    setTag('meta[name="description"]', metaEl('name', 'description'), 'content', m.description);
    setTag('meta[name="robots"]', metaEl('name', 'robots'), 'content', m.robots);
    setTag('link[rel="canonical"]', () => { const e = document.createElement('link'); e.rel = 'canonical'; return e; }, 'href', m.canonical);
    setTag('meta[property="og:title"]', metaEl('property', 'og:title'), 'content', document.title);
    setTag('meta[property="og:description"]', metaEl('property', 'og:description'), 'content', m.description);
    setTag('meta[property="og:url"]', metaEl('property', 'og:url'), 'content', m.url);
    setTag('meta[property="og:type"]', metaEl('property', 'og:type'), 'content', m.type);
    setTag('meta[name="twitter:title"]', metaEl('name', 'twitter:title'), 'content', document.title);
    setTag('meta[name="twitter:description"]', metaEl('name', 'twitter:description'), 'content', m.description);
    document.querySelectorAll('script[type="application/ld+json"][data-fb-tok]').forEach((s) => { if (s.getAttribute('data-fb-tok') !== tok) s.remove(); });
  }

  SML.seo = { ORIGIN, ABOUT, TITLES, title, heading, glossaryTerms, card, imageOf, meta, describe, jsonld, apply };
})();
