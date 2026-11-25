/* Privacy policy (/privacy/), terms of use (/terms/) and contact (/contact/).
 * Every sentence must stay true of the site as it is. If data handling changes (a new service, a new table, analytics
 * settings, the Portfolio page or tips going live), change the privacy page, the Settings privacy list
 * (src/mod-y-account.js) and the help chat's privacy notes (src/chat-data.js) in the same commit, and move UPDATED.
 * The site is operated by FluidWeb LLC (since Nov 25 2026). These pages were written without a lawyer, from public guidance;
 * the owner's notes on what they cover and what is still open are in the Claude Doc "FiredBunny under FluidWeb LLC".
 * Prefix: .lg- */
(function () {
  'use strict';
  const SML = window.SML;
  const UPDATED = 'November 25, 2026';

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
      ${header('Privacy', 'What FiredBunny <em>keeps</em>, and why', 'FiredBunny is a free education site with no ads, run by FluidWeb LLC. This page says what is stored about you, where, why, for how long and how to remove it, in plain words.')}
      ${SML.host === 'claude' ? `<div class="wrap" style="margin-top:20px"><div class="callout info">This policy is for the website, firedbunny.com. In this copy on claude.ai, a signed-in visitor’s data is kept in this page’s private storage on claude.ai, and feedback is the only thing the owner reads.</div></div>` : ''}
      ${sec('01', 'Who we are', 'The company responsible for your data.', 'lg-who-we', `
        <p>FiredBunny (firedbunny.com) is operated by <b>FluidWeb LLC</b> (“FluidWeb”, “we”, “us”). FluidWeb LLC decides how the personal data described here is used and is responsible for it (in European terms, the data controller). To reach us about privacy, use the <a href="#contact">contact page</a>.</p>`)}
      ${sec('02', 'The short version', 'Most of what you do stays on your device.', 'lg-short', `
        <ul>
          <li><b>As a guest</b>, your progress, profile, journal and plans are saved in your browser only. We have no copy.</li>
          <li><b>With a free account</b>, that same data and your email address are saved in FiredBunny’s database so they follow you to other devices.</li>
          <li><b>Usage statistics</b> come from Google Analytics. Visitors in Europe are asked first; everyone can switch it off in <a href="#settings">Settings</a>. It never receives your profile, goals, money figures or anything you type into a tool.</li>
          <li>FiredBunny shows <b>no ads</b>, uses no advertising cookies, and <b>does not sell or rent</b> anyone’s data or share it for targeted advertising.</li>
        </ul>`)}
      ${sec('03', 'What is collected, and when', 'Only what each feature needs.', 'lg-what', `
        <h3>Reading the site</h3>
        <p>Like every website, the host (Cloudflare) receives each request, including your IP address and browser type, to deliver the page and protect it from abuse. We do not store these requests ourselves.</p>
        <h3>Your progress and tools, as a guest</h3>
        <p>Lessons you complete, your self-assessment, profile, goals, journal, plans and preferences are saved in your browser’s storage on this device. Anyone using the same browser can see them. You can export or delete them in <a href="#settings">Settings</a>. To work offline, the site also saves copies of its pages, and any lesson audio you choose to download, on your device.</p>
        <h3>A free account</h3>
        <p>Your email address, a password (stored only as a one-way hash by our sign-in provider, Supabase) and the data listed above. It is saved in FiredBunny’s database, hosted by Supabase in the United States. Other visitors can’t see it. FluidWeb LLC runs the database, so your data is private from other visitors, not from us. Sign-up and password emails are sent through Resend.</p>
        <h3>Usage statistics</h3>
        <p>Google Analytics, loaded through Google Tag Manager, counts visits and which pages, lessons, tools and audio people use. Google sets its own cookies for this and records details such as your approximate location, device and browser. We send coarse events (for example “lesson completed” or “calculator used”), never your figures or text. Advertising signals are always switched off. If your device’s time zone is in Europe, nothing loads until you allow it; elsewhere it is on by default and you can turn it off in Settings &gt; Privacy. A FiredBunny calculator embedded on another website loads no analytics at all.</p>
        <h3>Feedback and the help chat</h3>
        <p>Feedback you send from the About page or the help chat is saved in FiredBunny’s database for us to read: your message, its kind, the page, the time and your browser type, plus your email only if you give one and your account id if you are signed in. The help chat’s conversation stays in your browser tab and is not sent anywhere.</p>
        <h3>The Plans waitlist</h3>
        <p>If you join the waitlist on the <a href="#plans">Plans</a> page, the extras you tick, any note and the time are saved, with your account id if you are signed in, or the email you give if you are not. That email is used only to tell you if the plan opens.</p>
        <h3>Connecting a brokerage (when this is switched on)</h3>
        <p>The <a href="#portfolio">Portfolio</a> page can connect a brokerage account read-only through SnapTrade. When you open the page, FiredBunny’s server fetches your balances, positions and transactions and passes them to your browser, which keeps a copy on that device only and deletes it when you sign out. Holdings are not saved to your account; the database keeps only an encrypted key for SnapTrade. You can disconnect at any time.</p>
        <h3>Chipping in (when this is switched on)</h3>
        <p>Tips are paid on Stripe’s own pages. We never see your card details; Stripe shares a record of the payment (such as the amount and the name and email you give Stripe), which we keep for our accounts and taxes.</p>
        <h3>Live data</h3>
        <p>When you look up a company’s earnings, FiredBunny’s server asks public data sources (such as the SEC) for that ticker. The lookup is not linked to you or saved.</p>`)}
      ${sec('04', 'Why we use it', 'And the legal basis for each use.', 'lg-why', `
        <ul>
          <li><b>To deliver the site and keep it secure</b> (requests, abuse protection): our legitimate interest in running a working, safe website.</li>
          <li><b>To run your account</b> (sign-in, syncing, emails about your account) and <b>to show your connected brokerage</b> when you ask: to provide the service you signed up for.</li>
          <li><b>Usage statistics</b>: your consent where the law requires it (we ask visitors in Europe first); elsewhere our legitimate interest in knowing which lessons help, which you can switch off at any time.</li>
          <li><b>Feedback and the waitlist</b>: to answer what you sent and to tell you if the plan opens, because you asked us to.</li>
          <li><b>Payment records</b>: to keep accounts and meet tax and legal obligations.</li>
        </ul>
        <p>We do not use your data for advertising, profiling or automated decisions that affect you. The Portfolio page’s explanations are calculated in your browser for you to read; nothing is decided about you.</p>`)}
      ${sec('05', 'Who else handles your data', 'The services FiredBunny runs on.', 'lg-who', `
        <ul>
          <li><b>Cloudflare</b>: hosts the site and its server code.</li>
          <li><b>Supabase</b>: the database and sign-in for accounts, feedback and the waitlist (United States).</li>
          <li><b>Resend</b>: sends account emails.</li>
          <li><b>Google</b> (Analytics and Tag Manager): usage statistics, as described above.</li>
          <li><b>SnapTrade</b>: brokerage connections, only if you connect one.</li>
          <li><b>Stripe</b>: payments, only if you chip in.</li>
        </ul>
        <p>Each handles data under its own terms and privacy policy. We share nothing with anyone else, except: when the law requires it (for example a valid court order), to protect the safety of people or the site, or if FluidWeb LLC or FiredBunny is sold or merged, in which case the new owner must keep the promises on this page or ask you first.</p>`)}
      ${sec('06', 'Where your data is stored', 'In the United States.', 'lg-where', `
        <p>FluidWeb LLC is based in the United States, and FiredBunny’s database and services are in the United States. If you use the site from elsewhere, including the European Union or the United Kingdom, your data is transferred to and processed in the United States, where privacy law may differ from yours.</p>`)}
      ${sec('07', 'How long it is kept', 'Until you remove it, or it is no longer needed.', 'lg-long', `
        <ul>
          <li><b>Browser data</b> stays until you delete it in Settings or clear your browser.</li>
          <li><b>Account data</b> stays until you delete your account in Settings, which removes your saved data, waitlist sign-up and brokerage key.</li>
          <li><b>Feedback</b> is kept while it is useful, and no longer than two years; sooner on request.</li>
          <li><b>Guest waitlist emails</b> are kept until the plan opens and you have been told, or until you ask us to remove yours.</li>
          <li><b>Payment records</b> are kept as long as tax law requires.</li>
          <li><b>Usage statistics</b> are kept by Google for the retention period set in Google Analytics.</li>
        </ul>`)}
      ${sec('08', 'Security', 'Sensible protection, honestly described.', 'lg-sec', `
        <p>The site is served only over HTTPS. Each account can read and change only its own rows in the database, passwords are stored as one-way hashes, and the key that links a brokerage is encrypted with a key only FiredBunny’s server holds. Card details never reach us. No system is perfectly secure, so we cannot promise that data will never be exposed; if a breach affects your personal data, we will tell you and the authorities as the law requires.</p>`)}
      ${sec('09', 'Your rights and choices', 'See, export, correct or delete.', 'lg-choices', `
        <ul>
          <li>Export or delete your data, or your whole account, in <a href="#settings">Settings</a>, any time.</li>
          <li>Turn usage statistics off in Settings &gt; Privacy. Withdrawing consent does not affect what happened before.</li>
          <li>For anything else (a copy of what we hold, a correction, removing feedback or a guest waitlist sign-up, or objecting to a use), send a request through the <a href="#contact">contact page</a> and say which email or page it concerns. We answer within 30 days and may ask you to confirm the request comes from you.</li>
        </ul>
        <p>Depending on where you live, the law may give you the right to access, correct, delete, restrict, move or object to the use of your personal data. If you are in the EU or the UK, you can also complain to your local data protection authority. Some US states give residents similar rights; we honor them for everyone, and we never sell personal data or share it for targeted advertising. We will not treat you differently for using any of these rights.</p>`)}
      ${sec('10', 'Children', 'Made for adults.', 'lg-kids', `
        <p>FiredBunny is written for adults and is not directed at children under 13. Please don’t create an account or send us personal data if you are under 13. If we learn that we have personal data from a child under 13, we delete it. If you believe a child has given us personal data, tell us through the contact page.</p>`)}
      ${sec('11', 'Changes', 'Dated at the top.', 'lg-changes', `
        <p>When what we collect or how we use it changes, this page changes in the same update and the date at the top moves. If a change is significant, we will say so on the site before it takes effect. Questions: see the <a href="#contact">contact page</a>.</p>`)}`;
    return 'Privacy policy';
  };

  /* ---------------- terms ---------------- */
  SML.pages.terms = function (view) {
    view.innerHTML = `
      ${header('Terms of use', 'The <em>rules</em> for using FiredBunny', 'In plain words, but they are a real agreement. By using the site you agree to these terms. Please read the parts on advice, liability and disputes.')}
      ${sec('01', 'Who you are dealing with', 'FluidWeb LLC runs FiredBunny.', 'tm-who', `
        <p>FiredBunny (firedbunny.com and its lessons, tools, audio, help chat, embeds and any app) is operated by <b>FluidWeb LLC</b> (“FluidWeb”, “we”, “us”). These terms are an agreement between you and FluidWeb LLC. If you don’t agree with them, please don’t use the site.</p>
        <p>You must be at least 13 to use FiredBunny. If you are under 18, you need a parent’s or guardian’s permission to create an account.</p>`)}
      ${sec('02', 'Education, not advice', 'The same lessons for everyone. You make your own decisions.', 'tm-edu', `
        <p>Everything on FiredBunny, including lessons, calculators, simulators, the help chat and the Portfolio page, is <b>general education</b>, published for everyone alike. It is not investment, tax, legal or financial advice, and it is not a recommendation to buy, sell or hold any security or to follow any strategy.</p>
        <p>FluidWeb LLC is not a registered investment adviser, broker-dealer, accountant or law firm. Using the site, sending feedback or connecting an account does not create an adviser, fiduciary or client relationship. The Portfolio page applies the same lessons to figures you choose to connect, in your own browser; it never says what to buy or sell, and we do not manage, trade or hold anyone’s money.</p>
        <p>FluidWeb LLC and the person who writes FiredBunny may own securities, funds or crypto mentioned on the site. Nothing is written to promote an investment we hold, and we are not paid by any company, fund or broker the site mentions: there are no ads, sponsors or affiliate links.</p>`)}
      ${sec('03', 'Risk is yours', 'Markets can take more than they give.', 'tm-risk', `
        <p>Trading and investing can lose money, including more than you put in with options, margin or short selling. Most new traders lose money. Any decision you make with what you learn here, and its results, is yours alone. Before acting, consider your own situation and, where it matters, ask a licensed professional who knows your details.</p>`)}
      ${sec('04', 'Accuracy and data', 'Checked, but not guaranteed.', 'tm-acc', `
        <p>Figures and rules are checked against the sources cited on each page (see the <a href="#editorial">editorial standards</a>), but laws, limits and prices change and mistakes happen. Most examples use made-up numbers and simulated prices. Calculators give estimates based on the assumptions they show. Past results, back-tests and simulations do not predict future returns.</p>
        <p>Prices, earnings figures, calendars and brokerage data come from third parties (such as the SEC, market data providers and SnapTrade). They may be late, incomplete or wrong, and we do not guarantee them. Check anything important with the original source before you rely on it. If something looks wrong, tell us through the <a href="#contact">contact page</a>.</p>`)}
      ${sec('05', 'Free to use, and tips', 'Nothing here is behind a paywall.', 'tm-free', `
        <p>The site is free. If tips are switched on, a tip is a voluntary payment for content that is already free: it buys nothing, unlocks nothing, is not a donation to a charity and is not tax-deductible. Tips are processed by Stripe under its terms and are not refundable, except where the law requires a refund or where we choose to give one. An optional paid plan is only being considered (see <a href="#plans">Plans</a>); if one ever opens, it will have its own terms before anyone pays.</p>`)}
      ${sec('06', 'Your account and your conduct', 'Keep it fair and safe.', 'tm-acct', `
        <ul>
          <li>Give a real email address, keep your password to yourself, and tell us if you think someone else has used your account. An account is for one person, and you are responsible for what happens in it.</li>
          <li>Don’t try to break, overload or get around the site’s security, don’t access other people’s data, and don’t use automated tools in a way that slows the site down for others.</li>
          <li>Don’t use the site for anything unlawful, and don’t send feedback that is abusive, unlawful, or contains other people’s personal data.</li>
          <li>We may suspend or close an account, or block access, that breaks these rules or puts the site or other people at risk.</li>
        </ul>
        <p>You can delete your account at any time in <a href="#settings">Settings</a>.</p>`)}
      ${sec('07', 'Other services', 'Their terms apply too.', 'tm-third', `
        <p>Some features rely on other companies: SnapTrade and your brokerage for the Portfolio page, Stripe for tips, Supabase for accounts, Google for usage statistics, and the sites we link to. Your use of them is governed by their own terms and privacy policies. Brokerage connections are read-only. We are not responsible for another company’s service, content, outages or mistakes, and a link is not an endorsement.</p>`)}
      ${sec('08', 'Content, sharing and feedback', 'Link and quote freely; don’t copy whole pages.', 'tm-content', `
        <p>The lessons, tools, images, audio and code of FiredBunny belong to FluidWeb LLC, except third-party material such as the fonts and the narration model, which are used under their own licenses. You may use the site for your own learning. You are welcome to link to any page, to quote short passages with credit and a link, and to embed a calculator with the code shown under “Embed this calculator”, unchanged and with its link back. Please don’t republish whole lessons, tools or the audio, or present them as your own, without permission.</p>
        <p>If you send us feedback or ideas, you let us use them to improve FiredBunny without owing you anything. We will never publish your name or email with them.</p>`)}
      ${sec('09', 'No warranty', 'Provided as it is.', 'tm-warranty', `
        <p><b>FiredBunny is provided “as is” and “as available”, without warranties of any kind, express or implied, including warranties of accuracy, fitness for a particular purpose and uninterrupted or error-free service, to the fullest extent the law allows.</b> The site may change, lose data, or be unavailable at times, and features may be added or removed.</p>`)}
      ${sec('10', 'Limits of liability', 'Use it at your own risk.', 'tm-liab', `
        <p><b>To the fullest extent the law allows, FluidWeb LLC, its members and the people who write for it are not liable for any trading or investment losses, lost profits or savings, lost data, or any indirect, incidental, special or consequential damages arising from your use of FiredBunny or from decisions you make based on it, even if we were told they were possible.</b></p>
        <p><b>Where we are liable for anything, our total liability to you is limited to the greater of US$50 or the amount you paid FluidWeb LLC in the 12 months before the claim.</b></p>
        <p>Some places do not allow some of these limits. Where that is the case, they apply only as far as the law allows, and nothing in these terms limits liability that cannot be limited by law, such as for fraud.</p>`)}
      ${sec('11', 'If you misuse the site', 'You cover what you cause.', 'tm-indem', `
        <p>If you break these terms or the law while using FiredBunny, and someone brings a claim against FluidWeb LLC because of it, you agree to cover the reasonable costs of that claim, including legal fees, as far as the law allows.</p>`)}
      ${sec('12', 'Disputes', 'Talk first; Utah law.', 'tm-disputes', `
        <ul>
          <li><b>Talk to us first.</b> If you have a problem with FiredBunny, send it through the <a href="#contact">contact page</a>. Most things can be fixed that way, and you agree to give us 60 days to try before starting a legal claim.</li>
          <li><b>Utah law.</b> These terms are governed by the laws of the State of Utah and of the United States, without regard to conflict-of-law rules.</li>
          <li><b>Where.</b> Any legal claim must be brought in the state or federal courts located in Salt Lake County, Utah, and you and we agree to those courts’ jurisdiction. Either of us may instead bring a claim that qualifies in a small claims court.</li>
          <li><b>One at a time.</b> To the extent the law allows, claims may be brought only individually, not as a plaintiff or class member in a class, collective or representative action.</li>
          <li><b>Time limit.</b> To the extent the law allows, any claim must be started within one year after it arose.</li>
        </ul>
        <p>If you live in the European Union, the United Kingdom or another place whose consumer law gives you rights that a contract cannot take away, such as suing in your home courts, you keep those rights.</p>`)}
      ${sec('13', 'Ending', 'Either of us can stop.', 'tm-end', `
        <p>You can stop using FiredBunny and delete your account at any time. We may stop offering the site or any feature, or end your access if you break these terms. The parts on advice, risk, content, warranty, liability, misuse and disputes still apply after that.</p>`)}
      ${sec('14', 'Changes and the fine print', 'Dated at the top.', 'tm-changes', `
        <p>These terms may change; the date at the top shows the latest version, and using the site after a change means you accept it. If a change is significant, we will say so on the site before it takes effect.</p>
        <p>These terms and the <a href="#privacy">privacy policy</a> are the whole agreement between you and FluidWeb LLC about the site. If a part of them can’t be enforced, the rest still applies. If we don’t enforce a part right away, we haven’t given it up. We may transfer these terms to whoever takes over FiredBunny; you may not transfer yours. We are not responsible for delays or outages caused by events outside our reasonable control.</p>`)}`;
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
      ${header('Contact', 'Reach <em>FiredBunny</em>', 'FiredBunny is published by FluidWeb LLC and written by one person under a pen name. Every message goes to that person through the feedback form; corrections are read first.')}
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
