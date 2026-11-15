/* FiredBunny Portfolio page (/portfolio/): live, read-only brokerage connections through SnapTrade.
 *
 * live: true shows the Connect button to every signed-in visitor. Until then it shows only in a browser that opened
 *       /portfolio/?preview=brokerage (?preview=off ends the preview), so the owner can try it on the real site first.
 *       Every connected user costs money on SnapTrade's paid plan, so switch it on deliberately (docs/portfolio/README.md).
 * The sample portfolio always shows, whatever this says. The server side needs three Worker secrets (SNAPTRADE_CLIENT_ID,
 * SNAPTRADE_CONSUMER_KEY, BROKERAGE_KEY) set in the Cloudflare dashboard; without them the page shows the sample and says
 * live connections are not set up. Nothing secret goes in this file.
 */
window.SML.BROKERAGE = { live: false };
