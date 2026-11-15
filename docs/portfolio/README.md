# Portfolio page: live, read-only brokerage connections (SnapTrade)

`https://firedbunny.com/portfolio/` shows a signed-in visitor's own brokerage accounts the way the lessons teach them:
total value, cash, day change, allocation, concentration, gains and losses by tax term, tax-loss candidates with a
wash-sale check, open covered calls and cash-secured puts, wheel progress, income, and how it all compares with their
FIRE goal. Every observation links to the lesson or tool behind it, and none says to buy or sell anything.

Everyone else sees a made-up sample portfolio, clearly labelled: visitors who are not signed in, everyone before you
switch the page on, signed-in visitors while the server has no SnapTrade keys, and always the claude.ai copy.

## How it fits together

| Piece | What it does |
|---|---|
| `src/mod-y-portfolio.js` | The page: every state (signed out, coming soon, not set up, not connected, connecting, connected, errors), the numbers (`SML.portfolio.analyze`), the observations, the charts and the sample portfolio. |
| `src/brokerage-config.js` | `SML.BROKERAGE = { live: false }`: the switch that shows the Connect button to everyone. |
| `worker/brokerage.js` | The server side, inside the existing Worker: checks the person's sign-in, talks to SnapTrade (signed requests), seals each person's SnapTrade secret, and passes their data to the page. |
| `supabase/schema.sql` | Table `brokerage_links`: one row per connected person with their SnapTrade user id and their SnapTrade secret, encrypted. |
| `tools/portfoliotest.py` | End-to-end test against stand-in SnapTrade and Supabase servers (no network). |

### What is stored where

- **Holdings, balances and transactions** are fetched from SnapTrade when the person opens the page (or presses
  Refresh), passed through the Worker to their browser, and kept **on that device only** (`localStorage`,
  `fb-portfolio:<user id>`), so the page opens fast and works offline. Signing out deletes that copy. Nothing about
  holdings is written to Supabase or kept by the Worker.
- **Supabase** (`brokerage_links`) holds only the person's SnapTrade user id (`fb-<their account id>`) and their
  SnapTrade user secret encrypted by the Worker (AES-256-GCM, key derived from `BROKERAGE_KEY` and bound to that user
  id). You can see in the Table Editor that a row exists; you cannot read the secret or anyone's holdings.
- **The Worker** keeps nothing between requests except a short-lived copy of Supabase's public signing keys and
  per-person request counters.

### Security in a few lines

- The page sends the person's Supabase access token. The Worker verifies it itself (ES256 against the project's JWKS,
  issuer, audience `authenticated`, expiry, role) and uses its `sub` as the person. There is no Supabase secret or
  service_role key anywhere: the Worker reads and writes `brokerage_links` with the person's own token, so row-level
  security applies to it exactly as to the browser.
- SnapTrade's consumer key signs every request and never leaves the Worker. Errors from SnapTrade are reduced to short
  codes; their bodies are never passed on, and nothing logs a SnapTrade URL (the user secret travels in its query).
- Connections are requested read-only (`connectionType: "read"`), and the Worker has no trading endpoints at all.
- Requests: POST only, JSON, `Cache-Control: no-store`, CORS only for the site's own addresses, bodies up to 4 KB,
  timeouts on every upstream call, and per-person limits (for example 4 portfolio refreshes per 2 minutes).

## One-time setup

### 1. SnapTrade

1. Create an account at <https://dashboard.snaptrade.com/signup>. The free plan (Build) allows a handful of
   connections: enough for you to test with your own accounts.
2. In the dashboard, copy your **Client ID** and **Consumer Key** (API keys). Treat the consumer key like a password:
   put it only in Cloudflare (step 2), never in the repo, an email or a chat.
3. Under **Add-ons**, switch on:
   - **Account value history** (free, experimental): the "Value over time" chart and the day change. Without it the
     page shows "since your last visit" instead.
   - **Tax lots** (check the price there): splits gains into short- and long-term and powers the tax-loss table's
     term columns. Without it, gains are shown as one number.
4. Submit the **Production Access Application**. Robinhood is read-only and listed by SnapTrade as available as soon
   as the application is approved. Before that, test with the brokerages your key already allows ("Another brokerage"
   on the page opens SnapTrade's full list).
5. When you are ready for real users, move to the paid plan (Launch: about $100 a month plus roughly $1–2 per
   connected user per month; check <https://snaptrade.com/pricing> for the current terms).

### 2. The three Worker secrets (Cloudflare)

Cloudflare dashboard → **Workers & Pages** → **firedbunny** → **Settings** → **Variables and Secrets** → **Add**, type
**Secret**, one at a time:

| Name | Value |
|---|---|
| `SNAPTRADE_CLIENT_ID` | your SnapTrade client id |
| `SNAPTRADE_CONSUMER_KEY` | your SnapTrade consumer key |
| `BROKERAGE_KEY` | a long random key you make yourself (below) |

Make `BROKERAGE_KEY` on your own computer and paste it straight into Cloudflare:

```bash
openssl rand -base64 48
```

Keep a copy in your password manager. If it is ever changed or lost, nobody's stored secret can be opened any more:
the Worker then deletes each person's old SnapTrade user and registers a new one when they press Connect, so they
simply connect again. (Instead of the dashboard you can run `npx wrangler secret put BROKERAGE_KEY`, which asks for
the value without putting it in your shell history.) Secrets survive deploys.

Check: open <https://firedbunny.com/api/health>. Its `brokerage` section says whether each secret is set (never what it
is) and `"ready": true` once all three are there.

### 3. The database

Supabase → SQL Editor → New query → paste all of `supabase/schema.sql` → Run (safe to run again). It adds
`brokerage_links` and makes `delete_my_account()` remove that row too. Until then the page says brokerage connections
are not set up in the database.

## Trying it before launch

1. Sign in on firedbunny.com, then open <https://firedbunny.com/portfolio/?preview=brokerage>. That browser now shows
   the Connect button (other visitors still see "coming soon" and the sample). `?preview=off` ends the preview.
2. Press **Connect Robinhood** (or **Another brokerage**), sign in on SnapTrade's page, and you come back to
   `/portfolio/` with your accounts.
3. Try **Refresh**, **Disconnect**, and Settings → type DELETE → **Delete my account too** on a test account: it removes
   the SnapTrade user first.

## Going live

1. In `src/brokerage-config.js` set `live: true`.
2. Build, test (`python3 tools/build.py && python3 tools/portfoliotest.py`), commit and push as usual.
3. Every connected person now costs money on the paid plan. **Disconnect** (the last connection) and account deletion
   delete the person's SnapTrade user, so they stop counting.

## What to tell SnapTrade in the compliance review

(Their policy: <https://snaptrade.com/compliance-policy>.)

- **Read-only.** Connections are requested with `connectionType: "read"`; the app has no trading features and calls no
  trading endpoints.
- **Pull-based analysis.** Analysis appears only on the Portfolio page, computed when the person opens it or presses
  Refresh. No emails, push notifications, alerts or background analysis; nothing about holdings shows anywhere else on
  the site.
- **How data is used.** Shown to the person who connected it, in their browser; cached only on their device; never
  sold, shared or used for advertising (the site has no ads). The server stores only the person's encrypted SnapTrade
  user secret. The page explains this before connecting and links to SnapTrade's privacy and security pages.
- **The user owns their data.** Disconnect removes the access at SnapTrade (and deletes the SnapTrade user when it was
  the last connection); deleting the FiredBunny account deletes the SnapTrade user first.
- **No endorsement.** The page says brokerages don't endorse FiredBunny and uses broker names only to describe the
  connection. Education, not financial advice, is stated on the page.
- Offer them a test login if they ask for access.

## Things to know

- **Leftover SnapTrade users.** If SnapTrade can't be reached while someone deletes their FiredBunny account, the account
  is still deleted and the page tells them how to revoke access at their broker, but their SnapTrade user stays behind
  (and may keep costing money). Once a month, compare SnapTrade's user list (dashboard, or the `listUsers` call) with
  Supabase → Authentication → Users: delete any `fb-<id>` whose id has no account.
- **Freshness.** On SnapTrade's Daily plans, positions and balances refresh once a day; transactions arrive a day late
  on every plan. The page shows when its data was fetched and labels SnapTrade's value history as an estimate.
- **What each broker reports varies** (cost basis, tax lots, value history). The page shows "—" or a plain note when
  something is missing instead of guessing.
- **Sectors** are not shown: SnapTrade doesn't provide them and a hand-made table would be wrong too often.
- **Rate limits** are counted per Worker instance (a brake, not an exact quota). SnapTrade has its own limits too
  (250 requests a minute per client id by default); the page explains a 429 and keeps showing the device copy.
- **SnapTrade API notes (November 2026).** The Worker uses the root API paths on `https://api.snaptrade.com` (the
  `/api/v1` prefix is legacy), `/accounts/all`, `/accounts/{id}/balances`, `/accounts/{id}/positions/all` (stocks,
  funds and options together), `/accounts/{id}/balanceHistory`, `/accounts/{id}/activities`, `/authorizations`,
  `DELETE /connection/{id}`, `/snapTrade/registerUser`, `/snapTrade/deleteUser` and `/snapTrade/login`. The older
  holdings endpoint answers 410 for customers who signed up after May 11, 2026, so it is not used.
- **The portal link contains your client id** (SnapTrade builds it that way); the client id is not the secret part,
  the consumer key is.

## Testing

```bash
python3 tools/build.py --no-prerender && python3 tools/portfoliotest.py --wrangler path/to/wrangler
```

It runs the Worker in `wrangler dev` against stand-in SnapTrade and Supabase servers (fake keys), checks request
signatures, tokens, row-level security, secrets, limits, errors, disconnect and account deletion, and drives every page
state in a browser at desktop and phone sizes. Screenshots go to `shots/portfolio/` unless `--shots` says otherwise.
`node tools/portfolio/unit.mjs` runs only the signing, sealing and token checks.
