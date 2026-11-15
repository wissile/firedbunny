/* FiredBunny support links: Stripe Payment Links (docs/support/README.md).
 *
 * While both payment links are empty, every support button and link stays hidden: the footer link, the line on the
 * About page and the buttons on /support/ (that page still explains how the site is paid for). Paste a link and
 * rebuild to switch it on; nothing else changes. Payment happens on Stripe's own page, so no key, no Stripe.js and no
 * server code are involved, and FiredBunny never sees card details.
 *
 * once:    a Payment Link with "Customers choose what to pay" (one-time), e.g. 'https://buy.stripe.com/...'
 * monthly: optional, a Payment Link for a fixed monthly price (Stripe's "customers choose" links can't be recurring).
 *          Its button shows only together with `manage`, so anyone who starts a monthly payment can stop it themselves.
 * manage:  the customer portal login link, e.g. 'https://billing.stripe.com/p/login/...'
 *
 * Accepted: https links on buy.stripe.com (once, monthly) and billing.stripe.com (manage). Anything else is ignored
 * with a warning in the browser console. These are public links, never a Stripe key.
 */
window.SML.SUPPORT = { links: { once: '', monthly: '', manage: '' } };
