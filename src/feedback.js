/* Sending feedback: one sender for the About page form and the help chat (src/chat.js).
 *
 * Where a note goes depends on where the site is running:
 *   - the website, with Supabase set up (src/cloud-config.js): a new row in public.feedback (supabase/schema.sql).
 *     Visitors can only add rows, never read them; the owner reads them in the Supabase Table Editor. A signed-in
 *     person's note carries their account id, filled in by the database.
 *   - claude.ai: the page's private storage ('feedback/<user id>', read by the owner's feedbackInbox on the About
 *     page), or, when the viewer may not save there, the page's comment box.
 *   - anywhere else (a copy opened from disk): nothing can be sent, so the caller offers to copy the note.
 * A failed send never loses the note: callers keep what was typed and offer Try again and Copy.
 */
(function () {
  'use strict';
  const SML = window.SML;
  const KINDS = ['Idea', 'Something to improve', 'Correct an inaccuracy', 'Question', 'Other'];
  const MAX = { message: 4000, email: 254, page: 300, ua: 300 };
  const hasRuntime = () => !!(window.claude && typeof window.claude.use === 'function');
  const use = (name) => { try { return hasRuntime() ? window.claude.use(name).catch(() => null) : Promise.resolve(null); } catch (e) { return Promise.resolve(null); } };
  // a plain address check: something@something.something, no spaces (the database checks the same shape)
  const emailOk = (s) => typeof s === 'string' && s.length <= MAX.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  // the website (served over http/https, Supabase set up); a copy opened from disk cannot load the Supabase library
  const web = () => !!(SML.cloud && SML.cloud.configured && /^https?:$/.test(location.protocol));

  /* What this view can do: 'supabase' (website), 'db' (claude.ai, private to the owner), 'comments' (claude.ai comment
     box) or 'copy'. Worked out once. */
  let routeP = null;
  function route() {
    if (routeP) return routeP;
    routeP = (async () => {
      if (hasRuntime()) {
        const [user, db, comments] = await Promise.all([use('user'), use('db'), use('comments')]);
        let uid = null, canWrite = null;
        if (user) { try { uid = await user.id(); canWrite = await user.can('data.write'); } catch (e) {} }
        if (db && uid && canWrite !== false) return { kind: 'db', db, uid, comments };
        if (comments) return { kind: 'comments', comments };
        return { kind: 'copy' };
      }
      if (web()) return { kind: 'supabase' };
      return { kind: 'copy' };
    })();
    return routeP;
  }

  // what route() will most likely say, known straight away (claude.ai needs a moment to tell db from comments)
  const guess = () => (hasRuntime() ? 'db' : web() ? 'supabase' : 'copy');

  // the page the visitor is on: its address on the website, its #token elsewhere
  function page() {
    if (SML.routes && SML.routes.mode === 'path') return location.pathname;
    return location.hash && location.hash.length > 1 ? location.hash : '#home';
  }
  const signedIn = () => !!((SML.cloud && SML.cloud.user) || (SML.account && SML.account.status && SML.account.status.signedIn));
  // the note as plain text, for copying
  function plain(e) {
    return `[${e.kind || 'Feedback'}]${e.page ? ' ' + e.page : ''}\n\n${String(e.message || '').trim()}${e.email ? '\n\nReply to: ' + e.email : ''}`;
  }

  // a few notes per tab in ten minutes is plenty; more is almost certainly a stuck button or a script
  const SENT = 'fb-feedback-sent';
  function recent() { try { const a = JSON.parse(sessionStorage.getItem(SENT) || '[]'); return Array.isArray(a) ? a.filter((t) => Date.now() - t < 600000) : []; } catch (e) { return []; } }
  function remember() { try { const a = recent(); a.push(Date.now()); sessionStorage.setItem(SENT, JSON.stringify(a)); } catch (e) {} }

  const isNetwork = (e) => !!(e && (e.network || e.status === 0 || /fetch|network|load failed|timeout|offline/i.test(String(e.message || e))));
  // why a send failed, in words a caller can choose from: offline, missing (the table is not set up yet), busy, invalid, error
  function reason(e) {
    const code = String((e && e.code) || ''), msg = String((e && (e.message || e.details)) || e || '');
    if (navigator.onLine === false || isNetwork(e)) return 'offline';
    if (code === 'PGRST205' || code === '42P01' || (e && e.status === 404) || /schema cache|does not exist/i.test(msg)) return 'missing';
    if (/too much feedback/i.test(msg) || (e && e.status === 429)) return 'busy';
    if (code === '23514' || code === '22001' || code === '23502') return 'invalid';
    return 'error';
  }

  /** Send a note. e = { kind, message, email?, page?, where?, source: 'chat' | 'about' }.
   *  Resolves { ok: true, via } or { ok: false, via, reason, comments? }; it never throws. */
  async function send(e) {
    const kind = KINDS.indexOf(e.kind) >= 0 ? e.kind : 'Other';
    const message = String(e.message || '').trim().slice(0, MAX.message);
    const email = e.email && emailOk(String(e.email).trim()) ? String(e.email).trim() : null;
    const where = String(e.page || page()).slice(0, MAX.page);
    const source = e.source === 'about' ? 'about' : 'chat';
    if (!message) return { ok: false, via: 'none', reason: 'invalid' };
    if (recent().length >= 5) return { ok: false, via: 'none', reason: 'busy' };
    let r;
    try { r = await route(); } catch (err) { r = { kind: 'copy' }; }
    const done = (res) => { if (res.ok) remember(); SML.track('feedback_send', { label: kind, method: res.via, target_type: source, target: res.ok ? 'sent' : res.reason }); return res; };
    if (r.kind === 'supabase') {
      if (navigator.onLine === false) return done({ ok: false, via: 'supabase', reason: 'offline' });
      try {
        const c = await SML.cloud.feedbackClient();
        const row = { kind, message, page: where, source, user_agent: String(navigator.userAgent || '').slice(0, MAX.ua) };
        if (email) row.email = email;
        // insert only: visitors cannot read the table, so nothing is asked back (no .select())
        const { error } = await c.from('feedback').insert(row);
        if (error) throw error;
        return done({ ok: true, via: 'supabase' });
      } catch (err) {
        return done({ ok: false, via: 'supabase', reason: reason(err) });
      }
    }
    if (r.kind === 'db') {
      const entry = { id: SML.account ? SML.account.newId('f') : 'f-' + Date.now().toString(36), at: new Date().toISOString(), kind, where: e.where || where, message, page: where, source, status: 'new' };
      if (email) entry.email = email;
      try {
        const ref = r.db.doc('feedback/' + r.uid);
        const snap = await ref.get();
        const prev = snap.exists && Array.isArray((snap.data() || {}).entries) ? JSON.parse(JSON.stringify(snap.data().entries)) : [];
        prev.push(entry);
        await ref.set({ entries: prev.slice(-50), updatedAt: entry.at });
        return done({ ok: true, via: 'db' });
      } catch (err) {
        if (r.comments) { routeP = Promise.resolve({ kind: 'comments', comments: r.comments }); return done({ ok: false, via: 'comments', reason: 'comments', comments: r.comments }); }
        return done({ ok: false, via: 'db', reason: reason(err) });
      }
    }
    if (r.kind === 'comments') return done({ ok: false, via: 'comments', reason: 'comments', comments: r.comments });
    return done({ ok: false, via: 'copy', reason: 'copy' });
  }

  /** claude.ai without private storage: open the page's comment box next to `element` (call inside a click). */
  async function openComments(comments, element) {
    try { const res = await comments.openComposer({ element }); return !!(res && res.opened); } catch (err) { return false; }
  }

  /* The words for each route, shared by the About page and the chat so they say the same thing. */
  function says(kind) {
    if (kind === 'supabase') return { button: 'Send', where: 'Goes to the person who runs FiredBunny.' };
    if (kind === 'db') return { button: 'Send', where: 'Goes privately to FiredBunny.' };
    if (kind === 'comments') return { button: 'Copy and open comments', where: 'Opens the comment box on this page, where you post it.' };
    return { button: 'Copy my note', where: 'Sending is not available in this view, so your note is copied for you to paste.' };
  }
  /* What is stored when someone sends, for the route this view uses. */
  // o.email: true (given), 'maybe' (an optional field on a form) or false
  const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  function privacy(kind, o) {
    o = o || {};
    const page = `the page${o.page ? ` (${o.page})` : ''}`;
    const mail = o.email === 'maybe' ? 'your email if you add one (used only to reply)' : o.email ? 'your email (used only to reply to you)' : '';
    if (kind === 'supabase') return `What gets sent: ${list(['your message', 'its kind', page, 'the time', 'your browser type', mail, signedIn() ? 'your account id, because you’re signed in' : ''].filter(Boolean))}. Only the person who runs FiredBunny can read it.`;
    if (kind === 'db') return `What gets stored: ${list(['your message', 'its kind', page, 'the time', mail, 'an account id that keeps your notes together (it is not your name)'].filter(Boolean))}. Only you and the site owner can read it.`;
    if (kind === 'comments') return 'Your note is copied, then you post it as a comment on this page. Comments show your name and are visible to people who can see this page’s comments.';
    return 'Nothing is sent or stored from this view. Your note is only copied to your clipboard, so you can paste it wherever you like.';
  }

  SML.feedback = { KINDS, MAX, route, guess, send, plain, page, emailOk, openComments, says, privacy };
})();
