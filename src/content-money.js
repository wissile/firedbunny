/* Tracks, the Retirement & Wealth and FIRE courses, their tools and shared glossary terms. Loaded after content.js. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg;

  /* ---------- tracks ---------- */
  SML.tracks = [
    { id: 'trading', n: 1, title: 'Trading', short: 'Trading', blurb: 'Stocks, charts, options, the wheel, risk, value investing, trader taxes and trading with AI.' },
    { id: 'wealth', n: 2, title: 'Retirement & Wealth', short: 'Wealth', blurb: 'Budget, company benefits, retirement accounts, taxes, debt, banking, housing and retiring early or late.' },
    { id: 'fire', n: 3, title: 'FIRE', short: 'FIRE', full: 'Financial independence, retire early', blurb: 'Find your number, choose where to live, cut the tax bill, cover health care and stress-test the plan.' },
  ];
  SML.courses.forEach((c) => { if (!c.track) c.track = 'trading'; });

  const C = (track, id, n, title, blurb, level) => ({ track, id, n, title, blurb, level });
  SML.courses.push(
    C('wealth', 'money', 1, 'Money Foundations', 'Budget, track spending, see what small habits cost and build a cash cushion.', 'Start here'),
    C('wealth', 'debt', 2, 'Debt & Credit', 'Credit scores, card debt, 0% APR transfers, car loans and smart leverage.', 'Essential'),
    C('wealth', 'banking', 3, 'Banking & Cards', 'Relationship banking tiers, private client perks and travel money with no foreign fees.', 'Beginner'),
    C('wealth', 'benefits', 4, 'Company Benefits', 'The 401(k) match and limits, mega backdoor Roth, HSA, RSUs, ESPP and stock options.', 'Essential'),
    C('wealth', 'accounts', 5, 'Retirement Accounts', 'Roth or traditional, IRAs, the backdoor Roth, Social Security and Medicare.', 'Essential'),
    C('wealth', 'invest', 6, 'Investing for Decades', 'Compound growth, index funds, asset allocation and where extra money should go.', 'Beginner'),
    C('wealth', 'wtax', 7, 'Smart Taxes', 'Brackets, deductions, tax-loss harvesting with fund pairs and how the wheel is taxed.', 'Intermediate'),
    C('wealth', 'home', 8, 'Home & Real Estate', 'Rent or buy, mortgages, home taxes, rental property and Airbnb.', 'Intermediate'),
    C('wealth', 'protect', 9, 'Protect What You Build', 'Insurance, wills and beneficiaries, and the scams that target savers.', 'Essential'),
    C('wealth', 'retire', 10, 'Early or Late Retirement', 'Pick a retirement age, plan the income and run the ten-year countdown.', 'Intermediate'),
    C('fire', 'fi-basics', 1, 'Your FIRE Number', 'What FIRE means, your true spending, your number and the savings rate that gets you there.', 'Start here'),
    C('fire', 'fi-where', 2, 'Where Will You Live?', 'Cost of living around the world, van life, travel, household size and visas.', 'Beginner'),
    C('fire', 'fi-tax', 3, 'Taxes in Early Retirement', 'How withdrawals are taxed, the 0% bracket and getting money out before 59½.', 'Intermediate'),
    C('fire', 'fi-health', 4, 'Health Care & Social Security', 'Insurance before 65, the subsidy cliff and Social Security when you stop early.', 'Essential'),
    C('fire', 'fi-abroad', 5, 'Retiring Abroad', 'US taxes abroad, treaties such as France, banking, brokers and health care overseas.', 'Advanced'),
    C('fire', 'fi-plan', 6, 'Stress-Test Your Plan', 'The 4% rule, sequence risk, flexible spending and your full year-by-year plan.', 'Intermediate'),
  );

  /* ---------- track illustrations (320×150, decorative) ---------- */
  SML.trackIllo = function (id) {
    let b = '';
    if (id === 'trading') {
      const y = SML.lin(97, 105, 126, 20);
      const d = [[99.2, 99.9, 98.8, 99.6], [99.6, 100.3, 99.3, 100.1], [100.1, 100.4, 99.6, 99.8], [99.8, 101.8, 99.7, 101.6], [101.6, 101.9, 100.9, 101.1], [101.1, 102.6, 101.0, 102.4], [102.4, 103.6, 102.2, 103.4], [103.4, 104.2, 103.1, 103.9]].map((a) => ({ o: a[0], h: a[1], l: a[2], c: a[3] }));
      b += S.level(y(100.6), 20, 300, '', 's-acc') + S.candles(d, (i) => 44 + i * 33, 16, y) + S.text(24, y(100.6) - 6, 'level', 'sm acc b');
      return S.box(320, 150, 'Candles breaking above a level', b);
    }
    if (id === 'wealth') {
      const x = SML.lin(25, 65, 30, 300), y = SML.lin(0, 1.6e6, 128, 18);
      const own = [], grow = [];
      let bal = 0, put = 0;
      for (let a = 25; a <= 65; a++) { own.push([x(a), y(put)]); grow.push([x(a), y(bal)]); bal = bal * 1.07 + 9000; put += 9000; }
      b += S.area(grow, y(0), 'f-up-t') + S.poly(grow, 's-up w25') + S.area(own, y(0), 'f-acc-t') + S.poly(own, 's-acc w2');
      b += S.line(30, 128.5, 300, 128.5, 's-line') + S.text(30, 144, 'age 25', 'xs') + S.text(300, 144, '65', 'xs', 'end');
      b += S.text(178, 46, 'growth', 'md up b') + S.text(232, 112, 'what you put in', 'sm acc b', 'middle');
      return S.box(320, 150, 'Savings growing from age 25 to 65, most of it from compound growth', b);
    }
    // fire
    b += S.circle(250, 48, 20, 'f-acc') + S.path('M20,118 C70,86 110,104 160,82 S250,70 300,92 L300,134 L20,134 Z', 'f-up-t s-up w15');
    b += S.path('M20,128 C80,112 140,124 200,110 S270,104 300,112', 'nf s-info w15');
    b += S.rect(70, 92, 42, 22, 'f-surf s-ink w15', 4) + S.circle(80, 116, 4, 'f-ink') + S.circle(102, 116, 4, 'f-ink') + S.rect(98, 96, 10, 8, 'f-info', 1);
    b += S.text(24, 30, '25× spending', 'md acc b') + S.text(24, 50, '= free to choose', 'sm');
    return S.box(320, 150, 'A van on the road toward the sun: financial independence', b);
  };

  /* ---------- tools ---------- */
  const ic = {
    budget: '<circle cx="12" cy="12" r="8" class="nf s-ink w2"/><path d="M12 4v8l6 4" class="nf s-ink w2"/>',
    cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" class="nf s-ink w2"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v3M11.5 3.5v3" class="nf s-ink w2"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2" class="nf s-ink w2"/><path d="M3 10h18M6.5 14.5h4" class="nf s-ink w2"/>',
    car: '<path d="M4 15l1.6-5A2 2 0 0 1 7.5 8.6h9a2 2 0 0 1 1.9 1.4L20 15v3H4z" class="nf s-ink w2"/><circle cx="7.5" cy="18" r="1.6" class="f-acc"/><circle cx="16.5" cy="18" r="1.6" class="f-acc"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5" class="nf s-ink w2"/><path d="M12 9v11M4 13h16M12 9c-2-4-6-3-5-1s5 1 5 1 4 1 5-1-3-3-5 1" class="nf s-ink w2"/>',
    piggy: '<path d="M5 12a6 5 0 0 1 12-1h2v3l-2 1-1 3h-2l-.5-1.5h-4L9 18H7l-.5-2.5A5 5 0 0 1 5 12z" class="nf s-ink w2"/><circle cx="14.5" cy="11" r=".9" class="f-acc"/>',
    house: '<path d="M4 11l8-6.5 8 6.5M6 9.5V20h12V9.5" class="nf s-ink w2"/><rect x="10" y="14" width="4" height="6" class="f-acc"/>',
    key: '<circle cx="8" cy="12" r="3.5" class="nf s-ink w2"/><path d="M11.5 12H20M17 12v3M20 12v2" class="nf s-ink w2"/>',
    globe: '<circle cx="12" cy="12" r="8" class="nf s-ink w2"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16" class="nf s-ink w15"/>',
    flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 1 2 2 2.5 3 2.5 0-2-1-4 0-7.5z" class="nf s-ink w2"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" class="nf s-ink w2"/><path d="M8 12h2.5l1-2 1.5 4 1-2H16" class="nf s-acc w15"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" class="nf s-ink w2"/><path d="M9 12l2 2 4-4" class="nf s-acc w2"/>',
    ladder: '<path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10" class="nf s-ink w2"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5" class="nf s-ink w2"/>',
  };
  const baseIcon = SML.toolIcon;
  SML.toolIcon = (k) => (ic[k] ? `<svg viewBox="0 0 24 24" aria-hidden="true">${ic[k]}</svg>` : baseIcon(k));
  SML.tools.forEach((t) => { if (!t.track) t.track = 'trading'; });
  const comp = SML.tools.find((t) => t.id === 'tool-compound');
  if (comp) Object.assign(comp, { title: 'Compound interest', blurb: 'Your age, your money, your return: see what it grows into and what waiting costs.', widget: 'compoundPlus', cat: 'Investing', track: 'wealth', lesson: 'l-compound' });
  const T = (track, id, title, blurb, widget, cat, icon, lesson) => ({ track, id, title, blurb, widget, cat, icon, lesson });
  SML.tools.push(
    T('wealth', 'tool-budget', 'Monthly budget', 'Split take-home pay into needs, wants and saving, and see your savings rate.', 'budgetBuilder', 'Budget', 'budget', 'l-budget'),
    T('wealth', 'tool-habits', 'What habits really cost', 'Daily coffee, pods or takeout: the yearly cost and what it grows into if invested.', 'habitCost', 'Budget', 'cup', 'l-latte'),
    T('wealth', 'tool-cash', 'Where to park cash', 'Savings, money market or T-bills: compare what you keep after tax.', 'cashParking', 'Budget', 'piggy', 'l-emergency'),
    T('wealth', 'tool-payoff', 'Debt payoff plan', 'Avalanche or snowball: months to debt-free and interest saved.', 'debtPayoff', 'Debt', 'card', 'l-card-debt'),
    T('wealth', 'tool-transfer', 'Balance transfer planner', 'The fee, the promo clock and the monthly payment that clears it in time.', 'transferPlanner', 'Debt', 'card', 'l-balance-transfer'),
    T('wealth', 'tool-car', 'Car: cash or loan', 'Compare a loan with paying cash while your money earns interest, after tax.', 'carCashVsLoan', 'Debt', 'car', 'l-car-cash'),
    T('wealth', 'tool-fx', 'Foreign fee cost', 'What card and ATM fees cost on a trip, and how to avoid them.', 'fxFees', 'Banking', 'globe', 'l-travel-money'),
    T('wealth', 'tool-match', '401(k) match', 'How much free match you capture, and how much you leave on the table.', 'matchCalc', 'Benefits', 'gift', 'l-401k-match'),
    T('wealth', 'tool-limits', '401(k) limit stack', 'Your deferral, the match and after-tax money stacked up to the total limit.', 'limitStack', 'Benefits', 'ladder', 'l-401k-limits'),
    T('wealth', 'tool-rsu', 'RSU tax gap', 'What vesting shares add to your taxes, and the gap withholding leaves.', 'rsuVest', 'Benefits', 'gift', 'l-rsu'),
    T('wealth', 'tool-espp', 'ESPP return', 'Discount, lookback and taxes: what one purchase period really earns.', 'esppCalc', 'Benefits', 'gift', 'l-espp'),
    T('wealth', 'tool-roth', 'Roth or traditional', 'Tax now or tax later: which leaves you more to spend.', 'rothVsTrad', 'Retirement', 'piggy', 'l-trad-vs-roth'),
    T('wealth', 'tool-backdoor', 'Backdoor Roth check', 'The pro-rata rule: how much of a conversion is taxable.', 'backdoorRoth', 'Retirement', 'key', 'l-backdoor-roth'),
    T('wealth', 'tool-ss', 'Social Security age', 'Monthly benefit and lifetime total for claiming at 62 to 70.', 'ssClaim', 'Retirement', 'flag', 'l-social-security'),
    T('wealth', 'tool-retire', 'Retirement planner', 'Savings, spending and Social Security, year by year to age 95.', 'retirePlanner', 'Retirement', 'ladder', 'l-retire-plan'),
    T('wealth', 'tool-brackets', 'Tax brackets', 'Marginal and effective rates for your income.', 'bracketViz', 'Taxes', 'tax', 'l-tax-brackets'),
    T('wealth', 'tool-wheeltax', 'How the wheel is taxed', 'Step through puts, assignment and calls, with the tax result of each.', 'wheelTaxSim', 'Taxes', 'wheel', 'l-wheel-tax'),
    T('wealth', 'tool-rentbuy', 'Rent or buy', 'Net worth from renting and investing versus buying, year by year.', 'rentVsBuy', 'Housing', 'house', 'l-rent-vs-buy'),
    T('wealth', 'tool-mortgage', 'Mortgage', 'Payment, total interest, PMI and the effect of extra payments.', 'mortgageCalc', 'Housing', 'house', 'l-mortgage'),
    T('wealth', 'tool-rental', 'Rental property', 'Cash flow, cap rate, cash-on-cash return and the tax picture.', 'rentalCalc', 'Housing', 'key', 'l-rental'),
    T('wealth', 'tool-airbnb', 'Airbnb real profit', 'From gross bookings to what you actually keep after fees, costs and tax.', 'strCalc', 'Housing', 'key', 'l-airbnb'),
    T('fire', 'tool-fire', 'FIRE number', 'Spending, withdrawal rate and other income: the number that sets you free.', 'fireNumber', 'FIRE', 'flame', 'l-fire-number'),
    T('fire', 'tool-years', 'Years to freedom', 'Your savings rate decides how many years you work.', 'savingsRate', 'FIRE', 'flame', 'l-savings-rate'),
    T('fire', 'tool-cities', 'Cost of living by place', 'Monthly budgets for cities, countries and van life, for your household.', 'cityCompare', 'Where to live', 'globe', 'l-geo-arbitrage'),
    T('fire', 'tool-firetax', 'Tax on your withdrawals', 'How much federal tax a FIRE withdrawal really costs.', 'fireTaxCalc', 'Taxes', 'tax', 'l-fire-tax'),
    T('fire', 'tool-ladder', 'Early access planner', 'Roth ladder, 72(t) payments and Rule of 55 on one timeline.', 'accessLadder', 'Taxes', 'ladder', 'l-early-access'),
    T('fire', 'tool-aca', 'Health subsidy cliff', 'Your income against the marketplace subsidy and Medicaid lines.', 'acaSubsidy', 'Health', 'heart', 'l-aca'),
    T('fire', 'tool-france', 'France and US tax estimate', 'A simplified estimate for a US citizen living in France.', 'franceTax', 'Abroad', 'globe', 'l-treaty-france'),
    T('fire', 'tool-swr', 'Safe withdrawal rate', 'Success rates by withdrawal rate, years and stock share.', 'swrSim', 'Plan', 'shield', 'l-swr'),
    T('fire', 'tool-fireplan', 'Full FIRE plan', 'Every account, every year: when you can stop and whether it lasts.', 'firePlanner', 'Plan', 'flame', 'l-fire-planner'),
  );

  /* ---------- glossary (shared terms for the new tracks) ---------- */
  const G = (t, full, d, l) => ({ t, full, d, l });
  SML.glossary.push(
    // money
    G('Budget', '', 'A plan for where each month’s take-home pay goes: needs, wants and saving.', 'l-budget'),
    G('50/30/20 rule', '', 'A simple budget split: about half of take-home pay for needs, 30% for wants and 20% for saving and debt.', 'l-budget'),
    G('Pay yourself first', '', 'Saving and investing automatically on payday, before you spend anything else.', 'l-budget'),
    G('Savings rate', '', 'The share of your income you save. The single biggest lever on when you can retire.', 'l-savings-rate'),
    G('Sinking fund', '', 'Money set aside each month for a known future cost, such as car repairs, gifts or a trip.', 'l-track-spending'),
    G('Lifestyle creep', '', 'Spending that rises every time your income rises, so you never save more.', 'l-track-spending'),
    G('Opportunity cost', '', 'What you give up by choosing one use of money over another, such as the growth that money could have earned.', 'l-latte'),
    G('Emergency fund', '', 'Cash set aside for job loss or surprise bills, usually three to six months of expenses.', 'l-emergency'),
    G('HYSA', 'High-yield savings account', 'An FDIC-insured savings account that pays much more interest than a typical bank savings account.', 'l-emergency'),
    G('Money market fund', '', 'A low-risk fund that holds short-term government and company debt and pays interest daily. Not FDIC-insured.', 'l-emergency'),
    G('T-bill', 'Treasury bill', 'A short-term loan to the US government, a year or less. Its interest is free of state and local income tax.', 'l-emergency'),
    G('FDIC insurance', '', 'US government protection for bank deposits if a bank fails, up to a limit per depositor, per bank, per account type.', 'l-emergency'),
    G('Net worth', '', 'Everything you own minus everything you owe.', 'l-net-worth'),
    G('Inflation', '', 'Prices rising over time, so the same dollars buy less.', 'l-compound'),
    G('Real return', '', 'Your return after inflation. A 7% return with 3% inflation is about a 4% real return.', 'l-compound'),
    // debt
    G('Credit score', 'FICO score', 'A number, usually 300 to 850, that tells lenders how likely you are to repay. Higher scores get lower rates.', 'l-credit-score'),
    G('Credit utilization', '', 'Card balances divided by credit limits. Lower is better for your score.', 'l-credit-score'),
    G('Hard inquiry', '', 'A lender checking your credit when you apply. It can lower your score a little for a while.', 'l-credit-score'),
    G('APR', 'Annual percentage rate', 'The yearly interest rate you pay on a loan or card balance.', 'l-card-debt'),
    G('APY', 'Annual percentage yield', 'The yearly return you earn on savings, including compounding.', 'l-emergency'),
    G('Intro APR', '', 'A promotional rate, often 0%, for a set number of months on new purchases or transferred balances.', 'l-balance-transfer'),
    G('Balance transfer', '', 'Moving a card balance to another card, usually to pay a 0% intro rate instead of high interest.', 'l-balance-transfer'),
    G('Balance transfer fee', '', 'A one-time fee, usually a percentage of the amount moved, charged when you transfer a balance.', 'l-balance-transfer'),
    G('Deferred interest', '', 'A store-card promo where all the back interest is charged if any balance is left when the promo ends. Not the same as 0% APR.', 'l-balance-transfer'),
    G('Avalanche method', '', 'Paying off debts from the highest interest rate down. It saves the most money.', 'l-card-debt'),
    G('Snowball method', '', 'Paying off debts from the smallest balance up, for quick wins that keep you going.', 'l-card-debt'),
    G('DTI', 'Debt-to-income ratio', 'Monthly debt payments divided by monthly gross income. Lenders use it to decide how much you can borrow.', 'l-mortgage'),
    G('Leverage', '', 'Using borrowed money to own more than you could with your own cash. It magnifies gains and losses.', 'l-smart-leverage'),
    G('Margin call', '', 'A broker’s demand for more cash when borrowed-against investments fall too far. If you cannot pay, it sells for you.', 'l-smart-leverage'),
    G('SBLOC', 'Securities-based line of credit', 'A loan secured by your investments, so you can borrow without selling them.', 'l-smart-leverage'),
    // banking
    G('Relationship banking', '', 'Keeping enough money with one bank group to unlock fee waivers and perks.', 'l-bank-tiers'),
    G('Private client', '', 'A bank’s top everyday-banking tier for customers with large balances, with fee waivers and a dedicated banker.', 'l-private-client'),
    G('Foreign transaction fee', '', 'A charge, often around 3%, that some cards add to every purchase made in another currency or with a foreign merchant.', 'l-travel-money'),
    G('Dynamic currency conversion', 'DCC', 'When a foreign shop or ATM offers to charge you in dollars. The exchange rate is usually poor: always choose the local currency.', 'l-travel-money'),
    G('Annual fee', '', 'What a card charges each year to keep it open. Worth it only if the perks you actually use are worth more.', 'l-rewards'),
    // benefits
    G('401(k)', '', 'A workplace retirement account. Money goes in from your paycheck, often with an employer match, and grows tax-deferred or tax-free.', 'l-401k-match'),
    G('Employer match', '', 'Money your employer adds to your 401(k) when you contribute, such as 50 cents per dollar up to 6% of pay.', 'l-401k-match'),
    G('Vesting', '', 'When money or shares from your employer become fully yours. Leave before you vest and you can lose them.', 'l-401k-match'),
    G('True-up', '', 'An extra year-end deposit some employers make so you get the full match even if you hit the limit early.', 'l-401k-match'),
    G('Elective deferral', '', 'The part of your pay you choose to put into a 401(k). It has its own yearly limit.', 'l-401k-limits'),
    G('Annual additions limit', '415(c) limit', 'The cap on everything that goes into your 401(k) in a year: your deferrals, the employer match and after-tax money.', 'l-401k-limits'),
    G('Catch-up contribution', '', 'Extra contributions allowed from age 50, with a bigger catch-up at ages 60 to 63.', 'l-401k-limits'),
    G('After-tax contribution', '', 'Money you add to a 401(k) after tax, above the normal deferral limit, if your plan allows it.', 'l-mega-backdoor'),
    G('Mega backdoor Roth', '', 'Putting after-tax 401(k) money in and converting it to Roth, so far more can grow tax-free.', 'l-mega-backdoor'),
    G('HSA', 'Health savings account', 'An account for medical costs, open to people with an HSA-eligible health plan. Money goes in tax-free, grows tax-free and comes out tax-free for medical bills.', 'l-hsa'),
    G('HDHP', 'High-deductible health plan', 'A health plan with a higher deductible and usually a lower premium. It is the kind that lets you open an HSA.', 'l-hsa'),
    G('FSA', 'Flexible spending account', 'A workplace account for medical or dependent care costs, paid with pre-tax money. Unused money is mostly lost at year end.', 'l-open-enrollment'),
    G('Deductible', '', 'What you pay for covered care each year before insurance starts paying its share.', 'l-open-enrollment'),
    G('Out-of-pocket maximum', '', 'The most you pay for covered care in a year. After that the plan pays 100%.', 'l-open-enrollment'),
    G('Insurance premium', '', 'What you pay each month or year to keep an insurance policy.', 'l-open-enrollment'),
    G('RSU', 'Restricted stock unit', 'Company shares promised to you that arrive on vesting dates. Their value is taxed as pay when they vest.', 'l-rsu'),
    G('Sell to cover', '', 'Selling some vesting shares automatically to pay the tax withholding.', 'l-rsu'),
    G('Supplemental withholding', '', 'The flat federal rate employers withhold on bonuses and vesting stock. It is often lower than your real tax rate.', 'l-rsu'),
    G('Concentration risk', '', 'Having too much of your wealth in one stock, such as your employer’s, so one bad event hurts both your job and savings.', 'l-rsu'),
    G('ESPP', 'Employee stock purchase plan', 'A plan that lets you buy company shares through payroll, often at up to a 15% discount.', 'l-espp'),
    G('Lookback provision', '', 'An ESPP feature that uses the lower of the price at the start or end of the offering period before the discount.', 'l-espp'),
    G('Qualifying disposition', '', 'Selling ESPP or ISO shares after the required holding periods, so more of the gain is taxed at long-term rates.', 'l-espp'),
    G('Disqualifying disposition', '', 'Selling ESPP or ISO shares before the holding periods are met, so the discount or spread is taxed as pay.', 'l-espp'),
    G('ISO', 'Incentive stock option', 'An employee stock option with special tax rules: no regular tax at exercise, but it can trigger AMT.', 'l-stock-options'),
    G('NSO', 'Non-qualified stock option', 'An employee stock option whose spread is taxed as pay when you exercise.', 'l-stock-options'),
    G('Exercise', '', 'Using an option to buy the shares at the strike price.', 'l-stock-options'),
    G('Bargain element', '', 'The gap between the share price and your option’s strike price when you exercise.', 'l-stock-options'),
    G('AMT', 'Alternative minimum tax', 'A parallel tax calculation that can apply when you have big deductions or exercise ISOs.', 'l-stock-options'),
    G('83(b) election', '', 'A form filed within 30 days of getting restricted shares or early-exercising options, to be taxed now on today’s value.', 'l-stock-options'),
    G('Open enrollment', '', 'The yearly window to choose or change workplace benefits such as health plans, FSAs and insurance.', 'l-open-enrollment'),
    // accounts
    G('Traditional IRA', '', 'An individual retirement account. Contributions may be tax-deductible; withdrawals are taxed as income.', 'l-trad-vs-roth'),
    G('Roth IRA', '', 'An individual retirement account funded with after-tax money. Growth and qualified withdrawals are tax-free.', 'l-trad-vs-roth'),
    G('Roth 401(k)', '', 'The Roth option inside a workplace plan: after-tax money in, tax-free qualified withdrawals out.', 'l-trad-vs-roth'),
    G('Marginal tax rate', '', 'The tax rate on your next dollar of income.', 'l-tax-brackets'),
    G('Effective tax rate', '', 'Your total tax divided by your income: the average rate you really pay.', 'l-tax-brackets'),
    G('Backdoor Roth IRA', '', 'A legal two-step for high earners: contribute to a traditional IRA without a deduction, then convert it to Roth.', 'l-backdoor-roth'),
    G('Pro-rata rule', '', 'When you convert IRA money to Roth, the IRS counts all your pre-tax IRA balances, so part of the conversion can be taxed.', 'l-backdoor-roth'),
    G('Roth conversion', '', 'Moving money from a pre-tax account to a Roth account. You pay income tax on the amount converted.', 'l-backdoor-roth'),
    G('Spousal IRA', '', 'An IRA for a spouse with little or no earned income, funded from the working spouse’s income.', 'l-ira'),
    G('Rollover', '', 'Moving retirement money from one account to another, such as an old 401(k) to an IRA, without tax.', 'l-ira'),
    G('Social Security', '', 'The US government retirement benefit based on your 35 highest years of earnings.', 'l-social-security'),
    G('Full retirement age', 'FRA', 'The age when you get your full Social Security benefit: 67 for anyone born in 1960 or later.', 'l-social-security'),
    G('Delayed retirement credits', '', 'The increase in your Social Security benefit for each year you wait past full retirement age, up to 70.', 'l-social-security'),
    G('PIA', 'Primary insurance amount', 'Your Social Security benefit at full retirement age. Claiming earlier or later changes it.', 'l-social-security'),
    G('Medicare', '', 'US government health insurance from age 65.', 'l-medicare-rmd'),
    G('IRMAA', 'Income-related monthly adjustment amount', 'Extra Medicare premiums for people whose income from two years earlier is above certain levels.', 'l-medicare-rmd'),
    G('RMD', 'Required minimum distribution', 'The amount you must withdraw each year from pre-tax retirement accounts once you reach the required age.', 'l-medicare-rmd'),
    // invest
    G('Compound interest', '', 'Earning returns on your past returns, so growth speeds up the longer you leave money alone.', 'l-compound'),
    G('Rule of 72', '', 'Divide 72 by a yearly return to estimate how many years money takes to double.', 'l-compound'),
    G('Expense ratio', '', 'The yearly fee a fund charges, as a percent of what you have in it.', 'l-index-funds'),
    G('Total world index fund', '', 'One fund that holds thousands of stocks across the US and the rest of the world, such as VTWAX or VT.', 'l-index-funds'),
    G('Asset allocation', '', 'How your money is split between stocks, bonds and cash. It drives most of your risk and return.', 'l-allocation'),
    G('Rebalancing', '', 'Selling some of what grew and buying what lagged to get back to your target mix.', 'l-allocation'),
    G('Target-date fund', '', 'A single fund that shifts from stocks to bonds as a chosen retirement year gets closer.', 'l-allocation'),
    G('Dollar-cost averaging', 'DCA', 'Investing a fixed amount on a schedule, whatever the price.', 'l-extra-money'),
    G('Taxable brokerage account', '', 'A regular investing account with no special tax treatment, no limits and no withdrawal rules.', 'l-extra-money'),
    G('529 plan', '', 'An education savings account. Growth is tax-free when spent on qualified education costs.', 'l-kids-money'),
    G('Custodial account', 'UTMA/UGMA', 'An account an adult manages for a child. The money belongs to the child, who gets control at adulthood.', 'l-kids-money'),
    G('Trump account', '', 'A new tax-advantaged investment account for US children created by the 2025 tax law.', 'l-kids-money'),
    // taxes
    G('Tax bracket', '', 'A slice of income taxed at one rate. Only the dollars inside each slice pay that slice’s rate.', 'l-tax-brackets'),
    G('Standard deduction', '', 'A flat amount of income the IRS lets you skip taxes on, if you do not itemize.', 'l-deductions'),
    G('Itemized deductions', '', 'Specific expenses, such as mortgage interest, state and local taxes and charity, listed instead of taking the standard deduction.', 'l-deductions'),
    G('Tax credit', '', 'A dollar-for-dollar cut to your tax bill. Worth more than a deduction of the same size.', 'l-deductions'),
    G('SALT cap', '', 'The limit on how much state and local tax you can deduct when you itemize.', 'l-deductions'),
    G('AGI', 'Adjusted gross income', 'Your total income minus certain adjustments, such as traditional 401(k) and HSA contributions.', 'l-deductions'),
    G('MAGI', 'Modified adjusted gross income', 'AGI with some items added back. Used for Roth IRA limits, health subsidies and Medicare premiums.', 'l-aca'),
    G('Taxable income', '', 'Income left after deductions. It is what the tax brackets apply to.', 'l-tax-brackets'),
    G('Substantially identical', '', 'The wash-sale test the IRS never fully defines. Two funds tracking the same index are risky to swap; different indexes are safer.', 'l-tlh-pairs'),
    G('Asset location', '', 'Choosing which account holds which investment so you pay less tax overall.', 'l-asset-location'),
    G('Tax drag', '', 'The return you lose each year to taxes on dividends, interest and gains.', 'l-asset-location'),
    G('Qualified dividend', '', 'A dividend taxed at the lower long-term capital gains rates, usually from US stocks held long enough.', 'l-asset-location'),
    G('Cost basis', '', 'What you paid for an investment, after adjustments. Your gain or loss is the sale price minus the cost basis.', 'l-wheel-tax'),
    G('Holding period', '', 'How long you own an investment. More than one year makes a gain long-term.', 'l-wheel-tax'),
    G('Qualified covered call', '', 'A covered call that meets IRS strike and time rules, so it does not upset the holding period of your shares.', 'l-wheel-tax'),
    G('Section 1256 contract', '', 'Futures and broad index options such as SPX, taxed 60% long-term and 40% short-term no matter how long you hold them.', 'l-wheel-tax'),
    G('Capital loss carryforward', '', 'Losses beyond what you can use this year roll forward to future years.', 'l-tlh-pairs'),
    G('NIIT', 'Net investment income tax', 'An extra 3.8% tax on investment income for people above certain income levels.', 'l-fire-tax'),
    // home
    G('Down payment', '', 'The cash you pay up front when you buy a home. The rest is the mortgage.', 'l-rent-vs-buy'),
    G('Mortgage', '', 'A loan to buy a home, secured by the home itself.', 'l-mortgage'),
    G('Amortization', '', 'Paying a loan off in equal payments, where early payments are mostly interest and later ones mostly principal.', 'l-mortgage'),
    G('PMI', 'Private mortgage insurance', 'Insurance you pay when your down payment is under 20%. It protects the lender, not you.', 'l-mortgage'),
    G('Mortgage points', '', 'Fees paid up front to lower your mortgage rate. One point costs 1% of the loan.', 'l-mortgage'),
    G('ARM', 'Adjustable-rate mortgage', 'A mortgage whose rate is fixed for a few years and then moves with the market.', 'l-mortgage'),
    G('Closing costs', '', 'Fees paid when a home is bought or sold, such as lender, title and agent fees.', 'l-rent-vs-buy'),
    G('Price-to-rent ratio', '', 'Home price divided by a year of rent for a similar place. High ratios favor renting.', 'l-rent-vs-buy'),
    G('5% rule', '', 'A rent-or-buy shortcut: multiply the home price by about 5% and divide by 12. Rent below that tends to favor renting.', 'l-rent-vs-buy'),
    G('Home equity', '', 'Your home’s value minus what you still owe on it.', 'l-house-invest'),
    G('HELOC', 'Home equity line of credit', 'A line of credit secured by your home equity. Easy to borrow, and your home is on the line.', 'l-house-invest'),
    G('Section 121 exclusion', '', 'The rule that lets you skip tax on a large gain when you sell your main home, if you owned and lived in it for two of the last five years.', 'l-home-taxes'),
    G('Mortgage interest deduction', '', 'Deducting home loan interest when you itemize, up to a loan limit.', 'l-home-taxes'),
    G('Cap rate', '', 'A rental’s yearly net operating income divided by its price, ignoring the mortgage.', 'l-rental'),
    G('Cash-on-cash return', '', 'A rental’s yearly cash flow divided by the cash you put in.', 'l-rental'),
    G('Vacancy rate', '', 'The share of time a rental sits empty and earns nothing.', 'l-rental'),
    G('Rental depreciation', '', 'A yearly tax deduction for the wear on a rental building (not the land), spread over 27.5 years for homes.', 'l-rental'),
    G('Depreciation recapture', '', 'Tax due when you sell a rental, on the depreciation you deducted while you owned it.', 'l-rental'),
    G('Passive activity loss', '', 'A rental loss that usually can only offset other passive income, with limited exceptions.', 'l-rental'),
    G('1031 exchange', '', 'Selling an investment property and buying another under strict deadlines, to delay the tax on the gain.', 'l-rental'),
    G('Cost segregation', '', 'A study that splits a building into parts with shorter lives, so you can depreciate more, sooner.', 'l-airbnb'),
    G('Short-term rental', 'STR', 'Renting a home by the night or week, as on Airbnb or Vrbo.', 'l-airbnb'),
    G('ADR', 'Average daily rate', 'The average price per booked night.', 'l-airbnb'),
    G('Occupancy rate', '', 'The share of available nights that are actually booked.', 'l-airbnb'),
    G('Material participation', '', 'Being involved in a rental business regularly and substantially, as defined by IRS hour tests. It changes how losses are treated.', 'l-airbnb'),
    G('14-day rule', '', 'Rent your home for 14 days or fewer in a year and the rent is tax-free, with no rental deductions.', 'l-airbnb'),
    G('House hacking', '', 'Living in one unit of a small multi-unit property, or renting rooms, so tenants help pay the mortgage.', 'l-house-invest'),
    // protect
    G('Term life insurance', '', 'Life insurance for a set number of years. Cheap, simple and what most families need.', 'l-insurance'),
    G('Whole life insurance', '', 'Permanent life insurance with a savings part. Much more expensive than term.', 'l-insurance'),
    G('Disability insurance', '', 'Insurance that replaces part of your pay if illness or injury stops you working.', 'l-insurance'),
    G('Umbrella policy', '', 'Extra liability insurance on top of home and car policies, for big lawsuits.', 'l-insurance'),
    G('Beneficiary designation', '', 'The form naming who gets an account when you die. It overrides your will.', 'l-estate'),
    G('Will', '', 'A legal document that says who gets your property and who cares for your children.', 'l-estate'),
    G('Revocable living trust', '', 'A trust you control while alive that passes assets without probate when you die.', 'l-estate'),
    G('Power of attorney', '', 'A document letting someone act for you on money matters if you cannot.', 'l-estate'),
    G('Probate', '', 'The court process that settles a will. Slow, public and sometimes costly.', 'l-estate'),
    G('Step-up in basis', '', 'At death, the cost basis of inherited investments resets to their value then, wiping out the untaxed gain.', 'l-estate'),
    // retire
    G('Withdrawal rate', '', 'The share of your savings you take out in the first year of retirement.', 'l-swr'),
    G('Sequence of returns risk', '', 'The danger that big market losses early in retirement drain savings faster than the same losses later.', 'l-sequence'),
    G('Annuity', '', 'A contract with an insurer that turns a lump sum into guaranteed income. Fees and terms vary a lot.', 'l-retire-income'),
    G('Bucket strategy', '', 'Splitting retirement money into near-term cash, medium-term bonds and long-term stocks.', 'l-retire-income'),
    G('Longevity risk', '', 'The risk of living longer than your money lasts.', 'l-retire-age'),
    // fire
    G('FIRE', 'Financial independence, retire early', 'Saving and investing enough that work becomes optional, often decades before the usual retirement age.', 'l-fire-intro'),
    G('FIRE number', '', 'The amount invested that can pay your yearly spending for life, often about 25 times annual spending.', 'l-fire-number'),
    G('Lean FIRE', '', 'Financial independence on a small budget.', 'l-fire-intro'),
    G('Fat FIRE', '', 'Financial independence with a large budget and plenty of room for travel and comfort.', 'l-fire-intro'),
    G('Barista FIRE', '', 'Leaving full-time work while part-time work covers some costs and often health insurance.', 'l-coast-fire'),
    G('Coast FIRE', '', 'Having enough invested that it will grow to your number by retirement age with no more saving.', 'l-coast-fire'),
    G('4% rule', '', 'A rule of thumb from historical US data: withdraw 4% in year one and raise it with inflation, and the money lasted 30 years in almost every past period.', 'l-swr'),
    G('Safe withdrawal rate', 'SWR', 'The highest starting withdrawal rate that would have lasted through bad historical periods for your time horizon.', 'l-swr'),
    G('Guardrails', '', 'Rules that cut spending a little after bad years and raise it after good ones, so the money lasts.', 'l-guardrails'),
    G('Geographic arbitrage', '', 'Earning or saving in a high-cost place and living in a cheaper one.', 'l-geo-arbitrage'),
    G('Cost of living', '', 'What it costs to live in a place: housing, food, transport, health care and the rest.', 'l-geo-arbitrage'),
    G('Domicile', '', 'The place you legally call home, which decides your state taxes and more.', 'l-van-life'),
    G('Roth conversion ladder', '', 'Converting a little pre-tax money to Roth each year, then withdrawing each conversion tax- and penalty-free five years later.', 'l-early-access'),
    G('Rule of 55', '', 'Leave your job in or after the year you turn 55 and you can take that employer’s 401(k) money without the 10% penalty.', 'l-early-access'),
    G('72(t) SEPP', 'Substantially equal periodic payments', 'A schedule of fixed yearly IRA withdrawals that avoids the 10% early penalty if you stick to it.', 'l-early-access'),
    G('0% capital gains bracket', '', 'The range of taxable income where long-term gains and qualified dividends are taxed at 0%.', 'l-zero-bracket'),
    G('Tax gain harvesting', '', 'Selling winners while in the 0% bracket and buying back, to raise your cost basis tax-free.', 'l-zero-bracket'),
    G('ACA marketplace', '', 'The government health insurance exchange, HealthCare.gov or a state site, where people without work coverage buy plans.', 'l-aca'),
    G('Premium tax credit', '', 'The subsidy that lowers marketplace health premiums, based on your income and household size.', 'l-aca'),
    G('Subsidy cliff', '', 'An income line where health-insurance subsidies stop completely, so one extra dollar can cost thousands.', 'l-aca'),
    G('FPL', 'Federal poverty level', 'The income yardstick used for health subsidies and Medicaid, set by household size.', 'l-aca'),
    G('Medicaid', '', 'Government health coverage for people with low income. Rules vary by state.', 'l-aca'),
    G('COBRA', '', 'Keeping your old employer’s health plan after you leave, usually for up to 18 months, at full cost.', 'l-aca'),
    G('Earnings test', '', 'The rule that withholds some Social Security if you claim before full retirement age and still earn above a limit.', 'l-ss-early'),
    G('Totalization agreement', '', 'A treaty that coordinates social security between two countries, so you do not pay into both.', 'l-ss-early'),
    G('Citizenship-based taxation', '', 'The US rule that citizens must file US taxes on worldwide income wherever they live.', 'l-us-tax-abroad'),
    G('FEIE', 'Foreign earned income exclusion', 'A rule that lets Americans living abroad exclude some foreign earned income from US tax. It does not cover investment income.', 'l-us-tax-abroad'),
    G('Foreign tax credit', '', 'A US tax credit for income tax paid to another country on the same income.', 'l-us-tax-abroad'),
    G('FBAR', '', 'A yearly report of foreign bank and financial accounts when they add up to more than $10,000 at any point in the year.', 'l-us-tax-abroad'),
    G('FATCA', '', 'A US law requiring reporting of foreign financial assets above certain thresholds, and foreign banks to report US customers.', 'l-us-tax-abroad'),
    G('PFIC', 'Passive foreign investment company', 'How US tax law treats most non-US funds. The tax and paperwork are punishing, so Americans abroad usually stick to US-domiciled funds.', 'l-expat-money'),
    G('Tax treaty', '', 'An agreement between two countries that decides who taxes what, to avoid double tax.', 'l-treaty-france'),
    G('Savings clause', '', 'A clause in most US tax treaties that lets the US keep taxing its own citizens as if the treaty did not exist, with listed exceptions.', 'l-treaty-france'),
    G('Tax residency', '', 'Where you count as resident for tax purposes, usually based on days spent and where your home and ties are.', 'l-treaty-france'),
    G('Social charges', '', 'French social levies on income, including investment income, separate from income tax.', 'l-treaty-france'),
    G('Passive income visa', '', 'A residence visa for people who can show steady income from pensions, investments or savings, without working locally.', 'l-visas'),
    G('Currency risk', '', 'The risk that exchange-rate moves change what your dollars buy abroad.', 'l-geo-arbitrage'),
    G('Expat health insurance', '', 'Health insurance designed for people living outside their home country.', 'l-expat-health'),
  );
})();
