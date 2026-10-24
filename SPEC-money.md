# Addendum 2 (October 21, 2026): tracks, Retirement & Wealth, FIRE

Everything in SPEC.md still applies (widget rules, night-desk look, lesson object, end blocks, voice, harness).
This file adds two new tracks. Read it fully before you start.

## What is already done (main owns these files, do not edit them)

* `src/content-money.js`: `SML.tracks` (trading, wealth, fire), the 16 new courses, the new tools list (`SML.tools`
  entries that point at widget names you will build) and ~190 new glossary terms. **Read this file**: the glossary term
  names in it are the only new names you may put in `terms` (plus the old names listed in SPEC.md).
* `src/pages.js`: learn page per track (`#track-wealth`, `#track-fire`), course and lesson pages with per-track
  numbering, tools page grouped by track, glossary track filter, and a new optional lesson field `sources`.
* `tools/harness.py` loads `content-money.js`, so cross-module glossary names resolve in your tests.

## New lesson field: `sources`

```js
sources: [{ t: 'IRS: 401(k) limit increases to $24,500 for 2026', u: 'https://www.irs.gov/newsroom/...' }],
```
1-4 official or high-quality links for every lesson that states a limit, rate, rule or law (IRS, SSA, CMS,
HealthCare.gov, the bank's own page, Vanguard, etc.). Rendered as a "Sources" list near the end of the lesson.
Take URLs from the research files or from your own WebSearch/WebFetch. Never invent a URL.

## Facts

Five research files are being written to `/home/claude/site/research/`: `core-2026.md` (2026 limits, brackets, Social
Security, Medicare, ACA, FEIE), `equity-tax.md` (401(k) match, mega backdoor, HSA, RSU, ESPP, ISO/NSO, backdoor Roth,
wheel/option taxation, tax-loss harvesting pairs), `banking-rates.md` (Chase tiers and benefits, cards, current rates,
VTWAX/VMFXX), `housing.md` (rent vs buy, home taxes, rentals, Airbnb, leverage), `fire-abroad.md` (withdrawal research,
early access, FIRE taxes, ACA, Social Security, living abroad, France, visas, cost of living, van life).

* Read the ones your lessons need. Use only facts they mark as verified, with their numbers.
* If a fact you need is missing or marked UNVERIFIED, verify it yourself with WebSearch/WebFetch (official source), or
  write around it without a specific number ("check the current limit on IRS.gov"). Never state a number from memory.
* Label year-specific figures with the year ("the 2026 limit is $24,500"). Market rates (money market yields, mortgage
  and loan rates, HYSA APYs) change: make them adjustable inputs whose default is the current value from the research
  file, and say "about X% in October 2026".
* US-focused, for an American reader. Education only, not financial, tax or legal advice. Where rules get tricky
  (equity comp, backdoor/mega backdoor, rental and STR taxes, treaties, expat taxes) add one short line suggesting a CPA,
  enrolled agent or fee-only fiduciary adviser. Do not repeat that line in every paragraph.

### Gently correct these common beliefs (the site owner asked for these topics in these words)

* "VTWAX is the safest fund": it is one of the most diversified, lowest-cost ways to own stocks (thousands of companies
  worldwide), but it is 100% stocks and can drop 30-50% in a crash. The safest places for cash are FDIC-insured
  accounts, Treasury bills and government/Treasury money market funds. Say it plainly.
* Relationship banking (Chase as the worked example): use the research file's tiers and benefits (Chase Sapphire Banking
  around $75K, Chase Private Client around $150K, what counts toward the balance). Weigh perks against the opportunity
  cost of parking cash in low-yield deposits; investments held at J.P. Morgan count toward the balance, so the money can
  stay invested. Other big banks run similar tier programs.
* "Never pay credit card interest": right. But a balance transfer is not free (fee of a few percent), new purchases on a
  transfer card may accrue interest, a transfer usually cannot go to a card from the same bank, and chaining transfers
  needs new approvals. Deferred-interest store promos are a trap. Explain all of it.
* Car: pay cash when the loan APR is higher than what your cash earns after tax; keep the emergency fund intact; dealer
  promo rates (0%-2.9%) can beat paying cash; mention the 2025-2028 federal deduction for interest on loans for new
  US-assembled cars if the research confirms it.
* "Max the 401(k) and the match goes on top of the limit": true. The employer match does not count toward the employee
  elective deferral limit; it does count toward the annual additions (415(c)) limit, and after-tax contributions can fill
  the rest of that room (mega backdoor) if the plan allows.
* Tax-loss harvesting pairs: the owner wrote "SPDL and VGT". Use real tickers from the research file (likely SPLG), and
  explain why funds that track the same index (VOO/IVV/SPLG) are riskier swaps than funds on different indexes.
* France: be precise and nuanced (worldwide taxation of French residents, US citizenship-based taxation, the treaty's
  savings clause and credits, social charges on investment income, 0% bands that can mean little or no income tax at low
  incomes). Use only the research file's verified rules and say clearly that this needs a cross-border tax professional.

## Lessons, owners and widget names (fixed: tools and the home page already point at these widget names)

Every widget that is a tool (marked ★) must work on its own with no `opts` (tool pages and home tabs mount it bare),
at 300-840 px wide. Home page tabs mount ★ `compoundPlus`, `habitCost`, `fireNumber`, `rentVsBuy`.

| Fork | Module file | Course | Order | Lesson id | Title (you may polish) | Widget |
|---|---|---|---|---|---|---|
| W1 | mod-w-money.js | money | 1 | l-budget | Build a monthly budget | budgetBuilder ★ |
| W1 | | money | 2 | l-track-spending | Track your spending | spendTracker |
| W1 | | money | 3 | l-latte | Small habits, big numbers | habitCost ★ |
| W1 | | money | 4 | l-emergency | Emergency fund and where to park cash | cashParking ★ |
| W1 | | money | 5 | l-net-worth | Know your net worth | netWorth |
| W2 | mod-w-debt.js | debt | 1 | l-credit-score | How credit scores work | creditScore |
| W2 | | debt | 2 | l-card-debt | Credit card debt: get out, stay out | debtPayoff ★ |
| W2 | | debt | 3 | l-balance-transfer | 0% APR and balance transfers | transferPlanner ★ |
| W2 | | debt | 4 | l-car-cash | Car: pay cash or take the loan? | carCashVsLoan ★ |
| W3 | mod-w-bank.js | banking | 1 | l-bank-tiers | Why a banking relationship pays | tierLadder |
| W3 | | banking | 2 | l-private-client | Private client perks and their real cost | perkValue |
| W3 | | banking | 3 | l-travel-money | Travel money with no foreign fees | fxFees ★ |
| W3 | | banking | 4 | l-rewards | Rewards cards without the trap | rewardsCalc |
| W4 | mod-w-protect.js | protect | 1 | l-insurance | Insurance you actually need | insuranceNeeds |
| W4 | | protect | 2 | l-estate | Wills, beneficiaries and trusts | estateMap |
| W4 | | protect | 3 | l-scams | Scams that target savers | scamSpotter |
| W5 | mod-w-401k.js | benefits | 1 | l-401k-match | The 401(k) match is free money | matchCalc ★ |
| W5 | | benefits | 2 | l-401k-limits | Max your 401(k): the limits most people miss | limitStack ★ |
| W5 | | benefits | 3 | l-mega-backdoor | The mega backdoor Roth | megaBackdoor |
| W5 | | benefits | 4 | l-hsa | The HSA: a triple tax break | hsaCalc |
| W5 | | benefits | 8 | l-open-enrollment | Open enrollment: pick the right plan | planPicker |
| W6 | mod-w-equity.js | benefits | 5 | l-rsu | RSUs: taxes at vest and when to sell | rsuVest ★ |
| W6 | | benefits | 6 | l-espp | ESPP: the 15% discount | esppCalc ★ |
| W6 | | benefits | 7 | l-stock-options | Stock options: ISOs and NSOs | equityOptions |
| W7 | mod-w-accounts.js | accounts | 1 | l-trad-vs-roth | Traditional or Roth? | rothVsTrad ★ |
| W7 | | accounts | 2 | l-ira | When to open an IRA, and in what order to save | savingsOrder |
| W7 | | accounts | 3 | l-backdoor-roth | The backdoor Roth IRA, step by step | backdoorRoth ★ |
| W8 | mod-w-ss.js | accounts | 4 | l-social-security | Social Security: when to claim | ssClaim ★ |
| W8 | | accounts | 5 | l-medicare-rmd | Medicare, RMDs and IRMAA | rmdCalc |
| W8 | | retire | 3 | l-retire-income | Turn savings into a paycheck | paycheckBuilder |
| W9 | mod-w-retire.js | retire | 1 | l-retire-age | Retire at 55, 62, 67 or 70? | retireAge |
| W9 | | retire | 2 | l-retire-plan | Your retirement plan on one page | retirePlanner ★ |
| W9 | | retire | 4 | l-retire-countdown | The ten-year countdown | countdownList |
| W10 | mod-w-invest.js | invest | 1 | l-compound | The power of compound interest | compoundPlus ★ |
| W10 | | invest | 2 | l-index-funds | Index funds: VTWAX, VTI and VOO | fundCompare |
| W10 | | invest | 3 | l-allocation | Stocks, bonds and your age | allocationSim |
| W10 | | invest | 4 | l-extra-money | Where your extra money should go | extraMoney |
| W10 | | invest | 5 | l-kids-money | Kids: 529s, Trump accounts and custodial Roths | kidsMoney |
| W11 | mod-w-tax.js | wtax | 1 | l-tax-brackets | How tax brackets really work | bracketViz ★ |
| W11 | | wtax | 2 | l-deductions | Deductions and credits worth knowing | deductionFinder |
| W11 | | wtax | 3 | l-asset-location | Asset location: the right account for each fund | assetLocation |
| W12 | mod-w-wheeltax.js | wtax | 4 | l-tlh-pairs | Tax-loss harvesting with fund pairs | tlhPairs |
| W12 | | wtax | 5 | l-wheel-tax | How the wheel is taxed | wheelTaxSim ★ |
| W12 | | wtax | 6 | l-wheel-ira | Run the wheel in an IRA | wheelAccounts |
| W13 | mod-w-home.js | home | 1 | l-rent-vs-buy | Rent or buy? | rentVsBuy ★ |
| W13 | | home | 2 | l-mortgage | Mortgage basics | mortgageCalc ★ |
| W13 | | home | 3 | l-home-taxes | Your home and taxes | homeSaleTax |
| W13 | | home | 4 | l-house-invest | Is a house an investment? | houseLeverage |
| W14 | mod-w-rental.js | home | 5 | l-rental | Rental property: the real numbers | rentalCalc ★ |
| W14 | | home | 6 | l-airbnb | Airbnb: gross vs real revenue | strCalc ★ |
| W14 | | debt | 5 | l-smart-leverage | Leverage the smart way | leverageLab |
| F1 | mod-f-number.js | fi-basics | 1 | l-fire-intro | What FIRE really means | fireFlavors |
| F1 | | fi-basics | 2 | l-avg-spending | Find your real spending | spendAverager |
| F1 | | fi-basics | 3 | l-fire-number | Your FIRE number | fireNumber ★ |
| F1 | | fi-basics | 4 | l-savings-rate | Savings rate is the lever | savingsRate ★ |
| F1 | | fi-basics | 5 | l-coast-fire | Coast FIRE and Barista FIRE | coastFire |
| F2 | mod-f-where.js | fi-where | 1 | l-geo-arbitrage | Where your money goes furthest | cityCompare ★ |
| F2 | | fi-where | 2 | l-van-life | Van, RV, trailer or house? | nomadCost |
| F2 | | fi-where | 3 | l-travel-budget | Budget for a life of travel | travelBudget |
| F2 | | fi-where | 4 | l-household | Partners, kids and your number | householdFire |
| F2 | | fi-where | 5 | l-visas | Visas for early retirees | visaFinder |
| F3 | mod-f-tax.js | fi-tax | 1 | l-fire-tax | How FIRE withdrawals are taxed | fireTaxCalc ★ |
| F3 | | fi-tax | 2 | l-zero-bracket | The 0% capital gains bracket | gainHarvest |
| F3 | | fi-tax | 3 | l-early-access | Money out before 59½ | accessLadder ★ |
| F4 | mod-f-health.js | fi-health | 1 | l-aca | Health insurance before 65 | acaSubsidy ★ |
| F4 | | fi-health | 2 | l-health-bridge | Bridging the gap to Medicare | healthBridge |
| F4 | | fi-health | 3 | l-ss-early | Social Security when you stop early | ssEarly |
| F5 | mod-f-abroad.js | fi-abroad | 1 | l-us-tax-abroad | US taxes follow you abroad | expatTax |
| F5 | | fi-abroad | 2 | l-treaty-france | Tax treaties: the France example | franceTax ★ |
| F5 | | fi-abroad | 3 | l-expat-money | Banks, brokers and PFICs abroad | expatChecklist |
| F5 | | fi-abroad | 4 | l-expat-health | Health care and insurance abroad | expatHealth |
| F6 | mod-f-swr.js | fi-plan | 1 | l-swr | The 4% rule and its limits | swrSim ★ |
| F6 | | fi-plan | 2 | l-sequence | Sequence of returns risk | sequenceDemo |
| F6 | | fi-plan | 3 | l-guardrails | Flexible spending with guardrails | guardrailsSim |
| F7 | mod-f-plan.js | fi-plan | 4 | l-fire-planner | Your full FIRE plan | firePlanner ★ |
| F7 | | fi-plan | 5 | l-fire-whatif | What if? Stress-test the plan | fireWhatIf |

Lesson `level`: 'Beginner', 'Intermediate' or 'Advanced'. Glossary terms in content-money.js already point at these
lesson ids; keep the ids exactly. Cross-link generously with `href="#l-..."`, including into the Trading track
(`#l-wheel`, `#l-tax-loss`, `#l-wash-sale`, `#l-cap-gains`, `#l-broker`, `#l-etfs`, `#l-bonds`, `#l-drawdowns`).
Only link to ids in this table or ones that already exist.

## What each lesson must have

* `summary`, `idea`, `try`, `widget`, `body` (these topics deserve depth: 3-6 `<h3>` sections, short paragraphs,
  `<ul>` lists, tables are fine via `<ul>`), `example` (4-6 concrete steps with correct arithmetic and 2026 rules),
  `mistakes` (3-4), `points` (3-5), `terms` (3-6 names), optional `glossary` for lesson-only terms, `quiz`, `sources`.
* Calculators: sliders with sensible ranges and steps, plus number fields (`ui.field`) where people know their exact
  number (salary, balances). A chart that explains the answer (stacked bars, lines over years, waterfalls, timelines),
  big stat tiles, a live coach line in plain words, and presets (seg) for typical people ("New grad", "Family of four",
  "Couple at 55"). A Reset button where there are many inputs. Results must be right: test the math with a few hand
  calculations and state assumptions in `.wg-note`.
* Make it engaging: drag handles on charts where natural, animated "play the years" where it helps, side-by-side
  scenario comparisons. Quality over quantity: one excellent widget per lesson.
* Mobile: everything works at 360 px. Use compact labels and stack controls.

## CSS and code

Module CSS through `SML.css(...)` with selectors prefixed by your module's own short prefix (pick a unique one, e.g.
`.wmo-`, `.wdb-`, `.fnum-`). Tokens only, never literal colors. Do not depend on other modules. Use `SML.fmt`.

## Test and report

`python3 /home/claude/site/tools/harness.py mod-yours.js` until there are no errors, no overflow, no
NO WORKED EXAMPLE / NO MISTAKES / MISSING:term flags, and the screenshots look right at both widths (open them with Read).
Only create or edit your own module file. Report briefly: lessons and widgets built, the 2026 figures you used with
their sources, anything you could not verify.
