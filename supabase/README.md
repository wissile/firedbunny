# FiredBunny accounts (Supabase)

People can create a free FiredBunny account on the website. Everything they save follows them to every device where
they sign in: profile, goals, net worth, household, lesson progress, assessments, trade journal, FIRE plan,
spreadsheet rows and preferences. Guests keep working exactly as before, with everything saved in their browser.

Accounts are off until `src/cloud-config.js` has the project's URL and publishable key.

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

1. **Create the project.** Name it `firedbunny`, choose Central EU (Frankfurt), and keep the database password in your
   password manager.
2. **Run the schema.** Go to SQL Editor → New query, paste all of `supabase/schema.sql`, and click Run. Running it again
   later is safe.
3. **URL configuration.** Go to Authentication → URL Configuration.
   - Site URL: `https://firedbunny.com`
   - Redirect URLs: add `https://firedbunny.com/**`
4. **Email sign-in.** Go to Authentication → Sign In / Providers → Email.
   - Keep **Email** enabled and **Confirm email** on.
   - Set the minimum password length to **8**.
5. **Links that work on any device (recommended).** Go to Authentication → Emails → Templates. In **Confirm signup**,
   replace the link with:
   ```
   <a href="{{ .SiteURL }}/signin/?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```
   In **Reset password**, replace it with:
   ```
   <a href="{{ .SiteURL }}/signin/?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a>
   ```
   The default links only work in the browser where the person signed up or asked for the reset. These work anywhere,
   for example when someone signs up on a laptop and opens the email on their phone. The site handles both kinds.
6. **Email sending (before launch).** Supabase's built-in email is for testing only: it sends just a few emails an hour.
   - Sign up with an email provider (Resend, Postmark or Amazon SES, for example).
   - Enter its SMTP details under Authentication → Emails → SMTP Settings.
   - Set the sender to something like `FiredBunny <hello@firedbunny.com>`.
   - Your domain will need the SPF/DKIM DNS records the provider gives you, which you add in Cloudflare DNS.
7. **The keys for the website.** Go to Project Settings → API Keys. Put the **Project URL** and the **publishable key**
   (`sb_publishable_...`, or "anon public" on older projects) into `src/cloud-config.js`. Then build, test and deploy
   as usual.
8. **Before real users arrive,** switch to the **Pro** plan for daily backups and to stop the project pausing after a
   week of inactivity.

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
