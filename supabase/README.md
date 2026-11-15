# FiredBunny accounts (Supabase)

People can create a free FiredBunny account on the website. Everything they save follows them to every device where
they sign in: profile, goals, net worth, household, lesson progress, assessments, trade journal, FIRE plan,
spreadsheet rows and preferences. Guests keep working exactly as before, with everything saved in their browser.

Accounts are off until `src/cloud-config.js` has the project's URL and publishable key, and shown to every visitor only
once it also says `live: true`. Before that they appear only in a browser that opened
`https://firedbunny.com/signin/?preview=accounts` (or an emailed sign-in link); `?preview=off` ends the preview.

## How it fits together

| Piece | What it does |
|---|---|
| `supabase/schema.sql` | The database side: table `user_data` (one row per saved item per person), row-level security (each person reads and writes only their own rows), limits (300 items, 512 KB each), and `delete_my_account()`. |
| `src/cloud-config.js` | The project URL and publishable key. Both are public by design. **Never put the secret / `service_role` key here.** |
| `src/cloud.js` | Sign-in (email + password, confirmation and reset links), syncing, the offline copy, and merging lesson progress across devices. Loads the Supabase library (`public/vendor/supabase-js-2.119.0.js`) only for signed-in visitors and on the sign-in page. |
| `src/account.js` | When someone is signed in on the website, the profile and assessments go to the account (provider `supabase`), using the same code paths as the claude.ai copy. |
| `src/core.js` `SML.store` | Every other saved item follows the account while signed in, except analytics consent, which stays with the device. |
| `src/mod-y-account.js` | The sign-in page (create account, sign in, forgot password, new password), the signed-in view, and Settings (sign out, delete account). |
| `tools/accounts/e2e.py` | End-to-end test against a stand-in Supabase. Run it with `python3 tools/build.py --no-prerender && python3 tools/accounts/e2e.py`. |

**Sync rule.** The newest change to an item wins. A change made on this device that hasn't uploaded yet is never
overwritten by an older server copy. Lesson progress is combined from every device, so a lesson finished anywhere
stays finished. Each device keeps a copy (in localStorage, `fb-cloud:<user id>`), so pages open instantly and work
offline. Signing out deletes that copy.

## One-time setup in the Supabase dashboard

1. **Create the project.** Name it `firedbunny`, region Americas (the owner and most readers are in the US), leave
   GitHub empty, keep **Enable Data API** on and **Automatically expose new tables** off (the schema grants access
   itself), and keep the database password in your password manager.
2. **Run the schema.** Go to SQL Editor → New query, paste all of `supabase/schema.sql`, and click Run. Running it again
   later is safe.
3. **URL configuration.** Go to Authentication → URL Configuration.
   - Site URL: `https://firedbunny.com`
   - Redirect URLs: add `https://firedbunny.com/**`
4. **Email sign-in.** Go to Authentication → Sign In / Providers → Email.
   - Keep **Email** enabled and **Confirm email** on.
   - Set the minimum password length to **8**.
5. **Email templates (FiredBunny look, links that work on any device).** Go to Authentication → Email → Templates.
   - **Confirm signup:** subject `Confirm your FiredBunny account`; body: all of `supabase/email/confirm-signup.html`.
   - **Reset password:** subject `Reset your FiredBunny password`; body: all of `supabase/email/reset-password.html`.

   Their links use `token_hash` (`{{ .SiteURL }}/signin/?token_hash={{ .TokenHash }}&type=email` or `&type=recovery`).
   The default links only work in the browser where the person signed up or asked for the reset; these work anywhere,
   for example when someone signs up on a laptop and opens the email on their phone. The site handles both kinds.
   The templates show the logo from `https://firedbunny.com/email/fb-mark-144.png` and load the site's fonts from
   `/email/fonts/` where the email app allows it (`/email/*` is served with `Access-Control-Allow-Origin: *`). To change the wording,
   edit `tools/accounts/make_emails.py`, run it, commit the regenerated files, and paste them into Supabase again.
6. **Email sending (before launch).** Supabase's built-in email is for testing only: it sends just a few emails an hour.
   - Sign up with an email provider (Resend, Postmark or Amazon SES, for example).
   - Enter its SMTP details under Authentication → Emails → SMTP Settings.
   - Set the sender to something like `FiredBunny <hello@firedbunny.com>`.
   - Your domain will need the SPF/DKIM DNS records the provider gives you, which you add in Cloudflare DNS.
7. **The keys for the website.** Go to Project Settings → API Keys. Put the **Project URL** and the **publishable key**
   (`sb_publishable_...`, or "anon public" on older projects) into `src/cloud-config.js`, leaving `live: false`. Then
   build, test and deploy as usual, and try it at `/signin/?preview=accounts`.
8. **Going live:** once custom SMTP works (step 6; the built-in email only reaches the project's own team members), set
   `live: true` in `src/cloud-config.js`, build, test and deploy.
9. **Before real users arrive,** switch to the **Pro** plan for daily backups and to stop the project pausing after a
   week of inactivity.

Connected project (November 2026): `cwvgvzsrmcvpiqsbelyb`, region Americas. Checked from a browser with the publishable
key: email sign-up on, confirm email on, anonymous sign-ins off; `user_data` and `delete_my_account()` exist and refuse
visitors who are not signed in.

## Things to know

- **The owner can see account data.** In the Table Editor you can see `user_data`: people's profiles, goals and money
  figures. The site says "other visitors can't see it", and never that the owner can't. If you add anyone to the
  Supabase project, they can see it too.
- **Deleting an account** (Settings → type DELETE → "Delete my account too") removes the login, the email address and
  every saved row. "Delete everything" alone empties the account but keeps the login.
- **Changing the database:** edit `supabase/schema.sql`, run it in the SQL Editor, and commit it in the same change.
- **A new saved item** (a new `SML.store` key in some page) syncs automatically. Add it to `DEVICE` in `src/cloud.js`
  only if it should stay with one browser.
- **Updating the library:** download the new `dist/umd/supabase.js` from npm into `public/vendor/` under a new
  versioned name, update `LIB` in `src/cloud.js`, and run the end-to-end test.
- **Not built yet:** Google and Apple sign-in (each needs a client ID set up in Google Cloud or the Apple Developer
  account first), subscriptions (planned with RevenueCat), and a full privacy policy page. The sign-in page and
  Settings say plainly what is stored, but a proper privacy policy is needed before launch in the EU.
