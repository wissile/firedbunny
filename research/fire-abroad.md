# FIRE, withdrawals, US taxes, health insurance and living abroad: fact-check notes (as of Oct 21, 2026)

Conventions: "UNVERIFIED" = not confirmed from a fetched source in this pass (memory or secondary claim); verify before publishing. "Computed" = arithmetic done here from cited inputs. The web-search budget ran out partway through, so several visa/cost items are UNVERIFIED.

---

## 1. Safe withdrawal rates (SWR) and FIRE flavors

**Bengen**
- 1994 paper: "Determining Withdrawal Rates Using Historical Data," *Journal of Financial Planning*, Oct 1994, pp. 14-24. https://en.wikipedia.org/wiki/Trinity_study
- Original worst case ("SAFEMAX") ~4.15% over 30 years, rounded to the "4% rule"; 60% US large-cap / 40% intermediate Treasuries, rebalanced annually. https://www.advisorperspectives.com/articles/2025/08/29/bill-bengen-boosts-the-4-rule-to-4-7
- Aug 2025 book *A Richer Retirement: Supercharging the 4% Rule to Spend More and Enjoy More* (Wiley): new SAFEMAX **4.7%** (30 years). Gain comes from adding US small/micro/mid caps and international stocks; small caps alone moved 4.15% -> 4.5%. Same source.
- New allocation ~55% stocks / 40% bonds / 5% T-bills (AP text says "45% bonds," which sums to 105%, likely a typo; check the book). 349 quarterly cohorts from 1926; assumes tax-deferred accounts; high CAPE + high inflation lower the safe rate.
- Bengen calls inflation retirees' "greatest enemy." July 2026 headline: "The 4% Rule No Longer Works for Retirees, Says the Man Who Invented It" (body not read). https://www.morningstar.com/retirement/bill-bengen-inflation-is-greatest-enemy-retirees ; https://wtop.com/news/2026/07/the-4-rule-no-longer-works-for-retirees-says-the-man-who-invented-it/

**Trinity study**
- Cooley, Hubbard & Walz, "Retirement Savings: Choosing a Withdrawal Rate That Is Sustainable," *AAII Journal* 10(3), 1998. Ibbotson data 1925/26-1995; 15-30 year payouts, level or inflation-adjusted.
- Finding: 3-4% inflation-adjusted withdrawals had high success for stock-heavy portfolios; success = money left after the period. https://en.wikipedia.org/wiki/Trinity_study
- ERN restates it: 4% with 50/50 had ~95% success over 30 years (see below).

**Early Retirement Now (Karsten Jeske) SWR series** (monthly US data from 1871, horizons 30-60 years)
- 4% with 50/50: ~95% success over 30 years but **~65% over 60 years** (failure 7x more likely). 5% is "unacceptably" risky for early retirees. Headline: "**3.5% is the new 4%**." https://earlyretirementnow.com/2016/12/07/the-ultimate-guide-to-safe-withdrawal-rates-part-1-intro/
- CAPE 20-30, 60 years, goal of keeping 50% of real principal: 3.5% with 100% equities = 88% success; **3.25%** gets ~97%. A later ERN update prefers 70-80% equities over 100%. https://earlyretirementnow.com/2016/12/21/the-ultimate-guide-to-safe-withdrawal-rates-part-3-equity-valuation/
- 48 vs 60 years differ little, 30 vs 60 differ a lot. ERN calls 3.5% (28.6x) a reasonable start and 2.75% (36.4x) "quite substantial." https://earlyretirementnow.com/2019/06/26/does-a-4-percent-withdrawal-rate-survive-a-60-year-retirement/
- Site summary: for 40-60 year retirements, ERN-style research points to **~3.25-3.5%** fixed real withdrawals, higher with flexibility.

**Morningstar**
- Safe starting rate for 2026 (Dec 2025 "State of Retirement Income"): **3.9%**, up from 3.7%. Assumes 30 years, 90% success, 30-50% equities, fixed inflation-adjusted withdrawals.
- Flexible methods (guardrails, constant %, endowment) support higher starts, approaching ~6% if spending can vary. https://www.morningstar.com/retirement/whats-safe-retirement-withdrawal-rate-2026 ; https://www.morningstar.com/business/insights/research/the-state-of-retirement-income

**Sequence-of-returns risk** (Schwab example) https://www.schwab.com/learn/story/timing-matters-understanding-sequence-returns-risk
- $1M portfolio, $50k first-year withdrawal rising 2%/yr. Two -15% years at the **start** then +6%/yr: money runs out in ~18 years. Same two bad years in years 10-11: nearly $400k left after 18 years.
- After early losses, recovery takes ~11.5 years at a 2% withdrawal rate vs ~28 years at 4%.

**Bucket / cash reserve:** Schwab suggests ~1 year of expenses (after other income such as Social Security) in cash plus 2-4 years in short-term high-quality bonds, so stocks aren't sold in a downturn. Same Schwab URL.

**Guyton-Klinger guardrails** (2006, Journal of Financial Planning) https://www.whitecoatinvestor.com/guyton-klinger-guardrails-approach-for-retirement/
- Initial rate 5.2-5.6% (≥65% equities, all rules applied).
- Capital preservation: if the current rate rises >20% above the initial rate, cut spending 10%. Prosperity: if it falls >20% below, raise spending 10%.
- Inflation raises capped at 6%; Kitces describes them as applying after positive-return years (the "skip after a down year" reading is UNVERIFIED). The cut rule is dropped in the last 15 years. https://www.kitces.com/blog/implementing-retirement-income-guardrails-to-facilitate-the-right-spending-raises-and-spending-cuts/
- Example (computed): $1M at 5% = $50k. Portfolio falls to $800k, rate becomes 6.25% (>20% above 5%), so spending drops to $45k.

**Bogleheads VPW** https://www.bogleheads.org/wiki/Variable_percentage_withdrawal
- Withdraw (current balance) x (table %). The % depends on age (younger spouse for couples) and stock share (30-70%); table built from 1871-2022 US data.
- 50/50: age 40 = 3.8%, 50 = 4.1%, 60 = 4.5%, 65 = 4.8%. 60/40: 4.1%, 4.3%, 4.7%, 5.0%.
- Never depletes the portfolio early, but spending swings with markets. Bogleheads suggests considering an annuity (SPIA) around age 80.

**Multiples (computed)**
| Withdrawal rate | Multiple | Portfolio for $60k/yr |
|---|---|---|
| 4% | 25x | $1.5M |
| 3.5% | 28.6x | $1.71M |
| 3.25% | 30.8x | $1.85M |
| 3% | 33.3x | $2.0M |

**FIRE flavors** (https://www.fool.com/retirement/2025/07/26/types-of-fire-which-one-is-right-for-you/)
- **Lean:** ~$40k/yr or less. **Fat:** ~$100k+/yr; the Fool cites 25-33x spending.
- **Barista:** leave full-time work; part-time income (often with health insurance) covers part of spending.
- **Coast:** save enough early that growth alone reaches the target by normal retirement age; the Fool uses ~6% returns. Computed: $1M (today's dollars) at 65, starting at 35 with 5% real growth, needs $1M / 1.05^30 ≈ $231k now.
- **Slow FI:** reach FI at a comfortable pace and use partial progress (sabbaticals, fewer hours) along the way; ChooseFI credits "Jessica" (The Fioneers) with coining it. https://choosefi.com/contributor/the-fioneers ; https://www.hellobrigit.com/learn/slow-fi-another-path-to-financial-independence

---

## 2. Getting retirement money before 59½

IRS list of exceptions to the 10% penalty: https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions

**Rule of 55**
- Applies to qualified plans (401(k)/403(b)) of the employer you leave, if you separate in or after the calendar year you turn **55**. **Not IRAs**; rolling the 401(k) into an IRA loses it.
- Age **50** for state/local public-safety staff, federal law enforcement, firefighters, corrections and CBP officers, and air traffic controllers. SECURE 2.0 "or 25 years of service": UNVERIFIED (not on the IRS page).
- Governmental 457(b) withdrawals generally carry no 10% penalty at all (except rolled-in money).

**72(t) SEPP** https://www.irs.gov/retirement-plans/substantially-equal-periodic-payments
- Three methods: RMD (recalculated yearly), fixed amortization, fixed annuitization. Payments run until the **later of 5 years or age 59½**.
- Changing them triggers recapture: 10% on all prior SEPP payouts plus interest. One switch from a fixed method to RMD is allowed.
- **Notice 2022-6:** interest rate up to the **greater of 5% or 120% of the federal mid-term rate** (either of the two months before the first payment).
- Computed: $500k IRA at age 50, fixed amortization at 5%, life expectancy ~36.2 years (UNVERIFIED table factor) ≈ $30.2k/yr until 59½.

**Roth conversion ladder** https://www.schwab.com/learn/story/what-to-know-about-five-year-rule-roths
- Each conversion has its own 5-year penalty clock starting **Jan 1 of the conversion year**. Withdrawal order: contributions, then conversions (oldest first), then earnings.
- Example: a $40k conversion in Dec 2026 is penalty-free from Jan 1, 2031. The conversion is ordinary income that year and counts in ACA MAGI.

**Roth IRA contributions (basis):** come out first, tax- and penalty-free anytime (already taxed). Same Schwab URL.

**HSA "shoebox" receipts** https://www.irs.gov/publications/p969 ; https://www.fidelity.com/learning-center/smart-money/hsa-reimbursement
- Tax-free reimbursement for qualified expenses incurred **after the HSA was opened**, with no time limit; keep receipts.
- Non-medical withdrawals before 65 are taxed plus a 20% extra tax. 2026 limits: $4,400 self-only, $8,750 family, +$1,000 at 55+.

**Taxable brokerage as a bridge:** no age limits; only the gain part of each sale is taxed, often at 0% (section 3).

**Other 10%-penalty exceptions** (IRS page above)
- Emergency: lesser of $1,000 or (vested balance − $1,000), once per year, after 12/31/2023 (SECURE 2.0). Repayable within 3 years and blocks a new one for 3 years unless repaid: UNVERIFIED.
- Domestic abuse: lesser of $10k or 50%. Federally declared disaster: up to $22k. Birth/adoption: $5k per child.
- Medical costs above 7.5% of AGI; terminal illness; disability; death.
- IRA only: first home ($10k lifetime), higher education, health premiums while unemployed (after 12 weeks of unemployment pay).
- SIMPLE IRA withdrawals in the first 2 years: 25% penalty.

---

## 3. US taxes on FIRE withdrawals (tax year 2026)

**Core numbers** (Rev. Proc. 2025-32) https://kpmg.com/us/en/taxnewsflash/news/2025/10/tnf-rev-proc-2025-32-inflation-adjustments-for-2026-individual-taxpayers.html
- Standard deduction: $16,100 single, **$32,200 married filing jointly (MFJ)**, $24,150 head of household.
- MFJ brackets: 10% to $24,800; 12% to $100,800; 22% to $211,400. Single: 10% to $12,400; 12% to $50,400; 22% to $105,700.

**Long-term gains / qualified dividends** (taxable income) https://www.kiplinger.com/taxes/irs-updates-capital-gains-tax-thresholds
| Rate | Single | MFJ | Head of household |
|---|---|---|---|
| 0% | to $49,450 | to **$98,900** | to $66,200 |
| 15% | to $545,500 | to $613,700 | to $579,600 |
| 20% | above | above | above |
- Gains stack on top of ordinary income.
- **NIIT:** 3.8% above MAGI of $200k single / $250k MFJ (statutory, not indexed). https://www.irs.gov/individuals/net-investment-income-tax

**Worked examples, MFJ, no other income (computed)**
- **$80k spending from taxable, half of each sale is gain:** $40k gain − $32,200 = $7,800 taxable, all at 0%, so **$0 federal tax**. Even if all $80k were gain: $47,800 taxable, still $0.
- **0% ceiling:** a couple can realize $98,900 + $32,200 = **$131,100** of gains/qualified dividends at 0%; single $49,450 + $16,100 = $65,550.
- **$120k of withdrawals:**
  - (a) Taxable, 50% gain: $60k gain, $27,800 taxable, **$0**.
  - (b) Taxable, 100% gain: $87,800 taxable (< $98,900), **$0**.
  - (c) All from a traditional IRA: $87,800 ordinary; 10% x 24,800 + 12% x 63,000 = **$10,040** (8.4%); +$12,000 if the 10% penalty applies.
  - (d) $40k Roth conversion + $80k of sales with $40k gain: $7,800 ordinary taxable at 10% = $780; gains stack to $47,800 at 0%. Total **$780**. MAGI $80k stays under the 2-person ACA 400% line ($84,600).
- **Roth conversions in low brackets (MFJ, no other income):** $32,200 tax-free (standard deduction); to $57,000 within 10% (tax $2,480); to $133,000 within 12% (tax $11,600, 8.7% average). Trade-off: conversions use up 0% gain space and raise ACA MAGI.

**States**
- No broad income tax: AK, FL, NV, SD, TN, TX, WY, plus **NH** (interest/dividend tax ended 2025). https://finance.yahoo.com/markets/currencies/articles/states-where-avoid-taxes-capital-175313363.html
- **WA:** no wage tax, but a 7% capital gains tax (9.9% on gains above $1M) after a ~$250k+ deduction (same source). ESSB 6346 adds a **9.9% tax on income above $1M from Jan 1, 2028**; Initiative 645 is on the Nov 3, 2026 ballot. https://www.thestartuplawblog.com/washington-state-income-tax/
- Most income-tax states tax gains as ordinary income; a few give partial breaks (e.g., AR, AZ, MT, NM, ND, SC, VT, WI). UNVERIFIED: details per state.

---

## 4. Health insurance before 65 (2026)

**Enhanced ACA subsidies** https://healthinsurancenetwork.org/guide/will-aca-subsidies-come-back ; https://taxpayers.net/guides/aca-subsidy-status-2027 ; https://www.cnbc.com/2026/01/08/obamacare-subsidies-extension-congress.html
- Enhanced premium tax credits **expired Dec 31, 2025**. 2026 uses the original §36B rules: the **400% FPL cliff is back** (no credit above 400% FPL).
- House passed a 3-year extension (H.R. 1834), 230-196, Jan 8, 2026. The Senate never voted (on calendar Feb 10, 2026). S.3385 failed cloture 51-48 on Dec 11, 2025. A bipartisan "CARE Act" (cap ~700% FPL) was still being negotiated in late Sep 2026; not law.
- 2027: cliff still applies under current law. HealthCare.gov open enrollment Nov 1, 2026 - Jan 15, 2027 (Dec 15 for Jan 1 coverage). 2027 expected-contribution range 2.15-10.22% (Rev. Proc. 2026-26; secondary source, taxpayers.net).

**Poverty-line (FPL) figures for 2026 coverage (2025 guidelines)** https://www.healthcare.gov/glossary/federal-poverty-level-fpl/
- 100% FPL: $15,650 (1 person), $21,150 (2), $32,150 (4). Higher in AK/HI.
- Computed 400% cutoff: **$62,600 (1), $84,600 (2), $128,600 (4)**. Computed 138% Medicaid line: $21,597 / $29,187 / $44,367.

**2026 expected contribution, % of income for the benchmark silver plan** https://www.currentfederaltaxdevelopments.com/blog/2025/7/18/rev-proc-2025-25-a-technical-review-of-2026-premium-tax-credit-and-affordability-adjustments
- <133% FPL: 2.10% | 133-150%: 3.14-4.19% | 150-200%: 4.19-6.60% | 200-250%: 6.60-8.44% | 250-300%: 8.44-9.96% | 300-400%: 9.96% | >400%: no credit.

**Unsubsidized cost**
- 2026 national average benchmark silver for a **40-year-old: $625/month** (Vermont highest $1,299; New Hampshire lowest $401). KFF via https://www.beckerspayer.com/payer/aca/states-ranked-by-average-aca-benchmark-premiums-in-2026/
- A 60-year-old pays ~2.1x a 40-year-old under the federal default age curve (2.714 vs 1.278; UNVERIFIED): ≈ **$1,330/month** each, ≈ **$2,650/month (~$31.9k/yr)** for a 60/60 couple (computed estimate).

**Cliff example (computed):** a couple aged 60 with MAGI $80,000 (378% FPL) pays 9.96% = $7,968/yr; the credit is ≈ $31.9k − $8.0k = **$23.9k/yr**. At MAGI $85,000 (402% FPL) the credit is **$0**: $5k more income costs ~$24k.

**MAGI management** https://www.healthcare.gov/income-and-household-information/income/
- MAGI = AGI + untaxed foreign income (e.g., FEIE-excluded wages) + non-taxable Social Security + tax-exempt interest.
- Counts: capital gains, IRA/401(k) withdrawals, **Roth conversions**, dividends, interest. Doesn't count: qualified Roth distributions, gifts, loans. Returning Roth IRA contributions isn't income; selling high-basis shares adds little MAGI.

**Medicaid**
- Medicaid for adults 19-64 under the income-only (MAGI) rules has **no asset test** (ACA removed it), so an asset-rich early retiree with income ≤138% FPL in an expansion state can qualify. https://bplc.cssny.org/pbm/health-programs/medicaid/magi-medicaid-vs-non-magi-medicaid
- If projected income is under 138% FPL in an expansion state, the marketplace sends you to Medicaid instead of a credit.
- **New for 2027:** under OBBBA and the CMS interim final rule (published Jun 1, 2026), expansion adults 19-64 must show **80 hours/month** of work, community service, a work program or half-time school, or income ≥ 80 x the federal minimum wage. Exemptions include medical frailty and some caregivers. States must start by **Jan 1, 2027**; good-faith extensions can run to Dec 31, 2028. Covers 41 expansion states + DC. https://www.foleyhoag.com/news-and-insights/publications/alerts-and-updates/2026/june/cms-issues-interim-final-rule-imposing-medicaid-work-requirements-for-expansion-populations/
- This is a major new risk for "Medicaid as early-retiree insurance."
- Estate recovery: states recover some costs for enrollees 55+, sometimes including managed-care premiums. UNVERIFIED: details vary by state.

**COBRA:** required at employers with 20+ employees; premium up to **102%** of plan cost. https://www.dol.gov/general/topic/health-plans/cobra Usually 18 months after job loss (36 for some events): UNVERIFIED (not on that page).

**Health care sharing ministries:** not insurance (you're uninsured), no guaranteed payment, pre-existing limits, not regulated by state insurance departments; providers need not honor their discounts. https://doi.nebraska.gov/sites/default/files/doc/ConsumerAlertHealthCareSharingMinistries.pdf

---

## 5. Social Security for early retirees

**Eligibility and formula**
- Need **40 credits** (max 4/yr). 2026: $1,890 of covered earnings = 1 credit; $7,560 earns all 4. https://www.ssa.gov/benefits/retirement/planner/credits.html
- Benefit uses your **highest 35 years** of indexed earnings (AIME); fewer years means zeros fill the rest (standard SSA rule; the page says "up to 35 years ... are needed"). 2027 bend points: $1,340 and $8,077. https://www.ssa.gov/oact/cola/Benefits.html
- Computed zero-years example (2027 bend points): 20 years at $80k then retire gives AIME $3,810, PIA ≈ $1,996/mo. 35 years at $80k gives AIME $6,667, PIA ≈ $2,911/mo. 15 zero years cut AIME 43% but PIA only ~31% (progressive formula).

**Claiming ages** (born 1960+, full retirement age 67) https://www.ssa.gov/benefits/retirement/planner/agereduction.html
- 62 = **70%** of full benefit (PIA); 67 = 100%; 70 = **124%** (+8% per year of delay).
- Spousal: up to 50% of the worker's PIA at the spouse's full retirement age; 32.5% if claimed at 62.
- Computed break-evens (PIA $2,000, real terms, no discounting): 62 vs 67 ≈ age 78.7; 67 vs 70 ≈ 82.5; 62 vs 70 ≈ 80.4.

**Earnings test** (matters only if you work before full retirement age) https://www.ssa.gov/oact/cola/rtea.html
- 2026: $24,480 ($1 withheld per $2 over); $65,160 in the year you reach full age ($1 per $3). 2027: $25,560 / $67,920. Withheld benefits are credited back later.

**Other figures**
- 2026 taxable maximum: $184,500. https://www.ssa.gov/oact/cola/cbb.html
- SSA lists a **3.6% COLA** determined Oct 14, 2026 (for 2027 benefits). https://www.ssa.gov/oact/cola/colasummary.html 2026 COLA of 2.8%: UNVERIFIED.

**Payments abroad** https://www.ssa.gov/pubs/EN-05-10137.pdf
- US citizens can generally get benefits abroad. Treasury can't send them to **Cuba or North Korea** (withheld amounts are paid after you move).
- Restricted (limited exceptions): Azerbaijan, Belarus, Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan, Uzbekistan. Noncitizens face a 6-month-abroad rule. https://www.ssa.gov/international/payments.html
- **Medicare generally doesn't cover care outside the US.** Late Part B enrollment adds 10% to the premium per 12 months you could have enrolled. Medigap C-N foreign emergency coverage (80% after $250, $50k lifetime): UNVERIFIED.

**Totalization agreements** https://www.ssa.gov/international/agreements_overview.html
- **31** agreements, including Romania (in force Sep 1, 2026). **US-France in force since July 1, 1988.**
- They stop double social-security tax on work and let you combine credits to qualify for partial benefits.

---

## 6. Living abroad as a US citizen

**Filing**
- US citizens are taxed on worldwide income wherever they live and file Form 1040 every year (if over the filing threshold). Abroad: automatic extension to **June 15** (interest runs from Apr 15); Form 4868 extends to Oct 15. Form 3520 for gifts >$100k from foreign persons. https://www.irs.gov/individuals/international-taxpayers/us-citizens-and-resident-aliens-abroad
- **Foreign earned income exclusion (FEIE, Form 2555): $132,900 for 2026** (KPMG link, section 3). **Earned income only** (wages, self-employment; doesn't reduce self-employment tax).
  - Pensions, annuities and Social Security are expressly excluded. Dividends, interest, gains and IRA/401(k) withdrawals aren't "earned," so FEIE gives **no help to a portfolio-funded retiree**.
  - Qualify via bona fide residence or physical presence (330 days in 12 months). https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion Excluded income still counts in ACA MAGI.
- **Foreign tax credit (Form 1116):** credits foreign income tax against US tax; the main tool for retirees. There's nothing to offset if US tax is already $0. Form details UNVERIFIED.

**Foreign account reporting**
- **FBAR (FinCEN 114):** required if foreign accounts total **> $10,000 at any time** in the year. Due Apr 15, automatic extension to Oct 15. https://www.irs.gov/businesses/small-businesses-self-employed/report-of-foreign-bank-and-financial-accounts-fbar
- **Form 8938 (FATCA), living abroad:** single **$200k** at year-end / $300k any time; MFJ **$400k / $600k**. US residents: $50k/$75k single, $100k/$150k MFJ. Penalty $10k, up to +$50k for continued failure. https://www.irs.gov/businesses/corporations/summary-of-fatca-reporting-for-us-taxpayers

**PFIC trap** https://www.bogleheads.org/wiki/Passive_foreign_investment_company
- Most non-US mutual funds/ETFs, including EU UCITS funds from US firms, are PFICs; each needs Form 8621. The default regime taxes at the top historical rate plus interest (effective rate can be ~100%). QEF or mark-to-market elections are the escape hatches.
- Safest: US-domiciled funds or individual stocks and bonds (Bogleheads notes this "may cause local tax problems"). EU PRIIPs/KID rules often block EU residents from buying US ETFs: UNVERIFIED.

**Brokers**
- Schwab One International is for non-US persons and depends on country of residence; Schwab also has an "expat" offering. https://international.schwab.com/
- Interactive Brokers generally accepts US citizens abroad; Fidelity and Vanguard often restrict accounts with a foreign address. UNVERIFIED; check each broker and don't keep a fake US address.

**State residency and renunciation**
- State tax domicile can follow you abroad; CA, NY, VA, NM and SC are called "sticky." Cut ties (domicile, license, voter registration, home). UNVERIFIED (practitioner consensus).
- Renunciation fee: long $2,350; whether it was cut (a reduction to $450 was reported/proposed) is UNVERIFIED; check travel.state.gov.
- **Covered expatriate** (exit tax) if net worth ≥ **$2M**, or 5-year average net income tax > **$206k** (2025), or failure to certify 5 years of compliance (Form 8854). Mark-to-market exclusion **$890k** (2025); 2026 figures not verified. https://www.irs.gov/individuals/international-taxpayers/expatriation-tax

---

## 7. US-France specifics (US citizen or dual US-French citizen who is a French tax resident)

**French income tax**
- France taxes **residents** on worldwide income; nationality is irrelevant. Residence tests (home or main stay, main work, center of economic interests; CGI art. 4 B): UNVERIFIED.
- **2026 scale (on 2025 income), per part:** to €11,600 0% | €11,601-29,579 11% | €29,580-84,577 30% | €84,578-181,917 41% | >€181,917 45%. https://www.service-public.gouv.fr/particuliers/vosdroits/F1419
- **Quotient familial:** couple = 2 parts; +0.5 for each of the first two children, +1 from the third (2 kids = 3 parts; 3 = 4). Child benefit capped at €1,807 per extra half-part. https://www.service-public.gouv.fr/particuliers/vosdroits/F2705
- **Décote 2026:** single if gross tax ≤ €1,982 (décote = €897 − 45.25% x tax); couple if ≤ €3,277 (€1,483 − 45.25% x tax). https://www.service-public.gouv.fr/particuliers/vosdroits/F34328
- Computed: **€0 income tax** up to ~**€17,200** taxable income (single) or ~**€32,500** (couple).

**Investment income and social charges** https://www.service-public.gouv.fr/particuliers/vosdroits/F2329
- **Flat tax (PFU) 2026: 31.4%** = 12.8% income tax + **18.6% social charges** (CSG 10.6%, up 1.4 points under LFSS 2026, Loi n° 2025-1403, art. 12; CRDS 0.5%; solidarity levy 7.5%).
- **30%** (social charges 17.2%) for assurance-vie, PEL/CEL/PEP, rental income and real-estate gains. You can opt for the progressive scale instead (global election; part of CSG becomes deductible).
- **Reduced 7.5%-only rate:** only for people covered by an **EEA or Swiss** social security scheme and not by France's. Non-EEA schemes aren't mentioned, so a **US-affiliated** French resident appears to owe the full 18.6% / 17.2%; residents are usually in French public health insurance (PUMa) anyway.
- Cotisation subsidiaire maladie: 6.5% on capital income above ~50% of the social security ceiling (PASS) for PUMa members with low earned income; could hit FIRE retirees. UNVERIFIED (urssaf page didn't load).

**US-France treaty** (signed Aug 31, 1994; effective Jan 1, 1996; later protocols 2004, 2009) https://www.irs.gov/pub/irs-trty/france.pdf
- **Saving clause (Art. 29(2)):** the US taxes its citizens as if there were no treaty. Exceptions include Art. 18(1)(b), 24, 25, 26.
- **Art. 18(1)(b), social security:** taxable **only in the paying country**. **US Social Security paid to a French resident is taxable only in the US.** French social security paid to a French-resident US citizen is taxable only in France (the exception survives the saving clause).
- **Art. 18(1)(a), private pensions:** pensions and "distributions from pension and other retirement arrangements" (401(k)/IRA) are taxable **only in the country of residence**. The US still taxes citizens under the saving clause; the two credit regimes then interact (resourcing needs a professional).
- **Art. 24(2), French credits:** US-source income taxable in the US goes into the French base but gets a credit **equal to the French tax** on it (clause i): effectively exempt, but it can raise the rate on other income. For dividends/interest/royalties the credit is capped at US tax actually paid (clause iii).
- **Art. 24(2)(b):** gives **US citizens** in France the full clause-(i) credit on US dividends/interest from public US companies, the US government and others, plus US annuities. Whether this also removes CSG/CRDS: UNVERIFIED (the 2004 protocol reportedly added CSG/CRDS to covered taxes); get advice.
- **Roth IRA:** French treatment **uncertain**. Art. 18(2)(c) ("taxable when the other State treats it as gross income") covers only non-nationals working there, so a dual citizen can't rely on it. Assume Roth earnings could be taxable in France. UNVERIFIED.
- Dividend withholding (Art. 10): 15% (5% for ≥10% corporate holders).

**Wealth tax, assurance-vie, totalization**
- **IFI (real-estate wealth tax):** applies when net non-business real estate is **> €1.3M** on Jan 1; residents are taxed on worldwide real estate; new arrivals after 5+ years abroad are taxed only on French property for 5 years; financial assets are exempt. https://www.service-public.gouv.fr/particuliers/vosdroits/F563
- **Assurance-vie:** social charges stay at 17.2% (F2329). For US persons, often a PFIC/foreign-trust reporting headache: UNVERIFIED.
- **Totalization:** US-France agreement in force since **July 1, 1988**; avoids double social tax on work and combines credits. https://www.ssa.gov/international/agreements_overview.html

**Reality check: "as a US and French citizen you don't get taxed under a certain amount"**
- **False as a blanket rule.** There's no dual-citizen exemption. France taxes you because you **live** there; the US taxes you because you're a **citizen**. You file a US 1040 (+FBAR/8938) and a French return.
- **True in a narrow sense:** low incomes can mean **€0 French income tax** (0% band to €11,600 per part + décote; ~€17.2k single / ~€32.5k couple) and **$0 US federal tax** (standard deduction + 0% gains up to $98,900 taxable MFJ).
- **But French social charges (18.6% on most investment income, 17.2% on some) apply from the first euro**, even when income tax is zero: €10,000 of dividends or gains can still cost €1,860.
- US Social Security is taxable only in the US, and at low incomes often little or none of it is taxed. Get US-French cross-border professional advice.

---

## 8. Early-retirement destinations: couple's budget and visas

**Method (computed):** couple ≈ 2 x Numbeo "single person, excluding rent" + a 1-bedroom rent (outside center to center); Numbeo data updated Oct 2026. Implied FX: 1 EUR = $1.124; 33.6 THB, 18.4 MXN, 3,150 COP, ~17,980 IDR per USD. **Excludes health insurance, visas, travel: add 10-25%.**

| Location | Couple/month incl. rent | Notes and source |
|---|---|---|
| Chiang Mai | ~$1,400-1,550 | single ex-rent $538; 1BR ฿10.2k-15.6k https://www.numbeo.com/cost-of-living/in/Chiang-Mai |
| Bali | ~$1,750-2,150 | single $576; 1BR Rp10.7M-17.6M https://www.numbeo.com/cost-of-living/in/Bali |
| Mérida | ~$1,900-2,050 | single $713; 1BR MX$8.3k-11.5k https://www.numbeo.com/cost-of-living/in/Merida |
| Mexico City | ~$2,200-2,550 | single $766; 1BR MX$12.1k-19.0k https://www.numbeo.com/cost-of-living/in/Mexico-City |
| Medellín | ~$2,300-2,750 | single $841; 1BR COP 2.0M-3.3M https://www.numbeo.com/cost-of-living/in/Medellin |
| Porto | ~$2,550-2,900 | single $807; 1BR €852-1,153 https://www.numbeo.com/cost-of-living/in/Porto |
| Valencia | ~$2,700-3,050 | single $819; 1BR €947-1,271 https://www.numbeo.com/cost-of-living/in/Valencia |
| Lisbon | ~$2,900-3,300 | single $850; 1BR €1,063-1,425 https://www.numbeo.com/cost-of-living/in/Lisbon |
| Paris | ~$3,550-3,900 | single $1,175; 1BR €1,078-1,387; 3BR €2,033-3,049 https://www.numbeo.com/cost-of-living/in/Paris |
| Rural France (Limoges proxy) | rough ~$2,000-2,600 | 1BR €375-477, 3BR €725-867 (few data points) https://www.numbeo.com/cost-of-living/in/Limoges-France; ex-rent living costs ~$1,600-2,000 is an UNVERIFIED estimate; a car is usually needed |
| US Midwest (Indianapolis) | ~$3,750-4,100 + ACA premiums | single $1,197; 1BR $1,350-1,720 https://www.numbeo.com/cost-of-living/in/Indianapolis |
| San Francisco | ~$8,000-9,500 (estimate) | Expatistan: single ~$5,735-5,980 incl. rent; family of 4 ~$8,800-9,060; 900 sq ft furnished $3,976-5,446 https://www.expatistan.com/cost-of-living/san-francisco (Numbeo SF page showed stale 2019 data) |

**Visas and residency paths** (confirm all with the consulate)
- **Portugal D7** (passive income): ~Portuguese minimum wage per month for the applicant (€870 in 2025; ~**€920 in 2026**, UNVERIFIED), +50% spouse, +30% per child. NHR is closed to newcomers; its replacement IFICI targets qualifying professionals/researchers and **doesn't cover passive retirees**: UNVERIFIED.
- **Spain non-lucrative visa:** **400% of IPREM** + **100% per family member**. IPREM 2026 = **€600/month, €7,200/yr**. https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Documents/IPREM.pdf
  - Computed: €2,400/month (€28,800/yr) single; **€36,000/yr couple**.
  - No work allowed; Spanish private health insurance with no copays or deductibles (travel insurance not accepted); US visa fee $140. https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-residencia-no-lucrativa.aspx
  - Spain taxes residents' worldwide income (savings up to ~30%) and has regional wealth tax plus a "solidarity" tax on large fortunes: UNVERIFIED.
- **France long-stay visitor visa (VLS-TS "visiteur"):** no work; resources usually benchmarked to the net minimum wage (UNVERIFIED) plus private health insurance. Minimum wage (SMIC) from mid-2026: €1,867.02 gross / ≈ **€1,477.93 net per month**. https://www.service-public.gouv.fr/particuliers/vosdroits/F2300 Dual French citizens need no visa.
- **Italy:** elective residence needs stable passive income (~€31k/yr single, ~€38k couple by consular practice): UNVERIFIED. **7% flat tax** on all foreign income for 10 years for foreign-pension recipients who move to qualifying southern towns (≤20k people) after 5 years non-resident: UNVERIFIED (Agenzia Entrate page didn't load); US Social Security and government pensions depend on the treaty.
- **Greece:** Financially Independent Person visa ~**€3,500/month** (+20% spouse, +15% per child); Art. 5B **7% flat tax** on foreign income for foreign pensioners, 15 years. Both UNVERIFIED.
- **Mexico temporary residency:** income/savings tests tied to the minimum wage or UMA and vary by consulate; roughly US$4,000-4,500/month income or ~US$70-75k savings in 2025-26. UNVERIFIED.
- **Costa Rica:** pensionado **$1,000/month** lifetime pension; rentista **$2,500/month** for 2 years (or $60k deposit); residents join the national health system (CAJA). UNVERIFIED (migracion.go.cr didn't load).
- **Panama pensionado:** **$1,000/month** lifetime pension (~$750 if you buy ≥$100k of property), plus local discounts. UNVERIFIED.
- **Colombia pension visa:** pension ≥ **3x the monthly minimum wage**. UNVERIFIED (2026 minimum wage not checked).
- **Thailand:** LTR "Wealthy Pensioner": age 50+, **$80k/yr** passive income, or $40-80k + **$250k** invested in Thai bonds, a company or property; ≥$50k health insurance (or $100k in the bank); 5 + 5 years; spouse/children allowed. https://ltr.boi.go.th/ Standard retirement visa (Non-O/O-A): age 50+, **฿800,000** in the bank or ฿65,000/month: UNVERIFIED. Thai tax on remitted foreign income since 2024: UNVERIFIED.
- **Malaysia MM2H (revised):** Silver, Gold, Platinum tiers plus a special-economic-zone tier; minimum age 25; 90 days/yr minimum stay if under 50. Deposits ~US$150k / $500k / $1M plus property purchase: UNVERIFIED (shown only in images). https://www.mm2h.gov.my/apply/guidelines
- **Indonesia/Bali:** Second Home Visa ~**Rp 2 billion** (~US$110-130k), 5-10 years; retirement stay permit (KITAS) age **55+** with pension proof and a local sponsor. Both UNVERIFIED.
- **Vietnam:** no dedicated retirement visa; long stays usually rely on 90-day e-visa runs or family/investor routes. UNVERIFIED.
- **Philippines SRRV Classic:** age 50+: **$15k** deposit with a pension ≥ $800/month single ($1,000 with dependents), or **$30k** without a pension. Age 40-49: $25k with pension, $50k without. https://www.pra.gov.ph/SRRVisa

---

## 9. Nomad, van and RV life

- **Domicile states:** Florida, South Dakota and Texas are top for full-timers, and none has a state income tax. You need a real street address (mail-forwarding mailbox) for license, registration, insurance and voting; compare insurance rates, inspections and homeschool rules. https://www.escapees.com/knowledge/domicile/ ; https://finance.yahoo.com/markets/currencies/articles/states-where-avoid-taxes-capital-175313363.html South Dakota's one-night-stay (lodging receipt) license rule: UNVERIFIED (SD DPS page blocked).
- **ACA tie-in:** plans are priced by your domicile's rating area, and many are HMO/EPO with **local-only networks** (only emergencies covered elsewhere); e.g., a South Dakota plan may barely work in Arizona. Look for PPO or national networks. UNVERIFIED.
- **Monthly costs (UNVERIFIED ranges):** fuel $300-1,000 (RV 6-10 mpg, van 15-20); campsites $0 (BLM boondocking) to $1,000+ (RV parks); insurance $100-300; maintenance reserve $150-400; Starlink Roam ~$50 (50GB) to $165 (unlimited) as of 2025 (starlink.com didn't render). Many full-time couples report $2,500-5,000/month total.
- **Vehicles (UNVERIFIED):** new pro van conversion ~$80k-200k+; used van $30k-70k; travel trailer $20k-60k + tow vehicle; Class A $100k-500k+. RVs depreciate steeply (~20-30% in the first years). The alternative is keeping or renting out a house.

---

## 10. Travel budgeting and insurance

- **SafetyWing Essential (nomad insurance):** $62.72 per 4 weeks, ages 18-39 (older costs more); $250k overall limit, $100k evacuation; excludes pre-existing conditions, maternity, cancer treatment; US coverage is an add-on; home-country cover limited to 30 days. Complete plan ~$177.50/month (18-39). It's travel medical, **not** full health insurance for a 60-year-old. https://safetywing.com/nomad-insurance
- **Genki** (Traveler/Native): priced by quote; ~€50 excess per claim. https://genki.world/
- **International expat health plans** (Cigna Global, Allianz, etc.): ~$150-350/month at 30-40, ~$400-900+/month at 60+, higher with US coverage. UNVERIFIED. **Trip insurance:** ~4-10% of trip cost. UNVERIFIED.
- **Geographic arbitrage (computed):** a couple spending $2,000/month in Mérida vs $3,900 in Indianapolis needs $600k vs $1.17M at 4% (25x).
- **Currency risk (computed):** €3,000/month costs $3,372 at $1.124/€, $3,000 at $1.00, $3,750 at $1.25. Keep a 10-20% spending buffer or some local-currency assets.
- **Inflation abroad** can far exceed US inflation (e.g., Colombia's ~23% minimum-wage increase for 2026, UNVERIFIED), which also pushes visa income thresholds up.

---

## 11. Household considerations

- **Children (USDA):** $233,610 (2015 dollars) to raise a child born 2015 to age 17 in a middle-income married-couple family; $284,570 with projected inflation; ~**$12,980/yr**; excludes college. Families with 3+ kids spend 24% less per child. https://www.usda.gov/media/blog/2017/01/13/cost-raising-child Brookings 2022 inflation update ~$310,605: UNVERIFIED (page didn't load).
- **FIRE number (computed):** +$20k/yr for 2 kids = **+$500k at 25x** or **+$571k at 3.5%**. A family of 4 spending $100k/yr needs $2.5M (4%) to $2.86M (3.5%), vs $1.5-1.7M for a $60k couple. International schools can run $10k-30k+/yr: UNVERIFIED. Kids raise the ACA 400% cutoff to $128,600 for 4.
- **529 plans:** usable at schools "eligible to participate in a student aid program administered by the U.S. Department of Education," which includes many foreign universities with a federal aid school code (foreign part UNVERIFIED). https://www.irs.gov/newsroom/529-plans-questions-and-answers K-12 tuition $10,000/yr on that page; OBBBA reportedly raised it to $20k from 2026: UNVERIFIED. 529-to-Roth $35k lifetime (SECURE 2.0): UNVERIFIED.
- **Spousal IRA:** with a joint return, a non-earning spouse can contribute on the working spouse's pay; **2026 limit $7,500** ($8,600 if 50+) each, total capped at joint compensation. https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-ira-contribution-limits Abroad, FEIE-excluded wages don't count as IRA compensation (wages covered by the foreign tax credit do): UNVERIFIED.
- **Two incomes:** two 401(k)s double tax-advantaged room (2026 401(k) limit $24,500: UNVERIFIED). Two Social Security records: plan spousal and survivor claiming together.

---

### Must-flag items for the site
1. The ACA 400% FPL cliff is back for 2026 and, under current law, 2027; nothing was enacted in 2026.
2. Medicaid work requirements (80 hrs/month) start Jan 1, 2027 for expansion adults 19-64.
3. FEIE doesn't shelter investment income, pensions or account withdrawals.
4. France: social charges 18.6% on most investment income in 2026 (was 17.2%); flat tax 31.4%; US-affiliated residents don't get the 7.5% EEA rate.
5. US-France treaty: US Social Security is taxable only in the US; Roth treatment in France is uncertain.
6. Many visa thresholds above are UNVERIFIED; link to consulates.
