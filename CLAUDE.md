# Working on FiredBunny

Live site: https://firedbunny.com (Cloudflare Worker `firedbunny`, deployed from `main`; also answers on
https://firedbunny.dosfirm.workers.dev, which is marked noindex).

## Every change ships: commit, push, confirm the deploy

The owner wants every change committed to GitHub and deployed to Cloudflare, without being asked each time.

1. Make the change, run `python3 tools/build.py` (it pre-builds every page and runs the search checks; needs
   Playwright), and run whatever tests cover it (`tools/sitetest.py`, `tools/harness.py`, or a quick Playwright check
   of the page you touched).
2. Commit with a plain message describing the change, ending with the attribution lines your session gives you.
3. Push to `main` (`git push origin main`). The push itself is the deploy: `.github/workflows/deploy.yml` builds the
   site and deploys it to the Cloudflare Worker `firedbunny`, then checks the live site.
4. Confirm the deploy instead of assuming it. The workflow's result shows up as a check run named
   "Deploy to Cloudflare" on the commit:

   ```bash
   sha=$(git rev-parse HEAD)
   gh api repos/wissile/firedbunny/commits/$sha/check-runs \
     --jq '.check_runs[] | {name, status, conclusion, id}'
   # when it has finished, its notes carry the live address, whether the live page matches this build,
   # and the /api/health verdict:
   gh api repos/wissile/firedbunny/check-runs/<id>/annotations --jq '.[] | .title + ": " + .message'
   ```

   A deploy takes a couple of minutes. If it fails, read the annotations, fix the cause, push again. Tell the owner
   once the change is live (or why it is not).
5. If the site changed, also republish the claude.ai copy: publish `build/fragment.html` to
   https://claude.ai/artifact/7uVtjsfYxpJJVkR1dm4jBE (it always shows sample data and the device voice).

Unfinished work goes on a branch, because only `main` deploys. Merge it into `main` when it is ready.

If lesson text changes, re-record its narration (`node tools/narration/make-scripts.js`, then
`tools/narration/render.py`, see README) and commit the new audio with the change. Run `make-scripts.js` without `--ids`: with
`--ids` it writes only those lessons to `scripts.json`, and `render.py` then drops every other lesson from the manifest
and from `src/mod-z-narration-data.js` (limit the recording with `render.py --ids` instead).

## Search: addresses, metadata and pre-built pages

Every page has a permanent address (`/lessons/wheel-strategy/`) and a pre-built HTML file; details in
`docs/search-optimization/TECHNICAL_IMPLEMENTATION.md`.

- **Never change an existing address** in `src/routes.js` (FROZEN), even when a title changes. A new lesson, course,
  tool, track or note gets an automatic address from its title; the build lists it ("add them to FROZEN") so you can
  freeze it in the same change.
- Titles, descriptions, canonicals and JSON-LD come from `src/seo.js` (from the content data). Keep `TITLES` entries
  plain descriptions of the page, never keyword lists. Structured data only for what the page visibly shows.
  A lesson, tool or note with a short curriculum-style title gets a `TITLES` entry saying what the page covers; the
  help chat's search reads those titles too, so run `tools/chattest.py` after changing them. A calculator's visible
  heading is the plain name from its `TITLES` entry (`SML.seo.heading`: the part before the colon), and section numbers
  ("01") are decoration, never part of a heading's text. No Course markup: Google limits it to courses with instructors
  and a roster of students.
- `/lessons/` lists every lesson and `/courses/` every course (`/tracks/` is the same page and names `/courses/` as
  its main copy). A new lesson or course shows up there on its own.
- Every indexable page has its own preview image at `/og/<its address>.jpg`, drawn by the build from
  `SML.seo.card()` (the template is `CARD_HTML` in `tools/prerender.py`); the search check fails if one is missing.
  Lessons show up to four "Related lessons" (shared glossary terms, links and calculators; `relatedOf` in
  `src/pages.js`).
- After each deploy the workflow announces new and changed pages to IndexNow (Bing). The key is the public file
  `public/<32 hex>.txt`; it is not a secret. Don't rename or delete it.
- `tools/seo-lastmod.json` also keeps `p`, the day a page first shipped (lessons: `datePublished`). It is set once,
  the first time the build sees a page; never edit it by hand.
- **Build before committing content changes**: the build updates `tools/seo-lastmod.json` (the sitemap's lastmod per
  page); commit it with the change. Live, date-driven parts of a page get `data-volatile` so they do not count as edits.
- The build runs `tools/seo_check.py`; in CI an error stops the deploy. Fix what it reports.
- Templates still write `href="#token"`; on the website the router turns those into real paths. Use real `<a href>`
  links between pages (not click handlers on divs), so crawlers can follow them.
- Per-visitor pages (dashboard, profile, settings, sign-in, results, offline) are noindex: add new ones to `PRIVATE`.

## Content accuracy (see docs/search-optimization/CONTENT_CHANGELOG.md)

- Calculator pages show "How this calculator works" from `src/content-toolguide.js`. It describes what each widget's
  code does: if you change a widget's math or defaults, update its guide (and its worked example) in the same commit.
- A lesson's `sources` and `checked` (month) are shown, not narrated. Add a source only after opening it and checking
  the claim it supports; set `checked` only when you actually re-checked the lesson's figures.
- A lesson can go deeper without new audio: `brief` (a short answer under the summary), `deep` (sections after the
  takeaways, `{ h, short, html }`) and `faq` (`{ q, a }`, shown as "Common questions", plain text, no FAQ markup) are
  shown but not narrated. Facts in them need opened sources like the rest of the lesson; rules of thumb are labelled
  as rules of thumb. The wheel strategy lesson is the model.
- The editorial standards page (`/editorial-standards/`, in `src/mod-y-about.js`) must stay true: pen name, AI-assisted
  drafting, no ads or affiliate links, computer voice. Change it in the same commit if any of that changes.

## Embeddable calculators

- Any calculator page opened as `/tools/<name>/?embed` draws only the calculator, its title and a link back
  (`embedTool` in `src/pages.js`; `SML.embed` is set in `src/routes.js`). It loads no analytics, no chat and no consent
  banner, and posts its height to the parent page (`{type: 'firedbunny-embed', height}`).
- The worker (`worker/index.js`, `/tools/*` runs it first) removes `X-Frame-Options` and adds
  `Content-Security-Policy: frame-ancestors *` and `X-Robots-Tag: noindex` only for those embed addresses; every other
  page stays SAMEORIGIN. The service worker never answers an embed address from its cache. The deploy checks the
  headers on `/tools/mortgage/?embed`.
- Tool pages show the iframe snippet under "Embed this calculator". If the privacy page's analytics wording changes,
  keep the sentence that embeds load no analytics true.

## Privacy, terms and contact

- `/privacy/`, `/terms/` and `/contact/` are `src/mod-y-legal.js`, plain-language pages written without a lawyer (the
  owner should have them reviewed). The privacy page must stay true: if data handling changes (a new service, table
  or analytics setting, the Portfolio page or tips going live), change it, the Settings privacy list
  (`src/mod-y-account.js`) and the help chat's privacy notes (`src/chat-data.js`) in the same commit, and move its
  `UPDATED` date. Contact goes through the About page's feedback form; never put an email address on the site.
- Analytics never sets the advertising consent signals (`ad_storage`, `ad_user_data`, `ad_personalization` are always
  `denied`): FiredBunny shows no ads.

## Accounts (Supabase, see supabase/README.md)

- Accounts are on only when `src/cloud-config.js` has the project URL and publishable key. Both are public; never put
  the secret / service_role key or the database password in the repo. With `live: false` only browsers that opened
  `/signin/?preview=accounts` (or an emailed link) see accounts; set `live: true` only after custom SMTP is set up.
- Signed in on the website, the profile and assessments (`src/account.js`) and every `SML.store` item (`src/cloud.js`)
  live in `public.user_data`. Analytics consent stays per device (`DEVICE` in `src/cloud.js`). Guests are unchanged.
- Database changes: edit `supabase/schema.sql`, have the owner run it in the SQL Editor, and commit it in the same change.
- Wording must stay true: account data is private from other visitors, not from the site owner (who runs the database).
- Test account changes with `python3 tools/build.py --no-prerender && python3 tools/accounts/e2e.py` (stand-in Supabase).

## Help chat (Ask Bunny) and feedback

- The floating chat in the bottom-right corner is `src/chat.js` (engine and panel) and `src/chat-data.js` (what it
  understands and says: intents with patterns, synonyms and abbreviations, key pages, tool groups, calendar words,
  prompts). Extend the data file, not the engine. No AI: answers come from the site's own content (glossary, lessons,
  tools, courses, notes, calendar) or the fixed replies in `chat-data.js`, which restate the About, Editorial standards,
  Settings and Support pages. If one of those pages changes, change the matching reply in the same commit.
- Only the launcher is made at start; the panel, its styles and the search index are built on first open. It is added
  at runtime with `style[data-fb]`, so the pre-built pages and `tools/seo-lastmod.json` never change because of it.
- The conversation lives in the tab's sessionStorage (`fb-chat`) only. Analytics get coarse events (`help_chat_open`,
  `help_chat_reply`, `feedback_send`), never what was typed.
- Feedback from the chat and the About page form goes through `src/feedback.js`: on the website a row in
  `public.feedback` (insert-only, see supabase/README.md), on claude.ai the page's storage (`feedback/<user id>`, shown
  in the owner's inbox on the About page) or its comment box, elsewhere a copy. A failed send keeps the note.
- Test with `python3 tools/build.py --no-prerender && python3 tools/chattest.py` (stand-in Supabase, including the
  "table missing" case). To see why a question matched what it did, run `SML.chat.match('covered call')` or
  `SML.chat.reply('what is vwap')` in the browser console.

## Portfolio (SnapTrade, see docs/portfolio/README.md)

- `/portfolio/` (`src/mod-y-portfolio.js`, private) shows a signed-in visitor's brokerage accounts, connected read-only
  through SnapTrade; everyone else, and the claude.ai copy, sees a labelled sample portfolio. The Connect button shows
  only with `SML.BROKERAGE.live` (`src/brokerage-config.js`) or in a browser that opened `/portfolio/?preview=brokerage`:
  every connected user costs money on SnapTrade's paid plan, so the owner switches it on.
- The server side is `worker/brokerage.js` (POST `/api/brokerage/status|connect|portfolio|disconnect|forget`). It
  verifies the person's Supabase token itself (ES256, JWKS) and uses their own token for `public.brokerage_links`
  (row-level security), so there is no Supabase secret anywhere. It needs the Worker secrets `SNAPTRADE_CLIENT_ID`,
  `SNAPTRADE_CONSUMER_KEY` and `BROKERAGE_KEY`, set by the owner in Cloudflare; never put them in the repo, a request
  or a message. `/api/health` says whether they are set, never what they are.
- Keep it read-only (`connectionType: "read"`, no trading endpoints) and pull-based (analysis only on that page, when it
  is opened; no emails or alerts), as SnapTrade's compliance policy requires. Holdings stay on the device
  (`fb-portfolio:<user id>`, removed on sign-out), never in Supabase. Observations link to a lesson and never say buy or
  sell. If the page's data handling changes, update the Settings privacy item and the help chat's `notes` in
  `src/chat-data.js` in the same commit.
- Test with `python3 tools/build.py --no-prerender && python3 tools/portfoliotest.py --wrangler <path>` (stand-in
  SnapTrade and Supabase, `wrangler dev` on port 8790).

## Support link (Stripe, see docs/support/README.md)

- `/support/` (`src/mod-y-support.js`) says the site is free, what it costs to run, and that chipping in is optional,
  unlocks nothing and is not tax-deductible. Its buttons open the owner's Stripe Payment Links from
  `src/support-config.js` (public links only: never a Stripe key, Stripe.js, server code or webhooks). Links are checked
  in the browser (https; `buy.stripe.com` for payments, `billing.stripe.com` for the customer portal) and anything else
  is ignored with a console warning. Never commit a test-mode or made-up link as the live config.
- While no payment link is set, the footer link, the About line and the buttons stay hidden; `/support/` still
  explains. Support shows only there, in the footer, in one About line and in the chat when asked: never in lessons,
  tools or the Portfolio page, and never as a pop-up. Words: "support", "chip in", "tip", never "donate" or "donation"
  (FiredBunny is not a charity). In the claude.ai copy the page points to the website instead.
- Link-dependent parts carry `data-volatile` and the footer is not in the lastmod hash, so setting a link changes no
  lastmod. If what the page promises changes, change the chat's `support` and `free` replies (`src/chat-data.js`) and
  the Editorial standards in the same commit. `/support/thanks/` (private) is the after-payment redirect: it says
  thank you and claims nothing.
- Test with `python3 tools/build.py --no-prerender && python3 tools/supporttest.py` (test link injected in flight,
  stand-in Stripe page, no network).

## Plans and waitlist (see supabase/README.md)

- `/plans/` (`src/mod-y-plans.js`, indexable, linked from the footer) says everything on FiredBunny today is free and
  stays free, and that an optional paid plan for a few extras that cost money per person to run ("FiredBunny Plus", a
  working name) is only being considered. No prices and no dates on the site. Extras are framed as education that
  explains a person's own numbers with the lessons: never what to buy or sell, no managing money, no promised returns.
  Charging for anything portfolio-specific needs the owner's securities lawyer first; don't build it without that.
- The waitlist is `public.waitlist` (`supabase/schema.sql`): signed in, one click stores the account id (no email);
  guests give an email, used only to say if the plan opens. Both may tick extras from a fixed list (`EXTRAS` in the
  module and the `waitlist_extras_known` check: change both together) and add a 280-character note. Visitors can't read
  the list; joining twice looks the same as joining once; a signed-in person sees and leaves their own sign-up there;
  `delete_my_account()` removes it; guests leave by sending a note. The claude.ai copy collects nothing and points to
  firedbunny.com/plans.
- Keep the Plans page, the Support page ("chipping in unlocks nothing", never a way into the plan), the chat's `plans`,
  `waitlist-leave`, `free` and `support` replies (`src/chat-data.js`), the Settings privacy line and the About and
  Editorial standards pages saying the same thing; change them in one commit. "Premium" in the chat counts only next
  to plan words, so options, insurance and tax questions about premiums still reach their lessons.
- Analytics: `waitlist_join` (the ticked extras' ids and `account` or `email`), never the email or the note.
- Test with `python3 tools/build.py --no-prerender && python3 tools/planstest.py` (stand-in Supabase, including
  "table missing").

## Things to keep in mind

- The deploy needs two GitHub repository secrets, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, which only the
  owner can add. A deploy that fails at "Check the Cloudflare secrets" means they are missing.
- Live earnings data needs `SEC_UA` set in the Cloudflare dashboard by the owner. Never put anyone's personal email
  in the repo or in a request.
- Use only one deploy route: this workflow. If Cloudflare's own Git integration (Workers Builds) is also connected,
  every push deploys twice.
- `public/audio/lessons/` holds about 280 MB of narration; Cloudflare uploads only files that changed.
