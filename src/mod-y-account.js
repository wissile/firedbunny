/* Account pages: sign-in (status and how it works), profile (you and your household), settings (sync, preferences,
 * progress, data export/import/delete, connected apps, permissions, privacy). Uses SML.account from account.js. */
(function () {
  'use strict';
  const SML = window.SML;
  const esc = SML.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const A = () => SML.account;
  const yearNow = () => new Date().getFullYear();
  const num = (v) => { if (v === '' || v == null) return null; const n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : null; };
  const money = (v) => (v == null || !isFinite(v) ? '—' : SML.fmt.usd(v, 0));
  const ic = (k) => (SML.icons && SML.icons[k]) || '';
  const hasRuntime = () => !!(window.claude && typeof window.claude.use === 'function');
  const use = async (name) => { try { return hasRuntime() ? await window.claude.use(name) : null; } catch (e) { return null; } };

  const I = (body) => `<svg class="acx-i" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const ico = {
    cloud: I('<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 9.5z"/>'),
    device: I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
    lock: I('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    phone: I('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>'),
    key: I('<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H20M17 12v3M20 12v2"/>'),
    sync: I('<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>'),
    user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    home: I('<path d="M4 11l8-6.5 8 6.5M6 9.5V20h12V9.5"/>'),
    chart: I('<path d="M4 19h16M7 16V10M12 16V6M17 16v-4"/>'),
    goal: I('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
    book: I('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
    trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    down: I('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    up: I('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
    shield: I('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>'),
    gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  };

  SML.css(`
    .acx{padding-block:40px 96px;display:flex;flex-direction:column;gap:24px}
    .acx-grid{display:grid;gap:24px;grid-template-columns:1fr;align-items:start}
    @media(min-width:1024px){.acx-grid{grid-template-columns:minmax(0,1.65fr) minmax(0,1fr)}}
    .acx-col{display:flex;flex-direction:column;gap:24px;min-width:0}
    .acx-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:20px;display:flex;flex-direction:column;gap:16px;min-width:0}
    @media(min-width:768px){.acx-card{padding:24px}}
    .acx-card.hot{border-color:color-mix(in srgb,var(--flame) 40%,var(--line));background:linear-gradient(120deg,color-mix(in srgb,var(--flame) 8%,var(--surface)),var(--surface) 65%)}
    .acx-h{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}
    .acx-h h2{font-family:var(--display);font-weight:400;font-size:clamp(28px,3vw,36px);line-height:.95;text-transform:uppercase;color:var(--ink);display:flex;align-items:center;gap:10px}
    .acx-h h2 .acx-i{color:var(--flame)}
    .acx-sub{color:var(--muted);font-size:15px;line-height:1.6;max-width:62ch}
    .acx-i{flex:0 0 auto}
    .acx-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
    .acx-fields{display:grid;gap:14px;grid-template-columns:1fr}
    @media(min-width:640px){.acx-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .acx-help{font-size:12.5px;color:var(--muted);line-height:1.4}
    .acx-help b{color:var(--ink);font-weight:600}
    .acx-pill{display:inline-flex;align-items:center;gap:6px;min-height:26px;padding:0 10px;border-radius:999px;border:1px solid var(--line);font:600 10.5px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
    .acx-pill.cloud{color:var(--up);border-color:color-mix(in srgb,var(--up) 45%,transparent);background:color-mix(in srgb,var(--up) 10%,transparent)}
    .acx-pill.local{color:var(--gold);border-color:color-mix(in srgb,var(--gold) 45%,transparent);background:color-mix(in srgb,var(--gold) 10%,transparent)}
    .acx-pill.wait{color:var(--muted)}
    .acx-pill .acx-i{width:14px;height:14px}
    .acx-id{display:flex;gap:16px;align-items:center;min-width:0}
    .acx-av{width:64px;height:64px;border-radius:50%;object-fit:cover;flex:0 0 64px;border:2px solid color-mix(in srgb,var(--flame) 60%,transparent);background:var(--bg)}
    .acx-id .fb-mark{width:64px;height:64px}
    .acx-id b{display:block;font-family:var(--display);font-weight:400;font-size:clamp(30px,4vw,40px);line-height:.95;text-transform:uppercase;color:var(--ink);overflow-wrap:anywhere}
    .acx-id small{display:block;color:var(--muted);font-size:13.5px;margin-top:4px}
    .acx-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
    @media(min-width:640px){.acx-stats{grid-template-columns:repeat(4,minmax(0,1fr))}}
    .acx-stat{background:var(--surface);padding:12px 14px;display:flex;flex-direction:column;gap:4px;min-width:0}
    .acx-stat span{font:500 10.5px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .acx-stat b{font-family:var(--display);font-weight:400;font-size:28px;line-height:1;color:var(--ink);white-space:nowrap}
    .acx-stat b.acc{color:var(--accent)} .acx-stat b.up{color:var(--up)}
    .acx-mems{display:flex;flex-direction:column;gap:10px}
    .acx-mem{border:1px solid var(--line);border-radius:var(--r);background:var(--bg);padding:12px;display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr));align-items:end}
    .acx-mem .acx-n{grid-column:1 / -1}
    .acx-mem .acx-x{grid-column:1 / -1;justify-self:end}
    @media(min-width:900px){.acx-mem{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,.8fr) minmax(0,1fr) minmax(0,1.2fr) auto}.acx-mem .acx-n,.acx-mem .acx-x{grid-column:auto}.acx-mem .acx-x{justify-self:auto}}
    .acx-mem.self{border-color:color-mix(in srgb,var(--flame) 35%,var(--line))}
    .acx-x{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;min-width:40px;padding:0 10px;border:1px solid var(--line);border-radius:var(--r);background:transparent;color:var(--muted);cursor:pointer;font:600 12px var(--sans)}
    .acx-x:hover{color:var(--down);border-color:color-mix(in srgb,var(--down) 50%,transparent)}
    .acx-x .acx-i{width:16px;height:16px}
    .acx-ph{display:none}
    @media(min-width:900px){.acx-ph{display:inline-flex;visibility:hidden}}
    @media(min-width:900px){.acx-mem .acx-x span{display:none}}
    .acx-tot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font:500 13px var(--mono);color:var(--muted);border-top:1px dashed var(--line);padding-top:12px}
    .acx-tot b{color:var(--ink);font-weight:600}
    .acx-bar{position:sticky;bottom:12px;z-index:30;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding:12px 14px 12px 18px;border-radius:var(--r);border:1px solid color-mix(in srgb,var(--flame) 50%,var(--line));background:color-mix(in srgb,var(--flame) 12%,var(--surface-2));box-shadow:0 18px 40px -18px var(--raise)}
    .acx-bar[data-state="clean"]{position:static;border-color:var(--line);background:var(--surface);box-shadow:none}
    .acx-bar .acx-st{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--ink)}
    .acx-bar .acx-st .dot{width:8px;height:8px;border-radius:50%;background:var(--flame);flex:0 0 auto}
    .acx-bar[data-state="clean"] .acx-st .dot{background:var(--up)}
    .acx-links{display:grid;gap:10px;grid-template-columns:1fr}
    .acx-link{display:flex;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r);text-decoration:none;color:var(--ink);background:var(--bg);transition:border-color .15s,background-color .15s}
    .acx-link:hover{border-color:color-mix(in srgb,var(--flame) 50%,transparent);background:var(--surface-2)}
    .acx-link .acx-i{color:var(--flame)}
    .acx-link span{display:flex;flex-direction:column;gap:2px;min-width:0}
    .acx-link b{font-weight:600;font-size:15px}
    .acx-link small{color:var(--muted);font-size:13px;line-height:1.4}
    .acx-arch{display:flex;gap:14px;align-items:center}
    .acx-arch img{width:96px;height:64px;object-fit:contain;border-radius:4px;flex:0 0 auto}
    .acx-arch b{display:block;font-family:var(--display);font-weight:400;font-size:28px;line-height:1;text-transform:uppercase;color:var(--gold)}
    .acx-arch small{display:block;color:var(--muted);font-size:13px;margin-top:4px}
    .acx-list{list-style:none;display:flex;flex-direction:column;gap:10px}
    .acx-list li{display:flex;gap:10px;align-items:flex-start;font-size:15px;line-height:1.5;color:color-mix(in srgb,var(--ink) 90%,transparent)}
    .acx-list li .acx-i{color:var(--up);width:18px;height:18px;margin-top:2px}
    .acx-steps{list-style:none;display:grid;gap:12px;grid-template-columns:1fr;counter-reset:st}
    @media(min-width:768px){.acx-steps{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .acx-steps li{counter-increment:st;display:grid;grid-template-columns:44px minmax(0,1fr);gap:12px;align-items:start;padding:14px;border:1px solid var(--line);border-radius:var(--r);background:var(--bg)}
    .acx-steps li::before{content:counter(st,decimal-leading-zero);font-family:var(--display);font-size:34px;line-height:.9;color:var(--flame)}
    .acx-steps b{display:block;font-weight:600;font-size:15px;color:var(--ink)}
    .acx-steps small{display:block;color:var(--muted);font-size:13.5px;line-height:1.5;margin-top:4px}
    .acx-big{font-family:var(--display);font-weight:400;font-size:clamp(34px,4.6vw,52px);line-height:.95;text-transform:uppercase;color:var(--ink)}
    .acx-big em{font-style:normal;color:var(--gold)}
    .acx-toggle{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}
    .acx-toggle:first-of-type{border-top:0}
    .acx-toggle > span{display:flex;flex-direction:column;gap:3px;min-width:0}
    .acx-toggle b{font-weight:600;font-size:15px;color:var(--ink)}
    .acx-toggle small{color:var(--muted);font-size:13px;line-height:1.45}
    .acx-sw{position:relative;flex:0 0 auto;width:46px;height:26px;border-radius:999px;border:1px solid var(--input);background:var(--bg);cursor:pointer;padding:0;transition:background-color .15s,border-color .15s}
    .acx-sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--muted);transition:transform .15s,background-color .15s}
    .acx-sw[aria-checked="true"]{background:color-mix(in srgb,var(--up) 25%,var(--bg));border-color:var(--up)}
    .acx-sw[aria-checked="true"]::after{transform:translateX(20px);background:var(--up)}
    .acx-prog{display:flex;flex-direction:column;gap:12px}
    .acx-prow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;align-items:center}
    .acx-prow b{font-weight:600;font-size:14.5px;color:var(--ink)}
    .acx-prow span{font:500 12px var(--mono);color:var(--muted)}
    .acx-prow .acx-pb{grid-column:1 / -1;height:6px;border-radius:3px;background:var(--line);overflow:hidden}
    .acx-prow .acx-pb i{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--flame));border-radius:3px}
    .acx-confirm{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:12px;border-radius:var(--r);border:1px solid color-mix(in srgb,var(--down) 45%,var(--line));background:color-mix(in srgb,var(--down) 8%,var(--surface))}
    .acx-confirm p{flex:1 1 220px;font-size:14px;color:var(--ink)}
    .acx-danger{border-color:color-mix(in srgb,var(--down) 35%,var(--line))}
    .acx-danger .acx-h h2 .acx-i{color:var(--down)}
    .acx-file{display:flex;flex-direction:column;gap:10px}
    .acx-file input[type=file]{font:500 13px var(--sans);color:var(--muted);max-width:100%}
    .acx-file input[type=file]::file-selector-button{font:600 13px var(--sans);color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:var(--r);padding:8px 12px;margin-right:10px;cursor:pointer}
    .acx-prev{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 16px;font:500 13px var(--mono);color:var(--muted);padding:12px;border:1px dashed var(--line);border-radius:var(--r)}
    @media(min-width:640px){.acx-prev{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .acx-prev b{color:var(--ink)}
    .acx-err{color:var(--down);font-size:13.5px}
    .acx-ok{color:var(--up);font-size:13.5px}
    .acx-note{font-size:13.5px;color:var(--muted);line-height:1.55}
    .acx-auth{display:flex;flex-direction:column;gap:16px}
    .acx-auth .fld input{font-family:var(--sans);font-size:16px;padding:11px 12px}
    .acx-tabs{display:flex;gap:6px;padding:4px;border:1px solid var(--line);border-radius:999px;align-self:flex-start}
    .acx-tabs button{border:0;background:none;color:var(--muted);font:600 14px var(--sans);padding:8px 16px;border-radius:999px;cursor:pointer;min-height:40px}
    .acx-tabs button[aria-pressed="true"]{background:var(--accent);color:var(--on-acc)}
    .acx-err{color:var(--down);font-size:14px;line-height:1.5}
    .acx-okmsg{color:var(--up);font-size:14px;line-height:1.5}
    .acx-pw{position:relative}
    .acx-pw button{position:absolute;right:6px;bottom:6px;border:0;background:none;color:var(--muted);font:600 12px var(--mono);letter-spacing:.08em;text-transform:uppercase;padding:6px 8px;cursor:pointer;min-height:32px}
    .acx-linkbtn{border:0;background:none;padding:0;color:var(--accent);font:inherit;font-size:14px;cursor:pointer;text-decoration:underline;text-underline-offset:3px;align-self:flex-start;min-height:32px}
    .acx-sync{font-size:13.5px;color:var(--muted)}
    .acx-phone{display:flex;gap:16px;align-items:center}
    .acx-phone svg.dev{flex:0 0 auto}
    .acx-hide{display:none!important}
    .acx-check{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)}
    .acx-dname{font-size:14px;color:var(--ink)}
  `);

  /* ---------------- shared bits ---------------- */
  function modePill(st) {
    if (!st.ready) return `<span class="acx-pill wait">${ico.sync}Checking…</span>`;
    return st.mode === 'cloud' ? `<span class="acx-pill cloud">${ico.cloud}Saved to your account</span>` : `<span class="acx-pill local">${ico.device}Saved in this browser</span>`;
  }
  function savedWhere() { return A().status.mode === 'cloud' ? 'Saved to your account' : 'Saved in this browser'; }
  function avatarHTML(st, size) {
    const s = size || 64;
    if (st.signedIn && st.avatar) return `<img class="acx-av" src="${esc(st.avatar)}" alt="" width="${s}" height="${s}">`;
    return SML.bunnyMark(s);
  }
  function stateKind(st) {
    if (!st.ready) return 'checking';
    if (st.mode === 'cloud') return 'cloud';
    if (st.signedIn) return 'readonly';
    return 'guest';
  }
  function migrationCard() {
    const st = A().status;
    if (!(st.mode === 'cloud' && st.localPending)) return '';
    return `<div class="acx-card hot" data-acx="migrate"><div class="acx-h"><h2>${ico.sync}Move this browser's data into your account</h2></div>
      <p class="acx-sub">This browser has lessons, goals or a profile from before you signed in. Moving it adds it to your private FiredBunny profile and removes it from this browser, so it follows you to every device. “Not now” keeps it in this browser.</p>
      <div class="acx-row"><button type="button" class="btn btn-p" data-acx-act="migrate">Move this browser's data into your account</button><button type="button" class="btn btn-g" data-acx-act="dismiss">Not now</button></div></div>`;
  }
  function wireMigration(view) {
    const m = $('[data-acx-act="migrate"]', view), d = $('[data-acx-act="dismiss"]', view);
    if (m) m.addEventListener('click', async () => { m.disabled = true; m.textContent = 'Moving…'; try { await A().migrateLocal(); SML.hop('Hop hop. Your data moved to your account.'); } catch (e) { SML.toast('Could not move it right now. Try again in a moment.'); } SML.rerender(); });
    if (d) d.addEventListener('click', () => { A().dismissMigration(); SML.rerender(); });
  }
  function latestSummary(p) { const s = p.assessmentSummary || []; return s.length ? s[s.length - 1] : null; }
  function lessonsByTrack() {
    const done = new Set(SML.progress ? SML.progress.list() : []);
    return (SML.tracks || []).map((t) => {
      const cs = SML.courses.filter((c) => (c.track || 'trading') === t.id);
      const ids = cs.flatMap((c) => SML.lessons.filter((l) => l.course === c.id).map((l) => l.id));
      return { t, total: ids.length, done: ids.filter((id) => done.has(id)).length };
    });
  }

  /* ---------------- sign in ---------------- */
  SML.pages.signin = function (view) {
    if (SML.host === 'web') return signinWeb(view);
    const st = A().status; const kind = stateKind(st); const nm = A().displayName();
    const benefits = ['Your lesson progress, saved as you learn', 'Investor self-assessment history, so you can see how you change over the years', 'Goals with progress bars, and a net worth tracker for your household', 'The same profile on every device you sign in on', 'Ready for the FiredBunny mobile apps when they launch'];
    let status = '';
    if (kind === 'checking') status = `<div class="acx-card"><div class="acx-id">${SML.bunnyMark(64)}<div><b>Checking…</b><small>Looking for your Claude account. This takes a second.</small></div></div></div>`;
    else if (kind === 'cloud') status = `<div class="acx-card hot"><div class="acx-id">${avatarHTML(st)}<div><b>${esc(nm || 'You')}</b><small>You're signed in with your Claude account.</small></div></div>
        <div class="acx-row">${modePill(st)}<span class="acx-note">Saved to your private FiredBunny profile. Other visitors and the site owner can’t read it.</span></div>
        <div class="acx-row"><a class="btn btn-p" href="#dashboard">Go to my dashboard ${ic('arrow')}</a><a class="btn btn-g" href="#profile">Edit my profile</a></div></div>`;
    else if (kind === 'readonly') status = `<div class="acx-card"><div class="acx-id">${avatarHTML(st)}<div><b>${esc(nm || 'Signed in')}</b><small>Signed in, but saving to your account isn't allowed on this page.</small></div></div>
        <div class="acx-row">${modePill(st)}</div>
        <p class="acx-sub">The way this page was shared with you lets you read it, not save to it. Saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it from <a class="ulink" href="#settings">Settings</a> when you’re done. Export a file to move it. Ask whoever shared the page for Contributor access if you want it saved to your account.</p>
        <div class="acx-row"><a class="btn btn-p" href="#dashboard">Continue in this browser ${ic('arrow')}</a></div></div>`;
    else status = `<div class="acx-card"><div class="acx-id">${SML.bunnyMark(64)}<div><b>Guest mode</b><small>You're not signed in.</small></div></div>
        <div class="acx-row">${modePill(st)}</div>
        <p class="acx-sub">Saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it from <a class="ulink" href="#settings">Settings</a> when you’re done. Export a file to move it.</p>
        <div class="acx-row"><a class="btn btn-p" href="#dashboard">Continue as guest ${ic('arrow')}</a><a class="btn btn-g" href="#settings">Export my data</a></div></div>`;
    view.innerHTML = `
      ${SML.pageHeader('', 'Sign in', kind === 'cloud' ? `Welcome <em>back</em>.` : `One account. <em>No new</em> password.`, `<p>FiredBunny signs you in with your Claude account. There is no FiredBunny password to create, forget or leak.</p>`)}
      <div class="wrap acx">
        <div class="acx-grid">
          <div class="acx-col">
            ${status}
            ${migrationCard()}
            <div class="acx-card"><div class="acx-h"><h2>${ico.key}How sign-in works</h2></div>
              <ol class="acx-steps">
                <li><span><b>Open FiredBunny in claude.ai</b><small>Sign in to your Claude account first, then open this page from claude.ai.</small></span></li>
                <li><span><b>We recognize you</b><small>The page asks Claude who is viewing. You get a private id. No email or password reaches FiredBunny.</small></span></li>
                <li><span><b>Your data saves privately</b><small>Progress, goals and your investor profile are saved to your private FiredBunny profile. Other visitors and the site owner can’t read it.</small></span></li>
                <li><span><b>Phone apps, later</b><small>The FiredBunny mobile apps are in development and will use the same profile. Until then, export a file from Settings.</small></span></li>
              </ol>
            </div>
            <div class="acx-card"><div class="acx-h"><h2>${ico.device}Can't sign in here?</h2></div>
              <p class="acx-sub">If you opened a shared link while signed out, or the page was shared with you as view-only, FiredBunny still works fully. Your lesson progress, assessment and dashboard are saved in this browser only. Anyone using this browser can see them, so on a shared computer delete them from <a class="ulink" href="#settings">Settings</a> when you’re done. Use <b>Export</b> in Settings to keep a copy or move it to another device, and <b>Import</b> to bring it back.</p>
            </div>
          </div>
          <div class="acx-col">
            <div class="acx-card"><img class="fb-art" src="${SML.brandArt}" alt="FiredBunny, a relaxed bunny in orange sunglasses next to rising candles" width="600" height="400">
              <p class="acx-big">Learn early. <em>Stay chill.</em></p>
              <p class="acx-sub">Sign in once and the bunny remembers where you left off.</p></div>
            <div class="acx-card"><div class="acx-h"><h2>${ico.check}What you get</h2></div>
              <ul class="acx-list">${benefits.map((b) => `<li>${ico.check}<span>${b}</span></li>`).join('')}</ul></div>
            <div class="acx-card"><div class="acx-h"><h2>${ico.lock}Privacy</h2></div>
              <p class="acx-note">Signed in, your data is saved to your private FiredBunny profile. Other visitors and the site owner can’t read it. As a guest it is saved in this browser only, where anyone using the browser can see it; on a shared computer delete it from <a class="ulink" href="#settings">Settings</a> when you’re done. Never enter passwords, account numbers or your Social Security number anywhere on FiredBunny; it never needs them.</p></div>
          </div>
        </div>
      </div>`;
    wireMigration(view);
    return 'Sign in';
  };

  /* On the website: real accounts when Supabase is switched on (signinAccount); otherwise explain browser storage. */
  /* ---------------- website accounts (Supabase, src/cloud.js) ---------------- */
  const syncLine = (s) => {
    if (s.offline) return `Offline. ${s.pending ? s.pending + ' change' + (s.pending === 1 ? '' : 's') + ' will upload' : 'Changes upload'} when you’re back online.`;
    if (s.error) return esc(s.error);
    if (s.pending) return 'Saving to your account…';
    if (!s.lastSync) return 'Connecting to your account…';
    const mins = Math.round((Date.now() - new Date(s.lastSync).getTime()) / 60000);
    return 'Up to date with your account' + (mins < 1 ? ' · just now' : mins < 60 ? ` · ${mins} min ago` : '') + '.';
  };
  function liveSync(view) {
    const CL = SML.cloud; if (!CL || !CL.user) return;
    const draw = (s) => $$('[data-auth="sync"]', view).forEach((el) => { el.textContent = syncLine(s || CL.status); });
    draw(); const off = CL.onStatus(draw); const t = setInterval(() => draw(), 30000);
    SML.onCleanup(() => { off(); clearInterval(t); });
  }
  const signinPath = () => (SML.routes && SML.routes.mode === 'path' && SML.routes.path) ? SML.routes.path('signin') : location.pathname;
  async function signOutFlow(btn, msgEl, force) {
    btn.disabled = true; msgEl.hidden = true;
    const r = await SML.cloud.signOut(force);
    if (r.ok) { location.replace(signinPath()); return; }
    btn.disabled = false;
    msgEl.hidden = false; msgEl.className = 'acx-err';
    msgEl.innerHTML = `${r.pending} change${r.pending === 1 ? ' hasn’t' : 's haven’t'} reached your account yet, because this device is offline. Signing out now deletes ${r.pending === 1 ? 'it' : 'them'} from this device. <button type="button" class="acx-linkbtn" data-auth-act="signout-force">Sign out anyway</button>`;
    const f = $('[data-auth-act="signout-force"]', msgEl); if (f) f.addEventListener('click', () => signOutFlow(btn, msgEl, true));
  }
  function signinAccount(view) {
    const st = A().status, CL = SML.cloud;
    const signedIn = st.provider === 'supabase';
    const right = `<div class="acx-col">
        <div class="acx-card"><img class="fb-art" src="${SML.brandArt}" alt="FiredBunny, a relaxed bunny in orange sunglasses next to rising candles" width="600" height="400">
          <p class="acx-big">Learn early. <em>Stay chill.</em></p>
          <p class="acx-sub">Sign in on your phone, laptop or tablet and pick up where you left off.</p></div>
        <div class="acx-card"><div class="acx-h"><h2>${ico.check}What your account keeps</h2></div>
          <ul class="acx-list">
            <li>${ico.check}<span>Lesson progress, quiz results and your self-assessment history</span></li>
            <li>${ico.check}<span>Goals, net worth, household and your investor profile</span></li>
            <li>${ico.check}<span>Your trade journal, FIRE plan, spreadsheets and preferences</span></li>
            <li>${ico.check}<span>The same data on every device where you sign in, and offline</span></li>
          </ul></div>
        <div class="acx-card"><div class="acx-h"><h2>${ico.lock}Privacy</h2></div>
          <p class="acx-note">Your account stores your email address and what you save on FiredBunny, in FiredBunny’s database (hosted by Supabase). Other visitors can’t see it. Your password is handled by the sign-in service and is never stored in readable form. You can export everything or delete your account from <a class="ulink" href="#settings">Settings</a> at any time. Never enter passwords, account numbers or your Social Security number into your profile; FiredBunny never needs them.</p></div>
      </div>`;
    const shell = (left, heading, lede) => {
      view.innerHTML = `
        ${SML.pageHeader('', signedIn ? 'Your account' : 'Sign in', heading, `<p>${lede}</p>`)}
        <div class="wrap acx"><div class="acx-grid"><div class="acx-col">${left}</div>${right}</div></div>`;
    };
    if (signedIn) {
      const nm = A().displayName();
      shell(`
        <div class="acx-card hot"><div class="acx-id">${SML.bunnyMark(64)}<div><b>${esc(nm || 'Signed in')}</b><small>${esc(st.email || '')}</small></div></div>
          <div class="acx-row">${modePill(st)}</div>
          <p class="acx-sync" data-auth="sync" aria-live="polite"></p>
          <p class="acx-sub">Your profile, goals, net worth, lesson progress, assessments, trade journal, plans and preferences are saved to your FiredBunny account and follow you to every device where you sign in. This device keeps a copy so pages open fast and work offline; signing out removes it.</p>
          <div class="acx-row"><a class="btn btn-p" href="#dashboard">Go to my dashboard ${ic('arrow')}</a><button type="button" class="btn btn-g" data-auth-act="signout">Sign out</button></div>
          <p class="acx-err" data-auth="out-msg" role="alert" hidden></p></div>
        ${migrationCard()}`, `Welcome <em>back</em>.`, 'You’re signed in. Everything you save follows you to every device.');
      wireMigration(view); liveSync(view);
      const b = $('[data-auth-act="signout"]', view); b.addEventListener('click', () => signOutFlow(b, $('[data-auth="out-msg"]', view), false));
      return 'Your account';
    }
    // not signed in: forms, and whatever an emailed link brought back
    let screen = 'signup', email = '', note = null; // note: {kind:'err'|'ok', text}
    const pwField = (id, label, auto) => `<label class="fld acx-pw" for="${id}"><span>${label}</span><input id="${id}" name="password" type="password" autocomplete="${auto}" minlength="8" required><button type="button" data-auth-act="show" aria-controls="${id}" aria-label="Show password">Show</button></label>`;
    const emailField = (id) => `<label class="fld" for="${id}"><span>Email</span><input id="${id}" name="email" type="email" autocomplete="email" inputmode="email" required value="${esc(email)}"></label>`;
    const noteHTML = () => (note ? `<p class="${note.kind === 'ok' ? 'acx-okmsg' : 'acx-err'}" role="${note.kind === 'ok' ? 'status' : 'alert'}">${note.text}</p>` : '');
    const tabs = () => `<div class="acx-tabs" role="group" aria-label="Create an account or sign in"><button type="button" data-auth-go="signup" aria-pressed="${screen === 'signup'}">Create account</button><button type="button" data-auth-go="signin" aria-pressed="${screen === 'signin'}">Sign in</button></div>`;
    function draw() {
      let card = '';
      if (screen === 'signup') card = `<form class="acx-card acx-auth" data-auth="signup" novalidate>${tabs()}
          <p class="acx-sub">Free. Keeps your progress, plans and profile on every device.</p>
          ${emailField('au-email')}${pwField('au-pw', 'Password', 'new-password')}
          <p class="acx-note">At least 8 characters. A few random words make a strong one.</p>
          ${noteHTML()}<button type="submit" class="btn btn-p">Create my account</button>
          <p class="acx-note">We’ll email you a link to confirm your address.</p></form>`;
      else if (screen === 'signin') card = `<form class="acx-card acx-auth" data-auth="signin" novalidate>${tabs()}
          ${emailField('au-email')}${pwField('au-pw', 'Password', 'current-password')}
          ${noteHTML()}<button type="submit" class="btn btn-p">Sign in</button>
          <button type="button" class="acx-linkbtn" data-auth-go="forgot">Forgot your password?</button></form>`;
      else if (screen === 'forgot') card = `<form class="acx-card acx-auth" data-auth="forgot" novalidate><div class="acx-h"><h2>${ico.key}Reset your password</h2></div>
          <p class="acx-sub">Enter your account’s email and we’ll send you a link to choose a new password. Open it in this browser.</p>
          ${emailField('au-email')}${noteHTML()}<button type="submit" class="btn btn-p">Email me a reset link</button>
          <button type="button" class="acx-linkbtn" data-auth-go="signin">Back to sign in</button></form>`;
      else if (screen === 'sent-confirm') card = `<div class="acx-card acx-auth hot"><div class="acx-h"><h2>${ico.check}Check your email</h2></div>
          <p class="acx-sub">We sent a confirmation link to <b>${esc(email)}</b>. Open it to finish creating your account; you’ll come back here signed in. It can take a minute, so check spam too.</p>
          ${noteHTML()}<div class="acx-row"><button type="button" class="btn btn-g" data-auth-act="resend">Send the link again</button><button type="button" class="acx-linkbtn" data-auth-go="signin">I’ve confirmed: sign in</button></div></div>`;
      else if (screen === 'sent-reset') card = `<div class="acx-card acx-auth hot"><div class="acx-h"><h2>${ico.check}Check your email</h2></div>
          <p class="acx-sub">If <b>${esc(email)}</b> has an account, a reset link is on its way. Open it in this browser to choose a new password.</p>
          <button type="button" class="acx-linkbtn" data-auth-go="signin">Back to sign in</button></div>`;
      else if (screen === 'recovery') card = `<form class="acx-card acx-auth" data-auth="recovery" novalidate><div class="acx-h"><h2>${ico.key}Choose a new password</h2></div>
          <p class="acx-sub">For ${esc(email || 'your account')}.</p>
          ${pwField('au-pw', 'New password', 'new-password')}<p class="acx-note">At least 8 characters.</p>
          ${noteHTML()}<button type="submit" class="btn btn-p">Save my new password</button></form>`;
      else if (screen === 'working') card = `<div class="acx-card"><div class="acx-id">${SML.bunnyMark(64)}<div><b>One moment…</b><small>Finishing sign-in.</small></div></div></div>`;
      shell(card, screen === 'signup' ? `Your progress, <em>everywhere</em>.` : `Welcome <em>back</em>.`, 'Create a free FiredBunny account to keep your lessons, plans and profile on every device. Or keep going as a guest: everything still saves in this browser.');
      wire();
    }
    const val = (n) => { const el = $(`[name="${n}"]`, view); return el ? el.value.trim() : ''; };
    const go = (sc, n) => { screen = sc; note = n || null; draw(); const f = $('input', view); if (f && sc !== 'working') f.focus(); };
    async function run(btn, fn) {
      const label = btn.textContent; btn.disabled = true; btn.textContent = 'One moment…';
      try { await fn(); } catch (e) { note = { kind: 'err', text: esc(e.message || 'Something went wrong. Please try again.') }; draw(); return; }
      if (btn.isConnected) { btn.disabled = false; btn.textContent = label; }
    }
    function wire() {
      $$('[data-auth-go]', view).forEach((b) => b.addEventListener('click', () => { email = val('email') || email; go(b.dataset.authGo); }));
      $$('[data-auth-act="show"]', view).forEach((b) => b.addEventListener('click', () => { const i = document.getElementById(b.getAttribute('aria-controls')); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.textContent = show ? 'Hide' : 'Show'; b.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); }));
      const f = $('form[data-auth]', view);
      if (f) f.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = $('button[type="submit"]', f); email = val('email') || email; const pw = val('password');
        const bad = (t) => { note = { kind: 'err', text: t }; draw(); };
        if (f.dataset.auth !== 'recovery' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Enter your email address.');
        if ((f.dataset.auth === 'signup' || f.dataset.auth === 'recovery') && pw.length < 8) return bad('Use at least 8 characters for your password.');
        if (f.dataset.auth === 'signin' && !pw) return bad('Enter your password.');
        if (f.dataset.auth === 'signup') run(btn, async () => { const r = await CL.signUp(email, pw); if (r.confirm) go('sent-confirm'); else location.reload(); });
        else if (f.dataset.auth === 'signin') run(btn, async () => { await CL.signIn(email, pw); location.reload(); });
        else if (f.dataset.auth === 'forgot') run(btn, async () => { await CL.sendReset(email); go('sent-reset'); });
        else if (f.dataset.auth === 'recovery') run(btn, async () => { await CL.newPassword(pw); location.reload(); });
      });
      const rs = $('[data-auth-act="resend"]', view);
      if (rs) rs.addEventListener('click', () => run(rs, async () => { await CL.resend(email); note = { kind: 'ok', text: 'Sent again. Give it a minute.' }; draw(); }));
    }
    const q = new URLSearchParams(location.search);
    if (q.get('code') || q.get('token_hash') || q.get('error') || q.get('error_description') || /error_description=/.test(location.hash)) {
      screen = 'working'; draw();
      CL.handleLink().then((r) => {
        if (!r) return go('signin');
        if (r.kind === 'confirmed') { location.reload(); return; } // signed in: the page comes back as your account
        if (r.kind === 'recovery') { email = r.email || ''; return go('recovery'); }
        if (r.kind === 'confirmed-elsewhere') return go('signin', { kind: 'ok', text: 'Your email is confirmed. Sign in with your password.' });
        return go(r.reset ? 'forgot' : 'signin', { kind: 'err', text: esc(r.message || 'That link didn’t work. Please try again.') });
      });
    } else draw();
    return 'Sign in';
  }

  function signinWeb(view) {
    if (SML.cloud && SML.cloud.enabled) return signinAccount(view);
    view.innerHTML = `
      ${SML.pageHeader('', 'Your space', `No account. <em>No</em> password.`, `<p>FiredBunny keeps your progress, profile, goals and assessments right here in your browser. Nothing to sign up for.</p>`)}
      <div class="wrap acx">
        <div class="acx-grid">
          <div class="acx-col">
            <div class="acx-card"><div class="acx-id">${SML.bunnyMark(64)}<div><b>Saved in this browser</b><small>Everything you do here is kept on this device.</small></div></div>
              <p class="acx-sub">Anyone using this browser can see it, so on a shared computer delete it from <a class="ulink" href="#settings">Settings</a> when you’re done. Clearing your browser data erases it, so export a copy now and then.</p>
              <div class="acx-row"><a class="btn btn-p" href="#dashboard">Go to my dashboard ${ic('arrow')}</a><a class="btn btn-g" href="#settings">Export my data</a></div></div>
            <div class="acx-card"><div class="acx-h"><h2>${ico.key}How saving works</h2></div>
              <ol class="acx-steps">
                <li><span><b>It saves as you go</b><small>Lessons you finish, your self-assessment, goals, net worth and household are stored in this browser automatically.</small></span></li>
                <li><span><b>Export a copy</b><small>Settings → Export downloads everything as one small file. Do it once a month.</small></span></li>
                <li><span><b>Move to another device</b><small>Open FiredBunny there and use Settings → Import with that file.</small></span></li>
                <li><span><b>Accounts and apps, later</b><small>Sign-in and the FiredBunny phone apps are in development. Your exported file will come with you.</small></span></li>
              </ol>
            </div>
          </div>
          <div class="acx-col">
            <div class="acx-card"><img class="fb-art" src="${SML.brandArt}" alt="FiredBunny, a relaxed bunny in orange sunglasses next to rising candles" width="600" height="400">
              <p class="acx-big">Learn early. <em>Stay chill.</em></p>
              <p class="acx-sub">The bunny remembers where you left off, in this browser.</p></div>
            <div class="acx-card"><div class="acx-h"><h2>${ico.lock}Privacy</h2></div>
              <p class="acx-note">Your data stays in this browser; FiredBunny has no server copy of it. Never enter passwords, account numbers or your Social Security number anywhere on FiredBunny; it never needs them.</p></div>
          </div>
        </div>
      </div>`;
    return 'Your space';
  }

  /* ---------------- profile ---------------- */
  let profDraft = null, profDirty = false;
  const REL = [['self', 'You'], ['partner', 'Partner'], ['child', 'Child'], ['parent', 'Parent'], ['other', 'Other']];
  function freshDraft() {
    const p = A().get();
    const d = { nickname: p.nickname || '', birthYear: p.birthYear, retireAge: p.retireAge, monthlySpend: p.monthlySpend, household: (p.household || []).map((m) => Object.assign({}, m)) };
    if (!d.household.some((m) => m.relation === 'self')) d.household.unshift({ id: A().newId('m'), name: p.nickname || A().status.name || '', relation: 'self', birthYear: p.birthYear, income: null, incomeNote: '' });
    const order = { self: 0, partner: 1, child: 2, parent: 3, other: 4 };
    d.household.sort((a, b) => (order[a.relation] ?? 9) - (order[b.relation] ?? 9));
    return d;
  }
  function memberRow(m, i) {
    const id = 'acm-' + i;
    return `<div class="acx-mem${m.relation === 'self' ? ' self' : ''}" data-i="${i}">
      <label class="fld acx-n" for="${id}-n"><span>Name</span><input id="${id}-n" data-f="name" type="text" maxlength="60" autocomplete="off" value="${esc(m.name || '')}" placeholder="${m.relation === 'self' ? esc((profDraft && profDraft.nickname) || 'You') : 'Name'}"></label>
      <label class="fld" for="${id}-r"><span>Relation</span><select id="${id}-r" data-f="relation">${REL.map(([v, l]) => `<option value="${v}"${m.relation === v ? ' selected' : ''}${v === 'self' && m.relation !== 'self' ? ' disabled' : ''}>${l}</option>`).join('')}</select></label>
      <label class="fld" for="${id}-y"><span>Born</span><input id="${id}-y" data-f="birthYear" type="number" inputmode="numeric" min="1920" max="${yearNow()}" step="1" value="${m.birthYear ?? ''}" placeholder="Year"></label>
      <label class="fld" for="${id}-i"><span>Income / yr</span><input id="${id}-i" data-f="income" type="number" inputmode="decimal" min="0" step="1000" value="${m.income ?? ''}" placeholder="0"></label>
      <label class="fld acx-nt" for="${id}-o"><span>Note</span><input id="${id}-o" data-f="incomeNote" type="text" maxlength="80" value="${esc(m.incomeNote || '')}" placeholder="${m.relation === 'child' ? 'e.g. summer job' : 'e.g. salary'}"></label>
      ${m.relation === 'self' ? '<span class="acx-x acx-ph" aria-hidden="true"></span>' : `<button type="button" class="acx-x" data-rm="${i}" aria-label="Remove ${esc(m.name || 'member')}">${ico.trash}<span>Remove</span></button>`}
    </div>`;
  }
  SML.pages.profile = function (view) {
    const st = A().status; const p = A().get();
    if (!profDirty) profDraft = freshDraft();
    const d = profDraft;
    const nm = d.nickname || st.name || '';
    const nw = A().netWorth(p);
    const last = latestSummary(p);
    const tracks = lessonsByTrack(); const doneAll = tracks.reduce((s, x) => s + x.done, 0);
    const cd = p.createdAt ? new Date(p.createdAt) : null; const since = cd && !isNaN(cd) ? SML.fmtDate(`${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}-${String(cd.getDate()).padStart(2, '0')}`) : '';
    view.innerHTML = `
      ${SML.pageHeader('', 'Profile', nm ? `Hi, <em>${esc(nm.split(' ')[0])}</em>.` : `Your <em>profile</em>.`, `<p>The basics the bunny uses to tailor your dashboard, goals and assessment. Fill in what you like; everything is optional.</p>`)}
      <div class="wrap acx">
        ${migrationCard()}
        <div class="acx-grid">
          <div class="acx-col">
            <div class="acx-card hot">
              <div class="acx-h"><div class="acx-id">${avatarHTML(st)}<div><b data-acx="name">${esc(nm || (st.signedIn ? 'You' : 'Guest'))}</b><small>${st.signedIn ? 'Signed in with your Claude account' : 'Guest in this browser'}${since ? ' · since ' + esc(since) : ''}</small></div></div>${modePill(st)}</div>
              <div class="acx-stats">
                <div class="acx-stat"><span>Lessons done</span><b class="acc">${doneAll}</b></div>
                <div class="acx-stat"><span>Assessments</span><b>${(p.assessmentSummary || []).length}</b></div>
                <div class="acx-stat"><span>Household</span><b data-acx="hh">${d.household.length}</b></div>
                <div class="acx-stat"><span>Net worth</span><b class="${nw.net >= 0 ? 'up' : ''}">${p.assets.length || p.debts.length ? money(nw.net) : '—'}</b></div>
              </div>
              ${st.mode !== 'cloud' && st.ready ? `<p class="acx-note">${SML.host === 'web' ? (SML.accountsOn ? '<a class="ulink" href="#signin">Sign in</a> to keep it on all your devices. ' : '') : st.signedIn ? 'Saving to your account isn’t allowed on this page. ' : 'You’re not signed in. '}Saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it from <a class="ulink" href="#settings">Settings</a> when you’re done. Export a file to move it. <a class="ulink" href="#signin">${SML.host === 'web' ? 'How saving works' : 'How sign-in works'}</a></p>` : ''}
            </div>

            <form class="acx-card" data-acx="form" novalidate>
              <div class="acx-h"><h2>${ico.user}About you</h2></div>
              <div class="acx-fields">
                <label class="fld" for="acx-nick"><span>What should we call you?</span><input id="acx-nick" type="text" maxlength="40" autocomplete="nickname" value="${esc(d.nickname)}" placeholder="${esc(st.name || 'Nickname')}"><small class="acx-help">${st.name ? `Leave empty to use your Claude name, <b>${esc(st.name)}</b>.` : 'Shown on your dashboard.'}</small></label>
                <label class="fld" for="acx-by"><span>Birth year</span><input id="acx-by" type="number" inputmode="numeric" min="1920" max="${yearNow()}" step="1" value="${d.birthYear ?? ''}" placeholder="e.g. 1992"><small class="acx-help" data-acx="age"></small></label>
                <label class="fld" for="acx-ra"><span>Target age to stop needing a paycheck</span><input id="acx-ra" type="number" inputmode="numeric" min="30" max="85" step="1" value="${d.retireAge ?? ''}" placeholder="e.g. 55"><small class="acx-help" data-acx="years"></small></label>
                <label class="fld" for="acx-ms"><span>Typical monthly spending</span><input id="acx-ms" type="number" inputmode="decimal" min="0" step="50" value="${d.monthlySpend ?? ''}" placeholder="e.g. 4500"><small class="acx-help" data-acx="spend"></small></label>
              </div>
            </form>

            <div class="acx-card">
              <div class="acx-h"><h2>${ico.home}Household</h2><button type="button" class="btn btn-g sm" data-acx-act="add">+ Add a member</button></div>
              <p class="acx-sub">Add the people whose income or goals are part of your plan. Your dashboard uses this to total household income and to tag assets and debts by owner.</p>
              <div class="acx-mems" data-acx="mems">${d.household.map(memberRow).join('')}</div>
              <div class="acx-tot"><span>Household income</span><b data-acx="inc"></b></div>
            </div>

            <div class="acx-bar" data-acx="bar" data-state="clean" role="status" aria-live="polite">
              <span class="acx-st"><i class="dot"></i><span data-acx="stx">${esc(savedWhere())}</span></span>
              <span class="acx-row"><button type="button" class="btn btn-g sm" data-acx-act="discard" disabled>Discard</button><button type="button" class="btn btn-p sm" data-acx-act="save" disabled>Save changes</button></span>
            </div>
          </div>

          <div class="acx-col">
            <div class="acx-card"><div class="acx-h"><h2>${ico.chart}Investor profile</h2></div>
              ${last ? `<div class="acx-arch"><img src="${SML.brandArt}" alt="" width="96" height="64"><div><b>${esc(last.name || 'Your profile')}</b><small>Risk ${last.risk != null ? Math.round(last.risk) + '/100' : '—'}${last.profile ? ' · ' + esc(String(last.profile)) : ''} · taken ${esc(SML.fmtDate(String(last.date).slice(0, 10)))}</small></div></div>
                <div class="acx-row"><a class="btn btn-p sm" href="#results">See my results ${ic('arrow')}</a><a class="btn btn-g sm" href="#assessment">Retake</a></div>`
                : `<p class="acx-sub">You haven’t taken the self-assessment yet. It takes about 7 minutes, with sliders for goals, money, time, risk and temperament.</p><div class="acx-row"><a class="btn btn-p sm" href="#assessment">Take the self-assessment ${ic('arrow')}</a></div>`}
            </div>
            <div class="acx-card"><div class="acx-h"><h2>${ico.book}Learning</h2></div>
              <div class="acx-prog">${tracks.map((x) => `<div class="acx-prow"><b>${esc(x.t.title)}</b><span>${x.done}/${x.total}</span><div class="acx-pb"><i style="width:${x.total ? Math.round((x.done / x.total) * 100) : 0}%"></i></div></div>`).join('')}</div>
            </div>
            <nav class="acx-links" aria-label="Your pages">
              <a class="acx-link" href="#dashboard">${ico.goal}<span><b>Dashboard</b><small>Goals, net worth and progress over time.</small></span></a>
              <a class="acx-link" href="#results">${ico.chart}<span><b>Assessment results</b><small>Your investor profile and recommendations.</small></span></a>
              <a class="acx-link" href="#settings">${ico.gear}<span><b>Settings</b><small>Sync, preferences, export and import.</small></span></a>
            </nav>
          </div>
        </div>
      </div>`;
    wireMigration(view);

    const bar = $('[data-acx="bar"]', view), stx = $('[data-acx="stx"]', view);
    const bSave = $('[data-acx-act="save"]', view), bDisc = $('[data-acx-act="discard"]', view);
    function setDirty(on, msg) {
      profDirty = on; bar.dataset.state = on ? 'dirty' : 'clean';
      stx.textContent = msg || (on ? 'You have unsaved changes' : savedWhere());
      bSave.disabled = !on; bDisc.disabled = !on;
    }
    function readTop() {
      d.nickname = $('#acx-nick', view).value.trim();
      d.birthYear = num($('#acx-by', view).value);
      d.retireAge = num($('#acx-ra', view).value);
      d.monthlySpend = num($('#acx-ms', view).value);
    }
    function readMembers() {
      $$('.acx-mem', view).forEach((row) => {
        const m = d.household[Number(row.dataset.i)]; if (!m) return;
        $$('[data-f]', row).forEach((el) => { const f = el.dataset.f; m[f] = (f === 'birthYear' || f === 'income') ? num(el.value) : el.value.trim(); });
      });
    }
    function helpers() {
      const age = d.birthYear ? yearNow() - d.birthYear : null;
      const ageEl = $('[data-acx="age"]', view), yrs = $('[data-acx="years"]', view), sp = $('[data-acx="spend"]', view);
      ageEl.textContent = age != null && age >= 0 && age < 120 ? `About ${age} years old.` : 'Used for retirement timelines.';
      if (age != null && d.retireAge) { const left = d.retireAge - age; yrs.innerHTML = left >= 15 ? `<b>${left} years</b> to go. Plenty of time for compounding to work.` : left >= 5 ? `<b>${left} years</b> to go. A decent runway: steady saving still adds up.` : left > 0 ? `<b>${left} year${left === 1 ? '' : 's'}</b> to go. Close: think about the mix and the cash cushion.` : 'That age has passed: the plan is about making the money last.'; }
      else yrs.textContent = 'Retire early, on time or never fully: your call.';
      sp.innerHTML = d.monthlySpend ? `About <b>${money(d.monthlySpend * 12)}</b> a year. At a 4% withdrawal that needs roughly <b>${money(d.monthlySpend * 12 * 25)}</b> invested.` : 'Helps size your FIRE number and emergency fund.';
      const inc = d.household.reduce((s, m) => s + (Number(m.income) || 0), 0);
      $('[data-acx="inc"]', view).textContent = `${money(inc)} a year`;
      $('[data-acx="hh"]', view).textContent = d.household.length;
    }
    function redrawMembers() { $('[data-acx="mems"]', view).innerHTML = d.household.map(memberRow).join(''); helpers(); }
    helpers();
    if (profDirty) setDirty(true);

    $('[data-acx="form"]', view).addEventListener('input', () => { readTop(); helpers(); setDirty(true); });
    $('[data-acx="form"]', view).addEventListener('submit', (e) => e.preventDefault());
    const mems = $('[data-acx="mems"]', view);
    mems.addEventListener('input', () => { readMembers(); helpers(); setDirty(true); });
    mems.addEventListener('change', () => { readMembers(); helpers(); setDirty(true); });
    mems.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]'); if (!b) return;
      readMembers(); d.household.splice(Number(b.dataset.rm), 1); redrawMembers(); setDirty(true);
    });
    $('[data-acx-act="add"]', view).addEventListener('click', () => {
      readMembers(); d.household.push({ id: A().newId('m'), name: '', relation: d.household.some((m) => m.relation === 'partner') ? 'child' : 'partner', birthYear: null, income: null, incomeNote: '' });
      redrawMembers(); setDirty(true);
      const last = $$('.acx-mem', view).pop(); if (last) { const inp = $('input', last); if (inp) inp.focus(); }
    });
    bDisc.addEventListener('click', () => { profDirty = false; profDraft = null; SML.rerender(); });
    bSave.addEventListener('click', async () => {
      readTop(); readMembers();
      const yr = yearNow();
      const bad = (d.birthYear != null && (d.birthYear < 1920 || d.birthYear > yr)) || (d.retireAge != null && (d.retireAge < 30 || d.retireAge > 85)) || (d.monthlySpend != null && d.monthlySpend < 0);
      if (bad) { setDirty(true, 'Check the numbers: birth year 1920–' + yr + ', target age 30–85.'); return; }
      const self = d.household.find((m) => m.relation === 'self'); if (self && d.birthYear && !self.birthYear) self.birthYear = d.birthYear;
      const household = d.household.filter((m) => m.relation === 'self' || m.name || m.income || m.birthYear).map((m) => ({ id: m.id || A().newId('m'), name: m.name || '', relation: m.relation || 'other', birthYear: m.birthYear ?? null, income: m.income ?? null, incomeNote: m.incomeNote || '' }));
      bSave.disabled = true; stx.textContent = 'Saving…';
      try {
        await A().save({ nickname: d.nickname, birthYear: d.birthYear, retireAge: d.retireAge, monthlySpend: d.monthlySpend, household });
        profDirty = false; profDraft = null;
        setDirty(false, savedWhere() + ' · just now');
        $('[data-acx="name"]', view).textContent = d.nickname || A().status.name || (A().status.signedIn ? 'You' : 'Guest');
        SML.hop('Hop hop. Profile saved.');
      } catch (e) { setDirty(true, 'Could not save right now. Your changes are still here; try again.'); }
    });
    return 'Profile';
  };

  /* ---------------- settings ---------------- */
  function download(filename, text) {
    return new Promise((resolve) => {
      const fallback = () => {
        try {
          const blob = new Blob([text], { type: 'application/json' });
          const url = URL.createObjectURL(blob); const a = document.createElement('a');
          a.href = url; a.download = filename; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 4000); resolve('fallback');
        } catch (e) { resolve('failed'); }
      };
      (async () => {
        const dl = await use('downloads');
        if (!dl) return fallback();
        try { await dl.save({ filename, data: text }); resolve('saved'); }
        catch (err) { const c = err && err.code; if (c === 'declined') resolve('declined'); else if (c === 'rate_limited') { SML.toast('A save is already waiting for you.'); resolve('rate_limited'); } else fallback(); }
      })();
    });
  }
  function countPreview(obj) {
    const p = obj.profile || {};
    return { household: (p.household || []).length, assets: (p.assets || []).length, debts: (p.debts || []).length, goals: (p.goals || []).length, assessments: (obj.assessments || []).length, lessons: (obj.progress || p.progress && p.progress.done || []).length };
  }
  SML.pages.settings = function (view) {
    const st = A().status; const p = A().get(); const prefs = p.prefs || {};
    const tracks = lessonsByTrack(); const doneAll = tracks.reduce((s, x) => s + x.done, 0);
    const kind = stateKind(st);
    const syncText = {
      checking: 'Checking whether you’re signed in…',
      cloud: 'You’re signed in with your Claude account. Your profile, goals, net worth, assessments and lesson progress are saved to your private FiredBunny profile, not to this browser. Other visitors and the site owner can’t read it, and it follows you to any device where you sign in.',
      readonly: 'You’re signed in, but this page was shared with you in a way that lets you read it, not save to it, so your data is saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it below when you’re done. Export a file to move it, or ask for Contributor access to save to your account.',
      guest: 'You’re not signed in, so your data is saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it below when you’re done. Clearing browser data loses it: export a file to keep a copy or move it.',
    }[kind];
    const syncWeb = 'FiredBunny saves your profile, goals, net worth, assessments and lesson progress in this browser only. None of it is sent to a server, and there is no account to create. Anyone using this browser can see it, so on a shared computer delete it below when you’re done. Clearing browser data loses it: export a file to keep a copy or move it to another device.';
    const sb = st.provider === 'supabase', webGuestAcc = SML.host === 'web' && !sb && SML.accountsOn;
    const syncSB = 'You’re signed in to your FiredBunny account. Your profile, goals, net worth, assessments, lesson progress, trade journal, plans and preferences are saved to your account and follow you to every device where you sign in. Other visitors can’t see it. This device keeps a copy so pages open fast and work offline; signing out removes it.';
    const syncGuestAcc = 'You’re not signed in, so your data is saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it below when you’re done. Create a free account to keep it on all your devices, or export a file to keep a copy.';
    view.innerHTML = `
      ${SML.pageHeader('', 'Settings', `Your data, <em>your</em> rules.`, `<p>Sync, preferences, lesson progress, and full control over your data: export it, import it or delete it.</p>`)}
      <div class="wrap acx">
        ${migrationCard()}
        <div class="acx-grid">
          <div class="acx-col">
            <section class="acx-card" aria-labelledby="acx-s1"><div class="acx-h"><h2 id="acx-s1">${ico.sync}Storage &amp; sync</h2>${modePill(st)}</div>
              <div class="acx-id">${avatarHTML(st, 48)}<div><span class="acx-dname">${esc(A().displayName() || (st.signedIn ? 'Signed in' : 'Guest'))}</span><small>${SML.host === 'web' ? (sb ? esc(st.email || '') + ' · FiredBunny account' : webGuestAcc ? 'Guest · saved in this browser' : 'This browser · no account needed') : kind === 'cloud' ? 'Claude account · private FiredBunny profile' : kind === 'readonly' ? 'Claude account · saving here not allowed' : kind === 'guest' ? 'Not signed in · this browser' : 'Checking…'}</small></div></div>
              <p class="acx-sub">${SML.host === 'web' ? (sb ? syncSB : webGuestAcc ? syncGuestAcc : syncWeb) : syncText}</p>
              ${sb ? '<p class="acx-sync" data-auth="sync" aria-live="polite"></p>' : ''}
              ${st.cloudError && st.signedIn && !sb ? `<p class="acx-note">Saving to your account stopped (${esc(String(st.cloudError))}). Nothing is lost: changes are saved in this browser for now, where anyone using it can see them. Reload the page to try again.</p>` : ''}
              <div class="acx-row">${sb ? '<a class="btn btn-g sm" href="#signin">Your account</a><button type="button" class="btn btn-g sm" data-auth-act="signout">Sign out</button>' : webGuestAcc ? '<a class="btn btn-p sm" href="#signin">Sign in or create an account</a>' : `<a class="btn btn-g sm" href="#signin">${SML.host === 'web' ? 'How saving works' : 'How sign-in works'}</a>`}${kind !== 'cloud' && SML.host !== 'web' ? '<button type="button" class="btn btn-g sm" data-acx-act="reload">Reload and retry</button>' : ''}</div>
            </section>

            <section class="acx-card" aria-labelledby="acx-s2"><div class="acx-h"><h2 id="acx-s2">${ico.gear}Preferences</h2><span class="acx-ok" data-acx="pref-ok" aria-live="polite"></span></div>
              <div class="acx-toggle"><span><b>Track the Lessons page opens on</b><small>Where “Continue” and the Lessons tab take you.</small></span></div>
              ${SML.ui.seg('acx-track', (SML.tracks || []).map((t) => ({ v: t.id, label: t.short || t.title })), prefs.defaultTrack || SML.store.get('track', 'trading'), 'Default track')}
              <div class="acx-toggle"><span><b>Show weekly releases on the calendar</b><small>Jobless claims every Thursday and oil inventories every Wednesday.</small></span><button type="button" class="acx-sw" role="switch" aria-checked="${!!prefs.weeklyOnCalendar}" data-pref="weeklyOnCalendar" aria-label="Show weekly releases on the calendar"></button></div>
              <div class="acx-toggle"><span><b>Show bunny tips</b><small>Short asides from the bunny on your dashboard and results.</small></span><button type="button" class="acx-sw" role="switch" aria-checked="${prefs.showTips !== false}" data-pref="showTips" aria-label="Show bunny tips"></button></div>
            </section>

            <section class="acx-card" aria-labelledby="acx-s3"><div class="acx-h"><h2 id="acx-s3">${ico.book}Lesson progress</h2><span class="acx-note">${doneAll} lessons done</span></div>
              <div class="acx-prog">${tracks.map((x) => `<div class="acx-prow"><b>${esc(x.t.title)}</b><span>${x.done}/${x.total}</span><div class="acx-pb"><i style="width:${x.total ? Math.round((x.done / x.total) * 100) : 0}%"></i></div></div>`).join('')}</div>
              <p class="acx-note">Progress saves automatically as you mark lessons complete${kind === 'cloud' ? ' and syncs to your account' : ''}.</p>
              <div data-acx="reset-wrap"><button type="button" class="btn btn-g sm" data-acx-act="reset"${doneAll ? '' : ' disabled'}>Reset lesson progress</button></div>
            </section>

            <section class="acx-card" aria-labelledby="acx-s4"><div class="acx-h"><h2 id="acx-s4">${ico.down}Export &amp; import</h2></div>
              <p class="acx-sub">Download everything as one file: profile, household, assets, debts, goals, net worth history, assessments and lesson progress. Import it on another device or browser to pick up where you left off.</p>
              <div class="acx-row"><button type="button" class="btn btn-p" data-acx-act="export">${ico.down}Export my data (.json)</button><span class="acx-note" data-acx="exp-msg" aria-live="polite"></span></div>
              <div class="acx-file">
                <label class="fld" for="acx-file"><span>Import a FiredBunny file</span><input id="acx-file" type="file" accept="application/json,.json"></label>
                <div data-acx="imp-prev" aria-live="polite"></div>
              </div>
            </section>

            <section class="acx-card acx-danger" aria-labelledby="acx-s5"><div class="acx-h"><h2 id="acx-s5">${ico.trash}Delete my data</h2></div>
              <p class="acx-sub">Permanently removes your profile, household, assets, debts, goals, net worth history, assessments and lesson progress${kind === 'cloud' ? ' from your account' : ' from this browser'}. Export first if you might want it back.</p>
              <label class="fld" for="acx-del"><span>Type DELETE to confirm</span><input id="acx-del" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DELETE"></label>
              <div class="acx-row"><button type="button" class="btn btn-dn" data-acx-act="delete" disabled>Delete everything</button>${sb ? '<button type="button" class="btn btn-g" data-acx-act="delete-account" disabled>Delete my account too</button>' : ''}<span class="acx-note" data-acx="del-msg" aria-live="polite"></span></div>
              ${sb ? '<p class="acx-note">“Delete my account too” also removes your login and email address. You can create a new account later, but nothing comes back.</p><p class="acx-err" data-auth="out-msg" role="alert" hidden></p>' : ''}
            </section>
          </div>

          <div class="acx-col">
            <section class="acx-card" aria-labelledby="acx-s6"><div class="acx-h"><h2 id="acx-s6">${ico.phone}Connected apps</h2><span class="acx-pill local">Coming soon</span></div>
              <div class="acx-phone">
                <svg class="dev" width="64" height="96" viewBox="0 0 64 96" aria-hidden="true"><rect x="4" y="2" width="56" height="92" rx="10" style="fill:var(--bg);stroke:var(--line)" stroke-width="2"/><rect x="10" y="12" width="44" height="66" rx="3" style="fill:var(--surface)"/><path d="M16 64l8-10 7 5 9-14 8 6" fill="none" style="stroke:var(--up)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="86" r="3" style="fill:var(--line)"/><text x="32" y="28" text-anchor="middle" style="fill:var(--gold);font:700 9px var(--sans)">$1.2M</text></svg>
                <p class="acx-note">The FiredBunny mobile apps (wheel tracker, retirement runway and trader toolkit) are in development. ${SML.host === 'web' ? (SML.accountsOn ? 'They will sign in with your FiredBunny account, so your goals, net worth and progress show up on your phone.' : 'They will bring your goals, net worth and progress to your phone.') : 'They will sign in with the same Claude account and read this same profile, so your goals, net worth and progress show up on your phone.'} Until then, <b>Export</b> gives you everything in one file.</p>
              </div>
              <a class="acx-link" href="#apps">${ico.phone}<span><b>See the apps</b><small>What’s coming, and what each one does.</small></span></a>
            </section>

            ${SML.host === 'web' ? `<section class="acx-card" aria-labelledby="acx-s9"><div class="acx-h"><h2 id="acx-s9">${ico.down}Offline &amp; app</h2></div>
              <p class="acx-sub">Install FiredBunny on your phone or computer, and download lesson audio to listen without a connection.</p>
              <a class="acx-link" href="#offline">${ico.down}<span><b>Offline &amp; app</b><small>Install the app, manage downloads and storage.</small></span></a>
            </section>` : ''}

            <section class="acx-card acx-hide" data-acx="perm" aria-labelledby="acx-s7"><div class="acx-h"><h2 id="acx-s7">${ico.key}Permissions</h2></div>
              <p class="acx-note">Review what this page may do for you, such as saving files and storing your data.</p>
              <div class="acx-row"><button type="button" class="btn btn-g sm" data-acx-act="perm">Manage permissions</button><span class="acx-note" data-acx="perm-msg"></span></div>
            </section>

            <section class="acx-card" aria-labelledby="acx-s8"><div class="acx-h"><h2 id="acx-s8">${ico.shield}Privacy</h2></div>
              <ul class="acx-list">
                ${SML.host === 'web' ? `${SML.accountsOn ? `<li>${ico.check}<span>Signed in, your data is saved to your FiredBunny account, in FiredBunny’s database (hosted by Supabase), together with your email address. Other visitors can’t see it. Export it or delete your account here at any time.</span></li>
                <li>${ico.check}<span>As a guest, your data is saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it here when you’re done.</span></li>` : `<li>${ico.check}<span>Your data is saved in this browser only. FiredBunny has no server copy of it. Anyone using this browser can see it, so on a shared computer delete it here when you’re done.</span></li>
                <li>${ico.check}<span>No accounts and no passwords to leak.</span></li>`}
                <li>${ico.check}<span>Usage stats: FiredBunny uses Google Analytics (through Google Tag Manager) to count visits and see which pages, lessons, tools and audio people use, so it can make better ones. It never sends your profile, goals, money figures or anything you type into the tools.</span></li>` : `<li>${ico.check}<span>Signed in, your data is saved to your private FiredBunny profile. Other visitors and the site owner can’t read it.</span></li>
                <li>${ico.check}<span>As a guest, your data is saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it here when you’re done.</span></li>
                <li>${ico.check}<span>No passwords: FiredBunny uses your Claude account, so there is no FiredBunny password to leak.</span></li>`}
                <li>${ico.check}<span>Never enter account numbers, logins or your Social Security number. FiredBunny only needs rough amounts.</span></li>
                ${SML.host === 'web' ? '' : `<li>${ico.check}<span>Feedback you send from the About page is the only thing the owner reads.</span></li>`}
                <li>${ico.check}<span>Delete everything any time with the button on this page.</span></li>
              </ul>
              ${SML.host === 'web' && SML.analytics && (SML.analytics.available || SML.analytics.debug()) ? `<div class="acx-toggle"><span><b>Share usage stats</b><small>Google Analytics. Off means nothing is sent from this browser.</small></span><button type="button" class="acx-sw" role="switch" aria-checked="${SML.analytics.allowed()}" data-analytics aria-label="Share usage stats with Google Analytics"></button></div>` : ''}
            </section>
            ${prefs.showTips !== false ? SML.bunnyTip('Export a copy once a month. It takes two seconds and it is the best insurance for your data, especially in guest mode.') : ''}
          </div>
        </div>
      </div>`;
    wireMigration(view);

    const rl = $('[data-acx-act="reload"]', view); if (rl) rl.addEventListener('click', () => location.reload());

    /* preferences */
    const prefOk = $('[data-acx="pref-ok"]', view); let prefT;
    const flash = () => { prefOk.textContent = savedWhere(); clearTimeout(prefT); prefT = setTimeout(() => { prefOk.textContent = ''; }, 2200); };
    SML.onCleanup(() => clearTimeout(prefT));
    $('#acx-track', view).addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      $$('#acx-track button', view).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      SML.store.set('track', b.dataset.v);
      await A().save((q) => { q.prefs = Object.assign({}, q.prefs, { defaultTrack: b.dataset.v }); }); flash();
    });
    $$('[data-pref]', view).forEach((sw) => sw.addEventListener('click', async () => {
      const on = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', on);
      const k = sw.dataset.pref;
      await A().save((q) => { q.prefs = Object.assign({}, q.prefs, { [k]: on }); }); flash();
      if (k === 'showTips') SML.rerender();
    }));

    /* usage stats switch */
    const asw = $('[data-analytics]', view);
    if (asw) asw.addEventListener('click', () => { const on = asw.getAttribute('aria-checked') !== 'true'; if (!on) SML.track('analytics_opt_out', { label: 'settings' }); SML.analytics.set(on); asw.setAttribute('aria-checked', String(on)); SML.toast(on ? 'Thanks: usage stats are on.' : 'Usage stats are off for this browser.'); });

    /* reset progress */
    const rw = $('[data-acx="reset-wrap"]', view);
    rw.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.acxAct === 'reset') {
        rw.innerHTML = `<div class="acx-confirm"><p>Reset all ${doneAll} completed lessons? Your profile, goals and assessments stay.</p><button type="button" class="btn btn-dn sm" data-acx-act="reset-yes">Yes, reset</button><button type="button" class="btn btn-g sm" data-acx-act="reset-no">Cancel</button></div>`;
        const y = $('[data-acx-act="reset-yes"]', rw); if (y) y.focus();
      } else if (b.dataset.acxAct === 'reset-no') { SML.rerender(); }
      else if (b.dataset.acxAct === 'reset-yes') {
        SML.store.set('done', []);
        await A().save((q) => { q.progress = Object.assign({}, q.progress, { done: [] }); });
        document.dispatchEvent(new CustomEvent('sml:progress'));
        SML.toast('Lesson progress reset. Fresh start.'); SML.rerender();
      }
    });

    /* export */
    const expMsg = $('[data-acx="exp-msg"]', view);
    $('[data-acx-act="export"]', view).addEventListener('click', async (e) => {
      const btn = e.currentTarget; btn.disabled = true; expMsg.textContent = 'Preparing…';
      try {
        const data = await A().exportData();
        const t = new Date(); const name = `firedbunny-data-${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}.json`;
        const r = await download(name, JSON.stringify(data, null, 2));
        expMsg.textContent = r === 'declined' ? 'Save cancelled.' : r === 'failed' ? 'Could not save the file here.' : r === 'rate_limited' ? '' : `Saved ${name}`;
        if (r === 'saved' || r === 'fallback') SML.hop('Hop hop. Your data file is ready.');
      } catch (err) { expMsg.textContent = 'Could not export right now.'; }
      btn.disabled = false;
    });

    /* import */
    const prev = $('[data-acx="imp-prev"]', view); let pending = null;
    $('#acx-file', view).addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0]; pending = null; prev.innerHTML = '';
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) { prev.innerHTML = '<p class="acx-err">That file is too large to be a FiredBunny export.</p>'; return; }
      const rd = new FileReader();
      rd.onload = () => {
        let obj = null;
        try { obj = JSON.parse(String(rd.result)); } catch (err) { prev.innerHTML = '<p class="acx-err">That file isn’t valid JSON.</p>'; return; }
        if (!obj || typeof obj !== 'object' || !obj.profile || typeof obj.profile !== 'object' || (obj.app && obj.app !== 'FiredBunny')) { prev.innerHTML = '<p class="acx-err">This doesn’t look like a FiredBunny export. Use a file from “Export my data”.</p>'; return; }
        pending = obj; const c = countPreview(obj);
        const when = obj.exportedAt ? SML.fmtDate(String(obj.exportedAt).slice(0, 10)) : 'an unknown date';
        prev.innerHTML = `<p class="acx-note">Exported on <b>${esc(when)}</b>. Importing replaces your current profile with this one and adds its assessments and lessons.</p>
          <div class="acx-prev"><span>Household <b>${c.household}</b></span><span>Assets <b>${c.assets}</b></span><span>Debts <b>${c.debts}</b></span><span>Goals <b>${c.goals}</b></span><span>Assessments <b>${c.assessments}</b></span><span>Lessons <b>${c.lessons}</b></span></div>
          <div class="acx-row"><button type="button" class="btn btn-p sm" data-acx-act="import">${ico.up}Import this file</button><button type="button" class="btn btn-g sm" data-acx-act="import-cancel">Cancel</button></div>`;
      };
      rd.onerror = () => { prev.innerHTML = '<p class="acx-err">Could not read that file.</p>'; };
      rd.readAsText(f);
    });
    prev.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.acxAct === 'import-cancel') { pending = null; prev.innerHTML = ''; $('#acx-file', view).value = ''; return; }
      if (b.dataset.acxAct === 'import' && pending) {
        b.disabled = true; b.textContent = 'Importing…';
        try { await A().importData(pending); document.dispatchEvent(new CustomEvent('sml:progress')); profDirty = false; profDraft = null; SML.hop('Hop hop. Import complete.'); SML.rerender(); }
        catch (err) { prev.innerHTML = `<p class="acx-err">${esc((err && err.message) || 'Import failed.')}</p>`; }
      }
    });

    /* delete */
    const delIn = $('#acx-del', view), delBtn = $('[data-acx-act="delete"]', view), delMsg = $('[data-acx="del-msg"]', view);
    const delAcc = $('[data-acx-act="delete-account"]', view);
    delIn.addEventListener('input', () => { delBtn.disabled = delIn.value.trim().toUpperCase() !== 'DELETE'; if (delAcc) delAcc.disabled = delBtn.disabled; });
    if (delAcc) delAcc.addEventListener('click', async () => {
      if (delIn.value.trim().toUpperCase() !== 'DELETE') return;
      delAcc.disabled = true; delBtn.disabled = true; delMsg.textContent = 'Deleting your account…';
      try { await SML.cloud.deleteAccount(); SML.toast('Your FiredBunny account is deleted.'); setTimeout(() => location.replace((SML.routes && SML.routes.mode === 'path') ? SML.routes.path('home') : location.pathname), 600); }
      catch (err) { delMsg.textContent = (err && err.message) || 'Could not delete your account right now. Try again.'; delAcc.disabled = false; delBtn.disabled = false; }
    });
    const so = $('[data-auth-act="signout"]', view), soMsg = $('[data-auth="out-msg"]', view);
    if (so && soMsg) so.addEventListener('click', () => signOutFlow(so, soMsg, false));
    liveSync(view);
    delBtn.addEventListener('click', async () => {
      if (delIn.value.trim().toUpperCase() !== 'DELETE') return;
      delBtn.disabled = true; delMsg.textContent = 'Deleting…';
      try {
        await A().clearAll();
        SML.store.set('done', []); SML.store.set('assessDraft', null); SML.assessDraft = null;
        document.dispatchEvent(new CustomEvent('sml:progress'));
        profDirty = false; profDraft = null;
        SML.toast('All your FiredBunny data is deleted.'); SML.rerender();
      } catch (err) { delMsg.textContent = 'Could not delete everything right now. Try again.'; delBtn.disabled = false; }
    });

    /* permissions (built-in namespace; only shown when the runtime offers it) */
    (async () => {
      const perm = await use('permissions');
      const card = $('[data-acx="perm"]', view);
      if (!perm || !card || !card.isConnected || typeof perm.manage !== 'function') return;
      card.classList.remove('acx-hide');
      $('[data-acx-act="perm"]', card).addEventListener('click', async () => {
        try { await perm.manage(); } catch (err) { const m = $('[data-acx="perm-msg"]', card); if (m) m.textContent = 'Open the artifact’s Permissions menu in claude.ai instead.'; }
      });
    })();
    return 'Settings';
  };
})();
