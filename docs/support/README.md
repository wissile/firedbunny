# Support FiredBunny: Stripe Payment Links

`https://firedbunny.com/support/` explains, in plain words, that every lesson and tool is free and stays free, what
running the site costs, and that chipping in is optional, unlocks nothing and is not tax-deductible. Once you paste a
Stripe Payment Link into `src/support-config.js`, three quiet things appear:

- buttons on `/support/` that open **Stripe's own checkout page** in a new tab ("Chip in once", and "Chip in monthly"
  if you set it up);
- a **Support FiredBunny** link in the footer (FiredBunny column);
- one line in the story section of the **About** page.

The help chat answers "how can I support you?", "is there a tip jar?", "who pays for this site?" and similar
questions, and its "is it free?" reply adds that chipping in is optional and unlocks nothing. Nothing appears inside
lessons, tools or the Portfolio page, and there are no pop-ups or reminders.

While both payment links are empty (as shipped), all of that stays hidden. `/support/` is still there (it is linked
from the Editorial standards page as "How FiredBunny is paid for") and says there is no way to chip in yet.

There is no Stripe key, no Stripe.js, no server code and no webhook: the site only links to Stripe. Card details go
to Stripe and never touch FiredBunny.

## How it fits together

| Piece | What it does |
|---|---|
| `src/support-config.js` | `SML.SUPPORT = { links: { once: '', monthly: '', manage: '' } }`: the three public links. |
| `src/mod-y-support.js` | Checks the links, draws `/support/` and `/support/thanks/`, the footer link, and the `support_click` event. |
| `src/mod-y-about.js` | The About line, and the "How FiredBunny is paid for" link on the Editorial standards page. |
| `src/chat-data.js` | The chat's `support` intent and the `free` reply. |
| `tools/supporttest.py` | End-to-end test with a test link injected in flight and a stand-in Stripe page (no network). |

The links are checked in the browser: they must be `https://`, payment links must be on `buy.stripe.com` and the
customer-portal link on `billing.stripe.com`. Anything else (another site, a look-alike address, `http://`, Stripe's
`donate.stripe.com` "Donate" links, a custom domain) is ignored and a warning explains why in the browser console
(right-click > Inspect > Console). A Stripe test-mode link (`/test_...`) works but also warns, because real cards are
refused there.

## 1. Create the links in Stripe (dashboard.stripe.com)

### One-time, any amount (the main link)

Stripe's docs recommend "Customers choose what to pay" for tips and pay-what-you-want. It works for one-time
payments only.

1. **Payment Links > + New**, choose **Customers choose what to pay**.
2. **Title:** `Support FiredBunny`. **Description:** something like
   `A tip for FiredBunny's free lessons and tools. Optional, unlocks nothing, and not tax-deductible: FiredBunny is
   not a charity.` Add the bunny logo as the image if you like.
3. **Suggested amount** (for example 5 USD) and a **minimum** of a few dollars: Stripe keeps 30¢ of every payment, so a
   1 USD payment loses a third to fees. Keep the default maximum or lower it.
4. **Button / call to action:** keep the standard **Pay**. Do not pick **Donate**: it labels the payment a donation
   and gives a `donate.stripe.com` address, which the site refuses on purpose (FiredBunny is not a charity).
5. **Options:** leave address, phone, name and custom fields off, and leave "save payment details" off. Collect only
   what Stripe needs for the payment.
6. **After the payment:** choose **Don't show confirmation page** and redirect to
   `https://firedbunny.com/support/thanks/`. That page only says thank you: anyone can open it, so it never claims a
   payment happened. (Or keep Stripe's own confirmation page and write a short thank-you message there.)
7. **Create link** and copy it: `https://buy.stripe.com/...`.

### Monthly (optional)

Stripe's "customers choose" pricing cannot repeat, so a monthly link has a fixed price.

1. **Product catalog > + Add product:** name `FiredBunny monthly support`, recurring price, **Monthly**, for example
   3 USD or 5 USD. (If you want people to pick their own monthly amount, use a 1 USD monthly price and tick **Let
   customers adjust quantity** on the payment link; Stripe then shows it as a quantity.)
2. **Payment Links > + New > Products or subscriptions**, select that product, same options and after-payment
   redirect as above, **Create link**, copy `https://buy.stripe.com/...`.
3. **Customer portal (required for monthly):** Settings > Billing > **Customer portal**, click **Activate link** and
   allow customers to cancel subscriptions (and update their card). Copy the login link,
   `https://billing.stripe.com/p/login/...`. People log in with their email and Stripe also adds it to their emails.
   The monthly button only shows when this link is set too, so anyone who starts paying monthly can stop on their own.

### Account settings worth a minute

- **Statement descriptor** (Settings > Business details): what appears on bank statements, 5 to 22 Latin characters
  that reflect your business name, for example `FIREDBUNNY.COM`, with the shortened descriptor `FIREDBUNNY`. A
  recognisable descriptor prevents "what is this charge?" disputes.
- **Public details** (Settings > Business > Business details > Public details): business name FiredBunny, website
  `https://firedbunny.com`, and the contact details Stripe requires on receipts: legal business name, support address,
  support email and a privacy policy URL (the site's Privacy & settings page, `https://firedbunny.com/settings/`, is the
  closest it has). Mind the pen name: whatever legal name and address you give Stripe can appear on receipts and
  checkout pages. None of these details go in this repository.
- **Customer emails** (Settings > Business > Customer emails): under Payments, turn on **Successful payments**, so
  people get Stripe's receipt by email (live mode only; test payments send none).
- **Branding** (optional): the site's colours are `#0b0f19` (background) and `#e8ad4f` (accent).

### What to avoid

- The words "donate", "donation", "charity", "nonprofit" or "tax-deductible" anywhere (Stripe page, product name,
  receipts). FiredBunny is not a registered charity: gifts to it are not deductible, and describing it as a charity
  would mislead people. "Support", "chip in" and "tip" are accurate.
- Rewards for paying (badges, extra lessons, early access): the page promises that paying unlocks nothing, and it
  keeps these tips for content people have already used.
- Pop-ups, countdowns, "X people chipped in" counts, or support buttons inside lessons and tools.
- Stripe's embeddable Buy Button: it needs Stripe.js, which this setup avoids on purpose. A plain link does the same.
- A custom payment domain (`pay.firedbunny.com`): the site accepts only Stripe's own `buy.stripe.com`. Changing that is
  one line (`HOSTS` in `src/mod-y-support.js`), but keep the Stripe address unless there is a reason.

Before going live, read Stripe's **Requirements for accepting tips or donations** (linked from Stripe's Payment Links
docs and its restricted-businesses FAQ) and describe the site to Stripe as what it is: a free education website that
accepts optional tips from readers. If Stripe asks for more, answer that honestly.

**Fees:** Stripe's standard US price is 2.9% + 30¢ per successful domestic card payment (+1.5% for international cards,
+1% when a currency conversion is needed); monthly payments also run on Stripe Billing, listed at 0.7% of billing
volume. Checked on stripe.com/pricing and stripe.com/billing/pricing in November 2026.

## 2. Paste the links

Edit one line in `src/support-config.js`:

```js
window.SML.SUPPORT = { links: { once: 'https://buy.stripe.com/...', monthly: '', manage: '' } };
```

(`monthly` and `manage` only if you set them up.) Then build, test, commit and push as CLAUDE.md describes. Setting
a link changes no page's lastmod in `tools/seo-lastmod.json`: the parts that depend on it are left out of the page text
the lastmod reads, and the footer is not part of it.

To switch it off again, empty the links and deploy. If you deactivate a link in Stripe instead, people who click it
see Stripe's "link deactivated" page, so empty the config too.

## 3. Test

- Automated, no network: `python3 tools/build.py --no-prerender && python3 tools/supporttest.py` (after a full
  `python3 tools/build.py` it also checks the pre-built pages and the sitemap). It injects a test-mode link in flight,
  so nothing fake is ever committed.
- By hand, before deploying: put your **test-mode** link (`https://buy.stripe.com/test_...`, from Stripe's test mode)
  in `src/support-config.js` on your machine only, run `python3 tools/build.py --no-prerender`, serve `dist/`
  (for example `python3 -m http.server -d dist 8000`) and open `http://localhost:8000/support/`. Pay with Stripe's test
  card 4242 4242 4242 4242 (any future date, any CVC) and check the redirect to `/support/thanks/` (test payments send
  no receipt email). Put the live link back before committing.
- After deploying: open `/support/`, click the button and check it opens your live Stripe page; cancel there.

## Analytics

One coarse event, `support_click`, through the site's usual analytics (website only, with consent like every other
event): `target` is `once`, `monthly` or `page` (a link to the Support page) and `target_type` is where the link was
(`footer`, `about`, `chat`, `support`, or the page it was on). No amount, no address, nothing personal. Payments
themselves are only in your Stripe Dashboard.

## The claude.ai copy

The artifact on claude.ai shows no payment buttons, footer link or About line, even with links set: links inside it
open outside claude.ai anyway, and the copy is a preview with sample data. Its Support page says support is handled on
the website and links to `https://firedbunny.com/support/`; the chat says the same.
