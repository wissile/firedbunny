# FiredBunny analytics

The website reports what visitors do to **Google Tag Manager `GTM-PJR6KKW9`**, which forwards it to **Google
Analytics 4**. Code: `src/mod-a-analytics.js` (consent, Tag Manager, automatic events) and `SML.track(...)` calls in
the modules. `gtm-firedbunny.json` here is the Tag Manager setup to import; `tools/gtm_container.py` regenerates it
from the source whenever events are added.

## Privacy and consent

- Never sent: a visitor's profile, household, goals, net worth, money figures, assessment answers, or anything typed
  into a tool. Searches send the search term (glossary words, stock tickers), quizzes send right or wrong.
- Visitors whose time zone is in Europe are asked first (a small banner); nothing loads until they click Allow.
  Everyone else has it on by default. **Settings > Privacy > Share usage stats** switches it off; switching off also
  clears the Google Analytics cookies.
- Off automatically in the claude.ai copy, on localhost, and in automated browsers (the build's home-page snapshot).
- Tag Manager loads only after the first page has drawn, so it never slows the start.
- Debugging: add `?fbdebug` to the address. Events are pushed to `window.dataLayer` (type `dataLayer` in the browser
  console to see them) without loading Tag Manager or sending anything.

## One-time setup

1. **Tag Manager:** Admin > Import container > choose `gtm-firedbunny.json` > workspace *Default* > **Merge** >
   *Rename conflicting tags, triggers and variables* > Confirm.
2. Open the variable **FB - GA4 Measurement ID** and replace `G-XXXXXXXXXX` with your GA4 Measurement ID
   (Google Analytics > Admin > Data streams > your web stream).
3. If the container already had its own GA4 tags, pause them (otherwise page views count twice). Then **Submit >
   Publish**. Use **Preview** first to watch the events arrive.
4. **Google Analytics > Admin > Data streams > your stream > Enhanced measurement > gear icon:** turn **off** "Page
   changes based on browser history events" (the site sends its own page views with real page paths such as
   `/l-wheel`). Leave scrolls, outbound clicks and file downloads as you like.
5. **Admin > Custom definitions > Create custom dimension** (scope *Event*) for each parameter below you want in
   reports: `page_type`, `content_id`, `content_title`, `course_name`, `track_name`, `item_name`, `item_category`,
   `label`, `method`, `voice`, `speed`, `connection`, `display_mode`. And as *custom metrics*: `percent`,
   `position_sec`, `duration_sec`, `lessons_done`, `value`.
6. **Admin > Events:** mark as key events (conversions) the ones that matter for marketing, for example
   `lesson_complete`, `assessment_complete`, `audio_complete`, `app_installed`.

## Parameters (every event carries all of them; unused ones are empty)

| Parameter | Meaning |
|---|---|
| `page_location`, `page_title`, `page_referrer` | The page in path form: `https://firedbunny.com/l-wheel` |
| `page_type` | `home`, `lesson`, `course`, `tool`, `track`, `post` or `page` |
| `content_id`, `content_title` | The page's lesson, course or tool id and title |
| `course_name`, `track_name` | Course and track of the page (Trading, Retirement & Wealth, FIRE) |
| `item_name`, `item_category` | What the event is about (a widget, a lesson, a ticker, a file) and its kind |
| `label`, `method` | The outcome or value, and how it happened (button, autoplay, lock screen...) |
| `value`, `percent`, `position_sec`, `duration_sec` | Numbers: counts, scroll or listening percent, seconds |
| `voice`, `speed` | Audio: `natural` or `device` voice, playback speed |
| `search_term` | Glossary word or stock ticker |
| `connection`, `display_mode`, `lessons_done` | On page views: online or offline, `app` (installed) or `browser`, lessons finished so far |

## Events

| Event | When | Useful parameters |
|---|---|---|
| `page_view` | Every page shown (the site changes pages without reloading) | page_*, content_*, connection, display_mode, lessons_done |
| `select_content` | A click on a link inside the site | item_name (target page), label (link text), item_category (where: nav, menu, footer, hero, section) |
| `page_scroll` | Reading depth on each page | percent: 25, 50, 75, 90 |
| `widget_interact` | First use of each interactive picture, tool or simulator on a page | item_name (widget), method |
| `quiz_answer` | A lesson quiz or an earnings-call question answered | label: correct, wrong or prediction |
| `lesson_complete` | A lesson marked done (quiz or button) | item_name (lesson), item_category (course), value (lessons done) |
| `assessment_complete` | Investor self-assessment finished | label (investor profile), item_name (top style), value (risk score 0-100) |
| `audio_start` | Lesson or earnings-call audio starts | item_name, item_category (lesson or earnings_call), method (button, autoplay, chapter, mini_player, lock_screen), voice, speed |
| `audio_resume`, `audio_pause` | Play again after a pause; pause | method, percent, position_sec |
| `audio_progress` | Listening milestones | percent: 25, 50, 75 |
| `audio_complete` | Audio played to the end | label: autoplay_next or stop |
| `audio_skip` | Next or previous lesson | label (next or previous), item_name (target lesson), method (button, mini_player, lock_screen) |
| `audio_chapter` | A chapter chip tapped | label (chapter) |
| `audio_setting` | Speed or autoplay changed | method (speed or autoplay), label (new value) |
| `audio_download` | Audio saved or removed for offline | label (save or remove), item_category (lesson, track, all), method (player or offline_page), value (count) |
| `audio_fallback` | Recording could not load; device voice used | label: offline or load_error |
| `search` | Glossary search or earnings lookup | search_term, item_category (glossary or earnings), value (results) |
| `earnings_lookup` | A stock looked up in the earnings tool | item_name (ticker), label (ok, not_found, offline...) |
| `file_download` | Calendar exported to .ics | label (file or event), item_category, value (events) |
| `copy_content` | Something copied (Pine Script, tables) | label |
| `settings_action` | Settings and dashboard buttons (export, import, delete, reset, save...) | label |
| `form_submit` | A form sent (feedback, imports) | item_name (which form) |
| `menu_toggle` | Phone menu opened or closed | label |
| `app_install_prompt`, `app_installed` | The browser offers install; outcome; installed | label |
| `app_update` | "New version" bar: Reload or Later | label |
| `analytics_opt_out` | Usage stats switched off in Settings (the last event from that browser) | label |
| `js_error` | A script error (up to 10 per visit) | label (message), item_name (file:line) |

## Questions the data answers

- **Which lessons pull people in, and which lose them?** Pages and screens report by page path, plus `page_scroll`
  and `lesson_complete` per `content_id`.
- **Is the audio worth it?** `audio_start` vs `audio_complete` by lesson, `audio_progress` drop-off, autoplay chains
  (`method = autoplay`), lock-screen use, offline downloads.
- **Funnel:** home > lesson page > `audio_start` or `widget_interact` > `quiz_answer` > `lesson_complete`
  (Explore > Funnel exploration).
- **Who are the visitors?** `assessment_complete` by investor profile and risk score; compare their behaviour with a
  segment (Explore > Segment overlap / Free form).
- **What to market:** top tools (`widget_interact` by `item_name`), top searches (`search_term`), track interest
  (`track_name`), installed-app users (`display_mode = app`) and how much more they engage.
- **Quality:** `js_error` and `audio_fallback` show broken pages or files.
