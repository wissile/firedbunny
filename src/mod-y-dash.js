/* Dashboard (#dashboard): goals, net worth with assets and debts, household summary, investor profile over time,
 * lesson progress, upcoming key dates, owner feedback inbox and the mobile apps card. Fork D. Prefix: .dsh-
 * Reads everything from SML.account; writes only on a user action (save buttons, record today, mark reached). */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, F = SML.fmt, esc = SML.esc;
  const $ = (sel, r) => (r || document).querySelector(sel);
  const $$ = (sel, r) => Array.from((r || document).querySelectorAll(sel));
  const MINUS = '−';

  /* ---------------- small helpers ---------------- */
  const pad = (n) => String(n).padStart(2, '0');
  const localISO = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const todayLocal = () => localISO(new Date());
  const todayUTC = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }; // same local day key as SML.account.snapshot()
  const parseISO = (s) => new Date(String(s).slice(0, 10) + 'T12:00:00');
  const addMonths = (n) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + n); return localISO(d); };
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localISO(d); };
  const monthsTo = (iso) => { const a = new Date(), b = parseISO(iso); return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() - a.getDate()) / 30.4; };
  const num = (v) => { if (typeof v === 'number') return isFinite(v) ? v : 0; const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const usd = (v) => F.usd0(Math.round(num(v)));
  const kfmt = (v) => {
    const a = Math.abs(v), sg = v < 0 ? MINUS : '';
    if (a >= 1e6) return sg + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
    if (a >= 1e4) return sg + '$' + Math.round(a / 1e3) + 'K';
    if (a >= 1e3) return sg + '$' + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return sg + '$' + Math.round(a);
  };
  const mY = (iso) => { try { return parseISO(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); } catch (e) { return iso; } };
  const mD = (iso) => { try { return parseISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch (e) { return iso; } };
  const longDate = (iso) => (SML.fmtDate ? SML.fmtDate(String(iso).slice(0, 10), true) : iso);
  const left = (m) => { if (m < 1) return m <= 0 ? 'now' : 'this month'; const y = Math.floor(m / 12), r = Math.round(m - y * 12); return (y ? y + ' yr' : '') + (y && r ? ' ' : '') + (r ? r + ' mo' : ''); };
  const nice = (lo, hi, n) => {
    const span = hi - lo || 1; const s0 = span / n; const mag = Math.pow(10, Math.floor(Math.log10(s0))); const f = s0 / mag;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step; const ticks = [];
    for (let v = a; v <= b + step / 2; v += step) ticks.push(Math.round(v / step) * step);
    return { lo: a, hi: b === a ? a + step : b, ticks };
  };
  const I = (body, w) => `<svg class="dsh-i" width="${w || 18}" height="${w || 18}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const ICON = {
    fire: '<path d="M12 3c1 3.5 5 5.6 5 10.2a5 5 0 0 1-10 0c0-2.6 1.4-4.1 2.5-5.2.3 1.6 1 2.6 2 3 0-3 .5-5.4.5-8z"/>',
    house: '<path d="M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
    emergency: '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v6.5a2 2 0 0 1-4 0"/>',
    debt: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14.5h4"/>',
    college: '<path d="M2.5 9L12 4.5 21.5 9 12 13.5zM6.5 11v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V11M21.5 9v5"/>',
    retire: '<path d="M3 18.5h18M6.5 18.5a5.5 5.5 0 0 1 11 0M12 6v2.5M4.6 10.2l1.8 1.3M19.4 10.2l-1.8 1.3"/>',
    custom: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    cam: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  };
  const arrow = I(ICON.arrow, 16);

  /* ---------------- vocab ---------------- */
  const GOAL_TYPES = [['emergency', 'Emergency fund'], ['fire', 'FIRE number'], ['house', 'House down payment'], ['debt', 'Pay off debt'], ['college', 'College fund'], ['retire', 'Retirement'], ['custom', 'Custom']];
  const GOAL_LABEL = Object.fromEntries(GOAL_TYPES);
  const GOAL_COL = { emergency: 'var(--info)', fire: 'var(--flame)', house: 'var(--violet)', debt: 'var(--down)', college: 'color-mix(in srgb,var(--up) 50%,var(--info))', retire: 'var(--up)', custom: 'var(--accent)' };
  const GOAL_LESSON = { emergency: 'l-emergency', fire: 'l-fire-number', house: 'l-rent-vs-buy', debt: 'l-card-debt', college: 'l-kids-money', retire: 'l-retire-plan' };
  const SOURCES = [['manual', 'An amount I update'], ['networth', 'My net worth'], ['investable', 'Investable (retirement, brokerage, crypto)'], ['cash', 'Cash & savings']];
  const SRC_SHORT = { manual: 'updated by you', networth: 'tracks your net worth', investable: 'tracks investable money', cash: 'tracks your cash' };
  const ACOL = { cash: 'var(--info)', retirement: 'var(--up)', brokerage: 'var(--violet)', home: 'var(--accent)', realestate: 'var(--flame)', crypto: 'color-mix(in srgb,var(--up) 50%,var(--info))', vehicle: 'var(--muted)', business: 'color-mix(in srgb,var(--violet) 55%,var(--down))', other: 'var(--shade2)' };
  const DCOL = { card: 'var(--down)', student: 'var(--violet)', car: 'var(--info)', mortgage: 'var(--muted)', heloc: 'var(--accent)', personal: 'var(--flame)', other: 'var(--shade2)' };
  const MEMBER_COL = ['var(--info)', 'var(--violet)', 'var(--up)', 'var(--accent)', 'var(--flame)', 'color-mix(in srgb,var(--up) 50%,var(--info))'];
  const REL = { self: 'You', partner: 'Partner', child: 'Child', parent: 'Parent', other: 'Family' };
  const ARCH = { steady: 'Steady Bunny', detective: 'Detective Bunny', surfer: 'Surfer Bunny', sprinter: 'Sprinter Bunny', farmer: 'Farmer Bunny', freedom: 'Freedom Bunny' };
  const ARCH_STYLE = { steady: 'passive index investing', detective: 'value investing', surfer: 'swing trading', sprinter: 'day trading', farmer: 'options income and the wheel', freedom: 'FIRE planning' };
  const STYLE = { passive: 'Passive index', value: 'Value', swing: 'Swing', day: 'Day trading', wheel: 'Wheel', fire: 'FIRE', crypto: 'Crypto' };
  const PROFILE = { conservative: 'Conservative', moderate: 'Moderate', balanced: 'Balanced', growth: 'Growth', aggressive: 'Aggressive' };
  const CATL = { fed: 'Fed & rates', data: 'Economic data', markets: 'Markets & options', earnings: 'Earnings', tax: 'Taxes', benefits: 'Benefits & retirement', energy: 'Oil & energy', crypto: 'Crypto' };
  const CATC = { fed: 'var(--accent)', data: 'var(--info)', markets: 'var(--violet)', earnings: 'var(--up)', tax: 'var(--down)', benefits: 'color-mix(in srgb,var(--up) 45%,var(--info))', energy: 'color-mix(in srgb,var(--accent) 50%,var(--down))', crypto: 'color-mix(in srgb,var(--violet) 55%,var(--down))' };
  /* the quiz profile thresholds (FIXES item 5): <25 Conservative, <42 Moderate, <58 Balanced, <75 Growth, else Aggressive */
  const RISK_BANDS = [[0, 25, 'Conservative'], [25, 42, 'Moderate'], [42, 58, 'Balanced'], [58, 75, 'Growth'], [75, 100, 'Aggressive']];
  const rothHint = () => `Needs earned income. 2026 income limits for a full contribution: under $153k single / $242k married filing jointly. The 2026 limit is $7,500, or $8,600 at 50 and over.${new Date().getFullYear() !== 2026 ? " 2026 limit; check this year's." : ''}`;
  const typeLabel = (list, k) => { const f = list.find((x) => x[0] === k); return f ? f[1] : 'Other'; };

  /* learning data, same rules as the router */
  const TRACKS = () => (SML.tracks && SML.tracks.length ? SML.tracks : [{ id: 'trading', n: 1, title: 'Trading', short: 'Trading' }]);
  const coursesOf = (tid) => SML.courses.filter((c) => (c.track || 'trading') === tid).sort((a, b) => a.n - b.n);
  const lessonsOf = (cid) => SML.lessons.filter((l) => l.course === cid).sort((a, b) => (a.order || 0) - (b.order || 0));
  const lessonsOfTrack = (tid) => coursesOf(tid).flatMap((c) => lessonsOf(c.id));
  const lessonById = (id) => SML.lessons.find((l) => l.id === id);
  const courseById = (id) => SML.courses.find((c) => c.id === id);

  /* ---------------- styles ---------------- */
  SML.css(`
    .dsh{padding-block:4px 80px}
    .dsh-stack{display:flex;flex-direction:column;gap:22px}
    .dsh-st{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-top:14px;font-size:13.5px;color:var(--muted);line-height:1.5}
    .dsh-st a{color:var(--accent);font-weight:600}
    .dsh-chip{display:inline-flex;align-items:center;gap:8px;min-height:26px;padding:0 11px;border-radius:99px;border:1px solid var(--line);font:600 12.5px/1 var(--sans);color:var(--muted);white-space:nowrap}
    .dsh-chip.up{color:var(--up);border-color:color-mix(in srgb,var(--up) 45%,transparent);background:color-mix(in srgb,var(--up) 10%,transparent)}
    .dsh-chip.acc{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
    .dsh-dot{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 22%,transparent)}
    .dsh-card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px 16px;min-width:0;position:relative}
    @media(min-width:768px){.dsh-card{padding:24px 28px}}
    .dsh-h{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px 20px;margin-bottom:18px}
    .dsh-h > div:first-child{min-width:0;flex:1 1 260px}
    .dsh-k{font:600 11px/1.3 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;gap:8px}
    .dsh-h h2,.dsh-h2{font-family:var(--display);font-weight:400;font-size:clamp(30px,3vw,40px);line-height:.95;text-transform:uppercase;color:var(--ink);margin-top:6px;letter-spacing:.005em}
    .dsh-h p.dsh-sub{color:var(--muted);font-size:14px;margin-top:8px;max-width:64ch;line-height:1.5}
    .dsh-acts{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .dsh-two{display:grid;gap:22px;grid-template-columns:1fr}
    @media(min-width:1024px){.dsh-two{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.dsh-two.b{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr)}}
    .dsh-i{flex:0 0 auto}
    .dsh-ib{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:var(--r);border:1px solid transparent;background:transparent;color:var(--muted);cursor:pointer}
    .dsh-ib:hover,.dsh-ib:focus-visible{color:var(--ink);border-color:var(--line);background:var(--surface-2)}
    .dsh-ib.dn:hover{color:var(--down)}
    .dsh-link{color:var(--accent);font-weight:600;text-decoration:none}
    .dsh-link:hover{text-decoration:underline}
    .dsh-note{font-size:13px;color:var(--muted);line-height:1.5}
    .dsh-bar{height:8px;border-radius:99px;background:var(--line);overflow:hidden}
    .dsh-bar > i{display:block;height:100%;width:var(--w,0%);border-radius:inherit;background:var(--c,var(--up));transition:width .5s ease}
    .dsh-bar.sm{height:4px}
    .dsh-sw{width:10px;height:10px;border-radius:3px;background:var(--c,var(--muted));flex:0 0 10px}
    .dsh-err{color:var(--down);font-size:13.5px;margin-top:10px}

    /* empty + migration */
    .dsh-mig{display:flex;flex-wrap:wrap;gap:14px 20px;align-items:center;justify-content:space-between;border:1px solid color-mix(in srgb,var(--accent) 40%,var(--line));background:color-mix(in srgb,var(--accent) 8%,var(--surface));border-radius:12px;padding:16px 18px}
    .dsh-mig > div:first-child{display:flex;gap:12px;align-items:flex-start;flex:1 1 300px;min-width:0}
    .dsh-mig b{color:var(--ink)} .dsh-mig p{font-size:14.5px;line-height:1.55;color:color-mix(in srgb,var(--ink) 86%,transparent)}
    .dsh-empty{display:grid;gap:22px;grid-template-columns:1fr;align-items:center;padding:0;overflow:hidden}
    @media(min-width:900px){.dsh-empty{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}}
    .dsh-art{background:#000;min-height:200px;height:100%;position:relative;border-bottom:1px solid color-mix(in srgb,var(--flame) 35%,var(--line))}
    @media(min-width:900px){.dsh-art{border-bottom:0;border-right:1px solid color-mix(in srgb,var(--flame) 35%,var(--line))}}
    .dsh-art img{display:block;width:100%;height:100%;object-fit:contain;aspect-ratio:3/2;padding:6%;box-sizing:border-box}
    .dsh-art::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 80px -20px color-mix(in srgb,var(--flame) 60%,transparent);pointer-events:none}
    .dsh-empty-b{padding:4px 18px 22px;display:flex;flex-direction:column;gap:14px}
    @media(min-width:900px){.dsh-empty-b{padding:28px 32px 28px 4px}}
    .dsh-empty-b .dsh-h2{font-size:clamp(34px,4vw,48px)}
    .dsh-empty-b > p:not(.dsh-k){color:color-mix(in srgb,var(--ink) 80%,transparent);font-size:15.5px;line-height:1.6;max-width:56ch}
    .dsh-start{display:grid;gap:10px;grid-template-columns:1fr}
    @media(min-width:560px){.dsh-start{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .dsh-start > *{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:inherit;text-decoration:none;text-align:left;font:inherit;cursor:pointer;transition:border-color .15s,background-color .15s}
    .dsh-start > *:hover{border-color:color-mix(in srgb,var(--accent) 55%,transparent);background:var(--surface-2)}
    .dsh-start b{color:var(--ink);font-size:15px;line-height:1.3}
    .dsh-start small{color:var(--muted);font-size:12.5px;line-height:1.45}
    .dsh-start .n{font:600 11px var(--mono);letter-spacing:.16em;color:var(--accent)}
    .dsh-start .go{border-color:color-mix(in srgb,var(--flame) 50%,var(--line));background:color-mix(in srgb,var(--flame) 8%,var(--bg))}
    .dsh-start .go .n{color:var(--flame)}

    /* KPI tiles */
    .dsh-kpis{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden;grid-template-columns:repeat(2,minmax(0,1fr))}
    @media(min-width:700px){.dsh-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(min-width:1180px){.dsh-kpis{grid-template-columns:repeat(6,minmax(0,1fr))}}
    .dsh-kpi{background:var(--surface);padding:16px 14px;display:flex;flex-direction:column;gap:7px;min-width:0}
    @media(min-width:768px){.dsh-kpi{padding:20px 20px}}
    .dsh-kl{font:500 10.5px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
    .dsh-kv{font-family:var(--display);font-weight:400;font-size:clamp(30px,3.2vw,40px);line-height:.92;color:var(--ink);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
    .dsh-kv small{font-size:.5em;color:var(--muted);margin-left:2px}
    .dsh-kv.nm{font-size:clamp(24px,2.3vw,30px);line-height:1}
    .dsh-ks{font-size:12.5px;line-height:1.4;color:var(--muted)}
    .dsh-ks.up{color:var(--up)} .dsh-ks.dn{color:var(--down)}
    .dsh-ks a{color:var(--accent);font-weight:600;text-decoration:none}
    .dsh-kpi.fl{background:linear-gradient(160deg,color-mix(in srgb,var(--flame) 9%,var(--surface)),var(--surface) 70%)}
    .dsh-kpi.fl .dsh-kv{color:var(--gold)}

    /* goals */
    .dsh-ret{display:flex;flex-direction:column;gap:6px;min-width:220px;flex:0 1 280px}
    .dsh-ret .ctl-top{display:flex;justify-content:space-between;gap:8px}
    .dsh-ret input[type=range]{width:100%;accent-color:var(--accent)}
    .dsh-goals{display:grid;gap:14px;grid-template-columns:1fr}
    @media(min-width:720px){.dsh-goals{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(min-width:1180px){.dsh-goals{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .dsh-goal{position:relative;display:flex;flex-direction:column;gap:12px;padding:16px;border:1px solid var(--line);border-radius:10px;background:var(--bg);min-width:0}
    .dsh-g-top{display:flex;gap:12px;align-items:flex-start}
    .dsh-g-ic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);border:1px solid color-mix(in srgb,var(--c) 35%,transparent);flex:0 0 38px}
    .dsh-g-t{min-width:0;flex:1}
    .dsh-g-t h3{font-size:16.5px;font-weight:600;color:var(--ink);line-height:1.3;overflow-wrap:anywhere}
    .dsh-g-t p{font:500 10.5px/1.4 var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-top:3px}
    .dsh-g-nums{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
    .dsh-g-nums b{font-family:var(--display);font-weight:400;font-size:34px;line-height:.9;color:var(--ink);font-variant-numeric:tabular-nums}
    .dsh-g-nums span{color:var(--muted);font:500 13px var(--mono)}
    .dsh-g-nums em{margin-left:auto;font:600 14px var(--mono);font-style:normal;color:var(--c)}
    .dsh-facts{list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;border-top:1px dashed var(--line);padding-top:12px}
    .dsh-facts li{display:flex;flex-direction:column;gap:3px;min-width:0}
    .dsh-facts span{font:500 10px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
    .dsh-facts b{font:600 13px/1.35 var(--mono);color:var(--ink);overflow-wrap:anywhere}
    .dsh-facts b small{display:block;font-weight:500;font-size:11px;color:var(--muted)}
    .dsh-g-msg{font-size:13px;line-height:1.5;color:var(--muted)}
    .dsh-g-msg b{color:var(--ink)} .dsh-g-msg.dn b{color:var(--down)}
    .dsh-g-act{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:auto}
    .dsh-g-act .sp{flex:1}
    .dsh-goal.done{border-color:color-mix(in srgb,var(--flame) 55%,var(--line));background:linear-gradient(170deg,color-mix(in srgb,var(--flame) 10%,var(--bg)),var(--bg) 65%)}
    .dsh-goal.done .dsh-bar > i{background:linear-gradient(90deg,var(--gold),var(--flame))}
    .dsh-goal.done .dsh-g-nums em{color:var(--gold)}
    .dsh-badge{display:inline-flex;align-items:center;gap:6px;font:600 10px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;padding:5px 9px;border-radius:99px;white-space:nowrap;border:1px solid var(--line);color:var(--muted)}
    .dsh-badge.up{color:var(--up);border-color:color-mix(in srgb,var(--up) 40%,transparent);background:color-mix(in srgb,var(--up) 10%,transparent)}
    .dsh-badge.dn{color:var(--down);border-color:color-mix(in srgb,var(--down) 40%,transparent);background:color-mix(in srgb,var(--down) 10%,transparent)}
    .dsh-badge.fl{color:var(--gold);border-color:color-mix(in srgb,var(--flame) 50%,transparent);background:color-mix(in srgb,var(--flame) 14%,transparent)}
    .dsh-goal.editing{outline:2px solid var(--accent);outline-offset:2px}
    .dsh-confirm{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:13.5px;color:var(--ink)}
    .dsh-confirm b{margin-right:auto}
    .dsh-gempty{display:flex;flex-direction:column;gap:12px;padding:18px;border:1px dashed var(--input);border-radius:10px}
    .dsh-tpls{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
    .dsh-tpls > span{font:500 10.5px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-right:4px}
    .dsh-tpls .chip{text-transform:none;letter-spacing:.02em;font-size:12px}
    /* celebration */
    .dsh-cele{position:absolute;left:50%;top:44%;width:0;height:0;pointer-events:none;z-index:2}
    .dsh-cele i{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:2px;background:var(--c);transform:rotate(var(--a)) translateY(0);opacity:0;animation:dshPop 1.1s cubic-bezier(.2,.7,.3,1) forwards;animation-delay:var(--dl)}
    @keyframes dshPop{0%{opacity:1;transform:rotate(var(--a)) translateY(0) scale(1)}80%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateY(calc(var(--r) * -1)) scale(.6)}}
    .dsh-goal.pop{animation:dshBump .6s ease}
    @keyframes dshBump{0%{transform:scale(1)}35%{transform:scale(1.025)}100%{transform:scale(1)}}
    @media (prefers-reduced-motion:reduce){.dsh-cele{display:none}.dsh-goal.pop{animation:none}.dsh-bar > i{transition:none}}

    /* forms */
    .dsh-form{border:1px solid color-mix(in srgb,var(--accent) 45%,var(--line));background:var(--surface-2);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:14px;margin-bottom:14px;scroll-margin:90px}
    .dsh-form-h{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between}
    .dsh-form-h > b{font:600 12px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
    .dsh-fgrid{display:grid;gap:12px;grid-template-columns:1fr}
    @media(min-width:560px){.dsh-fgrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(min-width:1000px){.dsh-fgrid.g4{grid-template-columns:repeat(4,minmax(0,1fr))}}
    .dsh-fgrid .wide{grid-column:1/-1}
    @media(min-width:1000px){.dsh-fgrid.g4 .wide2{grid-column:span 2}}
    .dsh-form .fld input,.dsh-form .fld select{background:var(--bg)}
    .dsh-cur{display:flex;flex-direction:column;justify-content:flex-end;gap:6px;min-width:0}
    .dsh-cur b{font:600 15px var(--mono);color:var(--ink);padding:9px 0}
    .dsh-form-act{display:flex;flex-wrap:wrap;gap:8px}

    /* net worth */
    .dsh-nw{display:grid;gap:22px;grid-template-columns:1fr}
    @media(min-width:1024px){.dsh-nw{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)}}
    .dsh-big{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px 24px}
    .dsh-big > div{display:flex;flex-direction:column;gap:4px}
    .dsh-big .v{font-family:var(--display);font-size:clamp(50px,6vw,72px);line-height:.85;color:var(--ink);font-variant-numeric:tabular-nums}
    .dsh-big .v.neg{color:var(--down)}
    .dsh-big .s{font:500 13px var(--mono);color:var(--muted)}
    .dsh-big .s b{color:var(--ink);font-weight:600}
    .dsh-ins{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
    .dsh-ins span{font:500 12px/1.3 var(--mono);color:var(--muted);border:1px solid var(--line);border-radius:99px;padding:6px 10px}
    .dsh-ins span b{color:var(--ink);font-weight:600}
    .dsh-ins span.dn{border-color:color-mix(in srgb,var(--down) 45%,transparent);color:var(--down)}
    .dsh-fig{position:relative;margin-top:16px;min-width:0}
    .dsh-fig svg{display:block;overflow:visible}
    .dsh-fig .wg-tip{transform:translate(-50%,-100%);margin-top:-10px}
    .dsh-leg{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 11px var(--mono);color:var(--muted);letter-spacing:.06em;margin-top:8px}
    .dsh-leg span{display:inline-flex;align-items:center;gap:6px}
    .dsh-leg i{width:14px;height:0;border-top:2.5px solid var(--c)}
    .dsh-leg i.d{border-top-style:dashed}
    .dsh-hint{border:1px dashed var(--input);border-radius:10px;padding:16px;font-size:13.5px;color:var(--muted);line-height:1.55;margin-top:16px}
    .dsh-donuts{display:grid;gap:18px;grid-template-columns:1fr;align-content:start}
    @media(min-width:640px) and (max-width:1023px){.dsh-donuts{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .dsh-dn{display:flex;gap:14px;align-items:center;min-width:0}
    .dsh-dn svg{flex:0 0 auto}
    .dsh-dn ul{list-style:none;display:flex;flex-direction:column;gap:6px;min-width:0;flex:1}
    .dsh-dn li{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:8px;align-items:center;font-size:12.5px;color:var(--text)}
    .dsh-dn li span:nth-child(2){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dsh-dn li b{font:600 12px var(--mono);color:var(--ink)}
    .dsh-dn h4{font:600 10.5px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
    .dsh-eds{display:grid;gap:22px;grid-template-columns:1fr;margin-top:24px;padding-top:22px;border-top:1px solid var(--line)}
    @media(min-width:960px){.dsh-eds{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .dsh-ed-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
    .dsh-ed-h h3{font:600 12px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
    .dsh-ed-h h3 span{color:var(--muted);font-weight:500;margin-left:6px}
    .dsh-list{list-style:none;display:flex;flex-direction:column;border-top:1px solid var(--line)}
    .dsh-row{display:grid;grid-template-columns:10px minmax(0,1fr) auto auto;gap:4px 12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
    .dsh-row .m{min-width:0;display:flex;flex-direction:column;gap:2px}
    .dsh-row .m b{color:var(--ink);font-weight:600;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dsh-row .m small{font:500 10.5px/1.3 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dsh-row .v{font:600 14px var(--mono);color:var(--ink);text-align:right;white-space:nowrap}
    .dsh-row .v small{display:block;font-size:11px;font-weight:500;color:var(--muted)}
    .dsh-row .v small.hi{color:var(--down)}
    .dsh-row .a{display:flex;gap:2px}
    .dsh-row.conf{grid-template-columns:1fr}
    .dsh-li-form{padding:12px 0;border-bottom:1px solid var(--line)}
    .dsh-li-form .dsh-form{margin:0}
    .dsh-add{margin-top:12px}
    .dsh-ed-empty{font-size:13.5px;color:var(--muted);padding:14px 0;border-bottom:1px solid var(--line);line-height:1.5}

    /* household */
    .dsh-hh{list-style:none;display:flex;flex-direction:column;gap:12px}
    .dsh-mem{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:4px 12px;align-items:center}
    .dsh-av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font:600 15px var(--mono);color:var(--bg);background:var(--c);grid-row:span 2}
    .dsh-mem .n{min-width:0;color:var(--ink);font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dsh-mem .n small{font:500 10.5px var(--mono);color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-left:8px}
    .dsh-mem .inc{font:600 14px var(--mono);color:var(--ink);text-align:right;white-space:nowrap}
    .dsh-mem .bar{grid-column:2/4;display:flex;align-items:center;gap:10px}
    .dsh-mem .bar .dsh-bar{flex:1}
    .dsh-mem .bar span{font:500 11px var(--mono);color:var(--muted);min-width:36px;text-align:right}
    .dsh-stackbar{display:flex;height:12px;border-radius:99px;overflow:hidden;background:var(--line);gap:2px;margin:6px 0 16px}
    .dsh-stackbar i{display:block;height:100%;background:var(--c)}
    .dsh-sum{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-top:18px}
    .dsh-sum > div{background:var(--bg);padding:12px 14px;display:flex;flex-direction:column;gap:4px;min-width:0}
    .dsh-sum span{font:500 10px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .dsh-sum b{font:600 16px var(--mono);color:var(--ink);overflow-wrap:anywhere}

    /* investor profile */
    .dsh-arch{display:flex;gap:16px;align-items:center;padding:16px;border-radius:12px;background:radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--flame) 16%,transparent),transparent 60%),var(--bg);border:1px solid color-mix(in srgb,var(--flame) 35%,var(--line))}
    .dsh-arch-m{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:#000;border:1px solid color-mix(in srgb,var(--flame) 50%,transparent);box-shadow:0 0 28px -6px color-mix(in srgb,var(--flame) 70%,transparent);flex:0 0 64px}
    .dsh-arch-b{min-width:0;display:flex;flex-direction:column;gap:4px}
    .dsh-arch-b .nm{font-family:var(--display);font-size:clamp(30px,3vw,38px);line-height:.92;text-transform:uppercase;color:var(--gold)}
    .dsh-arch-b p{font-size:13.5px;color:color-mix(in srgb,var(--ink) 80%,transparent);line-height:1.45}
    .dsh-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
    .dsh-alloc{margin-top:14px}
    .dsh-alloc .dsh-stackbar{margin:6px 0 6px}
    .dsh-hist{list-style:none;display:flex;flex-direction:column;margin-top:12px;border-top:1px solid var(--line)}
    .dsh-hist li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:13.5px}
    .dsh-hist li .d{font:500 11.5px var(--mono);color:var(--muted);min-width:78px}
    .dsh-hist li .a{color:var(--ink);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dsh-hist li .r{font:600 12px var(--mono);color:var(--accent);white-space:nowrap}
    .dsh-pe{display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:18px;border:1px dashed var(--input);border-radius:12px}
    .dsh-pe p{color:color-mix(in srgb,var(--ink) 82%,transparent);font-size:14.5px;line-height:1.55}

    /* learning */
    .dsh-trks{display:grid;gap:16px;grid-template-columns:1fr}
    @media(min-width:900px){.dsh-trks{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .dsh-trk{display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--line);border-radius:10px;background:var(--bg);min-width:0}
    .dsh-trk-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
    .dsh-trk-h b{font-family:var(--display);font-weight:400;font-size:28px;line-height:.95;text-transform:uppercase;color:var(--ink)}
    .dsh-trk-h span{font:600 13px var(--mono);color:var(--up);white-space:nowrap}
    .dsh-trk .btn{justify-content:flex-start;white-space:normal;text-align:left;line-height:1.3;padding-block:8px;height:auto}
    .dsh-trk .btn span{overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    .dsh-trk details summary{cursor:pointer;font:600 10.5px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);padding:4px 0;list-style:none;display:flex;align-items:center;gap:6px}
    .dsh-trk details summary::-webkit-details-marker{display:none}
    .dsh-trk details summary::before{content:"+";font-size:13px;color:var(--accent);width:10px}
    .dsh-trk details[open] summary::before{content:"\\2212"}
    .dsh-crs{list-style:none;display:flex;flex-direction:column;gap:9px;margin-top:8px}
    .dsh-crs a{display:flex;flex-direction:column;gap:5px;text-decoration:none;color:inherit}
    .dsh-crs a > span{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--text)}
    .dsh-crs a > span em{font:500 11.5px var(--mono);font-style:normal;color:var(--muted);white-space:nowrap}
    .dsh-crs a:hover > span{color:var(--ink)}
    .dsh-crs a.full > span em{color:var(--up)}
    .dsh-recs{display:grid;gap:10px;grid-template-columns:1fr;margin-top:12px}
    @media(min-width:640px){.dsh-recs{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(min-width:1180px){.dsh-recs{grid-template-columns:repeat(4,minmax(0,1fr))}}
    .dsh-rec{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid var(--line);border-radius:10px;text-decoration:none;color:inherit;background:var(--bg);transition:border-color .15s,background-color .15s;min-width:0}
    .dsh-rec:hover{border-color:color-mix(in srgb,var(--accent) 55%,transparent);background:var(--surface-2)}
    .dsh-rec small{font:500 10.5px/1.35 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
    .dsh-rec b{color:var(--ink);font-size:15px;line-height:1.3;font-weight:600}
    .dsh-rec .more{margin-top:auto;font-size:13px}
    .dsh-subh{display:flex;align-items:center;gap:10px;margin-top:22px;font:600 11px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
    .dsh-subh::after{content:"";flex:1;height:1px;background:var(--line)}

    /* dates */
    .dsh-dates{list-style:none;display:flex;flex-direction:column;border-top:1px solid var(--line)}
    .dsh-dates li{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
    .dsh-day{display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:8px;padding:5px 0;background:var(--bg)}
    .dsh-day b{font-family:var(--display);font-weight:400;font-size:24px;line-height:.9;color:var(--ink)}
    .dsh-day small{font:600 9.5px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .dsh-dates .t{min-width:0;display:flex;flex-direction:column;gap:3px}
    .dsh-dates .t b{color:var(--ink);font-weight:600;font-size:14px;line-height:1.3}
    .dsh-dates .t small{display:block;font:500 11px/1.45 var(--mono);color:var(--muted);letter-spacing:.04em}
    .dsh-dates .t small .dsh-sw{display:inline-block;width:8px;height:8px;margin-right:6px;vertical-align:0}
    .dsh-dates .in{font:600 11px var(--mono);color:var(--muted);white-space:nowrap;letter-spacing:.06em}
    .dsh-dates .in.now{color:var(--accent)}

    /* apps */
    .dsh-apps{display:flex;gap:20px;align-items:center;overflow:hidden}
    .dsh-phone{flex:0 0 112px;height:196px;border-radius:22px;border:2px solid var(--input);background:#000;padding:10px 8px;position:relative;box-shadow:0 0 50px -16px color-mix(in srgb,var(--flame) 65%,transparent)}
    .dsh-phone::before{content:"";position:absolute;top:6px;left:50%;width:34px;height:5px;border-radius:9px;background:var(--line);transform:translateX(-50%)}
    .dsh-ph-s{height:100%;border-radius:14px;background:linear-gradient(180deg,#0e1424,#0b0f19);display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px 8px}
    .dsh-ph-s b{font-family:var(--display);font-weight:400;font-size:22px;color:var(--gold);line-height:1}
    .dsh-ph-s i{display:block;width:100%;height:5px;border-radius:9px;background:var(--line)}
    .dsh-ph-s i.f{background:linear-gradient(90deg,var(--gold),var(--flame));width:70%;align-self:flex-start}
    .dsh-ph-s i.g{background:var(--up);width:45%;align-self:flex-start}
    .dsh-apps-b{min-width:0;display:flex;flex-direction:column;gap:10px}
    .dsh-apps-b p:not(.dsh-k){font-size:14px;line-height:1.55;color:color-mix(in srgb,var(--ink) 80%,transparent)}
    @media(max-width:520px){.dsh-apps{flex-direction:column;align-items:flex-start}.dsh-phone{flex-basis:auto;width:92px;height:160px;border-radius:18px}.dsh-ph-s{padding-top:12px;gap:6px}}
  `);

  /* ---------------- charts ---------------- */
  function donut(items, total, size, top, bottom, label) {
    const cx = size / 2, r = size / 2 - 11, c = 2 * Math.PI * r, w = 15; let off = 0;
    let s = S.circle(cx, cx, r, 'nf s-line', ` stroke-width="${w}"`);
    const gap = items.length > 1 ? 2.5 : 0;
    items.forEach((it) => {
      const len = (it.v / total) * c, L = Math.max(0.5, len - gap);
      s += `<circle cx="${cx}" cy="${cx}" r="${r.toFixed(1)}" class="nf" style="stroke:${it.col}" stroke-width="${w}" stroke-dasharray="${L.toFixed(2)} ${(c - L).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})"><title>${esc(it.label)}: ${usd(it.v)}</title></circle>`;
      off += len;
    });
    s += S.text(cx, cx + 2, top, 'lg b ink mono', 'middle') + S.text(cx, cx + 18, bottom, 'xs mut mono', 'middle');
    return S.wrap(size, size, label, s);
  }

  function drawHistory(el, hist, W) {
    const H = W < 520 ? 190 : 230, L = 4, R = 58, T = 16, B = 26;
    const pts = hist.map((h) => ({ t: +parseISO(h.d), d: h.d, net: num(h.net), assets: num(h.assets), debts: num(h.debts) }));
    if (!pts.length) { el.innerHTML = ''; return; }
    let t0 = pts[0].t, t1 = pts[pts.length - 1].t; if (t1 - t0 < 864e5) { t0 -= 20 * 864e5; t1 += 20 * 864e5; }
    const lo0 = Math.min(0, ...pts.map((p) => p.net)), hi0 = Math.max(1, ...pts.map((p) => Math.max(p.net, p.assets)));
    const nk = nice(lo0, hi0, 4);
    const xf = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R), yf = (v) => T + (1 - (v - nk.lo) / (nk.hi - nk.lo)) * (H - T - B);
    let s = S.hgrid(nk.ticks.map(yf), L, W - R) + S.yaxis(nk.ticks, yf, W - R + 8, kfmt, 'xs mono mut');
    if (nk.lo < 0) s += S.line(L, yf(0), W - R, yf(0), 's-mut w1 dash');
    const netP = pts.map((p) => [xf(p.t), yf(p.net)]), asP = pts.map((p) => [xf(p.t), yf(p.assets)]);
    if (pts.length > 1) { s += S.area(netP, yf(Math.max(nk.lo, 0)), 'f-up-t'); s += S.poly(asP, 's-info w15 dash o70'); s += S.poly(netP, 's-up w25'); }
    const lp = pts[pts.length - 1], lx = xf(lp.t), ly = yf(lp.net);
    s += S.circle(lx, ly, 9, 'f-up-t') + S.circle(lx, ly, 4.5, 'f-up');
    const xl = pts.length > 1 ? [[pts[0].d, xf(pts[0].t), 'start'], [lp.d, xf(lp.t), 'end']] : [[lp.d, lx, 'middle']];
    xl.forEach(([d, x, a]) => { s += S.text(x, H - 6, mD(d) + ' ' + d.slice(0, 4), 'xs mono mut', a); });
    s += `<line class="s-mut w1 dash" data-g x1="0" x2="0" y1="${T}" y2="${H - B}" opacity="0"/><circle data-gc r="4" cx="0" cy="0" class="f-ink" opacity="0"/>`;
    el.innerHTML = S.wrap(W, H, 'Net worth over time: ' + pts.length + ' recorded days, latest ' + kfmt(lp.net), s) + '<div class="wg-tip" hidden></div>';
    const svg = $('svg', el), tip = $('.wg-tip', el), g = $('[data-g]', el), gc = $('[data-gc]', el);
    const hide = () => { tip.hidden = true; g.setAttribute('opacity', 0); gc.setAttribute('opacity', 0); };
    const move = (e) => {
      const r = svg.getBoundingClientRect(); const x = e.clientX - r.left;
      let best = pts[0], bd = 1e9; pts.forEach((p) => { const d = Math.abs(xf(p.t) - x); if (d < bd) { bd = d; best = p; } });
      const px = xf(best.t), py = yf(best.net);
      g.setAttribute('x1', px); g.setAttribute('x2', px); gc.setAttribute('cx', px); gc.setAttribute('cy', py); g.setAttribute('opacity', 1); gc.setAttribute('opacity', 1);
      tip.innerHTML = `${esc(longDate(best.d))}<br><b>Net ${kfmt(best.net)}</b><br>Assets ${kfmt(best.assets)} · Debts ${kfmt(best.debts)}`;
      tip.hidden = false; tip.style.left = clamp(px, 90, W - 90) + 'px'; tip.style.top = py + 'px';
    };
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', hide);
  }

  function drawRisk(el, sum, W) {
    const H = 196, L = 2, R = 2, T = 22, B = 24, LAB = 104;
    const pts = sum.filter((x) => x && x.date && isFinite(num(x.risk))).map((x) => ({ t: +parseISO(x.date), d: String(x.date).slice(0, 10), risk: clamp(num(x.risk), 0, 100), name: x.name || ARCH[x.archetype] || '' }));
    if (!pts.length) { el.innerHTML = ''; return; }
    let t0 = pts[0].t, t1 = pts[pts.length - 1].t; if (t1 - t0 < 864e5) { t0 -= 30 * 864e5; t1 += 30 * 864e5; }
    const x0 = L + 18, x1 = W - R - LAB - 14;
    const xf = (t) => x0 + ((t - t0) / (t1 - t0)) * (x1 - x0), yf = (v) => T + (1 - v / 100) * (H - T - B);
    let s = '';
    const lastR = pts[pts.length - 1].risk;
    RISK_BANDS.forEach(([a, b, lab], i) => {
      const on = lastR >= a && (lastR < b || b === 100);
      s += S.rect(L, yf(b), W - L - R, yf(a) - yf(b), i % 2 ? 'f-shade' : 'f-shade o50');
      s += S.text(W - R - 10, (yf(a) + yf(b)) / 2 + 4, lab.toUpperCase(), on ? 'cap acc' : 'cap', 'end');
      if (a > 0) s += S.line(L, yf(a), W - R, yf(a), 's-grid');
    });
    const P = pts.map((p) => [xf(p.t), yf(p.risk)]);
    if (pts.length > 1) s += S.poly(P, 's-acc w25');
    pts.forEach((p, i) => {
      const x = P[i][0], y = P[i][1];
      s += S.circle(x, y, 5.5, 'f-acc') + S.circle(x, y, 2.2, 'f-bg');
      if (pts.length <= 8 || i === pts.length - 1) s += S.text(x, y - 11, String(Math.round(p.risk)), 'sm b mono ink', 'middle');
    });
    const xl = pts.length > 1 ? [[pts[0].d, P[0][0], 'start'], [pts[pts.length - 1].d, P[P.length - 1][0], 'end']] : [[pts[0].d, P[0][0], 'middle']];
    xl.forEach(([d, x, a]) => { s += S.text(a === 'start' ? x - 6 : a === 'end' ? x + 6 : x, H - 6, mY(d), 'xs mono mut', a); });
    el.innerHTML = S.wrap(W, H, 'Risk score over time, 0 to 100. Latest ' + Math.round(pts[pts.length - 1].risk), s);
  }

  /* ---------------- the page ---------------- */
  SML.pages.dashboard = function (view) {
    const acc = SML.account;
    const hdr = (side) => SML.pageHeader('', 'Dashboard', greeting(), side);
    if (!acc) {
      view.innerHTML = hdr('<p>Your dashboard could not load in this view.</p>');
      return 'Dashboard';
    }
    const st = { goalForm: null, rowForm: null, confirm: null, celebrate: null, pending: false, latest: null, alive: true };
    const ros = [];
    const ret = () => clamp(num(SML.store.get('dashReturn', 5)), 0, 12);

    function greeting() {
      const nm = SML.account ? SML.account.displayName() : '';
      const h = new Date().getHours(); const g = h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
      return nm ? `${g}, <em>${esc(nm.split(' ')[0])}</em>` : `Your money <em>desk</em>`;
    }
    function statusLine() {
      const s = acc.status;
      if (!s.ready) return `<p class="dsh-st"><span class="dsh-chip"><i class="dsh-dot"></i>Checking your account</span><span>One moment.</span></p>`;
      if (s.mode === 'cloud') return `<p class="dsh-st"><span class="dsh-chip up"><i class="dsh-dot"></i>Saved to your account</span><span>Your private FiredBunny profile. Other visitors and the site owner can't read it.</span></p>`;
      const why = s.signedIn && s.cloudError ? ' Your account can only view this page, so changes stay here.' : '';
      return `<p class="dsh-st"><span class="dsh-chip acc"><i class="dsh-dot"></i>Saved in this browser only</span><span>Anyone using this browser can see it, so on a shared computer delete it from <a href="#settings">Settings</a> when you're done. Export a file to move it.${why}${s.signedIn || SML.host === 'web' ? '' : ' <a href="#signin">Sign in</a> to keep it in your account.'}</span></p>`;
    }
    const owner = !!(acc.status.isOwner && SML.widgets && SML.widgets.feedbackInbox);
    view.innerHTML = hdr(`<p>Goals, net worth, household, investor profile and lessons in one place. Numbers change when you change them, never on their own.</p>${statusLine()}`) +
      `<div class="dsh" id="dsh"><div class="wrap dsh-stack"><div class="dsh-stack" id="dsh-body"></div>${owner ? `<section class="dsh-card" aria-labelledby="dsh-fb-h"><div class="dsh-h"><div><p class="dsh-k">${SML.flame ? SML.flame(13) : ''}Owner only</p><h2 id="dsh-fb-h">Feedback inbox</h2><p class="dsh-sub">Messages people sent from the About page. Only you see this section.</p></div></div>${SML.widgetHTML('feedbackInbox')}</section>` : ''}</div></div>`;
    const root = $('#dsh', view), body = $('#dsh-body', view);

    /* ----- derived numbers ----- */
    function ctx() {
      const p = acc.get(); const nw = acc.netWorth(p); const income = acc.householdIncome(p);
      const r = ret(); const goals = p.goals.map((g) => ({ g, c: goalCalc(g, nw, r) }));
      return { p, nw, income, r, goals, latest: st.latest, done: new Set(SML.progress ? SML.progress.list() : []) };
    }
    function goalCurrent(g, nw) { return g.source === 'networth' ? nw.net : g.source === 'investable' ? nw.investable : g.source === 'cash' ? nw.cash : num(g.current); }
    function goalCalc(g, nw, retPct) {
      const live = goalCurrent(g, nw), target = Math.max(0, num(g.target));
      const cur = g.done ? Math.max(live, target) : live; // marked reached: show it full
      const pct = g.done ? 1 : target ? clamp(cur / target, 0, 1) : 0;
      const reached = !!g.done || (target > 0 && cur >= target);
      const grows = !(g.noGrowth || g.type === 'debt' || g.type === 'emergency' || g.type === 'house' || g.source === 'cash');
      const i = grows ? retPct / 100 / 12 : 0;
      const months = g.deadline ? monthsTo(g.deadline) : null; const monthly = num(g.monthly);
      // At or past the target age (FIXES item 10): track whether withdrawals last, not a saving pace.
      const L = st.latest && st.latest.goals;
      if (!g.done && !g.noGrowth && (g.type === 'fire' || g.type === 'retire') && (g.retired || (L && L.retired))) {
        const wr = L && L.withdrawalRate != null && L.withdrawalRate !== '' && isFinite(Number(L.withdrawalRate)) ? Number(L.withdrawalRate) : null;
        return { cur, target, pct, reached, grows: false, rate: 0, months, monthly, need: null, proj: null, onTrack: wr != null ? wr <= 4 : reached ? true : null, past: false, retired: true, wr };
      }
      let need = null, proj = null, onTrack = null, past = false;
      if (!reached && months != null) {
        if (months <= 0) { past = true; need = Math.max(0, target - cur); onTrack = false; } else {
          const n = Math.max(1, months), gf = Math.pow(1 + i, n), fvCur = cur * gf, rem = target - fvCur;
          need = rem <= 0 ? 0 : i ? (rem * i) / (gf - 1) : rem / n;
          if (monthly > 0) { proj = fvCur + (i ? (monthly * (gf - 1)) / i : monthly * n); onTrack = proj >= target; } else if (rem <= 0) onTrack = true;
        }
      }
      return { cur, target, pct, reached, grows, rate: grows ? retPct : 0, months, monthly, need, proj, onTrack, past };
    }
    const formOpen = () => !!(st.goalForm || st.rowForm);

    /* ----- sections ----- */
    function migration() {
      if (!acc.status.localPending) return '';
      const loc = SML.store.get('profile', null) || {}; const n = (k) => (Array.isArray(loc[k]) ? loc[k].length : 0);
      const parts = []; const g = n('goals'), a = n('assets') + n('debts'), h = n('household'), l = (SML.store.get('done', []) || []).length, q = (SML.store.get('assessments', []) || []).length;
      if (g) parts.push(g + (g === 1 ? ' goal' : ' goals')); if (a) parts.push(a + (a === 1 ? ' asset or debt' : ' assets and debts')); if (h) parts.push(h + (h === 1 ? ' family member' : ' family members')); if (q) parts.push(q + (q === 1 ? ' self-assessment' : ' self-assessments')); if (l) parts.push(l + (l === 1 ? ' finished lesson' : ' finished lessons'));
      return `<div class="dsh-mig" role="region" aria-label="Move this browser's data into your account"><div>${SML.bunnyMark ? SML.bunnyMark(30) : ''}<p><b>This browser has FiredBunny data from before you signed in</b>${parts.length ? ': ' + parts.join(', ') : ''}. Move it into your account? It is added to your account and removed from this browser. Not now keeps it here.</p></div><div class="dsh-acts"><button type="button" class="btn btn-p sm" data-act="migrate">Move this browser's data into your account</button><button type="button" class="btn btn-g sm" data-act="migrate-no">Not now</button></div></div>`;
    }
    function isEmpty(p) { return !p.assets.length && !p.debts.length && !p.goals.length && !p.household.length && !p.assessmentSummary.length; }
    function emptyHero(c) {
      const l = c.done.size;
      return `<section class="dsh-card dsh-empty" aria-labelledby="dsh-e-h">
        <div class="dsh-art">${SML.brandArt ? `<img src="${SML.brandArt}" alt="The FiredBunny: a white bunny in orange sunglasses lounging beside rising candles">` : ''}</div>
        <div class="dsh-empty-b">
          <p class="dsh-k">${SML.flame ? SML.flame(13) : ''}Fresh burrow</p>
          <h2 class="dsh-h2" id="dsh-e-h">Nothing here yet. Let's fix that.</h2>
          <p>This page tracks the things that buy your freedom: what you own, what you owe, the goals you are chasing and how you grow as an investor.${l ? ` You have already finished ${l} ${l === 1 ? 'lesson' : 'lessons'}, nice.` : ''}</p>
          ${SML.bunnyTip ? SML.bunnyTip('Start with the self-assessment. About 7 minutes of sliders gives you an investor profile, a FIRE number and goals you can track right here.') : ''}
          <div class="dsh-start">
            <a class="go" href="#assessment"><span class="n">01 · 7 min</span><b>Take the self-assessment</b><small>Find your investor profile and risk level.</small></a>
            <button type="button" data-act="asset-new"><span class="n">02</span><b>Add what you own</b><small>Accounts, home, cash. Debts too.</small></button>
            <button type="button" data-act="goal-new"><span class="n">03</span><b>Set your first goal</b><small>Emergency fund, FIRE number, a house.</small></button>
          </div>
        </div></section>`;
    }
    function kpis(c) {
      const { p, nw, income, goals } = c;
      const hist = p.netWorthHistory || []; const prev = hist.filter((h) => h.d < todayUTC()).slice(-1)[0];
      const delta = prev ? nw.net - num(prev.net) : null;
      const nwSub = delta != null && (p.assets.length || p.debts.length) ? `<span class="dsh-ks ${delta >= 0 ? 'up' : 'dn'}">${delta >= 0 ? '+' : MINUS}${kfmt(Math.abs(delta)).replace(MINUS, '')} since ${mD(prev.d)}</span>` : `<span class="dsh-ks">${p.assets.length || p.debts.length ? `Assets ${kfmt(nw.assets)} · debts ${kfmt(nw.debts)}` : '<a href="#dsh-nw-h" data-act="asset-new">Add your first asset</a>'}</span>`;
      const earners = p.household.filter((m) => num(m.income) > 0).length;
      const incSub = p.household.length ? `${earners} ${earners === 1 ? 'earner' : 'earners'} · ${p.household.length} ${p.household.length === 1 ? 'person' : 'people'}` : '<a href="#profile">Add your household</a>';
      // Savings rate = monthly saving / (saving + spending): the share of take-home pay you save (shared rule, FIXES item 4).
      let sr = null; const li = c.latest && c.latest.inputs;
      if (li && li.savingsMonth != null && li.savingsMonth !== '') {
        const sv = Math.max(0, num(li.savingsMonth)), sp = Math.max(0, num(li.spendMonth != null && li.spendMonth !== '' ? li.spendMonth : p.monthlySpend));
        if (sv + sp > 0) sr = sv / (sv + sp);
      }
      const ok = goals.filter((x) => x.c.reached || x.c.onTrack).length;
      const total = TRACKS().reduce((s, t) => s + lessonsOfTrack(t.id).length, 0); const doneN = SML.progress ? SML.progress.count() : 0;
      const last = p.assessmentSummary.length ? p.assessmentSummary[p.assessmentSummary.length - 1] : null;
      const tile = (l, v, sub, cls) => `<div class="dsh-kpi${cls ? ' ' + cls : ''}"><span class="dsh-kl">${l}</span>${v}${sub}</div>`;
      return `<section class="dsh-kpis" aria-label="Key numbers">
        ${tile('Net worth', `<b class="dsh-kv">${kfmt(nw.net)}</b>`, nwSub, 'fl')}
        ${tile('Household income', `<b class="dsh-kv">${income ? kfmt(income) : '—'}${income ? '<small>/yr</small>' : ''}</b>`, `<span class="dsh-ks">${incSub}</span>`)}
        ${tile('Savings rate', `<b class="dsh-kv">${sr == null ? '—' : Math.round(sr * 100) + '%'}</b>`, `<span class="dsh-ks">${sr == null ? '<a href="#assessment">Take the self-assessment</a> to see it' : 'Share of take-home pay you save'}</span>`)}
        ${tile('Goals on track', `<b class="dsh-kv">${goals.length ? ok + '<small>of ' + goals.length + '</small>' : '—'}</b>`, `<span class="dsh-ks">${goals.length ? 'On pace or reached' : '<a href="#dsh-goals-h" data-act="goal-new">Set a goal</a>'}</span>`)}
        ${tile('Lessons done', `<b class="dsh-kv">${doneN}<small>of ${total}</small></b>`, `<div class="dsh-bar sm" role="progressbar" aria-label="${doneN} of ${total} lessons done" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${doneN}"><i style="--w:${total ? (doneN / total) * 100 : 0}%"></i></div>`)}
        ${tile('Investor profile', `<b class="dsh-kv nm">${last ? esc(last.name || ARCH[last.archetype] || 'See results') : 'Not yet'}</b>`, `<span class="dsh-ks">${last ? `Risk ${Math.round(num(last.risk))} of 100${last.profile && PROFILE[last.profile] ? ' · ' + PROFILE[last.profile] : ''}` : '<a href="#assessment">Take the self-assessment</a>'}</span>`)}
      </section>`;
    }

    /* goals */
    function goalCard(x) {
      const { g, c } = x; const col = GOAL_COL[g.type] || GOAL_COL.custom;
      const editing = st.goalForm && st.goalForm.id === g.id; const confirm = st.confirm === 'goal:' + g.id;
      let badge;
      if (g.done) badge = `<span class="dsh-badge fl">${I(ICON.check, 12)}Reached</span>`;
      else if (c.retired) badge = c.wr != null ? (c.wr <= 4 ? `<span class="dsh-badge up">Within 4% rule</span>` : `<span class="dsh-badge dn">Withdrawals high</span>`) : `<span class="dsh-badge">Drawing down</span>`;
      else if (c.reached) badge = `<span class="dsh-badge fl">Target hit</span>`;
      else if (c.past) badge = `<span class="dsh-badge dn">Deadline passed</span>`;
      else if (c.onTrack === true) badge = `<span class="dsh-badge up">On track</span>`;
      else if (c.onTrack === false) badge = `<span class="dsh-badge dn">Behind</span>`;
      else badge = `<span class="dsh-badge">No pace yet</span>`;
      const facts = [];
      facts.push(['Deadline', g.deadline ? `${mY(g.deadline)}<small>${c.months > 0 ? left(c.months) + ' left' : 'passed'}</small>` : '—<small>not set</small>']);
      if (c.retired) facts.push(['Withdrawals', c.wr != null ? `${c.wr.toFixed(1)}%/yr<small>vs a 4% rule of thumb</small>` : '—<small>retake the assessment</small>']);
      else facts.push(['Needed', c.reached ? '—<small>done</small>' : c.need == null ? '—<small>add a deadline</small>' : c.past ? `${kfmt(c.need)}<small>still to go</small>` : `${usd(Math.ceil(c.need))}/mo<small>${c.grows ? 'at ' + c.rate + '% after inflation' : 'no growth assumed'}</small>`]);
      facts.push(['You put in', c.monthly > 0 ? `${usd(c.monthly)}/mo<small>${SRC_SHORT[g.source] || ''}</small>` : '—<small>not set</small>']);
      let msg = '';
      if (g.done) msg = `<p class="dsh-g-msg">Reached ${esc(longDate(g.done === true ? (g.created || todayLocal()) : g.done))}. That is real freedom you bought.</p>`;
      else if (c.retired) msg = `<p class="dsh-g-msg${c.wr != null && c.wr > 4 ? ' dn' : ''}">You are at or past your target age, so this tracks whether withdrawals can last, not a saving pace.${c.wr != null ? (c.wr <= 4 ? ' Yours sit within the 4% rule of thumb.' : ` Yours are <b>${c.wr.toFixed(1)}%</b> a year, above the 4% rule of thumb: spending a little less or adding other income helps.`) : ''}</p>`;
      else if (c.reached) msg = `<p class="dsh-g-msg">You are at or past the target. Mark it reached to celebrate.</p>`;
      else if (c.onTrack === false && c.proj != null) msg = `<p class="dsh-g-msg dn">At ${usd(c.monthly)}/mo you reach about <b>${kfmt(c.proj)}</b>, short by ${kfmt(c.target - c.proj)}. Add ${usd(Math.ceil(c.need - c.monthly))}/mo or push the date.</p>`;
      else if (c.onTrack === true && c.proj != null) msg = `<p class="dsh-g-msg">On pace for about <b>${kfmt(c.proj)}</b> by ${mY(g.deadline)}.</p>`;
      else if (c.need === 0) msg = `<p class="dsh-g-msg">Growth alone gets you there at ${c.rate}% a year after inflation. Keep it invested.</p>`;
      if (g.tpl === 'roth' && !g.done) msg += `<p class="dsh-g-msg">${rothHint()}</p>`;
      const les = GOAL_LESSON[g.type] && lessonById(GOAL_LESSON[g.type]);
      const acts = confirm
        ? `<div class="dsh-confirm"><b>Delete this goal?</b><button type="button" class="btn btn-dn sm" data-act="confirm-yes" data-kind="goal" data-id="${esc(g.id)}">Delete</button><button type="button" class="btn btn-g sm" data-act="confirm-no">Keep</button></div>`
        : `<div class="dsh-g-act">${g.done ? `<button type="button" class="btn btn-g sm" data-act="goal-undo" data-id="${esc(g.id)}">Undo reached</button>` : `<button type="button" class="btn ${c.reached ? 'btn-p' : 'btn-g'} sm" data-act="goal-done" data-id="${esc(g.id)}">${I(ICON.check, 14)}Mark reached</button>`}
            ${les ? `<a class="dsh-link" href="#${les.id}" style="font-size:13px">Lesson</a>` : ''}<span class="sp"></span>
            <button type="button" class="dsh-ib" data-act="goal-edit" data-id="${esc(g.id)}" aria-label="Edit ${esc(g.title)}" title="Edit">${I(ICON.edit, 16)}</button>
            <button type="button" class="dsh-ib dn" data-act="goal-del" data-id="${esc(g.id)}" aria-label="Delete ${esc(g.title)}" title="Delete">${I(ICON.trash, 16)}</button></div>`;
      return `<article class="dsh-goal${g.done ? ' done' : ''}${editing ? ' editing' : ''}" data-gid="${esc(g.id)}" style="--c:${col}">
        <div class="dsh-g-top"><span class="dsh-g-ic" aria-hidden="true">${I(ICON[g.type] || ICON.custom, 19)}</span><div class="dsh-g-t"><h3>${esc(g.title || GOAL_LABEL[g.type] || 'Goal')}</h3><p>${esc(GOAL_LABEL[g.type] || 'Custom')} · ${esc(SRC_SHORT[g.source] || 'updated by you')}</p></div>${badge}</div>
        <div><div class="dsh-g-nums"><b>${kfmt(c.cur)}</b><span>of ${kfmt(c.target)}</span><em>${Math.round(c.pct * 100)}%</em></div>
        <div class="dsh-bar" style="margin-top:10px" role="progressbar" aria-label="${esc(g.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(c.pct * 100)}"><i style="--w:${(c.pct * 100).toFixed(1)}%;--c:${col}"></i></div></div>
        <ul class="dsh-facts">${facts.map(([a, b]) => `<li><span>${a}</span><b>${b}</b></li>`).join('')}</ul>
        ${msg}${acts}</article>`;
    }
    function goalForm(c) {
      const f = st.goalForm; if (!f) return '';
      const g = f.id ? c.p.goals.find((x) => x.id === f.id) || {} : f.draft || {};
      const src = g.source || 'manual', type = g.type || 'custom';
      const opt = (list, v) => list.map(([k, l]) => `<option value="${k}"${k === v ? ' selected' : ''}>${esc(l)}</option>`).join('');
      const nowV = goalCurrent({ source: src, current: g.current }, c.nw);
      return `<form class="dsh-form" data-form="goal" data-id="${esc(f.id || '')}" novalidate>
        <div class="dsh-form-h"><b>${f.id ? 'Edit goal' : 'New goal'}</b>${f.id ? '' : `<div class="dsh-tpls"><span>Quick start</span>${[['emergency', 'Emergency fund'], ['fire', 'FIRE number'], ['house', 'House down payment'], ['debt', 'Pay off card debt'], ['roth', 'Max a Roth IRA']].map(([k, l]) => `<button type="button" class="chip" data-act="goal-tpl" data-t="${k}">${l}</button>`).join('')}</div>`}</div>
        <div class="dsh-fgrid g4">
          <label class="fld wide2"><span>Goal name</span><input name="title" type="text" maxlength="60" autocomplete="off" value="${esc(g.title || '')}" placeholder="${esc(GOAL_LABEL[type])}"></label>
          <label class="fld"><span>Type</span><select name="type">${opt(GOAL_TYPES, type)}</select></label>
          <label class="fld"><span>Target ($)</span><input name="target" type="text" inputmode="decimal" autocomplete="off" value="${g.target ? Math.round(num(g.target)) : ''}" placeholder="25000"></label>
          <label class="fld wide2"><span>Track progress from</span><select name="source">${opt(SOURCES, src)}</select></label>
          <label class="fld" data-cur${src === 'manual' ? '' : ' hidden'}><span>Saved so far ($)</span><input name="current" type="text" inputmode="decimal" autocomplete="off" value="${g.current ? Math.round(num(g.current)) : ''}" placeholder="0"></label>
          <div class="dsh-cur" data-curnote${src === 'manual' ? ' hidden' : ''}><span class="ctl-lab">Right now</span><b data-curv>${usd(nowV)}</b></div>
          <label class="fld"><span>Deadline</span><input name="deadline" type="date" value="${esc(g.deadline || '')}"></label>
          <label class="fld"><span>You put in each month ($)</span><input name="monthly" type="text" inputmode="decimal" autocomplete="off" value="${g.monthly ? Math.round(num(g.monthly)) : ''}" placeholder="optional"></label>
        </div>
        <input type="hidden" name="tpl" value="${esc(g.tpl || '')}"><input type="hidden" name="retired" value="${g.retired ? '1' : ''}">
        <p class="dsh-note" data-tplnote${g.tpl === 'roth' ? '' : ' hidden'}>${rothHint()}</p>
        <p class="dsh-note">Progress from net worth, investable money or cash updates by itself as you edit your assets below. Short-term goals (emergency fund, house, debt, cash) assume no growth.</p>
        <p class="dsh-err" data-err hidden></p>
        <div class="dsh-form-act"><button type="submit" class="btn btn-p sm">Save goal</button><button type="button" class="btn btn-g sm" data-act="form-cancel">Cancel</button></div>
      </form>`;
    }
    function goalList(c) {
      if (!c.goals.length) return st.goalForm ? '' : `<div class="dsh-gempty"><p class="dsh-note">No goals yet. A goal with a date and a monthly amount tells you, every time you look, if you are on pace.</p><div class="dsh-tpls"><span>Start with</span>${[['emergency', 'Emergency fund'], ['fire', 'FIRE number'], ['house', 'House down payment'], ['debt', 'Pay off card debt'], ['roth', 'Max a Roth IRA']].map(([k, l]) => `<button type="button" class="chip" data-act="goal-new" data-t="${k}">${l}</button>`).join('')}</div></div>`;
      const sorted = c.goals.slice().sort((a, b) => (!!a.g.done - !!b.g.done) || String(a.g.deadline || '9999').localeCompare(String(b.g.deadline || '9999')));
      return `<div class="dsh-goals">${sorted.map(goalCard).join('')}</div>`;
    }
    function goalsSec(c) {
      const r = c.r;
      return `<section class="dsh-card" aria-labelledby="dsh-goals-h">
        <div class="dsh-h"><div><p class="dsh-k">Goals</p><h2 id="dsh-goals-h">How close you are</h2><p class="dsh-sub">Each goal shows the monthly amount you need to hit it on time, in today's dollars. Long-term goals assume the yearly return after inflation you pick here.</p></div>
          <div class="dsh-acts" style="align-items:flex-end;gap:14px">
            <div class="dsh-ret"><span class="ctl-top"><span class="ctl-lab">Assumed return after inflation</span><output class="ctl-val" id="dsh-ret-o" for="dsh-ret">${r}% / yr</output></span><input type="range" id="dsh-ret" min="0" max="12" step="0.5" value="${r}" aria-label="Assumed yearly return after inflation for long-term goals"></div>
            ${st.goalForm ? '' : `<button type="button" class="btn btn-p sm" data-act="goal-new">${I(ICON.plus, 15)}Add goal</button>`}
          </div></div>
        <div id="dsh-goal-form">${goalForm(c)}</div>
        <div id="dsh-goal-list">${goalList(c)}</div>
      </section>`;
    }

    /* net worth */
    function rowForm(kind, item, c) {
      const types = kind === 'asset' ? acc.assetTypes : acc.debtTypes;
      const opt = (list, v) => list.map(([k, l]) => `<option value="${esc(k)}"${k === v ? ' selected' : ''}>${esc(l)}</option>`).join('');
      const owners = [['', 'Household (shared)']].concat(c.p.household.map((m) => [m.id, m.name || REL[m.relation] || 'Member']));
      const it = item || {};
      return `<form class="dsh-form" data-form="${kind}" data-id="${esc(it.id || '')}" novalidate>
        <div class="dsh-form-h"><b>${it.id ? 'Edit' : 'New'} ${kind === 'asset' ? 'asset' : 'debt'}</b></div>
        <div class="dsh-fgrid">
          <label class="fld wide"><span>Name</span><input name="name" type="text" maxlength="60" autocomplete="off" value="${esc(it.name || '')}" placeholder="${kind === 'asset' ? 'Fidelity 401(k)' : 'Chase Sapphire'}"></label>
          <label class="fld"><span>Type</span><select name="type">${opt(types, it.type || (kind === 'asset' ? 'cash' : 'card'))}</select></label>
          <label class="fld"><span>Owner</span><select name="owner">${opt(owners, it.owner || '')}</select></label>
          <label class="fld"><span>${kind === 'asset' ? 'Value' : 'Balance'} ($)</span><input name="amount" type="text" inputmode="decimal" autocomplete="off" value="${kind === 'asset' ? (it.value != null && it.value !== '' ? Math.round(num(it.value)) : '') : (it.balance != null && it.balance !== '' ? Math.round(num(it.balance)) : '')}" placeholder="0"></label>
          ${kind === 'debt' ? `<label class="fld"><span>Interest rate (% a year)</span><input name="rate" type="text" inputmode="decimal" autocomplete="off" value="${it.rate != null && it.rate !== '' ? num(it.rate) : ''}" placeholder="e.g. 24.9"></label>` : ''}
        </div>
        ${c.p.household.length ? '' : `<p class="dsh-note">Want to split by person? Add family members on your <a class="dsh-link" href="#profile">profile</a>.</p>`}
        <p class="dsh-err" data-err hidden></p>
        <div class="dsh-form-act"><button type="submit" class="btn btn-p sm">Save</button><button type="button" class="btn btn-g sm" data-act="form-cancel">Cancel</button></div>
      </form>`;
    }
    function editor(kind, c) {
      const list = kind === 'asset' ? c.p.assets : c.p.debts; const types = kind === 'asset' ? acc.assetTypes : acc.debtTypes; const COL = kind === 'asset' ? ACOL : DCOL;
      const ownerName = (id) => { if (!id) return 'Household'; const m = c.p.household.find((x) => x.id === id); return m ? m.name || REL[m.relation] || 'Member' : 'Household'; };
      const val = (it) => num(kind === 'asset' ? it.value : it.balance);
      const sorted = list.slice().sort((a, b) => val(b) - val(a));
      const total = sorted.reduce((s, it) => s + val(it), 0);
      const rows = sorted.map((it) => {
        if (st.rowForm && st.rowForm.kind === kind && st.rowForm.id === it.id) return `<li class="dsh-li-form">${rowForm(kind, it, c)}</li>`;
        if (st.confirm === kind + ':' + it.id) return `<li class="dsh-row conf"><div class="dsh-confirm"><b>Delete ${esc(it.name || typeLabel(types, it.type))}?</b><button type="button" class="btn btn-dn sm" data-act="confirm-yes" data-kind="${kind}" data-id="${esc(it.id)}">Delete</button><button type="button" class="btn btn-g sm" data-act="confirm-no">Keep</button></div></li>`;
        const nm = it.name || typeLabel(types, it.type); const hi = kind === 'debt' && num(it.rate) >= 8;
        return `<li class="dsh-row"><span class="dsh-sw" style="--c:${COL[it.type] || COL.other}"></span><div class="m"><b>${esc(nm)}</b><small>${esc(typeLabel(types, it.type))} · ${esc(ownerName(it.owner))}</small></div>
          <div class="v">${kind === 'debt' ? MINUS : ''}${usd(val(it))}${kind === 'debt' && it.rate !== '' && it.rate != null ? `<small class="${hi ? 'hi' : ''}">${num(it.rate)}% APR</small>` : it.updated ? `<small>${esc(mD(it.updated))}</small>` : ''}</div>
          <div class="a"><button type="button" class="dsh-ib" data-act="${kind}-edit" data-id="${esc(it.id)}" aria-label="Edit ${esc(nm)}" title="Edit">${I(ICON.edit, 16)}</button><button type="button" class="dsh-ib dn" data-act="${kind}-del" data-id="${esc(it.id)}" aria-label="Delete ${esc(nm)}" title="Delete">${I(ICON.trash, 16)}</button></div></li>`;
      }).join('');
      const adding = st.rowForm && st.rowForm.kind === kind && !st.rowForm.id;
      return `<div><div class="dsh-ed-h"><h3>${kind === 'asset' ? 'What you own' : 'What you owe'}<span>${list.length ? usd(total) : ''}</span></h3></div>
        <ul class="dsh-list">${rows || (adding ? '' : `<li class="dsh-ed-empty">${kind === 'asset' ? 'Add cash, retirement and brokerage accounts, your home, a car. Rough values are fine.' : 'No debts listed. If you have a card balance, student loan, car loan or mortgage, add it here.'}</li>`)}
        ${adding ? `<li class="dsh-li-form">${rowForm(kind, null, c)}</li>` : ''}</ul>
        ${adding ? '' : `<button type="button" class="btn btn-g sm dsh-add" data-act="${kind}-new">${I(ICON.plus, 15)}Add ${kind === 'asset' ? 'an asset' : 'a debt'}</button>`}</div>`;
    }
    function netSec(c) {
      const { p, nw } = c; const has = p.assets.length || p.debts.length;
      const hist = p.netWorthHistory || [];
      const spend = num(p.monthlySpend) || (c.latest && c.latest.inputs ? num(c.latest.inputs.spendMonth) : 0);
      const interest = p.debts.reduce((s, d) => s + num(d.balance) * num(d.rate) / 100, 0);
      const hiDebt = p.debts.filter((d) => num(d.rate) >= 8 && num(d.balance) > 0).sort((a, b) => num(b.rate) - num(a.rate));
      const ins = [];
      if (spend > 0 && has) ins.push(`<span>Cash covers <b>${(nw.cash / spend).toFixed(1)} months</b> of spending</span>`);
      if (has) ins.push(`<span>Investable <b>${kfmt(nw.investable)}</b></span>`);
      if (interest > 0) ins.push(`<span class="${hiDebt.length ? 'dn' : ''}">Debt interest about <b>${kfmt(interest)}/yr</b></span>`);
      const donutBlock = (title, byType, list, COL, total, center) => {
        const items = list.filter(([k]) => byType[k] > 0).map(([k, l]) => ({ k, label: l, v: byType[k], col: COL[k] || COL.other })).sort((a, b) => b.v - a.v);
        if (!items.length) return '';
        return `<div class="dsh-dn">${donut(items, total, 148, kfmt(total), center, title + ' by type')}<ul><li style="display:block"><h4>${title}</h4></li>${items.map((it) => `<li><span class="dsh-sw" style="--c:${it.col}"></span><span title="${esc(it.label)}">${esc(it.label)}</span><b>${Math.round((it.v / total) * 100)}%</b></li>`).join('')}</ul></div>`;
      };
      const card = hiDebt.length ? (lessonById('l-card-debt') ? 'l-card-debt' : null) : null;
      return `<section class="dsh-card" aria-labelledby="dsh-nw-h">
        <div class="dsh-h"><div><p class="dsh-k">Net worth</p><h2 id="dsh-nw-h">What you own minus what you owe</h2><p class="dsh-sub">Edit an asset or debt and today's point on the chart updates. Record a day any time to mark it.</p></div>
          ${has ? `<div class="dsh-acts"><button type="button" class="btn btn-g sm" data-act="record">${I(ICON.cam, 15)}Record today</button></div>` : ''}</div>
        ${has ? `<div class="dsh-nw"><div style="min-width:0">
            <div class="dsh-big"><div><span class="v${nw.net < 0 ? ' neg' : ''}">${nw.net < 0 ? MINUS : ''}${usd(Math.abs(nw.net))}</span></div><div><span class="s">Assets <b>${usd(nw.assets)}</b></span><span class="s">Debts <b>${usd(nw.debts)}</b></span></div></div>
            ${ins.length ? `<div class="dsh-ins">${ins.join('')}</div>` : ''}
            ${hist.length ? `<div class="dsh-fig" id="dsh-hist"></div><div class="dsh-leg"><span><i style="--c:var(--up)"></i>Net worth</span><span><i class="d" style="--c:var(--info)"></i>Assets</span><span>${hist.length} recorded ${hist.length === 1 ? 'day' : 'days'}</span></div>${hist.length < 2 ? `<p class="dsh-note" style="margin-top:6px">One point so far. Come back next month and record again to see the line.</p>` : ''}` : `<div class="dsh-hint">No history yet. Press <b>Record today</b> to start your net worth line. One point a month is plenty.</div>`}
          </div>
          <div class="dsh-donuts">${donutBlock('Assets', nw.byType, acc.assetTypes, ACOL, nw.assets, 'assets')}${donutBlock('Debts', nw.debtByType, acc.debtTypes, DCOL, nw.debts, 'debts')}
            ${hiDebt.length ? `<div class="callout dn" style="max-width:none"><p>Your ${esc(hiDebt[0].name || 'debt')} charges <b>${num(hiDebt[0].rate)}%</b> a year. Every dollar you pay off saves that interest, ${num(hiDebt[0].rate) >= 10 ? "which beats the stock market's long-run average" : 'comparable to what stocks have returned over the long run'}.${card ? ` <a class="dsh-link" href="#${card}">How to kill card debt</a>` : ''}</p></div>` : ''}</div>
        </div>` : ''}
        <div class="dsh-eds"${has ? '' : ' style="margin-top:0;padding-top:0;border-top:0"'}>${editor('asset', c)}${editor('debt', c)}</div>
      </section>`;
    }

    /* household */
    function householdSec(c) {
      const { p, income } = c; const yr = new Date().getFullYear();
      const head = `<div class="dsh-h"><div><p class="dsh-k">Household</p><h2 id="dsh-hh-h">Who shares the money</h2></div><a class="more" href="#profile">Edit on your profile${arrow}</a></div>`;
      if (!p.household.length) {
        return `<section class="dsh-card" aria-labelledby="dsh-hh-h">${head}<div class="dsh-pe"><p>Add the people who share your money: a partner's income, kids you are saving for, a parent you help. Goals and net worth can then be split by person.</p><a class="btn btn-g sm" href="#profile">${I(ICON.plus, 15)}Add family members</a></div></section>`;
      }
      const mems = p.household.map((m, i) => ({ m, col: MEMBER_COL[i % MEMBER_COL.length], inc: num(m.income) }));
      const earners = mems.filter((x) => x.inc > 0);
      const owned = (id) => p.assets.filter((a) => a.owner === id).reduce((s, a) => s + num(a.value), 0);
      const me = p.household.find((m) => m.relation === 'self'); const by = num(p.birthYear) || (me && num(me.birthYear)) || 0;
      const age = by ? yr - by : null; const ra = num(p.retireAge);
      const spend = num(p.monthlySpend);
      const ownSplit = () => {
        const nw = c.nw; if (!(nw.assets > 0)) return '';
        const rows = mems.map((x) => ({ name: x.m.name || REL[x.m.relation] || 'Member', col: x.col, v: owned(x.m.id) })).filter((x) => x.v > 0);
        const shared = p.assets.filter((a) => !a.owner || !p.household.some((m) => m.id === a.owner)).reduce((s, a) => s + num(a.value), 0);
        if (shared > 0) rows.push({ name: 'Shared', col: 'var(--muted)', v: shared });
        if (!rows.length) return '';
        return `<p class="dsh-subh">Who owns what</p><div class="dsh-stackbar" role="img" aria-label="Assets by owner">${rows.map((x) => `<i style="--c:${x.col};width:${((x.v / nw.assets) * 100).toFixed(1)}%" title="${esc(x.name)}"></i>`).join('')}</div><div class="dsh-leg" style="margin-top:0">${rows.map((x) => `<span><span class="dsh-sw" style="--c:${x.col}"></span>${esc(x.name)} ${kfmt(x.v)}</span>`).join('')}</div>`;
      };
      return `<section class="dsh-card" aria-labelledby="dsh-hh-h">${head}
        ${income > 0 && earners.length > 1 ? `<div class="dsh-stackbar" role="img" aria-label="Income share by person">${earners.map((x) => `<i style="--c:${x.col};width:${((x.inc / income) * 100).toFixed(1)}%" title="${esc(x.m.name)}"></i>`).join('')}</div>` : ''}
        <ul class="dsh-hh">${mems.map((x) => {
          const a = num(x.m.birthYear) ? yr - num(x.m.birthYear) : null; const share = income ? x.inc / income : 0; const ow = owned(x.m.id);
          return `<li class="dsh-mem" style="--c:${x.col}"><span class="dsh-av" aria-hidden="true">${esc((x.m.name || REL[x.m.relation] || '?').trim().charAt(0).toUpperCase())}</span>
            <span class="n">${esc(x.m.name || REL[x.m.relation] || 'Member')}<small>${esc(REL[x.m.relation] || 'Family')}${a != null ? ' · ' + a : ''}</small></span>
            <span class="inc">${x.inc > 0 ? kfmt(x.inc) + '/yr' : '<span class="dsh-note">no income</span>'}</span>
            <span class="bar">${x.inc > 0 ? `<span class="dsh-bar sm"><i style="--w:${(share * 100).toFixed(1)}%;--c:${x.col}"></i></span><span>${Math.round(share * 100)}%</span>` : `<span class="dsh-note">${ow ? 'Owns ' + kfmt(ow) : x.m.incomeNote ? esc(x.m.incomeNote) : 'Counts for goals like college'}</span>`}</span></li>`;
        }).join('')}</ul>
        ${ownSplit()}
        <div class="dsh-sum">
          <div><span>Household income</span><b>${income ? usd(income) + '/yr' : '—'}</b></div>
          <div><span>Spending</span><b>${spend ? usd(spend) + '/mo' : '<a class="dsh-link" href="#profile">Add it</a>'}</b></div>
          <div><span>Your age</span><b>${age != null ? age : '<a class="dsh-link" href="#profile">Add it</a>'}</b></div>
          <div><span>Retire at</span><b>${ra ? ra + (age != null && ra > age ? ` <small class="dsh-note">${ra - age} yrs to go</small>` : '') : '<a class="dsh-link" href="#profile">Set it</a>'}</b></div>
        </div></section>`;
    }

    /* investor profile */
    function profileSec(c) {
      const sum = c.p.assessmentSummary || [];
      const head = (extra) => `<div class="dsh-h"><div><p class="dsh-k">Investor profile</p><h2 id="dsh-ip-h">How you are changing</h2></div>${extra || ''}</div>`;
      if (!sum.length) {
        return `<section class="dsh-card" aria-labelledby="dsh-ip-h">${head()}<div class="dsh-pe">${SML.bunnyMark ? SML.bunnyMark(40) : ''}<p>Take the self-assessment to meet your investor type: Steady, Detective, Surfer, Sprinter, Farmer or Freedom Bunny. Retake it every year and this panel shows how your risk and style shift as you learn.</p><div class="dsh-acts"><a class="btn btn-p sm" href="#assessment">Take the self-assessment</a>${SML.store.get('assessDraft', null) ? '<a class="btn btn-g sm" href="#results">See your unsaved results</a>' : ''}</div></div></section>`;
      }
      const last = sum[sum.length - 1]; const full = c.latest && c.latest.id === last.id ? c.latest : null;
      const name = (full && full.archetype && full.archetype.name) || last.name || ARCH[last.archetype] || 'Your profile';
      const tag = (full && full.archetype && full.archetype.tagline) || (ARCH_STYLE[last.archetype] ? 'Leans toward ' + ARCH_STYLE[last.archetype] + '.' : '');
      const prof = full && full.profile; const alloc = prof && prof.allocation;
      const chips = [];
      chips.push(`<span class="pill acc">Risk ${Math.round(num(last.risk))} / 100</span>`);
      if (last.profile && PROFILE[last.profile]) chips.push(`<span class="pill info">${PROFILE[last.profile]}</span>`);
      if (last.top && STYLE[last.top]) chips.push(`<span class="pill up">Best fit: ${STYLE[last.top]}</span>`);
      if (prof && isFinite(num(prof.riskPerTrade)) && num(prof.riskPerTrade) > 0) chips.push(`<span class="pill">${num(prof.riskPerTrade)}% risk per trade</span>`);
      const allocBar = alloc ? (() => { const a = [['Stocks', num(alloc.stocks), 'var(--up)'], ['Bonds', num(alloc.bonds), 'var(--info)'], ['Cash', num(alloc.cash), 'var(--muted)']].filter((x) => x[1] > 0); const t = a.reduce((s, x) => s + x[1], 0) || 1; return `<div class="dsh-alloc"><span class="ctl-lab">Suggested long-term mix</span><div class="dsh-stackbar">${a.map((x) => `<i style="--c:${x[2]};width:${((x[1] / t) * 100).toFixed(1)}%"></i>`).join('')}</div><div class="dsh-leg" style="margin-top:0">${a.map((x) => `<span><span class="dsh-sw" style="--c:${x[2]}"></span>${x[0]} ${Math.round(x[1])}%</span>`).join('')}</div><p class="dsh-note" style="margin-top:6px">Educational rule of thumb, not personal advice.</p></div>`; })() : '';
      const recent = sum.slice().reverse().slice(0, 5);
      return `<section class="dsh-card" aria-labelledby="dsh-ip-h">${head(`<a class="more" href="#results">Full results${arrow}</a>`)}
        <div class="dsh-arch"><span class="dsh-arch-m" aria-hidden="true">${SML.bunnyMark ? SML.bunnyMark(40) : ''}</span><div class="dsh-arch-b"><span class="ctl-lab">Latest · ${esc(longDate(last.date))}</span><span class="nm">${esc(name)}</span>${tag ? `<p>${esc(tag)}</p>` : ''}</div></div>
        <div class="dsh-chips">${chips.join('')}</div>${allocBar}
        <p class="dsh-subh">Risk score over time</p>
        <div class="dsh-fig" id="dsh-risk" style="margin-top:8px"></div>
        ${sum.length < 2 ? `<p class="dsh-note">One assessment so far. Retake it in a few months to see the trend.</p>` : ''}
        <ul class="dsh-hist" aria-label="Assessment history">${recent.map((s) => `<li><span class="d">${esc(mD(s.date))} ${esc(String(s.date).slice(0, 4))}</span><span class="a">${esc(s.name || ARCH[s.archetype] || 'Profile')}${s.top && STYLE[s.top] ? ` <span class="dsh-note">· ${STYLE[s.top]}</span>` : ''}</span><span class="r">${Math.round(num(s.risk))}</span></li>`).join('')}</ul>
        <div class="dsh-acts" style="margin-top:14px"><a class="btn btn-g sm" href="#assessment">Retake the assessment</a><a class="btn btn-g sm" href="#results">Compare results</a></div>
      </section>`;
    }

    /* learning */
    function learnSec(c) {
      const done = c.done; const wide = (() => { try { return window.matchMedia('(min-width: 900px)').matches; } catch (e) { return false; } })();
      const pref = c.p.prefs && c.p.prefs.defaultTrack;
      const tracks = TRACKS().slice().sort((a, b) => (a.id === pref ? -1 : b.id === pref ? 1 : (a.n || 0) - (b.n || 0)));
      const cards = tracks.map((t) => {
        const ls = lessonsOfTrack(t.id); const d = ls.filter((l) => done.has(l.id)).length; const nx = ls.find((l) => !done.has(l.id));
        const cs = coursesOf(t.id);
        return `<div class="dsh-trk"><div class="dsh-trk-h"><b>${esc(t.short || t.title)}</b><span>${d} / ${ls.length}</span></div>
          <div class="dsh-bar" role="progressbar" aria-label="${esc(t.title)}: ${d} of ${ls.length} lessons" aria-valuemin="0" aria-valuemax="${ls.length}" aria-valuenow="${d}"><i style="--w:${ls.length ? (d / ls.length) * 100 : 0}%"></i></div>
          ${nx ? `<a class="btn ${d ? 'btn-p' : 'btn-g'} sm" href="#${nx.id}">${arrow}<span>${d ? 'Continue' : 'Start'}: ${esc(nx.title)}</span></a>` : `<span class="dsh-badge fl">${I(ICON.check, 12)}Track complete</span>`}
          <details${wide || d ? ' open' : ''}><summary>${cs.length} courses</summary><ul class="dsh-crs">${cs.map((co) => { const cl = lessonsOf(co.id); const cd = cl.filter((l) => done.has(l.id)).length; return `<li><a href="#c-${co.id}"${cd && cd === cl.length ? ' class="full"' : ''}><span><span>${esc(co.title)}</span><em>${cd}/${cl.length}</em></span><span class="dsh-bar sm"><i style="--w:${cl.length ? (cd / cl.length) * 100 : 0}%"></i></span></a></li>`; }).join('')}</ul></details></div>`;
      }).join('');
      let recs = [], recTitle = 'Next up';
      const ins = c.latest && c.latest.insights && Array.isArray(c.latest.insights.lessons) ? c.latest.insights.lessons : [];
      recs = ins.map(lessonById).filter((l) => l && !done.has(l.id)).slice(0, 4);
      if (recs.length) recTitle = 'Picked for your profile';
      else recs = tracks.map((t) => lessonsOfTrack(t.id).find((l) => !done.has(l.id))).filter(Boolean).slice(0, 4);
      const where = acc.status.mode === 'cloud' ? 'saved to your account' : 'saved in this browser only';
      return `<section class="dsh-card" aria-labelledby="dsh-ln-h">
        <div class="dsh-h"><div><p class="dsh-k">Learning</p><h2 id="dsh-ln-h">Your lesson progress</h2><p class="dsh-sub">Tick a lesson done at the bottom of each page. Progress is ${where}.</p></div><a class="more" href="#learn">All lessons${arrow}</a></div>
        <div class="dsh-trks">${cards}</div>
        ${recs.length ? `<p class="dsh-subh">${recTitle}</p><div class="dsh-recs">${recs.map((l) => { const co = courseById(l.course); return `<a class="dsh-rec" href="#${l.id}"><small>${esc(co ? co.title : '')}${l.mins ? ' · ' + l.mins + ' min' : ''}</small><b>${esc(l.title)}</b><span class="more">Open lesson${arrow}</span></a>`; }).join('')}</div>` : ''}
      </section>`;
    }

    /* dates */
    function datesSec(c) {
      const ev = Array.isArray(SML.calendarEvents) ? SML.calendarEvents : null; if (!ev) return '';
      const t0 = todayLocal(), t1 = addDays(14); const wk = !!(c.p.prefs && c.p.prefs.weeklyOnCalendar);
      const list = ev.filter((e) => e && e.d >= t0 && e.d <= t1 && (wk || !e.weekly)).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : String(a.time || '').localeCompare(String(b.time || '')))).slice(0, 8);
      const days = (d) => Math.round((parseISO(d) - parseISO(t0)) / 864e5);
      return `<section class="dsh-card" aria-labelledby="dsh-dt-h">
        <div class="dsh-h"><div><p class="dsh-k">Next 14 days</p><h2 id="dsh-dt-h">Key dates</h2></div><a class="more" href="#calendar">Open the calendar${arrow}</a></div>
        ${list.length ? `<ul class="dsh-dates">${list.map((e) => { const n = days(e.d); const dt = parseISO(e.d); return `<li><span class="dsh-day" aria-hidden="true"><b>${dt.getDate()}</b><small>${dt.toLocaleDateString('en-US', { weekday: 'short' })}</small></span>
          <div class="t"><b>${esc(e.title)}</b><small><span class="dsh-sw" style="--c:${CATC[e.cat] || 'var(--muted)'}"></span>${esc(CATL[e.cat] || 'Market')}${e.time ? ' · ' + esc(e.time) : ''}${e.status === 'estimate' ? ' · estimate' : ''}</small></div>
          <span class="in${n <= 1 ? ' now' : ''}"><span class="sr">${esc(longDate(e.d))}, </span>${n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : 'in ' + n + 'd'}</span></li>`; }).join('')}</ul>` : `<p class="dsh-note">A quiet two weeks. Nothing big on the calendar.</p>`}
      </section>`;
    }
    function appsSec() {
      return `<section class="dsh-card dsh-apps" aria-labelledby="dsh-ap-h">
        <div class="dsh-phone" aria-hidden="true"><div class="dsh-ph-s">${SML.bunnyMark ? SML.bunnyMark(26) : ''}<b>FIRE</b><i class="f"></i><i></i><i class="g"></i><i></i></div></div>
        <div class="dsh-apps-b"><p class="dsh-k">Mobile apps</p><h2 class="dsh-h2" id="dsh-ap-h">On your phone, soon</h2>
          <p>The FiredBunny apps for iPhone and Android are in development and will use this same profile: goals, net worth, lessons and your investor type. Until they land, export your data from Settings.</p>
          <div class="dsh-acts"><a class="btn btn-g sm" href="#apps">About the apps</a><a class="btn btn-g sm" href="#settings">Export my data</a></div></div>
      </section>`;
    }

    /* ----- paint ----- */
    function fit(el, draw) {
      if (!el) return; let last = -1;
      const go = () => { if (!st.alive || !el.isConnected) return; const W = Math.max(260, Math.floor(el.clientWidth)); if (W !== last) { last = W; try { draw(W); } catch (e) { console.error(e); } } };
      if (window.ResizeObserver) { const ro = new ResizeObserver(() => requestAnimationFrame(go)); ro.observe(el); ros.push(ro); }
      go();
    }
    function repaint() {
      if (!st.alive) return;
      ros.splice(0).forEach((r) => r.disconnect());
      st.pending = false;
      const c = ctx(); const y = window.scrollY;
      const dates = datesSec(c);
      body.innerHTML = [
        migration(),
        isEmpty(c.p) ? emptyHero(c) : kpis(c),
        goalsSec(c),
        netSec(c),
        `<div class="dsh-two">${householdSec(c)}${profileSec(c)}</div>`,
        learnSec(c),
        dates ? `<div class="dsh-two b">${dates}${appsSec()}</div>` : appsSec(),
      ].join('');
      window.scrollTo(0, y);
      fit($('#dsh-hist', body), (W) => drawHistory($('#dsh-hist', body), c.p.netWorthHistory || [], W));
      fit($('#dsh-risk', body), (W) => drawRisk($('#dsh-risk', body), c.p.assessmentSummary || [], W));
      if (st.celebrate) { const id = st.celebrate; st.celebrate = null; celebrate(id); }
    }
    function celebrate(id) {
      const card = $$('.dsh-goal', body).find((x) => x.dataset.gid === id); if (!card) return;
      const cols = ['var(--flame)', 'var(--gold)', 'var(--up)', 'var(--accent)'];
      card.classList.add('pop');
      const burst = document.createElement('span'); burst.className = 'dsh-cele'; burst.setAttribute('aria-hidden', 'true');
      burst.innerHTML = Array.from({ length: 18 }, (_, i) => `<i style="--a:${Math.round((360 / 18) * i + (i % 3) * 7)}deg;--r:${60 + (i % 4) * 18}px;--c:${cols[i % cols.length]};--dl:${(i % 3) * 40}ms"></i>`).join('');
      card.appendChild(burst);
      setTimeout(() => { burst.remove(); card.classList.remove('pop'); }, 1500);
      SML.hop('Hop hop! Goal reached.');
    }
    function focusForm(sel) {
      const f = $(sel, body); if (!f) return;
      try { f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
      const inp = $('input[type=text]', f); if (inp) try { inp.focus({ preventScroll: true }); } catch (e) {}
    }
    const closeForms = () => { st.goalForm = null; st.rowForm = null; };

    /* ----- templates ----- */
    function template(t) {
      const p = acc.get(); const L = st.latest; const G = (L && L.goals) || {};
      const yr = new Date().getFullYear();
      const spend = num(p.monthlySpend) || (L && L.inputs ? num(L.inputs.spendMonth) : 0);
      const round = (v, s) => Math.max(s, Math.round(v / s) * s);
      const me = p.household.find((m) => m.relation === 'self');
      const by = num(p.birthYear) || (me && num(me.birthYear)) || (L && L.inputs && num(L.inputs.age) ? new Date(L.date || Date.now()).getFullYear() - num(L.inputs.age) : 0);
      if (t === 'emergency') {
        const m = num(G.emergencyTargetMonths) === 3 ? 3 : 6; // the quiz's rule (FIXES item 8), default 6
        return { tpl: t, title: `Emergency fund (${m} months)`, type: 'emergency', target: round((spend || 3500) * m, 100), source: 'cash', deadline: addMonths(12) };
      }
      if (t === 'fire') {
        const fn = num(G.fireNumber) || (spend ? spend * 12 * 25 : 1000000);
        const ra = num(p.retireAge) || num(G.targetAge) || (L && L.inputs ? num(L.inputs.retireAge) : 0);
        const tYear = by && ra ? by + ra : yr + 15;
        const nextDec31 = todayLocal() < `${yr}-12-31` ? `${yr}-12-31` : `${yr + 1}-12-31`;
        // Already at or past the target age: next Dec 31, no saving pace (FIXES item 10).
        if (G.retired || tYear < yr) return { tpl: t, title: 'My FIRE number', type: 'fire', target: round(fn, 1000), source: 'investable', deadline: nextDec31, retired: true };
        const sm = L && L.inputs && L.inputs.savingsMonth != null && L.inputs.savingsMonth !== '' ? Math.max(0, Math.round(num(L.inputs.savingsMonth))) : '';
        return { tpl: t, title: 'My FIRE number', type: 'fire', target: round(fn, 1000), source: 'investable', deadline: `${Math.max(tYear, yr)}-12-31`, monthly: sm };
      }
      if (t === 'house') return { tpl: t, title: 'House down payment', type: 'house', target: 80000, source: 'manual', current: 0, deadline: addMonths(36) };
      if (t === 'debt') { const hd = p.debts.filter((d) => d.type === 'card' || d.type === 'personal').reduce((s, d) => s + num(d.balance), 0); return { tpl: t, title: 'Pay off card debt', type: 'debt', target: hd ? Math.round(hd) : 5000, source: 'manual', current: 0, deadline: addMonths(18) }; }
      if (t === 'roth') {
        // 2026 limit: $7,500, or $8,600 at 50+ (age at the end of 2026). Contributions don't grow toward a limit goal.
        const age26 = by ? 2026 - by : null;
        return { tpl: t, title: `Max my ${yr} Roth IRA`, type: 'retire', target: age26 != null && age26 >= 50 ? 8600 : 7500, source: 'manual', current: 0, deadline: `${yr + 1}-04-15`, noGrowth: true };
      }
      return { tpl: '', title: '', type: 'custom', source: 'manual', deadline: addMonths(12) };
    }
    function fillGoalForm(form, g) {
      const set = (n, v) => { const el = form.elements[n]; if (el) el.value = v == null ? '' : v; };
      set('title', g.title); set('type', g.type); set('target', g.target ? Math.round(g.target) : ''); set('source', g.source || 'manual');
      set('current', g.current ? Math.round(g.current) : ''); set('deadline', g.deadline || ''); set('monthly', g.monthly || '');
      set('tpl', g.tpl || ''); set('retired', g.retired ? '1' : '');
      const n = $('[data-tplnote]', form); if (n) { n.hidden = g.tpl !== 'roth'; n.textContent = rothHint(); }
      syncSource(form);
    }
    function syncSource(form) {
      const src = form.elements.source ? form.elements.source.value : 'manual';
      const cur = $('[data-cur]', form), note = $('[data-curnote]', form), v = $('[data-curv]', form);
      if (cur) cur.hidden = src !== 'manual'; if (note) note.hidden = src === 'manual';
      if (v) v.textContent = usd(goalCurrent({ source: src }, acc.netWorth()));
    }
    const showErr = (form, msg) => { const e = $('[data-err]', form); if (e) { e.textContent = msg; e.hidden = !msg; } };

    /* ----- saves (user actions only) ----- */
    function upsertToday(p) {
      const nw = acc.netWorth(p); const d = todayUTC();
      p.netWorthHistory = (p.netWorthHistory || []).filter((x) => x.d !== d);
      p.netWorthHistory.push({ d, assets: nw.assets, debts: nw.debts, net: nw.net });
      p.netWorthHistory.sort((a, b) => (a.d < b.d ? -1 : 1));
      if (p.netWorthHistory.length > 400) p.netWorthHistory = p.netWorthHistory.slice(-400);
    }
    function saveGoal(form) {
      const E = form.elements; const id = form.dataset.id || '';
      const type = GOAL_LABEL[E.type.value] ? E.type.value : 'custom';
      const target = num(E.target.value); const source = SOURCES.some((s) => s[0] === E.source.value) ? E.source.value : 'manual';
      const deadline = /^\d{4}-\d{2}-\d{2}$/.test(E.deadline.value) ? E.deadline.value : '';
      if (!(target > 0)) { showErr(form, 'Add a target amount above $0.'); try { E.target.focus(); } catch (e) {} return; }
      const title = String(E.title.value || '').trim().slice(0, 60) || GOAL_LABEL[type];
      const tpl = E.tpl ? String(E.tpl.value || '') : '';
      const goal = { title, type, target: Math.round(target), source, current: source === 'manual' ? Math.max(0, Math.round(num(E.current.value))) : Math.round(goalCurrent({ source }, acc.netWorth())), deadline, monthly: Math.max(0, Math.round(num(E.monthly.value))),
        tpl, noGrowth: tpl === 'roth', retired: !!(E.retired && E.retired.value === '1' && (type === 'fire' || type === 'retire')) };
      closeForms();
      acc.save((p) => {
        const i = id ? p.goals.findIndex((g) => g.id === id) : -1;
        if (i >= 0) Object.assign(p.goals[i], goal);
        else p.goals.push(Object.assign({ id: acc.newId('g'), created: todayLocal(), done: null }, goal));
      });
      SML.hop(id ? 'Hop hop. Goal updated.' : 'Hop hop. Goal set.');
    }
    function saveRow(form, kind) {
      const E = form.elements; const id = form.dataset.id || '';
      const types = kind === 'asset' ? acc.assetTypes : acc.debtTypes;
      const type = types.some((t) => t[0] === E.type.value) ? E.type.value : 'other';
      const raw = String(E.amount.value || '').trim(); const amt = num(raw);
      if (!raw || amt < 0) { showErr(form, kind === 'asset' ? 'Add a value of $0 or more.' : 'Add a balance of $0 or more.'); try { E.amount.focus(); } catch (e) {} return; }
      const rate = kind === 'debt' ? clamp(num(E.rate.value), 0, 100) : null;
      const name = String(E.name.value || '').trim().slice(0, 60) || typeLabel(types, type);
      const owner = String(E.owner.value || '');
      closeForms();
      acc.save((p) => {
        const list = kind === 'asset' ? p.assets : p.debts;
        const base = { name, type, owner, updated: todayLocal() };
        if (kind === 'asset') base.value = Math.round(amt); else { base.balance = Math.round(amt); base.rate = String(E.rate.value || '').trim() === '' ? '' : Math.round(rate * 100) / 100; }
        const i = id ? list.findIndex((x) => x.id === id) : -1;
        if (i >= 0) Object.assign(list[i], base); else list.push(Object.assign({ id: acc.newId(kind === 'asset' ? 'as' : 'db'), note: '' }, base));
        upsertToday(p);
      });
      SML.hop('Hop hop. Saved.');
    }

    /* ----- events (on our own root, so nothing leaks onto #view) ----- */
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return;
      const act = b.dataset.act, id = b.dataset.id || '';
      if (b.tagName === 'A') e.preventDefault();
      switch (act) {
        case 'migrate': b.disabled = true; acc.migrateLocal().then(() => SML.hop('Hop hop. Moved into your account.'), () => { b.disabled = false; SML.toast('That did not move. Try again in a moment.'); }); break;
        case 'migrate-no': acc.dismissMigration(); break;
        case 'record': b.disabled = true; acc.snapshot().then(() => SML.hop('Hop hop. Today is on the chart.')); break;
        case 'goal-new': closeForms(); st.confirm = null; st.goalForm = { id: null, draft: template(b.dataset.t || '') }; repaint(); focusForm('[data-form=goal]'); break;
        case 'goal-tpl': { const f = b.closest('form'); if (f) { fillGoalForm(f, template(b.dataset.t)); showErr(f, ''); } break; }
        case 'goal-edit': closeForms(); st.confirm = null; st.goalForm = { id }; repaint(); focusForm('[data-form=goal]'); break;
        case 'goal-done': st.celebrate = id; acc.save((p) => { const g = p.goals.find((x) => x.id === id); if (g) g.done = todayLocal(); }); break;
        case 'goal-undo': acc.save((p) => { const g = p.goals.find((x) => x.id === id); if (g) g.done = null; }); break;
        case 'goal-del': st.confirm = 'goal:' + id; repaint(); break;
        case 'asset-new': case 'debt-new': closeForms(); st.confirm = null; st.rowForm = { kind: act.split('-')[0], id: null }; repaint(); focusForm(`[data-form=${act.split('-')[0]}]`); break;
        case 'asset-edit': case 'debt-edit': closeForms(); st.confirm = null; st.rowForm = { kind: act.split('-')[0], id }; repaint(); focusForm(`[data-form=${act.split('-')[0]}]`); break;
        case 'asset-del': case 'debt-del': st.confirm = act.split('-')[0] + ':' + id; repaint(); break;
        case 'confirm-no': st.confirm = null; repaint(); break;
        case 'confirm-yes': {
          const kind = b.dataset.kind; st.confirm = null;
          acc.save((p) => {
            if (kind === 'goal') p.goals = p.goals.filter((x) => x.id !== id);
            if (kind === 'asset') { p.assets = p.assets.filter((x) => x.id !== id); upsertToday(p); }
            if (kind === 'debt') { p.debts = p.debts.filter((x) => x.id !== id); upsertToday(p); }
          });
          SML.hop('Deleted.');
          break;
        }
        case 'form-cancel': closeForms(); repaint(); break;
        default: break;
      }
    });
    root.addEventListener('submit', (e) => {
      const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
      if (f.dataset.form === 'goal') saveGoal(f); else saveRow(f, f.dataset.form);
    });
    root.addEventListener('change', (e) => {
      const f = e.target.closest('form[data-form=goal]');
      if (f && e.target.name === 'source') syncSource(f);
      if (f && e.target.name === 'type') { const t = f.elements.title; if (t) t.placeholder = GOAL_LABEL[e.target.value] || 'Goal'; }
    });
    root.addEventListener('input', (e) => {
      if (e.target.id === 'dsh-ret') {
        const v = clamp(num(e.target.value), 0, 12); SML.store.set('dashReturn', v);
        const o = $('#dsh-ret-o', root); if (o) o.textContent = v + '% / yr';
        const list = $('#dsh-goal-list', root); if (list) list.innerHTML = goalList(ctx());
        return;
      }
      const f = e.target.closest('form[data-form]'); if (f) showErr(f, '');
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && formOpen() && e.target.closest('form[data-form]')) { closeForms(); repaint(); } });

    const off = acc.onChange((d) => { if (!st.alive || d.type !== 'change') return; if (formOpen()) st.pending = true; else repaint(); });
    SML.onCleanup(() => { st.alive = false; try { off(); } catch (e) {} ros.splice(0).forEach((r) => r.disconnect()); });
    try {
      acc.assessments.latest().then((r) => { if (!st.alive || !r) return; st.latest = r; if (formOpen()) st.pending = true; else repaint(); }, () => {});
    } catch (e) {}
    repaint();
    return 'Dashboard';
  };
})();
