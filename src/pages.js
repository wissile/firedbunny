/* Shell, router and the main pages: home, learn, course, lesson, tools, tool, wheel, glossary. Night-desk layout. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $ = SML.$, $$ = SML.$$;
  const BRAND = 'FiredBunny';
  SML.brand = BRAND;

  /* ---------------- data helpers ---------------- */
  const courseOf = (id) => SML.courses.find((c) => c.id === id);
  const lessonsOf = (cid) => SML.lessons.filter((l) => l.course === cid).sort((a, b) => (a.order || 0) - (b.order || 0));
  const TRACKS = () => (SML.tracks && SML.tracks.length ? SML.tracks : [{ id: 'trading', n: 1, title: 'Trading', short: 'Trading', blurb: '' }]);
  const trackById = (id) => TRACKS().find((t) => t.id === id) || TRACKS()[0];
  const coursesOf = (tid) => SML.courses.filter((c) => (c.track || 'trading') === tid).sort((a, b) => a.n - b.n);
  const allLessons = (tid) => (tid ? coursesOf(tid) : TRACKS().flatMap((t) => coursesOf(t.id))).flatMap((c) => lessonsOf(c.id));
  const trackOfCourse = (c) => (c && c.track) || 'trading';
  const trackOfLesson = (l) => trackOfCourse(courseOf(l.course));
  const doneTrack = (tid) => allLessons(tid).filter((l) => SML.progress.isDone(l.id)).length;
  const curTrack = () => { const t = SML.store.get('track', 'trading'); return TRACKS().some((x) => x.id === t) ? t : TRACKS()[0].id; };
  const setTrack = (t) => SML.store.set('track', t);
  SML.trackOfLesson = trackOfLesson;
  const lessonById = (id) => SML.lessons.find((l) => l.id === id);
  const minsOf = (cid) => lessonsOf(cid).reduce((s, l) => s + (l.mins || 0), 0);
  const doneIn = (cid) => lessonsOf(cid).filter((l) => SML.progress.isDone(l.id)).length;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const glossTerm = (t) => SML.glossary.find((g) => g.t === t);
  const nn = (n) => String(n).padStart(2, '0');
  const word = (n) => ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'][n] || String(n);
  const lessonNo = (l) => allLessons(trackOfLesson(l)).indexOf(l) + 1;
  const lvl = (level) => `<span class="lvl${level === 'Intermediate' ? ' int' : level === 'Advanced' ? ' adv' : ''}"><i></i>${esc(level || 'Beginner')}</span>`;
  SML.lvlBadge = lvl;

  const I = (w, body, cls) => `<svg class="ico${cls ? ' ' + cls : ''}" width="${w}" height="${w}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const icons = {
    arrow: I(16, '<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: I(16, '<path d="M19 12H5M11 18l-6-6 6-6"/>'),
    ur: I(16, '<path d="M7 17L17 7M8 7h9v9"/>'),
    play: I(16, '<path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor" stroke="none"/>'),
    check: I(16, '<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    info: I(18, '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5v.5"/>'),
    menu: I(18, '<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: I(18, '<path d="M6 6l12 12M18 6L6 18"/>'),
    calc: I(22, '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>'),
    sheet: I(22, '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5M8 12.5h8M8 16.5h8M12 12.5v6"/>'),
    note: I(22, '<path d="M13.5 3.5h-7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2 2 0 0 1 2.8 2.8L13 13.5l-3.5 1 1-3.5z"/>'),
    phone: I(22, '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18h2"/>'),
    candle: I(22, '<path d="M9 5v3M9 15v4M15 3v4M15 14v7"/><rect x="6.5" y="8" width="5" height="7" rx="1"/><rect x="12.5" y="7" width="5" height="7" rx="1"/>'),
    book: I(22, '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
    gauge: I(22, '<path d="M12 14l4-4"/><path d="M3.5 18a9 9 0 1 1 17 0"/>'),
    cal: I(22, '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M8 17h2"/>'),
  };
  SML.icons = icons;
  const logo = SML.bunnyMark(30);
  const wordmark = SML.wordmark();
  SML.logo = logo;

  /* ---------------- shell ---------------- */
  const NAV = [['learn', 'Lessons'], ['play', 'Playground'], ['tools', 'Tools'], ['calendar', 'Calendar'], ['blog', 'Trade notes'], ['apps', 'Apps'], ['about', 'About']];
  SML.navIndex = (tok) => { const i = NAV.findIndex((n) => n[0] === tok); return i >= 0 ? nn(i + 1) : tok === 'glossary' ? '07' : ''; };
  function section(tok) {
    if (tok === 'learn' || /^[lc]-/.test(tok) || /^track-/.test(tok) || tok === 'assessment' || tok === 'results') return 'learn';
    if (tok === 'dashboard' || tok === 'profile' || tok === 'settings' || tok === 'signin') return 'account';
    if (tok === 'play' || tok === 'wheel') return 'play';
    if (tok === 'tools' || /^tool-/.test(tok) || tok === 'indicator' || tok === 'sheets') return 'tools';
    if (tok === 'blog' || /^post-/.test(tok)) return 'blog';
    return tok;
  }
  function nextLesson(tid) { const ls = allLessons(tid || curTrack()); return ls.find((l) => !SML.progress.isDone(l.id)) || ls[0]; }
  function ctaText() { const t = curTrack(), n = nextLesson(t); if (!n) return ['learn', 'Browse lessons']; const done = doneTrack(t); return [n.id, (done ? 'Continue ' : 'Start ') + trackById(t).short + ' lesson ' + nn(lessonNo(n))]; }
  function buildShell() {
    const header = document.createElement('header');
    header.className = 'nav';
    header.innerHTML = `<div class="wrap">
        <a class="brand" href="#home" aria-label="${BRAND} home">${logo}${wordmark}</a>
        <nav class="nav-links" aria-label="Main">${NAV.map(([t, l]) => `<a href="#${t}" data-sec="${t}">${l}</a>`).join('')}</nav>
        <div class="nav-right"><a class="nav-prog" href="#learn" id="nav-prog" title="Lessons completed"></a><a class="nav-acct" href="#dashboard" id="nav-acct" data-sec="account"></a>
        <button type="button" class="nav-menu" id="nav-menu" aria-expanded="false" aria-controls="drawer" aria-label="Open menu">${icons.menu}</button></div>
      </div>
      <div class="nav-bar" id="nav-bar" role="progressbar" aria-label="Position in the curriculum" aria-valuemin="0" aria-valuemax="100" hidden><i></i></div>
      <nav class="drawer" id="drawer" aria-label="Mobile" hidden><ul>
        ${[['home', 'Home']].concat(NAV, [['dashboard', 'My dashboard'], ['assessment', 'Self-assessment'], ['indicator', 'TradingView indicator'], ['sheets', 'Spreadsheets'], ['glossary', 'Glossary']]).map(([t, l]) => `<li><a class="dl" href="#${t}" data-sec="${t}"><span>${l}</span></a></li>`).join('')}
        <li class="dcta"><a id="drawer-cta" href="#learn"></a></li></ul></nav>`;
    document.body.insertBefore(header, document.body.firstChild);
    const skip = document.createElement('a'); skip.className = 'skip-link'; skip.href = '#home'; skip.textContent = 'Skip to content';
    skip.addEventListener('click', (e) => { e.preventDefault(); $('#view').focus(); });
    document.body.insertBefore(skip, header);
    const menu = $('#nav-menu'), drawer = $('#drawer');
    const setOpen = (open) => { drawer.hidden = !open; menu.setAttribute('aria-expanded', open); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); menu.innerHTML = open ? icons.close : icons.menu; };
    menu.addEventListener('click', () => setOpen(drawer.hidden));
    drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });

    const foot = document.createElement('footer');
    foot.className = 'foot';
    foot.innerHTML = `<div class="wrap">
      <div class="foot-grid">
        <div class="fb"><a class="brand" href="#home" aria-label="${BRAND} home">${logo}${wordmark}</a><p class="fb-tag">Ten years of money lessons, shared free. Learn it early, keep your cool, buy back your time.</p><p>Education only. Nothing here is financial, investment or tax advice. Most charts use simulated prices and most examples use made-up numbers; the Read a Real Company course uses real reported figures, checked October 2026. Trading and investing can lose money, including more than you put in with options or margin.</p></div>
        <div><h4>Learn</h4><nav aria-label="Tracks">${TRACKS().map((t) => `<a href="#track-${t.id}">${esc(t.title)} track</a>`).join('')}<a href="#c-basics">Market Basics</a><a href="#c-options">Options &amp; the Wheel</a><a href="#c-benefits">Company Benefits</a><a href="#c-home">Home &amp; Real Estate</a><a href="#c-fi-basics">Your FIRE Number</a><a href="#c-fi-abroad">Retiring Abroad</a></nav></div>
        <div><h4>Practice</h4><nav aria-label="Practice"><a href="#play">Trade replay</a><a href="#wheel">Wheel simulator</a><a href="#tools">All tools</a>${['tool-size', 'tool-wheel', 'tool-compound', 'tool-rentbuy', 'tool-fire', 'tool-fireplan'].map((id) => SML.tools.find((t) => t.id === id)).filter(Boolean).map((t) => `<a href="#${t.id}">${esc(t.title)}</a>`).join('')}</nav></div>
        <div><h4>FiredBunny</h4><nav aria-label="Resources"><a href="#about">About &amp; feedback</a><a href="#assessment">Investor self-assessment</a><a href="#dashboard">My dashboard</a><a href="#calendar">Market &amp; tax calendar</a><a href="#indicator">TradingView indicator</a><a href="#sheets">Spreadsheets</a><a href="#blog">Trade notes</a><a href="#apps">Apps</a><a href="#glossary">Glossary</a></nav></div>
      </div>
      <div class="foot-base"><span>© 2026 FiredBunny · made with patience, not hype</span><span>Rules and tax figures checked October 2026 (US).</span></div>
    </div>`;
    document.body.appendChild(foot);
    updateCta();
    document.addEventListener('sml:progress', updateCta);
    document.addEventListener('sml:account', updateAcct);
    updateAcct();
  }
  function updateAcct() {
    const el = $('#nav-acct'); if (!el || !SML.account) return;
    const st = SML.account.status; const nm = SML.account.displayName();
    const cloud = st.mode === 'cloud';
    el.title = cloud ? 'Your dashboard (saved to your account)' : 'Your dashboard (saved on this device)';
    el.innerHTML = (st.avatar && st.signedIn ? `<img src="${esc(st.avatar)}" alt="" width="22" height="22">` : SML.bunnyMark(22)) + `<span>${nm ? esc(nm.split(' ')[0]) : (cloud ? 'You' : 'My space')}</span>`;
  }
  function updateCta() {
    const [tok, label] = ctaText();
    const d = $('#drawer-cta'); if (d) { d.href = '#' + tok; d.textContent = label; }
    const el = $('#nav-prog'); if (!el) return;
    const total = allLessons().length, done = SML.progress.count();
    const r = 6.5, c = 2 * Math.PI * r, f = total ? done / total : 0;
    el.href = '#' + tok;
    const nx = nextLesson();
    el.title = done ? `${done} of ${total} lessons done across all tracks. Next: ${nx ? nx.title : ''}.` : `${total} lessons in ${TRACKS().length} tracks. Start with ${nx ? nx.title : 'lesson 01'}.`;
    el.innerHTML = `<svg class="ring" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="${r}" class="nf s-line w25"/><circle cx="8" cy="8" r="${r}" class="nf s-up w25" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 8 8)"/></svg><span>${done}/${total}</span><span class="sr"> lessons done</span>`;
  }

  /* ---------------- shared building blocks ---------------- */
  const progBar = (d, t) => `<div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="${t}" aria-valuenow="${d}" aria-label="${d} of ${t} lessons done"><i style="--w:${pct(d, t)}%"></i></div>`;
  const kicker = (idx, text) => `<p class="kicker"><i></i><span>${text}</span></p>`;
  SML.kicker = kicker;
  /* PageHeader: idx, kicker, title html, side html (description + extras) */
  const pageHeader = (idx, kick, title, side) => `<header class="page-hdr"><div class="wrap">${kicker(idx, kick)}<div class="ph-row"><h1 class="h-page">${title}</h1>${side ? `<div class="ph-side">${side}</div>` : ''}</div></div></header>`;
  SML.pageHeader = pageHeader;
  /* ChapterHeading */
  const chapHead = (n, title, sub, action, id) => `<div class="chap-head"><div class="ch-l">${n ? `<span class="ch-n" aria-hidden="true">${n}</span>` : ''}<div class="ch-t"><h2${id ? ` id="${id}"` : ''}>${n ? `<span class="sr">Chapter ${n}: </span>` : ''}${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div></div>${action || ''}</div>`;
  SML.chapHead = chapHead;
  const more = (href, text) => `<a class="more" href="${href}">${text}${icons.arrow}</a>`;
  SML.more = more;
  const plate = (title, stage, body, href) => `<${href ? `a href="${href}"` : 'article'} class="plate"><div class="plate-stage">${stage}</div><div class="plate-b"><h3 class="plate-t">${title}</h3>${body ? `<div class="plate-p">${body}</div>` : ''}</div></${href ? 'a' : 'article'}>`;
  SML.plate = plate;

  function courseTile(c) {
    const ls = lessonsOf(c.id), d = doneIn(c.id);
    return `<li><a class="tile" href="#c-${c.id}"><span class="tile-top"><span class="tile-n">${nn(c.n)}</span><span class="meta">${ls.length} lessons</span></span><span class="tile-t">${esc(c.title)}</span><span class="tile-p">${esc(c.blurb)}</span>${d ? `<span style="margin-top:auto;display:flex;flex-direction:column;gap:6px"><span class="meta up">${d} of ${ls.length} done</span>${progBar(d, ls.length)}</span>` : ''}</a></li>`;
  }
  function tabGroup(tabs) {
    return `<div class="tabgrp"><div class="tabs" role="tablist">${tabs.map((t, i) => `<button type="button" class="tab${i === 0 ? ' on' : ''}" role="tab" aria-selected="${i === 0}" data-i="${i}"><span class="n">${t.n}</span>${t.label}</button>`).join('')}</div>
      ${tabs.map((t, i) => `<div class="tabpanel" role="tabpanel" data-i="${i}"${i ? ' hidden' : ''}><div class="tab-cap"><p>${t.cap}</p>${more('#' + t.l, 'Full lesson')}</div><div class="slot" data-k="${t.k}"></div></div>`).join('')}</div>`;
  }
  function trackCard(t) {
    const cs = coursesOf(t.id), ls = allLessons(t.id), d = doneTrack(t.id);
    return `<a class="plate trk-card" href="#track-${t.id}"><div class="plate-stage">${SML.trackIllo ? SML.trackIllo(t.id) : ''}</div><div class="plate-b">
      <p class="meta"><span>Track ${nn(t.n)}</span><span>${cs.length} courses</span><span>${ls.length} lessons</span></p>
      <h3 class="trk-t">${esc(t.title)}</h3>${t.full ? `<p class="trk-full">${esc(t.full)}</p>` : ''}<p class="plate-p">${esc(t.blurb)}</p>
      <ul class="trk-list">${cs.map((c) => `<li>${esc(c.title)}</li>`).join('')}</ul>
      ${d ? `<div class="trk-done">${progBar(d, ls.length)}<span class="meta up">${d} of ${ls.length} done</span></div>` : ''}
      <span class="more trk-go">${d ? 'Continue' : 'Start'} the track ${icons.arrow}</span></div></a>`;
  }
  SML.css(`.trk3{display:grid;gap:20px;grid-template-columns:1fr}@media(min-width:1024px){.trk3{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .trk-t{font-family:var(--display);font-weight:400;font-size:clamp(34px,3.6vw,44px);line-height:.95;text-transform:uppercase;color:var(--ink)}
    .trk-full{font:500 11px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
    .trk-list{list-style:none;display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
    .trk-list li{font:500 12px/1.2 var(--mono);color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:5px 10px}
    .trk-done{display:flex;flex-direction:column;gap:6px;margin-top:6px}
    .trk-go{margin-top:auto;padding-top:10px}
    .navchip .nc-m{font:500 11px var(--mono);color:var(--muted);letter-spacing:.06em}
    .trk-tabs{border-bottom:1px solid var(--line)}
    .trk-tabs ul{list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding-block:20px}
    @media(max-width:767px){.trk-tab{flex-direction:column;align-items:flex-start;gap:6px;padding:10px 12px}.trk-tab .tt-n{font-size:28px}.trk-tab small{display:none}.trk-tab b{font-size:13.5px}}
    .trk-tab{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);text-decoration:none;color:inherit;min-width:0;transition:border-color .15s,background-color .15s}
    .trk-tab:hover{border-color:color-mix(in srgb,var(--accent) 50%,transparent);background:var(--surface-2)}
    .trk-tab.on{border-color:var(--accent);background:var(--surface-2);box-shadow:inset 0 -3px 0 var(--accent)}
    .trk-tab .tt-n{font-family:var(--display);font-size:40px;line-height:.85;color:var(--muted)}
    .trk-tab.on .tt-n{color:var(--accent)}
    .trk-tab .tt-b{display:flex;flex-direction:column;gap:4px;min-width:0}
    .trk-tab b{font-weight:600;color:var(--ink);font-size:16px;line-height:1.25}
    .trk-tab small{font:500 11px/1.35 var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:uppercase}`);
  function toolTile(t) {
    return `<li><a class="tile" href="#${t.id}"><span class="tile-top"><span class="tool-ic">${SML.toolIcon(t.icon)}</span><span class="tag">${esc(t.cat)}</span></span><span class="tile-t">${esc(t.title)}</span><span class="tile-p">${esc(t.blurb)}</span></a></li>`;
  }
  function fmtDate(d, long) { try { const t = new Date(d + 'T12:00:00'); return t.toLocaleDateString('en-US', long ? { month: 'long', day: 'numeric', year: 'numeric' } : { month: 'short', day: '2-digit', year: 'numeric' }); } catch (e) { return d || ''; } }
  SML.fmtDate = fmtDate;
  SML.css(`.tiles.t5{grid-template-columns:1fr}@media(min-width:640px){.tiles.t5{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(min-width:1100px){.tiles.t5{grid-template-columns:repeat(5,minmax(0,1fr))}}
    .split2{display:grid;gap:32px;grid-template-columns:1fr;align-items:start}
    @media(min-width:1024px){.split2{grid-template-columns:minmax(0,4fr) minmax(0,7fr);gap:48px}}
    .split2 .side{display:flex;flex-direction:column;gap:18px}
    .split2 .side p{color:var(--muted);font-size:17px;line-height:1.65;max-width:42ch}
    .keep{display:grid;gap:20px;grid-template-columns:1fr;margin-top:20px}
    @media(min-width:1024px){.keep{grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)}}
    .notes{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);display:flex;flex-direction:column;min-width:0}
    .notes h3{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid var(--line)}
    .notes h3 span{font:600 11px var(--mono);letter-spacing:.22em;text-transform:uppercase;color:var(--ink)}
    .notes ul{list-style:none}
    .notes li + li{border-top:1px solid var(--line)}
    .notes a.nr{display:flex;align-items:flex-start;gap:16px;padding:16px 20px;text-decoration:none;color:inherit;transition:background-color .15s}
    .notes a.nr:hover{background:var(--surface-2)}
    .notes a.nr:hover b{color:var(--accent)}
    .notes .nr b{display:block;font-weight:600;line-height:1.35}
    .notes .nr small{display:block;margin-top:4px;font-size:14px;line-height:1.55;color:color-mix(in srgb,var(--ink) 60%,transparent)}
    .learn-tools{display:flex;flex-direction:column;gap:14px}
    .sumbox{display:flex;align-items:flex-end;gap:16px}
    .sumbox b{font-family:var(--display);font-weight:400;font-size:56px;line-height:.85;color:var(--accent)}
    .sumbox div{flex:1;display:flex;flex-direction:column;gap:8px;padding-bottom:4px}
    .results{border-top:1px solid var(--line)}
    .tool-sec{display:flex;flex-direction:column;gap:24px;padding-block:48px 80px}
    .tool-sec .chap-head{margin-bottom:0}
    .ap-lineup{list-style:none}
    .nf-box{padding-block:96px;display:flex;flex-direction:column;gap:20px;align-items:flex-start}
    .tabpanel{min-width:0}
    .tab-cap{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:baseline;justify-content:space-between;margin-bottom:14px}
    .tab-cap p{color:var(--muted);max-width:60ch}
    .ico{display:inline-block;vertical-align:-3px;flex:0 0 auto}
    .brand .fb-wm,.brand .fb-wm span{font-family:var(--sans);text-transform:none;letter-spacing:-.02em;padding-top:0;line-height:1}
    .brand .fb-wm{font-size:20px}
    .brand .fb-mark{width:30px;height:30px}
    .nav-acct{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:0 12px 0 6px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font:600 12.5px/1 var(--sans);color:var(--ink);text-decoration:none;white-space:nowrap;transition:border-color .15s,background-color .15s}
    .nav-acct img{width:22px;height:22px;border-radius:50%;object-fit:cover}
    .nav-acct .fb-mark{filter:none;width:22px;height:22px}
    .nav-acct:hover,.nav-acct.on{border-color:color-mix(in srgb,var(--flame) 60%,transparent);background:var(--surface-2)}
    @media(max-width:560px){.nav-acct span{display:none}.nav-acct{padding:0 6px}.brand .fb-wm{font-size:18px}}
    @media(max-width:380px){.nav-prog span:not(.sr){font-size:11px}.nav-prog{padding:0 9px 0 8px}}
    .hero-bun{display:flex;align-items:center;gap:16px;margin-top:24px;max-width:600px;padding:10px 16px 10px 10px;border:1px solid color-mix(in srgb,var(--flame) 35%,var(--line));border-radius:var(--r);background:color-mix(in srgb,var(--flame) 6%,var(--surface));text-decoration:none;color:var(--ink);transition:border-color .15s}
    .hero-bun:hover{border-color:var(--flame)}
    .hero-bun img{width:96px;height:64px;object-fit:contain;border-radius:4px;flex:0 0 auto}
    .hero-bun b{display:block;font-weight:600;line-height:1.3}
    .hero-bun small{display:block;color:var(--muted);font-size:13.5px;line-height:1.45;margin-top:3px}
    .hero-bun .ico{margin-left:auto;color:var(--flame);flex:0 0 auto}
    .assess-ban{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px 20px;align-items:center;margin-top:24px;padding:14px;border:1px solid color-mix(in srgb,var(--flame) 35%,var(--line));border-radius:var(--r);background:linear-gradient(100deg,color-mix(in srgb,var(--flame) 9%,var(--surface)),var(--surface) 60%);text-decoration:none;color:var(--ink);transition:border-color .15s}
    .assess-ban:hover{border-color:var(--flame)}
    .assess-ban img{width:132px;height:88px;object-fit:contain;border-radius:4px}
    .assess-ban .ab-b{display:flex;flex-direction:column;gap:4px;min-width:0}
    .assess-ban .ab-k{font:600 11px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--flame)}
    .assess-ban b{font-family:var(--display);font-weight:400;font-size:clamp(26px,3vw,34px);line-height:1;text-transform:uppercase}
    .assess-ban small{color:var(--muted);font-size:14px;line-height:1.5}
    .assess-ban .btn{grid-column:1 / -1;justify-self:start}
    @media(min-width:860px){.assess-ban{grid-template-columns:auto minmax(0,1fr) auto}.assess-ban .btn{grid-column:auto}}
    @media(max-width:520px){.assess-ban img{width:88px;height:59px}}
    .foot-grid .fb p.fb-tag{font-size:15px;color:var(--ink);max-width:40ch}
    .tools-trk .tiles{display:flex;flex-wrap:wrap}
    .tools-trk .tiles > li{flex:1 1 340px}
    .src-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:14px;font-size:14.5px;line-height:1.45}
    .src-list a{color:var(--text);text-decoration:underline;text-decoration-color:var(--input);text-underline-offset:3px;overflow-wrap:anywhere}
    .src-list a:hover{color:var(--accent);text-decoration-color:var(--accent)}
    #sec-src .note{margin-top:12px}`);

  /* ---------------- home ---------------- */
  function illo(kind) {
    if (kind === 'learn') {
      let b = S.line(60, 26, 60, 124, 'wk up') + S.rect(46, 46, 28, 52, 'bd up', 2);
      b += S.line(80, 26, 112, 26, 's-mut') + S.text(118, 30, 'high', 'md ink');
      b += S.line(80, 46, 112, 46, 's-mut') + S.text(118, 50, 'close', 'md ink');
      b += S.line(80, 98, 112, 98, 's-mut') + S.text(118, 102, 'open', 'md ink');
      b += S.line(80, 124, 112, 124, 's-mut') + S.text(118, 128, 'low', 'md ink');
      b += S.rect(186, 58, 110, 34, 'f-up-t s-up w15', 17) + S.text(241, 80, 'buyers won', 'md up b', 'middle');
      return S.box(320, 150, 'A labelled candle from a lesson', b);
    }
    if (kind === 'play') {
      const y = SML.lin(97, 105, 128, 16);
      const d = [[99.2, 99.9, 98.8, 99.6], [99.6, 100.3, 99.3, 100.1], [100.1, 100.4, 99.6, 99.8], [99.8, 101.8, 99.7, 101.6], [101.6, 101.9, 100.9, 101.1], [101.1, 102.6, 101.0, 102.4], [102.4, 103.6, 102.2, 103.4], [103.4, 104.2, 103.1, 103.9]].map((a) => ({ o: a[0], h: a[1], l: a[2], c: a[3] }));
      const x = (i) => 40 + i * 32;
      let b = S.level(y(100.6), 20, 270, '', 's-acc') + S.candles(d, x, 16, y);
      b += S.line(x(4) - 12, y(100.4), 270, y(100.4), 's-dn dash2') + S.text(274, y(100.4) + 4, 'stop', 'sm dn b');
      b += S.badge(x(4), y(100.9) + 16, 'B') + S.rect(204, 8, 70, 22, 'f-up', 11) + S.text(239, 23, '+2.4R', 'sm mono b on', 'middle');
      return S.box(320, 150, 'A practice trade on the simulator: buy on a retest with a stop under the level', b);
    }
    let b = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) b += S.rect(24 + c * 46, 22 + r * 22, 46, 22, r === 0 ? 'f-shade2 s-line' : 'f-surf s-line');
    ['Date', 'Entry', 'Exit', 'R'].forEach((t, i) => { b += S.text(30 + i * 46, 37, t, 'xs b ink'); });
    ['+1.8R', '−1R', '+2.1R', '+0.6R'].forEach((t, i) => { b += S.text(204, 59 + i * 22, t, 'xs mono b ' + (t[0] === '+' ? 'up' : 'dn'), 'end'); });
    b += S.rect(232, 14, 64, 124, 'f-shade2', 12) + S.rect(237, 26, 54, 100, 'f-bg', 4);
    b += S.poly([[242, 108], [254, 96], [264, 102], [274, 80], [286, 66]], 's-up w2');
    b += S.text(264, 46, '$1,240', 'xs mono b ink', 'middle') + S.text(264, 57, 'premium', 'xs', 'middle');
    return S.box(320, 150, 'A trade journal spreadsheet next to a phone app', b);
  }
  SML.illo = illo;
  function aiIllo(kind) {
    let b = '';
    if (kind === 'agent') {
      [['You', 14, 'f-surf s-line', 'ink'], ['AI', 92, 'f-vio-t s-vio', 'vio'], ['MCP', 170, 'f-surf s-line', 'ink'], ['Broker', 248, 'f-acc-t s-acc', 'acc']].forEach(([t, x, c, tc]) => { b += S.rect(x, 52, 60, 36, c + ' w15', 6) + S.text(x + 30, 75, t, 'md b ' + tc, 'middle'); });
      [74, 152, 230].forEach((x) => { b += S.arrow(x + 1, 70, x + 17, 70, 'mut', 6); });
      b += S.rect(150, 104, 120, 26, 'f-up-t s-up w15', 13) + S.text(210, 121, 'approve? yes', 'sm up b', 'middle');
      b += S.text(160, 34, 'one order, checked by your rules', 'sm', 'middle');
      return S.box(320, 150, 'You, an AI agent, an MCP server and a broker in a row, with an approval step', b);
    }
    if (kind === 'bt') {
      const p = SML.data.walk(21, 80, { start: 100, vol: 1.1, drift: 0.25 }); const q = p.map((v, i) => (i < 52 ? v : p[51] + (v - p[51]) * -0.35));
      const x = SML.lin(0, 79, 16, 304), y = SML.lin(Math.min(...q) - 3, Math.max(...q) + 3, 128, 18);
      b += S.rect(x(52), 12, 304 - x(52), 122, 'f-dn-t', 0, ' opacity=".6"') + S.line(x(52), 12, x(52), 134, 's-mut dash2');
      b += S.poly(q.map((v, i) => [x(i), y(v)]), 's-acc w25') + S.text(x(26), 146, 'in-sample', 'xs', 'middle') + S.text(x(66), 146, 'out-of-sample', 'xs dn b', 'middle');
      return S.box(320, 150, 'An equity curve that rises in-sample and fades out-of-sample', b);
    }
    if (kind === 'pine') {
      b += S.rect(12, 14, 140, 122, 'f-bg s-line', 6);
      ['//@version=6', 'indicator("Levels")', 'pdh = request...', 'plot(pdh)', 'alertcondition(...)'].forEach((t, i) => { b += S.text(22, 36 + i * 20, t, 'xs mono ' + (i === 0 ? 'mut' : i === 4 ? 'vio' : 'info')); });
      const y = SML.lin(97, 104, 128, 24); const d = [[99, 99.8, 98.7, 99.5], [99.5, 100.6, 99.3, 100.4], [100.4, 100.7, 99.9, 100.1], [100.1, 102.2, 100.0, 101.9], [101.9, 103.0, 101.6, 102.7]].map((a) => ({ o: a[0], h: a[1], l: a[2], c: a[3] }));
      b += S.line(166, y(101), 308, y(101), 's-acc w15 dash') + S.candles(d, (i) => 186 + i * 26, 12, y) + S.polygon([[264, y(100) + 4], [259, y(100) + 13], [269, y(100) + 13]], 'f-up');
      return S.box(320, 150, 'Pine Script code next to the chart it draws', b);
    }
    [['8-K', 'DEMO raises guidance', 'up'], ['NEWS', 'ACME CEO steps down', 'dn'], ['CPI', 'Inflation 0.2% m/m', 'info']].forEach(([t, h, c], i) => { const y0 = 16 + i * 40; b += S.rect(12, y0, 196, 32, 'f-surf s-line', 4) + S.text(22, y0 + 20, t, 'xs mono b acc') + S.text(58, y0 + 20, h, 'sm ink'); b += S.arrow(212, y0 + 16, 236, y0 + 16, 'mut', 6) + S.circle(254, y0 + 16, 9, 'f-' + c); });
      b += S.text(254, 144, 'score', 'xs', 'middle');
    return S.box(320, 150, 'Headlines flowing into an AI that scores each one', b);
  }

  SML.pages.home = function (view) {
    const tk = ['VWAP', 'PDH', 'Delta', 'Theta', 'RSI', 'EMA', 'Breakout', 'IV crush', 'Wheel', 'Wash sale', '401(k)', 'Roth IRA', 'HSA', 'ESPP', 'Compound interest', 'FIRE number', '4% rule', 'Coast FIRE', 'Geographic arbitrage'].map(glossTerm).filter(Boolean);
    const tkHTML = tk.map((g, i) => `<a class="tk" href="#${g.l}"><i class="${i % 3 === 1 ? 'dn' : 'up'}">${i % 3 === 1 ? '▼' : '▲'}</i><b>${esc(g.t)}</b>${esc(g.full || g.d.split('.')[0])}</a>`).join('');
    const nL = allLessons().length || 41, nT = SML.tools.length;
    const first = allLessons('trading')[0];
    const pickTools = (ids) => ids.map((id) => SML.tools.find((t) => t.id === id)).filter(Boolean);
    const plan = [
      { k: 'compoundPlus', n: '01', label: 'Compound interest', cap: 'Your age, your money, your return. See what it grows into, and what waiting ten years costs.', l: 'l-compound' },
      { k: 'habitCost', n: '02', label: 'What habits cost', cap: 'A daily coffee or a box of pods, priced per year and invested for decades.', l: 'l-latte' },
      { k: 'fireNumber', n: '03', label: 'Your FIRE number', cap: 'Spending, withdrawal rate and other income: the number that makes work optional.', l: 'l-fire-number' },
      { k: 'rentVsBuy', n: '04', label: 'Rent or buy', cap: 'Net worth from buying versus renting and investing the difference, year by year.', l: 'l-rent-vs-buy' },
    ];
    const tabs = [
      { k: 'candleBuilder', n: '01', label: 'Build a candle', cap: 'Drag open, high, low and close. The candle tells you who won.', l: 'l-candles' },
      { k: 'breakoutSim', n: '02', label: 'Spot a fake breakout', cap: 'Step candle by candle and decide: enter or wait?', l: 'l-breakouts' },
      { k: 'onePct', n: '03', label: 'Survive a losing streak', cap: 'See why pros risk about 1% per trade.', l: 'l-one-percent' },
      { k: 'optionPayoff', n: '04', label: 'Price an option', cap: 'Drag the stock price and watch a call or put make or lose money.', l: 'l-payoff' },
    ];
    const posts = SML.posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
    const kit = [['#dashboard', icons.gauge, 'Your dashboard', 'Goals, net worth, household income, lesson progress and your investor profile over time.'], ['#calendar', icons.cal, 'Market & tax calendar', 'Fed meetings, CPI, jobs, PMI, options expiry, tax deadlines and open enrollment, with export.'], ['#indicator', icons.candle, 'TradingView indicator', 'Draw the key levels, VWAP and EMA ribbon on your own charts, with alerts.'], ['#sheets', icons.sheet, 'Spreadsheets', 'Trade journal, wheel tracker, retirement planner and watchlist.'], ['#apps', icons.phone, 'Mobile apps', 'Wheel tracker, retirement runway and trader toolkit, in development.'], ['#glossary', icons.book, 'Glossary', `${SML.glossary.length} terms in plain English, each linked to its lesson.`]];
    view.innerHTML = `
      <div class="ticker" aria-label="Terms you will learn"><div class="ticker-track">${tkHTML}${tkHTML.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ')}</div></div>
      <section class="hero" aria-labelledby="hero-title"><div class="wrap">
        <p class="eyebrow">${SML.flame(13)} FiredBunny · the money school they skipped</p>
        <h1 class="h-hero" id="hero-title" style="margin-top:14px">Learn the market by <em>playing</em> with it.</h1>
        <p class="lede">Every idea is a picture you can touch. Drag a candle, step through a breakout, run a thousand trades in a second. Then plan your retirement, or your early exit, with the same hands-on tools. Ten years of lessons, shared free by a bunny who learned most of it the hard way.</p>
        <ul class="navchips" aria-label="Tracks">${TRACKS().map((t) => `<li><a class="navchip" href="#track-${t.id}"><i>${nn(t.n)}</i>${esc(t.title)}<span class="nc-m">${allLessons(t.id).length} lessons</span></a></li>`).join('')}</ul>
        <div style="display:flex;flex-wrap:wrap;gap:20px 32px;align-items:center;margin-top:28px">
          <div class="hero-facts"><span><b>${nL}</b>picture lessons</span><span><b>${nT}</b>tools</span><span><b>${TRACKS().length}</b>tracks</span></div>
        </div>
        <a class="hero-bun" href="#assessment"><img src="${SML.brandArt}" alt="" width="120" height="80"><span><b>New: what kind of investor are you?</b><small>Slide through the self-assessment and get your investor profile, risk level and a learning path.</small></span>${icons.arrow}</a>
        <p class="disclaimer" style="margin-top:32px"><strong>Read this first:</strong> education only, not financial or tax advice. Most new traders lose money. The <a href="#c-risk" style="color:var(--ink)">Risk &amp; Sizing</a> course is what keeps you in the game.</p>
      </div></section>

      <section class="chapter" aria-labelledby="ch-play"><div class="wrap">
        ${chapHead('01', 'Play with an idea', 'Four lessons in miniature. Pick one and start touching things.', more('#learn', 'All lessons'), 'ch-play')}
        ${tabGroup(tabs)}
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ch-how"><div class="wrap">
        ${chapHead('02', 'Learn it. Play it. Track it.', 'Three steps, the same for every topic.', '', 'ch-how')}
        <div class="g3">
          ${plate('Learn with pictures', illo('learn'), 'Each lesson is a single idea, a drawing you can play with, and a two-minute quiz.', '#learn')}
          ${plate('Practise with fake money', illo('play'), 'Replay a trading day bar by bar or run the wheel strategy month by month. Mistakes are free here.', '#play')}
          ${plate('Track your real trades', illo('track'), 'Copy our journal and wheel tracker into Google Sheets or Excel. Phone apps are on the way.', '#sheets')}
        </div>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ch-courses"><div class="wrap">
        ${chapHead('03', `${word(TRACKS().length)} tracks, one school`, `${SML.courses.length} courses and ${nL} lessons. Trade the market, build wealth for retirement, or plan your early exit.`, more('#learn', 'Browse all lessons'), 'ch-courses')}
        <div class="trk3">${TRACKS().map(trackCard).join('')}</div>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ch-plan"><div class="wrap">
        ${chapHead('04', 'Play with your future', 'Four money questions everyone asks, answered with numbers you can drag.', more('#track-wealth', 'Retirement & Wealth track'), 'ch-plan')}
        ${tabGroup(plan)}
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ch-tools"><div class="wrap">
        ${chapHead('05', 'Tools that show their work', 'Every result comes with a picture of why.', more('#tools', 'All tools'), 'ch-tools')}
        <ul class="tiles t4">${pickTools(['tool-size', 'tool-options', 'tool-wheel', 'tool-match', 'tool-rentbuy', 'tool-fire', 'tool-cities']).map(toolTile).join('')}<li><a class="tile primary" href="#tools"><span class="tile-big">${nT} tools</span><span>See them all ${icons.arrow}</span></a></li></ul>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ch-ai"><div class="wrap">
        ${chapHead('06', 'Trade smarter with AI', 'Research, automation, backtesting and indicators, with the guardrails that keep you safe.', more('#c-ai', 'The AI course'), 'ch-ai')}
        <div class="g4">
          ${plate('Automate with an AI agent', aiIllo('agent'), 'Connect Claude to Robinhood’s official MCP server step by step, with a budget account and approvals on.', '#l-ai-automate')}
          ${plate('Backtest before you trust', aiIllo('bt'), 'Test rules on years of data and see how overfitting fools you out of sample.', '#l-backtest')}
          ${plate('Build an indicator with AI', aiIllo('pine'), 'Turn plain rules into TradingView Pine Script, fix errors and add alerts.', '#l-ai-pine')}
          ${plate('Read the news with AI', aiIllo('news'), 'Turn filings and headlines into short, structured alerts, and spot prompt injection.', '#l-ai-news')}
        </div>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ch-style"><div class="wrap">
        ${chapHead('07', 'Find your style', 'Day trader, swing trader or investor? Most people end up with a blend.', more('#l-blend', 'How blending works'), 'ch-style')}
        <div class="split2"><div class="side"><p>Answer five quick questions and get a suggested mix of styles, with the lessons to start with. Want the full picture? The self-assessment looks at your goals, money, time and temperament, and gives you a profile you can track over the years.</p><a class="btn btn-p" href="#assessment" style="align-self:flex-start">Take the self-assessment ${icons.arrow}</a>${more('#l-styles', 'Compare the styles')}</div>${SML.widgetHTML('styleQuiz')}</div>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ch-keep"><div class="wrap">
        ${chapHead('08', 'Keep going', 'Practise, track and read real-style breakdowns.', '', 'ch-keep')}
        <div class="keep">
          <ul class="tiles">${kit.map(([h, ic, t, d]) => `<li><a class="tile" href="${h}"><span class="tile-ic">${ic}</span><span class="tile-t">${t}</span><span class="tile-p">${d}</span></a></li>`).join('')}</ul>
          <div class="notes"><h3><span>Latest trade notes</span>${more('#blog', 'All')}</h3>
            <ul>${posts.map((p) => `<li><a class="nr" href="#${p.id}"><span class="tag" style="margin-top:2px">${esc(p.tag || 'Post')}</span><span style="flex:1;min-width:0"><b>${esc(p.title)}</b><small>${esc(p.excerpt || '')}</small></span></a></li>`).join('') || '<li style="padding:20px" class="note">Posts are on the way.</li>'}</ul></div>
        </div>
      </div></section>`;

    $$('.tabgrp', view).forEach((grp) => {
      const panels = $$('.tabpanel', grp), tbtns = $$('.tab', grp);
      const show = (i) => {
        tbtns.forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); });
        panels.forEach((p, j) => { p.hidden = j !== i; });
        const slot = panels[i].querySelector('.slot');
        if (!slot.dataset.done) { slot.dataset.done = '1'; slot.innerHTML = SML.widgetHTML(slot.dataset.k); SML.mount(slot); }
      };
      tbtns.forEach((b, i) => b.addEventListener('click', () => show(i)));
      show(0);
    });
    return 'Learn the market by playing with it';
  };

  /* ---------------- learn ---------------- */
  function lessonRowHTML(l, showCourse) {
    const c = courseOf(l.course); const done = SML.progress.isDone(l.id);
    return `<li><a class="lrow" href="#${l.id}"><span class="no">${nn(lessonNo(l))}</span><span style="min-width:0"><span class="t">${esc(l.title)}</span><span class="s">${showCourse && c ? esc(c.title) + ' · ' : ''}${esc(l.summary || '')}</span><span class="m">${lvl(l.level)}<span>${l.mins || 4} min</span>${done ? '<span class="up">Completed</span>' : ''}</span></span><span class="circ${done ? ' done' : ' go'}">${done ? icons.check : icons.ur}</span></a></li>`;
  }
  function trackSection(c, headTag) {
    const ls = lessonsOf(c.id), d = doneIn(c.id);
    const H = headTag || 'h2';
    return `<section class="track" id="trk-${c.id}" data-c="${c.id}" aria-labelledby="t-${c.id}">
      <div class="track-side"><div>
        <p class="track-n" aria-hidden="true">${nn(c.n)}</p>
        <p class="track-tag">${esc(c.level)} · ${ls.length} lessons · ${minsOf(c.id)} min</p>
        <${H} id="t-${c.id}">${esc(c.title)}</${H}>
        <p class="d">${esc(c.blurb)}</p>
        ${d ? progBar(d, ls.length) + `<p class="meta up" style="margin-top:8px">${d} of ${ls.length} done</p>` : ''}
      </div></div>
      <ol class="lrows">${ls.length ? ls.map((l) => lessonRowHTML(l)).join('') : '<li class="note" style="padding:24px 0">Lessons for this course are on the way.</li>'}</ol>
    </section>`;
  }
  function trackTabs(active) {
    return `<nav class="trk-tabs" aria-label="Tracks"><div class="wrap"><ul>${TRACKS().map((t) => { const n = allLessons(t.id).length, d = doneTrack(t.id), on = t.id === active; return `<li><a href="#track-${t.id}" class="trk-tab${on ? ' on' : ''}"${on ? ' aria-current="page"' : ''}><span class="tt-n" aria-hidden="true">${nn(t.n)}</span><span class="tt-b"><b>${esc(t.title)}</b><small>${coursesOf(t.id).length} courses · ${n} lessons${d ? ` · ${d} done` : ''}</small></span></a></li>`; }).join('')}</ul></div></nav>`;
  }
  function assessBanner() {
    const sum = SML.account ? SML.account.get().assessmentSummary : [];
    const last = sum && sum.length ? sum[sum.length - 1] : null;
    return `<section class="wrap" aria-label="Self-assessment"><a class="assess-ban" href="#${last ? 'results' : 'assessment'}">
      <img src="${SML.brandArt}" alt="" width="132" height="88">
      <span class="ab-b"><span class="ab-k">Self-assessment</span><b>${last ? `Your investor profile: ${esc(last.name || 'see results')}` : 'What kind of investor are you?'}</b><small>${last ? `Taken ${SML.fmtDate(String(last.date).slice(0, 10))}. Retake it any time and track how you change.` : 'Seven quick sections with sliders: goals, money, time, risk and temperament. Get your profile, best-fit styles, risk level and a learning path.'}</small></span>
      <span class="btn btn-p">${last ? 'See my results' : 'Start'} ${icons.arrow}</span></a></section>`;
  }
  function learnPage(view, tid) {
    setTrack(tid);
    const T = trackById(tid), cs = coursesOf(tid), ls = allLessons(tid);
    const total = ls.length, done = doneTrack(tid), next = nextLesson(tid);
    const hrs = Math.round(ls.reduce((s, l) => s + (l.mins || 0), 0) / 6) / 10;
    const levels = ['All'].concat(['Start here', 'Beginner', 'Essential', 'Intermediate', 'Advanced'].filter((v) => cs.some((c) => c.level === v)));
    view.innerHTML = `
      ${pageHeader('', `Track ${nn(T.n)} · ${esc(T.title)}`, `${word(cs.length)} courses. <em>${total}</em> lessons.`, `<p>${esc(T.blurb)} Each lesson is one idea you can play with, then a quick check. About ${hrs} hours in all.</p>
        <div class="learn-tools"><div class="sumbox"><b>${done}/${total}</b><div><span class="meta">Done in this browser</span>${progBar(done, total)}</div></div>
        ${next ? `<a class="btn btn-p" href="#${next.id}" style="align-self:flex-start">${done ? 'Continue' : 'Start'}: ${esc(next.title)} ${icons.arrow}</a>` : ''}</div>`)}
      ${trackTabs(tid)}
      ${assessBanner()}
      <nav class="trackbar" aria-label="Courses"><div class="wrap"><ul class="scroll">${cs.map((c) => `<li><button type="button" data-go="${c.id}"><i>${nn(c.n)}</i>${esc(c.title)}</button></li>`).join('')}</ul></div></nav>
      <div class="wrap">
        <div style="display:flex;flex-wrap:wrap;gap:12px 20px;align-items:flex-end;padding-top:40px">
          <label class="fld" for="learn-q" style="flex:1 1 260px;max-width:440px"><span>Search all lessons</span><input id="learn-q" type="search" placeholder="Try “VWAP”, “Roth” or “Airbnb”" autocomplete="off"></label>
          ${ui.seg('learn-lv', levels, 'All', 'Level')}
          <a class="ulink" href="#glossary" style="margin-left:auto">Glossary of ${SML.glossary.length} terms</a>
        </div>
        <ol id="learn-res" class="lrows" style="margin-top:32px" hidden></ol>
        <div id="learn-tracks">${cs.map((c) => trackSection(c)).join('')}</div>
      </div>`;
    const q = $('#learn-q', view), res = $('#learn-res', view), tracks = $('#learn-tracks', view);
    $$('.trackbar button', view).forEach((b) => b.addEventListener('click', () => { q.value = ''; apply(); const el = document.getElementById('trk-' + b.dataset.go); if (el) el.scrollIntoView({ behavior: SML.reduced() ? 'auto' : 'smooth', block: 'start' }); }));
    const st = ui.wire(view, () => apply());
    function apply() {
      const lv = st.seg('learn-lv'); const term = q.value.trim().toLowerCase();
      $$('.track', view).forEach((sec) => { const c = courseOf(sec.dataset.c); sec.hidden = lv !== 'All' && c.level !== lv; });
      if (!term) { res.hidden = true; tracks.hidden = false; return; }
      const hits = allLessons().filter((l) => (l.title + ' ' + (l.summary || '') + ' ' + (l.idea || '') + ' ' + (l.terms || []).join(' ')).toLowerCase().includes(term));
      res.hidden = false; tracks.hidden = true;
      res.innerHTML = hits.length ? hits.map((l) => lessonRowHTML(l, true)).join('') : `<li class="note" style="padding:24px 0">No lesson matches “${esc(q.value)}”. Try the <a href="#glossary">glossary</a>.</li>`;
    }
    return T.title + ' lessons';
  }
  SML.pages.learn = (view) => learnPage(view, curTrack());
  TRACKS().forEach((t) => { SML.pages['track-' + t.id] = (view) => learnPage(view, t.id); });

  /* ---------------- course ---------------- */
  function coursePage(view, tok) {
    const c = courseOf(tok.slice(2)); if (!c) return notFound(view);
    const tid = trackOfCourse(c), T = trackById(tid), tcs = coursesOf(tid); setTrack(tid);
    const ls = lessonsOf(c.id), d = doneIn(c.id); const next = ls.find((l) => !SML.progress.isDone(l.id)) || ls[0];
    const nc = tcs.find((x) => x.n === c.n + 1), pc = tcs.find((x) => x.n === c.n - 1);
    view.innerHTML = `
      <div class="wrap"><nav class="l-crumbbar crumbs" aria-label="Breadcrumb"><span style="display:flex;flex-wrap:wrap;gap:8px"><a href="#track-${tid}">${esc(T.title)}</a><span aria-hidden="true">/</span><span>${esc(c.title)}</span></span><span>Course ${nn(c.n)} / ${nn(tcs.length)}</span></nav></div>
      <div class="wrap">${trackSection(c, 'h1')}
        <div style="display:flex;flex-wrap:wrap;gap:10px;padding-block:32px 8px">${next ? `<a class="btn btn-p" href="#${next.id}">${d ? 'Continue the course' : 'Start the course'} ${icons.arrow}</a>` : ''}<a class="btn btn-g" href="#track-${tid}">All ${esc(T.title)} courses</a></div>
        <nav class="l-nav" aria-label="Courses" style="margin-block:40px 80px">${pc ? `<a href="#c-${pc.id}"><span>${icons.back} Previous course</span><strong>${esc(pc.title)}</strong></a>` : '<span></span>'}${nc ? `<a class="next" href="#c-${nc.id}"><span>Next course ${icons.arrow}</span><strong>${esc(nc.title)}</strong></a>` : ''}</nav>
      </div>`;
    const h = $('#t-' + c.id, view); if (h) { h.style.fontSize = 'clamp(48px,6vw,72px)'; }
    return c.title;
  }

  /* ---------------- lesson ---------------- */
  function lessonPage(view, tok) {
    const l = lessonById(tok); if (!l) return notFound(view);
    const c = courseOf(l.course) || { title: '', n: 0, id: '' }; const ls = lessonsOf(l.course);
    const tid = trackOfLesson(l), T = trackById(tid); setTrack(tid);
    const all = allLessons(tid); const gi = all.indexOf(l); const prev = all[gi - 1], next = all[gi + 1];
    const pos = gi + 1; const done = SML.progress.isDone(l.id);
    const doneHere = () => doneTrack(tid);
    const terms = (l.terms || []).map(glossTerm).filter(Boolean).concat((l.glossary || []).filter((g) => g && g.t && !glossTerm(g.t)).map((g) => ({ t: g.t, full: g.full || '', d: g.d, l: g.l || '' })));
    const secs = [];
    secs.push({ id: 'sec-try', h: 'Try it' });
    if ((l.body || []).length) secs.push({ id: 'sec-how', h: 'How it works' });
    (l.extra || []).forEach((w, i) => secs.push({ id: 'sec-x' + i, h: 'Try this too' }));
    if (l.example) secs.push({ id: 'sec-ex', h: 'Worked example' });
    secs.push({ id: 'sec-rem', h: (l.mistakes && l.mistakes.length) ? 'Mistakes and takeaways' : 'Key takeaways' });
    if (terms.length) secs.push({ id: 'sec-words', h: 'Glossary' });
    if ((l.sources || []).length) secs.push({ id: 'sec-src', h: 'Sources' });
    if (l.quiz) secs.push({ id: 'sec-quiz', h: 'Quick check' });
    const part = (i) => `Part ${nn(i + 1)}`;
    const idx = (id) => secs.findIndex((s) => s.id === id);
    const tl = (cls) => `<ol class="tl${cls ? ' ' + cls : ''}">${ls.map((x, i) => { const dn = SML.progress.isDone(x.id); return `<li><a href="#${x.id}" class="${x === l ? 'on' : ''}${dn ? ' dn' : ''}"${x === l ? ' aria-current="page"' : ''}><i>${dn ? '✓' : nn(i + 1)}</i><span>${esc(x.title)}</span></a></li>`; }).join('')}</ol>`;
    view.innerHTML = `
      <header class="l-hdr">
        <div class="wrap">
          <nav class="l-crumbbar crumbs" aria-label="Breadcrumb"><span style="display:flex;flex-wrap:wrap;gap:8px"><a href="#track-${tid}">${esc(T.title)}</a><span aria-hidden="true">/</span><a href="#c-${l.course}">${esc(c.title)}</a></span><span>${nn(pos)} / ${all.length}</span></nav>
          <div class="l-hero">
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">${lvl(l.level)}<span class="meta">${l.mins || 4} min read</span><span class="meta up" id="l-done"${done ? '' : ' hidden'}>Completed</span></div>
            <h1 class="l-title">${esc(l.title)}</h1>
            <p class="l-sum">${l.idea || l.summary || ''}</p>
          </div>
        </div>
      </header>
      <div class="wrap lesson">
        <article class="l-main">
          <div class="l-mobnav"><details><summary><span>${esc(c.title)}</span><span>${doneIn(l.course)}/${ls.length} done</span></summary>${tl()}</details></div>
          <section class="l-sec" id="sec-try" aria-labelledby="h-try">
            <div class="l-sec-h"><p class="part">${part(0)}</p><h2 id="h-try">Try it</h2></div>
            <figure class="fig">${l.try ? `<p class="try-p">${l.try}</p>` : ''}${SML.widgetHTML(l.widget, l.opts)}<figcaption>Fig. ${pos}.1 · ${esc(l.title)}</figcaption></figure>
          </section>
          ${(l.body || []).length ? `<section class="l-sec" id="sec-how" aria-labelledby="h-how"><div class="l-sec-h"><p class="part">${part(idx('sec-how'))}</p><h2 id="h-how">How it works</h2></div><div class="prose">${l.body.join('')}</div></section>` : ''}
          ${(l.extra || []).map((w, i) => `<section class="l-sec" id="sec-x${i}" aria-labelledby="h-x${i}"><div class="l-sec-h"><p class="part">${part(idx('sec-x' + i))}</p><h2 id="h-x${i}">Try this too</h2></div><figure class="fig">${w.try ? `<p class="try-p">${w.try}</p>` : ''}${SML.widgetHTML(w.widget, w.opts)}<figcaption>Fig. ${pos}.${i + 2} · ${esc(l.title)}</figcaption></figure></section>`).join('')}
          ${l.example ? `<section class="l-sec ex-sec" id="sec-ex" aria-labelledby="h-ex"><p class="part">Worked example</p><h2 id="h-ex">${esc(l.example.title || 'Worked example')}</h2>${l.example.intro ? `<p class="ex-intro">${l.example.intro}</p>` : ''}<ol class="ex-steps">${(l.example.steps || []).map((st, i) => `<li><span class="n">${i + 1}</span><p>${st}</p></li>`).join('')}</ol>${l.example.result ? `<p class="ex-res">${l.example.result}</p>` : ''}</section>` : ''}
          <section class="l-sec" id="sec-rem" aria-labelledby="h-rem">
            <div class="pane2${(l.mistakes && l.mistakes.length) ? ' two' : ''}">${(l.mistakes && l.mistakes.length) ? `<section><h2 class="pane-h dn">Common mistakes</h2><ul class="plain">${l.mistakes.map((m) => `<li>${m}</li>`).join('')}</ul></section>` : ''}<section><h2 class="pane-h" id="h-rem">Key takeaways</h2><ul class="plain">${(l.points || []).map((m) => `<li>${m}</li>`).join('')}</ul></section></div>
          </section>
          ${terms.length ? `<section class="l-sec" id="sec-words" aria-labelledby="h-words"><h2 class="gl-h" id="h-words">Glossary</h2>
            <dl class="gloss">${terms.map((g) => `<div><dt>${esc(g.t)}${g.full ? `<small>${esc(g.full)}</small>` : ''}</dt><dd>${esc(g.d)}${g.l && g.l !== l.id && lessonById(g.l) ? `<br><a href="#${g.l}">Lesson: ${esc(lessonById(g.l).title)}</a>` : ''}</dd></div>`).join('')}</dl></section>` : ''}
          ${(l.sources || []).length ? `<section class="l-sec" id="sec-src" aria-labelledby="h-src"><h2 class="pane-h" id="h-src">Sources</h2><ul class="src-list">${l.sources.map((s) => `<li><a href="${esc(s.u)}" target="_blank" rel="noopener noreferrer">${esc(s.t)}</a></li>`).join('')}</ul><p class="note">Figures checked October 2026. Limits and rates change every year; confirm before you act.</p></section>` : ''}
          ${l.quiz ? `<section class="l-sec" id="sec-quiz" aria-labelledby="h-quiz"><div class="quiz" id="quiz"><h3 id="h-quiz">Quick check</h3><p class="quiz-q">${l.quiz.q}</p><div class="quiz-opts">${l.quiz.options.map((o, i) => `<button type="button" class="qopt" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}</div><p class="quiz-why" id="quiz-why" hidden></p></div></section>` : ''}
          <div class="l-end">
            <button type="button" class="btn ${done ? 'btn-g' : 'btn-up'}" id="mark">${done ? icons.check + ' Completed' : 'Mark as complete'}</button>
            <span class="meta" id="l-count">${doneHere()} of ${all.length} ${esc(T.title)} lessons done</span>
          </div>
          <nav class="l-nav" aria-label="Lesson navigation">
            ${prev ? `<a href="#${prev.id}"><span>${icons.back} Previous</span><strong>${esc(prev.title)}</strong></a>` : '<span></span>'}
            ${next ? `<a class="next" href="#${next.id}"><span>Next${next.course !== l.course ? ' · new course' : ''} ${icons.arrow}</span><strong>${esc(next.title)}</strong></a>` : `<a class="next" href="#track-${tid}"><span>End of the track ${icons.arrow}</span><strong>Back to ${esc(T.title)}</strong></a>`}
          </nav>
        </article>
        <aside class="l-aside"><div>
          <p class="ah">On this page</p>
          <ul class="otp">${secs.map((s) => `<li><button type="button" data-sec="${s.id}">${s.h}</button></li>`).join('')}</ul>
          <p class="ah" style="margin-top:28px">${esc(c.title)}</p>
          ${tl()}
        </div></aside>
      </div>`;
    navBar(pct(pos, all.length));
    $$('.otp button', view).forEach((b) => b.addEventListener('click', () => { const el = document.getElementById(b.dataset.sec); if (el) el.scrollIntoView({ behavior: SML.reduced() ? 'auto' : 'smooth', block: 'start' }); }));
    const qz = $('#quiz', view);
    if (qz) qz.addEventListener('click', (e) => {
      const b = e.target.closest('.qopt'); if (!b || qz.dataset.done) return;
      const i = Number(b.dataset.i), ok = i === l.quiz.answer;
      b.classList.add(ok ? 'right' : 'wrong');
      const why = $('#quiz-why', view); why.hidden = false; why.className = 'quiz-why' + (ok ? '' : ' no');
      if (ok) { qz.dataset.done = '1'; $$('.qopt', qz).forEach((x) => { x.disabled = true; }); why.innerHTML = '<b>Right.</b> ' + l.quiz.why; if (!SML.progress.isDone(l.id)) { SML.progress.set(l.id, true); setMark(true); } }
      else why.innerHTML = '<b>Not quite.</b> Try another answer.';
    });
    const mark = $('#mark', view);
    function setMark(on) {
      mark.className = 'btn ' + (on ? 'btn-g' : 'btn-up'); mark.innerHTML = on ? icons.check + ' Completed' : 'Mark as complete';
      $('#l-done', view).hidden = !on; $('#l-count', view).textContent = `${doneHere()} of ${all.length} ${T.title} lessons done`;
      $$('.tl a.on', view).forEach((a) => { a.classList.toggle('dn', on); a.querySelector('i').textContent = on ? '✓' : nn(ls.indexOf(l) + 1); });
    }
    mark.addEventListener('click', () => { const on = !SML.progress.isDone(l.id); SML.progress.set(l.id, on); setMark(on); if (on) SML.toast('Hop hop. Lesson complete.'); });
    return l.title;
  }

  /* ---------------- tools ---------------- */
  function wheelThumb() {
    let b = S.rect(28, 50, 96, 46, 'f-info-t s-info w15', 6) + S.text(76, 78, 'CASH', 'md ink b', 'middle');
    b += S.rect(196, 50, 96, 46, 'f-acc-t s-acc w15', 6) + S.text(244, 78, '100 SHARES', 'md ink b', 'middle');
    b += S.arrow(126, 62, 194, 62, 'ink') + S.arrow(194, 86, 126, 86, 'ink');
    b += S.text(160, 54, 'put assigned', 'xs', 'middle') + S.text(160, 104, 'called away', 'xs', 'middle');
    b += S.path('M56,50 C56,18 96,18 96,44', 'nf s-ink w15') + S.path('M224,50 C224,18 264,18 264,44', 'nf s-ink w15');
    b += S.text(76, 16, 'sell puts', 'sm up b', 'middle') + S.text(244, 16, 'sell calls', 'sm up b', 'middle');
    b += S.text(160, 136, 'collect premium every month', 'sm acc b', 'middle');
    return S.box(320, 150, 'The wheel: sell puts from cash, sell calls from shares', b);
  }
  SML.wheelThumb = wheelThumb;
  function calThumb() {
    let b = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { const x = 20 + c * 40, y = 30 + r * 28; b += S.rect(x, y, 36, 24, 'f-surf s-line', 3); }
    [[2, 0, 'f-acc'], [4, 1, 'f-info'], [1, 2, 'f-up'], [5, 2, 'f-dn'], [3, 3, 'f-vio']].forEach(([c, r, f]) => { b += S.circle(20 + c * 40 + 10, 30 + r * 28 + 12, 4, f); });
    b += S.text(20, 20, 'OCT · NOV · DEC', 'xs mono b acc');
    return S.box(320, 150, 'A month grid with colored dots for key dates', b);
  }
  SML.pages.tools = function (view) {
    const trk = TRACKS().filter((t) => SML.tools.some((x) => (x.track || 'trading') === t.id));
    view.innerHTML = `
      ${pageHeader('', 'Interactive tools', 'Run the <em>numbers</em>', `<p>${SML.tools.length} tools. Every one draws a picture of its answer, so you learn while you calculate. No sign-up, nothing stored.</p>${ui.seg('tools-cat', ['All'].concat(trk.map((t) => t.title)), 'All', 'Track')}`)}
      <section class="chapter" style="padding-bottom:24px" aria-labelledby="tt-more"><div class="wrap">
        ${chapHead('', 'Pages that work like tools', 'Bring the lessons onto your own charts, sheets and calendar.', '', 'tt-more')}
        <div class="g3">
          ${plate('TradingView indicator', SML.indicatorThumb ? SML.indicatorThumb() : illo('play'), 'Draw PDH, PDL, PMH, PML, VWAP and the 13/48/200 EMA ribbon on your own charts, with alerts. Copy the Pine Script.', '#indicator')}
          ${plate('Spreadsheets', illo('track'), 'Trade journal, wheel tracker, retirement planner and watchlist templates you can copy or download.', '#sheets')}
          ${plate('Market & tax calendar', calThumb(), 'Fed decisions, CPI, jobs, PMI, options expiry, tax deadlines and open enrollment, with export.', '#calendar')}
        </div>
      </div></section>
      ${trk.map((t, i) => `<section class="chapter tools-trk" data-t="${esc(t.title)}" style="padding-bottom:24px;padding-top:24px" aria-labelledby="tt-${t.id}"><div class="wrap">
        ${chapHead(nn(t.n), esc(t.title) + ' tools', '', more('#track-' + t.id, 'The ' + esc(t.title) + ' track'), 'tt-' + t.id)}
        <ul class="tiles t3">${SML.tools.filter((x) => (x.track || 'trading') === t.id).map(toolTile).join('')}</ul>
      </div></section>`).join('')}
      <section class="chapter" style="padding-top:24px" aria-labelledby="ch-sim"><div class="wrap">
        ${chapHead('', 'Practise with fake money', 'Two simulators. Every click is a trade or a month, with a coach that explains what happened.', '', 'ch-sim')}
        <div class="g2">
          ${plate('Trade replay', illo('play'), 'Replay a trading day bar by bar. Buy, short, set stops and get a scorecard at the close.', '#play')}
          ${plate('Wheel simulator', wheelThumb(), 'Sell puts and covered calls month by month and watch premium, assignment and cost basis add up.', '#wheel')}
        </div>
      </div></section>`;
    const st = ui.wire(view, () => { const c = st.seg('tools-cat'); $$('.tools-trk', view).forEach((s) => { s.hidden = c !== 'All' && s.dataset.t !== c; }); });
    return 'Tools';
  };
  function toolPage(view, tok) {
    const i = SML.tools.findIndex((x) => x.id === tok); const t = SML.tools[i]; if (!t) return notFound(view);
    const l = lessonById(t.lesson);
    view.innerHTML = `
      <div class="wrap"><nav class="l-crumbbar crumbs" aria-label="Breadcrumb"><span style="display:flex;flex-wrap:wrap;gap:8px"><a href="#tools">Tools</a><span aria-hidden="true">/</span><span>${esc(trackById(t.track || 'trading').title)}</span><span aria-hidden="true">/</span><span>${esc(t.cat)}</span></span><span>${nn(i + 1)} / ${nn(SML.tools.length)}</span></nav></div>
      <section class="wrap tool-sec" aria-labelledby="tool-h">
        ${chapHead(nn(i + 1), esc(t.title), esc(t.blurb), l ? `<a class="more" href="#${l.id}">Lesson: ${esc(l.title)} ${icons.arrow}</a>` : '', 'tool-h').replace('<h2', '<h1').replace('</h2>', '</h1>')}
        ${SML.widgetHTML(t.widget)}
        <p class="note">For learning only. Results use simple models and your inputs; they are not advice.</p>
      </section>
      <section class="wrap" style="padding-bottom:80px" aria-labelledby="more-h"><h2 class="wg-title" id="more-h" style="margin-bottom:14px">More tools</h2><ul class="tiles t3">${SML.tools.filter((x) => x.id !== t.id && (x.track || 'trading') === (t.track || 'trading')).slice(0, 6).map(toolTile).join('')}</ul></section>`;
    return t.title;
  }

  /* ---------------- wheel simulator page ---------------- */
  SML.pages.wheel = function (view) {
    view.innerHTML = `
      <div class="wrap"><nav class="l-crumbbar crumbs" aria-label="Breadcrumb"><span style="display:flex;gap:8px"><a href="#play">Playground</a><span aria-hidden="true">/</span><span>Simulator</span></span><span>Fake money</span></nav></div>
      <section class="wrap tool-sec" aria-labelledby="wh-h">
        ${chapHead('', 'Wheel simulator', 'Start with cash, sell a put, maybe get the shares, sell calls, repeat. Each click is one month. Prices are simulated.', `<a class="more" href="#l-wheel">Lesson: The wheel strategy ${icons.arrow}</a>`, 'wh-h').replace('<h2', '<h1').replace('</h2>', '</h1>')}
        ${SML.widgetHTML('wheelSim')}
        <div class="pane2"><section><h2 class="pane-h acc">How to play</h2>${ui.ticks(['Pick a strike style: safer strikes are further away and pay less.', 'Sell a put while you hold cash. If the stock ends below the strike you buy 100 shares.', 'Holding shares? Sell a call. If the stock ends above the strike, your shares are sold.', 'Compare your total with simply buying and holding.'])}</section></div>
        <div class="callout info">${icons.info}<span>Run the numbers for a real trade in the <a href="#tool-wheel">wheel income tool</a>.</span></div>
      </section>`;
    return 'Wheel simulator';
  };

  /* ---------------- glossary ---------------- */
  SML.pages.glossary = function (view) {
    const list = SML.glossary.slice().sort((a, b) => a.t.localeCompare(b.t));
    view.innerHTML = `
      ${pageHeader('', 'Glossary', 'Every word, in plain <em>English</em>.', `<p>${list.length} terms. Each links to the lesson where you can play with it.</p><label class="fld" for="gl-q"><span>Search terms</span><input id="gl-q" type="search" placeholder="Try “theta” or “wash”" autocomplete="off"></label>`)}
      <section class="wrap" style="padding-block:40px 80px;display:flex;flex-direction:column;gap:20px">
        <div class="gl-az" id="gl-az" role="group" aria-label="Filter by first letter"><button type="button" class="on" data-l="">All</button>${Array.from(new Set(list.map((g) => g.t[0].toUpperCase()))).map((ch) => `<button type="button" data-l="${ch}">${ch}</button>`).join('')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between">${ui.seg('gl-trk', ['All'].concat(TRACKS().map((t) => t.title)), 'All', 'Track')}<p class="meta" id="gl-count"></p></div>
        <dl class="gloss" id="gl-list">${list.map((g) => { const ls = lessonById(g.l); return `<div data-t="${esc(ls ? trackById(trackOfLesson(ls)).title : '')}" data-s="${esc((g.t + ' ' + (g.full || '') + ' ' + g.d).toLowerCase())}"><dt>${esc(g.t)}${g.full ? `<small>${esc(g.full)}</small>` : ''}</dt><dd>${esc(g.d)}${ls ? `<br><a href="#${g.l}">Lesson: ${esc(ls.title)}</a>` : ''}</dd></div>`; }).join('')}</dl>
      </section>`;
    const q = $('#gl-q', view), cnt = $('#gl-count', view); let letter = '';
    let trk = 'All';
    const apply = () => { const t = q.value.trim().toLowerCase(); let n = 0; $$('#gl-list > div', view).forEach((el) => { const show = (!t || el.dataset.s.includes(t)) && (!letter || el.dataset.s[0].toUpperCase() === letter) && (trk === 'All' || el.dataset.t === trk); el.hidden = !show; if (show) n++; }); cnt.textContent = t || letter || trk !== 'All' ? `${n} match${n === 1 ? '' : 'es'}` : `${list.length} terms`; };
    const gst = ui.wire(view, () => { trk = gst.seg('gl-trk'); apply(); });
    q.addEventListener('input', apply);
    $('#gl-az', view).addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; letter = b.dataset.l; $$('#gl-az button', view).forEach((x) => x.classList.toggle('on', x === b)); apply(); });
    apply();
    return 'Glossary';
  };

  function notFound(view) {
    view.innerHTML = `<section class="wrap nf-box">${kicker('', 'Not found')}<h1 class="h-page">This page <em>hopped</em> away</h1><p class="lede">The link may be old, or the bunny moved things around. Here are good places to go next.</p><div class="cta-row"><a class="btn btn-p" href="#home">Home</a><a class="btn btn-g" href="#learn">Lessons</a><a class="btn btn-g" href="#tools">Tools</a></div></section>`;
    return 'Not found';
  }

  /* ---------------- router ---------------- */
  let current = null;
  function navBar(p) {
    const bar = document.getElementById('nav-bar'), nav = bar && bar.parentNode; if (!bar) return;
    if (p == null) { bar.hidden = true; nav.classList.remove('has-bar'); return; }
    bar.hidden = false; nav.classList.add('has-bar'); bar.setAttribute('aria-valuenow', String(p));
    const i = bar.firstElementChild; requestAnimationFrame(() => { i.style.width = p + '%'; });
  }
  function render() {
    let tok = (location.hash || '').replace(/^#/, '') || 'home';
    if (!/^[A-Za-z0-9._~-]+$/.test(tok)) tok = 'home';
    const view = $('#view');
    SML.runCleanup();
    view.innerHTML = '';
    if (tok.indexOf('l-') !== 0) navBar(null);
    let title;
    try {
      if (SML.pages[tok]) title = SML.pages[tok](view, tok);
      else if (tok.indexOf('l-') === 0) title = lessonPage(view, tok);
      else if (tok.indexOf('c-') === 0) title = coursePage(view, tok);
      else if (tok.indexOf('tool-') === 0) title = toolPage(view, tok);
      else if (tok.indexOf('post-') === 0 && SML.pages.post) title = SML.pages.post(view, tok);
      else title = notFound(view);
    } catch (err) { console.error(err); title = notFound(view); }
    SML.mount(view);
    view.classList.remove('view'); void view.offsetWidth; view.classList.add('view');
    const sec = section(tok);
    $$('.nav-links a, .drawer a.dl, .nav-acct').forEach((a) => { const on = a.dataset.sec === sec; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = (title && tok !== 'home' ? title + ' · ' : '') + BRAND;
    if (current !== null) { window.scrollTo(0, 0); try { view.focus({ preventScroll: true }); } catch (e) {} }
    current = tok;
    updateCta();
  }
  SML.route = render;
  /* Re-render the current page in place (keeps the scroll position), e.g. after the account finishes loading. */
  SML.rerender = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };
  SML.go = (tok) => { if (location.hash === '#' + tok) render(); else location.hash = tok; };

  function boot() {
    buildShell(); window.addEventListener('hashchange', render); render();
    const live = ['dashboard', 'profile', 'settings', 'results', 'signin'];
    document.addEventListener('sml:account', (e) => { const t = e.detail && e.detail.type; if ((t === 'ready' || t === 'mode') && live.indexOf(current) >= 0) SML.rerender(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
