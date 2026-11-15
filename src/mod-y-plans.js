/* Plans (/plans/): FiredBunny is free and everything on it today stays free; an optional paid plan for a few extras that
 * cost money for each person who uses them is only being considered (no price, no date), with a waitlist.
 *
 * - The waitlist is public.waitlist (supabase/schema.sql). Signed in on the website, joining is one click and stores the
 *   account id (no email is asked for); a signed-in person sees whether they are on the list and can leave it here.
 *   Guests give an email, used only to say if the plan opens. Both may tick extras (a fixed list, the owner's demand
 *   signal) and add a short note. Visitors can never read the list back, and joining twice looks exactly like joining
 *   once (the database quietly skips a duplicate), so the page never shows whether an address is already on it.
 * - The claude.ai copy and a copy opened from disk collect nothing: they point to firedbunny.com/plans.
 * - Fields carry no name attribute, so a press of Enter before the script has started (on the pre-built page) sends
 *   nothing anywhere. The waitlist box depends on who is looking, so it is data-volatile (left out of the lastmod hash).
 * - Framing: every extra is education that explains a person's own numbers with the lessons; none tells anyone what to
 *   buy or sell, manages money or promises returns. No prices or dates on the page. If what the page promises changes,
 *   change the Support page, the help chat's plans, free and support replies (src/chat-data.js) and the Settings privacy
 *   line in the same commit.
 * - Analytics: one coarse event, waitlist_join { label: the ticked extras' ids, comma-separated, or 'none'; method:
 *   account | email }, through SML.track (website only, with consent). Never the email or the note.
 * Prefix: .pl- */
(function () {
  'use strict';
  const SML = window.SML, esc = SML.esc, $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------------- the extras being considered (ids are stored; keep them in step with supabase/schema.sql) ---------------- */
  const EXTRAS = [
    { id: 'review', t: 'Portfolio review in plain words', d: 'An AI-written explanation of your own portfolio: allocation, concentration, costs and taxes, each tied to the lesson behind it.' },
    { id: 'coach', t: 'Questions about your numbers', d: 'Ask about your own figures and get answers that point to the lessons and tools, like a study partner who knows your situation.' },
    { id: 'report', t: 'Printable self-assessment report', d: 'Your self-assessment results as a PDF to print or keep: your investor profile, risk picture and learning path.' },
    { id: 'history', t: 'Deeper portfolio history', d: 'How a connected portfolio’s allocation, income and gains changed over months and years, not just today.' },
  ];
  const IDS = EXTRAS.map((x) => x.id);
  const MAX = { email: 254, note: 280 };
  const emailOk = (s) => typeof s === 'string' && s.length <= MAX.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const hasRuntime = () => !!(window.claude && typeof window.claude.use === 'function');
  /** Where sign-ups can go from this view: 'supabase' (the website), 'claude' (the claude.ai copy) or 'elsewhere'. */
  const where = () => (hasRuntime() ? 'claude' : SML.cloud && SML.cloud.configured && /^https?:$/.test(location.protocol) ? 'supabase' : 'elsewhere');
  const signedIn = () => where() === 'supabase' && !!(SML.cloud.enabled && SML.cloud.user);

  // a few sign-ups per tab in ten minutes is plenty; more is a stuck button or a script
  const SENT = 'fb-waitlist-sent';
  function recent() { try { const a = JSON.parse(sessionStorage.getItem(SENT) || '[]'); return Array.isArray(a) ? a.filter((t) => Date.now() - t < 600000) : []; } catch (e) { return []; } }
  function remember() { try { const a = recent(); a.push(Date.now()); sessionStorage.setItem(SENT, JSON.stringify(a)); } catch (e) {} }
  const isNetwork = (e) => !!(e && (e.network || e.status === 0 || /fetch|network|load failed|timeout|offline/i.test(String(e.message || e))));
  // why a request failed: offline, missing (the table is not set up yet), busy, invalid, duplicate, error
  function reason(e) {
    const code = String((e && e.code) || ''), msg = String((e && (e.message || e.details)) || e || '');
    if (navigator.onLine === false || isNetwork(e)) return 'offline';
    if (code === 'PGRST205' || code === '42P01' || (e && e.status === 404) || /schema cache|does not exist/i.test(msg)) return 'missing';
    if (code === '23505') return 'duplicate';
    if (/too many waitlist/i.test(msg) || (e && e.status === 429)) return 'busy';
    if (/^(23514|22001|23502|22P02)$/.test(code)) return 'invalid';
    return 'error';
  }
  const fail = (error, status) => { throw Object.assign(error instanceof Error ? error : Object.assign(new Error(String((error && error.message) || 'error')), error), { status }); };

  /** Join. o = { email (guests), extras: [ids], note }. Resolves { ok: true, via } or { ok: false, reason }; never throws.
   *  Joining again resolves ok as well: the database keeps the first sign-up and says nothing. */
  async function join(o) {
    o = o || {};
    const extras = IDS.filter((id) => Array.isArray(o.extras) && o.extras.indexOf(id) >= 0); // known ids only, in the page's order
    const note = String(o.note || '').trim().slice(0, MAX.note);
    const acct = signedIn();
    const email = acct ? '' : String(o.email || '').trim();
    if (where() !== 'supabase') return { ok: false, reason: 'elsewhere' };
    if (!acct && !emailOk(email)) return { ok: false, reason: 'email' };
    if (recent().length >= 5) return { ok: false, reason: 'busy' };
    if (navigator.onLine === false) return { ok: false, reason: 'offline' };
    try {
      const c = await SML.cloud.feedbackClient(); // anyone, signed in or not (a signed-in person's session comes along)
      const row = { extras };
      if (note) row.note = note;
      if (!acct) row.email = email;
      // insert only: nothing is asked back (visitors cannot read the list)
      const { error, status } = await c.from('waitlist').insert(row);
      if (error && String(error.code) !== '23505') fail(error, status); // 23505: two identical sign-ups at once; still on the list
      remember();
      SML.track('waitlist_join', { label: extras.length ? extras.join(',') : 'none', method: acct ? 'account' : 'email' });
      return { ok: true, via: acct ? 'account' : 'email' };
    } catch (e) { return { ok: false, reason: reason(e) }; }
  }
  /** Signed in: is this account on the list? Resolves { ok: true, on, at, extras } or { ok: false, reason }. */
  async function status() {
    if (!signedIn()) return { ok: false, reason: 'guest' };
    try {
      const c = await SML.cloud.client();
      const { data, error, status: st } = await c.from('waitlist').select('created_at,extras').limit(1);
      if (error) fail(error, st);
      const r = data && data[0];
      return { ok: true, on: !!r, at: r ? r.created_at : null, extras: r && Array.isArray(r.extras) ? r.extras.filter((x) => IDS.indexOf(x) >= 0) : [] };
    } catch (e) { return { ok: false, reason: reason(e) }; }
  }
  /** Signed in: leave the list (deletes the account's sign-up). Resolves { ok } or { ok: false, reason }. */
  async function leave() {
    if (!signedIn()) return { ok: false, reason: 'guest' };
    if (navigator.onLine === false) return { ok: false, reason: 'offline' };
    try {
      const c = await SML.cloud.client();
      const { error, status: st } = await c.from('waitlist').delete().eq('user_id', SML.cloud.user.id);
      if (error) fail(error, st);
      return { ok: true };
    } catch (e) { return { ok: false, reason: reason(e) }; }
  }
  SML.plans = { EXTRAS, MAX, emailOk, where, signedIn, join, status, leave };

  /* ---------------- styles ---------------- */
  SML.css(`
    .pl-hdr .h-page{max-width:11ch}
    .pl-hcta{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
    .pl-two{display:grid;gap:16px;grid-template-columns:1fr}
    @media(min-width:900px){.pl-two{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}}
    .pl-card{display:flex;flex-direction:column;gap:16px;padding:24px 20px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);min-width:0}
    @media(min-width:768px){.pl-card{padding:30px 28px}}
    .pl-free{border-color:color-mix(in srgb,var(--up) 45%,var(--line))}
    .pl-plus{background:color-mix(in srgb,var(--surface) 70%,transparent);border-style:dashed}
    .pl-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}
    .pl-top h3{font-size:19px;font-weight:600;color:var(--ink);line-height:1.3}
    .pl-top h3 small{font-size:13px;font-weight:400;color:var(--muted)}
    .pl-pill-on{color:var(--up);border-color:color-mix(in srgb,var(--up) 50%,var(--line))}
    .pl-pill-maybe{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 50%,var(--line))}
    .pl-big{font-family:var(--display);font-size:clamp(44px,7vw,64px);line-height:.9;color:var(--ink);letter-spacing:.01em}
    .pl-plus .pl-big{color:var(--accent)}
    .pl-lead{font-size:16px;line-height:1.6;color:color-mix(in srgb,var(--ink) 80%,transparent);text-wrap:pretty}
    .pl-list{list-style:none;display:flex;flex-direction:column;gap:12px;border-top:1px solid var(--line);padding-top:18px}
    .pl-list li{display:flex;gap:12px;align-items:flex-start;font-size:15.5px;line-height:1.6;color:color-mix(in srgb,var(--ink) 84%,transparent)}
    .pl-list li > svg{flex:0 0 auto;margin-top:4px}
    .pl-list b{color:var(--ink);font-weight:600}
    .pl-free .pl-list li > svg{color:var(--up)}
    .pl-plus .pl-list li > svg{color:var(--accent)}
    .pl-foot{font-size:14.5px;line-height:1.6;color:var(--muted);margin-top:auto;padding-top:4px;text-wrap:pretty}
    .pl-foot b{color:var(--ink);font-weight:600}
    .pl-card .btn{align-self:flex-start}
    .pl-card a:not(.btn),.pl-faq a,.pl-side a,.pl-box a:not(.btn){color:var(--ink);text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:3px}
    .pl-faq{display:grid;gap:12px;grid-template-columns:1fr}
    @media(min-width:900px){.pl-faq{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .pl-faq > div{padding:20px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface)}
    .pl-faq dt{font-size:17px;font-weight:600;color:var(--ink);line-height:1.35}
    .pl-faq dd{margin:8px 0 0;font-size:15px;line-height:1.65;color:color-mix(in srgb,var(--ink) 78%,transparent);text-wrap:pretty}
    .pl-join{display:grid;gap:24px;grid-template-columns:1fr;align-items:start}
    @media(min-width:1024px){.pl-join{grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:48px}}
    .pl-side p{font-size:16.5px;line-height:1.7;color:color-mix(in srgb,var(--ink) 80%,transparent);max-width:48ch;text-wrap:pretty}
    .pl-side p + p{margin-top:14px}
    .pl-side b{color:var(--ink);font-weight:600}
    .pl-box{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:20px;min-width:0}
    @media(min-width:768px){.pl-box{padding:26px}}
    .pl-form{display:flex;flex-direction:column;gap:18px}
    .pl-ex{border:0;margin:0;padding:0;min-width:0;display:flex;flex-direction:column;gap:8px}
    .pl-ex legend{padding:0;margin-bottom:6px;font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
    .pl-chk{display:flex;gap:12px;align-items:flex-start;min-height:44px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r);background:var(--bg);cursor:pointer;transition:border-color .15s,background-color .15s}
    .pl-chk:hover{border-color:color-mix(in srgb,var(--accent) 55%,var(--line))}
    .pl-chk:has(input:checked){border-color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,var(--bg))}
    .pl-chk input{flex:0 0 auto;width:20px;height:20px;margin:2px 0 0;accent-color:var(--accent);cursor:pointer}
    .pl-chk input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .pl-chk span{display:flex;flex-direction:column;gap:3px;min-width:0}
    .pl-chk b{font-size:15px;font-weight:600;color:var(--ink);line-height:1.35}
    .pl-chk small{font-size:13.5px;line-height:1.5;color:var(--muted)}
    .pl-form .fld > span{display:flex;justify-content:space-between;gap:10px}
    .pl-form textarea{font:400 15.5px/1.6 var(--sans);color:var(--ink);background:var(--bg);border:1px solid var(--input);border-radius:var(--r);padding:11px 12px;width:100%;min-height:84px;resize:vertical;min-width:0}
    .pl-form textarea:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 3px rgba(232,173,79,.2)}
    .pl-form textarea::placeholder{color:color-mix(in srgb,var(--muted) 70%,transparent)}
    .pl-form input[type=email]{min-height:44px}
    .pl-form input[aria-invalid="true"]{border-color:var(--down)}
    .pl-cnt{font:500 11px var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:none}
    .pl-send{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px}
    .pl-send .note{flex:1 1 220px;font-size:13.5px;line-height:1.5}
    .pl-send .note a{font-size:inherit}
    .pl-status{border-radius:var(--r);padding:14px 16px;font-size:15px;line-height:1.55;display:flex;gap:12px;align-items:flex-start}
    .pl-status:focus{outline:2px solid var(--accent);outline-offset:2px}
    .pl-status .fb-mark{flex:0 0 auto}
    .pl-status.ok{background:color-mix(in srgb,var(--up) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--up) 40%,var(--line))}
    .pl-status.info{background:color-mix(in srgb,var(--info) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--info) 40%,var(--line))}
    .pl-status.err{background:color-mix(in srgb,var(--down) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--down) 40%,var(--line))}
    .pl-status b{color:var(--ink)}
    .pl-status p + p{margin-top:6px}
    .pl-acts{display:flex;flex-wrap:wrap;gap:10px}
    .pl-stored{font-size:13px;line-height:1.55;color:var(--muted);border-top:1px solid var(--line);padding-top:14px;text-wrap:pretty}
    .pl-done{display:flex;flex-direction:column;gap:16px}
    .pl-away p{font-size:15.5px;line-height:1.6;color:color-mix(in srgb,var(--ink) 82%,transparent)}
    .pl-away b{color:var(--ink);font-weight:600}
  `);

  const ICO = {
    check: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    idea: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/><path d="M12 8v4l2.5 2"/></svg>',
    arrow: '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };
  const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const titleOf = (id) => (EXTRAS.find((x) => x.id === id) || {}).t || id;
  const dateOf = (iso) => { try { return SML.fmtDate ? SML.fmtDate(String(iso).slice(0, 10)) : String(iso).slice(0, 10); } catch (e) { return ''; } };

  /* ---------------- /plans/ ---------------- */
  SML.pages.plans = function (view) {
    const free = [
      ['Every lesson and quiz', 'in all three tracks: trading, retirement and wealth, and FIRE.'],
      ['Every calculator and simulator,', 'including the trade replay and the wheel simulator.'],
      ['The glossary and the market & tax calendar,', 'with why each date matters.'],
      ['The self-assessment and your dashboard:', 'goals, net worth and your investor profile.'],
      ['A free account', 'that keeps your progress on every device where you sign in.'],
      ['The Portfolio page,', 'including connecting a brokerage read-only once connections are switched on.'],
      ['The TradingView indicator and the spreadsheets,', 'to copy and keep.'],
      ['No ads, no affiliate links and no paywall.', ''],
    ];
    view.innerHTML = `
      ${SML.pageHeader('', 'Plans', 'Free stays <em>free.</em>', `<p>Every lesson, quiz, tool and simulator on FiredBunny is free, and it stays free. An optional paid plan is being considered for a few extras that cost real money each time one person uses them. There is no price and no date. If you would use it, join the waitlist and tell me which extras matter.</p><div class="pl-hcta"><a class="btn btn-p" href="#pl-join" data-jump="pl-join">Join the waitlist ${ICO.arrow}</a></div>`).replace('class="page-hdr"', 'class="page-hdr pl-hdr"')}

      <section class="chapter" aria-labelledby="pl-two-h"><div class="wrap">
        ${SML.chapHead('01', 'Two plans', 'One is here today. The other is only an idea.', '', 'pl-two-h')}
        <div class="pl-two">
          <article class="pl-card pl-free" aria-labelledby="pl-free-h">
            <div class="pl-top"><h3 id="pl-free-h">Free</h3><span class="pill pl-pill-on">Today, and for good</span></div>
            <p class="pl-big">Everything</p>
            <p class="pl-lead">All of FiredBunny as it is today, for everyone, with or without an account.</p>
            <ul class="pl-list">${free.map(([b, t]) => `<li>${ICO.check}<span><b>${esc(b)}</b>${t ? ' ' + esc(t) : ''}</span></li>`).join('')}</ul>
            <p class="pl-foot"><b>It stays free.</b> Nothing on this list will move into a paid plan.</p>
          </article>
          <article class="pl-card pl-plus" aria-labelledby="pl-plus-h">
            <div class="pl-top"><h3 id="pl-plus-h">FiredBunny Plus <small>(working name)</small></h3><span class="pill pl-pill-maybe">Being considered</span></div>
            <p class="pl-big">Maybe later</p>
            <p class="pl-lead">A possible paid plan for a few new extras that cost money each time one person uses them. Nothing here is built, priced or promised, and the list may change.</p>
            <ul class="pl-list">${EXTRAS.map((x) => `<li>${ICO.idea}<span><b>${esc(x.t)}.</b> ${esc(x.d)}</span></li>`).join('')}</ul>
            <p class="pl-foot"><b>Education, not advice.</b> Each extra would explain your own numbers with the lessons. None would tell you what to buy or sell, manage money for you or promise a return.</p>
            <a class="btn btn-g" href="#pl-join" data-jump="pl-join">Join the waitlist</a>
          </article>
        </div>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="pl-ask-h"><div class="wrap">
        ${SML.chapHead('02', 'Plain answers', 'What a plan would change, and what it would not.', '', 'pl-ask-h')}
        <dl class="pl-faq">
          <div><dt>Why would anything cost money?</dt><dd>A lesson costs about the same to run whether one person reads it or many. An AI explanation of your portfolio, a PDF report or years of stored history cost money every time one person uses them. A plan would pay for those running costs.</dd></div>
          <div><dt>Will anything that’s free now become paid?</dt><dd>No. Lessons, quizzes, tools, simulators, the calendar, your dashboard, your account and the Portfolio page stay free. A plan would only add new extras on top.</dd></div>
          <div><dt>Would it tell me what to buy or sell?</dt><dd>No. The extras being considered are education: they explain your own numbers using the lessons. They would not recommend trades or investments, manage money or promise returns. The <a href="#editorial">editorial standards</a> apply to them too.</dd></div>
          <div><dt>Is chipping in the same thing?</dt><dd>No. Chipping in on the <a href="#support">Support page</a> is a tip: it unlocks nothing, now or later, and it doesn’t put you on the waitlist or give early access.</dd></div>
          <div><dt>When, and how much?</dt><dd>Not decided. There is no price and no date, and the plan may change or never happen. The waitlist, and which extras people tick, is how I find out whether it’s worth building.</dd></div>
          <div><dt>What happens to my sign-up?</dt><dd>It’s kept only to tell you if the plan opens: no newsletter, no marketing, never sold or shared. The form below says exactly what is stored and how to leave the list.</dd></div>
        </dl>
      </div></section>

      <section class="chapter" style="padding-top:0" id="pl-join" aria-labelledby="pl-join-h"><div class="wrap">
        ${SML.chapHead('03', 'Join the waitlist', 'Tick the extras you would use. One email if the plan opens, nothing else.', '', 'pl-join-h')}
        <div class="pl-join">
          <div class="pl-side">
            <p>Which extras you tick is the most useful thing you can tell me: it decides what gets built first, or whether anything does.</p>
            <p><b>One email, only if the plan opens.</b> No newsletter, no marketing, and your address is never sold or shared.</p>
            <p>Joining doesn’t commit you to anything, and you can leave the list any time.</p>
          </div>
          <div class="pl-box" data-volatile></div>
        </div>
      </div></section>`;

    // jump links without changing the route
    $$('[data-jump]', view).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const el = document.getElementById(a.dataset.jump); if (el) el.scrollIntoView({ behavior: SML.reduced() ? 'auto' : 'smooth', block: 'start' }); }));
    let alive = true; SML.onCleanup(() => { alive = false; });
    box($('.pl-box', view), () => alive);
    return 'Plans';
  };

  /* ---------------- the waitlist box ---------------- */
  const STORED = {
    email: 'What gets stored: your email, the extras you tick, your note if you write one, and the time. The email is used only to tell you if the plan opens: no newsletter, no marketing, and it is never sold or shared. Only the person who runs FiredBunny can see the list. To leave it, send a note from the About page or the help chat with the email you used, and it will be deleted.',
    account: 'What gets stored: your account id, the extras you tick, your note if you write one, and the time. No email is asked for here: if the plan opens, one email goes to the address on your account. No newsletter, no marketing, never sold or shared. Only the person who runs FiredBunny can see the list. Leave it any time on this page; deleting your account removes it too.',
  };
  const WHY = {
    missing: '<b>The waitlist isn’t open yet.</b> It hasn’t been set up on FiredBunny’s server, so nothing was saved. Your answers are still here: try again later.',
    missingCheck: '<b>The waitlist isn’t open yet.</b> It hasn’t been set up on FiredBunny’s server, so joining doesn’t work yet. Try again later.',
    offline: '<b>You seem to be offline.</b> Nothing was saved, and your answers are still here. Try again when you’re back online.',
    busy: '<b>A lot of sign-ups are arriving right now.</b> Nothing was saved, and your answers are still here. Give it a few minutes and try again.',
    invalid: '<b>Something in it couldn’t be accepted.</b> Check the email address and keep the note under 280 characters.',
    error: '<b>Joining isn’t working right now.</b> Nothing was saved, and your answers are still here. Try again in a moment.',
  };

  function formHTML(acct) {
    const signLink = !acct && SML.accountsOn && SML.host === 'web' ? ' Have an account? <a href="#signin">Sign in</a> to join with one click.' : '';
    return `<form class="pl-form" id="pl-form" novalidate aria-describedby="pl-stored">
        <fieldset class="pl-ex"><legend>Which extras would you use? (optional)</legend>
          ${EXTRAS.map((x) => `<label class="pl-chk"><input type="checkbox" value="${x.id}" data-pl-extra><span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></span></label>`).join('')}
        </fieldset>
        <label class="fld" for="pl-note"><span>Anything else? (optional) <span class="pl-cnt" aria-hidden="true">0 / ${MAX.note}</span></span><textarea id="pl-note" maxlength="${MAX.note}" rows="3" placeholder="An extra you would want, or one you would not"></textarea></label>
        ${acct ? '' : `<label class="fld" for="pl-email"><span>Your email</span><input id="pl-email" type="email" maxlength="${MAX.email}" placeholder="you@example.com" autocomplete="email" inputmode="email" spellcheck="false" required aria-describedby="pl-stored"></label>`}
        <div class="pl-send"><button type="submit" class="btn btn-p">${acct ? 'Join with one click' : 'Join the waitlist'}</button><span class="note">${acct ? 'You’re signed in, so there’s nothing to type.' : 'No account needed.'}${signLink}</span></div>
        <div class="pl-status" role="status" tabindex="-1" hidden></div>
        <p class="pl-stored" id="pl-stored">${esc(acct ? STORED.account : STORED.email)}</p>
      </form>`;
  }

  function box(el, alive) {
    const kind = where();
    if (kind !== 'supabase') {
      el.innerHTML = `<div class="pl-away"><p><b>The waitlist is on the FiredBunny website,</b> at <a href="https://firedbunny.com/plans/" target="_blank" rel="noopener">firedbunny.com/plans</a>. This copy of the site doesn’t collect sign-ups.</p></div>`;
      return;
    }
    const acct = signedIn();
    const say = (cls, html, focus) => {
      const s = $('.pl-status', el); if (!s) return;
      s.hidden = false; s.className = 'pl-status ' + cls; s.innerHTML = SML.bunnyMark(26) + `<div>${html}</div>`;
      if (focus) s.focus({ preventScroll: false });
    };

    // a failed try leaves the form as it is, answers and all
    function drawForm() {
      el.innerHTML = formHTML(acct);
      const form = $('.pl-form', el), note = $('#pl-note', el), cnt = $('.pl-cnt', el), mail = $('#pl-email', el), btn = $('[type="submit"]', form);
      const upd = () => { cnt.textContent = note.value.length + ' / ' + MAX.note; };
      note.addEventListener('input', upd); upd();
      if (mail) mail.addEventListener('input', () => mail.removeAttribute('aria-invalid'));
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const o = { extras: $$('[data-pl-extra]', form).filter((c) => c.checked).map((c) => c.value), note: note.value, email: mail ? mail.value.trim() : '' };
        if (mail && !emailOk(o.email)) {
          mail.setAttribute('aria-invalid', 'true');
          say('err', o.email ? '<b>Check the email address.</b> It needs to look like name@example.com.' : '<b>Add your email</b> so you can hear if the plan opens.');
          mail.focus(); return;
        }
        btn.disabled = true;
        const res = await join(o);
        if (!alive()) return;
        btn.disabled = false;
        if (res.ok) {
          if (acct) { await drawStatus({ joined: true }); return; }
          drawGuestDone(o.email);
          return;
        }
        say('err', WHY[res.reason] || WHY.error, true);
      });
      return form;
    }

    function drawGuestDone(email) {
      el.innerHTML = `<div class="pl-done">
          <div class="pl-status ok" role="status" tabindex="-1">${SML.bunnyMark(26)}<div><p><b>You’re on the list.</b> If the plan opens, one email goes to <b>${esc(email)}</b>.</p><p>Joined before with this address? Then you’re still on the list once; nothing changed.</p></div></div>
          <p class="pl-stored">${esc(STORED.email)}</p>
          <div class="pl-acts"><button type="button" class="btn btn-g sm" data-pl="again">Add another email</button></div>
        </div>`;
      $('.pl-status', el).focus();
      $('[data-pl="again"]', el).addEventListener('click', () => { drawForm(); const m = $('#pl-email', el); if (m) m.focus(); });
    }

    function drawOn(st, joined) {
      const ex = st.extras || [];
      el.innerHTML = `<div class="pl-done">
          <div class="pl-status ok" role="status" tabindex="-1">${SML.bunnyMark(26)}<div><p><b>${joined ? 'You’re on the list.' : 'You’re on the waitlist.'}</b> ${st.at ? `Joined ${esc(dateOf(st.at))}.` : ''}</p><p>${ex.length ? 'You said you would use: ' + esc(list(ex.map(titleOf))) + '.' : 'You didn’t tick any extras.'} If the plan opens, one email goes to the address on your account.</p></div></div>
          <div class="pl-acts"><button type="button" class="btn btn-g sm" data-pl="leave">Leave the waitlist</button></div>
          <p class="pl-stored">${esc(STORED.account)}</p>
        </div>`;
      if (joined) $('.pl-status', el).focus();
      const lb = $('[data-pl="leave"]', el);
      lb.addEventListener('click', async () => {
        lb.disabled = true; lb.textContent = 'Leaving…';
        const r = await leave();
        if (!alive()) return;
        if (r.ok) { drawForm(); say('info', '<b>You’ve left the waitlist.</b> Your sign-up is deleted. You can join again any time.', true); return; }
        lb.disabled = false; lb.textContent = 'Leave the waitlist';
        const s = $('.pl-status', el);
        s.className = 'pl-status err'; s.innerHTML = SML.bunnyMark(26) + `<div><p>${r.reason === 'offline' ? '<b>You seem to be offline.</b> You’re still on the list; try again when you’re back online.' : r.reason === 'missing' ? '<b>The waitlist isn’t set up on the server right now.</b> Try again later.' : '<b>That didn’t work.</b> You’re still on the list. Try again in a moment.'}</p></div>`;
        s.focus();
      });
    }

    async function drawStatus(o) {
      const st = await status();
      if (!alive()) return;
      if (st.ok && st.on) { drawOn(st, o && o.joined); return; }
      const form = el.querySelector('.pl-form') ? el.querySelector('.pl-form') : drawForm();
      if (!st.ok) { // could not check: the form stays usable (joining twice is harmless)
        say(st.reason === 'missing' ? 'err' : 'info', st.reason === 'missing' ? WHY.missingCheck
          : st.reason === 'offline' ? '<b>You seem to be offline,</b> so I couldn’t check whether you’re already on the list.' : '<b>I couldn’t check whether you’re already on the list.</b> Joining again is harmless: it never adds you twice.');
      } else if (o && o.joined) { // joined, but the list does not show it (it should): say so plainly
        say('info', '<b>Sent.</b> The list didn’t show your sign-up yet; reload the page in a moment to check.', true);
      }
      return form;
    }

    if (acct) {
      // the form is drawn straight away (same size as for guests); it turns into "you're on the list" if you are
      drawForm();
      const b = $('[type="submit"]', el); b.disabled = true;
      drawStatus().then(() => { const x = $('[type="submit"]', el); if (x) x.disabled = false; });
    } else {
      drawForm();
    }
  }
})();
