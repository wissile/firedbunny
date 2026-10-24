# Fix round (Read a Real Company) — after the independent fact-check

## A. SpaceX: the latest reported quarter is now Q3 2026 (reported October 20, 2026)

SpaceX reported Q3 2026 (quarter ended Sep 30, 2026) on Oct 20, 2026. The owner asked for the LATEST quarter, so every
SpaceX lesson must lead with Q3 2026, and Q2 2026 becomes the previous quarter (its first report as a public company,
still a loss). `SML.realco.spacex` has been rebuilt (read it again, fully):
* `is.cur` = Q3 2026 (revenue $14,575M, operating income +$2,791M, net income +$4,404M, EPS $0.35 diluted, tax is a
  BENEFIT: `tax: -390`), `is.ya` = Q3 2025, `is.pq` = Q2 2026 (the old loss quarter, full lines), `is.pq2` = Q1 2026,
  `is.ya2` = Q2 2025, `is.ytd` = nine months.
* `belowTheLine`: about $1.6B of Q3 profit came from below the operating line (other income $1,025M, net interest $198M,
  tax benefit $390M). Quality-of-earnings lesson.
* `segments.cur/ya/pq` (the `ai` key is now "Super Intelligence (formerly AI…)", still `k: 'ai'`); `segments.notes`
  (Cursor: closed Aug 14, $608M revenue, $1,217M acquisition-related stock comp).
* `ebitda.cur` 8,809 with the Q3 `bridge`; the old Q2 bridge is `ebitda.bridgePq`.
* `capex` (cur 19,593; pq 18,369; ytd 48,069; Q4 guide $35–40B); `cf9` (nine-month totals; FCF ≈ 13,097 − 48,069 =
  −34,972, our math); `cf6` kept for Q2.
* `bs` = Sep 30, 2026 vs Dec 31, 2025, plus a `mid` column for Jun 30, 2026; goodwill jumped to $48.4B (Cursor);
  `totals` arrays are [Sep 30, Dec 31, Jun 30]; `sharesOutstanding`.
* `metrics` arrays are [Q3 2026, Q2 2026, Q3 2025]; backlog $63B.
* `call` = the Q3 call (Oct 20): outlook (Q1 2027 revenue $33–37B vs ≈$22.2B consensus; Q4 capex $35–40B; 2.5–3 GW;
  Q4 gross margin closer to Q2's), Q&A themes (power, funding, possible Tesla combination: no terms), CFO release line.
* `expectations` / `reaction` = Q3 (revenue ≈ $12.72–12.9B expected; EPS ≈ $0.13–0.16; closed $147.79 Oct 20, ≈ +4%
  after hours, **+7.8% to $159.31 on Oct 21**).
* `q2` = the first report's expectations, reaction (Aug 5 close $108.27, −13.6%; lockup: Aug 6 was the FIRST of several
  staggered releases), outlook, bond. Use it as the earlier story.
* research/realco.md has a new SpaceX Q3 section. Great teaching contrast: Apple beat but guided BELOW expectations →
  fell ≈7%; SpaceX beat and guided FAR ABOVE → rose ≈8%. And: SpaceX swung from a loss to a profit, but part of the
  profit is below the line, capex ($19.6B) is more than 2× adjusted EBITDA ($8.8B), and free cash flow is deeply negative.
* Never say "SpaceX's Q3 isn't out". Say "latest reported quarter as of October 2026" for both companies.

## B. Wording fixes (all modules)

1. Tariff refunds are NOT "won't repeat next quarter": Apple's September-quarter guide still includes about 1 point of
   refunds. Say "temporary / non-recurring" and note the guide still includes ~1 point.
2. Adjusted EBITDA is never "a profit". Say "positive $X billion on SpaceX's own adjusted measure".
3. Bridge loan: the $25B bond money was used "partly to repay a $20B bridge loan" (part of the bond money went to it),
   not "partly repaid" the loan.
4. Lockup: "the first lockup release came on Aug 6, 2026" (more releases later), not "the lockup ended".
5. Share count: the release does not itemize why weighted shares rose. Do not attribute the doubling to the IPO and
   preferred conversion (those happened mid-June and add little to a quarterly average). Say: shares outstanding jumped
   with the preferred conversion, the IPO and other share issuance (Class A 1,952M → 8,240M and Class B 644M → 5,339M
   from Dec 31 to Sep 30), and the release does not break the weighted-average change down.
6. Retained earnings: not "paid out more than the profit it kept" (circular). Say "more than all the profit it had ever
   earned". Buybacks reduce retained earnings at Apple (which retires the shares); many companies book them as treasury
   stock instead.
7. SpaceX Q2 next-day move: closed down 13.6% at $108.27 on Aug 5 (not "10–14%").
8. Goodwill: extra paid above the fair value of the identifiable NET assets (assets minus liabilities).
   Diluted EPS: counts extra shares from awards/options only when they would lower EPS (treasury-stock method), not
   "every share that could exist".
9. Apple ex-refund beat "2–3 cents" is FiredBunny's math assuming the consensus did not include refunds: label it.
10. "A record top line" → "a record June-quarter top line" (the December quarter was bigger).
11. Vendor non-trade receivables: Apple buys parts and sells them to the companies that assemble its products; they owe
    Apple for those parts. Not cost-sharing, not a loan.
12. Apple FX guidance: the currency headwind is about 2.5 points bigger than in the June quarter (sequential), not
    "2.5 points of drag" in total.
13. Call paraphrases: BofA asked about Siri AI's capital intensity and the competitive landscape (Cook answered on the
    hybrid of third-party cloud and Apple's own data centers; Ternus on competition). On compute costs, Cook said it was
    too early for a full plan to recover them, possibly via higher iCloud+ tiers.
14. Analyst price targets JPM $340, MS $360, BofA $380 are from MacDailyNews (now in Apple sources); Barclays $245 and
    TD Cowen $400 are widely confirmed. Attribute "as reported by MacDailyNews" where shown.
