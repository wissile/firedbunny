/* Earnings lookup UI (fork E). Search any US stock and see its latest quarter explained for beginners: a report card
   with verdicts, charts that show the trend, an auto-written summary, explainers for every concept, a 10-year
   "what would you need to believe" calculator, and the sources. Data comes only from SML.earn (mod-z-earn-data.js,
   contract in SPEC-earnings.md): money in USD millions, EPS in USD per share, shares in millions, any number may be
   null. Appends a section to the Calendar page and registers the tool `tool-earnings` (widget `earnLookup`).
   CSS prefix: .ern- */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const esc = SML.esc, clamp = SML.clamp;

  /* ---------------- small helpers ---------------- */
  const isN = (v) => typeof v === 'number' && isFinite(v);
  const N = (v) => (isN(v) ? v : null);
  const nz = (a, b) => (isN(a) ? a : isN(b) ? b : null);
  const NEG = F.minus + '⁠'; /* minus + word joiner: never break between "−" and "$" */
  const sg = (v) => (v > 0 ? '+' : v < 0 ? NEG : '');
  const ratio = (a, b) => (isN(a) && isN(b) && b > 0 ? (a / b) * 100 : null);
  /* growth in % from b to a; null when the base is zero or negative (a % change from a loss is meaningless) */
  const gr = (a, b) => (isN(a) && isN(b) && b > 0 ? (a / b - 1) * 100 : null);
  const mean = (a) => { const v = a.filter(isN); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const median = (a) => { const v = a.filter(isN).sort((x, y) => x - y); if (!v.length) return null; const m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
  const tw = (s, px, mono) => String(s).replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, 'x').length * (px || 11.5) * (mono ? 0.6 : 0.56);

  /* money in $M -> "$23.6B", "$812M", "$1.40T" */
  function money(v) {
    if (!isN(v)) return 'n/a';
    const a = Math.abs(v), s = v < 0 ? NEG : '';
    if (a < 0.05) return '$0';
    if (a >= 1e6) return s + '$' + F.num(a / 1e6, 2) + 'T';
    if (a >= 1000) return s + '$' + F.num(a / 1000, 1) + 'B';
    if (a >= 10) return s + '$' + F.num(a, 0) + 'M';
    return s + '$' + F.num(a, 1) + 'M';
  }
  /* words for sentences: "$23.6 billion" */
  function moneyW(v) {
    if (!isN(v)) return 'an unreported amount';
    const a = Math.abs(v), s = v < 0 ? NEG : '';
    if (a >= 1e6) return s + '$' + F.num(a / 1e6, 2) + ' trillion';
    if (a >= 1000) return s + '$' + F.num(a / 1000, 1) + ' billion';
    return s + '$' + F.num(a, a >= 10 ? 0 : 1) + ' million';
  }
  const smoney = (v) => (isN(v) ? sg(v) + money(Math.abs(v)) : 'n/a');
  const usd = (v, d) => (isN(v) ? (v < 0 ? NEG : '') + '$' + F.num(Math.abs(v), d == null ? 2 : d) : 'n/a');
  const P = (v, d) => (isN(v) ? F.pct(v, d == null ? 1 : d) : 'n/a');
  const SP = (v, d) => (isN(v) ? F.spct(v, d == null ? 1 : d) : 'n/a');
  const X = (v, d) => (isN(v) ? F.num(v, d == null ? 1 : d) + '×' : 'n/a');
  const Xm = (v) => X(v, isN(v) && Math.abs(v) < 10 ? 1 : 0);
  const shares = (v) => (!isN(v) ? 'n/a' : v >= 1000 ? F.num(v / 1000, 2) + 'B' : F.num(v, v >= 10 ? 0 : 1) + 'M');
  /* axis formatters (short) */
  const axMoney = (v) => { const a = Math.abs(v), s = v < 0 ? NEG : ''; if (a === 0) return '$0'; if (a >= 1e6) return s + '$' + F.num(a / 1e6, a % 1e6 ? 1 : 0) + 'T'; if (a >= 1000) return s + '$' + F.num(a / 1000, a % 1000 ? 1 : 0) + 'B'; return s + '$' + F.num(a, a < 10 && a % 1 ? 1 : 0) + 'M'; };
  const axPct = (v) => F.num(v, Math.abs(v) < 10 && v % 1 ? 1 : 0) + '%';
  const axUsd = (v) => (v < 0 ? NEG : '') + '$' + F.num(Math.abs(v), Math.abs(v) < 10 && v % 1 ? 2 : 0);

  /* dates (YYYY-MM-DD, no time zones) */
  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const pd = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; };
  const dn = (s) => { const p = pd(s); return p ? Date.UTC(p.y, p.m - 1, p.d) / 864e5 : null; };
  const dShort = (s) => { const p = pd(s); return p ? `${MONS[p.m - 1]} ${p.d}, ${p.y}` : 'n/a'; };
  /* "Jun 2026" label (or an end date) -> parts */
  function labParts(label, end) {
    const m = /^([A-Za-z]{3})[a-z]* (\d{4})$/.exec(String(label || '').trim());
    if (m) { const i = MONS.indexOf(m[1].charAt(0).toUpperCase() + m[1].slice(1, 3).toLowerCase()); if (i >= 0) return { m: i, y: +m[2] }; }
    const d = dn(end); if (d == null) return null;
    const a = new Date((d - 7) * 864e5); /* 52/53-week years end a few days into the next month */
    return { m: a.getUTCMonth(), y: a.getUTCFullYear() };
  }
  const shortLab = (label, end) => { const p = labParts(label, end); return p ? `${MONS[p.m]} ’${String(p.y).slice(2)}` : '?'; };
  const longLab = (label, end) => { const p = labParts(label, end); return p ? `${MONL[p.m]} ${p.y}` : 'latest'; };

  /* ---------------- CSS ---------------- */
  SML.css(`
.wg.ern{background:transparent;border:0;border-radius:0;overflow:visible;gap:20px}
.wg.ern > * + *{border-top:0}
.ern [hidden]{display:none!important}
.ern-panel{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);min-width:0;display:flex;flex-direction:column;position:relative}
.ern-panel > * + *{border-top:1px solid var(--line)}
.ern-k{font:600 10.5px/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.ern-lk{font:600 10px/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.ern-search{background-color:var(--paper);background-image:linear-gradient(to right,var(--grid) 1px,transparent 1px),linear-gradient(to bottom,var(--grid) 1px,transparent 1px);background-size:28px 28px;background-position:-1px -1px}
.ern-sbox{padding:20px;display:flex;flex-direction:column;gap:12px}
@media(max-width:520px){.ern-sbox{padding:14px}}
.ern-slab{display:flex;align-items:center;gap:10px;font:600 11px/1.3 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--ink)}
.ern-slab i{width:7px;height:7px;border-radius:50%;background:var(--flame,var(--accent));box-shadow:0 0 8px var(--flame,var(--accent))}
.ern-srow{display:flex;gap:10px;align-items:stretch;flex-wrap:wrap}
.ern-in{position:relative;flex:1 1 260px;min-width:0}
.ern-in svg.ern-mag{position:absolute;left:14px;top:50%;width:20px;height:20px;transform:translateY(-50%);pointer-events:none}
.ern-in svg.ern-mag circle,.ern-in svg.ern-mag path{fill:none;stroke:var(--muted);stroke-width:2}
.ern-in input{width:100%;min-width:0;height:54px;padding:0 14px 0 46px;font:600 18px var(--mono);letter-spacing:.04em;color:var(--ink);background:var(--bg);border:1px solid var(--input);border-radius:var(--r);-webkit-appearance:none;appearance:none}
.ern-in input::placeholder{color:color-mix(in srgb,var(--muted) 75%,transparent);font-weight:500;letter-spacing:0;font-size:15px}
.ern-in input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(232,173,79,.2)}
.ern-in input::-webkit-search-cancel-button{display:none}
.ern-go{height:54px;padding:0 22px;font-size:15px}
@media(max-width:420px){.ern-go{flex:1 1 100%}}
.ern-sug{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:30;list-style:none;background:var(--surface-2);border:1px solid var(--input);border-radius:var(--r);box-shadow:0 18px 40px -16px var(--raise);overflow:hidden;max-height:340px;overflow-y:auto}
.ern-sug button{display:grid;grid-template-columns:72px minmax(0,1fr);gap:10px;align-items:baseline;width:100%;padding:10px 14px;border:0;background:transparent;text-align:left;cursor:pointer;color:var(--text)}
.ern-sug li + li button{border-top:1px solid var(--line)}
.ern-sug button b{font:600 14px var(--mono);color:var(--accent)}
.ern-sug button span{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ern-sug button.on,.ern-sug button:hover{background:color-mix(in srgb,var(--accent) 10%,var(--surface-2))}
.ern-quick{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ern-quick .ern-lk{margin-right:4px}
.ern-qk{min-height:32px;padding:0 11px;border:1px solid var(--line);border-radius:var(--r);background:var(--bg);font:600 12px/1 var(--mono);letter-spacing:.06em;color:var(--ink);cursor:pointer}
.ern-qk:hover{border-color:var(--accent);color:var(--accent)}
.ern-qk.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--bg))}
.ern-status{padding:12px 20px;font-size:14px;line-height:1.5;color:var(--muted);background:var(--surface)}
.ern-status:empty{display:none}
.ern-status .callout{margin:0}
.ern-out{display:flex;flex-direction:column;gap:20px;min-width:0}
.ern-out:empty{display:none}
.ern-banner{display:flex;gap:14px;align-items:center;padding:14px 18px;border-radius:var(--r);border:1px dashed color-mix(in srgb,var(--violet) 60%,transparent);background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--violet) 12%,var(--surface)) 0 14px,color-mix(in srgb,var(--violet) 6%,var(--surface)) 14px 28px);color:var(--ink);font-size:14.5px;line-height:1.5}
.ern-banner b{display:block;font:600 12px/1.3 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--violet);margin-bottom:2px}
.ern-banner svg{flex:0 0 30px}
.ern-stag{display:inline-flex;align-items:center;font:600 10px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--violet);border:1px solid color-mix(in srgb,var(--violet) 50%,transparent);border-radius:999px;padding:3px 8px;white-space:nowrap}
.ern-hd{padding:20px;display:flex;flex-direction:column;gap:14px}
@media(max-width:520px){.ern-hd{padding:16px}}
.ern-hd-top{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;font:600 10.5px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.ern-tk{font:600 13px/1 var(--mono);letter-spacing:.06em;color:var(--on-acc);background:var(--accent);border-radius:4px;padding:5px 8px}
.ern-co{font-family:var(--display);font-weight:400;font-size:clamp(34px,5vw,56px);line-height:.92;text-transform:uppercase;color:var(--ink);text-wrap:balance;overflow-wrap:anywhere}
.ern-qline{font-size:17px;line-height:1.45;color:var(--ink)}
.ern-qline span{color:var(--muted)}
.ern-meta{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13.5px;color:var(--muted)}
.ern-meta b{color:var(--ink);font-weight:600}
.ern-links{display:flex;flex-wrap:wrap;gap:8px}
.ern-links a{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 12px;border:1px solid var(--line);border-radius:var(--r);background:var(--bg);color:var(--ink);text-decoration:none;font-size:13.5px;font-weight:600}
.ern-links a:hover{border-color:var(--accent);color:var(--accent)}
.ern-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,128px),1fr));gap:1px;background:var(--line)}
.ern-kpi{background:var(--surface);padding:12px 16px;display:flex;flex-direction:column;gap:5px;min-width:0}
.ern-kpi span{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.ern-kpi b{font-family:var(--display);font-weight:400;font-size:28px;line-height:.95;color:var(--ink);letter-spacing:.01em;overflow-wrap:anywhere}
.ern-kpi small{font-size:12px;color:var(--muted);line-height:1.35}
.ern-sh{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:8px 20px;padding:4px 0 10px;border-bottom:2px solid color-mix(in srgb,var(--ink) 90%,transparent)}
.ern-sh h3{display:flex;align-items:baseline;gap:12px;font-family:var(--display);font-weight:400;font-size:clamp(30px,4vw,42px);line-height:.95;text-transform:uppercase;color:var(--ink)}
.ern-sh h3 i{font-style:normal;color:var(--accent)}
.ern-sh p{font-size:14.5px;color:var(--muted);max-width:62ch}
.ern-sec{display:flex;flex-direction:column;gap:14px;min-width:0}
.ern-score{display:flex;flex-direction:column;gap:10px;padding:16px 18px}
.ern-score-t{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px}
.ern-score-t b{font-family:var(--display);font-weight:400;font-size:30px;line-height:1;text-transform:uppercase;color:var(--ink)}
.ern-score-t span{font-size:13.5px;color:var(--muted)}
.ern-meter{display:flex;height:12px;border-radius:999px;overflow:hidden;background:var(--line);gap:2px}
.ern-meter i{display:block;height:100%}
.ern-meter i.up{background:var(--up)} .ern-meter i.flat{background:var(--accent)} .ern-meter i.down{background:var(--down)} .ern-meter i.na{background:var(--shade2)}
.ern-leg{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 11px/1.3 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.ern-leg span{display:inline-flex;align-items:center;gap:6px}
.ern-leg i{width:9px;height:9px;border-radius:50%}
.ern-leg i.up{background:var(--up)} .ern-leg i.flat{background:var(--accent)} .ern-leg i.down{background:var(--down)} .ern-leg i.na{background:var(--shade2)}
.ern-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,262px),1fr));gap:12px}
.ern-tile{--vc:var(--muted);background:var(--surface);border:1px solid var(--line);border-top:3px solid var(--vc);border-radius:var(--r);padding:14px 16px 14px;display:flex;flex-direction:column;gap:8px;min-width:0}
.ern-tile[data-v="up"]{--vc:var(--up)} .ern-tile[data-v="flat"]{--vc:var(--accent)} .ern-tile[data-v="down"]{--vc:var(--down)} .ern-tile[data-v="neu"]{--vc:var(--violet)}
.ern-tile-h{display:flex;align-items:center;justify-content:space-between;gap:8px}
.ern-tile-h > span{font:600 10.5px/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
.ern-vp{display:inline-flex;align-items:center;gap:5px;font:600 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--vc);border:1px solid color-mix(in srgb,var(--vc) 45%,transparent);background:color-mix(in srgb,var(--vc) 12%,transparent);border-radius:999px;padding:4px 8px;white-space:nowrap}
.ern-ar{width:11px;height:11px;flex:0 0 11px}
.ern-ar path{fill:currentColor}
.ern-tile-m{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;min-width:0}
.ern-tile-m > div{display:flex;flex-direction:column;gap:3px;min-width:0}
.ern-big{font-family:var(--display);font-weight:400;font-size:36px;line-height:.9;color:var(--ink);letter-spacing:.01em;white-space:nowrap}
.ern-tile[data-v="na"] .ern-big{font-size:24px;color:var(--muted)}
.ern-bsub{font:500 11px/1.3 var(--mono);color:var(--muted)}
.ern-spark{flex:0 0 auto}
.ern-spark polyline{fill:none;stroke:var(--vc);stroke-width:1.8}
.ern-spark circle{fill:var(--vc)}
.ern-spark line{stroke:var(--line)}
.ern-tile p{font-size:14px;line-height:1.5;color:color-mix(in srgb,var(--ink) 86%,transparent)}
.ern-tile .ern-tl{align-self:flex-start;margin-top:auto;background:none;border:0;padding:2px 0;color:var(--accent);font:600 12.5px var(--sans);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.ern-news{padding:18px 20px;display:flex;flex-direction:column;gap:12px}
@media(max-width:520px){.ern-news{padding:14px 16px}}
.ern-news ul{list-style:none;display:flex;flex-direction:column;gap:10px}
.ern-news li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:10px;font-size:16px;line-height:1.6;color:color-mix(in srgb,var(--ink) 88%,transparent);align-items:start}
.ern-news li .ern-dot{width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-top:2px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line)}
.ern-news li .ern-dot.up{color:var(--up);border-color:color-mix(in srgb,var(--up) 45%,transparent)}
.ern-news li .ern-dot.down{color:var(--down);border-color:color-mix(in srgb,var(--down) 45%,transparent)}
.ern-news li .ern-dot.flat{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
.ern-news li .ern-dot.info{color:var(--info);border-color:color-mix(in srgb,var(--info) 45%,transparent)}
.ern-news b.up{color:var(--up)} .ern-news b.dn{color:var(--down)}
.ern-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,500px),1fr));gap:16px;align-items:start}
.ern-grid .ern-wide{grid-column:1/-1}
.ern-panel[data-panel]{scroll-margin-top:84px}
.ern-ph{padding:14px 16px 12px;display:flex;flex-direction:column;gap:4px}
.ern-ph h4{font:600 18px/1.3 var(--sans);color:var(--ink);margin:0}
.ern-ph p.ern-sub{font-size:13.5px;line-height:1.5;color:var(--muted)}
.ern-bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:10px 16px;background:var(--surface)}
.ern-fig{background-color:var(--paper);background-image:linear-gradient(to right,var(--grid) 1px,transparent 1px),linear-gradient(to bottom,var(--grid) 1px,transparent 1px);background-size:28px 28px;background-position:-1px -1px;padding:14px;min-width:0;position:relative}
@media(max-width:420px){.ern-fig{padding:10px 8px}}
.ern-fig svg{display:block;max-width:100%;height:auto;margin:0 auto;overflow:visible}
.ern-tip{max-width:260px;white-space:normal;line-height:1.45}
.ern-tip b{display:block;font-family:var(--sans);font-weight:600;margin-bottom:2px;color:var(--ink)}
.ern-tip .r{display:flex;justify-content:space-between;gap:14px;white-space:nowrap}
.ern-tip .r span{color:var(--muted)}
.ern-tip .r .up{color:var(--up)} .ern-tip .r .dn{color:var(--down)}
.ern-tip .nt{display:block;margin-top:3px;color:var(--muted);font-size:11px;white-space:normal}
.ern-learn{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 16px;background:var(--surface)}
.ern-learn .ern-lk{margin-right:4px}
.ern-q{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border:1px solid var(--line);border-radius:999px;background:var(--bg);font:600 12.5px/1 var(--sans);color:var(--ink);cursor:pointer}
.ern-q::before{content:"?";display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:color-mix(in srgb,var(--accent) 20%,transparent);color:var(--accent);font:700 10px/1 var(--mono)}
.ern-q:hover{border-color:var(--accent)}
.ern-q.on{border-color:var(--accent);background:var(--accent);color:var(--on-acc)}
.ern-q.on::before{background:var(--on-acc);color:var(--accent)}
.ern-slot:empty{display:none}
.ern-card{padding:14px 16px 16px;display:flex;flex-direction:column;gap:10px;background:color-mix(in srgb,var(--accent) 4%,var(--surface));animation:ernIn .3s ease-out}
@keyframes ernIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.ern-card{animation:none}}
.ern-card-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
.ern-card-n{font-family:var(--display);font-weight:400;font-size:28px;line-height:.95;text-transform:uppercase;color:var(--ink)}
.ern-card-a{font:500 10.5px/1.3 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.ern-dl{display:flex;flex-direction:column;margin:0}
.ern-dl > div{display:grid;grid-template-columns:150px minmax(0,1fr);gap:14px;padding:9px 0;border-top:1px solid var(--line)}
.ern-dl dt{font:600 10px/1.6 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.ern-dl dd{margin:0;font-size:14.5px;line-height:1.55;color:color-mix(in srgb,var(--ink) 88%,transparent);min-width:0;overflow-wrap:anywhere}
.ern-dl .what dt{color:var(--accent)} .ern-dl .why dt{color:var(--ink)} .ern-dl .st dt{color:var(--info)} .ern-dl .lt dt{color:var(--up)} .ern-dl .hop dt{color:var(--flame,var(--accent))} .ern-dl .here dt{color:var(--violet)} .ern-dl .where dt{color:var(--info)}
@media(max-width:560px){.ern-dl > div{grid-template-columns:1fr;gap:2px}}
.ern-reads{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,140px),1fr));gap:1px;background:var(--line)}
.ern-reads.ern-r3{grid-template-columns:repeat(auto-fit,minmax(min(100%,100px),1fr))}
.ern-reads > div{background:var(--surface);padding:11px 16px;display:flex;flex-direction:column;gap:4px;min-width:0}
.ern-reads span{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.ern-reads b{font:600 17px/1.2 var(--mono);color:var(--ink);overflow-wrap:anywhere}
.ern-empty{padding:28px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;color:var(--muted);font-size:14.5px;line-height:1.55}
.ern-empty > * + *{border-top:0}
.ern-empty h4{font-family:var(--display);font-weight:400;font-size:30px;line-height:1;text-transform:uppercase;color:var(--ink)}
.ern-empty p{max-width:56ch}
.ern-empty .ern-quick{justify-content:center}
.ern-err{border-left:4px solid var(--down)}
.ern-err h4{color:var(--ink)}
.ern-sk{display:flex;flex-direction:column;gap:14px}
.ern-sk i{display:block;border-radius:var(--r);background:linear-gradient(90deg,var(--surface) 0%,var(--surface-2) 40%,var(--surface) 80%);background-size:200% 100%;animation:ernSk 1.2s linear infinite;border:1px solid var(--line)}
.ern-sk .row{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:12px}
@keyframes ernSk{from{background-position:100% 0}to{background-position:-100% 0}}
@media(prefers-reduced-motion:reduce){.ern-sk i{animation:none}}
.ern-hint{font-size:13px;color:var(--muted)}
.ern-recipe{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 16px;background:var(--surface);font-size:14px;color:var(--muted)}
.ern-recipe b{font:600 14px var(--mono);color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:4px 8px;white-space:nowrap}
.ern-recipe b.acc{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
.ern-lens .wg-ctrl{display:grid;gap:16px 24px;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));padding:18px}
.ern-lens .fld input{max-width:180px}
.ern-lens .wg-msg,.ern-panel .wg-msg{border-top:1px solid var(--line)}
.ern-gl{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:8px}
.ern-gl details{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);min-width:0}
.ern-gl summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 16px;cursor:pointer;list-style:none}
.ern-gl summary > span.t{display:flex;flex-wrap:wrap;gap:2px 10px;align-items:baseline;min-width:0}
.ern-gl summary::-webkit-details-marker{display:none}
.ern-gl summary b{font:600 15px var(--sans);color:var(--ink)}
.ern-gl summary span.t > span{font:500 10.5px/1.3 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.ern-gl .ern-dl > div{grid-template-columns:1fr;gap:2px}
.ern-gl summary::after{content:"+";font:600 16px var(--mono);color:var(--accent)}
.ern-gl details[open] summary::after{content:"−"}
.ern-gl details .ern-dl{padding:0 16px 10px}
.ern-more{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.ern-more a{background:var(--surface);padding:16px;display:flex;flex-direction:column;gap:6px;text-decoration:none;color:inherit;min-width:0}
.ern-more a:hover{background:var(--surface-2)}
.ern-more a span{font:600 10px/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.ern-more a b{font-size:16px;line-height:1.3;color:var(--ink)}
.ern-more a small{font-size:13px;line-height:1.5;color:var(--muted)}
.ern-notes > * + *{border-top:0}
.ern .wg-msg .pill{white-space:nowrap}
@media(max-width:560px){.ern .wg-msg{flex-direction:column;gap:8px}}
.ern-notes{padding:16px 18px;display:flex;flex-direction:column;gap:10px;font-size:13.5px;line-height:1.6;color:var(--muted)}
.ern-notes ul{padding-left:18px;display:flex;flex-direction:column;gap:4px}
.ern-notes a{color:var(--ink);text-decoration-color:var(--accent);text-underline-offset:3px}
.ern-tblw{overflow-x:auto;-webkit-overflow-scrolling:touch}
.ern-tbl{border-collapse:collapse;font:500 12.5px/1.35 var(--mono);font-variant-numeric:tabular-nums;min-width:100%}
.ern-tbl th,.ern-tbl td{padding:7px 10px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap;color:var(--text)}
.ern-tbl thead th{font:500 9.5px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.1em;color:var(--muted);background:var(--shade);vertical-align:bottom}
.ern-tbl th:first-child,.ern-tbl td:first-child{text-align:left;position:sticky;left:0;background:var(--surface)}
.ern-tbl thead th:first-child{background:var(--shade)}
.ern-tbl td.up{color:var(--up)} .ern-tbl td.dn{color:var(--down)} .ern-tbl td.na{color:var(--muted);opacity:.7}
.ern-tbl tr.cur td{color:var(--ink);font-weight:600}
.ern-tblx summary{padding:12px 16px;cursor:pointer;font:600 12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.ern-flash{animation:ernFlash 1.4s ease-out}
@keyframes ernFlash{0%{box-shadow:0 0 0 3px var(--accent)}100%{box-shadow:0 0 0 0 transparent}}
svg .ern-bar{fill:color-mix(in srgb,var(--info) 42%,var(--surface))}
svg .ern-bya{fill:color-mix(in srgb,var(--info) 70%,var(--surface));stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 2}
svg .ern-ghost{fill:color-mix(in srgb,var(--info) 16%,transparent);stroke:color-mix(in srgb,var(--info) 70%,transparent);stroke-width:1}
svg .ern-ttm{fill:color-mix(in srgb,var(--accent) 22%,transparent);stroke:var(--accent);stroke-width:1.4;stroke-dasharray:4 3}
svg .ern-na{fill:none;stroke:var(--muted);stroke-width:1;stroke-dasharray:2 2}
svg .ern-hlr{fill:color-mix(in srgb,var(--ink) 7%,transparent)}
svg .ern-gl{stroke:var(--muted);stroke-width:1;stroke-dasharray:3 3}
svg .ern-st0{stop-color:var(--info);stop-opacity:.32}
svg .ern-st1{stop-color:var(--info);stop-opacity:0}
svg .ern-mk{stroke:var(--bg);stroke-width:1.5}
svg .ern-ring{fill:none;stroke:var(--accent);stroke-width:2}
`);

  /* ---------------- concepts: every metric or idea shown, explained four ways ----------------
     t title · full (acronym spelled out) · what · why · st (short term: around earnings) · lt (long term: a 10-year
     owner) · hop (Hoppy's Coffee Cart, SPEC-realco.md numbers, one line) · where (optional) · here(D) (this company) */
  const C = {
    gaap: { t: 'GAAP vs non-GAAP', full: 'GAAP = Generally Accepted Accounting Principles',
      what: 'GAAP is the official US rulebook for counting revenue, costs and profit. Every number on this page is GAAP, taken from the company’s filings with the SEC. Non-GAAP (or “adjusted”) figures are the company’s own versions that leave out some costs, such as stock-based pay or one-time charges.',
      why: 'GAAP numbers follow the same rules at every US company and the yearly ones are audited, so you can compare them. Adjusted numbers can help you see the core business, but management decides what to leave out.',
      st: 'Headlines and analyst estimates usually use adjusted EPS, so the first move after a report often follows the adjusted number compared with what analysts expected.',
      lt: 'Over 10 years, owners keep what GAAP profit and cash flow say. If adjusted profit is always far above GAAP profit, real costs are being left out of the story.',
      hop: 'Leaving out the $200 of cart-loan interest would make Hoppy’s June profit look $200 bigger before tax. The interest is still paid.' },
    revenue: { t: 'Revenue', full: 'Sales, the top line',
      what: 'All the money customers paid for what the company delivered in the period, before any costs.',
      why: 'Every dollar of profit starts as a dollar of sales. Growing revenue means more customers, higher prices or new products.',
      st: 'Revenue above or below what analysts expected is one of the first things traders react to in the minutes after a report.',
      lt: 'A business can only grow profit for so long without growing sales. Steady revenue growth is the base of long-term compounding.',
      hop: 'Sales of $10,000 this June, up 25% from $8,000 last June.',
      here: (D) => D.L && isN(D.L.rev) ? `${money(D.L.rev)} in the ${D.qName}${isN(D.L.revY) ? `, ${SP(D.L.revY)} from a year ago` : ''}. Over the last 12 months: ${money(D.ttm.revenue)}.` : null },
    yoy: { t: 'YoY vs QoQ', full: 'Year over year vs quarter over quarter',
      what: 'YoY compares a quarter with the same quarter a year earlier. QoQ compares it with the quarter just before.',
      why: 'Many businesses are seasonal: a toy maker sells most in the holiday quarter. Comparing December with September would look like a boom, and March with December like a crash. YoY compares like with like.',
      st: 'Headlines and analysts focus on YoY growth. A sudden speed-up or slowdown in YoY growth often moves the stock.',
      lt: 'For a long-term owner, the trend in YoY growth over many quarters says more than any single number.',
      hop: 'Hoppy’s $10,000 this June vs $8,000 last June is +25% YoY. Comparing with a slow, rainy May would exaggerate it.',
      here: (D) => D.L && isN(D.L.revY) ? `Sales ${SP(D.L.revY)} YoY${isN(D.L.revQ) ? ` and ${SP(D.L.revQ)} QoQ` : ''} in the ${D.qName}.` : null },
    seasonality: { t: 'Seasonality', full: 'Patterns through the year',
      what: 'A regular pattern through the year: retailers sell most around the holidays, travel peaks in summer, some software sells most in the last quarter of the year.',
      why: 'It is why the year-ago quarter is the fair comparison, and why one quarter is not the whole year.',
      st: 'Analysts’ estimates already include the season, so traders compare results with those estimates and with the same quarter last year.',
      lt: 'Seasons cancel out over a year. Look at the 12-month (TTM) and yearly totals for the long view.',
      hop: 'Hoppy’s cart sells more on sunny summer days than in a rainy spring.',
      here: (D) => D.season ? D.season.text : null },
    ttm: { t: 'TTM', full: 'Trailing twelve months',
      what: 'The last four quarters added together: a rolling one-year total that updates every quarter.',
      why: 'It smooths out the seasons and gives a full-year view without waiting for the annual report. The P/E and FCF yield on this page use TTM numbers.',
      st: 'Each report swaps a quarter from a year ago for the new one, so the TTM numbers, and the P/E, shift after every report.',
      lt: 'The direction of TTM revenue, profit and cash flow over the years is the cleanest picture of whether a business is growing.',
      hop: 'Hoppy’s TTM sales are the last 12 months added up, so the slow winter and the busy summer both count.',
      here: (D) => isN(D.ttm.revenue) || isN(D.ttm.netInc) ? `TTM revenue ${money(D.ttm.revenue)}, TTM net income ${money(D.ttm.netInc)}, TTM free cash flow ${money(D.ttm.fcf)}.` : null },
    grossMargin: { t: 'Gross margin', full: 'Gross profit ÷ revenue',
      what: 'Revenue minus the direct cost of what was sold (that is gross profit), as a percent of revenue.',
      why: 'It shows pricing power. A high or rising gross margin means customers pay well above what the product costs to make.',
      st: 'A margin below expectations can sink a stock even when sales beat, because it hints that costs or discounts are rising.',
      lt: 'Businesses that keep high gross margins for a decade often have something rivals cannot copy easily, such as a brand, a network or a patent.',
      hop: '($10,000 − $4,000 of beans, milk and cups) ÷ $10,000 = 60%, up from 55% last June.',
      here: (D) => D.L && isN(D.L.gm) ? `${P(D.L.gm)} in the ${D.qName}${D.YA && isN(D.YA.gm) ? ` (${P(D.YA.gm)} a year earlier)` : ''}.` : 'Not reported. Banks and some service companies do not report a cost of sales, so there is no gross margin.' },
    opMargin: { t: 'Operating margin', full: 'Operating income ÷ revenue',
      what: 'Operating income (gross profit minus running costs such as research, sales and offices) as a percent of revenue.',
      why: 'This is the profit from the core business before interest and taxes. It shows how well the company turns sales into profit as it grows.',
      st: 'Margins above or below what analysts modeled change the profit they expect for next year, which moves the price.',
      lt: 'When revenue grows faster than costs, margins widen and profit grows faster than sales. That is operating leverage, and it drives a lot of long-term returns.',
      hop: '$4,000 of operating income ÷ $10,000 of sales = 40%, up from 32.5% last June.',
      here: (D) => D.L && isN(D.L.om) ? `${P(D.L.om)} in the ${D.qName}${D.YA && isN(D.YA.om) ? ` (${P(D.YA.om)} a year earlier)` : ''}.` : null },
    netMargin: { t: 'Net margin', full: 'Net income ÷ revenue',
      what: 'Net income as a percent of revenue: how many cents of each sales dollar end up as profit after all costs, interest and taxes.',
      why: 'It lets you compare companies of different sizes. A software company often keeps far more of each dollar than a supermarket does.',
      st: 'One-time items (a lawsuit, a tax change, a gain on an investment) can swing net margin for a quarter. Traders try to look through them.',
      lt: 'A net margin that holds up across good and bad years is a sign of a durable business.',
      hop: '$3,040 of profit ÷ $10,000 of sales = 30.4%.',
      here: (D) => D.L && isN(D.L.nm) ? `${P(D.L.nm)} in the ${D.qName}${D.YA && isN(D.YA.nm) ? ` (${P(D.YA.nm)} a year earlier)` : ''}.` : null },
    netIncome: { t: 'Net income', full: 'The bottom line',
      what: 'What is left after every cost, interest payment and tax. A negative number is a net loss.',
      why: 'It is the profit that belongs to shareholders. It can be reinvested, used for buybacks or paid out as dividends.',
      st: 'A big jump or drop often has a one-time cause. Check whether operating income moved the same way.',
      lt: 'Over long periods, share prices have tended to follow profit per share. Steady growth in net income is what a 10-year owner is paying for.',
      hop: '$3,040 in June, up from $1,920 last June.',
      here: (D) => D.L && isN(D.L.ni) ? `${smoney(D.L.ni)} in the ${D.qName}${D.YA && isN(D.YA.ni) ? ` (${smoney(D.YA.ni)} a year earlier)` : ''}.` : null },
    eps: { t: 'EPS (diluted)', full: 'Earnings per share',
      what: 'Net income divided by the number of shares. “Diluted” also counts shares that could be created from employee stock awards, options and convertible bonds, so it is the more careful figure.',
      why: 'You own shares, not the whole company. EPS is your slice of the profit.',
      st: 'EPS against the analysts’ estimate (the “beat” or “miss”) is the headline on earnings day. Most estimates are adjusted, while this page shows GAAP, so the two can differ.',
      lt: 'Growing EPS for years, through more profit and fewer shares, is the engine behind long-term stock returns.',
      hop: '$3,040 ÷ 1,000 shares = $3.04, up from $1.92 last June.',
      here: (D) => D.L && isN(D.L.eps) ? `${D.L.derived ? '≈' : ''}${usd(D.L.eps)} in the ${D.qName}${D.YA && isN(D.YA.eps) ? ` (${D.YA.derived ? '≈' : ''}${usd(D.YA.eps)} a year earlier)` : ''}.${D.L.derived ? ' ≈ marks a fourth quarter worked out as the full year minus the first nine months, so it is approximate.' : ''}` : null },
    shares: { t: 'Share count', full: 'Buybacks and dilution',
      what: 'How many shares exist. Buybacks (the company buying its own stock) shrink the count. Dilution (new shares for employee pay, acquisitions or raising money) grows it.',
      why: 'Fewer shares means each one owns a bigger slice of the profit. More shares means a smaller slice.',
      st: 'A new buyback announcement often gives the stock a small lift. A surprise share sale usually pushes it down.',
      lt: 'A share count that shrinks 2% a year adds about 2% a year to EPS growth for a long-term owner, even if profit stays flat. Steady dilution does the opposite.',
      hop: 'If Hoppy bought back 100 of the 1,000 shares, June’s $3,040 profit would be $3.38 per share instead of $3.04.',
      here: (D) => D.SH ? `${shares(D.SH.sh)} diluted shares in the ${longLab(D.SH.label, D.SH.end)} quarter${D.SHYA ? ` (${shares(D.SHYA.sh)} a year earlier, ${SP(D.shChg)})` : ''}.` : null },
    sbc: { t: 'Stock-based pay', full: 'SBC = stock-based compensation',
      what: 'Paying employees with shares or stock options instead of cash.',
      why: 'It is a real cost: it creates new shares. GAAP counts it as an expense, adjusted figures often leave it out, and the cash flow statement adds it back because no cash left the company.',
      st: 'It rarely moves the stock by itself, but it is often the biggest gap between adjusted and GAAP profit.',
      lt: 'If buybacks only cancel out the new shares from stock pay, the cash spent on buybacks is really paying staff.',
      hop: 'Paying the barista partly in new shares saves cash today, but every owner’s slice of the cart gets a little smaller.',
      here: (D) => D.L && isN(D.L.ttmSb) ? `${money(D.L.ttmSb)} over the last 12 months${isN(D.L.ttmBb) ? `, against ${money(D.L.ttmBb)} spent on buybacks` : ''}.` : null },
    ocf: { t: 'Operating cash flow', full: 'Cash from running the business',
      what: 'The cash the business actually brought in from customers after paying suppliers, staff, interest and taxes.',
      why: 'Profit follows accounting rules; cash pays the bills. A company can report a profit while customers are slow to pay and cash runs short.',
      st: 'Usually a smaller factor on earnings day than EPS, but a big gap between profit and cash can raise questions.',
      lt: 'Over the years, operating cash flow should track or beat net income. If profit keeps rising while cash does not, look closer.',
      hop: '$3,040 in June: profit $3,040 + $200 depreciation − $300 of extra beans stocked + $100 bean bill not yet paid.',
      here: (D) => isN(D.ttm.ocf) ? `${money(D.ttm.ocf)} over the last 12 months, against ${money(D.ttm.netInc)} of net income.` : null },
    capex: { t: 'Capex', full: 'Capital expenditures',
      what: 'Money spent on long-lasting things: factories, equipment, data centers, stores.',
      why: 'Capex is an investment in future sales, but the cash is gone today. Some businesses need a lot of it just to stand still.',
      st: 'A big jump in planned capex can push a stock down even after good results, because it means less free cash for a while.',
      lt: 'Businesses that grow without heavy capex leave more cash for owners. Heavy capex is worth it only if it earns a good return later.',
      hop: 'A new $600 grinder.',
      here: (D) => D.L && isN(D.L.ttmCx) ? `${money(D.L.ttmCx)} over the last 12 months${isN(D.ttm.revenue) && D.ttm.revenue > 0 ? `, ${P(D.L.ttmCx / D.ttm.revenue * 100)} of sales` : ''}.` : 'Not reported in these filings (common for banks and insurers).' },
    fcf: { t: 'Free cash flow', full: 'FCF = operating cash flow − capex',
      what: 'Operating cash flow minus capex: the cash left after running and investing in the business.',
      why: 'It is the cash that can pay dividends, buy back shares, pay down debt or fund acquisitions. Many value investors care about it more than profit.',
      st: 'Free cash flow is rarely the headline, but a big miss on cash can matter, especially for companies with a lot of debt.',
      lt: 'A business is worth the cash it can hand its owners over its life. Free cash flow per share that grows for 10 years is a strong sign.',
      hop: '$3,040 of operating cash − the $600 grinder = $2,440.',
      here: (D) => isN(D.ttm.fcf) ? `${smoney(D.ttm.fcf)} over the last 12 months${isN(D.ttmPrev.fcf) ? ` (${smoney(D.ttmPrev.fcf)} in the 12 months before)` : ''}.` : null },
    netCash: { t: 'Cash, debt and net cash', full: 'What it owns minus what it owes',
      what: 'Cash plus short- and long-term investments, minus all borrowed money. Positive is net cash; negative is net debt.',
      why: 'Debt has to be repaid or refinanced, with interest. A net cash cushion lets a company survive a bad year and keep investing.',
      st: 'A strong balance sheet rarely moves the stock on earnings day, but heavy debt makes a stock swing more when results disappoint.',
      lt: 'For a 10-year owner, a company that cannot be forced to raise money at a bad time is much safer. Net debt that keeps growing is a warning.',
      hop: '$6,000 of cash − the $5,000 cart loan = $1,000 of net cash.',
      here: (D) => D.BL && isN(D.BL.nc) ? `Cash and investments ${money(D.BL.ci)}, debt ${D.noDebt ? 'not reported' : money(D.BL.dt)}: ${D.BL.nc >= 0 ? 'net cash ' + money(D.BL.nc) : 'net debt ' + money(-D.BL.nc)} at ${dShort(D.BL.end)}.` : null },
    pe: { t: 'P/E', full: 'Price-to-earnings ratio',
      what: 'The share price divided by EPS over the last 12 months: how many dollars you pay for each $1 of yearly profit.',
      why: 'It is the quickest way to see how much optimism is in the price. A high P/E means investors expect strong growth; a low one means they expect little, or see risk.',
      st: 'After a report, the price often moves because the P/E investors will pay changes, along with the EPS they expect.',
      lt: 'A 10-year return comes from EPS growth, dividends and the change in the P/E. Buying at a very high P/E means a lot of growth must happen just to stand still.',
      hop: 'If Hoppy earned $36.48 a share over a year ($3.04 a month) and a share sold for $730, the P/E would be about 20.',
      here: (D) => isN(D.pe) ? `${X(D.pe)} at ${usd(D.price)}${isN(D.peMed) ? `, against a typical ${Xm(D.peMed)} over the years shown` : ''}.` : (isN(D.ttm.eps) && D.ttm.eps <= 0 ? 'No P/E: the company lost money over the last 12 months.' : null) },
    ps: { t: 'P/S', full: 'Price-to-sales ratio',
      what: 'The company’s market value divided by its last 12 months of revenue.',
      why: 'It works when there is no profit yet, so it is used for young or loss-making companies, and to compare companies with very different margins.',
      st: 'Fast growers trade on P/S, so a change in growth speed can move the multiple a lot in one day.',
      lt: 'A high P/S only makes sense if margins will one day be high enough to turn those sales into a lot of profit.',
      hop: 'If Hoppy’s whole cart sold for $240,000 on $120,000 of yearly sales, the P/S would be 2.',
      here: (D) => isN(D.ps) ? `${X(D.ps)} (market value ${money(D.mcap)} ÷ TTM revenue ${money(D.ttm.revenue)}).` : null },
    fcfYield: { t: 'FCF yield', full: 'Free cash flow yield',
      what: 'TTM free cash flow divided by the company’s market value, as a percent. It is the P/E idea turned upside down, using cash.',
      why: 'It shows how much cash the business produces for each $100 you pay for it, which you can compare with what a savings account or a bond pays.',
      st: 'Rarely a trading signal on its own.',
      lt: 'A higher FCF yield gives a 10-year owner more cash per dollar invested, as long as the cash holds up or grows.',
      hop: '$2,440 a month is $29,280 a year. If the cart sold for $292,800, the FCF yield would be 10%.',
      here: (D) => isN(D.fcfYield) ? `${P(D.fcfYield)}: about ${usd(D.fcfYield, 2)} of free cash a year for each $100 of stock.` : null },
    marketCap: { t: 'Market cap', full: 'Market capitalization',
      what: 'Share price × shares outstanding: what the market says the whole company is worth today.',
      why: 'It is the price tag for the whole business. Compare it with yearly profit, sales or cash flow to judge value.',
      st: 'It moves every second with the share price.',
      lt: 'Ask whether the business could reasonably earn enough over the next decade to justify this price tag.',
      hop: '1,000 shares at $730 = $730,000 for Hoppy’s cart.',
      here: (D) => isN(D.mcap) ? `${money(D.mcap)} at ${usd(D.price)} a share.` : null },
    filings: { t: '10-Q, 10-K and 8-K', full: 'SEC report forms',
      what: 'Reports public companies file with the SEC (the Securities and Exchange Commission, the US market regulator). 10-Q: the quarterly report. 10-K: the annual report, with audited statements. 8-K: news between reports; the earnings press release is filed under Item 2.02.',
      why: 'These filings are the official source behind every number on finance sites. This page reads them directly.',
      st: 'The press release (8-K) comes first, usually before the market opens or after it closes, and the stock reacts within seconds. The full 10-Q often follows days later.',
      lt: 'The 10-K’s risk factors and management discussion are where a long-term owner learns how the business really works.',
      here: (D) => D.m.latest && D.m.latest.form ? `Latest: ${esc(D.m.latest.form)} for the ${D.qName}${D.m.latest.filed ? `, filed ${dShort(D.m.latest.filed)}` : ''}${D.m.latest.release && D.m.latest.release.date ? `; earnings release ${dShort(D.m.latest.release.date)}` : ''}.` : null },
    fiscal: { t: 'Fiscal quarter', full: 'The company’s own calendar',
      what: 'Many companies use a business year that does not end in December. Apple’s fiscal year ends in late September, so its April to June quarter is its fiscal Q3.',
      why: 'Fiscal labels differ between companies, so this page shows the calendar months too.',
      st: 'Report dates follow each company’s fiscal calendar, so companies in the same industry can report weeks apart.',
      lt: 'It does not change the long-term picture. Compare the same fiscal quarter year to year, or use 12-month totals.',
      here: (D) => D.m.fiscalYearEnd && /^\d{4}$/.test(D.m.fiscalYearEnd) ? `The fiscal year ends around ${MONL[+D.m.fiscalYearEnd.slice(0, 2) - 1] || '?'} ${+D.m.fiscalYearEnd.slice(2)}. The latest quarter is fiscal ${esc(D.L.fq || '?')} ${esc(D.L.fy || '')}.` : null },
    guidance: { t: 'Guidance and consensus', full: 'Expectations',
      what: 'Guidance is management’s own forecast for the next quarter or year (not every company gives one). Consensus is the average of analysts’ estimates.',
      why: 'Stocks move on the surprise: results and outlook compared with what was expected.',
      st: 'Guidance often matters more than the quarter just reported. A beat with weak guidance often falls; a miss with raised guidance can rise.',
      lt: 'Over 10 years, beating estimates by a penny does not matter. What matters is whether the business keeps growing its profit and cash.',
      where: 'Not in this data. Guidance: the earnings release and the earnings call, on the company’s investor relations site. Consensus: finance news sites and your broker’s research pages.' },
    reaction: { t: 'The earnings reaction', full: 'The move around the report',
      what: 'How much the stock moved around the report: from the last close before the results came out to the first close after.',
      why: 'It shows how much the results surprised investors. The same results can send a stock up or down depending on what was expected.',
      st: 'Option prices rise before a report and drop right after (IV crush). The typical past move gives a feel for how big a surprise usually is.',
      lt: 'For a 10-year owner, one day’s move is noise. It matters only if it reflects a real change in the business.',
      here: (D) => isN(D.avgMove) ? `On average it moved ${P(D.avgMove)} either way after its last ${D.reac.length} reports (biggest: ${SP(D.maxMove.pct)}).` : null },
  };
  const ORDER = ['gaap', 'filings', 'fiscal', 'revenue', 'yoy', 'seasonality', 'ttm', 'grossMargin', 'opMargin', 'netMargin', 'netIncome', 'eps', 'shares', 'sbc', 'ocf', 'capex', 'fcf', 'netCash', 'marketCap', 'pe', 'ps', 'fcfYield', 'reaction', 'guidance'];

  function cardHTML(k, D) {
    const c = C[k]; if (!c) return '';
    let here = null; try { here = c.here && D ? c.here(D) : null; } catch (e) { here = null; }
    const who = D ? esc(D.m.ticker || 'this company') : '';
    return `<div class="ern-card-h"><span class="ern-card-n">${c.t}</span>${c.full ? `<span class="ern-card-a">${c.full}</span>` : ''}</div>
      <dl class="ern-dl">
        <div class="what"><dt>What it is</dt><dd>${c.what}</dd></div>
        <div class="why"><dt>Why it matters</dt><dd>${c.why}</dd></div>
        <div class="st"><dt>Short term</dt><dd>${c.st}</dd></div>
        <div class="lt"><dt>Long term (10 years)</dt><dd>${c.lt}</dd></div>
        ${c.hop ? `<div class="hop"><dt>At Hoppy’s cart</dt><dd>${c.hop}</dd></div>` : ''}
        ${c.where ? `<div class="where"><dt>Where to find it</dt><dd>${c.where}</dd></div>` : ''}
        ${here ? `<div class="here"><dt>At ${who}</dt><dd>${here}</dd></div>` : ''}
      </dl>`;
  }
  const learnRow = (keys) => `<div class="ern-learn"><span class="ern-lk">Tap to learn</span>${keys.filter((k) => C[k]).map((k) => `<button type="button" class="ern-q" data-c="${k}" aria-expanded="false">${C[k].t}</button>`).join('')}</div><div class="ern-slot"></div>`;

  /* ---------------- derive every number from the model ---------------- */
  function derive(m) {
    const D = { m, sample: !!m.sample };
    const Q = (Array.isArray(m.quarters) ? m.quarters : []).filter((q) => q && dn(q.end) != null).map((q) => Object.assign({}, q)).sort((a, b) => dn(a.end) - dn(b.end));
    Q.forEach((q, i) => {
      q.i = i; q.d = dn(q.end);
      q.rev = N(q.revenue); q.cst = N(q.cost);
      q.gp = N(q.gross); if (q.gp == null && q.rev != null && q.cst != null) q.gp = q.rev - q.cst;
      q.op = N(q.opInc); q.ni = N(q.netInc); q.eps = N(q.epsDil); q.sh = N(q.shDil);
      q.cfo = N(q.ocf); q.cx = isN(q.capex) ? Math.abs(q.capex) : null;
      q.fc = N(q.fcf); if (q.fc == null && q.cfo != null && q.cx != null) q.fc = q.cfo - q.cx;
      q.bb = N(q.buybacks); q.dv = N(q.dividends); q.sb = N(q.sbc);
      q.gm = ratio(q.gp, q.rev); q.om = ratio(q.op, q.rev); q.nm = ratio(q.ni, q.rev);
      if (q.rev != null && q.rev > 0) { if (q.gp != null) q.gm = q.gp / q.rev * 100; if (q.op != null) q.om = q.op / q.rev * 100; if (q.ni != null) q.nm = q.ni / q.rev * 100; }
      q.short = shortLab(q.label, q.end); q.long = longLab(q.label, q.end);
    });
    Q.forEach((q) => {
      let best = null; Q.forEach((p) => { const gap = q.d - p.d; if (Math.abs(gap - 365) <= 25 && (!best || Math.abs(gap - 365) < Math.abs(q.d - best.d - 365))) best = p; });
      q.ya = best; const pv = Q[q.i - 1]; q.pv = pv && q.d - pv.d >= 60 && q.d - pv.d <= 120 ? pv : null;
      const y = q.ya;
      q.revY = gr(q.rev, y && y.rev); q.niY = gr(q.ni, y && y.ni); q.epsY = gr(q.eps, y && y.eps); q.revQ = gr(q.rev, q.pv && q.pv.rev);
      q.fcY = gr(q.fc, y && y.fc);
    });
    const ttmAt = (i, k) => { if (i < 3) return null; let s = 0; for (let j = i - 3; j <= i; j++) { const v = Q[j][k]; if (!isN(v)) return null; if (j > i - 3) { const g = Q[j].d - Q[j - 1].d; if (g < 60 || g > 120) return null; } s += v; } return s; };
    Q.forEach((q) => { ['rev', 'ni', 'eps', 'cfo', 'cx', 'fc', 'bb', 'dv', 'sb'].forEach((k) => { q['ttm' + k.charAt(0).toUpperCase() + k.slice(1)] = ttmAt(q.i, k); }); });
    const le = m.latest && m.latest.end;
    const L = Q.find((q) => q.end === le) || Q[Q.length - 1] || null;
    D.Q = Q; D.L = L; D.YA = L ? L.ya : null;
    D.QL = L ? Q.filter((q) => q.d <= L.d) : [];
    D.qName = L ? `${longLab(L.label, L.end)} quarter` : 'latest quarter';
    D.fiscal = L && L.fq && L.fy ? `fiscal ${L.fq} ${L.fy}` : '';
    /* TTM: the engine's derived block first, else our own sums */
    const dv = m.derived || {}, t = dv.ttm || {}, tp = dv.ttmPrev || {}, LY = L ? L.ya : null;
    D.ttm = { revenue: nz(t.revenue, L && L.ttmRev), netInc: nz(t.netInc, L && L.ttmNi), eps: nz(t.eps, L && L.ttmEps), ocf: nz(t.ocf, L && L.ttmCfo), fcf: nz(t.fcf, L && L.ttmFc) };
    D.ttmPrev = { revenue: nz(tp.revenue, LY && LY.ttmRev), netInc: nz(tp.netInc, LY && LY.ttmNi), eps: nz(tp.eps, LY && LY.ttmEps), ocf: nz(tp.ocf, LY && LY.ttmCfo), fcf: nz(tp.fcf, LY && LY.ttmFc) };
    /* balance sheet: cash + short- and long-term investments, debt, net cash */
    const B = (Array.isArray(m.balance) ? m.balance : []).filter((b) => b && dn(b.end) != null).map((b) => {
      const o = Object.assign({}, b); o.d = dn(b.end);
      const parts = [N(b.cash), N(b.stInv), N(b.ltInv)]; o.ci = parts.some(isN) ? parts.reduce((s, v) => s + (v || 0), 0) : null;
      o.dt = N(b.debt); if (o.dt == null && (isN(b.debtCur) || isN(b.debtLong))) o.dt = (N(b.debtCur) || 0) + (N(b.debtLong) || 0);
      return o;
    }).sort((a, b) => a.d - b.d);
    D.noDebt = B.length > 0 && B.every((b) => b.dt == null);
    B.forEach((b) => { b.nc = b.ci != null && (b.dt != null || D.noDebt) ? b.ci - (b.dt || 0) : null; const q = Q.find((x) => x.end === b.end); b.short = q ? q.short : shortLab(null, b.end); b.long = q ? q.long : longLab(null, b.end); });
    D.B = L ? B.filter((b) => b.d <= L.d + 5) : B;
    D.BL = D.B.length ? D.B[D.B.length - 1] : null;
    D.BYA = null; if (D.BL) D.B.forEach((b) => { const g = D.BL.d - b.d; if (Math.abs(g - 365) <= 25 && (!D.BYA || Math.abs(g - 365) < Math.abs(D.BL.d - D.BYA.d - 365))) D.BYA = b; });
    /* share count: latest quarter that reports it, and the one closest to a year before */
    const wSh = D.QL.filter((q) => q.sh != null);
    D.SH = wSh.length ? wSh[wSh.length - 1] : null; D.SHYA = null;
    if (D.SH) wSh.forEach((q) => { const g = D.SH.d - q.d; if (g >= 300 && g <= 430 && (!D.SHYA || Math.abs(g - 365) < Math.abs(D.SH.d - D.SHYA.d - 365))) D.SHYA = q; });
    D.shChg = D.SH && D.SHYA ? gr(D.SH.sh, D.SHYA.sh) : null;
    /* price */
    const pr = m.price || null;
    D.ser = pr && Array.isArray(pr.series) ? pr.series.filter((p) => Array.isArray(p) && dn(p[0]) != null && isN(p[1]) && p[1] > 0).map((p) => ({ d: dn(p[0]), s: p[0], c: p[1] })).sort((a, b) => a.d - b.d) : [];
    D.price = pr ? N(pr.last) : null; D.priceDate = pr ? pr.lastDate : null;
    if (D.price == null && D.ser.length) { const z = D.ser[D.ser.length - 1]; D.price = z.c; D.priceDate = z.s; }
    D.priceAt = (d) => { const s = D.ser; if (!s.length || d < s[0].d - 10) return null; let lo = 0, hi = s.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (s[mid].d <= d) lo = mid; else hi = mid - 1; } return s[lo].d <= d ? s[lo].c : null; };
    D.reac = (pr && Array.isArray(pr.reactions) ? pr.reactions : []).filter((r) => r && isN(r.pct) && dn(r.release || r.end) != null).map((r) => { const q = Q.find((x) => x.end === r.end); return { d: dn(r.release || r.end), release: r.release || null, end: r.end, pct: r.pct, short: q ? q.short : shortLab(null, r.end), long: q ? q.long : longLab(null, r.end) }; }).sort((a, b) => a.d - b.d);
    D.avgMove = D.reac.length >= 3 ? mean(D.reac.map((r) => Math.abs(r.pct))) : null;
    D.maxMove = D.reac.reduce((b, r) => (!b || Math.abs(r.pct) > Math.abs(b.pct) ? r : b), null);
    D.lastReac = L ? D.reac.find((r) => r.end === L.end) || null : null;
    /* valuation */
    const so = m.sharesOut && isN(m.sharesOut.value) ? m.sharesOut.value / 1e6 : null;
    D.shOut = nz(so, D.SH && D.SH.sh);
    D.mcap = nz(dv.marketCap, isN(D.price) && isN(D.shOut) ? D.price * D.shOut : null);
    D.pe = nz(dv.pe, isN(D.price) && isN(D.ttm.eps) && D.ttm.eps > 0 ? D.price / D.ttm.eps : null);
    if (isN(D.ttm.eps) && D.ttm.eps <= 0) D.pe = null;
    D.ps = nz(dv.ps, isN(D.mcap) && isN(D.ttm.revenue) && D.ttm.revenue > 0 ? D.mcap / D.ttm.revenue : null);
    D.fcfYield = nz(dv.fcfYield, isN(D.mcap) && D.mcap > 0 && isN(D.ttm.fcf) ? D.ttm.fcf / D.mcap * 100 : null);
    /* P/E and P/S history: price around each report ÷ the TTM numbers known then */
    D.peHist = []; D.psHist = [];
    D.QL.forEach((q) => {
      const day = q.release && dn(q.release) != null ? dn(q.release) + 1 : q.d + 40; const px = D.priceAt(day); if (!isN(px)) return;
      if (isN(q.ttmEps) && q.ttmEps > 0) D.peHist.push({ q, v: px / q.ttmEps });
      let sh = q.sh; if (sh == null) { const p = D.QL.filter((x) => x.sh != null && x.d <= q.d).pop(); sh = p ? p.sh : null; }
      if (isN(sh) && isN(q.ttmRev) && q.ttmRev > 0) D.psHist.push({ q, v: px * sh / q.ttmRev });
    });
    D.peMed = D.peHist.length >= 4 ? median(D.peHist.map((x) => x.v)) : null;
    D.psMed = D.psHist.length >= 4 ? median(D.psHist.map((x) => x.v)) : null;
    /* annual (10 years) */
    D.A = (Array.isArray(m.annual) ? m.annual : []).filter((a) => a && isN(a.fy)).map((a) => {
      const o = { fy: a.fy, end: a.end, rev: N(a.revenue), ni: N(a.netInc), eps: N(a.epsDil), sh: N(a.shDil), cfo: N(a.ocf), cx: isN(a.capex) ? Math.abs(a.capex) : null };
      o.fc = nz(a.fcf, o.cfo != null && o.cx != null ? o.cfo - o.cx : null);
      o.fcps = isN(o.fc) && isN(o.sh) && o.sh > 0 ? o.fc / o.sh : null;
      return o;
    }).sort((a, b) => a.fy - b.fy);
    /* seasonality: each quarter vs a quarter of its trailing year, averaged by calendar month */
    D.season = (function () {
      const g = {}; let cnt = 0;
      D.QL.forEach((q) => { if (!isN(q.rev) || !isN(q.ttmRev) || q.ttmRev <= 0) return; const p = labParts(q.label, q.end); if (!p) return; (g[p.m] = g[p.m] || []).push(q.rev / (q.ttmRev / 4)); cnt++; });
      const ks = Object.keys(g).filter((k) => g[k].length >= 2);
      if (cnt < 8 || ks.length < 3) return null;
      let best = null; ks.forEach((k) => { const a = mean(g[k]); if (!best || a > best.a) best = { m: +k, a }; });
      const pct = (best.a - 1) * 100;
      if (pct < 6) return { strong: false, text: 'Sales are fairly even through the year, so the quarter-before comparison is not far off. YoY is still the cleaner view.' };
      return { strong: true, m: best.m, pct, text: `Sales are seasonal: the quarter ending in ${MONL[best.m]} is usually the biggest, about ${F.num(pct, 0)}% above an average quarter. Compare each quarter with the same one a year earlier.` };
    })();
    return D;
  }

  /* ---------------- verdicts ----------------
     Thresholds (simple on purpose):
     SALES      latest YoY revenue growth g vs the average YoY growth of up to 3 quarters before (gp).
                Weakening if g < −1% (sales shrank) or g − gp ≤ −5 points (sharp slowdown).
                Improving if g ≥ +1% and g − gp ≥ +2 points (or, with no history, g ≥ +5%). Otherwise Steady.
     PROFIT     net income vs the same quarter a year ago. Loss → profit: Improving. Profit → loss: Weakening.
                Both profits: ≥ +5% Improving, ≤ −5% Weakening. Both losses: loss 10%+ smaller Improving, 10%+ bigger Weakening.
     EPS        same rule as PROFIT, on diluted EPS.
     MARGINS    operating margin (net margin when there is no operating income) vs a year ago, in percentage points:
                ≥ +1 point Improving, ≤ −1 point Weakening.
     CASH       trailing-12-month free cash flow vs the 12 months before, same rule as PROFIT.
     BALANCE    net cash (cash + investments − debt) vs a year ago; the change is measured against total assets (TTM
                revenue if assets are missing): ≥ +2% Improving, ≤ −2% Weakening.
     SHARES     diluted share count vs a year ago: ≤ −1% Improving (buybacks), ≥ +2% Weakening (dilution).
     VALUATION  P/E (P/S when there is no profit) vs its own median over the reports shown (needs 4+): above 1.2× the
                median "Above usual", below 0.8× "Below usual", else "Near usual". Neutral colors: it describes the
                price, it is not a verdict on the business and never a signal to buy or sell. */
  const VL = { up: 'Improving', flat: 'Steady', down: 'Weakening', na: 'No data' };
  function cmp(now, before, thr) {
    if (!isN(now) || !isN(before)) return null;
    if (before > 0 && now > 0) { const p = (now / before - 1) * 100; return { p, v: p >= thr ? 'up' : p <= -thr ? 'down' : 'flat', kind: 'pos' }; }
    if (before <= 0 && now > 0) return { v: 'up', kind: 'toProfit' };
    if (before > 0 && now <= 0) return { v: 'down', kind: 'toLoss' };
    if (before === 0 && now === 0) return { v: 'flat', kind: 'zero' };
    if (before === 0) return { v: 'down', kind: 'toLoss' };
    const p = (Math.abs(now) / Math.abs(before) - 1) * 100; /* + = a bigger loss */
    return { p, v: p <= -10 ? 'up' : p >= 10 ? 'down' : 'flat', kind: 'neg' };
  }
  function verdicts(D) {
    const L = D.L, YA = D.YA, out = [];
    const last8 = (k) => D.QL.slice(-8).map((q) => q[k]);
    /* 1 sales */
    (function () {
      const g = L ? L.revY : null;
      const prior = D.QL.slice(0, -1).slice(-3).map((q) => q.revY).filter(isN);
      const gp = prior.length ? mean(prior) : null;
      const o = { k: 'sales', title: 'Sales', panel: 'rev', spark: last8('revY'), sparkZero: true };
      if (!L || !isN(L.rev)) return out.push(Object.assign(o, { v: 'na', big: 'n/a', sub: 'not reported', text: 'Revenue is not reported in these filings for the latest quarter.' }));
      if (!isN(g)) return out.push(Object.assign(o, { v: 'na', big: money(L.rev), sub: 'sales this quarter', text: 'There is no year-ago quarter in the data to compare with, so the growth trend is unknown.' }));
      const v = g < -1 || (isN(gp) && g - gp <= -5) ? 'down' : g >= 1 && (isN(gp) ? g - gp >= 2 : g >= 5) ? 'up' : 'flat';
      const how = !isN(gp) ? '' : Math.abs(g - gp) < 2 ? `, about the same pace as the ${P(gp)} average of the quarters before` : g > gp ? `, faster than the ${P(gp)} average of the quarters before` : `, slower than the ${P(gp)} average of the quarters before`;
      const text = g < 0 ? `Sales fell ${P(-g)} from a year ago to ${moneyW(L.rev)}${how}.` : `Sales grew ${P(g)} from a year ago to ${moneyW(L.rev)}${how}.`;
      out.push(Object.assign(o, { v, big: SP(g), sub: 'vs a year ago', text }));
    })();
    /* 2 profit */
    (function () {
      const o = { k: 'profit', title: 'Profit', panel: 'profit', spark: last8('ni') };
      const c = cmp(L && L.ni, YA && YA.ni, 5);
      if (!L || !isN(L.ni)) return out.push(Object.assign(o, { v: 'na', big: 'n/a', sub: 'not reported', text: 'Net income is not reported for the latest quarter.' }));
      if (!c) return out.push(Object.assign(o, { v: 'na', big: smoney(L.ni), sub: 'net income', text: 'No year-ago quarter to compare with.' }));
      const t = c.kind === 'pos' ? `Net income ${c.p >= 0 ? 'rose' : 'fell'} ${P(Math.abs(c.p))} from a year ago, from ${moneyW(YA.ni)} to ${moneyW(L.ni)}.`
        : c.kind === 'toProfit' ? `It turned a ${moneyW(Math.abs(YA.ni))} loss a year ago into a ${moneyW(L.ni)} profit.`
        : c.kind === 'toLoss' ? `It swung from a ${moneyW(YA.ni)} profit a year ago to a ${moneyW(Math.abs(L.ni))} loss.`
        : c.kind === 'neg' ? `Still a loss: ${moneyW(Math.abs(L.ni))}, ${c.p < 0 ? 'smaller' : 'bigger'} than the ${moneyW(Math.abs(YA.ni))} loss a year ago.` : 'Net income was zero in both quarters.';
      out.push(Object.assign(o, { v: c.v, big: c.kind === 'pos' ? SP(c.p) : smoney(L.ni), sub: c.kind === 'pos' ? 'net income vs a year ago' : 'net income this quarter', text: t }));
    })();
    /* 3 EPS */
    (function () {
      const o = { k: 'eps', title: 'EPS', panel: 'profit', spark: last8('eps') };
      if (!L || !isN(L.eps)) return out.push(Object.assign(o, { v: 'na', big: 'n/a', sub: 'not reported', text: 'Diluted EPS is not reported for the latest quarter.' }));
      const ap = (q) => (q && q.derived ? '≈' : '');
      const c = cmp(L.eps, YA && YA.eps, 5);
      if (!c) return out.push(Object.assign(o, { v: 'na', big: ap(L) + usd(L.eps), sub: 'diluted EPS', text: 'No year-ago quarter to compare with.' }));
      let t = `Diluted EPS went from ${ap(YA)}${usd(YA.eps)} a year ago to ${ap(L)}${usd(L.eps)}${c.kind === 'pos' ? ` (${SP(c.p)})` : ''}.`;
      if (c.kind === 'pos' && isN(L.niY) && isN(c.p)) { if (c.p - L.niY >= 1.5) t += ' It grew faster than net income because the share count shrank.'; else if (L.niY - c.p >= 1.5) t += ' It grew slower than net income because there are more shares.'; }
      out.push(Object.assign(o, { v: c.v, big: ap(L) + usd(L.eps), sub: c.kind === 'pos' ? `${SP(c.p)} vs a year ago` : 'diluted EPS', text: t }));
    })();
    /* 4 margins */
    (function () {
      const useOp = L && isN(L.om) && YA && isN(YA.om);
      const a = useOp ? L.om : L && L.nm, b = useOp ? YA.om : YA && YA.nm;
      const o = { k: 'margin', title: useOp ? 'Operating margin' : 'Margins', panel: 'margin', spark: last8(useOp ? 'om' : 'nm'), sparkZero: true };
      if (!isN(a)) return out.push(Object.assign(o, { v: 'na', big: 'n/a', sub: 'not reported', text: 'Margins cannot be worked out: revenue or profit is missing for the latest quarter.' }));
      if (!isN(b)) return out.push(Object.assign(o, { v: 'na', big: P(a), sub: useOp ? 'operating margin' : 'net margin', text: 'No year-ago quarter to compare with.' }));
      const d = a - b, v = d >= 1 ? 'up' : d <= -1 ? 'down' : 'flat';
      const nm = useOp ? 'Operating margin' : 'Net margin';
      const pts = F.num(Math.abs(d), 1);
      const tail = Math.abs(d) < 0.1 ? '' : a >= 0 && b >= 0 ? `: ${pts} ${d > 0 ? 'more' : 'fewer'} cents of profit from each sales dollar` : a < 0 && b < 0 ? `: ${pts} ${d > 0 ? 'fewer' : 'more'} cents lost on each sales dollar` : `: a ${pts}-point ${d > 0 ? 'improvement' : 'drop'}`;
      const t = `${nm} was ${P(a)}, ${Math.abs(d) < 0.05 ? 'the same as' : d > 0 ? 'up from' : 'down from'} ${P(b)} a year ago${tail}.`;
      out.push(Object.assign(o, { v, big: P(a), sub: `${F.spct(d, 1).replace('%', '')} pts vs a year ago`, text: t }));
    })();
    /* 5 cash generation */
    (function () {
      const o = { k: 'cash', title: 'Cash generation', panel: 'fcf', spark: D.QL.slice(-8).map((q) => q.ttmFc) };
      const now = D.ttm.fcf, bef = D.ttmPrev.fcf;
      if (!isN(now)) return out.push(Object.assign(o, { v: 'na', big: 'n/a', sub: 'free cash flow', text: 'Free cash flow cannot be worked out: operating cash flow or capex is not reported for all of the last four quarters.' }));
      const c = cmp(now, bef, 5);
      if (!c) return out.push(Object.assign(o, { v: 'na', big: smoney(now), sub: 'free cash flow, 12 months', text: `${moneyW(now)} of free cash flow over the last 12 months. Not enough history for the 12 months before.` }));
      const t = c.kind === 'pos' ? `Free cash flow over the last 12 months was ${moneyW(now)}, ${c.p >= 0 ? 'up' : 'down'} ${P(Math.abs(c.p))} from the 12 months before.`
        : c.kind === 'toProfit' ? `Free cash flow turned positive: ${moneyW(now)} over the last 12 months, after ${moneyW(bef)} the 12 months before.`
        : c.kind === 'toLoss' ? `Free cash flow turned negative: ${moneyW(now)} over the last 12 months, after ${moneyW(bef)} the 12 months before.`
        : `Still burning cash: ${moneyW(Math.abs(now))} went out over the last 12 months, ${c.p < 0 ? 'less' : 'more'} than the ${moneyW(Math.abs(bef))} the 12 months before.`;
      out.push(Object.assign(o, { v: c.v, big: smoney(now), sub: `TTM${c.kind === 'pos' ? ', ' + SP(c.p) : ''}`, text: t }));
    })();
    /* 6 balance sheet */
    (function () {
      const o = { k: 'balance', title: 'Balance sheet', panel: 'debt', spark: D.B.slice(-8).map((b) => b.nc), sparkZero: true };
      const b = D.BL, y = D.BYA;
      if (!b || !isN(b.nc)) return out.push(Object.assign(o, { v: 'na', big: 'n/a', sub: 'net cash', text: 'Cash or debt is not reported, so net cash cannot be worked out.' }));
      const lab = (v) => (v >= 0 ? 'net cash of ' + moneyW(v) : 'net debt of ' + moneyW(-v));
      const pos = `Cash and investments ${money(b.ci)}, debt ${D.noDebt ? 'none reported' : money(b.dt)}.`;
      if (!y || !isN(y.nc)) return out.push(Object.assign(o, { v: 'na', big: smoney(b.nc), sub: b.nc >= 0 ? 'net cash' : 'net debt', text: `It has ${lab(b.nc)}. ${pos} No year-ago balance sheet to compare with.` }));
      const scale = nz(N(b.assets), D.ttm.revenue); const dlt = b.nc - y.nc;
      const rel = isN(scale) && scale > 0 ? dlt / scale * 100 : null;
      const v = !isN(rel) ? (dlt > 0 ? 'up' : dlt < 0 ? 'down' : 'flat') : rel >= 2 ? 'up' : rel <= -2 ? 'down' : 'flat';
      let t;
      if (y.nc < 0 && b.nc < 0) t = `Net debt ${-b.nc < -y.nc ? 'shrank' : 'grew'} from ${moneyW(-y.nc)} to ${moneyW(-b.nc)} in a year.`;
      else if (y.nc >= 0 && b.nc >= 0) t = `Net cash ${b.nc > y.nc ? 'rose' : 'fell'} from ${moneyW(y.nc)} to ${moneyW(b.nc)} in a year.`;
      else t = `It went from ${lab(y.nc)} a year ago to ${lab(b.nc)}.`;
      out.push(Object.assign(o, { v, big: smoney(b.nc), sub: b.nc >= 0 ? 'net cash' : 'net debt', text: t + ' ' + pos }));
    })();
    /* 7 share count */
    (function () {
      const o = { k: 'shares', title: 'Share count', panel: 'shares', spark: D.QL.slice(-8).map((q) => q.sh) };
      if (!D.SH) return out.push(Object.assign(o, { v: 'na', big: 'n/a', sub: 'diluted shares', text: 'The diluted share count is not reported.' }));
      if (!isN(D.shChg)) return out.push(Object.assign(o, { v: 'na', big: shares(D.SH.sh), sub: 'diluted shares', text: 'No share count from a year earlier to compare with.' }));
      const c = D.shChg, v = c <= -1 ? 'up' : c >= 2 ? 'down' : 'flat';
      const t = c <= -0.05 ? `The share count fell ${P(-c)} in a year, mostly from buybacks, so each share owns a slightly bigger slice of the company.`
        : c >= 0.05 ? `The share count rose ${P(c)} in a year (new shares, often from stock pay or deals), so each share owns a smaller slice.`
        : 'The share count barely changed in a year.';
      out.push(Object.assign(o, { v, big: SP(c), sub: `${shares(D.SH.sh)} shares`, text: t }));
    })();
    /* 8 valuation (neutral) */
    (function () {
      const o = { k: 'value', title: 'Valuation', panel: 'price', neutral: true };
      if (!isN(D.price)) return out.push(Object.assign(o, { v: 'na', big: 'n/a', sub: 'no price', text: 'No share price is available, so valuation ratios cannot be worked out.' }));
      const useP = isN(D.pe), val = useP ? D.pe : D.ps, med = useP ? D.peMed : D.psMed, nm = useP ? 'P/E' : 'P/S';
      o.spark = (useP ? D.peHist : D.psHist).slice(-8).map((x) => x.v);
      if (!isN(val)) return out.push(Object.assign(o, { v: 'na', big: 'n/a', sub: 'P/E and P/S', text: 'Earnings and sales over the last 12 months are not available, so there is no P/E or P/S.' }));
      const what = useP ? `At ${usd(D.price)} the stock costs ${X(val)} its last 12 months of earnings` : `It lost money over the last 12 months, so there is no P/E. At ${usd(D.price)} the company is valued at ${X(val)} its last 12 months of sales`;
      if (!isN(med)) return out.push(Object.assign(o, { v: 'neu', vl: nm + ' ' + X(val, 0), arrow: 'flat', big: X(val), sub: nm, text: `${what}. There is not enough history here to compare with its usual level.` }));
      const r = val / med; const lvl = r > 1.2 ? 'hi' : r < 0.8 ? 'lo' : 'mid';
      const lt = { hi: 'Above usual', lo: 'Below usual', mid: 'Near usual' }[lvl];
      const tail = { hi: 'Investors are paying more than usual for each dollar of ' + (useP ? 'profit' : 'sales') + ', which often reflects high hopes for growth.', lo: 'Investors are paying less than usual, which often reflects worries or slower expected growth.', mid: 'That is close to what investors have usually paid for this company.' }[lvl];
      out.push(Object.assign(o, { v: 'neu', vl: lt, arrow: lvl === 'hi' ? 'up' : lvl === 'lo' ? 'down' : 'flat', big: X(val), sub: `${nm}, typical ${Xm(med)}`, text: `${what}, against a typical ${Xm(med)} over the reports shown. ${tail}` }));
    })();
    return out;
  }

  /* ---------------- small svg pieces ---------------- */
  const ARR = {
    up: '<svg class="ern-ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.5l4.5 5H7.6V11H4.4V6.5H1.5z"/></svg>',
    down: '<svg class="ern-ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10.5l4.5-5H7.6V1H4.4v4.5H1.5z"/></svg>',
    flat: '<svg class="ern-ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M10.5 6l-5 4.5V7.6H1V4.4h4.5V1.5z"/></svg>',
    na: '<svg class="ern-ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 5h8v2H2z"/></svg>',
  };
  const DOT = '<svg class="ern-ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 3a3 3 0 1 1 0 6a3 3 0 1 1 0-6z"/></svg>';
  const MAG = '<svg class="ern-mag" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>';
  const EXT = '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" style="fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"/></svg>';
  function spark(vals, zero) {
    const v = vals.map((x) => (isN(x) ? x : null)); const ok = v.filter(isN); if (ok.length < 2) return '';
    const W = 92, H = 30; let lo = Math.min.apply(null, ok), hi = Math.max.apply(null, ok);
    if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); } if (hi === lo) { hi += 1; lo -= 1; }
    const x = (i) => 3 + (i / Math.max(1, v.length - 1)) * (W - 8), y = (val) => H - 4 - ((val - lo) / (hi - lo)) * (H - 8);
    const pts = []; v.forEach((val, i) => { if (isN(val)) pts.push([x(i), y(val)]); });
    let s = zero && lo < 0 && hi > 0 ? S.line(2, y(0), W - 2, y(0), '') : '';
    s += S.poly(pts, ''); const lp = pts[pts.length - 1]; s += S.circle(lp[0], lp[1], 2.8, '');
    return S.wrap(W, H, 'Trend over recent quarters', s, 'ern-spark');
  }
  const tipRows = (title, rows, note) => `<b>${title}</b>${rows.filter(Boolean).map((r) => `<span class="r"><span>${r[0]}</span><i class="${r[2] || ''}" style="font-style:normal">${r[1]}</i></span>`).join('')}${note ? `<span class="nt">${note}</span>` : ''}`;
  const cls = (v) => (isN(v) ? (v > 0 ? 'up' : v < 0 ? 'dn' : '') : '');

  /* ---------------- chart engine (drawn 1:1, hover/tap tooltips) ---------------- */
  function emptySVG(W, H, msg, title) {
    return S.wrap(W, H, msg, S.rect(1, 1, W - 2, H - 2, 'ern-na', 6) + S.text(W / 2, H / 2 - 4, esc(title || 'Not reported'), 'md ink b', 'middle') + S.text(W / 2, H / 2 + 16, esc(msg), 'sm mut', 'middle'));
  }
  function xLabels(n, cx, sw, labels, y, last) {
    const maxL = Math.max.apply(null, labels.map((l) => String(l).length).concat([1]));
    const k = Math.max(1, Math.ceil((maxL * 6 + 8) / sw)); let s = '';
    for (let i = 0; i < n; i++) if ((n - 1 - i) % k === 0) s += S.text(cx(i), y, esc(labels[i]), 'xs mono' + (i === last ? ' ink b' : ''), 'middle');
    return s;
  }
  function scaleOf(all, zero, nt) {
    let lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    if (zero !== false) { lo = Math.min(0, lo); hi = Math.max(0, hi); } else { const pad = (hi - lo) * 0.18 || Math.abs(hi) * 0.05 || 1; lo -= pad; hi += pad; }
    if (hi === lo) { hi = lo + 1; }
    const tk = SML.ticks(lo, hi, nt || 4);
    if (!tk.length) tk.push(lo, hi);
    if (zero !== false) {
      const step = tk.length > 1 ? tk[1] - tk[0] : hi - lo, rd = (v) => Math.round(v / step) * step;
      while (tk[0] > lo + step * 1e-6) tk.unshift(rd(tk[0] - step));
      while (tk[tk.length - 1] < hi - step * 1e-6) tk.push(rd(tk[tk.length - 1] + step));
      lo = tk[0]; hi = tk[tk.length - 1];
    }
    return { lo, hi, tk: tk.filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9) };
  }
  /* bars. c: {H, labels, series:[{vals, cls(v,i)}], ghost:{vals,cls}, line:{vals,cls}, refs:[{v,cls,label}], fmt, strip:{label, vals},
     arc:{a,b,text}, marks:[{i,text}], aria, tip(i), empty, last} */
  function drawBars(W, c) {
    const n = c.labels.length, compact = W < 480, H = c.H;
    const stripH = c.strip ? 18 : 0;
    const padL = compact ? 40 : 48, padR = c.padR || 8, padT = c.arc ? 38 : 14, padB = 20 + stripH;
    const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB;
    const all = [];
    c.series.forEach((se) => se.vals.forEach((v) => { if (isN(v)) all.push(v); }));
    if (c.ghost) c.ghost.vals.forEach((v) => { if (isN(v)) all.push(v); });
    if (c.line) c.line.vals.forEach((v) => { if (isN(v)) all.push(v); });
    (c.refs || []).forEach((r) => all.push(r.v));
    if (!n || !all.length) return { svg: emptySVG(W, Math.min(H, 180), c.empty || 'No data for this chart.'), hover: null };
    const sc = scaleOf(all, true, compact ? 4 : 5), y = SML.lin(sc.lo, sc.hi, y1, y0);
    const sw = (x1 - x0) / n, cx = (i) => x0 + sw * (i + 0.5);
    let s = '';
    sc.tk.forEach((v) => { s += S.line(x0, y(v), x1, y(v), 's-grid'); s += S.text(x0 - 6, y(v) + 3.5, c.fmt(v), 'xs mono', 'end'); });
    s += '<g class="ern-hl"></g>';
    (c.refs || []).forEach((r) => { s += S.line(x0, y(r.v), x1, y(r.v), r.cls || 'ern-gl'); if (r.label && !compact) s += S.text(x1 - 2, y(r.v) - 4, esc(r.label), 'xs mono mut', 'end'); });
    if (c.ghost) { const gw = Math.min(sw * 0.8, 44); c.ghost.vals.forEach((v, i) => { if (!isN(v)) return; const a = y(Math.max(v, 0)), b = y(Math.min(v, 0)); s += S.rect(cx(i) - gw / 2, a, gw, Math.max(1, b - a), c.ghost.cls || 'ern-ghost', 2); }); }
    const ns = c.series.length, gwid = Math.min(sw * (c.ghost ? 0.5 : 0.7), (c.maxBar || 36) * ns), bw = gwid / ns;
    c.series.forEach((se, k) => se.vals.forEach((v, i) => {
      const bx = cx(i) - gwid / 2 + k * bw;
      if (!isN(v)) { s += S.rect(bx + 1, y(0) - 8, Math.max(2, bw - 2), 8, 'ern-na', 1); return; }
      const a = y(Math.max(v, 0)), b = y(Math.min(v, 0));
      s += S.rect(bx + (ns > 1 ? 0.75 : 0), a, Math.max(1.5, bw - (ns > 1 ? 1.5 : 0)), Math.max(1.4, b - a), se.cls(v, i), bw > 7 ? 2 : 0);
    }));
    s += S.line(x0, y(0), x1, y(0), 's-mut');
    if (c.line) {
      let run = [];
      const flush = () => { if (run.length > 1) s += S.poly(run, c.line.cls || 's-acc w2'); run = []; };
      c.line.vals.forEach((v, i) => { if (isN(v)) run.push([cx(i), y(v)]); else flush(); }); flush();
      c.line.vals.forEach((v, i) => { if (isN(v)) s += S.circle(cx(i), y(v), i === n - 1 ? 4 : 2.8, c.line.dot || 'f-acc'); });
    }
    (c.marks || []).forEach((mk) => { const v = c.series[0].vals[mk.i]; if (!isN(v)) return; s += S.text(cx(mk.i), y(Math.max(v, 0)) - 4, mk.text, 'xs mono mut', 'middle'); });
    if (c.arc && isN(c.series[0].vals[c.arc.a]) && isN(c.series[0].vals[c.arc.b])) {
      const xa = cx(c.arc.a), xb = cx(c.arc.b), ta = y(Math.max(c.series[0].vals[c.arc.a], 0)) - 5, tb = y(Math.max(c.series[0].vals[c.arc.b], 0)) - 5;
      const peak = Math.max(16, Math.min(ta, tb) - 20);
      s += S.path(`M${SML.R1(xa)} ${SML.R1(ta)} C${SML.R1(xa)} ${SML.R1(peak)} ${SML.R1(xb)} ${SML.R1(peak)} ${SML.R1(xb)} ${SML.R1(tb - 4)}`, 'nf s-acc w15');
      s += S.polygon([[xb, tb], [xb - 4, tb - 7], [xb + 4, tb - 7]], 'f-acc');
      const t = c.arc.text, w = tw(t, 11.5, true) + 4, mx = clamp((xa + xb) / 2, x0 + w / 2, x1 - w / 2);
      s += S.text(mx, peak - 7, esc(t), 'sm mono b acc', 'middle');
    }
    s += xLabels(n, cx, sw, c.labels, y1 + 13, c.last != null ? c.last : n - 1);
    if (c.strip) {
      s += S.text(x0 - 6, y1 + 13 + stripH, esc(c.strip.label), 'xs mono acc b', 'end');
      const dec = sw >= 44 ? 1 : 0, wMax = Math.max.apply(null, c.strip.vals.map((v) => (isN(v) ? F.spct(v, dec).length : 1)).concat([1])) * 6 + 6;
      const k = Math.max(1, Math.ceil(wMax / sw));
      c.strip.vals.forEach((v, i) => { if ((n - 1 - i) % k !== 0) return; s += S.text(cx(i), y1 + 13 + stripH, isN(v) ? F.spct(v, dec) : '·', 'xs mono ' + (isN(v) ? (v > 0 ? 'up' : v < 0 ? 'dn' : 'mut') : 'mut'), 'middle'); });
    }
    const xs = c.labels.map((_, i) => cx(i));
    return { svg: S.wrap(W, H, c.aria, s), hover: { xs, x0, x1, W, H, hl: (i) => S.rect(cx(i) - sw / 2, y0 - 6, sw, y1 - y0 + 10, 'ern-hlr', 3), tip: c.tip } };
  }
  /* lines. c: {H, labels, series:[{name, vals, cls, dot, tcls}], fmt, zero, aria, tip, endLabels, last} */
  function drawLines(W, c) {
    const n = c.labels.length, compact = W < 480, H = c.H;
    const endL = c.endLabels !== false && !compact;
    const padL = compact ? 40 : 48, padR = endL ? 58 : 12, padT = 14, padB = 22;
    const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB;
    const all = []; c.series.forEach((se) => se.vals.forEach((v) => { if (isN(v)) all.push(v); }));
    if (!n || !all.length) return { svg: emptySVG(W, Math.min(H, 180), c.empty || 'No data for this chart.'), hover: null };
    const sc = scaleOf(all, c.zero, 4), y = SML.lin(sc.lo, sc.hi, y1, y0);
    const sw = (x1 - x0) / n, cx = (i) => x0 + sw * (i + 0.5);
    let s = '';
    sc.tk.forEach((v) => { s += S.line(x0, y(v), x1, y(v), 's-grid'); s += S.text(x0 - 6, y(v) + 3.5, c.fmt(v), 'xs mono', 'end'); });
    if (sc.lo < 0 && sc.hi > 0) s += S.line(x0, y(0), x1, y(0), 's-mut');
    s += '<g class="ern-hl"></g>';
    const ends = [];
    c.series.forEach((se) => {
      let run = [];
      const flush = () => { if (run.length > 1) s += S.poly(run, se.cls + ' w25'); run = []; };
      se.vals.forEach((v, i) => { if (isN(v)) run.push([cx(i), y(v)]); else flush(); }); flush();
      if (c.bridge) { let pi = -1; se.vals.forEach((v, i) => { if (!isN(v)) return; if (pi >= 0 && i - pi > 1) s += S.line(cx(pi), y(se.vals[pi]), cx(i), y(v), se.cls + ' w15 dash2'); pi = i; }); }
      let li = -1; se.vals.forEach((v, i) => { if (isN(v)) { s += S.circle(cx(i), y(v), 2.6, se.dot); li = i; } });
      if (li >= 0) { s += S.circle(cx(li), y(se.vals[li]), 4.2, se.dot + ' ern-mk'); ends.push({ y: y(se.vals[li]), t: c.fmt2 ? c.fmt2(se.vals[li]) : c.fmt(se.vals[li]), cls: se.tcls }); }
    });
    if (endL && ends.length) {
      ends.sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
      const over = ends[ends.length - 1].y - (y1 + 4); if (over > 0) ends.forEach((e) => { e.y -= over; });
      ends.forEach((e) => { s += S.text(x1 + 8, e.y + 4, esc(e.t), 'sm mono b ' + e.cls); });
    }
    s += xLabels(n, cx, sw, c.labels, y1 + 14, c.last != null ? c.last : n - 1);
    const xs = c.labels.map((_, i) => cx(i));
    return { svg: S.wrap(W, H, c.aria, s), hover: { xs, x0, x1, W, H, hl: (i) => S.line(cx(i), y0 - 4, cx(i), y1, 's-mut dash2'), tip: c.tip } };
  }

  /* ---------------- the widget ---------------- */
  const QUICK = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'JPM', 'KO'];
  const STORE = 'earn:last';
  const H0 = (W) => Math.round(clamp(W * 0.46, 210, 300));

  SML.widgets.earnLookup = function (root, opts) {
    opts = opts || {};
    root.classList.add('ern');
    const id = SML.uid('ern');
    const E = SML.earn;
    const live = !!(E && typeof E.live === 'function' && (function () { try { return E.live(); } catch (e) { return false; } })());
    let alive = true, req = 0, sreq = 0, sugTimer = null, active = -1, sugList = [], cur = null;
    let local = [];
    const runLocal = () => { const c = local; local = []; c.forEach((f) => { try { f(); } catch (e) {} }); };
    SML.onCleanup(() => { alive = false; clearTimeout(sugTimer); runLocal(); });

    root.innerHTML = `
      <div class="ern-panel ern-search">
        <div class="ern-sbox">
          <label class="ern-slab" for="${id}-q"><i></i>Search a stock</label>
          <div class="ern-srow">
            <div class="ern-in">${MAG}
              <input id="${id}-q" type="search" placeholder="Search a stock: AAPL, MSFT, NVDA…" autocomplete="off" autocorrect="off" spellcheck="false" autocapitalize="characters" enterkeyhint="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-sug">
              <ul class="ern-sug" id="${id}-sug" role="listbox" aria-label="Matching companies" hidden></ul>
            </div>
            <button type="button" class="btn btn-p ern-go" id="${id}-go">Look up</button>
          </div>
          <div class="ern-quick"><span class="ern-lk">Popular</span>${QUICK.map((t) => `<button type="button" class="ern-qk" data-t="${t}">${t}</button>`).join('')}</div>
        </div>
        <div class="ern-status" id="${id}-st" aria-live="polite"></div>
      </div>
      <div class="ern-out" id="${id}-out"></div>`;
    const $ = (s) => root.querySelector(s);
    const input = $('#' + id + '-q'), sug = $('#' + id + '-sug'), out = $('#' + id + '-out'), stEl = $('#' + id + '-st');
    const ok = (my) => alive && my === req && root.isConnected;
    const setStatus = (h) => { stEl.innerHTML = h || ''; };
    const markQuick = (t) => { root.querySelectorAll('.ern-search .ern-qk').forEach((b) => b.classList.toggle('on', b.dataset.t === t)); };

    /* ---- type-ahead ---- */
    function closeSug() { sug.hidden = true; sug.innerHTML = ''; sugList = []; active = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
    function renderSug(list) {
      sugList = list; active = -1;
      if (!list.length) { closeSug(); return; }
      sug.innerHTML = list.map((r, i) => `<li><button type="button" role="option" id="${id}-o${i}" data-t="${esc(r.ticker)}" aria-selected="false"><b>${esc(r.ticker)}</b><span>${esc(r.name || '')}</span></button></li>`).join('');
      sug.hidden = false; input.setAttribute('aria-expanded', 'true');
    }
    function setActive(i) {
      const bs = sug.querySelectorAll('button'); if (!bs.length) return;
      active = (i + bs.length) % bs.length;
      bs.forEach((b, k) => { b.classList.toggle('on', k === active); b.setAttribute('aria-selected', k === active); });
      input.setAttribute('aria-activedescendant', bs[active].id);
    }
    function suggest(q) {
      if (!E || typeof E.search !== 'function') return;
      const my = ++sreq; let p; try { p = E.search(q); } catch (e) { return; }
      Promise.resolve(p).then((list) => { if (!alive || my !== sreq || input.value.trim() !== q) return; renderSug(Array.isArray(list) ? list.filter((r) => r && r.ticker).slice(0, 8) : []); }, () => { if (my === sreq) closeSug(); });
    }
    input.addEventListener('input', () => { clearTimeout(sugTimer); const q = input.value.trim(); if (!q) { closeSug(); return; } sugTimer = setTimeout(() => suggest(q), 170); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { if (!sug.hidden) { e.preventDefault(); setActive(active + 1); } }
      else if (e.key === 'ArrowUp') { if (!sug.hidden) { e.preventDefault(); setActive(active - 1); } }
      else if (e.key === 'Enter') { e.preventDefault(); const pick = active >= 0 && sugList[active] ? sugList[active].ticker : input.value; load(pick); }
      else if (e.key === 'Escape') { closeSug(); }
    });
    input.addEventListener('blur', () => { setTimeout(() => { if (alive && document.activeElement !== input) closeSug(); }, 160); });
    sug.addEventListener('pointerdown', (e) => { e.preventDefault(); });
    sug.addEventListener('click', (e) => { const b = e.target.closest('button[data-t]'); if (b) load(b.dataset.t); });
    $('#' + id + '-go').addEventListener('click', () => load(input.value));
    root.addEventListener('click', (e) => {
      const q = e.target.closest('.ern-qk[data-t]'); if (q && root.contains(q)) { load(q.dataset.t); return; }
      const r = e.target.closest('[data-retry]'); if (r) { load(r.dataset.retry); return; }
      const sm = e.target.closest('[data-sample]'); if (sm) { showSample(null); return; }
    });

    /* ---- loading ---- */
    function skeleton() {
      return `<div class="ern-sk" aria-hidden="true"><i style="height:150px"></i><div class="row">${'<i style="height:150px"></i>'.repeat(4)}</div><i style="height:280px"></i></div>`;
    }
    function load(t) {
      t = String(t || '').trim().toUpperCase().replace(/^\$/, '');
      closeSug();
      if (!t) { setStatus('<span class="ern-hint">Type a ticker first, like AAPL, or pick one of the popular stocks.</span>'); input.focus(); return; }
      if (!E || typeof E.load !== 'function') { engineMissing(); return; }
      input.value = t; markQuick(t);
      const my = ++req;
      runLocal();
      setStatus(`Looking up <b>${esc(t)}</b> in the SEC filings…`);
      out.innerHTML = skeleton();
      let p; try { p = E.load(t); } catch (e) { p = Promise.reject(e); }
      Promise.resolve(p).then((m) => {
        if (!ok(my)) return;
        if (!m || typeof m !== 'object') { showError({ code: 'sec_error' }, t); return; }
        setStatus(m.sample ? sampleNote(null) : '');
        render(m);
        if (!m.sample) SML.store.set(STORE, t);
      }, (e) => { if (!ok(my)) return; if (e && e.code === 'unavailable') showSample(t, true); else showError(e || {}, t); });
    }
    const sampleNote = (t, unavailable) => `<div class="callout info"><span>${t ? `Live lookups run on the FiredBunny website, so <b>${esc(t)}</b> cannot be loaded here.` : live && !unavailable ? 'This is sample data from a made-up company, so you can see what a result looks like. Search above for a real stock.' : 'Live lookups run on the FiredBunny website.'}${t || !live || unavailable ? ' Here is what a result looks like, with sample data from a made-up company.' : ''}</span></div>`;
    function showSample(t, unavailable) {
      if (!E || typeof E.sample !== 'function') { engineMissing(); return; }
      ++req; runLocal(); markQuick(null);
      let m = null; try { m = E.sample(); } catch (e) { m = null; }
      if (!m) { engineMissing(); return; }
      m.sample = true;
      setStatus(sampleNote(t, unavailable));
      render(m);
    }
    function engineMissing() {
      runLocal(); setStatus('');
      out.innerHTML = `<div class="ern-panel ern-empty ern-err"><h4>The data engine did not load</h4><p>Earnings lookups need the site’s data module. Reload the page; if this keeps happening, the lookup is temporarily unavailable.</p></div>`;
    }
    const ERRH = { bad_ticker: 'That does not look like a ticker', not_found: 'No company found', no_quarterly: 'No quarterly reports to explain', sec_error: 'The data service did not answer' };
    const ERRM = { bad_ticker: 'Tickers are short codes of letters, like AAPL or BRK.B. You can also type part of a company name and pick from the list.', not_found: 'No US-listed company files with the SEC under that ticker. Check the spelling, or type the company name and pick from the list.', no_quarterly: 'This company does not file quarterly US (GAAP) reports with the SEC. Many foreign companies file yearly reports under international rules instead.', sec_error: 'The SEC or the price service did not answer. Try again in a minute.' };
    function showError(e, t) {
      runLocal(); setStatus('');
      const code = ERRH[e.code] ? e.code : 'sec_error';
      const msg = typeof e.message === 'string' && e.message.trim() ? e.message : ERRM[code];
      out.innerHTML = `<div class="ern-panel ern-empty ern-err" role="alert"><p class="ern-lk">${esc(t)}</p><h4>${ERRH[code]}${code === 'not_found' ? ` for “${esc(t)}”` : ''}</h4><p>${esc(msg)}</p>
        <div class="ern-quick">${code === 'sec_error' ? `<button type="button" class="btn btn-p sm" data-retry="${esc(t)}">Try again</button>` : ''}<span class="ern-lk">Try</span>${QUICK.slice(0, 5).map((q) => `<button type="button" class="ern-qk" data-t="${q}">${q}</button>`).join('')}</div></div>`;
    }
    function showEmpty() {
      setStatus('');
      out.innerHTML = `<div class="ern-panel ern-empty"><svg width="120" height="64" viewBox="0 0 120 64" aria-hidden="true">${[18, 26, 22, 34, 30, 44].map((h, i) => S.rect(8 + i * 18, 58 - h, 12, h, i === 5 ? 'f-acc' : 'ern-bar', 2)).join('')}${S.line(4, 58, 116, 58, 's-mut')}</svg>
        <h4>Pick a stock to begin</h4><p>Type a ticker or a company name above. You will get the latest quarter in plain words: a report card, charts that show whether the business is improving, and what every number means.</p>
        <button type="button" class="btn btn-g sm" data-sample="1">Show me a sample first</button></div>`;
    }

    /* ---- the result ---- */
    function render(m) {
      runLocal();
      cur = m;
      let D; try { D = derive(m); } catch (err) { console.error(err); showError({ code: 'sec_error', message: 'The data for this company could not be read. Try another stock.' }, m.ticker || ''); return; }
      if (!D.L) {
        out.innerHTML = bannerHTML(D) + `<div class="ern-panel ern-empty"><p class="ern-lk">${esc(m.ticker || '')}</p><h4>No quarterly numbers yet</h4><p>The filings for ${esc(m.name || 'this company')} have no usable quarterly figures, so there is nothing to chart. This happens with new listings and with companies that file only yearly reports.</p></div>`;
        return;
      }
      const VS = verdicts(D); vsCache.set(D, VS);
      out.innerHTML = [bannerHTML(D), headerHTML(D), reportHTML(D, VS), happenedHTML(D, VS), chartsHTML(D), lensHTML(D), tableHTML(D), glossaryHTML(D), moreHTML(), notesHTML(D)].join('');
      wireCards(D);
      wireCharts(D);
      wireLens(D);
    }

    function bannerHTML(D) {
      if (!D.sample) return '';
      return `<div class="ern-banner" role="note"><svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l10 18H2z" style="fill:none;stroke:var(--violet);stroke-width:2;stroke-linejoin:round"/><path d="M12 9v5M12 16.6v.4" style="stroke:var(--violet);stroke-width:2.2;stroke-linecap:round"/></svg><div><b>Sample data, not a real company</b>${esc(D.m.name || 'Demo company')} is made up so you can see what a result looks like. None of these numbers describe a real stock.</div></div>`;
    }
    function headerHTML(D) {
      const m = D.m, L = D.L, lt = m.latest || {}, rel = lt.release || null;
      const links = [];
      if (!D.sample) {
        if (lt.url) links.push(`<a href="${esc(lt.url)}" target="_blank" rel="noopener noreferrer">${esc(lt.form || 'Filing')} on SEC.gov ${EXT}</a>`);
        if (rel && rel.url) links.push(`<a href="${esc(rel.url)}" target="_blank" rel="noopener noreferrer">Earnings release (8-K) ${EXT}</a>`);
        if (isN(m.cik)) links.push(`<a href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&amp;CIK=${String(m.cik).padStart(10, '0')}&amp;type=10-&amp;dateb=&amp;owner=include&amp;count=40" target="_blank" rel="noopener noreferrer">All filings on EDGAR ${EXT}</a>`);
      }
      const kp = (l, v, sub) => `<div class="ern-kpi"><span>${l}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
      return `<section class="ern-panel" aria-label="Company and quarter">
        <div class="ern-hd">
          <div class="ern-hd-top"><span class="ern-tk">${esc(m.ticker || '?')}</span>${m.exchange ? `<span>${esc(m.exchange)}</span>` : ''}${m.sic ? `<span>${esc(m.sic)}</span>` : ''}${D.sample ? '<span class="ern-stag">Sample data</span>' : ''}</div>
          <h3 class="ern-co">${esc(m.name || m.ticker || 'Company')}</h3>
          <p class="ern-qline">Latest report: the <b>${D.qName}</b>${D.fiscal ? ` <span>· ${D.fiscal}</span>` : ''}</p>
          <div class="ern-meta">${rel && rel.date ? `<span>Results released <b>${dShort(rel.date)}</b></span>` : ''}${lt.form ? `<span>${esc(lt.form)} filed <b>${dShort(lt.filed)}</b></span>` : ''}<span>Quarter ended <b>${dShort(L.end)}</b></span></div>
          ${links.length ? `<div class="ern-links">${links.join('')}</div>` : D.sample ? '<p class="ern-hint">For a real company, links to its SEC filing and earnings release appear here.</p>' : ''}
        </div>
        <div class="ern-kpis">
          ${kp('Share price', usd(D.price), D.priceDate ? 'close ' + dShort(D.priceDate) : 'not available')}
          ${kp('Market cap', money(D.mcap), 'price × shares')}
          ${kp('Revenue, 12 months', money(D.ttm.revenue), 'TTM')}
          ${kp('Net income, 12 months', money(D.ttm.netInc), 'TTM')}
          ${kp('P/E', isN(D.pe) ? X(D.pe) : 'n/a', isN(D.pe) ? 'price ÷ TTM EPS' : isN(D.ttm.eps) && D.ttm.eps <= 0 ? 'no profit, no P/E' : 'not available')}
          ${kp('FCF yield', P(D.fcfYield), isN(D.fcfYield) ? 'TTM free cash ÷ market cap' : 'not available')}
        </div>
        ${learnRow(['gaap', 'filings', 'fiscal', 'marketCap'])}
      </section>`;
    }
    function reportHTML(D, VS) {
      const biz = VS.filter((v) => !v.neutral);
      const n = { up: 0, flat: 0, down: 0, na: 0 }; biz.forEach((v) => { n[v.v] = (n[v.v] || 0) + 1; });
      const head = n.na >= 5 ? 'Not enough data' : n.up >= 5 && n.down === 0 ? 'Mostly improving' : n.up >= 4 && n.down <= 1 ? 'More good than bad' : n.down >= 4 ? 'Mostly weakening' : n.down >= 3 && n.up <= 1 ? 'More bad than good' : 'A mixed quarter';
      const tot = biz.length || 1;
      const tile = (v) => {
        const vk = v.neutral ? 'neu' : v.v; const lab = v.neutral ? (v.vl || 'No data') : VL[v.v];
        const ar = v.neutral ? ARR[v.arrow || (v.v === 'na' ? 'na' : 'flat')] : ARR[v.v];
        return `<article class="ern-tile" data-v="${v.v === 'na' ? 'na' : vk}">
          <div class="ern-tile-h"><span>${v.title}</span><span class="ern-vp">${ar}${esc(lab)}</span></div>
          <div class="ern-tile-m"><div><span class="ern-big">${v.big}</span><span class="ern-bsub">${v.sub}</span></div>${v.spark ? spark(v.spark, v.sparkZero) : ''}</div>
          <p>${v.text}</p>
          <button type="button" class="ern-tl" data-go="${v.panel}">See the chart</button>
        </article>`;
      };
      return `<section class="ern-sec" aria-labelledby="${id}-rc">
        <div class="ern-sh"><h3 id="${id}-rc"><i>01</i>Report card</h3><p>The ${D.qName} compared with the same quarter a year earlier.</p></div>
        <div class="ern-panel ern-score">
          <div class="ern-score-t"><b>${head}</b><span>${n.up} improving · ${n.flat} steady · ${n.down} weakening${n.na ? ` · ${n.na} without data` : ''} (valuation is shown apart)</span></div>
          <div class="ern-meter" role="img" aria-label="${n.up} improving, ${n.flat} steady, ${n.down} weakening, ${n.na} without data">${['up', 'flat', 'down', 'na'].map((k) => (n[k] ? `<i class="${k}" style="flex:${n[k] / tot}"></i>` : '')).join('')}</div>
          <div class="ern-leg"><span><i class="up"></i>Improving</span><span><i class="flat"></i>Steady</span><span><i class="down"></i>Weakening</span><span><i class="na"></i>No data</span></div>
        </div>
        <div class="ern-tiles">${VS.map(tile).join('')}</div>
        <p class="ern-hint">A snapshot of one report, worked out with simple rules from the filed numbers. It is not a forecast and not a reason to buy or sell.</p>
      </section>`;
    }
    function happenedHTML(D, VS) {
      const L = D.L, YA = D.YA, items = [];
      const add = (k, h) => items.push(`<li><span class="ern-dot ${k}">${k === 'info' ? DOT : ARR[k] || ARR.flat}</span><span>${h}</span></li>`);
      const b = (v, t) => `<b class="${v > 0 ? 'up' : v < 0 ? 'dn' : ''}">${t}</b>`;
      const rel = D.m.latest && D.m.latest.release && D.m.latest.release.date;
      add('info', `${esc(D.m.name || D.m.ticker)} reported its ${D.qName}${D.fiscal ? ` (${D.fiscal})` : ''}${rel ? ` on ${dShort(rel)}` : ''}.`);
      const vs = (k) => VS.find((v) => v.k === k) || {};
      if (isN(L.rev)) {
        if (isN(L.revY)) {
          const prior = D.QL.slice(0, -1).slice(-3).map((q) => q.revY).filter(isN), gp = prior.length ? mean(prior) : null;
          let s = `Sales were <b>${moneyW(L.rev)}</b>, ${L.revY >= 0 ? 'up' : 'down'} ${b(L.revY, P(Math.abs(L.revY)))} from a year ago`;
          if (isN(gp)) s += Math.abs(L.revY - gp) < 2 ? `, close to the ${P(gp)} average of the quarters before.` : L.revY > gp ? `, faster than the ${P(gp)} average of the quarters before.` : `, slower than the ${P(gp)} average of the quarters before.`;
          else s += '.';
          if (isN(L.revQ) && Math.sign(L.revQ) !== Math.sign(L.revY) && Math.abs(L.revQ) >= 1) s += ` Against the quarter just before, sales were ${L.revQ >= 0 ? 'up' : 'down'} ${P(Math.abs(L.revQ))}, which is why the year-ago comparison is the fair one.`;
          add(vs('sales').v || 'flat', s);
        } else add('info', `Sales were <b>${moneyW(L.rev)}</b>. There is no year-ago quarter in the data to compare with.`);
      }
      const mg = vs('margin');
      if (mg.v && mg.v !== 'na') add(mg.v, mg.text.replace(/^(Operating|Net) margin/, (x) => 'The ' + x.toLowerCase()) + (mg.v === 'up' ? ' More of each sale turned into profit.' : mg.v === 'down' ? ' Less of each sale turned into profit.' : ''));
      if (isN(L.ni)) {
        const c = cmp(L.ni, YA && YA.ni, 5);
        let s;
        if (c && c.kind === 'pos') s = `Net income ${c.p >= 0 ? 'rose' : 'fell'} ${b(c.p, P(Math.abs(c.p)))} to <b>${moneyW(L.ni)}</b>`;
        else if (c && c.kind === 'toProfit') s = `It made a <b>${moneyW(L.ni)}</b> profit (after a loss a year ago)`;
        else if (c && c.kind === 'toLoss') s = `It lost <b>${moneyW(Math.abs(L.ni))}</b> (after a profit a year ago)`;
        else if (c && c.kind === 'neg') s = `It lost <b>${moneyW(Math.abs(L.ni))}</b> (a ${c.p < 0 ? 'smaller' : 'bigger'} loss than a year ago)`;
        else s = `Net income was <b>${moneyW(L.ni)}</b>`;
        if (isN(L.eps)) { s += ` and diluted EPS was <b>${L.derived ? '≈' : ''}${usd(L.eps)}</b>`; if (isN(L.epsY)) s += ` (${b(L.epsY, SP(L.epsY))})`; }
        s += '.';
        if (isN(L.epsY) && isN(L.niY) && L.epsY - L.niY >= 1.5 && isN(D.shChg) && D.shChg < 0) s += ` EPS grew faster than profit because the share count fell ${P(-D.shChg)}.`;
        add(c ? c.v : 'info', s);
      }
      const cs = vs('cash'); if (cs.v && cs.v !== 'na') add(cs.v, cs.text);
      if (D.BL && isN(D.BL.ci)) {
        const nc = D.BL.nc; let s = `It ended the quarter with <b>${moneyW(D.BL.ci)}</b> of cash and investments and ${D.noDebt ? 'no debt reported' : `<b>${moneyW(D.BL.dt)}</b> of debt`}`;
        if (isN(nc)) s += ` (${nc >= 0 ? 'net cash' : 'net debt'} ${moneyW(Math.abs(nc))}${D.BYA && isN(D.BYA.nc) ? `, against ${D.BYA.nc >= 0 ? 'net cash' : 'net debt'} of ${moneyW(Math.abs(D.BYA.nc))} a year earlier` : ''})`;
        add(vs('balance').v || 'info', s + '.');
      }
      if (isN(L.bb) || isN(L.dv)) {
        const parts = []; if (isN(L.bb) && L.bb > 0) parts.push(`<b>${moneyW(L.bb)}</b> buying back its own shares`); if (isN(L.dv) && L.dv > 0) parts.push(`<b>${moneyW(L.dv)}</b> on dividends`);
        if (parts.length) add('info', `In the quarter it spent ${parts.join(' and ')}.`);
      }
      if (D.lastReac) add(D.lastReac.pct > 0.5 ? 'up' : D.lastReac.pct < -0.5 ? 'down' : 'flat', `The stock moved ${b(D.lastReac.pct, SP(D.lastReac.pct))} around the report, from the last close before the results to the first close after${isN(D.avgMove) ? `. Its typical move after a report is about ${P(D.avgMove)} either way` : ''}.`);
      add('info', 'Analyst estimates and the company’s guidance are not part of this data, so this page cannot say whether the quarter beat expectations. Check the earnings release and the call for the outlook.');
      return `<section class="ern-sec" aria-labelledby="${id}-wh">
        <div class="ern-sh"><h3 id="${id}-wh"><i>02</i>What happened this quarter</h3><p>Written automatically from the filed numbers, in plain words.</p></div>
        <div class="ern-panel"><div class="ern-news">${D.sample ? '<span class="ern-stag" style="align-self:flex-start">Sample data</span>' : ''}<ul>${items.join('')}</ul></div>
        ${learnRow(['guidance', 'gaap'])}</div>
        ${SML.bunnyTip ? SML.bunnyTip('One quarter is a snapshot. Look at the trend across several quarters and years before you decide what it means, and remember the price already reflects what investors expected.') : ''}
      </section>`;
    }

    /* ---- chart panels ---- */
    const panel = (k, kick, title, sub, bar, figs, concepts, wide) => `<section class="ern-panel${wide ? ' ern-wide' : ''}" id="${id}-p-${k}" data-panel="${k}">
        <div class="ern-ph"><p class="ern-k">${kick}</p><h4>${title}</h4>${sub ? `<p class="ern-sub">${sub}</p>` : ''}</div>
        ${bar ? `<div class="ern-bar">${bar}</div>` : ''}
        ${figs}
        <div class="wg-msg" data-msg="${k}"></div>
        ${learnRow(concepts)}
      </section>`;
    const fig = (k) => `<div class="ern-fig" data-fig="${k}"><div class="ern-svg"></div><div class="wg-tip ern-tip" hidden></div></div>`;
    function chartsHTML(D) {
      const hasGM = D.QL.some((q) => isN(q.gm)), hasOM = D.QL.some((q) => isN(q.om)), hasNM = D.QL.some((q) => isN(q.nm));
      const mChips = ui.chips(id + '-mg', [{ k: 'gm', label: 'Gross', color: 'var(--info)', on: hasGM }, { k: 'om', label: 'Operating', color: 'var(--accent)', on: hasOM }, { k: 'nm', label: 'Net', color: 'var(--up)', on: hasNM }]);
      return `<section class="ern-sec" aria-labelledby="${id}-ch">
        <div class="ern-sh"><h3 id="${id}-ch"><i>03</i>Is it improving? The charts</h3><p>Hover or tap any chart to see the numbers. Each chart has the words it uses, explained underneath.</p></div>
        <div class="ern-grid">
          ${panel('rev', 'Sales', 'Revenue by quarter', 'The orange bar is the latest quarter; the dashed one is the same quarter a year earlier, the fair comparison.', '', fig('rev'), ['revenue', 'yoy', 'seasonality', 'ttm'])}
          ${panel('profit', 'Profit', 'Net income and EPS', 'Green bars are profits, red bars are losses. The row underneath shows the change from a year earlier.', ui.seg(id + '-pm', [{ v: 'ni', label: 'Net income' }, { v: 'eps', label: 'EPS (diluted)' }], 'ni', 'Show'), fig('profit'), ['netIncome', 'eps', 'gaap'])}
          ${panel('margin', 'Margins', 'How much of each sales dollar is kept', 'Gross, operating and net margin each quarter. Tap the chips to show or hide a line.', mChips, fig('margin'), ['grossMargin', 'opMargin', 'netMargin'])}
          ${panel('fcf', 'Cash', 'Free cash flow', 'Pale bars are operating cash flow; the solid bars inside are what is left after capex (free cash flow).', ui.seg(id + '-fm', [{ v: 'q', label: 'Each quarter' }, { v: 'ttm', label: 'Rolling 12 months' }], 'q', 'Period'), fig('fcf'), ['ocf', 'capex', 'fcf'])}
          ${panel('debt', 'Balance sheet', 'Cash vs debt', 'Blue: cash and investments. Red: debt. The orange line is the difference (net cash above zero, net debt below).', '', fig('debt'), ['netCash'])}
          ${panel('shares', 'Ownership', 'Share count', 'Diluted shares each quarter, in millions. Falling means buybacks; rising means dilution.', '', fig('shares') + `<div class="ern-reads ern-r3" data-reads="shares"></div>`, ['shares', 'sbc', 'marketCap'])}
          ${panel('annual', 'The long view', 'Ten years, one bar per fiscal year', 'Yearly totals from the annual reports. The dashed bar is the last 12 months.', ui.seg(id + '-am', [{ v: 'rev', label: 'Revenue' }, { v: 'eps', label: 'EPS' }, { v: 'fcf', label: 'Free cash flow' }], 'rev', 'Metric'), fig('annual'), ['ttm', 'fiscal', 'filings'], true)}
          ${panel('price', 'The stock', 'Five years of price, with every earnings report', 'Dots mark each report: green if the stock rose around it, red if it fell. Below: the size of each move.', '', fig('price') + fig('reac'), ['reaction', 'pe', 'ps', 'fcfYield'], true)}
        </div>
      </section>`;
    }

    function wireCards(D) {
      out.addEventListener('click', onOutClick);
      local.push(() => out.removeEventListener('click', onOutClick));
      function onOutClick(e) {
        const q = e.target.closest('.ern-q'); if (q && out.contains(q)) {
          const row = q.closest('.ern-learn'), slot = row.nextElementSibling; const on = q.classList.contains('on');
          row.querySelectorAll('.ern-q').forEach((b) => { b.classList.remove('on'); b.setAttribute('aria-expanded', 'false'); });
          if (on) { slot.innerHTML = ''; return; }
          q.classList.add('on'); q.setAttribute('aria-expanded', 'true');
          slot.innerHTML = `<div class="ern-card" role="region" aria-label="${esc(C[q.dataset.c].t)} explained">${cardHTML(q.dataset.c, D)}</div>`;
          return;
        }
        const g = e.target.closest('[data-go]'); if (g && out.contains(g)) {
          const p = out.querySelector(`[data-panel="${g.dataset.go}"]`); if (!p) return;
          try { p.scrollIntoView({ behavior: SML.reduced() ? 'auto' : 'smooth', block: 'start' }); } catch (err) { p.scrollIntoView(); }
          p.classList.remove('ern-flash'); void p.offsetWidth; p.classList.add('ern-flash');
        }
      }
    }

    /* responsive + hover for one figure */
    function chart(figEl, draw) {
      const holder = figEl.querySelector('.ern-svg'), tip = figEl.querySelector('.ern-tip');
      let st = null, lastW = -1;
      const go = (force) => {
        if (!figEl.isConnected) return;
        const cs = getComputedStyle(figEl);
        const W = Math.max(220, Math.floor(figEl.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0)));
        if (!force && W === lastW) return; lastW = W;
        try { const r = draw(W) || {}; holder.innerHTML = r.svg || ''; st = r.hover || null; } catch (err) { console.error(err); holder.innerHTML = ''; st = null; }
        tip.hidden = true;
      };
      if (window.ResizeObserver) { const ro = new ResizeObserver(() => requestAnimationFrame(() => go(false))); ro.observe(figEl); local.push(() => ro.disconnect()); }
      const hide = (e) => { if (e && e.pointerType === 'touch' && e.type === 'pointerleave') return; tip.hidden = true; const g = holder.querySelector('.ern-hl'); if (g) g.innerHTML = ''; };
      const move = (e) => {
        if (!st) return; const svg = holder.querySelector('svg'); if (!svg) return;
        const p = ui.pt(svg, e);
        if (p.x < st.x0 - 14 || p.x > st.x1 + 14 || p.y < -4 || p.y > st.H + 4) { hide(); return; }
        let i = 0, bd = Infinity; st.xs.forEach((x, k) => { const d = Math.abs(x - p.x); if (d < bd) { bd = d; i = k; } });
        const g = holder.querySelector('.ern-hl'); if (g && st.hl) g.innerHTML = st.hl(i);
        let h = ''; try { h = st.tip(i); } catch (err) { h = ''; }
        if (!h) { tip.hidden = true; return; }
        tip.innerHTML = h; tip.hidden = false;
        const fr = figEl.getBoundingClientRect(), sr = svg.getBoundingClientRect();
        const ax = sr.left - fr.left + st.xs[i] * (sr.width / (st.W || sr.width)), ay = e.clientY - fr.top;
        const w = tip.offsetWidth, hh = tip.offsetHeight;
        let left = ax + 14; if (left + w > fr.width - 4) left = ax - 14 - w; if (left < 4) left = Math.max(4, Math.min(fr.width - w - 4, ax - w / 2));
        let top = ay - hh - 14; if (top < 4) top = Math.min(fr.height - hh - 4, ay + 18);
        tip.style.left = Math.round(left) + 'px'; tip.style.top = Math.round(Math.max(4, top)) + 'px';
      };
      figEl.addEventListener('pointermove', move); figEl.addEventListener('pointerdown', move); figEl.addEventListener('pointerleave', hide);
      go(true);
      return () => go(true);
    }
    function segWire(segId, fn) {
      const g = root.querySelector('#' + segId); if (!g) return;
      g.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || !g.contains(b)) return; g.querySelectorAll('button').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); fn(b.dataset.v); });
    }
    const setMsg = (k, pill, pc, h) => { const el = out.querySelector(`[data-msg="${k}"]`); if (el) { el.innerHTML = h ? ui.msg(pc, pill, h) : ''; el.hidden = !h; } };
    const figOf = (k) => out.querySelector(`[data-fig="${k}"]`);
    const nQ = (W) => (W < 480 ? 8 : W < 700 ? 12 : 16);
    const qTitle = (q) => `${q.long} quarter${q.fq && q.fy ? ` · fiscal ${esc(q.fq)} ${esc(q.fy)}` : ''}`;

    function wireCharts(D) {
      const L = D.L, YA = D.YA;
      /* revenue */
      chart(figOf('rev'), (W) => {
        const Qs = D.QL.slice(-nQ(W)), iL = Qs.length - 1, iY = YA ? Qs.indexOf(YA) : -1;
        return drawBars(W, {
          H: H0(W) + 18, labels: Qs.map((q) => q.short), fmt: axMoney,
          series: [{ vals: Qs.map((q) => q.rev), cls: (v, i) => (i === iL ? 'f-acc' : i === iY ? 'ern-bya' : 'ern-bar') }],
          strip: { label: 'YoY', vals: Qs.map((q) => q.revY) },
          arc: iY >= 0 && isN(L.revY) ? { a: iY, b: iL, text: SP(L.revY, W < 480 ? 0 : 1) + ' vs a year ago' } : null,
          aria: `Revenue for the last ${Qs.length} quarters. Latest ${money(L.rev)}, ${SP(L.revY)} from a year earlier.`,
          empty: 'Revenue is not reported in these filings.',
          tip: (i) => { const q = Qs[i]; return tipRows(qTitle(q), [['Revenue', money(q.rev)], ['vs a year ago', SP(q.revY), cls(q.revY)], ['vs the quarter before', SP(q.revQ), cls(q.revQ)]], q.derived ? 'Fourth quarter worked out from the annual report minus the first nine months.' : ''); },
        });
      });
      const sv = D.season;
      setMsg('rev', isN(L.revY) ? (L.revY >= 0 ? 'Growing' : 'Shrinking') : 'Sales', isN(L.revY) ? (L.revY >= 0 ? 'up' : 'dn') : 'info',
        (isN(L.revY) ? `Sales ${SP(L.revY)} vs the same quarter a year ago (${money(L.rev)} vs ${money(YA.rev)}). ` : isN(L.rev) ? `Sales were ${money(L.rev)}. ` : 'Revenue is not reported. ') + (sv ? sv.text : 'Compare each quarter with the same quarter last year: many businesses have a busy season.'));

      /* profit: net income / EPS */
      let pm = 'ni';
      const pRedraw = chart(figOf('profit'), (W) => {
        const Qs = D.QL.slice(-nQ(W)), iL = Qs.length - 1, eps = pm === 'eps';
        const vals = Qs.map((q) => (eps ? q.eps : q.ni)), yoy = Qs.map((q) => (eps ? q.epsY : q.niY));
        return drawBars(W, {
          H: H0(W) + 18, labels: Qs.map((q) => q.short), fmt: eps ? axUsd : axMoney,
          series: [{ vals, cls: (v, i) => (v >= 0 ? 'f-up' : 'f-dn') + (i === iL ? '' : ' o70') }],
          strip: { label: 'YoY', vals: yoy },
          marks: eps && W >= 480 ? Qs.map((q, i) => (q.derived ? { i, text: '≈' } : null)).filter(Boolean) : [],
          aria: eps ? `Diluted EPS for the last ${Qs.length} quarters.` : `Net income for the last ${Qs.length} quarters.`,
          empty: eps ? 'Diluted EPS is not reported.' : 'Net income is not reported.',
          tip: (i) => { const q = Qs[i]; return tipRows(qTitle(q), [['Net income', smoney(q.ni), cls(q.ni)], ['Net income YoY', SP(q.niY), cls(q.niY)], ['Diluted EPS', (q.derived && isN(q.eps) ? '≈' : '') + usd(q.eps), cls(q.eps)], ['EPS YoY', SP(q.epsY), cls(q.epsY)]], q.derived ? '≈ Fourth-quarter EPS is approximate: the full year minus the first nine months.' : ''); },
        });
      });
      segWire(id + '-pm', (v) => { pm = v; pRedraw(); });
      const pv = VS_cache(D, 'profit'), ev = VS_cache(D, 'eps');
      setMsg('profit', VL[pv.v] || 'Profit', pv.v === 'up' ? 'up' : pv.v === 'down' ? 'dn' : 'acc', `${pv.text}${ev.text && ev.v !== 'na' ? ' ' + ev.text : ''}`);

      /* margins */
      const mOn = { gm: D.QL.some((q) => isN(q.gm)), om: D.QL.some((q) => isN(q.om)), nm: D.QL.some((q) => isN(q.nm)) };
      const mRedraw = chart(figOf('margin'), (W) => {
        const Qs = D.QL.slice(-nQ(W));
        const ser = [];
        if (mOn.gm) ser.push({ name: 'Gross', vals: Qs.map((q) => q.gm), cls: 's-info', dot: 'f-info', tcls: 'info' });
        if (mOn.om) ser.push({ name: 'Operating', vals: Qs.map((q) => q.om), cls: 's-acc', dot: 'f-acc', tcls: 'acc' });
        if (mOn.nm) ser.push({ name: 'Net', vals: Qs.map((q) => q.nm), cls: 's-up', dot: 'f-up', tcls: 'up' });
        if (!ser.length) return { svg: emptySVG(W, 180, mOn.gm || mOn.om || mOn.nm ? 'Turn on a line with the chips above.' : 'Margins need revenue and profit, which are not reported.'), hover: null };
        return drawLines(W, {
          H: H0(W), labels: Qs.map((q) => q.short), fmt: axPct, fmt2: (v) => P(v), series: ser,
          aria: 'Gross, operating and net margin by quarter, in percent of revenue.',
          tip: (i) => { const q = Qs[i]; return tipRows(qTitle(q), [['Gross margin', P(q.gm)], ['Operating margin', P(q.om)], ['Net margin', P(q.nm)]], isN(q.gm) ? '' : 'No gross margin: cost of sales is not reported.'); },
        });
      });
      const mg = root.querySelector('#' + id + '-mg');
      if (mg) mg.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); mOn[b.dataset.k] = on; mRedraw(); });
      const mv = VS_cache(D, 'margin');
      setMsg('margin', VL[mv.v] || 'Margins', mv.v === 'up' ? 'up' : mv.v === 'down' ? 'dn' : 'acc', mv.text + (D.QL.some((q) => isN(q.gm)) ? '' : ' There is no gross margin line: this company does not report a cost of sales, which is normal for banks and many service firms.'));

      /* free cash flow */
      let fm = 'q';
      const fRedraw = chart(figOf('fcf'), (W) => {
        const Qs = D.QL.slice(-nQ(W)), t = fm === 'ttm', iL = Qs.length - 1;
        const f = Qs.map((q) => (t ? q.ttmFc : q.fc)), o = Qs.map((q) => (t ? q.ttmCfo : q.cfo));
        const onlyO = !f.some(isN) && o.some(isN);
        return drawBars(W, {
          H: H0(W), labels: Qs.map((q) => q.short), fmt: axMoney,
          ghost: onlyO ? null : { vals: o, cls: 'ern-ghost' },
          series: [{ vals: onlyO ? o : f, cls: (v, i) => (onlyO ? (i === iL ? 'f-info' : 'ern-bar') : (v >= 0 ? 'f-up' : 'f-dn') + (i === iL ? '' : ' o70')) }],
          aria: `Operating cash flow and free cash flow, ${t ? 'rolling 12 months' : 'each quarter'}.`,
          empty: 'Cash flow is not reported in these filings.',
          tip: (i) => { const q = Qs[i]; return t ? tipRows('12 months to ' + q.long, [['Operating cash flow', smoney(q.ttmCfo)], ['Capex', q.ttmCx != null ? NEG + money(q.ttmCx) : 'n/a'], ['Free cash flow', smoney(q.ttmFc), cls(q.ttmFc)]]) : tipRows(qTitle(q), [['Operating cash flow', smoney(q.cfo)], ['Capex', q.cx != null ? NEG + money(q.cx) : 'n/a'], ['Free cash flow', smoney(q.fc), cls(q.fc)]], q.derived ? 'Fourth quarter worked out from the annual report minus the first nine months.' : ''); },
        });
      });
      segWire(id + '-fm', (v) => { fm = v; fRedraw(); });
      const cv = VS_cache(D, 'cash');
      const capexNA = !D.QL.some((q) => isN(q.cx));
      setMsg('fcf', VL[cv.v] || 'Cash', cv.v === 'up' ? 'up' : cv.v === 'down' ? 'dn' : 'acc', capexNA ? `Capex is not reported in these filings, so free cash flow cannot be worked out (common for banks and insurers).${D.QL.some((q) => isN(q.cfo)) ? ' The bars show operating cash flow only.' : ''}` : cv.text + (isN(D.ttm.fcf) && isN(D.ttm.netInc) && D.ttm.netInc > 0 ? ` That is ${F.num(D.ttm.fcf / D.ttm.netInc * 100, 0)}% of net income over the same 12 months.` : ''));

      /* cash vs debt */
      chart(figOf('debt'), (W) => {
        const Bs = D.B.slice(-nQ(W)), iL = Bs.length - 1;
        return drawBars(W, {
          H: H0(W), labels: Bs.map((b) => b.short), fmt: axMoney, last: iL,
          series: [{ vals: Bs.map((b) => b.ci), cls: () => 'f-info' }, { vals: Bs.map((b) => (D.noDebt ? 0 : b.dt)), cls: () => 'f-dn o70' }],
          line: { vals: Bs.map((b) => b.nc), cls: 's-acc w2', dot: 'f-acc' },
          aria: 'Cash and investments, debt and net cash at each quarter end.',
          empty: 'The balance sheet has no cash or debt figures.',
          tip: (i) => { const b = Bs[i]; return tipRows(dShort(b.end), [['Cash + investments', money(b.ci)], ['Debt', D.noDebt ? 'none reported' : money(b.dt)], [isN(b.nc) && b.nc < 0 ? 'Net debt' : 'Net cash', isN(b.nc) ? money(Math.abs(b.nc)) : 'n/a', isN(b.nc) ? (b.nc >= 0 ? 'up' : 'dn') : '']]); },
        });
      });
      const bv = VS_cache(D, 'balance');
      setMsg('debt', VL[bv.v] || 'Balance', bv.v === 'up' ? 'up' : bv.v === 'down' ? 'dn' : 'acc', bv.text + (D.noDebt ? ' No debt appears in the filings.' : ''));

      /* shares */
      chart(figOf('shares'), (W) => {
        const Qs = D.QL.slice(-nQ(W));
        return drawLines(W, {
          H: Math.round(H0(W) * 0.85), labels: Qs.map((q) => q.short), fmt: (v) => shares(v), zero: false, endLabels: true, bridge: true,
          series: [{ name: 'Diluted shares', vals: Qs.map((q) => q.sh), cls: 's-vio', dot: 'f-vio', tcls: 'vio' }],
          aria: 'Diluted share count by quarter.', empty: 'The share count is not reported.',
          tip: (i) => { const q = Qs[i]; return tipRows(qTitle(q), [['Diluted shares', shares(q.sh)], ['Buybacks', money(q.bb)], ['Dividends', money(q.dv)], ['Stock-based pay', money(q.sb)]], q.sh == null ? 'No share count for this quarter (common for fourth quarters worked out from the annual report).' : ''); },
        });
      });
      const rd = out.querySelector('[data-reads="shares"]');
      if (rd) { const r = (l, v) => `<div><span>${l}</span><b>${v}</b></div>`; rd.innerHTML = r('Buybacks, 12 months', money(L.ttmBb)) + r('Dividends, 12 months', money(L.ttmDv)) + r('Stock-based pay, 12 months', money(L.ttmSb)); }
      const shv = VS_cache(D, 'shares');
      const bbTxt = !isN(L.ttmBb) || !isN(L.ttmSb) || L.ttmSb <= 0 ? '' : L.ttmBb > 0.5 ? ` Buybacks over the last year (${money(L.ttmBb)}) were ${F.num(L.ttmBb / L.ttmSb, 1)} times the stock-based pay (${money(L.ttmSb)}).` : ` There were no buybacks in the last year, while stock-based pay was ${money(L.ttmSb)}.`;
      setMsg('shares', VL[shv.v] || 'Shares', shv.v === 'up' ? 'up' : shv.v === 'down' ? 'dn' : 'acc', shv.text + bbTxt);

      /* annual */
      let am = 'rev';
      const aKey = { rev: 'rev', eps: 'eps', fcf: 'fc' }, tKey = { rev: 'revenue', eps: 'eps', fcf: 'fcf' }, aNm = { rev: 'Revenue', eps: 'Diluted EPS', fcf: 'Free cash flow' };
      const annMsg = () => {
        const A = D.A.filter((a) => isN(a[aKey[am]]));
        if (A.length < 2) { setMsg('annual', 'Long view', 'info', `Not enough yearly ${aNm[am].toLowerCase()} figures to show a trend.`); return; }
        const f = A[0], l = A[A.length - 1], yrs = l.fy - f.fy, a = f[aKey[am]], b = l[aKey[am]];
        let falls = 0; for (let i = 1; i < A.length; i++) if (A[i][aKey[am]] < A[i - 1][aKey[am]]) falls++;
        const fm2 = am === 'eps' ? (v) => usd(v) : money;
        let h = `${aNm[am]} went from ${fm2(a)} in fiscal ${f.fy} to ${fm2(b)} in fiscal ${l.fy}`;
        let pill = 'Long view', pc = 'info';
        if (a > 0 && b > 0 && yrs > 0) { const cg = (Math.pow(b / a, 1 / yrs) - 1) * 100; h += `: about ${SP(cg)} a year on average over ${yrs} years`; pill = cg >= 0 ? 'Grew' : 'Shrank'; pc = cg >= 0 ? 'up' : 'dn'; }
        h += falls ? `. It fell from one year to the next ${falls === 1 ? 'once' : falls + ' times'} in ${A.length - 1} years.` : '. It rose every single year.';
        if (am === 'eps') h += ' For a value investor, a long record of rising EPS and free cash flow per share matters more than any one quarter.';
        setMsg('annual', pill, pc, h);
      };
      const aRedraw = chart(figOf('annual'), (W) => {
        const A = D.A.slice(-10), k = aKey[am], tv = D.ttm[tKey[am]];
        const labels = A.map((a) => 'FY' + String(a.fy).slice(2)), vals = A.map((a) => a[k]);
        const hasT = isN(tv); if (hasT) { labels.push(W < 480 ? 'TTM' : 'Last 12m'); vals.push(tv); }
        const n = vals.length;
        return drawBars(W, {
          H: H0(W), labels, fmt: am === 'eps' ? axUsd : axMoney, maxBar: 40,
          series: [{ vals, cls: (v, i) => (hasT && i === n - 1 ? 'ern-ttm' : v < 0 ? 'f-dn' : i === n - (hasT ? 2 : 1) ? 'f-acc' : 'ern-bar') }],
          aria: `${aNm[am]} by fiscal year.`, empty: `Yearly ${aNm[am].toLowerCase()} is not reported.`,
          tip: (i) => { if (hasT && i === n - 1) return tipRows('Last 12 months (TTM)', [[aNm[am], am === 'eps' ? usd(tv) : smoney(tv)]], 'The latest four quarters added together.'); const a = A[i]; const p = i > 0 ? A[i - 1] : null; const g = p ? gr(a[k], p[k]) : null; return tipRows('Fiscal ' + a.fy + (a.end ? ' (ended ' + dShort(a.end) + ')' : ''), [[aNm[am], am === 'eps' ? usd(a[k]) : smoney(a[k]), cls(a[k])], ['vs the year before', SP(g), cls(g)], am === 'fcf' ? ['FCF per share', usd(a.fcps)] : null]); },
        });
      });
      segWire(id + '-am', (v) => { am = v; aRedraw(); annMsg(); });
      annMsg();

      /* price + reactions */
      chart(figOf('price'), (W) => drawPrice(W, D));
      chart(figOf('reac'), (W) => {
        const R = D.reac.slice(W < 480 ? -8 : -12);
        if (!R.length) return { svg: emptySVG(W, 120, 'No earnings reactions in the data.'), hover: null };
        return drawBars(W, {
          H: Math.round(clamp(W * 0.3, 160, 210)), labels: R.map((r) => r.short), fmt: axPct,
          series: [{ vals: R.map((r) => r.pct), cls: (v) => (v >= 0 ? 'f-up' : 'f-dn') }],
          refs: isN(D.avgMove) ? [{ v: D.avgMove, label: 'typical move ±' + P(D.avgMove) }, { v: -D.avgMove }] : [],
          aria: 'Stock move around each earnings report, in percent.',
          tip: (i) => { const r = R[i]; return tipRows(r.long + ' quarter', [['Report date', dShort(r.release)], ['Move', SP(r.pct), cls(r.pct)]], 'From the last close before the results to the first close after.'); },
        });
      });
      const vv = VS_cache(D, 'value');
      const pmsg = [];
      if (D.ser.length >= 2) { const a = D.ser[0], z = D.ser[D.ser.length - 1]; pmsg.push(`The stock went from ${usd(a.c)} (${dShort(a.s)}) to ${usd(z.c)} (${dShort(z.s)}), ${SP((z.c / a.c - 1) * 100)}.`); }
      else if (!isN(D.price)) pmsg.push('No price data came with this lookup, so the price chart and valuation ratios are not available.');
      else pmsg.push('No price history came with this lookup.');
      if (isN(D.avgMove)) pmsg.push(`Around its last ${D.reac.length} reports it moved ${P(D.avgMove)} on average, either way.`);
      if (vv.text && isN(D.price)) pmsg.push(vv.text);
      setMsg('price', vv.vl || 'Price', 'vio', pmsg.join(' '));
    }
    const vsCache = new WeakMap();
    function VS_cache(D, k) { let v = vsCache.get(D); if (!v) { v = verdicts(D); vsCache.set(D, v); } return v.find((x) => x.k === k) || {}; }

    function drawPrice(W, D) {
      const ser = D.ser, compact = W < 480, H = Math.round(clamp(W * 0.42, 230, 340));
      if (ser.length < 2) return { svg: emptySVG(W, 180, 'No price history for this stock.'), hover: null };
      const padL = compact ? 40 : 48, padR = 10, padT = compact ? 16 : 30, padB = 22;
      const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB;
      const d0 = ser[0].d, d1 = ser[ser.length - 1].d, xd = SML.lin(d0, d1 === d0 ? d0 + 1 : d1, x0, x1);
      const cs = ser.map((p) => p.c), sc = scaleOf(cs, false, compact ? 4 : 5), y = SML.lin(sc.lo, sc.hi, y1, y0);
      const gid = SML.uid('erng');
      let s = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ern-st0"/><stop offset="1" class="ern-st1"/></linearGradient></defs>`;
      sc.tk.forEach((v) => { s += S.line(x0, y(v), x1, y(v), 's-grid'); s += S.text(x0 - 6, y(v) + 3.5, axUsd(v), 'xs mono', 'end'); });
      const yr0 = new Date(d0 * 864e5).getUTCFullYear(), yr1 = new Date(d1 * 864e5).getUTCFullYear();
      for (let yr = yr0 + 1; yr <= yr1; yr++) { const xx = xd(Date.UTC(yr, 0, 1) / 864e5); if (xx < x0 + 4 || xx > x1 - 4) continue; s += S.line(xx, y0, xx, y1, 's-grid'); s += S.text(xx, y1 + 14, String(yr), 'xs mono', 'middle'); }
      s += '<g class="ern-hl"></g>';
      const step = Math.max(1, Math.floor(ser.length / Math.max(60, x1 - x0)));
      const pts = []; ser.forEach((p, i) => { if (i % step === 0 || i === ser.length - 1) pts.push([xd(p.d), y(p.c)]); });
      s += `<polygon points="${R(x0)},${R(y1)} ${pts.map((p) => R(p[0]) + ',' + R(p[1])).join(' ')} ${R(pts[pts.length - 1][0])},${R(y1)}" fill="url(#${gid})"/>`;
      s += S.poly(pts, 's-ink w15');
      /* report markers */
      const marks = D.reac.filter((r) => r.d >= d0 && r.d <= d1 + 7).map((r) => ({ r, x: xd(Math.min(r.d, d1)), y: y(D.priceAt(r.d) || ser[ser.length - 1].c) }));
      if (!marks.length) D.QL.forEach((q) => { const d = q.release ? dn(q.release) : null; const px = d != null ? D.priceAt(d) : null; if (d != null && d >= d0 && d <= d1 && isN(px)) marks.push({ r: null, q, x: xd(d), y: y(px) }); });
      let lastLX = -1e9;
      marks.forEach((mk, k) => {
        s += S.line(mk.x, mk.y + 5, mk.x, y1, 's-line dash2');
        const c = mk.r ? (mk.r.pct >= 0 ? 'f-up' : 'f-dn') : 'f-mut';
        s += S.circle(mk.x, mk.y, k === marks.length - 1 ? 5.5 : 4.5, c + ' ern-mk');
        if (k === marks.length - 1) s += S.circle(mk.x, mk.y, 8.5, 'ern-ring');
        if (!compact && mk.r) { const t = F.spct(mk.r.pct, Math.abs(mk.r.pct) < 1 ? 1 : 0), w = tw(t, 10, true) + 6; if (mk.x - lastLX >= w) { const ty = Math.max(11, mk.y - (k === marks.length - 1 ? 14 : 10)); s += S.text(clamp(mk.x, x0 + w / 2, x1 - w / 2), ty, t, 'xs mono b ' + (mk.r.pct >= 0 ? 'up' : 'dn'), 'middle'); lastLX = mk.x; } }
      });
      const lp = pts[pts.length - 1]; s += S.circle(lp[0], lp[1], 3.5, 'f-ink');
      const xs = ser.map((p) => xd(p.d));
      return {
        svg: S.wrap(W, H, `Share price over about five years with ${marks.length} earnings reports marked.`, s),
        hover: { xs, x0, x1, W, H,
          hl: (i) => S.line(xs[i], y0 - 6, xs[i], y1, 's-mut dash2') + S.circle(xs[i], y(ser[i].c), 4, 'f-ink ern-mk'),
          tip: (i) => { const p = ser[i]; const near = marks.filter((mk) => mk.r && Math.abs(mk.r.d - p.d) <= 6)[0]; return tipRows(dShort(p.s), [['Close', usd(p.c)], near ? ['Report: ' + near.r.long + ' quarter', SP(near.r.pct), cls(near.r.pct)] : null], near ? 'Move from the last close before the results to the first close after.' : ''); } },
      };
    }
    const R = (v) => SML.R1(v);

    /* ---- 10-year lens ---- */
    function lensBasis(D) {
      const sh = nz(D.SH && D.SH.sh, D.shOut);
      const fcfps = isN(D.ttm.fcf) && isN(sh) && sh > 0 ? D.ttm.fcf / sh : null;
      const eps = D.ttm.eps;
      const hist = (k) => { const A = D.A.filter((a) => isN(a[k]) && a[k] > 0); if (A.length < 2) return null; const f = A[0], l = A[A.length - 1], yrs = l.fy - f.fy; if (yrs < 3) return null; return { cg: (Math.pow(l[k] / f[k], 1 / yrs) - 1) * 100, f: f.fy, l: l.fy }; };
      const div = D.L ? D.L.ttmDv : null;
      return {
        fcf: { m0: fcfps, nm: 'Free cash flow per share', short: 'FCF/share', hist: hist('fcps'), payout: isN(div) && isN(D.ttm.fcf) && D.ttm.fcf > 0 ? div / D.ttm.fcf * 100 : 0 },
        eps: { m0: eps, nm: 'EPS', short: 'EPS', hist: hist('eps'), payout: isN(div) && isN(D.ttm.netInc) && D.ttm.netInc > 0 ? div / D.ttm.netInc * 100 : 0 },
      };
    }
    const defaultsFor = (b, price) => ({
      g: b.hist ? clamp(Math.round(b.hist.cg * 2) / 2, 0, 15) : 5,
      m: isN(b.m0) && b.m0 > 0 && isN(price) ? clamp(Math.round(price / b.m0), 8, 30) : 18,
      d: clamp(Math.round((b.payout || 0) / 5) * 5, 0, 100),
    });
    function lensHTML(D) {
      const B = lensBasis(D), basis = isN(B.fcf.m0) && B.fcf.m0 > 0 ? 'fcf' : isN(B.eps.m0) && B.eps.m0 > 0 ? 'eps' : 'fcf';
      const df = defaultsFor(B[basis], D.price), L = id + '-l';
      return `<section class="ern-sec" aria-labelledby="${id}-lz">
        <div class="ern-sh"><h3 id="${id}-lz"><i>04</i>The 10-year lens</h3><p>What would you need to believe for today’s price to pay off? An educational calculator with the company’s real numbers and your assumptions.</p></div>
        <div class="ern-panel ern-lens" data-lens="1">
          <div class="ern-bar">${ui.seg(L + '-b', [{ v: 'fcf', label: 'Free cash flow per share' }, { v: 'eps', label: 'EPS' }], basis, 'Start from')}${ui.field({ id: L + '-p', label: 'Price you pay', value: isN(D.price) ? D.price.toFixed(2) : '', step: 0.01, min: 0 })}</div>
          <div class="ern-fig" data-fig="lens"><div class="ern-svg"></div><div class="wg-tip ern-tip" hidden></div></div>
          <div class="ern-recipe" data-recipe="1"></div>
          <div class="wg-ctrl">
            ${ui.slider({ id: L + '-g', label: 'Growth per year, for 10 years', min: -10, max: 30, step: 0.5, value: df.g, fmt: (v) => F.spct(v, 1) })}
            ${ui.slider({ id: L + '-m', label: 'Multiple investors pay in year 10', min: 5, max: 50, step: 1, value: df.m, fmt: (v) => v + '×' })}
            ${ui.slider({ id: L + '-d', label: 'Paid out as dividends', min: 0, max: 100, step: 5, value: df.d, fmt: (v) => v + '%' })}
            ${ui.slider({ id: L + '-r', label: 'Your benchmark return', min: 0, max: 15, step: 0.5, value: 8, fmt: (v) => F.num(v, 1) + '% a year' })}
          </div>
          <div class="ern-reads" data-lreads="1"></div>
          <div class="wg-msg" data-lmsg="1"></div>
          <div class="wg-actions"><button type="button" class="btn btn-g sm" data-lreset="1">Reset to the company’s history</button></div>
          <div class="wg-note">Educational model, not a recommendation. It assumes the per-share number grows at one steady rate, the stock trades at your multiple in year 10, and dividends are a fixed share of it, paid each year and not reinvested. The default growth is the company’s own yearly growth over the annual reports shown (kept between 0% and 15%); the default benchmark of 8% is a placeholder you can change. Real results will differ, sometimes by a lot.</div>
          ${learnRow(['fcf', 'eps', 'pe', 'fcfYield'])}
        </div>
      </section>`;
    }
    function irr(P0, flows) {
      const npv = (r) => flows.reduce((s, f, k) => s + f / Math.pow(1 + r, k + 1), 0) - P0;
      let lo = -0.99, hi = 3;
      if (npv(lo) < 0) return -0.99; if (npv(hi) > 0) return hi;
      for (let k = 0; k < 90; k++) { const mid = (lo + hi) / 2; if (npv(mid) > 0) lo = mid; else hi = mid; }
      return (lo + hi) / 2;
    }
    function lensMath(P0, m0, g, mult, pay) {
      const flows = []; let div = 0, m = m0;
      for (let t = 1; t <= 10; t++) { m = m0 * Math.pow(1 + g, t); const d = pay * m; div += d; flows.push(d + (t === 10 ? mult * m : 0)); }
      return { m10: m, V: mult * m, div, r: irr(P0, flows) };
    }
    function wireLens(D) {
      const el = out.querySelector('[data-lens]'); if (!el) return;
      const L = id + '-l', B = lensBasis(D);
      const on0 = el.querySelector('#' + L + '-b button.on');
      let basis = on0 ? on0.dataset.v : 'fcf';
      let res = null;
      const num = (v) => (isN(v) ? v : null);
      const st = ui.wire(el, (e) => {
        const t = e && e.target;
        if (t && t.closest && t.closest('#' + L + '-b')) { const nb = st.seg(L + '-b'); if (nb !== basis) { basis = nb; const df = defaultsFor(B[basis], num(st.n(L + '-p'))); st.set(L + '-g', df.g); st.set(L + '-m', df.m); st.set(L + '-d', df.d); } }
        update();
      });
      el.querySelector('[data-lreset]').addEventListener('click', () => { const df = defaultsFor(B[basis], D.price); st.set(L + '-g', df.g); st.set(L + '-m', df.m); st.set(L + '-d', df.d); st.set(L + '-r', 8); if (isN(D.price)) st.set(L + '-p', D.price.toFixed(2)); update(); });
      const redraw = chart(el.querySelector('[data-fig="lens"]'), (W) => drawLens(W, res));
      const recipe = el.querySelector('[data-recipe]'), reads = el.querySelector('[data-lreads]'), msg = el.querySelector('[data-lmsg]');
      function update() {
        const b = B[basis], P0 = st.n(L + '-p'), g = st.n(L + '-g') / 100, mult = st.n(L + '-m'), pay = st.n(L + '-d') / 100, bm = st.n(L + '-r') / 100;
        const rd = (l, v, c2) => `<div><span>${l}</span><b${c2 ? ` class="${c2}"` : ''}>${v}</b></div>`;
        if (!isN(b.m0) || b.m0 <= 0) {
          res = null;
          recipe.innerHTML = `<span>${b.nm} over the last 12 months is ${isN(b.m0) ? `<b>${usd(b.m0)}</b>, below zero` : 'not available'}, so growth math cannot start from it.</span>`;
          reads.innerHTML = rd('Implied yearly return', 'n/a') + rd('Growth the price implies', 'n/a');
          msg.innerHTML = ui.msg('info', 'No starting point', `${isN(b.m0) ? 'A loss or negative cash flow cannot be grown into a price.' : 'This number is missing from the data.'} ${basis === 'fcf' && isN(B.eps.m0) && B.eps.m0 > 0 ? 'Try starting from EPS instead.' : basis === 'eps' && isN(B.fcf.m0) && B.fcf.m0 > 0 ? 'Try starting from free cash flow per share instead.' : 'Companies without profits are usually valued on sales (P/S) and on when profits might arrive.'}`);
          redraw(); return;
        }
        if (!isN(P0) || P0 <= 0) {
          res = null;
          recipe.innerHTML = '<span>Type the price you would pay per share to see the math.</span>';
          reads.innerHTML = rd('Implied yearly return', 'n/a') + rd('Growth the price implies', 'n/a');
          msg.innerHTML = ui.msg('info', 'Need a price', isN(D.price) ? 'Type a price above zero.' : 'No share price came with the data. Type the current price from your broker to use the calculator.');
          redraw(); return;
        }
        const r = lensMath(P0, b.m0, g, mult, pay);
        /* reverse: the growth that makes the implied return equal the benchmark */
        const f = (gg) => lensMath(P0, b.m0, gg, mult, pay).r - bm;
        let gImp = null, gTxt;
        if (f(-0.5) > 0) gTxt = 'below −50%';
        else if (f(1.0) < 0) gTxt = 'above 100%';
        else { let lo = -0.5, hi = 1.0; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (f(mid) > 0) hi = mid; else lo = mid; } gImp = (lo + hi) / 2; gTxt = F.spct(gImp * 100, 1); }
        res = { P0, r: r.r, bm };
        recipe.innerHTML = `<span>${b.short} now</span><b>${usd(b.m0)}</b><span>grows ${F.spct(g * 100, 1)} a year →</span><b>${usd(r.m10)}</b><span>in year 10, × ${mult} =</span><b class="acc">${usd(r.V)} a share</b>${pay > 0 ? `<span>+ dividends along the way</span><b>${usd(r.div)}</b>` : ''}<span>vs</span><b>${usd(P0)} today</b>`;
        const rp = r.r * 100;
        reads.innerHTML = rd('Price in year 10', usd(r.V)) + rd('Implied yearly return', r.r <= -0.989 ? '−100%' : F.spct(rp, 1), rp >= bm * 100 ? 'up' : 'dn') + rd('Your benchmark', F.num(bm * 100, 1) + '%') + rd('Growth the price implies', gTxt);
        const hi = b.hist ? ` For comparison, it grew ${F.spct(b.hist.cg, 1)} a year from fiscal ${b.hist.f} to ${b.hist.l}.` : '';
        const gap = rp - bm * 100;
        msg.innerHTML = ui.msg(gap >= 0 ? 'up' : 'dn', 'Math, not advice', `If ${b.nm.toLowerCase()} grows ${F.spct(g * 100, 1)} a year and investors pay ${mult}× it in year 10, buying at ${usd(P0)} works out to about <b>${r.r <= -0.989 ? '−100%' : F.spct(rp, 1)} a year</b>, ${Math.abs(gap) < 0.5 ? 'about the same as' : gap > 0 ? 'above' : 'below'} your ${F.num(bm * 100, 1)}% benchmark. To match the benchmark at that multiple, it would need to grow about <b>${gTxt}</b> a year for 10 years.${hi} The real question is whether those assumptions are believable.`);
        redraw();
      }
      update();
    }
    function drawLens(W, res) {
      if (!res) return { svg: emptySVG(W, 140, 'The math needs a positive starting number and a price.', 'Nothing to project yet'), hover: null };
      const compact = W < 480, H = Math.round(clamp(W * 0.36, 190, 260));
      const padL = compact ? 46 : 54, padR = compact ? 12 : 92, padT = 14, padB = 22;
      const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB;
      const a = [], b = []; for (let t = 0; t <= 10; t++) { a.push(1000 * Math.pow(1 + Math.max(res.r, -0.99), t)); b.push(1000 * Math.pow(1 + res.bm, t)); }
      const sc = scaleOf(a.concat(b), false, 4), y = SML.lin(sc.lo, sc.hi, y1, y0), x = (t) => x0 + (t / 10) * (x1 - x0);
      let s = '';
      sc.tk.forEach((v) => { s += S.line(x0, y(v), x1, y(v), 's-grid'); s += S.text(x0 - 6, y(v) + 3.5, '$' + F.num(v, 0), 'xs mono', 'end'); });
      for (let t = 0; t <= 10; t += compact ? 2 : 1) s += S.text(x(t), y1 + 14, t === 0 ? 'Now' : 'Y' + t, 'xs mono', 'middle');
      s += '<g class="ern-hl"></g>';
      s += S.poly(b.map((v, t) => [x(t), y(v)]), 's-info w2 dash');
      s += S.poly(a.map((v, t) => [x(t), y(v)]), 's-acc w25');
      s += S.circle(x(10), y(a[10]), 4.5, 'f-acc ern-mk') + S.circle(x(10), y(b[10]), 4, 'f-info ern-mk');
      if (!compact) {
        let ya = y(a[10]), yb = y(b[10]); if (Math.abs(ya - yb) < 30) { if (ya <= yb) { ya = yb - 30; } else { yb = ya - 30; } }
        s += S.text(x1 + 10, ya - 2, '$' + F.num(a[10], 0), 'md mono b acc') + S.text(x1 + 10, ya + 12, 'your math', 'xs mut');
        s += S.text(x1 + 10, yb - 2, '$' + F.num(b[10], 0), 'md mono b info') + S.text(x1 + 10, yb + 12, 'benchmark', 'xs mut');
      }
      const xs = a.map((_, t) => x(t));
      return { svg: S.wrap(W, H, '$1,000 growing at the implied return vs your benchmark over 10 years.', s),
        hover: { xs, x0, x1, W, H, hl: (t) => S.line(x(t), y0, x(t), y1, 's-mut dash2'), tip: (t) => tipRows(t === 0 ? 'Today' : 'Year ' + t, [['$1,000 at your math', '$' + F.num(a[t], 0), 'up'], ['$1,000 at the benchmark', '$' + F.num(b[t], 0)]]) } };
    }

    /* ---- the numbers table, glossary, more, notes ---- */
    function tableHTML(D) {
      const Qs = D.QL.slice(-12).reverse();
      const td = (v, f, c2) => `<td class="${!isN(v) ? 'na' : c2 || ''}">${isN(v) ? f(v) : 'n/a'}</td>`;
      return `<details class="ern-panel ern-tblx"><summary>See every quarterly number in a table</summary><div class="ern-tblw scroll"><table class="ern-tbl">
        <thead><tr><th>Quarter</th><th>Revenue</th><th>YoY</th><th>Gross margin</th><th>Operating margin</th><th>Net income</th><th>EPS (diluted)</th><th>Op. cash flow</th><th>Capex</th><th>Free cash flow</th><th>Shares</th></tr></thead>
        <tbody>${Qs.map((q) => `<tr class="${q === D.L ? 'cur' : ''}"><td>${esc(q.label || q.short)}${q.fq ? ` · ${esc(q.fq)}` : ''}</td>${td(q.rev, money)}${td(q.revY, (v) => F.spct(v, 1), cls(q.revY))}${td(q.gm, (v) => P(v), q.gm < 0 ? 'dn' : '')}${td(q.om, (v) => P(v), q.om < 0 ? 'dn' : '')}${td(q.ni, smoney, q.ni < 0 ? 'dn' : '')}${td(q.eps, (v) => (q.derived ? '≈' : '') + usd(v), q.eps < 0 ? 'dn' : '')}${td(q.cfo, smoney)}${td(q.cx, money)}${td(q.fc, smoney, q.fc < 0 ? 'dn' : '')}${td(q.sh, shares)}</tr>`).join('')}</tbody></table></div></details>`;
    }
    function glossaryHTML(D) {
      return `<section class="ern-sec" aria-labelledby="${id}-gl">
        <div class="ern-sh"><h3 id="${id}-gl"><i>05</i>Words to know</h3><p>Every idea on this page: what it is, why it matters, how it moves the stock around earnings, and what it means for a 10-year owner.</p></div>
        <div class="ern-gl">${ORDER.map((k) => `<details><summary><span class="t"><b>${C[k].t}</b>${C[k].full ? `<span>${C[k].full}</span>` : ''}</span></summary>${cardHTML(k, D).replace(/^[\s\S]*?<dl/, '<dl')}</details>`).join('')}</div>
      </section>`;
    }
    function moreHTML() {
      const L = (lid, t0, d) => { const l = SML.lessons.find((x) => x.id === lid); return `<a href="#${lid}"><span>Read a Real Company</span><b>${esc(l ? l.title : t0)}</b><small>${d}</small></a>`; };
      return `<section class="ern-sec" aria-label="Keep learning"><div class="ern-more">
        ${L('l-rc-words', 'Earnings words in plain English', 'Every earnings term, with Hoppy’s Coffee Cart and Apple side by side.')}
        ${L('l-rc-apple-income', 'Apple’s earnings, line by line', 'A real income statement as a waterfall, from revenue to EPS.')}
        ${L('l-rc-price', 'How earnings move the stock price', 'Price = EPS × P/E, and why guidance matters most.')}
        ${L('l-rc-apple-call', 'Listen: Apple’s earnings call, explained', 'A plain-words retelling of a real call, with the numbers on screen.')}
      </div></section>`;
    }
    function notesHTML(D) {
      const m = D.m, notes = Array.isArray(m.notes) ? m.notes.filter((x) => typeof x === 'string') : [];
      const pr = m.price || {};
      return `<section class="ern-panel ern-notes" aria-label="Data notes and sources">
        <p class="ern-lk">Data notes and sources</p>
        <p>From the company’s SEC filings (GAAP, as filed). The quarterly report (10-Q) usually appears a few days after the earnings release; analyst estimates and guidance are not included.${D.sample ? ' <b>This result uses made-up sample data.</b>' : ''}</p>
        ${notes.length ? `<ul>${notes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <p>Money in US dollars${m.units && m.units.money ? ` (${esc(m.units.money)} in the data)` : ''}. Net cash on this page = cash + short- and long-term investments − short- and long-term debt. Margins, growth rates, TTM sums, the report card and the 10-year lens are worked out on this page from the filed numbers.${pr.source ? ` Prices: ${esc(pr.source)}${pr.lastDate ? `, last close ${dShort(pr.lastDate)}` : ''}.` : ''}</p>
        ${!D.sample && m.latest && m.latest.url ? `<p><a href="${esc(m.latest.url)}" target="_blank" rel="noopener noreferrer">Open the ${esc(m.latest.form || 'filing')} on SEC.gov</a>${m.latest.release && m.latest.release.url ? ` · <a href="${esc(m.latest.release.url)}" target="_blank" rel="noopener noreferrer">the earnings release</a>` : ''}</p>` : ''}
        <p>Education only. Nothing here is investment advice or a prediction; it is not a reason to buy or sell any stock.</p>
      </section>`;
    }

    /* ---- start ---- */
    (function start() {
      if (!E) { engineMissing(); return; }
      if (opts.ticker) { load(opts.ticker); return; }
      if (!live) { showSample(null); return; }
      const last = SML.store.get(STORE, null);
      if (typeof last === 'string' && /^[A-Z][A-Z0-9.\-]{0,9}$/.test(last)) load(last); else showEmpty();
    })();
  };

  /* ---------------- tool entry ---------------- */
  if (!SML.tools.some((t) => t.id === 'tool-earnings')) {
    SML.tools.push({ track: 'trading', id: 'tool-earnings', title: 'Earnings lookup', blurb: 'Search any US stock and see its latest earnings explained in plain words, with charts that show whether the business is improving or getting worse.', widget: 'earnLookup', cat: 'Stocks', icon: 'value', lesson: 'l-rc-words' });
  }

  /* ---------------- Calendar page: append the section ---------------- */
  if (typeof SML.pages.calendar === 'function') {
    const base = SML.pages.calendar;
    SML.pages.calendar = function (view, tok) {
      const t = base(view, tok);
      try {
        const hid = SML.uid('ern-h');
        const sec = document.createElement('section');
        sec.className = 'ern-page';
        sec.setAttribute('aria-labelledby', hid);
        sec.innerHTML = `<div class="wrap" style="padding-bottom:80px">${SML.chapHead('', 'Earnings, explained: look up any stock', 'Search a company and see its latest quarter in plain words: is the business improving or getting worse, what each number means, and why it matters for the stock now and for an owner 10 years from now.', SML.more('#tool-earnings', 'Open as a full-page tool'), hid)}${SML.widgetHTML('earnLookup')}</div>`;
        view.appendChild(sec);
      } catch (err) { console.error(err); }
      return t;
    };
  }
})();
