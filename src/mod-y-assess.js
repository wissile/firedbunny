/* FiredBunny self-assessment (fork Q).
   SML.pages.assessment : seven-section interactive quiz (one section per screen, progress trail, live hints).
   SML.assess           : { score(answers, opts), archetypes, sections, styleLabels, goalLabels }.

   Everything here is educational rules of thumb, not advice. The scoring is plain arithmetic, documented next to the
   code, and deterministic: the same answers always give the same scores (only id/date differ between runs).
   Answers in progress live in SML.store('assessProgress'); the finished result is the draft (SML.store('assessDraft')
   and SML.assessDraft) and the router then goes to #results, which owns saving. */
(function () {
  'use strict';
  const SML = window.SML;
  const esc = SML.esc;
  const cl = (v, a, b) => Math.min(b == null ? 100 : b, Math.max(a == null ? 0 : a, v));
  const fin = (v) => typeof v === 'number' && isFinite(v);
  const r0 = (v) => Math.round(v);
  const r1 = (v) => Math.round(v * 10) / 10;
  const YEAR = () => new Date().getFullYear();
  const usd = (v) => (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US');
  const big = (v) => { const a = Math.abs(v), s = v < 0 ? '−' : ''; if (a >= 1e6) return s + '$' + (Math.round(a / 1e4) / 100).toLocaleString('en-US') + 'M'; if (a >= 1e4) return s + '$' + Math.round(a / 1e3).toLocaleString('en-US') + 'k'; return usd(v); };
  const ico = {
    check: '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    up: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    grip: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><g fill="currentColor"><circle cx="5.5" cy="4" r="1.3"/><circle cx="10.5" cy="4" r="1.3"/><circle cx="5.5" cy="8" r="1.3"/><circle cx="10.5" cy="8" r="1.3"/><circle cx="5.5" cy="12" r="1.3"/><circle cx="10.5" cy="12" r="1.3"/></g></svg>',
    arrowR: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowL: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M13 8H3M7 4L3 8l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  /* ===================================================================================================
     Questions. Types: slider (linear or money scale), pick (tap cards; style 'tot' = this-or-that),
     scenario (pick with a little chart), portfolio (pick with outcome ranges), rank, rate (0-4 per row),
     poles (slider between two ends), group (sub-heading), viz (live picture, not a question).
     =================================================================================================== */
  const SC = {
    income: [0, 25000, 50000, 75000, 100000, 150000, 200000, 300000, 500000, 1000000],
    cash: [0, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000],
    retirement: [0, 5000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000],
    brokerage: [0, 1000, 5000, 25000, 50000, 100000, 250000, 500000, 1000000, 3000000],
    home: [0, 25000, 50000, 100000, 200000, 400000, 750000, 1500000, 3000000],
    crypto: [0, 500, 2000, 5000, 10000, 25000, 50000, 100000, 500000],
    other: [0, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 2000000],
    debtHigh: [0, 500, 2000, 5000, 10000, 20000, 40000, 75000],
    debtOther: [0, 2500, 10000, 25000, 50000, 100000, 200000, 400000],
    save: [0, 100, 250, 500, 1000, 2000, 3500, 5000, 10000, 20000],
    spend: [0, 1000, 2000, 3000, 4000, 6000, 8000, 12000, 20000, 40000],
    rspend: [1000, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 25000],
    oinc: [0, 500, 1000, 1500, 2000, 3000, 4000, 6000, 10000],
  };
  const yrs = (n) => (n === 1 ? '1 year' : n + ' years');

  const SECTIONS = [
    { key: 'you', title: 'You', blurb: 'The basics that shape how much risk your life can carry.', qs: [
      { id: 'age', type: 'slider', q: 'How old are you?', min: 18, max: 80, step: 1, def: 35, ro: (v) => `${v}<small>years old</small>`, viz: 'life1', w: 'full' },
      { id: 'household', type: 'pick', style: 'tot', q: 'Who shares your money life?', opts: [['single', 'Just me', 'One income, one set of decisions'], ['couple', 'Me and a partner', 'Shared goals, maybe two incomes'], ['family', 'Family with kids', 'More people, more planning']], w: 'full' },
      { id: 'dependents', type: 'slider', q: 'How many people count on your income?', sub: 'Kids, a partner who does not earn, parents you support.', min: 0, max: 6, step: 1, def: 0, ro: (v) => (v === 0 ? 'None<small>just you</small>' : `${v >= 6 ? '6+' : v}<small>${v === 1 ? 'person' : 'people'}</small>`) },
      { id: 'income', type: 'slider', scale: 'income', q: 'Household income per year, before tax', def: 75000 },
      { id: 'job', type: 'pick', q: 'How steady is that income?', opts: [['very', 'Rock solid', 'Government, tenure, long-time employer'], ['stable', 'Pretty steady', 'Salaried, skills in demand'], ['variable', 'It swings', 'Commission, freelance, startup'], ['none', 'Not working now', 'Between jobs, retired or studying']], w: 'full' },
    ] },
    { key: 'money', title: 'Money today', blurb: 'Rough numbers are fine. Drag the sliders, or tap a number to type it.', qs: [
      { type: 'group', title: 'What you own' },
      { id: 'cash', type: 'slider', scale: 'cash', q: 'Cash: checking, savings, money market', def: 10000 },
      { id: 'retirement', type: 'slider', scale: 'retirement', q: '401(k), IRA and other retirement accounts', def: 25000 },
      { id: 'brokerage', type: 'slider', scale: 'brokerage', q: 'Regular brokerage account (taxable)', def: 5000 },
      { id: 'homeEquity', type: 'slider', scale: 'home', q: 'Home equity: what your home is worth minus the mortgage', def: 0 },
      { id: 'crypto', type: 'slider', scale: 'crypto', q: 'Crypto', def: 0 },
      { id: 'otherAssets', type: 'slider', scale: 'other', q: 'Anything else: business, rental property, vehicles', def: 0 },
      { type: 'group', title: 'What you owe' },
      { id: 'debtHigh', type: 'slider', scale: 'debtHigh', q: 'Credit cards and personal loans', sub: 'The expensive kind, usually 10% interest or more.', def: 0 },
      { id: 'debtOther', type: 'slider', scale: 'debtOther', q: 'Student loans, car loans, other debt', sub: 'Leave out the mortgage; home equity already counts it.', def: 0 },
      { type: 'viz', viz: 'networth' },
      { type: 'group', title: 'Each month' },
      { id: 'saveMonth', type: 'slider', scale: 'save', q: 'What you save or invest each month', def: 500 },
      { id: 'spendMonth', type: 'slider', scale: 'spend', q: 'What you spend each month, all in', sub: 'Rent or mortgage, food, bills, fun.', def: 3500 },
      { type: 'viz', viz: 'savings' },
    ] },
    { key: 'goals', title: 'Goals', blurb: 'Where you want to hop to, and when.', qs: [
      { id: 'retireAge', type: 'slider', q: 'At what age would you like work to be optional?', min: 35, max: 75, step: 1, def: 65, ro: (v, A) => { const n = Math.max(0, v - num(A.age, 35)); return `${v}<small>${n ? 'in ' + yrs(n) : 'now'}</small>`; }, viz: 'life2', w: 'full' },
      { id: 'goals', type: 'rank', q: 'Rank what matters most to you', sub: 'Tap goals in order of importance. Drag or use the arrows to reorder. Your top three count most.', items: [['early', 'Retire early'], ['retire', 'Retire comfortably'], ['income', 'Extra income now'], ['grow', 'Grow wealth fast'], ['protect', 'Protect what I have'], ['house', 'Buy a home'], ['debt', 'Get out of debt'], ['family', 'Pay for kids or family'], ['learn', 'Learn trading as a skill']], w: 'full' },
      { id: 'retireSpend', type: 'slider', scale: 'rspend', q: 'Once work is optional, what would you spend each month?', sub: 'In today’s dollars. Start from what you spend now.', def: 3500 },
      { id: 'otherIncome', type: 'slider', scale: 'oinc', q: 'Social Security or a pension you expect, per month', sub: 'Optional. Today’s dollars; leave at $0 if unsure.', def: 0 },
      { type: 'viz', viz: 'fire' },
    ] },
    { key: 'style', title: 'Time and style', blurb: 'How you like to spend time with your money.', qs: [
      { id: 'hours', type: 'slider', q: 'Hours a week you would happily spend on investing', min: 0, max: 40, step: 1, def: 3, ro: (v) => `${v >= 40 ? '40+' : v}<small>hours a week</small>`, viz: 'hours' },
      { id: 'activeness', type: 'poles', q: 'Set it and forget it, or hands on the wheel?', left: 'Set and forget', right: 'Hands on', def: 50 },
      { id: 'marketHours', type: 'pick', q: 'Could you watch the market on weekday mornings, 9:30 to 11:30 ET?', opts: [['yes', 'Most days', 'My schedule is flexible'], ['some', 'Some days', 'A couple of mornings a week'], ['no', 'Not really', 'Work, kids or time zone']], w: 'full' },
      { id: 'lens', type: 'pick', q: 'Which sounds more fun?', opts: [['charts', 'Reading charts', 'Price, volume, levels, patterns'], ['business', 'Reading businesses', 'Earnings, balance sheets, moats'], ['both', 'Both, honestly', 'Story and timing together'], ['neither', 'Neither', 'I want it simple']], w: 'full' },
      { id: 'holding', type: 'pick', q: 'How long do you like to hold an investment?', opts: [['minutes', 'Minutes to hours', 'In and out the same day'], ['days', 'Days to weeks', 'Catch a move, then step off'], ['months', 'Months', 'Let a story play out'], ['years', 'Years to decades', 'Buy and keep']], w: 'full' },
      { id: 'options', type: 'pick', q: 'Selling options, like cash-secured puts and covered calls, for income?', opts: [['no', 'Not for me', 'Sounds complicated'], ['curious', 'Curious', 'I would like to learn'], ['income', 'I want that income', 'Steady premium sounds great'], ['already', 'I already do', 'I trade options now']], w: 'full' },
      { id: 'cryptoInt', type: 'pick', q: 'And crypto?', opts: [['none', 'Pass', 'Not interested'], ['curious', 'A small bet, maybe', 'Curious, not convinced'], ['believer', 'I believe in it', 'Long-term conviction'], ['heavy', 'I already hold a lot', 'It is a big part of my money']], w: 'full' },
    ] },
    { key: 'risk', title: 'Risk', blurb: 'No wrong answers. Go with your gut, not with what sounds smart.', qs: [
      { id: 'drop', type: 'scenario', chart: 'drop', q: 'Your $10,000 is worth $7,000 a month later. The whole market fell too. You…', opts: [['sell', 'Sell everything', 'Stop the bleeding'], ['trim', 'Sell some', 'Take a little off the table'], ['hold', 'Hold', 'Wait it out'], ['buy', 'Buy more', 'It is on sale']], w: 'full' },
      { id: 'drawdown', type: 'slider', q: 'In a bad year, how far could your investments fall before you would lose sleep?', min: 0, max: 60, step: 1, def: 20, ro: (v) => `−${v}%<small>${moodOf(v).label}</small>`, viz: 'mood', w: 'full' },
      { id: 'gamble', type: 'pick', style: 'tot', q: 'Pick one', opts: [['sure', '$1,000 for sure', 'Money in hand'], ['half', '50% chance of $2,500', 'Or nothing'], ['long', '20% chance of $10,000', 'Or nothing']], w: 'full' },
      { id: 'portfolio', type: 'portfolio', q: 'Which portfolio would you hold for ten years?', sub: 'Each shows a typical worst year and best year. Bigger swings have tended to pay more over time.', opts: [['a', 'A', -5, 10, 4], ['b', 'B', -15, 25, 6], ['c', 'C', -30, 45, 8], ['d', 'D', -50, 80, 9]], w: 'full' },
      { id: 'leverage', type: 'pick', q: 'Borrowing to invest: margin, leveraged ETFs, loans', opts: [['never', 'Never', 'Only my own money'], ['small', 'Maybe a little', 'With strict limits'], ['setup', 'When the setup is good', 'It is a tool'], ['already', 'I already do', 'Part of my approach']], w: 'full' },
      { id: 'sleep', type: 'pick', q: 'The market drops 20% overnight on scary news. Tonight you…', opts: [['fine', 'Sleep fine', 'It will come back'], ['check', 'Check the app a few times', 'Uneasy, but okay'], ['awake', 'Lie awake', 'Running numbers in my head'], ['sell', 'Sell before bed', 'Better safe']], w: 'full' },
    ] },
    { key: 'temper', title: 'Temperament', blurb: 'How you act when money gets emotional. Be honest; this part decides most results.', qs: [
      { id: 'fomo', type: 'scenario', chart: 'rocket', q: 'A stock everyone is talking about is up 80% this month. You…', opts: [['jump', 'Jump in now', 'Before it runs more'], ['small', 'Buy a little', 'Just in case'], ['research', 'Research it first', 'Maybe later, maybe never'], ['ignore', 'Let it go', 'Not my trade']], w: 'full' },
      { id: 'rules', type: 'scenario', chart: 'stop', q: 'Your plan says sell at −5%. It hits −5%, but you have a feeling it will bounce. You…', opts: [['sell', 'Sell, as planned', 'The plan is the plan'], ['move', 'Move the stop lower', 'Give it a little room'], ['hope', 'Hold and hope', 'It will come back'], ['add', 'Buy more', 'Lower my average']], w: 'full' },
      { id: 'patience', type: 'pick', style: 'tot', q: 'A great company you own goes nowhere for two years. You…', opts: [['sell', 'Sell and move on', 'Money should move'], ['annoyed', 'Hold, but it bugs me', 'Checking it a lot'], ['hold', 'Hold happily', 'And buy more']], w: 'full' },
      { id: 'streak', type: 'pick', q: 'You have lost four trades in a row. You…', opts: [['pause', 'Pause and review', 'Find what went wrong'], ['smaller', 'Keep going, smaller', 'Cut size until it turns'], ['bigger', 'Go bigger', 'Win it back'], ['quit', 'Quit for good', 'Trading is not for me']], w: 'full' },
      { id: 'research', type: 'pick', style: 'tot', q: 'A 100-page annual report sounds like…', opts: [['love', 'A great Saturday', 'Coffee and footnotes'], ['ok', 'Fine, if I must', 'I can skim it'], ['nap', 'A sleeping pill', 'Give me the summary']], w: 'full' },
      { id: 'speed', type: 'pick', q: 'When a money decision has to be made fast, you…', opts: [['gut', 'Decide in seconds', 'And live with it'], ['checklist', 'Run a quick checklist', 'Fast, with rules'], ['slow', 'Need time to think', 'Sleep on it'], ['freeze', 'Freeze', 'Then regret it']], w: 'full' },
    ] },
    { key: 'know', title: 'Knowledge', blurb: 'Rate yourself honestly. Beginners get a different path, not a worse one.', qs: [
      { id: 'know', type: 'rate', q: 'How well do you know…', rows: [['kStocks', 'Stocks and ETFs'], ['kOptions', 'Options'], ['kCharts', 'Charts and technical analysis'], ['kStatements', 'Financial statements'], ['kTaxes', 'Taxes on investing'], ['kRetire', 'Retirement accounts: 401(k), IRA']], w: 'full' },
      { id: 'years', type: 'slider', q: 'Years investing with real money', min: 0, max: 30, step: 1, def: 0, ro: (v) => (v === 0 ? 'New<small>just starting</small>' : `${v >= 30 ? '30+' : v}<small>${v === 1 ? 'year' : 'years'}</small>`), w: 'full' },
    ] },
  ];
  const RATE_LABELS = ['New to me', 'Heard of it', 'Know the basics', 'Comfortable', 'Could teach it'];
  const QS = []; SECTIONS.forEach((s, i) => s.qs.forEach((q) => { if (q.id) { q.sec = i; QS.push(q); } }));
  const DEF = {}; QS.forEach((q) => { if (q.def != null) DEF[q.id] = q.def; });
  const num = (v, d) => { const n = Number(v); return v !== '' && v != null && isFinite(n) ? n : d; };

  /* ---------- money scale: equal slider steps between "stops", so small amounts get room ---------- */
  const POS = 1000;
  const niceRound = (v) => { const s = v < 2000 ? 50 : v < 10000 ? 250 : v < 50000 ? 1000 : v < 250000 ? 5000 : v < 1e6 ? 10000 : 50000; return Math.round(v / s) * s; };
  function posToVal(stops, p) {
    const n = stops.length - 1, t = cl(num(p, 0) / POS, 0, 1) * n; const i = Math.min(n - 1, Math.floor(t)), f = t - i;
    return niceRound(stops[i] + f * (stops[i + 1] - stops[i]));
  }
  function valToPos(stops, v) {
    v = num(v, stops[0]); const n = stops.length - 1;
    if (v <= stops[0]) return 0; if (v >= stops[n]) return POS;
    for (let i = 0; i < n; i++) if (v <= stops[i + 1]) return Math.round(((i + (v - stops[i]) / (stops[i + 1] - stops[i] || 1)) / n) * POS);
    return POS;
  }
  function parseMoney(s) {
    s = String(s == null ? '' : s).toLowerCase().replace(/[$,\s]/g, '');
    const m = s.match(/^(\d*\.?\d+)([km]?)$/); if (!m) return NaN;
    let v = parseFloat(m[1]); if (m[2] === 'k') v *= 1e3; if (m[2] === 'm') v *= 1e6; return v;
  }

  /* ===================================================================================================
     Archetypes and labels
     =================================================================================================== */
  const archetypes = {
    steady: { key: 'steady', style: 'passive', name: 'Steady Bunny', tagline: 'Buy the whole market, keep hopping, let time do the heavy lifting.', description: 'You like simple, cheap and automatic. Your edge is not touching it: low-cost index funds, money going in every month, a rebalance once a year. Boring is the point, and boring has quietly beaten most professionals over long stretches.' },
    detective: { key: 'detective', style: 'value', name: 'Detective Bunny', tagline: 'Find great businesses at fair prices, then wait.', description: 'You want to know how a company makes money before you own it. You read the numbers, look for a margin of safety and are happy to hold for years while the market catches up. Patience and homework are your tools.' },
    surfer: { key: 'surfer', style: 'swing', name: 'Surfer Bunny', tagline: 'Catch the swing, ride it for days, step off before it breaks.', description: 'You like charts and timing, but not living at the screen. You plan trades around levels and trends, hold for days to weeks and cut losers fast. Rules and position sizing are what keep a surfer on the board.' },
    sprinter: { key: 'sprinter', style: 'day', name: 'Sprinter Bunny', tagline: 'Fast in, fast out, strict rules, done by lunch.', description: 'You enjoy speed, levels and volume, and you can watch the open. Day trading rewards preparation and punishes impulse: a written plan, small risk per trade and a hard stop for the day matter more than any setup.' },
    farmer: { key: 'farmer', style: 'wheel', name: 'Farmer Bunny', tagline: 'Plant puts, harvest premium, repeat every season.', description: 'You like steady income more than home runs. Selling cash-secured puts and covered calls on stocks you would happily own turns time into premium. The craft is picking good fields: quality stocks, sensible strikes and never more than you can cover.' },
    freedom: { key: 'freedom', style: 'fire', name: 'Freedom Bunny', tagline: 'Every dollar saved buys back a day of your life.', description: 'Your real goal is options, not excitement. A high savings rate, low-cost investing and a clear FIRE number move you toward work being optional. The math is simple; sticking with it for years is the skill.' },
  };
  const STYLE_TO_ARCH = { passive: 'steady', value: 'detective', swing: 'surfer', day: 'sprinter', wheel: 'farmer', fire: 'freedom' };
  const ARCH_ORDER = ['steady', 'freedom', 'detective', 'farmer', 'surfer', 'sprinter']; // tie-break: calmer first
  const styleLabels = { passive: 'Passive index', value: 'Value investing', swing: 'Swing trading', day: 'Day trading', wheel: 'The wheel', fire: 'FIRE', crypto: 'Crypto' };
  const goalLabels = {}; SECTIONS[2].qs[1].items.forEach(([k, l]) => { goalLabels[k] = l; });
  const PROFILES = {
    conservative: { label: 'Conservative', allocation: { stocks: 30, bonds: 50, cash: 20 }, sat: 5, crypto: 1 },
    moderate: { label: 'Moderate', allocation: { stocks: 50, bonds: 40, cash: 10 }, sat: 10, crypto: 2 },
    balanced: { label: 'Balanced', allocation: { stocks: 60, bonds: 35, cash: 5 }, sat: 15, crypto: 3 },
    growth: { label: 'Growth', allocation: { stocks: 80, bonds: 15, cash: 5 }, sat: 20, crypto: 5 },
    aggressive: { label: 'Aggressive', allocation: { stocks: 90, bonds: 5, cash: 5 }, sat: 25, crypto: 8 },
  };

  /* ===================================================================================================
     SCORING. Missing answers count as neutral (50) so the live hint works mid-quiz.
     W([[value, weight], ...]) is a weighted average of 0-100 values.
     =================================================================================================== */
  const W = (pairs) => { let s = 0, w = 0; pairs.forEach(([v, k]) => { if (fin(v)) { s += v * k; w += k; } }); return w ? s / w : 50; };

  function inputsOf(a) {
    const n = (id) => num(a[id], DEF[id] == null ? 0 : DEF[id]);
    const m = (id) => Math.max(0, n(id));
    const age = r0(cl(n('age'), 14, 100));
    const retireAge = r0(cl(n('retireAge'), 30, 90));
    const dependents = r0(cl(n('dependents'), 0, 20));
    const household = ['single', 'couple', 'family'].indexOf(a.household) >= 0 ? a.household : (dependents > 0 ? 'family' : 'single');
    const cash = m('cash'), retirement = m('retirement'), brokerage = m('brokerage'), homeEquity = m('homeEquity'), crypto = m('crypto'), otherAssets = m('otherAssets');
    const debtHigh = m('debtHigh'), debtOther = m('debtOther');
    const savingsMonth = m('saveMonth'), spendMonth = m('spendMonth');
    return {
      age, retireAge, horizon: Math.max(0, retireAge - age), household, dependents, incomeYear: m('income'),
      savingsMonth, spendMonth,
      netWorth: cash + retirement + brokerage + homeEquity + crypto + otherAssets - debtHigh - debtOther,
      investable: retirement + brokerage + crypto, // same definition as SML.account.netWorth()
      cash, homeEquity, debtHigh, debtOther,
      emergencyMonths: spendMonth > 0 ? r1(Math.min(cash / spendMonth, 99)) : (cash > 0 ? 99 : 0),
      hoursWeek: r0(cl(n('hours'), 0, 80)), experienceYears: r0(cl(n('years'), 0, 80)),
      otherIncomeMonth: m('otherIncome'), // Social Security or pension a month, today's dollars (0 if unsure)
      // private extras (not copied into result.inputs)
      _x: { retirement, brokerage, crypto, otherAssets, retireSpend: Math.max(0, num(a.retireSpend, spendMonth || DEF.retireSpend)), savingsRate: savingsMonth + spendMonth > 0 ? savingsMonth / (savingsMonth + spendMonth) : 0 },
    };
  }

  function score(answers, opts) {
    const a = Object.assign({}, answers || {}); const o = opts || {};
    const I = inputsOf(a), X = I._x;
    const pk = (id, map, d) => (a[id] != null && map[a[id]] != null ? map[a[id]] : (d == null ? 50 : d));
    const rate = (id) => (fin(num(a[id], NaN)) ? cl(num(a[id], 0), 0, 4) * 25 : 25); // unrated = "heard of it"
    const goals = Array.isArray(a.goals) ? a.goals.filter((g) => goalLabels[g]) : [];
    const goalPts = (k) => { if (!goals.length) return 50; const i = goals.indexOf(k); return i === 0 ? 100 : i === 1 ? 80 : i === 2 ? 60 : i > 2 ? 40 : 15; };
    const hours = I.hoursWeek;

    /* RISK WILLINGNESS (how much risk you want): scenario 25, drawdown slider 25 (50% drop = 100),
       sure-thing vs gamble 15, portfolio pick 15, leverage 10, overnight-crash sleep test 10. */
    const willingness = W([
      [pk('drop', { sell: 0, trim: 30, hold: 70, buy: 100 }), 25],
      [cl(num(a.drawdown, DEF.drawdown) / 50 * 100), 25],
      [pk('gamble', { sure: 15, half: 60, long: 100 }), 15],
      [pk('portfolio', { a: 10, b: 40, c: 70, d: 100 }), 15],
      [pk('leverage', { never: 10, small: 45, setup: 80, already: 100 }), 10],
      [pk('sleep', { fine: 100, check: 65, awake: 30, sell: 0 }), 10],
    ]);
    /* RISK CAPACITY (how much risk your life can absorb), 100 points:
       time to target age 30 (full at 22+ years), scaled by min(1, cash cushion / 3 months) because a long runway
       does not help someone who would have to sell in the first emergency; emergency fund 20 (full at 6 months of
       spending); high-interest debt 15 (all lost at 6 months of income owed); income stability 15; dependents 10
       (minus 2.5 each); savings rate 10 (full at 30% of take-home kept).
       HARD CAP: capacity is at most 45 while there is any card or personal-loan debt, or under 1 month of cash. */
    const incomeMonth = I.incomeYear / 12;
    const debtMonths = incomeMonth > 0 ? I.debtHigh / incomeMonth : (I.debtHigh > 0 ? 6 : 0);
    let capacity = 30 * cl((I.horizon + 3) / 25, 0, 1) * Math.min(1, I.emergencyMonths / 3) + 20 * cl(I.emergencyMonths / 6, 0, 1) + 15 * cl(1 - debtMonths / 6, 0, 1)
      + pk('job', { very: 15, stable: 11, variable: 5, none: 3 }, 9) + Math.max(0, 10 - 2.5 * I.dependents) + 10 * cl(X.savingsRate / 0.3, 0, 1);
    if (I.debtHigh > 0 || I.emergencyMonths < 1) capacity = Math.min(capacity, 45);
    /* OVERALL RISK = 0.7 x the lower + 0.3 x the higher of capacity and willingness, then clamped to at most
       5 points above the lower one: never take more risk than either your life or your nerves allow. */
    const lowRisk = Math.min(capacity, willingness);
    const risk = Math.min(0.7 * lowRisk + 0.3 * Math.max(capacity, willingness), lowRisk + 5);

    /* TRAITS (0-100 each) */
    const patience = W([[pk('patience', { sell: 15, annoyed: 55, hold: 95 }), 40], [pk('holding', { minutes: 10, days: 40, months: 70, years: 100 }), 30], [pk('fomo', { jump: 10, small: 45, research: 75, ignore: 95 }), 30]]);
    const discipline = W([[pk('rules', { sell: 100, move: 45, hope: 15, add: 0 }), 45], [pk('streak', { pause: 100, smaller: 85, bigger: 0, quit: 30 }), 35], [pk('fomo', { jump: 10, small: 55, research: 85, ignore: 80 }), 20]]);
    const analytical = W([[pk('research', { love: 100, ok: 60, nap: 15 }), 45], [pk('lens', { charts: 70, business: 85, both: 100, neither: 15 }), 30], [rate('kStatements'), 25]]);
    const handsOn = W([[cl(num(a.activeness, DEF.activeness)), 50], [cl(hours / 15 * 100), 30], [pk('holding', { minutes: 100, days: 75, months: 40, years: 10 }), 20]]);
    const emotionalControl = W([[pk('drop', { sell: 10, trim: 45, hold: 85, buy: 90 }), 30], [pk('sleep', { fine: 100, check: 70, awake: 35, sell: 5 }), 25], [pk('streak', { pause: 95, smaller: 85, bigger: 5, quit: 40 }), 25], [pk('speed', { gut: 55, checklist: 100, slow: 70, freeze: 20 }), 20]]);
    const ratings = ['kStocks', 'kOptions', 'kCharts', 'kStatements', 'kTaxes', 'kRetire'].map(rate);
    const knowledge = 0.75 * (ratings.reduce((s, v) => s + v, 0) / ratings.length) + 0.25 * cl(I.experienceYears / 10 * 100);
    const timeAvailable = 0.7 * cl(hours / 20 * 100) + 0.3 * pk('marketHours', { yes: 100, some: 50, no: 0 });
    const traits = { patience, discipline, riskAppetite: willingness, analytical, handsOn, emotionalControl, knowledge, timeAvailable };

    /* STYLE FIT (0-100): weighted blends of traits and preferences. */
    const chartsLens = pk('lens', { charts: 100, both: 85, business: 35, neither: 15 });
    const styles = {
      passive: W([[100 - handsOn, 35], [patience, 20], [100 - timeAvailable, 15], [pk('holding', { years: 100, months: 70, days: 30, minutes: 10 }), 15], [Math.max(goalPts('retire'), goalPts('protect'), goalPts('early')), 15]]),
      value: W([[analytical, 30], [patience, 25], [pk('lens', { business: 100, both: 80, charts: 30, neither: 20 }), 15], [pk('holding', { years: 100, months: 85, days: 30, minutes: 5 }), 15], [rate('kStatements'), 15]]),
      swing: W([[chartsLens, 25], [pk('holding', { days: 100, months: 65, minutes: 50, years: 15 }), 20], [discipline, 15], [cl(hours / 8 * 100), 15], [willingness, 15], [rate('kCharts'), 10]]),
      day: W([[pk('marketHours', { yes: 100, some: 40, no: 0 }), 20], [pk('holding', { minutes: 100, days: 50, months: 10, years: 0 }), 20], [cl(hours / 15 * 100), 15], [discipline, 15], [emotionalControl, 10], [chartsLens, 10], [pk('speed', { gut: 100, checklist: 90, slow: 35, freeze: 0 }), 10]]),
      wheel: W([[pk('options', { income: 100, already: 90, curious: 55, no: 5 }), 30], [patience, 20], [pk('holding', { months: 100, days: 80, years: 50, minutes: 10 }), 15], [discipline, 15], [rate('kOptions'), 10], [goalPts('income'), 10]]) * (X.brokerage + I.cash < 5000 ? 0.85 : 1), // a put on a cheap stock still needs a few thousand
      fire: W([[goalPts('early'), 30], [cl(X.savingsRate / 0.5 * 100), 25], [patience, 15], [discipline, 15], [I.retireAge <= 50 ? 100 : I.retireAge <= 55 ? 85 : I.retireAge <= 60 ? 60 : 30, 15]]),
      crypto: W([[pk('cryptoInt', { heavy: 100, believer: 85, curious: 50, none: 0 }), 40], [willingness, 25], [I.netWorth > 0 ? cl(X.crypto / I.netWorth * 1000) : (X.crypto > 0 ? 100 : 0), 15], [handsOn, 10], [timeAvailable, 10]]),
    };
    Object.keys(styles).forEach((k) => { styles[k] = r0(cl(styles[k])); });
    Object.keys(traits).forEach((k) => { traits[k] = r0(cl(traits[k])); });

    /* ARCHETYPE: highest style fit after temperament adjustments; ties go to the calmer style. */
    const adj = {
      steady: traits.handsOn < 40 ? 5 : 0,
      detective: traits.patience < 40 ? -10 : 0,
      surfer: traits.discipline < 45 ? -10 : 0,
      sprinter: (traits.emotionalControl < 50 ? -15 : 0) + (traits.discipline < 50 ? -10 : 0) + (traits.timeAvailable < 40 ? -10 : 0),
      farmer: (traits.patience < 40 ? -8 : 0) + (a.options === 'no' ? -15 : 0),
      freedom: X.savingsRate >= 0.3 ? 5 : 0,
    };
    const ranked = ARCH_ORDER.map((k) => ({ k, v: styles[archetypes[k].style] + adj[k] })).sort((p, q) => q.v - p.v || ARCH_ORDER.indexOf(p.k) - ARCH_ORDER.indexOf(q.k));
    const arch = archetypes[ranked[0].k];

    /* PROFILE: risk score bands. Within ~2 years of the target age, cap at balanced (money still has to last
       through retirement, so not lower by default). */
    const riskR = r0(cl(risk));
    let key = riskR < 25 ? 'conservative' : riskR < 42 ? 'moderate' : riskR < 58 ? 'balanced' : riskR < 75 ? 'growth' : 'aggressive';
    const KEYS = Object.keys(PROFILES);
    if (I.horizon <= 2 && KEYS.indexOf(key) > 2) key = 'balanced';
    const P = PROFILES[key];
    /* SATELLITE (% of investable money for active ideas): base by profile, scaled 0.5x-1.5x by readiness
       (average of knowledge, discipline, emotional control). Capped at 5% while high-interest debt exists, the cash
       cushion is under 3 months, or you prefer hands-off; 0 if very hands-off. Rounded to 5. */
    const readiness = (traits.knowledge + traits.discipline + traits.emotionalControl) / 300;
    let sat = P.sat * (0.5 + readiness);
    if (I.debtHigh > 0 || I.emergencyMonths < 3 || traits.handsOn < 30) sat = Math.min(sat, 5);
    if (traits.handsOn < 15) sat = 0;
    sat = cl(Math.round(sat / 5) * 5, 0, 30);
    /* CRYPTO CAP (% max): base by profile, +2 believer or heavy holder, -1 if not interested; 2 max while the basics are missing. */
    let cryptoCap = P.crypto + (a.cryptoInt === 'believer' || a.cryptoInt === 'heavy' ? 2 : a.cryptoInt === 'none' ? -1 : 0);
    if (I.debtHigh > 0 || I.emergencyMonths < 3) cryptoCap = Math.min(cryptoCap, 2);
    cryptoCap = r0(cl(cryptoCap, 0, 10));
    /* RISK PER TRADE: 1% is the standard. 0.5% while learning (discipline < 50, knowledge < 35 or under a year in).
       2% only for experienced, disciplined, calm traders (5+ years, discipline 75+, control 70+, willingness 65+). */
    let riskPerTrade = 1;
    if (traits.discipline < 50 || traits.knowledge < 35 || I.experienceYears < 1) riskPerTrade = 0.5;
    else if (traits.discipline >= 75 && traits.emotionalControl >= 70 && I.experienceYears >= 5 && willingness >= 65) riskPerTrade = 2;

    /* GOALS. Growth assumption (shared site-wide): 5% a year after inflation, compounded monthly, today's dollars,
       on invested money (retirement + brokerage + crypto) plus monthly saving. goals.rate = 5.
       Other income (Social Security or pension a month) counts only when the target age is 62 or later, or when
       you are already retired and 62+; before that the full number stands and the copy says it will lower
       withdrawals later.
       FIRE number = (retirement spending - counted other income) x 12 x 25, the 4% rule of thumb.
       targetAge = the age you picked for work to be optional.
       Still working (target age in the future):
         yearsToGoal = years until the pot reaches the FIRE number at current saving (0 if there, null past 60 yrs);
         onTrack = age + yearsToGoal <= targetAge; monthlyNeeded = TOTAL monthly saving that reaches the number by
         targetAge; gap = dollars the pot would still be short at targetAge on the current pace (0 if on track).
       At or past the target age: retired = true; withdrawalRate = (yearly spending - counted other income) /
         invested money, in % (capped at 100); onTrack = withdrawal rate at or under 4%; monthlyNeeded = 0 (saving
         is not the lever any more); gap = FIRE number minus invested money today (0 if covered);
         yearsToGoal = 0 if covered, else null.
       emergencyTargetMonths = 3 for a single person with a steady job and no dependents, otherwise 6. */
    const retired = I.retireAge <= I.age;
    const incomeCounts = I.retireAge >= 62 || (retired && I.age >= 62);
    const otherCounted = incomeCounts ? I.otherIncomeMonth : 0;
    const netSpend = Math.max(0, X.retireSpend - otherCounted);
    const fireNumber = r0(netSpend * 12 * 25);
    const rm = Math.pow(1.05, 1 / 12) - 1;
    const fv = (mo, save) => { const g = Math.pow(1 + rm, mo); return I.investable * g + save * (g - 1) / rm; };
    let yearsToGoal = null, onTrack, monthlyNeeded, gap, withdrawalRate = null;
    if (I.investable >= fireNumber) yearsToGoal = 0;
    if (retired) {
      withdrawalRate = I.investable > 0 ? r1(Math.min(100, netSpend * 12 / I.investable * 100)) : (netSpend > 0 ? 100 : 0);
      onTrack = withdrawalRate <= 4; monthlyNeeded = 0; gap = r0(Math.max(0, fireNumber - I.investable));
    } else {
      if (yearsToGoal == null) { let bal = I.investable; for (let mo = 1; mo <= 720; mo++) { bal = bal * (1 + rm) + I.savingsMonth; if (bal >= fireNumber) { yearsToGoal = Math.ceil(mo / 1.2) / 10; break; } } }
      const nMo = I.horizon * 12, gN = Math.pow(1 + rm, nMo);
      monthlyNeeded = r0(Math.max(0, (fireNumber - I.investable * gN) * rm / (gN - 1)));
      onTrack = yearsToGoal != null && I.age + yearsToGoal <= I.retireAge;
      gap = onTrack ? 0 : r0(Math.max(0, fireNumber - fv(nMo, I.savingsMonth)));
    }
    const steadyJob = a.job === 'very' || a.job === 'stable';
    const emergencyTargetMonths = I.household === 'single' && I.dependents === 0 && steadyJob ? 3 : 6;
    const goalsOut = {
      primary: goals[0] || (styles.fire >= 65 ? 'early' : 'retire'), list: goals, fireNumber, yearsToGoal, targetAge: I.retireAge,
      onTrack, monthlyNeeded, gap, rate: 5, emergencyTargetMonths, retired, withdrawalRate, otherIncomeCounted: otherCounted > 0,
    };

    const scores = { riskCapacity: r0(cl(capacity)), riskWillingness: r0(cl(willingness)), risk: riskR, traits, styles };
    const profile = { key, label: P.label, allocation: Object.assign({}, P.allocation), core: 100 - sat, satellite: sat, cryptoCap, riskPerTrade };
    const inputs = {}; Object.keys(I).forEach((k) => { if (k !== '_x') inputs[k] = I[k]; });
    const order = ranked.map((r) => r.k);
    return {
      v: 1,
      id: o.id || newId(),
      date: o.date || new Date().toISOString(),
      answers: a, inputs, scores, profile,
      archetype: { key: arch.key, name: arch.name, tagline: arch.tagline, description: arch.description, style: arch.style, runnerUp: order[1] },
      goals: goalsOut,
      insights: insightsOf(a, I, X, scores, profile, goalsOut, arch, order),
    };
  }

  /* ---------- insights: plain-language strengths, watch-outs, ordered actions, lesson path, tools ---------- */
  function insightsOf(a, I, X, S, P, G, arch, order) {
    const T = S.traits, st = S.styles, pct = (v) => Math.round(v * 100);
    const strengths = [];
    const add = (cond, v, s) => { if (cond) strengths.push([v, s]); };
    /* Strengths are suppressed when an answer behind a matching watch-out says otherwise. */
    const fomo = a.fomo === 'jump' || a.fomo === 'small', movesLine = a.rules === 'move' || a.rules === 'hope' || a.rules === 'add', revenge = a.streak === 'bigger';
    const ET = G.emergencyTargetMonths;
    add(T.patience >= 70 && !fomo, T.patience, 'Patient. You can sit through boring stretches, which is where most long-term returns come from.');
    add(T.discipline >= 70 && !fomo && !movesLine && !revenge, T.discipline, 'Disciplined. You follow your own rules, even when it stings.');
    add(T.emotionalControl >= 70 && !revenge && a.sleep !== 'sell' && a.drop !== 'sell', T.emotionalControl, 'Calm under pressure. A drop does not push you into panic moves.');
    add(T.analytical >= 70, T.analytical, 'Curious and analytical. You want to know why, not just what.');
    add(X.savingsRate >= 0.2, 60 + pct(X.savingsRate), `Strong saver. You keep about ${pct(X.savingsRate)}% of what comes in.`);
    add(I.emergencyMonths >= 6, 75, `Solid cushion. Your cash covers about ${Math.min(99, Math.round(I.emergencyMonths))} months of spending.`);
    add(I.debtHigh === 0, 70, 'No high-interest debt dragging on your returns.');
    add(I.horizon >= 15, 55 + Math.min(I.horizon, 40), `Long runway. ${yrs(I.horizon)} until your target age gives compounding room to work.`);
    add(G.retired && G.withdrawalRate != null && G.withdrawalRate <= 4 && I.investable > 0, 74, `Sustainable spending. You draw about ${G.withdrawalRate}% a year from your investments, at or under the 4% rule of thumb.`);
    add(T.knowledge >= 60, T.knowledge, 'A real knowledge base to build on.');
    add(T.timeAvailable >= 60, T.timeAvailable - 5, 'Time to practice, review and improve.');
    add(S.riskWillingness >= 70 && S.riskCapacity >= 60 && I.debtHigh === 0 && I.emergencyMonths >= ET && Math.abs(S.riskWillingness - S.riskCapacity) < 20, 72, 'Your finances and your nerves can both handle risk.');
    strengths.sort((p, q) => q[0] - p[0]);
    const strengthsOut = strengths.slice(0, 5).map((s) => s[1]);
    if (!strengthsOut.length) strengthsOut.push('You answered honestly, which is the step most people skip. Every strength here can be built.');

    const watch = [];
    const w = (cond, s) => { if (cond) watch.push(s); };
    w(I.debtHigh > 0, `Card or personal debt of ${usd(I.debtHigh)}. Cards often charge 20% or more, and at rates like that paying it off beats the stock market's long-run average.`);
    w(I.emergencyMonths < ET, `Thin cushion: cash covers about ${r1(Math.min(I.emergencyMonths, 99))} months of spending. Aim for ${ET}${ET === 6 ? ' (with a family, dependents or income that can swing, more cushion helps)' : ''} before taking market risk.`);
    w(G.retired && G.withdrawalRate != null && G.withdrawalRate > 4, `Spending draws about ${G.withdrawalRate >= 100 ? '100% or more' : G.withdrawalRate + '%'} a year from your investments, above the 4% rule of thumb. Worth checking how long the money lasts.`);
    w(!G.retired && I.horizon < 5, 'Retirement is close. The money you will spend in the first few years usually belongs somewhere steadier than stocks.');
    w(S.riskWillingness - S.riskCapacity >= 20, 'Your nerve is ahead of your finances. Size positions for what your life can absorb, not for what feels exciting.');
    w(S.riskCapacity - S.riskWillingness >= 25, 'Your finances can take more risk than your nerves like. An automatic plan keeps you invested through scary stretches.');
    w(a.fomo === 'jump' || a.fomo === 'small', 'FOMO. Chasing what already ran is how many new traders lose money.');
    w(a.rules === 'move' || a.rules === 'hope' || a.rules === 'add', 'Moving the line. Changing a stop mid-trade turns small losses into big ones.');
    w(a.streak === 'bigger', 'Revenge trading. Sizing up after losses is the fastest way to blow up an account.');
    w(a.leverage === 'setup' || a.leverage === 'already', 'Comfort with leverage. Borrowed money magnifies losses as much as gains.');
    w(st.day >= 55 && T.timeAvailable < 45, 'Day trading needs weekday morning screen time you may not have.');
    w((order[0] === 'sprinter' || st.day >= 60) && X.brokerage < 5000, 'A small account. In a cash account you wait for trades to settle; read the day trading rules lesson before you start.');
    w((a.options === 'income' || a.options === 'already') && num(a.kOptions, 0) <= 1, 'Keen on option income, light on option knowledge. Learn assignment and risk before selling your first put.');
    w(I.netWorth > 0 && X.crypto / I.netWorth > 0.2, `Crypto is about ${pct(X.crypto / I.netWorth)}% of your net worth. That is a lot of eggs in a very bumpy basket.`);
    w(T.knowledge < 30 && ['sprinter', 'surfer', 'farmer'].indexOf(order[0]) >= 0, 'Your favorite style needs skills you are still building. Start small, or on paper.');
    w(!G.retired && X.savingsRate < 0.1 && I.spendMonth > 0, 'Low savings rate. For most people, saving more beats picking better stocks.');
    const watchOut = watch.slice(0, 5);

    const has = idSet();
    const href = (tool, lesson) => (has.t(tool) ? '#' + tool : '#' + lesson);
    const actions = [];
    if (I.debtHigh > 0) actions.push({ title: 'Pay off high-interest debt first', detail: `You owe ${usd(I.debtHigh)} on cards or personal loans. Cards often charge 20% or more; at rates like that, paying them down beats the stock market's long-run average. Highest rate first.`, href: href('tool-payoff', 'l-card-debt') });
    const target = r0(I.spendMonth * ET);
    if (I.emergencyMonths < ET) actions.push({ title: 'Build an emergency fund', detail: `Aim for ${ET} months of spending, about ${usd(target)}${I.cash > 0 ? `, ${usd(Math.max(0, target - I.cash))} more than today` : ''}, parked somewhere safe that pays interest.`, href: href('tool-cash', 'l-emergency') });
    const working = a.job !== 'none' && !G.retired;
    if (working) actions.push({ title: 'Grab the full 401(k) match', detail: 'If your employer matches, contribute at least enough to get all of it. It is part of your pay.', href: href('tool-match', 'l-401k-match') });
    if (working) {
      const joint = I.household !== 'single', over = I.incomeYear >= (joint ? 252000 : 168000);
      actions.push(over && has.l('l-backdoor-roth')
        ? { title: 'Look at a backdoor Roth IRA', detail: `A Roth IRA needs earned income, and in 2026 the full contribution is allowed under $153k single or $242k married filing jointly, phasing out by $168k / $252k. Your income may be over that; the backdoor route is the usual workaround.`, href: '#l-backdoor-roth' }
        : { title: 'Use a Roth IRA if you qualify', detail: 'Tax-free growth for decades. You need earned income, and 2026 limits apply: full contribution under $153k single or $242k married filing jointly, phasing out by $168k / $252k.', href: '#l-ira' });
    }
    if (G.retired) actions.push({ title: G.withdrawalRate > 4 ? 'Check how long the money lasts' : 'Keep withdrawals near 4%', detail: `You spend about ${G.withdrawalRate >= 100 ? '100% or more' : G.withdrawalRate + '%'} of your investments a year${G.otherIncomeCounted ? ' after Social Security or pension' : ''}. A common rule of thumb is about 4%; guardrails help in bad years.`, href: href('tool-swr', 'l-swr') });
    const al = P.allocation;
    actions.push({ title: `Set your core: about ${al.stocks}% stocks, ${al.bonds}% bonds, ${al.cash}% cash`, detail: `Low-cost index funds for the ${P.core}% core. A ${P.label.toLowerCase()} mix for your answers. Educational rule of thumb, not personal advice.`, href: '#l-allocation' });
    const archAct = {
      steady: G.retired ? { title: 'Put withdrawals on autopilot', detail: 'A set monthly transfer from your investments to checking, and a rebalance once a year.', href: href('tool-swr', 'l-swr') } : { title: 'Automate it', detail: 'Set a monthly transfer into your index funds and check in once a year.', href: href('tool-compound', 'l-compound') },
      detective: { title: 'Run the five-number check before you buy', detail: 'P/E, growth, margin, debt and cash flow on one screen, then a margin of safety.', href: href('tool-ratios', 'l-ratios') },
      surfer: { title: `Size every swing to ${P.riskPerTrade}% risk`, detail: 'Decide the stop first, then let the position-size tool tell you how many shares.', href: href('tool-size', 'l-position-size') },
      sprinter: { title: 'Practice 30 sessions on Trade replay first', detail: `Same rules you would use for real: ${P.riskPerTrade}% risk per trade and a daily loss limit.`, href: '#play' },
      farmer: { title: 'Model your first cash-secured put', detail: 'Pick a stock you would happily own and see the premium, the yield and the assignment price.', href: href('tool-wheel', 'l-wheel') },
      freedom: { title: 'Pin down your FIRE number', detail: `About ${usd(G.fireNumber)} for ${usd(X.retireSpend)} a month${G.otherIncomeCounted ? ', after other income' : ''}. See how your savings rate changes the date.`, href: href('tool-fire', 'l-fire-number') },
    }[arch.key];
    actions.push(archAct);
    if (P.satellite > 0) actions.push({ title: `Cap active money at ${P.satellite}% of investable`, detail: `About ${usd(I.investable * P.satellite / 100)} today. The rest stays in the core, whatever happens with trades.`, href: '#l-blend' });
    else if (X.savingsRate < 0.15) actions.push({ title: 'Raise your savings rate', detail: 'Find a few percent in the budget; it moves your timeline more than returns do.', href: href('tool-budget', 'l-budget') });
    const actionsOut = actions.filter(Boolean).slice(0, 7);

    /* LEARNING PATH: foundations you are missing, then core basics, then your archetype, then your runner-up,
       then risk and mindset. Only ids that exist; 8 to 12 lessons. */
    const L = [];
    if (I.debtHigh > 0) L.push('l-card-debt');
    if (I.emergencyMonths < G.emergencyTargetMonths) L.push('l-emergency');
    if (G.retired) L.push('l-swr', 'l-guardrails', 'l-sequence', 'l-retire-income');
    if (num(a.kStocks, 1) <= 1) L.push('l-stocks');
    L.push('l-etfs', 'l-index-funds', 'l-compound');
    const PATH = {
      steady: ['l-allocation', 'l-401k-match', 'l-ira', 'l-trad-vs-roth', 'l-drawdowns'],
      detective: ['l-statements', 'l-ratios', 'l-earnings', 'l-value', 'l-stock-picking'],
      surfer: ['l-candles', 'l-support', 'l-moving-averages', 'l-ema-stack', 'l-position-size', 'l-risk-reward'],
      sprinter: ['l-candles', 'l-timeframes', 'l-levels', 'l-vwap', 'l-volume', 'l-breakouts', 'l-position-size', 'l-pdt'],
      farmer: ['l-options-101', 'l-contracts', 'l-theta', 'l-delta-gamma', 'l-wheel', 'l-wheel-tax'],
      freedom: ['l-fire-intro', 'l-fire-number', 'l-savings-rate', 'l-swr', 'l-coast-fire'],
    };
    L.push(...PATH[arch.key]);
    L.push(...PATH[order[1]].slice(0, 2));
    if (st.crypto >= 60) L.push('l-crypto-risks', 'l-crypto-custody');
    if (T.emotionalControl < 55 || T.discipline < 55) L.push('l-psychology');
    if (['surfer', 'sprinter', 'farmer'].indexOf(arch.key) >= 0) L.push('l-one-percent', 'l-journal');
    L.push('l-styles', 'l-blend', 'l-allocation', 'l-ira');
    const lessons = []; L.forEach((id) => { if (lessons.indexOf(id) < 0 && has.l(id)) lessons.push(id); });

    const TOOLS = {
      steady: ['tool-compound', 'tool-match', 'tool-roth', 'tool-retire'],
      detective: ['tool-ratios', 'tool-value', 'tool-compound', 'tool-tlh'],
      surfer: ['tool-size', 'tool-risk', 'tool-drawdown', 'tool-expected'],
      sprinter: ['tool-size', 'tool-risk', 'tool-drawdown', 'tool-expected'],
      farmer: ['tool-wheel', 'tool-options', 'tool-expected', 'tool-size'],
      freedom: ['tool-fire', 'tool-years', 'tool-fireplan', 'tool-swr'],
    };
    const tl = [];
    if (I.debtHigh > 0) tl.push('tool-payoff');
    if (I.emergencyMonths < G.emergencyTargetMonths) tl.push('tool-cash');
    if (G.retired) tl.push('tool-swr', 'tool-retire');
    tl.push(...TOOLS[arch.key], TOOLS[order[1]][0], 'tool-budget', 'tool-compound');
    const tools = []; tl.forEach((id) => { if (tools.indexOf(id) < 0 && has.t(id)) tools.push(id); });
    return { strengths: strengthsOut, watchouts: watchOut, actions: actionsOut, lessons: lessons.slice(0, 12), tools: tools.slice(0, 6) };
  }
  function newId() {
    try { if (SML.account && typeof SML.account.newId === 'function') return SML.account.newId('a'); } catch (e) { /* fall through */ }
    return 'a-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function idSet() {
    const L = new Set((SML.lessons || []).map((l) => l.id)), T = new Set((SML.tools || []).map((t) => t.id));
    return { l: (id) => !L.size || L.has(id), t: (id) => !T.size || T.has(id) };
  }

  SML.assess = { score, archetypes, sections: SECTIONS, styleLabels, goalLabels, rateLabels: RATE_LABELS, profiles: PROFILES };

  /* ===================================================================================================
     PAGE
     =================================================================================================== */
  const KEY = 'assessProgress';
  function moodOf(d) {
    return d < 10 ? { m: 0, label: 'Gentle ride' } : d < 20 ? { m: 1, label: 'Some bumps' } : d < 30 ? { m: 2, label: 'Rough ride' } : d < 45 ? { m: 3, label: 'Rollercoaster' } : { m: 4, label: 'White knuckles' };
  }
  function bunnyMood(m) {
    const ink = 'style="fill:var(--ink)"', fl = 'style="fill:var(--flame)"', bg = 'style="fill:var(--bg)"';
    const gy = m >= 4 ? 9 : m >= 3 ? 3 : 0;
    const mouth = m === 0 ? '<path d="M41 76q9 7 18 0" fill="none" stroke-width="2.4" stroke-linecap="round" style="stroke:var(--bg)"/>'
      : m === 1 ? '<path d="M42 76q8 4 16 0" fill="none" stroke-width="2.4" stroke-linecap="round" style="stroke:var(--bg)"/>'
      : m === 2 ? '<path d="M43 77h14" fill="none" stroke-width="2.4" stroke-linecap="round" style="stroke:var(--bg)"/>'
      : m === 3 ? '<path d="M42 79q8-5 16 0" fill="none" stroke-width="2.4" stroke-linecap="round" style="stroke:var(--bg)"/>'
      : '<ellipse cx="50" cy="79" rx="5" ry="6" ' + bg + '/>';
    const eyes = m >= 4 ? `<circle cx="38" cy="55" r="5.5" ${bg}/><circle cx="62" cy="55" r="5.5" ${bg}/><circle cx="38" cy="55" r="2" ${ink}/><circle cx="62" cy="55" r="2" ${ink}/>` : '';
    const drop = (x, y) => `<path d="M${x} ${y}c-3 5-4 7-4 9a4 4 0 0 0 8 0c0-2-1-4-4-9z" style="fill:var(--info)"/>`;
    const sweat = (m >= 3 ? drop(82, 40) : '') + (m >= 4 ? drop(16, 44) : '');
    const tilt = m >= 4 ? 'rotate(-6 50 60)' : m >= 3 ? 'rotate(-3 50 60)' : '';
    return `<svg class="asq-mood" viewBox="0 0 100 100" width="104" height="104" aria-hidden="true">
      <g transform="rotate(-14 37 26)"><ellipse cx="37" cy="24" rx="8" ry="20" ${ink}/><ellipse cx="37" cy="26" rx="4" ry="14" ${fl}/></g>
      <g transform="rotate(${m >= 3 ? 34 : 16} 63 26)"><ellipse cx="63" cy="24" rx="8" ry="20" ${ink}/><ellipse cx="63" cy="26" rx="4" ry="14" ${fl}/></g>
      <ellipse cx="50" cy="64" rx="29" ry="25" ${ink}/>${eyes}
      <g transform="translate(0 ${gy}) ${tilt}"><path d="M25 54h21l-2 9a7 7 0 0 1-7 5h-3a7 7 0 0 1-7-5zM54 54h21l-2 9a7 7 0 0 1-7 5h-3a7 7 0 0 1-7-5z" ${fl}/><path d="M46 56h8" stroke-width="2.4" style="stroke:var(--flame)"/></g>
      <path d="M47 70h6l-3 3z" ${fl}/>${mouth}${sweat}</svg>`;
  }
  const SPARK = {
    drop: { pts: [100, 101, 99, 102, 97, 98, 93, 95, 90, 86, 88, 82, 79, 75, 77, 70], a: '$10,000', b: '$7,000', cls: 'dn' },
    rocket: { pts: [100, 99, 102, 104, 103, 108, 112, 110, 118, 126, 124, 137, 150, 158, 171, 180], a: 'a month ago', b: '+80%', cls: 'up' },
    stop: { pts: [100, 101, 103, 102, 104, 103, 101, 102, 100, 99, 100, 98, 97, 96.5, 95.5, 95], a: 'your entry', b: '−5% stop', cls: 'dn', stop: 95 },
  };
  function spark(kind) {
    const k = SPARK[kind]; if (!k || !SML.svg) return '';
    const S = SML.svg, Wd = 260, H = 92, pad = 10, lo = Math.min(...k.pts, k.stop || 1e9) - 3, hi = Math.max(...k.pts) + 3;
    const x = (i) => pad + (i / (k.pts.length - 1)) * (Wd - pad * 2 - 54), y = (v) => 12 + (1 - (v - lo) / (hi - lo)) * (H - 30);
    const pts = k.pts.map((v, i) => [x(i), y(v)]), last = pts[pts.length - 1];
    let body = S.line(pad, y(100), Wd - pad, y(100), 's-line dash');
    if (k.stop) body += S.line(pad, y(k.stop), Wd - pad, y(k.stop), 's-dn dash');
    body += S.poly(pts, 's-' + k.cls + ' w25') + S.circle(last[0], last[1], 4, 'f-' + k.cls);
    body += S.text(pad, H - 4, esc(k.a), 'xs mut mono') + S.text(last[0] + 9, last[1] + 4, esc(k.b), 'sm b ' + k.cls + ' mono');
    return S.wrap(Wd, H, kind === 'drop' ? 'Ten thousand dollars falling to seven thousand' : kind === 'rocket' ? 'A stock up eighty percent in a month' : 'Price sliding to a stop at minus five percent', body, 'asq-spark');
  }

  /* ---------------- state ---------------- */
  let S = null; // { answers, step, maxStep, pref:[ids], resumed, touched, nudged:{} }
  function loadState() {
    const saved = SML.store.get(KEY, null);
    if (saved && saved.v === 1 && saved.answers && typeof saved.answers === 'object' && Date.now() - num(saved.at, 0) < 30 * 864e5) {
      const step = r0(cl(num(saved.step, 0), 0, SECTIONS.length - 1));
      return { answers: saved.answers, step, maxStep: r0(cl(num(saved.maxStep, step), step, SECTIONS.length - 1)), pref: Array.isArray(saved.pref) ? saved.pref : [], resumed: Object.keys(saved.answers).length > 0, touched: true, nudged: {} };
    }
    const st = { answers: {}, step: 0, maxStep: 0, pref: [], resumed: false, touched: false, nudged: {} };
    applyPrefill(st); return st;
  }
  function persist() { SML.store.set(KEY, { v: 1, answers: S.answers, step: S.step, maxStep: S.maxStep, pref: S.pref, at: Date.now() }); }
  /* Prefill from the saved profile (never writes to it). */
  function applyPrefill(st) {
    if (!SML.account || typeof SML.account.get !== 'function') return;
    let p; try { p = SML.account.get(); } catch (e) { return; } if (!p) return;
    const v = {}, yr = YEAR();
    const by = num(p.birthYear, 0); if (by > 1900 && yr - by >= 16 && yr - by <= 100) v.age = cl(yr - by, 18, 80);
    const ra = num(p.retireAge, 0); if (ra >= 30 && ra <= 90) v.retireAge = cl(ra, 35, 75);
    const ms = num(p.monthlySpend, 0); if (ms > 0) { v.spendMonth = ms; v.retireSpend = Math.max(1000, Math.round(ms)); }
    const hh = Array.isArray(p.household) ? p.household : [];
    if (hh.length > 1) {
      const kids = hh.filter((m) => m && m.relation === 'child').length, parents = hh.filter((m) => m && m.relation === 'parent').length, partner = hh.some((m) => m && m.relation === 'partner');
      v.household = kids ? 'family' : partner ? 'couple' : 'single'; v.dependents = Math.min(6, kids + parents);
    }
    const inc = hh.reduce((s, m) => s + Math.max(0, num(m && m.income, 0)), 0); if (inc > 0) v.income = inc;
    try {
      const nw = SML.account.netWorth(p), bt = nw.byType || {}, dt = nw.debtByType || {};
      if (Array.isArray(p.assets) && p.assets.length) {
        v.cash = bt.cash || 0; v.retirement = bt.retirement || 0; v.brokerage = bt.brokerage || 0; v.crypto = bt.crypto || 0;
        v.homeEquity = Math.max(0, (bt.home || 0) - (dt.mortgage || 0) - (dt.heloc || 0));
        v.otherAssets = (bt.realestate || 0) + (bt.vehicle || 0) + (bt.business || 0) + (bt.other || 0);
      }
      if (Array.isArray(p.debts) && p.debts.length) { v.debtHigh = (dt.card || 0) + (dt.personal || 0); v.debtOther = (dt.student || 0) + (dt.car || 0) + (dt.other || 0); }
    } catch (e) { /* profile without net worth helpers */ }
    Object.keys(v).forEach((k) => { if (fin(v[k]) || typeof v[k] === 'string') { st.answers[k] = v[k]; if (st.pref.indexOf(k) < 0) st.pref.push(k); } });
  }
  /* Sliders count as answered once their section has been shown, at their default (or a smart default). */
  function ensureDefaults(i) {
    const A = S.answers;
    SECTIONS[i].qs.forEach((q) => {
      if (!q.id || A[q.id] != null) return;
      if (q.id === 'retireSpend') A.retireSpend = Math.max(1000, Math.round(num(A.spendMonth, DEF.spendMonth)));
      else if (q.type === 'slider' || q.type === 'poles') A[q.id] = q.def;
    });
  }
  const isAnswered = (q, A) => (q.type === 'rank' ? Array.isArray(A.goals) && A.goals.length > 0 : A[q.id] != null);
  function counts() {
    let total = 0, done = 0; const A = S.answers;
    QS.forEach((q) => {
      if (q.type === 'rate') q.rows.forEach(([id]) => { total++; if (A[id] != null) done++; });
      else { total++; if (isAnswered(q, A)) done++; }
    });
    return { total, done };
  }
  function missing(i) {
    const A = S.answers, out = [];
    SECTIONS[i].qs.forEach((q) => {
      if (!q.id || q.type === 'slider' || q.type === 'poles') return;
      if (q.type === 'rate') { if (q.rows.some(([id]) => A[id] == null)) out.push(q.id); } else if (!isAnswered(q, A)) out.push(q.id);
    });
    return out;
  }

  /* ---------------- rendering ---------------- */
  function prefTag(id) { return S.pref.indexOf(id) >= 0 ? '<span class="asq-pref">From your profile</span>' : ''; }
  function qHead(q, forId) {
    return `<div class="asq-qhead">${forId ? `<label class="asq-qt" for="${forId}" id="asq-qt-${q.id}">${esc(q.q)}</label>` : `<p class="asq-qt" id="asq-qt-${q.id}">${esc(q.q)}</p>`}${prefTag(q.id)}</div>${q.sub ? `<p class="asq-qsub">${esc(q.sub)}</p>` : ''}`;
  }
  function optBtn(q, k, t, sub, extra) {
    const on = S.answers[q.id] === k;
    return `<button type="button" class="asq-opt" data-act="pick" data-q="${q.id}" data-v="${k}" aria-pressed="${on}"><i class="asq-chk">${ico.check}</i><b>${esc(t)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}${extra || ''}</button>`;
  }
  function sliderHTML(q) {
    const A = S.answers, v = num(A[q.id], q.def), id = 'asq-' + q.id;
    if (q.scale) {
      const stops = SC[q.scale], p = valToPos(stops, v);
      return `<div class="asq-q asq-slider${q.w === 'full' ? ' asq-full' : ''}" data-q="${q.id}" id="asq-q-${q.id}">
        <div class="asq-sh"><div class="asq-shl">${qHead(q, id)}</div>
          <input class="asq-num" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-q="${q.id}" value="${usd(v)}" aria-label="${esc(q.q)}: type an amount"></div>
        <input type="range" id="${id}" data-q="${q.id}" data-scale="${q.scale}" min="0" max="${POS}" step="1" value="${p}" style="--p:${p / POS * 100}%" aria-valuetext="${usd(v)}">
        <div class="asq-ends"><span>${big(stops[0])}</span><span>${big(stops[stops.length - 1])}+</span></div>
        ${q.viz ? `<div class="asq-viz" data-viz="${q.viz}">${VIZ[q.viz]()}</div>` : ''}</div>`;
    }
    const p = (v - q.min) / (q.max - q.min) * 100;
    return `<div class="asq-q asq-slider${q.w === 'full' ? ' asq-full' : ''}" data-q="${q.id}" id="asq-q-${q.id}">
      <div class="asq-sh"><div class="asq-shl">${qHead(q, id)}</div><output class="asq-ro" id="${id}-ro" for="${id}">${q.ro(v, A)}</output></div>
      <input type="range" id="${id}" data-q="${q.id}" min="${q.min}" max="${q.max}" step="${q.step}" value="${v}" style="--p:${p}%">
      <div class="asq-ends"><span>${q.min}</span><span>${q.max}${q.id === 'dependents' || q.id === 'hours' || q.id === 'years' ? '+' : ''}</span></div>
      ${q.viz ? `<div class="asq-viz" data-viz="${q.viz}">${VIZ[q.viz]()}</div>` : ''}</div>`;
  }
  function polesLabel(v) { return v <= 20 ? 'Autopilot' : v <= 40 ? 'Mostly hands-off' : v < 60 ? 'Somewhere in the middle' : v < 80 ? 'Pretty hands-on' : 'Hands on the wheel'; }
  function qHTML(q) {
    const A = S.answers, full = q.w === 'full' ? ' asq-full' : '';
    switch (q.type) {
      case 'group': return `<h3 class="asq-group">${esc(q.title)}</h3>`;
      case 'viz': return `<div class="asq-q asq-vizq asq-full"><div class="asq-viz" data-viz="${q.viz}">${VIZ[q.viz]()}</div></div>`;
      case 'slider': return sliderHTML(q);
      case 'poles': {
        const v = num(A[q.id], q.def), id = 'asq-' + q.id;
        return `<div class="asq-q asq-poles${full}" data-q="${q.id}" id="asq-q-${q.id}">${qHead(q, id)}
          <div class="asq-pl"><span>${esc(q.left)}</span><output class="asq-pro" id="${id}-ro" for="${id}">${polesLabel(v)}</output><span>${esc(q.right)}</span></div>
          <input type="range" id="${id}" data-q="${q.id}" min="0" max="100" step="1" value="${v}" style="--p:${v}%" aria-valuetext="${polesLabel(v)}"></div>`;
      }
      case 'pick': case 'scenario': {
        const tot = q.style === 'tot';
        const opts = q.opts.map(([k, t, sub]) => optBtn(q, k, t, sub)).join(tot ? '<span class="asq-or" aria-hidden="true">or</span>' : '');
        return `<div class="asq-q asq-pick${full}" data-q="${q.id}" id="asq-q-${q.id}" role="group" aria-labelledby="asq-qt-${q.id}">${qHead(q)}
          ${q.chart ? `<div class="asq-scn">${spark(q.chart)}</div>` : ''}
          <div class="${tot ? 'asq-tot' : 'asq-opts'}${tot && q.opts.length === 3 ? ' asq-tot3' : ''}">${opts}</div></div>`;
      }
      case 'portfolio': {
        const opts = q.opts.map(([k, t, lo, hi, avg]) => optBtn(q, k, 'Portfolio ' + t, `Averages about ${avg}% a year`,
          `<span class="asq-pf" aria-hidden="true"><i class="asq-pfz"></i><i class="asq-pfn" style="width:${-lo / 80 * 50}%"></i><i class="asq-pfp" style="width:${hi / 80 * 50}%"></i></span><span class="asq-pfl"><em class="dn">−${-lo}%</em><em class="up">+${hi}%</em></span>`)).join('');
        return `<div class="asq-q asq-pick${full}" data-q="${q.id}" id="asq-q-${q.id}" role="group" aria-labelledby="asq-qt-${q.id}">${qHead(q)}<div class="asq-opts asq-pfs">${opts}</div></div>`;
      }
      case 'rank': return `<div class="asq-q asq-rankq${full}" data-q="${q.id}" id="asq-q-${q.id}">${qHead(q)}<div class="asq-rank">${rankInner(q)}</div></div>`;
      case 'rate': {
        const rows = q.rows.map(([id, label]) => {
          const v = A[id];
          return `<div class="asq-row" role="group" aria-labelledby="asq-rl-${id}"><div class="asq-rlab"><span id="asq-rl-${id}">${esc(label)}</span><em class="asq-rdesc">${v != null ? RATE_LABELS[v] : 'Tap a level'}</em></div>
            <div class="asq-dots">${RATE_LABELS.map((lb, i) => `<button type="button" class="asq-dotb${v != null && i <= v ? ' lit' : ''}${v === i ? ' on' : ''}" data-act="rate" data-q="${id}" data-v="${i}" aria-pressed="${v === i}" aria-label="${esc(label)}: ${lb}">${i}</button>`).join('')}</div></div>`;
        }).join('');
        return `<div class="asq-q asq-rate${full}" data-q="${q.id}" id="asq-q-${q.id}">${qHead(q)}<div class="asq-rkey"><span>0 · New to me</span><span>4 · Could teach it</span></div><div class="asq-rows">${rows}</div></div>`;
      }
    }
    return '';
  }
  function rankInner(q) {
    const list = (Array.isArray(S.answers.goals) ? S.answers.goals : []).filter((k) => goalLabels[k]);
    const pool = q.items.filter(([k]) => list.indexOf(k) < 0);
    return `<div class="asq-poolw"><p class="asq-mini">Tap to add</p><div class="asq-pool">${pool.length ? pool.map(([k, l]) => `<button type="button" class="asq-padd" data-act="rank-add" data-k="${k}"><span aria-hidden="true">+</span> ${esc(l)}</button>`).join('') : '<p class="asq-mini">All ranked. Nice.</p>'}</div></div>
      <div class="asq-rankw"><p class="asq-mini">Your ranking</p>${list.length ? `<ol class="asq-ranked">${list.map((k, i) => `<li class="asq-ri" data-k="${k}"><span class="asq-grip" title="Drag to reorder">${ico.grip}</span><b class="asq-rn">${i + 1}</b><span class="asq-rl">${esc(goalLabels[k])}</span>
        <button type="button" class="asq-ib" data-act="rank-up" data-k="${k}" aria-label="Move ${esc(goalLabels[k])} up"${i === 0 ? ' disabled' : ''}>${ico.up}</button><button type="button" class="asq-ib" data-act="rank-down" data-k="${k}" aria-label="Move ${esc(goalLabels[k])} down"${i === list.length - 1 ? ' disabled' : ''}>${ico.down}</button><button type="button" class="asq-ib" data-act="rank-rm" data-k="${k}" aria-label="Remove ${esc(goalLabels[k])}">${ico.x}</button></li>`).join('')}</ol>` : '<div class="asq-empty">Your top goals land here. Start with the one that matters most.</div>'}</div>`;
  }

  /* ---------------- live pictures ---------------- */
  const VIZ = {
    life1: () => life(false), life2: () => life(true),
    networth() {
      const I = inputsOf(S.answers), X = I._x;
      const own = I.cash + X.retirement + X.brokerage + I.homeEquity + X.crypto + X.otherAssets, owe = I.debtHigh + I.debtOther, mx = Math.max(own, owe, 1);
      return `<div class="asq-nw"><div class="asq-nwh"><span class="asq-mini">Net worth</span><b class="${I.netWorth < 0 ? 'dn' : 'up'}">${usd(I.netWorth)}</b></div>
        <div class="asq-bars2"><div class="asq-b2"><span>You own</span><div class="asq-trk"><i class="own" style="width:${own / mx * 100}%"></i></div><em>${big(own)}</em></div>
        <div class="asq-b2"><span>You owe</span><div class="asq-trk"><i class="owe" style="width:${owe / mx * 100}%"></i></div><em>${big(owe)}</em></div></div>
        <p class="asq-vnote">Investable (retirement, brokerage, crypto): <b>${usd(I.investable)}</b></p></div>`;
    },
    savings() {
      const I = inputsOf(S.answers), sr = I._x.savingsRate, p = Math.round(sr * 100), em = I.emergencyMonths;
      const word = sr >= 0.5 ? 'FIRE pace.' : sr >= 0.25 ? 'Excellent.' : sr >= 0.15 ? 'Solid.' : sr >= 0.05 ? 'A start.' : 'Room to grow.';
      return `<div class="asq-sv"><div class="asq-nwh"><span class="asq-mini">Savings rate</span><b class="${sr >= 0.15 ? 'up' : 'acc'}">${p}%</b></div>
        <div class="asq-trk asq-trk-l"><i class="own" style="width:${p}%"></i></div>
        <p class="asq-vnote">${word} You keep ${p}% of what comes in (savings divided by savings plus spending).</p>
        <p class="asq-vnote">Your cash covers <b>${em >= 99 ? '99+' : r1(em)} months</b> of spending. ${em >= 6 ? 'A comfy cushion.' : em >= 3 ? 'Enough for most bumps.' : 'Most plans start at 3 to 6.'}</p></div>`;
    },
    fire() {
      const R = score(S.answers), G = R.goals, I = R.inputs, A = S.answers;
      const spend = num(A.retireSpend, DEF.retireSpend), oi = I.otherIncomeMonth;
      const formula = G.otherIncomeCounted ? `(${usd(spend)} spending \u2212 ${usd(oi)} other income) a month \u00d7 12 \u00d7 25, the 4% rule of thumb.` : `${usd(spend)} a month \u00d7 12 \u00d7 25, the 4% rule of thumb.`;
      const oiNote = oi > 0 && !G.otherIncomeCounted ? `<p class="asq-vnote asq-dim">Your ${usd(oi)} a month of Social Security or pension is not subtracted, because your target age is before 62. It will reduce withdrawals once it starts.</p>` : '';
      if (G.retired) {
        const wr = G.withdrawalRate >= 100 ? '100% or more' : G.withdrawalRate + '%';
        return `<div class="asq-fire"><div class="asq-nwh"><span class="asq-mini">${SML.flame ? SML.flame(14) : ''} Withdrawal rate</span><b class="${G.onTrack ? 'up' : 'dn'}">${G.withdrawalRate >= 100 ? '100%+' : G.withdrawalRate + '%'}</b></div>
          <p class="asq-vnote">You are at or past your target age, so the question is how long the money lasts, not how fast it grows. Spending ${usd(Math.max(0, spend - (G.otherIncomeCounted ? oi : 0)))} a month${G.otherIncomeCounted ? ' after other income' : ''} from ${usd(I.investable)} invested is about <b>${wr}</b> a year.
          <span class="pill ${G.onTrack ? 'up' : 'dn'}">${G.onTrack ? 'At or under 4%' : 'Above the 4% rule of thumb'}</span></p>
          <p class="asq-vnote asq-dim">FIRE number for reference: ${usd(G.fireNumber)} (${G.otherIncomeCounted ? 'spending minus other income' : 'spending'} \u00d7 12 \u00d7 25).</p>${oiNote}</div>`;
      }
      const when = G.yearsToGoal == null ? 'not within 60 years at this pace' : G.yearsToGoal === 0 ? 'you are there already' : `about ${yrs(Math.ceil(G.yearsToGoal))}, around age ${Math.round(I.age + G.yearsToGoal)}`;
      return `<div class="asq-fire"><div class="asq-nwh"><span class="asq-mini">${SML.flame ? SML.flame(14) : ''} Your FIRE number</span><b class="acc">${usd(G.fireNumber)}</b></div>
        <p class="asq-vnote">${formula}</p>
        <p class="asq-vnote">With ${usd(I.investable)} invested plus ${usd(I.savingsMonth)} a month, growing 5% a year after inflation: <b>${when}</b>.
        <span class="pill ${G.onTrack ? 'up' : 'dn'}">${G.onTrack ? 'On pace for ' + I.retireAge : `${usd(G.monthlyNeeded)}/mo reaches it by ${I.retireAge}`}</span></p>${oiNote}</div>`;
    },
    hours() {
      const h = num(S.answers.hours, DEF.hours);
      const t = h <= 1 ? 'Set and forget. A yearly check-in is plenty.' : h <= 4 ? 'Weekend check-in. Enough for index funds and a few long-term picks.' : h <= 9 ? 'Serious hobby. Room for value research or swing trading.' : h <= 19 ? 'Part-time trader. Enough to swing trade well, or practice day trading.' : 'Second job. Day trading territory, if your temperament agrees.';
      return `<p class="asq-vnote">${t}${h ? ` About ${Math.round(h * 60 / 7)} minutes a day.` : ''}</p>`;
    },
    mood() {
      const d = num(S.answers.drawdown, DEF.drawdown), mo = moodOf(d), inv = inputsOf(S.answers).investable, base = inv >= 10000 ? niceRound(inv) : 100000;
      return `<div class="asq-md">${bunnyMood(mo.m)}<div class="asq-mdt">
        <p class="asq-vnote">${inv >= 10000 ? 'Your' : 'A'} <b>${usd(base)}</b> would show <b class="dn">${usd(base * (1 - d / 100))}</b> at the bottom.</p>
        <div class="asq-trk asq-trk-l"><i class="own" style="width:${100 - d}%"></i><i class="owe" style="width:${d}%"></i></div>
        <p class="asq-vnote asq-dim">For scale: the S&amp;P 500 fell about 34% in early 2020, 25% in 2022 and 57% from 2007 to 2009.</p></div></div>`;
    },
  };
  function life(withRetire) {
    const A = S.answers, age = r0(cl(num(A.age, DEF.age), 18, 80)), ret = r0(cl(num(A.retireAge, DEF.retireAge), 35, 75)), lo = 18, hi = 95;
    const x = (v) => (cl(v, lo, hi) - lo) / (hi - lo) * 100, ra = Math.max(ret, age), n = ra - age, yr = YEAR() + n;
    const lab = (v, s, cls) => { const p = x(v); return `<span class="asq-lm ${cls}" style="left:${p}%"><i></i><em style="transform:translateX(${p < 14 ? 0 : p > 86 ? -100 : -50}%)">${s}</em></span>`; };
    const note = withRetire ? (n ? `${yrs(n)} from now, in ${yr}. If life runs to about 95, that leaves around ${yrs(Math.max(0, 95 - ra))} of freedom to fund.` : 'Work could be optional now. The plan is about making the money last.')
      : (n ? `${yrs(n)} until ${ra}${A.retireAge == null ? ', a placeholder you will set in Goals' : ''}. Time is the biggest ingredient in compounding.` : 'Past a typical retirement age. Capital and income matter more than time here.');
    return `<div class="asq-life"><div class="asq-lt"><i class="p" style="left:0;width:${x(age)}%"></i><i class="w" style="left:${x(age)}%;width:${x(ra) - x(age)}%"></i><i class="r" style="left:${x(ra)}%;right:0"></i></div>
      ${lab(age, 'You · ' + age, 'now')}${n ? lab(ra, (withRetire ? 'Optional · ' : 'Target · ') + ra, 'ret') : ''}</div><p class="asq-vnote">${note}</p>`;
  }

  /* ---------------- side panel and footer hint ---------------- */
  function sideHTML() {
    const R = score(S.answers), I = R.inputs, ms = S.maxStep, sr = Math.round(inputsOf(S.answers)._x.savingsRate * 100);
    const typed = ms >= 3;
    const top = Object.keys(R.scores.styles).map((k) => [k, R.scores.styles[k]]).sort((p, q) => q[1] - p[1]).slice(0, 4);
    const fact = (label, val, ok) => `<div class="asq-fact"><dt>${label}</dt><dd>${ok ? val : '<span class="asq-dim">after this part</span>'}</dd></div>`;
    return `<div class="asq-panel asq-guess" aria-live="polite">
        <p class="asq-mini">So far you look like</p>
        ${typed ? `<div class="asq-gn">${SML.bunnyMark ? SML.bunnyMark(40) : ''}<div><b>${esc(R.archetype.name)}</b><span>${esc(R.archetype.tagline)}</span></div></div>
          <ul class="asq-sbars">${top.map(([k, v]) => `<li><span>${styleLabels[k]}</span><div class="asq-trk"><i class="own" style="width:${v}%"></i></div><em>${v}</em></li>`).join('')}</ul>
          <p class="asq-vnote asq-dim">Updates as you answer. Everyone is a blend.</p>`
        : `<div class="asq-gn">${SML.bunnyMark ? SML.bunnyMark(40) : ''}<div><b>Still sniffing around</b><span>Your type shows up once you reach Time and style.</span></div></div>`}
      </div>
      <div class="asq-panel"><p class="asq-mini">Your numbers</p><dl class="asq-facts">
        ${fact('Age and runway', R.goals.retired ? `${I.age} · past target ${I.retireAge}` : `${I.age} · ${yrs(I.horizon)} to ${I.retireAge}`, true)}
        ${fact('Net worth', usd(I.netWorth), ms >= 1)}
        ${fact('Savings rate', sr + '%', ms >= 1)}
        ${fact('Cash cushion', (I.emergencyMonths >= 99 ? '99+' : r1(I.emergencyMonths)) + ' months', ms >= 1)}
        ${R.goals.retired ? fact('Withdrawal rate', `${R.goals.withdrawalRate >= 100 ? '100%+' : R.goals.withdrawalRate + '%'} (vs 4%)`, ms >= 2) : fact('FIRE number', usd(R.goals.fireNumber), ms >= 2)}
        ${fact('Risk score', `${R.scores.risk} · ${R.profile.label}`, ms >= 4)}
      </dl></div>
      <p class="asq-disc">Educational rule of thumb, not personal advice. Your answers stay in this browser so you can pick up where you left off; nothing goes to your profile until you save.</p>`;
  }
  function mobileHint() {
    const R = score(S.answers);
    if (S.maxStep >= 3) return `Looks like: <b>${esc(R.archetype.name)}</b>`;
    if (S.maxStep >= 1) return `Net worth <b>${big(R.inputs.netWorth)}</b>`;
    return `Part ${S.step + 1} of ${SECTIONS.length} \u00b7 ${esc(SECTIONS[S.step].title)}`;
  }

  /* ---------------- page ---------------- */
  SML.pages.assessment = function (view) {
    S = loadState();
    const prefN = S.pref.length;
    view.innerHTML = `
      ${SML.pageHeader('', 'Lessons · Self-assessment', 'What kind of <em>investor</em> are you?', `<p>Seven short parts, about 7 minutes. Sliders and taps, no wrong answers. You get your investor type, a risk profile, a starting mix, your FIRE number and a learning path built for you.</p>
        <p class="meta asq-hmeta">${SML.flame ? SML.flame(13) : ''}<span>Your answers stay in this browser so you can pick up where you left off; nothing goes to your profile until you save.</span></p>`)}
      <section class="wrap" aria-label="Self-assessment questions">
        <div class="asq" data-widget="assessQuiz" data-mounted="1">
          <div class="asq-top">
            <div class="asq-trailw"><ol class="asq-trail" style="--t:0">
              <li class="asq-hopper" aria-hidden="true">${SML.bunnyMark ? SML.bunnyMark(30) : ''}</li><li class="asq-fill" aria-hidden="true"></li>
              ${SECTIONS.map((s, i) => `<li class="asq-st"><button type="button" class="asq-stop" data-act="go" data-i="${i}" aria-label="Part ${i + 1}: ${esc(s.title)}"><span class="asq-dot"></span><span class="asq-sl">${esc(s.title)}</span></button></li>`).join('')}
            </ol></div>
            <div class="asq-topr"><span class="asq-note" id="asq-note">${S.resumed ? 'Picked up where you left off.' : prefN ? `Prefilled ${prefN} answer${prefN === 1 ? '' : 's'} from your profile. Change anything; your profile stays as it is.` : ''}</span>
              <button type="button" class="asq-link" data-act="reset">Start over</button></div>
          </div>
          <div class="asq-card">
            <div class="asq-body" id="asq-body"></div>
            <div class="asq-foot">
              <button type="button" class="btn btn-g asq-back" data-act="back">${ico.arrowL}<span>Back</span></button>
              <div class="asq-fmid"><span class="asq-msg" id="asq-msg" role="status"></span><span class="asq-mh" id="asq-mh"></span><span class="asq-cnt" id="asq-cnt"></span></div>
              <button type="button" class="btn btn-p asq-next" data-act="next"><span>Next</span>${ico.arrowR}</button>
            </div>
          </div>
          <aside class="asq-side" id="asq-side" aria-label="Live summary"></aside>
        </div>
      </section>`;
    const root = view.querySelector('.asq'), body = root.querySelector('#asq-body');
    const $ = (sel) => root.querySelector(sel);
    let resetArm = false;

    function refreshLive() {
      const side = $('#asq-side'); if (side) side.innerHTML = sideHTML();
      const c = counts(); $('#asq-cnt').textContent = `${c.done} of ${c.total} answered`;
      $('#asq-mh').innerHTML = mobileHint();
    }
    function refreshViz() { body.querySelectorAll('.asq-viz').forEach((el) => { const f = VIZ[el.dataset.viz]; if (f) el.innerHTML = f(); }); }
    function trail(hop) {
      const ol = $('.asq-trail'); ol.style.setProperty('--t', S.step / (SECTIONS.length - 1));
      ol.querySelectorAll('.asq-stop').forEach((b, i) => {
        b.classList.toggle('on', i === S.step); b.classList.toggle('done', i < S.step || (i <= S.maxStep && i !== S.step));
        b.disabled = i > S.maxStep; if (i === S.step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      const hp = $('.asq-hopper');
      if (hop && !SML.reduced()) { hp.classList.remove('hop'); void hp.offsetWidth; hp.classList.add('hop'); }
    }
    function renderStep(opts) {
      const o = opts || {}; ensureDefaults(S.step); S.maxStep = Math.max(S.maxStep, S.step);
      const sec = SECTIONS[S.step], last = S.step === SECTIONS.length - 1;
      body.innerHTML = `<div class="asq-head"><p class="asq-k">Part ${String(S.step + 1).padStart(2, '0')} / ${String(SECTIONS.length).padStart(2, '0')}</p>
          <h2 class="asq-h" tabindex="-1" id="asq-h">${esc(sec.title)}</h2><p class="asq-b">${esc(sec.blurb)}</p></div>
        <div class="asq-qs">${sec.qs.map(qHTML).join('')}</div>`;
      $('.asq-back').disabled = S.step === 0;
      $('.asq-next').innerHTML = last ? `<span>See my results</span>${ico.arrowR}` : `<span>Next</span>${ico.arrowR}`;
      $('#asq-msg').textContent = '';
      trail(o.hop); refreshLive(); persist();
      if (o.scroll) {
        const top = root.getBoundingClientRect().top + window.scrollY - 76;
        if (window.scrollY > top) window.scrollTo({ top, behavior: SML.reduced() ? 'auto' : 'smooth' });
        const h = $('#asq-h'); if (h) try { h.focus({ preventScroll: true }); } catch (e) { /* old browsers */ }
      }
    }
    function goTo(i) { i = r0(cl(i, 0, SECTIONS.length - 1)); if (i === S.step) return; S.step = i; renderStep({ hop: true, scroll: true }); }
    function changed() { S.touched = true; refreshViz(); refreshLive(); persist(); }
    function next() {
      const miss = missing(S.step);
      if (miss.length && !S.nudged[S.step]) {
        S.nudged[S.step] = true;
        miss.forEach((id) => { const el = $('#asq-q-' + id); if (el) el.classList.add('asq-miss'); });
        const first = $('#asq-q-' + miss[0]);
        if (first) { const top = first.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo({ top, behavior: SML.reduced() ? 'auto' : 'smooth' }); }
        $('#asq-msg').textContent = `${miss.length} left blank. Answer, or press ${S.step === SECTIONS.length - 1 ? 'See my results' : 'Next'} again to skip.`;
        return;
      }
      if (S.step < SECTIONS.length - 1) goTo(S.step + 1); else finish();
    }
    function finish() {
      for (let i = 0; i < SECTIONS.length; i++) ensureDefaults(i);
      const result = score(S.answers, { id: newId(), date: new Date().toISOString() });
      SML.store.set('assessDraft', result); SML.assessDraft = result;
      SML.store.set(KEY, null);
      if (SML.hop) SML.hop('Hop hop. Your results are ready.');
      SML.go('results');
    }
    function setPick(qid, v) {
      S.answers[qid] = v;
      root.querySelectorAll(`.asq-opt[data-q="${qid}"]`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      const q = $('#asq-q-' + qid); if (q) q.classList.remove('asq-miss');
      changed();
    }
    function setRate(id, v) {
      S.answers[id] = v;
      root.querySelectorAll(`.asq-dotb[data-q="${id}"]`).forEach((b) => { const i = Number(b.dataset.v); b.classList.toggle('lit', i <= v); b.classList.toggle('on', i === v); b.setAttribute('aria-pressed', String(i === v)); });
      const row = root.querySelector(`.asq-dotb[data-q="${id}"]`); const d = row && row.closest('.asq-row').querySelector('.asq-rdesc'); if (d) d.textContent = RATE_LABELS[v];
      const qq = $('#asq-q-know'); if (qq && !missing(S.step).length) qq.classList.remove('asq-miss');
      changed();
    }
    function rankUpdate(fn, focusSel) {
      const list = (Array.isArray(S.answers.goals) ? S.answers.goals.slice() : []).filter((k) => goalLabels[k]);
      fn(list); S.answers.goals = list;
      const q = SECTIONS[2].qs[1], box = $('#asq-q-goals .asq-rank'); if (box) box.innerHTML = rankInner(q);
      if (list.length) { const e = $('#asq-q-goals'); if (e) e.classList.remove('asq-miss'); }
      if (focusSel) { const f = root.querySelector(focusSel); if (f && !f.disabled) f.focus(); }
      changed();
    }
    function sliderInput(el) {
      const qid = el.dataset.q, q = QS.find((x) => x.id === qid); if (!q) return;
      let v;
      if (el.dataset.scale) { v = posToVal(SC[el.dataset.scale], el.value); el.setAttribute('aria-valuetext', usd(v)); const t = root.querySelector(`.asq-num[data-q="${qid}"]`); if (t) t.value = usd(v); }
      else { v = r0(cl(num(el.value, q.def), q.min == null ? 0 : q.min, q.max == null ? 100 : q.max)); }
      el.style.setProperty('--p', (el.value - el.min) / ((el.max - el.min) || 1) * 100 + '%');
      S.answers[qid] = v;
      const ro = $('#asq-' + qid + '-ro'); if (ro) ro.innerHTML = q.type === 'poles' ? polesLabel(v) : q.ro(v, S.answers);
      if (q.type === 'poles') el.setAttribute('aria-valuetext', polesLabel(v));
      if (qid === 'age') { const r = $('#asq-retireAge-ro'); if (r) r.innerHTML = SECTIONS[2].qs[0].ro(num(S.answers.retireAge, DEF.retireAge), S.answers); }
      changed();
    }
    function moneyTyped(el) {
      const qid = el.dataset.q, q = QS.find((x) => x.id === qid); if (!q) return;
      let v = parseMoney(el.value);
      if (!fin(v)) { el.value = usd(num(S.answers[qid], q.def)); return; }
      v = Math.round(cl(v, 0, 1e9)); S.answers[qid] = v; el.value = usd(v);
      const rg = $('#asq-' + qid); if (rg) { const p = valToPos(SC[q.scale], v); rg.value = p; rg.style.setProperty('--p', p / POS * 100 + '%'); rg.setAttribute('aria-valuetext', usd(v)); }
      changed();
    }

    root.addEventListener('input', (e) => { const el = e.target; if (el.type === 'range' && el.dataset.q) sliderInput(el); });
    root.addEventListener('change', (e) => { const el = e.target; if (el.classList.contains('asq-num')) moneyTyped(el); });
    root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('asq-num')) { e.preventDefault(); e.target.blur(); } });
    root.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('asq-num')) { try { e.target.select(); } catch (er) { /* ignore */ } } });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b || !root.contains(b) || b.disabled) return;
      const act = b.dataset.act, k = b.dataset.k;
      if (act !== 'reset' && resetArm) { resetArm = false; const r = $('[data-act="reset"]'); if (r) r.textContent = 'Start over'; }
      if (act === 'pick') setPick(b.dataset.q, b.dataset.v);
      else if (act === 'rate') setRate(b.dataset.q, r0(cl(num(b.dataset.v, 0), 0, 4)));
      else if (act === 'rank-add') rankUpdate((l) => { if (l.indexOf(k) < 0 && goalLabels[k]) l.push(k); });
      else if (act === 'rank-rm') rankUpdate((l) => { const i = l.indexOf(k); if (i >= 0) l.splice(i, 1); });
      else if (act === 'rank-up') rankUpdate((l) => { const i = l.indexOf(k); if (i > 0) { l.splice(i, 1); l.splice(i - 1, 0, k); } }, `.asq-ri[data-k="${k}"] [data-act="rank-up"]`);
      else if (act === 'rank-down') rankUpdate((l) => { const i = l.indexOf(k); if (i >= 0 && i < l.length - 1) { l.splice(i, 1); l.splice(i + 1, 0, k); } }, `.asq-ri[data-k="${k}"] [data-act="rank-down"]`);
      else if (act === 'next') next();
      else if (act === 'back') goTo(S.step - 1);
      else if (act === 'go') goTo(num(b.dataset.i, 0));
      else if (act === 'reset') {
        if (!resetArm) { resetArm = true; b.textContent = 'Tap again to clear all answers'; return; }
        resetArm = false; b.textContent = 'Start over';
        SML.store.set(KEY, null); S = { answers: {}, step: 0, maxStep: 0, pref: [], resumed: false, touched: false, nudged: {} }; applyPrefill(S);
        const n = $('#asq-note'); if (n) n.textContent = S.pref.length ? `Fresh start. Prefilled ${S.pref.length} from your profile.` : 'Fresh start.';
        renderStep({ hop: true, scroll: true });
      }
    });
    /* Drag to reorder ranked goals (pointer events work for mouse, pen and touch). */
    root.addEventListener('pointerdown', (e) => {
      const grip = e.target.closest('.asq-grip'); if (!grip) return;
      const li = grip.closest('.asq-ri'), list = li && li.parentElement; if (!li || !list) return;
      e.preventDefault(); li.classList.add('drag');
      const h = li.getBoundingClientRect().height + 6; let y0 = e.clientY;
      const renum = () => list.querySelectorAll('.asq-rn').forEach((n, i) => { n.textContent = i + 1; });
      const mv = (ev) => {
        let dy = ev.clientY - y0;
        while (dy > h / 2 && li.nextElementSibling) { list.insertBefore(li.nextElementSibling, li); y0 += h; dy -= h; renum(); }
        while (dy < -h / 2 && li.previousElementSibling) { list.insertBefore(li, li.previousElementSibling); y0 -= h; dy += h; renum(); }
        li.style.transform = `translateY(${dy}px)`;
      };
      const up = () => {
        window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        li.classList.remove('drag'); li.style.transform = '';
        const order = Array.from(list.children).map((x) => x.dataset.k).filter((x) => goalLabels[x]);
        rankUpdate((l) => { l.length = 0; order.forEach((x) => l.push(x)); });
      };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      SML.onCleanup(() => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); });
    });
    /* A cloud profile can finish loading after this page renders: prefill then, if nothing was answered yet. */
    if (SML.account && typeof SML.account.onChange === 'function') {
      const off = SML.account.onChange(() => {
        if (!S || S.touched || !document.body.contains(root)) return;
        const before = S.pref.length; applyPrefill(S);
        if (S.pref.length !== before) { const n = $('#asq-note'); if (n) n.textContent = `Prefilled ${S.pref.length} answer${S.pref.length === 1 ? '' : 's'} from your profile. Change anything; your profile stays as it is.`; renderStep(); }
      });
      SML.onCleanup(() => { try { if (typeof off === 'function') off(); } catch (e) { /* ignore */ } });
    }
    renderStep();
    return 'Self-assessment';
  };

  /* ===================================================================================================
     STYLES (module prefix .asq-)
     =================================================================================================== */
  SML.css(`
    .page-hdr .ph-side p.asq-hmeta{display:flex;flex-wrap:nowrap;align-items:flex-start;gap:8px;font:400 14px/1.5 var(--sans);letter-spacing:0;text-transform:none;color:var(--muted)}
    .asq-hmeta .fb-flame{flex:0 0 auto;margin-top:4px}.asq-hmeta span{flex:1;min-width:0}
    .asq{display:grid;gap:20px;padding-block:28px 72px;min-width:0}
    @media (min-width:1024px){.asq{grid-template-columns:minmax(0,1fr) 300px;column-gap:28px;align-items:start;padding-top:40px}.asq-top{grid-column:1/-1}}
    .asq-top{display:flex;flex-direction:column;gap:10px;min-width:0}
    .asq-trailw{background:var(--surface);border:1px solid var(--line);border-radius:calc(var(--r)*2);padding:10px 14px 12px}
    .asq-trail{position:relative;list-style:none;margin:0;padding:34px 0 0;display:grid;grid-template-columns:repeat(${SECTIONS.length},minmax(0,1fr))}
    .asq-trail::before{content:"";position:absolute;left:calc(100%/${SECTIONS.length * 2});right:calc(100%/${SECTIONS.length * 2});top:43px;height:2px;background:var(--line)}
    .asq-fill{position:absolute;left:calc(100%/${SECTIONS.length * 2});top:43px;height:2px;width:calc((100% - 100%/${SECTIONS.length}) * var(--t));background:linear-gradient(90deg,var(--gold),var(--flame));transition:width .55s cubic-bezier(.3,.7,.3,1)}
    .asq-hopper{position:absolute;top:0;left:calc(100%/${SECTIONS.length * 2} + (100% - 100%/${SECTIONS.length}) * var(--t));transform:translateX(-50%);transition:left .55s cubic-bezier(.3,.7,.3,1);line-height:0;z-index:2;filter:drop-shadow(0 0 8px color-mix(in srgb,var(--flame) 35%,transparent))}
    .asq-hopper.hop .fb-mark{animation:asq-hop .6s ease-out}
    @keyframes asq-hop{0%{transform:translateY(0)}35%{transform:translateY(-14px) rotate(-6deg)}65%{transform:translateY(0)}80%{transform:translateY(-4px)}100%{transform:translateY(0)}}
    .asq-st{display:flex;justify-content:center;min-width:0}
    .asq-stop{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;padding:0 2px;min-height:44px;min-width:36px;color:var(--muted);font:500 10.5px/1.2 var(--mono);letter-spacing:.1em;text-transform:uppercase;cursor:pointer;position:relative;z-index:1}
    .asq-stop:disabled{cursor:default;opacity:.55}
    .asq-dot{width:18px;height:18px;border-radius:50%;background:var(--bg);border:2px solid var(--input);transition:background .2s,border-color .2s,box-shadow .2s}
    .asq-stop.done .asq-dot{background:var(--accent);border-color:var(--accent)}
    .asq-stop.on{color:var(--ink)}
    .asq-stop.on .asq-dot{background:var(--bg);border-color:var(--flame);box-shadow:0 0 0 4px color-mix(in srgb,var(--flame) 22%,transparent)}
    .asq-stop:not(:disabled):hover .asq-dot{border-color:var(--accent)}
    .asq-stop:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
    .asq-sl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    @media (max-width:760px){.asq-sl{display:none}.asq-trailw{padding:8px 8px 6px}}
    .asq-topr{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 14px;min-height:28px}
    .asq-note{font-size:13.5px;color:var(--muted)}
    .asq-link{background:none;border:0;padding:6px 0;min-height:32px;color:var(--muted);font:500 12px var(--mono);letter-spacing:.06em;text-decoration:underline;text-underline-offset:3px;cursor:pointer;margin-left:auto}
    .asq-link:hover{color:var(--accent)}
    .asq-card{background:var(--surface);border:1px solid var(--line);border-radius:calc(var(--r)*2);overflow:clip;min-width:0}
    .asq-head{padding:28px 28px 6px}
    .asq-k{font:600 11px var(--mono);letter-spacing:.22em;text-transform:uppercase;color:var(--accent)}
    .asq-h{font:400 clamp(44px,6vw,68px)/.92 var(--display);letter-spacing:.01em;color:var(--ink);margin:10px 0 8px}
    .asq-h:focus,.asq-h:focus-visible{outline:none;box-shadow:none}
    .asq-b{color:var(--muted);font-size:15.5px;line-height:1.55;max-width:60ch;text-wrap:pretty}
    .asq-qs{display:grid;gap:14px;padding:18px 28px 28px;min-width:0}
    @media (min-width:760px){.asq-qs{grid-template-columns:repeat(2,minmax(0,1fr))}.asq-full,.asq-group{grid-column:1/-1}}
    .asq-group{display:flex;align-items:center;gap:12px;margin:10px 0 -2px;font:600 11px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
    .asq-group::after{content:"";flex:1;height:1px;background:var(--line)}
    .asq-q{background:var(--bg);border:1px solid var(--line);border-radius:var(--r);padding:18px;display:flex;flex-direction:column;gap:12px;min-width:0;transition:border-color .2s,box-shadow .2s}
    .asq-q.asq-miss{border-color:var(--flame);box-shadow:0 0 0 3px color-mix(in srgb,var(--flame) 18%,transparent)}
    .asq-vizq{background:color-mix(in srgb,var(--accent) 5%,var(--bg))}
    .asq-qhead{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 10px}
    .asq-qt{font:600 16px/1.38 var(--sans);color:var(--ink);text-wrap:pretty}
    .asq-qsub{font-size:13.5px;line-height:1.5;color:var(--muted);margin-top:-6px;text-wrap:pretty}
    .asq-shl .asq-qsub{margin-top:5px}
    .asq-pref{display:inline-flex;align-items:center;min-height:20px;padding:0 8px;border-radius:999px;font:600 9.5px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--gold);border:1px solid color-mix(in srgb,var(--gold) 40%,var(--line))}
    .asq-mini{font:600 10.5px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:6px}
    .asq-dim{color:var(--muted)}
    /* sliders */
    .asq-sh{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
    .asq-shl{min-width:0;flex:1}
    .asq-ro{font:400 36px/1 var(--display);letter-spacing:.02em;color:var(--accent);text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
    .asq-ro small{display:block;margin-top:5px;font:500 10px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .asq-num{width:10.5ch;min-width:96px;max-width:58%;flex:0 0 auto;font:400 30px/1.05 var(--display);letter-spacing:.02em;color:var(--accent);background:transparent;border:0;border-bottom:1px dashed color-mix(in srgb,var(--accent) 50%,transparent);border-radius:0;padding:2px 0;text-align:right;font-variant-numeric:tabular-nums}
    .asq-num:hover{border-bottom-color:var(--accent)}
    .asq-num:focus{outline:none;border-bottom:1px solid var(--accent);background:color-mix(in srgb,var(--accent) 7%,transparent)}
    .asq input[type=range]{height:32px}
    .asq input[type=range]::-webkit-slider-runnable-track{height:8px;border-radius:4px}
    .asq input[type=range]::-webkit-slider-thumb{width:26px;height:26px;margin-top:-9px;border:3px solid var(--bg);box-shadow:0 0 0 2px var(--accent),0 2px 10px rgba(0,0,0,.5)}
    .asq input[type=range]:hover::-webkit-slider-thumb,.asq input[type=range]:active::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--accent),0 0 0 9px rgba(232,173,79,.2)}
    .asq input[type=range]:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--accent),0 0 0 9px rgba(232,173,79,.38)}
    .asq input[type=range]::-moz-range-track{height:8px;border-radius:4px}
    .asq input[type=range]::-moz-range-progress{height:8px;border-radius:4px}
    .asq input[type=range]::-moz-range-thumb{width:22px;height:22px;border:3px solid var(--bg);box-shadow:0 0 0 2px var(--accent)}
    .asq-ends{display:flex;justify-content:space-between;margin-top:-6px;font:500 10.5px var(--mono);letter-spacing:.06em;color:var(--muted)}
    .asq-pl{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:10px;font:500 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
    .asq-pl span:last-child{text-align:right}
    .asq-pro{font:400 24px/1 var(--display);letter-spacing:.03em;color:var(--accent);text-transform:none;text-align:center}
    /* tap cards */
    .asq-opts{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(min(100%,128px),1fr))}
    @media (max-width:600px){.asq-opt{padding:12px 30px 12px 12px;min-height:60px}.asq-chk{top:10px;right:10px}}
    .asq-opt{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-height:68px;padding:14px 34px 14px 14px;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);color:var(--text);cursor:pointer;transition:border-color .15s,background .15s,transform .12s;-webkit-tap-highlight-color:transparent}
    .asq-opt:hover{border-color:color-mix(in srgb,var(--accent) 55%,var(--line))}
    .asq-opt:active{transform:scale(.98)}
    .asq-opt:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .asq-opt b{font:600 14.5px/1.3 var(--sans);color:var(--ink)}
    .asq-opt > span{font-size:12.5px;line-height:1.4;color:var(--muted)}
    .asq-opt[aria-pressed=true]{border-color:var(--accent);background:var(--accent-t);box-shadow:inset 0 0 0 1px var(--accent)}
    .asq-chk{position:absolute;top:12px;right:12px;width:18px;height:18px;border-radius:50%;border:1.5px solid var(--input);display:grid;place-items:center;color:transparent;transition:background .15s,border-color .15s}
    .asq-opt[aria-pressed=true] .asq-chk{background:var(--accent);border-color:var(--accent);color:var(--on-acc)}
    .asq-tot{display:grid;gap:10px;align-items:stretch}
    @media (min-width:640px){.asq-tot{grid-template-columns:1fr auto 1fr}.asq-tot3{grid-template-columns:1fr auto 1fr auto 1fr}}
    .asq-tot .asq-opt{min-height:84px;justify-content:center}
    .asq-tot .asq-opt b{font:400 24px/1.05 var(--display);letter-spacing:.02em}
    .asq-or{align-self:center;justify-self:center;font:600 10px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);padding:2px 8px;border:1px solid var(--line);border-radius:999px;background:var(--bg)}
    .asq-scn{display:flex;justify-content:flex-start}
    .asq-spark{max-width:100%;height:auto;display:block;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:4px}
    .asq-pfs .asq-opt{gap:6px}
    .asq-pf{position:relative;display:block;width:100%;height:10px;margin-top:6px;background:var(--line);border-radius:5px;overflow:hidden}
    .asq-pf i{position:absolute;top:0;bottom:0}
    .asq-pfz{left:50%;width:2px;margin-left:-1px;background:var(--ink);z-index:1}
    .asq-pfn{right:50%;background:var(--down)}
    .asq-pfp{left:50%;background:var(--up)}
    .asq-pfl{display:flex;justify-content:space-between;width:100%;font:600 11px var(--mono)}
    .asq-pfl em{font-style:normal}
    .asq-opt .dn,.asq-viz .dn,.asq-panel .dn{color:var(--down)} .asq-opt .up,.asq-viz .up,.asq-panel .up{color:var(--up)} .asq-viz .acc{color:var(--accent)}
    /* ranking */
    .asq-rank{display:grid;gap:16px}
    @media (min-width:760px){.asq-rank{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)}}
    .asq-poolw,.asq-rankw{display:flex;flex-direction:column;gap:10px;min-width:0}
    .asq-pool{display:flex;flex-wrap:wrap;gap:8px}
    .asq-padd{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;border:1px dashed var(--input);background:var(--surface);color:var(--text);font:500 13.5px var(--sans);cursor:pointer;transition:border-color .15s,color .15s}
    .asq-padd span{color:var(--accent);font-weight:700}
    .asq-padd:hover{border-color:var(--accent);color:var(--ink)}
    .asq-ranked{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
    .asq-ri{display:flex;align-items:center;gap:6px;padding:4px 4px 4px 4px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);user-select:none}
    .asq-ri:nth-child(-n+3){border-color:color-mix(in srgb,var(--flame) 38%,var(--line))}
    .asq-ri.drag{position:relative;z-index:3;border-color:var(--accent);box-shadow:0 10px 28px var(--raise);background:var(--surface-2)}
    .asq-grip{display:grid;place-items:center;width:30px;height:38px;color:var(--muted);cursor:grab;touch-action:none}
    .asq-ri.drag .asq-grip{cursor:grabbing}
    .asq-rn{width:22px;text-align:center;font:400 24px/1 var(--display);color:var(--accent)}
    .asq-ri:nth-child(-n+3) .asq-rn{color:var(--flame)}
    .asq-rl{flex:1;min-width:0;font-size:14.5px;line-height:1.3;color:var(--ink)}
    @media (max-width:600px){.asq-ib{width:34px;height:34px}.asq-grip{width:24px}}
    .asq-ib{display:grid;place-items:center;width:36px;height:36px;flex:0 0 auto;border-radius:var(--r);border:1px solid var(--line);background:var(--bg);color:var(--muted);cursor:pointer}
    .asq-ib:hover:not(:disabled){color:var(--ink);border-color:var(--input)}
    .asq-ib:disabled{opacity:.35;cursor:default}
    .asq-empty{border:1px dashed var(--line);border-radius:var(--r);padding:22px 16px;font-size:13.5px;color:var(--muted);text-align:center}
    /* knowledge */
    .asq-rkey{display:flex;justify-content:space-between;gap:10px;font:500 10.5px var(--mono);letter-spacing:.06em;color:var(--muted)}
    .asq-rows{display:flex;flex-direction:column}
    .asq-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px 14px;padding:10px 0;border-top:1px solid var(--line)}
    .asq-rlab{display:flex;flex-direction:column;gap:3px;min-width:0;color:var(--ink);font-size:14.5px}
    .asq-rdesc{font:500 10.5px var(--mono);font-style:normal;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
    .asq-dots{display:flex;gap:6px}
    .asq-dotb{width:42px;height:42px;border-radius:50%;border:1px solid var(--input);background:var(--surface);color:var(--muted);font:600 13px var(--mono);cursor:pointer;transition:background .15s,border-color .15s,color .15s}
    .asq-dotb.lit{background:var(--accent-t);border-color:color-mix(in srgb,var(--accent) 55%,var(--line));color:var(--ink)}
    .asq-dotb.on{background:var(--accent);border-color:var(--accent);color:var(--on-acc)}
    .asq-dotb:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    @media (max-width:560px){.asq-row{grid-template-columns:1fr}.asq-dots{justify-content:space-between}.asq-dotb{width:44px;height:44px}}
    /* live pictures */
    .asq-viz{min-width:0}
    .asq-vnote{font-size:13.5px;line-height:1.55;color:var(--text);text-wrap:pretty}
    .asq-vnote b{color:var(--ink);font-weight:600}
    .asq-vnote .pill{margin-left:6px;vertical-align:1px}
    .asq-life{position:relative;height:70px;margin:2px 0 4px}
    .asq-lt{position:absolute;left:0;right:0;top:30px;height:10px;border-radius:5px;background:var(--line);overflow:hidden}
    .asq-lt i{position:absolute;top:0;bottom:0;transition:left .2s,width .2s}
    .asq-lt .p{background:color-mix(in srgb,var(--muted) 40%,transparent)}
    .asq-lt .w{background:linear-gradient(90deg,var(--gold),var(--flame))}
    .asq-lt .r{background:color-mix(in srgb,var(--up) 65%,transparent)}
    .asq-lm{position:absolute;top:0;bottom:0;width:0}
    .asq-lm i{position:absolute;left:-1px;top:20px;width:2px;height:28px;background:var(--ink)}
    .asq-lm em{position:absolute;top:0;left:0;font:600 11px var(--mono);font-style:normal;letter-spacing:.04em;white-space:nowrap;color:var(--ink)}
    .asq-lm.ret i{top:30px;height:20px;background:var(--up)} .asq-lm.ret em{top:54px;color:var(--up)}
    .asq-nw,.asq-sv,.asq-fire{display:flex;flex-direction:column;gap:10px}
    .asq-nwh{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .asq-nwh b{font:400 40px/1 var(--display);letter-spacing:.02em}
    .asq-bars2{display:flex;flex-direction:column;gap:8px}
    .asq-b2{display:grid;grid-template-columns:62px minmax(0,1fr) 64px;align-items:center;gap:10px;font:500 11px var(--mono);color:var(--muted);letter-spacing:.04em}
    .asq-b2 em{font-style:normal;text-align:right;color:var(--ink)}
    .asq-trk{position:relative;display:flex;height:10px;border-radius:5px;background:var(--line);overflow:hidden}
    .asq-trk i{display:block;height:100%;transition:width .2s}
    .asq-trk .own{background:linear-gradient(90deg,var(--gold),var(--accent))}
    .asq-trk .owe{background:var(--down)}
    .asq-trk-l{height:14px;border-radius:7px}
    .asq-md{display:flex;align-items:center;gap:18px}
    .asq-mood{flex:0 0 auto;width:104px;height:104px}
    .asq-mdt{display:flex;flex-direction:column;gap:10px;min-width:0;flex:1}
    @media (max-width:480px){.asq-md{gap:12px}.asq-mood{width:80px;height:80px}}
    /* footer */
    .asq-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 28px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--surface) 94%,transparent)}
    .asq-foot .btn{flex:0 0 auto}
    .asq-foot .btn:disabled{opacity:.4;cursor:default}
    .asq-fmid{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center}
    .asq-msg{font-size:13px;color:var(--flame);line-height:1.35}
    .asq-msg:empty{display:none}
    .asq-mh{font-size:12.5px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .asq-mh b{color:var(--accent);font-weight:600}
    .asq-cnt{font:500 10.5px var(--mono);letter-spacing:.08em;color:var(--muted)}
    @media (min-width:1024px){.asq-mh{display:none}}
    @media (max-width:1023px){.asq-foot{position:sticky;bottom:0;z-index:5;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}}
    @media (max-width:600px){.asq-head{padding:22px 16px 4px}.asq-qs{padding:14px 10px 18px;gap:10px}.asq-q{padding:14px}.asq-foot .btn{padding:0 14px}.asq-back span{display:none}.asq-ro{font-size:32px}.asq-num{font-size:25px}}
    /* side panel */
    .asq-side{display:none}
    @media (min-width:1024px){.asq-side{display:flex;flex-direction:column;gap:14px;position:sticky;top:84px}}
    .asq-panel{background:var(--surface);border:1px solid var(--line);border-radius:calc(var(--r)*2);padding:18px;display:flex;flex-direction:column;gap:12px}
    .asq-guess{background:linear-gradient(160deg,color-mix(in srgb,var(--flame) 9%,var(--surface)),var(--surface) 60%);border-color:color-mix(in srgb,var(--flame) 26%,var(--line))}
    .asq-gn{display:flex;gap:12px;align-items:flex-start}
    .asq-gn .fb-mark{flex:0 0 auto}
    .asq-gn b{display:block;font:400 30px/1 var(--display);letter-spacing:.02em;color:var(--gold)}
    .asq-gn span{display:block;margin-top:4px;font-size:13px;line-height:1.45;color:var(--muted)}
    .asq-sbars{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
    .asq-sbars li{display:grid;grid-template-columns:96px minmax(0,1fr) 26px;align-items:center;gap:8px;font-size:12.5px;color:var(--text)}
    .asq-sbars em{font:600 11px var(--mono);font-style:normal;text-align:right;color:var(--ink)}
    .asq-sbars .asq-trk{height:8px}
    .asq-facts{margin:0;display:flex;flex-direction:column}
    .asq-fact{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line);font-size:13px}
    .asq-fact:first-child{border-top:0;padding-top:2px}
    .asq-fact dt{color:var(--muted)}
    .asq-fact dd{margin:0;color:var(--ink);font:600 12.5px var(--mono);text-align:right}
    .asq-fact dd .asq-dim{font:400 12px var(--sans)}
    .asq-disc{font-size:12px;line-height:1.5;color:var(--muted);padding:0 4px}
    @media (prefers-reduced-motion:reduce){.asq-hopper,.asq-fill,.asq-lt i,.asq-trk i{transition:none}.asq-hopper.hop .fb-mark{animation:none}}
  `);
})();
