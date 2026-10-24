/* Read a Real Company (fork K1): Apple's balance sheet and cash flow, line by line.
   Lessons l-rc-apple-balance (widget balanceBlocks) and l-rc-apple-cash (widget cashRiver).
   Every figure is read from SML.realco (content-realco.js); every ratio is computed here. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const A = SML.realco && SML.realco.apple;
  if (!A) return;
  const BS = A.bs, CF = A.cf9, IS = A.is, esc = SML.esc;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const tw = (s, px, f) => String(s).replace(/<[^>]*>/g, '').replace(/&[#a-z0-9]+;/gi, 'x').length * px * (f || 0.56);
  /* $ millions in */
  const B = (v, d) => F.usd(v / 1000, d == null ? 1 : d) + 'B';
  const SB = (v, d) => F.susd(v / 1000, d == null ? 1 : d) + 'B';
  const bn = (v, d) => F.usd(v / 1000, d == null ? 1 : d) + ' billion';
  const sbn = (v, d) => F.susd(v / 1000, d == null ? 1 : d) + ' billion';
  const pc = (a, b) => (a / b - 1) * 100;
  const upDn = (d) => (d >= 0 ? 'up ' : 'down ') + bn(Math.abs(d));
  const chg = (cur, prev, tail) => upDn(cur - prev) + (cur > 0 && prev > 0 ? ' (' + F.spct(pc(cur, prev), 1) + ')' : '') + (tail == null ? ' since September' : tail);
  const x2 = (v) => F.num(v, 2);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const DLT = (d) => (d >= 0 ? '▲ ' : '▼ ') + B(Math.abs(d));
  /* exact sums: if rounded billions do not add up, show Apple's own $ millions */
  const mn = (v) => F.usd(v, 0) + ' million';
  const sumFmt = (parts, total) => { const r = (v) => Math.round(v / 100) / 10; return Math.abs(parts.reduce((a, v) => a + r(v), 0) - r(total)) < 0.05 ? bn : mn; };

  /* ======================================================================
     Data: balance sheet (Jun 27, 2026 vs Sep 27, 2025)
     ====================================================================== */
  const LINES = {};
  BS.assets.forEach((x) => { LINES[x.k] = Object.assign({ side: 'a' }, x); });
  BS.liabilities.forEach((x) => { LINES[x.k] = Object.assign({ side: 'l' }, x); });
  BS.equity.forEach((x) => { LINES[x.k] = Object.assign({ side: 'e' }, x); });
  const AK = BS.assets.map((x) => x.k), LK = BS.liabilities.map((x) => x.k), EK = BS.equity.map((x) => x.k);
  const CUR = {}; BS.assets.concat(BS.liabilities).forEach((x) => { CUR[x.k] = !!x.current; });
  const snap = (d) => { const o = {}; Object.keys(LINES).forEach((k) => { o[k] = LINES[k][d]; }); return o; };
  const V = { cur: snap('cur'), prev: snap('prev') };
  function M(v) {
    const ca = sum(AK.filter((k) => CUR[k]).map((k) => v[k])), ta = sum(AK.map((k) => v[k]));
    const cl = sum(LK.filter((k) => CUR[k]).map((k) => v[k])), tl = sum(LK.map((k) => v[k]));
    const eq = sum(EK.map((k) => v[k]));
    const cs = v.cash + v.msCur + v.msNon, debt = v.cp + v.debtCur + v.debtNon;
    return { ca, ta, cl, tl, eq, wc: ca - cl, cr: ca / cl, cs, debt, net: cs - debt, de: debt / eq };
  }
  const MC = M(V.cur), MP = M(V.prev);
  const T = BS.totals;
  if (MC.ta !== T.assets[0] || MP.ta !== T.assets[1] || MC.tl !== T.liabilities[0] || MP.tl !== T.liabilities[1] || MC.eq !== T.equity[0] || MP.eq !== T.equity[1] || MC.ca !== T.currentAssets[0] || MC.cl !== T.currentLiab[0] || MP.ca !== T.currentAssets[1] || MP.cl !== T.currentLiab[1]) console.warn('realco: Apple balance sheet lines do not add up to the totals');
  const SH = IS.cur.shBasic, SHD = IS.cur.shDil, SHDY = IS.ya.shDil;
  const BVPS = MC.eq / SH;
  const PX = A.reaction.closeBefore, PX2 = A.reaction.closeAfter;
  const KMAX = Math.max(MC.ta, MP.ta);
  const EQN_M = sumFmt([MC.tl, MC.eq], MC.ta) === mn;
  const EQN = (() => { const f = sumFmt([MC.tl, MC.eq], MC.ta); return `${f(MC.ta)} = ${f(MC.tl)} + ${f(MC.eq)}`; })();

  /* ======================================================================
     Data: cash flow, nine months (Oct 2025 to Jun 2026 vs a year earlier)
     ====================================================================== */
  const WCK = ['ar', 'vendor', 'inv', 'oa', 'ap', 'ol'];
  const WCN = { ar: ['Customers paid (receivables)', 'Receivables'], vendor: ['Vendor receivables', 'Vendor rec.'], inv: ['Inventory', 'Inventory'], oa: ['Other assets', 'Other assets'], ap: ['Supplier bills (payables)', 'Payables'], ol: ['Other liabilities', 'Other liab.'] };
  function cfData(d) {
    const i = d === 'cur' ? 0 : 1;
    const g = (sec, k) => { const x = CF[sec].find((y) => y.k === k); return x ? x[d] : 0; };
    const o = { ni: g('operating', 'ni'), da: g('operating', 'da'), sbc: g('operating', 'sbc'), oth: g('operating', 'oth') };
    o.noncash = o.da + o.sbc + o.oth;
    o.wcItems = WCK.map((k) => ({ k, v: g('operating', k) }));
    o.wc = sum(o.wcItems.map((x) => x.v));
    o.op = CF.totals.operating[i];
    o.capex = -g('investing', 'capex');
    o.fcf = o.op - o.capex;
    o.secBuy = -g('investing', 'buyMs'); o.secMat = g('investing', 'matMs'); o.secSold = g('investing', 'sellMs');
    o.sec = o.secBuy - o.secMat - o.secSold;
    o.bb = -g('financing', 'buyback'); o.div = -g('financing', 'div'); o.taxes = -g('financing', 'taxes');
    o.repay = -g('financing', 'repay'); o.cpRepay = -g('financing', 'cp'); o.issue = g('financing', 'issue');
    o.debt = o.repay + o.cpRepay - o.issue;
    o.other = -(g('investing', 'oth') + g('financing', 'oth'));
    o.cashUp = CF.totals.change[i]; o.begin = CF.totals.begin[i]; o.end = CF.totals.end[i];
    o.invTot = CF.totals.investing[i]; o.finTot = CF.totals.financing[i];
    return o;
  }
  const C = cfData('cur'), CY = cfData('ya');
  if (C.ni + C.noncash + C.wc !== C.op || CY.ni + CY.noncash + CY.wc !== CY.op || C.fcf !== C.bb + C.div + C.debt + C.taxes + C.sec + C.other + C.cashUp || C.op + C.invTot + C.finTot !== C.cashUp || C.end !== V.cur.cash) console.warn('realco: Apple cash flow does not tie out');
  const NIQ = IS.cur.netInc, NIQY = IS.ya.netInc, EPSQ = IS.cur.epsDil, EPSQY = IS.ya.epsDil;
  const DIV = A.dividend, QR = A.call.quarterReturn;
  const SPX_CAPEX = SML.realco.spacex && SML.realco.spacex.capex ? SML.realco.spacex.capex.cur : null;

  /* ======================================================================
     Term cards: What it is · At Hoppy's cart · At Apple · Why it matters
     ====================================================================== */
  const lineCard = (k, what, hop, extra, why) => {
    const x = LINES[k], d = x.cur - x.prev;
    return { name: x.name, amt: B(x.cur), d: SB(d) + ' since Sep', dc: d >= 0 ? 'rcbs-up' : 'rcbs-dn', what, hop, apple: `<b>${bn(x.cur)}</b> on June 27, 2026, ${chg(x.cur, x.prev)}.` + (extra ? ' ' + extra : ''), why };
  };
  const biggest = AK.slice().sort((a, b) => V.cur[b] - V.cur[a])[0];
  const BT = {
    assets: { name: 'Total assets', amt: B(MC.ta), d: SB(MC.ta - MP.ta) + ' since Sep', dc: 'rcbs-up',
      what: 'Everything the company owns or is owed that has value: cash, investments, money customers owe, products on the shelf, buildings and machines.',
      hop: 'Cash $6,000 + beans and cups $1,000 + an unpaid catering invoice $800 + the cart and espresso machine $12,000 = <b>$19,800</b>.',
      apple: `<b>${bn(MC.ta)}</b> on June 27, 2026, ${chg(MC.ta, MP.ta)}. ${bn(MC.cs)} of it is cash and securities.`,
      why: 'Assets are the tools a company earns with and the cushion it pays bills from. The total says little on its own: what matters is how much is cash and how much is owed against it.' },
    liabilities: { name: 'Total liabilities', amt: B(MC.tl), d: SB(MC.tl - MP.tl) + ' since Sep', dc: 'rcbs-dn',
      what: 'Everything the company owes: suppliers, lenders, customers who paid in advance, tax offices.',
      hop: 'Bean supplier $700 + gift cards sold but not yet used $300 + cart loan $5,000 = <b>$6,000</b>.',
      apple: `<b>${bn(MC.tl)}</b>, ${chg(MC.tl, MP.tl)}. Apple paid suppliers down and cut debt by ${bn(MP.debt - MC.debt)}.`,
      why: 'Bills come due whatever happens to sales. Debt with fixed dates is the part that can force a company to raise money at a bad time.' },
    equity: { name: 'Shareholders’ equity (book value)', amt: B(MC.eq), d: SB(MC.eq - MP.eq) + ' since Sep', dc: 'rcbs-up',
      what: 'Assets minus liabilities: what would be left for shareholders if every asset fetched its book value and every bill were paid. Also called book value.',
      hop: '$19,800 − $6,000 = <b>$13,800</b>. That is the owner’s stake on paper.',
      apple: `<b>${bn(MC.eq)}</b>, ${chg(MC.eq, MP.eq)}. Nine months of profit (${bn(C.ni)}) was more than the ${bn(C.bb + C.div)} Apple paid out in buybacks and dividends.`,
      why: 'Book value is small next to Apple’s stock market value, because its brand, software and loyal customers are not on the balance sheet. At Apple, equity tells you more about payouts than about worth.' },
    curr: { name: 'Current vs non-current', amt: '1-year line', d: '', dc: '',
      what: '"Current" means within a year. Current assets should turn into cash within 12 months; current liabilities are due within 12 months. Everything else is non-current, or long-term.',
      hop: 'Current assets: cash $6,000 + beans $1,000 + invoice $800 = <b>$7,800</b>. The $12,000 cart is long-term. Current liabilities: bean bill $700 + gift cards $300 = <b>$1,000</b>, plus any cart-loan payments due this year.',
      apple: `Current assets <b>${bn(MC.ca)}</b> against current liabilities <b>${bn(MC.cl)}</b>: almost exactly level. Long-term assets: ${bn(MC.ta - MC.ca)}.`,
      why: 'The split tells you whether next year’s bills are covered by money arriving next year. It is the first thing a lender checks.' },
    cash: lineCard('cash', 'Money in the bank plus very safe investments that mature within about three months, such as money market funds.',
      'The <b>$6,000</b> in the register and the bank.',
      'The cash flow statement shows exactly why: see the next lesson.',
      'Cash pays bills, dividends and buybacks without asking anyone. A shrinking pile matters only if debt rises at the same time or the business stops producing cash.'),
    msCur: lineCard('msCur', 'Bonds and similar investments the company can sell any day, that mature within a year.',
      'None: all of Hoppy’s $6,000 is plain cash. Parking $2,000 in a 3-month Treasury bill would put it here.',
      `With cash and the long-term securities, Apple holds ${bn(MC.cs)}.`,
      'This pile is why people call Apple’s balance sheet a fortress. It earns interest and pays for buybacks in any economy.'),
    ar: lineCard('ar', 'Money customers owe for things already delivered. Apple sells on credit to phone carriers, retailers and businesses.',
      'The <b>$800</b> catering invoice an office has not paid yet.',
      `The cash flow statement counts ${bn(C.wcItems[0].v)} collected over nine months.`,
      'Receivables growing much faster than sales can mean customers pay slowly, or a company is pushing product into stores. Apple’s fell, and that turned into cash.'),
    vendor: lineCard('vendor', 'Money the companies that assemble Apple’s products owe Apple for parts. Apple buys components such as chips and screens in huge volumes, then resells them to its manufacturing partners, who pay later.',
      'None. Hoppy’s would have one if it bought cups in bulk at a discount and resold some to the smoothie cart next door, to be paid at month end.',
      `The cash flow statement counts that ${bn(C.wcItems[1].v)} as cash coming in.`,
      'An unusual line that shows how tightly Apple runs its supply chain. It rises and falls with how much its partners are building.'),
    inv: lineCard('inv', 'Finished products and parts waiting to be sold or used.',
      '<b>$1,000</b> of beans, milk and cups.',
      `It nearly doubled, from ${bn(V.prev.inv)} to ${bn(V.cur.inv)}.`,
      'A pile-up can warn that products are not selling. It can also be a choice: on the July call Apple said chip supply was tight and getting tighter and that memory prices were rising fast, and a company in that spot often buys parts early. Watch whether sales keep pace in the next quarters.'),
    oca: lineCard('oca', 'Smaller items that turn into cash or get used up within a year, such as costs paid in advance.',
      'None. Paying next month’s permit early would put that money here.', '',
      'Rarely moves a stock. A big jump in a catch-all line is worth a look in the quarterly report’s notes.'),
    msNon: lineCard('msNon', 'The same kind of investments, mostly bonds, maturing in more than a year. Apple can still sell most of them quickly, so investors count them with cash.',
      'None. A 2-year Treasury note bought with spare cash would go here.',
      biggest === 'msNon' ? 'The biggest single line on Apple’s balance sheet.' : '',
      'This is the backup for Apple’s thin 1-year cushion: if bills ever ran ahead of cash, Apple could sell these. Their value moves a little with interest rates.'),
    ppe: lineCard('ppe', 'Property, plant and equipment: land, buildings, data centers, machines and store fittings, minus the wear and tear charged so far (depreciation).',
      'The cart and the espresso machine: <b>$12,000</b>.',
      `Only ${F.pct(V.cur.ppe / MC.ta * 100, 0)} of Apple’s assets.`,
      'This is what capex buys. Apple’s partners do most of the assembly, so Apple needs little equipment for its size. That is one reason so much of its profit becomes free cash.'),
    intang: lineCard('intang', 'Valuable things you cannot touch, such as patents, licenses or technology a company bought, recorded at cost and written down over their useful life.',
      'None. Buying a secret syrup recipe from a closing café would go here.',
      'The quarterly report’s notes say what was added.',
      'A fast jump usually means a purchase or a large license. Investors check what was bought and whether it will pay off.'),
    onca: lineCard('onca', 'Long-term items that do not fit another line, such as tax benefits the company can use in later years.',
      'None.', '',
      'Big but slow-moving. It matters mostly when it jumps without an explanation.'),
    ap: lineCard('ap', 'Bills the company owes its suppliers for parts and services already received.',
      '<b>$700</b> owed to the bean supplier.',
      `Paying suppliers down used ${bn(-C.wcItems[4].v)} of cash over nine months.`,
      'Large payables are a sign of bargaining power: suppliers wait to be paid, which works like a free loan. When payables shrink, cash goes out the door.'),
    ocl: lineCard('ocl', 'Other bills due within a year: taxes, wages, warranty costs and similar items.',
      'None on this sheet. June’s barista wages, if still unpaid at the end of the month, would go here.', '',
      'Together with payables it is why Apple’s current liabilities are as big as its current assets.'),
    defrev: lineCard('defrev', 'Cash customers paid in advance for something not yet delivered, such as AppleCare plans, subscriptions and services still to come.',
      '<b>$300</b> of gift cards sold but not yet used.', '',
      'A liability that is good news: the cash is already in, and it turns into revenue as Apple delivers. Growing deferred revenue hints at future sales.'),
    cp: lineCard('cp', 'Very short IOUs, usually lasting a few weeks to a few months, that large companies with top credit ratings sell to borrow cheaply.',
      'None. No one lends to a coffee cart this way; its only borrowing is the cart loan.',
      `Apple paid down ${bn(C.cpRepay)} of it, net, over nine months.`,
      'Paying it down cuts debt and lifts net cash. A company that suddenly cannot roll over its commercial paper is in trouble, which is why credit markets watch it.'),
    debtCur: lineCard('debtCur', 'Bonds the company sold in past years that come due within the next 12 months.',
      'This year’s payments on the $5,000 cart loan.', '',
      'Apple can pay this from cash. A company that cannot has to borrow again, maybe at higher rates, and that risk weighs on its stock.'),
    debtNon: lineCard('debtNon', 'Bonds that come due in more than a year.',
      'The rest of the $5,000 cart loan.',
      `Over nine months Apple repaid ${bn(C.repay)} of term debt and ${C.issue ? 'issued ' + bn(C.issue) + ' of new bonds' : 'issued no new bonds'}.`,
      'Debt is not bad when it is cheap and easy to repay. The warning sign is debt rising while cash falls.'),
    oncl: lineCard('oncl', 'Long-term obligations that are not bonds, such as taxes due in later years.',
      'None.', '',
      'A big jump deserves a look in the notes: it can be a tax bill, a legal reserve or something else that will need cash later.'),
    stock: lineCard('stock', 'Money shareholders paid in when shares were first sold, plus the value of stock given to employees.',
      'The money Hoppy’s owner put in to start the cart. The coffee-cart sheet keeps it inside the $13,800 of equity.',
      'It grows every year as employees are paid in stock.',
      'At a young company this is most of the equity. At Apple it mostly reflects years of stock pay to employees.'),
    re: { name: LINES.re.name, amt: SB(V.cur.re), d: 'was ' + B(V.prev.re), dc: 'rcbs-up',
      what: 'All the profit a company has earned since it began, minus what it paid out in dividends and, at companies like Apple that retire the shares they buy back, buybacks.',
      hop: 'June’s $3,040 profit minus the $1,000 dividend adds <b>$2,040</b> to Hoppy’s retained earnings.',
      apple: `<b>${sbn(V.cur.re)}</b> on June 27, 2026, up from <b>${bn(V.prev.re)}</b> in September. For years Apple paid out more in buybacks and dividends than all the profit it had ever earned, so the total sank below zero. Nine months of profit (${bn(C.ni)}) beat the payouts (${bn(C.bb + C.div)}) and flipped it back above zero.`,
      why: 'A negative number here usually means years of losses. At Apple it meant "gave it all back to shareholders". Same sign, opposite story: always ask why.' },
    aoci: { name: LINES.aoci.name, amt: B(V.cur.aoci), d: SB(V.cur.aoci - V.prev.aoci) + ' since Sep', dc: 'rcbs-up',
      what: 'Gains and losses not yet counted in profit, mostly price changes on bond investments and currency moves. Short name: AOCI.',
      hop: 'None.',
      apple: `<b>${bn(V.cur.aoci)}</b>, a smaller loss than ${bn(V.prev.aoci)} in September.`,
      why: 'Mostly paper moves in bond prices as interest rates change. It rarely moves the stock.' },
    buyback: { name: 'Share buyback', amt: B(C.bb), d: 'in 9 months', dc: '',
      what: 'The company buys its own shares on the market and retires them. Cash goes out, equity shrinks by the same amount, and profit is split among fewer shares.',
      hop: 'Hoppy’s has one owner, so there is nobody to buy shares from. Its $1,000 dividend shows the same balance-sheet move: cash −$1,000 and equity −$1,000.',
      apple: `<b>${bn(C.bb)}</b> of buybacks in the nine months to June 2026, about ${bn(QR.buybacks)} of it in the June quarter alone, Apple said on the July 30 call.`,
      why: 'Fewer shares lift EPS even when profit is flat. Buying above book value lowers book value per share, one more reason price to book says little about Apple.' },
    wc: { name: 'Working capital', amt: SB(MC.wc), d: 'was ' + B(MP.wc), dc: 'rcbs-up',
      what: 'Current assets minus current liabilities: the cushion between money arriving in the next year and bills due in the next year.',
      hop: '$7,800 − $1,000 = <b>$6,800</b>, before any loan payments due this year.',
      apple: `${bn(MC.ca)} − ${bn(MC.cl)} = <b>${sbn(MC.wc)}</b> in June, up from <b>${bn(MP.wc)}</b> in September.`,
      why: `Near zero looks scary on paper. For Apple it is less scary than it looks: it also holds ${bn(V.cur.msNon)} of long-term securities it can sell any day. At a small company with no other savings, negative working capital is a real warning.` },
    cr: { name: 'Current ratio', amt: x2(MC.cr), d: 'was ' + x2(MP.cr), dc: 'rcbs-up',
      what: 'Current assets divided by current liabilities. 1.00 means next year’s bills are exactly covered by money arriving next year.',
      hop: '$7,800 ÷ $1,000 = <b>7.8</b>, before any loan payments due this year. A small business needs a fat cushion.',
      apple: `${bn(MC.ca)} ÷ ${bn(MC.cl)} = <b>${x2(MC.cr)}</b>, up from ${x2(MP.cr)} in September.`,
      why: 'Many analysts like well above 1 for an ordinary company. Apple runs near 1 partly because it keeps most of its savings in long-term securities, which do not count as current.' },
    netcash: { name: 'Net cash', amt: B(MC.net), d: 'was ' + B(MP.net), dc: 'rcbs-up',
      what: 'Cash and investments minus all debt. Positive means the company could pay off every loan today and still have money left.',
      hop: '$6,000 cash − $5,000 cart loan = <b>$1,000</b> net cash.',
      apple: `Cash and securities ${bn(MC.cs)} − debt ${bn(MC.debt)} = <b>${bn(MC.net)}</b>, up from ${bn(MP.net)} in September.`,
      why: 'Net cash is safety and fuel. It lets Apple keep buying back shares in a bad year and makes it very unlikely to be forced to raise money at a bad time. Investors pay more for that safety.' },
    de: { name: 'Debt to equity', amt: x2(MC.de), d: 'was ' + x2(MP.de), dc: 'rcbs-up',
      what: 'Total debt divided by shareholders’ equity: how much the company borrowed for each dollar of book value.',
      hop: '$5,000 ÷ $13,800 = <b>0.36</b>.',
      apple: `${bn(MC.debt)} ÷ ${bn(MC.eq)} = <b>${x2(MC.de)}</b>, down from ${x2(MP.de)} in September.`,
      why: 'Higher means more risk when sales drop. For Apple the ratio overstates the risk: buybacks keep equity small, while its cash and securities are bigger than its debt.' },
    bvps: { name: 'Book value per share', amt: F.usd(BVPS), d: '', dc: '',
      what: 'Shareholders’ equity divided by the number of shares: the book value behind each share.',
      hop: '$13,800 ÷ 1,000 shares = <b>$13.80</b> a share.',
      apple: `${bn(MC.eq)} ÷ ${F.num(SH / 1000, 2)} billion shares (the June quarter’s average) = <b>${F.usd(BVPS)}</b>.`,
      why: 'Value investors compare it with the share price. For companies whose worth lives in brands, software and people, it says little.' },
    pb: { name: 'Price to book', amt: F.num(PX / BVPS, 1) + '×', d: 'at ' + F.usd(PX), dc: '',
      what: 'Share price divided by book value per share: how many dollars investors pay for each dollar of equity.',
      hop: 'A buyer paying $27,600 for all of Hoppy’s ($27.60 a share) pays <b>2 times</b> book: for the profits, not just the cart.',
      apple: `At the July 30 close of ${F.usd(PX)}: ${F.usd(PX)} ÷ ${F.usd(BVPS)} ≈ <b>${F.num(PX / BVPS, 0)}</b>. At about ${F.usd(PX2, 0)} the next day: about ${F.num(PX2 / BVPS, 0)}.`,
      why: 'Apple trades at many times book because investors pay for its earning power and buybacks, not its assets. Price to book matters most for banks and insurers, whose assets are mostly money.' },
  };
  const BGROUPS = [
    { id: 'big', t: 'The big picture', keys: ['assets', 'liabilities', 'equity', 'curr'] },
    { id: 'own', t: 'What Apple owns', keys: AK },
    { id: 'owe', t: 'What Apple owes', keys: LK },
    { id: 'eq', t: 'What belongs to shareholders', keys: ['stock', 're', 'aoci', 'buyback'] },
    { id: 'chk', t: 'Health checks', keys: ['wc', 'cr', 'netcash', 'de', 'bvps', 'pb'] },
  ];

  const CT = {
    ni: { name: 'Net income (the starting point)', amt: B(C.ni), d: F.spct(pc(C.ni, CY.ni), 1) + ' YoY', dc: 'rcbs-up',
      what: 'Profit after every cost and tax. The cash flow statement starts here, then corrects it to actual cash.',
      hop: 'June profit: <b>$3,040</b>.',
      apple: `<b>${bn(C.ni)}</b> in the nine months to June 2026 (late September 2025 to June 2026), ${chg(C.ni, CY.ni, ' from a year earlier')}.`,
      why: 'Profit is what EPS and the P/E ratio are built on. But dividends are paid with cash, not profit, so investors check that one turns into the other.' },
    da: { name: 'Depreciation and amortization', amt: SB(C.da), d: 'added back', dc: 'rcbs-up',
      what: 'The cost of equipment and intangibles spread over the years they are used. It lowers profit, but no cash leaves this year: the cash left when the thing was bought.',
      hop: '<b>$200</b> of wear on the espresso machine: a cost on paper, but nothing left the register in June.',
      apple: `<b>${bn(C.da)}</b> added back, against ${bn(C.capex)} of capex.`,
      why: 'Comparing it with capex shows whether a company is replacing what wears out. It is also why profit and cash differ.' },
    sbc: { name: 'Stock-based compensation', amt: SB(C.sbc), d: 'added back', dc: 'rcbs-up',
      what: 'Paying employees in shares instead of cash. It counts as a cost in profit, but no cash leaves, so it is added back.',
      hop: 'None: Hoppy’s pays its barista in cash.',
      apple: `<b>${bn(C.sbc)}</b> added back.`,
      why: 'It is a real cost to shareholders: new shares dilute them. Part of every buyback just soaks up these new shares, so check how much the share count actually falls.' },
    oth: { name: 'Other adjustments', amt: SB(C.oth), d: '', dc: 'rcbs-dn',
      what: 'Other non-cash items, such as deferred taxes and gains or losses that did not involve cash.',
      hop: 'None.',
      apple: `<b>${sbn(C.oth)}</b>.`,
      why: 'Usually small. If it is large and keeps repeating, read the notes.' },
    noncash: { name: 'Non-cash costs (net)', amt: SB(C.noncash), d: 'added back', dc: 'rcbs-up',
      what: 'Costs that lowered profit but did not use cash this period: wear and tear, stock pay and a few other items.',
      hop: '<b>$200</b> of depreciation on the espresso machine.',
      apple: `Depreciation ${bn(C.da)} + stock pay ${bn(C.sbc)} + other ${sbn(C.oth)} = <b>${sbn(C.noncash)}</b>.`,
      why: 'These add-backs are why a healthy company’s operating cash usually beats its profit.' },
    wc: { name: 'Working capital (change)', amt: SB(C.wc), d: 'net', dc: C.wc >= 0 ? 'rcbs-up' : 'rcbs-dn',
      what: 'Cash tied up in, or freed from, the day-to-day loop: collecting from customers, stocking inventory, paying suppliers.',
      hop: 'Extra beans stocked −$300, bean bill not yet paid +$100 → <b>−$200</b>. With the $200 of depreciation added back, operating cash equals the $3,040 profit.',
      apple: `<b>${sbn(C.wc)}</b> net. Freed: receivables ${sbn(C.wcItems[0].v)}, vendor receivables ${sbn(C.wcItems[1].v)}, other liabilities ${sbn(C.wcItems[5].v)}. Used: inventory ${sbn(C.wcItems[2].v)}, other assets ${sbn(C.wcItems[3].v)}, paying suppliers ${sbn(C.wcItems[4].v)}.`,
      why: 'This is where profit and cash split apart. A drain can be fine, like stocking up before a launch, or a warning, like customers not paying. Watch the trend.' },
    op: { name: 'Operating cash flow', amt: B(C.op), d: F.spct(pc(C.op, CY.op), 1) + ' YoY', dc: 'rcbs-up',
      what: 'Cash the business itself brought in: profit, plus non-cash costs, plus or minus working capital.',
      hop: '$3,040 + $200 − $300 + $100 = <b>$3,040</b>.',
      apple: `<b>${bn(C.op)}</b>, ${chg(C.op, CY.op, ' from a year earlier')}. That is ${x2(C.op / C.ni)} times net income.`,
      why: 'Operating cash at or above net income, year after year, is a sign of high-quality earnings. Below it for long is a warning.' },
    capex: { name: 'Capex (capital expenditures)', amt: B(C.capex), d: F.spct(pc(C.capex, CY.capex), 1) + ' YoY', dc: 'rcbs-dn',
      what: 'Money spent on long-lasting things like buildings, data centers and machines.',
      hop: 'A new grinder: <b>$600</b>.',
      apple: `<b>${bn(C.capex)}</b>, ${chg(C.capex, CY.capex, ' from a year earlier')}.`,
      why: `Capex keeps a business running and growing. Light capex leaves more free cash; compare SpaceX, which spent ${SPX_CAPEX ? bn(SPX_CAPEX) : 'far more'} on capex in a single quarter.` },
    fcf: { name: 'Free cash flow', amt: B(C.fcf), d: F.spct(pc(C.fcf, CY.fcf), 1) + ' YoY', dc: 'rcbs-up',
      what: 'Operating cash minus capex: the cash left that the company can freely use for dividends, buybacks, debt or savings.',
      hop: '$3,040 − $600 = <b>$2,440</b>.',
      apple: `${bn(C.op)} − ${bn(C.capex)} = <b>${bn(C.fcf)}</b>, ${chg(C.fcf, CY.fcf, ' from a year earlier')}.`,
      why: 'Many investors value companies on free cash flow more than on profit, because it is what can actually be paid out. It funds Apple’s buybacks and dividends.' },
    buyback: { name: 'Buybacks', amt: B(C.bb), d: F.pct(C.bb / C.fcf * 100, 0) + ' of FCF', dc: '',
      what: 'The company buys back its own shares and retires them.',
      hop: 'None: Hoppy’s has one owner.',
      apple: `<b>${bn(C.bb)}</b> in nine months (${bn(CY.bb)} a year earlier), ${F.pct(C.bb / C.fcf * 100, 0)} of free cash flow. About ${bn(QR.buybacks)} came in the June quarter.`,
      why: 'Fewer shares means each remaining share earns more, so EPS grows faster than profit. That is the most direct way Apple’s cash reaches the share price.' },
    div: { name: 'Dividends', amt: B(C.div), d: '$' + DIV.perShare.toFixed(2) + ' a share', dc: '',
      what: 'Cash paid to shareholders per share, usually every quarter.',
      hop: 'The owner takes a <b>$1,000</b> dividend.',
      apple: `<b>${bn(C.div)}</b> in nine months. The latest: <b>$${DIV.perShare.toFixed(2)}</b> a share, announced with the July 30 results, paid ${DIV.paid} to shareholders on record ${DIV.record}.`,
      why: `A steady, rising dividend signals confidence. Apple’s is small next to its buybacks: about ${bn(QR.dividends, 0)} a quarter against ${bn(QR.buybacks)} of buybacks in the June quarter.` },
    debt: { name: 'Debt repaid', amt: B(C.debt), d: 'net', dc: '',
      what: 'Paying back bonds as they come due, plus short-term commercial paper.',
      hop: 'Paying down the principal on the cart loan would show up here.',
      apple: (() => { const f = sumFmt([C.repay, C.cpRepay, -C.issue], C.debt); return `Term debt ${f(C.repay)} + commercial paper ${f(C.cpRepay)} = <b>${f(C.debt)}</b>${C.issue ? ', minus ' + f(C.issue) + ' of new bonds' : ', with no new bonds issued'}.`; })(),
      why: 'Repaying debt from cash is a quiet way to return value: less interest, more safety. Borrowing to pay dividends would be the warning sign.' },
    taxes: { name: 'Taxes on employee stock awards', amt: B(C.taxes), d: '', dc: '',
      what: 'When employee shares vest, the company keeps some of the shares and pays the employees’ income tax in cash. It works like a small buyback.',
      hop: 'None.',
      apple: `<b>${bn(C.taxes)}</b> in nine months.`,
      why: 'Part of the true cost of paying people in stock.' },
    sec: { name: 'Parked in securities (net)', amt: B(C.sec), d: 'net', dc: '',
      what: 'Buying bonds and other investments, minus those that matured or were sold. The money is parked, not spent.',
      hop: 'Like moving spare cash from the register into a savings bond: still Hoppy’s money.',
      apple: `Bought ${bn(C.secBuy)}, matured ${bn(C.secMat)}, sold ${bn(C.secSold)}: <b>${bn(C.sec)}</b> more parked in securities.`,
      why: 'It moves cash from one pocket to another. That is why investors add securities to cash when they judge a balance sheet.' },
    other: { name: 'Other items', amt: B(C.other), d: '', dc: '',
      what: 'Smaller investing and financing payments that do not fit the other lines.',
      hop: 'None.',
      apple: `<b>${bn(C.other)}</b> in nine months.`,
      why: 'Small at Apple. Large, repeated "other" items deserve a look in the notes.' },
    cashUp: { name: 'Change in cash', amt: SB(C.cashUp), d: '', dc: 'rcbs-up',
      what: 'What is left after everything: the change in the cash balance.',
      hop: '$3,040 − $600 grinder − $1,000 dividend = <b>+$1,440</b> more in the register.',
      apple: `<b>${sbn(C.cashUp)}</b>: cash went from ${bn(C.begin)} to ${bn(C.end)}, the exact number on the balance sheet.`,
      why: 'This is where the statements tie together: the cash flow statement explains the cash line on the balance sheet.' },
    niq: { name: 'Net income, June quarter', amt: B(NIQ), d: F.spct(pc(NIQ, NIQY), 1) + ' YoY', dc: 'rcbs-up',
      what: 'Profit for the three months April to June, the quarter behind the July 30 report.',
      hop: '<b>$3,040</b> this June vs $1,920 last June: +58.3%.',
      apple: `<b>${bn(NIQ)}</b> vs ${bn(NIQY)} a year earlier: ${F.spct(pc(NIQ, NIQY), 1)}.`,
      why: 'The size of the pie. EPS divides it among the shares.' },
    shares: { name: 'Diluted share count', amt: F.num(SHD / 1000, 2) + 'B', d: F.spct(pc(SHD, SHDY), 1) + ' YoY', dc: 'rcbs-dn',
      what: 'How many shares the profit is split between. "Diluted" also counts shares that employee awards could add.',
      hop: '1,000 shares this June and last June: unchanged.',
      apple: `<b>${F.num(SHD, 1)} million</b> in the June quarter vs ${F.num(SHDY, 1)} million a year earlier: ${F.spct(pc(SHD, SHDY), 1)}.`,
      why: 'A falling share count lifts EPS on its own. Buybacks have to outrun the new shares from stock pay to shrink it.' },
    eps: { name: 'Diluted EPS', amt: F.usd(EPSQ), d: F.spct(pc(EPSQ, EPSQY), 1) + ' YoY', dc: 'rcbs-up',
      what: 'Net income divided by diluted shares: the profit behind each share.',
      hop: '$3,040 ÷ 1,000 = <b>$3.04</b>, up from $1.92. Same share count, so EPS grows exactly as fast as profit: +58.3%.',
      apple: `<b>${F.usd(EPSQ)}</b> vs ${F.usd(EPSQY)}: ${F.spct(pc(EPSQ, EPSQY), 1)}, faster than net income (${F.spct(pc(NIQ, NIQY), 1)}) because the profit was split among ${F.pct(-pc(SHD, SHDY), 1)} fewer shares.`,
      why: 'Price ≈ EPS × P/E. Faster EPS growth from buybacks supports the price even when profit growth is the same.' },
  };
  const CGROUPS = [
    { id: 'op', t: 'From profit to operating cash', keys: ['ni', 'da', 'sbc', 'oth', 'noncash', 'wc', 'op'] },
    { id: 'inv', t: 'Investing and free cash', keys: ['capex', 'fcf'] },
    { id: 'use', t: 'Where the cash went', keys: ['buyback', 'div', 'debt', 'taxes', 'sec', 'other', 'cashUp'] },
    { id: 'ps', t: 'Per share', keys: ['niq', 'shares', 'eps'] },
  ];

  /* ======================================================================
     CSS (module prefix rcbs-)
     ====================================================================== */
  SML.css(`
    .rcbs [hidden]{display:none!important}
    .rcbs .wg-fig{padding:14px 14px 10px}
    .rcbs svg .rcbs-ac{fill:var(--info)} .rcbs svg .rcbs-an{fill:color-mix(in srgb,var(--info) 40%,var(--bg))}
    .rcbs svg .rcbs-lc{fill:var(--down)} .rcbs svg .rcbs-ln{fill:color-mix(in srgb,var(--down) 40%,var(--bg))}
    .rcbs svg .rcbs-eq{fill:var(--up)}
    .rcbs svg .rcbs-sep{stroke:var(--paper);stroke-width:1.5}
    .rcbs svg .rcbs-blk,.rcbs svg .rcbs-lnk,.rcbs svg .rcbs-tap{cursor:pointer;outline:none}
    .rcbs svg .rcbs-blk:hover .b{filter:brightness(1.18)}
    .rcbs svg .rcbs-blk:focus-visible .b,.rcbs svg .rcbs-tap:focus-visible rect{stroke:var(--accent);stroke-width:2}
    .rcbs svg .rcbs-hit{fill:transparent}
    .rcbs svg .rcbs-ghost{fill:color-mix(in srgb,var(--down) 14%,transparent);stroke:var(--down);stroke-width:1.6;stroke-dasharray:5 4}
    .rcbs svg .rcbs-ghostl{fill:none;stroke:var(--muted);stroke-width:1.4;stroke-dasharray:5 4}
    .rcbs svg .rcbs-pill{fill:var(--surface-2);stroke:var(--accent);stroke-width:1.4}
    .rcbs svg text.rcbs-cap2{font:600 10.5px var(--mono);letter-spacing:.05em}
    .rcbs svg .rcbs-halo{paint-order:stroke;stroke:var(--paper);stroke-width:3.5px;stroke-linejoin:round}
    .rcbs svg .rcbs-band{opacity:.5;transition:opacity .15s}
    .rcbs svg .rcbs-lnk:hover .rcbs-band{opacity:.74}
    .rcbs svg .rcbs-lnk.on .rcbs-band{opacity:.9}
    .rcbs svg .rcbs-lnk:focus-visible .rcbs-band{opacity:.9;stroke:var(--accent);stroke-width:1.5}
    .rcbs svg .rcbs-flow{fill:none;stroke:var(--ink);stroke-opacity:.32;stroke-width:1.3;stroke-dasharray:2 10;stroke-linecap:round;pointer-events:none}
    .rcbs svg.rcbs-anim .rcbs-flow{animation:rcbs-flow 1.1s linear infinite}
    @keyframes rcbs-flow{to{stroke-dashoffset:-12}}
    @media (prefers-reduced-motion:reduce){.rcbs svg.rcbs-anim .rcbs-flow{animation:none}}
    .rcbs svg .rcbs-st-up{stop-color:var(--up)} .rcbs svg .rcbs-st-info{stop-color:var(--info)} .rcbs svg .rcbs-st-dn{stop-color:var(--down)}
    .rcbs svg .rcbs-st-ink{stop-color:var(--ink)} .rcbs svg .rcbs-st-acc{stop-color:var(--accent)} .rcbs svg .rcbs-st-vio{stop-color:var(--violet)}
    .rcbs svg .rcbs-st-mut{stop-color:var(--muted)} .rcbs svg .rcbs-st-flame{stop-color:var(--flame)}
    .rcbs svg .rcbs-f-flame{fill:var(--flame)} .rcbs svg .rcbs-s-flame{stroke:var(--flame)}
    .rcbs svg .rcbs-pz1{fill:color-mix(in srgb,var(--gold) 92%,var(--bg))} .rcbs svg .rcbs-pz2{fill:color-mix(in srgb,var(--gold) 76%,var(--bg))}
    .rcbs svg .rcbs-pz3{fill:color-mix(in srgb,var(--flame) 80%,var(--bg))}
    .rcbs svg .rcbs-crust{fill:none;stroke:color-mix(in srgb,var(--flame) 65%,var(--gold));stroke-width:5}
    .rcbs svg .rcbs-cut{stroke:var(--bg);stroke-opacity:.75;stroke-width:1.2;fill:none}
    .rcbs-legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 16px;font:500 10.5px/1.3 var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em;background:var(--surface)}
    .rcbs-legend span{white-space:nowrap}
    .rcbs-legend i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:6px;vertical-align:-1px;background:var(--c)}
    .rcbs-legend i.dash{background:none;border-top:2px dashed var(--accent);border-radius:0;height:0;width:16px;vertical-align:3px}
    .rcbs-cw{background:var(--surface);container-type:inline-size}
    .rcbs-cw-in{display:grid;grid-template-columns:minmax(0,1fr)}
    @container (min-width:680px){.rcbs-cw-in.two{grid-template-columns:minmax(0,1fr) 232px}.rcbs-cw-in.two .rcbs-hop{border-top:0;border-left:1px solid var(--line)}}
    .rcbs-nav{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line)}
    .rcbs-nav .rcbs-hint{font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted);flex:1 1 220px}
    .rcbs-nav select{flex:1 1 110px;min-width:0;max-width:340px;min-height:34px;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:var(--r);font:500 13px var(--sans);padding:0 8px}
    .rcbs-card{padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px;min-width:0}
    .rcbs-card-h{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:6px 16px}
    .rcbs-kick{display:block;font:600 10.5px/1.2 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
    .rcbs-card h4{font-family:var(--display);font-weight:400;font-size:27px;line-height:1.02;letter-spacing:.01em;color:var(--ink);margin:4px 0 0;text-transform:uppercase}
    .rcbs-amt{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;font-family:var(--mono)}
    .rcbs-amt b{font-size:20px;color:var(--ink)}
    .rcbs-amt span{font-size:12.5px;color:var(--muted)}
    .rcbs-amt span.rcbs-up,.rcbs-lines .rcbs-up{color:var(--up)} .rcbs-amt span.rcbs-dn,.rcbs-lines .rcbs-dn{color:var(--down)}
    .rcbs-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
    @container (min-width:540px){.rcbs-grid{grid-template-columns:1fr 1fr}}
    .rcbs-cell{background:var(--bg);padding:12px 14px;display:flex;flex-direction:column;gap:5px;min-width:0}
    .rcbs .rcbs-cell p,.prose .rcbs-lines .rcbs-cell p{font-size:14.5px;line-height:1.55;color:color-mix(in srgb,var(--ink) 88%,transparent);margin:0;max-width:none}
    .rcbs .rcbs-cell p.rcbs-l,.prose .rcbs-lines .rcbs-cell p.rcbs-l{font:600 10.5px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .rcbs .rcbs-cell.hop p.rcbs-l,.prose .rcbs-lines .rcbs-cell.hop p.rcbs-l{color:var(--flame)}
    .rcbs .rcbs-cell.apl p.rcbs-l,.prose .rcbs-lines .rcbs-cell.apl p.rcbs-l{color:var(--info)}
    .rcbs .rcbs-cell.why p.rcbs-l,.prose .rcbs-lines .rcbs-cell.why p.rcbs-l{color:var(--accent)}
    .rcbs-cell b{color:var(--ink);font-weight:600}
    .rcbs-hop{border-top:1px solid var(--line);padding:12px 14px 14px;display:flex;flex-direction:column;gap:8px;background:var(--surface)}
    .rcbs-hop-h{display:flex;align-items:center;gap:8px;font:600 10.5px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--flame)}
    .rcbs-hop-h svg{width:22px;height:22px}
    .rcbs-t{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
    @container (min-width:420px) and (max-width:679px){.rcbs-t{grid-template-columns:1fr 1fr}}
    .rcbs-tc{display:flex;flex-direction:column;gap:1px}
    .rcbs-tc .rcbs-th{font:600 10px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:0 6px 3px}
    .rcbs-tc .rcbs-tr{display:flex;justify-content:space-between;gap:8px;font-size:13px;line-height:1.3;padding:4px 6px;border-radius:4px;color:var(--text)}
    .rcbs-tc .rcbs-tr b{font:500 12.5px var(--mono);color:var(--ink);white-space:nowrap}
    .rcbs-tc .rcbs-tr.tot{border-top:1px solid var(--line);border-radius:0;font-weight:600;color:var(--ink)}
    .rcbs-tc .rcbs-tr.hl{background:var(--accent-t);color:var(--ink);box-shadow:inset 3px 0 0 var(--accent)}
    .rcbs-hopnote{font-size:12.5px;line-height:1.45;color:var(--muted)}
    .rcbs-read{display:flex;flex-wrap:wrap;background:var(--surface)}
    .rcbs-read > .stat{flex:1 1 128px}
    .rcbs-st{border:0;text-align:left;font:inherit;cursor:pointer;color:inherit;border-radius:0}
    .rcbs-st:hover{background:var(--surface-2)}
    .rcbs-st.on{box-shadow:inset 0 -3px 0 var(--accent),1px 0 0 var(--line),0 1px 0 var(--line)}
    .rcbs-st:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
    .rcbs-sub{font:500 11px/1.3 var(--mono);color:var(--muted)}
    .rcbs-quick{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end}
    .rcbs-bar2{background:color-mix(in srgb,var(--bg) 40%,var(--surface))}
    .rcbs-lines{border:1px solid var(--line);border-radius:var(--r);overflow:hidden;background:var(--surface);container-type:inline-size;max-width:100%}
    .rcbs-lines .rcbs-gh{font:600 10.5px/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);padding:9px 16px;background:var(--bg);border-bottom:1px solid var(--line)}
    .rcbs-line + .rcbs-line{border-top:1px solid var(--line)}
    .rcbs-line > summary{list-style:none;cursor:pointer;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;padding:12px 16px}
    .rcbs-line > summary::-webkit-details-marker{display:none}
    .rcbs-line > summary:hover{background:var(--surface-2)}
    .rcbs-line > summary:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
    .rcbs-line .n{flex:1 1 220px;font:600 15px/1.35 var(--sans);color:var(--ink)}
    .rcbs-line .n::before{content:'+';display:inline-block;width:16px;font:600 14px var(--mono);color:var(--accent)}
    .rcbs-line[open] .n::before{content:'−'}
    .rcbs-line .v{font:600 14px var(--mono);color:var(--ink);white-space:nowrap}
    .rcbs-line .d{font:500 12.5px var(--mono);white-space:nowrap;color:var(--muted);min-width:96px;text-align:right}
    .rcbs-line > .rcbs-grid{margin:0 16px 14px}
    @container (max-width:480px){.rcbs-line .d{min-width:0;text-align:left}}
    @container (max-width:560px){.rcbs-nav .rcbs-hint{flex-basis:100%}}
  `);

  /* ======================================================================
     Shared card UI
     ====================================================================== */
  const cellsHTML = (t) => `<div class="rcbs-grid">
      <div class="rcbs-cell"><p class="rcbs-l">What it is</p><p>${t.what}</p></div>
      <div class="rcbs-cell hop"><p class="rcbs-l">At Hoppy’s cart</p><p>${t.hop}</p></div>
      <div class="rcbs-cell apl"><p class="rcbs-l">At Apple</p><p>${t.apple}</p></div>
      <div class="rcbs-cell why"><p class="rcbs-l">Why it matters · the stock</p><p>${t.why}</p></div></div>`;
  const cardBody = (t, kick) => `<div class="rcbs-card-h"><div><span class="rcbs-kick">${kick}</span><h4>${t.name}</h4></div><div class="rcbs-amt"><b>${t.amt}</b>${t.d ? `<span class="${t.dc || ''}">${t.d}</span>` : ''}</div></div>${cellsHTML(t)}`;
  const selectHTML = (groups, terms, cur) => groups.map((g) => `<optgroup label="${esc(g.t)}">${g.keys.map((k) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(terms[k].name)}</option>`).join('')}</optgroup>`).join('');
  /* body: the same cards as expandable statement lines */
  const linesHTML = (groups, terms, ids) => `<div class="rcbs-lines">${groups.filter((g) => !ids || ids.indexOf(g.id) >= 0).map((g) => `<div class="rcbs-gh">${g.t}</div>` + g.keys.map((k) => { const t = terms[k]; return `<details class="rcbs-line"><summary><span class="n">${t.name}</span><span class="v">${t.amt}</span><span class="d ${t.dc || ''}">${t.d || ''}</span></summary>${cellsHTML(t)}</details>`; }).join('')).join('')}</div>`;

  function makeCard(root, cw, groups, terms, onPick) {
    const order = [].concat(...groups.map((g) => g.keys));
    const grpOf = {}; groups.forEach((g) => g.keys.forEach((k) => { grpOf[k] = g.t; }));
    const sid = SML.uid('rks');
    cw.innerHTML = `<div class="rcbs-nav"><span class="rcbs-hint">Tap anything above, or walk the lines</span><button type="button" class="btn btn-g sm" data-nav="-1" aria-label="Previous line">◀ Prev</button><select id="${sid}" class="rcbs-sel" aria-label="Pick a line">${selectHTML(groups, terms, order[0])}</select><button type="button" class="btn btn-g sm" data-nav="1" aria-label="Next line">Next ▶</button></div><div class="rcbs-cw-in"><div class="rcbs-card" aria-live="polite"></div></div>`;
    const sel = cw.querySelector('select'), body = cw.querySelector('.rcbs-card');
    let cur = order[0];
    cw.addEventListener('click', (e) => { const b = e.target.closest('[data-nav]'); if (!b) return; const i = order.indexOf(cur); onPick(order[(i + Number(b.dataset.nav) + order.length) % order.length]); });
    sel.addEventListener('change', () => onPick(sel.value));
    return {
      show(k) { if (!terms[k]) return; cur = k; if (sel.value !== k) sel.value = k; const i = order.indexOf(k); body.innerHTML = cardBody(terms[k], `${grpOf[k] || ''} · ${i + 1} of ${order.length}`); },
      get cur() { return cur; },
      inner: cw.querySelector('.rcbs-cw-in'),
    };
  }
  const tile = (k, label, val, cls, sub, on) => `<button type="button" class="stat rcbs-st${on ? ' on' : ''}" data-k="${k}"><span class="stat-l">${label}</span><span class="stat-v ${cls || ''}">${val}</span>${sub ? `<span class="rcbs-sub">${sub}</span>` : ''}</button>`;

  /* ======================================================================
     balanceBlocks: assets vs liabilities + equity, always balancing
     ====================================================================== */
  const BNAME = {
    cash: ['Cash', 'Cash'], msCur: ['Short-term securities', 'ST securities'], ar: ['Accounts receivable', 'Receivables'],
    vendor: ['Vendor receivables', 'Vendor receiv.'], inv: ['Inventory', 'Inventory'], oca: ['Other current assets', 'Other current'],
    msNon: ['Long-term securities', 'LT securities'], ppe: ['Property & equipment', 'PP&E'], intang: ['Intangibles', 'Intangibles'], onca: ['Other long-term assets', 'Other long-term'],
    ap: ['Accounts payable', 'Payables'], ocl: ['Other current liab.', 'Other current'], defrev: ['Deferred revenue', 'Deferred rev.'], cp: ['Commercial paper', 'Comm. paper'],
    debtCur: ['Debt due within a year', 'Debt due < 1 yr'], debtNon: ['Long-term debt', 'Long-term debt'], oncl: ['Other long-term liab.', 'Other long-term'],
    EQ: ['Shareholders’ equity', 'Equity'],
  };
  const BLK2CARD = (k) => (k === 'EQ' ? 'equity' : k);
  const HOPMAP = {
    cash: ['h-cash'], ar: ['h-ar'], inv: ['h-inv'], ppe: ['h-ppe'], ap: ['h-ap'], defrev: ['h-def'], debtCur: ['h-loan'], debtNon: ['h-loan'], cp: ['h-loan'],
    equity: ['h-eq'], stock: ['h-eq'], re: ['h-eq'], aoci: ['h-eq'], bvps: ['h-eq'], pb: ['h-eq'],
    assets: ['h-cash', 'h-inv', 'h-ar', 'h-ppe', 'h-ta'], liabilities: ['h-ap', 'h-def', 'h-loan'], curr: ['h-cash', 'h-inv', 'h-ar', 'h-ap', 'h-def'],
    wc: ['h-cash', 'h-inv', 'h-ar', 'h-ap', 'h-def'], cr: ['h-cash', 'h-inv', 'h-ar', 'h-ap', 'h-def'], netcash: ['h-cash', 'h-loan'], de: ['h-loan', 'h-eq'], buyback: ['h-cash', 'h-eq'],
  };
  const hopHTML = () => {
    const r = (id, l, v, cls) => `<p class="rcbs-tr${cls ? ' ' + cls : ''}" data-h="${id}"><span>${l}</span><b>${v}</b></p>`;
    return `<div class="rcbs-hop"><p class="rcbs-hop-h">${SML.bunnyMark ? SML.bunnyMark(22) : ''}Hoppy’s Coffee Cart · end of June</p>
      <div class="rcbs-t"><div class="rcbs-tc"><p class="rcbs-th">Owns (assets)</p>${r('h-cash', 'Cash', '$6,000')}${r('h-inv', 'Beans and cups', '$1,000')}${r('h-ar', 'Unpaid invoice', '$800')}${r('h-ppe', 'Cart and machine', '$12,000')}${r('h-ta', 'Total', '$19,800', 'tot')}</div>
      <div class="rcbs-tc"><p class="rcbs-th">Owes + owner’s stake</p>${r('h-ap', 'Bean bill', '$700')}${r('h-def', 'Gift cards', '$300')}${r('h-loan', 'Cart loan', '$5,000')}${r('h-eq', 'Equity', '$13,800')}${r('h-tl', 'Total', '$19,800', 'tot')}</div></div>
      <p class="rcbs-hopnote">Same shape as Apple’s, with smaller numbers. The highlighted line matches the card.</p></div>`;
  };

  SML.widgets.balanceBlocks = function (root, opts) {
    opts = opts || {};
    root.classList.add('rcbs');
    const id = SML.uid('rkb');
    const state = { view: opts.view || 'cur', t: 1, sel: 'cash', played: false };
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'prev', label: 'Sep 2025' }, { v: 'cur', label: 'Jun 2026' }, { v: 'chg', label: 'What changed' }, { v: 'bb', label: 'Buyback' }], state.view, 'Which balance sheet')}<span class="grow"></span><button type="button" class="btn btn-a sm" id="${id}-play">▶ Play Sep → Jun</button></div>
      <div class="wg-fig"></div>
      <div class="rcbs-legend"><span><i style="--c:var(--info)"></i>Current asset</span><span><i style="--c:color-mix(in srgb,var(--info) 40%,var(--bg))"></i>Long-term asset</span><span><i style="--c:var(--down)"></i>Current liability</span><span><i style="--c:color-mix(in srgb,var(--down) 40%,var(--bg))"></i>Long-term liability</span><span><i style="--c:var(--up)"></i>Equity</span><span><i class="dash"></i>1-year line</span></div>
      <div class="rcbs-cw" id="${id}-cw"></div>
      <div class="wg-ctrl" id="${id}-ctrl">
        ${ui.slider({ id: id + '-px', label: 'Share price (for P/B and buybacks)', min: 150, max: 450, step: 0.01, value: PX, fmt: 'usd' })}
        <div class="rcbs-quick"><button type="button" class="btn btn-g sm" data-px="${PX}">Jul 30 close ${F.usd(PX)}</button><button type="button" class="btn btn-g sm" data-px="${PX2}">Jul 31 close, about ${F.usd(PX2, 0)}</button></div>
        <div data-only="bb">${ui.slider({ id: id + '-amt', label: 'Buyback size', min: 5000, max: 100000, step: 5000, value: 25000, fmt: (v) => B(v, 0) })}</div>
      </div>
      <div class="wg-read rcbs-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Apple’s balance sheet on June 27, 2026 (end of fiscal Q3 2026, the latest reported quarter as of October 2026) and September 27, 2025 (end of fiscal 2025), from Apple’s 8-K. Book value per share uses the June quarter’s average basic shares (${F.num(SH / 1000, 2)} billion). The buyback is taken from cash first, then securities, and from retained earnings for simplicity; it ignores the interest the cash would have earned. Prices are reported closes, not a live quote. Billions are rounded, so they may not add up exactly.</div>`;
    const fig = root.querySelector('.wg-fig');
    const cw = root.querySelector('#' + id + '-cw');
    const card = makeCard(root, cw, BGROUPS, BT, (k) => pick(k));
    const hopWrap = document.createElement('div'); hopWrap.innerHTML = hopHTML(); card.inner.appendChild(hopWrap.firstElementChild); card.inner.classList.add('two');
    function $(x) { return root.querySelector('#' + x); }
    const st = ui.wire(root, (e) => {
      const v = st.seg(id + '-v');
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-v')) { stopAnim(); state.view = v; if (v === 'bb') state.sel = 'buyback'; card.show(state.sel); }
      draw();
    });
    let raf = 0, alive = true;
    SML.onCleanup(() => { alive = false; cancelAnimationFrame(raf); });
    const stopAnim = () => { cancelAnimationFrame(raf); raf = 0; };
    root.querySelector('#' + id + '-play').addEventListener('click', () => {
      stopAnim(); state.played = true;
      if (SML.reduced()) { state.view = 'chg'; st.setSeg(id + '-v', 'chg'); draw(); return; }
      state.view = 'anim'; state.t = 0; st.setSeg(id + '-v', '__none');
      const t0 = performance.now(), dur = 2800;
      const step = (now) => {
        if (!alive || !root.isConnected) return;
        const t = Math.min(1, (now - t0) / dur); state.t = ease(t); draw();
        if (t < 1) raf = requestAnimationFrame(step); else { raf = 0; state.view = 'chg'; st.setSeg(id + '-v', 'chg'); draw(); }
      };
      raf = requestAnimationFrame(step);
    });
    root.addEventListener('click', (e) => {
      const q = e.target.closest('[data-px]'); if (q && root.contains(q)) { st.set(id + '-px', q.dataset.px); draw(); return; }
      const tl = e.target.closest('.rcbs-st[data-k]'); if (tl && root.contains(tl)) pick(tl.dataset.k);
    });
    fig.addEventListener('click', (e) => { const g = e.target.closest('[data-k]'); if (g) pick(g.dataset.k, true); });
    fig.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const g = e.target.closest('[data-k]'); if (!g) return; e.preventDefault(); pick(g.dataset.k, true); });
    let refocus = false;
    function pick(k, fromFig) { k = BLK2CARD(k); if (!BT[k]) return; state.sel = k; refocus = !!fromFig && document.activeElement && fig.contains(document.activeElement); card.show(k); draw(); }

    function valsFor() {
      const vw = state.view;
      if (vw === 'prev') return Object.assign({}, V.prev);
      if (vw === 'anim') { const o = {}; Object.keys(V.cur).forEach((k) => { o[k] = SML.lerp(V.prev[k], V.cur[k], state.t); }); return o; }
      const o = Object.assign({}, V.cur);
      if (vw === 'bb') { const amt = st.n(id + '-amt'); let rem = amt; ['cash', 'msCur', 'msNon'].forEach((k) => { const take = Math.min(o[k], rem); o[k] -= take; rem -= take; }); o.re -= amt; }
      return o;
    }
    const stackOf = (keys, v, y0, k) => { let y = y0; return keys.map((kk) => { const h = v[kk] * k; const r = { k: kk, v: v[kk], y0: y, y1: y + h }; y += h; return r; }); };
    function hlKeys(sel) {
      const m = { assets: ['@A'], liabilities: ['@L'], equity: ['EQ'], stock: ['EQ'], re: ['EQ'], aoci: ['EQ'], bvps: ['EQ'], pb: ['EQ'], netcash: ['cash', 'msCur', 'msNon', 'cp', 'debtCur', 'debtNon'], de: ['cp', 'debtCur', 'debtNon', 'EQ'], buyback: ['cash', 'EQ'], curr: ['@C'], wc: ['@C'], cr: ['@C'] };
      return m[sel] || [sel];
    }
    function inside(b, x, w, nm, val, tc) {
      const h = b.y1 - b.y0, inner = w - 10, cx = x + w / 2, cy = (b.y0 + b.y1) / 2;
      for (const n of nm) {
        if (h >= 31 && tw(n, 11.5, 0.6) <= inner && tw(val, 11.5, 0.62) <= inner) return S.text(cx, cy - 2, esc(n), 'sm b ' + tc, 'middle') + S.text(cx, cy + 12, val, 'sm mono ' + tc, 'middle');
        if (h >= 14 && tw(n, 11.5, 0.6) + tw(val, 11.5, 0.62) + 6 <= inner) return S.text(cx, cy + 4, `<tspan class="b">${esc(n)}</tspan> <tspan class="mono">${val}</tspan>`, 'sm ' + tc, 'middle');
      }
      for (const n of nm) if (h >= 14 && tw(n, 11.5, 0.6) <= inner) return S.text(cx, cy + 4, esc(n), 'sm b ' + tc, 'middle');
      return null;
    }
    function placeSide(items, lo, hi) {
      items.sort((a, b) => a.yw - b.yw);
      items.forEach((it, i) => { const p = items[i - 1]; it.y = Math.max(it.yw, p ? p.y + p.dn + it.up + 3 : lo + it.up); });
      for (let i = items.length - 1; i >= 0; i--) { const n = items[i + 1], lim = n ? n.y - n.up - items[i].dn - 3 : hi - items[i].dn; if (items[i].y > lim) items[i].y = lim; }
    }

    const draw = ui.responsive(fig, (W) => {
      const vw = state.view, v = valsFor(), m = M(v);
      const compact = W < 560;
      let colW, midW, xL, xR, gut;
      if (compact) { midW = 40; colW = Math.floor((W - 8 - midW) / 2); xL = 4; xR = xL + colW + midW; gut = 0; }
      else { colW = Math.round(SML.clamp(W * 0.19, 118, 158)); midW = Math.round(SML.clamp(W * 0.12, 64, 104)); gut = (W - 2 * colW - midW) / 2; xL = gut; xR = gut + colW + midW; }
      const top = 64, colH = compact ? 404 : 372, base = top + colH, k = colH / KMAX;
      const yTop = base - m.ta * k;
      const vR = Object.assign({ EQ: m.eq }, v);
      const left = stackOf(AK, v, yTop, k), right = stackOf(LK.concat(['EQ']), vR, yTop, k);
      const prevV = Object.assign({ EQ: MP.eq }, V.prev);
      let s = '';
      /* headers */
      const hdr = (cx, cap, val, sub, tapK) => `<g class="rcbs-tap" data-k="${tapK}" tabindex="0" role="button" aria-label="${esc(cap + ' ' + val)}">${S.rect(cx - colW / 2 - 4, 2, colW + 8, 56, 'rcbs-hit')}${S.text(cx, 16, cap, 'cap', 'middle')}${S.text(cx, 36, val, (compact ? 'md' : 'lg') + ' mono b ink', 'middle')}${sub ? S.text(cx, 53, sub, 'sm mono ' + (sub.indexOf('▼') === 0 ? 'dn' : 'up'), 'middle') : ''}</g>`;
      const showD = vw === 'chg';
      s += hdr(xL + colW / 2, 'ASSETS', B(m.ta), showD ? DLT(m.ta - MP.ta) + ' since Sep' : '', 'assets');
      s += hdr(xR + colW / 2, compact ? 'LIAB. + EQUITY' : 'LIABILITIES + EQUITY', compact ? B(m.tl) + ' + ' + B(m.eq) : B(m.tl) + ' + ' + B(m.eq), showD ? DLT(m.tl + m.eq - MP.tl - MP.eq) + ' since Sep' : '', 'liabilities');
      /* blocks */
      const ext = { l: [], r: [] };
      const sel = state.sel, hl = hlKeys(sel);
      let callout = null;
      const drawCol = (blocks, x, side) => {
        blocks.forEach((b) => {
          const isEq = b.k === 'EQ', cur = CUR[b.k];
          const cls = isEq ? 'rcbs-eq' : side === 'l' ? (cur ? 'rcbs-ac' : 'rcbs-an') : (cur ? 'rcbs-lc' : 'rcbs-ln');
          const tc = isEq || cur ? 'on' : 'ink';
          const h = b.y1 - b.y0, nm = BNAME[b.k];
          const val = showD ? DLT(b.v - prevV[b.k]) : B(b.v);
          s += `<g class="rcbs-blk" data-k="${b.k}" tabindex="0" role="button" aria-label="${esc(nm[0] + ' ' + B(b.v))}">`;
          s += S.rect(x, b.y0, colW, Math.max(0.8, h), 'b ' + cls);
          if (h < 10) s += S.rect(x, (b.y0 + b.y1) / 2 - 5, colW, 10, 'rcbs-hit');
          const lab = inside(b, x, colW, nm, val, tc);
          if (lab) s += lab;
          else if (!compact) ext[side === 'l' ? 'l' : 'r'].push({ k: b.k, yw: (b.y0 + b.y1) / 2, ym: (b.y0 + b.y1) / 2, nm, val });
          else if (hl.indexOf(b.k) >= 0) callout = { b, x, nm, val };
          s += '</g>';
          s += S.line(x, b.y1, x + colW, b.y1, 'rcbs-sep');
        });
      };
      drawCol(left, xL, 'l'); drawCol(right, xR, 'r');
      /* external labels (desktop) */
      ['l', 'r'].forEach((side) => {
        const its = ext[side]; if (!its.length) return;
        const room = gut - 22;
        its.forEach((it) => { const one = tw(it.nm[0], 11.5, 0.6) + tw(it.val, 11.5, 0.62) + 6 <= room; it.one = one; it.name = one || tw(it.nm[0], 11.5, 0.6) <= room ? it.nm[0] : it.nm[1]; it.up = it.one ? 8 : 12; it.dn = it.one ? 5 : 17; });
        placeSide(its, top + 6, base - 4);
        its.forEach((it) => {
          const xe = side === 'l' ? xL : xR + colW, dir = side === 'l' ? -1 : 1, xt = xe + dir * 16, anc = side === 'l' ? 'end' : 'start';
          const ty = it.one ? it.y + 4 : it.y - 2;
          s += `<g class="rcbs-tap" data-k="${it.k}">`;
          s += S.poly([[xe, it.ym], [xe + dir * 6, it.ym], [xt - dir * 3, it.y]], 's-mut');
          if (it.one) s += S.text(xt, ty, `<tspan class="b ink">${esc(it.name)}</tspan> <tspan class="mono">${it.val}</tspan>`, 'sm', anc);
          else s += S.text(xt, ty, esc(it.name), 'sm b ink', anc) + S.text(xt, ty + 14, it.val, 'sm mono', anc);
          s += '</g>';
        });
      });
      /* 1-year line */
      const yA = yTop + m.ca * k, yR = yTop + m.cl * k, gx0 = xL + colW, gx1 = xR;
      const lineHL = hl.indexOf('@C') >= 0;
      s += S.line(xL - 3, yA, gx0, yA, 's-acc dash ' + (lineHL ? 'w3' : 'w15')) + S.line(xR, yR, xR + colW + 3, yR, 's-acc dash ' + (lineHL ? 'w3' : 'w15')) + S.line(gx0, yA, gx1, yR, 's-acc dash ' + (lineHL ? 'w25' : 'w15'));
      const lyl = Math.min(yA, yR) - 7;
      s += S.text((gx0 + gx1) / 2, lyl, midW >= 92 ? '1-YEAR LINE' : midW >= 56 ? '1 YEAR' : '1 YR', 'cap acc', 'middle');
      s += S.text((gx0 + gx1) / 2, Math.max(yA, yR) + 16, (midW >= 92 ? 'ratio ' : '') + x2(m.cr), 'sm mono acc', 'middle');
      /* equals sign */
      const yEqS = (Math.max(yA, yR) + base) / 2 + 10;
      s += S.text((gx0 + gx1) / 2, yEqS, '=', 'xxl ink', 'middle');
      /* ghosts */
      if (vw === 'chg') {
        const yS = base - MP.ta * k;
        const lt = compact ? 'SEP' : 'SEP 2025', lw = tw(lt, 10.5, 0.78) / 2 + 5, cxm = (gx0 + gx1) / 2;
        s += S.line(xL - 10, yS, xL - 1, yS, 'rcbs-ghostl w2') + S.line(gx0 + 1, yS, cxm - lw, yS, 'rcbs-ghostl w2') + S.line(cxm + lw, yS, gx1 - 1, yS, 'rcbs-ghostl w2') + S.line(xR + colW + 1, yS, xR + colW + 10, yS, 'rcbs-ghostl w2');
        s += S.text(cxm, yS + 4, lt, 'cap', 'middle');
      }
      if (vw === 'bb') {
        const amt = st.n(id + '-amt'), gh = amt * k;
        s += S.rect(xL, yTop - gh, colW, gh, 'rcbs-ghost', 2);
        const eqTop = base - m.eq * k;
        s += S.rect(xR, eqTop - gh, colW, gh, 'rcbs-ghost', 2);
        const gl = (cx, y, txt) => { const w = tw(txt, 11.5, 0.6) + 12; return S.rect(cx - w / 2, y - 10, w, 18, 'rcbs-pill', 4) + S.text(cx, y + 3.5, txt, 'sm b dn', 'middle'); };
        s += gl(xL + colW / 2, yTop - gh / 2, '−' + B(amt, 0) + ' cash');
        if (!compact) { const t2 = '−' + B(amt, 0) + ' equity', w2 = tw(t2, 11.5, 0.6) + 12, px2 = xR + colW + 14; s += S.line(xR + colW + 1, eqTop - gh / 2, px2, eqTop - gh / 2, 's-dn') + S.rect(px2, eqTop - gh / 2 - 10, w2, 18, 'rcbs-pill', 4) + S.text(px2 + w2 / 2, eqTop - gh / 2 + 3.5, t2, 'sm b dn', 'middle'); }
        else s += gl(xR + colW / 2, eqTop - gh / 2, '−' + B(amt, 0) + ' equity');
      }
      /* selection outlines */
      const outline = (x, y0, y1) => S.rect(x - 2, y0 - 2, colW + 4, Math.max(3, y1 - y0) + 4, 'nf s-acc w25', 3);
      hl.forEach((h) => {
        if (h === '@A') s += outline(xL, yTop, base);
        else if (h === '@L') s += outline(xR, yTop, base - m.eq * k);
        else if (h === '@C') { s += outline(xL, yTop, yA); s += outline(xR, yTop, yR); }
        else { const b = left.find((q) => q.k === h) || right.find((q) => q.k === h); if (b) s += outline(left.indexOf(b) >= 0 ? xL : xR, b.y0, b.y1); }
      });
      if (callout) {
        const b = callout.b, txt = `<tspan class="b ink">${esc(callout.nm[1])}</tspan> <tspan class="mono ink">${callout.val}</tspan>`;
        const w = Math.min(colW + 30, tw(callout.nm[1], 11.5, 0.6) + tw(callout.val, 11.5, 0.62) + 22);
        let cx = callout.x + colW / 2; cx = SML.clamp(cx, w / 2 + 2, W - w / 2 - 2);
        const cy = SML.clamp((b.y0 + b.y1) / 2, top + 12, base - 12);
        s += S.rect(cx - w / 2, cy - 10, w, 20, 'rcbs-pill', 4) + S.text(cx, cy + 4, txt, 'sm', 'middle');
      }
      /* inside equity: horizontal waterfall */
      const y0 = base + 30;
      const sx0 = compact ? 2 : Math.max(4, xL - Math.min(gut - 8, 150)), sx1 = compact ? W - 2 : Math.min(W - 4, xR + colW + Math.min(gut - 8, 150));
      const labW = compact ? 114 : 150, valW = compact ? 58 : 74;
      const bx0 = sx0 + labW, bx1 = sx1 - valW - 6;
      const SX = SML.lin(0, Math.max(V.cur.stock + V.cur.re, V.prev.stock) * 1.02, bx0, bx1);
      s += S.text(sx0, y0, 'INSIDE EQUITY', 'cap') + (vw === 'chg' ? S.text(sx1, y0, 'DASHED = SEP 2025', 'cap', 'end') : '');
      s += S.line(SX(0), y0 + 8, SX(0), y0 + 8 + 4 * 21, 's-mut');
      const rows = [{ k: 'stock', n: 'Paid-in capital', v: v.stock, pv: V.prev.stock, abs: true }, { k: 're', n: 'Retained earnings', v: v.re, pv: V.prev.re }, { k: 'aoci', n: 'Other (AOCI)', v: v.aoci, pv: V.prev.aoci }, { k: 'equity', n: 'Equity', v: m.eq, pv: MP.eq, abs: true, tot: true }];
      let run = 0, prun = 0;
      rows.forEach((r, i) => {
        const y = y0 + 12 + i * 21, a = r.abs ? 0 : run, b2 = r.abs ? r.v : run + r.v, pa = r.abs ? 0 : prun, pb = r.abs ? r.pv : prun + r.pv;
        const on = sel === r.k;
        s += `<g class="rcbs-tap" data-k="${r.k}" tabindex="0" role="button" aria-label="${esc(r.n + ' ' + B(r.v))}">${S.rect(sx0, y - 2, sx1 - sx0, 20, on ? 'f-acc-t' : 'rcbs-hit', 3)}`;
        s += S.text(sx0 + 4, y + 12, r.n, 'sm ' + (r.tot ? 'b ink' : 'ink'));
        if (vw === 'chg') s += S.rect(SX(Math.min(pa, pb)), y + 1, Math.abs(SX(pb) - SX(pa)), 13, 'rcbs-ghostl', 2);
        s += S.rect(SX(Math.min(a, b2)), y + 2, Math.max(1.5, Math.abs(SX(b2) - SX(a))), 11, r.tot ? 'rcbs-eq' : r.v >= 0 ? 'f-up o70' : 'f-dn', 2);
        if (i < rows.length - 1) s += S.line(SX(b2), y + 13, SX(b2), y + 23, 's-mut dash2');
        s += S.text(sx1, y + 12, r.abs ? B(r.v) : SB(r.v), 'sm mono b ' + (r.tot ? 'ink' : r.v >= 0 ? 'up' : 'dn'), 'end');
        s += '</g>';
        if (!r.abs) { run = b2; prun = pb; } else { run = r.v; prun = r.pv; }
      });
      const H = y0 + 12 + 4 * 21 + 6;
      const label = 'Apple balance sheet as two stacked columns: assets on the left equal liabilities plus equity on the right';
      fig.innerHTML = S.wrap(W, H, label, s);
      if (refocus) { const el = fig.querySelector(`[data-k="${state.sel === 'equity' ? 'EQ' : state.sel}"]`); if (el && el.focus) el.focus(); refocus = false; }
      updateSide(v, m);
    });

    function updateSide(v, m) {
      const vw = state.view, sel = state.sel;
      root.querySelectorAll('[data-only]').forEach((el) => { el.hidden = el.dataset.only !== vw; });
      const ctrl = $(id + '-ctrl'); if (ctrl) ctrl.hidden = !(vw === 'cur' || vw === 'bb');
      const px = st.n(id + '-px');
      let tiles = '', msg = '';
      if (vw === 'prev') {
        tiles = tile('netcash', 'Net cash', B(m.net), 'up', 'cash + securities − debt', sel === 'netcash') + tile('cr', 'Current ratio', x2(m.cr), 'dn', 'below 1', sel === 'cr') + tile('wc', 'Working capital', B(m.wc), 'dn', 'current assets − liabilities', sel === 'wc') + tile('de', 'Debt / equity', x2(m.de), '', B(m.debt) + ' of debt', sel === 'de') + tile('equity', 'Equity', B(m.eq), '', 'book value', sel === 'equity');
        msg = ui.msg('info', 'Sep 27, 2025', `At its fiscal year end Apple owed ${bn(-m.wc)} more in the next 12 months than its current assets (current ratio ${x2(m.cr)}). Not a crisis: it also held ${bn(v.msNon)} of long-term securities it could sell. Retained earnings were below zero, at ${bn(v.re)}.`);
      } else if (vw === 'anim') {
        tiles = tile('equity', 'Equity', B(m.eq), 'up', '', false) + tile('re', 'Retained earnings', SB(v.re), v.re >= 0 ? 'up' : 'dn', '', false) + tile('netcash', 'Net cash', B(m.net), 'up', '', false) + tile('cr', 'Current ratio', x2(m.cr), '', '', false) + tile('inv', 'Inventory', B(v.inv), '', '', false);
        msg = ui.msg('acc', 'Playing', `Nine months of Apple’s business, from September 27, 2025 to June 27, 2026. Watch equity grow and retained earnings cross zero.`);
      } else if (vw === 'chg') {
        tiles = tile('equity', 'Equity', SB(MC.eq - MP.eq), 'up', B(MP.eq) + ' → ' + B(MC.eq), sel === 'equity') + tile('re', 'Retained earnings', SB(V.cur.re - V.prev.re), 'up', B(V.prev.re) + ' → ' + SB(V.cur.re), sel === 're') + tile('netcash', 'Net cash', SB(MC.net - MP.net), 'up', B(MP.net) + ' → ' + B(MC.net), sel === 'netcash') + tile('de', 'Debt', SB(MC.debt - MP.debt), 'dn', B(MP.debt) + ' → ' + B(MC.debt), sel === 'de') + tile('inv', 'Inventory', F.spct(pc(V.cur.inv, V.prev.inv), 0), 'acc', B(V.prev.inv) + ' → ' + B(V.cur.inv), sel === 'inv');
        msg = ui.msg('up', 'Nine months', `Equity rose ${bn(MC.eq - MP.eq)} to ${bn(MC.eq)}, and retained earnings flipped from ${bn(V.prev.re)} to ${sbn(V.cur.re)}. Debt fell ${bn(MP.debt - MC.debt)} (commercial paper alone ${bn(V.prev.cp - V.cur.cp)}), so net cash grew from ${bn(MP.net)} to ${bn(MC.net)}. Inventory nearly doubled: tap it to see why that can go either way.`);
      } else if (vw === 'bb') {
        const amt = st.n(id + '-amt'), ret = amt / px, sh1 = SH - ret, shd1 = SHD - ret;
        const eps0 = NIQ / SHD, eps1 = NIQ / shd1, bv0 = BVPS, bv1 = m.eq / sh1;
        tiles = tile('buyback', 'Shares retired', F.num(ret, 1) + 'M', 'vio', F.pct(ret / SH * 100, 2) + ' of all shares', sel === 'buyback') + tile('cash', 'Cash + securities', B(m.cs), 'dn', 'was ' + B(MC.cs), sel === 'cash') + tile('equity', 'Equity', B(m.eq), 'dn', 'was ' + B(MC.eq), sel === 'equity') + tile('eps', 'EPS, June qtr', F.usd(eps1), 'up', 'was ' + F.usd(eps0) + ' (' + F.spct(pc(eps1, eps0), 2) + ')', false) + tile('bvps', 'Book value / share', F.usd(bv1), 'dn', 'was ' + F.usd(bv0), sel === 'bvps');
        msg = ui.msg('vio', 'Buyback', `Spending ${bn(amt, 0)} at ${F.usd(px)} a share retires ${F.num(ret, 1)} million shares. Cash and equity both drop ${bn(amt, 0)}, so the sheet still balances. June-quarter EPS rises from ${F.usd(eps0)} to ${F.usd(eps1)} because the same profit is split among fewer shares, while book value per share falls from ${F.usd(bv0)} to ${F.usd(bv1)} because Apple pays far more than book for each share.`);
      } else {
        const pb = px / BVPS;
        tiles = tile('netcash', 'Net cash', B(m.net), 'up', 'cash + securities − debt', sel === 'netcash') + tile('cr', 'Current ratio', x2(m.cr), 'acc', 'current assets ÷ liabilities', sel === 'cr') + tile('de', 'Debt / equity', x2(m.de), '', B(m.debt) + ' ÷ ' + B(m.eq), sel === 'de') + tile('bvps', 'Book value / share', F.usd(BVPS), '', B(m.eq) + ' ÷ ' + F.num(SH / 1000, 2) + 'B sh.', sel === 'bvps') + tile('pb', 'Price / book', F.num(pb, 1) + '×', 'acc', 'at ' + F.usd(px), sel === 'pb');
        msg = ui.msg('up', 'Balanced', `Apple owns ${bn(m.ta)} and owes ${bn(m.tl)}; the ${bn(m.eq)} left over is shareholders’ equity. The 1-year line sits almost level on both sides (current ratio ${x2(m.cr)}), and cash plus securities beat all debt by ${bn(m.net)}. At ${F.usd(px)} a share, investors pay ${F.num(pb, 0)} times book value.`);
      }
      const rd = $(id + '-read'); if (rd) rd.innerHTML = tiles;
      const mg = $(id + '-msg'); if (mg) mg.innerHTML = msg;
      const hk = HOPMAP[sel] || [];
      cw.querySelectorAll('.rcbs-tr').forEach((el) => el.classList.toggle('hl', hk.indexOf(el.dataset.h) >= 0));
    }
    card.show(state.view === 'bb' ? 'buyback' : state.sel);
    if (state.view === 'bb') state.sel = 'buyback';
    draw();
  };

  /* ======================================================================
     cashRiver: nine months of Apple cash as a river, profit vs cash, shares and EPS
     ====================================================================== */
  const USES = [
    { k: 'buyback', v: C.bb, n: ['Buybacks', 'Buybacks'], c: 'vio' },
    { k: 'debt', v: C.debt, n: ['Debt repaid', 'Debt repaid'], c: 'info' },
    { k: 'div', v: C.div, n: ['Dividends', 'Dividends'], c: 'up' },
    { k: 'sec', v: C.sec, n: ['Parked in securities', 'Securities'], c: 'info' },
    { k: 'taxes', v: C.taxes, n: ['Employee stock taxes', 'Stock-pay tax'], c: 'mut' },
    { k: 'other', v: C.other, n: ['Other', 'Other'], c: 'mut' },
    { k: 'cashUp', v: C.cashUp, n: ['Added to cash', 'Cash grew'], c: 'up' },
  ].filter((u) => u.v > 0);
  const band = (x1, a0, a1, x2v, b0, b1) => { const xm = (x1 + x2v) / 2; return `M${SML.R1(x1)} ${SML.R1(a0)}C${SML.R1(xm)} ${SML.R1(a0)} ${SML.R1(xm)} ${SML.R1(b0)} ${SML.R1(x2v)} ${SML.R1(b0)}L${SML.R1(x2v)} ${SML.R1(b1)}C${SML.R1(xm)} ${SML.R1(b1)} ${SML.R1(xm)} ${SML.R1(a1)} ${SML.R1(x1)} ${SML.R1(a1)}Z`; };
  const midline = (x1, a, x2v, b) => { const xm = (x1 + x2v) / 2; return `M${SML.R1(x1)} ${SML.R1(a)}C${SML.R1(xm)} ${SML.R1(a)} ${SML.R1(xm)} ${SML.R1(b)} ${SML.R1(x2v)} ${SML.R1(b)}`; };
  function bridgeRows(p, brk) {
    const r = [{ k: 'ni', n: ['Net income', 'Net income'], v: p.ni, abs: true, c: 'up' }, { k: 'da', n: ['+ Depreciation', '+ Depreciation'], v: p.da }, { k: 'sbc', n: ['+ Stock pay', '+ Stock pay'], v: p.sbc }, { k: 'oth', n: ['Other adjustments', 'Other'], v: p.oth }];
    if (brk) p.wcItems.forEach((w) => r.push({ k: 'wc', n: WCN[w.k], v: w.v, sub: true }));
    else r.push({ k: 'wc', n: ['Working capital', 'Working capital'], v: p.wc });
    r.push({ k: 'op', n: ['= Operating cash', '= Operating cash'], v: p.op, abs: true, c: 'info', tot: true }, { k: 'capex', n: ['− Capex', '− Capex'], v: -p.capex }, { k: 'fcf', n: ['= Free cash flow', '= Free cash'], v: p.fcf, abs: true, c: 'acc', tot: true });
    return r;
  }
  const BRIDGE_MAX = (() => { let mx = 0; [C, CY].forEach((p) => [false, true].forEach((brk) => { let run = 0; bridgeRows(p, brk).forEach((r) => { run = r.abs ? r.v : run + r.v; mx = Math.max(mx, run); }); })); return mx * 1.03; })();
  const lerpCF = (a, b, t) => { const o = {}; Object.keys(a).forEach((k) => { o[k] = typeof a[k] === 'number' ? SML.lerp(a[k], b[k], t) : a[k]; }); o.wcItems = a.wcItems.map((w, i) => ({ k: w.k, v: SML.lerp(w.v, b.wcItems[i].v, t) })); return o; };

  SML.widgets.cashRiver = function (root, opts) {
    opts = opts || {};
    root.classList.add('rcbs');
    const id = SML.uid('rkc');
    const state = { view: opts.view || 'river', sel: 'fcf', per: 'cur', p: C, brk: false };
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'river', label: 'Cash river' }, { v: 'bridge', label: 'Profit vs cash' }, { v: 'eps', label: 'Shares & EPS' }], state.view, 'View')}<span class="grow"></span><span class="pill" id="${id}-pill">9 months to Jun 27, 2026</span></div>
      <div class="wg-bar rcbs-bar2" data-only="bridge">${ui.seg(id + '-p', [{ v: 'cur', label: '9 mo to Jun 2026' }, { v: 'ya', label: '9 mo to Jun 2025' }], 'cur', 'Period')}${ui.chips(id + '-wc', [{ k: 'wc', label: 'Break out working capital', color: 'var(--down)' }])}</div>
      <div class="wg-fig"></div>
      <div class="rcbs-cw" id="${id}-cw"></div>
      <div class="wg-ctrl" data-only="eps">${ui.slider({ id: id + '-sh', label: 'What if the share count were… (diluted, millions)', min: 14000, max: 15500, step: 0.1, value: Math.round(SHD * 10) / 10, fmt: (v) => F.num(v, 1) + 'M' })}<div class="rcbs-quick"><button type="button" class="btn btn-g sm" data-sh="${Math.round(SHD * 10) / 10}">Actual, June 2026</button><button type="button" class="btn btn-g sm" data-sh="${Math.round(SHDY * 10) / 10}">A year earlier (no shrink)</button></div></div>
      <div class="wg-read rcbs-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    const $ = (x) => root.querySelector('#' + x);
    const card = makeCard(root, $(id + '-cw'), CGROUPS, CT, (k) => pick(k));
    const st = ui.wire(root, (e) => {
      const t = e && e.target && e.target.closest ? e.target : null;
      if (t && t.closest('#' + id + '-v')) { state.view = st.seg(id + '-v'); const d = { river: 'fcf', bridge: 'op', eps: 'eps' }[state.view]; state.sel = d; card.show(d); }
      if (t && t.closest('#' + id + '-p')) { const np = st.seg(id + '-p'); if (np !== state.per) morph(np); }
      if (t && t.closest('#' + id + '-wc')) { state.brk = st.on(id + '-wc', 'wc'); }
      draw();
    });
    let raf = 0, alive = true;
    SML.onCleanup(() => { alive = false; cancelAnimationFrame(raf); });
    function morph(np) {
      const from = state.p, to = np === 'cur' ? C : CY; state.per = np;
      cancelAnimationFrame(raf);
      if (SML.reduced()) { state.p = to; draw(); return; }
      const t0 = performance.now(), dur = 650;
      const step = (now) => { if (!alive || !root.isConnected) return; const t = Math.min(1, (now - t0) / dur); state.p = t < 1 ? lerpCF(from, to, ease(t)) : to; draw(); if (t < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }
    root.addEventListener('click', (e) => {
      const q = e.target.closest('[data-sh]'); if (q && root.contains(q)) { st.set(id + '-sh', q.dataset.sh); draw(); return; }
      const tl = e.target.closest('.rcbs-st[data-k]'); if (tl && root.contains(tl)) pick(tl.dataset.k);
    });
    fig.addEventListener('click', (e) => { const g = e.target.closest('[data-k]'); if (g) pick(g.dataset.k, true); });
    fig.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const g = e.target.closest('[data-k]'); if (!g) return; e.preventDefault(); pick(g.dataset.k, true); });
    let refocus = false;
    function pick(k, fromFig) { if (!CT[k]) return; state.sel = k; refocus = !!fromFig && document.activeElement && fig.contains(document.activeElement); card.show(k); draw(); }

    /* ---------- river ---------- */
    function river(W) {
      const compact = W < 600, sel = state.sel, nw = compact ? 8 : 12;
      const xa = compact ? 2 : 10, xb = Math.round(W * (compact ? 0.33 : 0.3)), xc = compact ? null : Math.round(W * 0.52), xd = compact ? W - 104 : Math.round(W - Math.min(232, W * 0.29));
      const top0 = 54, flowH = compact ? 336 : 340, gap = compact ? 7 : 8, nD = USES.length + 1;
      const k = (flowH - (nD - 1) * gap) / C.op;
      const gid = SML.uid('rkg');
      let defs = '', s = '', nodes = '', labels = '';
      const grads = {};
      const grad = (a, b) => { const key = a + '-' + b; if (!grads[key]) { grads[key] = gid + '-' + Object.keys(grads).length; defs += `<linearGradient id="${grads[key]}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="rcbs-st-${a}"/><stop offset="1" class="rcbs-st-${b}"/></linearGradient>`; } return grads[key]; };
      const link = (key, c1, c2, x1, a0, a1, x2v, b0, b1, aria) => {
        const on = sel === key;
        let g = `<g class="rcbs-lnk${on ? ' on' : ''}" data-k="${key}" tabindex="0" role="button" aria-label="${esc(aria)}"><path d="${band(x1, a0, a1, x2v, b0, b1)}" class="rcbs-band" fill="url(#${grad(c1, c2)})"/>`;
        if (a1 - a0 > 3) g += `<path d="${midline(x1, (a0 + a1) / 2, x2v, (b0 + b1) / 2)}" class="rcbs-flow"/>`;
        return g + '</g>';
      };
      const node = (key, x, y0, h, c, aria) => `<g class="rcbs-lnk${sel === key ? ' on' : ''}" data-k="${key}">${S.rect(x, y0, nw, Math.max(1.5, h), c === 'flame' ? 'rcbs-f-flame' : 'f-' + c, 2)}${sel === key ? S.rect(x - 2.5, y0 - 2.5, nw + 5, Math.max(1.5, h) + 5, 'nf s-acc w2', 3) : ''}</g>`;
      /* column A: net income + non-cash */
      const gapA = 6, niY = top0, ncY = top0 + C.ni * k + gapA;
      nodes += node('ni', xa, niY, C.ni * k, 'up') + node('noncash', xa, ncY, C.noncash * k, 'info');
      /* column B: operating cash + working-capital sink */
      const opY = top0, opH = C.op * k, leak = Math.max(0, -C.wc), sinkY = opY + opH + 18, sinkH = leak * k;
      nodes += node('op', xb, opY, opH, 'ink') + (leak ? node('wc', xb, sinkY, sinkH, 'dn') : '');
      s += link('ni', 'up', 'ink', xa + nw, niY, niY + C.ni * k, xb, opY, opY + C.ni * k, 'Net income ' + B(C.ni) + ' flows into operating cash');
      const ncMain = (C.noncash - leak) * k;
      s += link('noncash', 'info', 'ink', xa + nw, ncY, ncY + ncMain, xb, opY + C.ni * k, opY + opH, 'Non-cash costs ' + SB(C.noncash) + ' added back');
      if (leak) s += link('wc', 'info', 'dn', xa + nw, ncY + ncMain, ncY + C.noncash * k, xb, sinkY, sinkY + sinkH, 'Working capital used ' + B(leak));
      /* column D nodes */
      const dY = []; let y = top0;
      dY.push({ k: 'capex', v: C.capex, y0: y, y1: y + C.capex * k, c: 'flame', n: ['Capex (new equipment)', 'Capex'] }); y += C.capex * k + gap;
      USES.forEach((u) => { dY.push({ k: u.k, v: u.v, y0: y, y1: y + u.v * k, c: u.c, n: u.n }); y += u.v * k + gap; });
      const dBottom = y - gap;
      /* op -> capex */
      s += link('capex', 'ink', 'flame', xb + nw, opY, opY + C.capex * k, xd, dY[0].y0, dY[0].y1, 'Capex ' + B(C.capex));
      /* op -> FCF (desktop) and FCF -> uses */
      let srcX, srcY = opY + C.capex * k, fcfC = 'ink';
      if (!compact) {
        const fY = top0 + C.capex * k + gap, fH = C.fcf * k;
        s += link('fcf', 'ink', 'acc', xb + nw, opY + C.capex * k, opY + opH, xc, fY, fY + fH, 'Free cash flow ' + B(C.fcf));
        nodes += node('fcf', xc, fY, fH, 'acc');
        srcX = xc + nw; srcY = fY; fcfC = 'acc';
        labels += `<g class="rcbs-tap" data-k="fcf">${S.text(xc - 10, fY + fH / 2 - 4, 'Free cash flow', 'md b acc rcbs-halo', 'end')}${S.text(xc - 10, fY + fH / 2 + 14, B(C.fcf), 'lg mono b acc rcbs-halo', 'end')}</g>`;
      } else srcX = xb + nw;
      let cum = srcY;
      dY.slice(1).forEach((d) => { const h = d.v * k; s += link(d.k, fcfC, d.c, srcX, cum, cum + h, xd, d.y0, d.y1, CT[d.k].name + ' ' + B(d.v)); cum += h; });
      dY.forEach((d) => { nodes += node(d.k, xd, d.y0, d.y1 - d.y0, d.c); });
      if (compact) {
        const fy0 = (opY + C.capex * k + opY + opH) / 2, fy1 = (dY[1].y0 + dBottom) / 2, fcy = (fy0 + fy1) / 2 - 30;
        const w = 110, fcx = Math.min((xb + nw + xd) / 2, xd - w / 2 - 4);
        labels += `<g class="rcbs-tap" data-k="fcf" tabindex="0" role="button" aria-label="Free cash flow ${B(C.fcf)}">${S.rect(fcx - w / 2, fcy - 16, w, 40, 'rcbs-pill', 6)}${S.text(fcx, fcy, 'FREE CASH FLOW', 'rcbs-cap2 acc', 'middle')}${S.text(fcx, fcy + 17, B(C.fcf), 'md mono b acc', 'middle')}</g>`;
      }
      /* labels: column A (inside bands) */
      const aLab = (key, y0, h, n1, v1, cls) => `<g class="rcbs-tap" data-k="${key}">${h >= 30 ? S.text(xa + nw + 8, y0 + h / 2 - 3, n1, (compact ? 'sm' : 'md') + ' b ink rcbs-halo') + S.text(xa + nw + 8, y0 + h / 2 + 13, v1, (compact ? 'sm' : 'md') + ' mono b ' + cls + ' rcbs-halo') : S.text(xa + nw + 8, y0 + h / 2 + 4, n1 + ' ' + v1, 'sm b ink rcbs-halo')}</g>`;
      labels += aLab('ni', niY, C.ni * k, 'Net income', B(C.ni), 'up') + aLab('noncash', ncY, C.noncash * k, compact ? 'Non-cash' : 'Non-cash costs', SB(C.noncash), 'info');
      /* op label above node */
      const opx = SML.clamp(xb + nw / 2, 60, W - 60);
      labels += `<g class="rcbs-tap" data-k="op">${S.text(opx, top0 - 26, 'OPERATING CASH', 'cap', 'middle')}${S.text(opx, top0 - 9, B(C.op), (compact ? 'md' : 'lg') + ' mono b ink', 'middle')}</g>`;
      if (!compact) labels += S.text(xa, 14, 'WHERE THE CASH CAME FROM', 'cap') + S.text(W - 2, 14, 'WHERE IT WENT', 'cap', 'end');
      /* sink label */
      if (leak) { const sx = SML.clamp(xb + nw / 2, 56, W - 56); labels += `<g class="rcbs-tap" data-k="wc">` + (compact ? S.text(sx, sinkY + sinkH + 15, 'Working capital', 'sm b dn', 'middle') + S.text(sx, sinkY + sinkH + 29, SB(C.wc), 'sm mono b dn', 'middle') : S.text(sx, sinkY + sinkH + 16, `<tspan class="b">Working capital</tspan> <tspan class="mono">${SB(C.wc)}</tspan>`, 'sm dn', 'middle')) + '</g>'; }
      /* column D labels with collision avoidance */
      const lx = xd + nw + 8, room = W - lx - 2;
      const its = dY.map((d) => { const one = !compact && tw(d.n[0], 13, 0.6) + tw(B(d.v), 13, 0.62) + 6 <= room; return { d, one, name: compact ? d.n[1] : d.n[0], yw: (d.y0 + d.y1) / 2, h: one ? 18 : 30 }; });
      let yy = top0 - 2; its.forEach((it) => { it.y = Math.max(it.yw, yy); yy = it.y + it.h; });
      its.forEach((it) => {
        const d = it.d, vc = d.c === 'mut' ? 'ink' : d.c === 'flame' ? 'acc' : d.c;
        labels += `<g class="rcbs-tap" data-k="${d.k}" tabindex="0" role="button" aria-label="${esc(CT[d.k].name + ' ' + B(d.v))}">`;
        if (Math.abs(it.y - it.yw) > 2) labels += S.poly([[xd + nw, it.yw], [xd + nw + 3, it.yw], [lx - 2, it.y]], 's-mut');
        if (it.one) labels += S.text(lx, it.y + 4.5, `<tspan class="b ink">${esc(it.name)}</tspan> <tspan class="mono b ${vc}">${B(d.v)}</tspan>`, 'md');
        else labels += S.text(lx, it.y - 1, esc(it.name), 'sm b ink') + S.text(lx, it.y + 13, B(d.v), 'sm mono b ' + vc);
        labels += '</g>';
      });
      const H = Math.max(dBottom, sinkY + sinkH + (compact ? 36 : 24), yy, ncY + C.noncash * k) + 10;
      return { H, body: `<defs>${defs}</defs>${s}${nodes}${labels}`, label: 'Apple nine-month cash flow drawn as a river from net income to operating cash, free cash flow, buybacks, dividends and debt' };
    }

    /* ---------- profit vs cash bridge ---------- */
    function bridge(W) {
      const compact = W < 520, p = state.p, rows = bridgeRows(p, state.brk), sel = state.sel;
      const labW = compact ? 0 : 170, valW = compact ? 0 : 84, x0 = compact ? 4 : labW + 6, x1 = compact ? W - 4 : W - valW - 6;
      const X = SML.lin(0, BRIDGE_MAX, x0, x1), rh = compact ? 34 : 27, top = 30;
      const per = state.per === 'cur' ? 'LATE SEP 2025 – JUN 2026' : 'LATE SEP 2024 – JUN 2025';
      let s = compact ? S.text(0, 14, per, 'cap') : S.text(0, 14, 'FROM PROFIT TO CASH', 'cap') + S.text(W, 14, per, 'cap', 'end');
      let run = 0;
      rows.forEach((r, i) => {
        const y = top + i * rh, a = r.abs ? 0 : run, b = r.abs ? r.v : run + r.v;
        const on = sel === r.k;
        const cls = r.abs ? (r.c === 'acc' ? 'f-acc' : r.c === 'info' ? 'f-info' : 'f-up') : r.v >= 0 ? 'f-up o70' : 'f-dn';
        const by = compact ? y + 17 : y + 5, bh = compact ? 11 : rh - 12, ty = compact ? y + 12 : y + rh / 2 + 3;
        s += `<g class="rcbs-tap" data-k="${r.k}" tabindex="0" role="button" aria-label="${esc(r.n[0] + ' ' + B(r.v))}">${S.rect(0, y, W, rh - 2, on ? 'f-acc-t' : 'rcbs-hit', 3)}`;
        s += S.text(r.sub ? 14 : 4, ty, esc(compact ? r.n[1] : r.n[0]), (r.sub || compact ? 'sm' : 'md') + (r.tot ? ' b ink' : r.sub ? '' : ' ink'));
        s += S.rect(X(Math.min(a, b)), by, Math.max(1.5, Math.abs(X(b) - X(a))), bh, cls, 2);
        s += S.text(W - 2, ty, r.abs ? B(r.v) : SB(r.v), 'sm mono b ' + (r.abs ? (r.c === 'acc' ? 'acc' : 'ink') : r.v >= 0 ? 'up' : 'dn'), 'end');
        s += '</g>';
        if (i < rows.length - 1) s += S.line(X(b), by + bh, X(b), y + rh + (compact ? 17 : 5), 's-mut dash2');
        run = b;
      });
      const yEnd = top + rows.length * rh;
      const nx = X(p.ni);
      s += S.line(nx, top + (compact ? 28 : rh - 4), nx, yEnd + 2, 's-acc dash w15');
      s += S.text(SML.clamp(nx, x0 + 40, x1 - 40), yEnd + 16, 'net income line', 'sm acc', 'middle');
      return { H: yEnd + 24, body: s, label: 'Waterfall from net income to operating cash and free cash flow' };
    }

    /* ---------- shares & EPS pizzas ---------- */
    function pizza(cx, cy, r, n, cls3, key) {
      let s = `<g class="rcbs-tap" data-k="${key}" tabindex="0" role="button" aria-label="Profit pie cut into ${F.num(n, 2)} slices of one billion shares each">`;
      const ang = (2 * Math.PI) / n, full = Math.floor(n);
      const P = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
      for (let i = 0; i < Math.ceil(n); i++) {
        const a0 = -Math.PI / 2 + i * ang, a1 = Math.min(a0 + ang, -Math.PI / 2 + 2 * Math.PI - 1e-6);
        const p0 = P(a0, r), p1 = P(a1, r), large = a1 - a0 > Math.PI ? 1 : 0;
        const cls = i >= full ? cls3 : i % 2 ? 'rcbs-pz2' : 'rcbs-pz1';
        s += `<path d="M${SML.R1(cx)} ${SML.R1(cy)}L${SML.R1(p0[0])} ${SML.R1(p0[1])}A${SML.R1(r)} ${SML.R1(r)} 0 ${large} 1 ${SML.R1(p1[0])} ${SML.R1(p1[1])}Z" class="${cls}"/>`;
      }
      for (let i = 0; i < Math.ceil(n); i++) { const p0 = P(-Math.PI / 2 + i * ang, r); s += S.line(cx, cy, p0[0], p0[1], 'rcbs-cut'); }
      s += S.circle(cx, cy, r, 'rcbs-crust');
      return s + '</g>';
    }
    function epsFig(W) {
      const compact = W < 520, shN = st.n(id + '-sh'), eps1 = NIQ / shN, sel = state.sel;
      const rmax = compact ? 54 : 74, r2 = rmax, r1 = rmax * Math.sqrt(NIQY / NIQ);
      const cx1 = Math.round(W * (compact ? 0.26 : 0.3)), cx2 = Math.round(W * (compact ? 0.74 : 0.7)), cy = 34 + rmax;
      let s = S.text(cx1, 16, compact ? 'JUN 2025 QTR' : 'JUNE 2025 QUARTER', 'cap', 'middle') + S.text(cx2, 16, compact ? 'JUN 2026 QTR' : 'JUNE 2026 QUARTER', 'cap', 'middle');
      s += pizza(cx1, cy, r1, SHDY / 1000, 'rcbs-pz3', 'eps') + pizza(cx2, cy, r2, shN / 1000, 'rcbs-pz3', 'eps');
      s += S.arrow(cx1 + r1 + 12, cy, cx2 - r2 - 12, cy, 'mut', 8);
      if (!compact) s += S.text((cx1 + cx2) / 2, cy - 10, 'pie +' + F.num(pc(NIQ, NIQY), 1) + '%', 'sm acc', 'middle');
      const cap = (cx, ni, sh, eps) => S.text(cx, cy + rmax + 20, `<tspan class="ink b">${B(ni)}</tspan> profit`, 'sm', 'middle') + S.text(cx, cy + rmax + 36, `÷ ${F.num(sh / 1000, 2)}B shares`, 'sm mono', 'middle') + S.text(cx, cy + rmax + 56, F.usd(eps), 'xl mono b acc', 'middle');
      s += cap(cx1, NIQY, SHDY, EPSQY) + cap(cx2, NIQ, shN, eps1);
      /* comparison rows */
      const y0 = cy + rmax + 84, rh = compact ? 36 : 24;
      const rows = [
        { k: 'niq', n: 'Net income (pie)', a: B(NIQY), b: B(NIQ), d: pc(NIQ, NIQY) },
        { k: 'shares', n: 'Diluted shares (slices)', a: F.num(SHDY, 0) + 'M', b: F.num(SHD, 0) + 'M', d: pc(SHD, SHDY) },
        { k: 'eps', n: 'EPS (slice), reported', a: F.usd(EPSQY), b: F.usd(EPSQ), d: pc(EPSQ, EPSQY) },
      ];
      s += S.line(0, y0 - 6, W, y0 - 6, 's-line');
      rows.forEach((r, i) => {
        const y = y0 + i * rh, on = sel === r.k;
        s += `<g class="rcbs-tap" data-k="${r.k}" tabindex="0" role="button" aria-label="${esc(r.n)}">${S.rect(0, y - 2, W, rh - 2, on ? 'f-acc-t' : 'rcbs-hit', 3)}`;
        if (compact) { s += S.text(4, y + 12, r.n, 'sm b ink') + S.text(4, y + 28, r.a + ' → ' + r.b, 'sm mono') + S.text(W - 4, y + 28, F.spct(r.d, 1), 'sm mono b ' + (r.d >= 0 ? 'up' : 'dn'), 'end'); }
        else { s += S.text(4, y + 14, r.n, 'md ink') + S.text(W * 0.62, y + 14, r.a + '  →  ' + r.b, 'sm mono', 'middle') + S.text(W - 4, y + 14, F.spct(r.d, 1), 'md mono b ' + (r.d >= 0 ? 'up' : 'dn'), 'end'); }
        s += '</g>';
      });
      const yN = y0 + rows.length * rh + 14;
      const ratio = (NIQ / NIQY) / (SHD / SHDY);
      const foot = wrap(`${x2r(NIQ / NIQY)} ÷ ${x2r(SHD / SHDY)} ≈ ${F.num(ratio, 2)}: about ${F.spct((ratio - 1) * 100, 0)} before EPS is rounded to the cent.`, W - 8, 11.5).concat(wrap(`Dividend: $${DIV.perShare.toFixed(2)} a share each quarter, about ${B(DIV.perShare * SH, 1)} across ${F.num(SH / 1000, 2)}B shares.`, W - 8, 11.5));
      foot.forEach((ln, i) => { s += S.text(4, yN + i * 17, ln, 'sm mut'); });
      return { H: yN + (foot.length - 1) * 17 + 10, body: s, label: 'Two profit pies cut into one-billion-share slices: fewer slices make each slice grow faster than the pie' };
    }
    const x2r = (v) => F.num(v, 3);
    const wrap = (txt, maxW, px) => { const out = []; let ln = ''; txt.split(' ').forEach((w) => { const t = ln ? ln + ' ' + w : w; if (tw(t, px, 0.56) > maxW && ln) { out.push(ln); ln = w; } else ln = t; }); if (ln) out.push(ln); return out; };

    const draw = ui.responsive(fig, (W) => {
      root.querySelectorAll('[data-only]').forEach((el) => { el.hidden = el.dataset.only !== state.view; });
      const out = state.view === 'bridge' ? bridge(W) : state.view === 'eps' ? epsFig(W) : river(W);
      fig.innerHTML = S.wrap(W, out.H, out.label, out.body, state.view === 'river' && !SML.reduced() ? 'rcbs-anim' : '');
      if (refocus) { const el = fig.querySelector(`[data-k="${state.sel}"][tabindex]`); if (el && el.focus) el.focus(); refocus = false; }
      side();
    });
    function side() {
      const vw = state.view, sel = state.sel;
      const pill = $(id + '-pill'); if (pill) pill.textContent = vw === 'eps' ? 'June quarter 2026 vs 2025' : vw === 'bridge' ? 'Nine months, two years' : '9 months to Jun 27, 2026';
      let tiles = '', msg = '', note = '';
      if (vw === 'river') {
        tiles = tile('op', 'Operating cash', B(C.op), '', F.spct(pc(C.op, CY.op), 1) + ' vs a year ago', sel === 'op') + tile('capex', 'Capex', B(C.capex), '', 'new equipment', sel === 'capex') + tile('fcf', 'Free cash flow', B(C.fcf), 'acc', 'operating cash − capex', sel === 'fcf') + tile('buyback', 'Buybacks + dividends', B(C.bb + C.div), 'vio', F.pct((C.bb + C.div) / C.fcf * 100, 0) + ' of free cash flow', sel === 'buyback');
        msg = ui.msg('acc', 'Follow the cash', `Profit of ${bn(C.ni)}, with non-cash costs added back and a little cash tied up in working capital, became ${bn(C.op)} of operating cash. After ${bn(C.capex)} of capex, ${bn(C.fcf)} was free. The biggest stream, ${bn(C.bb)}, went to buying back shares.`);
        note = 'Apple’s cash flow statement for the nine months ended June 27, 2026 (Apple’s fiscal year starts in late September), from Apple’s 8-K. "Debt repaid" is term debt plus commercial paper, net. Band widths are to scale. Tap any stream, node or label.';
      } else if (vw === 'bridge') {
        const p = state.per === 'cur' ? C : CY, gapPC = p.op - p.ni;
        tiles = tile('ni', 'Net income', B(p.ni), 'up', '', sel === 'ni') + tile('op', 'Operating cash', B(p.op), '', x2(p.op / p.ni) + '× net income', sel === 'op') + tile('wc', 'Working capital', SB(p.wc), p.wc >= 0 ? 'up' : 'dn', 'cash tied up (−) or freed (+)', sel === 'wc') + tile('fcf', 'Free cash flow', B(p.fcf), 'acc', '', sel === 'fcf');
        if (gapPC >= 0) msg = ui.msg('up', 'Cash beat profit', `Operating cash of ${bn(p.op)} beat profit of ${bn(p.ni)} by ${bn(gapPC)}: ${bn(p.noncash)} of non-cash costs were added back, and working capital used only ${bn(-p.wc)}.`);
        else { const big = p.wcItems.slice().sort((a, b) => a.v - b.v); msg = ui.msg('dn', 'Cash trailed profit', `A year earlier, operating cash of ${bn(p.op)} came in ${bn(-gapPC)} below profit of ${bn(p.ni)}. Working capital used ${bn(-p.wc)}, mostly ${WCN[big[0].k][0].toLowerCase()} (${sbn(big[0].v)}) and ${WCN[big[1].k][0].toLowerCase()} (${sbn(big[1].v)}).`); }
        note = 'Same nine months, two years: late September to June of fiscal 2026 and of fiscal 2025. Green steps add cash, red steps use it. The dashed line marks net income, so you can see whether cash ended up above or below profit.';
      } else {
        const shN = st.n(id + '-sh'), e1 = NIQ / shN, g1 = (e1 / (NIQY / SHDY) - 1) * 100;
        tiles = tile('niq', 'Net income', F.spct(pc(NIQ, NIQY), 1), 'up', B(NIQY) + ' → ' + B(NIQ), sel === 'niq') + tile('shares', 'Diluted shares', F.spct(pc(SHD, SHDY), 1), 'dn', F.num(SHDY, 0) + 'M → ' + F.num(SHD, 0) + 'M', sel === 'shares') + tile('eps', 'EPS, reported', F.spct(pc(EPSQ, EPSQY), 1), 'up', F.usd(EPSQY) + ' → ' + F.usd(EPSQ), sel === 'eps') + tile('eps', 'EPS at your count', F.usd(e1), 'acc', F.spct(g1, 1) + ' vs a year ago, unrounded', false);
        const atYa = Math.abs(shN - SHDY) < 1;
        msg = atYa ? ui.msg('info', 'No shrink', `With last year’s share count, EPS would be ${F.usd(e1)}, growing exactly as fast as profit (${F.spct(g1, 1)}). The buybacks are what pushed reported EPS up to ${F.usd(EPSQ)}.`)
          : ui.msg('up', 'Fewer slices', `Profit grew ${F.pct(pc(NIQ, NIQY), 1)}, but it was split among ${F.pct(-pc(SHD, SHDY), 1)} fewer shares, so each share’s slice grew faster: reported EPS rose ${F.pct(pc(EPSQ, EPSQY), 1)}, from ${F.usd(EPSQY)} to ${F.usd(EPSQ)}. Drag the share count to see EPS at ${F.num(shN, 1)} million shares: ${F.usd(e1)}.`);
        note = 'June quarter (April to June) 2026 vs 2025. One slice = the profit for one billion shares, so a slice in billions of dollars equals EPS in dollars. The orange sliver is the last, partial billion. Pie areas are to scale.';
      }
      const rd = $(id + '-read'); if (rd) rd.innerHTML = tiles;
      const mg = $(id + '-msg'); if (mg) mg.innerHTML = msg;
      const nt = $(id + '-note'); if (nt) nt.textContent = note;
    }
    card.show(state.sel);
    draw();
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  const SRC = A.sources;
  const srcPick = (...idx) => idx.map((i) => SRC[i]).filter(Boolean);
  const tip = (html) => { try { return SML.bunnyTip ? SML.bunnyTip(html) : ''; } catch (e) { return ''; } };

  SML.lessons.push({
    id: 'l-rc-apple-balance', course: 'realco', order: 3, title: 'Apple’s balance sheet, line by line', mins: 14, level: 'Beginner',
    summary: 'What Apple owns, owes and keeps, with every real number and why it matters.',
    idea: 'A balance sheet is a snapshot: what a company owns, what it owes, and what is left for shareholders. It always balances.',
    widget: 'balanceBlocks', opts: {},
    try: 'Tap any block for its card, flip between September and June, press Play, then try a buyback.',
    body: [
      `<h3>One snapshot, one equation</h3><p>A balance sheet is a photo of a single day. Apple’s latest is from <b>June 27, 2026</b>, the last day of its fiscal third quarter: ${A.fiscalNote} It is the latest reported quarter as of October 2026; the next report comes on November 2, 2026. Apple compares it with <b>September 27, 2025</b>, the end of its last fiscal year, so we do too.</p><p>Every balance sheet obeys one rule: <b>assets = liabilities + shareholders’ equity</b>. Everything the company owns was paid for with other people’s money (liabilities) or with the owners’ money (equity). At Hoppy’s Coffee Cart: $19,800 = $6,000 + $13,800. At Apple${EQN_M ? ', which reports in millions' : ''}: ${EQN}.${EQN_M ? ` Rounded, that is about ${bn(MC.ta)} of assets.` : ''}</p>`,
      `<h3>The 1-year line</h3><p>Each side is split by time. <b>Current</b> assets should turn into cash within 12 months; <b>current</b> liabilities are due within 12 months. Everything else is long-term. Apple’s current assets (${bn(MC.ca)}) and current liabilities (${bn(MC.cl)}) are almost exactly level: a current ratio of ${x2(MC.cr)}. In September it was ${x2(MP.cr)}.</p>` + linesHTML(BGROUPS, BT, ['big']),
      `<h3>What Apple owns</h3><p>Ten lines, from the most liquid to the least. Tap a line to open its card. The big stories: ${bn(MC.cs)} of cash and securities, and inventory that nearly doubled.</p>` + linesHTML(BGROUPS, BT, ['own']),
      `<h3>What Apple owes</h3><p>Seven lines. Most of what Apple owes is bills to suppliers and other short-term items. Debt (commercial paper plus term debt) is ${bn(MC.debt)}, down from ${bn(MP.debt)} in September.</p>` + linesHTML(BGROUPS, BT, ['owe']),
      `<h3>What belongs to shareholders</h3><p>Equity rose ${bn(MC.eq - MP.eq)} in nine months, to ${bn(MC.eq)}. The headline: <b>retained earnings flipped from ${bn(V.prev.re)} to ${sbn(V.cur.re)}</b>. A negative number there did not mean Apple lost money. It meant Apple had handed back more through buybacks and dividends than all the profit it had ever earned.</p>` + linesHTML(BGROUPS, BT, ['eq']) + tip('Before you judge any line, ask "compared with what?" A number next to last quarter, last year and the company’s own sales tells you far more than the number alone.'),
      `<h3>Six health checks</h3><p>Ratios turn the raw lines into answers: can Apple pay its bills, how much debt does it carry, and what do investors pay for its book value? These are the same checks from <a href="#l-ratios">Five numbers to check</a>, with real numbers.</p>` + linesHTML(BGROUPS, BT, ['chk']),
      `<h3>How the balance sheet moves the stock</h3><ul><li><b>Safety sets the multiple.</b> ${bn(MC.net)} of net cash makes it very unlikely Apple is ever forced to raise money at a bad time. Investors pay a higher P/E for lower risk (<a href="#l-rc-price">how earnings move the price</a>).</li><li><b>Cash is fuel for payouts.</b> The pile pays for buybacks, which shrink the share count and lift EPS. The <a href="#l-rc-apple-cash">cash flow lesson</a> follows that money.</li><li><b>Changes are early clues.</b> Inventory, receivables and debt moving fast get questions on the <a href="#l-rc-apple-call">earnings call</a> before they show up in profits.</li><li><b>Book value rarely sets Apple’s price.</b> At about ${F.num(PX / BVPS, 0)} times book, investors pay for earning power, not assets.</li><li><b>Slow, not sudden.</b> On results day, prices jump on earnings and guidance. The balance sheet works more slowly, through risk and payouts.</li></ul><p>Want every line side by side? Open the <a href="#tool-statements">real statement explorer</a>, or review the basics in <a href="#l-statements">The three statements</a>.</p>`,
    ],
    example: {
      title: 'Check Apple’s balance sheet in five steps',
      intro: 'June 27, 2026 figures from Apple’s statement.',
      steps: [
        `Check that it balances${EQN_M ? '. Apple reports in millions' : ''}: ${EQN.replace(' = ', ' of assets = ').replace(' + ', ' of liabilities + ')} of equity.`,
        `Current ratio: current assets ${bn(MC.ca)} ÷ current liabilities ${bn(MC.cl)} = ${x2(MC.cr)}. Next year’s bills are just covered.`,
        `Net cash: cash ${bn(V.cur.cash)} + securities ${bn(V.cur.msCur + V.cur.msNon)} = ${bn(MC.cs)}, minus debt ${bn(MC.debt)} (commercial paper ${bn(V.cur.cp)} + term debt ${bn(V.cur.debtCur + V.cur.debtNon)}) = ${bn(MC.net)}.`,
        `Debt to equity: ${bn(MC.debt)} ÷ ${bn(MC.eq)} = ${x2(MC.de)}.`,
        `Book value per share: ${bn(MC.eq)} ÷ ${F.num(SH / 1000, 2)} billion shares = ${F.usd(BVPS)}. At the July 30 close of ${F.usd(PX)}, price to book is about ${F.num(PX / BVPS, 0)}.`,
      ],
      result: 'A cash-rich company with a thin 1-year cushion backed by long-term securities, modest debt, and a price set by its earning power rather than its book value.',
    },
    mistakes: [
      'Reading negative retained earnings as "Apple lost money". At Apple it came from years of buybacks and dividends larger than all the profit it had ever earned.',
      'Panicking at a current ratio near 1 without checking the long-term securities a company can sell any day.',
      'Counting only cash and forgetting marketable securities, or forgetting commercial paper when you add up debt.',
      'Using price to book on a company whose real value (brand, software, loyal customers) is not on the balance sheet, or ignoring a line that suddenly doubles, like inventory, without asking why.',
    ],
    points: [
      `Assets = liabilities + equity, always. Apple: ${EQN}.`,
      `Current means within a year; Apple’s current ratio is ${x2(MC.cr)}.`,
      `Net cash (cash and securities minus debt) is ${bn(MC.net)}, up from ${bn(MP.net)} in September.`,
      `Retained earnings turned positive (${sbn(V.cur.re)}) as nine months of profit beat dividends and buybacks.`,
      `Equity grew ${bn(MC.eq - MP.eq)}; book value is about ${F.usd(BVPS)} a share, far below the share price.`,
    ],
    terms: ['Balance sheet', 'Shareholders’ equity', 'Current ratio', 'Net cash', 'Retained earnings', 'Price to book'],
    glossary: [
      { t: 'Vendor non-trade receivables', d: 'Money Apple’s manufacturing partners owe it for components Apple bought and resold to them.' },
      { t: 'Book value per share', d: 'Shareholders’ equity divided by the number of shares.' },
      { t: 'Accumulated other comprehensive income', full: 'AOCI', d: 'Gains and losses not yet counted in profit, mostly on bond investments and currency.' },
    ],
    quiz: { q: `Apple’s retained earnings were ${bn(V.prev.re)} in September 2025. What does that most likely mean?`, options: ['Apple lost money for years', 'Apple had paid out more in buybacks and dividends than all the profit it had ever earned', 'Apple owed more than it owned'], answer: 1, why: `Apple earned ${bn(C.ni)} in just nine months. The negative number came from returning even more than it had ever earned, mostly through buybacks; equity overall was still positive.` },
    sources: srcPick(0, 3, 1),
  });

  SML.lessons.push({
    id: 'l-rc-apple-cash', course: 'realco', order: 4, title: 'Apple’s cash flow: where the money went', mins: 12, level: 'Beginner',
    summary: 'Nine months of Apple’s real cash: from profit to buybacks, dividends and debt.',
    idea: 'Profit is an accounting number; cash is what actually lands in the bank. Follow Apple’s cash from the register to shareholders.',
    widget: 'cashRiver', opts: {},
    try: 'Tap any stream of the river for its card, then switch to Profit vs cash and Shares & EPS.',
    body: [
      `<h3>Why profit and cash differ</h3><p>At Hoppy’s Coffee Cart, June profit was $3,040. Add back $200 of wear on the espresso machine (a cost, but no cash left), subtract $300 for extra beans stocked, add $100 for a bean bill not yet paid: operating cash is $3,040. A new $600 grinder leaves $2,440 of free cash flow, and the owner takes a $1,000 dividend.</p><p>Apple works the same way, only bigger. Its cash flow statement covers the nine months from late September 2025 to June 27, 2026, the first three quarters of its fiscal year. Net income was ${bn(C.ni)}; operating cash was ${bn(C.op)}.</p>`,
      `<h3>Three sections, one change in cash</h3><ul><li><b>Operating:</b> cash from running the business, ${sbn(C.op)}.</li><li><b>Investing:</b> equipment and securities, ${sbn(C.invTot)}.</li><li><b>Financing:</b> buybacks, dividends and debt, ${sbn(C.finTot)}.</li></ul><p>Add them up and cash rose ${bn(C.cashUp)}, from ${bn(C.begin)} to ${bn(C.end)}: exactly the cash line on the <a href="#l-rc-apple-balance">balance sheet</a>.</p>`,
      `<h3>From net income to operating cash</h3><p>Two kinds of corrections turn profit into cash: costs that used no cash this period, and money tied up in or freed from the day-to-day loop of customers, inventory and suppliers.</p>` + linesHTML(CGROUPS, CT, ['op']),
      `<h3>Capex and free cash flow</h3><p>Apple spent ${bn(C.capex)} on equipment and buildings, so <b>free cash flow was ${bn(C.fcf)}</b>. That is the money it could use any way it liked.</p>` + linesHTML(CGROUPS, CT, ['inv']),
      `<h3>Where the cash went</h3><p>Buybacks took the biggest share, ${bn(C.bb)}. Dividends were ${bn(C.div)}, and Apple repaid ${bn(C.repay)} of term debt and ${bn(C.cpRepay)} of commercial paper.</p>` + linesHTML(CGROUPS, CT, ['use']),
      `<h3>Fewer shares, faster EPS</h3><p>In the June quarter, net income rose ${F.pct(pc(NIQ, NIQY), 1)} but diluted EPS rose ${F.pct(pc(EPSQ, EPSQY), 1)}, from ${F.usd(EPSQY)} to ${F.usd(EPSQ)}. The difference is the buybacks: the diluted share count fell ${F.pct(-pc(SHD, SHDY), 1)}, so the same pie was cut into fewer slices. At Hoppy’s the share count never changes, so its EPS grows exactly as fast as its profit.</p>` + linesHTML(CGROUPS, CT, ['ps']) + tip('When a company brags about EPS growth, put it next to net income growth. If EPS grows much faster, ask how much came from shrinking the share count and how much from the business.'),
      `<h3>How cash flow moves the stock</h3><ul><li><b>Free cash flow pays for EPS growth.</b> Steady buybacks shrink the share count, and price ≈ EPS × P/E (<a href="#l-rc-price">how earnings move the price</a>).</li><li><b>Quality check.</b> Operating cash of ${x2(C.op / C.ni)} times net income says the profit is real cash. Watch one-time items too, like Apple’s tariff refunds (<a href="#l-rc-apple-income">the income statement</a>).</li><li><b>Capex tells the strategy.</b> Apple spent ${bn(C.capex)} in nine months; ${SPX_CAPEX ? `SpaceX spent ${bn(SPX_CAPEX)} in one quarter` : 'SpaceX spent far more'} and burns cash as a result (<a href="#l-rc-spacex">SpaceX lesson</a>).</li><li><b>Payouts set expectations.</b> Investors count on Apple’s buybacks and dividend. A cut would be read as a warning about future cash.</li></ul>`,
    ],
    example: {
      title: 'Follow nine months of Apple’s cash',
      intro: 'Nine months to June 27, 2026, from Apple’s cash flow statement.',
      steps: [
        `Start with net income: ${bn(C.ni)}.`,
        `Add back non-cash costs: depreciation ${bn(C.da)} + stock pay ${bn(C.sbc)} + other ${sbn(C.oth)} = ${sbn(C.noncash)}.`,
        (() => { const f = sumFmt([C.ni, C.noncash, C.wc], C.op); return `Working capital used ${bn(-C.wc)} net. ${f === mn ? 'In Apple’s own millions: ' : 'So '}operating cash = ${f(C.ni)} + ${f(C.noncash)} − ${f(-C.wc)} = ${f(C.op)}.`; })(),
        `Subtract capex of ${bn(C.capex)}: free cash flow = ${bn(C.fcf)}.`,
        `Pay out: buybacks ${bn(C.bb)} + dividends ${bn(C.div)} = ${bn(C.bb + C.div)}, or ${F.pct((C.bb + C.div) / C.fcf * 100, 0)} of free cash flow. Repay ${bn(C.debt)} of debt.`,
        `The rest went to securities (${bn(C.sec)}, still Apple’s money), taxes on employee stock (${bn(C.taxes)}) and other items (${bn(C.other)}). Cash itself rose ${bn(C.cashUp)}, from ${bn(C.begin)} to ${bn(C.end)}.`,
      ],
      result: `Net income ${F.spct(pc(NIQ, NIQY), 1)}, shares ${F.spct(pc(SHD, SHDY), 1)}, EPS ${F.spct(pc(EPSQ, EPSQY), 1)}: the buybacks turned profit growth into faster EPS growth.`,
    },
    mistakes: [
      'Treating net income as cash. Check operating cash flow and free cash flow every time.',
      'Forgetting capex: operating cash looks great at companies that must spend heavily just to keep going.',
      'Counting cash parked in securities as "spent". It is still the company’s money, in another pocket.',
      'Ignoring stock pay: it is added back as non-cash, but it creates new shares that buybacks must soak up.',
    ],
    points: [
      `Operating cash = profit + non-cash costs ± working capital: ${bn(C.op)} against ${bn(C.ni)} of profit.`,
      `Free cash flow = operating cash − capex: ${bn(C.fcf)} in nine months.`,
      `Buybacks (${bn(C.bb)}) were the biggest use of cash, then debt repayment (${bn(C.debt)}) and dividends (${bn(C.div)}).`,
      `A shrinking share count makes EPS grow faster than net income: ${F.spct(pc(EPSQ, EPSQY), 1)} vs ${F.spct(pc(NIQ, NIQY), 1)}.`,
      `The dividend is $${DIV.perShare.toFixed(2)} a share each quarter.`,
    ],
    terms: ['Cash flow statement', 'Operating cash flow', 'Free cash flow', 'Capex', 'Buyback', 'Share count'],
    glossary: [{ t: 'Working capital (change)', d: 'Cash tied up in or freed from receivables, inventory and payables during a period.' }],
    quiz: { q: `Apple’s June-quarter net income rose ${F.pct(pc(NIQ, NIQY), 1)}, but EPS rose ${F.pct(pc(EPSQ, EPSQY), 1)}. Why?`, options: ['Apple sold more iPhones', 'Buybacks cut the number of shares, so each share got a bigger slice', 'Apple paid less tax'], answer: 1, why: `The diluted share count fell ${F.pct(-pc(SHD, SHDY), 1)}, so the same profit was split among fewer shares.` },
    sources: srcPick(0, 1),
  });
})();
