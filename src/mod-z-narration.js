/* Lesson narration: "Listen to this lesson" on every lesson page.
   SML.narrate.script(lesson) -> { chapters: [{ key, name, paras: [text, ...] }] } builds the spoken script from the
   lesson object (title, idea, body, worked example, mistakes, takeaways), with numbers, symbols and acronyms written
   out the way they should be said. The same script is used for the recorded audio (tools/narration/, Kokoro voice)
   and for the device-voice fallback, so both read the same words.
   Recorded files: SML.narration[lessonId] = { file, dur, chapters: [[seconds, key], ...], hash } (generated into
   mod-z-narration-data.js by tools/narration/render.py). Lessons without a recording use the browser's own voice. */
(function () {
  'use strict';
  const SML = window.SML;

  /* ---------------- text -> speech-ready text ---------------- */
  // phrases with symbols, replaced first (exact, case-sensitive, not part of a longer word)
  const PHRASE = [
    ["P/E's", 'P Es'], ['P/Es', 'P Es'], ['P/E', 'P E'], ['P/S', 'P S'], ['P/B', 'P B'], ['S&P', 'S and P'], ['R&D', 'R and D'], ['SG&A', 'S G and A'], ['M&A', 'M and A'], ['Q&A', 'Q and A'], ['AT&T', 'A T and T'],
    ['401(k)s', 'four oh one Ks'], ['401(k)', 'four oh one K'], ['403(b)', 'four oh three B'], ['457(b)', 'four fifty-seven B'], ['72(t)', 'seventy-two T'], ['529 plans', 'five twenty-nine plans'], ['529 plan', 'five twenty-nine plan'], ['529s', 'five twenty-nines'], ['1099', 'ten ninety-nine'], ['W-2', 'W two'], ['W-4', 'W four'],
    ['Non-GAAP', 'non-gap'], ['non-GAAP', 'non-gap'], ['OPEC+', 'oh-peck plus'], ['e.g.', 'for example'], ['i.e.', 'that is'], ['etc.', 'and so on'], ['vs.', 'versus'], ['approx.', 'about'], ['J.P. Morgan', 'J P Morgan'], ['U.S.', 'U S'], ['2FA', 'two-factor'], ['Form 1040', 'Form ten forty'], ['1040s', 'ten forties'],
    ['reward:risk', 'reward to risk'], ['risk:reward', 'risk to reward'], ['and/or', 'and or'], ['24/7', 'twenty-four seven'], ['S-1', 'S one'], ['10-K', '10 K'], ['10-Q', '10 Q'], ['8-K', '8 K'], ['1σ', 'one standard deviation'], ['2σ', 'two standard deviations'],
  ];
  const reEsc = (k) => k.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
  const PHRASE_RE = PHRASE.map(([k, v]) => [new RegExp('(^|[^A-Za-z0-9])' + reEsc(k) + '(?![A-Za-z0-9])', 'g'), v]);
  // single words (case-sensitive) that should not be spelled letter by letter, or need help
  const SAY = {
    YoY: 'year over year', QoQ: 'quarter over quarter', EBITDA: 'ee-bit-dah', GAAP: 'gap', FIRE: 'fire', OPEC: 'oh-peck', NASDAQ: 'nazdak', Nasdaq: 'nazdak', COVID: 'covid', HELOC: 'hee-lock',
    IRMAA: 'irma', VWAP: 'V-wap', FICO: 'fye-co', NATO: 'nay-toe', ARPU: 'ar-poo', SPDR: 'spider', MAGI: 'magi', FINRA: 'finra', FAFSA: 'faf-sa', EDGAR: 'Edgar', DEMO: 'demo', SIPC: 'sip-ick', NASA: 'nasa',
    BTC: 'bitcoin', ETH: 'ether', DeFi: 'dee-fye', SpaceX: 'Space X', xAI: 'X A I', vs: 'versus', yrs: 'years', yr: 'year', Grok: 'grock', ChatGPT: 'Chat G P T', FiredBunny: 'Fired Bunny', TradingView: 'Trading View',
  };
  // capitalised words that are ordinary words (read as words, not letters)
  const WORDS = new Set(['A', 'I', 'OK', 'NOT', 'NO', 'NEVER', 'ALWAYS', 'ONLY', 'ALL', 'AND', 'OR', 'THE', 'IF', 'THEN', 'BUY', 'SELL', 'STOP', 'YES', 'DO', 'MUST', 'WILL', 'YOUR', 'NEW', 'OUT', 'OFF', 'ON', 'IN', 'UP', 'DOWN', 'LONG', 'SHORT', 'CALL', 'PUT', 'HOLD', 'WAIT', 'LOW', 'HIGH', 'OPEN', 'CLOSE', 'DATA', 'NOW', 'SET', 'TO', 'BE', 'IS', 'ARE', 'ONE', 'TWO', 'WIN', 'LOSS', 'RISK', 'CASH', 'DEBT', 'TAX', 'FREE', 'YEAR', 'PLAN', 'RULE', 'RULES', 'DAY', 'WEEK']);
  const DIG = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const ORD = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth' };
  const UNITW = { k: 'thousand', K: 'thousand', thousand: 'thousand', m: 'million', M: 'million', mn: 'million', million: 'million', b: 'billion', B: 'billion', bn: 'billion', billion: 'billion', t: 'trillion', T: 'trillion', tn: 'trillion', trillion: 'trillion' };
  const N = '(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?';
  const U = '(k|K|m|M|mn|b|B|bn|t|T|tn|thousand|million|billion|trillion)(?![A-Za-z])';
  const CUR = { '$': ['dollar', 'dollars'], '€': ['euro', 'euros'], '£': ['pound', 'pounds'] };
  const RANGE_RE = new RegExp('([$€£])\\s?(' + N + ')\\s?(?:' + U + ')?\\s?(?:–|—|-|to)\\s?[$€£]?\\s?(' + N + ')(?:\\s?' + U + ')?', 'g');
  const MONEY_U_RE = new RegExp('([$€£])\\s?(' + N + ')\\s?' + U, 'g');
  const MONEY_RE = new RegExp('([$€£])\\s?(' + N + ')', 'g');
  const PCT_RANGE_RE = new RegExp('(' + N + ')\\s?%?\\s?(?:–|—|-)\\s?(' + N + ')\\s?%', 'g');
  const BARE_U_RE = new RegExp('(\\d)\\s?(K|M|mn|B|bn|T|tn)(?![A-Za-z])', 'g');
  const FUNC = /(?:^|[\s(,])(?:vs|versus|of|at|to|by|from|than|was|is|are|be|near|around|and|or|for|with|in|on|a|an|the|cost|costs|rose|fell|about|roughly|only|just|nearly|almost|some|minus|plus|times|under|over|below|above|up|down|worth|pays|paid|earns|makes|adds|takes|needs|need|gets|keeps|saves|costing|reach|reaches|hit|hits)\s*$/i;
  const said = (w) => (/^[A-Z]{2,6}$/.test(w) ? w.split('').join(' ') : w);
  function stripBlocks(h) {
    return String(h || '')
      .replace(/<pre[\s\S]*?<\/pre>/gi, '<p>The code is shown on the page.</p>')
      .replace(/<table[\s\S]*?<\/table>/gi, '<p>The table on the page has the details.</p>')
      .replace(/<(script|style|svg|figure|button|select)[\s\S]*?<\/\1>/gi, ' ');
  }
  function norm(input) {
    let s = stripBlocks(input);
    s = s.replace(/<br\s*\/?>/gi, '. ').replace(/<\/(p|li|h[1-6]|div|dt|dd|tr|summary)>/gi, '. ').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&[a-z]+;/g, ' ')
      .replace(/[⁠​­]/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/ /g, ' ');
    // links: read the site name only
    s = s.replace(/https?:\/\/(?:www\.)?([^\/\s"')<]+)[^\s"')<]*/g, (m, d) => d.replace(/\./g, ' dot '))
      .replace(/\b((?:[A-Za-z0-9-]+\.)+(?:com|gov|org|net|io|ai|co|app|dev|edu))(?:\/[^\s"')<]*)?/g, (m, d) => d.replace(/\./g, ' dot '));
    PHRASE_RE.forEach(([re, v]) => { s = s.replace(re, (m, pre) => pre + v); });
    // money and percent ranges: $108.7–109.0 billion, $1.88–1.89, 9–11%
    s = s.replace(RANGE_RE, (m, c, a, u1, b, u2) => { const w = CUR[c][1]; if (c === '$' && !u1 && !u2 && +a < 1 && +b < 1 && /^0?\.\d\d$/.test(a) && /^0?\.\d\d$/.test(b)) return `${Math.round(a * 100)} to ${Math.round(b * 100)} cents`; if (u1 && u2 && UNITW[u1] !== UNITW[u2]) return `${a} ${UNITW[u1]} to ${b} ${UNITW[u2]} ${w}`; const u = UNITW[u2 || u1]; return `${a} to ${b}${u ? ' ' + u : ''} ${w}`; })
      .replace(PCT_RANGE_RE, '$1 to $2 percent');
    s = s.replace(/\(\$\s?(millions|billions)\)/g, '(in $1 of dollars)').replace(/\$\s?(millions|billions)\b/g, '$1 of dollars');
    s = s.replace(MONEY_U_RE, (m, c, n, u) => `${n} ${UNITW[u]} ${CUR[c][1]}`)
      .replace(/\$0?\.(\d{2})(?!\d)/g, (m, c) => (+c) + (c === '01' ? ' cent' : ' cents'))
      .replace(MONEY_RE, (m, c, n) => n + ' ' + CUR[c][n === '1' ? 0 : 1])
      .replace(new RegExp('(' + N + ')\\s?¢', 'g'), (m, n) => n + (n === '1' ? ' cent' : ' cents'))
      .replace(BARE_U_RE, (m, d, u) => d + ' ' + UNITW[u]);
    s = s.replace(/\/mo\b/g, ' a month').replace(/\/yr\b/g, ' a year').replace(/\/year\b/g, ' a year').replace(/\/month\b/g, ' a month').replace(/\/share\b/g, ' a share').replace(/\/day\b/g, ' a day').replace(/\/week\b/g, ' a week');
    // symbols
    s = s.replace(/(\d)½/g, '$1 and a half').replace(/½/g, 'half').replace(/(\d)¼/g, '$1 and a quarter').replace(/(\d)¾/g, '$1 and three quarters')
      .replace(/(\d)\s?[–—]\s?(\d)/g, '$1 to $2').replace(/\b(\d+)-(\d+)\b(?!-)/g, (m, a, b, i, str) => (/[A-Za-z-]$/.test(str.slice(0, i)) ? m : a + ' to ' + b))
      .replace(/([A-Za-z])–([A-Za-z])/g, '$1 to $2').replace(/\s?—\s?/g, ', ').replace(/\s–\s/g, ', ')
      .replace(/−/g, ' minus ')
      .replace(/\s*[≈~]\s?(?=\S)/g, (m, i, str) => { const pre = str.slice(0, i); return (i === 0 || !/\s/.test(m.charAt(0)) || FUNC.test(pre) || !/[A-Za-z0-9%)]\s*$/.test(pre)) ? ' about ' : ' is about '; })
      .replace(/±/g, ' plus or minus ').replace(/≥/g, ' at least ').replace(/≤/g, ' at most ').replace(/→|⟶|->/g, ' to ').replace(/←/g, ' from ')
      .replace(/(\d)\s?×/g, '$1 times').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/\s*=\s*/g, ' equals ')
      .replace(/√\s?/g, ' the square root of ').replace(/\s?\^\s?/g, ' to the power of ').replace(/σ/g, ' standard deviation')
      .replace(/(\d)\s?%/g, '$1 percent').replace(/%/g, ' percent').replace(/\+/g, ' plus ')
      .replace(/(\d)\s?bps?\b/g, '$1 basis points').replace(/(\d)\s?pts?\b/g, '$1 points').replace(/(\d)x\b/g, '$1 times').replace(/(\d)R\b/g, '$1 R')
      .replace(/#(\d)/g, 'number $1').replace(/[#*_{}|\[\]]/g, ' ').replace(/@/g, ' at ')
      .replace(/([A-Z][\w ]{1,24}) > (?=[A-Z])/g, '$1, then ').replace(/\s>\s/g, ' greater than ').replace(/\s<\s/g, ' less than ')
      .replace(/·|•|▸|▶|✓|✔|★|☆|⭐|◀|▲|▼|…/g, (c) => (c === '…' ? '...' : ', ')).replace(/&/g, ' and ')
      .replace(/(\d):(\d)(?!\d)/g, '$1 to $2');
    // fractions and pairs: 60/40, 50/30/20, 1/20, TOD/POD
    s = s.replace(/\b(\d+)\/(\d+)(?:\/(\d+))?\b/g, (m, a, b, c) => (c ? `${a} ${b} ${c}` : a === '1' && b.length > 1 ? `1 in ${b}` : `${a} ${b}`))
      .replace(/\b([A-Za-z]+)\/([A-Za-z]+)\b/g, (m, a, b) => said(a) + ' or ' + said(b)).replace(/\//g, ' ');
    // quarters and fiscal years
    s = s.replace(/\bQ([1-4])\s?(?:FY)?\s?(20)?(\d{2})\b/g, (m, q, c, y) => ORD[q] + ' quarter of ' + (c ? '20' + y : 'fiscal 20' + y))
      .replace(/\bQ([1-4])\b/g, (m, q) => 'Q ' + DIG[+q]).replace(/\bFY\s?(20\d{2})\b/g, 'fiscal $1').replace(/\bFY\s?(\d{2})\b/g, 'fiscal 20$1').replace(/\bH([12])\b/g, (m, h) => (h === '1' ? 'first' : 'second') + ' half');
    // CODE_LIKE_NAMES -> words; brackets -> pauses
    s = s.replace(/\b[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+\b/g, (w) => w.replace(/_/g, ' ').toLowerCase())
      .replace(/\s*\(\s*\)/g, '').replace(/\s*\(\s*/g, ', ').replace(/\s*\)\s*/g, ', ');
    // words and acronyms
    s = s.replace(/[A-Za-z][A-Za-z0-9']*/g, (w) => {
      if (Object.prototype.hasOwnProperty.call(SAY, w)) return SAY[w];
      if (WORDS.has(w)) return w.length > 1 ? w.toLowerCase() : w;
      const d = /^([A-Z]{1,5})(\d+)$/.exec(w); if (d) return d[1].split('').join(' ') + ' ' + d[2];
      const m = /^([A-Z]{2,6})(s|'s)?$/.exec(w);
      if (m) return m[1].split('').join(' ') + (m[2] ? (m[2] === 's' ? 's' : "'s") : '');
      return w;
    });
    s = s.replace(/\s+([.,;:!?])/g, '$1').replace(/[,;:]+\s*([.!?])/g, '$1').replace(/,\s*([:;])/g, '$1').replace(/([.!?:;])\s*[.,;:]+/g, '$1').replace(/,(\s*,)+/g, ',').replace(/^[\s,.;:]+/, '').replace(/[,;:]+\s*$/, '').replace(/\s{2,}/g, ' ').trim();
    if (s && !/[.!?"]$/.test(s)) s += '.';
    return s;
  }
  // split a block of text into paragraphs of reasonable length for synthesis
  function paras(html) {
    const blocks = stripBlocks(html).replace(/<\/(p|li|h[1-6]|dd|tr|blockquote)>/gi, '$&\u0001').split('\u0001');
    const out = [];
    blocks.forEach((b) => { const t = norm(b); if (t && t.replace(/[^A-Za-z0-9]/g, '').length > 1) out.push(t); });
    return out;
  }
  function script(l) {
    if (!l) return { chapters: [] };
    const course = (SML.courses || []).find((c) => c.id === l.course);
    const ch = [];
    const intro = [norm(`${l.title}.`) + (course ? ' ' + norm(`From the course ${course.title}.`) : '')];
    if (l.idea || l.summary) intro.push(norm(l.idea || l.summary));
    ch.push({ key: 'intro', name: 'Intro', paras: intro });
    const body = (l.body || []).flatMap(paras);
    if (body.length) ch.push({ key: 'how', name: 'How it works', paras: body });
    if (l.example) {
      const e = l.example; const p = [norm(`Worked example. ${e.title || ''}`)];
      if (e.intro) p.push(norm(e.intro));
      (e.steps || []).forEach((st, i) => p.push(norm(`Step ${i + 1}. ${st}`)));
      if (e.result) p.push(norm(`The result: ${e.result}`));
      ch.push({ key: 'ex', name: 'Worked example', paras: p });
    }
    if ((l.mistakes || []).length) ch.push({ key: 'mis', name: 'Mistakes to avoid', paras: [norm('Common mistakes.')].concat(l.mistakes.map(norm)) });
    if ((l.points || []).length) ch.push({ key: 'pts', name: 'Key takeaways', paras: [norm('Key takeaways.')].concat(l.points.map(norm)) });
    ch.forEach((c) => { c.paras = c.paras.filter(Boolean); });
    return { chapters: ch.filter((c) => c.paras.length) };
  }
  function words(sc) { return sc.chapters.reduce((n, c) => n + c.paras.join(' ').split(/\s+/).length, 0); }
  // stable short hash of the script text, so the renderer knows when a lesson changed
  function hash(sc) { const t = sc.chapters.map((c) => c.key + ':' + c.paras.join('\n')).join('\n\n'); let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  /* ---------------- the player ---------------- */
  SML.css(`
    .nar{display:flex;flex-direction:column;gap:10px;max-width:640px}
    .nar-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .nar-play{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 18px 0 6px;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent) 55%,var(--line));background:color-mix(in srgb,var(--accent) 12%,var(--surface));color:var(--ink);font:600 14px var(--sans);cursor:pointer}
    .nar-play:hover{border-color:var(--accent)}
    .nar-play .nar-ic{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:#0b0f19;flex:0 0 auto}
    .nar-play small{font:500 12px var(--mono);color:var(--muted);letter-spacing:.04em}
    .nar-speed{min-height:36px;padding:0 10px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:600 12px var(--mono)}
    .nar-src{font:500 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
    .nar-bar{position:relative;height:6px;border-radius:3px;background:var(--line);cursor:pointer;touch-action:none}
    .nar-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:var(--accent)}
    .nar-bar b{position:absolute;top:-3px;width:2px;height:12px;background:var(--muted);opacity:.6}
    .nar-chaps{display:flex;flex-wrap:wrap;gap:6px}
    .nar-chaps button{min-height:30px;padding:0 10px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--muted);font:500 12px var(--sans);cursor:pointer}
    .nar-chaps button.on{color:var(--ink);border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
    .nar-time{font:500 12px var(--mono);color:var(--muted)}
    .nar-cap{font-size:14px;line-height:1.5;color:var(--muted);min-height:1.5em}
    .nar-mini{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) translateY(140%);z-index:60;display:flex;align-items:center;gap:10px;width:min(560px,calc(100vw - 24px));padding:8px 12px 8px 8px;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent) 45%,var(--line));background:color-mix(in srgb,var(--surface) 92%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 10px 40px -10px rgba(0,0,0,.6);transition:transform .25s ease}
    .nar-mini.show{transform:translateX(-50%) translateY(0)}
    .nar-mini .nar-ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:#0b0f19;border:0;cursor:pointer;flex:0 0 auto}
    .nar-mini .nar-mt{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
    .nar-mini .nar-mt span{font:600 12.5px var(--sans);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .nar-mini .nar-x{background:transparent;border:0;color:var(--muted);font-size:18px;cursor:pointer;padding:4px 6px}
    @media (prefers-reduced-motion:reduce){.nar-mini{transition:none}}
  `);
  const IC = {
    play: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.8v10.4L12 7z" fill="currentColor"/></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor"/></svg>',
  };
  const fmtT = (s) => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const store = { get: (k, d) => { try { return SML.store.get(k, d); } catch (e) { return d; } }, set: (k, v) => { try { SML.store.set(k, v); } catch (e) {} } };

  function bestVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = window.speechSynthesis.getVoices().filter((v) => /^en(-|_)?(US|GB|AU|CA)?/i.test(v.lang));
    if (!vs.length) return null;
    const score = (v) => (/natural|neural|premium|enhanced/i.test(v.name) ? 50 : 0) + (/aria|jenny|ava|samantha|allison|google us english|zoe|serena|michelle/i.test(v.name) ? 20 : 0) + (/en-US/i.test(v.lang) ? 5 : 0) + (v.localService ? 0 : 2);
    return vs.slice().sort((a, b) => score(b) - score(a))[0];
  }

  function mount(el, lesson) {
    if (!el || !lesson) return;
    const sc = script(lesson); if (!sc.chapters.length) return;
    let rec = SML.host !== 'claude' && SML.narration ? SML.narration[lesson.id] : null; // the claude.ai preview has no audio files
    try { if (rec && !new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"')) rec = null; } catch (e) { rec = null; }
    const hasTTS = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
    let mode = rec ? 'audio' : (hasTTS ? 'tts' : null);
    if (!mode) return;
    // device-voice timing is estimated at ~153 words a minute
    let flat = [], estDur = 0, chapStarts = [];
    function ttsPlan() { let t = 0; flat = []; chapStarts = []; sc.chapters.forEach((c, ci) => { chapStarts.push(t); c.paras.forEach((p) => { const d = p.split(/\s+/).length / 2.55; flat.push({ ci, p, t, d }); t += d; }); }); estDur = t; }
    if (rec) { estDur = rec.dur; chapStarts = (rec.chapters || []).map((c) => c[0]); if (chapStarts.length !== sc.chapters.length) chapStarts = sc.chapters.map((c, i) => (rec.chapters[i] ? rec.chapters[i][0] : 0)); } else ttsPlan();
    const ticks = () => chapStarts.slice(1).map((t) => `<b style="left:${(t / (estDur || 1)) * 100}%"></b>`).join('');
    let speed = +store.get('narSpeed', 1) || 1;
    el.innerHTML = `<div class="nar" role="region" aria-label="Listen to this lesson">
      <div class="nar-row">
        <button type="button" class="nar-play" data-n="toggle"><span class="nar-ic">${IC.play}</span><span>Listen to this lesson</span><small>${fmtT(estDur)}</small></button>
        <select class="nar-speed" data-n="speed" aria-label="Playback speed">${[0.8, 0.9, 1, 1.15, 1.25, 1.5].map((v) => `<option value="${v}"${v === speed ? ' selected' : ''}>${v}×</option>`).join('')}</select>
        <span class="nar-src">${mode === 'audio' ? 'Natural voice' : 'Your device’s voice'}</span>
      </div>
      <div class="nar-more" hidden>
        <div class="nar-bar" data-n="bar" role="slider" aria-label="Position" tabindex="0" aria-valuemin="0" aria-valuemax="${Math.round(estDur)}" aria-valuenow="0"><i style="width:0"></i>${ticks()}</div>
        <div class="nar-row" style="justify-content:space-between"><div class="nar-chaps">${sc.chapters.map((c, i) => `<button type="button" data-chap="${i}">${c.name}</button>`).join('')}</div><span class="nar-time" data-n="time">0:00 / ${fmtT(estDur)}</span></div>
        <p class="nar-cap" data-n="cap" aria-live="off"${mode === 'tts' ? '' : ' hidden'}></p>
      </div>
    </div>`;
    const $ = (s) => el.querySelector(s);
    const btn = $('[data-n="toggle"]'), bar = $('[data-n="bar"]'), more = $('.nar-more'), timeEl = $('[data-n="time"]'), cap = $('[data-n="cap"]');
    const mini = document.createElement('div'); mini.className = 'nar-mini'; mini.setAttribute('role', 'region'); mini.setAttribute('aria-label', 'Lesson audio');
    mini.innerHTML = `<button type="button" class="nar-ic" data-n="mtoggle" aria-label="Play or pause">${IC.pause}</button><div class="nar-mt"><span>${SML.esc ? SML.esc(lesson.title) : lesson.title}</span><div class="nar-bar" data-n="mbar"><i style="width:0"></i></div></div><button type="button" class="nar-x" data-n="mclose" aria-label="Stop">×</button>`;
    document.body.appendChild(mini);
    let playing = false, started = false, visible = true;

    /* --- engine: recorded audio --- */
    let audio = null;
    /* --- engine: device voice --- */
    let idx = 0, ttsT = 0, ttsTimer = 0, utt = null;
    function toTTS(at) { // recorded file failed to load: carry on with the device voice from about the same place
      audio = null; mode = 'tts'; const frac = at / (estDur || 1); ttsPlan();
      el.querySelector('.nar-src').textContent = 'Your device’s voice'; cap.hidden = false;
      bar.innerHTML = '<i style="width:0"></i>' + ticks(); bar.setAttribute('aria-valuemax', String(Math.round(estDur)));
      seekTTS(frac * estDur); if (started) playTTS();
    }
    const total = () => (mode === 'audio' ? (audio && isFinite(audio.duration) ? audio.duration : estDur) : estDur);
    const pos = () => (mode === 'audio' ? (audio ? audio.currentTime : 0) : ttsT);
    function paint() {
      const p = Math.min(1, pos() / (total() || 1));
      bar.firstElementChild.style.width = (p * 100) + '%'; mini.querySelector('[data-n="mbar"] i').style.width = (p * 100) + '%';
      bar.setAttribute('aria-valuenow', String(Math.round(pos())));
      timeEl.textContent = fmtT(pos()) + ' / ' + fmtT(total());
      let ci = 0; chapStarts.forEach((s, i) => { if (pos() + 0.25 >= s) ci = i; });
      el.querySelectorAll('[data-chap]').forEach((b, i) => b.classList.toggle('on', i === ci));
      const ic = playing ? IC.pause : IC.play; btn.querySelector('.nar-ic').innerHTML = ic; mini.querySelector('[data-n="mtoggle"]').innerHTML = ic;
      btn.querySelector('span:nth-child(2)').textContent = playing ? 'Pause' : (started ? 'Resume' : 'Listen to this lesson');
      mini.classList.toggle('show', started && !visible);
    }
    function ensureAudio() {
      if (audio) return audio;
      audio = new Audio(); audio.preload = 'metadata'; audio.src = rec.file; audio.playbackRate = speed;
      audio.addEventListener('timeupdate', paint); audio.addEventListener('loadedmetadata', paint);
      audio.addEventListener('ended', () => { playing = false; paint(); });
      audio.addEventListener('pause', () => { playing = false; paint(); });
      audio.addEventListener('play', () => { playing = true; paint(); });
      audio.addEventListener('error', () => { const at = audio.currentTime || 0; if (hasTTS) toTTS(at); else { playing = false; paint(); } });
      return audio;
    }
    function speakFrom(i) {
      window.speechSynthesis.cancel(); clearInterval(ttsTimer);
      if (i >= flat.length) { playing = false; idx = flat.length; ttsT = estDur; paint(); return; }
      idx = i; const item = flat[i]; ttsT = item.t;
      utt = new SpeechSynthesisUtterance(item.p); const v = bestVoice(); if (v) { utt.voice = v; utt.lang = v.lang; } else utt.lang = 'en-US';
      utt.rate = speed; const t0 = Date.now();
      ttsTimer = setInterval(() => { ttsT = Math.min(item.t + item.d, item.t + ((Date.now() - t0) / 1000) * speed); paint(); }, 250);
      utt.onend = () => { clearInterval(ttsTimer); if (playing && utt && utt.text === item.p) speakFrom(i + 1); };
      utt.onerror = () => { clearInterval(ttsTimer); };
      cap.textContent = item.p;
      window.speechSynthesis.speak(utt);
    }
    function seekTTS(t) { let i = 0; while (i + 1 < flat.length && flat[i + 1].t <= t) i++; idx = i; ttsT = flat[i] ? flat[i].t : 0; paint(); }
    function playTTS() { playing = true; started = true; speakFrom(idx); paint(); }
    function play() {
      started = true; more.hidden = false;
      if (mode === 'audio') { const a = ensureAudio(); const p = a.play(); if (p && p.catch) p.catch(() => { playing = false; paint(); }); }
      else playTTS();
      media(); paint();
    }
    function pause() { if (mode === 'audio') { if (audio) audio.pause(); } else { playing = false; utt = null; window.speechSynthesis.cancel(); clearInterval(ttsTimer); } paint(); }
    function seek(t) { t = Math.max(0, Math.min(total() - 0.2, t)); if (mode === 'audio') { const a = ensureAudio(); a.currentTime = t; paint(); } else { const was = playing; utt = null; window.speechSynthesis.cancel(); seekTTS(t); if (was) speakFrom(idx); } }
    function stop() { pause(); if (mode === 'audio' && audio) { audio.currentTime = 0; } else { idx = 0; ttsT = 0; } started = false; more.hidden = true; paint(); }
    function media() {
      if (!('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({ title: lesson.title, artist: 'FiredBunny', album: (SML.courses.find((c) => c.id === lesson.course) || {}).title || 'Lessons' });
        navigator.mediaSession.setActionHandler('play', play); navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('seekbackward', () => seek(pos() - 15)); navigator.mediaSession.setActionHandler('seekforward', () => seek(pos() + 15));
      } catch (e) {}
    }
    btn.addEventListener('click', () => (playing ? pause() : play()));
    mini.querySelector('[data-n="mtoggle"]').addEventListener('click', () => (playing ? pause() : play()));
    mini.querySelector('[data-n="mclose"]').addEventListener('click', stop);
    $('[data-n="speed"]').addEventListener('change', (e) => { speed = +e.target.value || 1; store.set('narSpeed', speed); if (audio) audio.playbackRate = speed; if (mode === 'tts' && playing) speakFrom(idx); });
    el.querySelectorAll('[data-chap]').forEach((b) => b.addEventListener('click', () => { seek(chapStarts[+b.dataset.chap] || 0); if (!playing) play(); }));
    const barSeek = (target, ev) => { const r = target.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width; seek(x * total()); };
    bar.addEventListener('pointerdown', (ev) => barSeek(bar, ev));
    mini.querySelector('[data-n="mbar"]').addEventListener('pointerdown', (ev) => barSeek(ev.currentTarget, ev));
    bar.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowRight') { seek(pos() + 10); ev.preventDefault(); } if (ev.key === 'ArrowLeft') { seek(pos() - 10); ev.preventDefault(); } });
    let io = null;
    if ('IntersectionObserver' in window) { io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; paint(); }); io.observe(el); }
    if (mode === 'tts' && window.speechSynthesis.onvoiceschanged === null) window.speechSynthesis.onvoiceschanged = () => {};
    SML.onCleanup(() => { try { if (audio) { audio.pause(); audio.src = ''; } if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {} clearInterval(ttsTimer); if (io) io.disconnect(); mini.remove(); playing = false; });
    paint();
  }

  SML.narrate = { norm, script, words, hash, mount };
})();
