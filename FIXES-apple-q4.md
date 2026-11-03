# Apple refresh: the latest quarter is now fiscal Q4 2026 (September quarter, reported November 2, 2026)

Owner's request (Nov 3, 2026): refresh the Apple lessons with the new numbers. Every Apple lesson, widget and tool must
LEAD with the September 2026 quarter. The June quarter becomes the previous quarter, kept as the contrast (the way the
SpaceX lessons lead with Q3 and keep Q2). All earlier specs still apply (SPEC-realco.md, FIXES-realco.md): night-desk
look, `SML.css` module-prefixed CSS, tokens only, plain voice, no em-dash asides, 300–1280 px, `SML.onCleanup`,
education not advice, Hoppy's Coffee Cart as the made-up everyday example.

## Data (already rebuilt by main: read `SML.realco.apple` in src/content-realco.js IN FULL before you start)

* `is.cur` = Sep 2026 quarter, `is.ya` = Sep 2025, `is.pq` = Jun 2026 (old cur), `is.ya2` = Jun 2025 (old ya),
  `is.pq2` = Mar 2026 (old pq), `is.fy` / `is.fyPrev` = fiscal 2026 / 2025 full years. `labels` has keys for all.
* `tariffRefund` = September (1 point, $0.05) with `tariffRefund.pq` = June (2 points, $0.11). Ex-refund Sep GM ≈ 46.9%
  (BELOW the year-ago 47.2%), EPS ≈ $2.05.
* `categories` / `regions`: cur, ya, pq, ya2, fy, fyPrev. `trend` now ends with Sep 2026 ($114,477M, $2.10).
  `ttmEps` 8.98 (= fiscal 2026), `ttmEpsPrev` 8.72.
* `bs` = Sep 26, 2026 vs Sep 27, 2025 with a `mid` column (Jun 27, 2026); `totals` arrays are [Sep 26 2026, Sep 27 2025,
  Jun 27 2026]; `sharesOutstanding`.
* `cf` (NEW, replaces `cf9` in teaching) = full fiscal year 2026 vs 2025, every line also has `q` = the September quarter
  alone (our math: 12 months − 9 months); `cf.totals` arrays are [FY26, FY25, Sep qtr]; `cf.fcf` [136056, 98767, 25859].
  `cf9` now only has totals and a few lines, kept to show the derivation. Say "our math" for any derived quarter figure.
* `call` = the Nov 2 call (John Ternus's FIRST call as CEO; CFO Kevan Parekh; COO Sabih Khan took supply/memory
  questions): `guidance` (December quarter: revenue +7–10%, Services +8–9%, GM 45–46%, opex $20.4–20.8B, other income
  ≈ $300M, tax ≈ 17%, base revenue $143,756M), `quarterReturn` ($28B: $24B buybacks, $3.9B dividends), `notes`,
  `netCashNeutral` (dropped), `purchaseObligationsUp` ($33B), `guideCheck` (July guide vs September actual).
* `expectations` (consensus: revenue $113.38B, EPS $1.99, iPhone $56.6B, Services $31.58B, Mac $9.61B, iPad $6.7B,
  Greater China $18.8B; December quarter expected: growth 11.4%, GM ≈ 47%, Services 10.7%).
* `reaction` (Nov 2 close $338.32, after hours ≈ −2.8% (as low as −4%), premarket Nov 3 ≈ −4%). `closePct` and
  `closeAfter` are `null` until main fills them in after the Nov 3 close. Write every reaction sentence from the data with
  a fallback, e.g. `r.closePct == null ? 'traded about 2–4% lower the next day' : 'closed ' + Math.abs(r.closePct) + '% lower at $' + r.closeAfter`.
  Never hard-code the Nov 3 close.
* `q3` = the June story (expectations, reaction −7.4% on July 31, July guidance, quarter return, notes).
* `next`: the December-quarter report is usually late January (date not announced).
* research/realco.md has the new Apple section with every verified number and the call summary.

## The teaching story for the September quarter (use it; numbers from the data)

1. A record September quarter: revenue $114.5B (+11.7%), above Apple's own July guide (+9–11%) and the ≈ $113.4B
   consensus. EPS $2.10 (+13.5%) vs $1.99 expected; even without the 5-cent refund ($2.05) it beat.
2. Mix: iPhone +17.5% (beat), Mac +23.7% (beat; record year), iPad −10.4% and Wearables −7.9% (tough comparisons,
   supply), Services +9.8% (in line, but slower than June's 12.1%), Greater China +21% yet below the $18.8B hoped for.
3. Margins: gross margin rose to 47.9% from 47.2%, but about 1 point was refunds; underlying ≈ 46.9% was a little BELOW a
   year ago because memory chips cost more. Opex +20.6% (R&D +32%) grew faster than gross profit (+13.4%), so the
   OPERATING margin fell to 31.1% from 31.6%: operating income grew only 9.9%, slower than sales. A lower tax rate
   (15.0% vs 16.3%) and buybacks (−1.6% diluted shares) lifted EPS to +13.5%.
4. Fiscal 2026 as a whole: revenue $478.8B (+15%), net income $132.2B (+18%), EPS $8.98 (+20%), free cash flow
   $136.1B (our math), buybacks $86.4B, dividends $15.7B.
5. Balance sheet at the fiscal year end: net cash $56.8B (down from $62.2B in June, up from $33.8B a year earlier);
   inventory nearly tripled to $14.5B (parts and memory bought ahead); accounts payable $82.3B; retained earnings
   turned positive; Apple dropped its "net cash neutral" goal.
6. Guidance for the December quarter (the holiday quarter): +7–10% revenue ("best quarter ever") but below the ≈ 11.4%
   hoped for; gross margin 45–46% vs ≈ 47% expected (memory costs, plus some Siri AI cloud cost); Services +8–9% vs
   10.7% expected. The stock fell: same shape as July (beat + soft guide), see `reaction` and `q3.reaction`.
7. Valuation: at the Nov 2 close ($338.32) the trailing P/E is about 37.7 on $8.98 (forward about 35× per reports).

## Wording rules (in addition to FIXES-realco.md)

* "Latest reported quarter as of November 2026" for Apple. Never say the September report is upcoming.
* Ternus became CEO September 1, 2026 (Tim Cook was CEO for the June report). Quote only what research/realco.md
  quotes ("unprecedented" for memory pricing; "We have never sold more Macs in a fiscal year"; "best quarter for
  revenue in the history of the company" is Parekh's guide line; "hard to predict when supply and demand will be in
  balance" is Khan's). Otherwise paraphrase and attribute.
* Derived numbers (Sep-quarter cash flow, FCF, ex-refund margins, dollar guide range $153.8–158.1B, net cash) say
  "our math".
* Consensus figures are "as reported" (name the outlet in sources/notes, not in every sentence).
* Tariff refunds: temporary/non-recurring; smaller in September than June; the December guide does not include them.
* The year-ago comparison for September 2025 is fiscal Q4 2025 (Tim Cook era).

## Ownership (forks)

* R1 → src/mod-z-rc-income.js (l-rc-words, l-rc-apple-income, incomeWaterfall, statementExplorer, termTranslator).
* R2 → src/mod-z-rc-balance.js (l-rc-apple-balance, l-rc-apple-cash, balanceBlocks, cashRiver). The cash lesson now
  teaches the full fiscal year (`cf`) and the September quarter derived from it.
* R3 → src/mod-z-rc-call.js Apple script only (l-rc-apple-call, callPlayer Apple): a new retelling of the Nov 2 call,
  re-rendered audio `public/audio/apple-fq4-2026.mp4` + `.webm` (same pipeline as before: scratchpad/k3/render.py,
  Piper LibriTTS speakers 78/12); delete the old apple-fq3-2026 files once the new ones work. Leave SpaceX untouched.
* R4 → src/mod-z-rc-spacex.js (l-rc-price, earningsPrice: Apple TTM EPS 8.98, Nov 2 close, "Replay November 3" from
  `reaction` with the null fallback, and keep "Replay July 31" as the earlier case; any Apple contrast in l-rc-spacex /
  l-rc-spacex-call text) AND the Apple-related text in src/content-realco.js OUTSIDE the `apple` object (tool
  descriptions, glossary entries, the course description). Do not touch the `apple` data object (main owns it).

Only edit your own files. If you need a data field that is missing, compute it locally and mention it in your report.

## Test and report

`node --check` your file; `python3 tools/build.py && python3 tools/sitetest.py --routes <your lessons and tools> --shots <same> --fuzz`
and look at the screenshots at both widths. Also run `node tools/narration/make-scripts.js --print <lesson id>` for each
of your lessons and read the spoken script once for anything stale (June numbers presented as latest, "upcoming
November 2", wrong CEO). Report briefly: what changed, any number you derived (with the arithmetic).
