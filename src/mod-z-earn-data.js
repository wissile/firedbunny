/* Earnings lookup: data engine (main owns this file; UI is mod-z-earn-ui.js). Contract: SPEC-earnings.md.
   SML.earn.load(ticker) -> Promise<model>. Data: the company's SEC filings (XBRL company facts + filing index) and
   ~5 years of daily prices, fetched through the site's Worker (/api/...). Parsing happens here, in the browser.
   Money in USD millions, EPS in USD per share, shares in millions. */
(function () {
  'use strict';
  const SML = window.SML;
  const SAMPLE = {"ok":true,"sample":true,"ticker":"DEMO","name":"Demo Devices Inc. (SAMPLE DATA, NOT REAL)","cik":1234567,"sic":"Electronic Computers","fiscalYearEnd":"0930","exchange":"Nasdaq","latest":{"end":"2026-06-30","label":"Jun 2026","fq":"Q3","fy":2026,"form":"10-Q","filed":"2026-08-04","accn":"0001234567-26-000042","url":"https://www.sec.gov/","release":{"date":"2026-08-03","url":"https://www.sec.gov/"}},"quarters":[{"end":"2022-09-30","start":"2022-06-01","label":"Sep 2022","fq":"Q4","fy":2022,"derived":true,"revenue":20000,"cost":11600,"gross":8400,"rd":1600,"sga":1800,"opInc":5000,"netInc":4100,"epsDil":0.27,"epsBasic":0.27,"shDil":null,"ocf":4746,"capex":800,"fcf":3946,"buybacks":2460,"dividends":820,"sbc":400,"da":600,"release":"2022-10-31"},{"end":"2022-12-31","start":"2022-09-01","label":"Dec 2022","fq":"Q1","fy":2023,"derived":false,"revenue":23883,"cost":13518,"gross":10365,"rd":1911,"sga":2149,"opInc":6305,"netInc":5170,"epsDil":0.35,"epsBasic":0.35,"shDil":14960,"ocf":6049,"capex":955,"fcf":5094,"buybacks":3102,"dividends":1034,"sbc":478,"da":716,"release":"2023-02-04"},{"end":"2023-03-31","start":"2022-12-01","label":"Mar 2023","fq":"Q2","fy":2023,"derived":false,"revenue":19661,"cost":11246,"gross":8415,"rd":1573,"sga":1769,"opInc":5073,"netInc":4160,"epsDil":0.28,"epsBasic":0.28,"shDil":14920,"ocf":4533,"capex":786,"fcf":3747,"buybacks":2496,"dividends":832,"sbc":393,"da":590,"release":"2023-04-30"},{"end":"2023-06-30","start":"2023-03-01","label":"Jun 2023","fq":"Q3","fy":2023,"derived":false,"revenue":19270,"cost":10945,"gross":8325,"rd":1542,"sga":1734,"opInc":5049,"netInc":4140,"epsDil":0.28,"epsBasic":0.28,"shDil":14880,"ocf":5009,"capex":771,"fcf":4238,"buybacks":2484,"dividends":828,"sbc":385,"da":578,"release":"2023-07-30"},{"end":"2023-09-30","start":"2023-06-01","label":"Sep 2023","fq":"Q4","fy":2023,"derived":true,"revenue":20960,"cost":11821,"gross":9139,"rd":1677,"sga":1886,"opInc":5576,"netInc":4572,"epsDil":0.31,"epsBasic":0.31,"shDil":null,"ocf":5332,"capex":838,"fcf":4494,"buybacks":2743,"dividends":914,"sbc":419,"da":629,"release":"2023-11-03"},{"end":"2023-12-31","start":"2023-09-01","label":"Dec 2023","fq":"Q1","fy":2024,"derived":false,"revenue":25016,"cost":13759,"gross":11257,"rd":2001,"sga":2251,"opInc":7005,"netInc":5744,"epsDil":0.39,"epsBasic":0.39,"shDil":14800,"ocf":6365,"capex":1001,"fcf":5364,"buybacks":3446,"dividends":1149,"sbc":500,"da":750,"release":"2024-02-03"},{"end":"2024-03-31","start":"2023-12-01","label":"Mar 2024","fq":"Q2","fy":2024,"derived":false,"revenue":20582,"cost":11444,"gross":9138,"rd":1647,"sga":1852,"opInc":5639,"netInc":4624,"epsDil":0.31,"epsBasic":0.31,"shDil":14760,"ocf":5237,"capex":823,"fcf":4414,"buybacks":2774,"dividends":925,"sbc":412,"da":617,"release":"2024-04-30"},{"end":"2024-06-30","start":"2024-03-01","label":"Jun 2024","fq":"Q3","fy":2024,"derived":false,"revenue":20162,"cost":11129,"gross":9033,"rd":1613,"sga":1815,"opInc":5605,"netInc":4596,"epsDil":0.31,"epsBasic":0.31,"shDil":14720,"ocf":5073,"capex":806,"fcf":4267,"buybacks":2758,"dividends":919,"sbc":403,"da":605,"release":"2024-08-02"},{"end":"2024-09-30","start":"2024-06-01","label":"Sep 2024","fq":"Q4","fy":2024,"derived":true,"revenue":21920,"cost":12012,"gross":9908,"rd":1754,"sga":1973,"opInc":6181,"netInc":5068,"epsDil":0.35,"epsBasic":0.35,"shDil":null,"ocf":5956,"capex":877,"fcf":5079,"buybacks":3041,"dividends":1014,"sbc":438,"da":658,"release":"2024-10-30"},{"end":"2024-12-31","start":"2024-09-01","label":"Dec 2024","fq":"Q1","fy":2025,"derived":false,"revenue":26456,"cost":14128,"gross":12328,"rd":2116,"sga":2381,"opInc":7831,"netInc":6421,"epsDil":0.44,"epsBasic":0.44,"shDil":14640,"ocf":7330,"capex":1058,"fcf":6272,"buybacks":3853,"dividends":1284,"sbc":529,"da":794,"release":"2025-01-30"},{"end":"2025-03-31","start":"2024-12-01","label":"Mar 2025","fq":"Q2","fy":2025,"derived":false,"revenue":22003,"cost":11882,"gross":10121,"rd":1760,"sga":1980,"opInc":6381,"netInc":5232,"epsDil":0.36,"epsBasic":0.36,"shDil":14600,"ocf":6281,"capex":880,"fcf":5401,"buybacks":3139,"dividends":1046,"sbc":440,"da":660,"release":"2025-05-03"},{"end":"2025-06-30","start":"2025-03-01","label":"Jun 2025","fq":"Q3","fy":2025,"derived":false,"revenue":21781,"cost":11675,"gross":10106,"rd":1742,"sga":1960,"opInc":6404,"netInc":5251,"epsDil":0.36,"epsBasic":0.36,"shDil":14560,"ocf":5799,"capex":871,"fcf":4928,"buybacks":3151,"dividends":1050,"sbc":436,"da":653,"release":"2025-08-05"},{"end":"2025-09-30","start":"2025-06-01","label":"Sep 2025","fq":"Q4","fy":2025,"derived":true,"revenue":23920,"cost":12725,"gross":11195,"rd":1914,"sga":2153,"opInc":7128,"netInc":5845,"epsDil":0.4,"epsBasic":0.4,"shDil":null,"ocf":7001,"capex":957,"fcf":6044,"buybacks":3507,"dividends":1169,"sbc":478,"da":718,"release":"2025-10-30"},{"end":"2025-12-31","start":"2025-09-01","label":"Dec 2025","fq":"Q1","fy":2026,"derived":false,"revenue":28816,"cost":14927,"gross":13889,"rd":2305,"sga":2593,"opInc":8991,"netInc":7373,"epsDil":0.51,"epsBasic":0.51,"shDil":14480,"ocf":8407,"capex":1153,"fcf":7254,"buybacks":4424,"dividends":1475,"sbc":576,"da":864,"release":"2026-02-04"},{"end":"2026-03-31","start":"2025-12-01","label":"Mar 2026","fq":"Q2","fy":2026,"derived":false,"revenue":23923,"cost":12536,"gross":11387,"rd":1914,"sga":2153,"opInc":7320,"netInc":6002,"epsDil":0.42,"epsBasic":0.42,"shDil":14440,"ocf":7198,"capex":957,"fcf":6241,"buybacks":3601,"dividends":1200,"sbc":478,"da":718,"release":"2026-04-30"},{"end":"2026-06-30","start":"2026-03-01","label":"Jun 2026","fq":"Q3","fy":2026,"derived":false,"revenue":23641,"cost":12293,"gross":11348,"rd":1891,"sga":2128,"opInc":7329,"netInc":6010,"epsDil":0.42,"epsBasic":0.42,"shDil":14400,"ocf":7201,"capex":946,"fcf":6255,"buybacks":3606,"dividends":1202,"sbc":473,"da":709,"release":"2026-08-03"}],"balance":[{"end":"2022-09-30","cash":12266,"stInv":6133,"ltInv":12266,"debtCur":7200,"debtLong":52800,"debt":60000,"assets":200000,"liabilities":140000,"equity":60000,"assetsCur":70000,"liabCur":68000,"inventory":4000,"receivables":15000},{"end":"2022-12-31","cash":12650,"stInv":6325,"ltInv":12650,"debtCur":7104,"debtLong":52096,"debt":59200,"assets":201500,"liabilities":139600,"equity":61900,"assetsCur":70500,"liabCur":68200,"inventory":4080,"receivables":15150},{"end":"2023-03-31","cash":12817,"stInv":6409,"ltInv":12817,"debtCur":7008,"debtLong":51392,"debt":58400,"assets":203000,"liabilities":139200,"equity":63800,"assetsCur":71000,"liabCur":68400,"inventory":4160,"receivables":15300},{"end":"2023-06-30","cash":13188,"stInv":6594,"ltInv":13188,"debtCur":6912,"debtLong":50688,"debt":57600,"assets":204500,"liabilities":138800,"equity":65700,"assetsCur":71500,"liabCur":68600,"inventory":4240,"receivables":15450},{"end":"2023-09-30","cash":13522,"stInv":6761,"ltInv":13522,"debtCur":6816,"debtLong":49984,"debt":56800,"assets":206000,"liabilities":138400,"equity":67600,"assetsCur":72000,"liabCur":68800,"inventory":4320,"receivables":15600},{"end":"2023-12-31","cash":13830,"stInv":6915,"ltInv":13830,"debtCur":6720,"debtLong":49280,"debt":56000,"assets":207500,"liabilities":138000,"equity":69500,"assetsCur":72500,"liabCur":69000,"inventory":4400,"receivables":15750},{"end":"2024-03-31","cash":14116,"stInv":7058,"ltInv":14116,"debtCur":6624,"debtLong":48576,"debt":55200,"assets":209000,"liabilities":137600,"equity":71400,"assetsCur":73000,"liabCur":69200,"inventory":4480,"receivables":15900},{"end":"2024-06-30","cash":14352,"stInv":7176,"ltInv":14352,"debtCur":6528,"debtLong":47872,"debt":54400,"assets":210500,"liabilities":137200,"equity":73300,"assetsCur":73500,"liabCur":69400,"inventory":4560,"receivables":16050},{"end":"2024-09-30","cash":14762,"stInv":7381,"ltInv":14762,"debtCur":6432,"debtLong":47168,"debt":53600,"assets":212000,"liabilities":136800,"equity":75200,"assetsCur":74000,"liabCur":69600,"inventory":4640,"receivables":16200},{"end":"2024-12-31","cash":15216,"stInv":7608,"ltInv":15216,"debtCur":6336,"debtLong":46464,"debt":52800,"assets":213500,"liabilities":136400,"equity":77100,"assetsCur":74500,"liabCur":69800,"inventory":4720,"receivables":16350},{"end":"2025-03-31","cash":15702,"stInv":7851,"ltInv":15702,"debtCur":6240,"debtLong":45760,"debt":52000,"assets":215000,"liabilities":136000,"equity":79000,"assetsCur":75000,"liabCur":70000,"inventory":4800,"receivables":16500},{"end":"2025-06-30","cash":15993,"stInv":7996,"ltInv":15993,"debtCur":6144,"debtLong":45056,"debt":51200,"assets":216500,"liabilities":135600,"equity":80900,"assetsCur":75500,"liabCur":70200,"inventory":4880,"receivables":16650},{"end":"2025-09-30","cash":16540,"stInv":8270,"ltInv":16540,"debtCur":6048,"debtLong":44352,"debt":50400,"assets":218000,"liabilities":135200,"equity":82800,"assetsCur":76000,"liabCur":70400,"inventory":4960,"receivables":16800},{"end":"2025-12-31","cash":17082,"stInv":8541,"ltInv":17082,"debtCur":5952,"debtLong":43648,"debt":49600,"assets":219500,"liabilities":134800,"equity":84700,"assetsCur":76500,"liabCur":70600,"inventory":5040,"receivables":16950},{"end":"2026-03-31","cash":17658,"stInv":8829,"ltInv":17658,"debtCur":5856,"debtLong":42944,"debt":48800,"assets":221000,"liabilities":134400,"equity":86600,"assetsCur":77000,"liabCur":70800,"inventory":5120,"receivables":17100},{"end":"2026-06-30","cash":18237,"stInv":9118,"ltInv":18237,"debtCur":5760,"debtLong":42240,"debt":48000,"assets":222500,"liabilities":134000,"equity":88500,"assetsCur":77500,"liabCur":71000,"inventory":5200,"receivables":17250}],"annual":[{"fy":2016,"end":"2016-09-30","revenue":52000,"netInc":10920,"epsDil":0.64,"ocf":13104,"capex":2340,"fcf":10764,"shDil":17000},{"fy":2017,"end":"2017-09-30","revenue":55640,"netInc":11684,"epsDil":0.7,"ocf":14021,"capex":2504,"fcf":11517,"shDil":16780},{"fy":2018,"end":"2018-09-30","revenue":59535,"netInc":12502,"epsDil":0.75,"ocf":15002,"capex":2679,"fcf":12323,"shDil":16560},{"fy":2019,"end":"2019-09-30","revenue":63702,"netInc":13377,"epsDil":0.82,"ocf":16052,"capex":2867,"fcf":13185,"shDil":16340},{"fy":2020,"end":"2020-09-30","revenue":68161,"netInc":14314,"epsDil":0.89,"ocf":17177,"capex":3067,"fcf":14110,"shDil":16120},{"fy":2021,"end":"2021-09-30","revenue":72933,"netInc":15316,"epsDil":0.96,"ocf":18379,"capex":3282,"fcf":15097,"shDil":15900},{"fy":2022,"end":"2022-09-30","revenue":78038,"netInc":16388,"epsDil":1.05,"ocf":19666,"capex":3512,"fcf":16154,"shDil":15680},{"fy":2023,"end":"2023-09-30","revenue":83501,"netInc":17535,"epsDil":1.13,"ocf":21042,"capex":3758,"fcf":17284,"shDil":15460},{"fy":2024,"end":"2024-09-30","revenue":89346,"netInc":18763,"epsDil":1.23,"ocf":22516,"capex":4021,"fcf":18495,"shDil":15240},{"fy":2025,"end":"2025-09-30","revenue":95600,"netInc":20076,"epsDil":1.34,"ocf":24091,"capex":4302,"fcf":19789,"shDil":15020}],"sharesOut":{"value":14350000000,"date":"2026-07-25"},"price":{"source":"sample","currency":"USD","last":97.89,"lastDate":"2026-10-23","series":[["2021-10-29",95.58],["2021-11-12",97.18],["2021-11-26",100.15],["2021-12-10",106.35],["2021-12-24",107.4],["2022-01-07",114.87],["2022-01-21",117.71],["2022-02-04",113.29],["2022-02-18",107.51],["2022-03-04",97.52],["2022-03-18",96.79],["2022-04-01",96.57],["2022-04-15",92.71],["2022-04-29",96.37],["2022-05-13",93.04],["2022-05-27",86.14],["2022-06-10",76.91],["2022-06-24",74.61],["2022-07-08",77.9],["2022-07-22",78.75],["2022-08-05",83.45],["2022-08-19",81.7],["2022-09-02",77.99],["2022-09-16",76.34],["2022-09-30",74.79],["2022-10-14",70.33],["2022-10-28",70.31],["2022-11-11",64.72],["2022-11-25",67.58],["2022-12-09",65.97],["2022-12-23",64.46],["2023-01-06",64.78],["2023-01-20",62.6],["2023-02-03",67.71],["2023-02-17",66.17],["2023-03-03",67.59],["2023-03-17",67.64],["2023-03-31",72.34],["2023-04-14",71.72],["2023-04-28",71.26],["2023-05-12",74.54],["2023-05-26",62.5],["2023-06-09",62.32],["2023-06-23",63.05],["2023-07-07",63.81],["2023-07-21",65.31],["2023-08-04",69.19],["2023-08-18",68.57],["2023-09-01",76.41],["2023-09-15",72.53],["2023-09-29",71.69],["2023-10-13",66.73],["2023-10-27",68.48],["2023-11-10",64.74],["2023-11-24",66.73],["2023-12-08",71.82],["2023-12-22",71.51],["2024-01-05",69.19],["2024-01-19",74.45],["2024-02-02",74.75],["2024-02-16",72.66],["2024-03-01",70.25],["2024-03-15",67.75],["2024-03-29",65.45],["2024-04-12",63.49],["2024-04-26",59.19],["2024-05-10",60.28],["2024-05-24",58.57],["2024-06-07",58.42],["2024-06-21",60.11],["2024-07-05",62.41],["2024-07-19",59.34],["2024-08-02",57.86],["2024-08-16",59.97],["2024-08-30",59.76],["2024-09-13",61.81],["2024-09-27",60.5],["2024-10-11",63.63],["2024-10-25",62.85],["2024-11-08",60.72],["2024-11-22",65.38],["2024-12-06",64.39],["2024-12-20",64.48],["2025-01-03",66.05],["2025-01-17",63.32],["2025-01-31",66.36],["2025-02-14",64.55],["2025-02-28",64.31],["2025-03-14",66.47],["2025-03-28",63.95],["2025-04-11",64.24],["2025-04-25",66.81],["2025-05-09",72.07],["2025-05-23",78.01],["2025-06-06",68.18],["2025-06-20",72.36],["2025-07-04",71.92],["2025-07-18",66.55],["2025-08-01",64.23],["2025-08-15",66.66],["2025-08-29",66.34],["2025-09-12",66.03],["2025-09-26",68.62],["2025-10-10",71.38],["2025-10-24",72.0],["2025-11-07",74.55],["2025-11-21",76.34],["2025-12-05",77.08],["2025-12-19",70.07],["2026-01-02",71.72],["2026-01-16",70.69],["2026-01-30",71.73],["2026-02-13",71.81],["2026-02-27",69.28],["2026-03-13",70.73],["2026-03-27",78.96],["2026-04-10",77.37],["2026-04-24",74.11],["2026-05-08",72.89],["2026-05-22",73.58],["2026-06-05",74.55],["2026-06-19",76.33],["2026-07-03",77.89],["2026-07-17",79.51],["2026-07-31",86.03],["2026-08-14",88.57],["2026-08-28",89.87],["2026-09-11",90.23],["2026-09-25",91.83],["2026-10-09",91.87],["2026-10-23",97.89]],"reactions":[{"end":"2024-09-30","release":"2024-10-30","before":null,"after":null,"pct":-4.6},{"end":"2024-12-31","release":"2025-01-30","before":null,"after":null,"pct":-5.1},{"end":"2025-03-31","release":"2025-05-03","before":null,"after":null,"pct":-0.7},{"end":"2025-06-30","release":"2025-08-05","before":null,"after":null,"pct":7.7},{"end":"2025-09-30","release":"2025-10-30","before":null,"after":null,"pct":-2.3},{"end":"2025-12-31","release":"2026-02-04","before":null,"after":null,"pct":9.0},{"end":"2026-03-31","release":"2026-04-30","before":null,"after":null,"pct":-7.9},{"end":"2026-06-30","release":"2026-08-03","before":null,"after":null,"pct":0.1}]},"derived":{"ttm":{"revenue":100300,"netInc":25230,"eps":1.75,"ocf":29807,"fcf":25794},"ttmPrev":{"revenue":92160,"netInc":21972,"eps":1.51,"ocf":25366,"fcf":21680},"marketCap":1404722,"pe":55.9,"ps":14.0,"fcfYield":1.84,"netCash":-2408},"notes":["Q4 figures are derived: full-year 10-K minus the first nine months.","Figures are GAAP, as filed with the SEC. Amounts in $ millions except per-share."],"units":{"money":"USD millions","eps":"USD per share","shares":"millions"}};
  const API = '/api';
  const err = (code, message) => Object.assign(new Error(message), { code });
  const MSG = {
    bad_ticker: 'Type a stock ticker, like AAPL or MSFT.',
    not_found: 'No US-listed company files with the SEC under that ticker. Check the spelling, or try the company name.',
    no_quarterly: 'This company does not file quarterly US (GAAP) reports with the SEC, so there is nothing to chart here. Many foreign companies file yearly reports under international rules instead.',
    unavailable: 'Live lookups run on the FiredBunny website.',
    sec_error: 'The SEC or the price service did not answer. Try again in a minute.',
  };
  const fail = (code) => err(code, MSG[code]);

  /* ---------- tiny helpers ---------- */
  const DAY = 864e5;
  const toD = (s) => new Date(s + 'T00:00:00Z');
  const iso = (d) => d.toISOString().slice(0, 10);
  const days = (a, b) => Math.round((toD(b) - toD(a)) / DAY) + 1; // inclusive duration
  const addDays = (s, n) => iso(new Date(toD(s).getTime() + n * DAY));
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Quarter ends of 52/53-week years drift a few days past month end: label by the date a week earlier.
  const anchor = (end) => new Date(toD(end).getTime() - 7 * DAY);
  const calLabel = (end) => { const a = anchor(end); return MON[a.getUTCMonth()] + ' ' + a.getUTCFullYear(); };
  function fiscal(end, fyEnd) {
    const a = anchor(end); const m = a.getUTCMonth() + 1, y = a.getUTCFullYear();
    let m0 = 12;
    if (/^\d{4}$/.test(fyEnd || '')) { const f = new Date(Date.UTC(2001, +fyEnd.slice(0, 2) - 1, +fyEnd.slice(2)) - 7 * DAY); m0 = f.getUTCMonth() + 1; }
    const q = Math.floor(((m - m0 - 1 + 24) % 12) / 3) + 1;
    return { fq: 'Q' + q, fy: m0 === 12 ? y : (m > m0 ? y + 1 : y) };
  }
  const r1 = (v) => (v == null || !isFinite(v) ? null : Math.round(v * 10) / 10);
  const r2 = (v) => (v == null || !isFinite(v) ? null : Math.round(v * 100) / 100);
  const sub = (a, b) => (a == null || b == null ? null : a - b);

  /* ---------- XBRL facts -> periods ---------- */
  const FORMS = /^(10-Q|10-K|10-KT|10-QT)(\/A)?$/;
  function factsOf(facts, tags, unit) {
    const tx = facts && facts.facts && facts.facts['us-gaap']; if (!tx) return [];
    const out = [];
    tags.forEach((tag, pri) => {
      const c = tx[tag]; if (!c || !c.units) return;
      const arr = c.units[unit] || (unit === 'USD/shares' ? c.units['USD/share'] : null); if (!arr) return;
      arr.forEach((f) => { if (f && f.val != null && f.end && FORMS.test(f.form || '')) out.push({ tag, pri, start: f.start || null, end: f.end, val: +f.val, filed: f.filed || '', fy: f.fy, fp: f.fp, form: f.form, accn: f.accn }); });
    });
    return out;
  }
  // Keep one value per (tag, start, end): the most recently filed (picks up restatements).
  function dedupe(list) {
    const m = new Map();
    list.forEach((f) => { const k = f.tag + '|' + (f.start || '') + '|' + f.end; const o = m.get(k); if (!o || f.filed > o.filed) m.set(k, f); });
    return Array.from(m.values());
  }
  /* Duration facts -> { quarters: Map(end -> {val, start, derived, pri}), annual: Map(end -> {...}) }.
     Direct 3-month values win; otherwise a quarter is the difference of two year-to-date values with the same start
     (10-Qs report cash flow year-to-date; the 10-K has no Q4 column, so Q4 = full year minus nine months).
     additive=false (EPS, share counts): only direct values, plus Q4 = year minus nine months for EPS (approximate). */
  function periods(list, opts) {
    const o = opts || {}; const add = o.additive !== false;
    const facts = dedupe(list).filter((f) => f.start);
    const byTag = new Map(); facts.forEach((f) => { (byTag.get(f.tag) || byTag.set(f.tag, []).get(f.tag)).push(f); });
    const quarters = new Map(), annual = new Map();
    const put = (map, end, rec) => { const cur = map.get(end); if (!cur || rec.pri < cur.pri || (rec.pri === cur.pri && cur.derived && !rec.derived)) map.set(end, rec); };
    byTag.forEach((arr) => {
      arr.forEach((f) => {
        const d = days(f.start, f.end);
        if (d >= 80 && d <= 100) put(quarters, f.end, { val: f.val, start: f.start, derived: false, pri: f.pri });
        else if (d >= 350 && d <= 380) put(annual, f.end, { val: f.val, start: f.start, derived: false, pri: f.pri });
      });
      if (!add && !o.epsQ4) return;
      const groups = new Map(); arr.forEach((f) => { (groups.get(f.start) || groups.set(f.start, []).get(f.start)).push(f); });
      groups.forEach((g) => {
        g.sort((a, b) => (a.end < b.end ? -1 : 1));
        for (let i = 1; i < g.length; i++) {
          const prev = g[i - 1], cur = g[i];
          const step = days(prev.end, cur.end) - 1, dCur = days(cur.start, cur.end);
          if (step < 80 || step > 100) continue;
          if (!add && !(dCur >= 350 && dCur <= 380)) continue; // EPS: only Q4 from year minus nine months
          put(quarters, cur.end, { val: cur.val - prev.val, start: addDays(prev.end, 1), derived: true, pri: cur.pri, approx: !add });
        }
      });
    });
    return { quarters, annual };
  }
  function instants(list) {
    const m = new Map();
    dedupe(list).filter((f) => !f.start).forEach((f) => { const cur = m.get(f.end); if (!cur || f.pri < cur.pri || (f.pri === cur.pri && f.filed > cur.filed)) m.set(f.end, f); });
    return m;
  }
  const near = (m, end) => { if (!m) return null; if (m.has(end)) return m.get(end).val; for (let k = 1; k <= 4; k++) { for (const e of [addDays(end, -k), addDays(end, k)]) if (m.has(e)) return m.get(e).val; } return null; };

  const T = {
    revenue: ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueGoodsNet', 'SalesRevenueServicesNet', 'RevenuesNetOfInterestExpense', 'InterestAndDividendIncomeOperating'],
    cost: ['CostOfGoodsAndServicesSold', 'CostOfRevenue', 'CostOfGoodsSold', 'CostOfServices'],
    gross: ['GrossProfit'],
    rd: ['ResearchAndDevelopmentExpense', 'ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost'],
    sga: ['SellingGeneralAndAdministrativeExpense', 'GeneralAndAdministrativeExpense'],
    opInc: ['OperatingIncomeLoss'],
    netInc: ['NetIncomeLoss', 'NetIncomeLossAvailableToCommonStockholdersBasic', 'ProfitLoss'],
    epsDil: ['EarningsPerShareDiluted', 'EarningsPerShareBasicAndDiluted'],
    epsBasic: ['EarningsPerShareBasic', 'EarningsPerShareBasicAndDiluted'],
    shDil: ['WeightedAverageNumberOfDilutedSharesOutstanding', 'WeightedAverageNumberOfShareOutstandingBasicAndDiluted'],
    ocf: ['NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'],
    capex: ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets', 'PaymentsForCapitalImprovements', 'PaymentsToAcquireOtherPropertyPlantAndEquipment'],
    buybacks: ['PaymentsForRepurchaseOfCommonStock'],
    dividends: ['PaymentsOfDividends', 'PaymentsOfDividendsCommonStock'],
    sbc: ['ShareBasedCompensation', 'AllocatedShareBasedCompensationExpense'],
    da: ['DepreciationDepletionAndAmortization', 'DepreciationAndAmortization', 'DepreciationAmortizationAndAccretionNet', 'Depreciation'],
  };
  const B = {
    cash: ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents', 'Cash'],
    stInv: ['MarketableSecuritiesCurrent', 'ShortTermInvestments', 'AvailableForSaleSecuritiesDebtSecuritiesCurrent'],
    ltInv: ['MarketableSecuritiesNoncurrent', 'AvailableForSaleSecuritiesDebtSecuritiesNoncurrent', 'LongTermInvestments'],
    debtCurAll: ['DebtCurrent'],
    ltdCur: ['LongTermDebtCurrent', 'LongTermDebtAndCapitalLeaseObligationsCurrent'],
    shortB: ['CommercialPaper', 'ShortTermBorrowings'],
    ltdNon: ['LongTermDebtNoncurrent', 'LongTermDebtAndCapitalLeaseObligations'],
    ltdTotal: ['LongTermDebt'],
    assets: ['Assets'], liabilities: ['Liabilities'], liabEq: ['LiabilitiesAndStockholdersEquity'],
    equity: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
    assetsCur: ['AssetsCurrent'], liabCur: ['LiabilitiesCurrent'],
    inventory: ['InventoryNet'], receivables: ['AccountsReceivableNetCurrent', 'ReceivablesNetCurrent'],
  };
  const money = (v) => (v == null ? null : r1(v / 1e6));

  /* ---------- build the model ---------- */
  function build(facts, subs, priceRaw, tickerIn) {
    const tx = facts && facts.facts;
    if (!tx || !tx['us-gaap']) throw fail('no_quarterly');
    const fyEnd = (subs && subs.fiscalYearEnd) || null;
    const P = {}; const U = { epsDil: 'USD/shares', epsBasic: 'USD/shares', shDil: 'shares' };
    Object.keys(T).forEach((k) => { P[k] = periods(factsOf(facts, T[k], U[k] || 'USD'), { additive: !(k in U), epsQ4: k === 'epsDil' || k === 'epsBasic' }); });
    const ends = new Set(); [P.revenue.quarters, P.netInc.quarters].forEach((m) => m.forEach((v, e) => ends.add(e)));
    const sorted = Array.from(ends).sort();
    // keep a contiguous recent run of up to 16 quarters (stop at gaps longer than ~4 months)
    const run = []; for (let i = sorted.length - 1; i >= 0 && run.length < 16; i--) { if (run.length && days(sorted[i], run[0]) > 125) break; run.unshift(sorted[i]); }
    if (run.length < 2) throw fail('no_quarterly');

    const releases = releaseDates(subs);
    const quarters = run.map((end) => {
      const g = (k) => { const v = P[k].quarters.get(end); return v ? v.val : null; };
      const base = P.revenue.quarters.get(end) || P.netInc.quarters.get(end);
      const f = fiscal(end, fyEnd);
      const q = { end, start: base ? base.start : null, label: calLabel(end), fq: f.fq, fy: f.fy, derived: !!(base && base.derived) };
      ['revenue', 'cost', 'gross', 'rd', 'sga', 'opInc', 'netInc', 'ocf', 'capex', 'buybacks', 'dividends', 'sbc', 'da'].forEach((k) => { q[k] = money(g(k)); });
      if (q.gross == null && q.revenue != null && q.cost != null) q.gross = r1(q.revenue - q.cost);
      q.epsDil = r2(g('epsDil')); q.epsBasic = r2(g('epsBasic'));
      if (q.epsDil == null && q.epsBasic != null) q.epsDil = q.epsBasic;
      q.shDil = g('shDil') != null ? r1(g('shDil') / 1e6) : (q.netInc != null && q.epsDil ? r1(q.netInc / q.epsDil) : null);
      q.fcf = q.ocf != null && q.capex != null ? r1(q.ocf - q.capex) : null;
      q.release = releases.find((d) => d > end && days(end, d) <= 80) || null;
      return q;
    });

    // balance sheet
    const I = {}; Object.keys(B).forEach((k) => { I[k] = instants(factsOf(facts, B[k], 'USD')); });
    const balance = run.map((end) => {
      const v = (k) => money(near(I[k], end));
      const b = { end, cash: v('cash'), stInv: v('stInv'), ltInv: v('ltInv'), assets: v('assets'), equity: v('equity'), assetsCur: v('assetsCur'), liabCur: v('liabCur'), inventory: v('inventory'), receivables: v('receivables') };
      const dc = v('debtCurAll'); const ltc = v('ltdCur'); const sb = v('shortB'); const ltn = v('ltdNon'); const ltt = v('ltdTotal');
      b.debtCur = dc != null ? dc : (ltc != null || sb != null ? r1((ltc || 0) + (sb || 0)) : null);
      b.debtLong = ltn != null ? ltn : (ltt != null ? r1(ltt - (ltc || 0)) : null);
      b.debt = b.debtCur == null && b.debtLong == null ? null : r1((b.debtCur || 0) + (b.debtLong || 0));
      const li = v('liabilities'); const le = v('liabEq');
      b.liabilities = li != null ? li : (le != null && b.equity != null ? r1(le - b.equity) : null);
      return b;
    });

    // ten fiscal years
    const aEnds = Array.from(P.revenue.annual.keys()).concat(Array.from(P.netInc.annual.keys()));
    const annual = Array.from(new Set(aEnds)).sort().slice(-10).map((end) => {
      const g = (k) => { const v = P[k].annual.get(end); return v ? v.val : null; };
      const a = { fy: fiscal(end, fyEnd).fy, end, revenue: money(g('revenue')), netInc: money(g('netInc')), epsDil: r2(g('epsDil')), ocf: money(g('ocf')), capex: money(g('capex')), shDil: g('shDil') != null ? r1(g('shDil') / 1e6) : null };
      a.fcf = a.ocf != null && a.capex != null ? r1(a.ocf - a.capex) : null;
      return a;
    });

    // shares outstanding (cover page)
    let sharesOut = null;
    const dei = tx.dei && tx.dei.EntityCommonStockSharesOutstanding;
    if (dei && dei.units && dei.units.shares) {
      const byEnd = new Map(); dei.units.shares.forEach((f) => { if (!f.end) return; const k = f.end + '|' + (f.filed || ''); byEnd.set(k, (byEnd.get(k) || 0) + (+f.val)); }); // classes add up
      let best = null; byEnd.forEach((v, k) => { const [e, fl] = k.split('|'); if (!best || e > best.date || (e === best.date && fl > best.filed)) best = { value: v, date: e, filed: fl }; });
      if (best) sharesOut = { value: best.value, date: best.date };
    }

    const last = quarters[quarters.length - 1];
    const latest = latestFiling(subs, last, facts);
    const price = priceModel(priceRaw, quarters);
    const notes = [];
    if (quarters.some((q) => q.derived)) notes.push('Fourth-quarter figures are derived: the full-year 10-K minus the first nine months. EPS for those quarters is approximate.');
    notes.push('Figures are GAAP, as filed with the SEC. Amounts in $ millions except per-share figures.');
    if (!price) notes.push('Price history was not available, so valuation and the stock’s reaction are not shown.');
    const model = {
      ok: true, sample: false, ticker: tickerIn, name: (subs && subs.name) || facts.entityName || tickerIn, cik: facts.cik || (subs && +subs.cik) || null,
      sic: (subs && subs.sicDescription) || null, fiscalYearEnd: fyEnd, exchange: subs && subs.exchanges && subs.exchanges[0] || null,
      latest, quarters, balance, annual, sharesOut, price, derived: null, notes,
      units: { money: 'USD millions', eps: 'USD per share', shares: 'millions' },
    };
    model.derived = derive(model);
    return model;
  }

  /* Earnings releases = 8-K filings with item 2.02 ("Results of Operations"). The filing's acceptance time tells
     whether results came out after the close (4 p.m. or later) or before/during the session. */
  const relInfo = {};
  function releaseDates(subs) {
    const r = subs && subs.filings && subs.filings.recent; if (!r || !r.form) return [];
    const out = [];
    for (let i = 0; i < r.form.length; i++) {
      if (!/^8-K/.test(r.form[i]) || !String(r.items && r.items[i] || '').split(',').map((x) => x.trim()).includes('2.02')) continue;
      const d = r.filingDate[i]; out.push(d);
      const t = String(r.acceptanceDateTime && r.acceptanceDateTime[i] || ''); const h = /T(\d{2})/.exec(t);
      relInfo[d] = { afterClose: h ? +h[1] >= 16 : true };
    }
    return out.sort();
  }
  function latestFiling(subs, lastQ, facts) {
    const r = subs && subs.filings && subs.filings.recent;
    const cik = (facts && facts.cik) || (subs && +subs.cik);
    const out = { end: lastQ.end, label: lastQ.label, fq: lastQ.fq, fy: lastQ.fy, form: null, filed: null, accn: null, url: null, release: null };
    if (r && r.form) {
      for (let i = 0; i < r.form.length; i++) {
        if (!/^10-[QK]/.test(r.form[i])) continue;
        if (r.reportDate[i] && Math.abs(days(r.reportDate[i], lastQ.end)) > 6) continue;
        out.form = r.form[i]; out.filed = r.filingDate[i]; out.accn = r.accessionNumber[i];
        out.url = `https://www.sec.gov/Archives/edgar/data/${cik}/${out.accn.replace(/-/g, '')}/${out.accn}-index.htm`;
        break;
      }
      for (let i = 0; i < r.form.length; i++) {
        if (!/^8-K/.test(r.form[i]) || !String(r.items && r.items[i] || '').includes('2.02')) continue;
        const d = r.filingDate[i]; if (d <= lastQ.end || days(lastQ.end, d) > 80) continue;
        const a = r.accessionNumber[i];
        out.release = { date: d, url: `https://www.sec.gov/Archives/edgar/data/${cik}/${a.replace(/-/g, '')}/${a}-index.htm` };
      }
    }
    if (!out.release && lastQ.release) out.release = { date: lastQ.release, url: null };
    return out;
  }
  function priceModel(raw, quarters) {
    if (!raw || !raw.points || raw.points.length < 20) return null;
    const pts = raw.points.filter((p) => p && p[0] && isFinite(p[1]));
    const lastP = pts[pts.length - 1];
    const reactions = [];
    quarters.forEach((q) => {
      if (!q.release) return;
      // after the close: release-day close -> next close; before/during the session: previous close -> release-day close
      const ac = !relInfo[q.release] || relInfo[q.release].afterClose;
      let before = null, after = null;
      for (let i = 0; i < pts.length; i++) {
        const d = pts[i][0];
        if (ac ? d <= q.release : d < q.release) before = pts[i][1];
        else { after = pts[i][1]; break; }
      }
      if (before != null && after != null) reactions.push({ end: q.end, release: q.release, before, after, pct: r1((after / before - 1) * 100) });
    });
    // weekly series for the chart (last close of each week), plus the final day
    const series = []; let wk = null;
    pts.forEach((p) => { const d = toD(p[0]); const k = Math.floor((d.getTime() / DAY + 3) / 7); if (k !== wk) { series.push(p.slice()); wk = k; } else series[series.length - 1] = p.slice(); });
    return { source: raw.source || null, currency: raw.currency || 'USD', last: lastP[1], lastDate: lastP[0], series, reactions };
  }
  function derive(m) {
    const q = m.quarters; const sum = (arr, k) => (arr.length === 4 && arr.every((x) => x[k] != null) ? r1(arr.reduce((s, x) => s + x[k], 0)) : null);
    const t = q.slice(-4), t0 = q.length >= 8 ? q.slice(-8, -4) : [];
    const ttm = { revenue: sum(t, 'revenue'), netInc: sum(t, 'netInc'), eps: t.length === 4 && t.every((x) => x.epsDil != null) ? r2(t.reduce((s, x) => s + x.epsDil, 0)) : null, ocf: sum(t, 'ocf'), fcf: sum(t, 'fcf') };
    const ttmPrev = { revenue: sum(t0, 'revenue'), netInc: sum(t0, 'netInc'), eps: t0.length === 4 && t0.every((x) => x.epsDil != null) ? r2(t0.reduce((s, x) => s + x.epsDil, 0)) : null, ocf: sum(t0, 'ocf'), fcf: sum(t0, 'fcf') };
    const lb = m.balance[m.balance.length - 1] || {};
    const px = m.price && m.price.last;
    const sh = m.sharesOut && m.sharesOut.value ? m.sharesOut.value / 1e6 : (q[q.length - 1] && q[q.length - 1].shDil);
    const marketCap = px != null && sh ? Math.round(px * sh) : null;
    const cashAll = [lb.cash, lb.stInv, lb.ltInv].some((v) => v != null) ? (lb.cash || 0) + (lb.stInv || 0) + (lb.ltInv || 0) : null;
    return {
      ttm, ttmPrev, marketCap,
      pe: px != null && ttm.eps > 0 ? r1(px / ttm.eps) : null,
      ps: marketCap && ttm.revenue > 0 ? r1(marketCap / ttm.revenue) : null,
      fcfYield: marketCap && ttm.fcf != null ? r2((ttm.fcf / marketCap) * 100) : null,
      netCash: cashAll != null && lb.debt != null ? r1(cashAll - lb.debt) : (cashAll != null && lb.debt == null ? r1(cashAll) : null),
    };
  }

  /* ---------- network ---------- */
  const live = () => SML.host === 'web' && /^https?:$/.test(location.protocol);
  const getJSON = (path) => fetch(API + path, { headers: { Accept: 'application/json' } }).then((r) => {
    if (r.status === 404) return null;
    if (!r.ok) throw fail('sec_error');
    return r.json();
  }, () => { throw fail(live() ? 'sec_error' : 'unavailable'); });
  let tickers = null;
  function tickerList() {
    if (!live()) return Promise.reject(fail('unavailable'));
    if (!tickers) tickers = getJSON('/sec/tickers').then((d) => { if (!d) throw fail('sec_error'); return Object.values(d).map((x) => ({ ticker: String(x.ticker).toUpperCase(), name: x.title, cik: x.cik_str })); }).catch((e) => { tickers = null; throw e; });
    return tickers;
  }
  const norm = (t) => String(t || '').trim().toUpperCase().replace(/\./g, '-');
  function search(q) {
    const s = String(q || '').trim(); if (!s) return Promise.resolve([]);
    if (!live()) return Promise.resolve(/^de/i.test(s) ? [{ ticker: 'DEMO', name: SAMPLE.name, cik: SAMPLE.cik }] : []);
    const up = norm(s), words = s.toLowerCase().split(/\s+/).filter(Boolean);
    return tickerList().then((list) => {
      const a = list.filter((x) => x.ticker === up), b = list.filter((x) => x.ticker !== up && x.ticker.startsWith(up)).sort((x, y) => x.ticker.length - y.ticker.length);
      const c = list.filter((x) => !x.ticker.startsWith(up) && words.every((w) => x.name.toLowerCase().includes(w)));
      const seen = new Set(); return a.concat(b, c).filter((x) => (seen.has(x.cik + x.ticker) ? false : seen.add(x.cik + x.ticker))).slice(0, 8);
    }).catch(() => []);
  }
  function load(ticker) {
    const t = norm(ticker);
    if (!/^[A-Z][A-Z0-9\-]{0,9}$/.test(t)) return Promise.reject(fail('bad_ticker'));
    if (t === 'DEMO') return Promise.resolve(SML.earn.sample());
    if (!live()) return Promise.reject(fail('unavailable'));
    return tickerList().then((list) => {
      const hit = list.find((x) => x.ticker === t); if (!hit) throw fail('not_found');
      const priceP = getJSON('/price/' + encodeURIComponent(t)).catch(() => null);
      return Promise.all([getJSON('/sec/facts/' + hit.cik), getJSON('/sec/submissions/' + hit.cik), priceP]).then(([facts, subs, px]) => {
        if (!facts) throw fail('no_quarterly');
        return build(facts, subs, px, hit.ticker);
      });
    });
  }

  SML.earn = { api: API, live, sample: () => JSON.parse(JSON.stringify(SAMPLE)), search, load, build, _t: { periods, fiscal, calLabel, priceModel } };
})();
