# FiredBunny analytics

The website loads the Google Tag Manager container **`GTM-PJR6KKW9`**, which carries the Google tag for the Google
Analytics 4 property **`G-XVRHV7GTZ9`** (with GA4's own automatic page views, scrolls, outbound clicks, downloads and
form events). On top of that the site reports what visitors do on its own pages:

- For every page it shows, `gtag('set', …)` gives GA4 the page's path (`/l-wheel` instead of `/#l-wheel`), title and
  referrer, which GA4 applies to every event that follows, its automatic ones included; then a `page_view`.
- Events go out as `gtag('event', name, params)`, straight to GA4. Each one the site sends also carries the page
  details (page type, lesson, course, track...) in its own parameters: GA4 ignores custom keys given to `set`.
- The first page of a visit: the container's Google tag sends a page view as it loads, under the browser's own
  address with the `#` part dropped, so a visit that starts on a lesson link counts that first page as `/` (with the
  right title). Setting the Google tag's `send_page_view` to `false` in Tag Manager (step 2 below) fixes that: the site
  then sends the first page view itself, with the real path and details. The site checks which way the container is
  set, so there is never a double count either way.

Code: `src/mod-a-analytics.js` (consent, loading, page views, automatic events) and `SML.track(...)` calls in the
modules (audio player, call player, quiz, searches, downloads...).

## Privacy and consent

- Never sent: a visitor's profile, household, goals, net worth, money figures, assessment answers, or anything typed
  into a tool. Searches send the search term (glossary words, stock tickers); quizzes send right or wrong.
- Visitors whose time zone is in Europe see a small banner; nothing loads until they click Allow. Everyone else has it
  on by default. **Settings > Privacy > Share usage stats** switches it off and clears the Google Analytics cookies.
- Off automatically in the claude.ai copy, on localhost and in automated browsers (the build's home-page snapshot).
- The container loads only after the first page has drawn, so it never slows the start.
- Debugging: add `?fbdebug` to the address. The commands collect in `window.dataLayer` (type `dataLayer` in the
  browser console) without loading the container or sending anything. In GA4, **Admin > DebugView** shows live events
  from your own browser when the GA Debugger extension is on.

## One-time setup

1. **Admin > Data streams > your web stream > Enhanced measurement > gear icon > Page views > Show advanced settings:**
   turn **off** "Page changes based on browser history events". The site sends its own page view for each page with
   the right path; with this on, a page change can also be counted a second time, under the wrong address.
2. **In Tag Manager (recommended):** tagmanager.google.com > container GTM-PJR6KKW9 > Tags > the Google tag
   (G-XVRHV7GTZ9) > Configuration settings > Add parameter: `send_page_view`, value `false` > Save, then Submit >
   Publish. The first page of each visit is then recorded with its real address and the page details.
3. **Admin > Custom definitions > Create custom dimensions** (scope *Event*), one per parameter you want in reports:
   `page_type`, `content_id`, `content_title`, `course_name`, `track_name`, `target`, `target_type`, `label`, `method`,
   `voice`, `speed`, `connection`, `display_mode`. And **custom metrics**: `count`, `score`, `percent`,
   `position_sec`, `duration_sec`, `lessons_done`. (GA4 only shows custom parameters in reports once they are
   registered, from then on.)
4. **Admin > Events:** mark as key events the ones that matter for marketing, for example `lesson_complete`,
   `assessment_complete`, `audio_complete`, `app_installed`. They can then be imported into Google Ads.
5. Optional: **Admin > Data settings > Data collection:** turn on Google signals for demographics and cross-device
   reports (mention it in your privacy wording if you do).

## Parameters

Carried by every event the site sends (the first three also by GA4's automatic events):

| Parameter | Meaning |
|---|---|
| `page_location`, `page_title`, `page_referrer` | The page as a path: `https://firedbunny.com/l-wheel` |
| `page_type` | `home`, `lesson`, `course`, `tool`, `track`, `post` or `page` |
| `content_id`, `content_title` | The page's lesson, course or tool id and title |
| `course_name`, `track_name` | Course and track (Trading, Retirement & Wealth, FIRE) |
| `connection`, `display_mode`, `lessons_done` | online or offline; `app` (installed) or `browser`; lessons finished so far |

Per event: `target` and `target_type` (what the event is about: a widget, lesson, ticker, file), `label` (outcome or
value), `method` (how: button, autoplay, lock screen...), numbers `count`, `score`, `percent`, `position_sec`,
`duration_sec`, audio `voice` and `speed`, and `search_term`.

## Events

| Event | When | Parameters |
|---|---|---|
| `page_view` | Every page shown | the page details above |
| `select_content` | A click on a link inside the site | target (page it opens), label (link text), target_type (where: nav, menu, footer, a section) |
| `page_scroll` | Reading depth on each page | percent: 25, 50, 75, 90 |
| `widget_interact` | First use of each interactive picture, tool or simulator on a page | target (widget), method |
| `quiz_answer` | A lesson quiz or an earnings-call question answered | target, label: correct, wrong or prediction |
| `lesson_complete` | A lesson marked done (quiz or button) | target (lesson), label (title), target_type (course), count (lessons done) |
| `assessment_complete` | Investor self-assessment finished | label (investor profile), target (top style), score (risk 0-100) |
| `audio_start` | Lesson or earnings-call audio starts | target, target_type (lesson or earnings_call), method (button, autoplay, chapter, mini_player, lock_screen), voice, speed, duration_sec |
| `audio_resume`, `audio_pause` | Play after a pause; pause | method, percent, position_sec |
| `audio_progress` | Listening milestones | percent: 25, 50, 75 |
| `audio_complete` | Played to the end | label: autoplay_next or stop |
| `audio_skip` | Next or previous lesson | label (next or previous), target (lesson it goes to), method (button, mini_player, lock_screen), count (1 if playing) |
| `audio_chapter` | A chapter chip tapped | label (chapter) |
| `audio_setting` | Speed or autoplay changed | method (speed or autoplay), label (new value) |
| `audio_download` | Audio saved or removed for offline | label (save or remove), target_type (lesson, track, all), method (player or offline_page), count |
| `audio_fallback` | Recording could not load; device voice used | label: offline or load_error |
| `search` | Glossary search or earnings lookup | search_term, target_type (glossary or earnings), count (results) |
| `earnings_lookup` | A stock looked up | target (ticker), label (ok, not_found, offline...) |
| `file_download` | Calendar exported to .ics | label, target_type, count (events) |
| `copy_content` | Something copied (Pine Script, tables) | label, count (characters) |
| `settings_action` | Settings and dashboard buttons (export, import, delete, reset, save...) | label |
| `form_submit` | A form sent (feedback, imports) | target (which form) |
| `menu_toggle` | Phone menu opened or closed | label |
| `app_install_prompt` | Browser offers install; the visitor's answer | label (available, accepted, dismissed), method |
| `app_installed` | Installed as an app | label |
| `app_update` | "New version" bar: Reload or Later | label |
| `analytics_opt_out` | Usage stats switched off (the last event from that browser) | label |
| `js_error` | A script error (up to 10 per visit) | label (message), target (file:line) |

## Questions the data answers

- **Which lessons pull people in, and where do they drop?** Reports > Engagement > Pages and screens (by path), with
  `page_scroll` and `lesson_complete` per `content_id`.
- **Is the audio worth it?** `audio_start` vs `audio_complete` per lesson, `audio_progress` drop-off, autoplay chains
  (`method` = autoplay), lock-screen use, offline downloads.
- **Funnel:** home > lesson page > `audio_start` or `widget_interact` > `quiz_answer` > `lesson_complete`
  (Explore > Funnel exploration).
- **Who are the visitors?** `assessment_complete` by investor profile and risk score; build segments from it and
  compare what each group reads, listens to and finishes (Explore > Free form, Segment overlap, Path exploration).
- **What to market:** top tools (`widget_interact` by `target`), top searches (`search_term`), track interest
  (`track_name`), installed-app users (`display_mode` = app) and how much more they engage.
- **Quality:** `js_error` and `audio_fallback` point at broken pages or files.
