/* Privacy policy (/privacy/), terms of use (/terms/) and contact (/contact/).
 * Every sentence must stay true of the site as it is. If data handling changes (a new service, a new table, analytics
 * settings, the Portfolio page or tips going live), change the privacy page, the Settings privacy list
 * (src/mod-y-account.js) and the help chat's privacy notes (src/chat-data.js) in the same commit, and move UPDATED.
 * These pages are plain-language summaries written without a lawyer; the owner should have them reviewed.
 * Prefix: .lg- */
(function () {
  'use strict';
  const SML = window.SML;
  const UPDATED = 'November 18, 2026';

  SML.css(`
    .lg-prose{max-width:72ch}
    .lg-prose h3{font-family:var(--sans);font-weight:600;text-transform:none;letter-spacing:0;font-size:19px;line-height:1.35;margin-top:26px}
    .lg-prose ul{padding-left:1.2em}.lg-prose li{margin:6px 0}
    .lg-meta{font:500 12px/1.5 var(--mono);letter-spacing:.06em;color:var(--muted);margin-top:18px}
    .lg-cards{list-style:none;padding:0;margin:18px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;max-width:960px}
    .lg-cards a{display:block;height:100%;padding:18px 20px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);text-decoration:none}
    .lg-cards a:hover,.lg-cards a:focus-visible{border-color:var(--accent)}
    .lg-cards strong{display:block;font-size:17px;margin-bottom:6px}.lg-cards span{display:block;color:var(--muted);font-size:14.5px;line-height:1.55}
  `);

  const sec = (n, h, sub, id, body) => `<section class="chapter" style="padding-top:${n === '01' ? '48px' : '0'}" aria-labelledby="${id}"><div class="wrap">
      ${SML.chapHead(n, h, sub, '', id)}
      <div class="prose lg-prose">${body}</div>
    </div></section>`;
  const header = (kick, title, lede) => `<header class="page-hdr"><div class="wrap">
      ${SML.kicker('', kick)}
      <h1 class="h-page">${title}</h1>
      <p class="lede" style="margin-top:22px;max-width:62ch">${lede}</p>
      <p class="lg-meta">Last updated ${UPDATED}</p>
    </div></header>`;

  /* ---------------- privacy ---------------- */
  SML.pages.privacy = function (view) {
    view.innerHTML = `
      ${header('Privacy', 'What FiredBunny <em>keeps</em>, and why', 'FiredBunny is a free education site with no ads. This page says what is stored about you, where, for how long and how to remove it, in plain words.')}
      ${SML.host === 'claude' ? `<div class="wrap" style="margin-top:20px"><div class="callout info">This policy is for the website, firedbunny.com. In this copy on claude.ai, a signed-in visitor’s data is kept in this page’s private storage on claude.ai, and feedback is the only thing the owner reads.</div></div>` : ''}
      ${sec('01', 'The short version', 'Most of what you do stays on your device.', 'lg-short', `
        <ul>
          <li><b>As a guest</b>, your progress, profile, journal and plans are saved in your browser only. FiredBunny has no copy.</li>
          <li><b>With a free account</b>, that same data and your email address are saved in FiredBunny’s database so they follow you to other devices.</li>
          <li><b>Usage statistics</b> come from Google Analytics. Visitors in Europe are asked first; everyone can switch it off in <a href="#settings">Settings</a>. It never receives your profile, goals, money figures or anything you type into a tool.</li>
          <li>FiredBunny shows <b>no ads</b>, uses no advertising cookies and <b>does not sell or rent</b> anyone’s data.</li>
        </ul>`)}
      ${sec('02', 'What is collected, and when', 'Only what each feature needs.', 'lg-what', `
        <h3>Reading the site</h3>
        <p>Like every website, the host (Cloudflare) receives each request, including your IP address and browser type, to deliver the page and protect it from abuse. FiredBunny does not store these requests itself.</p>
        <h3>Your progress and tools, as a guest</h3>
        <p>Lessons you complete, your self-assessment, profile, goals, journal, plans and preferences are saved in your browser’s storage on this device. Anyone using the same browser can see them. You can export or delete them in <a href="#settings">Settings</a>. To work offline, the site also saves copies of its pages, and any lesson audio you choose to download, on your device.</p>
        <h3>A free account</h3>
        <p>Your email address, a password (stored only as a one-way hash by our sign-in provider, Supabase) and the data listed above. It is saved in FiredBunny’s database, hosted by Supabase in the United States. Other visitors can’t see it. The person who runs FiredBunny runs the database, so it is private from other visitors, not from the site owner. Sign-up and password emails are sent through Resend.</p>
        <h3>Usage statistics</h3>
        <p>Google Analytics, loaded through Google Tag Manager, counts visits and which pages, lessons, tools and audio people use. Google sets its own cookies for this and records details such as your approximate location, device and browser. FiredBunny sends coarse events (for example “lesson completed” or “calculator used”), never your figures or text. Advertising signals are always switched off. If your device’s time zone is in Europe, nothing loads until you allow it; elsewhere it is on by default and you can turn it off in Settings &gt; Privacy.</p>
        <h3>Feedback and the help chat</h3>
        <p>Feedback you send from the About page or the help chat is saved in FiredBunny’s database for the person who runs the site to read: your message, its kind, the page, the time and your browser type, plus your email only if you give one and your account id if you are signed in. The help chat’s conversation stays in your browser tab and is not sent anywhere.</p>
        <h3>The Plans waitlist</h3>
        <p>If you join the waitlist on the <a href="#plans">Plans</a> page, the extras you tick, any note and the time are saved, with your account id if you are signed in, or the email you give if you are not. That email is used only to tell you if the plan opens.</p>
        <h3>Connecting a brokerage (when this is switched on)</h3>
        <p>The <a href="#portfolio">Portfolio</a> page can connect a brokerage account read-only through SnapTrade. When you open the page, FiredBunny’s server fetches your balances, positions and transactions and passes them to your browser, which keeps a copy on that device only and deletes it when you sign out. Holdings are not saved to your account; the database keeps only an encrypted key for SnapTrade. You can disconnect at any time.</p>
        <h3>Chipping in (when this is switched on)</h3>
        <p>Tips are paid on Stripe’s own pages. FiredBunny never sees your card details; Stripe shares a record of the payment (such as the amount and the name and email you give Stripe).</p>
        <h3>Live data</h3>
        <p>When you look up a company’s earnings, FiredBunny’s server asks public data sources (such as the SEC) for that ticker. The lookup is not linked to you or saved.</p>`)}
      ${sec('03', 'Who else handles your data', 'The services FiredBunny runs on.', 'lg-who', `
        <ul>
          <li><b>Cloudflare</b>: hosts the site and its server code.</li>
          <li><b>Supabase</b>: the database and sign-in for accounts, feedback and the waitlist (United States).</li>
          <li><b>Resend</b>: sends account emails.</li>
          <li><b>Google</b> (Analytics and Tag Manager): usage statistics, as described above.</li>
          <li><b>SnapTrade</b>: brokerage connections, only if you connect one.</li>
          <li><b>Stripe</b>: payments, only if you chip in.</li>
        </ul>
        <p>Each handles data under its own privacy policy. FiredBunny shares nothing with anyone else, except where the law requires it.</p>`)}
      ${sec('04', 'How long it is kept', 'Until you remove it, or it is no longer needed.', 'lg-long', `
        <ul>
          <li><b>Browser data</b> stays until you delete it in Settings or clear your browser.</li>
          <li><b>Account data</b> stays until you delete your account in Settings, which removes your saved data, waitlist sign-up and brokerage key.</li>
          <li><b>Feedback and guest waitlist sign-ups</b> are kept while they are useful and removed on request.</li>
          <li><b>Usage statistics</b> are kept by Google for the retention period set in Google Analytics.</li>
        </ul>`)}
      ${sec('05', 'Your choices', 'See, export, correct or delete.', 'lg-choices', `
        <ul>
          <li>Export or delete your data, or your whole account, in <a href="#settings">Settings</a>.</li>
          <li>Turn usage statistics off in Settings &gt; Privacy.</li>
          <li>To have feedback or a guest waitlist sign-up removed, or for any other privacy request, use the <a href="#contact">contact page</a> and say which email or page it concerns.</li>
        </ul>
        <p>Depending on where you live, you may have the right to access, correct, delete or object to the use of your personal data. FiredBunny will act on any of these requests made through the contact page. Data from visitors outside the United States is stored in the United States.</p>`)}
      ${sec('06', 'Children', 'Made for adults.', 'lg-kids', `
        <p>FiredBunny is written for adults and is not directed at children under 13. Please don’t create an account if you are under 13. If you believe a child has given us personal data, tell us through the contact page and it will be deleted.</p>`)}
      ${sec('07', 'Changes', 'Dated at the top.', 'lg-changes', `
        <p>When what FiredBunny collects changes, this page changes in the same update and the date at the top moves. Questions: see the <a href="#contact">contact page</a>.</p>`)}`;
    return 'Privacy policy';
  };

  /* ---------------- terms ---------------- */
  SML.pages.terms = function (view) {
    view.innerHTML = `
      ${header('Terms of use', 'The <em>rules</em> for using FiredBunny', 'Short and in plain words. By using the site you agree to these terms.')}
      ${sec('01', 'Education, not advice', 'You make your own decisions.', 'tm-edu', `
        <p>Everything on FiredBunny, including lessons, calculators, simulators, the help chat and the Portfolio page, is <b>general education</b>. It is not investment, tax, legal or financial advice, and it is not a recommendation to buy, sell or hold anything. FiredBunny is not a registered investment adviser, broker, accountant or lawyer, and using the site does not create an adviser relationship.</p>
        <p>Trading and investing can lose money, including more than you put in with some products. Most new traders lose money. Before acting, consider your own situation and, where it matters, ask a licensed professional.</p>`)}
      ${sec('02', 'Accuracy', 'Checked, but not guaranteed.', 'tm-acc', `
        <p>Figures and rules are checked against the sources cited on each page (see the <a href="#editorial">editorial standards</a>), but laws, limits and prices change and mistakes happen. Calculators give estimates based on the assumptions they show. Past results, back-tests and examples do not predict future returns. If something looks wrong, please tell us through the <a href="#contact">contact page</a>.</p>`)}
      ${sec('03', 'Free to use', 'Nothing here is behind a paywall.', 'tm-free', `
        <p>The site is free. Optional tips unlock nothing. An optional paid plan is only being considered (see <a href="#plans">Plans</a>); if one ever opens, it will come with its own terms before anyone pays.</p>`)}
      ${sec('04', 'Your account and your conduct', 'Keep it fair and safe.', 'tm-acct', `
        <ul>
          <li>Keep your password to yourself. An account is for one person.</li>
          <li>Don’t try to break, overload or get around the site’s security, and don’t use automated tools in a way that slows it down for others.</li>
          <li>Don’t send feedback that is abusive, unlawful or contains other people’s personal data.</li>
          <li>FiredBunny may suspend an account or block access that breaks these rules.</li>
        </ul>
        <p>You can delete your account at any time in <a href="#settings">Settings</a>.</p>`)}
      ${sec('05', 'Content and sharing', 'Link and quote freely; don’t copy whole pages.', 'tm-content', `
        <p>The lessons, tools, images and audio on FiredBunny belong to the person who runs it, except third-party material such as the fonts and the narration model, which are used under their own licenses. You are welcome to link to any page and to quote short passages with credit and a link. Please don’t republish whole lessons, tools or the audio without permission.</p>
        <p>Links to other websites are there for reference; FiredBunny is not responsible for their content.</p>`)}
      ${sec('06', 'No warranty and limits of liability', 'Use it at your own risk.', 'tm-liab', `
        <p>FiredBunny is provided “as is”, without warranties of any kind, and may change or be unavailable at times. To the fullest extent the law allows, the person who runs FiredBunny is not liable for any loss or damage arising from your use of the site or from decisions you make based on it.</p>`)}
      ${sec('07', 'Changes', 'Dated at the top.', 'tm-changes', `
        <p>These terms may change; the date at the top shows the latest version. How your data is handled is described in the <a href="#privacy">privacy policy</a>.</p>`)}`;
    return 'Terms of use';
  };

  /* ---------------- contact ---------------- */
  SML.pages.contact = function (view) {
    const cards = [
      ['#about', 'Report a mistake', 'A number, rule or date that looks wrong? Use the feedback form on the About page and point to the page and, if you have it, the source.'],
      ['#about', 'Suggest a topic or tool', 'Tell the bunny what you wish the site covered, through the same form.'],
      ['#settings', 'Your data', 'Export or delete your data or your account yourself in Settings, any time.'],
      ['#about', 'Privacy requests', 'To remove feedback or a guest waitlist sign-up, send a note through the form with the email or page it concerns.'],
    ];
    view.innerHTML = `
      ${header('Contact', 'Reach <em>FiredBunny</em>', 'FiredBunny is written and run by one person under a pen name. Every message goes to that person through the feedback form; corrections are read first.')}
      <section class="chapter" style="padding-top:48px" aria-labelledby="ct-how"><div class="wrap">
        ${SML.chapHead('01', 'How to get in touch', 'Pick what fits.', '', 'ct-how')}
        <ul class="lg-cards">${cards.map(([h, t, d]) => `<li><a href="${h}"><strong>${t}</strong><span>${d}</span></a></li>`).join('')}</ul>
        <div class="prose lg-prose" style="margin-top:28px">
          <p>The form is on the <a href="#about">About page</a>, under “Tell the bunny”. Add an email if you would like a reply. You can also ask the help chat (the bunny in the corner) to send a note for you.</p>
          <p>FiredBunny can’t give personal financial, tax or legal advice, by message or otherwise. See the <a href="#terms">terms of use</a> and the <a href="#privacy">privacy policy</a>.</p>
        </div>
      </div></section>`;
    return 'Contact FiredBunny';
  };
})();
