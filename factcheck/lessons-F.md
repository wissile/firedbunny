

========== l-blockchain | Crypto & Blockchain #1 | How a blockchain works (widget blockChainDemo)
Summary: Blocks, hashes, mining and staking: why a shared ledger is so hard to fake.
Idea: A blockchain is a ledger that thousands of computers keep in sync. Each block locks in the one before it, so changing history means redoing everything after it.

### The problem: digital money without a bank
A digital file can be copied, so how do you stop someone spending the same coin twice? A bank solves this by keeping the only ledger. A blockchain solves it by giving every participant a copy of the ledger and a set of rules for adding to it. No single company can quietly edit it.

### Hashes: fingerprints for data
A hash turns any data into a short fingerprint. Bitcoin uses SHA-256, the same function running in the demo above. Change one letter and the fingerprint changes completely, and you cannot work backwards from a fingerprint to the data.

### Blocks chained together
Transactions are grouped into blocks. Each block stores the hash of the block before it. Edit an old block and its hash changes, so the next block no longer points to it, and every block after that is broken too. That is the “chain”.

### Proof of work: mining
To add a block, miners race to find a number (the nonce) that makes the block’s hash start with enough zeros. The only way is trial and error, so it costs computing power and electricity. The winner earns new coins plus fees. Bitcoin adjusts the difficulty about every two weeks so a block arrives roughly every 10 minutes, no matter how many miners join.

### Proof of stake: validators
Ethereum switched from mining to proof of stake on September 15, 2022, which cut its energy use by about 99.95%. Validators lock up ether as a deposit. The network picks them at random, in proportion to their stake, to propose and vote on blocks. Break the rules, such as signing two different blocks, and part of the deposit is destroyed (“slashed”).

### Why rewriting history is so hard

- Confirmations: each new block on top of yours is a confirmation. To undo a payment, an attacker must redo that block and every block after it faster than the rest of the network.

- 51% attack: with more than half of all mining power, an attacker can eventually rewrite recent blocks. Big networks make that very expensive; small coins are easier targets.

- Stake attacks: on Ethereum, someone with a third of all staked ether could stall the chain, and about two thirds could rewrite finalized history, at the risk of losing that stake.


### What a blockchain does not do

- There is no undo button. Send coins to the wrong address and they are usually gone.

- It is public, not private. Every transaction stays visible forever, and addresses can often be linked to people through exchanges.

- It does not make a coin valuable or a project honest. Scam tokens run on blockchains too (see risks, scams and taxes).

## Worked example: Following one bitcoin payment
Ana sends Ben 0.01 BTC. Here is what happens before Ben can treat it as final.
1. Ana’s wallet signs the payment with her private key. Anyone can check the signature against her address, but nobody can forge it.
2. The payment is broadcast to the network and waits in a queue with others. Ana adds a fee; higher fees tend to get picked up sooner.
3. A miner includes it in a block. Blocks arrive about every 10 minutes on average, so the payment usually gets its first confirmation within minutes.
4. Each new block on top adds a confirmation. Six blocks take about an hour.
5. Using the formula from the Bitcoin white paper, an attacker with 10% of all mining power has about a 0.02% chance of undoing a payment buried under six blocks.
Result: That is why many exchanges wait for several confirmations before they credit a large deposit.

## Mistakes
- Sending coins to the wrong address and expecting a refund. There is no bank to reverse it; test with a small amount first.
- Thinking crypto is anonymous. Every transaction is public forever, and exchanges link addresses to real names.
- Believing “it is on the blockchain” means a project is legitimate. Anyone can launch a token, including scammers.
- Confusing the technology with the investment. A working blockchain does not make its coin a good buy.
## Takeaways
- A blockchain is a shared ledger copied across thousands of computers.
- Each block stores the previous block’s hash, so editing old data breaks every later link.
- Proof of work makes rewriting costly with electricity; proof of stake puts locked coins at risk instead.
- Every extra confirmation makes a payment much harder to undo.
- Transactions are permanent and public.
## Quiz
Q: You change one word in a transaction buried five blocks deep. What happens?
  Nothing; old blocks can be edited freely
* That block’s hash changes, so the next block no longer links to it and every later block must be redone
  The network asks the sender’s bank to approve the change
Why: Each block stores the previous block’s hash, so one edit breaks every link after it.
## Lesson glossary
- Node: A computer that keeps a copy of the blockchain and checks new blocks against the rules.
- Nonce: The number miners change over and over until the block’s hash meets the target.
- Confirmation: Each block added on top of the one holding your transaction.
- 51% attack: Controlling most of a network’s mining power (or stake) to rewrite recent history.
## Sources
- Bitcoin: A Peer-to-Peer Electronic Cash System (white paper, section 11) — https://bitcoin.org/bitcoin.pdf
- ethereum.org: The Merge (September 15, 2022; energy use down ~99.95%) — https://ethereum.org/en/roadmap/merge/
- ethereum.org: Proof-of-stake attack and defense — https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/attack-and-defense/

========== l-crypto-coins | Crypto & Blockchain #2 | Bitcoin, Ethereum, stablecoins and altcoins (widget coinMap)
Summary: What each kind of coin is for, how its supply works and how much it swings.
Idea: Not all crypto is alike. Bitcoin has a fixed supply, ether runs programs, stablecoins try to stay at $1, and most other tokens are long shots.

### Look at market cap, not price per coin
A coin’s market capitalization is its price times the number of coins. A token at $0.0001 with a trillion coins is worth more in total than one at $50 with a million coins. In October 2026 the whole crypto market was worth about $2.8 to $2.9 trillion, and bitcoin alone was 58% to 60% of it.

### Bitcoin: fixed supply, big swings
Bitcoin launched in 2009 with a hard cap of 21 million coins. New coins come from mining, and the reward per block halves every 210,000 blocks, about every four years. The last halving, on April 20, 2024, cut it to 3.125 BTC; the next is expected around April 2028. About 20.1 million coins existed by October 2026.
It still swings far more than stocks: about 43% a year recently against roughly 15% for the S&P 500. It fell 84% in 2018 and 77% in 2022, and from its record of about $126,000 in October 2025 it dropped more than half by July 2026.

### Ethereum: a world computer
Ethereum runs smart contracts, programs that move money when conditions are met. They power stablecoins, lending and trading apps (DeFi) and NFTs. Every action pays a gas fee in ether. Layer 2 networks bundle many transactions and settle them on Ethereum to cut fees. Ether has no fixed cap, and since 2022 it is secured by staking, which paid roughly 3% a year in 2026.

### Stablecoins: crypto’s dollars

- Backed by cash and Treasury bills (USDT, USDC): about $301 billion in total in October 2026. They are only as safe as their reserves and the company behind them. Not FDIC-insured.

- Backed by other crypto: they hold extra collateral, which can fall at the same time as the market.

- Algorithmic: backed by code and confidence. TerraUSD lost its peg in May 2022 and investors lost an estimated $40 billion.

The GENIUS Act, signed July 18, 2025, requires US payment stablecoins to hold 100% reserves in cash and short-term Treasuries, publish them monthly, and not pay interest to holders. It takes effect by January 18, 2027 at the latest.

### Altcoins and memecoins
Thousands of other tokens exist. Some run large networks; many are hype. Warning signs: insiders holding most of the supply, big token unlocks coming, thin trading and promises of guaranteed returns. Most small coins never get back to their highs. See risks, scams and taxes.

### Staking
On proof-of-stake chains you can lock coins to help secure the network and earn rewards. Rewards are taxed as income when you receive them, coins can be locked for a while, and staking through an exchange adds that company’s risk. Some spot ether ETFs now stake for you.

## Worked example: Halving math
How much new bitcoin enters the market each day, and what the next halving changes.
1. Bitcoin aims for one block about every 10 minutes: 6 an hour, 144 a day.
2. Since April 2024 each block creates 3.125 new BTC: 144 × 3.125 = 450 new coins a day.
3. At about $84,500 per coin (October 2026), that is about $38 million of new bitcoin a day that miners can sell to pay for power.
4. After the next halving, expected around April 2028, the reward drops to 1.5625 BTC: 225 new coins a day.
5. About 20.1 million of the 21 million already exist, roughly 95.7%. The rest trickles out over the following century.
Result: The schedule is certain; the price is not. A halving cuts new supply, but demand decides where the price goes.

## Mistakes
- Thinking a coin at a fraction of a cent is cheap. Check the market cap and how many coins exist.
- Treating a stablecoin like a bank deposit. It is not FDIC-insured, and it depends on the issuer’s reserves.
- Buying a memecoin because it is trending. Many lose most of their value within months.
- Assuming every halving brings a rally. Past peaks came 12 to 18 months after halvings, but that is a pattern, not a law.
## Takeaways
- Judge a coin by market cap and supply rules, not its price per coin.
- Bitcoin is capped at 21 million coins; new issuance halves about every four years.
- Ethereum is a platform for smart contracts; ether pays fees and secures it through staking.
- Stablecoins are only as safe as their reserves.
- Most altcoins and memecoins lose most of their value.
## Quiz
Q: A new token trades at $0.0001. What tells you whether it is “cheap”?
  Its price: anything under a penny is cheap
* Its market cap: price times the number of coins
  How many people are talking about it online
Why: Price per coin means nothing without the supply. Market cap shows what the whole thing is valued at.
## Lesson glossary
- Market capitalization: Price times the number of coins or shares. The real size of an asset.
- Layer 2: A network that bundles many transactions and settles them on a main blockchain such as Ethereum, for lower fees.
- Memecoin: A token built around a joke or internet trend, usually with no use beyond speculation.
- Token unlock: A scheduled release of coins held by founders or early investors, which can add selling pressure.
## Sources
- CoinGecko: bitcoin price, supply and record high — https://www.coingecko.com/en/coins/bitcoin
- DefiLlama: stablecoin supply — https://defillama.com/stablecoins
- White House fact sheet: GENIUS Act signed July 18, 2025 — https://www.whitehouse.gov/fact-sheets/2025/07/fact-sheet-president-donald-j-trump-signs-genius-act-into-law/
- bitcoin.org FAQ: supply cap and block time — https://bitcoin.org/en/faq

========== l-crypto-custody | Crypto & Blockchain #3 | Wallets, keys, exchanges and ETFs (widget custodyPicker)
Summary: Who holds the keys: exchanges, broker apps, ETFs, hot wallets and hardware wallets.
Idea: Whoever holds the private key controls the coins. Pick your trade-off between convenience and control, and guard the seed phrase like cash.

### Addresses, keys and seed phrases

- Your address is like an account number. You can share it to receive coins.

- Your private key signs transactions. Whoever has it controls the coins.

- Your seed phrase, 12 or 24 words, can rebuild your keys on any device. There is no password reset: lose it and the coins stay locked forever; leak it and they can be taken in seconds. Chainalysis estimated in 2020 that about 3.7 million bitcoin were probably lost for good.


### Letting a company hold it: exchanges and broker apps
On an exchange or an app like Robinhood or Coinbase, the company holds the keys for you. It is convenient and you can reset a password. But your coins are only as safe as the company: it can be hacked, freeze withdrawals or go bankrupt. When FTX collapsed in November 2022, its founder had taken more than $8 billion of customer money; he was sentenced to 25 years. SIPC does not protect crypto that is not a security, and the FDIC does not insure crypto.

### Spot ETFs: crypto in a regular brokerage or IRA
Spot bitcoin ETFs started trading in January 2024 and spot ether ETFs in July 2024. You buy shares like any stock, including in an IRA, and never handle keys. The fund pays a custodian; you pay a yearly fee (iShares’ IBIT charges 0.25%). US spot bitcoin ETFs held about $100 billion in October 2026. Some ether ETFs now stake their coins. Trade-offs: trading only in market hours and no access to crypto apps. ETF shares get normal tax forms, and the wash-sale rule applies to them.

### Holding it yourself: hot and cold wallets
A hot wallet is an app on a phone or browser: handy for using crypto apps, but online and open to phishing and malware. A cold wallet, usually a hardware device, keeps keys offline and signs transactions on the device. Self-custody removes company risk and adds personal risk: you are the bank, the security team and the record keeper. You also track your own cost basis for taxes.

### Seed phrase rules

- Write it on paper or metal. Never photograph it, email it or save it in the cloud.

- Never type it into a website or app you reached from a link, and never give it to “support”. Real support never asks.

- Buy hardware wallets directly from the maker, never second-hand.

- Keep a backup in a second safe place and tell a trusted person how to find it if something happens to you (see wills and beneficiaries).

## Worked example: Moving $8,000 from an exchange to a hardware wallet

1. Buy the device directly from the maker’s own website, not from a marketplace seller.
2. Set it up at home. It shows a 24-word seed phrase once; write it on paper and store it offline. No photos, no typing.
3. On the exchange, withdraw a test amount of about $50 to the address shown on the device screen. Wait until it arrives.
4. Withdraw the rest. Before confirming, check the first and last characters of the address on the device screen, because malware can swap addresses on a computer.
5. Store a second copy of the seed phrase somewhere separate and note in your estate papers how to find it.
Result: No exchange failure can now freeze those coins. The trade-off: lose the device and both seed copies and the coins are gone for good.

## Mistakes
- Saving the seed phrase as a phone photo, email or cloud note, where a hack can find it.
- Typing the seed phrase into a website or giving it to someone claiming to be support. That is how wallets get emptied.
- Leaving large amounts on an exchange because it is convenient. Not your keys, not your coins.
- Having no plan for heirs. Coins in self-custody can be lost forever if nobody knows how to reach them.
## Takeaways
- Not your keys, not your coins: companies holding crypto can be hacked, freeze withdrawals or fail.
- SIPC and the FDIC do not protect crypto coins.
- Spot ETFs give crypto exposure in a regular brokerage or IRA without handling keys.
- A hardware wallet suits larger long-term holdings if you can protect the seed phrase.
- Never share your seed phrase with anyone.
## Quiz
Q: Someone from “wallet support” asks for your 12 words to fix a problem. What should you do?
  Send them so they can fix it quickly
* Refuse: anyone with the words can take everything, and real support never asks
  Send only the first six words
Why: The seed phrase is the master key. Anyone who asks for it is trying to steal your coins.
## Lesson glossary
- Wallet address: A public string of characters you share so others can send you crypto.
- Custodian: A company that holds assets, or the keys to them, on someone else’s behalf.
## Sources
- SEC Investor Bulletin: Crypto asset custody basics (December 12, 2025) — https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/crypto-asset-custody-basics-retail-investors-investor-bulletin-0
- SIPC: What SIPC protects — https://www.sipc.org/for-investors/what-sipc-protects
- US Attorney SDNY: Samuel Bankman-Fried sentenced to 25 years — https://www.justice.gov/usao-sdny/pr/samuel-bankman-fried-sentenced-25-years-prison
- iShares Bitcoin Trust ETF (IBIT): fee and assets — https://www.ishares.com/us/products/333011/ishares-bitcoin-trust-etf

========== l-crypto-drivers | Crypto & Blockchain #4 | What moves crypto prices (widget cryptoDrivers)
Summary: Liquidity, ETF flows, leverage, the dollar, rules and hacks: the forces behind crypto’s big swings.
Idea: Crypto has no earnings to anchor it, so prices swing on money flows, leverage and mood. Learn the forces, then size for the swings.

### No earnings, so flows rule
A stock has profits you can value (see the financial statements). Bitcoin has no profits, dividends or cash flows. Its price is simply where buyers and sellers meet, so anything that changes how much money wants in, or how much must get out, moves it. That is why the same news can move crypto two or three times as much as stocks.

### Liquidity and the Fed
When money is cheap, people take more risk with it. Rate cuts and easy money have tended to lift speculative assets; rising real yields have tended to sink them. In 2022, as the Fed raised rates quickly, bitcoin fell about 77% from its late-2021 peak to about $15,800. In 2026 it slid with stocks after a hawkish Fed meeting in June, and the Fed raised its target range to 3.75%–4.00% on September 16, 2026. See how the Fed works and rates and yields.

### ETF flows
Since January 2024, spot bitcoin ETFs have let anyone hold bitcoin in a regular brokerage account. By October 2026, US spot bitcoin ETFs held about $100 billion, with about $58 billion of net new money since launch; the largest, BlackRock’s IBIT, charges 0.25% a year. Daily money into or out of these funds is now one of the most watched crypto numbers, because the funds must buy or sell real coins to match.

### The stock market and the dollar
Bitcoin has often traded like a high-risk tech stock. Its 30-day correlation with the Nasdaq-100 reached 0.70 in March 2025, then the 90-day figure fell to about 0.33 by September 2026. The link comes and goes, and it tends to jump during sell-offs, exactly when you would want it low. A stronger US dollar has usually been a headwind, as it is for most risky assets priced in dollars.

### Leverage, funding and liquidation cascades
Many crypto traders borrow to bet, mostly through perpetual futures. When most of them lean the same way, the funding rate they pay each other climbs. Then a small drop forces the most borrowed traders out; their forced selling pushes price lower, which forces out the next group. On October 10–11, 2025, after a US announcement of a proposed 100% tariff on Chinese goods, about $19 billion of leveraged positions were liquidated, the largest wipeout on record, hitting about 1.6 million traders, mostly longs.

### Supply: the halving and stablecoins
Every 210,000 blocks, about every four years, the new bitcoin paid to miners per block is cut in half. The last halving, on April 20, 2024, cut it to 3.125 bitcoin; the next is expected around April 2028. Past price peaks came roughly 12–18 months after halvings, including the October 2025 record about 18 months after the last one. The "four-year cycle" around halvings is a popular story built on only a handful of examples, so treat it as a story, not a schedule. Stablecoins are dollars waiting on crypto rails: about $301 billion of them existed in October 2026, about 61% of it USDT and about 24% USDC. A growing supply has tended to mean more money ready to buy.

### Rules, hacks and failures
Approvals and clear rules have lifted prices; lawsuits and crackdowns have hit them. In February 2025 hackers stole about $1.5 billion from the exchange Bybit, a theft the FBI attributed to North Korea, and about $3.4 billion was stolen across crypto that year. When a big platform fails, traders sell whatever they can to cover what is stuck, so everything drops together.

### How big are the swings?
Bitcoin’s volatility over the past year was about 43% a year in October 2026, roughly three times the S&P 500’s long-run 15%, and its ten-year average is about 64%. It has fallen more than 75% from a peak several times: about 84% in 2018 and about 77% in 2022. From its October 2025 record of about $126,000 it fell to about $58,000 by July 2026, a drop of about 54%, and traded near $84,500 in late October 2026. That is why the trading lessons insist on small size: see how to trade crypto.

## Worked example: A weekend liquidation cascade
Made-up numbers on a made-up Saturday, to show how leverage turns a dip into a crash.
1. A coin trades at $100,000. Funding has been high for two weeks: longs are paying shorts every eight hours, a sign that most traders are betting on a rise with borrowed money.
2. Late Saturday a headline hits and the price drops 5% in ten minutes, to $95,000. Stock markets are closed, so there are fewer buyers than on a weekday.
3. A trader long at 20× with isolated margin had a liquidation price about 4.5% below entry ($100,000 × (1 − 1/20) ÷ (1 − 0.5%) ≈ $95,500). The exchange closes the position and sells, pushing price lower.
4. Each wave of forced selling triggers the next. The price falls another 8%, to about $87,400, and the 10× longs (liquidation about 9.5% below entry, near $90,450) are wiped out too.
5. A 3× long has its liquidation about 33% below entry and survives. A holder of the actual coins with no loan loses nothing unless they sell.
6. By Monday the price recovers half the drop. The 20× and 10× traders are not there to see it: their margin is gone.
Result: Same coin, same weekend: the 20× trader lost the whole margin on a 4.5% dip, while the unleveraged holder was down about 13% on paper and got half of it back by Monday.

## Mistakes
- Treating one force as the whole story, such as "ETF money is flowing in, so it can only go up."
- Trading the halving calendar as if it were a schedule. There have been only four halvings, and each cycle looked different.
- Ignoring leverage. Record funding rates and crowded longs have often come right before sharp drops.
- Forgetting crypto trades all weekend and overnight, when stock markets are closed and fewer buyers are around.
## Takeaways
- Crypto has no earnings, so money flows, leverage and mood move it more than they move stocks.
- Easy money and a rising stock market have been tailwinds; tight money, a strong dollar and risk-off moods have been headwinds.
- Heavy leverage makes the market fragile: forced selling can turn a small dip into a crash in minutes.
- Forces explain moves better after the fact than before. Size every position for a big move either way.
## Quiz
Q: Funding rates are at a record and most traders are long with borrowed money. What is the main risk?
  A slow, steady rise
* A fast drop as forced selling triggers more forced selling
  None, funding only affects short sellers
Why: Crowded, leveraged longs are fuel for a liquidation cascade: a small dip forces sales that push price lower and force more sales.
## Sources
- Federal Reserve: FOMC statement, September 16, 2026 — https://federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm
- iShares Bitcoin Trust (IBIT): fund page — https://www.ishares.com/us/products/333011/ishares-bitcoin-trust-etf
- FBI: North Korea responsible for $1.5 billion Bybit hack (PSA, Feb 2025) — https://www.ic3.gov/PSA/2025/PSA250226
- IMF: Crypto prices move more in sync with stocks — https://www.imf.org/en/blogs/articles/2022/01/11/crypto-prices-move-more-in-sync-with-stocks-posing-new-risks

========== l-crypto-trading | Crypto & Blockchain #5 | How to trade crypto (widget liqCalc)
Summary: Spot, ETFs, futures and perps: how each works, what it costs, and how leverage gets you liquidated.
Idea: Most crypto blowups come from leverage and size, not from picking the wrong coin. Know your liquidation price before you click.

### Four ways in

- Spot on a US exchange or broker. You buy the coins themselves on platforms such as Coinbase, Kraken or Robinhood, and can usually move them to your own wallet. Fees vary a lot (below).

- Spot ETFs in a brokerage account or IRA. Funds such as IBIT hold the coins for you for a yearly fee (IBIT charges 0.25%). They trade only during market hours, you can use options on them, and there are no keys to lose.

- Regulated futures. CME bitcoin futures cover 5 bitcoin and micro futures 0.1 bitcoin; they are cash-settled, need margin, and since May 29, 2026 trade around the clock. See how futures work.

- Perpetual futures. Futures with no expiry, kept near the spot price by funding payments. In the US, Coinbase has offered CFTC-regulated perpetual-style futures since July 2025 (up to 10×), and Kraken announced perps for eligible US clients through Bitnomial in May 2026. Offshore exchanges offer far higher leverage, but US residents are generally barred from them.


### Placing the trade
Costs differ a lot. In October 2026, Coinbase Advanced charged 0.40% for orders that add liquidity and 0.60% for orders that take it, below $10,000 of monthly trading; Kraken Pro charged 0.40% and 0.80% at its first tier; Robinhood’s tiered crypto fees ran from 0% to 0.95% by volume. Simple "buy" buttons usually add a spread on top, so a round trip on a convenience app can cost 1–2% or more. Use limit orders so you choose your price, especially at night and on weekends when order books are thin and a market order can fill far from the last price. Compare the total cost of a round trip (buy plus sell) before you pick a platform.

### Charts work the same
Support and resistance, breakouts and retests, volume and VWAP all apply (see key levels and VWAP). Two differences: there is no opening bell, so most traders use the daily candle that starts at midnight UTC, and a VWAP has to be anchored to a start time you choose.

### Leverage and liquidation
With leverage you put up margin and the exchange lends the rest. At 10×, a move of about 10% against you wipes out the margin, and the exchange closes you a little before that, at the liquidation price, to keep a small buffer called maintenance margin. Isolated margin risks only the margin on that trade; cross margin uses your whole account, so liquidation is further away but takes everything when it comes.

### Funding
Perpetual futures charge or pay funding, usually every eight hours. When it is positive, longs pay shorts. The standard rate is 0.01% every eight hours, about 11% a year on the whole position, not just your margin, and it climbs far higher in a frenzy. In October 2026, bitcoin funding was running at about +10% a year. Holding a perp for weeks can quietly cost more than the fee to trade it.

### Size with the 1% rule
Decide the most you will lose if your stop is hit, usually 1% of the account, then divide by the stop distance: size = account × 1% ÷ stop distance (see the 1% rule and position sizing). Crypto needs wider stops than stocks because it swings more, so the position must be smaller. With a normal 5% stop the rule almost never calls for leverage.

### Weekends and gaps
Crypto never closes. Big moves often happen at night or on weekends, liquidity is thinner, and stop orders can fill well past their price. Crypto ETFs only trade during stock market hours, so they can open Monday far from Friday’s close.

### Investing instead of trading
If you want exposure without a screen, buy a small fixed amount on a schedule (dollar-cost averaging), keep crypto to a small slice of your investments, and rebalance once a year (see asset allocation). Keep a trade journal either way: it also gives you the records you need for taxes.

## Worked example: Sizing a bitcoin trade with the 1% rule
A $10,000 account, an entry at $80,000 (a round number near October 2026 prices) and a stop 5% below.
1. The most you plan to lose is 1% of $10,000: $100.
2. Your stop is 5% below entry, at $76,000. Position size = $100 ÷ 5% = $2,000, which is 0.025 bitcoin. No leverage needed.
3. Compare a 10× trade: $1,000 of margin controls $10,000 of bitcoin. If the 5% stop fills, you lose $500 (5% of the account), five times your plan.
4. Its liquidation price sits about 9.5% below entry, near $72,400 ($80,000 × 0.9 ÷ 0.995 with 0.5% maintenance margin, before fees). With yearly volatility around 43%, a normal day is about ±2.3%, so the cushion is only about four normal days’ worth of movement.
5. Hold it a week with funding at +0.01% every eight hours and you pay about $21 in funding on the $10,000 position (21 payments of $1), plus trading fees on the way in and out.
Result: The 1% rule says a $2,000 spot position. The 10× trade risks five times more and can be closed for you by a normal week of swings.

## Mistakes
- Using leverage because the platform offers it, without looking up the liquidation price first.
- Setting a stop beyond the liquidation price, so the exchange closes you before your stop can.
- Using market orders at 3 a.m. on a Sunday, when thin order books mean a bad fill.
- Holding perpetual futures for weeks without adding up the funding you pay.
## Takeaways
- Spot, ETFs, regulated futures and perpetual futures all give exposure, with very different costs and risks.
- Leverage turns normal swings into liquidations: at 10×, a move of about 10% against you ends the trade.
- Size from your stop: account × 1% ÷ stop distance. In crypto that usually means a small position and no leverage.
- Use limit orders, count fees and funding, and remember the market never closes.
## Quiz
Q: You have $10,000, risk 1% per trade and set a 5% stop. About how big should the position be?
  $500
* $2,000
  $10,000
Why: 1% of $10,000 is $100. $100 ÷ 5% = $2,000, so a stop-out loses your planned $100.
## Sources
- CME Group: cryptocurrency futures FAQ — https://www.cmegroup.com/articles/faqs/frequently-asked-questions-cryptocurrency-futures.html
- Kraken fee schedule — https://www.kraken.com/features/fee-schedule
- Robinhood: crypto fee tiers — https://robinhood.com/us/en/support/articles/crypto-fee-tiers
- Investor.gov: dollar-cost averaging — https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging

========== l-crypto-risks | Crypto & Blockchain #6 | Risks, scams and taxes (widget cryptoRisks)
Summary: How people lose crypto (scams, hacks, failed platforms, leverage) and how the IRS taxes every sale, swap and reward.
Idea: There is no bank to call in crypto: stolen or scammed coins are usually gone. Know the traps, and keep tax records from your first trade.

### How people lose money

- Crashes: bitcoin has fallen more than 75% from a peak more than once, and ether was about 50% below its record in October 2026.

- Leverage: about $19 billion of leveraged positions were wiped out on October 10–11, 2025.

- Failed platforms: Mt. Gox lost about 850,000 bitcoin in 2014; FTX collapsed in November 2022 after its founder took more than $8 billion of customer money.

- Hacks: about $3.4 billion was stolen in 2025, including about $1.5 billion from Bybit.

- Lost keys: Chainalysis estimated in 2020 that about 3.7 million bitcoin are probably lost for good.

- Broken pegs: TerraUSD, an algorithmic stablecoin, collapsed in May 2022; investors lost an estimated $40 billion.


### The scams that work
The FBI’s 2025 internet crime report counted about $11.4 billion of crypto-related losses, a record. About $7.2 billion came from crypto investment fraud such as pig butchering, people 60 and older lost about $4.3 billion, and about $389 million was lost through crypto ATMs. The patterns repeat:

- Pig butchering: a stranger becomes a friend or romantic interest over weeks, then shows you a "platform" with fake profits. When you try to withdraw, there are fees and "taxes" to pay first.

- Impostors and crypto ATMs: callers posing as your bank, the government or tech support tell you to move cash into a bitcoin ATM "to protect it".

- Wallet drainers: fake airdrops, support accounts and lookalike apps that ask you to connect a wallet, sign an approval or type your recovery phrase.

- Guaranteed yield and rug pulls: fixed daily returns, recruiting bonuses, anonymous teams and new coins hyped before launch.

- Recovery scams: after a loss, someone offers to get your coins back for a fee. They cannot.


### No safety net
SIPC does not protect crypto that is not a security, and the FDIC does not insure crypto. ETF shares at a brokerage are securities, but SIPC covers a broker failing, not prices falling. Crypto transfers cannot be reversed, and when a platform goes bankrupt, customers can end up waiting years as creditors. Spreading coins across platforms does not fix that; holding your own keys or using regulated products does (see wallets and custody).

### How crypto is taxed
The IRS treats crypto, stablecoins and NFTs as property, not currency. Every Form 1040 asks whether you received or disposed of a digital asset, and you report each sale on Form 8949 even when there is no gain.

- Taxable sales: selling for dollars, swapping one coin for another and spending crypto. Held more than a year: long-term rates; a year or less: ordinary income rates.

- Not taxable: buying with dollars and moving coins between your own wallets (a network fee paid in crypto can be a tiny taxable sale).

- Income: staking and mining rewards are ordinary income at their value when you gain control of them (Rev. Rul. 2023-14).

- Form 1099-DA: brokers report gross proceeds for sales from 2025 and cost basis for certain sales from 2026. Keep your own records anyway, especially for coins moved between platforms.

- Wash sales: as of October 2026 the wash-sale rule does not apply to crypto you hold directly (bills to change that are pending, not law), but it does apply to crypto ETF shares. Very aggressive loss harvesting can still be challenged by the IRS.

- Scam alert: there is no IRS crypto "registration". Letters with QR codes pointing to a "compliance portal" are scams.

See short- and long-term gains and the wash-sale rule. Crypto tax rules change often; a CPA or enrolled agent who handles crypto is worth it if you trade a lot.

### How much to own
Large asset managers have suggested small slices: BlackRock called 1–2% of a multi-asset portfolio a reasonable range for bitcoin (December 2024), and Morgan Stanley’s investment committee suggested 0% for conservative portfolios and up to 4% for aggressive growth ones (October 2025). At 2%, a repeat of a 77–84% crash would cost about 1.5–1.7% of the whole portfolio. Decide your slice before you buy, write it down, and rebalance back to it rather than chasing a run-up.

## Worked example: One year of crypto at tax time
Made-up numbers for one person in the 22% bracket, all trades within a year (short-term).
1. In January you buy 0.5 bitcoin at $60,000 each: $30,000. Buying is not taxable; your cost basis is $30,000, or $6,000 per 0.1 bitcoin.
2. In June you swap 0.1 bitcoin, worth $9,000, for ether. That swap is a sale: $9,000 − $6,000 = a $3,000 short-term gain. Your ether’s cost basis is $9,000.
3. Over the year you receive staking rewards worth $400 when they land. That $400 is ordinary income, and it becomes the rewards’ cost basis.
4. In December you sell the ether for $7,500: a $1,500 short-term loss ($9,000 − $7,500).
5. Net: $3,000 − $1,500 = $1,500 of short-term gain plus $400 of income, about $1,900 taxed at 22%: roughly $418. You still hold 0.4 bitcoin with a $24,000 cost basis.
Result: Two trades and some rewards created three tax events and about $418 of federal tax, even though you never cashed out to dollars.

## Mistakes
- Thinking a coin-to-coin swap is not taxable until you cash out to dollars.
- Leaving coins on a little-known platform because it promises a high, steady yield.
- Sharing a recovery phrase or your screen with "support", or signing a wallet request on a site you did not find yourself.
- Paying a "recovery service" after a scam. That is almost always a second scam.
## Takeaways
- Most losses come from crashes, leverage, scams and failed platforms, and crypto losses are rarely recoverable.
- No real bank, agency or company will ask you to move money into crypto, share a recovery phrase or sign a wallet request.
- The IRS treats crypto as property: selling, swapping and spending are sales, and rewards are income.
- Keep records of every trade from day one, and keep crypto to a small slice you could lose.
## Quiz
Q: You swap $5,000 of bitcoin for ether. What happened for tax purposes?
  Nothing until you sell for dollars
* You sold bitcoin, so you have a gain or loss to report
  Only the ether purchase counts
Why: A swap is a sale of the coin you give up at its market value, so it creates a gain or loss on that bitcoin.
## Sources
- IRS: Digital assets — https://www.irs.gov/filing/digital-assets
- FBI IC3: 2025 Internet Crime Report (PDF) — https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf
- SIPC: What SIPC protects — https://www.sipc.org/for-investors/what-sipc-protects
- CFTC: joint alert on relationship investment scams — https://www.cftc.gov/PressRoom/PressReleases/8963-24