/* Permanent addresses for every page of the website (https://firedbunny.com/lessons/wheel-strategy/ rather than
   /#l-wheel), and the helpers the router, the link rewriter, the metadata (seo.js) and the build use.

   - Each page keeps the address it was given in FROZEN forever: search results and shared links point at it. Never edit
     an existing entry, even when a title changes. Add new pages to FROZEN when they ship; until then a new lesson,
     course, tool, track or note gets an automatic address from its title (prefix + slug), and the build lists those
     so they can be frozen.
   - The website ('web' host over http/https) uses real paths with the History API. The claude.ai copy and a file opened
     from disk keep #token addresses, since they have no server to answer paths.
   - PRIVATE pages (per-visitor views and utilities) get noindex and stay out of the sitemap.
   FROZEN was generated from docs/search-optimization/URL_INVENTORY.csv (recommended_url). */
(function () {
  'use strict';
  const SML = window.SML;
  const FROZEN = {
    "home": "/",
    "learn": "/learn/",
    "track-trading": "/tracks/trading/",
    "track-wealth": "/tracks/retirement-wealth/",
    "track-fire": "/tracks/fire/",
    "tools": "/tools/",
    "indicator": "/tradingview-indicator/",
    "play": "/playground/",
    "wheel": "/tools/wheel-simulator/",
    "blog": "/notes/",
    "sheets": "/spreadsheets/",
    "apps": "/apps/",
    "glossary": "/glossary/",
    "calendar": "/calendar/",
    "about": "/about/",
    "assessment": "/investor-assessment/",
    "results": "/results/",
    "dashboard": "/dashboard/",
    "profile": "/profile/",
    "settings": "/settings/",
    "signin": "/signin/",
    "offline": "/offline/",
    "c-basics": "/courses/market-basics/",
    "c-charts": "/courses/reading-charts/",
    "c-indicators": "/courses/indicators/",
    "c-options": "/courses/options-and-the-wheel/",
    "c-risk": "/courses/risk-and-sizing/",
    "c-styles": "/courses/trading-styles/",
    "c-fundamentals": "/courses/company-fundamentals/",
    "c-taxes": "/courses/taxes-for-traders/",
    "c-habits": "/courses/execution-and-habits/",
    "c-ai": "/courses/trading-with-ai/",
    "c-money": "/courses/money-foundations/",
    "c-debt": "/courses/debt-and-credit/",
    "c-banking": "/courses/banking-and-cards/",
    "c-benefits": "/courses/company-benefits/",
    "c-accounts": "/courses/retirement-accounts/",
    "c-invest": "/courses/investing-for-decades/",
    "c-wtax": "/courses/smart-taxes/",
    "c-home": "/courses/home-and-real-estate/",
    "c-protect": "/courses/protect-what-you-build/",
    "c-retire": "/courses/early-or-late-retirement/",
    "c-fi-basics": "/courses/your-fire-number/",
    "c-fi-where": "/courses/where-will-you-live/",
    "c-fi-tax": "/courses/taxes-in-early-retirement/",
    "c-fi-health": "/courses/health-care-and-social-security/",
    "c-fi-abroad": "/courses/retiring-abroad/",
    "c-fi-plan": "/courses/stress-test-your-plan/",
    "c-fed": "/courses/fed-and-interest-rates/",
    "c-econ": "/courses/economic-data-and-the-calendar/",
    "c-commod": "/courses/oil-metals-and-geopolitics/",
    "c-crypto": "/courses/crypto-and-blockchain/",
    "c-realco": "/courses/read-a-real-company/",
    "l-stocks": "/lessons/what-a-stock-is/",
    "l-bonds": "/lessons/bonds-and-interest-rates/",
    "l-etfs": "/lessons/index-funds-and-etfs/",
    "l-risk-ladder": "/lessons/risk-ladder/",
    "l-broker": "/lessons/choosing-a-broker/",
    "l-candles": "/lessons/candlesticks/",
    "l-timeframes": "/lessons/2-min-vs-15-min/",
    "l-levels": "/lessons/pdh-pdl-pmh-pml/",
    "l-support": "/lessons/support-and-resistance/",
    "l-breakouts": "/lessons/breakouts-and-fakeouts/",
    "l-volume": "/lessons/volume/",
    "l-moving-averages": "/lessons/sma-vs-ema/",
    "l-ema-stack": "/lessons/13-48-and-200-ema/",
    "l-vwap": "/lessons/vwap/",
    "l-rsi": "/lessons/rsi/",
    "l-volatility": "/lessons/volatility-and-expected-move/",
    "l-options-101": "/lessons/calls-and-puts/",
    "l-contracts": "/lessons/contracts-and-moneyness/",
    "l-payoff": "/lessons/payoff-diagrams/",
    "l-delta-gamma": "/lessons/delta-and-gamma/",
    "l-theta": "/lessons/theta-time-decay/",
    "l-iv-crush": "/lessons/iv-and-earnings/",
    "l-wheel": "/lessons/wheel-strategy/",
    "l-one-percent": "/lessons/1-percent-rule/",
    "l-position-size": "/lessons/position-sizing/",
    "l-risk-reward": "/lessons/win-rate-and-reward/",
    "l-drawdowns": "/lessons/losses-are-lopsided/",
    "l-stock-picking": "/lessons/which-stocks-to-trade/",
    "l-styles": "/lessons/day-swing-wheel-value/",
    "l-game-plan": "/lessons/day-trade-game-plan/",
    "l-value": "/lessons/value-investing/",
    "l-blend": "/lessons/blending-styles/",
    "l-statements": "/lessons/three-statements/",
    "l-earnings": "/lessons/earnings-reports/",
    "l-ratios": "/lessons/five-numbers-to-check/",
    "l-cap-gains": "/lessons/short-vs-long-term-gains/",
    "l-tax-loss": "/lessons/tax-loss-harvesting/",
    "l-wash-sale": "/lessons/wash-sale-rule/",
    "l-orders": "/lessons/order-types/",
    "l-pdt": "/lessons/day-trading-rules/",
    "l-psychology": "/lessons/trading-psychology/",
    "l-emotions": "/lessons/fear-greed-and-tilt/",
    "l-journal": "/lessons/keep-a-journal/",
    "l-ai-basics": "/lessons/what-ai-can-and-cant-do/",
    "l-ai-research": "/lessons/ai-as-your-research-assistant/",
    "l-ai-mistakes": "/lessons/ai-mistakes-to-avoid/",
    "l-ai-automate": "/lessons/automate-trades-with-robinhood-and-mcp/",
    "l-ai-bots": "/lessons/benefits-and-risks-of-trading-bots/",
    "l-ai-setups": "/lessons/setups-worth-automating/",
    "l-backtest": "/lessons/backtest-before-you-trust/",
    "l-ai-pine": "/lessons/build-a-tradingview-indicator-with-ai/",
    "l-ai-news": "/lessons/use-ai-to-read-news-and-data/",
    "l-ai-security": "/lessons/keys-privacy-and-the-rules/",
    "l-ai-journal": "/lessons/ai-as-your-trading-coach/",
    "l-budget": "/lessons/build-a-monthly-budget/",
    "l-track-spending": "/lessons/track-your-spending/",
    "l-latte": "/lessons/small-habits-big-numbers/",
    "l-emergency": "/lessons/emergency-fund-and-where-to-park-cash/",
    "l-net-worth": "/lessons/know-your-net-worth/",
    "l-credit-score": "/lessons/how-credit-scores-work/",
    "l-card-debt": "/lessons/credit-card-debt-get-out-stay-out/",
    "l-balance-transfer": "/lessons/0-percent-apr-and-balance-transfers/",
    "l-car-cash": "/lessons/car-pay-cash-or-take-the-loan/",
    "l-smart-leverage": "/lessons/leverage-the-smart-way/",
    "l-bank-tiers": "/lessons/why-a-banking-relationship-pays/",
    "l-private-client": "/lessons/private-client-perks-and-their-real-cost/",
    "l-travel-money": "/lessons/travel-money-with-no-foreign-fees/",
    "l-rewards": "/lessons/rewards-cards-without-the-trap/",
    "l-401k-match": "/lessons/401k-match-is-free-money/",
    "l-401k-limits": "/lessons/max-your-401k-the-limits-most-people-miss/",
    "l-mega-backdoor": "/lessons/mega-backdoor-roth/",
    "l-hsa": "/lessons/hsa-a-triple-tax-break/",
    "l-rsu": "/lessons/rsus-taxes-at-vest-and-when-to-sell/",
    "l-espp": "/lessons/espp-the-15-percent-discount/",
    "l-stock-options": "/lessons/stock-options-isos-and-nsos/",
    "l-open-enrollment": "/lessons/open-enrollment-pick-the-right-plan/",
    "l-trad-vs-roth": "/lessons/traditional-or-roth/",
    "l-ira": "/lessons/when-to-open-an-ira-and-in-what-order-to-save/",
    "l-backdoor-roth": "/lessons/backdoor-roth-ira-step-by-step/",
    "l-social-security": "/lessons/social-security-when-to-claim/",
    "l-medicare-rmd": "/lessons/medicare-rmds-and-irmaa/",
    "l-compound": "/lessons/power-of-compound-interest/",
    "l-index-funds": "/lessons/index-funds-vtwax-vti-and-voo/",
    "l-allocation": "/lessons/stocks-bonds-and-your-age/",
    "l-extra-money": "/lessons/where-your-extra-money-should-go/",
    "l-kids-money": "/lessons/kids-529s-trump-accounts-and-custodial-roths/",
    "l-tax-brackets": "/lessons/how-tax-brackets-really-work/",
    "l-deductions": "/lessons/deductions-and-credits-worth-knowing/",
    "l-asset-location": "/lessons/asset-location-the-right-account-for-each-fund/",
    "l-tlh-pairs": "/lessons/tax-loss-harvesting-with-fund-pairs/",
    "l-wheel-tax": "/lessons/how-the-wheel-is-taxed/",
    "l-wheel-ira": "/lessons/run-the-wheel-in-an-ira/",
    "l-rent-vs-buy": "/lessons/rent-or-buy/",
    "l-mortgage": "/lessons/mortgage-basics/",
    "l-home-taxes": "/lessons/your-home-and-taxes/",
    "l-house-invest": "/lessons/is-a-house-an-investment/",
    "l-rental": "/lessons/rental-property-the-real-numbers/",
    "l-airbnb": "/lessons/airbnb-gross-vs-real-revenue/",
    "l-insurance": "/lessons/insurance-you-actually-need/",
    "l-estate": "/lessons/wills-beneficiaries-and-trusts/",
    "l-scams": "/lessons/scams-that-target-savers/",
    "l-retire-age": "/lessons/retire-at-55-62-67-or-70/",
    "l-retire-plan": "/lessons/your-retirement-plan-on-one-page/",
    "l-retire-income": "/lessons/turn-savings-into-a-paycheck/",
    "l-retire-countdown": "/lessons/ten-year-countdown/",
    "l-fire-intro": "/lessons/what-fire-really-means/",
    "l-avg-spending": "/lessons/find-your-real-spending/",
    "l-fire-number": "/lessons/your-fire-number/",
    "l-savings-rate": "/lessons/savings-rate-is-the-lever/",
    "l-coast-fire": "/lessons/coast-fire-and-barista-fire/",
    "l-geo-arbitrage": "/lessons/where-your-money-goes-furthest/",
    "l-van-life": "/lessons/van-rv-trailer-or-house/",
    "l-travel-budget": "/lessons/budget-for-a-life-of-travel/",
    "l-household": "/lessons/partners-kids-and-your-number/",
    "l-visas": "/lessons/visas-for-early-retirees/",
    "l-fire-tax": "/lessons/how-fire-withdrawals-are-taxed/",
    "l-zero-bracket": "/lessons/0-percent-capital-gains-bracket/",
    "l-early-access": "/lessons/money-out-before-59-half/",
    "l-aca": "/lessons/health-insurance-before-65/",
    "l-health-bridge": "/lessons/bridging-the-gap-to-medicare/",
    "l-ss-early": "/lessons/social-security-when-you-stop-early/",
    "l-us-tax-abroad": "/lessons/us-taxes-follow-you-abroad/",
    "l-treaty-france": "/lessons/tax-treaties-the-france-example/",
    "l-expat-money": "/lessons/banks-brokers-and-pfics-abroad/",
    "l-expat-health": "/lessons/health-care-and-insurance-abroad/",
    "l-swr": "/lessons/4-percent-rule-and-its-limits/",
    "l-sequence": "/lessons/sequence-of-returns-risk/",
    "l-guardrails": "/lessons/flexible-spending-with-guardrails/",
    "l-fire-planner": "/lessons/your-full-fire-plan/",
    "l-fire-whatif": "/lessons/what-if-stress-test-the-plan/",
    "l-macro-intro": "/lessons/how-the-economy-moves-stocks/",
    "l-fed": "/lessons/how-the-federal-reserve-works/",
    "l-rates": "/lessons/rates-yields-and-the-yield-curve/",
    "l-inflation": "/lessons/inflation-cpi-pce-and-ppi/",
    "l-jobs": "/lessons/jobs-report-and-jobless-claims/",
    "l-pmi": "/lessons/pmi-gdp-and-retail-sales/",
    "l-data-day": "/lessons/trading-data-release-days/",
    "l-earnings-season": "/lessons/earnings-season-and-the-economy/",
    "l-cycle": "/lessons/business-cycle-sectors-and-recessions/",
    "l-key-dates": "/lessons/investors-calendar/",
    "l-oil": "/lessons/oil-prices-opec-and-the-economy/",
    "l-gold-silver": "/lessons/gold-and-silver/",
    "l-copper": "/lessons/copper-and-industrial-metals/",
    "l-geopolitics": "/lessons/tension-war-sanctions-and-tariffs/",
    "l-dollar": "/lessons/dollar-and-global-money/",
    "l-blockchain": "/lessons/how-a-blockchain-works/",
    "l-crypto-coins": "/lessons/bitcoin-ethereum-stablecoins-and-altcoins/",
    "l-crypto-custody": "/lessons/wallets-keys-exchanges-and-etfs/",
    "l-crypto-drivers": "/lessons/what-moves-crypto-prices/",
    "l-crypto-trading": "/lessons/how-to-trade-crypto/",
    "l-crypto-risks": "/lessons/risks-scams-and-taxes/",
    "l-rc-words": "/lessons/earnings-words-in-plain-english/",
    "l-rc-apple-income": "/lessons/apples-earnings-line-by-line/",
    "l-rc-apple-balance": "/lessons/apples-balance-sheet-line-by-line/",
    "l-rc-apple-cash": "/lessons/apples-cash-flow-where-the-money-went/",
    "l-rc-apple-call": "/lessons/listen-apples-earnings-call-explained/",
    "l-rc-spacex": "/lessons/spacex-from-a-loss-to-a-profit/",
    "l-rc-spacex-call": "/lessons/listen-spacexs-third-quarter-call/",
    "l-rc-price": "/lessons/how-earnings-move-the-stock-price/",
    "tool-size": "/tools/position-size/",
    "tool-options": "/tools/option-profit/",
    "tool-wheel": "/tools/wheel-income/",
    "tool-risk": "/tools/win-rate-and-r-simulator/",
    "tool-compound": "/tools/compound-interest/",
    "tool-expected": "/tools/expected-move/",
    "tool-tlh": "/tools/tax-loss-harvest/",
    "tool-drawdown": "/tools/drawdown-recovery/",
    "tool-value": "/tools/margin-of-safety/",
    "tool-ratios": "/tools/five-number-check/",
    "tool-style": "/tools/which-style-fits-you/",
    "tool-budget": "/tools/monthly-budget/",
    "tool-habits": "/tools/what-habits-really-cost/",
    "tool-cash": "/tools/where-to-park-cash/",
    "tool-payoff": "/tools/debt-payoff-plan/",
    "tool-transfer": "/tools/balance-transfer-planner/",
    "tool-car": "/tools/car-cash-or-loan/",
    "tool-fx": "/tools/foreign-fee-cost/",
    "tool-match": "/tools/401k-match/",
    "tool-limits": "/tools/401k-limit-stack/",
    "tool-rsu": "/tools/rsu-tax-gap/",
    "tool-espp": "/tools/espp-return/",
    "tool-roth": "/tools/roth-or-traditional/",
    "tool-backdoor": "/tools/backdoor-roth-check/",
    "tool-ss": "/tools/social-security-age/",
    "tool-retire": "/tools/retirement-planner/",
    "tool-brackets": "/tools/tax-brackets/",
    "tool-wheeltax": "/tools/how-the-wheel-is-taxed/",
    "tool-rentbuy": "/tools/rent-or-buy/",
    "tool-mortgage": "/tools/mortgage/",
    "tool-rental": "/tools/rental-property/",
    "tool-airbnb": "/tools/airbnb-real-profit/",
    "tool-fire": "/tools/fire-number/",
    "tool-years": "/tools/years-to-freedom/",
    "tool-cities": "/tools/cost-of-living-by-place/",
    "tool-firetax": "/tools/tax-on-your-withdrawals/",
    "tool-ladder": "/tools/early-access-planner/",
    "tool-aca": "/tools/health-subsidy-cliff/",
    "tool-france": "/tools/france-and-us-tax-estimate/",
    "tool-swr": "/tools/safe-withdrawal-rate/",
    "tool-fireplan": "/tools/full-fire-plan/",
    "tool-rates": "/tools/rates-and-stock-values/",
    "tool-inflation": "/tools/inflation-and-your-money/",
    "tool-dataday": "/tools/data-day-move/",
    "tool-metals": "/tools/gold-silver-and-copper/",
    "tool-liq": "/tools/crypto-leverage-and-liquidation/",
    "tool-call": "/tools/earnings-call-player/",
    "tool-statements": "/tools/real-statement-explorer/",
    "tool-earnings-price": "/tools/earnings-and-the-stock-price/",
    "tool-earnings": "/tools/earnings-lookup/",
    "post-pmh-retest": "/notes/pmh-retest/",
    "post-wheel-40": "/notes/wheel-40/",
    "post-first-five": "/notes/first-five/",
    "post-tax-loss-checklist": "/notes/tax-loss-checklist/",
    "post-premarket-routine": "/notes/premarket-routine/"
  };
  const PRIVATE = ["results", "dashboard", "profile", "settings", "signin", "offline"];
  // pages whose content is the same as another page's: they point search engines at that one (rel=canonical)
  const CANONICAL_OF = { learn: 'track-trading' };
  const PREFIX = [['l-', '/lessons/'], ['c-', '/courses/'], ['tool-', '/tools/'], ['track-', '/tracks/'], ['post-', '/notes/']];
  const HELPERS = ['post']; // SML.pages entries that draw a family of pages (post-*), not a page of their own

  function slugify(s) {
    s = String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/%/g, ' percent').replace(/[’']/g, '').replace(/½/g, '-half').replace(/\(k\)/g, 'k');
    s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^(the|a|an)-/, '');
    if (s.length > 60) s = s.slice(0, 60).replace(/-[^-]*$/, '');
    return s || 'page';
  }
  const find = (list, id) => (list || []).find((x) => x.id === id);
  function record(tok) { // the content item behind a token, or null
    if (tok.indexOf('l-') === 0) return find(SML.lessons, tok);
    if (tok.indexOf('c-') === 0) return find(SML.courses, tok.slice(2));
    if (tok.indexOf('tool-') === 0) return find(SML.tools, tok);
    if (tok.indexOf('track-') === 0) return find(SML.tracks, tok.slice(6));
    if (tok.indexOf('post-') === 0) return find(SML.posts, tok);
    return null;
  }
  const known = new Map();
  function exists(tok) {
    if (!tok || typeof tok !== 'string' || !/^[A-Za-z0-9._~-]+$/.test(tok)) return false;
    if (known.has(tok)) return known.get(tok);
    const prefixed = PREFIX.some(([p]) => tok.indexOf(p) === 0);
    const ok = prefixed ? !!record(tok) && !!(tok.indexOf('post-') !== 0 || SML.pages.post) : (!!SML.pages[tok] && HELPERS.indexOf(tok) < 0);
    known.set(tok, ok);
    return ok;
  }
  // every page token, in a stable order: named pages, tracks, courses, lessons, tools, notes
  function all() {
    const out = Object.keys(FROZEN).filter((t) => !PREFIX.some(([p]) => t.indexOf(p) === 0) && exists(t));
    Object.keys(SML.pages || {}).forEach((t) => { if (out.indexOf(t) < 0 && exists(t)) out.push(t); });
    (SML.tracks || []).forEach((t) => out.push('track-' + t.id));
    (SML.courses || []).forEach((c) => out.push('c-' + c.id));
    (SML.lessons || []).forEach((l) => out.push(l.id));
    (SML.tools || []).forEach((t) => out.push(t.id));
    (SML.posts || []).forEach((p) => out.push(p.id));
    return out.filter((t, i) => out.indexOf(t) === i && exists(t));
  }
  let byTok = null, byPath = null, auto = [];
  function index() {
    if (byTok) return;
    byTok = {}; byPath = {}; auto = [];
    Object.keys(FROZEN).forEach((t) => { byPath[FROZEN[t]] = t; });
    all().forEach((t) => {
      let p = FROZEN[t];
      if (!p) { // not frozen yet: an address from its title (or token), made unique
        const pre = PREFIX.find(([x]) => t.indexOf(x) === 0); const r = record(t);
        const base = pre ? pre[1] + slugify(r && r.title ? r.title : t.slice(pre[0].length)) : '/' + slugify(t);
        p = base + '/'; for (let i = 2; byPath[p] && byPath[p] !== t; i++) p = base + '-' + i + '/';
        auto.push(t);
      }
      byTok[t] = p; byPath[p] = t;
    });
  }
  function path(tok) { index(); return byTok[tok] || null; }
  function token(pathname) {
    index();
    let p = String(pathname || '/');
    try { p = decodeURI(p); } catch (e) {}
    p = p.replace(/\/index\.html?$/, '/').replace(/\/{2,}/g, '/');
    if (p.charAt(0) !== '/') p = '/' + p;
    if (p.slice(-1) !== '/') p += '/';
    p = p.toLowerCase();
    const t = byPath[p];
    return t && exists(t) ? t : null;
  }
  const mode = SML.host === 'web' && /^https?:$/.test(location.protocol) ? 'path' : 'hash';
  function href(tok) { return mode === 'path' && path(tok) ? path(tok) : '#' + tok; }
  // the page a link points at ('#l-wheel', '/lessons/wheel-strategy/', a full URL on this site), or null
  function fromHref(h) {
    if (!h) return null;
    if (h.charAt(0) === '#') { const t = h.slice(1); return exists(t) ? t : null; }
    try { const u = new URL(h, location.href); if (u.origin !== location.origin) return null; return token(u.pathname); } catch (e) { return null; }
  }
  const isPrivate = (tok) => PRIVATE.indexOf(tok) >= 0;
  const canonicalOf = (tok) => CANONICAL_OF[tok] || tok;
  SML.routes = { mode, path, token, href, exists, all, fromHref, isPrivate, canonicalOf, slugify, unfrozen: () => { index(); return auto.slice(); } };
})();
