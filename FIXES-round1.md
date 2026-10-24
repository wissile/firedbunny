# Fix round 1 (shared decisions — apply in your own module only)

An independent review found consistency and accuracy problems across the assessment, results, dashboard and account pages.
These decisions apply everywhere:

1. **Growth assumption:** 5% a year AFTER inflation, compounded monthly, amounts in today's dollars. The quiz, results and
   dashboard all use it. The dashboard's assumed-return slider defaults to 5 and is labelled "Assumed return after inflation".
   Q adds `goals.rate = 5` to the result; R uses `goals.rate` (default 5) and no longer back-solves a rate.
2. **Deadline convention:** Dec 31 of the target year for FIRE/retirement goals (results "Set a goal" and dashboard templates).
3. **Goal `monthly` = what the person actually puts in each month** (current saving), never the amount needed.
   Results' "Set a goal from this" writes `monthly: inputs.savingsMonth`; the dashboard computes what is needed.
4. **Savings rate = monthly saving ÷ (monthly saving + monthly spending)**, described as "share of take-home pay you save".
   The same everywhere. Never compute it from gross income. Dashboard: use the latest assessment's inputs; with no saving
   figure, show "—" with a prompt to take the assessment.
5. **Risk bands everywhere = the quiz profile thresholds:** <25 Conservative, <42 Moderate, <58 Balanced, <75 Growth,
   else Aggressive (results gauge, dashboard risk-over-time chart, chips).
6. **Storage/privacy copy.** account.js changed: in cloud mode NOTHING of the signed-in person's profile, assessments or
   lesson progress is written to browser storage; browser storage only holds guest data; `migrateLocal()` now MOVES guest
   data into the account and then clears it from the browser.
   * Signed in and saving to the account: "Saved to your private FiredBunny profile. Other visitors and the site owner
     can't read it." (Do not say "only you" or "not even Claude".)
   * Local: "Saved in this browser only. Anyone using this browser can see it, so on a shared computer delete it from
     Settings when you're done. Export a file to move it."
   * Migration banner/button: "Move this browser's data into your account" (it is added to your account and removed
     from this browser). "Not now" keeps it in the browser.
7. **Advice framing:** any ordered "do this" action list and any suggested mix carries a one-line note:
   "Educational rule of thumb, not personal advice."
8. **Emergency fund target:** Q's rule is the only rule: 3 months of spending for a single person with a steady job and no
   dependents, otherwise 6. Q adds `goals.emergencyTargetMonths` (3 or 6). R and D use it when present (default 6).
9. **High-interest debt claims:** only say paying off debt "beats the stock market's long-run average" at 10%+ APR.
   For 8–10% say "comparable to what stocks have returned over the long run". Never "guaranteed X% better".
10. **Retired / at-or-past target age:** Q adds `goals.retired: true` and `goals.withdrawalRate` (annual spending minus
    other income, ÷ invested money, in %) when years to target ≤ 0. R shows a withdrawal-rate check (vs a 4% rule of
    thumb) instead of a savings pace and doesn't chart growth on an untouched pot. D's goal from such a result uses
    deadline = next Dec 31 and doesn't ask for huge monthly amounts.
11. **Social Security / pensions:** Q adds an optional input `inputs.otherIncomeMonth` (Social Security or pension a month,
    today's dollars, 0 if unsure). It reduces the FIRE number ((spend − otherIncome) × 12 × 25) only when target age is
    ≥ 62; for earlier targets the full number stands and the copy says this income will reduce withdrawals later.
    R adds a small note under the FIRE section saying what is and isn't included.
12. **Quiz length:** "about 7 minutes" everywhere.

Re-run your own tests (harness/sitetest with --fuzz on your routes, plus your Playwright checks) after the changes.
