# Addendum 4 (October 21, 2026): FiredBunny brand, accounts, self-assessment, dashboard

The site is now **FiredBunny** (logo: a chill white bunny with orange sunglasses lounging next to rising candles; a
flame on the "i"; "Fired" in gold, "Bunny" in white; neon glow on black). The night-desk design does NOT change.
Personality comes from small touches: the bunny mark, flame/gold accents on brand moments, a relaxed, warm, plain
voice ("Hop hop. Saved."), bunny tips. Never cutesy in lessons or numbers; never emoji.

Everything in SPEC.md still applies (night-desk tokens, SML.svg/ui helpers, responsive 300-840 px widgets drawn 1:1,
colors only via classes/tokens, module-prefixed CSS through `SML.css`, `SML.fmt`, no external libs, plain voice, no
em-dash asides). Only create/edit your own module file. If you need something from a shared file, say so in your
report instead of editing it.

## Shared pieces already built (read them, do not edit)

* `src/brand.js`: `SML.brandName`, `SML.bunnyMark(size)` (svg), `SML.wordmark()`, `SML.flame(size)`,
  `SML.brandArt` (data: URI of the real logo art, 1200×800 webp, black background — use in <img>, `object-fit`),
  `SML.bunnyTip(html, label?)` (callout), `SML.hop(msg)` (toast). Tokens: `--flame` (#ff6224), `--gold` (#ffb52e),
  `--flame-t`. Classes: `.fb-tip`, `.fb-art`, `.fb-glow`.
* `src/account.js`: `SML.account` — read the file's top comment and API. Key calls:
  * `SML.account.status` → `{ready, mode:'cloud'|'local', signedIn, uid, name, avatar, color, isOwner, cloudError, localPending}`
  * `SML.account.ready()` (Promise), `SML.account.onChange(fn)` (also the DOM event `sml:account` with
    `detail.type` 'ready' | 'change' | 'mode')
  * `SML.account.get()` → a deep copy of the profile; `SML.account.save(patch | fn)` merges/mutates and stores
    (cloud when signed in and writable, else this browser). Never call save from render code or on load; only on a
    user action.
  * `SML.account.displayName()`, `netWorth(profile?)` → `{assets, debts, net, byType, debtByType, investable, cash}`,
    `householdIncome()`, `snapshot()` (records today's net worth in `netWorthHistory`), `newId(prefix)`,
    `assetTypes` / `debtTypes` ([key,label] lists),
  * `SML.account.assessments.list()` (newest first), `.latest()`, `.get(id)`, `.add(result)` → id, `.remove(id)`
  * `migrateLocal()` / `dismissMigration()` (offer when `status.localPending`), `exportData()` (Promise of a JSON-able
    object), `importData(obj)`, `clearAll()`, `progressFor(lessonIds)`.
  * Lesson progress (`SML.progress`) is synced into the profile automatically.
* Router: `pages.js` re-renders `dashboard`, `profile`, `settings`, `results`, `signin` in place when the account
  becomes ready or changes mode (`SML.rerender()`), so render from `SML.account` state each time; pages that keep
  live listeners must remove them with `SML.onCleanup`.
* Profile shape (in account.js `DEFAULTS()`): nickname, birthYear, retireAge, monthlySpend, household[], assets[],
  debts[], netWorthHistory[], goals[], progress.done[], latestAssessment, assessmentSummary[], prefs{defaultTrack,
  weeklyOnCalendar, showTips}, createdAt, updatedAt. Goals: `{id, title, type:'fire'|'house'|'emergency'|'debt'|
  'college'|'retire'|'custom', target, current, source:'manual'|'networth'|'investable'|'cash', deadline:'YYYY-MM-DD',
  monthly, created, done}`. Household member: `{id, name, relation:'self'|'partner'|'child'|'parent'|'other',
  birthYear, income, incomeNote}`. Asset: `{id, name, type, value, owner(memberId|''), note, updated}`. Debt:
  `{id, name, type, balance, rate, owner, note, updated}`.
* Downloads (artifact capability `downloads`): `const dl = await claude.use('downloads')` inside try/catch when
  `window.claude && typeof window.claude.use === 'function'`; `dl.save({filename, data})` on a click; handle
  'declined'/'rate_limited'; fallback: Blob object-URL `<a download>`.
* Storage truth to say plainly in UI copy: signed in with a Claude account and allowed to save here → saved to your
  private FiredBunny profile (only you can read it, not even the site owner). Otherwise → saved in this browser;
  export a file to move it. The mobile apps are in development and will use the same profile; until then, export.

## Assessment result shape (fork Q produces, fork R renders, fork D summarizes)

```js
{
  v: 1, id: 'a-…', date: '2026-10-21T…Z',
  answers: { /* raw answers keyed by question id */ },
  inputs: { age, retireAge, horizon /*years*/, household /*'single'|'couple'|'family'*/, dependents, incomeYear,
            savingsMonth, spendMonth, netWorth, investable, cash, homeEquity, debtHigh /*card+personal*/,
            debtOther, emergencyMonths, hoursWeek, experienceYears },
  scores: {
    riskCapacity: 0-100, riskWillingness: 0-100, risk: 0-100,
    traits: { patience, discipline, riskAppetite, analytical, handsOn, emotionalControl, knowledge, timeAvailable }, // each 0-100
    styles: { passive, value, swing, day, wheel, fire, crypto }, // fit 0-100 each
  },
  profile: { key: 'conservative'|'moderate'|'balanced'|'growth'|'aggressive', label, allocation: { stocks, bonds, cash },
             core: 0-100, satellite: 0-100 /* % of investable money for active strategies */, cryptoCap: 0-10 /* % max */,
             riskPerTrade: 0.5|1|2 /* % */ },
  archetype: { key: 'steady'|'detective'|'surfer'|'sprinter'|'farmer'|'freedom', name: 'Steady Bunny', tagline, description },
  goals: { primary, list: [...keys], fireNumber, yearsToGoal, targetAge, onTrack: true|false, monthlyNeeded, gap },
  insights: { strengths: [..], watchouts: [..], actions: [{ title, detail, href }], lessons: ['l-…', …], tools: ['tool-…', …] }
}
```
Archetypes: steady = Steady Bunny (passive index builder), detective = Detective Bunny (value investor), surfer =
Surfer Bunny (swing trader), sprinter = Sprinter Bunny (day trader), farmer = Farmer Bunny (options income / wheel),
freedom = Freedom Bunny (FIRE planner). Pick by the highest style fit adjusted by temperament; always show the blend.
Lesson ids must exist (`SML.lessons`), tool ids must exist (`SML.tools`).

Draft handling: when the quiz finishes, fork Q stores the result as the draft (`SML.store.set('assessDraft', result)`
and `SML.assessDraft = result`) and navigates to `#results`. The results page shows the draft when present
(unsaved), otherwise the latest saved assessment, and offers a history picker. Saving = `SML.account.assessments.add`
then clearing the draft.

## Pages and owners

| Fork | Module | Builds |
|---|---|---|
| A | mod-y-about.js | `SML.pages.about` (story, mission, values, how to use the site, feedback form), widget `feedbackInbox` (owner-only list of feedback) |
| Q | mod-y-assess.js | `SML.pages.assessment` (the self-assessment flow), `SML.assess = { score(answers), archetypes }` |
| R | mod-y-results.js | `SML.pages.results` (the visual results report, save prompt, history compare) |
| D | mod-y-dash.js | `SML.pages.dashboard` (goals, net worth with assets/debts, household summary, profile over time, lesson progress, upcoming dates, owner feedback inbox) |
| P | mod-y-account.js | `SML.pages.profile`, `SML.pages.settings`, `SML.pages.signin` |

Each page function: `SML.pages.x = function (view) { view.innerHTML = …; …; return 'Title'; }` using
`SML.pageHeader('', kicker, titleHTML, sideHTML)` for the top. Pages must look great at 1280 and 375 px.

### Feedback (fork A)

Storage chain, in order: (1) `db` write to `feedback/<uid>` doc `{entries: [{id, at, kind, where, message, page,
status:'new'}], updatedAt}` (append, cap 50 entries) using `await claude.use('user')` id and `await claude.use('db')`
— works for the owner, editors and contributors; (2) if that is unavailable or rejects, `comments` composer:
`(await claude.use('comments')).openComposer({element: theFormSection})` from the submit click (works for people who
can comment; the shell posts it); (3) otherwise "Copy your message" with a plain note that sending is not available
in this view. Rules declared at publish: `feedback` read/write owner, `feedback/{self}` read/write interact.
`feedbackInbox` (owner only, `status.isOwner`): lists `db.collection('feedback')` docs' entries newest first, with
kind/where/message/time, and lets the owner mark entries done (update the doc).

## Test and report

`python3 /home/claude/site/tools/harness.py mod-yours.js` renders widgets; pages are not rendered by the harness, so
also run `python3 /home/claude/site/tools/build.py && python3 /home/claude/site/tools/sitetest.py --routes <yours>
--shots <yours> --fuzz` and look at the screenshots in `/home/claude/site/shots/site/` at both widths. In tests
there is no Claude runtime, so the account is in local mode: make sure that path is perfect, and code the cloud path
exactly to the API. Report briefly what you built and anything you needed from shared files.
