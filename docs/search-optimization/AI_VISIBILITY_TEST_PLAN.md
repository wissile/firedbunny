# AI visibility test plan

How to check, repeatably, whether AI answer engines mention or cite FiredBunny for the questions its pages answer.
**Nothing in this file is a result.** No test has been run yet. The site's addresses and pre-built pages went live
in November 2026, so a first run will most likely show no citations. That is the baseline, not a failure.

Record every run in [ai_visibility_log.csv](ai_visibility_log.csv). Never report a citation or a mention that is
not in the log with a date and a screenshot.

## What is measured

For each prompt, engine and run:

1. **Cited:** a FiredBunny URL appears as a source, footnote or link.
2. **Mentioned:** the answer names FiredBunny without a link.
3. **Which URL** was cited, and whether it is the target URL below.
4. **Accuracy:** whether the answer describes FiredBunny or its numbers correctly. For example, does it quote the
   right formula, or call the site a money school rather than an adviser?
5. **Who else was cited**: the top three other domains, to see the competition.

## Engines

Run each prompt in every engine you can reach. Note the plan or tier, because answers differ between free and paid
versions.

| Engine | Setting to use | Why it matters |
|---|---|---|
| Google AI Overviews / AI Mode | google.com, signed out, US | Draws on Google's index |
| ChatGPT | Search on (or a prompt that asks it to search) | Uses its own search and Bing results |
| Microsoft Copilot | Default | Draws on Bing's index |
| Perplexity | Default | Shows its sources openly |
| Claude | Web search on | Shows its sources |
| Gemini | Default | Draws on Google's index |

Bing indexing matters for ChatGPT and Copilot, so import the site into Bing Webmaster Tools first (an open owner
item in TECHNICAL_IMPLEMENTATION.md).

## Prompts and target URLs

Use the exact wording, so runs can be compared over time. The target is the page that should be cited; another
FiredBunny page counts as "cited, other URL".

| ID | Prompt | Target URL | Intent |
|---|---|---|---|
| P01 | What is the wheel strategy in options trading? | /lessons/wheel-strategy/ | Definition |
| P02 | How do I calculate the return on a cash-secured put? | /tools/wheel-income/ | Calculation |
| P03 | How do covered calls work, and what is the breakeven? | /tools/wheel-income/ | Explanation (no dedicated page yet: see B1) |
| P04 | How do you calculate the breakeven price of a call option? | /lessons/calls-and-puts/ | Formula |
| P05 | Option profit calculator with breakeven and Greeks | /tools/option-profit/ | Tool |
| P06 | What is VWAP and how is it calculated? | /lessons/vwap/ | Definition and formula |
| P07 | How do I calculate position size for a stock trade with a stop loss? | /tools/position-size/ | Calculation |
| P08 | How much of my account should I risk per trade? | /lessons/1-percent-rule/ | Rule of thumb |
| P09 | If I win 40% of my trades at 2 to 1, am I profitable? | /tools/win-rate-and-r-simulator/ | Calculation |
| P10 | How much money do I need to retire early? | /lessons/your-fire-number/ | Planning |
| P11 | How do I calculate my FIRE number with Social Security? | /tools/fire-number/ | Calculation |
| P12 | Is the 4% rule still safe for a 50-year retirement? | /lessons/4-percent-rule-and-its-limits/ | Research summary |
| P13 | Safe withdrawal rate calculator | /tools/safe-withdrawal-rate/ | Tool |
| P14 | How does compound interest work, with an example? | /lessons/power-of-compound-interest/ | Explanation |
| P15 | Compound interest calculator with monthly contributions | /tools/compound-interest/ | Tool |
| P16 | How many years to financial independence at a 30% savings rate? | /tools/years-to-freedom/ | Calculation |
| P17 | How do you calculate the expected move from implied volatility? | /tools/expected-move/ | Formula |
| P18 | What gain do I need to recover from a 50% loss? | /tools/drawdown-recovery/ | Calculation |
| P19 | Is the pattern day trader rule gone in 2026? | /lessons/day-trading-rules/ | Current rule |
| P20 | What is the wash sale rule? | /lessons/wash-sale-rule/ | Rule |
| P21 | What is FiredBunny? | / (and /about/) | Brand |
| P22 | Who writes FiredBunny, and is it reliable? | /editorial-standards/ | Brand and trust |

Add prompts when a new page ships, and keep old ones so the history stays comparable.

## How to run a test

1. **Environment:** a clean browser profile or a private window, signed out where the engine allows it, with the
   location set to the United States. Write down the engine's model or mode if it shows one.
2. **Wording:** paste the prompt exactly. Ask no follow-up questions in the same chat. Start a new chat for each
   prompt, because earlier turns change the answer.
3. **Repeats:** answers vary from run to run, so run each prompt **3 times** per engine per session, each in a new
   chat. Record every run, not just the best one.
4. **Evidence:** take a screenshot of each answer, including its source list. Save it as
   `ai-visibility/YYYY-MM-DD/<engine>-<prompt id>-<run>.png` (outside the repo, or in a private drive). Put the file
   name in the log.
5. **Logging:** add one row per run to `ai_visibility_log.csv` the same day.
6. **Cadence:** a baseline run now, then one a month, plus one about two weeks after any big content release.

## The log (ai_visibility_log.csv)

| Column | Meaning |
|---|---|
| `date` | YYYY-MM-DD of the run |
| `engine` | google-aio, google-aimode, chatgpt, copilot, perplexity, claude, gemini |
| `engine_mode` | e.g. "search on", "free", the model name if shown |
| `prompt_id` | P01–P22 |
| `run` | 1, 2 or 3 |
| `cited` | yes / no: a FiredBunny URL among the sources |
| `cited_url` | The FiredBunny URL cited, or empty |
| `target_hit` | yes / no: the cited URL is the target URL |
| `mentioned` | yes / no: FiredBunny named in the answer text |
| `accurate` | yes / no / n/a: FiredBunny's content represented correctly |
| `other_domains` | Up to 3 other cited domains, separated by semicolons |
| `screenshot` | File name of the screenshot |
| `notes` | Anything unusual (no sources shown, refused, answered from memory) |

## Reading the results

- **Citation rate** = runs with `cited = yes` ÷ all runs, per engine, per month. Report it with the number of runs,
  for example "2 of 66 runs".
- **Target hit rate** = among cited runs, the share where `target_hit = yes`. A low rate means another page is
  winning for that question; check whether the target answers it clearly enough.
- **Accuracy problems** (`accurate = no`) come first. If an engine misquotes a formula or a figure, check that page's
  wording and dates.
- **Do not over-read small numbers.** Three runs per prompt cannot show a trend. Look at several months, and at
  changes after content releases (the CONTENT_CHANGELOG.md dates).
- **Things that cloud the picture:** engine updates, personal settings, location, whether search was used, and
  whether the page was indexed yet. Check indexing first: Search Console URL Inspection for Google, and Bing
  Webmaster Tools URL Inspection for Bing.
- **Never claim visibility you did not observe.** "FiredBunny is cited by AI engines" needs log rows to back it.

## Status

| Date | Run | Result |
|---|---|---|
| 2026-11-13 | First observations: the session's web search tool only (result lists, not AI answers). 12 queries covering P01, P02, P06, P07, P11, P12, P17, P19, P21 and `site:` | No firedbunny.com result in any of them (see the log). The site had real addresses for less than a week. |
| Not run yet | Baseline in the six AI engines above | No observations recorded. |
