/* Page metadata for search engines and link previews, built from the content itself (lessons, courses, tools, tracks,
   notes) so every new page gets it automatically: title, description, canonical address, robots, Open Graph / Twitter
   tags and JSON-LD structured data.

   - tools/prerender.py writes this into each page's pre-built HTML (what crawlers read), from SML.seo.meta() and
     SML.seo.jsonld(); on the website the router calls SML.seo.apply() after drawing a page so the live document says
     the same thing.
   - Titles are the page's own title. TITLES below gives a few terse lesson and tool titles a plain description of what
     the page does; keep them accurate and short, never a list of keywords.
   - Structured data only describes what the page visibly shows: Organization and WebSite on the home page,
     BreadcrumbList where the page shows breadcrumbs, Article for lessons and trade notes (author and publisher:
     FiredBunny, the organization; dates only when they are real). No Course markup (Google limits it to courses with
     instructors and a roster of students), no FAQ (retired), no app ratings (there are no real reviews to mark up).
   Markup helps search engines understand a page; it never guarantees a rich result or a citation. */
(function () {
  'use strict';
  const SML = window.SML;
  const ORIGIN = 'https://firedbunny.com'; // the one canonical address of the site
  const BRAND = 'FiredBunny';
  const IMAGE = ORIGIN + '/og-image.jpg'; // 1200 x 630
  const LOGO = ORIGIN + '/icon-512.png';
  const ABOUT = 'FiredBunny is a free, interactive money school: lessons, calculators and simulators on trading, investing, retirement and FIRE, in plain English.';

  // more descriptive titles for pages whose own title is one or two words (the page itself keeps its heading)
  const TITLES = {
    'l-contracts': 'Option contracts and moneyness: in, at and out of the money',
    'l-payoff': 'Option payoff diagrams: profit, loss and breakeven',
    'l-delta-gamma': 'Delta and gamma: how an option moves with the stock',
    'l-iv-crush': 'IV crush: why options can lose value after earnings',
    'l-candles': 'Candlestick charts: what one candle tells you',
    'l-support': 'Support and resistance: floors, ceilings and why they swap',
    'l-breakouts': 'Breakouts and fakeouts: wait for confirmation',
    'l-volume': 'Trading volume: why big moves need big volume',
    'l-vwap': 'VWAP explained: the volume-weighted average price',
    'l-rsi': 'RSI explained: how stretched a move is, from 0 to 100',
    'l-position-size': 'Position sizing: turn your stop and risk into a share count',
    'l-value': 'Value investing: buy a business for less than it is worth',
    'l-blend': 'Blending trading styles: one account, separate buckets',
    'l-earnings': 'Earnings reports: why stocks jump or drop on results',
    'l-tax-loss': 'Tax-loss harvesting: use losses to cut the tax on gains',
    'l-orders': 'Order types: market, limit and stop orders',
    'l-psychology': 'Trading psychology: fear, greed and broken rules',
    'l-mortgage': 'Mortgage basics: payments, amortization, PMI and refinancing',
    'l-wheel-tax': 'How the wheel strategy is taxed',
    'tool-size': 'Position size calculator',
    'tool-options': 'Option profit calculator: breakeven and Greeks',
    'tool-wheel': 'Wheel income calculator: premium return and annualized yield',
    'tool-compound': 'Compound interest calculator',
    'tool-expected': 'Expected move calculator for options',
    'tool-tlh': 'Tax-loss harvesting calculator',
    'tool-drawdown': 'Drawdown recovery calculator',
    'tool-value': 'Margin of safety calculator',
    'tool-ratios': 'Five-number stock check: P/E, growth, margins and debt',
    'tool-budget': 'Monthly budget calculator: needs, wants and saving',
    'tool-match': '401(k) match calculator',
    'tool-espp': 'ESPP return calculator',
    'tool-roth': 'Roth or traditional calculator',
    'tool-ss': 'Social Security claiming age calculator',
    'tool-retire': 'Retirement planner: savings and Social Security to age 95',
    'tool-brackets': 'Tax bracket calculator: marginal and effective rate',
    'tool-wheeltax': 'Wheel strategy tax walkthrough: puts, assignment and calls',
    'tool-mortgage': 'Mortgage calculator: payment, interest, PMI and extra payments',
    'tool-rental': 'Rental property calculator: cash flow and cap rate',
    'tool-fire': 'FIRE number calculator',
    'tool-swr': 'Safe withdrawal rate calculator',
    'tool-dataday': 'Data-day move: the market move priced in for CPI and jobs days',
    'tool-earnings': 'Earnings lookup: any US stock’s results in plain words',
    home: 'FiredBunny: learn trading, investing, retirement and FIRE by playing',
    tools: 'Free financial calculators and trading tools',
    glossary: 'Trading and personal finance glossary',
    play: 'Trade replay: practise day trading with fake money',
    wheel: 'Wheel strategy simulator',
    indicator: 'Free TradingView indicator: key levels, VWAP and EMAs',
    sheets: 'Free trading spreadsheet templates',
    apps: 'FiredBunny apps (in development)',
    blog: 'Trade notes: trade breakdowns, wheel logs and checklists',
    calendar: 'Market and tax calendar: Fed, inflation, jobs and tax dates',
    assessment: 'Investor self-assessment: what kind of investor are you?',
    'not-found': 'Page not found',
  };

  const find = (list, id) => (list || []).find((x) => x.id === id);
  const lessonsOf = (cid) => (SML.lessons || []).filter((l) => l.course === cid).sort((a, b) => (a.order || 0) - (b.order || 0));
  const coursesOf = (tid) => (SML.courses || []).filter((c) => (c.track || 'trading') === tid).sort((a, b) => a.n - b.n);
  const trackOf = (c) => find(SML.tracks, (c && c.track) || 'trading');
  const R = () => SML.routes;
  const url = (tok) => { const p = R() && R().path(tok); return p ? ORIGIN + p : ORIGIN + '/'; };
  const clean = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  // a description of at most `max` characters, cut at a word boundary
  function fit(s, max) {
    s = clean(s); max = max || 165;
    if (s.length <= max) return s;
    const cut = s.slice(0, max - 1).replace(/[\s,;:–-]+\S*$/, '');
    return cut + '…';
  }
  const count = () => ({ L: (SML.lessons || []).length, T: (SML.tools || []).length, G: (SML.glossary || []).length });

  const PAGES = {
    home: () => `Free interactive lessons on trading, options, retirement, taxes and FIRE: ${count().L} lessons you can play with, each with a quick quiz, plus ${count().T} calculators.`,
    tools: () => `${count().T} free interactive calculators and simulators for trading, retirement, taxes and FIRE. Each draws a picture of its answer. No sign-up, nothing stored.`,
    glossary: () => `${count().G} trading, investing and personal finance terms in plain English, from VWAP and theta to the wash sale rule, each linked to the lesson where you can try it.`,
    play: () => 'Practise day trading with fake money: replay a trading morning one 2-minute candle at a time, mark your levels, and get coaching on every trade. Prices are simulated.',
    wheel: () => 'Practise the options wheel with fake money: sell a put, maybe take the shares, sell calls and repeat, one month per click. Prices are simulated.',
    indicator: () => 'A free Pine Script indicator for TradingView that draws the four key levels, VWAP, the 13/48/200 EMA ribbon and volume breaks, with alerts.',
    sheets: () => 'Copy-ready trading spreadsheet templates with live formulas, starting with a trade journal. Edit them here, then copy them into Google Sheets or Excel.',
    apps: () => 'Three FiredBunny mobile apps are in development. Until launch, every tool is free on the web, and each preview on this page works.',
    blog: () => 'Trade breakdowns, wheel logs, checklists and routines, each with an interactive chart you can step through.',
    calendar: () => 'Fed meetings, inflation and jobs reports, PMI, options expiration, market holidays, tax deadlines and open enrollment, with why each date matters.',
    about: () => 'FiredBunny is a free, plain-English money school: ten years of money lessons turned into interactive lessons and tools on trading, retirement and FIRE.',
    assessment: () => 'Seven short parts, about 7 minutes: get your investor type, a risk profile, a starting mix, your FIRE number and a learning path. Answers stay in your browser.',
    results: () => 'Your FiredBunny investor profile from the self-assessment.',
    dashboard: () => 'Your goals, net worth, investor profile and lessons in one place, saved in this browser.',
    profile: () => 'The basics FiredBunny uses to tailor your dashboard, goals and assessment.',
    settings: () => 'Sync, preferences, lesson progress and your data: export, import or delete it.',
    signin: () => 'How FiredBunny saves your progress in your browser, with no account or password.',
    offline: () => 'Use FiredBunny without a connection: save lesson audio for offline listening and install the site as an app.',
    'not-found': () => 'This page does not exist. Browse the lessons and tools instead.',
  };

  function describe(tok) {
    if (tok.indexOf('l-') === 0) {
      const l = find(SML.lessons, tok); if (!l) return '';
      const idea = clean(l.idea), sum = clean(l.summary);
      if (idea.length >= 70 && idea.length <= 165) return idea;
      if (idea.length < 70) return fit(sum && sum !== idea ? idea + ' ' + sum : idea);
      return fit(sum.length >= 60 ? sum : idea);
    }
    if (tok.indexOf('c-') === 0) {
      const c = find(SML.courses, tok.slice(2)); if (!c) return '';
      const ls = lessonsOf(c.id); const first = ls[0], last = ls[ls.length - 1];
      return fit(`${clean(c.blurb)} ${ls.length} interactive lesson${ls.length === 1 ? '' : 's'}${ls.length > 1 ? `, from ${clean(first.title)} to ${clean(last.title)}` : ''}.`);
    }
    if (tok.indexOf('tool-') === 0) {
      const t = find(SML.tools, tok); if (!t) return '';
      const l = t.lesson && find(SML.lessons, t.lesson);
      return fit(`${clean(t.blurb)} A free interactive tool${l ? ` from the ${clean(l.title)} lesson` : ''}.`);
    }
    if (tok.indexOf('track-') === 0) {
      const tr = find(SML.tracks, tok.slice(6)); if (!tr) return '';
      const cs = coursesOf(tr.id); const n = cs.reduce((s, c) => s + lessonsOf(c.id).length, 0);
      return fit(`${clean(tr.blurb)} ${cs.length} courses, ${n} interactive lessons.`);
    }
    if (tok.indexOf('post-') === 0) { const p = find(SML.posts, tok); return p ? fit(p.excerpt) : ''; }
    if (tok === 'learn') return describe('track-trading');
    return PAGES[tok] ? fit(PAGES[tok]()) : fit(ABOUT);
  }

  // the visible title of a page, before any SEO wording
  function ownTitle(tok) {
    const r = tok.indexOf('c-') === 0 ? find(SML.courses, tok.slice(2)) : tok.indexOf('track-') === 0 ? find(SML.tracks, tok.slice(6)) : find(SML.lessons, tok) || find(SML.tools, tok) || find(SML.posts, tok);
    if (r) return tok.indexOf('track-') === 0 ? r.title + ' lessons' : r.title;
    return '';
  }
  // the document <title>: the page's descriptive title, then the brand
  function title(tok, pageTitle) {
    if (tok === 'home') return TITLES.home;
    const t = TITLES[tok] || clean(pageTitle) || ownTitle(tok) || BRAND;
    return t === BRAND ? BRAND : t + ' · ' + BRAND;
  }
  const isNoindex = (tok) => tok === 'not-found' || (R() && R().isPrivate(tok));
  const isArticle = (tok) => tok.indexOf('l-') === 0 || tok.indexOf('post-') === 0;

  function meta(tok, pageTitle) {
    const canonTok = R() ? R().canonicalOf(tok) : tok;
    return {
      title: title(tok, pageTitle),
      description: describe(tok),
      canonical: tok === 'not-found' ? '' : url(canonTok),
      url: tok === 'not-found' ? '' : url(tok),
      robots: isNoindex(tok) ? 'noindex, follow' : 'index, follow, max-image-preview:large',
      indexable: !isNoindex(tok) && canonTok === tok,
      type: isArticle(tok) ? 'article' : 'website',
      image: IMAGE, imageWidth: 1200, imageHeight: 630, imageAlt: 'FiredBunny: learn the market by playing with it',
    };
  }

  const ORG = { '@type': 'Organization', '@id': ORIGIN + '/#organization', name: BRAND, url: ORIGIN + '/', logo: LOGO, description: ABOUT };
  const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: it[1] })) });
  // structured data that matches what the page shows; opts.lastmod is the date its content last changed (YYYY-MM-DD)
  function jsonld(tok, opts) {
    opts = opts || {};
    const m = meta(tok);
    if (isNoindex(tok)) return [];
    if (tok === 'home') return [
      Object.assign({ '@context': 'https://schema.org' }, ORG),
      { '@context': 'https://schema.org', '@type': 'WebSite', '@id': ORIGIN + '/#website', name: BRAND, url: ORIGIN + '/', description: ABOUT, inLanguage: 'en-US', publisher: { '@id': ORIGIN + '/#organization' } },
    ];
    const article = (headline, extra) => Object.assign({
      '@context': 'https://schema.org', '@type': 'Article', headline: fit(headline, 110), description: m.description, url: m.url, mainEntityOfPage: m.url,
      image: [IMAGE], inLanguage: 'en-US', isAccessibleForFree: true,
      author: { '@type': 'Organization', name: BRAND, url: ORIGIN + '/' }, publisher: ORG,
    }, extra);
    if (tok.indexOf('l-') === 0) {
      const l = find(SML.lessons, tok); if (!l) return [];
      const c = find(SML.courses, l.course), tr = trackOf(c);
      const out = [];
      if (c && tr) out.push(crumbs([[tr.title, url('track-' + tr.id)], [c.title, url('c-' + c.id)], [l.title, m.url]]));
      const extra = { learningResourceType: 'Lesson', educationalLevel: l.level || 'Beginner', teaches: clean(l.idea) };
      if (l.mins) extra.timeRequired = 'PT' + l.mins + 'M';
      if (opts.lastmod) extra.dateModified = opts.lastmod;
      out.push(article(l.title, extra));
      return out;
    }
    if (tok.indexOf('c-') === 0) {
      const c = find(SML.courses, tok.slice(2)), tr = trackOf(c);
      return c && tr ? [crumbs([[tr.title, url('track-' + tr.id)], [c.title, m.url]])] : [];
    }
    if (tok.indexOf('tool-') === 0) {
      const t = find(SML.tools, tok);
      return t ? [crumbs([['Tools', url('tools')], [t.title, m.url]])] : [];
    }
    if (tok.indexOf('post-') === 0) {
      const p = find(SML.posts, tok); if (!p) return [];
      const extra = {};
      if (/^\d{4}-\d{2}-\d{2}$/.test(p.date || '')) extra.datePublished = p.date;
      const mod = opts.lastmod && (!extra.datePublished || opts.lastmod >= extra.datePublished) ? opts.lastmod : extra.datePublished;
      if (mod) extra.dateModified = mod;
      return [crumbs([['Trade notes', url('blog')], [p.title, m.url]]), article(p.title, extra)];
    }
    return [];
  }

  /* Keep the live document's head in step with the page drawn (website only). The pre-built HTML already carries the
     right tags for its own address; this matters when a page is reached by a link inside the site, or opened from the
     offline copy. Structured data from another page is removed, never left behind. */
  function setTag(sel, make, attr, value) {
    let el = document.head.querySelector(sel);
    if (value == null || value === '') { if (el) el.remove(); return; }
    if (!el) { el = make(); document.head.appendChild(el); }
    el.setAttribute(attr, value);
  }
  const metaEl = (k, v) => () => { const e = document.createElement('meta'); e.setAttribute(k, v); return e; };
  function apply(tok) {
    if (!R() || R().mode !== 'path' || !document.head) return;
    const m = meta(tok, null);
    setTag('meta[name="description"]', metaEl('name', 'description'), 'content', m.description);
    setTag('meta[name="robots"]', metaEl('name', 'robots'), 'content', m.robots);
    setTag('link[rel="canonical"]', () => { const e = document.createElement('link'); e.rel = 'canonical'; return e; }, 'href', m.canonical);
    setTag('meta[property="og:title"]', metaEl('property', 'og:title'), 'content', document.title);
    setTag('meta[property="og:description"]', metaEl('property', 'og:description'), 'content', m.description);
    setTag('meta[property="og:url"]', metaEl('property', 'og:url'), 'content', m.url);
    setTag('meta[property="og:type"]', metaEl('property', 'og:type'), 'content', m.type);
    setTag('meta[name="twitter:title"]', metaEl('name', 'twitter:title'), 'content', document.title);
    setTag('meta[name="twitter:description"]', metaEl('name', 'twitter:description'), 'content', m.description);
    document.querySelectorAll('script[type="application/ld+json"][data-fb-tok]').forEach((s) => { if (s.getAttribute('data-fb-tok') !== tok) s.remove(); });
  }

  SML.seo = { ORIGIN, ABOUT, TITLES, title, meta, describe, jsonld, apply };
})();
