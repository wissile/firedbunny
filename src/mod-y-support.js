/* Support FiredBunny (/support/): why the site is free, what running it costs, and, once the owner has pasted a Stripe
 * Payment Link into src/support-config.js, buttons that open Stripe's own checkout page. No Stripe key, no Stripe.js,
 * no server code: FiredBunny only links to Stripe and never sees card details. Owner guide: docs/support/README.md.
 *
 * - SML.support: the configured links, checked here (https, buy.stripe.com or billing.stripe.com only; anything else
 *   is ignored with a console warning), and the small pieces other pages use (footer link, About line).
 * - Every support link shows only when a payment link is set and this is the website (the claude.ai copy says where to
 *   go instead). The parts that depend on the links carry data-volatile, so pasting a link later does not change any
 *   page's lastmod (tools/prerender.py hashes the page text without them); the footer is not part of that hash at all.
 * - /support/thanks/ is where Stripe can send people after paying: it says thank you and nothing else, since anyone
 *   can open it. It is a per-visitor page (noindex, no pre-built snapshot).
 * - Analytics: one coarse event, support_click { target: once | monthly | page, target_type: where the link was },
 *   through SML.track (website only, with consent). Never an amount or anything personal.
 * Prefix: .sp- */
(function () {
  'use strict';
  const SML = window.SML, esc = SML.esc;

  /* ---------------- the configured links ---------------- */
  const HOSTS = { once: ['buy.stripe.com'], monthly: ['buy.stripe.com'], manage: ['billing.stripe.com'] };
  const warn = (msg) => { try { console.warn('[FiredBunny] support link ignored: ' + msg + ' (src/support-config.js, docs/support/README.md)'); } catch (e) {} };
  /** The link if it is a usable Stripe address for this kind (once, monthly, manage), otherwise '' (with a warning). */
  function check(raw, kind) {
    if (raw == null || raw === '') return '';
    const hosts = HOSTS[kind]; if (!hosts) return '';
    const s = String(raw).trim();
    let u; try { u = new URL(s); } catch (e) { warn(`${kind} is not a full web address: ${s.slice(0, 80)}`); return ''; }
    if (u.protocol !== 'https:') { warn(`${kind} must start with https://`); return ''; }
    if (u.username || u.password || u.port) { warn(`${kind} must be a plain Stripe link`); return ''; }
    if (hosts.indexOf(u.hostname) < 0) {
      warn(u.hostname === 'donate.stripe.com' ? `${kind} uses Stripe's Donate button (donate.stripe.com); FiredBunny is not a charity, so create the link with the standard Pay button (buy.stripe.com)`
        : `${kind} must be on ${hosts.join(' or ')}, not ${u.hostname}`);
      return '';
    }
    if (u.pathname.replace(/\/+$/, '').length < 3) { warn(`${kind} has no link id after ${u.hostname}/`); return ''; }
    if (/^\/(p\/login\/)?test_/.test(u.pathname)) { try { console.warn(`[FiredBunny] support link ${kind} is a Stripe test-mode link: real cards are refused there.`); } catch (e) {} }
    return u.href;
  }
  const cfg = (SML.SUPPORT && SML.SUPPORT.links) || {};
  const links = { once: check(cfg.once, 'once'), monthly: check(cfg.monthly, 'monthly'), manage: check(cfg.manage, 'manage') };
  if (links.monthly && !links.manage) { warn('monthly needs manage (the customer portal link) too, so monthly supporters can cancel on their own'); links.monthly = ''; }
  const onSite = SML.host === 'web';
  const configured = !!(links.once || links.monthly);
  const live = () => onSite && configured;

  const ICO = {
    out: '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
    arrow: '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };
  const icon = (d) => `<svg class="sp-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const NEW_TAB = '<span class="sr"> (opens Stripe in a new tab)</span>';
  const stripeLink = (url, cls, label, plan) => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener" data-support-plan="${plan}" data-support-place="support">${label} ${ICO.out}${NEW_TAB}</a>`;

  SML.support = {
    links: () => Object.assign({}, links),
    check,
    live,
    /** A payment link is set (even if this copy, the claude.ai one, does not show it). */
    configured: () => configured,
    /** The footer's "Support FiredBunny" link, or '' while no payment link is set (or in the claude.ai copy). */
    footerLink: () => (live() ? '<a href="#support" data-support-place="footer">Support FiredBunny</a>' : ''),
  };

  /* ---------------- styles ---------------- */
  SML.css(`
    .sp-hdr .h-page{max-width:13ch}
    .sp-cta{display:flex;flex-direction:column;gap:12px}
    .sp-btns{display:flex;flex-wrap:wrap;gap:10px}
    .sp-btns .btn{white-space:normal;text-align:center}
    .page-hdr .ph-side p.sp-fine,.sp-fine{font-size:14px;line-height:1.6;color:var(--muted);text-wrap:pretty}
    .sp-fine b,.sp-soon b{color:var(--ink);font-weight:600}
    .sp-cta a:not(.btn),.sp-faq a,.sp-thx a:not(.btn),.sp-list a:not(.ulink){color:var(--ink);text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:3px}
    .sp-soon{padding:16px 18px;border:1px solid var(--line);border-radius:var(--r);background:color-mix(in srgb,var(--surface) 88%,transparent)}
    .page-hdr .ph-side .sp-soon p{font-size:15px;line-height:1.6;color:color-mix(in srgb,var(--ink) 82%,transparent)}
    .sp-list{list-style:none;display:flex;flex-direction:column;gap:14px;max-width:70ch}
    .sp-list li{display:flex;gap:12px;align-items:flex-start;font-size:17px;line-height:1.65;color:color-mix(in srgb,var(--ink) 86%,transparent)}
    .sp-list li .fb-flame{margin-top:6px;flex:0 0 auto}
    .sp-list b{color:var(--ink);font-weight:600}
    @media(min-width:1024px){.sp-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 48px;max-width:none}}
    .sp-costs{list-style:none;display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;grid-template-columns:1fr}
    @media(min-width:640px){.sp-costs{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(min-width:1100px){.sp-costs{grid-template-columns:repeat(5,minmax(0,1fr))}}
    .sp-costs li{background:var(--surface);padding:22px 20px;display:flex;flex-direction:column;gap:10px}
    .sp-costs .sp-ic{color:var(--flame)}
    .sp-costs b{font-size:17px;font-weight:600;color:var(--ink)}
    .sp-costs p{font-size:14px;line-height:1.6;color:color-mix(in srgb,var(--ink) 68%,transparent)}
    .sp-faq{display:grid;gap:12px;grid-template-columns:1fr}
    @media(min-width:900px){.sp-faq{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .sp-faq > div{padding:20px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface)}
    .sp-faq dt{font-size:17px;font-weight:600;color:var(--ink);line-height:1.35}
    .sp-faq dd{margin:8px 0 0;font-size:15px;line-height:1.65;color:color-mix(in srgb,var(--ink) 78%,transparent);text-wrap:pretty}
    .sp-thx .ph-side .btn{align-self:flex-start}
    .sp-thx-acts{display:flex;flex-wrap:wrap;gap:10px}
  `);

  /* ---------------- the call to action in the page header ----------------
     Everything in here depends on the configured links, so it is data-volatile (left out of the lastmod hash). */
  function cta() {
    if (configured && !onSite) {
      return `<div class="sp-cta sp-soon" data-volatile><p><b>Support is handled on the FiredBunny website,</b> at <a href="https://firedbunny.com/support/" target="_blank" rel="noopener">firedbunny.com/support</a>. This copy of the site doesn’t take payments.</p></div>`;
    }
    if (!configured) {
      return `<div class="sp-cta sp-soon" data-volatile><p><b>There’s no way to chip in yet.</b> For now the best help is a note: tell me what’s wrong, out of date or missing, on the <a href="#about">About page</a> or in the help chat.</p></div>`;
    }
    const btns = [links.once ? stripeLink(links.once, 'btn btn-p', 'Chip in once', 'once') : '', links.monthly ? stripeLink(links.monthly, links.once ? 'btn btn-g' : 'btn btn-p', 'Chip in monthly', 'monthly') : ''].join('');
    const what = links.once && links.monthly ? 'Once, you choose the amount; monthly is a set amount Stripe shows before you pay.' : links.once ? 'You choose the amount.' : 'Stripe shows the monthly amount before you pay.';
    return `<div class="sp-cta" data-volatile>
        <div class="sp-btns">${btns}</div>
        <p class="sp-fine">${what} You pay on Stripe’s secure checkout page, so FiredBunny never sees your card. <b>Not tax-deductible:</b> FiredBunny is not a charity. Chipping in unlocks nothing.</p>
        ${links.monthly ? `<p class="sp-fine">Chipping in monthly? <a href="${esc(links.manage)}" target="_blank" rel="noopener">Cancel or change it</a> any time on Stripe.</p>` : ''}
      </div>`;
  }

  /* ---------------- /support/ ---------------- */
  SML.pages.support = function (view) {
    const costs = [
      [icon('<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>'), 'Hosting', 'The servers, the domain and the accounts database, so pages load fast, work offline and keep your progress.'],
      [icon('<path d="M4 19V5M4 19h16"/><path d="M7 15l4-5 3 3 5-7"/>'), 'Data', 'Getting, checking and updating the market and company figures behind the lessons, the calendar and the earnings lookup.'],
      [icon('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'), 'Brokerage connections', 'The read-only connection service behind the Portfolio page, which charges for each person who connects.'],
      [icon('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'), 'Tools', 'The software and AI tools used to draft lessons, build the calculators and test the site.'],
      [icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), 'Time', 'Writing lessons, checking every figure against its source each year, and reading every piece of feedback.'],
    ];
    view.innerHTML = `
      ${SML.pageHeader('', 'Support FiredBunny', 'Free to use. <em>Not free to make.</em>', `<p>Every lesson, tool and simulator here is free, and it stays free. Building and running FiredBunny still costs time and money. Chipping in is optional and unlocks nothing, and if you never do, that’s completely fine: use all of it anyway.</p>${cta()}`).replace('class="page-hdr"', 'class="page-hdr sp-hdr"')}

      <section class="chapter" aria-labelledby="sp-free"><div class="wrap">
        ${SML.chapHead('01', 'What stays free', 'Everything. Chipping in unlocks nothing.', '', 'sp-free')}
        <ul class="sp-list">
          <li>${SML.flame(14)}<span><b>Every lesson, quiz, tool and simulator</b>, the glossary, the calendar and your dashboard. There is no paywall, no members-only lesson and no early access, and none of it will move into a paid plan.</span></li>
          <li>${SML.flame(14)}<span><b>Chipping in changes nothing you see.</b> No badge, no extra features, no special treatment. It’s a tip for lessons and tools you’ve already used, not a way into the optional <a href="#plans">paid plan being considered</a> for a few new extras.</span></li>
          <li>${SML.flame(14)}<span><b>No ads and no affiliate links.</b> Brokers, funds and companies are named to teach, not to sell. <a class="ulink" href="#editorial">Editorial standards</a></span></li>
          <li>${SML.flame(14)}<span><b>No pop-ups and no reminders.</b> Nothing interrupts a lesson or a tool to ask you for money.</span></li>
        </ul>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="sp-cost"><div class="wrap">
        ${SML.chapHead('02', 'Where the money goes', 'A free site still has bills.', '', 'sp-cost')}
        <ul class="sp-costs">${costs.map(([ic, t, d]) => `<li>${ic}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="sp-ask"><div class="wrap">
        ${SML.chapHead('03', 'Before you chip in', 'Plain answers.', '', 'sp-ask')}
        <dl class="sp-faq">
          <div><dt>Is it tax-deductible?</dt><dd>No. FiredBunny is not a charity or a nonprofit, so what you give is not a charitable donation and can’t be deducted from your taxes.</dd></div>
          <div><dt>Who handles the payment?</dt><dd>Stripe. You pay on Stripe’s own checkout page and FiredBunny never sees or stores your card details. Like any seller using Stripe, the person who runs FiredBunny sees the amount and the name and email you enter there.</dd></div>
          <div><dt>Does it change what the lessons say?</dt><dd>No. Support doesn’t buy a say in what any page says, and nobody gets a mention or a lesson in return. The <a href="#editorial">editorial standards</a> apply the same way.</dd></div>
          <div><dt>Is there another way to help?</dt><dd>Yes, and it’s worth as much: point out a mistake, suggest a topic, or share a lesson with someone who needs it. Notes go through the <a href="#about">About page</a> or the help chat.</dd></div>
        </dl>
      </div></section>`;
    return 'Support FiredBunny';
  };

  /* ---------------- /support/thanks/ (where Stripe sends people after paying) ----------------
     Anyone can open this address, so it says thank you and claims nothing about a payment. */
  SML.pages['support-thanks'] = function (view) {
    view.innerHTML = `
      ${SML.pageHeader('', 'Support FiredBunny', 'Thank <em>you.</em>', `<div class="sp-thx-acts"><a class="btn btn-p" href="#learn">Back to the lessons ${ICO.arrow}</a><a class="btn btn-g" href="#support">Support page</a></div>`).replace('class="page-hdr"', 'class="page-hdr sp-hdr sp-thx"')}
      <div style="height:48px"></div>`;
    return 'Thank you';
  };

  /* ---------------- one coarse analytics event per support link click ---------------- */
  document.addEventListener('click', (e) => {
    if (!e.target.closest) return;
    const a = e.target.closest('a[href]'); if (!a) return;
    const plan = a.getAttribute('data-support-plan');
    const toPage = !plan && SML.routes && SML.routes.fromHref(a.getAttribute('href')) === 'support';
    if (!plan && !toPage) return;
    let place = a.getAttribute('data-support-place');
    if (!place) place = a.closest('footer.foot') ? 'footer' : a.closest('.fbc') ? 'chat' : ((SML.routes && SML.routes.token(location.pathname)) || (location.hash || '').slice(1) || 'page');
    SML.track('support_click', { target: plan || 'page', target_type: place });
  }, true);
})();
