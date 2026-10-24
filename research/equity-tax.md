# Equity comp, retirement accounts & options tax: fact-check notes (as of Oct 21, 2026)

These notes are for a US educational site. All dollar figures are for tax year 2026 unless a different year is given. "UNVERIFIED" means I could not confirm the point against a fetched source.
Fetch limits during this check: the proxy blocked irs.gov PDF downloads, and the HTML version of IRS Pub 550 came back cut off before the options chapter. Pub 550 options text below is therefore quoted through TaxAct and Schwab, and checked against the statute and regulations (Cornell LII, govinfo). The web-search budget ran out before the last few checks, which are marked.

## 0. 2026 reference numbers
- 401(k) elective deferral (402(g)): **$24,500**. Catch-up at 50+: **$8,000**. Ages 60–63 catch-up: **$11,250**. 415(c) total additions: **$72,000**, rising to $80,000 with the 50+ catch-up and $83,250 at ages 60–63. Compensation cap: $360,000. HCE threshold: $160,000. Source: IRS Notice 2025-67, via https://www.napa-net.org/news/2025/10/breaking-irs-announces-2026-401k-contribution-limits/ and https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-401k-and-profit-sharing-plan-contribution-limits
- IRA contribution: **$7,500**, plus **$1,100** catch-up at 50+. Roth IRA phase-out: single **$153k–$168k**, MFJ **$242k–$252k**, MFS $0–$10k. Source: NAPA (above).
- Roth catch-up mandate (SECURE 2.0 §603, effective 2026): if your **2025 FICA wages from the employer exceeded $150,000** (the $145k base, indexed), your 2026 catch-ups must be Roth. Source: NAPA (above).
- Ordinary brackets: single 22% from $50,400, 24% from $105,700, 32% from $201,775, 35% from $256,225, 37% from $640,600. MFJ 24% from $211,400, 32% from $403,550, 35% from $512,450, 37% from $768,700. Standard deduction: $16,100 single / $32,200 MFJ. Source: Rev. Proc. 2025-32, via https://www.currentfederaltaxdevelopments.com/blog/2025/10/9/2026-inflation-adjustments-for-tax-professionals-revenue-procedure-2025-32-analysis
- Long-term capital gains: the **0% rate applies up to $49,450** of taxable income (single) or **$98,900** (MFJ). The 15% rate runs up to $545,500 (single) or $613,700 (MFJ). Same source.
- NIIT is 3.8% on net investment income above $200k MAGI (single) or $250k (MFJ). These thresholds are fixed in IRC §1411 and not indexed. (IRC; the Pub 550 ch. 1 NIIT section was fetched but the figures were not quoted.)
- 2027 limits: IRS usually announces them in Oct–Nov. They had not been checked as of this note.

## 1. 401(k) employer match and related rules
- **Common match formulas.** "100% of your contributions up to 4% of salary" (dollar-for-dollar, typically 3–6%) and "50% match on contributions up to 6%" (a 3% effective match). Source: https://www.sdocpa.com/401k-employer-match-rules/
  - Example (assumes $100k salary, 50%-of-6% formula): you defer $6,000 (6%), so the employer adds $3,000. Deferring only 3% gets you $1,500, leaving $1,500 of match unclaimed.
  - Basic safe harbor formula: 100% of the first 3% plus 50% of the next 2% (4% total). Enhanced safe harbor: commonly 100% up to 4%. Basis: IRC §401(k)(12). UNVERIFIED (formula not on a fetched page).
  - IRS: safe harbor contributions must be "fully vested when made." Source: https://www.irs.gov/retirement-plans/plan-sponsor/401k-plan-overview. QACA auto-enroll safe harbor plans may use a 2-year cliff (UNVERIFIED).
- **Match vs. the limits.** The match does **not** count toward the $24,500 402(g) deferral limit. It **does** count toward the $72,000 415(c) limit. IRS on the overall limit: it covers "elective deferrals (but not catch-up contributions)" plus employer match, nonelective contributions and forfeitures, capped at the lesser of 100% of compensation or $72,000. Sources: IRS limits page (§0); https://www.sdocpa.com/401k-employer-match-rules/; https://experian.com/blogs/ask-experian/does-employer-match-count-toward-401k-limit
- **Front-loading and true-ups.** If the plan matches per pay period, maxing out early stops the match for the rest of the year. Plansponsor example (50% up to 6%, $3,000 per pay period, 24 periods): an even contribution pace earns $2,160 of match; front-loading over 12 periods earns $1,080. A year-end **true-up** restores the full annual match, but only if the plan document provides one. Source: https://www.plansponsor.com/blines-ask-experts-match-deferrals-front-loaded/ (check your SPD).
- **Vesting.** IRS: elective deferrals are "always 100% vested." The maximum schedules for matching contributions are a **3-year cliff** (0% until 3 years of service, then 100%) or **6-year graded** (20% at 2 years, 40% at 3, 60% at 4, 80% at 5, 100% at 6). Source: https://www.irs.gov/retirement-plans/issue-snapshot-vesting-schedules-for-matching-contributions
- **After-tax (non-Roth) contributions and the mega backdoor Roth.**
  - Room for after-tax contributions = 415(c) limit minus your deferrals minus employer contributions minus forfeitures.
  - With no match, that room is $47,500 for 2026 ($72k − $24.5k). Source: https://www.nerdwallet.com/retirement/learn/mega-backdoor-roths-work
  - Example (age under 50): $24,500 deferral plus $9,000 match leaves **$38,500** of after-tax room.
  - The plan must (a) accept after-tax contributions and (b) allow either an **in-plan Roth conversion** or an **in-service distribution** to a Roth IRA. Otherwise the money waits until you leave the job.
  - Contributions are already taxed, but **earnings on them are taxable when converted**. Converting promptly keeps the taxable amount small. The IRS lets you split a distribution: contributions go to a Roth IRA and earnings to a traditional IRA (Notice 2014-54).
  - The 1099-R may show box 2b "taxable amount not determined," so keep records.
  - ACP nondiscrimination testing can force refunds to HCEs.
  - Sources: NerdWallet (above); https://www.journalofaccountancy.com/news/2023/may/how-mega-backdoor-roth-works/
- **401(k) loans (IRS FAQ).**
  - Maximum: the lesser of $50,000 or "the greater of $10,000 or 50% of your vested account balance."
  - Repayment: "must occur within 5 years," in "substantially equal payments… at least quarterly." A loan to buy a principal residence can run longer.
  - "Loans are not taxable distributions unless they fail to satisfy the plan loan rules."
  - Source: https://irs.gov/retirement-plans/retirement-plans-faqs-regarding-loans
  - Pros: no credit check, and the interest goes back into your own account.
  - Cons: the borrowed money is out of the market (opportunity cost), repayments are made with after-tax pay, and leaving the job triggers an offset.
- **Leaving the job with a loan outstanding.** A qualified plan loan offset (QPLO) caused by severance or plan termination can be rolled over "until the due date, including extensions, for filing the Federal income tax return for the taxable year in which the offset occurs." Any amount not rolled over is a taxable distribution, plus 10% if you are under 59½ and no exception applies. Sources: https://www.irs.gov/retirement-plans/plan-loan-offsets and the IRS loan FAQ.
  - Example: you leave in Mar 2026 with a $20k loan, and it is offset. You can deposit $20k of your own cash into an IRA by Apr 15, 2027 (Oct 15, 2027 if you extend) and avoid tax.
- **Rule of 55.** The 10% early-withdrawal penalty does not apply if "the employee separates from service during or after the year the employee reaches age 55." The age is 50 for state and local public-safety employees in governmental plans.
  - It covers only the plan of the employer you left. The IRS table marks IRAs, SEPs and SIMPLE IRAs "no," so rolling the money to an IRA loses the exception.
  - Source: https://www.irs.gov/node/4008
- **SECURE 2.0 items that help employees.** Source: https://www.troweprice.com/financial-intermediary/us/en/insights/articles/2026/q1/secure-2-0-act-cheat-sheet.html
  - §604, Roth employer match and nonelective contributions: optional, for contributions after Dec 29, 2022. They must be fully vested and are taxable to the employee in the year contributed. Notice 2024-2 details are UNVERIFIED.
  - §110, student-loan matching: the employer can treat qualified student-loan payments as deferrals for match purposes. Applies to plan years after Dec 31, 2023.
  - §127, PLESA emergency savings: Roth contributions, account capped at **$2,500 (indexed)**, for non-HCEs, from plan years after Dec 31, 2023. The 2026 indexed cap is UNVERIFIED.
  - §115, emergency withdrawal: one per year, the lesser of $1,000 or the vested balance above $1,000, with no 10% penalty. Repayable within 3 years. Also on IRS node/4008.
  - §101, mandatory auto-enrollment: for 401(k) and 403(b) plans established after Dec 29, 2022. Starts at 3–10% of pay and escalates 1% a year to at least 10% (at most 15%), from plan years beginning after Dec 31, 2024. Exempt: new businesses (under 3 years), small employers (10 or fewer employees), church and governmental plans. Source: https://www.irs.gov/node/141906
  - §109, ages 60–63 catch-up: $11,250 in 2026.
  - §325: no pre-death RMDs from Roth 401(k)s, starting 2024.
  - §126, 529-to-Roth IRA rollover: $35k lifetime cap; the 529 must be open 15+ years.
  - §103, Saver's Match: starts 2027.

## 2. HSA as a stealth retirement account
- **2026 limits** (Rev. Proc. 2025-19): **$4,400** self-only, **$8,750** family. HDHP minimum deductible: $1,700 / $3,400. HDHP out-of-pocket maximum: $8,500 / $17,000. Source: https://kpmg.com/us/en/taxnewsflash/news/2025/05/tnf-rev-proc-2025-19-hsa-inflation-adjusted-amounts-for-2026.html
  - Catch-up at 55+: $1,000 (IRC §223(b)(3), not indexed). Not on a fetched page.
- **Triple tax advantage.** Contributions are deductible or pre-tax, growth is tax-free, and qualified medical withdrawals are tax-free. Payroll contributions also skip FICA: "HSA contributions via employer payroll deduction are exempt from FICA taxes, where 401(k) contributions are not." Source: https://www.bogleheads.org/wiki/Health_savings_account
- **Invest it and save receipts.** Most HSAs offer funds or a brokerage window. "You can even reimburse yourself in a later year for medical expenses which you paid out of pocket." This works for expenses incurred after the HSA was established. Neither fetched source gives a reimbursement deadline; that there is none is UNVERIFIED. Keep receipts. Sources: Bogleheads (above); Pub 969, via https://www.newfront.com/blog/using-an-hsa-for-non-medical-expenses
- **After 65.** Non-medical withdrawals are taxed as ordinary income with no 20% penalty: "taxed like a traditional IRA." Before 65 (unless disabled), non-medical withdrawals owe ordinary income tax plus a 20% additional tax. Medical withdrawals stay tax-free at any age. Sources: Bogleheads; Newfront.
- **State conformity.** "California and New Jersey don't recognize HSA contributions as tax-exempt at the state level." Contributions are added back to state wages and earnings are taxed every year. California residents must track dividends, interest and realized gains themselves. Sources (2026): https://claritybenefitsolutions.com/resources/clarity-news/not-every-state-treats-hsas-same-2026-compliance-roadmap-multi-state ; https://thefinancebuff.com/california-new-jersey-hsa-tax-return.html
- OBBBA (2025) HSA changes effective 2026: bronze and catastrophic marketplace plans become HSA-eligible, and direct primary care is allowed. UNVERIFIED (not fetched).

## 3. RSUs
- **Taxed at vest or settlement as ordinary wages** on the FMV of the shares delivered (W-2, with FICA and state tax). "The FMV at vesting becomes your cost basis." Sell-to-cover sells part of the vested shares to pay the withholding. Source: https://carta.com/learn/equity/rsu/
- **Federal supplemental withholding.** The flat rate is **22%** on supplemental wages up to $1M in the year, and **37% is mandatory** on the excess over $1M. Source: Pub 15, via https://www.mystockoptions.com/faq/index.cfm/ObjectID/17AAC844-5935-4EB6-AF9EB612AA30AE1C
- **Why 22% under-withholds.** Anyone whose taxable income reaches the 24/32/35% brackets owes more than 22% on the RSU income.
  - Example (single filer, $250k salary, $100k RSU vest, standard deduction, federal only): taxable income is $333,900. The RSU slice is taxed at 32% on $22,325 and 35% on $77,675, for **$34,330**. Withholding at 22% is $22,000, a **$12,330 shortfall**.
  - Fixes: a higher W-4 on regular pay, estimated payments, or a higher RSU withholding election if the employer offers one.
  - The 0.9% Additional Medicare Tax on wages above $200k also applies (IRC §3101(b)(2); not fetched).
- **Holding after vest is economically the same as buying the stock** with a cash bonus at the vest-date price. The tax is already paid either way, and later gain or loss runs from the vest FMV (short-term if held 1 year or less). This is a common planner heuristic, not a tax rule.
  - Concentration risk: your salary and your portfolio both depend on one company. Many planners cap employer stock at about 10% of net worth (rule of thumb, not a rule).
  - If the 1099-B shows $0 or no basis, adjust the basis or the vest value gets taxed twice. Source: Carta.
- **Double-trigger RSUs (private companies).** "Double-trigger RSUs require two conditions before settlement": time-based vesting plus a liquidity event (IPO or acquisition). This avoids tax on shares you cannot sell: "If units settled on time alone, you could owe taxes on shares you cannot yet sell to cover the bill." Check whether units expire before the liquidity event. Source: Carta.

## 4. ESPP (Section 423)
- **Statute** (IRC §423, via https://www.govinfo.gov/content/pkg/USCODE-2023-title26/html/USCODE-2023-title26-subtitleA-chap1-subchapD-partII-sec423.htm):
  - The purchase price can be no lower than 85% of the lesser of FMV at grant (offering start) or FMV at exercise (purchase). That gives up to a **15% discount** plus a **lookback**.
  - Offering periods can last at most 27 months, or 5 years if the price is based only on purchase-date FMV.
  - Purchases cannot accrue faster than "$25,000 of fair market value of such stock" per calendar year, measured at grant-date FMV. With a 15% discount, that is about $21,250 of payroll contributions.
  - 5% owners are excluded.
- **Qualifying disposition.** No sale "within 2 years after the date of the granting of the option" (offering start) and none "within 1 year after the transfer" (purchase). Same source.
- **Taxation.** Sources: §423(c); https://www.schwab.com/learn/story/espp-taxes
  - Qualifying: ordinary income = the lesser of (a) sale price minus purchase price, or (b) offering-date FMV minus the option price computed as if bought on the offering date. With a 15% plan, (b) is 15% × offering FMV. The rest is long-term capital gain.
  - Disqualifying: ordinary income = purchase-date FMV minus price paid, whatever the sale price. The remainder is short- or long-term capital gain or loss.
  - Basis = price paid + ordinary income recognized.
  - ESPP income is **not subject to FICA**: §3121(a)(22) excludes transfers under a §423 plan "or any disposition by the individual of such stock." Source: https://www.law.cornell.edu/uscode/text/26/3121
- **Worked example** (offering FMV $40, purchase FMV $50, 15% discount with lookback, so price = 0.85 × $40 = **$34**):
  - Sell immediately at $50 (disqualifying): $16/sh ordinary income, $0 capital gain. Pre-tax return 16/34 = **47.1%**.
  - Qualifying sale at $60: ordinary income = min($26, 15% × $40 = $6) = **$6**. LTCG = $60 − ($34 + $6) = **$20**.
  - Disqualifying sale at $60, more than 1 year after purchase but less than 2 years after offering: ordinary income $16. LTCG $60 − $50 = $10.
  - Qualifying sale at $30: ordinary income = min($30 − $34 < 0, $6) = $0. Long-term capital loss of $4.
  - Schwab's own example: subscription FMV $53, purchase FMV $65, price $45.05, sale $81. Qualifying: $7.95 ordinary + $28.00 LTCG. Disqualifying: $19.95 ordinary + $16.00 capital gain.
- **Why "sell immediately" is strong.** With the lookback, the price is at most 85% of purchase-date FMV, so an immediate sale earns at least 1/0.85 − 1 = **17.65% per purchase period**, before tax and apart from a few days' price movement.
  - Annualized over a 6-month period: about **38%** if the cash were invested for the full 6 months ((1.1765)^2 − 1). About **92%** with level payroll deductions, since the average dollar waits only about 3 months ((1.1765)^4 − 1).
  - After tax at 24% federal (no FICA): about 13.4% per period.
  - Holding for qualifying status turns part of the discount into LTCG but adds single-stock risk. My calculations.
- **Double-tax trap.** Schwab: "the cost basis shown on your 1099-B for shares you purchased under the ESPP will not include any ordinary income."
  - Use Form 3922 (dates, FMVs, price) to find the adjusted basis. On Form 8949, use adjustment code B (code B from the Form 8949 instructions; not fetched).
  - IRS: Form 3922 is issued "after your first transfer or sale of stock acquired by exercising an option" under an ESPP. Source: https://www.irs.gov/taxtopics/tc427

## 5. Stock options: ISOs vs NSOs
- **NSOs.** With no readily determinable FMV, "there's no taxable event when the option is granted." At exercise, "you must include in income the fair market value of the stock received on exercise, less the amount paid." That spread is W-2 wages, subject to withholding and FICA. Source: https://www.irs.gov/taxtopics/tc427
- **ISOs.** "You generally don't include any amount in your gross income when you receive or exercise the option," but "you may be subject to alternative minimum tax in the year you exercise an ISO." Source: Topic 427.
  - The spread at exercise is an AMT adjustment (Form 6251). AMT paid creates a minimum-tax credit for later years (Form 8801).
  - Selling in the same year as exercise (disqualifying) means no AMT adjustment. Source: https://www.cbh.com/guide/articles/tax-planning-strategies-for-incentive-stock-options-isos/
  - Statutory exemption from FICA: §3121(a)(22) (Cornell, above).
- **ISO holding periods.** No disposition "within 2 years from the date of the granting of the option" or "within 1 year after the transfer." Disqualifying disposition: the spread at exercise becomes ordinary income. If the sale price is below FMV at exercise, ordinary income "shall not exceed the excess (if any) of the amount realized… over the adjusted basis" (§422(c)(2)). Source: https://www.law.cornell.edu/uscode/text/26/422
- **$100,000 limit (§422(d)).** Options are ISOs only to the extent the grant-date FMV of stock "exercisable for the 1st time… during any calendar year" is $100k or less. The excess is treated as NSOs, in grant order. Source: Cornell §422.
- **90-day window.** An ISO requires employment until "3 months before the date of such exercise" (1 year if disabled; 10-year maximum term). An ISO exercised more than 3 months after termination is taxed as an NSO. Many plans also cut the contractual exercise window to 90 days. Source: Cornell §422.
- **2026 AMT after OBBBA** (Rev. Proc. 2025-32):
  - Exemption: **$90,100** single, **$140,200** MFJ, $70,100 MFS.
  - Phase-out begins at **$500,000** single / **$1,000,000** MFJ and is complete at $680,200 / $1,280,400. That implies a **50% phase-out rate** (OBBBA raised it from 25%).
  - The 28% AMT rate starts at $244,500 of AMTI above the exemption ($122,250 MFS).
  - Sources: https://www.currentfederaltaxdevelopments.com/blog/2025/10/9/2026-inflation-adjustments-for-tax-professionals-revenue-procedure-2025-32-analysis ; https://weneedacpa.com/2026/05/2026-amt-amounts/
  - Effect: below the threshold the exemption is larger than before, but above it the exemption now disappears faster. More high-income ISO exercisers fall into AMT than in 2018–2025.
- **83(b) election for early exercise.** It must be "made not later than 30 days after the date of such transfer" (§83(b)(2)). Source: https://www.law.cornell.edu/uscode/text/26/83
  - File on IRS Form 15620 (Nov 2024), which can also be e-filed through an IRS online account since June 2025. Source: https://www.mystockoptions.com/articles/section-83b-election-new-irs-form-restricted-stock-early-exercise-stock-options-tax-planning
  - For early-exercised **ISOs**, the 83(b) counts **only for AMT**. Under 2004 final regs (T.D. 9144), a disqualifying disposition measures ordinary income at vesting, and the capital-gain holding period starts at vesting. Early-exercise ISOs are therefore weak. Source: https://www.mystockoptions.com/articles/early-exercise-isos-complicated-by-final-irs-regulations
  - For NSOs, early exercise plus 83(b) means tax now on a spread that is often $0, and the holding period starts at exercise.
- **QSBS §1202 after OBBBA** (stock acquired after **July 4, 2025**). Sources: https://www.law.cornell.edu/uscode/text/26/1202 ; https://www.cooley.com/news/insight/2025/2025-07-11-the-one-big-beautiful-bill-act-expands-qsbs-benefits
  - Gain exclusion: 50% after 3 years, 75% after 4, 100% after 5+.
  - Per-issuer cap: the greater of **$15M** or 10× basis. Older stock keeps the $10M cap. The $15M is indexed for taxable years after 2026.
  - Gross-asset test: **$75M** before and immediately after issuance. Original issue only, C corporations only.
  - The non-excluded part is taxed at 28%, for effective rates of 14% (50% tier) and 7% (75% tier) before NIIT.
  - For employees: the clock runs from when **stock** is acquired (exercise or 83(b) transfer), not the option grant. Practitioner consensus; the statute does not address options. UNVERIFIED.
  - Whether the 50%/75% tiers create an AMT preference is UNVERIFIED. OBBBA struck the old §1202(a)(4)(C) cross-reference.

## 6. Backdoor Roth IRA
- **Steps.** Source: https://www.bogleheads.org/wiki/Backdoor_Roth
  - (1) Before Dec 31 of the conversion year, get pre-tax traditional, SEP, SIMPLE and rollover IRA balances to $0, usually by rolling them into a 401(k) that "accepts rollovers." Only pre-tax money can roll into the plan.
  - (2) Make a nondeductible contribution to a traditional IRA: $7,500 for 2026, or $8,600 at 50+. The deadline is the tax-filing date.
  - (3) Convert it to Roth, typically a day or so later, once it settles. Keeping it in cash limits taxable earnings.
  - (4) File **Form 8606**: Part I records the nondeductible basis and Part II the conversion.
- **Pro-rata rule (Form 8606).** Line 6 is "the value of all your traditional, traditional SEP, and traditional SIMPLE IRAs as of December 31." Line 10 = basis ÷ (line 6 + distributions + conversions). Line 11 = conversion × line 10, the "nontaxable portion." Source: https://irs.gov/pub/irs-prior/f8606--2024.pdf
  - Spouses' IRAs are separate, inherited IRAs are excluded, and 401(k)s do not count. Source: Bogleheads.
  - Example: $7,500 nondeductible contribution plus a $67,500 pre-tax rollover IRA on Dec 31. Ratio = 7,500 / 75,000 = 10%. Converting $7,500 gives $750 tax-free and **$6,750 taxable**.
  - If the $67,500 is rolled into the 401(k) before Dec 31, the ratio becomes 100% and $0 is taxable.
  - Bogleheads' example: $6k contribution plus $50k pre-tax gives about 10.7% tax-free, so about $5,357 is taxable.
- **Step-transaction concern.** The TCJA (2017) conference report states that "the individual can make a contribution to a traditional IRA and convert the traditional IRA to a Roth IRA," and an IRS official has publicly called the backdoor permissible.
  - Current consensus: low risk, and no waiting period is required. Some still wait a few days to a statement cycle out of caution.
  - Source: https://irahelp.com/irs-official-says-back-door-roth-transactions-are-ok/
- **Roth 5-year rules and ordering.** Source: Pub 590-B, via https://thelink.ascensus.com/articles/2022/4/20/qualified-vs-nonqualified-roth-ira-distributions
  - Clock 1, qualified distributions (tax-free earnings): starts Jan 1 of the tax year of your first Roth IRA contribution or conversion, plus age 59½, death, disability, or first home ($10k lifetime; the amount is UNVERIFIED here).
  - Clock 2: each conversion has its own 5-year clock for the **10% penalty**, which matters only before 59½.
  - Ordering: regular contributions come out first ("never subject to tax or a penalty tax"), so **contributions can be withdrawn anytime**. Conversions come next, oldest first and taxable part first, then earnings.
  - A Roth 401(k)'s 5-year clock is separate from the Roth IRA's. UNVERIFIED.

## 7. Traditional vs Roth
- **Compare marginal rates.** Compare today's **marginal** rate with the expected marginal rate on withdrawal, not the average rate. "Prefer traditional when your current marginal rate is higher than that estimate." If the rates are equal, "the traditional and Roth results are equal." Source: https://www.bogleheads.org/wiki/Traditional_versus_Roth
- If you max out the account, Roth "effectively allow[s] you to contribute more" because the limit is in after-tax dollars. The match always goes in pre-tax unless §604 Roth match is elected. Include state tax now and in retirement. Social Security taxation and IRMAA can create marginal-rate spikes, e.g. 22.2% or 40.7%. Source: Bogleheads.
- **Tax diversification.** "There is a potential advantage to having a mix" of account types, as a hedge against future tax law and to manage withdrawal brackets. Source: Bogleheads.
- **Roth conversions in low-income years.** Good windows include early retirement before Social Security and RMDs, a sabbatical, or a year of job loss. Example: "convert part of your traditional IRA to a Roth at 12%." Watch ACA subsidy cliffs and IRMAA. Source: Bogleheads.

## 8. Wheel and options taxation in a TAXABLE account
- **Premium is not income when received.** Pub 550 (quoted by TaxAct): "do not include the amount you receive for writing it in your income at the time of receipt." It stays deferred until expiration, exercise or closing. Source: https://www.taxact.com/support/14604/capital-gains-and-losses-writers-of-calls-and-puts
- **Short option expires** → "the amount you received for writing the call or put is short-term capital gain," in the year it **expires**. Statute: lapse or closing gain for the writer is treated as from a capital asset "held not more than 1 year" (§1234(b)(1)). Sources: TaxAct; https://www.law.cornell.edu/uscode/text/26/1234
- **Short put assigned** → "decrease your basis in the stock by the amount you received for the put." There is no separate gain. The stock's holding period starts at assignment (purchase date), not when the put was sold. Sources: TaxAct; https://www.schwab.com/learn/story/how-are-options-taxed
- **Covered call expires** → short-term capital gain. **Covered call assigned** → "increase your amount realized on the sale of the stock by the amount you received for the call." Whether the gain is short- or long-term depends on the **stock's** holding period. Sources: Schwab; TaxAct.
- **Buying back a short option** (closing purchase) → "the capital gain or loss is always considered short-term." Source: Schwab. Statute: a closing transaction is "any termination of the taxpayer's obligation… other than through the exercise or lapse" (§1234(b)(2)(A)).
- **Rolling** = a closing purchase (gain or loss realized now) plus a new sale (premium deferred until that option closes). These are two separate tax events. This follows from §1234(b); Schwab doesn't address rolling explicitly.
- **Year-end timing.** Sell a put on Dec 15, 2026 for $300 that expires Jan 15, 2027: nothing is taxed in 2026, and $300 of STCG lands in **2027** if it expires.
  - If assigned in Jan 2027: no gain, and the share basis drops by $3/sh.
  - If bought back on Dec 29, 2026 for $100: $200 of STCG in 2026.
  - A put premium that ends in assignment gets folded into the share basis, so it can eventually become part of a long-term gain.
- **Qualified covered calls (QCC), §1092(c)(4).** Source: https://www.customsmobile.com/uscode/26/1092 (plus the govinfo and Fidelity links below)
  - A QCC must be exchange-traded, written on stock you hold, granted **more than 30 days before expiration**, and **not deep-in-the-money**.
  - "Deep-in-the-money" = strike below the **lowest qualified benchmark (LQB)**. The LQB is generally the highest available strike below the applicable stock price (prior day's close, or the opening price if it is more than 110% of that close).
  - If the call has more than 90 days to expiration and a strike above $50: the LQB is the **second**-highest strike below the price.
  - If the stock price is $25 or less: the LQB is no lower than 85% of the price.
  - If the stock price is $150 or less: the LQB is no more than $10 below the price.
  - Calls with terms over 12 months use an adjusted price (Reg. 1.1092(c)-2, Ex. 3, uses a factor of 1.12 for a 21-month option). Source: https://www.law.cornell.edu/cfr/text/26/1.1092(c)-2
  - Fidelity's shorthand: in-the-money "by no more than one strike." Source: https://www.fidelity.com/learning-center/investment-products/options/tax-implications-covered-calls
- **ITM but still qualified (§1092(f)).** If the strike is below the stock price: "Any loss with respect to such option shall be treated as long-term capital loss" if a gain on the stock would be long-term, and "the holding period of such stock shall not include any period during which the taxpayer is the grantor of such option." That means the holding period is **suspended**. Source: https://www.govinfo.gov/content/pkg/USCODE-2011-title26/html/USCODE-2011-title26-subtitleA-chap1-subchapO-partVII.htm
  - Fidelity example: an ITM qualified call written 10.5 months into ownership made the later assigned sale **short-term**. An OTM call on the same stock kept it long-term.
- **Unqualified (deep-ITM or 30 days or less) covered call = straddle.** Sources: govinfo (§1092(a)); https://www.law.cornell.edu/cfr/text/26/1.1092(b)-2T
  - (a) A loss on one leg is deductible only "to the extent that" it exceeds unrecognized gain in the offsetting position at year-end (§1092(a)(1)).
  - (b) If the stock was held 1 year or less when the call was written, the holding period "shall not begin earlier than the date the taxpayer no longer holds… an offsetting position." The holding period is **reset to zero**, not just paused (Reg. 1.1092(b)-2T(a)(1)).
  - (c) If the stock was already long-term, its holding period is kept (Reg. (a)(2)). But a loss on the call is treated as a **long-term** capital loss (Reg. (b)(1)), when it would otherwise have been short-term.
  - Net effect: you can't use a deep-ITM call to lock in a gain while the stock's clock keeps running. The stock gain can end up short-term, and the call loss can become long-term and deferred.
  - Dividends: days the stock is covered by an ITM call don't count toward the 61-day qualified-dividend test (Fidelity's 51-day example).
  - Special year-end rule (§1092(c)(4)(E)): if a QCC is closed at a loss in one year and the stock gain falls in the next year, you must hold the stock 30+ days after closing the call or the loss is deferred.
- **Wash sales apply to options.** Sources: govinfo §1091(a); https://en.wikipedia.org/wiki/Wash_sale ; https://www.investmentnews.com/harvesting-losses-with-options-18741 ; https://www.kitces.com/blog/irs-shuts-down-wash-sale-evasion-technique/
  - The window runs from 30 days before to 30 days after the loss sale. Acquiring a "contract or option to acquire" substantially identical stock counts, so **buying a call** after selling stock at a loss triggers a wash sale.
  - **Selling a put** within the window can trigger it if the put is "likely to be exercised" (deep ITM; Rev. Rul. 85-87). Practitioners suggest at-the-money or OTM puts.
  - Assignment on a put written earlier, within 30 days after a loss sale, is an acquisition of the shares. This is an inference from §1091 ("acquired"), not a fetched rule.
  - The disallowed loss is added to the replacement's basis and the holding period carries over. An IRA purchase is the exception: Rev. Rul. 2008-5 says the loss is permanently disallowed.
  - Whether one option is "substantially identical" to another option is unsettled. Brokers flag same-underlying, same-strike re-entries inconsistently (UNVERIFIED).
- **Section 1256 vs. equity/ETF options.** Sources: https://en.wikipedia.org/wiki/1256_Contract ; https://www.cboe.com/insights/posts/why-trade-xsp-vs-spy-a-breakdown-of-the-benefits
  - §1256 covers "regulated futures contracts, foreign currency contracts, non-equity options," dealer equity options and dealer securities futures. Non-equity options include broad-based **index** options such as SPX, XSP (1/10 of SPX, cash-settled, European), NDX and RUT.
  - Treatment: **60% long-term / 40% short-term** "regardless of holding period," **marked to market** at FMV on the last business day of the year, reported on Form 6781. Net §1256 losses can be carried back 3 years.
  - Cboe: "SPY options gains on the other hand are taxed as short term capital gains… if held less than one year."
  - **SPY, QQQ and IWM options are treated as equity options (not §1256)** by brokers and most practitioners. The IRS has no explicit ruling: Wikipedia says the IRS "is not clear."
  - Example ($10k net XSP gain held 10 days, 24% bracket, 15% LTCG): 6,000 × 15% + 4,000 × 24% = **$1,860**, versus $2,400 if all short-term. The top blended rate is 0.6×20% + 0.4×37% = 26.8%, plus 3.8% NIIT.
- **State taxes.** Most states tax capital gains, short- or long-term, as ordinary income. For example, California has no special capital-gains rate. So the 60/40 split and long-term treatment help only federally in those states. UNVERIFIED by state.
- **Wheel Example A** (taxable account, single filer, 24% bracket, 1 contract = 100 shares):
  - Feb 3, 2026: sell a Mar 20 $48 put on XYZ (stock at $50) for $1.50 ($150).
  - Mar 20: XYZ is at $46 and the put is **assigned**. You buy 100 sh at $48, for a basis of $48 − $1.50 = **$46.50/sh ($4,650)**. The holding period starts at assignment. The $150 is not reported separately.
  - Apr 1: sell a May 15 $50 call for $1.00. It **expires**: $100 STCG in 2026.
  - May 18: sell a Jun 18 $50 call for $1.20. XYZ is at $52, and the call is **assigned**. Amount realized = $5,000 + $120 = $5,120, so the gain is $5,120 − $4,650 = **$470 STCG** (held under 1 year).
  - 2026 total: $100 + $470 = **$570 STCG**. Check: $150 + $100 + $120 premiums plus $200 of stock gain = $570. Federal tax = **$136.80**.
  - Rolling variant: on Jun 10 you buy back the $50 call at $2.50 instead, a $130 short-term loss now. You then sell a Jul $52 call for $2.00; that $200 is taxed only when it expires or is closed.
- **Wheel Example B** (stock held more than 1 year, then an unqualified call; single filer, 32% ordinary / 15% LTCG; $5 strike increments):
  - Jan 9, 2025: a $80 put on ABC is assigned (premium $3). Basis $77/sh ($7,700), holding period from Jan 9, 2025.
  - Jun 1, 2026 (long-term): ABC is at $120. You sell a Jul 17 **$100** call (46 days) for **$21.00** ($2,100). The LQB is the highest strike below $120, i.e. $115 (and the $150 rule sets a floor of $110). $100 is below the LQB, so the call is **deep-ITM and unqualified**, which makes a straddle.
  - B1, assigned Jul 17 at $100: amount realized $10,000 + $2,100 = $12,100, minus basis $7,700 = **$4,400 LTCG**. The holding period is preserved because the stock was long-term before the straddle. Tax at 15% = $660.
  - B2, ABC runs to $135 and you buy back the call on Jul 2 for $35.30 ($3,530), keeping the stock. The call loss of **$1,430** is a **long-term** capital loss (Reg. 1.1092(b)-2T(b)), not short-term. If you still hold the stock on Dec 31 with $5,800 of unrealized gain, the loss is **deferred** to the year you sell the stock (§1092(a)).
  - With an OTM qualified $125 call instead, the same buyback loss would be a currently deductible short-term loss, offsetting gains otherwise taxed at 32%.
  - With a 1-strike-ITM qualified $115 call: no deferral, but the loss is still long-term under §1092(f)(1).
  - Same deep-ITM call written when the stock was held only 5 months: the holding period **resets** and restarts when the call closes, so a sale 8 months later is short-term.

## 9. Wheel inside an IRA or Roth IRA
- **No tax on each trade.** There are no 1099-B events or wash-sale basis adjustments inside the account, and no 60/40 benefit to use.
  - Traditional IRA: everything is ordinary income on withdrawal (10% penalty before 59½ unless an exception applies).
  - Roth: earnings are tax-free if the distribution is qualified (§6).
  - **Losses inside an IRA are not deductible.** The IRS rules cited in §§6–8 apply.
- **Cross-account wash-sale trap.** Selling at a loss in taxable and buying the same stock (or a call, or getting assigned on a put) in the IRA within 30 days triggers a wash sale. Rev. Rul. 2008-5 says "§1091 does indeed apply to replacement purchases in IRA and Roth IRA accounts." The basis cannot be added to the IRA, so the loss is **permanently lost**. Sources: https://www.bogleheads.org/wiki/Wash_sale ; https://www.kitces.com/blog/irs-shuts-down-wash-sale-evasion-technique/
- **Broker permissions.** IRAs generally allow covered calls and cash-secured puts at the lowest option-approval levels, sometimes defined-risk spreads, and no margin or naked calls. Puts must be fully cash-secured. The levels are broker-specific and UNVERIFIED (no broker page fetched).
  - Option writing in an IRA does not generate UBTI (§512(b)(5)). UNVERIFIED.
- **Capital limit.** A new IRA can only grow by **$7,500/yr** ($8,600 at 50+) in 2026. A fresh Roth can secure about one put at a $75 strike (100 × $75 = $7,500). Rollover IRAs can be larger.
- **When the IRA is better.** Wheel income is mostly short-term (ordinary rates up to 37% + 3.8% NIIT + state), so a high-turnover wheel suits a Roth or traditional IRA if you won't need the money before 59½. In practice the record-keeping is simpler, and no wash-sale or straddle bookkeeping is needed inside the account.
- **When taxable is better.** You need deductible losses, you need more capital than the IRA holds, you trade §1256 index options (60/40 applies only in taxable accounts), the shares are already long-term-held positions in taxable, or you may need the money before retirement.

## 10. Tax-loss harvesting
- **Wash-sale rule (§1091).** A loss is disallowed if, "within a period beginning 30 days before… and ending 30 days after" the sale, you acquire substantially identical stock or securities (calendar days). The disallowed loss is added to the replacement's basis, and the holding period carries over. Sources: govinfo §1091; Bogleheads Wash sale.
  - Covered purchases: your spouse's ("your spouse or a corporation you control"), purchases in IRAs and Roth IRAs (Rev. Rul. 2008-5, loss permanently lost), and options to acquire.
  - Purchases inside a 401(k) are not addressed by Rev. Rul. 2008-5. Treat them as risky. UNVERIFIED.
- **"Substantially identical."** "The IRS does not have a clear definition of substantially identical." "There is no ruling on whether two funds operated by different companies tracking the same index are substantially identical." Source: Bogleheads Wash sale.
  - Kitces: "swapping from index funds like SPY to IVV are almost certainly a wash sale abuse." Even different-index funds can correlate at 0.98–0.99 (IVV vs VTI 0.989). Source: https://www.kitces.com/blog/the-wash-sale-problem-when-tax-loss-harvesting-almost-substantially-identical-mutual-funds-and-etfs/
- **Pairs.** The common practitioner test is a different index provider or methodology. Sources: Bogleheads TLH table https://www.bogleheads.org/wiki/Tax_loss_harvesting ; index names from https://fund-docs.vanguard.com/FA0958.pdf , https://www.etfcentral.com/compare-etfs/VXUS-vs-IXUS , https://www.etfcentral.com/compare-etfs/ITOT-vs-SCHB , https://pluang.com/en/compare/qqqm-vs-xlk , https://finance.yahoo.com/markets/stocks/articles/identical-tech-exposure-lower-cost-165458866.html
  - **VOO / IVV / SPYM (formerly SPLG)**: all track the **S&P 500**. Same index, so **riskier; avoid** as a pair.
  - **VOO ↔ VTI** (CRSP US Total Market) or **↔ SCHX** (DJ US Large-Cap Total Stock Market): different indexes, commonly used (Bogleheads lists SCHX, VV and VONE as S&P 500 substitutes).
  - **VTI ↔ ITOT** (S&P Total Market) or **SCHB** (DJ U.S. Broad Stock Market): different indexes, commonly used.
  - **VXUS** (FTSE Global All Cap ex US) **↔ IXUS** (MSCI ACWI ex USA IMI): different providers, commonly used.
  - **VGT** ("MSCI US Investable Market Information Technology 25/50") **↔ FTEC** ("MSCI USA IMI Information Technology 25/50"): **effectively the same MSCI index**, described as "nearly identical portfolios," so **avoid**.
  - **VGT ↔ XLK** (S&P "Technology Select Sector Index"): different index, the better pair.
  - **QQQ ↔ QQQM**: both track the **Nasdaq-100** and both are Invesco funds, so **avoid**.
- **"SPDL".** I found no US-listed ETF with ticker SPDL; this negative finding is UNVERIFIED. It is likely a typo for **SPLG**, which State Street **renamed SPYM** effective Oct 31, 2025 ("SPLG → SPYM," same S&P 500 fund). SPDW (SPDR Portfolio Developed World ex-US) is another near-miss. Source: https://www.ssga.com/library-content/products/fund-docs/etfs/us/information-schedules/ap-notice/notice-to-aps-ticker-fund-name-and-benchmark-index-name-changes-10-31-25.pdf
- **Accidental wash sales.** Reinvested dividends and recurring automatic buys within ±30 days create wash sales: "it is generally safer to take dividends and capital gain distributions in cash." Only the replacement shares bought are washed. Example: selling 100 sh at a loss while DRIP buys 2 sh 10 days later disallows the loss on 2 sh only. Source: Bogleheads TLH and Wash sale.
- **Carryforward.** Net capital losses offset up to **$3,000/yr** of ordinary income ($1,500 MFS), and the rest "carr[ies] forward indefinitely." Losses first offset same-term gains, then the other term. Source: Bogleheads TLH ($3k figure); IRC §1211/1212 (not fetched).
- **Gain harvesting in the 0% bracket.** Wash-sale rules apply only to **losses** (§1091(a)), so you can sell at a gain and rebuy immediately to raise your basis.
  - Example (single, 2026, $30,000 taxable income before gains): about **$19,450** of LTCG can be realized at 0% ($49,450 − $30,000).
  - Watch side effects of the higher AGI: ACA credits, state tax, IRMAA. Bogleheads: "you get no benefit from offsetting capital gains that are not taxed anyway," so don't harvest losses to offset 0%-bracket gains.

## 11. Asset location basics
- "Put tax-inefficient funds into tax-advantaged accounts to the extent possible." Taxable bonds, REITs, high-yield bonds and high-turnover active funds go in tax-deferred accounts. "Total market stock index funds are extremely tax-efficient," so they belong in taxable. Source: https://www.bogleheads.org/wiki/Tax-efficient_fund_placement
- International stock funds belong in **taxable** to claim the **foreign tax credit**: "this opportunity is lost in tax-advantaged accounts." The **Roth** gets the highest expected return because it has no RMDs and growth is tax-free. Placement matters less when bond yields are low. Source: same.
- For a wheel or short-term options strategy, the ordinary-rate income makes it a tax-inefficient "asset," so it is a candidate for an IRA (see §9).
