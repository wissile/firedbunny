/* Help chat ("Ask Bunny"): a floating helper in the bottom-right corner that finds lessons, explains terms, picks tools,
 * answers questions about the site and passes feedback on (src/feedback.js). No AI and no outside service: it reads the
 * site's own content in the browser, so it works offline and in the claude.ai copy. What it understands and says is in
 * src/chat-data.js.
 *
 * Loading: only the launcher button (and its styles) is made at start. The panel, its styles and the search index are
 * built the first time someone opens it. The launcher is added at runtime, outside the page, with styles marked
 * data-fb, so the pre-built pages (tools/prerender.py) and their lastmod hashes never include it.
 * Memory: the conversation is kept in this tab's sessionStorage ('fb-chat'), so it survives moving between pages and
 * reloads, and is gone when the tab closes. It is never sent anywhere.
 *
 * Matching (search()): text is normalised and stemmed; abbreviations and synonyms add their full form; words that are
 * not in the site's vocabulary are corrected when one close spelling exists (Damerau-Levenshtein distance 1, or 2 for
 * long words). Each page is scored by where the words appear (title 10, full name or alternative title 8, lesson
 * terms 4, summary 1.5), weighted by how rare each word is, with bonuses when a whole title appears in the message, and
 * a preference for the kind of page the intent asks for (terms for "what is", tools for "calculator for"...).
 */
(function () {
  'use strict';
  const SML = window.SML;
  if (!SML || SML.chat || !document.body) return;
  const esc = SML.esc;
  const D = () => SML.chatData || { intents: [], synonyms: {}, pages: [], chipSets: {}, prompts: {} };
  const KEY = 'fb-chat';
  const isPhone = () => { try { return window.matchMedia('(max-width: 640px)').matches; } catch (e) { return false; } };
  const finePointer = () => { try { return window.matchMedia('(pointer: fine)').matches; } catch (e) { return true; } };
  const reduced = () => (SML.reduced ? SML.reduced() : false);
  const R = () => SML.routes;
  const href = (tok) => (R() ? R().href(tok) : '#' + tok);

  const I = (body, w) => `<svg width="${w || 20}" height="${w || 20}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const ICON = {
    dots: '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17.5H4A1.5 1.5 0 0 1 2.5 16V7A1.5 1.5 0 0 1 4 5.5z" fill="currentColor"/><circle cx="8" cy="11.5" r="1.4" fill="var(--accent)"/><circle cx="12" cy="11.5" r="1.4" fill="var(--accent)"/><circle cx="16" cy="11.5" r="1.4" fill="var(--accent)"/></svg>',
    down: I('<path d="M6 9l6 6 6-6"/>', 22),
    close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    send: I('<path d="M5 12h13M13 6l6 6-6 6"/>'),
    restart: I('<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 4v5h5"/>', 18),
    arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>', 14),
  };

  /* ---------------- conversation memory (this tab only) ---------------- */
  const blank = () => ({ v: 1, msgs: [], chips: [], mode: null, last: null, fb: null });
  function load() { try { const s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return s && s.v === 1 && Array.isArray(s.msgs) ? Object.assign(blank(), s) : blank(); } catch (e) { return blank(); } }
  let st = load();
  function save() { st.msgs = st.msgs.slice(-80); try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  /* ---------------- styles: the launcher now, the panel on first open ---------------- */
  function addCss(name, css) { const s = document.createElement('style'); s.setAttribute('data-fb', name); s.textContent = css; document.head.appendChild(s); }
  addCss('chat', `
    .fbc-launch{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(calc(16px + env(safe-area-inset-bottom,0px)),var(--fbc-lift,0px));z-index:66;width:56px;height:56px;padding:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--ink);
      background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--flame) 18%,var(--surface-2)),var(--surface) 72%);border:1px solid color-mix(in srgb,var(--flame) 55%,var(--line));
      box-shadow:0 0 0 4px color-mix(in srgb,var(--bg) 65%,transparent),0 14px 32px -12px rgba(0,0,0,.8),0 0 24px -6px color-mix(in srgb,var(--flame) 50%,transparent);
      transition:transform .18s ease,border-color .15s,bottom .2s ease,opacity .2s ease,visibility .2s}
    .fbc-launch:hover{border-color:var(--flame);transform:translateY(-2px)}
    .fbc-launch:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
    .fbc-launch .fb-mark{width:32px;height:32px;transition:transform .2s ease,opacity .2s ease}
    .fbc-launch .fbc-bub{position:absolute;right:-3px;top:-3px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:var(--bg);border:2px solid var(--bg);transition:transform .2s ease,opacity .2s ease}
    .fbc-launch .fbc-bub svg{color:var(--bg)}
    .fbc-launch .fbc-dn{position:absolute;inset:0;display:grid;place-items:center;opacity:0;transform:rotate(-90deg);transition:transform .2s ease,opacity .2s ease}
    .fbc-launch[aria-expanded="true"] .fb-mark,.fbc-launch[aria-expanded="true"] .fbc-bub{opacity:0;transform:scale(.6)}
    .fbc-launch[aria-expanded="true"] .fbc-dn{opacity:1;transform:none}
    .fbc-launch.fbc-new{animation:fbc-pop .45s ease-out both}
    @keyframes fbc-pop{from{opacity:0;transform:translateY(10px) scale(.85)}to{opacity:1;transform:none}}
    html.nav-open .fbc-launch{opacity:0;visibility:hidden;pointer-events:none}
    html.fbc-on .foot .foot-base{padding-bottom:max(76px,calc(64px + env(safe-area-inset-bottom,0px)))}
    @media (min-width:641px){html.fbc-on .foot .foot-base{padding-right:76px}}
    @media (prefers-reduced-motion:reduce){.fbc-launch,.fbc-launch *{transition:none!important;animation:none!important}}
    @media print{.fbc-launch,.fbc,.fbc-scrim{display:none!important}}
  `);
  const PANEL_CSS = `
    .fbc{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(max(calc(16px + env(safe-area-inset-bottom,0px)),var(--fbc-lift,0px)) + 68px);z-index:78;
      width:min(392px,calc(100vw - 32px));height:min(640px,calc(100vh - max(calc(16px + env(safe-area-inset-bottom,0px)),var(--fbc-lift,0px)) - 160px));height:min(640px,calc(100dvh - max(calc(16px + env(safe-area-inset-bottom,0px)),var(--fbc-lift,0px)) - 160px));min-height:300px;
      display:flex;flex-direction:column;background:var(--surface);border:1px solid color-mix(in srgb,var(--flame) 22%,var(--line));border-radius:14px;overflow:hidden;color:var(--ink);font-family:var(--sans);
      box-shadow:0 32px 80px -24px rgba(0,0,0,.9),0 0 50px -24px color-mix(in srgb,var(--flame) 45%,transparent);transform-origin:calc(100% - 28px) calc(100% + 40px)}
    .fbc[hidden]{display:none!important}
    .fbc.fbc-in{animation:fbc-in .2s cubic-bezier(.2,.8,.3,1) both}
    @keyframes fbc-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
    .fbc:focus{outline:none}
    .fbc-h{display:flex;align-items:center;gap:12px;padding:10px 6px 10px 14px;border-bottom:1px solid var(--line);background:linear-gradient(100deg,color-mix(in srgb,var(--flame) 11%,var(--surface)),var(--surface) 72%);flex:0 0 auto}
    .fbc-h .fbc-hav{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:grid;place-items:center;background:var(--bg);border:1px solid color-mix(in srgb,var(--flame) 50%,var(--line))}
    .fbc-h .fbc-hav .fb-mark{width:28px;height:28px}
    .fbc-ht{flex:1;min-width:0}
    .fbc-ht h2{font-family:var(--display);font-weight:400;font-size:27px;line-height:.9;letter-spacing:.01em;text-transform:uppercase;color:var(--ink);margin:0;padding-top:3px}
    .fbc-ht p{margin:3px 0 0;font:500 10.5px/1.3 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .fbc-ib{width:44px;height:44px;flex:0 0 44px;border:0;border-radius:var(--r);background:transparent;color:var(--muted);display:grid;place-items:center;cursor:pointer;padding:0}
    .fbc-ib:hover{color:var(--ink);background:var(--surface-2)}
    .fbc-ib:focus-visible,.fbc-chip:focus-visible,.fbc-a:focus-visible,.fbc-send:focus-visible,.fbc-li a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .fbc-log{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:16px 12px 10px;display:flex;flex-direction:column;gap:10px;
      background-color:var(--paper);background-image:linear-gradient(to right,var(--grid) 1px,transparent 1px),linear-gradient(to bottom,var(--grid) 1px,transparent 1px);background-size:28px 28px;background-position:-1px -1px}
    .fbc-log:focus{outline:none}
    .fbc-m{display:flex;gap:8px;align-items:flex-start;max-width:100%;min-width:0}
    .fbc-m.bot{align-self:flex-start;padding-right:18px;width:100%}
    .fbc-m.me{align-self:flex-end;justify-content:flex-end;padding-left:48px}
    .fbc-av{width:28px;height:28px;flex:0 0 28px;border-radius:50%;display:grid;place-items:center;background:var(--bg);border:1px solid color-mix(in srgb,var(--flame) 45%,var(--line));margin-top:2px}
    .fbc-av .fb-mark{width:20px;height:20px}
    .fbc-av.ghost{visibility:hidden}
    .fbc-b{min-width:0;background:var(--surface-2);border:1px solid var(--line);border-radius:4px 14px 14px 14px;padding:10px 12px;font-size:14.5px;line-height:1.55;color:color-mix(in srgb,var(--ink) 90%,transparent);overflow-wrap:anywhere}
    .fbc-m.bot .fbc-b{flex:0 1 auto}
    .fbc-m.me .fbc-b{background:color-mix(in srgb,var(--accent) 16%,var(--surface));border-color:color-mix(in srgb,var(--accent) 42%,var(--line));border-radius:14px 4px 14px 14px;color:var(--ink);white-space:pre-wrap}
    .fbc-b p{margin:0}.fbc-b p + p,.fbc-b p + ul,.fbc-b ul + p{margin-top:8px}
    .fbc-b b{color:var(--ink);font-weight:600}
    .fbc-b a:not(.fbc-a){color:var(--accent)}
    .fbc-b ul{margin:6px 0 0;padding-left:18px}.fbc-b li + li{margin-top:4px}
    .fbc-k{font:600 10px/1.35 var(--mono)!important;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin-bottom:3px!important}
    .fbc-t{font-weight:600;font-size:15.5px;line-height:1.3;color:var(--ink)}
    .fbc-t small{font-weight:500;font-size:12.5px;color:var(--muted);margin-left:6px}
    .fbc-note{font-size:12.5px!important;color:var(--muted)}
    .fbc-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
    .fbc-a{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:6px 12px;border-radius:var(--r);border:1px solid var(--input);background:var(--bg);color:var(--ink);font:600 13px/1.25 var(--sans);text-decoration:none;max-width:100%;text-align:left}
    .fbc-a:hover{border-color:var(--accent);color:var(--ink)}
    .fbc-a.pri{background:var(--accent);border-color:var(--accent);color:var(--on-acc)}
    .fbc-a.pri:hover{filter:brightness(1.08)}
    .fbc-a svg{flex:0 0 auto}
    .fbc-li{list-style:none;padding:0!important;margin:8px 0 0!important;display:flex;flex-direction:column;gap:6px}
    .fbc-li li{margin:0!important}
    .fbc-li a{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border:1px solid var(--line);border-radius:var(--r);background:var(--bg);text-decoration:none;color:var(--ink);min-height:44px;justify-content:center}
    .fbc-li a:hover{border-color:var(--accent)}
    .fbc-li b{font-size:13.5px}
    .fbc-li small{font-size:12.5px;line-height:1.4;color:var(--muted)}
    .fbc-sum{margin-top:8px;border:1px solid var(--line);border-radius:var(--r);background:var(--bg);padding:10px 12px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 12px;font-size:13.5px}
    .fbc-sum dt{font:600 10px/1.9 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .fbc-sum dd{margin:0;color:var(--ink);overflow-wrap:anywhere;white-space:pre-wrap}
    .fbc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 0 2px 36px}
    .fbc-chip{min-height:40px;padding:8px 14px;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent) 45%,var(--line));background:color-mix(in srgb,var(--accent) 8%,var(--bg));color:var(--ink);font:600 13px/1.2 var(--sans);cursor:pointer;text-align:left;transition:border-color .15s,background-color .15s}
    .fbc-chip:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,var(--bg))}
    .fbc-chip.pri{background:var(--accent);border-color:var(--accent);color:var(--on-acc)}
    .fbc-chip.quiet{border-color:var(--line);background:transparent;color:var(--muted)}
    .fbc-chip.quiet:hover{color:var(--ink);border-color:var(--input)}
    .fbc-typing .fbc-b{display:inline-flex;gap:4px;align-items:center;padding:13px 14px}
    .fbc-typing i{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:fbc-dot 1s infinite ease-in-out}
    .fbc-typing i:nth-child(2){animation-delay:.15s}.fbc-typing i:nth-child(3){animation-delay:.3s}
    @keyframes fbc-dot{0%,80%,100%{opacity:.35;transform:none}40%{opacity:1;transform:translateY(-3px)}}
    .fbc-m.fbc-fresh{animation:fbc-msg .22s ease-out both}
    @keyframes fbc-msg{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .fbc-form{display:flex;gap:8px;align-items:flex-end;padding:10px 12px 8px;border-top:1px solid var(--line);background:var(--surface);flex:0 0 auto;margin:0}
    .fbc-form textarea{flex:1 1 auto;min-width:0;resize:none;height:44px;max-height:132px;margin:0;font:400 15px/1.45 var(--sans);color:var(--ink);background:var(--bg);border:1px solid var(--input);border-radius:12px;padding:11px 12px;overflow-y:auto}
    .fbc-form textarea::placeholder{color:color-mix(in srgb,var(--muted) 80%,transparent)}
    .fbc-form textarea:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 3px rgba(232,173,79,.2)}
    .fbc-send{width:44px;height:44px;flex:0 0 44px;border-radius:50%;border:0;background:var(--accent);color:var(--on-acc);display:grid;place-items:center;cursor:pointer;padding:0;transition:filter .15s,opacity .15s}
    .fbc-send:hover{filter:brightness(1.08)}
    .fbc-send[disabled]{opacity:.35;cursor:default;filter:none}
    .fbc-foot{margin:0;padding:0 14px 10px;background:var(--surface);font:500 10.5px/1.4 var(--mono);letter-spacing:.03em;color:var(--muted);flex:0 0 auto}
    .fbc-scrim{position:fixed;inset:0;z-index:77;background:rgba(4,6,12,.62);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
    .fbc-scrim[hidden]{display:none!important}
    @media (pointer:coarse){.fbc-chip,.fbc-a{min-height:44px}}
    @media (max-width:640px){
      .fbc{left:0;right:0;bottom:var(--fbc-kb,0px);width:auto;height:calc(var(--fbc-vh,100vh) - env(safe-area-inset-top,0px) - 10px);height:calc(var(--fbc-vh,100dvh) - env(safe-area-inset-top,0px) - 10px);min-height:0;max-height:none;border-radius:16px 16px 0 0;border-width:1px 0 0;transform-origin:50% 100%}
      .fbc.fbc-in{animation-name:fbc-up}
      @keyframes fbc-up{from{transform:translateY(24px);opacity:.4}to{transform:none;opacity:1}}
      .fbc-foot{padding-bottom:max(10px,env(safe-area-inset-bottom,0px))}
      .fbc-form textarea{font-size:16px}
      html.fbc-open .fbc-launch{opacity:0;visibility:hidden;pointer-events:none}
      html.fbc-open{overflow:hidden}
    }
    @media (prefers-reduced-motion:reduce){.fbc,.fbc *{animation:none!important;transition:none!important}}
  `;

  /* ---------------- the launcher (always there) ---------------- */
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'fbc-launch';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'fbc-panel');
  launcher.setAttribute('aria-label', 'Ask Bunny: help and feedback');
  launcher.title = 'Ask Bunny';
  launcher.innerHTML = `${SML.bunnyMark ? SML.bunnyMark(32) : ''}<span class="fbc-bub">${ICON.dots}</span><span class="fbc-dn">${ICON.down}</span>`;
  // the dialog's element exists from the start (empty and hidden) so aria-controls always points at something
  const panel = document.createElement('div');
  panel.id = 'fbc-panel'; panel.className = 'fbc'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Ask Bunny, the FiredBunny help chat'); panel.setAttribute('aria-modal', 'false'); panel.tabIndex = -1;
  const scrim = document.createElement('div'); scrim.className = 'fbc-scrim'; scrim.hidden = true;
  document.body.appendChild(scrim); document.body.appendChild(panel); document.body.appendChild(launcher);
  document.documentElement.classList.add('fbc-on');
  if (!reduced()) { launcher.classList.add('fbc-new'); setTimeout(() => launcher.classList.remove('fbc-new'), 600); }
  launcher.addEventListener('click', () => (isOpen() ? close(true) : open('launcher')));

  /* Keep clear of the other things that sit at the bottom of the screen: the lesson audio mini player, the update bar,
     the analytics question, and sticky bars (self-assessment Back/Next, unsaved profile). When one of them is under the
     launcher's column, the launcher (and the open panel above it) moves up to sit just above it. */
  const BOTTOM = ['.nar-mini.show', '#fb-upd', '#fb-consent', '.asq-foot', '.acx-bar:not([data-state="clean"])'];
  let liftRaf = 0, liftNow = -1;
  function lift() {
    liftRaf = 0;
    const vw = window.innerWidth, vh = window.innerHeight;
    const colL = vw - 16 - 56 - 10, colR = vw - 6;
    let need = 0;
    BOTTOM.forEach((sel) => document.querySelectorAll(sel).forEach((el) => {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.right < colL || r.left > colR) return;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (cs.position === 'fixed') need = Math.max(need, el.offsetHeight + (parseFloat(cs.bottom) || 0)); // its resting place, whatever slide-in it is doing
      else if (r.bottom >= vh - 6 && r.top < vh) need = Math.max(need, vh - r.top); // a sticky bar, while it is stuck to the bottom
    }));
    const v = need ? Math.ceil(need + 12) : 0;
    if (v !== liftNow) { liftNow = v; document.documentElement.style.setProperty('--fbc-lift', v + 'px'); }
  }
  const liftSoon = () => { if (!liftRaf) liftRaf = requestAnimationFrame(lift); };
  try { new MutationObserver(liftSoon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'data-state'] }); } catch (e) {}
  window.addEventListener('resize', liftSoon); window.addEventListener('scroll', liftSoon, { passive: true });
  document.addEventListener('sml:route', liftSoon);
  liftSoon();

  /* ---------------- text: normalise, stem, compare ---------------- */
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[’‘`´]/g, "'").replace(/½/g, ' half').replace(/\(([a-z0-9])\)/g, '$1').replace(/&/g, ' and ').replace(/%/g, ' percent ')
      .replace(/\b([a-z])\/([a-z])\b/g, '$1$2').replace(/'s\b/g, '').replace(/'/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  const STOP = new Set(('a an the is are was were be been being am do does did doing i im ive id me my mine myself we our ours you your yours u ur it its this that these those ' +
    'of to in on at by for with from about as into onto over under and or but if then than so such what whats which who whom whose how when where why can could would should ' +
    'will shall may might must please pls plz tell show explain define definition meaning mean means meant know want wanna need help give get got find look looking search open ' +
    'take go goto bring page pages site website firedbunny bunny thing things stuff something anything some any all there here up out just like also really very much many more ' +
    'most lot lots ok okay yes no not dont doesnt isnt arent cant wont hi hey hello thanks thank work works working way ways use using used let lets say see into vs versus ' +
    'difference differences between compare compared better whether exactly simple simply terms basically ever kind sort type example examples stand stands quick quickly ' +
    'little bit good best new learn learning understand idea ideas info information question questions talk talking someone again now today actually please').split(' '));
  function stem(w) {
    if (w.length <= 3 || /\d/.test(w)) return w;
    if (/(ches|shes|sses|xes|zes)$/.test(w)) w = w.slice(0, -2);
    else if (/ies$/.test(w) && w.length > 4) w = w.slice(0, -3) + 'y';
    else if (/s$/.test(w) && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
    if (/ing$/.test(w) && w.length > 5) { w = w.slice(0, -3); if (/([b-df-hj-kmnp-rtv-y])\1$/.test(w)) w = w.slice(0, -1); }
    else if (/ed$/.test(w) && w.length > 4) { w = w.slice(0, -2); if (/([b-df-hj-kmnp-rtv-y])\1$/.test(w)) w = w.slice(0, -1); }
    if (w.length >= 4 && /e$/.test(w)) w = w.slice(0, -1);
    return w;
  }
  const words = (s) => norm(s).split(' ').filter(Boolean);
  const stems = (s, keepStop) => words(s).filter((w) => keepStop || !STOP.has(w)).map(stem);
  // Damerau-Levenshtein (optimal string alignment), giving up once the distance must exceed max
  function dist(a, b, max) {
    const la = a.length, lb = b.length; if (Math.abs(la - lb) > max) return max + 1;
    let p2 = null, p = []; for (let j = 0; j <= lb; j++) p[j] = j;
    for (let i = 1; i <= la; i++) {
      const c = [i]; let low = i;
      for (let j = 1; j <= lb; j++) {
        let v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        c[j] = v; if (v < low) low = v;
      }
      if (low > max) return max + 1;
      p2 = p; p = c;
    }
    return p[lb];
  }
  // plain text from the site's own HTML snippets (inert: nothing loads or runs)
  const tpl = document.createElement('template');
  function text(html) { if (html == null) return ''; const s = String(html); if (!/[<&]/.test(s)) return s.replace(/\s+/g, ' ').trim(); tpl.innerHTML = s; return (tpl.content.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* ---------------- the index: built from the site's content on first use ---------------- */
  let BRAIN = null;
  const lessonById = (id) => (SML.lessons || []).find((l) => l.id === id);
  const courseById = (id) => (SML.courses || []).find((c) => c.id === id);
  const trackById = (id) => (SML.tracks || []).find((t) => t.id === id);
  const toolById = (id) => (SML.tools || []).find((t) => t.id === id);
  const postById = (id) => (SML.posts || []).find((p) => p.id === id);
  const pageByTok = (tok) => (D().pages || []).find((p) => p.tok === tok);
  const lessonsOf = (cid) => (SML.lessons || []).filter((l) => l.course === cid).sort((a, b) => (a.order || 0) - (b.order || 0));
  const coursesOf = (tid) => (SML.courses || []).filter((c) => (c.track || 'trading') === tid).sort((a, b) => a.n - b.n);
  const trackLessons = (tid) => coursesOf(tid).flatMap((c) => lessonsOf(c.id));
  const toolsFor = (l) => (SML.tools || []).filter((t) => t.lesson === l.id || (l.tools || []).indexOf(t.id) >= 0);
  function titleOf(tok) {
    if (!tok) return '';
    if (tok.indexOf('l-') === 0) { const l = lessonById(tok); return l ? l.title : ''; }
    if (tok.indexOf('c-') === 0) { const c = courseById(tok.slice(2)); return c ? c.title : ''; }
    if (tok.indexOf('tool-') === 0) { const t = toolById(tok); return t ? t.title : ''; }
    if (tok.indexOf('track-') === 0) { const t = trackById(tok.slice(6)); return t ? t.title + ' track' : ''; }
    if (tok.indexOf('post-') === 0) { const p = postById(tok); return p ? p.title : ''; }
    const pg = pageByTok(tok); return pg ? pg.title : tok;
  }
  const exists = (tok) => !!tok && (R() ? R().exists(tok) : true);

  function brain() {
    if (BRAIN) return BRAIN;
    const docs = [], seoT = (SML.seo && SML.seo.TITLES) || {};
    const glossT = new Set((SML.glossary || []).map((g) => g.t));
    const add = (d) => { if (d.tok && !exists(d.tok)) return; docs.push(d); };
    (SML.glossary || []).forEach((g) => add({ type: 'term', key: 'g:' + g.t, tok: g.l, title: g.t, alt: [g.full], keys: [], text: g.d, ans: g.d, full: g.full }));
    (SML.lessons || []).forEach((l) => (l.glossary || []).forEach((g) => { if (g && g.t && g.d && !glossT.has(g.t)) { glossT.add(g.t); add({ type: 'term', key: 'g:' + g.t, tok: l.id, title: g.t, alt: [g.full], keys: [], text: g.d, ans: g.d, full: g.full || '' }); } }));
    (SML.lessons || []).forEach((l) => { const c = courseById(l.course); add({ type: 'lesson', key: l.id, tok: l.id, title: l.title, alt: [seoT[l.id]], keys: (l.terms || []).concat((l.glossary || []).map((g) => g.t), c ? [c.title] : []), text: [l.summary, l.idea].concat(l.points || []).map(text).join(' '), ans: text(l.idea || l.summary) }); });
    (SML.courses || []).forEach((c) => { const t = trackById(c.track || 'trading'); add({ type: 'course', key: 'c-' + c.id, tok: 'c-' + c.id, title: c.title, alt: [c.title + ' course'], keys: lessonsOf(c.id).map((l) => l.title).concat(t ? [t.title] : []), text: c.blurb, ans: text(c.blurb) }); });
    (SML.tracks || []).forEach((t) => add({ type: 'track', key: 'track-' + t.id, tok: 'track-' + t.id, title: t.title, alt: [t.full, t.short, t.title + ' track'], keys: coursesOf(t.id).map((c) => c.title), text: t.blurb, ans: text(t.blurb) }));
    (SML.tools || []).forEach((t) => { const g = (SML.toolGuides || {})[t.id]; const l = lessonById(t.lesson); add({ type: 'tool', key: t.id, tok: t.id, title: t.title, alt: [seoT[t.id]], keys: [t.cat].concat(l ? [l.title] : []), text: t.blurb + ' ' + (g ? text(g.what) : ''), ans: text(t.blurb) }); });
    (SML.posts || []).forEach((p) => add({ type: 'post', key: p.id, tok: p.id, title: p.title, alt: [], keys: [p.tag], text: p.excerpt, ans: text(p.excerpt) }));
    (D().pages || []).forEach((p) => add({ type: 'page', key: p.tok, tok: p.tok, title: p.title, alt: [p.keys], keys: [], text: p.say, ans: p.say }));
    // tokens per field, document frequency, and the raw vocabulary (for spelling fixes)
    const df = new Map(), vocab = new Map();
    const W = { title: 4, alt: 3, keys: 2, text: 1 };
    docs.forEach((d) => {
      const f = (s) => stems(Array.isArray(s) ? s.filter(Boolean).join(' . ') : s);
      d.T = stems(d.title); d.Ts = new Set(d.T);
      d.As = (d.alt || []).filter(Boolean).map((a) => stems(a)).filter((a) => a.length); d.A = new Set(d.As.flat());
      d.K = new Set(f(d.keys)); d.X = new Set(f(d.text));
      new Set([...d.Ts, ...d.A, ...d.K, ...d.X]).forEach((t) => df.set(t, (df.get(t) || 0) + 1));
      [['title', d.title], ['alt', (d.alt || []).join(' ')], ['keys', (d.keys || []).join(' ')], ['text', d.text]].forEach(([k, s]) => words(s).forEach((w) => { if (w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)) vocab.set(w, (vocab.get(w) || 0) + W[k]); }));
    });
    const stemSet = new Set(df.keys());
    const N = docs.length;
    const idf = (t) => Math.log(1 + N / (df.get(t) || 0.5));
    BRAIN = { docs, df, vocab, stemSet, idf, N };
    return BRAIN;
  }

  /* Read a message into search words: synonyms first, then spelling fixes for words the site never uses. */
  const typeWordOf = (w) => { const tw = D().typeWords || {}; for (const k of Object.keys(tw)) if (tw[k].indexOf(w) >= 0) return k; return null; };
  function analyze(raw) {
    const B = brain(), syn = D().synonyms || {};
    let n = norm(raw);
    const types = new Set();
    const ws = n.split(' ').filter(Boolean);
    // spelling: a word the site never uses, close to exactly one word it does
    const fixed = [];
    const out = ws.map((w) => {
      if (w.length < 4 || STOP.has(w) || /\d/.test(w) || syn[w] || B.vocab.has(w) || B.stemSet.has(stem(w)) || typeWordOf(w)) return w;
      const max = w.length >= 8 ? 2 : 1; let best = null, bd = max + 1, bw = 0;
      B.vocab.forEach((weight, v) => { if (Math.abs(v.length - w.length) > max || (v[0] !== w[0] && w.length < 6)) return; const d = dist(w, v, max); if (d < bd || (d === bd && weight > bw)) { best = v; bd = d; bw = weight; } });
      if (best && bd <= max) { fixed.push([w, best]); return best; }
      return w;
    });
    n = out.join(' ');
    const padded = ' ' + n + ' ';
    const core = [], opt = [];
    const seen = new Set();
    const push = (arr, t) => { if (!seen.has(t)) { seen.add(t); arr.push(t); } };
    // synonyms: an abbreviation the site doesn't use is replaced by its full form; one it does use also brings its full form along
    // (alts: a word the site does use counts as found on a page that has its full form instead)
    const replaced = new Set(), extra = [], alts = {};
    Object.keys(syn).sort((a, b) => b.length - a.length).forEach((k) => {
      if (padded.indexOf(' ' + k + ' ') < 0) return;
      const known = k.split(' ').some((w) => !STOP.has(w) && B.stemSet.has(stem(w)));
      const ts = stems(syn[k]);
      extra.push([known, ts]);
      if (!known) k.split(' ').forEach((w) => replaced.add(w));
      else k.split(' ').forEach((w) => { if (!STOP.has(w)) alts[stem(w)] = (alts[stem(w)] || []).concat(ts); });
    });
    out.forEach((w) => {
      const tw = typeWordOf(w); if (tw) { types.add(tw); return; }
      if (STOP.has(w) || replaced.has(w)) return;
      push(core, stem(w));
    });
    extra.forEach(([known, ts]) => ts.forEach((t) => push(known ? opt : core, t)));
    // only kind-of-page words ("calculators", "glossary"): then they are what to look for
    if (!core.length && types.size) out.forEach((w) => { if (typeWordOf(w)) push(core, stem(w)); });
    const optOnly = opt.filter((t) => core.indexOf(t) < 0);
    return { n, core, opt: optOnly, alts, types, fixed, words: out.filter((w) => !STOP.has(w)) };
  }

  /* Score every page for a message. prefer: { term: 1.5, tool: 0.6, ... } multiplies the score by kind of page. */
  const BASE = { term: 1.05, lesson: 1, tool: 0.95, course: 0.9, track: 0.9, post: 0.75, page: 0.95 };
  function search(q, prefer) {
    const B = brain(); const a = typeof q === 'string' ? analyze(q) : q;
    if (!a.core.length && !a.opt.length) return [];
    const P = Object.assign({}, BASE, prefer || {});
    if (a.types.has('tool')) P.tool *= 1.6;
    if (a.types.has('lesson')) { P.lesson *= 1.4; P.course *= 1.2; }
    if (a.types.has('term')) P.term *= 1.4;
    const qw = new Map(); let total = 0;
    a.core.forEach((t) => { const w = B.idf(t); qw.set(t, w); total += w; });
    const coreSet = new Set(a.core), allQ = new Set(a.core.concat(a.opt));
    const res = [];
    B.docs.forEach((d) => {
      let s = 0, got = 0;
      const field = (t) => {
        if (d.Ts.has(t)) return 10; if (d.A.has(t)) return 8; if (d.K.has(t)) return 4; if (d.X.has(t)) return 1.5;
        if (t.length >= 4) { for (const x of d.Ts) if (x.length >= 4 && (x.indexOf(t) === 0 || t.indexOf(x) === 0)) return 6; for (const x of d.A) if (x.length >= 4 && (x.indexOf(t) === 0 || t.indexOf(x) === 0)) return 4.5; }
        return 0;
      };
      let direct = 0;
      a.core.forEach((t) => {
        let f = field(t); if (f) direct++;
        if (a.alts && a.alts[t]) { const al = a.alts[t]; const hits = al.map(field).filter(Boolean); if (hits.length >= Math.min(2, al.length)) f = Math.max(f, 0.8 * Math.max.apply(null, hits) * (0.5 + 0.5 * hits.length / al.length)); }
        if (f) { s += f * qw.get(t); got += qw.get(t); }
      });
      a.opt.forEach((t) => { const f = field(t); if (f) s += f * B.idf(t) * 0.5; });
      if (!s) return;
      const cover = total ? got / total : 0;
      if (a.core.length && !got) return; // only the extra synonym words matched: too weak
      // whole titles (or alternative names) that appear in the message
      const inQ = (arr) => arr.length && arr.every((t) => allQ.has(t));
      const tCover = d.T.length ? d.T.filter((t) => allQ.has(t)).length / d.T.length : 0;
      let bonus = 0, whole = false;
      if (inQ(d.T)) { whole = true; bonus += 8 * d.T.reduce((x, t) => x + B.idf(t), 0); if (a.core.every((t) => d.Ts.has(t))) bonus += 6 * d.T.reduce((x, t) => x + B.idf(t), 0) / d.T.length; }
      d.As.forEach((arr) => { if (inQ(arr)) { whole = true; bonus = Math.max(bonus, 7 * arr.reduce((x, t) => x + B.idf(t), 0)); } });
      // a glossary term found only through another word's full form is not a definition of what was asked
      const termPenalty = d.type === 'term' && a.core.length && !direct ? 0.6 : 1;
      const score = (s + bonus) * (0.3 + 0.7 * cover) * (0.7 + 0.3 * (whole ? 1 : tCover)) * (P[d.type] || 1) * termPenalty;
      res.push({ d, score, cover, whole });
    });
    res.sort((x, y) => y.score - x.score);
    return res;
  }
  // the page a result opens: a glossary term opens its lesson
  const target = (r) => r && r.d.tok;
  // strong enough to answer with; weak results are only offered as "closest"
  const STRONG = 38, WEAK = 14;
  const strong = (r) => !!r && r.score >= STRONG && r.cover >= 0.5;

  /* ---------------- answers ---------------- */
  const link = (tok, label, pri) => ({ tok, label: label || titleOf(tok), pri: !!pri });
  function actsHTML(links) {
    const ls = links.filter((k) => k && exists(k.tok));
    return ls.length ? `<div class="fbc-acts">${ls.map((k) => `<a class="fbc-a${k.pri ? ' pri' : ''}" href="${esc(href(k.tok))}" data-tok="${esc(k.tok)}">${esc(k.label)}${k.pri ? ICON.arrow : ''}</a>`).join('')}</div>` : '';
  }
  const P = (s) => `<p>${s}</p>`;
  function kicker(d) {
    if (d.type === 'term') return 'Glossary';
    if (d.type === 'lesson') { const l = lessonById(d.tok), c = l && courseById(l.course); return ['Lesson', c && c.title, l && l.mins ? l.mins + ' min' : ''].filter(Boolean).join(' · '); }
    if (d.type === 'tool') { const t = toolById(d.tok); return 'Tool' + (t && t.cat ? ' · ' + t.cat : ''); }
    if (d.type === 'course') { const c = courseById(d.tok.slice(2)); const t = c && trackById(c.track || 'trading'); return ['Course', t && t.title + ' track', c && lessonsOf(c.id).length + ' lessons'].filter(Boolean).join(' · '); }
    if (d.type === 'track') { const t = trackById(d.tok.slice(6)); return t ? `Track · ${coursesOf(t.id).length} courses · ${trackLessons(t.id).length} lessons` : 'Track'; }
    if (d.type === 'post') { const p = postById(d.tok); return 'Trade note' + (p && p.date && SML.fmtDate ? ' · ' + SML.fmtDate(p.date) : ''); }
    return 'Page';
  }
  function cardHTML(d) {
    const t = d.type === 'term' && d.full ? `${esc(d.title)}<small>${esc(d.full)}</small>` : esc(d.title);
    return `<p class="fbc-k">${esc(kicker(d))}</p><p class="fbc-t">${t}</p><p>${esc(d.ans)}</p>`;
  }
  function linksFor(d) {
    const out = [];
    if (d.type === 'term') { const l = lessonById(d.tok); if (l) { out.push(link(l.id, 'Lesson: ' + l.title, true)); toolsFor(l).slice(0, 1).forEach((t) => out.push(link(t.id, t.title + ' tool'))); } }
    else if (d.type === 'lesson') { const l = lessonById(d.tok); out.push(link(d.tok, 'Open the lesson', true)); if (l) toolsFor(l).slice(0, 2).forEach((t) => out.push(link(t.id, t.title + ' tool'))); }
    else if (d.type === 'tool') { const t = toolById(d.tok); out.push(link(d.tok, 'Open the tool', true)); if (t && lessonById(t.lesson)) out.push(link(t.lesson, 'Lesson: ' + lessonById(t.lesson).title)); }
    else if (d.type === 'course') { const c = courseById(d.tok.slice(2)); out.push(link(d.tok, 'See the course', true)); const f = c && lessonsOf(c.id)[0]; if (f) out.push(link(f.id, 'First lesson: ' + f.title)); }
    else if (d.type === 'track') { const tid = d.tok.slice(6); out.push(link(d.tok, 'See the track', true)); const f = trackLessons(tid)[0]; if (f) out.push(link(f.id, 'First lesson: ' + f.title)); }
    else if (d.type === 'post') out.push(link(d.tok, 'Read the note', true));
    else out.push(link(d.tok, 'Open ' + d.title, true));
    return out;
  }
  // related glossary terms from the same lesson, as follow-up questions
  function relatedTerms(d, n) {
    const l = lessonById(d.tok); if (!l) return [];
    return (l.terms || []).filter((t) => t !== d.title && t.length < 26).slice(0, n || 2).map((t) => ({ l: `What does “${t}” mean?`, a: 'ask', v: 'what is ' + t }));
  }
  function answer(results, a, opts) {
    opts = opts || {};
    const top = results[0]; const d = top.d;
    // up to three other good matches, one per page (the main answer's page already has its button)
    const used = new Set([d.key, d.tok]), also = [];
    results.slice(1).forEach((r) => {
      if (also.length >= 3 || r.score < top.score * 0.45 || r.score < WEAK || used.has(r.d.key) || used.has(r.d.tok)) return;
      used.add(r.d.key); used.add(r.d.tok); also.push(r);
    });
    let h = '';
    if (a && a.fixed && a.fixed.length) h += `<p class="fbc-note">I read that as “${esc(a.fixed.map((f) => f[1]).join(', '))}”.</p>`;
    if (opts.lead) h += P(esc(opts.lead));
    h += cardHTML(d) + actsHTML(linksFor(d));
    const alsoLinks = also.filter((r) => r.d.type !== 'term');
    if (alsoLinks.length) h += `<p class="fbc-note">Also related</p>` + actsHTML(alsoLinks.slice(0, 2).map((r) => link(r.d.tok, r.d.type === 'tool' ? r.d.title + ' tool' : r.d.title)));
    const chips = [];
    if (d.type === 'term') { chips.push({ l: 'Tell me more', a: 'more' }); relatedTerms(d, 1).forEach((c) => chips.push(c)); }
    else if (d.type === 'lesson') { chips.push({ l: 'Key takeaways', a: 'more' }); also.filter((r) => r.d.type === 'term').slice(0, 1).forEach((r) => chips.push({ l: `What does “${r.d.title}” mean?`, a: 'ask', v: 'what is ' + r.d.title })); }
    else if (d.type === 'tool' && (SML.toolGuides || {})[d.tok]) chips.push({ l: 'How does it work?', a: 'more' });
    chips.push(d.type === 'tool' ? { l: 'Another tool', a: 'tool' } : d.type === 'term' ? { l: 'Explain another term', a: 'term' } : { l: 'Find another lesson', a: 'lesson' });
    chips.push({ l: 'Something else', a: 'menu', q: 1 });
    st.last = { type: d.type, tok: d.tok, title: d.title, key: d.key };
    return { h, chips: chips.slice(0, 4), n: results.length };
  }
  function fallback(raw, results, a) {
    const near = (results || []).filter((r) => r.score >= WEAK).slice(0, 3);
    const q = String(raw || '').trim().slice(0, 80);
    let h = '';
    if (near.length) h = P(esc(D().prompts.fallbackNear)) + `<ul class="fbc-li">${near.map((r) => `<li><a href="${esc(href(r.d.tok))}" data-tok="${esc(r.d.tok)}"><b>${esc(r.d.type === 'term' ? r.d.title + ' (glossary)' : r.d.title)}</b><small>${esc(kicker(r.d))}</small></a></li>`).join('')}</ul>`;
    else h = P(esc(D().prompts.fallback) + ' Try other words, search every lesson, or send it to the person who runs the site as a question.');
    st.last = null;
    const chips = [];
    if (q && a && a.core.length) chips.push({ l: `Search all lessons for “${q.length > 28 ? q.slice(0, 27) + '…' : q}”`, a: 'search', v: q });
    chips.push({ l: 'Send this as a question', a: 'ask-owner', v: q });
    chips.push({ l: 'Explain a term', a: 'term' }, { l: 'Where do I start?', a: 'start' });
    return { h, chips: chips.slice(0, 4), n: near.length };
  }

  /* strip the question words around the thing being asked about */
  const LEAD = /^(please |pls |hey |hi |ok |okay |so |and |but |um |also )*(can you |could you |would you |will you |help me |i want to |i wanna |id like to |i would like to |i need to |lets |let me )?(tell me about|tell me|explain to me|explain|define|describe|teach me about|teach me|what is meant by|what is|whats|what s|what are|what was|what does|what do|meaning of|definition of|how does|how do|how is|how are|why is|why are|why do|why does|who is|take me to|take me|go to|goto|open up|open|show me|bring me to|navigate to|jump to|link me to|link to|i want to see|i want to go to|go|where is|where are|where can i find|where do i find|how do i get to|find me|find|look up|search for|search)\b\s*/;
  const TAIL = /\s*\b(mean|means|stand for|stands for|work|works|do|does|in trading|in investing|in finance|in simple terms|in plain english|simply|please|for me|again|page|lesson|on the site|on firedbunny)$/;
  function subject(n) { let s = n.replace(LEAD, '').trim(); for (let i = 0; i < 3; i++) s = s.replace(TAIL, '').trim(); return s.replace(/^(a|an|the)\s+/, ''); }

  /* ---------------- intent handlers ---------------- */
  const C = (name) => (D().chipSets || {})[name] || [];
  const menuReply = (lead) => ({ h: P(esc(lead || 'Sure. What would you like to do?')), chips: C('menu') });
  const H = {
    greet() { return menuReply(st.msgs.filter((m) => m.r === 'u').length > 1 ? 'Hi again. What can I find for you?' : 'Hi! What can I help you find?'); },
    menu() { st.mode = null; return menuReply(); },
    lesson() { st.mode = 'lesson'; return { keep: 1, h: P(esc(D().prompts.lesson)), chips: (SML.tracks || []).map((t) => ({ l: t.title, a: 'track', v: t.id })).concat(D().lessonStarters.filter((x) => (SML.lessons || []).some((l) => l.title === x)).slice(0, 2).map((x) => ({ l: x, a: 'ask', v: x }))) }; },
    term() { st.mode = 'term'; const gl = new Set((SML.glossary || []).map((g) => g.t)); const pick = D().termStarters.filter((t) => gl.has(t)); const off = st.msgs.length % Math.max(1, pick.length); const four = pick.slice(off).concat(pick.slice(0, off)).slice(0, 4); return { keep: 1, h: P(esc(D().prompts.term.replace('{n}', (SML.glossary || []).length))), chips: four.map((t) => ({ l: t, a: 'ask', v: 'what is ' + t })).concat([{ l: 'Open the glossary', a: 'go', v: 'glossary', q: 1 }]) }; },
    tool() { st.mode = 'tool'; return { keep: 1, h: P(esc(D().prompts.tool)), chips: toolGroups().map((g, i) => ({ l: g.l, a: 'toolgroup', v: i })) }; },
    toolgroup(i) {
      const g = toolGroups()[Number(i)]; if (!g) return H.tool();
      st.mode = 'tool';
      return { keep: 1, h: P(`${esc(g.l)}: ${g.tools.length === 1 ? 'one tool' : g.tools.length + ' tools'}. Each one draws a picture of its answer.`) + `<ul class="fbc-li">${g.tools.map((t) => `<li><a href="${esc(href(t.id))}" data-tok="${esc(t.id)}"><b>${esc(t.title)}</b><small>${esc(t.blurb)}</small></a></li>`).join('')}</ul>` + actsHTML([link('tools', `All ${(SML.tools || []).length} tools`)]), chips: [{ l: 'Another area', a: 'tool' }, { l: 'Something else', a: 'menu', q: 1 }] };
    },
    start() {
      st.mode = null;
      const prog = SML.progress ? SML.progress.count() : 0;
      const lead = prog ? `You’ve finished ${prog} lesson${prog === 1 ? '' : 's'} so far, nice. ` : '';
      return { h: P(esc(lead + D().prompts.start)), chips: (SML.tracks || []).map((t) => ({ l: trackLabel(t), a: 'track', v: t.id })).concat([{ l: 'Not sure yet', a: 'notsure' }]) };
    },
    track(id) {
      const t = trackById(id); if (!t) return H.start();
      const cs = coursesOf(t.id), ls = trackLessons(t.id); const first = ls[0];
      const done = ls.filter((l) => SML.progress && SML.progress.isDone(l.id)).length; const next = ls.find((l) => !(SML.progress && SML.progress.isDone(l.id))) || first;
      let h = `<p class="fbc-k">Track · ${cs.length} courses · ${ls.length} lessons</p><p class="fbc-t">${esc(t.title)}</p><p>${esc(text(t.blurb))}</p>`;
      h += done ? P(`You’ve done ${done} of ${ls.length}. Next up: <b>${esc(next.title)}</b> (${next.mins || 4} min).`) : P(`It starts with <b>${esc(cs[0] ? cs[0].title : '')}</b>. First lesson: <b>${esc(first ? first.title : '')}</b>, about ${first ? first.mins || 4 : 4} minutes. Each lesson is one idea you can play with, then a quick check.`);
      h += actsHTML([next ? link(next.id, (done ? 'Continue: ' : 'Start: ') + next.title, true) : null, link('track-' + t.id, 'See the whole track')]);
      st.last = next ? { type: 'lesson', tok: next.id, title: next.title } : null;
      return { h, chips: (SML.tracks || []).filter((x) => x.id !== t.id).map((x) => ({ l: x.title + ' instead', a: 'track', v: x.id })).concat([{ l: 'Take the self-assessment', a: 'notsure' }]) };
    },
    notsure() { st.last = { type: 'page', tok: 'assessment', title: 'Investor self-assessment' }; return { h: P(esc(D().prompts.notSure)) + actsHTML([link('assessment', 'Start the self-assessment', true), link('track-trading', 'Or start with Market Basics')]), chips: C('after') }; },
    more() {
      const L = st.last; if (!L) return null;
      if (L.type === 'tool') {
        const g = (SML.toolGuides || {})[L.tok];
        if (g) return { h: `<p class="fbc-k">How the ${esc(L.title)} tool works</p>${P(esc(text(g.what)))}${g.assume && g.assume.length ? `<ul>${g.assume.slice(0, 3).map((x) => `<li>${esc(text(x))}</li>`).join('')}</ul>` : ''}` + actsHTML([link(L.tok, 'Open the tool', true)]), chips: C('after') };
        const t = toolById(L.tok); const l = t && lessonById(t.lesson); if (!l) return null;
        return takeaways(l);
      }
      const l = lessonById(L.tok); if (!l) return null;
      return takeaways(l);
    },
    open() { const L = st.last; if (!L || !exists(L.tok)) return null; return goReply(L.tok, `Opening ${titleOf(L.tok)}.`); },
    feedback(kind, raw) { return startFeedback(typeof kind === 'string' && SML.feedback && SML.feedback.KINDS.indexOf(kind) >= 0 ? kind : guessKind(raw)); },
    'ask-owner'(q) { return startFeedback('Question', q); },
    delete() {
      const signed = !!(SML.cloud && SML.cloud.user), cloud = SML.account && SML.account.status && SML.account.status.mode === 'cloud';
      const dn = D().notes && D().notes.delete ? D().notes.delete() : '';
      const h = P(`Go to <b>Settings</b>, find <b>Delete my data</b>, type DELETE and press <b>Delete everything</b>. That removes your profile, goals, net worth history, assessments and lesson progress ${cloud ? 'from your account' : 'from this browser'}.${signed ? ' <b>Delete my account too</b> also removes your login and email address.' : ''} Export a copy first if you might want it back.`) + (dn ? P(esc(dn)) : '') + `<p class="fbc-note">Feedback notes you’ve sent are kept separately by the person who runs FiredBunny. To have one removed, send a note asking for it.</p>` + actsHTML([link('settings', 'Open Settings', true)]);
      st.last = { type: 'page', tok: 'settings', title: 'Settings' };
      return { h, chips: [{ l: 'Send a note', a: 'feedback' }, { l: 'Something else', a: 'menu', q: 1 }] };
    },
    signin() {
      let h;
      if (SML.host === 'claude') h = P('Here, FiredBunny uses your Claude account: when you’re signed in, your profile is saved privately to it, so there’s no FiredBunny password. As a guest, everything stays in this browser.') + actsHTML([link('signin', 'How sign-in works', true), link('settings', 'Settings')]);
      else if (!SML.accountsOn) h = P('There are no accounts to sign in to here: everything you save stays in this browser. To move it to another device, export a file from Settings and import it there.') + actsHTML([link('settings', 'Open Settings', true)]);
      else if (SML.cloud && SML.cloud.user) h = P(`You’re signed in${SML.cloud.user.email ? ' as <b>' + esc(SML.cloud.user.email) + '</b>' : ''}. Your progress, dashboard and assessments are saved to your FiredBunny account and follow you to every device where you sign in.`) + actsHTML([link('signin', 'Your account', true), link('settings', 'Settings')]);
      else h = P('You don’t need an account: everything works as a guest and is saved in this browser. A free FiredBunny account (email and password) keeps your progress, dashboard and assessments on every device where you sign in. Forgot your password? The sign-in page can email you a reset link.') + actsHTML([link('signin', 'Sign in or create an account', true), link('settings', 'Settings')]);
      st.last = { type: 'page', tok: 'signin', title: 'Sign in' };
      return { h, chips: C('after') };
    },
    sync() {
      let h;
      if (SML.host === 'claude') h = P('Signed in with your Claude account, your profile is saved privately to it. As a guest, it stays in this browser; <b>Export my data</b> in Settings gives you a file you can import somewhere else.');
      else if (SML.accountsOn && SML.cloud && SML.cloud.user) h = P('You’re signed in, so your progress is saved to your account and syncs to every device where you sign in. If you’re offline, changes wait in this browser and upload when you’re back online.');
      else if (SML.accountsOn) h = P('As a guest, what you save stays in this browser. Sign in with a free account and it follows you to every device. Or move it by hand: <b>Export my data</b> in Settings, then import the file on the other device.');
      else h = P('Everything you save stays in this browser. To move it, use <b>Export my data</b> in Settings, then import the file on the other device.');
      const ls = [SML.host !== 'claude' && SML.accountsOn && !(SML.cloud && SML.cloud.user) ? link('signin', 'Sign in or create an account', true) : null, link('settings', 'Open Settings', !(SML.host !== 'claude' && SML.accountsOn && !(SML.cloud && SML.cloud.user)))];
      st.last = { type: 'page', tok: 'settings', title: 'Settings' };
      return { h: h + actsHTML(ls), chips: C('after') };
    },
    privacy() {
      let h;
      if (SML.host === 'claude') h = P('Signed in, your data is saved to your private FiredBunny profile; other visitors and the site owner can’t read it. As a guest, it stays in this browser. Feedback you send is the only thing the owner reads.');
      else h = P(`Your progress and plans are saved in this browser${SML.accountsOn ? ', or in your FiredBunny account if you sign in, where other visitors can’t see them' : ''}. FiredBunny uses Google Analytics to count visits and see which pages, lessons and tools people use. It never sends your profile, goals, money figures or anything you type into the tools, and you can switch it off in Settings.`);
      const pn = D().notes && D().notes.privacy ? D().notes.privacy() : ''; if (pn) h += P(esc(pn));
      h += P('This chat keeps the conversation in this tab only. Nothing you type here is sent anywhere unless you choose to send it as a note.');
      st.last = { type: 'page', tok: 'settings', title: 'Settings' };
      return { h: h + actsHTML([link('settings', 'Privacy & settings', true), SML.host !== 'claude' ? link('privacy', 'Privacy policy') : null].filter(Boolean)), chips: C('after') };
    },
    offline() {
      const h = SML.host === 'claude' ? P('Offline mode, saving audio and installing FiredBunny as an app work on the FiredBunny website, not in this preview. Separate mobile apps are in development.')
        : P('Once you’ve visited, FiredBunny opens without a connection, lessons and calculators included. On the Offline &amp; app page you can save lesson audio for offline listening and install the site as an app. Separate mobile apps are in development.');
      st.last = { type: 'page', tok: 'offline', title: 'Offline & app' };
      return { h: h + actsHTML([link('offline', 'Offline & app', true), link('apps', 'The apps')]), chips: C('after') };
    },
    when(raw, a) {
      const n = ' ' + a.n + ' ';
      const hit = (D().calendar || []).find((c) => c.words.some((w) => n.indexOf(' ' + w + ' ') >= 0));
      if (!hit || !Array.isArray(SML.calendarEvents)) return null;
      const now = new Date(); const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const ev = SML.calendarEvents.filter((e) => hit.k.indexOf(e.kind) >= 0 && e.d >= today).sort((x, y) => (x.d < y.d ? -1 : x.d > y.d ? 1 : 0))[0];
      if (!ev) return { h: P('I don’t see one coming up on FiredBunny’s calendar.') + actsHTML([link('calendar', 'Open the calendar', true)]), chips: C('after') };
      let day = ev.d; try { day = new Date(ev.d + 'T12:00:00').toLocaleDateString(SML.locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) {}
      const note = ev.status === 'rule' ? ' That date is worked out from the publisher’s standing rule, so check the official schedule closer to the day.' : ev.status === 'estimate' ? ' That date is approximate; check closer to the time.' : '';
      st.last = ev.lesson ? { type: 'lesson', tok: ev.lesson, title: titleOf(ev.lesson) } : { type: 'page', tok: 'calendar', title: 'Calendar' };
      return { h: `<p class="fbc-k">From the market &amp; tax calendar</p>${P(`The next <b>${esc(/^[A-Z][a-z]/.test(ev.title) ? ev.title.charAt(0).toLowerCase() + ev.title.slice(1) : ev.title)}</b> is on <b>${esc(day)}</b>${ev.time ? ', ' + esc(ev.time) : ''}.${note}`)}` + actsHTML([link('calendar', 'Open the calendar', true), ev.lesson && exists(ev.lesson) ? link(ev.lesson, 'Lesson: ' + titleOf(ev.lesson)) : null]), chips: C('after') };
    },
    tool2(raw, a) { // "calculator for X"
      const s = analyze(subject(a.n));
      if (!s.core.length || (s.core.length && s.core.every((t) => /^(calcul|calc|tool|simul|planner|estimator)/.test(t)))) return H.tool();
      const r = search(s, { tool: 2.2, lesson: 0.7, term: 0.55, course: 0.5, track: 0.5, post: 0.4, page: 0.8 });
      const topTool = r.find((x) => x.d.type === 'tool');
      if (topTool && topTool.score >= WEAK * 1.5) return answer([topTool].concat(r.filter((x) => x !== topTool)), s);
      if (strong(r[0])) return answer(r, s);
      return null;
    },
  };
  function trackLabel(t) { return t.id === 'trading' ? 'Trading: stocks, charts, options' : t.id === 'wealth' ? 'Retirement & Wealth: budget, 401(k), taxes' : t.id === 'fire' ? 'FIRE: retire early' : t.title; }
  function toolGroups() {
    const gs = (D().toolGroups || []).map((g) => ({ l: g.l, tools: (SML.tools || []).filter((t) => g.cats.indexOf(t.cat) >= 0) })).filter((g) => g.tools.length);
    const placed = new Set(gs.flatMap((g) => g.tools.map((t) => t.id)));
    const rest = (SML.tools || []).filter((t) => !placed.has(t.id));
    if (rest.length) gs.push({ l: 'More tools', tools: rest });
    return gs;
  }
  function takeaways(l) {
    st.last = { type: 'lesson', tok: l.id, title: l.title };
    const pts = (l.points || []).map(text).filter(Boolean).slice(0, 4);
    return { h: `<p class="fbc-k">Key takeaways · ${esc(l.title)}</p>${pts.length ? `<ul>${pts.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : P(esc(text(l.idea)))}` + actsHTML([link(l.id, 'Open the lesson', true)]), chips: [{ l: 'Find another lesson', a: 'lesson' }, { l: 'Explain a term', a: 'term' }, { l: 'Something else', a: 'menu', q: 1 }] };
  }
  function goReply(tok, lead) {
    st.last = { type: 'page', tok, title: titleOf(tok) };
    return { h: P(esc(lead)) + actsHTML([link(tok, titleOf(tok), true)]), chips: C('after'), go: tok };
  }

  /* compare: "roth ira vs 401k", "difference between delta and gamma" */
  function compare(raw, a) {
    const n = a.n;
    let m = n.match(/^(?:.*?\b)?(?:difference|differences) between (.+?) and (.+)$/) || n.match(/^(.+?)\s+(?:vs|versus|compared to|compared with|or|better than)\s+(.+)$/);
    if (!m) return null;
    const whole = search(a);
    if (whole[0] && whole[0].whole && whole[0].d.type !== 'term' && whole[0].cover >= 0.9) return null; // a title like "Rent or buy?" asked as such
    const sides = [m[1], m[2]].map((s) => subject(s.replace(/^(which is better|whats better|what is better|is it better to|should i (use|get|pick|choose)|is|are)\s+/, '').replace(/\s+(which is better|better|for me|first)$/, '')));
    const hits = sides.map((s) => { const r = search(analyze(s), { term: 1.5, lesson: 1, tool: 0.6, page: 0.5, post: 0.4 }); return r[0] && r[0].score >= STRONG * 0.8 ? r[0] : null; });
    if (!hits[0] || !hits[1] || hits[0].d.key === hits[1].d.key) return null;
    // a lesson that covers both sides
    const sideTok = sides.map((x) => analyze(x).core);
    const has = (d, t) => d.Ts.has(t) || d.A.has(t) || d.K.has(t) || d.X.has(t);
    // how prominently a lesson covers one side: in its title (10), alternative title (8) or terms (4); summaries don't count
    const prom = (d, ts) => Math.max.apply(null, ts.map((t) => (d.Ts.has(t) ? 10 : d.A.has(t) ? 8 : d.K.has(t) ? 4 : 0)).concat([0]));
    const both = search(analyze(sides.join(' ')), { lesson: 1.6, term: 0, tool: 0, course: 0.6, track: 0, post: 0.4, page: 0 })
      .filter((r) => r.d.type === 'lesson' && sideTok.every((ts) => ts.length && ts.filter((t) => has(r.d, t)).length / ts.length >= 0.5))
      .map((r) => Object.assign({}, r, { side: Math.min.apply(null, sideTok.map((ts) => prom(r.d, ts))) }))
      .filter((r) => r.side >= 4).sort((x, y) => y.side - x.side || y.score - x.score);
    let h = '';
    hits.forEach((r) => { h += `<p class="fbc-t">${esc(r.d.title)}</p>${P(esc(r.d.ans))}`; });
    const ls = [];
    if (both[0]) { h += P(`<b>${esc(both[0].d.title)}</b> puts them side by side.`); ls.push(link(both[0].d.tok, 'Lesson: ' + both[0].d.title, true)); }
    hits.forEach((r) => { if (r.d.tok && !ls.some((x) => x.tok === r.d.tok)) ls.push(link(r.d.tok, (r.d.type === 'tool' ? '' : 'Lesson: ') + titleOf(r.d.tok), !ls.length)); });
    st.last = { type: 'lesson', tok: ls[0].tok, title: titleOf(ls[0].tok) };
    return { h: `<p class="fbc-k">Side by side</p>` + h + actsHTML(ls.slice(0, 3)), chips: [{ l: 'Tell me more', a: 'more' }, { l: 'Explain another term', a: 'term' }, { l: 'Something else', a: 'menu', q: 1 }], n: 2 };
  }

  /* navigate: "take me to the wheel strategy", "where is the glossary" */
  function navigate(raw, a) {
    const s0 = subject(a.n); if (!s0) return null;
    const s = analyze(s0); if (!s.core.length) return null;
    const r = search(s, { page: 1.4, lesson: 1.15, course: 1.15, track: 1.1, tool: 1.15, term: 0.8, post: 0.9 });
    if (!r.length || r[0].score < WEAK) return null;
    const top = r[0], second = r.find((x) => target(x) !== target(top));
    const clear = strong(top) && (!second || top.score >= second.score * 1.3 || top.whole);
    const goNow = /^(please |can you |could you )?(take me|go|goto|open|show me|bring me|navigate|jump|link)/.test(a.n);
    if (clear && goNow) return goReply(target(top), `Taking you to ${titleOf(target(top))}.`);
    if (clear) return answer(r, s);
    const opts = r.filter((x, i) => r.findIndex((y) => target(y) === target(x)) === i).slice(0, 3);
    st.last = { type: top.d.type, tok: target(top), title: titleOf(target(top)) };
    return { h: P('I found a few pages. Which one?') + `<ul class="fbc-li">${opts.map((x) => `<li><a href="${esc(href(target(x)))}" data-tok="${esc(target(x))}"><b>${esc(titleOf(target(x)))}</b><small>${esc(kicker(x.d.type === 'term' ? { type: 'lesson', tok: x.d.tok } : x.d))}</small></a></li>`).join('')}</ul>`, chips: C('after'), n: opts.length };
  }

  /* define / search: the content lookup */
  function lookup(raw, a, kind) {
    const s0 = kind === 'define' ? subject(a.n) : a.n;
    const s = s0 && s0 !== a.n ? analyze(s0) : a;
    const prefer = kind === 'define' ? { term: 1.6, lesson: 1, tool: 0.6, course: 0.8, track: 0.8, page: 0.6, post: 0.5 }
      : st.mode === 'lesson' ? { lesson: 1.7, course: 1.3, track: 1.2, term: 0.75, tool: 0.7, page: 0.6, post: 0.6 }
      : st.mode === 'term' ? { term: 1.7, lesson: 0.9, tool: 0.5, page: 0.5, post: 0.4 }
      : st.mode === 'tool' ? { tool: 2, lesson: 0.8, term: 0.6, page: 0.7, post: 0.4 } : null;
    if (!s.core.length && !s.opt.length) return menuReply('I didn’t quite follow. What would you like to do?');
    let r = search(s, prefer);
    if ((st.mode === 'lesson' || s.types.has('lesson')) && r[0] && r[0].d.type === 'term') { // looking for a lesson: a matching term means its lesson
      const l = brain().docs.find((d) => d.type === 'lesson' && d.tok === r[0].d.tok); if (l) r = [{ d: l, score: r[0].score, cover: r[0].cover, whole: false }].concat(r.filter((x) => x.d !== l));
    }
    if (!strong(r[0])) return fallback(raw, r, s);
    return answer(r, s);
  }

  /* ---------------- feedback flow ---------------- */
  function guessKind(raw) {
    const n = norm(raw || '');
    if (/\b(wrong|incorrect|outdated|out of date|correction|inaccura|mistake|error|typo)\b/.test(n)) return /\b(typo)\b/.test(n) ? 'Something to improve' : 'Correct an inaccuracy';
    if (/\b(bug|broken|doesnt work|does not work|not working|isnt working|wont load)\b/.test(n)) return 'Something to improve';
    if (/\b(idea|suggest|feature request|would be nice|wish)\b/.test(n)) return 'Idea';
    return null;
  }
  const KIND_ASK = {
    'Idea': 'Lovely. What would you like to see on FiredBunny?',
    'Something to improve': 'Thanks. What should change, and why? If something is broken, say what you did and what happened.',
    'Correct an inaccuracy': 'Thank you, corrections matter. What looks wrong, what should it say, and where did you see the right figure?',
    'Question': 'Ask away. I’ll pass it on with the page you’re on.',
    'Other': 'Go ahead, I’m listening.',
  };
  let fbRoute = null;
  function routeKind() { return fbRoute ? fbRoute.kind : null; }
  function startFeedback(kind, prefill) {
    st.mode = null;
    if (st.fb && st.fb.message && (st.fb.step === 'confirm' || st.fb.step === 'failed') && !prefill) return Object.assign(confirmReply(), { h: P('You have a note waiting from before.') + confirmReply().h });
    if (SML.feedback) SML.feedback.route().then((r) => { fbRoute = r; }).catch(() => {});
    st.fb = { step: kind ? 'msg' : 'kind', kind: kind || null, message: prefill || '', email: '', page: SML.feedback ? SML.feedback.page() : location.pathname };
    if (kind && prefill) { st.fb.step = 'email'; return askEmail(`I’ll send your question, “${prefill.length > 120 ? prefill.slice(0, 119) + '…' : prefill}”, as a note.`); }
    if (kind) return { h: P(`Got it: <b>${esc(kind)}</b>. ${esc(KIND_ASK[kind] || KIND_ASK.Other)}`) + `<p class="fbc-note">Type it below, up to 4,000 characters. I’ll note that you’re on ${esc(pageName())}.</p>`, chips: [{ l: 'Cancel', a: 'fb-cancel', q: 1 }], input: 'msg' };
    return { h: P('Happy to pass a note to the person who runs FiredBunny. What kind of note is it?'), chips: (SML.feedback ? SML.feedback.KINDS : ['Idea', 'Other']).map((k) => ({ l: k, a: 'fb-kind', v: k })).concat([{ l: 'Never mind', a: 'fb-cancel', q: 1 }]) };
  }
  function pageName() { const t = (document.title || '').replace(/\s*·\s*FiredBunny$/, '').trim(); return t && t !== 'FiredBunny' ? `“${t}”` : 'this page'; }
  function askEmail(lead) {
    return { h: P(esc(lead || 'Got it.') + ' Would you like a reply? Add your email and it’s used only to answer you. It’s optional.'), chips: [{ l: 'No email, thanks', a: 'fb-skip' }, { l: 'Cancel', a: 'fb-cancel', q: 1 }], input: 'email' };
  }
  function confirmReply() {
    const f = st.fb; f.step = 'confirm';
    const rk = routeKind() || 'copy', say = SML.feedback ? SML.feedback.says(rk) : { button: 'Copy my note' };
    const preview = f.message.length > 320 ? f.message.slice(0, 319) + '…' : f.message;
    const h = P('Here’s your note. Shall I send it?') + `<dl class="fbc-sum"><dt>Kind</dt><dd>${esc(f.kind)}</dd><dt>Page</dt><dd>${esc(f.page)}</dd><dt>Note</dt><dd>${esc(preview)}</dd><dt>Reply</dt><dd>${f.email ? esc(f.email) : 'No email'}</dd></dl>` +
      `<p class="fbc-note">${esc(SML.feedback ? SML.feedback.privacy(rk, { page: f.page, email: f.email }) : '')}</p>`;
    return { h, chips: [{ l: say.button === 'Send' ? 'Send it' : say.button, a: 'fb-send', p: 1 }, { l: 'Edit my note', a: 'fb-edit' }, { l: 'Cancel', a: 'fb-cancel', q: 1 }] };
  }
  async function sendFeedback() {
    const f = st.fb; if (!f || !SML.feedback) return null;
    const entry = { kind: f.kind || 'Other', message: f.message, email: f.email || '', page: f.page, source: 'chat' };
    const res = await SML.feedback.send(entry);
    const plain = SML.feedback.plain(entry);
    if (res.ok) {
      st.fb = null;
      return { h: P(`<b>Sent. Thank you!</b> It went straight to the person who runs FiredBunny${entry.kind === 'Correct an inaccuracy' ? ', and corrections get looked at first' : ''}.${entry.email ? ' If a reply is needed, it will come to the email you gave.' : ''}`), chips: [{ l: 'Find a lesson', a: 'lesson' }, { l: 'Something else', a: 'menu' }] };
    }
    if (res.via === 'comments') {
      SML.copy(plain, 'Note copied');
      const opened = await SML.feedback.openComments(res.comments, panel);
      st.fb = null;
      return { h: P(opened ? '<b>Your note is copied</b> and the comment box on this page is open: paste it there and post. Comments show your name.' : '<b>Your note is copied.</b> Add it as a comment from the page’s comment menu. Comments show your name.'), chips: C('after') };
    }
    if (res.via === 'copy') {
      SML.copy(plain, 'Note copied');
      st.fb = null;
      return { h: P('<b>Copied.</b> Sending isn’t available in this view, so paste your note wherever you reach FiredBunny.'), chips: C('after') };
    }
    f.step = 'failed';
    const why = { offline: 'You seem to be offline, so it couldn’t be sent.', busy: 'A lot of notes are arriving right now, so it couldn’t go through. Give it a few minutes.', invalid: 'Something in the note couldn’t be accepted; check the email address.', missing: 'Sending isn’t working right now.', error: 'Something went wrong on the way.' }[res.reason] || 'Something went wrong on the way.';
    return { h: P(`<b>That didn’t go through.</b> ${esc(why)} Your note is still here, so nothing is lost.`), chips: [{ l: 'Try again', a: 'fb-send', p: 1 }, { l: 'Copy my note', a: 'fb-copy' }, { l: 'Edit my note', a: 'fb-edit' }, { l: 'Cancel', a: 'fb-cancel', q: 1 }] };
  }
  function feedbackText(raw) {
    const f = st.fb, t = String(raw || '').trim();
    if (/^(cancel|stop|never mind|nevermind|forget it|quit|exit)$/i.test(t)) { st.fb = null; return { h: P('No problem, I’ve dropped it.'), chips: C('after') }; }
    if (f.step === 'kind') { const k = (SML.feedback ? SML.feedback.KINDS : []).find((x) => norm(x) === norm(t)); if (k) return fbAct('fb-kind', k); f.kind = guessKind(t) || 'Other'; f.message = t; f.step = 'msg'; }
    if (f.step === 'msg') {
      f.message = t;
      if (f.message.length < 5) return { h: P('Could you add a few more words? It helps whoever reads it.'), chips: [{ l: 'Cancel', a: 'fb-cancel', q: 1 }], input: 'msg' };
      f.message = f.message.slice(0, 4000); f.step = 'email';
      return askEmail('Got it.');
    }
    if (f.step === 'email') {
      if (/^(no|nope|no thanks|skip|none|no email|no email thanks|n)$/i.test(t)) { f.email = ''; return confirmReply(); }
      if (!(SML.feedback && SML.feedback.emailOk(t))) return { h: P('That doesn’t look like an email address. Check it, or skip it.'), chips: [{ l: 'No email, thanks', a: 'fb-skip' }, { l: 'Cancel', a: 'fb-cancel', q: 1 }], input: 'email' };
      f.email = t; return confirmReply();
    }
    // waiting to send: new text replaces the note
    f.message = t.slice(0, 4000); return confirmReply();
  }
  function fbAct(act, v) {
    const f = st.fb;
    if (act === 'fb-cancel') { st.fb = null; return { h: P('No problem, I’ve dropped it.'), chips: C('after') }; }
    if (!f) return menuReply();
    if (act === 'fb-kind') { f.kind = v; f.step = 'msg'; return { h: P(`${esc(KIND_ASK[v] || KIND_ASK.Other)}`) + `<p class="fbc-note">Type it below, up to 4,000 characters. I’ll note that you’re on ${esc(pageName())}.</p>`, chips: [{ l: 'Cancel', a: 'fb-cancel', q: 1 }], input: 'msg' }; }
    if (act === 'fb-skip') { f.email = ''; return confirmReply(); }
    if (act === 'fb-edit') { f.step = 'msg'; return { h: P('Sure. Edit it below and send it again.'), chips: [{ l: 'Cancel', a: 'fb-cancel', q: 1 }], input: 'msg', fill: f.message }; }
    if (act === 'fb-copy') { if (SML.feedback) SML.copy(SML.feedback.plain({ kind: f.kind, message: f.message, email: f.email, page: f.page }), 'Note copied'); return { h: P('Copied to your clipboard. I’ll keep it here too, in case you want to try sending again.'), chips: [{ l: 'Try again', a: 'fb-send', p: 1 }, { l: 'Cancel', a: 'fb-cancel', q: 1 }] }; }
    return null;
  }

  /* ---------------- reading a message ---------------- */
  function reply(raw) {
    const t = String(raw || '').trim();
    if (st.fb && st.fb.step !== 'kind' && st.fb.step !== 'confirm' && st.fb.step !== 'failed') return Object.assign(feedbackText(t), { intent: 'feedback' });
    if (st.fb && st.fb.step === 'kind') return Object.assign(feedbackText(t), { intent: 'feedback' });
    if (st.fb && (st.fb.step === 'confirm' || st.fb.step === 'failed')) {
      const w = norm(t);
      if (/^(send|send it|yes|yes please|yep|ok|okay|submit|try again|retry)$/.test(w)) return { sendNow: true, intent: 'feedback' };
      if (/^(edit|edit it|edit my note|change it)$/.test(w)) return Object.assign(fbAct('fb-edit'), { intent: 'feedback' });
      if (/^(cancel|stop|never mind|nevermind|forget it|no)$/.test(w)) return Object.assign(fbAct('fb-cancel'), { intent: 'feedback' });
    }
    const a = analyze(t);
    // "hi, what is vwap": the greeting is not the question
    const lead = a.n.replace(/^((hi|hello|hey|hiya|yo|ok|okay|so|um|please|bunny|thanks|thank you)( there| bunny)?\s+)+(?=\S)/, '');
    if (lead !== a.n && lead.split(' ').length >= 2) { a.n = lead; }
    const nw = a.n ? a.n.split(' ').length : 0;
    if (!a.n) return Object.assign(menuReply('Say that again? I didn’t catch any words.'), { intent: 'empty' });
    for (const it of D().intents || []) {
      if (it.max && nw > it.max) continue;
      if (!(it.patterns || []).some((p) => p.test(a.n))) continue;
      let out = null;
      if (it.do === 'define') out = lookup(t, a, 'define');
      else if (it.do === 'navigate') out = navigate(t, a);
      else if (it.do === 'compare') out = compare(t, a);
      else if (it.do === 'tool') out = H.tool2(t, a);
      else if (it.do === 'when') out = H.when(t, a);
      else if (it.do === 'feedback') out = H.feedback(null, t);
      else if (it.do && H[it.do]) out = H[it.do](t, a);
      else if (it.say) { out = { h: P(esc(typeof it.say === 'function' ? it.say() : it.say)) + actsHTML((it.links || []).map((tok, i) => link(tok, titleOf(tok), i === 0))), chips: typeof it.chips === 'string' ? C(it.chips) : (it.chips || C('after')) }; if (it.links && it.links[0]) st.last = { type: 'page', tok: it.links[0], title: titleOf(it.links[0]) }; }
      if (out) return Object.assign(out, { intent: it.id });
    }
    const out = lookup(t, a, 'search');
    return Object.assign(out, { intent: st.mode ? 'search_' + st.mode : 'search' });
  }

  /* ---------------- the panel ---------------- */
  let built = false, log, form, ta, sendBtn, live, busy = Promise.resolve(), inputMode = null;
  function build() {
    if (built) return; built = true;
    addCss('chat-panel', PANEL_CSS);
    const d = D();
    panel.innerHTML = `<header class="fbc-h"><span class="fbc-hav">${SML.bunnyMark ? SML.bunnyMark(28) : ''}</span><div class="fbc-ht"><h2 id="fbc-title">${esc(d.title || 'Ask Bunny')}</h2><p>${esc(d.subtitle || '')}</p></div>
        <button type="button" class="fbc-ib" data-fbc="restart" aria-label="Start over" title="Start over">${ICON.restart}</button><button type="button" class="fbc-ib" data-fbc="close" aria-label="Close help chat" title="Close">${ICON.close}</button></header>
      <div class="fbc-log" tabindex="-1" aria-label="Conversation"></div>
      <div class="sr" aria-live="polite" aria-atomic="true"></div>
      <form class="fbc-form" novalidate><label class="sr" for="fbc-q">Message Bunny</label><textarea id="fbc-q" rows="1" maxlength="4000" placeholder="${esc(d.placeholder || '')}" autocomplete="off" enterkeyhint="send"></textarea><button type="submit" class="fbc-send" aria-label="Send" disabled>${ICON.send}</button></form>
      <p class="fbc-foot">${esc(d.foot || '')}</p>`;
    panel.removeAttribute('aria-label'); panel.setAttribute('aria-labelledby', 'fbc-title');
    log = panel.querySelector('.fbc-log'); form = panel.querySelector('form'); ta = panel.querySelector('textarea'); sendBtn = panel.querySelector('.fbc-send'); live = panel.querySelector('[aria-live]');
    const grow = () => { ta.style.height = '44px'; ta.style.height = Math.min(132, Math.max(44, ta.scrollHeight + 2)) + 'px'; sendBtn.disabled = !ta.value.trim(); };
    ta.addEventListener('input', grow);
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    function submit() { const v = ta.value.trim(); if (!v) return; ta.value = ''; grow(); user(v, v); }
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('button'); const a = e.target.closest('a[href]');
      if (b && b.dataset.fbc === 'close') { close(true); return; }
      if (b && b.dataset.fbc === 'restart') { restart(); return; }
      if (b && b.classList.contains('fbc-chip')) { chip(b, e.detail === 0); return; }
      if (a && panel.contains(a) && isPhone()) close(false); // the page it opens shows instead of the sheet (the router still handles the click)
    });
    // phones: a modal sheet, so Tab stays inside it (wherever focus is when Tab is pressed)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !isOpen() || !isPhone()) return;
      const f = Array.from(panel.querySelectorAll('button:not([disabled]),a[href],textarea')).filter((x) => x.offsetParent !== null || x.getClientRects().length);
      if (!f.length) return; const first = f[0], last = f[f.length - 1], at = document.activeElement;
      if (!panel.contains(at) || at === panel || at === log) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
    });
    scrim.addEventListener('click', () => close(true));
    // ...and focus that lands outside it (a click on the page behind, the browser's own Tab order) comes back in
    document.addEventListener('focusin', (e) => {
      if (!isOpen() || !isPhone() || panel.contains(e.target)) return;
      if (e.target.tagName === 'TEXTAREA' && e.target.readOnly) return; // SML.copy's hidden helper
      const f = panel.querySelector('textarea') || panel; f.focus({ preventScroll: true });
    });
    renderAll();
  }
  function avatar(ghost) { return `<span class="fbc-av${ghost ? ' ghost' : ''}" aria-hidden="true">${SML.bunnyMark ? SML.bunnyMark(20) : ''}</span>`; }
  function msgEl(m, prev, fresh) {
    const el = document.createElement('div');
    if (m.r === 'u') { el.className = 'fbc-m me'; el.innerHTML = '<div class="fbc-b"></div>'; el.firstChild.textContent = m.t; }
    else { el.className = 'fbc-m bot'; el.innerHTML = avatar(prev && prev.r === 'b') + `<div class="fbc-b">${m.h}</div>`; }
    if (fresh && !reduced()) el.classList.add('fbc-fresh');
    return el;
  }
  function chipsEl(chips) {
    const el = document.createElement('div'); el.className = 'fbc-chips'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Suggested replies');
    el.innerHTML = chips.map((c, i) => `<button type="button" class="fbc-chip${c.p ? ' pri' : ''}${c.q ? ' quiet' : ''}" data-i="${i}">${esc(c.l)}</button>`).join('');
    return el;
  }
  function renderAll() {
    log.innerHTML = '';
    st.msgs.forEach((m, i) => log.appendChild(msgEl(m, st.msgs[i - 1])));
    if (st.chips && st.chips.length) log.appendChild(chipsEl(st.chips));
    setInput(st.fb && (st.fb.step === 'msg' || st.fb.step === 'email') ? st.fb.step : null);
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
  }
  function setInput(mode) {
    inputMode = mode;
    if (!ta) return;
    ta.placeholder = mode === 'msg' ? 'Write your note…' : mode === 'email' ? 'you@example.com (optional)' : (D().placeholder || '');
    ta.setAttribute('inputmode', mode === 'email' ? 'email' : 'text');
    ta.setAttribute('autocomplete', mode === 'email' ? 'email' : 'off');
    ta.setAttribute('aria-label', mode === 'msg' ? 'Your note' : mode === 'email' ? 'Your email, optional' : 'Message Bunny');
  }
  function dropChips() { st.chips = []; log.querySelectorAll('.fbc-chips').forEach((c) => c.remove()); }
  function addUser(t) { dropChips(); const m = { r: 'u', t: String(t).slice(0, 4000) }; log.appendChild(msgEl(m, st.msgs[st.msgs.length - 1], true)); st.msgs.push(m); save(); scrollEnd(); }
  function scrollEnd(el) { // to the bottom, or to the top of a long new message so it reads from its start
    const max = Math.max(0, log.scrollHeight - log.clientHeight);
    const to = el ? Math.min(max, Math.max(0, el.offsetTop - 12)) : max;
    try { log.scrollTo({ top: to, behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { log.scrollTop = to; }
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function botSay(outP, focusChips) {
    const pending = outP && typeof outP.then === 'function';
    let out = pending ? null : outP;
    if (!reduced() || pending) {
      const t = document.createElement('div'); t.className = 'fbc-m bot fbc-typing'; t.setAttribute('aria-hidden', 'true');
      t.innerHTML = avatar(st.msgs.length && st.msgs[st.msgs.length - 1].r === 'b') + '<div class="fbc-b"><i></i><i></i><i></i></div>';
      log.appendChild(t); scrollEnd();
      if (pending) { const r = await Promise.all([outP, sleep(reduced() ? 0 : 450)]); out = r[0]; }
      else await sleep(Math.min(1000, 320 + text(out.h).length * 3));
      t.remove();
    }
    if (!out) out = menuReply();
    const plain = text(out.h);
    const m = { r: 'b', h: out.h };
    const el = msgEl(m, st.msgs[st.msgs.length - 1], true);
    log.appendChild(el); st.msgs.push(m);
    st.chips = out.chips || [];
    let ce = null; if (st.chips.length) { ce = chipsEl(st.chips); log.appendChild(ce); }
    setInput(out.input || null);
    if (out.fill != null && ta) { ta.value = out.fill; ta.dispatchEvent(new Event('input')); }
    save();
    scrollEnd(el.offsetHeight > log.clientHeight * 0.6 ? el : null);
    live.textContent = ''; setTimeout(() => { live.textContent = plain.length > 400 ? plain.slice(0, 399) + '…' : plain; }, 30);
    if (focusChips && ce) ce.querySelector('button').focus();
    else if (inputMode && ta) ta.focus();
    if (out.go) setTimeout(() => go(out.go), reduced() ? 50 : 450);
  }
  function user(shown, raw) {
    addUser(shown);
    busy = busy.then(async () => {
      let out;
      try { out = reply(raw); } catch (e) { console.error('[FiredBunny] help chat', e); out = menuReply('Sorry, I got tangled up there. Could you put it another way?'); }
      if (!out.keep) st.mode = null;
      SML.track('help_chat_reply', { target_type: out.intent || 'search', count: out.n || 0 });
      await botSay(out.sendNow ? sendFeedback() : out);
    });
    return busy;
  }
  function chip(b, viaKeyboard) {
    const c = (st.chips || [])[Number(b.dataset.i)]; if (!c) return;
    log.focus({ preventScroll: true });
    addUser(c.l);
    busy = busy.then(async () => {
      let out = null;
      try {
        if (c.a === 'ask') out = reply(c.v);
        else if (c.a === 'menu') out = H.menu();
        else if (c.a === 'go') { out = goReply(c.v, `Opening ${titleOf(c.v)}.`); }
        else if (c.a === 'search') { out = { h: P(`Searching every lesson for “${esc(c.v)}”.`), chips: C('after') }; setTimeout(() => searchLessons(c.v), reduced() ? 50 : 450); }
        else if (c.a === 'fb-send') out = sendFeedback();
        else if (/^fb-/.test(c.a)) out = fbAct(c.a, c.v);
        else if (c.a === 'feedback') out = H.feedback(c.v);
        else if (H[c.a]) out = H[c.a](c.v);
      } catch (e) { console.error('[FiredBunny] help chat', e); }
      if (!out) out = menuReply('Sure. What would you like to do?');
      if (!out.keep) st.mode = null;
      SML.track('help_chat_reply', { target_type: 'chip_' + c.a, count: out.n || 0 });
      await botSay(out, viaKeyboard);
      if (!viaKeyboard && finePointer() && !isPhone() && isOpen() && ta && document.activeElement !== ta) ta.focus({ preventScroll: true });
    });
  }
  function restart() {
    st = blank(); save(); fbRoute = null;
    log.innerHTML = ''; setInput(null);
    busy = busy.then(() => botSay({ h: P(esc(D().greeting)), chips: C('menu') }));
  }
  function go(tok) {
    if (!exists(tok)) return;
    if (isPhone()) close(false);
    const keep = !isPhone() && isOpen();
    if (keep) { const back = () => { document.removeEventListener('sml:route', back); setTimeout(() => { if (isOpen() && ta) ta.focus({ preventScroll: true }); }, 0); }; document.addEventListener('sml:route', back); }
    if (SML.go) SML.go(tok); else location.hash = tok;
  }
  function searchLessons(q) {
    go('learn');
    let n = 0; const fill = () => { const el = document.getElementById('learn-q'); if (el) { el.value = q; el.dispatchEvent(new Event('input', { bubbles: true })); return; } if (n++ < 30) setTimeout(fill, 50); };
    setTimeout(fill, 30);
  }

  /* ---------------- open and close ---------------- */
  const isOpen = () => !panel.hidden;
  let lastFocus = null;
  function fitSheet() {
    const vv = window.visualViewport; if (!vv || !isOpen() || !isPhone()) { document.documentElement.style.removeProperty('--fbc-vh'); document.documentElement.style.removeProperty('--fbc-kb'); return; }
    document.documentElement.style.setProperty('--fbc-vh', Math.round(vv.height) + 'px');
    document.documentElement.style.setProperty('--fbc-kb', Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) + 'px');
  }
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', fitSheet); window.visualViewport.addEventListener('scroll', fitSheet); }
  function open(how) {
    if (isOpen()) return;
    build();
    if (SML.closeMenu) SML.closeMenu();
    lastFocus = document.activeElement;
    const phone = isPhone();
    panel.hidden = false; panel.setAttribute('aria-modal', phone ? 'true' : 'false');
    scrim.hidden = !phone;
    document.documentElement.classList.add('fbc-open');
    launcher.setAttribute('aria-expanded', 'true'); launcher.setAttribute('aria-label', 'Close help chat');
    if (!reduced()) { panel.classList.remove('fbc-in'); void panel.offsetWidth; panel.classList.add('fbc-in'); }
    fitSheet();
    if (!st.msgs.length) busy = busy.then(() => botSay({ h: P(esc(D().greeting)), chips: C('menu') }));
    else requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
    // focus: the text box with a mouse or keyboard; on touch screens the dialog itself, so the keyboard doesn't jump up
    setTimeout(() => { if (!isOpen()) return; if (finePointer() && !phone) ta.focus({ preventScroll: true }); else panel.focus({ preventScroll: true }); }, 30);
    SML.track('help_chat_open', { method: how || 'launcher', count: st.msgs.length });
  }
  function close(focusBack) {
    if (!isOpen()) return;
    panel.hidden = true; scrim.hidden = true;
    document.documentElement.classList.remove('fbc-open');
    launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-label', 'Ask Bunny: help and feedback');
    fitSheet();
    if (focusBack) launcher.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !isOpen()) return;
    if (isPhone() || panel.contains(e.target) || e.target === launcher) { e.preventDefault(); close(true); }
  });
  // a phone turned sideways (or a window made wider) moves between sheet and card
  try { const mq = window.matchMedia('(max-width: 640px)'); const onMq = () => { if (!isOpen()) return; const ph = isPhone(); panel.setAttribute('aria-modal', ph ? 'true' : 'false'); scrim.hidden = !ph; fitSheet(); }; if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq); } catch (e) {}

  SML.chat = {
    open, close, isOpen,
    toggle: () => (isOpen() ? close(true) : open('api')),
    /** Ask as if typed (opens the panel). Resolves once the reply is shown. */
    ask: (t) => { open('api'); return user(t, t); },
    /** The best matches for some words, for tests and debugging: [{ tok, type, title, score }]. */
    match: (t, prefer) => search(t, prefer).slice(0, 5).map((r) => ({ tok: r.d.tok, type: r.d.type, title: r.d.title, score: Math.round(r.score * 10) / 10, cover: Math.round(r.cover * 100) / 100 })),
    reply: (t) => { const o = reply(t); return { intent: o.intent, text: text(o.h), go: o.go || null }; },
    analyze: (t) => { const a = analyze(t); return { core: a.core, opt: a.opt, fixed: a.fixed, types: Array.from(a.types) }; },
    reset: () => { st = blank(); save(); if (built) renderAll(); },
  };
})();
