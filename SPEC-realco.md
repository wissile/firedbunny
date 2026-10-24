# Addendum 5 (October 22, 2026): "Read a Real Company" — Apple and SpaceX, line by line

The owner asked for Trading lessons that take a REAL company's latest quarter (Apple, SpaceX) and break down the
balance sheet and the earnings: every term in simple words, a concrete everyday example anyone understands, the real
number, why it matters and how it drives the stock price. Plus an earnings call with AUDIO that plays while the screen
explains, step by step, what is being said. Be creative and make it fun, but every number must be exact.

Everything in SPEC.md, SPEC-money.md and SPEC-macro.md still applies (night-desk look, SML.svg/ui helpers, widgets
drawn 1:1 at 300–840 px, colors only via classes/tokens, module-prefixed CSS through `SML.css`, `SML.fmt`, no external
libs, plain voice, no em-dash asides, lesson object with `idea`, `body`, `example`, `mistakes`, `points`, `terms`,
optional `glossary`, `quiz`, `sources`). The site is now FiredBunny (see SPEC-account.md: `SML.bunnyTip(html)` for a
short aside, tokens `--flame`, `--gold`). Only create/edit your own module file (and, for K3, the audio files and your
scratch scripts). If you need something in a shared file, say so in your report.

## Already done by main (read, do not edit)

* `src/content-realco.js`: the course `realco` (Trading track, n 8, "Read a Real Company"), three tool entries
  (`tool-call` → widget `callPlayer`, `tool-statements` → `statementExplorer`, `tool-earnings-price` → `earningsPrice`),
  ~65 glossary terms, and **`SML.realco`**: every verified number for Apple fiscal Q3 2026 and SpaceX Q2 2026
  (income statement current / year-ago / prior quarter, Apple categories and regions, 5-quarter trend, full balance
  sheets, Apple 9-month cash flow, SpaceX segments, adjusted EBITDA bridge, capex, metrics, call guidance/outlook,
  analyst expectations, stock reaction, sources). **Read it fully.**
* `research/realco.md`: the research notes and derived ratios (YoY %, margins, net cash, FCF, P/E…). Read it.
* Glossary names usable in `terms`: anything in content.js, content-money.js, content-macro.js, content-realco.js.

## Facts rules

* Never type a statement number by hand: read it from `SML.realco` and compute ratios in code (round for display with
  `SML.fmt`). In lesson `body` HTML (static strings) you may write rounded figures (e.g. "$109.4 billion", "up 16%"),
  but they must match research/realco.md exactly at that rounding.
* Say "latest reported quarter as of October 2026". Apple's next report is Nov 2, 2026; SpaceX Q3 is not out yet.
* Apple's fiscal year: the April–June 2026 quarter is "fiscal Q3 2026"; explain this once where it first matters.
* CEO note: Tim Cook was CEO on the July 30 call; John Ternus became CEO on Sep 1, 2026.
* Analyst expectations and stock moves come from news reports: present them as "reported" / "about", using the
  ranges in `SML.realco.*.expectations` and `.reaction`. Never invent a number that is not there.
* The earnings calls: **paraphrase only**. Never reproduce transcript text. Attribute ("Apple's CFO said revenue…").
  Quotes allowed only for the short phrases already in `SML.realco` ("our strongest June quarter ever",
  "100-year flood"). Never voice or imitate a real person: the audio uses a NARRATOR who reports what was said and a
  BUNNY COACH who explains it.
* Education only, not investment advice; no buy/sell opinions on AAPL or SPCX. No price predictions.

## One running everyday example: Hoppy's Coffee Cart (use these exact numbers everywhere)

So that every concept has the same concrete picture, all forks use one small business. Monthly, this June vs last June:

| Line | This June | Last June |
|---|---|---|
| Sales (revenue) | $10,000 | $8,000 |
| Beans, milk, cups (cost of sales) | $4,000 | $3,600 |
| Gross profit | $6,000 (60%) | $4,400 (55%) |
| New recipes and barista training (R&D) | $500 | $400 |
| Ads, permit, accountant, phone (SG&A) | $1,500 | $1,400 |
| Operating income | $4,000 (40%) | $2,600 (32.5%) |
| Interest on the cart loan | −$200 | −$200 |
| Profit before tax | $3,800 | $2,400 |
| Tax (20%) | $760 | $480 |
| Net income | $3,040 | $1,920 |
| Owner's shares | 1,000 | 1,000 |
| EPS | $3.04 | $1.92 |

Balance sheet at the end of June: cash in the register and bank $6,000; beans and cups in stock (inventory) $1,000; an
office catering invoice not yet paid (receivable) $800; the cart and espresso machine (equipment) $12,000 → assets
$19,800. Owes the bean supplier (payable) $700; gift cards sold but not yet used (deferred revenue) $300; cart loan
$5,000 → liabilities $6,000. Equity $13,800. Cash flow in June: profit $3,040 + machine depreciation $200 − extra
beans stocked $300 + bean bill not yet paid $100 = operating cash $3,040; a new grinder (capex) −$600 → free cash flow
$2,440; owner pays out a $1,000 dividend.

Use a "card" format per term wherever you explain one: **What it is** (one plain sentence) · **At Hoppy's cart** (the
coffee-cart number) · **At Apple** (or SpaceX: the real number and change) · **Why it matters / how it moves the stock**
(one or two sentences). Keep each card short; the wow is in the interaction.

## How earnings move a stock (shared frame; K4 teaches it fully, others reference it)

Price ≈ EPS × P/E. Results change the EPS investors expect; guidance changes next quarter's and next year's EPS; quality
(one-time items like Apple's tariff refunds, adjusted vs GAAP) changes how much of the beat counts; growth and risk change
the P/E multiple investors will pay. Stocks move on the SURPRISE versus expectations, and most of all on the outlook.
Apple July 31, 2026: beat on revenue and EPS, but guidance below what analysts expected, a lower margin outlook and
$0.11 of one-time help → fell about 7%. SpaceX Aug 4–5: big beat and a smaller loss, but capex jumped to $18.4 billion
and the lockup was ending → fell.

## Lessons, owners, widgets (fixed ids; ★ = also a tool: must work with no opts, defaults to Apple)

| Fork | Module | Order | Lesson id | Title (you may polish) | Widget(s) |
|---|---|---|---|---|---|
| K2 | mod-z-rc-income.js | 1 | l-rc-words | Earnings words in plain English | `termTranslator` |
| K2 | | 2 | l-rc-apple-income | Apple's earnings, line by line | `incomeWaterfall`; also builds `statementExplorer` ★ |
| K1 | mod-z-rc-balance.js | 3 | l-rc-apple-balance | Apple's balance sheet, line by line | `balanceBlocks` |
| K1 | | 4 | l-rc-apple-cash | Apple's cash flow: where the money went | `cashRiver` |
| K3 | mod-z-rc-call.js | 5 | l-rc-apple-call | Listen: Apple's earnings call, explained | `callPlayer` ★ (opts `{call:'apple'}`) |
| K4 | mod-z-rc-spacex.js | 6 | l-rc-spacex | SpaceX: fast growth, still a loss | `growthVsProfit` |
| K3 | | 7 | l-rc-spacex-call | Listen: SpaceX's first earnings call | `callPlayer` (opts `{call:'spacex'}`) |
| K4 | | 8 | l-rc-price | How earnings move the stock price | `earningsPrice` ★ |

All lessons: `course: 'realco'`. Levels: words/income/balance/cash 'Beginner', calls and SpaceX 'Intermediate', price
'Intermediate'. `mins` realistic (8–14). `sources`: from `SML.realco.apple.sources` / `.spacex.sources` (plus any you
add, verified). Cross-link: #l-statements, #l-earnings, #l-ratios, #l-earnings-season, #l-iv-crush, #l-volatility,
#l-index-funds, #l-one-percent, #l-position-size, and each other's #l-rc-* ids, #calendar, #tool-call etc.

### Widget ideas (minimum bar; be creative beyond it)

* **termTranslator** (K2): pick a term (YoY, QoQ, revenue/top line, cost of sales, gross margin, opex, R&D, SG&A,
  operating income, operating margin, operating LOSS, net income/bottom line, net loss, EPS, diluted shares, guidance,
  consensus, beat/miss, segment, one-time item, adjusted/non-GAAP, EBITDA, free cash flow…). A toggle flips the same
  card between Hoppy's Coffee Cart and Apple (and SpaceX where it teaches better, e.g. operating loss, EBITDA). Show
  the arithmetic live, plus a tiny "moves the stock because…" line. YoY vs QoQ must show Apple's −1.6% QoQ vs +16% YoY
  and explain seasons with the 5-quarter trend.
* **incomeWaterfall** (K2): Apple's quarter as a waterfall from revenue to net income to EPS (revenue → cost of sales →
  gross profit → R&D → SG&A → operating income → other → tax → net income → ÷ shares → EPS). Tap a bar for its term card.
  Toggles: this quarter / a year ago (animate the change, show YoY on every bar), and "remove the tariff refund" (EPS
  $2.02 → about $1.91, gross margin about 48%). Below it: products vs services (margins 40% vs 76%) and category/region
  bars with YoY.
* **statementExplorer** ★ (K2): company switch (Apple / SpaceX) and statement switch (income / balance sheet / cash
  flow). The real statement as a clean table with both periods and change; tap any line → term card (what, Hoppy's cart,
  the real number, why it matters/stock). Must handle SpaceX's segment and preferred-stock lines and the fact that only
  six-month cash-flow totals exist for SpaceX.
* **balanceBlocks** (K1): assets vs liabilities + equity as two stacked columns that always balance; tap a block for
  its term card; current vs non-current split; Sep 2025 → Jun 2026 animation (equity +$33.8B, retained earnings flips
  from −$14.3B to +$11.3B). Key gauges: net cash (~$62B), current ratio (1.00), debt/equity, book value per share and
  price-to-book at a price slider. Interactive "what a $25B buyback does" (cash and equity both drop; share count drops;
  EPS rises) and a Hoppy's cart mini balance sheet beside it.
* **cashRiver** (K1): nine months of Apple cash as a river/Sankey: net income + non-cash costs ± working capital →
  operating cash $117.0B → capex, buybacks $62.1B, dividends $11.8B, debt repaid, securities bought. Free cash flow
  ≈ $110.2B. Profit vs cash comparison (why they differ), and how buybacks shrank the share count (EPS +28.7% vs net
  income +27.1%).
* **callPlayer** ★ (K3): the star. See "Earnings call audio" below.
* **growthVsProfit** (K4): SpaceX's quarter: revenue +92% but a loss; segments (Starlink profitable, AI and Space losing)
  as tiles with margins; GAAP net loss −$541M vs adjusted EBITDA +$3.5B with the bridge animated step by step (what
  each add-back means and why investors argue about it); capex $18.4B vs operating cash, cash burn; balance sheet before
  and after the IPO (cash $24.7B → $93.5B, equity $2.6B → $127.2B); dilution (shares 2.9B → 5.9B, same profit split
  twice as many ways); Starlink subscribers and ARPU; price-to-sales instead of P/E (market value input slider).
* **earningsPrice** ★ (K4): Price = EPS × P/E playground with Apple's real TTM EPS ($8.72) and the July 30 close
  ($333.43 → P/E ≈ 38). Scenarios: beat/miss, guidance raise/cut (forward EPS), one-time item stripped out, multiple
  expands/contracts. "Replay July 31": step through what changed and land near the real ≈ −7%. A quick game: read a
  headline (beat + weak guide, miss + raised guide, …) and predict up/down, then see why. Also the SpaceX case.

## Earnings call audio (K3)

* Write two scripts in your module: Apple (~6–8 min) and SpaceX (~5–6 min). Each is an array of cues
  `{ id, speaker: 'narrator'|'coach', text, chapter, show: {...} }`. The NARRATOR reports, in plain retold words, what
  happened and what management said ("Apple's finance chief said…"); the COACH (FiredBunny) explains what it means,
  with the Hoppy's cart comparison and why the stock cares. Structure like a real call: opening and safe-harbor
  (explain what that is), CEO highlights, CFO walk through revenue, categories, regions, gross margin (tariff refund),
  opex, net income, EPS, cash and buybacks, dividend, guidance; then the analyst Q&A themes (paraphrased as "An analyst
  from Evercore asked how much of the slowdown came from supply and how much from currency" etc.); then "after the
  call": expectations vs results and the next-day stock move. Insert 1–2 interactive checkpoints (e.g. "Before you hear
  the guidance: will the stock go up or down?") that pause the audio until answered.
* Render audio in the workspace with Piper (already installed: `python3 -c 'import piper'`) using the LibriTTS voice
  (CC BY 4.0): model `/tmp/claude-0/-home-claude/842667f2-ab20-5f62-bf05-63855f5f5c38/scratchpad/tts/en-us-libritts-high/en-us-libritts-high.onnx`,
  `SynthesisConfig(speaker_id=78)` for the narrator and `speaker_id=12` for the coach (pre-screened for clarity; you
  may A/B a couple of others by signal metrics, but you cannot listen, so keep these unless clearly broken). Write
  numbers in the TEXT the way they should be spoken ("one hundred nine point four billion dollars") and keep a
  separate display caption with digits. Synthesize each cue separately, add ~0.35 s silence between cues, concatenate,
  then encode with ffmpeg to AAC in .m4a (mono, 22.05 kHz, ~40 kbps, `-movflags +faststart`). Record each cue's
  start/end seconds and embed that timing table in your module. Output files:
  `/home/claude/site/dist/audio/apple-fq3-2026.m4a` and `/home/claude/site/dist/audio/spacex-q2-2026.m4a`
  (the page loads them by the relative URL `audio/<name>.m4a`). Keep each under ~3 MB. Keep your render script in the
  scratchpad and the cue text in the module so a re-render is one command.
* Player: play/pause (big), scrubber with chapter marks, speed 0.75–1.5×, current speaker chip, live caption with the
  words highlighted progressively (proportional within a cue is fine), transcript tab (click a line to jump), and a
  STAGE that animates what is being said: the number counting up, the statement line lighting up, a mini chart, a
  YoY arrow, a "Hoppy's cart" mini card, the guidance range vs the consensus marker, the stock replay. Space bar
  toggles play. Must look great at 375 px.
* Fallbacks: if the audio file fails to load (offline, file:// harness), offer "Use my device's voice" (Web Speech
  API, `speechSynthesis`, one utterance per cue, advance on `end`) and "Read along" (auto-advance by cue length).
  Never autoplay; start only on a click. Stop audio/speech on `SML.onCleanup`.
* Show the attribution in small type: "Narration written by FiredBunny: a plain-words retelling of the call, not the
  recording. Voices: Piper text-to-speech, LibriTTS voices (CC BY 4.0)." Link to the official source (Apple investor
  relations / SpaceX release in `sources`).

## Test and report

`python3 /home/claude/site/tools/harness.py mod-yours.js` (widgets), then
`python3 /home/claude/site/tools/build.py && python3 /home/claude/site/tools/sitetest.py --routes <your lesson ids and tools> --shots <same> --fuzz`
and look at the screenshots in `/home/claude/site/shots/site/` at both widths. Report briefly: what you built, any
number you derived (with the arithmetic), anything you needed from shared files.
