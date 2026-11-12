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
    s = s.replace(/\s+([.,;:!?])/g, '$1').replace(/[,;:]+\s*([.!?])/g, '$1').replace(/,\s*([:;])/g, '$1').replace(/\b((?:[A-Za-z']+ ){1,5}[A-Za-z']+), \1\b/g, '$1').replace(/([.!?:;])\s*[.,;:]+/g, '$1').replace(/,(\s*,)+/g, ',').replace(/^[\s,.;:]+/, '').replace(/[,;:]+\s*$/, '').replace(/\s{2,}/g, ' ').trim();
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
    .nar{display:flex;flex-direction:column;gap:12px;max-width:640px}
    .nar-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .nar-main{gap:8px}
    .nar-play{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 18px 0 6px;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent) 55%,var(--line));background:color-mix(in srgb,var(--accent) 12%,var(--surface));color:var(--ink);font:600 14px var(--sans);cursor:pointer}
    .nar-play:hover{border-color:var(--accent)}
    .nar-play .nar-ic{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:#0b0f19;flex:0 0 auto}
    .nar-play small{font:500 12px var(--mono);color:var(--muted);letter-spacing:.04em;margin-left:auto}
    .nar-skip{width:40px;height:40px;flex:0 0 40px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;cursor:pointer;padding:0}
    .nar-skip:hover:not(:disabled){border-color:var(--input)}
    .nar-skip:disabled{opacity:.35;cursor:default}
    .nar-speed{min-height:40px;padding:0 10px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:600 12px var(--mono)}
    .nar-sub{gap:8px 12px}
    .nar-src{font:500 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
    .nar-auto{display:inline-flex;align-items:center;gap:8px;min-height:36px;font:500 12.5px var(--sans);color:var(--text);cursor:pointer;user-select:none}
    .nar-auto input{appearance:none;-webkit-appearance:none;width:32px;height:18px;border-radius:999px;background:var(--line);position:relative;margin:0;cursor:pointer;transition:background .15s;flex:0 0 32px}
    .nar-auto input::after{content:"";position:absolute;left:2px;top:2px;width:14px;height:14px;border-radius:50%;background:var(--muted);transition:transform .15s,background .15s}
    .nar-auto input:checked{background:color-mix(in srgb,var(--accent) 45%,var(--line))}
    .nar-auto input:checked::after{transform:translateX(14px);background:var(--accent)}
    .nar-auto input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .nar-dl{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:600 12px var(--sans);cursor:pointer}
    .nar-dl:hover{border-color:var(--input)}
    .nar-dl small{font:500 11px var(--mono);color:var(--muted)}
    .nar-dl svg{width:14px;height:14px;flex:0 0 14px}
    .nar-dl[data-s="done"]{color:var(--up);border-color:color-mix(in srgb,var(--up) 45%,var(--line))}
    .nar-dl[data-s="busy"]{color:var(--accent);cursor:default}
    .nar-more{display:flex;flex-direction:column;gap:16px;padding-top:4px}
    .nar-more[hidden]{display:none}
    .nar-bar{position:relative;height:6px;border-radius:3px;background:var(--line);cursor:pointer;touch-action:none}
    .nar-bar::before{content:"";position:absolute;left:0;right:0;top:-12px;bottom:-12px}
    .nar-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:var(--accent)}
    .nar-bar i::after{content:"";position:absolute;right:-6px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
    .nar-bar b{position:absolute;top:-3px;width:2px;height:12px;background:var(--muted);opacity:.6}
    .nar-foot{justify-content:space-between;align-items:center;gap:10px 16px}
    .nar-chaps{display:flex;flex-wrap:wrap;gap:6px}
    .nar-chaps button{min-height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--muted);font:500 12.5px var(--sans);cursor:pointer;white-space:nowrap;flex:0 0 auto}
    .nar-chaps button.on{color:var(--ink);border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
    .nar-time{font:500 12px var(--mono);color:var(--muted);white-space:nowrap}
    .nar-cap{font-size:14px;line-height:1.5;color:var(--muted);min-height:1.5em;margin:0}
    .nar-mini{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) translateY(140%);z-index:60;display:flex;align-items:center;gap:8px;width:min(560px,calc(100vw - 24px));padding:8px 10px 8px 8px;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent) 45%,var(--line));background:color-mix(in srgb,var(--surface) 92%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 10px 40px -10px rgba(0,0,0,.6);transition:transform .25s ease}
    .nar-mini.show{transform:translateX(-50%) translateY(0)}
    .nar-mini .nar-ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:#0b0f19;border:0;cursor:pointer;flex:0 0 auto}
    .nar-mini .nar-mt{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding:0 4px}
    .nar-mini .nar-mt span{font:600 12.5px var(--sans);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .nar-mini .nar-bar i::after{display:none}
    .nar-mini .nar-mskip{width:34px;height:34px;flex:0 0 34px;border-radius:50%;border:0;background:transparent;color:var(--ink);display:grid;place-items:center;cursor:pointer;padding:0}
    .nar-mini .nar-mskip:disabled{opacity:.35;cursor:default}
    .nar-mini .nar-x{background:transparent;border:0;color:var(--muted);font-size:18px;cursor:pointer;padding:4px 6px;min-width:34px;min-height:34px}
    @media (max-width:560px){
      .nar-main{flex-wrap:nowrap}
      .nar-main .nar-play{flex:1 1 auto;min-width:0;padding-right:16px}
      .nar-main .nar-play > span:nth-child(2){white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .nar-sub{justify-content:space-between;gap:8px}
      .nar-sub .nar-src,.nar-auto .nar-long{display:none}
      .nar-foot{flex-direction:column;align-items:stretch;gap:10px}
      .nar-foot .nar-time{order:-1;align-self:flex-end;margin-top:-6px}
      .nar-chaps{flex-wrap:nowrap;overflow-x:auto;width:0;min-width:100%;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px;-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent)}
      .nar-chaps::-webkit-scrollbar{display:none}
    }
    @media (max-width:400px){.nar-sub .nar-dl small{display:none}}
    @media (max-width:380px){.nar-main .nar-play small{display:none}}
    @media (prefers-reduced-motion:reduce){.nar-mini{transition:none}}
  `);
  const IC = {
    play: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.8v10.4L12 7z" fill="currentColor"/></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor"/></svg>',
    prev: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5h2v11H3zM13.5 2.6v10.8L6 8z" fill="currentColor"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2.5h2v11h-2zM2.5 2.6v10.8L10 8z" fill="currentColor"/></svg>',
  };
  const fmtT = (s) => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const store = { get: (k, d) => { try { return SML.store.get(k, d); } catch (e) { return d; } }, set: (k, v) => { try { SML.store.set(k, v); } catch (e) {} } };
  const autoNext = () => store.get('narAuto', true) !== false;

  /* One audio element for every lesson. Phones (iPhone above all) only let a page play sound that the listener started
     with a tap, but an element started that way may go on playing. So moving to the next lesson, by autoplay, the
     Next button or the lock-screen controls, swaps this element's source instead of making a new one. */
  let shared = null;
  const getAudio = () => { if (!shared) { shared = new Audio(); shared.preload = 'metadata'; } return shared; };
  let handoff = null; // { play } while the player moves to another lesson; the next lesson page picks it up
  let mp4 = null;
  const canMp4 = () => { if (mp4 === null) { try { mp4 = !!getAudio().canPlayType('audio/mp4; codecs="mp4a.40.2"'); } catch (e) { mp4 = false; } } return mp4; };

  function bestVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = window.speechSynthesis.getVoices().filter((v) => /^en(-|_)?(US|GB|AU|CA)?/i.test(v.lang));
    if (!vs.length) return null;
    const score = (v) => (/natural|neural|premium|enhanced/i.test(v.name) ? 50 : 0) + (/aria|jenny|ava|samantha|allison|google us english|zoe|serena|michelle/i.test(v.name) ? 20 : 0) + (/en-US/i.test(v.lang) ? 5 : 0) + (v.localService ? 0 : 2);
    return vs.slice().sort((a, b) => score(b) - score(a))[0];
  }

  function mount(el, lesson) {
    const incoming = handoff; handoff = null;
    if (!el || !lesson) { if (incoming && shared) shared.pause(); return; }
    const sc = script(lesson); if (!sc.chapters.length) { if (incoming && shared) shared.pause(); return; }
    let rec = SML.host !== 'claude' && SML.narration ? SML.narration[lesson.id] : null; // the claude.ai preview has no audio files
    if (rec && !canMp4()) rec = null;
    const hasTTS = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
    let mode = rec ? 'audio' : (hasTTS ? 'tts' : null);
    if (!mode) { if (shared) shared.pause(); return; }
    // previous and next lesson in the same order as the lesson page's own links
    const seq = SML.lessonSeq ? SML.lessonSeq(lesson) : {};
    const prevL = seq.prev || null, nextL = seq.next || null;
    const esc = SML.esc || ((t) => t);
    // device-voice timing is estimated at ~153 words a minute
    let flat = [], estDur = 0, chapStarts = [];
    function ttsPlan() { let t = 0; flat = []; chapStarts = []; sc.chapters.forEach((c, ci) => { chapStarts.push(t); c.paras.forEach((p) => { const d = p.split(/\s+/).length / 2.55; flat.push({ ci, p, t, d }); t += d; }); }); estDur = t; }
    if (rec) { estDur = rec.dur; chapStarts = (rec.chapters || []).map((c) => c[0]); if (chapStarts.length !== sc.chapters.length) chapStarts = sc.chapters.map((c, i) => (rec.chapters[i] ? rec.chapters[i][0] : 0)); } else ttsPlan();
    const ticks = () => chapStarts.slice(1).map((t) => `<b style="left:${(t / (estDur || 1)) * 100}%"></b>`).join('');
    let speed = +store.get('narSpeed', 1) || 1;
    // the recording's address carries a version (?v=) on the website; offline downloads are keyed by it
    const src = rec ? (SML.assetURL ? SML.assetURL(rec.file) : rec.file) : '';
    const srcAbs = src ? new URL(src, location.origin + '/').href : '';
    const OFF = rec && SML.offline && SML.offline.enabled ? SML.offline : null;
    const dlUrl = OFF ? srcAbs : '';
    const skipBtn = (dir, l) => `<button type="button" class="nar-skip" data-n="${dir}"${l ? ` aria-label="${dir === 'prev' ? 'Previous' : 'Next'} lesson: ${esc(l.title)}" title="${dir === 'prev' ? 'Previous' : 'Next'}: ${esc(l.title)}"` : ` disabled aria-label="No ${dir === 'prev' ? 'previous' : 'next'} lesson"`}>${IC[dir]}</button>`;
    el.innerHTML = `<div class="nar" role="region" aria-label="Listen to this lesson">
      <div class="nar-row nar-main">
        ${skipBtn('prev', prevL)}
        <button type="button" class="nar-play" data-n="toggle"><span class="nar-ic">${IC.play}</span><span>Listen to this lesson</span><small>${fmtT(estDur)}</small></button>
        ${skipBtn('next', nextL)}
      </div>
      <div class="nar-row nar-sub">
        <select class="nar-speed" data-n="speed" aria-label="Playback speed">${[0.8, 0.9, 1, 1.15, 1.25, 1.5].map((v) => `<option value="${v}"${v === speed ? ' selected' : ''}>${v}×</option>`).join('')}</select>
        <span class="nar-src">${mode === 'audio' ? 'Natural voice' : 'Your device’s voice'}</span>
        <label class="nar-auto" title="When a lesson ends, the next one starts on its own until you pause"><input type="checkbox" data-n="auto"${autoNext() ? ' checked' : ''}${nextL ? '' : ' disabled'}><span>Autoplay<span class="nar-long"> next lesson</span></span></label>
        ${OFF ? '<button type="button" class="nar-dl" data-n="dl"></button>' : ''}
      </div>
      <div class="nar-more" hidden>
        <div class="nar-bar" data-n="bar" role="slider" aria-label="Position" tabindex="0" aria-valuemin="0" aria-valuemax="${Math.round(estDur)}" aria-valuenow="0"><i style="width:0"></i>${ticks()}</div>
        <div class="nar-row nar-foot"><div class="nar-chaps">${sc.chapters.map((c, i) => `<button type="button" data-chap="${i}">${c.name}</button>`).join('')}</div><span class="nar-time" data-n="time">0:00 / ${fmtT(estDur)}</span></div>
        <p class="nar-cap" data-n="cap" aria-live="off"${mode === 'tts' ? '' : ' hidden'}></p>
      </div>
    </div>`;
    const $ = (s) => el.querySelector(s);
    const btn = $('[data-n="toggle"]'), bar = $('[data-n="bar"]'), more = $('.nar-more'), timeEl = $('[data-n="time"]'), cap = $('[data-n="cap"]');
    const mini = document.createElement('div'); mini.className = 'nar-mini'; mini.setAttribute('role', 'region'); mini.setAttribute('aria-label', 'Lesson audio');
    mini.innerHTML = `<button type="button" class="nar-ic" data-n="mtoggle" aria-label="Play or pause">${IC.pause}</button><div class="nar-mt"><span>${esc(lesson.title)}</span><div class="nar-bar" data-n="mbar"><i style="width:0"></i></div></div><button type="button" class="nar-mskip" data-n="mnext"${nextL ? ` aria-label="Next lesson: ${esc(nextL.title)}"` : ' disabled aria-label="No next lesson"'}>${IC.next}</button><button type="button" class="nar-x" data-n="mclose" aria-label="Stop">×</button>`;
    document.body.appendChild(mini);
    let playing = false, started = false, visible = true;
    // analytics: what started this lesson's audio (a tap, autoplay, a skip from the player, mini player or lock screen)
    const startHow = incoming && incoming.how ? incoming.how : 'button';
    const seen = { start: false, pct: {} };
    const T = (ev, p) => SML.track(ev, Object.assign({ item_name: lesson.id, item_category: 'lesson', voice: mode === 'audio' ? 'natural' : 'device', speed, position_sec: Math.round(pos()), duration_sec: Math.round(total()) }, p));

    /* --- engine: recorded audio (the shared element) --- */
    let audio = null; const ac = 'AbortController' in window ? new AbortController() : null;
    /* --- engine: device voice --- */
    let idx = 0, ttsT = 0, ttsTimer = 0, utt = null;
    function toTTS(at) { // recorded file failed to load: carry on with the device voice from about the same place
      T('audio_fallback', { label: navigator.onLine === false ? 'offline' : 'load_error' });
      if (audio) { audio.pause(); audio = null; } mode = 'tts'; const frac = at / (estDur || 1); ttsPlan();
      el.querySelector('.nar-src').textContent = 'Your device’s voice'; cap.hidden = false;
      bar.innerHTML = '<i style="width:0"></i>' + ticks(); bar.setAttribute('aria-valuemax', String(Math.round(estDur)));
      seekTTS(frac * estDur); if (started) playTTS();
    }
    const total = () => (mode === 'audio' ? (audio && isFinite(audio.duration) ? audio.duration : estDur) : estDur);
    const pos = () => (mode === 'audio' ? (audio ? audio.currentTime : 0) : ttsT);
    let lastPos = 0;
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
      if (playing && seen.start) { const pc = (pos() / (total() || 1)) * 100; [25, 50, 75].forEach((m) => { if (pc >= m && !seen.pct[m]) { seen.pct[m] = true; T('audio_progress', { percent: m }); } }); }
      // lock screen and notification: progress bar
      const now = Date.now();
      if ('mediaSession' in navigator && started && (now - lastPos > 900 || !playing)) {
        lastPos = now;
        try { navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; const d = total(); if (d > 0 && isFinite(d)) navigator.mediaSession.setPositionState({ duration: d, playbackRate: mode === 'audio' ? speed : 1, position: Math.min(pos(), d) }); } catch (e) {}
      }
    }
    function ended() { playing = false; paint(); T('audio_complete', { percent: 100, label: autoNext() && nextL ? 'autoplay_next' : 'stop' }); if (autoNext() && nextL) goTo(nextL, true, 'autoplay'); }
    function ensureAudio() {
      if (audio) return audio;
      audio = getAudio();
      if (audio.src !== srcAbs) { audio.src = src; }
      audio.playbackRate = speed;
      const on = (ev, fn) => audio.addEventListener(ev, fn, ac ? { signal: ac.signal } : undefined);
      on('timeupdate', paint); on('loadedmetadata', paint);
      on('ended', ended);
      on('pause', () => { playing = false; paint(); });
      on('play', () => { playing = true; paint(); });
      on('error', () => { if (!audio || audio.src !== srcAbs) return; const at = audio.currentTime || 0; if (hasTTS) toTTS(at); else { playing = false; paint(); } });
      return audio;
    }
    function speakFrom(i) {
      window.speechSynthesis.cancel(); clearInterval(ttsTimer);
      if (i >= flat.length) { idx = flat.length; ttsT = estDur; ended(); return; }
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
    function play(how) {
      if (!seen.start) { seen.start = true; setTimeout(() => T('audio_start', { method: typeof how === 'string' ? how : startHow }), 0); }
      else if (!playing) T('audio_resume', { method: typeof how === 'string' ? how : 'button' });
      started = true; more.hidden = false;
      if (mode === 'audio') { const a = ensureAudio(); const p = a.play(); if (p && p.catch) p.catch(() => { playing = false; paint(); }); }
      else { if (shared) shared.pause(); playTTS(); }
      media(); paint();
    }
    function pause(how) {
      if (playing) T('audio_pause', { method: typeof how === 'string' ? how : 'button', percent: Math.round((pos() / (total() || 1)) * 100) });
      if (mode === 'audio') { if (audio) audio.pause(); } else { playing = false; utt = null; window.speechSynthesis.cancel(); clearInterval(ttsTimer); } paint();
    }
    function seek(t) { t = Math.max(0, Math.min(total() - 0.2, t)); if (mode === 'audio') { const a = ensureAudio(); a.currentTime = t; paint(); } else { const was = playing; utt = null; window.speechSynthesis.cancel(); seekTTS(t); if (was) speakFrom(idx); } }
    function stop() { pause('stop'); if (mode === 'audio' && audio) { audio.currentTime = 0; } else { idx = 0; ttsT = 0; } started = false; more.hidden = true; paint(); }
    /* move to another lesson; its page starts playing when we were playing (or the lesson just ended with autoplay on) */
    function goTo(l, keepPlaying, how) {
      if (!l) return;
      if (how !== 'autoplay') T('audio_skip', { method: how || 'button', label: l === nextL ? 'next' : 'previous', item_name: l.id, value: keepPlaying ? 1 : 0 });
      const h = handoff = { play: !!keepPlaying, how: how || 'button' };
      setTimeout(() => { if (handoff === h) { handoff = null; if (shared) shared.pause(); } }, 4000); // the next page never took over
      if (mode === 'tts') { playing = false; window.speechSynthesis.cancel(); clearInterval(ttsTimer); }
      SML.go(l.id);
    }
    function media() {
      if (!('mediaSession' in navigator)) return;
      const ms = navigator.mediaSession; const set = (a, fn) => { try { ms.setActionHandler(a, fn); } catch (e) { /* not supported here */ } };
      try { ms.metadata = new window.MediaMetadata({ title: lesson.title, artist: 'FiredBunny', album: (SML.courses.find((c) => c.id === lesson.course) || {}).title || 'Lessons', artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/icon-192.png', sizes: '192x192', type: 'image/png' }] }); } catch (e) {}
      set('play', () => play('lock_screen')); set('pause', () => pause('lock_screen'));
      set('seekbackward', (d) => seek(pos() - ((d && d.seekOffset) || 15))); set('seekforward', (d) => seek(pos() + ((d && d.seekOffset) || 15)));
      set('seekto', (d) => { if (d && typeof d.seekTime === 'number') seek(d.seekTime); });
      set('previoustrack', prevL ? () => goTo(prevL, true, 'lock_screen') : null);
      set('nexttrack', nextL ? () => goTo(nextL, true, 'lock_screen') : null);
      set('stop', stop);
    }
    btn.addEventListener('click', () => (playing ? pause() : play()));
    el.querySelectorAll('[data-n="prev"],[data-n="next"]').forEach((b) => b.addEventListener('click', () => goTo(b.dataset.n === 'prev' ? prevL : nextL, playing, 'button')));
    mini.querySelector('[data-n="mtoggle"]').addEventListener('click', () => (playing ? pause('mini_player') : play('mini_player')));
    mini.querySelector('[data-n="mnext"]').addEventListener('click', () => goTo(nextL, playing, 'mini_player'));
    mini.querySelector('[data-n="mclose"]').addEventListener('click', stop);
    $('[data-n="speed"]').addEventListener('change', (e) => { speed = +e.target.value || 1; store.set('narSpeed', speed); T('audio_setting', { method: 'speed', label: speed + 'x' }); if (audio) audio.playbackRate = speed; if (mode === 'tts' && playing) speakFrom(idx); });
    $('[data-n="auto"]').addEventListener('change', (e) => { store.set('narAuto', !!e.target.checked); T('audio_setting', { method: 'autoplay', label: e.target.checked ? 'on' : 'off' }); SML.toast(e.target.checked ? 'The next lesson will play on its own.' : 'Autoplay is off.'); });
    el.querySelectorAll('[data-chap]').forEach((b) => b.addEventListener('click', () => { T('audio_chapter', { label: b.textContent }); seek(chapStarts[+b.dataset.chap] || 0); if (!playing) play('chapter'); }));
    const barSeek = (target, ev) => { const r = target.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width; seek(x * total()); };
    bar.addEventListener('pointerdown', (ev) => barSeek(bar, ev));
    mini.querySelector('[data-n="mbar"]').addEventListener('pointerdown', (ev) => barSeek(ev.currentTarget, ev));
    bar.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowRight') { seek(pos() + 10); ev.preventDefault(); } if (ev.key === 'ArrowLeft') { seek(pos() - 10); ev.preventDefault(); } });
    // download for offline listening (website only)
    let offSub = null;
    const dlBtn = $('[data-n="dl"]');
    if (OFF && dlBtn) {
      const OI = SML.offlineIcons || {};
      const mb = (OFF.sizeOf(rec.file) / 1e6).toFixed(1) + ' MB';
      const paintDl = () => {
        const s = OFF.status(dlUrl); const p = Math.round(OFF.progress(dlUrl) * 100);
        dlBtn.dataset.s = s;
        dlBtn.innerHTML = s === 'done' ? `${OI.check || ''}<span>Saved offline</span>` : s === 'busy' ? `<span>Saving${p ? ' ' + p + '%' : '…'}</span>` : `${OI.down || ''}<span>${s === 'old' ? 'Update download' : 'Download'}</span><small>${mb}</small>`;
        dlBtn.setAttribute('aria-label', s === 'done' ? 'Saved for offline listening. Tap to remove the download.' : s === 'busy' ? 'Downloading for offline listening' : 'Download this lesson’s audio for offline listening');
        dlBtn.title = s === 'done' ? 'Saved on this device. Tap to remove.' : s === 'busy' ? 'Downloading' : 'Save on this device to listen offline';
      };
      dlBtn.addEventListener('click', () => {
        const s = OFF.status(dlUrl);
        if (s === 'busy') return;
        if (s === 'done') { T('audio_download', { label: 'remove', method: 'player' }); OFF.remove([dlUrl]).then(() => SML.toast('Download removed.')); }
        else { T('audio_download', { label: 'save', method: 'player', value: 1 }); OFF.get([dlUrl]); }
      });
      offSub = OFF.on(paintDl); paintDl();
    }
    let io = null;
    if ('IntersectionObserver' in window) { io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; paint(); }); io.observe(el); }
    if (mode === 'tts' && window.speechSynthesis.onvoiceschanged === null) window.speechSynthesis.onvoiceschanged = () => {};
    SML.onCleanup(() => {
      try {
        if (ac) ac.abort();
        // leaving for another lesson by autoplay or Next: the shared element carries on there; otherwise stop it
        if (audio && !handoff) { audio.pause(); audio.removeAttribute('src'); try { audio.load(); } catch (e) {} }
        if (!handoff && started && 'mediaSession' in navigator) { const ms = navigator.mediaSession; ms.metadata = null; ['play', 'pause', 'seekbackward', 'seekforward', 'seekto', 'previoustrack', 'nexttrack', 'stop'].forEach((a) => { try { ms.setActionHandler(a, null); } catch (e) {} }); }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      } catch (e) {}
      clearInterval(ttsTimer); if (io) io.disconnect(); if (offSub) offSub(); mini.remove(); playing = false;
    });
    paint();
    // arrived here by autoplay, Next or Previous while playing: keep going
    if (incoming && incoming.play) play(incoming.how);
    else if (incoming) { if (shared && shared.src !== srcAbs) shared.pause(); media(); }
  }

  SML.narrate = { norm, script, words, hash, mount };
})();
