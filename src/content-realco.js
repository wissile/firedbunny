/* Trading-track addition: "Read a Real Company" — Apple's and SpaceX's latest reported quarters (as of November 2026:
   Apple fiscal Q4 2026, the September quarter; SpaceX Q3 2026), line by line. This file holds the course entry, tool entries, glossary terms and the verified numbers (SML.realco).
   Every figure here was copied from the company's own release and checked by summing all subtotals.
   Loaded after content-macro.js. Research notes: research/realco.md. */
(function () {
  'use strict';
  const SML = window.SML;

  /* ---------- course: slot in right after Company Fundamentals (n 7) ---------- */
  SML.courses.forEach((c) => { if ((c.track || 'trading') === 'trading' && c.n >= 8) c.n += 1; });
  SML.courses.push({ track: 'trading', id: 'realco', n: 8, title: 'Read a Real Company', blurb: 'Apple’s and SpaceX’s real balance sheets, earnings and earnings calls, line by line, and how each number moves the stock.', level: 'Beginner' });

  /* ---------- tools ---------- */
  const T = (id, title, blurb, widget, cat, icon, lesson) => ({ track: 'trading', id, title, blurb, widget, cat, icon, lesson });
  SML.tools.push(
    T('tool-call', 'Earnings call player', 'Listen to Apple’s or SpaceX’s latest earnings call, retold in plain words, while each number lights up and gets explained.', 'callPlayer', 'Stocks', 'expected', 'l-rc-apple-call'),
    T('tool-statements', 'Real statement explorer', 'Tap any line of Apple’s or SpaceX’s income statement, balance sheet or cash flow to see what it means and why it matters.', 'statementExplorer', 'Stocks', 'tax', 'l-rc-apple-income'),
    T('tool-earnings-price', 'Earnings and the stock price', 'See how EPS, growth, guidance and the P/E multiple combine into a share price, with Apple’s real numbers.', 'earningsPrice', 'Stocks', 'value', 'l-rc-price'),
  );

  /* ---------- verified numbers ($ millions unless noted; shares in millions) ---------- */
  SML.realco = {
    asOf: 'November 3, 2026',
    apple: {
      // LATEST reported quarter (as of Nov 3, 2026): fiscal Q4 2026, three months ended Sep 26, 2026, reported Nov 2, 2026.
      // `pq` = fiscal Q3 2026 (the June quarter, the previous story: big beat, weak guide, stock −7.4%); `ya` = fiscal Q4 2025.
      // `fy` / `fyPrev` = full fiscal years 2026 and 2025 (from the same release). Tax: provision, + = expense.
      name: 'Apple', ticker: 'AAPL', fiscalNote: 'Apple’s fiscal year ends in late September, so the July–September quarter is its fiscal fourth quarter (Q4) and closes the fiscal year.',
      period: 'Fiscal Q4 2026', periodEnd: 'September 26, 2026', reported: 'November 2, 2026 (after the close)',
      labels: { cur: 'Sep 2026 qtr', ya: 'Sep 2025 qtr', pq: 'Jun 2026 qtr', ya2: 'Jun 2025 qtr', fy: 'Fiscal 2026', fyPrev: 'Fiscal 2025' },
      is: {
        // cur = three months ended Sep 26, 2026; ya = Sep 27, 2025; pq = Jun 27, 2026; ya2 = Jun 28, 2025; pq2 = Mar 28, 2026
        cur: { prodSales: 82904, servSales: 31573, revenue: 114477, prodCost: 52064, servCost: 7593, cost: 59657, gross: 54820, rd: 11730, sga: 7459, opex: 19189, opInc: 35631, other: 504, pretax: 36135, tax: 5424, netInc: 30711, epsBasic: 2.11, epsDil: 2.10, shBasic: 14570.195, shDil: 14630.318 },
        ya:  { prodSales: 73716, servSales: 28750, revenue: 102466, prodCost: 47019, servCost: 7106, cost: 54125, gross: 48341, rd: 8866, sga: 7048, opex: 15914, opInc: 32427, other: 377, pretax: 32804, tax: 5338, netInc: 27466, epsBasic: 1.85, epsDil: 1.85, shBasic: 14815.307, shDil: 14863.609 },
        pq:  { prodSales: 78678, servSales: 30739, revenue: 109417, prodCost: 47153, servCost: 7494, cost: 54647, gross: 54770, rd: 11729, sga: 7346, opex: 19075, opInc: 35695, other: 572, pretax: 36267, tax: 6478, netInc: 29789, epsBasic: 2.03, epsDil: 2.02, shBasic: 14656.110, shDil: 14714.676 },
        ya2: { prodSales: 66613, servSales: 27423, revenue: 94036, prodCost: 43620, servCost: 6698, cost: 50318, gross: 43718, rd: 8866, sga: 6650, opex: 15516, opInc: 28202, other: -171, pretax: 28031, tax: 4597, netInc: 23434, epsBasic: 1.57, epsDil: 1.57, shBasic: 14902.886, shDil: 14948.179 },
        pq2: { prodSales: 80208, servSales: 30976, revenue: 111184, prodCost: 49179, servCost: 7224, cost: 56403, gross: 54781, rd: 11419, sga: 7477, opex: 18896, opInc: 35885, other: -52, pretax: 35833, tax: 6255, netInc: 29578, epsBasic: 2.02, epsDil: 2.01, shDil: 14725.873 },
        fy:     { prodSales: 355533, servSales: 123301, revenue: 478834, prodCost: 215874, servCost: 29358, cost: 245232, gross: 233602, rd: 45765, sga: 29774, opex: 75539, opInc: 158063, other: 1174, pretax: 159237, tax: 27062, netInc: 132175, epsBasic: 9.01, epsDil: 8.98, shBasic: 14661.935, shDil: 14720.306 },
        fyPrev: { prodSales: 307003, servSales: 109158, revenue: 416161, prodCost: 194116, servCost: 26844, cost: 220960, gross: 195201, rd: 34550, sga: 27601, opex: 62151, opInc: 133050, other: -321, pretax: 132729, tax: 20719, netInc: 112010, epsBasic: 7.49, epsDil: 7.46, shBasic: 14948.500, shDil: 15004.697 },
      },
      // Apple's own words: tariff refunds helped both quarters; the help shrank from June to September.
      tariffRefund: { grossMarginPts: 1, eps: 0.05, pq: { grossMarginPts: 2, eps: 0.11 },
        note: 'Apple said tariff refunds added about 1 point to gross margin and $0.05 to EPS in the September quarter (about 2 points and $0.11 in June). Without them, gross margin was about 46.9% and EPS about $2.05. It is a temporary, non-recurring help, and Apple’s December-quarter guide no longer mentions it.' },
      categories: { // revenue by product
        cur: { iPhone: 57583, Mac: 10792, iPad: 6229, 'Wearables, Home & Accessories': 8300, Services: 31573 },
        ya:  { iPhone: 49025, Mac: 8726, iPad: 6952, 'Wearables, Home & Accessories': 9013, Services: 28750 },
        pq:  { iPhone: 54252, Mac: 10352, iPad: 6191, 'Wearables, Home & Accessories': 7883, Services: 30739 },
        ya2: { iPhone: 44582, Mac: 8046, iPad: 6581, 'Wearables, Home & Accessories': 7404, Services: 27423 },
        fy:  { iPhone: 254098, Mac: 37929, iPad: 27929, 'Wearables, Home & Accessories': 35577, Services: 123301 },
        fyPrev: { iPhone: 209586, Mac: 33708, iPad: 28023, 'Wearables, Home & Accessories': 35686, Services: 109158 },
      },
      regions: { // Apple's reportable segments
        cur: { Americas: 48680, Europe: 32008, 'Greater China': 17539, Japan: 6540, 'Rest of Asia Pacific': 9710 },
        ya:  { Americas: 44192, Europe: 28703, 'Greater China': 14493, Japan: 6636, 'Rest of Asia Pacific': 8442 },
        pq:  { Americas: 45781, Europe: 29395, 'Greater China': 18816, Japan: 6554, 'Rest of Asia Pacific': 8871 },
        ya2: { Americas: 41198, Europe: 24014, 'Greater China': 15369, Japan: 5782, 'Rest of Asia Pacific': 7673 },
        fy:  { Americas: 198083, Europe: 127604, 'Greater China': 82378, Japan: 30908, 'Rest of Asia Pacific': 39861 },
        fyPrev: { Americas: 178353, Europe: 111032, 'Greater China': 64377, Japan: 28703, 'Rest of Asia Pacific': 33696 },
      },
      trend: [ // revenue $M and diluted EPS by quarter (Q1 FY26 = six months minus Q2)
        { q: 'Jun 2025', fq: 'Q3 FY25', revenue: 94036, eps: 1.57 },
        { q: 'Sep 2025', fq: 'Q4 FY25', revenue: 102466, eps: 1.85 },
        { q: 'Dec 2025', fq: 'Q1 FY26', revenue: 143756, eps: 2.84 },
        { q: 'Mar 2026', fq: 'Q2 FY26', revenue: 111184, eps: 2.01 },
        { q: 'Jun 2026', fq: 'Q3 FY26', revenue: 109417, eps: 2.02 },
        { q: 'Sep 2026', fq: 'Q4 FY26', revenue: 114477, eps: 2.10 },
      ],
      ttmEps: 8.98, // = fiscal 2026 diluted EPS (the last four quarters are the fiscal year)
      ttmEpsPrev: 8.72, // trailing 12 months as of the June quarter
      bs: { // Sep 26, 2026 (fiscal year end) vs Sep 27, 2025; `mid` = Jun 27, 2026 (last quarter)
        labels: { cur: 'Sep 26, 2026', prev: 'Sep 27, 2025', mid: 'Jun 27, 2026' },
        assets: [
          { k: 'cash', name: 'Cash and cash equivalents', cur: 36305, prev: 35934, mid: 39544, current: true },
          { k: 'msCur', name: 'Marketable securities (current)', cur: 20417, prev: 18763, mid: 22855, current: true },
          { k: 'ar', name: 'Accounts receivable, net', cur: 43817, prev: 39777, mid: 31398, current: true },
          { k: 'vendor', name: 'Vendor non-trade receivables', cur: 39896, prev: 33180, mid: 27509, current: true },
          { k: 'inv', name: 'Inventories', cur: 14541, prev: 5718, mid: 11092, current: true },
          { k: 'oca', name: 'Other current assets', cur: 18881, prev: 14585, mid: 17420, current: true },
          { k: 'msNon', name: 'Marketable securities (non-current)', cur: 80213, prev: 77723, mid: 84118 },
          { k: 'ppe', name: 'Property, plant and equipment, net', cur: 52084, prev: 49834, mid: 51431 },
          { k: 'intang', name: 'Intangible assets, net', cur: 20278, prev: 11093, mid: 20342 },
          { k: 'onca', name: 'Other non-current assets', cur: 78116, prev: 72634, mid: 77557 },
        ],
        liabilities: [
          { k: 'ap', name: 'Accounts payable', cur: 82252, prev: 69860, mid: 64525, current: true },
          { k: 'ocl', name: 'Other current liabilities', cur: 66124, prev: 66387, mid: 62259, current: true },
          { k: 'defrev', name: 'Deferred revenue', cur: 9636, prev: 9055, mid: 9538, current: true },
          { k: 'cp', name: 'Commercial paper', cur: 1997, prev: 7979, mid: 1997, current: true },
          { k: 'debtCur', name: 'Term debt (due within a year)', cur: 9906, prev: 12350, mid: 11007, current: true },
          { k: 'debtNon', name: 'Term debt (long-term)', cur: 68208, prev: 78328, mid: 71340 },
          { k: 'oncl', name: 'Other non-current liabilities', cur: 54332, prev: 41549, mid: 55080 },
        ],
        equity: [
          { k: 'stock', name: 'Common stock and paid-in capital', cur: 104815, prev: 93568, mid: 100702 },
          { k: 're', name: 'Retained earnings / (accumulated deficit)', cur: 13700, prev: -14264, mid: 11326 },
          { k: 'aoci', name: 'Accumulated other comprehensive loss', cur: -6422, prev: -5571, mid: -4508 },
        ],
        // arrays are [Sep 26 2026, Sep 27 2025, Jun 27 2026]
        totals: { currentAssets: [173857, 147957, 149818], assets: [404548, 359241, 383266], currentLiab: [169915, 165631, 149326], liabilities: [292455, 285508, 275746], equity: [112093, 73733, 107520] },
        sharesOutstanding: { cur: 14532.259, prev: 14773.260 }, // millions, at each balance-sheet date
      },
      cf: { // full fiscal year: twelve months ended Sep 26, 2026 vs Sep 27, 2025 (`q` = the September quarter alone, our math: 12 months − 9 months)
        labels: { cur: 'Fiscal 2026 (12 months)', ya: 'Fiscal 2025 (12 months)', q: 'Sep 2026 qtr (derived)' },
        operating: [
          { k: 'ni', name: 'Net income', cur: 132175, ya: 112010, q: 30711 },
          { k: 'da', name: 'Depreciation and amortization', cur: 13423, ya: 11698, q: 3450 },
          { k: 'sbc', name: 'Share-based compensation', cur: 13789, ya: 12863, q: 3266 },
          { k: 'oth', name: 'Other adjustments', cur: 568, ya: -89, q: 2605 },
          { k: 'ar', name: 'Change in accounts receivable', cur: -3994, ya: -6682, q: -12310 },
          { k: 'vendor', name: 'Change in vendor receivables', cur: -6716, ya: -347, q: -12387 },
          { k: 'inv', name: 'Change in inventories', cur: -8905, ya: 1400, q: -3444 },
          { k: 'oa', name: 'Change in other assets', cur: -21117, ya: -9197, q: -4851 },
          { k: 'ap', name: 'Change in accounts payable', cur: 12171, ya: 902, q: 17374 },
          { k: 'ol', name: 'Change in other liabilities', cur: 13703, ya: -11076, q: 3687 },
        ],
        investing: [
          { k: 'buyMs', name: 'Bought marketable securities', cur: -54945, ya: -24407, q: -6193 },
          { k: 'matMs', name: 'Securities that matured', cur: 34815, ya: 40907, q: 8311 },
          { k: 'sellMs', name: 'Sold marketable securities', cur: 14280, ya: 12890, q: 2264 },
          { k: 'capex', name: 'Capex: property, plant and equipment', cur: -9041, ya: -12715, q: -2242 },
          { k: 'oth', name: 'Other investing', cur: -2389, ya: -1480, q: -609 },
        ],
        financing: [
          { k: 'taxes', name: 'Taxes paid on employee stock awards', cur: -6793, ya: -5960, q: -331 },
          { k: 'div', name: 'Dividends paid', cur: -15721, ya: -15421, q: -3943 },
          { k: 'buyback', name: 'Buybacks (repurchases of stock)', cur: -86390, ya: -90711, q: -24296 },
          { k: 'issue', name: 'New term debt issued', cur: 0, ya: 4481, q: 0 },
          { k: 'repay', name: 'Term debt repaid', cur: -12396, ya: -10932, q: -4250 },
          { k: 'cp', name: 'Commercial paper repaid, net', cur: -5911, ya: -2032, q: 0 },
          { k: 'oth', name: 'Other financing', cur: -235, ya: -111, q: -51 },
        ],
        // [fiscal 2026, fiscal 2025, Sep 2026 quarter]
        totals: { operating: [145097, 111482, 28101], investing: [-17280, 15195, 1531], financing: [-127446, -120686, -32871], change: [371, 5991, -3239], begin: [35934, 29943, 39544], end: [36305, 35934, 36305] },
        fcf: [136056, 98767, 25859], // operating cash flow − capex (our math)
      },
      cf9: { // nine months ended Jun 27, 2026 vs Jun 28, 2025 (kept to show how the September quarter is derived)
        labels: { cur: '9 months to Jun 2026', ya: '9 months to Jun 2025' },
        totals: { operating: [116996, 81754], investing: [-18811, 17782], financing: [-94575, -93210], change: [3610, 6326], begin: [35934, 29943], end: [39544, 36269] },
        capex: [-6799, -9473], buyback: [-62094, -70579], div: [-11778, -11559], da: [9973, 8571], sbc: [10523, 9680],
      },
      dividend: { perShare: 0.27, record: 'November 12, 2026', paid: 'November 16, 2026' },
      call: { // the September-quarter call, Nov 2, 2026 (John Ternus's first as CEO)
        date: 'November 2, 2026, 2:00 p.m. PT', speakers: ['Suhasini Chandramouli, head of investor relations', 'John Ternus, CEO (since September 1, 2026, after Tim Cook)', 'Kevan Parekh, CFO', 'Sabih Khan, COO (answered supply and memory questions)'],
        // December quarter (fiscal Q1 2027) outlook; baseRevenue = Dec 2025 quarter
        guidance: { revGrowth: [7, 10], servicesGrowth: [8, 9], grossMargin: [45, 46], opex: [20400, 20800], otherIncome: 300, taxRate: 17, baseRevenue: 143756, fxServicesPts: 0.5,
          note: 'Apple said the December quarter should be its best revenue quarter ever, even with supply limits (Mac and iPad, mainly memory).' },
        quarterReturn: { total: 28000, buybacks: 24000, dividends: 3900 },
        installedBase: '2.5 billion+ active devices', paidSubs: '1.5 billion+',
        netCashNeutral: 'Apple dropped its long-time goal of reaching “net cash neutral” (cash equal to debt), to keep more flexibility; it still plans to invest what it needs and return the excess.',
        purchaseObligationsUp: 33000, // manufacturing purchase obligations rose about $33B from June to September (to secure supply)
        notes: [
          'Memory chip prices kept climbing. John Ternus called today’s memory pricing “unprecedented”. Memory is the main reason the December gross margin guide (45–46%) is below September’s 47.9%; the cost of running Siri AI in Apple’s data centers adds a little.',
          'Apple raised Mac and iPad prices at the end of June and iPhone prices in September, and said it is too early to judge how buyers react.',
          'Supply was tight: iPhone, Mac and iPad were constrained in September; in December the limits are on Mac and iPad, mainly memory. The new foldable iPhone Duo is short of supply with no end date given.',
          'Services grew 9.8% despite about 1.5 points of currency headwind versus June; Apple also pointed to weaker mobile gaming and a US court ruling on App Store link-outs.',
          'Siri AI launched in beta in September. Running it in the cloud will be booked in Services cost of sales.',
          'Greater China grew 21% (28% for the year).',
        ],
        guideCheck: [ // what Apple guided in July for this quarter vs what it delivered
          { k: 'rev', name: 'Revenue growth', guide: '9–11%', actual: '11.7%', verdict: 'above' },
          { k: 'gm', name: 'Gross margin', guide: '47–48%', actual: '47.9%', verdict: 'top of range' },
          { k: 'opex', name: 'Operating expenses', guide: '$19.1–19.4B', actual: '$19.2B', verdict: 'in range' },
          { k: 'oth', name: 'Other income', guide: 'about $350M', actual: '$504M', verdict: 'above' },
          { k: 'tax', name: 'Tax rate', guide: 'about 16.5%', actual: '15.0%', verdict: 'lower' },
        ],
      },
      // analyst consensus, as reported: revenue/EPS (Investing.com), iPhone (LSEG via TradingView), Services/Mac/iPad (SiliconANGLE),
      // Greater China (Bloomberg via TradingView), December-quarter expectations (SiliconANGLE, TradingView, MacDailyNews)
      expectations: { revenue: 113380, eps: 1.99, iPhone: 56600, services: 31580, Mac: 9610, iPad: 6700, greaterChina: 18800,
        nextQtrGrowth: 11.4, nextQtrRevenue: 160100 /* our math: 143,756 × 1.114 */, nextQtrGrossMargin: 47, nextQtrServicesGrowth: 10.7 },
      // closePct / closeAfter are filled in after the Nov 3 close
      reaction: { prevClose: 344.63, closeBefore: 338.32, afterHoursPct: -2.8, afterHoursLowPct: -4, premarketPct: -4, closePct: null, closeAfter: null, day: 'November 3, 2026' },
      // the previous story (June quarter, reported July 30, 2026): kept as the contrast
      q3: {
        period: 'Fiscal Q3 2026', periodEnd: 'June 27, 2026', reported: 'July 30, 2026 (after the close)',
        expectations: { revenue: [108700, 109000], eps: [1.88, 1.89], services: 31220, nextQtrGrowth: 12, nextQtrRevenue: 115000 },
        reaction: { closeBefore: 333.43, afterHoursPct: -3, openPct: -8.6, low: 302, closePct: -7.4, closeAfter: 309, day: 'July 31, 2026' },
        guidance: { revGrowth: [9, 11], fxHeadwindPts: 2.5, grossMargin: [47, 48], tariffRefundPts: 1, opex: [19100, 19400], otherIncome: 350, taxRate: 16.5, baseRevenue: 102466 },
        quarterReturn: { total: 33000, buybacks: 25800, dividends: 4000 },
        notes: [
          'Tim Cook (CEO until August 31) called it Apple’s strongest June quarter ever.',
          'Memory chip prices rose sharply; Tim Cook compared the memory market to a "100-year flood".',
          'The beat included 11 cents of tariff refunds, and the September-quarter guide (9–11% growth) was below the roughly 12% hoped for.',
        ],
      },
      next: 'Apple usually reports its December quarter in late January; the date for the fiscal Q1 2027 report had not been announced as of November 3, 2026.',
      sources: [
        { t: 'Apple Newsroom: Apple reports fourth quarter results (November 2, 2026)', u: 'https://www.apple.com/newsroom/2026/11/apple-reports-fourth-quarter-results/' },
        { t: 'Apple: Q4 FY2026 condensed consolidated financial statements (PDF)', u: 'https://www.apple.com/newsroom/pdfs/fy2026q4/FY26_Q4_Consolidated_Financial_Statements.pdf' },
        { t: 'Apple 8-K, Exhibit 99.1: Q3 FY2026 results and statements (SEC)', u: 'https://www.sec.gov/Archives/edgar/data/0000320193/000032019326000018/a8-kex991q3202606272026.htm' },
        { t: 'Apple Newsroom: Apple reports third quarter results (July 30, 2026)', u: 'https://www.apple.com/newsroom/2026/07/apple-reports-third-quarter-results/' },
        { t: 'Apple 8-K, Exhibit 99.1: Q4 FY2025 results (SEC)', u: 'https://www.sec.gov/Archives/edgar/data/320193/000032019325000077/a8-kex991q4202509272025.htm' },
        { t: 'Investing.com: Earnings call transcript, Apple tops Q4 2026 estimates but shares fall after hours', u: 'https://investing.com/news/transcripts/earnings-call-transcript-apple-tops-q4-2026-estimates-but-shares-fall-after-hours-93CH-4993172' },
        { t: 'MacRumors: Apple reports 4Q 2026 results', u: 'https://www.macrumors.com/2026/11/02/apple-4q-2026-earnings/' },
        { t: 'SiliconANGLE: Apple’s stock drops as new CEO John Ternus delivers his first earnings call', u: 'https://siliconangle.com/2026/11/02/apples-stock-drops-as-new-ceo-john-ternus-delivers-his-first-earnings-call/' },
        { t: 'TradingView News: Apple stock slides 3% after Ternus’ first earnings beat, holiday margins disappoint', u: 'https://www.tradingview.com/news/tradingview:3eb79822e094b:0-aapl-apple-stock-slides-3-after-ternus-first-earnings-beat-holiday-margins-disappoint/' },
        { t: 'MacDailyNews: Despite posting record earnings, Apple stock swoons (November 3, 2026)', u: 'https://macdailynews.com/2026/11/03/despite-posting-record-earnings-apple-stock-swoons/' },
        { t: 'The Tech Portal: Apple stock falls nearly 4% as Ternus guides margin to 45–46% on rising memory costs', u: 'https://thetechportal.com/2026/11/03/apple-stock-falls-nearly-4-as-ternus-guides-down-q326-margin-to-45-46-on-rising-memory-costs/' },
        { t: 'Hargreaves Lansdown / Sharecast: Apple tops Q3 forecasts, but shares sink on weak Q4 guidance', u: 'https://www.hl.co.uk/shares/stock-market-news/company--news/apple-tops-q3-forecasts,-but-shares-sink-on-weak-q4-guidance' },
        { t: 'MacDailyNews: Analysts split on Apple after strong Q3 beat overshadowed by soft Q4 guidance', u: 'https://macdailynews.com/2026/07/31/analysts-split-on-apple-after-strong-q3-beat-overshadowed-by-soft-q4-guidance/' },
      ],
    },
    spacex: {
      // LATEST reported quarter (as of Oct 22, 2026): Q3 2026, three months ended Sep 30, 2026, reported Oct 20, 2026.
      // `pq` = Q2 2026 (its first report as a public company, a loss); `ya` = Q3 2025. Tax: provision, + = expense, − = benefit.
      name: 'SpaceX', ticker: 'SPCX', period: 'Q3 2026', periodEnd: 'September 30, 2026', reported: 'October 20, 2026 (after the close)',
      ipo: { priced: 135, open: 150, firstTrade: 'June 12, 2026', exchange: 'Nasdaq', netProceeds: 85675 },
      labels: { cur: 'Sep 2026 qtr', ya: 'Sep 2025 qtr', pq: 'Jun 2026 qtr' },
      is: {
        cur: { revenue: 14575, cost: 5478, gross: 9097, rd: 4596, sga: 1707, restructuring: 3, impairment: 0, opInc: 2791, intExp: -675, intInc: 873, other: 1025, pretax: 4014, tax: -390, netInc: 4404, epsBasic: 0.37, eps: 0.35, shBasic: 11942, sh: 12475 },
        ya:  { revenue: 5576, cost: 2705, gross: 2871, rd: 2291, sga: 575, restructuring: 278, impairment: 0, opInc: -273, intExp: -514, intInc: 155, other: 140, pretax: -492, tax: 562, netInc: -1054, epsBasic: -0.36, eps: -0.36, shBasic: 2941, sh: 2941 },
        pq:  { revenue: 7814, cost: 3495, gross: 4319, rd: 3548, sga: 912, restructuring: 2, impairment: 0, opInc: -143, intExp: -629, intInc: 340, other: -86, pretax: -518, tax: 23, netInc: -541, epsBasic: -0.09, eps: -0.09, shBasic: 5864, sh: 5864 },
        pq2: { revenue: 4694, opInc: -1943, netInc: -4276 }, // Q1 2026 (six months minus Q2)
        ya2: { revenue: 4071, cost: 2282, gross: 1789, rd: 1958, sga: 606, restructuring: 190, impairment: 5, opInc: -970, intExp: -411, intInc: 98, other: 413, pretax: -870, tax: 138, netInc: -1008, eps: -0.34, sh: 2929 }, // Q2 2025
        ytd: { label: '9 months to Sep 2026', revenue: 27083, opInc: 705, netInc: -413, netIncToHolders: -1084, eps: -0.15, sh: 7274, ya: { revenue: 13714, opInc: -1216, netInc: -2590, eps: -0.89 } },
      },
      belowTheLine: { // why Q3 net income ($4,404M) is bigger than operating income ($2,791M)
        netInterest: 198, other: 1025, otherRelatedParty: 561, unrealizedGain9m: 532, taxBenefit: 390,
        note: 'Other income of $1,025M (of which $561M from a related party, shown in the SEC release) plus $198M of net interest income and a $390M tax benefit added about $1.6B below the operating line. The nine-month cash flow statement shows a $532M unrealized gain on stakes in other companies (TIKR).',
      },
      segments: {
        cur: [
          { k: 'conn', name: 'Connectivity (Starlink)', revenue: 5248, opInc: 2367, ebitda: 3499, capex: 1543 },
          { k: 'ai', name: 'Super Intelligence (formerly AI: Grok, cloud compute, X, Cursor)', revenue: 7560, opInc: 431, ebitda: 4953, capex: 16444 },
          { k: 'space', name: 'Space (launch, Starship, Dragon)', revenue: 1767, opInc: -7, ebitda: 357, capex: 1606 },
        ],
        ya: [
          { k: 'conn', revenue: 3097, opInc: 1190, ebitda: 1923, capex: 1007 },
          { k: 'ai', revenue: 813, opInc: -1722, ebitda: -428, capex: 4760 },
          { k: 'space', revenue: 1666, opInc: 259, ebitda: 674, capex: 1113 },
        ],
        pq: [
          { k: 'conn', revenue: 4291, opInc: 1656, ebitda: 2597, capex: 1367 },
          { k: 'ai', revenue: 2561, opInc: -1257, ebitda: 1146, capex: 15828 },
          { k: 'space', revenue: 962, opInc: -542, ebitda: -205, capex: 1174 },
        ],
        notes: { cursorRevenue: 608, cursorClosed: 'August 14, 2026', cursorStockComp: 1217, siOpIncExCursorComp: 1600 },
      },
      ebitda: {
        cur: 8809, // Q3 2026
        pq: 3538, ya: 2169,
        bridge: [['Net income', 4404], ['Depreciation & amortization', 3644], ['Stock-based compensation', 1146], ['Acquisition-related stock compensation', 1217], ['Acquisition-related costs', 8], ['Restructuring', 3], ['Interest expense', 675], ['Interest income', -873], ['Other income', -1025], ['Income tax benefit', -390]],
        bridgePq: [['Net loss', -541], ['Depreciation & amortization', 2848], ['Stock-based compensation', 831], ['Restructuring', 2], ['Interest expense', 629], ['Interest income', -340], ['Other expense', 86], ['Income taxes', 23]],
      },
      capex: { cur: 19593, pq: 18369, pq2: 10107, ya: 6880, ytd: 48069, ytdYa: 13846, q4Guide: [35000, 40000] },
      cf9: { label: '9 months to Sep 2026', operating: [13097, 4120], investing: [-84611, -12997], financing: [99819, 9440], ppe: [-48069, -13846], ipoProceeds: 85675, change: [28262, 632], endCash: [53386, 12133] },
      cf6: { operating: [3466, 351], investing: [-34487, -6032], financing: [100291, 9199] }, // six months to Jun 2026 (Q2 report)
      bs: {
        labels: { cur: 'Sep 30, 2026', prev: 'Dec 31, 2025', mid: 'Jun 30, 2026' },
        assets: [
          { k: 'cash', name: 'Cash and cash equivalents', cur: 51294, prev: 24747, mid: 93522, current: true },
          { k: 'ms', name: 'Marketable securities', cur: 38561, prev: 0, mid: 6487, current: true },
          { k: 'ar', name: 'Accounts receivable, net', cur: 4772, prev: 1579, mid: 3596, current: true },
          { k: 'inv', name: 'Inventory', cur: 2891, prev: 2416, mid: 2718, current: true },
          { k: 'pre', name: 'Prepaid expenses and other current assets', cur: 3457, prev: 2210, mid: 1724, current: true },
          { k: 'ppe', name: 'Property, plant and equipment, net', cur: 89483, prev: 42602, mid: 65736 },
          { k: 'rou', name: 'Finance lease right-of-use assets', cur: 1040, prev: 1260, mid: 1118 },
          { k: 'intang', name: 'Intangible assets, net', cur: 6354, prev: 1548, mid: 1318 },
          { k: 'digital', name: 'Digital assets', cur: 1573, prev: 1637, mid: 1098 },
          { k: 'gw', name: 'Goodwill', cur: 48423, prev: 11809, mid: 11645 },
          { k: 'dta', name: 'Deferred tax assets', cur: 388, prev: 141, mid: 354 },
          { k: 'oa', name: 'Other assets', cur: 5809, prev: 2130, mid: 3454 },
        ],
        liabilities: [
          { k: 'ap', name: 'Accounts payable', cur: 13259, prev: 11792, mid: 8243, current: true },
          { k: 'defrevCur', name: 'Deferred revenue (current)', cur: 10784, prev: 6111, mid: 7977, current: true },
          { k: 'debtCur', name: 'Debt and finance leases (current)', cur: 2698, prev: 928, mid: 2525, current: true },
          { k: 'accr', name: 'Accrued expenses and other current liabilities', cur: 5997, prev: 2569, mid: 2377, current: true },
          { k: 'defrevNon', name: 'Deferred revenue (long-term)', cur: 6736, prev: 6005, mid: 6309 },
          { k: 'debtNon', name: 'Debt and finance leases (long-term)', cur: 36146, prev: 21968, mid: 36839 },
          { k: 'ol', name: 'Other liabilities', cur: 1657, prev: 1381, mid: 1276 },
        ],
        mezzanine: [{ k: 'pref', name: 'Redeemable convertible preferred stock', cur: 0, prev: 38752, mid: 0 }],
        equity: [
          { k: 'stock', name: 'Common stock (Class A, B, C)', cur: 13, prev: 4, mid: 13 },
          { k: 'apic', name: 'Additional paid-in capital', cur: 212539, prev: 37706, mid: 167344 },
          { k: 'deficit', name: 'Accumulated deficit', cur: -37448, prev: -37035, mid: -41852 },
          { k: 'aoci', name: 'Accumulated other comprehensive income', cur: 1664, prev: 1898, mid: 1719 },
        ],
        totals: { currentAssets: [100975, 30952, 108047], assets: [254045, 92079, 192770], currentLiab: [32738, 21400, 21122], liabilities: [77277, 50754, 65546], equity: [176768, 2573, 127224] },
        sharesOutstanding: { classA: [8240, 1952], classB: [5339, 644], classC: [0, 482], prefOutstanding: [0, 2046] }, // millions, Sep 30, 2026 vs Dec 31, 2025
      },
      metrics: { // [Q3 2026, Q2 2026, Q3 2025]
        subs: [13.6, 12.0, 7.2], arpu: [69, 66, 83], launches: [35, 38, 44], computeGW: [1.7, 1.4, 0.6], massToOrbit: [476, 485, 525],
        consumerRev: [3121, null, 1986], entGovRev: [2127, null, 1111], siSolutionsRev: [7022, null, 359], adRev: [538, null, 454],
        backlog: 63000, backlogNext12m: 42000, backlogDeferredRev: 17500, netAdds: 1.6, q2Backlog: 47500,
      },
      call: {
        date: 'October 20, 2026, 3:30 p.m. CT', speakers: ['Andrea Williams, investor relations', 'Elon Musk, CEO', 'Gwynne Shotwell, President and COO', 'Bret Johnsen, CFO'],
        outlook: [
          'Revenue of $33 billion to $37 billion in the first quarter of 2027 (analysts had about $22.2 billion, LSEG).',
          'Capex of $35 billion to $40 billion in the fourth quarter of 2026 (Q3 was $19.6 billion).',
          'Computing capacity of 2.5 to 3 GW by the end of 2026 (1.7 GW at the end of September).',
          'Fourth-quarter gross margin closer to the second quarter’s (CFO).',
          'Backlog of $63 billion, about $42 billion of it expected within a year.',
        ],
        qaThemes: ['Power for the new data centers', 'How the capex will be funded', 'A possible combination with Tesla (both companies formed special committees of independent directors; no terms agreed)'],
        cfoLine: 'We delivered another strong quarter in Q3.',
        guide: { q1_2027Revenue: [33000, 37000], q4Capex: [35000, 40000], computeGWYearEnd: [2.5, 3], consensusQ1_2027: 22200 },
      },
      expectations: { revenue: [12720, 12900], eps: [0.13, 0.16], q1_2027Revenue: 22200 },
      reaction: { closeBefore: 147.79, afterHoursPct: 4, nextDayPct: 7.8, closeAfter: 159.31, day: 'October 21, 2026' },
      q2: { // the first report as a public company (Aug 4, 2026): a beat, then a drop
        reported: 'August 4, 2026', expectations: { revenue: [6720, 6820], eps: [-0.29, -0.26], ebitda: 2000, capex: 13000 },
        reaction: { closeBefore: 125.33, dayBeforePct: 9.4, afterHoursPct: [-8, -6], nextDayPct: -13.6, nextDayClose: 108.27, lockup: 'August 6, 2026 (the first of several lockup releases)' },
        outlook: ['More than 2 GW of computing capacity by year end.', 'Aiming for a $100 billion annualized revenue run rate based on December revenue.', 'Capex in each of the next two quarters similar to the June quarter.'],
        bond: 25000, bridgeLoan: 20000,
      },
      sources: [
        { t: 'SpaceX: Third Quarter 2026 results release (SEC filing)', u: 'https://www.sec.gov/Archives/edgar/data/1181412/000162828026066482/spaceexplorationtechnologi.htm' },
        { t: 'SpaceX: Second Quarter 2026 Results (earnings release)', u: 'https://img3.gelonghui.com/pdf/1e010-c8f8f063-91cd-4a01-92b0-ee7c05c5b78f.pdf' },
        { t: 'TIKR: SpaceX Q3 earnings, AI now brings in half the revenue', u: 'https://www.tikr.com/blog/spacex-q3-earnings-ai-now-brings-in-half-the-revenue-starlink-still-earns-most-of-the-profit' },
        { t: 'Teslarati: SpaceX delivers blockbuster Q3 results', u: 'https://www.teslarati.com/spacex-spcx-delivers-blockbuster-q3-results-super-intelligence-booms/' },
        { t: 'Motley Fool: Stock market today, Oct. 21 (SPCX after Q3)', u: 'https://www.fool.com/coverage/stock-market-today/2026/10/21/stock-market-today-oct-21-space-exploration-technologies-surges-on-q3-earnings-beat/' },
        { t: 'Archyde: SpaceX Q3 2026 earnings call results', u: 'https://www.archyde.com/spacex-q3-2026-earnings-call-results/' },
        { t: 'Motley Fool: SpaceX (SPCX) Q3 2026 earnings call transcript', u: 'https://www.fool.com/earnings/call-transcripts/2026/10/20/spacex-spcx-q3-2026-earnings-call-transcript/' },
        { t: 'Crypto Briefing: SpaceX shares rise after first earnings call (Aug 4 close, capex estimate)', u: 'https://cryptobriefing.com/spacex-shares-rise-after-earnings-call/' },
        { t: 'XTB: SpaceX shares drop after earnings (Q2 estimates)', u: 'https://www.xtb.com/int/market-analysis/news-and-research/spacex-shares-drop-6-after-earnings-is-space-no-longer-enough-for-wall-street' },
        { t: 'Nasdaq: SpaceX Q2 earnings call highlights', u: 'https://www.nasdaq.com/articles/spacex-q2-earnings-call-highlights' },
        { t: 'Nasdaq / Zacks: SpaceX beats Q2 estimates, shares fall', u: 'https://www.nasdaq.com/articles/spacex-beats-q2-estimates-shares-fall-etfs-focus' },
        { t: 'StartupHub: SPCX falls after Q2 as AI spending and lockup expiry hit', u: 'https://www.startuphub.ai/ai-news/ipo-watch/2026/spcx-earnings-lockup-selloff-2026-08-05' },
      ],
    },
  };

  /* ---------- glossary ---------- */
  const G = (t, full, d, l) => ({ t, full, d, l });
  SML.glossary.push(
    G('Year over year', 'YoY', 'Compares a quarter with the same quarter a year earlier. It removes seasons: holiday quarters against holiday quarters.', 'l-rc-words'),
    G('Quarter over quarter', 'QoQ, sequential', 'Compares a quarter with the one right before it. Useful for fast growers, but seasons can make it misleading.', 'l-rc-words'),
    G('Top line', '', 'Revenue, the first line of the income statement. "Top-line growth" means sales growth.', 'l-rc-words'),
    G('Bottom line', '', 'Net income, the last line of the income statement: what is left after every cost and tax.', 'l-rc-words'),
    G('Fiscal year', '', 'A company’s own 12-month accounting year. Apple’s ends in late September, so its "Q1" is October to December and its "Q4" is July to September.', 'l-rc-words'),
    G('Cost of sales', 'COGS', 'What it cost to make or deliver what was sold: parts, factories, data centers, support.', 'l-rc-apple-income'),
    G('Gross profit', '', 'Revenue minus cost of sales. Apple’s income statement calls this line "gross margin" in dollars.', 'l-rc-apple-income'),
    G('Gross margin', '', 'Gross profit as a percent of revenue: how many cents of each sales dollar are left after making the product.', 'l-rc-apple-income'),
    G('Operating expenses', 'Opex', 'Costs of running the company that are not tied to each unit sold, mainly R&D and SG&A.', 'l-rc-apple-income'),
    G('Research and development', 'R&D', 'Spending on inventing and improving products: engineers, chips, software, AI.', 'l-rc-apple-income'),
    G('SG&A', 'Selling, general and administrative', 'Marketing, sales staff, stores, executives, legal and office costs.', 'l-rc-apple-income'),
    G('Operating income', '', 'Gross profit minus operating expenses: the profit from the core business before interest and taxes.', 'l-rc-apple-income'),
    G('Operating margin', '', 'Operating income as a percent of revenue. Apple kept about 31 cents of each sales dollar in its September 2026 quarter.', 'l-rc-apple-income'),
    G('Operating loss', '', 'When operating expenses are bigger than gross profit, so the core business loses money before interest and taxes.', 'l-rc-spacex'),
    G('Net income', '', 'Profit after every cost, interest and tax. Also called earnings or the bottom line.', 'l-rc-apple-income'),
    G('Net loss', '', 'A negative bottom line: the company spent more than it earned in the period.', 'l-rc-spacex'),
    G('Net margin', '', 'Net income as a percent of revenue.', 'l-rc-apple-income'),
    G('Diluted EPS', '', 'Earnings per share counting the extra shares that stock awards and options would add, when they would lower EPS. The EPS headlines quote.', 'l-rc-apple-income'),
    G('Share count', '', 'How many shares the profit is split between. Buybacks shrink it; new stock grows it.', 'l-rc-apple-cash'),
    G('Dilution', '', 'When a company issues more shares, so each existing share owns a smaller slice of the profits.', 'l-rc-spacex'),
    G('Buyback', 'Share repurchase', 'A company buying its own stock. Fewer shares means each remaining share gets a bigger slice.', 'l-rc-apple-cash'),
    G('Segment', '', 'A part of the business a company reports on its own, like Apple’s regions (Americas, Europe, Greater China…) or SpaceX’s Starlink. Apple also breaks sales down by product: iPhone, Mac, Services and more.', 'l-rc-spacex'),
    G('Beat', '', 'Results above what analysts expected on average.', 'l-rc-price'),
    G('Miss', '', 'Results below what analysts expected on average.', 'l-rc-price'),
    G('Whisper number', '', 'An unofficial estimate traders expect, often higher than the published consensus.', 'l-rc-price'),
    G('Earnings call', '', 'A live call after results where executives explain the quarter, give guidance and answer analysts’ questions.', 'l-rc-apple-call'),
    G('One-time item', 'Non-recurring item', 'A gain or cost outside normal business that will not last, like Apple’s 2026 tariff refunds (11 cents of EPS in June, 5 cents in September). Investors often look at results with and without it.', 'l-rc-apple-call'),
    G('GAAP', 'Generally accepted accounting principles', 'The official US accounting rules every public company must report under.', 'l-rc-spacex'),
    G('Non-GAAP', 'Adjusted', 'A company’s own version of profit that leaves some costs out. Useful, but always compare it with GAAP.', 'l-rc-spacex'),
    G('EBITDA', 'Earnings before interest, taxes, depreciation and amortization', 'Earnings with interest, taxes and the wear-and-tear cost of equipment added back. A rough view of cash earnings before investment, not a profit figure.', 'l-rc-spacex'),
    G('Adjusted EBITDA', '', 'EBITDA with more items removed, often stock pay and one-time costs. Popular with growth companies that show a GAAP loss.', 'l-rc-spacex'),
    G('Depreciation and amortization', 'D&A', 'Spreading the cost of equipment (depreciation) or intangibles (amortization) over the years they are used.', 'l-rc-apple-cash'),
    G('Stock-based compensation', 'SBC', 'Paying employees in shares. It costs no cash today but creates new shares later.', 'l-rc-apple-cash'),
    G('Operating cash flow', '', 'Cash the business itself brought in during the period, after paying suppliers, staff and taxes.', 'l-rc-apple-cash'),
    G('Capex', 'Capital expenditures', 'Money spent on long-lasting things: buildings, machines, satellites, data centers.', 'l-rc-apple-cash'),
    G('Cash burn', '', 'How fast a company uses cash when free cash flow is negative.', 'l-rc-spacex'),
    G('Assets', '', 'Everything a company owns or is owed that has value: cash, investments, inventory, buildings.', 'l-rc-apple-balance'),
    G('Current assets', '', 'Assets that turn into cash within a year: cash, short-term investments, receivables, inventory.', 'l-rc-apple-balance'),
    G('Liabilities', '', 'Everything a company owes: bills to suppliers, debt, taxes, customer prepayments.', 'l-rc-apple-balance'),
    G('Current liabilities', '', 'What is due within a year.', 'l-rc-apple-balance'),
    G('Shareholders’ equity', 'Book value', 'Assets minus liabilities: what would be left for shareholders on paper.', 'l-rc-apple-balance'),
    G('Retained earnings', '', 'All the profit a company has earned since it started, minus the dividends it paid (and, at companies like Apple that retire the shares, buybacks). Big buybacks can push it below zero.', 'l-rc-apple-balance'),
    G('Accumulated deficit', '', 'Negative retained earnings: total past losses (or payouts) are bigger than total past profits.', 'l-rc-spacex'),
    G('Working capital', '', 'Current assets minus current liabilities: the short-term cushion for paying the bills.', 'l-rc-apple-balance'),
    G('Current ratio', '', 'Current assets divided by current liabilities. Around 1 or above means the next year’s bills are covered.', 'l-rc-apple-balance'),
    G('Net cash', '', 'Cash and investments minus all debt. Positive means the company could pay off every loan today.', 'l-rc-apple-balance'),
    G('Marketable securities', '', 'Investments a company can sell quickly, mostly bonds. Apple keeps over $100 billion in them.', 'l-rc-apple-balance'),
    G('Accounts receivable', '', 'Money customers owe for things already delivered.', 'l-rc-apple-balance'),
    G('Inventory', '', 'Products and parts waiting to be sold.', 'l-rc-apple-balance'),
    G('Accounts payable', '', 'Bills the company owes its suppliers.', 'l-rc-apple-balance'),
    G('Deferred revenue', '', 'Cash customers paid in advance for something not yet delivered, like a subscription or a launch contract.', 'l-rc-apple-balance'),
    G('Commercial paper', '', 'Very short-term IOUs big companies sell to borrow cash for a few weeks or months.', 'l-rc-apple-balance'),
    G('Goodwill', '', 'When one company buys another, the extra it pays above the fair value of what it gets (assets minus debts). SpaceX’s jumped after it bought Cursor.', 'l-rc-spacex'),
    G('Price to book', 'P/B', 'Share price divided by book value (equity) per share.', 'l-rc-apple-balance'),
    G('Price to sales', 'P/S', 'Market value divided by a year of revenue. Used when a company has no profit yet.', 'l-rc-spacex'),
    G('Market cap', 'Market capitalization', 'Share price times the number of shares: what the market values the whole company at.', 'l-rc-price'),
    G('Trailing twelve months', 'TTM', 'The last four reported quarters added together.', 'l-rc-price'),
    G('Forward P/E', '', 'Price divided by the EPS analysts expect over the next 12 months.', 'l-rc-price'),
    G('Multiple', '', 'How many dollars investors pay per dollar of earnings or sales, like a P/E of 35. When it shrinks, the price falls even if profits hold.', 'l-rc-price'),
    G('Backlog', '', 'Signed orders not yet delivered or billed. A sign of future revenue.', 'l-rc-spacex'),
    G('ARPU', 'Average revenue per user', 'Revenue divided by customers, usually per month. Starlink’s consumer ARPU was $69 in the September 2026 quarter.', 'l-rc-spacex'),
    G('Run rate', '', 'A recent month or quarter of revenue scaled to a full year, like one month × 12.', 'l-rc-spacex'),
    G('Installed base', '', 'How many of a company’s devices are in active use. Apple’s passed 2.5 billion active devices in 2026 and feeds Services sales.', 'l-rc-apple-call'),
    G('IPO', 'Initial public offering', 'When a private company first sells shares to the public and lists on an exchange.', 'l-rc-spacex'),
    G('Lockup', '', 'A period after an IPO, often months, when insiders may not sell. Releases can come in steps; each one lets more shares hit the market.', 'l-rc-spacex'),
    G('10-Q', '', 'The quarterly report US companies file with the SEC. The 10-K is the yearly one; an 8-K covers news like results.', 'l-rc-words'),
  );
})();
