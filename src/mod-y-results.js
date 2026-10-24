/* Self-assessment results: SML.pages.results.
   Renders the assessment result shape from SPEC-account.md. Shows, in order of preference: the unsaved
   draft the quiz just produced, the saved assessment picked in the history picker (newest by default),
   or a clearly labelled built-in sample when there is nothing yet, so the page is never empty.
   Charts are drawn 1:1 with SML.svg inside SML.ui.responsive. Saving goes through
   SML.account.assessments.add; "Set a goal from this" writes a FIRE goal with SML.account.save. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const TITLE = 'Your investor profile';
  const ico = (k) => (SML.icons && SML.icons[k]) || '';

  /* ---------------- small helpers ---------------- */
  const num = (v, d) => { const x = typeof v === 'string' ? parseFloat(v) : v; return typeof x === 'number' && isFinite(x) ? x : (d === undefined ? 0 : d); };
  const sc = (v) => SML.clamp(Math.round(num(v, 0)), 0, 100);
  const usd = (v) => F.usd(Math.round(num(v, 0)), 0);
  const kusd = (v) => {
    v = num(v, 0); const a = Math.abs(v), s = v < 0 ? F.minus : '';
    if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
    if (a >= 1e4) return s + '$' + Math.round(a / 1e3) + 'k';
    if (a >= 1e3) return s + '$' + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return s + '$' + Math.round(a);
  };
  const sgn = (d) => (d > 0 ? '+' : d < 0 ? F.minus : '±') + Math.abs(Math.round(d));
  const dateOf = (r) => { const d = r && r.date ? String(r.date).slice(0, 10) : ''; return d && SML.fmtDate ? SML.fmtDate(d) : d; };
  const yearNow = () => new Date().getFullYear();
  const safeHref = (h) => { h = String(h || ''); return /^#[\w-]*$/.test(h) || /^https:\/\//.test(h) ? h : '#learn'; };
  const lessonById = (id) => (SML.lessons || []).find((l) => l.id === id);
  const toolById = (id) => (SML.tools || []).find((t) => t.id === id);
  const courseById = (id) => (SML.courses || []).find((c) => c.id === id);
  const I = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

  /* ---------------- vocabulary ---------------- */
  const STYLE_ICON = {
    passive: I('<path d="M3 17l5-5 4 3 8-8"/><path d="M15 7h5v5"/>'),
    value: I('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>'),
    swing: I('<path d="M2 14c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/><path d="M2 19c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/>'),
    day: I('<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/>'),
    wheel: I('<path d="M12 21v-9"/><path d="M12 12c0-4-3-7-8-7 0 4 3 7 8 7z"/><path d="M12 14.5c0-3.5 2.5-6.5 7.5-6.5 0 3.5-2.5 6.5-7.5 6.5z"/>'),
    fire: I('<path d="M12 2.5c1 3.2 5.5 5.2 5.5 10.5a5.5 5.5 0 0 1-11 0c0-3 2-4.5 2.2-6.8 1.5 1 2.6 2.6 3 4.3.6-3-.8-5.2.3-8z"/>'),
    crypto: I('<circle cx="12" cy="12" r="8.5"/><path d="M9.5 8h3.7a2 2 0 0 1 0 4H9.5h4.2a2 2 0 0 1 0 4H9.5zM11 6.5V8M11 16v1.5"/>'),
  };
  const STYLE = {
    passive: { name: 'Passive index', short: 'Index', bunny: 'Steady Bunny', blurb: 'Broad index funds, automatic monthly buys and the patience to leave them alone.', lesson: 'l-index-funds' },
    value: { name: 'Value investing', short: 'Value', bunny: 'Detective Bunny', blurb: 'Study businesses, buy good ones for less than they are worth and hold for years.', lesson: 'l-value' },
    swing: { name: 'Swing trading', short: 'Swing', bunny: 'Surfer Bunny', blurb: 'Ride moves that last days to weeks, with clear levels and a stop on every trade.', lesson: 'l-styles' },
    day: { name: 'Day trading', short: 'Day', bunny: 'Sprinter Bunny', blurb: 'In and out the same day. Fast and demanding. It needs strict rules and real screen time.', lesson: 'l-pdt' },
    wheel: { name: 'Options wheel', short: 'Wheel', bunny: 'Farmer Bunny', blurb: 'Sell puts and covered calls on stocks you would be happy to own, and collect the premium.', lesson: 'l-wheel' },
    fire: { name: 'FIRE planning', short: 'FIRE', bunny: 'Freedom Bunny', blurb: 'Save hard, invest simply and buy your time back years early.', lesson: 'l-fire-intro' },
    crypto: { name: 'Crypto slice', short: 'Crypto', bunny: 'Capped side bet', blurb: 'A small, capped slice of a very jumpy asset. Fine as a side bet, never as the plan.', lesson: 'l-crypto-risks' },
  };
  const STYLE_KEYS = Object.keys(STYLE);
  const ARCH = {
    steady: { name: 'Steady Bunny', role: 'Passive index builder', style: 'passive' },
    detective: { name: 'Detective Bunny', role: 'Value investor', style: 'value' },
    surfer: { name: 'Surfer Bunny', role: 'Swing trader', style: 'swing' },
    sprinter: { name: 'Sprinter Bunny', role: 'Day trader', style: 'day' },
    farmer: { name: 'Farmer Bunny', role: 'Options income farmer', style: 'wheel' },
    freedom: { name: 'Freedom Bunny', role: 'FIRE planner', style: 'fire' },
  };
  /* radar order puts the short labels on the left and right spokes */
  const TRAIT_KEYS = ['patience', 'discipline', 'analytical', 'handsOn', 'riskAppetite', 'emotionalControl', 'knowledge', 'timeAvailable'];
  const TRAIT = {
    patience: { name: 'Patience', short: 'Patience', means: 'Holding through slow or rough stretches without itching to act.' },
    discipline: { name: 'Discipline', short: 'Discipline', means: 'Following your own rules, even when it is boring.' },
    analytical: { name: 'Analytical', short: 'Analytical', means: 'Enjoying numbers, reports and digging into details.' },
    handsOn: { name: 'Hands-on', short: 'Hands-on', means: 'Wanting to make the calls yourself rather than automate.' },
    riskAppetite: { name: 'Risk appetite', short: 'Risk appetite', means: 'How much swing you are happy to live with.' },
    emotionalControl: { name: 'Calm under stress', short: 'Calm', means: 'Staying level-headed when money moves fast.' },
    knowledge: { name: 'Knowledge', short: 'Knowledge', means: 'How much you already know about markets.' },
    timeAvailable: { name: 'Time available', short: 'Time', means: 'Hours you can really give to markets each week.' },
  };
  const ZONES = {
    growth: { name: 'Built for growth', sub: 'able and willing', fill: 'f-up-t', text: 'Your money can take swings and so can your nerves. You can lean into stocks, as long as your rules stay in charge.' },
    room: { name: 'Room to grow', sub: 'able, not keen', fill: 'f-acc-t', text: 'Your money could handle more risk than you are comfortable with. That is fine. Learning how markets recover often makes the swings easier to sit through.' },
    careful: { name: 'Careful', sub: 'keen, thin cushion', fill: 'f-dn-t', text: 'You are keen for risk but your cushion is thin. Build the emergency fund and clear costly debt first, then take bigger swings with a small slice.' },
    safe: { name: 'Play it safe', sub: 'protect first', fill: 'f-info-t', text: 'Protect what you have and build the base first: an emergency fund, steady saving and broad funds. Risk can come later, a little at a time.' },
  };
  const zoneOf = (cap, will) => (cap >= 50 ? (will >= 50 ? 'growth' : 'room') : (will >= 50 ? 'careful' : 'safe'));

  /* ---------------- built-in sample (only when there is no draft and nothing saved) ---------------- */
  /* Fixed answers for the sample. At render time they go through SML.assess.score(), so the sample always obeys
     the current scoring rules. SAMPLE_FALLBACK is only used when the quiz module is not loaded. */
  const SAMPLE_FALLBACK = /*FALLBACK*/{"v":1,"id":"a-sample","date":"2026-10-21T12:00:00Z","answers":{},"inputs":{"age":32,"retireAge":55,"horizon":23,"household":"couple","dependents":1,"incomeYear":118000,"savingsMonth":1800,"spendMonth":5200,"netWorth":150000,"investable":86000,"cash":21000,"homeEquity":48000,"debtHigh":3200,"debtOther":9800,"emergencyMonths":4,"hoursWeek":4,"experienceYears":3,"otherIncomeMonth":0},"scores":{"riskCapacity":45,"riskWillingness":57,"risk":49,"traits":{"patience":91,"discipline":97,"riskAppetite":57,"analytical":65,"handsOn":25,"emotionalControl":87,"knowledge":36,"timeAvailable":14},"styles":{"passive":87,"value":80,"swing":45,"day":40,"wheel":61,"fire":84,"crypto":38}},"profile":{"key":"balanced","label":"Balanced","allocation":{"stocks":60,"bonds":35,"cash":5},"core":95,"satellite":5,"cryptoCap":2,"riskPerTrade":1},"archetype":{"key":"steady","name":"Steady Bunny","tagline":"Buy the whole market, keep hopping, let time do the heavy lifting.","description":"You like simple, cheap and automatic. Your edge is not touching it: low-cost index funds, money going in every month, a rebalance once a year. Boring is the point, and boring has quietly beaten most professionals over long stretches.","style":"passive","runnerUp":"freedom"},"goals":{"primary":"early","list":["early","house","debt"],"fireNumber":1500000,"yearsToGoal":26.8,"targetAge":55,"onTrack":false,"monthlyNeeded":2431,"gap":320623,"rate":5,"emergencyTargetMonths":6,"retired":false,"withdrawalRate":null,"otherIncomeCounted":false},"insights":{"strengths":["Disciplined. You follow your own rules, even when it stings.","Patient. You can sit through boring stretches, which is where most long-term returns come from.","Calm under pressure. A drop does not push you into panic moves.","Strong saver. You keep about 26% of what comes in.","Long runway. 23 years until your target age gives compounding room to work."],"watchouts":["Card or personal debt of $3,200. Cards often charge 20% or more, and at rates like that paying it off beats the stock market's long-run average.","Thin cushion: cash covers about 4 months of spending. Aim for 6 (with a family, dependents or income that can swing, more cushion helps) before taking market risk."],"actions":[{"title":"Pay off high-interest debt first","detail":"You owe $3,200 on cards or personal loans. Cards often charge 20% or more; at rates like that, paying them down beats the stock market's long-run average. Highest rate first.","href":"#tool-payoff"},{"title":"Build an emergency fund","detail":"Aim for 6 months of spending, about $31,200, $10,200 more than today, parked somewhere safe that pays interest.","href":"#tool-cash"},{"title":"Grab the full 401(k) match","detail":"If your employer matches, contribute at least enough to get all of it. It is part of your pay.","href":"#tool-match"},{"title":"Use a Roth IRA if you qualify","detail":"Tax-free growth for decades. You need earned income, and 2026 limits apply: full contribution under $153k single or $242k married filing jointly, phasing out by $168k / $252k.","href":"#l-ira"},{"title":"Set your core: about 60% stocks, 35% bonds, 5% cash","detail":"Low-cost index funds for the 95% core. A balanced mix for your answers. Educational rule of thumb, not personal advice.","href":"#l-allocation"},{"title":"Automate it","detail":"Set a monthly transfer into your index funds and check in once a year.","href":"#tool-compound"},{"title":"Cap active money at 5% of investable","detail":"About $4,300 today. The rest stays in the core, whatever happens with trades.","href":"#l-blend"}],"lessons":["l-card-debt","l-emergency","l-etfs","l-index-funds","l-compound","l-allocation","l-401k-match","l-ira","l-trad-vs-roth","l-drawdowns","l-fire-intro","l-fire-number"],"tools":["tool-payoff","tool-cash","tool-compound","tool-match","tool-roth","tool-retire"]}}/*END*/;
  const SAMPLE_ANSWERS = {
    age: 32, household: 'couple', dependents: 1, income: 118000, job: 'stable',
    cash: 21000, retirement: 72000, brokerage: 14000, homeEquity: 48000, crypto: 0, otherAssets: 8000,
    debtHigh: 3200, debtOther: 9800, saveMonth: 1800, spendMonth: 5200,
    retireAge: 55, goals: ['early', 'house', 'debt'], retireSpend: 5000, otherIncome: 0,
    hours: 4, activeness: 30, marketHours: 'no', lens: 'business', holding: 'years', options: 'curious', cryptoInt: 'curious',
    drop: 'hold', drawdown: 25, gamble: 'half', portfolio: 'c', leverage: 'never', sleep: 'check',
    fomo: 'research', rules: 'sell', patience: 'hold', streak: 'pause', research: 'ok', speed: 'checklist',
    kStocks: 2, kOptions: 1, kCharts: 1, kStatements: 2, kTaxes: 1, kRetire: 2, years: 3,
  };
  function SAMPLE() {
    const date = new Date().toISOString();
    try {
      if (SML.assess && typeof SML.assess.score === 'function') {
        const r = SML.assess.score(Object.assign({}, SAMPLE_ANSWERS), { id: 'a-sample', date });
        if (valid(r)) return Object.assign(r, { id: 'a-sample', date, sample: true });
      }
    } catch (e) { /* use the fallback */ }
    return Object.assign(JSON.parse(JSON.stringify(SAMPLE_FALLBACK)), { date, sample: true });
  }

  /* ---------------- module state ---------------- */
  let selId = null;        // id picked in the history picker ('draft' for the unsaved one)
  let lastDraftId = null;  // a new draft resets the picker
  let justSaved = null;    // id saved during this visit (shows the "saved" card)
  let goalDone = null;     // id whose goal was set during this visit
  const valid = (r) => !!(r && typeof r === 'object' && r.scores && r.archetype);
  const readDraft = () => { const d = SML.assessDraft || SML.store.get('assessDraft', null); return valid(d) ? d : null; };
  const acct = () => SML.account || null;
  const status = () => (acct() ? acct().status : { ready: true, mode: 'local', signedIn: false });

  /* ---------------- styles ---------------- */
  SML.css(`
    .yr-top{padding-top:40px}
    .yr-sample{display:flex;align-items:center;flex-wrap:wrap;gap:12px 16px;padding:14px 16px;margin-bottom:20px;border:1px dashed color-mix(in srgb,var(--gold) 55%,var(--line));border-radius:var(--r);background:color-mix(in srgb,var(--gold) 7%,var(--surface))}
    .yr-sample b{font:600 12px/1.4 var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--gold);flex:1 1 220px}
    .yr-hero{display:grid;gap:20px;grid-template-columns:1fr}
    @media (min-width:1024px){.yr-hero{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:start}}
    .yr-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:20px;min-width:0;display:flex;flex-direction:column;gap:16px}
    @media (min-width:768px){.yr-card{padding:24px}}
    .yr-k{font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.18em;color:var(--muted)}
    .yr-h3{font-family:var(--display);font-weight:400;font-size:clamp(30px,3.4vw,40px);line-height:.92;text-transform:uppercase;color:var(--ink);text-wrap:balance}
    .yr-p{font-size:15px;line-height:1.6;color:color-mix(in srgb,var(--ink) 78%,transparent);text-wrap:pretty}
    .yr-btns{display:flex;flex-wrap:wrap;gap:10px}
    .yr-fig{position:relative;min-width:0;width:100%}
    .yr-fig svg{display:block;margin:0 auto;max-width:100%;height:auto;overflow:visible}
    svg .yr-fl{fill:var(--flame)} svg .yr-gd{fill:var(--gold)} svg .yr-sfl{stroke:var(--flame)} svg text.yr-tfl{fill:var(--flame)}
    .yr-split{display:grid;gap:20px;grid-template-columns:1fr}
    @media (min-width:1024px){.yr-split{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)}.yr-split.even{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
    /* identity card */
    .yr-id{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;display:grid;grid-template-columns:1fr;min-width:0}
    @media (min-width:640px){.yr-id{grid-template-columns:minmax(0,5fr) minmax(0,7fr)}}
    .yr-art{position:relative;background:var(--bg);min-height:220px;overflow:hidden}
    .yr-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:50% 40%;padding:6% 6% 18%;box-sizing:border-box;border-radius:0}
    .yr-art::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,color-mix(in srgb,var(--surface) 92%,transparent) 0%,transparent 42%);pointer-events:none}
    .yr-badge{position:absolute;left:16px;bottom:14px;z-index:1;display:flex;align-items:center;gap:10px}
    .yr-badge span{width:44px;height:44px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--flame);background:color-mix(in srgb,var(--bg) 80%,transparent);border:1px solid color-mix(in srgb,var(--flame) 55%,transparent);box-shadow:0 0 18px color-mix(in srgb,var(--flame) 40%,transparent)}
    .yr-badge svg{width:22px;height:22px}
    .yr-badge b{font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--ink)}
    .yr-idb{padding:22px 20px;display:flex;flex-direction:column;gap:12px;justify-content:center;min-width:0}
    @media (min-width:768px){.yr-idb{padding:30px 28px}}
    .yr-name{font-family:var(--display);font-weight:400;font-size:clamp(50px,6.2vw,84px);line-height:.86;text-transform:uppercase;color:var(--ink);letter-spacing:.01em;overflow-wrap:anywhere}
    .yr-name em{font-style:normal;color:var(--gold);text-shadow:0 0 22px color-mix(in srgb,var(--flame) 45%,transparent)}
    .yr-role{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:14px;color:var(--muted)}
    .yr-tagline{font-size:20px;line-height:1.4;color:var(--ink);text-wrap:balance}
    .yr-desc{font-size:15px;line-height:1.65;color:color-mix(in srgb,var(--ink) 72%,transparent);text-wrap:pretty}
    .yr-kpis{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--line)}
    @media (min-width:640px){.yr-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}}
    .yr-kpis .stat-v small{font-family:var(--mono);font-size:12px;color:var(--muted);margin-left:3px;letter-spacing:0}
    .yr-kpis .stat-v{font-size:28px}
    .yr-kpis .stat-v.fl{color:var(--flame)}
    /* save card */
    .yr-save{border-color:color-mix(in srgb,var(--flame) 45%,var(--line));background:radial-gradient(130% 90% at 100% 0%,color-mix(in srgb,var(--flame) 15%,transparent),transparent 62%),var(--surface);box-shadow:0 22px 60px -30px color-mix(in srgb,var(--flame) 60%,transparent)}
    .yr-save.done{border-color:color-mix(in srgb,var(--up) 45%,var(--line));background:radial-gradient(130% 90% at 100% 0%,color-mix(in srgb,var(--up) 12%,transparent),transparent 62%),var(--surface);box-shadow:none}
    .yr-save.quiet{border-color:var(--line);background:var(--surface);box-shadow:none}
    .yr-save-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .pill.yr-fl{color:var(--flame);border-color:color-mix(in srgb,var(--flame) 45%,transparent);background:color-mix(in srgb,var(--flame) 10%,transparent)}
    .btn.yr-go{background:var(--flame);color:var(--on-acc);min-height:50px;font-size:15px;box-shadow:0 10px 30px -12px color-mix(in srgb,var(--flame) 80%,transparent)}
    .btn.yr-go:hover{filter:brightness(1.08)}
    .yr-save .btn.yr-go{width:100%}
    .yr-where{list-style:none;display:flex;flex-direction:column;gap:12px;margin:0;padding:0}
    .yr-where li{display:flex;gap:12px;align-items:flex-start;font-size:14px;line-height:1.55;color:color-mix(in srgb,var(--ink) 78%,transparent)}
    .yr-where li > span:first-child{flex:0 0 34px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:var(--bg);display:inline-flex;align-items:center;justify-content:center;color:var(--gold)}
    .yr-where svg{width:17px;height:17px}
    .yr-where b{color:var(--ink);font-weight:600;display:block}
    .yr-goalbox{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
    .yr-goalbox .stat{padding:12px}
    .yr-goalbox .stat-v{font-size:24px}
    .yr-pick select{font-size:14px}
    .yr-note a,.yr-p a{color:var(--ink);text-decoration-color:var(--accent);text-underline-offset:3px}
    /* blend */
    .yr-bars{gap:0;padding-top:8px;padding-bottom:8px}
    .yr-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto;grid-template-areas:"ic lb v" "tr tr tr";align-items:center;gap:8px 12px;padding:12px 0;border-bottom:1px solid var(--line)}
    .yr-row:last-child{border-bottom:0}
    @media (min-width:640px){.yr-row{grid-template-columns:34px minmax(150px,200px) minmax(0,1fr) 46px;grid-template-areas:"ic lb tr v"}}
    .yr-ic{grid-area:ic;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);display:inline-flex;align-items:center;justify-content:center;color:var(--muted);background:var(--bg)}
    .yr-ic svg{width:17px;height:17px}
    .yr-rl{grid-area:lb;display:flex;flex-direction:column;gap:2px;min-width:0}
    .yr-rl b{font-size:15px;font-weight:600;color:var(--ink);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .yr-rl small{font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
    .yr-track{grid-area:tr;height:10px;border-radius:5px;background:var(--line);overflow:hidden}
    .yr-track i{display:block;height:100%;width:var(--w,0%);border-radius:5px;background:color-mix(in srgb,var(--muted) 50%,transparent);transform-origin:left center;animation:yr-grow .9s cubic-bezier(.2,.7,.2,1) both}
    .yr-rv{grid-area:v;font:400 28px/1 var(--display);color:var(--muted);text-align:right;font-variant-numeric:tabular-nums}
    .yr-row.t1 .yr-ic{color:var(--flame);border-color:color-mix(in srgb,var(--flame) 55%,var(--line))}
    .yr-row.t2 .yr-ic{color:var(--gold);border-color:color-mix(in srgb,var(--gold) 55%,var(--line))}
    .yr-row.t1 .yr-track i{background:var(--flame);box-shadow:0 0 14px color-mix(in srgb,var(--flame) 55%,transparent)}
    .yr-row.t2 .yr-track i{background:var(--gold)}
    .yr-row.t1 .yr-rv{color:var(--flame)} .yr-row.t2 .yr-rv{color:var(--gold)}
    .yr-row .tag.t1{color:var(--flame)} .yr-row .tag.t2{color:var(--gold)}
    @keyframes yr-grow{from{transform:scaleX(0)}}
    @media (prefers-reduced-motion:reduce){.yr-track i{animation:none}}
    .yr-mix-top{display:grid;gap:12px}
    .yr-mini{display:flex;gap:12px;align-items:flex-start;padding:14px;border:1px solid var(--line);border-radius:var(--r);background:var(--bg)}
    .yr-mini .yr-ic{flex:0 0 34px}
    .yr-mini.t1 .yr-ic{color:var(--flame);border-color:color-mix(in srgb,var(--flame) 55%,var(--line))}
    .yr-mini.t2 .yr-ic{color:var(--gold);border-color:color-mix(in srgb,var(--gold) 55%,var(--line))}
    .yr-mini b{display:block;color:var(--ink);font-size:15px;margin-bottom:2px}
    .yr-mini p{font-size:14px;line-height:1.55;color:color-mix(in srgb,var(--ink) 72%,transparent)}
    .yr-mini a{font-size:13px}
    /* traits list */
    .yr-tl{list-style:none;display:flex;flex-direction:column;gap:12px;margin:0;padding:0}
    .yr-tl li{display:grid;grid-template-columns:minmax(0,1fr) 34px;gap:4px 12px;align-items:center}
    .yr-tl span{font-size:14px;color:var(--ink)}
    .yr-tl b{font:500 14px var(--mono);color:var(--ink);text-align:right}
    .yr-tl .prog{grid-column:1/-1;height:4px}
    .yr-tl li.hi .prog i{background:var(--accent)}
    .yr-tl li:not(.hi) .prog i{background:color-mix(in srgb,var(--muted) 55%,transparent)}
    .yr-tl li.lo .prog i{background:var(--info)}
    /* stat rows */
    .yr-stats{display:flex;flex-wrap:wrap;border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
    .yr-stats > .stat{flex:1 1 120px}
    .yr-stats .stat-v{font-size:26px}
    .yr-stats .stat-v small{font-family:var(--mono);font-size:12px;color:var(--muted);margin-left:3px}
    .yr-stats .note{font-size:12px;line-height:1.4}
    /* donut + legend */
    .yr-dn{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:20px 28px}
    .yr-dn > svg{flex:0 0 auto}
    .yr-leg{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;flex:1 1 200px;min-width:0}
    .yr-leg li{display:grid;grid-template-columns:12px minmax(0,1fr) auto;gap:4px 10px;align-items:center;font-size:14px;color:var(--ink)}
    .yr-leg i{width:12px;height:12px;border-radius:3px;display:block}
    .yr-leg b{font:500 14px var(--mono);text-align:right}
    .yr-leg small{grid-column:2/-1;font-size:12px;color:var(--muted);line-height:1.4}
    .yr-leg li.neg{color:var(--down)}
    .yr-leg li.tot{border-top:1px solid var(--line);padding-top:10px;font-weight:600}
    .sw-info{background:var(--info)} .sw-vio{background:var(--violet)} .sw-acc{background:var(--accent)} .sw-mut{background:var(--muted)} .sw-dn{background:var(--down)} .sw-up{background:var(--up)} .sw-fl{background:var(--flame)}
    .yr-cs{display:flex;height:16px;border-radius:5px;overflow:hidden;gap:2px;background:var(--surface)}
    .yr-cs i{display:block;height:100%}
    .yr-cs-l{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:var(--muted)}
    .yr-cs-l b{color:var(--ink);font-weight:600}
    /* emergency meter */
    .yr-meter{position:relative;padding-top:30px}
    .yr-meter-z{display:flex;height:12px;border-radius:6px;overflow:hidden;gap:2px}
    .yr-meter-z i{display:block;height:100%}
    .yr-meter-z i.z-dn{background:color-mix(in srgb,var(--down) 55%,var(--surface))}
    .yr-meter-z i.z-acc{background:color-mix(in srgb,var(--accent) 55%,var(--surface))}
    .yr-meter-z i.z-up{background:color-mix(in srgb,var(--up) 55%,var(--surface))}
    .yr-meter-t span.tg{color:var(--ink)}
    .yr-bands{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:8px}
    .yr-bands li{display:flex;flex-direction:column;gap:4px;padding:8px 10px;border:1px solid var(--line);border-radius:var(--r);min-width:0}
    .yr-bands i{display:block;height:4px;border-radius:2px;background:var(--flame)}
    .yr-bands b{font-size:13px;font-weight:600;color:var(--muted)}
    .yr-bands small{font:500 11px var(--mono);color:var(--muted)}
    .yr-bands li.on{border-color:color-mix(in srgb,var(--flame) 55%,var(--line));background:color-mix(in srgb,var(--flame) 8%,transparent)}
    .yr-bands li.on b{color:var(--ink)}
    .yr-inc{line-height:1.55}
    .yr-inc b{color:var(--ink);font-weight:600}
    .yr-meter-m{position:absolute;top:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px;font:600 12px/1 var(--mono);color:var(--ink);white-space:nowrap}
    .yr-meter-m::after{content:"";width:2px;height:22px;background:var(--ink);border-radius:1px}
    .yr-meter-t{position:relative;height:14px;font:500 11px/14px var(--mono);color:var(--muted);margin-top:6px}
    .yr-meter-t span{position:absolute;top:0;white-space:nowrap} .yr-meter-t span.c{transform:translateX(-50%)}
    /* goal */
    .yr-legend{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px;color:var(--muted)}
    .yr-legend span{display:inline-flex;align-items:center;gap:8px}
    .yr-legend i{width:16px;height:3px;border-radius:2px;display:block}
    .yr-legend i.dash{height:0;border-top:2px dashed var(--flame);background:none}
    .yr-gp{display:flex;flex-direction:column;gap:8px}
    .yr-gp-l{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:14px;color:var(--muted)}
    .yr-gp-l b{color:var(--ink)}
    .yr-gp .prog{height:10px;border-radius:5px}
    .yr-gp .prog i{background:linear-gradient(90deg,var(--gold),var(--flame));border-radius:5px}
    /* change */
    .yr-dv{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
    .yr-dv li{display:grid;grid-template-columns:minmax(92px,150px) minmax(0,1fr) 44px;gap:12px;align-items:center;font-size:14px;color:var(--ink)}
    .yr-dv-t{position:relative;height:12px;background:var(--bg);border-radius:3px}
    .yr-dv-t::before{content:"";position:absolute;left:50%;top:-3px;bottom:-3px;width:1px;background:var(--input)}
    .yr-dv-t i{position:absolute;top:0;bottom:0;border-radius:3px}
    .yr-dv-t i.p{left:50%;background:var(--info)} .yr-dv-t i.n{right:50%;background:var(--accent)}
    .yr-dv b{font:500 13px var(--mono);text-align:right}
    .yr-dv b.p{color:var(--info)} .yr-dv b.n{color:var(--accent)} .yr-dv b.z{color:var(--muted)}
    .yr-was{font-size:12px;color:var(--muted)}
    .yr-chg{font-family:var(--mono);font-size:13px;margin-left:6px}
    .yr-chg.p{color:var(--info)} .yr-chg.n{color:var(--accent)} .yr-chg.z{color:var(--muted)}
    /* learning path */
    .yr-path{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
    .yr-path li + li{border-top:1px solid var(--line)}
    .yr-path a{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 16px;text-decoration:none;color:inherit;background:var(--surface);transition:background-color .15s}
    .yr-path a:hover{background:var(--surface-2)}
    .yr-pn{font:400 30px/1 var(--display);color:var(--muted);text-align:center}
    .yr-pt{display:flex;flex-direction:column;gap:3px;min-width:0}
    .yr-pt b{font-size:16px;font-weight:600;color:var(--ink);line-height:1.3}
    .yr-pt small{font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
    .yr-ps{display:flex;align-items:center;gap:8px;color:var(--muted)}
    @media (max-width:520px){.yr-ps .pill{display:none}.yr-path a{grid-template-columns:36px minmax(0,1fr) auto;gap:12px;padding:14px}}
    .yr-path li.done .yr-pn{color:var(--up)}
    .yr-path li.done .yr-pn svg{width:22px;height:22px}
    .yr-path li.next a{box-shadow:inset 3px 0 0 var(--accent)}
    .yr-pathhead{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 20px;margin-bottom:16px}
    .yr-pathhead .prog{max-width:280px;flex:1 1 160px;height:6px;border-radius:3px}
    .yr-pathhead .prog i{background:var(--up)}
    /* actions */
    .yr-act .tile-n{font-size:40px}
    .yr-act .tile span.more{margin-top:auto}
    .yr-loading{display:flex;align-items:center;gap:14px;padding:40px 0;color:var(--muted);font-size:16px}
    .yr-disc{margin-top:14px}
    .yr-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
    .yr-foot .yr-save{flex:1 1 100%}
  `);

  /* ---------------- svg pieces ---------------- */
  /* ring segment, angles in radians, 0 = 12 o'clock, clockwise */
  function arc(cx, cy, r0, r1, a0, a1) {
    const P = (r, a) => (cx + r * Math.sin(a)).toFixed(1) + ' ' + (cy - r * Math.cos(a)).toFixed(1);
    const big = a1 - a0 > Math.PI ? 1 : 0;
    return `M${P(r1, a0)}A${r1} ${r1} 0 ${big} 1 ${P(r1, a1)}L${P(r0, a1)}A${r0} ${r0} 0 ${big} 0 ${P(r0, a0)}Z`;
  }
  const seg = (d, cls, style, title) => `<path d="${d}" class="${cls || ''}"${style ? ` style="${style}"` : ''}>${title ? `<title>${esc(title)}</title>` : ''}</path>`;

  function donut(D, segs, small, big, label) {
    const cx = D / 2, cy = D / 2, r1 = D / 2 - 2, r0 = r1 - Math.max(20, Math.round(D * 0.14));
    const tot = segs.reduce((s, x) => s + Math.max(0, num(x.v)), 0);
    let b = S.circle(cx, cy, ((r0 + r1) / 2).toFixed(1), 'nf s-line', ` style="stroke-width:${r1 - r0}px;opacity:.35"`);
    const live = segs.filter((x) => num(x.v) > 0);
    if (tot > 0) {
      const gap = live.length > 1 ? 3 / r1 : 0; let a = 0;
      live.forEach((x) => {
        const span = (num(x.v) / tot) * Math.PI * 2, a0 = a + gap / 2, a1 = a + span - gap / 2;
        const t = `${x.name}: ${x.text || Math.round((num(x.v) / tot) * 100) + '%'}`;
        if (span >= Math.PI * 2 - 1e-6) b += seg(arc(cx, cy, r0, r1, 0, Math.PI), x.cls, x.style, t) + seg(arc(cx, cy, r0, r1, Math.PI, Math.PI * 2 - 1e-4), x.cls, x.style, t);
        else if (a1 > a0) b += seg(arc(cx, cy, r0, r1, a0, a1), x.cls, x.style, t);
        a += span;
      });
    }
    b += S.text(cx, cy - 12, esc(small), 'cap', 'middle');
    b += S.text(cx, cy + 20, esc(big), 'disp ink', 'middle', ` style="font-size:${Math.round(D * 0.15)}px"`);
    return S.wrap(D, D, label, b);
  }

  function radarSVG(W, traits) {
    const padX = W < 420 ? 72 : 82, R = Math.max(60, Math.min((W - padX * 2) / 2, 175));
    const H = Math.round(R * 2 + 96), cx = W / 2, cy = H / 2 + 2;
    const n = TRAIT_KEYS.length, ang = (i) => (i / n) * Math.PI * 2;
    const pt = (i, v) => [cx + (R * v / 100) * Math.sin(ang(i)), cy - (R * v / 100) * Math.cos(ang(i))];
    const vals = TRAIT_KEYS.map((k) => sc(traits[k]));
    const max = Math.max(...vals), min = Math.min(...vals);
    let b = '';
    [25, 50, 75, 100].forEach((v) => { b += S.polygon(TRAIT_KEYS.map((k, i) => pt(i, v)), 'nf s-line' + (v === 100 ? '' : ' o50')); });
    TRAIT_KEYS.forEach((k, i) => { const p = pt(i, 100); b += S.line(cx, cy, p[0], p[1], 's-line o50'); });
    b += S.text(cx + 5, cy - R * 0.5 - 3, '50', 'xs mono mut') + S.text(cx + 5, cy - R - 3, '100', 'xs mono mut');
    const shape = TRAIT_KEYS.map((k, i) => pt(i, Math.max(4, vals[i])));
    b += S.polygon(shape, 'f-acc s-acc w2', ' style="fill-opacity:.16;stroke-linejoin:round"');
    shape.forEach((p, i) => { b += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" class="f-acc s-surf w2"><title>${esc(TRAIT[TRAIT_KEYS[i]].name)}: ${vals[i]}</title></circle>`; });
    TRAIT_KEYS.forEach((k, i) => {
      const a = ang(i), s = Math.sin(a), c = Math.cos(a);
      const lx = cx + (R + 12) * s, ly = cy - (R + 12) * c;
      const anchor = Math.abs(s) < 0.2 ? 'middle' : s > 0 ? 'start' : 'end';
      let y1, y2;
      if (c > 0.9) { y1 = ly - 19; y2 = ly - 4; } else if (c < -0.9) { y1 = ly + 13; y2 = ly + 28; } else { const dy = -c * 6; y1 = ly - 3 + dy; y2 = ly + 12 + dy; }
      const hi = vals[i] === max, lo = vals[i] === min && min !== max;
      b += S.text(lx, y1, esc(TRAIT[k].short), 'sm ' + (hi ? 'acc b' : lo ? 'info' : 'mut'), anchor);
      b += S.text(lx, y2, String(vals[i]), 'md b mono ' + (hi ? 'acc' : lo ? 'info' : 'ink'), anchor);
    });
    return S.wrap(W, H, 'Radar of your eight traits: ' + TRAIT_KEYS.map((k, i) => TRAIT[k].name + ' ' + vals[i]).join(', '), b);
  }

  function mapSVG(W, cap, will) {
    const H = Math.round(Math.max(250, Math.min(W * 0.78, 380)));
    const L = 34, Rr = 8, T = 8, B = 42, pw = W - L - Rr, ph = H - T - B;
    const x = (v) => L + (pw * v) / 100, y = (v) => T + ph * (1 - v / 100);
    const z = zoneOf(cap, will);
    const quad = [['careful', 0, 50, 50, 100], ['growth', 50, 100, 50, 100], ['safe', 0, 50, 0, 50], ['room', 50, 100, 0, 50]];
    let b = '';
    quad.forEach(([k, x0, x1, y0, y1]) => {
      b += `<rect x="${x(x0).toFixed(1)}" y="${y(y1).toFixed(1)}" width="${(x(x1) - x(x0)).toFixed(1)}" height="${(y(y0) - y(y1)).toFixed(1)}" class="${ZONES[k].fill}${k === z ? '' : ' o50'}"><title>${esc(ZONES[k].name)}</title></rect>`;
    });
    b += S.rect(x(0), y(100), pw, ph, 'nf s-line');
    b += S.line(x(50), y(0), x(50), y(100), 's-line dash') + S.line(x(0), y(50), x(100), y(50), 's-line dash');
    const px = x(cap), py = y(will);
    const lab = (k, xx, yy, anchor) => {
      const x0 = anchor === 'end' ? xx - 112 : xx, x1 = anchor === 'end' ? xx : xx + 112;
      if (px + 16 > x0 && px - 16 < x1 && py + 16 > yy - 12 && py - 16 < yy + 18) return '';
      return S.text(xx, yy, esc(ZONES[k].name), 'sm b ' + (k === z ? 'ink' : 'mut'), anchor) + S.text(xx, yy + 14, esc(ZONES[k].sub), 'xs mut', anchor);
    };
    b += lab('careful', x(0) + 10, y(100) + 20, 'start') + lab('growth', x(100) - 10, y(100) + 20, 'end');
    b += lab('safe', x(0) + 10, y(0) - 24, 'start') + lab('room', x(100) - 10, y(0) - 24, 'end');
    [0, 50, 100].forEach((v) => {
      b += S.text(x(v), y(0) + 16, String(v), 'xs mono mut', v === 0 ? 'start' : v === 100 ? 'end' : 'middle');
      b += S.text(L - 6, y(v) + (v === 100 ? 9 : v === 0 ? 0 : 4), String(v), 'xs mono mut', 'end');
    });
    b += S.text(x(50), H - 4, 'Risk capacity: what your money can take', 'sm mut', 'middle');
    b += S.text(11, y(50), 'Willingness', 'sm mut', 'middle', ` transform="rotate(-90 11 ${y(50).toFixed(1)})"`);
    b += S.line(px, y(0), px, y(0) + 6, 's-acc w2') + S.line(x(0) - 6, py, x(0), py, 's-acc w2');
    b += S.circle(px, py, 15, 'nf s-acc w15 o50') + `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="7.5" class="f-acc s-surf w2"><title>You: capacity ${cap}, willingness ${will}</title></circle>`;
    const anc = cap > 84 ? 'end' : cap < 16 ? 'start' : 'middle', tx = anc === 'end' ? px + 10 : anc === 'start' ? px - 10 : px, ty = will > 70 ? py + 32 : py - 34;
    b += S.text(tx, ty, 'You', 'md b ink', anc) + S.text(tx, ty + 14, `${cap} / ${will}`, 'xs mono acc', anc);
    return S.wrap(W, H, `Risk map: capacity ${cap}, willingness ${will}, zone ${ZONES[z].name}`, b);
  }

  /* risk bands = the quiz profile thresholds (FIXES item 5) */
  const BANDS = [['conservative', 'Conservative', 0, 25], ['moderate', 'Moderate', 25, 42], ['balanced', 'Balanced', 42, 58], ['growth', 'Growth', 58, 75], ['aggressive', 'Aggressive', 75, 100]];
  const BAND_OP = [0.2, 0.34, 0.5, 0.68, 0.88];
  const bandIndex = (v) => { const i = BANDS.findIndex((b) => v < b[3]); return i < 0 ? 4 : i; };
  const bandRange = (b) => `${b[2]}–${b[3] === 100 ? 100 : b[3] - 1}`;
  function gaugeSVG(W, risk) {
    const R = Math.round(Math.max(88, Math.min(W / 2 - 34, 160))), th = Math.max(16, Math.round(R * 0.17));
    const H = R + 84, cx = W / 2, cy = R + 22;
    const on = bandIndex(risk), gap = 3 / R, ang = (v) => -Math.PI / 2 + (Math.PI * v) / 100;
    let b = '';
    BANDS.forEach((bd, i) => { b += seg(arc(cx, cy, R - th, R, ang(bd[2]) + gap / 2, ang(bd[3]) - gap / 2), 'yr-fl', `fill-opacity:${i === on ? 1 : BAND_OP[i]}`, `${bd[1]}: ${bandRange(bd)}`); });
    [25, 42, 58, 75].forEach((v) => {
      const a = ang(v), sn = Math.sin(a), c = Math.cos(a);
      b += S.line(cx + (R + 1) * sn, cy - (R + 1) * c, cx + (R + 6) * sn, cy - (R + 6) * c, 's-mut w1');
      b += S.text(cx + (R + 10) * sn, cy - (R + 10) * c + (c < 0.6 ? 4 : 0), String(v), 'xs mono mut', sn < -0.3 ? 'end' : sn > 0.3 ? 'start' : 'middle');
    });
    b += S.text(cx - R + th / 2, cy + 18, '0', 'xs mono mut', 'middle') + S.text(cx + R - th / 2, cy + 18, '100', 'xs mono mut', 'middle');
    const a = ang(risk), tip = R - th - 8;
    b += `<line x1="${cx}" y1="${cy}" x2="${(cx + tip * Math.sin(a)).toFixed(1)}" y2="${(cy - tip * Math.cos(a)).toFixed(1)}" class="s-ink w3" style="stroke-linecap:round"/>`;
    b += S.circle(cx, cy, 8, 'f-ink') + S.circle(cx, cy, 3, 'f-surf');
    b += S.text(cx, cy + 62, String(risk), 'disp ink', 'middle', ' style="font-size:52px"');
    return S.wrap(W, H, `Risk score gauge: ${risk} out of 100, in the ${BANDS[on][1]} band`, b);
  }

  /* Growth: goals.rate % a year after inflation (default 5), compounding monthly, today's dollars (FIXES item 1).
     Same monthly factor as the quiz: (1 + rate) ^ (1/12) - 1. */
  const rateOf = (r) => { const v = num((r.goals || {}).rate, 5); return v > 0 && v < 20 ? v : 5; };
  function fvM(P, m, rm, months) { if (Math.abs(rm) < 1e-12) return P + m * months; const g = Math.pow(1 + rm, months); return P * g + (m * (g - 1)) / rm; }
  function goalModel(r) {
    const inp = r.inputs || {}, g = r.goals || {};
    const age = Math.round(num(inp.age, 0)), target = num(g.fireNumber, 0);
    if (!age || !(target > 0)) return null;
    const ta = Math.round(num(g.targetAge, 0) || num(inp.retireAge, 0)) || age;
    const P = Math.max(0, num(inp.investable, 0)), save = Math.max(0, num(inp.savingsMonth, 0)), need = Math.max(0, num(g.monthlyNeeded, 0));
    const rate = rateOf(r), rm = Math.pow(1 + rate / 100, 1 / 12) - 1;
    const other = Math.max(0, num(inp.otherIncomeMonth, 0));
    const retired = g.retired === true || ta <= age;
    let wr = num(g.withdrawalRate, NaN);
    if (!isFinite(wr) && P > 0) wr = ((target / 25) / P) * 100;
    /* years until the pot reaches the number on current saving: the quiz's yearsToGoal (null = not within 60 years) */
    let ytg = g.yearsToGoal === null ? null : num(g.yearsToGoal, NaN);
    if (g.yearsToGoal !== null && !isFinite(ytg)) {
      ytg = null;
      if (P >= target) ytg = 0; else { let b = P; for (let mo = 1; mo <= 720; mo++) { b = b * (1 + rm) + save; if (b >= target) { ytg = Math.ceil(mo / 1.2) / 10; break; } } }
    }
    const reach = ytg == null ? null : age + ytg;
    const onTrack = typeof g.onTrack === 'boolean' ? g.onTrack : reach != null && reach <= ta;
    const m = { age, ta, target, P, save, need, rate, rm, other, retired, wr, ytg, reach, onTrack, gap: Math.max(0, num(g.gap, 0)) };
    if (retired) return m;
    let end = ta; if (reach != null && reach > ta && reach <= ta + 12) end = Math.ceil(reach);
    const years = Math.max(1, end - age), tYears = Math.max(1, ta - age);
    m.end = age + years; m.years = years; m.tYears = tYears; m.cur = []; m.nd = [];
    for (let k = 0; k <= years; k++) m.cur.push(fvM(P, save, rm, k * 12));
    for (let k = 0; k <= tYears; k++) m.nd.push(fvM(P, need, rm, k * 12));
    m.showNeed = ytg !== 0 && need > save * 1.02;
    return m;
  }

  function projSVG(W, m) {
    const small = W < 480;
    const H = Math.round(Math.max(240, Math.min(W * 0.5, 340)));
    const L = 50, Rr = small ? 10 : 18, T = 24, B = 30, pw = W - L - Rr, ph = H - T - B;
    const top = Math.max(m.target * 1.12, Math.max(...m.cur, ...(m.showNeed ? m.nd : [0])) * 1.06);
    const yt = SML.ticks(0, top, 4), ymax = Math.max(top, yt[yt.length - 1] || top);
    const x = (age) => L + (pw * (age - m.age)) / m.years, y = (v) => T + ph * (1 - v / ymax);
    let b = '';
    yt.forEach((v) => { b += S.line(L, y(v), L + pw, y(v), 's-grid') + S.text(L - 8, y(v) + 4, kusd(v), 'xs mono mut', 'end'); });
    SML.ticks(m.age, m.end, small ? 5 : 8).filter((a) => a >= m.age && a <= m.end).forEach((a) => { b += S.text(x(a), T + ph + 18, String(a), 'xs mono mut', 'middle'); });
    b += S.line(L, T + ph, L + pw, T + ph, 's-line');
    const ptsC = m.cur.map((v, k) => [x(m.age + k), y(v)]), ptsN = m.nd.map((v, k) => [x(m.age + k), y(v)]);
    b += S.area(ptsC, T + ph, 'f-info-t', ' style="opacity:.7"');
    const xt = x(m.ta);
    if (m.end > m.ta) b += S.line(xt, T, xt, T + ph, 's-mut dash') + S.text(xt - 6, T + ph - 8, `Target ${m.ta}`, 'xs mut', 'end');
    b += S.line(L, y(m.target), L + pw, y(m.target), 'yr-sfl dash w2');
    b += S.text(L + 8, y(m.target) - 7, `FIRE number ${kusd(m.target)}`, 'sm b yr-tfl');
    if (m.showNeed) b += S.poly(ptsN, 's-up w2', ' style="stroke-linejoin:round"');
    b += S.poly(ptsC, 's-info w25', ' style="stroke-linejoin:round"');
    /* values at the target age */
    const atC = m.cur[m.tYears], atN = m.nd[m.tYears], yC = y(atC), yN = y(atN);
    let lyC = m.showNeed ? yC + 19 : yC - 10;
    if (lyC > T + ph - 6) lyC = yC - 10;
    if (!m.showNeed && Math.abs(lyC - (y(m.target) - 7)) < 14) lyC = yC + 19;
    if (m.showNeed) b += S.circle(xt, yN, 4.5, 'f-up s-surf w2') + S.text(xt - 8, yN - 10, kusd(atN), 'sm b up mono', 'end');
    b += S.circle(xt, yC, 5, 'f-info s-surf w2') + S.text(xt - 8, lyC, kusd(atC), 'sm b info mono', 'end');
    if (m.reach != null && m.reach > m.age && m.reach <= m.end) {
      const cx = x(m.reach), roomLeft = cx - 110 > L + 150, lab = `Reached around ${Math.round(m.reach)}`;
      b += S.circle(cx, y(m.target), 6, 'yr-fl s-surf w2') + (roomLeft ? S.text(cx - 10, y(m.target) - 8, lab, 'sm b ink', 'end') : S.text(cx + (cx > W - 90 ? -10 : 10), y(m.target) + 18, lab, 'sm b ink', cx > W - 90 ? 'end' : 'start'));
    }
    b += `<line class="yr-cross s-mut w1" x1="0" x2="0" y1="${T}" y2="${T + ph}" style="visibility:hidden"/>`;
    b += `<rect class="hit" x="${L}" y="${T}" width="${pw}" height="${ph}" style="fill:transparent"/>`;
    return { svg: S.wrap(W, H, `Projection from age ${m.age} to ${m.end}: ${kusd(atC)} at age ${m.ta} on current saving, against a FIRE number of ${kusd(m.target)}`, b), xs: m.cur.map((v, k) => x(m.age + k)) };
  }

  function histSVG(W, pts, shownId) {
    const H = W > 480 ? 280 : 220, L = 30, Rr = 26, T = 34, B = 30, pw = W - L - Rr, ph = H - T - B, n = pts.length;
    const x = (i) => (n === 1 ? L + pw / 2 : L + (pw * i) / (n - 1)), y = (v) => T + ph * (1 - v / 100);
    let b = '';
    [0, 25, 42, 58, 75, 100].forEach((v) => { b += S.line(L, y(v), L + pw, y(v), v === 0 ? 's-line' : 's-grid') + S.text(L - 6, y(v) + 4, String(v), 'xs mono mut', 'end'); });
    const P = pts.map((p, i) => [x(i), y(sc(p.risk))]);
    b += S.poly(P, 's-acc w2', ' style="stroke-linejoin:round"');
    const gapX = n > 1 ? pw / (n - 1) : pw;
    pts.forEach((p, i) => {
      const me = p.id === shownId, show = gapX >= 74 || i === 0 || i === n - 1 || me;
      b += `<circle cx="${P[i][0].toFixed(1)}" cy="${P[i][1].toFixed(1)}" r="${me ? 7 : 5}" class="${me ? 'yr-fl' : 'f-acc'} s-surf w2"><title>${esc(p.label)}: risk ${sc(p.risk)}, top style ${esc(STYLE[p.top] ? STYLE[p.top].name : p.top || '')}</title></circle>`;
      if (show) {
        const anchor = n > 1 && i === 0 ? 'start' : n > 1 && i === n - 1 ? 'end' : 'middle';
        const ax = anchor === 'start' ? P[i][0] - 6 : anchor === 'end' ? P[i][0] + 6 : P[i][0];
        b += S.text(ax, P[i][1] - 14, `${sc(p.risk)} · ${esc(STYLE[p.top] ? STYLE[p.top].short : '')}`, 'sm b ' + (me ? 'ink' : 'mut'), anchor);
        b += S.text(ax, T + ph + 18, esc(p.short), 'xs mono mut', anchor);
      }
    });
    return S.wrap(W, H, 'Risk score over time: ' + pts.map((p) => `${p.label} ${sc(p.risk)}`).join(', '), b);
  }

  function hover(el, xs, tipHTML) {
    const svg = el.querySelector('svg'); const line = svg && svg.querySelector('.yr-cross'); if (!svg || !line) return;
    const tip = document.createElement('div'); tip.className = 'wg-tip'; tip.hidden = true; el.appendChild(tip);
    const move = (e) => {
      const p = ui.pt(svg, e); let i = 0, best = Infinity;
      xs.forEach((xx, k) => { const d = Math.abs(xx - p.x); if (d < best) { best = d; i = k; } });
      line.setAttribute('x1', xs[i]); line.setAttribute('x2', xs[i]); line.style.visibility = 'visible';
      tip.innerHTML = tipHTML(i); tip.hidden = false;
      const er = el.getBoundingClientRect(), sr = svg.getBoundingClientRect(), k = sr.width / (svg.viewBox.baseVal.width || sr.width);
      const px = sr.left - er.left + xs[i] * k, tw = tip.offsetWidth;
      let left = px + 12; if (left + tw > er.width - 2) left = px - tw - 12;
      tip.style.left = Math.max(2, left) + 'px'; tip.style.top = (sr.top - er.top + 6) + 'px';
    };
    const leave = () => { line.style.visibility = 'hidden'; tip.hidden = true; };
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', leave);
  }

  /* ---------------- html pieces ---------------- */
  const stat = (label, value, cls, note) => `<div class="stat"><span class="stat-l">${label}</span><span class="stat-v${cls ? ' ' + cls : ''}">${value}</span>${note ? `<span class="note">${note}</span>` : ''}</div>`;
  let chapN = 0;
  const sec = (id, title, sub, action, body) => { chapN += 1; return `<section class="chapter yr-sec" style="padding-top:0" aria-labelledby="yr-h-${id}"><div class="wrap">${SML.chapHead(String(chapN).padStart(2, '0'), title, sub, action, 'yr-h-' + id)}${body}</div></section>`; };
  const nameHTML = (name) => { const m = /^(.*\S)\s+(Bunny)$/i.exec(name || ''); return m ? `<em>${esc(m[1])}</em> ${esc(m[2])}` : esc(name || 'Your bunny'); };
  const stylesSorted = (r) => { const st = (r.scores && r.scores.styles) || {}; return STYLE_KEYS.map((k) => ({ k, v: sc(st[k]) })).sort((a, b) => b.v - a.v); };
  const archOf = (r) => { const a = r.archetype || {}, base = ARCH[a.key] || {}; return { key: a.key, name: a.name || base.name || 'Your bunny', role: base.role || '', tagline: a.tagline || '', description: a.description || '', style: base.style }; };

  /* storage and privacy copy (FIXES item 6) */
  function whereInfo() {
    const st = status(), A = acct();
    if (st.mode === 'cloud') {
      const who = A && A.displayName ? A.displayName() : st.name;
      return { pill: 'Private profile', title: 'Your private profile', icon: I('<path d="M7 18.5h10a4.5 4.5 0 0 0 .6-8.96A6 6 0 0 0 6.1 11 3.75 3.75 0 0 0 7 18.5z"/>'),
        text: `${who ? `Signed in as ${esc(who)}. ` : ''}Saved to your private FiredBunny profile. Other visitors and the site owner can't read it.`, short: 'in your private FiredBunny profile', local: false };
    }
    const lead = st.signedIn && st.cloudError ? 'Your online profile cannot be reached right now. ' : '';
    return { pill: 'This browser', title: 'This browser', icon: I('<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 17v3.5"/>'),
      text: `${lead}Saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it from <a href="#settings">Settings</a> when you're done. Export a file to move it.`, short: 'in this browser only', local: true };
  }

  /* FIRE goal from a result: deadline Dec 31 of the target year (next Dec 31 when at or past the target age);
     monthly = what the person saves now, never the amount needed (FIXES items 2, 3, 10) */
  function fireGoalFor(r) {
    const g = r.goals || {}, inp = r.inputs || {}, A = acct();
    const target = Math.round(num(g.fireNumber, 0)); if (!(target > 0)) return null;
    const prof = A ? A.get() : {}, d = new Date(), now = d.getFullYear();
    const next = d.getMonth() === 11 && d.getDate() === 31 ? now + 1 : now;
    const age = Math.round(num(inp.age, 0)), ta = Math.round(num(g.targetAge, 0) || num(inp.retireAge, 0));
    const retired = g.retired === true || (age && ta && ta <= age);
    const by = num(prof.birthYear, 0) || (age ? now - age : 0);
    let year = retired ? next : by && ta ? by + ta : now + Math.max(1, Math.round(num(g.yearsToGoal, 0)) || 20);
    if (year < next) year = next;
    return { target, deadline: `${year}-12-31`, year, monthly: Math.round(Math.max(0, num(inp.savingsMonth, 0))) };
  }

  function existingFire() { const A = acct(); if (!A) return null; const p = A.get(); return (p.goals || []).find((x) => x && x.type === 'fire' && !x.done) || null; }

  function goalSet(r) {
    const fg = fireGoalFor(r), ex = existingFire();
    return goalDone === r.id || !!(fg && ex && Math.round(num(ex.target)) === fg.target && ex.deadline === fg.deadline);
  }
  function goalBlock(r) {
    const fg = fireGoalFor(r); if (!fg || !acct()) return '';
    const ex = existingFire();
    const done = goalSet(r);
    return `<div class="yr-goalbox">${stat('FIRE goal', kusd(fg.target))}${stat('By', String(fg.year))}${stat('You save', fg.monthly ? kusd(fg.monthly) : '$0', '', 'a month now')}</div>
      ${done ? `<p class="yr-p"><span class="pill up">${ico('check')}Goal set</span> Track how close you get on your dashboard.</p>`
        : `<button type="button" class="btn btn-p" data-act="goal">${ex ? 'Update my FIRE goal' : 'Set a goal from this'}</button>`}`;
  }

  function sideCard(kind, r, opts) {
    const w = whereInfo();
    if (kind === 'sample') {
      return `<section class="yr-card yr-save" aria-labelledby="yr-side-h"><div class="yr-save-top"><span class="pill yr-fl">Sample</span>${SML.bunnyMark(26)}</div>
        <h3 class="yr-h3" id="yr-side-h">Your turn</h3>
        <p class="yr-p">Seven quick sections with sliders and taps: goals, money, time, risk and temperament. You get your own bunny, your best-fit styles, a risk level, a starting mix and a learning path.</p>
        <a class="btn yr-go" href="#assessment">Take the assessment${ico('arrow')}</a>
        <p class="note">Save your result to your profile, retake it through the year and watch how you change.</p></section>`;
    }
    if (kind === 'draft') {
      return `<section class="yr-card yr-save" aria-labelledby="yr-side-h"><div class="yr-save-top"><span class="pill yr-fl">Not saved yet</span>${SML.bunnyMark(26)}</div>
        <h3 class="yr-h3" id="yr-side-h">Save to my profile</h3>
        <p class="yr-p">Keep this result so you can retake the assessment later and see how you change: risk, style, goals and all.</p>
        <ul class="yr-where"><li><span>${w.icon}</span><span><b>${esc(w.title)}</b>${w.text}</span></li>
          <li><span>${ico('phone')}</span><span><b>Mobile apps</b>In development. They will use the same profile, so your history comes with you.</span></li></ul>
        <button type="button" class="btn yr-go" data-act="save">${ico('check')}Save to my profile</button>
        ${w.local && SML.host !== 'web' ? `<p class="note yr-note"><a href="#signin">Sign in</a> to keep it in your private profile instead.</p>` : ''}
        ${opts.picker}</section>`;
    }
    if (justSaved === r.id) {
      return `<section class="yr-card yr-save done" aria-labelledby="yr-side-h"><div class="yr-save-top"><span class="pill up">${ico('check')}Saved</span>${SML.bunnyMark(26)}</div>
        <h3 class="yr-h3" id="yr-side-h">Hop hop. Saved.</h3>
        <p class="yr-p">It is stored ${w.short}. Next, turn your FIRE number into a goal. The dashboard tracks how close you get and works out what is needed.</p>
        ${goalBlock(r)}
        <div class="yr-btns"><a class="btn ${goalSet(r) ? 'btn-p' : 'btn-g'}" href="#dashboard">Open my dashboard${ico('arrow')}</a></div>
        ${opts.picker}</section>`;
    }
    return `<section class="yr-card yr-save quiet" aria-labelledby="yr-side-h"><div class="yr-save-top"><span class="pill">${esc(w.pill)}</span>${SML.bunnyMark(26)}</div>
      <p class="yr-k">Saved result</p><h3 class="yr-h3" id="yr-side-h">${esc(dateOf(r))}</h3>
      <p class="yr-p">Stored ${w.short}.${opts.count > 1 ? ` You have ${opts.count} saved results.` : ' Retake it in a few months to see how you change.'}</p>
      ${opts.picker}
      ${goalBlock(r)}
      <div class="yr-btns"><a class="btn btn-g" href="#dashboard">Open my dashboard${ico('arrow')}</a><a class="btn btn-g" href="#assessment">Retake</a></div></section>`;
  }

  function picker(draft, saved, shownId) {
    const opts = [];
    if (draft && !saved.some((s) => s.id === draft.id)) opts.push(['draft', `Now, not saved · ${archOf(draft).name}`]);
    saved.forEach((s) => opts.push([s.id, `${dateOf(s)} · ${archOf(s).name} · risk ${sc(s.scores.risk)}`]));
    if (opts.length < 2) return '';
    return `<label class="fld yr-pick"><span>Viewing</span><select data-act="pick">${opts.map(([v, t]) => `<option value="${esc(v)}"${v === shownId ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  }

  /* ---------------- sections ---------------- */
  function heroSec(kind, r, side, m) {
    const a = archOf(r), p = r.profile || {}, top = stylesSorted(r), g = r.goals || {};
    const eyebrow = kind === 'sample' ? 'Sample result · you would be a' : kind === 'draft' ? 'Your result · not saved yet' : `Saved ${esc(dateOf(r))}`;
    let goalTile;
    if (!m) goalTile = stat('Horizon', `${Math.round(num((r.inputs || {}).horizon, 0))}<small>yrs</small>`);
    else if (m.retired) goalTile = stat('Withdrawal rate', isFinite(m.wr) ? `${m.wr.toFixed(1)}<small>% a year</small>` : 'n/a', isFinite(m.wr) && m.wr <= 4 ? 'up' : 'dn');
    else if (m.ytg === 0) goalTile = stat('FIRE number', 'Reached', 'up');
    else if (m.reach != null) goalTile = stat('Reached around age', `${Math.round(m.reach)}<small>target ${m.ta}</small>`, m.reach <= m.ta ? 'up' : '');
    else goalTile = stat('FIRE number', 'Not reached', 'dn', 'on current pace');
    return `<section class="chapter yr-top" aria-label="Your archetype"><div class="wrap">
      ${kind === 'sample' ? `<div class="yr-sample" role="note">${SML.bunnyMark(28)}<b>Sample result — take the assessment to see yours</b></div>` : ''}
      <div class="yr-hero">
        <article class="yr-id">
          <div class="yr-art"><img src="${SML.brandArt}" alt="" loading="lazy" decoding="async"><div class="yr-badge"><span>${STYLE_ICON[a.style] || STYLE_ICON.passive}</span><b>${esc(a.role || 'Investor')}</b></div></div>
          <div class="yr-idb">
            <p class="yr-k">${eyebrow}</p>
            <h2 class="yr-name">${nameHTML(a.name)}</h2>
            <p class="yr-role">${p.label ? `<span class="pill acc">${esc(p.label)} profile</span>` : ''}<span>Best fits: ${esc(STYLE[top[0].k].name)} and ${esc(STYLE[top[1].k].name)}</span></p>
            ${a.tagline ? `<p class="yr-tagline">${esc(a.tagline)}</p>` : ''}
            ${a.description ? `<p class="yr-desc">${esc(a.description)}</p>` : ''}
          </div>
          <div class="yr-kpis">
            ${stat('Risk score', `${sc(r.scores.risk)}<small>/100</small>`, 'fl')}
            ${stat('Profile', esc(p.label || '·'))}
            ${stat('Top fit', `${top[0].v}<small>${esc(STYLE[top[0].k].short)}</small>`)}
            ${goalTile}
          </div>
        </article>
        <aside class="yr-side">${side}</aside>
      </div></div></section>`;
  }

  function blendSec(r) {
    const top = stylesSorted(r);
    const rows = top.map((s, i) => `<div class="yr-row${i === 0 ? ' t1' : i === 1 ? ' t2' : ''}"><span class="yr-ic">${STYLE_ICON[s.k]}</span>
      <span class="yr-rl"><b>${esc(STYLE[s.k].name)}${i < 2 ? `<span class="tag t${i + 1}">${i === 0 ? 'Top fit' : 'Runner-up'}</span>` : ''}</b><small>${esc(STYLE[s.k].bunny)}</small></span>
      <span class="yr-track" role="img" aria-label="${esc(STYLE[s.k].name)} fit ${s.v} out of 100"><i style="--w:${s.v}%"></i></span><span class="yr-rv">${s.v}</span></div>`).join('');
    const mini = (s, i) => `<div class="yr-mini t${i + 1}"><span class="yr-ic">${STYLE_ICON[s.k]}</span><div><b>${esc(STYLE[s.k].name)} · ${s.v}</b><p>${esc(STYLE[s.k].blurb)}</p>${lessonById(STYLE[s.k].lesson) ? SML.more('#' + STYLE[s.k].lesson, 'Learn it') : ''}</div></div>`;
    const cryptoTop = top[0].k === 'crypto' || top[1].k === 'crypto';
    return sec('blend', 'Your blend', 'How well each style fits you, from 0 to 100. Most people are a mix. Your top two are lit up.', lessonById('l-blend') ? SML.more('#l-blend', 'Blending styles') : '',
      `<div class="yr-split"><div class="yr-card yr-bars">${rows}</div>
        <div class="yr-card"><p class="yr-k">Your sweet spot</p><h3 class="yr-h3">${esc(STYLE[top[0].k].short)} + ${esc(STYLE[top[1].k].short)}</h3>
          <div class="yr-mix-top">${mini(top[0], 0)}${mini(top[1], 1)}</div>
          <p class="yr-p">A blend works well: a core you rarely touch, plus a small satellite for the style you enjoy.${cryptoTop ? ' Crypto stays a capped slice, whatever the score.' : ''}</p></div></div>`);
  }

  function traitsSec(r) {
    const t = (r.scores && r.scores.traits) || {};
    const list = TRAIT_KEYS.map((k) => ({ k, v: sc(t[k]) })).sort((a, b) => b.v - a.v);
    const hi = list[0], lo = list[list.length - 1];
    return sec('traits', 'Your traits', 'Eight things that shape how you invest, from 0 to 100. None is good or bad on its own.', '',
      `<div class="yr-split"><div class="yr-card"><div class="yr-fig" data-chart="radar"></div></div>
        <div class="yr-card"><ul class="yr-tl">${list.map((x, i) => `<li class="${i === 0 ? 'hi' : i === list.length - 1 ? 'lo' : ''}"><span>${esc(TRAIT[x.k].name)}</span><b>${x.v}</b><span class="prog"><i style="--w:${x.v}%"></i></span></li>`).join('')}</ul>
          <div class="callout">${ico('info')}<div><b>Strongest: ${esc(TRAIT[hi.k].name)} (${hi.v}).</b> ${esc(TRAIT[hi.k].means)}</div></div>
          <div class="callout info">${ico('info')}<div><b>Room to grow: ${esc(TRAIT[lo.k].name)} (${lo.v}).</b> ${esc(TRAIT[lo.k].means)}</div></div></div></div>`);
  }

  function riskSec(r) {
    const s = r.scores || {}, cap = sc(s.riskCapacity), will = sc(s.riskWillingness), z = ZONES[zoneOf(cap, will)], gap = Math.abs(cap - will);
    const p = r.profile || {}, on = bandIndex(sc(s.risk));
    return sec('risk', 'Your risk', 'Risk capacity is what your money can take. Willingness is what your nerves can take. A plan that lasts respects both.', lessonById('l-risk-ladder') ? SML.more('#l-risk-ladder', 'The risk ladder') : '',
      `<div class="yr-split even"><div class="yr-card"><p class="yr-k">Where you land</p><div class="yr-fig" data-chart="map"></div>
          <p class="yr-p"><b>${esc(z.name)}.</b> ${esc(z.text)}</p></div>
        <div class="yr-card"><p class="yr-k">Risk score</p><div class="yr-fig" data-chart="gauge"></div>
          <ul class="yr-bands" aria-label="Risk bands">${BANDS.map((bd, i) => `<li class="${i === on ? 'on' : ''}"><i style="opacity:${i === on ? 1 : BAND_OP[i]}"></i><b>${bd[1]}</b><small>${bandRange(bd)}</small></li>`).join('')}</ul>
          ${p.key && p.key !== BANDS[on][0] ? `<p class="note">Your score sits in the ${BANDS[on][1].toLowerCase()} band. Your profile is ${esc(String(p.label || p.key).toLowerCase())}${num((r.inputs || {}).horizon, 99) <= 2 ? ' because your target age is close and the money still has to last through retirement' : ''}.</p>` : ''}
          <div class="yr-stats">${stat('Capacity', `${cap}<small>/100</small>`)}${stat('Willingness', `${will}<small>/100</small>`)}${stat('Profile', esc(p.label || '·'), 'acc')}</div>
          <p class="yr-p">${gap >= 15 ? `There is a ${gap}-point gap between the two. A plan you can stick to leans toward the lower one, so you never have to sell in a panic.` : 'Your two scores are close, which makes a plan much easier to stick to when markets get loud.'}</p></div></div>`);
  }

  function allocSec(r) {
    const p = r.profile || {}, al = p.allocation || {}, inp = r.inputs || {};
    const st = num(al.stocks), bo = num(al.bonds), ca = num(al.cash);
    if (st + bo + ca <= 0) return '';
    const inv = Math.max(0, num(inp.investable, 0));
    const core = SML.clamp(num(p.core, 100 - num(p.satellite, 0)), 0, 100), sat = SML.clamp(num(p.satellite, 100 - core), 0, 100);
    const cap = SML.clamp(num(p.cryptoCap, 0), 0, 10), rpt = num(p.riskPerTrade, 1);
    const acctSize = inv * sat / 100 > 0 ? inv * sat / 100 : 10000;
    const dn = donut(220, [{ v: st, cls: 'f-info', name: 'Stocks' }, { v: bo, cls: 'f-vio', name: 'Bonds' }, { v: ca, cls: 'f-acc', name: 'Cash' }], 'Suggested mix', `${Math.round(st)}/${Math.round(bo)}/${Math.round(ca)}`, `Suggested allocation: ${st}% stocks, ${bo}% bonds, ${ca}% cash`);
    const li = (sw, name, v, note) => `<li><i class="${sw}"></i><span>${name}</span><b>${Math.round(v)}%</b>${note ? `<small>${note}</small>` : ''}</li>`;
    return sec('alloc', 'Suggested allocation', `A starting mix for a ${esc((p.label || 'balanced').toLowerCase())} profile. <span class="pill acc">Educational rule of thumb</span>`, lessonById('l-allocation') ? SML.more('#l-allocation', 'Asset allocation') : '',
      `<div class="yr-split even"><div class="yr-card"><p class="yr-k">Stocks, bonds and cash</p><div class="yr-dn">${dn}
          <ul class="yr-leg">${li('sw-info', 'Stocks', st, inv ? `About ${kusd(inv * st / 100)} of ${kusd(inv)}. The growth engine.` : 'The growth engine.')}${li('sw-vio', 'Bonds', bo, 'The shock absorber.')}${li('sw-acc', 'Cash', ca, 'Dry powder and peace of mind.')}</ul></div></div>
        <div class="yr-card"><p class="yr-k">Core and satellite</p>
          <div class="yr-cs" role="img" aria-label="Core ${Math.round(core)}%, satellite ${Math.round(sat)}%"><i class="sw-info" style="flex:${Math.max(core, 0.01)}"></i>${sat > 0 ? `<i class="sw-fl" style="flex:${sat}"></i>` : ''}</div>
          <div class="yr-cs-l"><span><b>Core ${Math.round(core)}%</b> broad funds you rarely touch</span><span><b>Satellite ${Math.round(sat)}%</b> active ideas</span></div>
          <div class="yr-stats">${stat('Crypto cap', `${cap}<small>% max</small>`, '', cap > 0 ? (inv ? `Up to ${kusd(inv * cap / 100)}` : 'Of investable money') : 'Skip it for now')}
            ${stat('Risk per trade', `${rpt}<small>%</small>`, '', `${kusd(acctSize * rpt / 100)} max loss on a ${kusd(acctSize)} account`)}</div>
          <p class="yr-p">The satellite is where value picks, swing trades or the wheel live. If it goes badly, the core still carries your future.</p></div></div>
      <p class="note yr-disc">Educational rule of thumb, not personal advice. The numbers come from your answers and simple rules.</p>`);
  }

  function moneySec(r) {
    const i = r.inputs || {}, g = r.goals || {};
    const cash = Math.max(0, num(i.cash)), inv = Math.max(0, num(i.investable)), home = Math.max(0, num(i.homeEquity));
    const dh = Math.max(0, num(i.debtHigh)), dO = Math.max(0, num(i.debtOther));
    const nwIn = num(i.netWorth, NaN);
    const other = isFinite(nwIn) ? Math.max(0, nwIn + dh + dO - cash - inv - home) : 0;
    const assets = cash + inv + home + other, net = isFinite(nwIn) ? nwIn : assets - dh - dO;
    const spend = Math.max(0, num(i.spendMonth)), save = Math.max(0, num(i.savingsMonth));
    const em = num(i.emergencyMonths, NaN), months = isFinite(em) ? Math.max(0, em) : (spend ? cash / spend : 0);
    if (assets <= 0 && dh + dO <= 0 && !spend) return '';
    /* savings rate = monthly saving / (saving + spending): the share of take-home pay you save (FIXES item 4) */
    const sr = save + spend > 0 ? (save / (save + spend)) * 100 : 0;
    /* emergency target: the quiz's rule (3 or 6 months), default 6 (FIXES item 8) */
    const et = num(g.emergencyTargetMonths, 0) > 0 ? Math.min(12, num(g.emergencyTargetMonths, 6)) : 6;
    const dn = donut(220, [{ v: cash, cls: 'f-acc', name: 'Cash', text: usd(cash) }, { v: inv, cls: 'f-info', name: 'Investments', text: usd(inv) }, { v: home, cls: 'f-vio', name: 'Home equity', text: usd(home) }, { v: other, cls: 'f-mut', name: 'Other assets', text: usd(other) }], 'Net worth', kusd(net), `What you own: cash ${usd(cash)}, investments ${usd(inv)}, home equity ${usd(home)}, other ${usd(other)}. Net worth ${usd(net)}.`);
    const li = (sw, name, v, cls) => `<li${cls ? ` class="${cls}"` : ''}><i class="${sw}"></i><span>${name}</span><b>${v}</b></li>`;
    const pc = (v) => (SML.clamp(v / 12, 0, 1) * 100).toFixed(1) + '%';
    const zones = (et > 3 ? [[0, 3, 'dn'], [3, et, 'acc'], [et, 12, 'up']] : [[0, et, 'dn'], [et, 12, 'up']]).filter((z) => z[1] > z[0]);
    const ticks = [[0, '0', '']].concat(et > 3 ? [[3, '3', 'c']] : []).concat([[et, `Target ${et}`, 'c tg'], [12, '12+ months', 'r']]);
    const more = Math.max(0, (et - months) * spend);
    const emText = months >= et ? `It covers your ${et}-month target. Surprises will not force you to sell investments at a bad time.`
      : `Your target is ${et} months of spending${et <= 3 ? ', enough for a single person with a steady job and no dependents' : ''}.${more > 0 ? ` About ${usd(more)} more in cash gets you there.` : ''}${months < 3 ? ' Building this comes before taking market risk.' : ''}`;
    return sec('money', 'Your money picture', 'What you own and what you owe, from your answers.', lessonById('l-net-worth') ? SML.more('#l-net-worth', 'Net worth') : '',
      `<div class="yr-split even"><div class="yr-card"><p class="yr-k">What you own</p><div class="yr-dn">${dn}
          <ul class="yr-leg">${li('sw-acc', 'Cash', usd(cash))}${li('sw-info', 'Investments', usd(inv))}${li('sw-vio', 'Home equity', usd(home))}${other ? li('sw-mut', 'Other assets', usd(other)) : ''}
            ${dh ? li('sw-dn', 'High-interest debt', F.minus + usd(dh), 'neg') : ''}${dO ? li('sw-dn', 'Other debt', F.minus + usd(dO), 'neg') : ''}${li('sw-up', 'Net worth', usd(net), 'tot')}</ul></div></div>
        <div class="yr-card"><p class="yr-k">Emergency fund</p>
          <div class="yr-meter" role="img" aria-label="Emergency fund covers ${months.toFixed(1)} months of spending; target ${et} months"><span class="yr-meter-m" style="left:${pc(months)}">${months.toFixed(1)} mo</span>
            <div class="yr-meter-z">${zones.map((z) => `<i class="z-${z[2]}" style="flex:${z[1] - z[0]}"></i>`).join('')}</div>
            <div class="yr-meter-t" aria-hidden="true">${ticks.map((t) => `<span class="${t[2]}" style="${t[2] === 'r' ? 'right:0' : 'left:' + pc(t[0])}">${t[1]}</span>`).join('')}</div></div>
          <p class="yr-p">${emText}</p>
          <div class="yr-stats">${stat('Savings rate', `${Math.round(sr)}<small>%</small>`, sr >= 20 ? 'up' : sr >= 10 ? '' : 'dn', 'share of take-home pay you save')}${stat('Spending', kusd(spend), '', 'a month')}${stat('Saving', kusd(save), '', 'a month')}</div>
          ${dh > 0 ? `<div class="callout dn">${ico('info')}<div><b>High-interest debt: ${usd(dh)}.</b> Credit cards and personal loans usually charge 10% or more. At 10% APR or more, paying it off beats the stock market's long-run average. ${toolById('tool-payoff') ? '<a href="#tool-payoff">Plan the payoff</a>' : ''}</div></div>`
            : `<div class="callout up">${ico('check')}<div><b>No high-interest debt.</b> Every dollar you invest gets to work for you.</div></div>`}</div></div>`);
  }

  /* what the FIRE math includes and leaves out (FIXES item 11) */
  function fireNote(m, g) {
    const counted = typeof (g || {}).otherIncomeCounted === 'boolean' ? g.otherIncomeCounted : m.ta >= 62;
    const ss = m.other > 0 && counted ? `Your FIRE number already subtracts the ${usd(m.other)} a month of Social Security or pension you expect.`
      : m.other > 0 ? `It does not subtract the ${usd(m.other)} a month of Social Security or pension you expect, because that usually starts at 62 or later, after your target age. It will reduce what you withdraw once it starts.`
        : 'Social Security and pensions are not counted. If you expect some, they will reduce what you need to withdraw once they start.';
    const inc = m.retired ? 'invested money (retirement accounts, brokerage, crypto) against your planned yearly spending, in today\'s dollars'
      : `invested money (retirement accounts, brokerage, crypto) and what you save each month, growing about ${m.rate}% a year after inflation, in today's dollars`;
    return `<p class="note yr-inc"><b>Included:</b> ${inc}. <b>Not included:</b> cash, home equity and other assets. ${ss}</p>`;
  }

  function goalSec(r, m) {
    if (!m) return '';
    const pct = SML.clamp((m.P / m.target) * 100, 0, 100);
    const bar = `<div class="yr-gp"><div class="yr-gp-l"><span><b>${kusd(m.P)}</b> invested today</span><span><b>${pct < 1 && pct > 0 ? '<1' : Math.round(pct)}%</b> of ${kusd(m.target)}</span></div><span class="prog"><i style="--w:${pct.toFixed(1)}%"></i></span></div>`;
    if (m.retired) {
      const wr = m.wr, ok = isFinite(wr), zone = !ok ? null : wr <= 3.5 ? ['up', 'Comfortable'] : wr <= 4.5 ? ['acc', 'Near the rule of thumb'] : ['dn', 'High'];
      const pos = ok ? (SML.clamp(wr / 8, 0, 1) * 100).toFixed(1) + '%' : '0%';
      return sec('goal', 'Your withdrawal check', 'You are at or past your target age, so the question is how fast you draw your money down, not how fast it grows.', lessonById('l-swr') ? SML.more('#l-swr', 'Safe withdrawal rates') : '',
        `<div class="yr-card">${bar}
          ${ok ? `<div class="yr-meter" role="img" aria-label="Withdrawal rate ${wr.toFixed(1)}% a year against a 4% rule of thumb"><span class="yr-meter-m" style="left:${pos}">${wr.toFixed(1)}%</span>
            <div class="yr-meter-z"><i class="z-up" style="flex:3.5"></i><i class="z-acc" style="flex:1"></i><i class="z-dn" style="flex:3.5"></i></div>
            <div class="yr-meter-t" aria-hidden="true"><span style="left:0">0%</span><span class="c tg" style="left:50%">4% rule of thumb</span><span style="right:0">8%+</span></div></div>
          <p class="yr-p"><b>${zone[1]}.</b> You plan to draw about ${wr.toFixed(1)}% a year from ${kusd(m.P)}. The 4% rule of thumb comes from US market history over 30-year retirements. Lower is safer for longer retirements, or if markets start badly.</p>`
            : '<p class="yr-p">There is no invested money to draw from yet, so a withdrawal rate does not apply. Income, spending and the basics come first.</p>'}
          <div class="yr-stats">${stat('FIRE number', kusd(m.target), 'acc')}${stat('Invested today', kusd(m.P))}${stat('Withdrawal rate', ok ? `${wr.toFixed(1)}<small>% a year</small>` : 'n/a', ok ? zone[0] : '')}
            ${stat('Status', ok && wr <= 4 ? 'Within 4%' : 'Above 4%', ok && wr <= 4 ? 'up' : 'dn', ok && wr <= 4 ? 'Inside the rule of thumb' : 'Spend less or keep some income')}</div>
          ${fireNote(m, r.goals)}</div>`);
    }
    const there = m.ytg === 0 || m.P >= m.target;
    const needTile = there ? stat('Needed a month', 'Already there', 'up', 'No saving needed for this goal')
      : m.need <= 0 ? stat('Needed a month', '$0', 'up', `Growth alone gets you there by ${m.ta}`)
        : stat('Needed a month', kusd(m.need), '', `You save ${kusd(m.save)} now`);
    const reachTile = there ? stat('Reached around age', 'Now', 'up')
      : m.reach != null ? stat('Reached around age', `${Math.round(m.reach)}<small>target ${m.ta}</small>`, m.reach <= m.ta ? 'up' : '')
        : stat('Reached around age', 'Not reached', 'dn', `on current pace, target ${m.ta}`);
    return sec('goal', 'Your freedom goal', 'Your FIRE number is the pot that could cover your spending for good, about 25 times a year of it. Here is the road from today.', lessonById('l-fire-number') ? SML.more('#l-fire-number', 'Your FIRE number') : '',
      `<div class="yr-card">${bar}
        <div class="yr-legend"><span><i class="sw-info"></i>Current pace: ${kusd(m.save)} a month</span>${m.showNeed ? `<span><i class="sw-up"></i>Needed: ${kusd(m.need)} a month</span>` : ''}<span><i class="dash"></i>FIRE number</span></div>
        <div class="yr-fig" data-chart="proj"></div>
        <div class="yr-stats">${stat('FIRE number', kusd(m.target), 'acc')}${reachTile}${needTile}
          ${stat(`Short at ${m.ta}`, m.gap > 0 ? kusd(m.gap) : 'Nothing', m.gap > 0 ? 'dn' : 'up', m.gap > 0 ? 'on current pace' : '')}${stat('Status', m.onTrack ? 'On track' : 'Behind', m.onTrack ? 'up' : 'dn', m.onTrack ? `for age ${m.ta}` : 'Small changes add up')}</div>
        ${fireNote(m, r.goals)}
        <p class="note">Real markets move in bumps, not lines. Educational estimate, not a promise.</p>
      </div>`);
  }

  function swSec(r) {
    const ins = r.insights || {}, s = (ins.strengths || []).filter(Boolean), w = (ins.watchouts || []).filter(Boolean);
    if (!s.length && !w.length) return '';
    return sec('sw', 'Strengths and watch-outs', 'What to lean on, and what to keep an eye on.', '',
      `<div class="pane2 two"><section><p class="pane-h">Strengths</p><ul class="plain">${s.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>Take the assessment again with more detail to see these.</li>'}</ul></section>
        <section><p class="pane-h acc">Watch-outs</p><ul class="plain">${w.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>Nothing big stood out. Nice.</li>'}</ul></section></div>`);
  }

  function actionsSec(r) {
    const a = ((r.insights || {}).actions || []).filter((x) => x && x.title).slice(0, 6);
    if (!a.length) return '';
    return sec('actions', 'First actions', 'Small moves, in this order. Each one is a hop toward your goal.', '',
      `<ul class="tiles t3 yr-act">${a.map((x, i) => `<li><a class="tile" href="${esc(safeHref(x.href))}"><span class="tile-top"><span class="tile-n">${String(i + 1).padStart(2, '0')}</span></span><span class="tile-t">${esc(x.title)}</span>${x.detail ? `<span class="tile-p">${esc(x.detail)}</span>` : ''}<span class="more">Do this${ico('arrow')}</span></a></li>`).join('')}</ul>
      <p class="note yr-disc">Educational rule of thumb, not personal advice.</p>`);
  }

  function pathSec(r) {
    const ls = ((r.insights || {}).lessons || []).map(lessonById).filter(Boolean);
    if (!ls.length) return '';
    const done = ls.filter((l) => SML.progress.isDone(l.id)).length;
    const next = ls.find((l) => !SML.progress.isDone(l.id));
    return sec('path', 'Your learning path', 'Lessons picked for you, in a sensible order. Your progress is saved as you go.', '',
      `<div class="yr-pathhead"><span class="meta"><span>${done} of ${ls.length} done</span>${next ? `<span>Next: ${esc(next.title)}</span>` : '<span class="up">All done. Hop hop.</span>'}</span><span class="prog"><i style="--w:${Math.round((done / ls.length) * 100)}%"></i></span></div>
      <ol class="yr-path">${ls.map((l, i) => { const d = SML.progress.isDone(l.id), c = courseById(l.course);
        return `<li class="${d ? 'done' : ''}${next && l.id === next.id ? ' next' : ''}"><a href="#${esc(l.id)}"><span class="yr-pn">${d ? ico('check') : String(i + 1).padStart(2, '0')}</span><span class="yr-pt"><b>${esc(l.title)}</b><small>${esc([c ? c.title : '', l.mins ? l.mins + ' min' : ''].filter(Boolean).join(' · '))}</small></span><span class="yr-ps">${d ? '<span class="pill up">Done</span>' : next && l.id === next.id ? '<span class="pill acc">Next up</span>' : ''}${ico('arrow')}</span></a></li>`; }).join('')}</ol>`);
  }

  function toolsSec(r) {
    const ts = ((r.insights || {}).tools || []).map(toolById).filter(Boolean);
    if (!ts.length) return '';
    return sec('tools', 'Tools to try', 'Play with your own numbers. Nothing is saved unless you choose to.', SML.more('#tools', 'All tools'),
      `<ul class="tiles t4">${ts.map((t) => `<li><a class="tile" href="#${esc(t.id)}"><span class="tile-top"><span class="tool-ic">${SML.toolIcon ? SML.toolIcon(t.icon) : ''}</span><span class="tag">${esc(t.cat || 'Tool')}</span></span><span class="tile-t">${esc(t.title)}</span><span class="tile-p">${esc(t.blurb || '')}</span></a></li>`).join('')}</ul>`);
  }

  function changeSec(all, shown) {
    if (all.length < 2) return '';
    const idx = all.findIndex((x) => x.id === shown.id); if (idx < 0) return '';
    const prev = idx > 0 ? all[idx - 1] : all[idx + 1];
    const later = idx === 0; // comparing with a newer one when the oldest is shown
    const a = later ? shown : prev, b = later ? prev : shown;
    const sa = a.scores || {}, sb = b.scores || {};
    const d = (x, y) => sc(y) - sc(x);
    const chg = (v) => `<span class="yr-chg ${v > 0 ? 'p' : v < 0 ? 'n' : 'z'}">${sgn(v)}</span>`;
    const topA = stylesSorted(a)[0].k, topB = stylesSorted(b)[0].k;
    const tl = TRAIT_KEYS.map((k) => ({ k, v: d((sa.traits || {})[k], (sb.traits || {})[k]) }));
    const maxAbs = Math.max(10, ...tl.map((x) => Math.abs(x.v)));
    return sec('change', 'How you changed', `From ${esc(dateOf(a))} to ${esc(dateOf(b))}${b.id === 'draft' ? ' (today, not saved yet)' : ''}. Growth is rarely a straight line, and that is fine.`, '',
      `<div class="yr-split even"><div class="yr-card"><p class="yr-k">Since last time</p>
          <div class="yr-stats">${stat('Risk score', `${sc(sb.risk)}${chg(d(sa.risk, sb.risk))}`, '', `was ${sc(sa.risk)}`)}${stat('Capacity', `${sc(sb.riskCapacity)}${chg(d(sa.riskCapacity, sb.riskCapacity))}`, '', `was ${sc(sa.riskCapacity)}`)}${stat('Willingness', `${sc(sb.riskWillingness)}${chg(d(sa.riskWillingness, sb.riskWillingness))}`, '', `was ${sc(sa.riskWillingness)}`)}</div>
          <div class="yr-stats">${stat('Archetype', esc(archOf(b).name), archOf(a).key === archOf(b).key ? '' : 'acc', archOf(a).key === archOf(b).key ? 'Same as before' : `was ${esc(archOf(a).name)}`)}${stat('Top style', esc(STYLE[topB].short), topA === topB ? '' : 'acc', topA === topB ? 'Same as before' : `was ${esc(STYLE[topA].short)}`)}</div>
          <p class="yr-k">Traits</p>
          <ul class="yr-dv">${tl.map((x) => `<li><span>${esc(TRAIT[x.k].name)}</span><span class="yr-dv-t" role="img" aria-label="${esc(TRAIT[x.k].name)} changed by ${x.v}">${x.v ? `<i class="${x.v > 0 ? 'p' : 'n'}" style="width:${((Math.abs(x.v) / maxAbs) * 50).toFixed(1)}%"></i>` : ''}</span><b class="${x.v > 0 ? 'p' : x.v < 0 ? 'n' : 'z'}">${sgn(x.v)}</b></li>`).join('')}</ul></div>
        <div class="yr-card"><p class="yr-k">Risk score and top style over time</p><div class="yr-fig" data-chart="hist"></div>
          <p class="yr-p">Each dot is one assessment, labelled with your risk score and your top style. Retake it every few months to see the trend.</p></div></div>`);
  }

  function footSec(kind) {
    if (kind === 'draft') {
      return `<section class="chapter" style="padding-top:0" aria-label="Save your result"><div class="wrap"><div class="yr-card yr-save"><div class="yr-foot"><div><p class="yr-k">Like what you see?</p><h3 class="yr-h3">Keep it on your profile</h3><p class="yr-p">Save it now, then retake the assessment through the year to track how you grow.</p></div>
        <div class="yr-btns"><button type="button" class="btn yr-go" data-act="save">${ico('check')}Save to my profile</button><a class="btn btn-g" href="#assessment">Retake</a></div></div></div></div></section>`;
    }
    if (kind === 'sample') {
      return `<section class="chapter" style="padding-top:0" aria-label="Take the assessment"><div class="wrap">${SML.bunnyTip ? SML.bunnyTip('This page showed a sample bunny. Yours could look very different. <a href="#assessment">Take the assessment</a> and see who you are as an investor.', 'Your turn') : ''}</div></section>`;
    }
    return '';
  }

  /* ---------------- paint ---------------- */
  function paint(view, draft, list) {
    const saved = list || [];
    const draftSaved = draft && saved.some((s) => s.id === draft.id);
    let shown = null, kind = 'saved';
    if (selId && selId !== 'draft') shown = saved.find((x) => x.id === selId) || null;
    if (!shown && draft && !draftSaved && (!selId || selId === 'draft')) { shown = draft; kind = 'draft'; }
    if (!shown && draftSaved) shown = saved.find((s) => s.id === draft.id);
    if (!shown && saved.length) shown = saved[0];
    if (!shown && draft) { shown = draft; kind = 'draft'; }
    if (!shown) { shown = SAMPLE(); kind = 'sample'; }
    const shownId = kind === 'draft' ? 'draft' : shown.id;

    const all = saved.map((s) => ({ r: s, id: s.id })).reverse();
    if (draft && !draftSaved) all.push({ r: draft, id: 'draft' });
    const allR = all.map((x) => Object.assign({}, x.r, { id: x.id }));
    const shownForChange = Object.assign({}, shown, { id: shownId });

    const m = goalModel(shown);
    const pick = picker(draft, saved, shownId);
    const side = sideCard(kind, shown, { picker: pick, count: saved.length });
    const a = archOf(shown);
    const lede = kind === 'sample' ? 'This is a sample so you can see what you get. Take the assessment to see yours. It only takes a few minutes.'
      : kind === 'draft' ? `Here is what your answers say about you as an investor. Save it to your profile to track how you change through the year.`
        : `Taken ${esc(dateOf(shown))}. Retake it every few months to see how you grow and how close you are to your goals.`;
    const head = SML.pageHeader('', 'Self-assessment', 'Your investor <em>profile</em>',
      `<p>${lede}</p><div class="yr-btns">${kind === 'sample' ? `<a class="btn btn-p" href="#assessment">Take the assessment${ico('arrow')}</a>` : `<a class="btn btn-g" href="#assessment">Retake the assessment</a>`}${saved.length ? `<a class="btn btn-g" href="#dashboard">My dashboard</a>` : ''}</div>`);

    chapN = 0;
    const body = heroSec(kind, shown, side, m) + blendSec(shown) + traitsSec(shown) + riskSec(shown) + allocSec(shown) + moneySec(shown) + goalSec(shown, m)
      + changeSec(allR, shownForChange) + swSec(shown) + actionsSec(shown) + pathSec(shown) + toolsSec(shown) + footSec(kind);
    view.innerHTML = head + `<div class="yr" data-kind="${kind}" aria-label="${esc(a.name)}">${body}</div>`;
    const root = view.querySelector('.yr');

    /* charts */
    const draw = {
      radar: (el, W) => { el.innerHTML = radarSVG(W, (shown.scores && shown.scores.traits) || {}); },
      map: (el, W) => { el.innerHTML = mapSVG(W, sc(shown.scores.riskCapacity), sc(shown.scores.riskWillingness)); },
      gauge: (el, W) => { el.innerHTML = gaugeSVG(W, sc(shown.scores.risk)); },
      proj: (el, W) => {
        if (!m || m.retired) return; const o = projSVG(W, m); el.innerHTML = o.svg;
        hover(el, o.xs, (k) => `Age ${m.age + k}<br>Current pace: ${kusd(m.cur[k])}${m.showNeed && k <= m.tYears ? `<br>Needed pace: ${kusd(m.nd[k])}` : ''}<br>FIRE number: ${kusd(m.target)}`);
      },
      hist: (el, W) => {
        const pts = allR.map((x) => { const d = String(x.date || '').slice(0, 10); return { id: x.id, risk: x.scores && x.scores.risk, top: stylesSorted(x)[0].k, label: x.id === 'draft' ? 'Today (not saved)' : dateOf(x), short: x.id === 'draft' ? 'Now' : (d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '') }; });
        el.innerHTML = histSVG(W, pts, shownId);
      },
    };
    root.querySelectorAll('[data-chart]').forEach((el) => { const f = draw[el.dataset.chart]; if (f) ui.responsive(el, (W) => f(el, W)); });

    /* actions */
    root.addEventListener('change', (e) => {
      const s = e.target.closest('select[data-act="pick"]'); if (!s) return;
      selId = s.value; paint(view, draft, list);
      const top = view.querySelector('.yr-top'); if (top && top.scrollIntoView) top.scrollIntoView({ block: 'start', behavior: SML.reduced() ? 'auto' : 'smooth' });
    });
    root.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]'); if (!btn || btn.tagName === 'SELECT') return;
      const act = btn.dataset.act, A = acct();
      if (act === 'save' && kind === 'draft') {
        if (!A) { SML.toast('Saving is not available here.'); return; }
        root.querySelectorAll('[data-act="save"]').forEach((b) => { b.disabled = true; b.textContent = 'Saving…'; });
        try {
          const id = await A.assessments.add(draft);
          SML.store.set('assessDraft', null); SML.assessDraft = null;
          selId = id; justSaved = id; lastDraftId = null;
          SML.hop(A.status.mode === 'cloud' ? 'Hop hop. Saved to your profile.' : 'Hop hop. Saved in this browser.');
          const fresh = await A.assessments.list();
          if (view.isConnected) { paint(view, null, (fresh || []).filter(valid)); const t = view.querySelector('.yr-side'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'nearest' }); }
        } catch (err) {
          root.querySelectorAll('[data-act="save"]').forEach((b) => { b.disabled = false; b.textContent = 'Try again'; });
          SML.toast('That did not save. Try again in a moment.');
        }
      }
      if (act === 'goal') {
        const fg = fireGoalFor(shown); if (!A || !fg) return;
        btn.disabled = true;
        try {
          const inv = A.netWorth ? A.netWorth().investable : 0;
          await A.save((p) => {
            p.goals = Array.isArray(p.goals) ? p.goals : [];
            const ex = p.goals.find((x) => x && x.type === 'fire' && !x.done);
            if (ex) Object.assign(ex, { target: fg.target, deadline: fg.deadline, monthly: fg.monthly });
            else p.goals.push({ id: A.newId ? A.newId('g') : SML.uid('g'), title: 'Financial freedom (FIRE)', type: 'fire', target: fg.target,
              current: inv > 0 ? inv : Math.round(num((shown.inputs || {}).investable, 0)), source: inv > 0 ? 'investable' : 'manual',
              deadline: fg.deadline, monthly: fg.monthly, created: new Date().toISOString(), done: false });
          });
          goalDone = shown.id; SML.hop('Hop hop. Goal set.');
          paint(view, draft, list);
        } catch (err) { btn.disabled = false; SML.toast('That did not save. Try again in a moment.'); }
      }
    });
  }

  function loadingView(view) {
    view.innerHTML = SML.pageHeader('', 'Self-assessment', 'Your investor <em>profile</em>', '<p>Hopping over to fetch your results.</p>')
      + `<section class="chapter yr-top"><div class="wrap"><div class="yr-loading" role="status">${SML.bunnyMark(36)}<span>Fetching your results…</span></div></div></section>`;
  }

  SML.pages = SML.pages || {};
  SML.pages.results = function (view) {
    let alive = true;
    SML.onCleanup(() => {
      alive = false;
      const tok = (location.hash || '').replace(/^#\/?/, '').split(/[?&/]/)[0];
      if (tok !== 'results') { selId = null; justSaved = null; goalDone = null; }
    });
    const draft = readDraft();
    const did = draft ? draft.id || draft.date || 'draft' : null;
    if (did && did !== lastDraftId) { lastDraftId = did; selId = null; justSaved = null; }
    const A = acct();
    if (!A) { paint(view, draft, []); return TITLE; }
    if (!A.status.ready) {
      if (draft) paint(view, draft, null); else loadingView(view);
      A.ready().then(() => { /* the router re-renders this page on 'ready' */ });
      return TITLE;
    }
    if (draft) paint(view, draft, null); else loadingView(view);
    A.assessments.list().then((l) => { if (alive && view.isConnected) paint(view, draft, (l || []).filter(valid)); })
      .catch(() => { if (alive && view.isConnected) paint(view, draft, []); });
    return TITLE;
  };
})();
