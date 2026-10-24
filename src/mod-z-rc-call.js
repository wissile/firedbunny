/* Read a Real Company (fork K3): the narrated earnings-call player (`callPlayer`, also the tool `tool-call`) and the
   lessons l-rc-apple-call (order 5) and l-rc-spacex-call (order 7).
   The narration is a plain-words retelling written by FiredBunny, never the recording or transcript text. A NARRATOR
   reports what happened and what management said; the BUNNY COACH explains what it means with Hoppy's Coffee Cart.
   Cue text markup: {spoken words|display caption} keeps one source for the audio and the on-screen caption, and
   [#name] marks the moment a word is spoken so the stage can light things up in sync.
   Audio: rendered with Piper (LibriTTS voices, CC BY 4.0) by
   /tmp/claude-0/-home-claude/842667f2-ab20-5f62-bf05-63855f5f5c38/scratchpad/k3/render.py, which also rewrites the
   TIMING block below. Numbers on the stage are read from SML.realco (content-realco.js). */
(function () {
  'use strict';
  const SML = window.SML, ui = SML.ui, F = SML.fmt;
  const RC = SML.realco;
  if (!RC) return;
  const AP = RC.apple, SX = RC.spacex;

  /* ======================================================================
     Timing table (seconds), written by render.py: per cue [start, end] for each sentence.
     ====================================================================== */
  /*@timing-start*/
  const TIMING = {
    "apple": {"dur":471.72,"c":[[0.3,4.53,4.75,8.93],[9.28,10.11,10.33,17.11],[17.46,22.51,22.73,26.73],[27.08,33.78],[34.13,35.53,35.75,40.43,40.65,44.84],[45.19,55.67],[56.02,60.36,60.58,66.34],[66.69,68.29,68.51,73.31],[73.66,74.93,75.15,81.24,81.46,85.0],[85.35,89.29,89.51,94.99,95.21,97.29],[97.64,102.46,102.68,108.37],[108.72,114.75],[115.1,116.12,116.34,119.06],[119.41,127.25],[127.6,128.19,128.41,130.6,130.82,131.7,131.92,133.15],[133.5,139.94],[140.29,145.97,146.19,147.38,147.6,151.45],[151.8,153.22,153.44,163.62],[163.97,167.33,167.55,171.76],[172.11,174.94,175.16,182.57,182.79,187.61],[187.96,197.46],[197.81,203.58],[203.93,206.64,206.86,209.61],[209.96,220.67],[221.02,227.83],[228.18,237.64],[237.99,247.36],[247.71,249.66,249.88,256.2,256.42,258.7],[259.05,262.7],[263.05,263.69,263.91,266.72,266.94,270.55,270.77,271.98],[272.33,280.7],[281.05,283.09,283.31,293.49],[293.84,301.11],[301.46,301.89,302.11,307.6,307.82,313.49],[313.84,318.09,318.31,321.26,321.48,322.54],[322.89,330.68],[331.03,336.83,337.05,343.68],[344.03,349.66],[350.01,352.78,353.0,358.51],[358.86,360.69,360.91,365.5],[365.85,371.28,371.5,381.59],[381.94,384.43,384.65,388.45],[388.8,393.87,394.09,398.33],[398.68,399.53,399.75,407.79,408.01,412.73],[413.08,421.49],[421.84,425.32,425.54,434.89],[435.24,436.14,436.36,440.08,440.3,449.51],[449.86,451.17,451.39,456.93,457.15,459.03],[459.38,463.56,463.78,468.46,468.68,469.83,470.05,470.67]]},
    "spacex": {"dur":359.2,"c":[[0.3,3.3,3.52,7.43,7.65,14.95],[15.3,25.97],[26.32,32.11],[32.46,41.84],[42.19,52.81,53.03,61.28],[61.63,69.1],[69.45,71.19,71.41,73.83,74.05,82.02,82.24,86.97],[87.32,88.48,88.7,96.71],[97.06,105.65,105.87,112.43,112.65,120.53],[120.88,121.81,122.03,126.55,126.77,127.56],[127.91,136.06,136.28,146.5],[146.85,154.75,154.97,158.45],[158.8,164.66,164.88,169.99],[170.34,171.17,171.39,178.2,178.42,181.01],[181.36,183.92,184.14,190.95,191.17,196.57],[196.92,205.85,206.07,209.55],[209.9,217.35,217.57,224.44,224.66,226.59],[226.94,228.63,228.85,239.28,239.5,245.99],[246.34,250.44,250.66,256.83,257.05,263.14],[263.49,270.56],[270.91,273.44,273.66,278.81],[279.16,279.81,280.03,287.1,287.32,289.11,289.33,290.54],[290.89,298.48,298.7,300.84],[301.19,304.5,304.72,311.45],[311.8,312.7,312.92,314.97,315.19,321.7,321.92,324.83],[325.18,327.51,327.73,339.91,340.13,345.25],[345.6,352.53,352.75,357.3,357.52,358.15]]}
  };
  /*@timing-end*/

  /* ======================================================================
     Scripts
     ====================================================================== */
  const C = (id, sp, chapter, show, text, cp) => ({ id, speaker: sp === 'c' ? 'coach' : 'narrator', chapter, show, text, cp: cp || null });

  const APPLE = {
    key: 'apple', file: 'apple-fq3-2026', company: 'Apple', ticker: 'AAPL',
    title: 'Fiscal Q3 2026 earnings call', when: 'July 30, 2026 · 2:00 p.m. PT', sub: 'Results for April to June 2026',
    people: [['SC', 'Investor relations', 'ir', 'IR'], ['TC', 'Tim Cook, CEO', 'ceo', 'CEO'], ['KP', 'Kevan Parekh, CFO', 'cfo', 'CFO'], ['JT', 'John Ternus, CEO from Sep 1', 'jt', 'Next CEO'], ['?', 'Analysts', 'an', 'Q&A']],
    chapters: [['open', 'Opening'], ['ceo', 'CEO highlights'], ['cfo', 'The numbers'], ['cash', 'Cash and buybacks'], ['guide', 'Guidance'], ['qa', 'Analyst Q&A'], ['after', 'After the call']],
    cues: [
      C('a01', 'n', 'open', { k: 'title' }, `{July thirtieth, twenty twenty-six|July 30, 2026}, {two p m Pacific time|2:00 p.m. Pacific}. Apple has just published its results for April to June, and its earnings call begins.`),
      C('a02', 'c', 'open', { k: 'fiscal' }, `Quick decoder. Apple's fiscal year ends in late September, so April to June is its [#q3]fiscal third quarter, or {Q three|“Q3”}.`),
      C('a03', 'n', 'open', { k: 'title', ppl: true }, `Investor relations introduces [#ceo]chief executive Tim Cook [#cfo]and finance chief {Kevan Pah-reck|Kevan Parekh}. [#jt]John Ternus, who becomes CEO on {September first|September 1}, is also on the line.`),
      C('a04', 'n', 'open', { k: 'doc' }, `[#s]First, the safe harbor: a legal reminder that anything said about the future is a forecast, and real results can differ.`),
      C('a05', 'c', 'open', { k: 'cart', mode: 'safe' }, `Think of Hoppy's Coffee Cart. If Hoppy tells his bank July should be busy, that's a forecast nobody can hold him to. The safe harbor says the same in lawyer words, so don't read anything into it.`),
      C('a06', 'n', 'ceo', { k: 'records' }, `In the results release, Tim Cook called it {our strongest June quarter ever|“our strongest June quarter ever”}, with June-quarter records for [#r1]revenue, [#r2]earnings per share, [#r3]iPhone, [#r4]Mac, [#r5]Services [#r6]and operating cash flow.`),
      C('a07', 'c', 'ceo', { k: 'icons', set: 'frame' }, `CEOs lead with good news, and the price already assumes a strong quarter. What moves the stock is [#s]the surprise against expectations, [#g]the outlook, [#q]and the quality of the numbers.`),
      C('a09', 'n', 'cfo', { k: 'big', m: 'rev' }, `Then the finance chief takes over. Revenue was [#v]{one hundred nine point four billion dollars|$109.4 billion}, [#y]up {sixteen percent|16%} from a year ago.`),
      C('a10', 'c', 'cfo', { k: 'cart', mode: 'sales' }, `Revenue is the top line. [#a]Hoppy's cart sold {ten thousand dollars|$10,000} this June, [#b]up {twenty-five percent|25%} from {eight thousand|$8,000} last June. Comparing with the same month a year earlier is called year over year.`),
      C('a11', 'c', 'cfo', { k: 'trend' }, `Apple has seasons, and the holiday quarter is always the biggest. [#q]So June was {one point six percent|1.6%} smaller than March, [#y]yet {sixteen percent|16%} bigger than last June. Year over year is the fair comparison.`),
      C('a12', 'n', 'cfo', { k: 'bars', set: 'cats' }, `[#iphone]iPhone brought in {fifty-four point three billion dollars|$54.3 billion}, up {twenty-two percent|22%}. [#mac]Mac grew {twenty-nine percent|29%}, [#ipad]iPad fell {six percent|6%}, [#wear]and wearables rose {six point five percent|6.5%}.`),
      C('a13', 'n', 'cfo', { k: 'bars', set: 'cats', hi: 'serv' }, `[#serv]Services, like the App Store and iCloud, brought in {thirty point seven billion dollars|$30.7 billion}, up {twelve percent|12%}.`),
      C('a14', 'n', 'cfo', { k: 'bars', set: 'regions' }, `Every region grew. [#eu]Europe [#cn]and Greater China each jumped {twenty-two percent|22%}.`),
      C('a15', 'n', 'cfo', { k: 'gauge', step: 'gm' }, `Gross margin, the share of sales left after the cost of making the products, was [#v]{fifty point one percent|50.1%}, [#y]up from {forty-six point five percent|46.5%}.`),
      C('a16', 'c', 'cfo', { k: 'gauge', step: 'q' }, `Quick check. Part of that jump came from a temporary boost. How big was it? Pick an answer on screen.`, 'tariff'),
      C('a17', 'n', 'cfo', { k: 'gauge', step: 'tariff' }, `The finance chief says [#t]tariff refunds added about {two percentage points|2 percentage points} to gross margin, [#e]and {eleven cents|11 cents} to earnings per share.`),
      C('a18', 'c', 'cfo', { k: 'cart', mode: 'refund' }, `That's like Hoppy's bean supplier refunding an old overcharge: a nice boost, but temporary. Investors strip it out. [#x]Without the refunds, Apple's margin was about {forty-eight percent|48%}.`),
      C('a19', 'c', 'cfo', { k: 'split' }, `Here's Apple's hidden engine. [#r]Services was {twenty-eight percent|28%} of sales [#g]but {forty-two percent|42%} of gross profit, [#m]because it keeps about {seventy-six cents|76 cents} of each dollar, against about {forty|40} for devices.`),
      C('a20', 'n', 'cfo', { k: 'stmt', hi: 'opex' }, `[#o]Operating expenses were {nineteen point one billion dollars|$19.1 billion}. [#rd]Research and development jumped {thirty-two percent|32%}, to {eleven point seven billion|$11.7 billion}.`),
      C('a21', 'c', 'cfo', { k: 'cart', mode: 'opex' }, `Operating expenses don't grow with every cup sold. At Hoppy's cart, that's [#rd]{five hundred dollars|$500} for recipes and training, [#sga]and {fifteen hundred|$1,500} for ads, the permit and the phone. Apple's fast-rising research budget is a bet on what comes next, including AI.`),
      C('a22', 'n', 'cfo', { k: 'stmt', hi: 'profit' }, `[#op]Operating income was {thirty-five point seven billion dollars|$35.7 billion}, [#ni]and net income, the bottom line, was {twenty-nine point eight billion|$29.8 billion}, both up {twenty-seven percent|27%}.`),
      C('a23', 'n', 'cfo', { k: 'eps', step: 'eps' }, `[#v]Earnings per share, or {E P S|EPS}, came in at {two dollars and two cents|$2.02}, [#y]up {twenty-nine percent|29%}.`),
      C('a24', 'c', 'cfo', { k: 'eps', step: 'shares' }, `That's faster than profit grew, thanks to buybacks. [#s]Apple's diluted share count fell {one point six percent|1.6%}.`),
      C('a25', 'c', 'cfo', { k: 'cart', mode: 'buyback' }, `If Hoppy bought back [#a]{one hundred|100} of his {one thousand|1,000} shares, [#b]the same {three thousand and forty dollars|$3,040} of profit would be [#c]{three dollars thirty-eight|$3.38} a share, instead of {three oh four|$3.04}.`),
      C('a26', 'c', 'cfo', { k: 'eps', step: 'tariff' }, `[#t]Without the {eleven-cent|11-cent} refund, {E P S|EPS} was about {a dollar ninety-one|$1.91}, [#y]still up about {twenty-two percent|22%}.`),
      C('a27', 'n', 'cash', { k: 'cash', step: 'return' }, `Apple returned about [#t]{thirty-three billion dollars|$33 billion} to shareholders, including [#b]{twenty-five point eight billion|$25.8 billion} of buybacks [#d]and about {four billion|$4 billion} of dividends.`),
      C('a28', 'n', 'cash', { k: 'cash', step: 'net' }, `[#c]It holds about {one hundred forty-seven billion dollars|$147 billion} of cash and investments, [#d]against {eighty-four billion|$84 billion} of debt, [#v]and declared a {twenty-seven-cent|27-cent} dividend.`),
      C('a29', 'c', 'cash', { k: 'cart', mode: 'netcash' }, `Cash minus debt is net cash. [#h]Hoppy has {six thousand dollars|$6,000} in the register and a {five thousand dollar|$5,000} loan, [#n]so {one thousand|$1,000} of net cash. [#a]Apple's is about {sixty-two billion|$62 billion}.`),
      C('a30', 'n', 'guide', { k: 'icons', set: 'frame', hi: 'g' }, `Now the part that often moves a stock most: guidance, management's forecast for the next quarter.`),
      C('a31', 'c', 'guide', { k: 'score', step: 'pre' }, `Your turn. Revenue and earnings both beat expectations. Before you hear the forecast, will the stock rise or fall tomorrow? Make your call on screen.`, 'dir'),
      C('a32', 'n', 'guide', { k: 'range', step: 'guide' }, `For the September quarter, Apple expects [#g]revenue growth of {nine to eleven percent|9 to 11%}, [#fx]including a currency drag about {two and a half points|2.5 points} bigger than in June.`),
      C('a33', 'c', 'guide', { k: 'range', step: 'cons' }, `[#c]Analysts expected about {twelve percent|12%}. [#r]On last year's {one hundred two point five billion|$102.5 billion}, Apple's range means about {one hundred twelve to one hundred fourteen billion|$112 to $114 billion}, [#k]short of the roughly {one hundred fifteen billion|$115 billion} analysts had.`),
      C('a34', 'n', 'guide', { k: 'gauge', step: 'guide' }, `Gross margin should be [#g]{forty-seven to forty-eight percent|47 to 48%}, [#t]including about a point from refunds, [#n]down from {fifty point one|50.1%}.`),
      C('a35', 'n', 'guide', { k: 'icons', set: 'supply' }, `Why? [#chip]Advanced chips for iPhone, Mac and iPad are scarce, and the squeeze grows in September. [#mem]Memory prices are soaring: Cook calls it a {hundred-year flood|“100-year flood”}, [#price]and Apple raised some iPad and Mac prices.`),
      C('a36', 'c', 'guide', { k: 'cart', mode: 'supply' }, `For Hoppy, picture a bean shortage and pricier milk right after a record June. He'd warn the bank about fewer sales and thinner margins. That's this guidance.`),
      C('a37', 'n', 'guide', { k: 'icons', set: 'guide2' }, `Apple also sees [#ip]iPhone growing in the mid-teens, [#ox]and operating expenses of {nineteen point one to nineteen point four billion dollars|$19.1 to $19.4 billion}.`),
      C('a38', 'n', 'qa', { k: 'qa', i: 0 }, `[#q]In the Q and A, Evercore asks how much of the slowdown is supply and how much is currency. [#a]The finance chief says both: a currency drag about {two and a half points|2.5 points} bigger than in June, plus tighter supply.`),
      C('a39', 'n', 'qa', { k: 'qa', i: 0, more: true }, `[#b]Cook adds that the bottleneck is the limited supply of the most advanced chips, at a time of very strong demand.`),
      C('a40', 'n', 'qa', { k: 'qa', i: 1 }, `[#q]Goldman Sachs asks what the new Siri will cost to run. [#a]Cook says it's too early for a full plan to recover those costs, perhaps through higher iCloud tiers.`),
      C('a41', 'n', 'qa', { k: 'qa', i: 2 }, `[#q]Morgan Stanley asks about pricing. [#a]Cook says Apple raised prices reluctantly, because memory costs jumped so much.`),
      C('a42', 'n', 'qa', { k: 'qa', i: 3 }, `[#q]Bank of America asks how much data-center capacity the new Siri will need, and about competition. [#a]Cook describes a mix of outside cloud services and Apple's own data centers, [#b]and John Ternus takes the competition question, saying Apple sees a big opportunity in AI.`),
      C('a43', 'n', 'qa', { k: 'qa', i: 4 }, `[#q]JPMorgan asks why margins dip in September. [#a]The finance chief says memory costs explain all of the dip, and more.`),
      C('a44', 'c', 'qa', { k: 'icons', set: 'themes' }, `Notice the pattern: [#s]supply, [#m]memory costs [#g]and margins came up again and again. When the questions circle one worry, that worry often drives the stock next.`),
      C('a45', 'n', 'after', { k: 'score', step: 'full' }, `After the call. Analysts expected [#r]revenue of about {one hundred eight point seven to one hundred nine billion dollars|$108.7 to $109 billion} [#e]and {E P S|EPS} of {a dollar eighty-eight to eighty-nine|$1.88 to $1.89}. Apple beat both, [#s]though Services missed the roughly {thirty-one point two billion|$31.2 billion} expected.`),
      C('a46', 'c', 'after', { k: 'score', step: 'verdict' }, `So: [#b]a beat on the quarter, [#g]but softer guidance, [#m]a lower margin forecast, [#o]and {eleven cents|11 cents} of temporary help inside the beat.`),
      C('a47', 'n', 'after', { k: 'stock' }, `The stock had closed at [#c]{three thirty-three forty-three|$333.43}. [#ah]It slipped about {three percent|3%} after hours, [#o]opened about {eight point six percent|8.6%} lower, [#l]touched about {three hundred two|$302}, [#e]and closed near {three hundred nine dollars|$309}, down about {seven point four percent|7.4%}.`),
      C('a48', 'c', 'after', { k: 'pe' }, `[#y]How did your call do? A price is roughly {E P S|EPS} times the {P E|P/E} multiple. [#a]Apple's {P E|P/E} slid from about {thirty-eight|38} [#b]to about {thirty-five|35}: investors paid less for each dollar of profit, because the outlook got weaker.`),
      C('a49', 'n', 'after', { k: 'targets' }, `Analysts split afterward. [#lo]Reported price targets ranged from {two hundred forty-five dollars|$245} at Barclays [#hi]to {four hundred|$400} at {T D Cowan|TD Cowen}. Same numbers, different conclusions.`),
      C('a50', 'c', 'after', { k: 'next' }, `The lesson: stocks move on the surprise, and most of all on the outlook. Apple reports next on {November second|November 2}, John Ternus's first call as CEO. Start with the guidance. Hop hop.`),
    ],
  };

  const SPACEX = {
    key: 'spacex', file: 'spacex-q3-2026', company: 'SpaceX', ticker: 'SPCX',
    title: 'Q3 2026 earnings call', when: 'October 20, 2026 · after the close', sub: 'Results for July to September 2026 · second report as a public company',
    people: [['AW', 'Andrea Williams, investor relations', 'ir', 'IR'], ['EM', 'Elon Musk, CEO', 'ceo', 'CEO'], ['GS', 'Gwynne Shotwell, President and COO', 'coo', 'President'], ['BJ', 'Bret Johnsen, CFO', 'cfo', 'CFO'], ['?', 'Analysts', 'an', 'Q&A']],
    chapters: [['open', 'Opening'], ['num', 'The numbers'], ['segs', 'Three businesses'], ['cash', 'Spending and cash'], ['outlook', 'Guidance'], ['qa', 'Q&A themes'], ['after', 'After the call'], ['flash', 'Three months earlier']],
    cues: [
      C('s01', 'n', 'open', { k: 'title', ppl: true }, `{October twentieth, twenty twenty-six|October 20, 2026}, after the close. SpaceX reports its third quarter, its second report as a public company. [#ir]Investor relations opens the call, [#ppl]with chief executive Elon Musk, President Gwynne Shotwell and finance chief Bret Johnsen.`),
      C('s02', 'n', 'open', { k: 'ipo' }, `Quick background: SpaceX listed on the Nasdaq as {S P C X|SPCX} in June, [#p]pricing shares at {one hundred thirty-five dollars|$135} [#r]and raising about {eighty-five point seven billion|$85.7 billion}.`),
      C('s03', 'n', 'open', { k: 'doc', nongaap: true }, `[#s]After the safe harbor comes a reminder [#n]that some figures are {non-gap|non-GAAP}: the company's own adjusted measures.`),
      C('s04', 'n', 'num', { k: 'big', m: 'sxrev' }, `When finance chief Bret Johnsen takes over, he starts with revenue: [#v]{fourteen point six billion dollars|$14.6 billion}, [#y]up {one hundred sixty-one percent|161%} from a year ago, [#q]and nearly double the second quarter.`),
      C('s05', 'n', 'num', { k: 'stmt', set: 'spacex', hi: 'op' }, `[#g]Gross margin was {sixty-two percent|62%}, though the finance chief expects the fourth quarter's to look more like the second's: the third had one-time benefits and a helpful customer mix. [#op]And for the first time as a public company, SpaceX made an operating profit: {two point eight billion dollars|$2.8 billion}, after a small operating loss in the second quarter.`),
      C('s06', 'n', 'num', { k: 'stmt', set: 'spacex', hi: 'net' }, `[#n]Net income was {four point four billion dollars|$4.4 billion}, [#e]or {thirty-five cents|35 cents} a share: its first profitable quarter as a public company.`),
      C('s07', 'c', 'num', { k: 'below' }, `But look at where that profit came from. [#o]Operations earned {two point eight billion|$2.8 billion}. [#b]About {one point six billion|$1.6 billion} more came from below the operating line: [#x]other income, interest on its cash, [#t]and a tax benefit. [#h]For Hoppy, that's a great month where part of the profit came from selling an old grinder.`),
      C('s08', 'n', 'num', { k: 'bridge', step: 'result' }, `Then the adjusted number. [#v]Adjusted {ee-bit-dah|EBITDA} was a positive {eight point eight billion dollars|$8.8 billion} on SpaceX's own measure, [#y]up from {three point five billion|$3.5 billion} in the second quarter.`),
      C('s09', 'c', 'num', { k: 'bridge', step: 'walk' }, `{Ee-bit-dah|EBITDA} adds back interest, taxes and depreciation, the wear on equipment, and SpaceX's version also adds back stock pay. [#d]Depreciation was {three point six billion|$3.6 billion}, [#s]and stock pay, including the Cursor deal, about {two point four billion|$2.4 billion}. [#h]For Hoppy, {four thousand dollars|$4,000} of operating income plus {two hundred|$200} of machine wear is {forty-two hundred|$4,200} of {ee-bit-dah|EBITDA}.`),
      C('s10', 'c', 'segs', { k: 'segs', step: 'hide' }, `Quick guess. Of Starlink, Super Intelligence and Space, which business brought in the most revenue? Pick on screen.`, 'seg'),
      C('s11', 'n', 'segs', { k: 'segs', step: 'si' }, `[#a]Super Intelligence, the former AI business, brought in {seven point six billion dollars|$7.6 billion}, up {eight hundred thirty percent|830%}: more than half of all revenue. [#c]Cursor, bought on {August fourteenth|August 14}, added {six hundred eight million|$608 million} of it, [#k]plus {one point two billion|$1.2 billion} of deal-related stock pay that cut the segment's operating profit to {four hundred thirty-one million|$431 million}.`),
      C('s12', 'n', 'segs', { k: 'segs', step: 'rest' }, `[#c]Starlink brought in {five point two billion dollars|$5.2 billion}, up {sixty-nine percent|69%}, [#o]with {two point four billion|$2.4 billion} of operating income, still the biggest profit maker. [#s]Space roughly broke even, on {one point eight billion|$1.8 billion} of revenue.`),
      C('s13', 'n', 'segs', { k: 'subs' }, `[#s]Starlink reached {thirteen point six million|13.6 million} consumer subscribers, up from {seven point two million|7.2 million} a year ago. [#a]Average revenue per user was {sixty-nine dollars|$69} a month, up from {sixty-six|$66} in June.`),
      C('s14', 'n', 'cash', { k: 'capex' }, `Now the spending. [#q]Capital spending, or {cap ex|capex}, was {nineteen point six billion dollars|$19.6 billion}, [#p]up from {eighteen point four billion|$18.4 billion} in the second quarter. [#ai]{Sixteen point four billion|$16.4 billion} went to Super Intelligence.`),
      C('s15', 'c', 'cash', { k: 'cart', mode: 'capex' }, `[#x]That's more than twice the adjusted {ee-bit-dah|EBITDA}. [#h]For Hoppy, it's like selling {ten thousand dollars|$10,000} of coffee and buying {thirteen thousand five hundred|$13,500} of new carts in the same month. [#f]Over nine months, free cash flow was roughly minus {thirty-five billion dollars|$35 billion}.`),
      C('s16', 'n', 'cash', { k: 'pairs' }, `[#c]At the end of September, SpaceX held about {eighty-nine point nine billion dollars|$89.9 billion} of cash and securities, [#b]against {thirty-eight point eight billion|$38.8 billion} of debt. [#g]Goodwill jumped to {forty-eight point four billion|$48.4 billion} after the Cursor purchase.`),
      C('s17', 'n', 'cash', { k: 'dilution' }, `[#s]The share count keeps climbing too: about {twelve point five billion|12.5 billion} diluted shares on average, against {five point nine billion|5.9 billion} in June. [#w]Shares outstanding jumped with the preferred conversion, the {I-P-O|IPO} and other new shares; the release doesn't itemize the change. Same profit, split more ways.`),
      C('s19', 'n', 'outlook', { k: 'sxguide' }, `Then the guidance, and it's huge. [#g]SpaceX expects first-quarter {twenty twenty-seven|2027} revenue of {thirty-three to thirty-seven billion dollars|$33 to $37 billion}, [#c]against about {twenty-two point two billion|$22.2 billion} analysts expected. [#x]It plans {thirty-five to forty billion|$35 to $40 billion} of capex in the fourth quarter, [#w]and {two and a half to three gigawatts|2.5 to 3 gigawatts} of computing by year end.`),
      C('s20', 'c', 'outlook', { k: 'sxguide', step: 'gap' }, `[#g]Even the low end is about {fifty percent|50%} above what analysts had. When guidance lands that far above expectations, investors raise their estimates for every quarter after it. [#k]SpaceX also points to a {sixty-three billion dollar|$63 billion} backlog of signed orders.`),
      C('s21', 'n', 'qa', { k: 'qa', i: 0 }, `[#q]In the Q and A, an analyst from JPMorgan asked about power for the new data centers and how SpaceX will fund all that capex.`),
      C('s22', 'n', 'qa', { k: 'qa', i: 1 }, `[#q]Deutsche Bank asked about a possible combination with Tesla. [#a]Both companies have formed special committees of independent directors, and no terms have been agreed.`),
      C('s23', 'c', 'qa', { k: 'score', step: 'pre' }, `Your call. A big beat, a first profit as a public company and guidance far above expectations, but capex could nearly double. What does the stock do the next day? Make your call on screen.`, 'dir'),
      C('s24', 'n', 'after', { k: 'score', step: 'full' }, `Analysts had expected [#r]revenue of about {twelve point seven to twelve point nine billion dollars|$12.7 to $12.9 billion} [#e]and {E P S|EPS} of {thirteen to sixteen cents|13 to 16 cents}. SpaceX beat both by a wide margin.`),
      C('s25', 'n', 'after', { k: 'stock' }, `[#c]The stock had closed at {one forty-seven seventy-nine|$147.79}. [#ah]It rose about {four percent|4%} after hours, [#e]and closed the next day at {one fifty-nine thirty-one|$159.31}, up {seven point eight percent|7.8%}.`),
      C('s26', 'c', 'after', { k: 'compare' }, `[#y]How did your call do? This time the outlook lifted the stock. [#a]Compare Apple's call: a beat, but guidance below expectations, and the stock fell about {seven percent|7%}. [#b]Same lesson both times: the outlook matters most.`),
      C('s27', 'n', 'flash', { k: 'flash' }, `Three months earlier, the story was different. [#r]In its first report in August, SpaceX also beat, [#c]but capex of {eighteen point four billion|$18.4 billion} blew past the roughly {thirteen billion|$13 billion} expected, [#l]and the first lockup release, when some insiders could start selling, came on {August sixth|August 6}. [#d]The stock closed down {thirteen point six percent|13.6%} the day after the report, at {one oh eight twenty-seven|$108.27}.`),
      C('s28', 'c', 'flash', { k: 'next' }, `The lesson for a fast grower: watch growth and guidance, and also the cash it burns, the shares it adds and where the profit comes from. The next report covers the fourth quarter, in early {twenty twenty-seven|2027}. Hop hop.`),
    ],
  };

  /* ---------- parse the markup into units (one caption word or phrase each), sentences and marks ---------- */
  function parseText(src) {
    const units = [], marks = {};
    let pending = [], boundary = true;
    const add = (say, cap) => {
      if (!boundary && units.length) { const u = units[units.length - 1]; u.say += say; u.cap += cap; }
      else { units.push({ say, cap }); pending.forEach((m) => { marks[m] = units.length - 1; }); pending = []; }
      boundary = false;
    };
    const re = /\{([^}|]*)\|([^}]*)\}|\[#([\w-]+)\]|(\s+)|([^\s{[]+|[{[])/g;
    let m;
    while ((m = re.exec(src))) {
      if (m[1] != null) add(m[1], m[2]);
      else if (m[3]) pending.push(m[3]);
      else if (m[4]) boundary = true;
      else add(m[5], m[5].replace(/'/g, '’'));
    }
    const sents = []; let s0 = 0;
    units.forEach((u, i) => {
      u.w = u.say.length + 1 + (/[,:;]$/.test(u.say) ? 3 : 0);
      if (/[.?!]["”’)]*$/.test(u.say) || i === units.length - 1) { sents.push([s0, i + 1]); s0 = i + 1; }
    });
    return { units, sents, marks };
  }

  function build(script) {
    script.cues.forEach((c, i) => {
      const p = parseText(c.text);
      c.i = i; c.units = p.units; c.sents = p.sents; c.marks = p.marks;
      c.cap = p.units.map((u) => u.cap).join(' ');
      c.say = p.units.map((u) => u.say).join(' ');
      c.sentSay = p.sents.map(([a, b]) => p.units.slice(a, b).map((u) => u.say).join(' '));
    });
    applyTiming(script);
    return script;
  }

  /* Sentence times from TIMING, or an estimate (about 14.5 spoken characters a second) before the audio is rendered. */
  function applyTiming(script) {
    const T = TIMING[script.key];
    let t = 0.3;
    script.timed = !!T;
    script.cues.forEach((c, i) => {
      const row = T && T.c && T.c[i];
      const chars = c.sents.map(([a, b]) => c.units.slice(a, b).reduce((s, u) => s + u.say.length + 1, 0));
      if (row && row.length === c.sents.length * 2) {
        c.st = c.sents.map((s, k) => [row[2 * k], row[2 * k + 1]]);
      } else if (row && row.length >= 2) {
        const a = row[0], b = row[row.length - 1], tot = chars.reduce((x, y) => x + y, 0) || 1; let x = a;
        c.st = chars.map((n) => { const d = (b - a) * n / tot; const r = [x, x + d]; x += d; return r; });
      } else {
        c.st = chars.map((n) => { const s = t; t += n / 14.5; const r = [s, t]; t += 0.22; return r; });
        t += 0.13;
      }
      c.start = c.st[0][0]; c.end = c.st[c.st.length - 1][1];
      // per-unit start times, weighted by spoken length inside each sentence
      c.ut = new Array(c.units.length);
      c.sents.forEach(([a, b], k) => {
        const [s, e] = c.st[k]; let tot = 0; for (let u = a; u < b; u++) tot += c.units[u].w;
        let acc = 0; for (let u = a; u < b; u++) { c.ut[u] = s + (e - s) * acc / (tot || 1); acc += c.units[u].w; }
      });
    });
    script.dur = T && T.dur ? T.dur : t + 0.5;
    script.chapterList = script.chapters.map(([k, label], n) => {
      const first = script.cues.find((c) => c.chapter === k);
      return { k, label, n, start: n === 0 ? 0 : (first ? first.start - 0.15 : 0) };
    });
    script.chapterList.forEach((ch, n) => { const nx = script.chapterList[n + 1]; ch.end = nx ? nx.start : script.dur; });
  }

  build(APPLE); build(SPACEX);
  const SCRIPTS = { apple: APPLE, spacex: SPACEX };

  /* For the render script (node): every sentence to speak, with its speaker. */
  SML.rcCall = {
    scripts: SCRIPTS,
    parse: parseText,
    dump: () => Object.keys(SCRIPTS).map((k) => ({ key: k, file: SCRIPTS[k].file, cues: SCRIPTS[k].cues.map((c) => ({ id: c.id, speaker: c.speaker, sents: c.sentSay })) })),
  };

  /* ======================================================================
     Stage data (all real-company numbers come from SML.realco)
     ====================================================================== */
  const esc = SML.esc;
  const yoy = (a, b) => (a / b - 1) * 100;
  const B = (m, d) => F.usd(m / 1000, d == null ? 1 : d) + 'B';          // $ millions -> "$109.4B"
  const SB = (m, d) => F.susd(m / 1000, d == null ? 1 : d) + 'B';
  const Mn = (m) => F.usd(m, 0) + 'M';
  const SMn = (m) => F.susd(m, 0) + 'M';
  const P = (v, d) => F.pct(v, d == null ? 1 : d);
  const SP = (v, d) => F.spct(v, d == null ? 1 : d);
  const U0 = (v) => F.usd(v, 0);
  const AI = AP.is.cur, AY = AP.is.ya, AQ = AP.is.pq, AG = AP.call.guidance, AE = AP.expectations, AR = AP.reaction;
  const XI = SX.is.cur, XY = SX.is.ya, XQ = SX.is.pq, XE = SX.expectations, XR = SX.reaction;
  const sumK = (arr, keys) => arr.filter((r) => keys.indexOf(r.k) >= 0).reduce((s, r) => s + r.cur, 0);
  const A_CASHINV = sumK(AP.bs.assets, ['cash', 'msCur', 'msNon']);
  const A_DEBT = sumK(AP.bs.liabilities, ['cp', 'debtCur', 'debtNon']);
  const A_GM = AI.gross / AI.revenue * 100, A_GMY = AY.gross / AY.revenue * 100;
  const A_GUIDE = [AG.baseRevenue * (1 + AG.revGrowth[0] / 100), AG.baseRevenue * (1 + AG.revGrowth[1] / 100)];
  const A_EPSX = AI.epsDil - AP.tariffRefund.eps;
  const A_TTM = AP.trend.slice(-4);
  const X_DEBT = (r) => SX.bs.liabilities.filter((x) => x.k === 'debtCur' || x.k === 'debtNon').reduce((s, x) => s + x[r], 0);
  const X_CASH = (r) => SX.bs.assets.filter((x) => x.k === 'cash' || x.k === 'ms').reduce((s, x) => s + x[r], 0);
  const X_FCF9 = SX.cf9.operating[0] - SX.capex.ytd;   // nine months to Sep 2026 (FiredBunny's math)
  const XQ2 = SX.q2;
  /* Q3 call guidance, read from the outlook lines in SML.realco.spacex.call (no separate numeric fields there) */
  const X_Q1G = SX.call.guide && SX.call.guide.q1_2027Revenue ? SX.call.guide.q1_2027Revenue : (() => { const m = /\$(\d+) billion to \$(\d+) billion/.exec(SX.call.outlook[0]); return m ? [Number(m[1]) * 1000, Number(m[2]) * 1000] : [0, 0]; })();
  const X_GW = SX.call.guide && SX.call.guide.computeGWYearEnd ? SX.call.guide.computeGWYearEnd : (() => { const m = /([\d.]+) to ([\d.]+) GW/.exec(SX.call.outlook[2]); return m ? [Number(m[1]), Number(m[2])] : [0, 0]; })();
  /* Reported after the calls (research/realco.md; news reports, not company figures). */
  const A_TARGETS = [['Barclays', 245], ['JPMorgan', 340], ['Morgan Stanley', 360], ['BofA', 380], ['TD Cowen', 400]];
  /* Hoppy's Coffee Cart, the shared everyday example (SPEC-realco.md). */
  const HOP = { sales: [10000, 8000], gross: [6000, 4400], rd: [500, 400], sga: [1500, 1400], op: [4000, 2600], net: [3040, 1920], shares: 1000, eps: [3.04, 1.92], cash: 6000, loan: 5000, dep: 200 };

  const QA = {
    apple: [
      { firm: 'Evercore', q: 'How much of the slowdown is supply, and how much is currency?', a: [['CFO', `Both: a currency drag about ${AG.fxHeadwindPts} points bigger than in June, plus tighter supply.`], ['CEO', 'The bottleneck: scarce advanced chips, with demand very strong.']] },
      { firm: 'Goldman Sachs', q: 'What will the new Siri cost to run?', a: [['CEO', 'Too early for a full plan to recover those costs; perhaps higher iCloud+ tiers.']] },
      { firm: 'Morgan Stanley', q: 'How is Apple thinking about prices?', a: [['CEO', 'Prices went up reluctantly, because memory costs jumped so much.']] },
      { firm: 'Bank of America', q: 'How much data-center capacity will Siri AI need, and what about competition?', a: [['CEO', 'A mix of outside cloud services and Apple’s own data centers.'], ['John Ternus', 'On competition: Apple sees a big opportunity in AI.']] },
      { firm: 'JPMorgan', q: 'Why does gross margin dip in September?', a: [['CFO', 'Memory costs explain all of the dip, and more.']] },
    ],
    spacex: [
      { firm: 'JPMorgan', q: 'Where will the power for the new data centers come from, and how will all that capex be funded?', a: [['Why it matters', 'Power and money set how fast the new data centers can come online.']] },
      { firm: 'Deutsche Bank', q: 'Could SpaceX combine with Tesla?', a: [['The answer', 'Both companies formed special committees of independent directors. No terms have been agreed.']] },
    ],
  };

  const CPS = {
    tariff: { kind: 'quiz', q: `Gross margin jumped to ${P(A_GM)}. How much of that came from temporary tariff refunds?`, opts: ['None of it', `About ${AP.tariffRefund.grossMarginPts} points`, 'About 10 points'], ans: 1,
      ok: `Right. Tariff refunds added about ${AP.tariffRefund.grossMarginPts} points of margin and ${F.usd(AP.tariffRefund.eps)} of EPS. Listen for it next.`,
      no: `It was about ${AP.tariffRefund.grossMarginPts} points of margin, plus ${F.usd(AP.tariffRefund.eps)} of EPS: a temporary boost, so investors strip it out.` },
    seg: (() => { const si = SX.segments.cur.find((q) => q.k === 'ai'); const sh = P(si.revenue / XI.revenue * 100, 0);
      return { kind: 'quiz', q: 'Which SpaceX business brought in the most revenue in the September quarter?', opts: ['Starlink (Connectivity)', 'Super Intelligence (AI, Cursor, X)', 'Space (launches, Starship)'], ans: 1,
        ok: `Right. Super Intelligence brought in ${B(si.revenue)}, about ${sh} of all revenue. Starlink still earns the most operating profit.`,
        no: `It was Super Intelligence: ${B(si.revenue)}, about ${sh} of all revenue. Starlink still earns the most operating profit.` }; })(),
    dir: { kind: 'predict', q: '', opts: ['Up', 'Down', 'Barely moves'], ans: 1 },
  };
  const dirQ = (k) => k === 'apple'
    ? { q: 'Revenue and EPS beat. Before the guidance: what does the stock do tomorrow?', ans: 1 }
    : { q: `A big beat, a first profit as a public company and a Q1 2027 revenue guide of ${B(X_Q1G[0], 0)}–${F.num(X_Q1G[1] / 1000, 0)}B vs about ${B(XE.q1_2027Revenue)} expected. But Q4 capex could reach ${B(SX.capex.q4Guide[1], 0)}. The next day?`, ans: 0 };

  /* ---------- small icons (stroke = currentColor, colored by the parent's class) ---------- */
  const ic = (d, cls) => `<svg class="rcc-ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    target: ic('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>'),
    chart: ic('<path d="M4 19h16M6 16l4-5 3 3 5-7"/><path d="M15 7h3v3"/>'),
    search: ic('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>'),
    chip: ic('<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3"/>'),
    mem: ic('<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M6 11h2v2H6zM10 11h2v2h-2zM14 11h2v2h-2zM6 16v2M10 16v2M14 16v2M18 16v2"/>'),
    tag: ic('<path d="M3.5 12.5l8-8h7v7l-8 8z"/><circle cx="15" cy="9" r="1.3"/>'),
    ai: ic('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
    phone: ic('<rect x="7" y="3" width="10" height="18" rx="2.2"/><path d="M11 18h2"/>'),
    coin: ic('<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2 2.7.9 2.7 2.1-1.2 2-2.7 2c-1.2 0-2.2-.5-2.7-1.4M12 6v1.8M12 16.2V18"/>'),
    gauge: ic('<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.2"/>'),
    star: ic('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
    q: ic('<path d="M4 5h16v11H9l-5 4z"/><path d="M10 9.3a2 2 0 1 1 2.7 1.9c-.5.2-.7.6-.7 1.1v.4M12 14.4v.1"/>'),
    mic: ic('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>'),
    doc: ic('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15h6M9 18h4"/>'),
    cal: ic('<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/>'),
    sat: ic('<rect x="9.5" y="9.5" width="5" height="5" rx="1" transform="rotate(45 12 12)"/><path d="M8 8L4.5 4.5M16 16l3.5 3.5M5 9l-2 2 4 4 2-2M15 19l2 2 4-4-2-2"/>'),
  };
  /* Hoppy's cart: a little coffee cart with an umbrella. */
  const CART = `<svg class="rcc-cart" viewBox="0 0 48 40" aria-hidden="true"><path class="rcc-ca" d="M8 13c2-6 9-9 16-9s14 3 16 9z"/><path class="rcc-cb" d="M24 4v9"/><rect class="rcc-cc" x="9" y="16" width="30" height="13" rx="2"/><path class="rcc-cb" d="M9 21h30M39 18h5"/><circle class="rcc-cd" cx="15" cy="33" r="3.6"/><circle class="rcc-cd" cx="33" cy="33" r="3.6"/><path class="rcc-ce" d="M19 11.5c0-1.5 1-1.5 1-3M23.5 11.5c0-1.5 1-1.5 1-3M28 11.5c0-1.5 1-1.5 1-3"/></svg>`;

  /* ======================================================================
     CSS (tokens only)
     ====================================================================== */
  SML.css(`
    .rcc{position:relative}
    .rcc [hidden]{display:none!important}
    .rcc .rcc-ic{width:20px;height:20px;flex:0 0 20px;margin:0!important;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
    .rcc .fb-mark{margin:0!important}
    .rcc-bar{gap:10px 14px}
    .rcc-head{display:flex;flex-direction:column;gap:4px;min-width:0}
    .rcc-name{font:600 15px/1.25 var(--sans);color:var(--ink)}
    .rcc-name small{font:500 12px var(--sans);color:var(--muted);margin-left:6px}
    .rcc-n .rcc-name small{display:block;margin:2px 0 0}
    .rcc-n .rcc-cn{display:none}
    .rcc-n .rcc-opts .rcc-lab{display:none}
    .rcc-n .rcc-opts{gap:8px}
    .rcc-main{display:flex;flex-direction:column;min-width:0}
    .rcc.rcc-wide .rcc-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,34%)}
    .rcc-left{display:flex;flex-direction:column;min-width:0}
    .rcc-right{border-top:1px solid var(--line);min-width:0;display:flex;flex-direction:column}
    .rcc.rcc-wide .rcc-right{border-top:0;border-left:1px solid var(--line);position:relative}
    .rcc.rcc-wide .rcc-rin{position:absolute;inset:0}
    .rcc-rin{display:flex;flex-direction:column;min-height:0}
    .rcc-stage{padding:0!important;position:relative;overflow:hidden;outline:none}
    .rcc-top{display:flex;align-items:center;gap:8px;padding:10px 12px 0;min-height:38px;position:relative;z-index:1}
    .rcc-top .grow{flex:1 1 auto}
    .rcc-who{display:inline-flex;align-items:center;gap:7px;padding:3px 10px 3px 3px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font:600 10.5px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
    .rcc-who .av{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;overflow:hidden}
    .rcc-who .av .rcc-ic{width:14px;height:14px;flex-basis:14px}
    .rcc-who .av .fb-mark{width:22px;height:22px;filter:none}
    .rcc-who.n{color:var(--info);border-color:color-mix(in srgb,var(--info) 45%,var(--line))}
    .rcc-who.n .av{background:color-mix(in srgb,var(--info) 20%,var(--surface))}
    .rcc-who.c{color:var(--flame);border-color:color-mix(in srgb,var(--flame) 50%,var(--line))}
    .rcc-chap{font:500 10.5px/1.25 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .rcc-live{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--muted);margin-right:6px;vertical-align:1px}
    .rcc.playing .rcc-live{background:var(--flame);animation:rcc-pulse 1.4s ease-in-out infinite}
    @keyframes rcc-pulse{50%{opacity:.25}}
    .rcc-scene{position:relative;overflow:hidden;padding:6px 14px 12px;display:flex;flex-direction:column}
    .rcc-scene > *{min-width:0;flex:0 0 auto}
    .rcc-scene > :first-child{margin-top:auto}
    .rcc-scene > :last-child{margin-bottom:auto}
    .rcc-scene svg{display:block;margin:0 auto;overflow:visible}
    .rcc-lab{font:600 10.5px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .rcc-fade{transition:opacity .35s ease,transform .35s ease}
    .rcc-hide{opacity:0;transform:translateY(6px)}
    .rcc-dim{opacity:.38}
    .rcc .up{color:var(--up)} .rcc .dn{color:var(--down)} .rcc .acc{color:var(--accent)} .rcc .vio{color:var(--violet)} .rcc .info{color:var(--info)} .rcc .flame{color:var(--flame)}
    .rcc svg .f-flame{fill:var(--flame)} .rcc svg .s-flame{stroke:var(--flame)} .rcc svg text.flame{fill:var(--flame)}
    .rcc svg .f-flame-t{fill:var(--flame-t)}
    .rcc svg .hatch{fill:url(#rcc-hatch)}
    /* big number */
    .rcc-big{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:center}
    .rcc-n .rcc-big{grid-template-columns:1fr;gap:12px}
    .rcc-bigl{display:flex;flex-direction:column;gap:6px;min-width:0}
    .rcc-num{font-family:var(--display);font-weight:400;font-size:76px;line-height:.9;color:var(--ink);letter-spacing:.01em;font-variant-numeric:tabular-nums}
    .rcc-n .rcc-num{font-size:60px}
    .rcc-chip{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;padding:4px 10px;border-radius:999px;border:1px solid var(--line);font:600 12px/1.2 var(--mono);background:var(--surface)}
    .rcc-chip.up{color:var(--up);border-color:color-mix(in srgb,var(--up) 45%,var(--line));background:color-mix(in srgb,var(--up) 9%,var(--surface))}
    .rcc-chip.dn{color:var(--down);border-color:color-mix(in srgb,var(--down) 45%,var(--line));background:color-mix(in srgb,var(--down) 9%,var(--surface))}
    .rcc-chip.acc{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,var(--line));background:color-mix(in srgb,var(--accent) 9%,var(--surface))}
    .rcc-chip.vio{color:var(--violet);border-color:color-mix(in srgb,var(--violet) 45%,var(--line));background:color-mix(in srgb,var(--violet) 9%,var(--surface))}
    .rcc-chip.flame{color:var(--flame);border-color:color-mix(in srgb,var(--flame) 45%,var(--line));background:var(--flame-t)}
    .rcc-chip.info{color:var(--info);border-color:color-mix(in srgb,var(--info) 45%,var(--line));background:color-mix(in srgb,var(--info) 9%,var(--surface))}
    .rcc-chips{display:flex;flex-wrap:wrap;gap:6px}
    .rcc-sub{font-size:13px;color:var(--muted);line-height:1.4}
    /* horizontal bars (html) */
    .rcc-hb{display:flex;flex-direction:column;gap:8px}
    .rcc-hr{display:grid;grid-template-columns:minmax(64px,auto) minmax(0,1fr) auto auto;gap:4px 10px;align-items:center;font-size:13px;color:var(--text);transition:opacity .35s}
    .rcc-n .rcc-hr{grid-template-columns:minmax(56px,auto) minmax(0,1fr) auto auto;gap:4px 8px;font-size:12px}
    .rcc-hr .l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .rcc-hr .t{height:14px;background:color-mix(in srgb,var(--ink) 7%,transparent);border-radius:3px;overflow:hidden}
    .rcc-hr .t i{display:block;height:100%;width:0;background:var(--info);border-radius:3px}
    .rcc-hr.on .t i{background:var(--accent)}
    .rcc-hr .t i.mut{background:var(--input)}
    .rcc-hr b{font:600 13px var(--mono);color:var(--ink);text-align:right}
    .rcc-hr em{font:600 11.5px var(--mono);font-style:normal;text-align:right;min-width:52px}
    .rcc-hr.dim{opacity:.38}
    .rcc-hr.on .l{color:var(--ink);font-weight:600}
    /* tiles */
    .rcc-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
    .rcc-n .rcc-tiles{grid-template-columns:1fr;gap:7px}
    .rcc-tile{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--muted);transition:opacity .35s,border-color .35s,background-color .35s;opacity:.4}
    .rcc-n .rcc-tile{padding:8px 10px}
    .rcc-n .rcc-tiles.two{grid-template-columns:1fr 1fr}
    .rcc-n .rcc-tiles.segs{gap:5px}
    .rcc-n .rcc-tiles.segs .rcc-tile{padding:5px 10px;gap:1px!important}
    .rcc-n .rcc-tiles.segs .rcc-tile b.mono{font-size:15px!important}
    .rcc-n .rcc-tiles.two .rcc-tile{padding:7px 8px;gap:6px}
    .rcc-n .rcc-tiles.two .rcc-tile b{font-size:13px}
    .rcc-n .rcc-tiles.two .rcc-ic{width:16px;height:16px;flex-basis:16px}
    .rcc-tile b{display:block;font:600 14px/1.3 var(--sans);color:var(--ink)}
    .rcc-tile span{display:block;font-size:12.5px;line-height:1.4;color:var(--muted);margin-top:2px}
    .rcc-tile.on{opacity:1;color:var(--accent);border-color:color-mix(in srgb,var(--accent) 50%,var(--line));background:color-mix(in srgb,var(--accent) 7%,var(--surface))}
    .rcc-tile.base{opacity:1}
    .rcc-quote{font:italic 600 17px/1.35 var(--sans);color:var(--ink);padding-left:12px;border-left:3px solid var(--flame);margin-bottom:12px}
    .rcc-n .rcc-quote{font-size:15px;margin-bottom:8px}
    /* title card */
    .rcc-ttl{display:flex;flex-direction:column;gap:6px;align-items:flex-start}
    .rcc-co{font-family:var(--display);font-size:64px;line-height:.9;color:var(--ink);letter-spacing:.02em}
    .rcc-n .rcc-co{font-size:42px}
    .rcc-ttl-top{display:flex;align-items:center;gap:12px}
    .rcc-ttl-t{font:600 18px/1.3 var(--sans);color:var(--ink)}
    .rcc-n .rcc-ttl-t{font-size:15px}
    .rcc-n .rcc-ttl{gap:4px}
    .rcc-n .rcc-wave{height:26px;margin:2px 0}
    .rcc-n .rcc-ppl{gap:6px 12px}
    .rcc-n .rcc-ppl li i{width:26px;height:26px}
    .rcc-ttl-w{font:500 12.5px var(--mono);color:var(--muted)}
    .rcc-wave{display:flex;align-items:center;gap:3px;height:34px;margin:4px 0}
    .rcc-wave i{display:block;width:4px;border-radius:2px;background:var(--flame);opacity:.75;height:6px}
    .rcc-ppl{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px 14px}
    .rcc-ppl li{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--muted);transition:opacity .35s,color .35s}
    .rcc-ppl li i{font:600 10.5px var(--mono);font-style:normal;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--input);color:var(--ink);background:var(--surface-2)}
    .rcc-ppl li.dim{opacity:.35}
    .rcc-ppl li.on{color:var(--ink)} .rcc-ppl li.on i{border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
    /* safe-harbor doc */
    .rcc-doc{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:16px;align-items:center}
    .rcc-n .rcc-doc{grid-template-columns:1fr;gap:10px}
    .rcc-paper{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:14px;display:flex;flex-direction:column;gap:7px}
    .rcc-n .rcc-paper{padding:10px;gap:5px}
    .rcc-paper b{font:600 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink)}
    .rcc-paper i{display:block;height:6px;border-radius:3px;background:var(--input);opacity:.6}
    .rcc-paper i.s{width:62%}
    .rcc-paper em{font:500 12px/1.4 var(--sans);font-style:normal;color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);border-radius:3px;padding:2px 5px}
    .rcc-stamp{display:inline-block;transform:rotate(-3deg);font:700 13px/1.2 var(--mono);letter-spacing:.12em;text-transform:uppercase;border:2px solid currentColor;border-radius:6px;padding:6px 10px;margin-bottom:4px}
    .rcc-docs{display:flex;flex-direction:column;gap:6px}
    .rcc-docs p{font-size:13.5px;line-height:1.45;color:var(--text);margin:0 0 6px}
    .rcc-n .rcc-docs p{font-size:12.5px;margin-bottom:2px}
    /* hoppy card */
    .rcc-hop{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:16px;align-items:center}
    .rcc-n .rcc-hop{grid-template-columns:1fr;gap:8px}
    .rcc-hopc{background:var(--surface);border:1px solid color-mix(in srgb,var(--flame) 40%,var(--line));border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;box-shadow:0 10px 30px -18px var(--raise)}
    .rcc-n .rcc-hopc{padding:9px 11px;gap:4px}
    .rcc-hoph{display:flex;align-items:center;gap:10px;margin-bottom:2px}
    .rcc-hoph b{display:block;font:600 14px var(--sans);color:var(--ink)}
    .rcc-hoph span{display:block;font:500 10.5px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
    .rcc .rcc-cart{width:44px;height:36px;flex:0 0 44px;margin:0!important}
    .rcc-n .rcc-cart{width:36px;height:30px;flex-basis:36px}
    .rcc-cart .rcc-ca{fill:var(--flame)} .rcc-cart .rcc-cb{fill:none;stroke:var(--muted);stroke-width:1.6}
    .rcc-cart .rcc-cc{fill:var(--surface-2);stroke:var(--gold);stroke-width:1.6} .rcc-cart .rcc-cd{fill:var(--bg);stroke:var(--ink);stroke-width:1.6}
    .rcc-cart .rcc-ce{fill:none;stroke:var(--muted);stroke-width:1.2;stroke-linecap:round}
    .rcc-hr2{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:baseline;padding:5px 8px;border-radius:5px;font-size:13.5px;color:var(--text);transition:background-color .3s,opacity .3s}
    .rcc-n .rcc-hr2{font-size:12.5px;padding:3px 6px;gap:8px}
    .rcc-hr2 b{font:600 13.5px var(--mono);color:var(--ink);text-align:right}
    .rcc-hr2 em{font:500 12px var(--mono);font-style:normal;color:var(--muted);text-align:right;min-width:58px}
    .rcc-hr2.h{font:600 10px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding-top:0;padding-bottom:0}
    .rcc-hr2.h b,.rcc-hr2.h em{font:600 10px var(--mono);color:var(--muted)}
    .rcc-hr2.on{background:color-mix(in srgb,var(--flame) 12%,transparent)}
    .rcc-hr2.on span{color:var(--ink);font-weight:600}
    .rcc-hr2.on em{color:var(--ink);font-weight:600}
    .rcc .rcc-fq rect{fill:var(--surface);stroke:var(--input);stroke-width:1.5}
    .rcc .rcc-fq text{font-size:30px;fill:var(--muted)}
    .rcc .rcc-n .rcc-fq text{font-size:24px}
    .rcc .rcc-fq.rcc-on rect{fill:var(--accent-t);stroke:var(--accent);stroke-width:2}
    .rcc .rcc-fq.rcc-on text{fill:var(--accent)}
    .rcc-hr2.tot{border-top:1px solid var(--line);border-radius:0 0 5px 5px}
    .rcc-hr2.hide{opacity:.25}
    .rcc-hopq{font:italic 600 16px/1.4 var(--sans);color:var(--ink);background:var(--surface-2);border-radius:10px 10px 10px 2px;padding:9px 12px;align-self:flex-start}
    .rcc-hopn{font-size:13px;line-height:1.45;color:var(--text);margin:2px 0 0}
    .rcc-n .rcc-hopn{font-size:12.5px}
    .rcc-hops{display:flex;flex-direction:column;gap:5px;padding:12px 14px;border-left:3px solid var(--info);background:color-mix(in srgb,var(--info) 6%,transparent);border-radius:0 8px 8px 0}
    .rcc-n .rcc-hops{padding:7px 10px;gap:2px;flex-direction:row;flex-wrap:wrap;align-items:baseline;column-gap:8px}
    .rcc-hops b{font-family:var(--display);font-weight:400;font-size:34px;line-height:1;color:var(--ink)}
    .rcc-n .rcc-hops b{font-size:22px}
    .rcc-hops small{font-size:12.5px;line-height:1.4;color:var(--muted)}
    /* statement */
    .rcc-st{display:flex;flex-direction:column}
    .rcc-sr{display:grid;grid-template-columns:minmax(0,1fr) 92px 92px 74px;gap:8px;align-items:center;padding:3px 8px;border-radius:4px;font-size:13px;color:var(--muted);transition:opacity .3s,background-color .3s,color .3s}
    .rcc-n .rcc-sr{grid-template-columns:minmax(0,1fr) 78px 64px;font-size:12px;padding:2px 6px;gap:6px}
    .rcc-n .rcc-sr .ya{display:none}
    .rcc-sr b,.rcc-sr .ya,.rcc-sr em{font:500 12.5px var(--mono);font-style:normal;text-align:right;color:inherit}
    .rcc-n .rcc-sr b,.rcc-n .rcc-sr em{font-size:11.5px}
    .rcc-sr.h{font:600 10px var(--mono);letter-spacing:.12em;text-transform:uppercase}
    .rcc-sr.h b,.rcc-sr.h .ya,.rcc-sr.h em{font:600 10px var(--mono)}
    .rcc-sr.sub{color:var(--text);border-top:1px solid var(--line);border-radius:0}
    .rcc-sr.sub b{font-weight:600}
    .rcc-sr.on{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--ink)}
    .rcc-sr.on b{color:var(--accent);font-weight:700}
    /* equation */
    .rcc-eq{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .rcc-n .rcc-eq{gap:6px}
    .rcc-eq > i{font:600 20px var(--mono);font-style:normal;color:var(--muted)}
    .rcc-box{display:flex;flex-direction:column;gap:3px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);min-width:0}
    .rcc-n .rcc-box{padding:6px 8px}
    .rcc-box small{font:600 9.5px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
    .rcc-box b{font-family:var(--display);font-weight:400;font-size:34px;line-height:1;color:var(--ink)}
    .rcc-n .rcc-box b{font-size:25px}
    .rcc-box.hl{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));background:color-mix(in srgb,var(--accent) 8%,var(--surface))}
    .rcc-box.hl b{color:var(--accent)}
    .rcc-stack{display:flex;height:30px;border-radius:5px;overflow:hidden;background:color-mix(in srgb,var(--ink) 6%,transparent)}
    .rcc-stack i{display:flex;align-items:center;justify-content:center;font:600 11.5px var(--mono);font-style:normal;color:var(--on);white-space:nowrap;overflow:hidden;width:0}
    .rcc-stack .a{background:var(--info)} .rcc-stack .b{background:var(--accent);color:var(--on-acc)} .rcc-stack .c{background:var(--flame)} .rcc-stack .m{background:var(--input);color:var(--ink)}
    .rcc-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}
    .rcc-n .rcc-cols{grid-template-columns:1fr;gap:8px}
    /* q&a */
    .rcc-qa{display:flex;flex-direction:column;gap:9px}
    .rcc-qah{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .rcc-qq{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px 10px 10px 2px;background:color-mix(in srgb,var(--info) 9%,var(--surface));border:1px solid color-mix(in srgb,var(--info) 35%,var(--line));color:var(--info)}
    .rcc-qq p,.rcc-qa-a p{margin:0;font:600 15px/1.4 var(--sans);color:var(--ink)}
    .rcc-n .rcc-qq p,.rcc-n .rcc-qa-a p{font-size:13px;line-height:1.35}
    .rcc-n .rcc-qa{gap:7px}
    .rcc-n .rcc-qq{padding:7px 10px;gap:8px}
    .rcc-n .rcc-qa-a{padding:6px 10px;max-width:96%}
    .rcc-qa-a{align-self:flex-end;max-width:92%;padding:9px 12px;border-radius:10px 10px 2px 10px;background:var(--surface);border:1px solid var(--line);display:flex;flex-direction:column;gap:3px}
    .rcc-qa-a p{font-weight:500}
    .rcc-qa-a span{font:600 10px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
    /* scorecard */
    .rcc-sc{display:flex;flex-direction:column;gap:4px}
    .rcc-scr{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr) 96px;gap:8px;align-items:center;padding:6px 10px;border-radius:6px;background:var(--surface);border:1px solid var(--line);font-size:13px;color:var(--text);transition:opacity .35s,border-color .35s}
    .rcc-n .rcc-scr{grid-template-columns:minmax(0,1fr) auto 64px;padding:3px 8px;font-size:12px;gap:6px;line-height:1.25}
    .rcc-n .rcc-sc{gap:3px}
    .rcc-n .rcc-scr .pill{min-height:19px;padding:0 7px;font-size:9px}
    .rcc-n .rcc-scr .x{display:none}
    .rcc-scr .x,.rcc-scr .g{font:500 12px var(--mono)}
    .rcc-scr .g{color:var(--ink);font-weight:600}
    .rcc-scr small{display:none}
    .rcc-n .rcc-scr small{display:block;font:500 10.5px var(--mono);color:var(--muted)}
    .rcc-scr.h{background:transparent;border-color:transparent;font:600 9.5px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding-top:0;padding-bottom:0}
    .rcc-scr.h .x,.rcc-scr.h .g{font:600 9.5px var(--mono);color:var(--muted)}
    .rcc-scr.dim{opacity:.35}
    .rcc-scr.on{border-color:var(--input)}
    .rcc-scr .pill{justify-self:end}
    /* checkpoint */
    .rcc-cp{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;padding:12px;background:color-mix(in srgb,var(--bg) 80%,transparent);backdrop-filter:blur(2px)}
    .rcc-cpc{width:100%;max-width:540px;max-height:100%;overflow:auto;background:var(--surface);border:1px solid color-mix(in srgb,var(--flame) 50%,var(--line));border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;box-shadow:0 18px 40px -18px var(--raise)}
    .rcc-cpq{margin:0;font:600 16px/1.4 var(--sans);color:var(--ink)}
    .rcc-n .rcc-cpq{font-size:14.5px}
    .rcc-cpo{display:flex;flex-wrap:wrap;gap:8px}
    .rcc-cpo button{flex:1 1 120px;min-height:40px;padding:6px 12px;border-radius:8px;border:1px solid var(--input);background:var(--bg);color:var(--ink);font:600 13.5px var(--sans);cursor:pointer}
    .rcc-cpo button:hover{border-color:var(--accent)}
    .rcc-cpo button.pick{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,var(--bg))}
    .rcc-cpo button.ok{border-color:var(--up);background:color-mix(in srgb,var(--up) 14%,var(--bg))}
    .rcc-cpo button.bad{border-color:var(--down);background:color-mix(in srgb,var(--down) 12%,var(--bg))}
    .rcc-cpf{margin:0;font-size:13.5px;line-height:1.45;color:var(--text)}
    .rcc-cpa{display:flex;gap:8px;align-items:center;justify-content:space-between}
    .rcc-skip{background:none;border:0;color:var(--muted);font:500 12.5px var(--sans);text-decoration:underline;cursor:pointer;padding:6px 2px}
    /* caption */
    .rcc-cap{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-top:1px solid var(--line);background:var(--surface);border-left:4px solid var(--info)}
    .rcc-cap.c{border-left-color:var(--flame)}
    .rcc-cap .who{flex:0 0 auto;font:600 10px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--info);padding-top:5px;width:62px}
    .rcc-cap.c .who{color:var(--flame)}
    .rcc-cap p{margin:0;font:500 17px/1.5 var(--sans);color:color-mix(in srgb,var(--ink) 42%,transparent);min-width:0}
    .rcc-n .rcc-cap{padding:10px 12px;flex-direction:column;gap:4px}
    .rcc-n .rcc-cap .who{width:auto;padding-top:0}
    .rcc-n .rcc-cap p{font-size:15.5px}
    .rcc-cap .w{border-radius:3px;transition:color .12s}
    .rcc-cap .w.p{color:var(--ink)}
    .rcc-cap .w.k{color:var(--ink);background:color-mix(in srgb,var(--info) 26%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--info) 26%,transparent)}
    .rcc-cap.c .w.k{background:color-mix(in srgb,var(--flame) 26%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--flame) 26%,transparent)}
    .rcc-cap.idle p{color:var(--text)}
    /* transport */
    .rcc-tp{display:flex;align-items:center;gap:14px;padding:12px 16px;border-top:1px solid var(--line)}
    .rcc-play{width:58px;height:58px;flex:0 0 58px;border-radius:50%;border:0;background:var(--accent);color:var(--on-acc);display:grid;place-items:center;cursor:pointer;box-shadow:0 0 0 6px color-mix(in srgb,var(--accent) 16%,transparent);transition:filter .15s,transform .1s}
    .rcc-play:hover{filter:brightness(1.08)} .rcc-play:active{transform:scale(.97)}
    .rcc-play svg{width:24px;height:24px;fill:currentColor}
    .rcc-play.busy{animation:rcc-pulse 1s ease-in-out infinite}
    .rcc-tpm{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:6px}
    .rcc-scrub{position:relative;height:24px;cursor:pointer;touch-action:none;outline:none;border-radius:4px}
    .rcc-scrub:focus-visible{box-shadow:0 0 0 2px var(--accent)}
    .rcc-sg{position:absolute;left:0;right:0;top:9px;height:6px;display:flex;gap:3px}
    .rcc-sg > i{display:block;height:100%;background:var(--input);border-radius:3px;overflow:hidden;position:relative;min-width:2px}
    .rcc-sg > i > b{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--accent)}
    .rcc-th{position:absolute;top:5px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:var(--ink);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 50%,transparent);pointer-events:none}
    .rcc-cpm{position:absolute;top:7px;width:10px;height:10px;margin-left:-5px;transform:rotate(45deg);background:var(--flame);border:2px solid var(--surface);pointer-events:none}
    .rcc-cpm.done{background:var(--up)}
    .rcc-tr{display:flex;align-items:center;gap:8px;min-width:0}
    .rcc-tr .grow{flex:1 1 auto}
    .rcc-time{font:500 12px var(--mono);color:var(--muted);white-space:nowrap}
    .rcc-cn{font:500 11.5px var(--sans);color:var(--text);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .rcc-ib{width:34px;height:34px;flex:0 0 34px;border-radius:50%;border:1px solid var(--line);background:var(--bg);color:var(--ink);display:grid;place-items:center;cursor:pointer}
    .rcc-ib:hover{border-color:var(--input)}
    .rcc-ib svg{width:15px;height:15px;fill:currentColor}
    .rcc-opts{display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px;padding:10px 16px;border-top:1px solid var(--line)}
    .rcc-opts > span{display:flex;align-items:center;gap:8px}
    .rcc-opts .rcc-lab{font-size:9.5px}
    .rcc-fb{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;padding:12px 16px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--accent) 8%,var(--surface))}
    .rcc-fb p{margin:0;font-size:13.5px;line-height:1.45;color:var(--text);flex:1 1 220px}
    /* transcript */
    .rcc-tabs{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line)}
    .rcc-list{overflow:auto;max-height:340px;padding:4px 0 10px;overscroll-behavior:contain}
    .rcc.rcc-wide .rcc-list{max-height:none;flex:1 1 auto;min-height:0}
    .rcc-chh{display:flex;justify-content:space-between;gap:8px;width:100%;border:0;background:transparent;cursor:pointer;font:600 10.5px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);padding:12px 14px 4px;text-align:left}
    .rcc-chh span:last-child{color:var(--muted);letter-spacing:.04em}
    .rcc-li{display:grid;grid-template-columns:40px minmax(0,1fr);gap:2px 8px;width:100%;text-align:left;padding:7px 14px 7px 11px;border:0;border-left:3px solid transparent;background:transparent;color:var(--text);font:400 13.5px/1.45 var(--sans);cursor:pointer}
    .rcc-li:hover{background:var(--surface-2)}
    .rcc-li.on{background:color-mix(in srgb,var(--accent) 9%,var(--surface));border-left-color:var(--accent);color:var(--ink)}
    .rcc-li .ts{font:500 11px/1.9 var(--mono);color:var(--muted)}
    .rcc-li .sp{display:block;font:600 9.5px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--info);margin-bottom:1px}
    .rcc-li .sp.c{color:var(--flame)}
    .rcc-li .cpt{color:var(--flame);font:600 9.5px var(--mono);letter-spacing:.1em;text-transform:uppercase;margin-left:6px}
    .rcc-chl{list-style:none;margin:0;padding:6px 0}
    .rcc-chl button{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;width:100%;border:0;border-left:3px solid transparent;background:transparent;color:var(--text);text-align:left;padding:10px 14px 10px 11px;cursor:pointer;font:500 14px var(--sans)}
    .rcc-chl button:hover{background:var(--surface-2)}
    .rcc-chl button.on{border-left-color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,var(--surface));color:var(--ink)}
    .rcc-chl .n{font:600 12px var(--mono);color:var(--accent)}
    .rcc-chl .d{font:500 11.5px var(--mono);color:var(--muted)}
    .rcc-note{display:flex;flex-direction:column;gap:4px;font-size:12px!important;line-height:1.5}
    .rcc-note a{color:var(--accent)}
    @media (prefers-reduced-motion: reduce){.rcc *{transition:none!important;animation:none!important}}
  `);

  /* ======================================================================
     Scenes. Each returns HTML for the stage; x.A(spec) registers an animation and returns an element id.
     Animations run on the cue's own clock (seconds since the cue started), so pausing and seeking just work.
     ====================================================================== */
  const SC = {};
  const tileHTML = (x, items, hi, cls) => `<div class="rcc-tiles${cls ? ' ' + cls : ''}">${items.map((it) => {
    const isHi = hi && it.k === hi;
    const t0 = hi ? (isHi ? (x.has(it.k) ? x.m(it.k) : 0.2) : null) : (it.k && x.has(it.k) ? x.m(it.k) : 0.15);
    const id = t0 == null ? '' : x.A({ k: 'cls', cls: 'on', t0 });
    return `<div class="rcc-tile${hi && !isHi ? ' base' : ''}"${id ? ` id="${id}"` : ''}>${ICON[it.ic] || ''}<div><b>${it.t}</b>${it.s ? `<span>${it.s}</span>` : ''}</div></div>`;
  }).join('')}</div>`;

  SC.title = (x) => {
    const s = x.script, n = x.narrow ? 30 : 46;
    const wave = x.A({ k: 'wave', n });
    return `<div class="rcc-ttl">
      <div class="rcc-ttl-top"><span class="rcc-co">${esc(s.company)}</span><span class="pill acc">${s.ticker}</span></div>
      <div class="rcc-ttl-t">${esc(s.title)}</div>
      <div class="rcc-ttl-w">${esc(s.when)}${x.narrow ? '' : '<br>' + esc(s.sub)}</div>
      <div class="rcc-wave" id="${wave}">${'<i></i>'.repeat(n)}</div>
      <ul class="rcc-ppl">${s.people.map(([ini, label, k, short]) => {
        let id = '';
        if (x.show.ppl) id = x.A({ k: 'cls', cls: 'on', t0: x.has(k) ? x.m(k) : (x.has('ppl') ? x.m('ppl') : 9e9) });
        return `<li${id ? ` id="${id}"` : ''} title="${esc(label)}"><i>${ini}</i><span>${esc(x.narrow ? short : label)}</span></li>`;
      }).join('')}</ul></div>`;
  };

  SC.fiscal = (x) => {
    const W = x.W - 28, H = x.H - 18, pad = 2, cw = (W - pad * 2) / 12;
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const y0 = Math.round(H * 0.26), bh = Math.round(H * 0.26);
    let s = `<text x="${pad}" y="14" class="cap">Apple’s fiscal year 2026</text>`;
    s += `<text x="${pad}" y="${y0 - 10}" class="sm mut">2025</text><text x="${pad + cw * 3 + 4}" y="${y0 - 10}" class="sm mut">2026</text>`;
    s += `<line x1="${pad + cw * 3}" y1="${y0 - 24}" x2="${pad + cw * 3}" y2="${y0 + bh + 26}" class="s-line dash2"/>`;
    for (let q = 0; q < 4; q++) {
      const x0 = pad + q * 3 * cw + 2, w = cw * 3 - 4;
      const id = q === 2 ? x.A({ k: 'cls', cls: 'rcc-on', t0: x.m('q3', 0.4) }) : '';
      s += `<g${id ? ` id="${id}"` : ''} class="rcc-fq${q === 2 ? ' q3' : ''}"><rect x="${(x0).toFixed(1)}" y="${y0}" width="${w.toFixed(1)}" height="${bh}" rx="6"/>`;
      s += `<text x="${(x0 + w / 2).toFixed(1)}" y="${y0 + bh / 2 + 6}" text-anchor="middle" class="disp">Q${q + 1}</text></g>`;
      for (let k = 0; k < 3; k++) { const mx = pad + (q * 3 + k) * cw + cw / 2; s += `<text x="${mx.toFixed(1)}" y="${y0 + bh + 16}" text-anchor="middle" class="xs mut">${x.narrow ? months[q * 3 + k][0] : months[q * 3 + k]}</text>`; }
    }
    const qx = pad + 7.5 * cw, ay = y0 + bh + 30;
    const lab = x.A({ k: 'op', t0: x.m('q3', 0.4) + 0.2 });
    s += `<g id="${lab}"><path d="M${qx} ${ay + 26}V${ay}" class="nf s-flame w2"/><path d="M${qx - 5} ${ay + 7}l5-7 5 7" class="nf s-flame w2"/>`;
    const lx = x.narrow ? W / 2 : Math.min(qx, W - 10), la = x.narrow ? 'middle' : (qx > W * 0.6 ? 'end' : 'middle');
    s += `<text x="${lx}" y="${ay + 44}" text-anchor="${la}" class="md ink b">This call: April to June = fiscal Q3</text>`;
    s += `<text x="${lx}" y="${ay + 62}" text-anchor="${la}" class="sm mut">${x.narrow ? 'The fiscal year ends in late September' : 'The fiscal year ends in late September · next up: Q4 (July to September)'}</text></g>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Apple’s fiscal year: October to September, so April to June is the third quarter">${s}</svg>`;
  };

  SC.doc = (x) => {
    const g = x.show.step === 'gaap';
    const s1 = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('s', 0.2), inv: true });
    const s2 = x.show.nongaap ? x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('n', 0.6), inv: true }) : '';
    return `<div class="rcc-doc">
      <div class="rcc-paper"><b>Safe harbor statement</b>${x.narrow ? '' : '<i></i><i class="s"></i>'}<em>This call contains forward-looking statements…</em>${x.narrow ? '' : '<i></i><i></i><i class="s"></i>'}${x.show.nongaap ? `<em>…and non-GAAP financial measures</em>${x.narrow ? '' : '<i class="s"></i>'}` : ''}</div>
      <div class="rcc-docs">
        ${g ? '' : `<div id="${s1}" class="rcc-fade"><span class="rcc-stamp acc">Forecasts can miss</span><p>${x.narrow && x.show.nongaap ? 'Talk about the future is an estimate.' : 'Anything said about the next quarter is an estimate. Real results can differ.'}</p></div>`}
        ${x.show.nongaap ? `<div id="${s2}" class="rcc-fade"><span class="rcc-stamp vio">Non-GAAP = own math</span><p>${x.narrow && !g ? '' : 'Adjusted figures leave some costs out. '}${g ? `Same quarter, two views: <b class="ink">GAAP net income ${SB(XI.netInc)}</b>, <b class="vio">adjusted EBITDA ${SB(SX.ebitda.cur)}</b>.` : (x.narrow ? 'Adjusted figures leave some costs out.' : 'Always compare them with the official GAAP numbers.')}</p></div>` : ''}
      </div></div>`;
  };

  SC.records = (x) => {
    const items = [['r1', 'Revenue', B(AI.revenue)], ['r2', 'EPS', F.usd(AI.epsDil)], ['r3', 'iPhone', B(AP.categories.cur.iPhone)], ['r4', 'Mac', B(AP.categories.cur.Mac)], ['r5', 'Services', B(AI.servSales)], ['r6', 'Operating cash flow', 'record']];
    return `<div class="rcc-quote">“our strongest June quarter ever”<div class="rcc-lab" style="margin-top:4px">Tim Cook, then CEO, in the results release</div></div>
      ${tileHTML(x, items.map(([k, t, v]) => ({ k, ic: 'star', t: `${t} <span class="acc" style="display:inline;font:600 12px var(--mono)">${v}</span>`, s: x.narrow ? '' : 'June-quarter record' })), null, 'two')}`;
  };

  const ICONSETS = {
    frame: () => [{ k: 's', ic: 'target', t: 'The surprise', s: 'Results against what analysts expected' }, { k: 'g', ic: 'chart', t: 'The outlook', s: 'Guidance for the next quarter, often the biggest mover' }, { k: 'q', ic: 'search', t: 'The quality', s: 'Temporary items, adjusted versus official numbers' }],
    supply: () => [{ k: 'chip', ic: 'chip', t: 'Advanced chips', s: 'Tight for iPhone, Mac and iPad; the squeeze grows in September' }, { k: 'mem', ic: 'mem', t: 'Memory costs', s: 'Prices soaring: a “100-year flood”' }, { k: 'price', ic: 'tag', t: 'Prices', s: 'Some iPad and Mac prices raised' }],
    guide2: () => [{ k: 'ip', ic: 'phone', t: 'iPhone', s: 'Growth in the mid-teens' }, { k: 'ox', ic: 'coin', t: 'Operating expenses', s: `${B(AG.opex[0])} to ${B(AG.opex[1])}` }, { k: 'tx', ic: 'gauge', t: 'Tax and other', s: `Tax rate about ${AG.taxRate}%, other income about ${Mn(AG.otherIncome)}` }],
    themes: () => [{ k: 's', ic: 'chip', t: 'Supply', s: 'Evercore' }, { k: 'm', ic: 'mem', t: 'Memory costs', s: 'Morgan Stanley, JPMorgan' }, { k: 'g', ic: 'gauge', t: 'Margins', s: 'JPMorgan' }, { k: 'ai', ic: 'ai', t: 'AI', s: 'Goldman Sachs, Bank of America' }],
  };
  SC.icons = (x) => tileHTML(x, ICONSETS[x.show.set](), x.show.hi);

  const METRIC = {
    rev: () => ({ lab: 'Revenue · June quarter', v: AI.revenue, ya: AY.revenue, bars: [['Jun 2025', AY.revenue, 'y'], ['Jun 2026', AI.revenue, 'v']] }),
    sxrev: () => ({ lab: 'Revenue · September quarter', v: XI.revenue, ya: XY.revenue, pq: XQ.revenue, pqLab: 'June quarter', bars: [['Sep 2025', XY.revenue, 'y'], ['Jun 2026', XQ.revenue, 'q'], ['Sep 2026', XI.revenue, 'v']] }),
  };
  SC.big = (x) => {
    const M = METRIC[x.show.m](), t0 = x.m('v', 0.3), max = Math.max(...M.bars.map((b) => b[1]));
    const n = x.A({ k: 'count', from: 0, to: M.v, fmt: (v) => B(v), t0, t1: t0 + 1.1 });
    const y = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('y', t0 + 1), inv: true });
    const q = M.pq ? x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('q', t0 + 2), inv: true }) : '';
    return `<div class="rcc-big"><div class="rcc-bigl"><span class="rcc-lab">${M.lab}</span><b class="rcc-num" id="${n}">${B(M.v)}</b>
        <div class="rcc-chips"><span class="rcc-chip up rcc-fade" id="${y}">▲ ${SP(yoy(M.v, M.ya))} year over year</span>${M.pq ? `<span class="rcc-chip acc rcc-fade" id="${q}">${SP(yoy(M.v, M.pq))} vs ${M.pqLab || 'last quarter'}</span>` : ''}</div>
        <span class="rcc-sub">A year ago: ${B(M.ya)}</span></div>
      <div class="rcc-hb">${M.bars.map(([l, v, k]) => {
        const s0 = k === 'v' ? t0 : x.m(k, 0.2);
        return `<div class="rcc-hr${k === 'v' ? ' on' : ''}"><span class="l">${l}</span><span class="t"><i class="${k === 'v' ? '' : 'mut'}" id="${x.A({ k: 'w', to: v / max * 100, t0: s0, t1: s0 + 0.9 })}"></i></span><b>${B(v)}</b><em></em></div>`;
      }).join('')}</div></div>`;
  };

  SC.trend = (x) => {
    const W = x.W - 28, H = x.H - 14, T = AP.trend, n = T.length;
    const top = 62, bot = H - (x.narrow ? 38 : 44), max = Math.max(...T.map((r) => r.revenue));
    const cw = W / n, bw = Math.min(64, cw * 0.56), yf = (v) => bot - (v / max) * (bot - top);
    let s = `<text x="0" y="12" class="cap">Apple revenue by quarter</text>`;
    T.forEach((r, i) => {
      const cx = cw * i + cw / 2, cur = i === n - 1, hol = /^Dec/.test(r.q);
      const id = x.A({ k: 'sh', base: bot, h: bot - yf(r.revenue), t0: 0.1 + i * 0.12, t1: 0.7 + i * 0.12 });
      s += `<rect id="${id}" x="${(cx - bw / 2).toFixed(1)}" y="${yf(r.revenue).toFixed(1)}" width="${bw.toFixed(1)}" height="${(bot - yf(r.revenue)).toFixed(1)}" rx="3" class="${cur ? 'f-acc' : hol ? 'f-info o70' : 'f-shade2'}"/>`;
      s += `<text x="${cx.toFixed(1)}" y="${(yf(r.revenue) - 6).toFixed(1)}" text-anchor="middle" class="${x.narrow ? 'xs' : 'sm'} mono ${cur ? 'acc' : 'ink'}">${B(r.revenue, x.narrow ? 0 : 1)}</text>`;
      s += `<text x="${cx.toFixed(1)}" y="${bot + 15}" text-anchor="middle" class="${x.narrow ? 'xs' : 'sm'} mut">${x.narrow ? r.q.replace(' 20', " '") : r.q}</text>`;
      if (hol) s += `<text x="${cx.toFixed(1)}" y="${bot + 29}" text-anchor="middle" class="xs info">holidays</text>`;
    });
    const brk = (i, j, label, cls, k, y) => {
      const x1 = cw * i + cw / 2, x2 = cw * j + cw / 2;
      const id = x.A({ k: 'op', t0: x.m(k, 1), t1: x.m(k, 1) + 0.3 });
      return `<g id="${id}" style="opacity:0"><path d="M${x1} ${y + 8}V${y}H${x2}V${y + 8}" class="nf s-${cls} w15"/><rect x="${((x1 + x2) / 2 - 44).toFixed(1)}" y="${y - 9}" width="88" height="18" rx="9" class="f-bg s-${cls} w1"/><text x="${((x1 + x2) / 2).toFixed(1)}" y="${y + 4}" text-anchor="middle" class="sm mono ${cls === 'up' ? 'up' : 'dn'}">${label}</text></g>`;
    };
    s += brk(n - 2, n - 1, SP(yoy(AI.revenue, AQ.revenue)) + ' QoQ', 'dn', 'q', 46);
    s += brk(0, n - 1, SP(yoy(AI.revenue, AY.revenue)) + ' YoY', 'up', 'y', 26);
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Apple revenue by quarter, June 2025 to June 2026">${s}</svg>`;
  };

  const BARSETS = {
    cats: () => { const c = AP.categories, K = { iPhone: 'iphone', Mac: 'mac', iPad: 'ipad', 'Wearables, Home & Accessories': 'wear', Services: 'serv' }, L = { 'Wearables, Home & Accessories': 'Wearables' };
      return { title: 'Revenue by product, June quarter', rows: Object.keys(c.cur).map((n) => ({ k: K[n], l: L[n] || n, v: c.cur[n], ya: c.ya[n] })) }; },
    regions: () => { const c = AP.regions, K = { Americas: 'am', Europe: 'eu', 'Greater China': 'cn', Japan: 'jp', 'Rest of Asia Pacific': 'ap' }, L = { 'Rest of Asia Pacific': 'Rest of Asia' };
      return { title: 'Revenue by region, June quarter', rows: Object.keys(c.cur).map((n) => ({ k: K[n], l: L[n] || n, v: c.cur[n], ya: c.ya[n] })) }; },
  };
  SC.bars = (x) => {
    const D = BARSETS[x.show.set](), max = Math.max(...D.rows.map((r) => r.v)), hi = x.show.hi;
    const marked = D.rows.some((r) => x.has(r.k)) || !!hi;
    return `<div class="rcc-lab" style="margin-bottom:10px">${D.title}</div><div class="rcc-hb">${D.rows.map((r, i) => {
      const g = yoy(r.v, r.ya), t0 = 0.1 + i * 0.1;
      const lit = marked && (x.has(r.k) || r.k === hi) ? x.A({ k: 'cls', cls: 'on', t0: x.has(r.k) ? x.m(r.k) : 0.2 }) : '';
      const dim = marked && !lit;
      return `<div class="rcc-hr${dim ? ' dim' : ''}"${lit ? ` id="${lit}"` : ''}><span class="l">${r.l}</span><span class="t"><i id="${x.A({ k: 'w', to: r.v / max * 100, t0, t1: t0 + 0.8 })}"></i></span><b>${B(r.v)}</b><em class="${g >= 0 ? 'up' : 'dn'}">${SP(g)}</em></div>`;
    }).join('')}</div><div class="rcc-sub" style="margin-top:10px">Change is year over year, against the June 2025 quarter.</div>`;
  };

  SC.split = (x) => {
    const sr = AI.servSales / AI.revenue * 100, sg = (AI.servSales - AI.servCost) / AI.gross * 100;
    const pm = (AI.prodSales - AI.prodCost) / AI.prodSales * 100, sm = (AI.servSales - AI.servCost) / AI.servSales * 100;
    const row = (lab, s, k) => { const t0 = x.m(k, 0.3);
      return `<div style="display:flex;flex-direction:column;gap:5px"><span class="rcc-lab">${lab}</span><div class="rcc-stack"><i class="a" id="${x.A({ k: 'w', to: 100 - s, t0, t1: t0 + 0.8 })}">Products ${P(100 - s, 0)}</i><i class="c" id="${x.A({ k: 'w', to: s, t0: t0 + 0.3, t1: t0 + 1.1 })}">Services ${P(s, 0)}</i></div></div>`; };
    const m = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('m', 1.5), inv: true });
    return `<div style="display:flex;flex-direction:column;gap:14px">${row('Share of revenue', sr, 'r')}${row('Share of gross profit', sg, 'g')}
      <div class="rcc-chips rcc-fade" id="${m}"><span class="rcc-chip info">Devices keep ${Math.round(pm)}¢ of each $1</span><span class="rcc-chip flame">Services keep ${Math.round(sm)}¢ of each $1</span></div>
      <span class="rcc-sub">Gross margin by type, June 2026 quarter. Services: App Store, iCloud, Apple Music, AppleCare and more.</span></div>`;
  };

  SC.gauge = (x) => {
    const W = x.W - 28, H = x.H - 14, st = x.show.step, lo = 44, hi = 52, L = 8, R = W - 8;
    const xf = (v) => L + (v - lo) / (hi - lo) * (R - L), y = Math.round(H * 0.5);
    let s = `<defs><pattern id="rcc-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="f-flame-t"/><line x1="0" y1="0" x2="0" y2="6" class="s-flame w2"/></pattern></defs>`;
    s += `<text x="0" y="14" class="cap">Gross margin, % of revenue</text>`;
    s += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" class="s-line w2"/>`;
    for (let v = lo; v <= hi; v += x.narrow ? 2 : 1) s += `<line x1="${xf(v).toFixed(1)}" y1="${y - 5}" x2="${xf(v).toFixed(1)}" y2="${y + 5}" class="s-line w15"/><text x="${xf(v).toFixed(1)}" y="${y + 20}" text-anchor="middle" class="xs mut mono">${v}%</text>`;
    const mk = (v, cls, lab, sub, k, t0d, above) => {
      const id = x.A({ k: 'op', t0: x.m(k, t0d), t1: x.m(k, t0d) + 0.35 });
      const ty = above ? y - 46 : y + 40, anc = xf(v) > W - 50 ? 'end' : xf(v) < 50 ? 'start' : 'middle';
      return `<g id="${id}" style="opacity:0"><circle cx="${xf(v).toFixed(1)}" cy="${y}" r="7" class="f-${cls}"/><line x1="${xf(v).toFixed(1)}" y1="${above ? y - 9 : y + 9}" x2="${xf(v).toFixed(1)}" y2="${above ? y - 30 : y + 26}" class="s-${cls} w15"/>
        <text x="${xf(v).toFixed(1)}" y="${ty}" text-anchor="${anc}" class="lg mono b ${cls}">${lab}</text><text x="${xf(v).toFixed(1)}" y="${ty + 15}" text-anchor="${anc}" class="sm mut">${sub}</text></g>`;
    };
    const refund = AP.tariffRefund.grossMarginPts, gx0 = A_GM - refund;
    if (st === 'tariff' || st === 'q') {
      const id = x.A({ k: 'op', t0: st === 'q' ? 0.2 : x.m('t', 0.4), t1: (st === 'q' ? 0.2 : x.m('t', 0.4)) + 0.4 });
      s += `<g id="${id}" style="opacity:0"><rect x="${xf(gx0).toFixed(1)}" y="${y - 11}" width="${(xf(A_GM) - xf(gx0)).toFixed(1)}" height="22" rx="4" class="${st === 'q' ? 'f-flame-t s-flame w1' : 'hatch s-flame w1'}"/>
        <text x="${((xf(gx0) + xf(A_GM)) / 2).toFixed(1)}" y="${y + 42}" text-anchor="middle" class="md b flame">${st === 'q' ? 'How much of this was temporary?' : `≈${refund} points: tariff refunds (temporary)`}</text></g>`;
      if (st === 'tariff') { const id2 = x.A({ k: 'op', t0: x.m('t', 0.4) + 1.2, t1: x.m('t', 0.4) + 1.6 }); s += `<g id="${id2}" style="opacity:0"><text x="${(W / 2).toFixed(1)}" y="${y + 64}" text-anchor="middle" class="md b ink">Without them: ≈${P(gx0, 0)}</text></g>`; }
    }
    if (st === 'guide') {
      const g = AG.grossMargin, id = x.A({ k: 'op', t0: x.m('g', 0.3), t1: x.m('g', 0.3) + 0.4 });
      s += `<g id="${id}" style="opacity:0"><rect x="${xf(g[0]).toFixed(1)}" y="${y - 13}" width="${(xf(g[1]) - xf(g[0])).toFixed(1)}" height="26" rx="4" class="f-acc-t s-acc w15"/>
        <text x="${((xf(g[0]) + xf(g[1])) / 2).toFixed(1)}" y="${y + 40}" text-anchor="middle" class="lg mono b acc">${g[0]}–${g[1]}%</text><text x="${((xf(g[0]) + xf(g[1])) / 2).toFixed(1)}" y="${y + 55}" text-anchor="middle" class="sm mut">Sep quarter guide, incl. ≈${AG.tariffRefundPts} pt refunds</text></g>`;
      const id2 = x.A({ k: 'op', t0: x.m('n', 1.5), t1: x.m('n', 1.5) + 0.4 });
      s += `<g id="${id2}" style="opacity:0">${SML.svg.arrow(xf(A_GM) - 4, y - 24, xf(g[1]) + 6, y - 24, 'dn', 8)}</g>`;
      s += mk(A_GM, 'ink', P(A_GM), 'June quarter', 'zz', 0.1, true);
    } else {
      s += mk(A_GMY, 'mut', P(A_GMY), 'June 2025', 'y', st === 'gm' ? 1.2 : 0.1, true);
      s += mk(A_GM, 'acc', P(A_GM), 'June 2026', 'v', 0.2, true);
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Apple gross margin">${s}</svg>`;
  };

  const STMT = {
    apple: () => ({ unit: (v) => B(v), cur: 'Jun 2026', ya: 'Jun 2025', rows: [['rev', 'Revenue', AI.revenue, AY.revenue], ['cost', 'Cost of sales', -AI.cost, -AY.cost], ['gross', 'Gross profit', AI.gross, AY.gross, 'sub'], ['rd', 'R&D', -AI.rd, -AY.rd], ['sga', 'SG&A', -AI.sga, -AY.sga], ['op', 'Operating income', AI.opInc, AY.opInc, 'sub'], ['oth', 'Other income', AI.other, AY.other], ['tax', 'Income tax', -AI.tax, -AY.tax], ['net', 'Net income', AI.netInc, AY.netInc, 'sub'], ['eps', 'Diluted EPS', AI.epsDil, AY.epsDil, 'eps']] }),
    spacex: () => ({ unit: (v) => (v < 0 ? F.minus : '') + F.usd(Math.abs(v), 0) + 'M', cur: 'Sep 2026', ya: 'Sep 2025', rows: [['rev', 'Revenue', XI.revenue, XY.revenue], ['cost', 'Cost of revenue', -XI.cost, -XY.cost], ['gross', 'Gross profit', XI.gross, XY.gross, 'sub'], ['rd', 'R&D', -XI.rd, -XY.rd], ['sga', 'SG&A', -XI.sga, -XY.sga], ['rs', 'Restructuring, other', -(XI.restructuring + XI.impairment), -(XY.restructuring + XY.impairment)], ['op', XI.opInc >= 0 ? 'Operating income' : 'Operating loss', XI.opInc, XY.opInc, 'sub'], ['non', 'Interest, other, tax', XI.intExp + XI.intInc + XI.other - XI.tax, XY.intExp + XY.intInc + XY.other - XY.tax], ['net', XI.netInc >= 0 ? 'Net income' : 'Net loss', XI.netInc, XY.netInc, 'sub'], ['eps', 'Diluted EPS', XI.eps, XY.eps, 'eps']] }),
  };
  const HILITE = { opex: { rd: 'rd', sga: 'sga' }, profit: { op: 'op', net: 'ni' }, op: { gross: 'g', rd: 'rd', op: 'op' }, net: { net: 'n', eps: 'e' } };
  SC.stmt = (x) => {
    const D = STMT[x.show.set || 'apple'](), hl = HILITE[x.show.hi] || {};
    const chg = (a, b, eps) => {
      if (eps) return a > 0 && b > 0 ? SP(yoy(a, b)) : F.susd(a - b);
      const small = Math.abs(a) < 0.2 * Math.abs(b) || Math.abs(b) < 0.2 * Math.abs(a);
      if (!small && a > 0 && b > 0) return SP(yoy(a, b));
      if (!small && a < 0 && b < 0) return SP(yoy(-a, -b));
      return x.show.set === 'spacex' ? F.susd(a - b, 0) + 'M' : SB(a - b);
    };
    return `<div class="rcc-st"><div class="rcc-sr h"><span>${x.script.company} · income statement</span><b>${D.cur}</b><span class="ya" style="text-align:right">${D.ya}</span><em>Change</em></div>${D.rows.map(([k, l, a, b, kind]) => {
      const mk = hl[k], t0 = mk ? x.m(mk, x.show.hi === 'opex' ? x.m('o', 0.3) : 0.3) : 0;
      const id = mk ? x.A({ k: 'cls', cls: 'on', t0 }) : '';
      const val = kind === 'eps' ? F.usd(a) : D.unit(a);
      const cnt = mk ? x.A({ k: 'count', from: 0, to: a, fmt: kind === 'eps' ? (v) => F.usd(v) : D.unit, t0, t1: t0 + 0.8 }) : '';
      return `<div class="rcc-sr ${kind || ''}"${id ? ` id="${id}"` : ''}><span>${l}</span><b${cnt ? ` id="${cnt}"` : ''}>${val}</b><span class="ya mono" style="text-align:right;font-size:12px">${kind === 'eps' ? F.usd(b) : D.unit(b)}</span><em class="${a - b >= 0 ? 'up' : 'dn'}">${chg(a, b, kind === 'eps')}</em></div>`;
    }).join('')}</div>`;
  };

  SC.eps = (x) => {
    const st = x.show.step, sh = AI.shDil / 1000, shy = AY.shDil / 1000;
    const v = x.A({ k: 'count', from: 0, to: AI.epsDil, fmt: (n) => F.usd(n), t0: x.m('v', 0.3), t1: x.m('v', 0.3) + 0.9 });
    let below = '';
    if (st === 'eps') {
      const y = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('y', 1.2), inv: true });
      below = `<div class="rcc-fade" id="${y}" style="display:flex;flex-direction:column;gap:6px"><span class="rcc-chip up">▲ ${SP(yoy(AI.epsDil, AY.epsDil))} year over year</span><span class="rcc-sub">A year ago: ${B(AY.netInc)} ÷ ${F.num(shy, 2)}B shares = ${F.usd(AY.epsDil)}</span></div>`;
    } else if (st === 'shares') {
      const gN = yoy(AI.netInc, AY.netInc), gE = yoy(AI.epsDil, AY.epsDil), mx = Math.max(gN, gE);
      const s0 = x.m('s', 0.5);
      below = `<div class="rcc-hb"><div class="rcc-hr"><span class="l">Net income</span><span class="t"><i class="mut" id="${x.A({ k: 'w', to: gN / mx * 100, t0: 0.2, t1: 1 })}"></i></span><b>${SP(gN)}</b><em></em></div>
        <div class="rcc-hr on"><span class="l">EPS</span><span class="t"><i id="${x.A({ k: 'w', to: gE / mx * 100, t0: 0.5, t1: 1.3 })}"></i></span><b>${SP(gE)}</b><em></em></div></div>
        <span class="rcc-chip flame rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: s0, inv: true })}">Diluted shares ${F.num(shy, 2)}B → ${F.num(sh, 2)}B (${SP(yoy(AI.shDil, AY.shDil))}): buybacks</span>`;
    } else {
      const r = AP.tariffRefund.eps, t0 = x.m('t', 0.3);
      below = `<div class="rcc-stack"><i class="b" id="${x.A({ k: 'w', to: A_EPSX / AI.epsDil * 100, t0, t1: t0 + 0.8 })}">≈${F.usd(A_EPSX)} core</i><i class="c" id="${x.A({ k: 'w', to: r / AI.epsDil * 100, t0: t0 + 0.5, t1: t0 + 1 })}"></i></div>
        <div class="rcc-chips"><span class="rcc-chip flame">Tariff refund: ${F.usd(r)}, temporary</span><span class="rcc-chip up rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('y', 2), inv: true })}">Without it: ${SP(yoy(A_EPSX, AY.epsDil))} YoY</span></div>`;
    }
    return `<div style="display:flex;flex-direction:column;gap:14px"><div class="rcc-eq"><span class="rcc-box"><small>Net income</small><b>${B(AI.netInc)}</b></span><i>÷</i><span class="rcc-box"><small>Diluted shares</small><b>${F.num(sh, 2)}B</b></span><i>=</i><span class="rcc-box hl"><small>EPS</small><b id="${v}">${F.usd(AI.epsDil)}</b></span></div>${below}</div>`;
  };

  SC.cash = (x) => {
    if (x.show.step === 'return') {
      const R = AP.call.quarterReturn, c9 = AP.cf9.financing;
      const t = (k, d, lab, v, cls) => `<div class="rcc-box ${cls || ''} rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m(k, d), inv: true })}"><small>${lab}</small><b>${v}</b></div>`;
      return `<div class="rcc-lab" style="margin-bottom:10px">Returned to shareholders, June quarter</div>
        <div class="rcc-eq">${t('t', 0.3, 'Total, about', B(R.total, 0), 'hl')}${t('b', 0.8, 'Buybacks', B(R.buybacks))}${t('d', 1.3, 'Dividends, about', B(R.dividends, 0))}</div>
        <p class="rcc-sub" style="margin-top:12px">Nine months to June: ${B(-c9.find((r) => r.k === 'buyback').cur)} of buybacks and ${B(-c9.find((r) => r.k === 'div').cur)} of dividends (cash flow statement).</p>`;
    }
    const max = A_CASHINV, t0 = x.m('c', 0.3), t1 = x.m('d', 1.2);
    return `<div class="rcc-lab" style="margin-bottom:10px">June 27, 2026 balance sheet</div><div class="rcc-hb">
        <div class="rcc-hr on"><span class="l">Cash and investments</span><span class="t"><i id="${x.A({ k: 'w', to: 100, t0, t1: t0 + 0.9 })}"></i></span><b>${B(A_CASHINV)}</b><em></em></div>
        <div class="rcc-hr"><span class="l">Debt</span><span class="t"><i class="mut" id="${x.A({ k: 'w', to: A_DEBT / max * 100, t0: t1, t1: t1 + 0.8 })}"></i></span><b>${B(A_DEBT)}</b><em></em></div></div>
      <div class="rcc-chips" style="margin-top:12px"><span class="rcc-chip up rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: t1 + 0.8, inv: true })}">Net cash ${B(A_CASHINV - A_DEBT)}</span><span class="rcc-chip acc rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('v', 2.5), inv: true })}">Dividend ${F.usd(AP.dividend.perShare)} a share, paid ${AP.dividend.paid.replace(', 2026', '')}</span></div>`;
  };

  /* Hoppy's cart modes: rows [mark, label, this, last|null, flags] */
  const HOPM = {
    safe: () => ({ sub: 'Talking to the bank', quote: '“July should be busy.”', note: 'That is a forecast. Nobody can hold Hoppy to it. A company’s safe harbor says the same thing about its outlook.' }),
    sales: () => ({ sub: 'June vs last June', head: ['', 'This June', 'Last June'], rows: [['a', 'Sales (revenue)', U0(HOP.sales[0]), U0(HOP.sales[1])]], chip: ['b', 'up', `▲ ${SP(yoy(HOP.sales[0], HOP.sales[1]), 0)} year over year`], side: ['At Apple', B(AI.revenue), `${SP(yoy(AI.revenue, AY.revenue))} from ${B(AY.revenue)}`] }),
    refund: () => ({ sub: 'June', head: ['', 'This June', ''], rows: [['', 'Gross profit', U0(HOP.gross[0]), ''], ['', '+ refund of an old overcharge', 'temporary', '']], chip: ['', 'flame', 'A nice boost, but temporary'], side: ['At Apple', `${P(A_GM)} → ≈${P(A_GM - AP.tariffRefund.grossMarginPts, 0)}`, 'Gross margin, with and without the tariff refunds', 'x'] }),
    opex: () => ({ sub: 'Operating expenses, June', head: ['', 'This June', 'Last June'], rows: [['rd', 'Recipes and training (R&D)', U0(HOP.rd[0]), U0(HOP.rd[1])], ['sga', 'Ads, permit, phone (SG&A)', U0(HOP.sga[0]), U0(HOP.sga[1])], ['', 'Operating income', U0(HOP.op[0]), U0(HOP.op[1]), 'tot']], side: ['At Apple', B(AI.rd), `R&D, ${SP(yoy(AI.rd, AY.rd))} year over year`] }),
    buyback: () => ({ sub: 'What a buyback does', head: ['', 'Before', 'After'], rows: [['b', 'Profit', U0(HOP.net[0]), U0(HOP.net[0])], ['a', 'Shares', F.num(HOP.shares), F.num(HOP.shares - 100)], ['c', 'Profit per share', F.usd(HOP.net[0] / HOP.shares), F.usd(HOP.net[0] / (HOP.shares - 100)), 'tot']], side: ['At Apple', SP(yoy(AI.shDil, AY.shDil)), `Diluted shares, so EPS grew ${SP(yoy(AI.epsDil, AY.epsDil))} while net income grew ${SP(yoy(AI.netInc, AY.netInc))}`] }),
    netcash: () => ({ sub: 'End of June', head: ['', '', ''], rows: [['h', 'Cash in the register and bank', U0(HOP.cash), ''], ['h', 'Cart loan', F.minus + U0(HOP.loan), ''], ['n', 'Net cash', U0(HOP.cash - HOP.loan), '', 'tot']], side: ['At Apple', B(A_CASHINV - A_DEBT), `${B(A_CASHINV)} of cash and investments minus ${B(A_DEBT)} of debt`, 'a'] }),
    supply: () => ({ sub: 'What if, in August', rows: [['', 'Beans for August', 'short', ''], ['', 'Milk price', 'doubles', ''], ['', 'Sales and margin outlook', 'lower', '', 'tot']], note: 'A record June does not fix a tight August.', side: ['Apple’s guide', `+${AG.revGrowth[0]}–${AG.revGrowth[1]}%`, `September-quarter revenue growth; margin ${AG.grossMargin[0]}–${AG.grossMargin[1]}%`] }),
    ipo: () => ({ sub: 'Selling slices to the public', quote: '“Who wants a slice of my cart?”', note: 'The cash raised pays for growth. The slices (shares) then trade every day, priced on what people expect the cart to earn.', side: ['SpaceX', B(SX.ipo.netProceeds), `Raised, net, in its June IPO at ${F.usd(SX.ipo.priced, 0)} a share`] }),
    oploss: () => ({ sub: 'What if: a giant recipe budget', head: ['', 'What if', 'Real June'], rows: [['', 'Gross profit', U0(HOP.gross[0]), U0(HOP.gross[0])], ['r', 'Recipes and training', F.minus + U0(7000), F.minus + U0(HOP.rd[0])], ['', 'Ads, permit, phone', F.minus + U0(HOP.sga[0]), F.minus + U0(HOP.sga[0])], ['l', 'Operating income', F.minus + U0(7000 + HOP.sga[0] - HOP.gross[0]), U0(HOP.op[0]), 'tot']], side: ['SpaceX, June quarter', SMn(XQ.opInc), `Operating loss: gross profit ${B(XQ.gross)} minus R&D ${B(XQ.rd)} and SG&A ${B(XQ.sga)}`] }),
    capex: () => { const k = SX.capex.cur / XI.revenue; return ({ sub: 'What if, in one month', rows: [['h', 'Coffee sold', U0(HOP.sales[0]), ''], ['h', 'New carts bought', U0(Math.round(HOP.sales[0] * k / 500) * 500), ''], ['h', 'Spending vs sales', F.num(k, 1) + '×', '', 'tot']], side: ['SpaceX, September quarter', B(SX.capex.cur), `Capex vs ${B(SX.ebitda.cur)} of adjusted EBITDA. Nine months: free cash flow ≈ ${SB(X_FCF9, 0)}`, 'f'] }); },
    dilution: () => ({ sub: 'Twice the shares', head: ['', 'Before', 'After'], rows: [['b', 'Profit', U0(HOP.net[0]), U0(HOP.net[0])], ['a', 'Shares', F.num(HOP.shares), F.num(HOP.shares * 2)], ['b', 'Profit per share', F.usd(HOP.net[0] / HOP.shares), F.usd(HOP.net[0] / (HOP.shares * 2)), 'tot']], side: ['SpaceX', `${F.num(XY.sh / 1000, 1)}B → ${F.num(XI.sh / 1000, 1)}B`, 'Average shares, Sep 2025 vs Sep 2026 (diluted)'] }),
  };
  SC.cart = (x) => {
    const D = HOPM[x.show.mode](), rows = D.rows || [];
    const row = (r) => {
      const [k, l, a, b, f] = r; const id = k && x.has(k) ? x.A({ k: 'cls', cls: 'on', t0: x.m(k) }) : '';
      return `<div class="rcc-hr2${f === 'tot' ? ' tot' : ''}"${id ? ` id="${id}"` : ''}><span>${l}</span><b>${a}</b><em>${b || ''}</em></div>`;
    };
    const chip = D.chip ? `<span class="rcc-chip ${D.chip[1]} rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: D.chip[0] && x.has(D.chip[0]) ? x.m(D.chip[0]) : 0.8, inv: true })}">${D.chip[2]}</span>` : '';
    const side = D.side ? `<div class="rcc-hops rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: D.side[3] && x.has(D.side[3]) ? x.m(D.side[3]) : Math.min(2.2, x.D * 0.45), inv: true })}"><span class="rcc-lab">${D.side[0]}</span><b>${D.side[1]}</b><small>${D.side[2]}</small></div>` : '';
    return `<div class="rcc-hop"><div class="rcc-hopc"><div class="rcc-hoph">${CART}<div><b>Hoppy’s Coffee Cart</b><span>${D.sub}</span></div></div>
      ${D.quote ? `<div class="rcc-hopq">${D.quote}</div>` : ''}
      ${D.head && D.head.some(Boolean) ? `<div class="rcc-hr2 h"><span>${D.head[0]}</span><b>${D.head[1]}</b><em>${D.head[2]}</em></div>` : ''}
      ${rows.map(row).join('')}${chip}${D.note ? `<p class="rcc-hopn">${D.note}</p>` : ''}</div>${side}</div>`;
  };

  SC.range = (x) => {
    const W = x.W - 28, lo = x.narrow ? 110 : 108, hi = x.narrow ? 116 : 117, L = 12, R = W - 12, y = 84, H = y + 110;
    const xf = (v) => L + (v - lo) / (hi - lo) * (R - L), g0 = A_GUIDE[0] / 1000, g1 = A_GUIDE[1] / 1000, mid = (g0 + g1) / 2, cons = AE.nextQtrRevenue / 1000;
    let s = `<text x="0" y="12" class="cap">September-quarter revenue, $ billions</text><line x1="${L}" y1="${y}" x2="${R}" y2="${y}" class="s-line w2"/>`;
    for (let v = lo; v <= hi; v += 1) s += `<line x1="${xf(v).toFixed(1)}" y1="${y - 4}" x2="${xf(v).toFixed(1)}" y2="${y + 4}" class="s-line w15"/><text x="${xf(v).toFixed(1)}" y="${y + 18}" text-anchor="middle" class="xs mut mono">${v}</text>`;
    const tg = x.m('g', 0.3);
    const band = x.A({ k: 'sw', x0: xf(mid), w: xf(g1) - xf(g0), t0: tg, t1: tg + 0.8 });
    s += `<rect id="${band}" x="${xf(g0).toFixed(1)}" y="${y - 13}" width="${(xf(g1) - xf(g0)).toFixed(1)}" height="26" rx="5" class="f-acc-t s-acc w15"/>`;
    const gl = x.A({ k: 'op', t0: tg + 0.5, t1: tg + 0.9 });
    s += `<g id="${gl}" style="opacity:0"><text x="${xf(mid).toFixed(1)}" y="${y - 20}" text-anchor="middle" class="md b acc">Guide: +${AG.revGrowth[0]}% to +${AG.revGrowth[1]}%</text>
      <text x="${xf(mid).toFixed(1)}" y="${y + 36}" text-anchor="middle" class="sm mono acc">≈${F.usd(g0, 1)}–${F.num(g1, 1)}B</text></g>`;
    if (x.show.step === 'guide') {
      const fx = x.A({ k: 'op', t0: x.m('fx', 2), t1: x.m('fx', 2) + 0.4 });
      s += `<g id="${fx}" style="opacity:0"><text x="${(W / 2).toFixed(1)}" y="${y + 66}" text-anchor="middle" class="sm mut">Includes a currency drag ≈${AG.fxHeadwindPts} points bigger than in June</text></g>`;
    } else {
      const tc = x.m('c', 0.3), c = x.A({ k: 'op', t0: tc, t1: tc + 0.4 }), cx = xf(cons);
      s += `<g id="${c}" style="opacity:0"><path d="M${cx.toFixed(1)} ${y - 15}l-7 -11h14z" class="f-info"/><line x1="${cx.toFixed(1)}" y1="${y - 15}" x2="${cx.toFixed(1)}" y2="${y + 13}" class="s-info w2 dash2"/>
        <text x="${Math.min(cx + 10, R).toFixed(1)}" y="${y - 48}" text-anchor="end" class="md b info">Analysts: ≈+${AE.nextQtrGrowth}%, ≈${F.usd(cons, 0)}B</text></g>`;
      const k = x.A({ k: 'op', t0: x.m('k', 2.5), t1: x.m('k', 2.5) + 0.4 });
      s += `<g id="${k}" style="opacity:0"><path d="M${xf(mid).toFixed(1)} ${y + 46}v8H${cx.toFixed(1)}v-8" class="nf s-dn w15"/><text x="${Math.min((xf(mid) + cx) / 2, R - 90).toFixed(1)}" y="${y + 70}" text-anchor="middle" class="sm b dn">≈${F.usd(cons - mid, 1)}B short at the midpoint</text></g>`;
      const r = x.A({ k: 'op', t0: x.m('r', 1.2), t1: x.m('r', 1.2) + 0.4 });
      s += `<g id="${r}" style="opacity:0"><text x="0" y="${H - 4}" class="sm mut">Base: last year’s September quarter, ${B(AG.baseRevenue)}</text></g>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Apple’s revenue guidance range against what analysts expected">${s}</svg>`;
  };

  SC.qa = (x) => {
    const L = QA[x.script.key], it = L[x.show.i];
    const qv = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.show.more ? -1 : x.m('q', 0.1), inv: true });
    return `<div class="rcc-qa"><div class="rcc-qah"><span class="pill ${it.firm ? 'info' : 'acc'}">${it.firm ? esc(it.firm) : 'On the call'}</span><span class="rcc-lab">${it.firm ? `Analyst ${x.show.i + 1} of ${L.length} · paraphrased` : 'Paraphrased'}</span></div>
      <div class="rcc-qq rcc-fade" id="${qv}">${ICON.q}<p>${esc(it.q)}</p></div>
      ${it.a.map((a, j) => { const k = j === 0 ? 'a' : 'b'; const id = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.show.more && j === 0 ? -1 : x.m(k, j === 0 ? 1.5 : 4), inv: true });
        return `<div class="rcc-qa-a rcc-fade" id="${id}"><span>${esc(a[0])}</span><p>${esc(a[1])}</p></div>`; }).join('')}</div>`;
  };

  const SCORE = {
    apple: () => [
      { k: 'r', l: 'Revenue', x: `${B(AE.revenue[0])}–${F.num(AE.revenue[1] / 1000, 1)}B`, g: B(AI.revenue), v: ['up', 'Beat'] },
      { k: 'e', l: 'EPS', x: `${F.usd(AE.eps[0])}–${F.num(AE.eps[1], 2)}`, g: F.usd(AI.epsDil), v: ['up', 'Beat'] },
      { k: 's', l: 'Services', x: `≈${B(AE.services)}`, g: B(AI.servSales), v: ['dn', 'Miss'] },
      { k: 'g', l: 'Sep-qtr growth', x: `≈${AE.nextQtrGrowth}%`, g: `${AG.revGrowth[0]}–${AG.revGrowth[1]}% guide`, v: ['dn', 'Below'], pre: true },
      { k: 'm', l: 'Gross margin next', x: `${P(A_GM)} now`, g: `${AG.grossMargin[0]}–${AG.grossMargin[1]}% guide`, v: ['dn', 'Lower'] },
      { k: 'o', l: 'Temporary help', x: '—', xs: 'tariff refunds', g: `${F.usd(AP.tariffRefund.eps)} of EPS`, v: ['vio', 'Flag'] },
    ],
    spacex: () => [
      { k: 'r', l: 'Revenue', x: `${B(XE.revenue[0], 2)}–${F.num(XE.revenue[1] / 1000, 2)}B`, g: B(XI.revenue, 2), v: ['up', 'Beat'] },
      { k: 'e', l: 'EPS', x: `${F.usd(XE.eps[0])}–${F.num(XE.eps[1], 2)}`, g: F.usd(XI.eps), v: ['up', 'Beat'] },
      { k: 'g', l: 'Q1 2027 revenue', x: `≈${B(XE.q1_2027Revenue)}`, g: `${B(X_Q1G[0], 0)}–${F.num(X_Q1G[1] / 1000, 0)}B guide`, v: ['up', 'Far above'] },
      { k: 'c', l: 'Q4 capex', x: `Q3: ${B(SX.capex.cur)}`, xs: `Q3 was ${B(SX.capex.cur)}`, g: `${B(SX.capex.q4Guide[0], 0)}–${F.num(SX.capex.q4Guide[1] / 1000, 0)}B guide`, v: ['dn', 'Nearly 2×'] },
      { k: 'b', l: 'Below the line', x: '—', xs: 'other income, interest, tax', g: `≈${B(XI.netInc - XI.opInc)} of profit`, v: ['vio', 'Flag'] },
    ],
  };
  SC.score = (x) => {
    const st = x.show.step, rows = SCORE[x.script.key]();
    const list = st === 'pre' && x.script.key === 'apple' ? rows.slice(0, 2).concat([{ k: 'q', l: 'Guidance', x: `≈${AE.nextQtrGrowth}% growth`, g: '?', v: ['flame', '?'] }]) : rows;
    const live = (r) => st === 'verdict' ? (r.k === 'r' || r.k === 'e' ? 'b' : r.k) : r.k;
    return `<div class="rcc-sc"><div class="rcc-scr h"><span>${st === 'pre' ? 'What you know so far' : 'Expectations vs results'}</span><span class="x">Expected</span><span class="g">Actual</span><span style="text-align:right">Verdict</span></div>${list.map((r) => {
      const mk = live(r), has = x.has(mk);
      const id = st === 'pre' ? '' : x.A({ k: 'cls', cls: 'on', t0: has ? x.m(mk) : 9e9 });
      const dim = st !== 'pre' && !has ? ' dim' : '';
      const pill = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: st === 'pre' ? 0 : has ? x.m(mk) + 0.3 : 9e9, inv: true });
      return `<div class="rcc-scr${dim}"${id ? ` id="${id}"` : ''}><span>${r.l}<small>${r.xs || 'expected ' + r.x}</small></span><span class="x">${r.x}</span><span class="g">${x.narrow ? r.g.replace(' guide', '') : r.g}</span><span class="pill ${r.v[0]} rcc-fade" id="${pill}">${r.v[1]}</span></div>`;
    }).join('')}</div>`;
  };

  const yourCall = (x) => {
    const a = x.answers.dir; if (a == null) return '';
    const ok = a === dirQ(x.script.key).ans;
    return `<span class="rcc-chip ${ok ? 'up' : 'dn'}">Your call: ${CPS.dir.opts[a]} ${ok ? '✓' : '✗'}</span>`;
  };
  SC.stock = (x) => {
    const W = x.W - 28, H = x.H - 14, apple = x.script.key === 'apple';
    let pts, lo, hi, step;
    if (apple) {
      const c0 = AR.closeBefore;
      pts = [{ k: 'c', l: 'Jul 30 close', s: 'Jul 30', p: c0, t: F.usd(c0) }, { k: 'ah', l: 'After hours', s: 'After hrs', p: c0 * (1 + AR.afterHoursPct / 100), t: '≈' + SP(AR.afterHoursPct, 0) }, { k: 'o', l: 'Jul 31 open', s: 'Open', p: c0 * (1 + AR.openPct / 100), t: '≈' + SP(AR.openPct) }, { k: 'l', l: 'Day low', s: 'Low', p: AR.low, t: '≈' + U0(AR.low) }, { k: 'e', l: 'Jul 31 close', s: 'Close', p: AR.closeAfter, t: `≈${U0(AR.closeAfter)}, ${SP(AR.closePct)}` }];
      lo = 295; hi = 340; step = 10;
    } else {
      const c0 = XR.closeBefore;
      pts = [{ k: 'c', l: 'Oct 20 close', s: 'Oct 20', p: c0, t: F.usd(c0) }, { k: 'ah', l: 'After hours', s: 'After hrs', p: c0 * (1 + XR.afterHoursPct / 100), t: '≈' + SP(XR.afterHoursPct, 0) }, { k: 'e', l: 'Oct 21 close', s: 'Oct 21', p: XR.closeAfter, t: `${F.usd(XR.closeAfter)}, ${SP(XR.nextDayPct)}` }];
      lo = 140; hi = 165; step = 5;
    }
    const dir = pts[pts.length - 1].p >= pts[0].p ? 'up' : 'dn';
    const whyOn = x.show.step === 'why', Hs = H - (whyOn ? 34 : 0), L = x.narrow ? 34 : 42, R = W - (x.narrow ? 54 : 90), top = 34, bot = Hs - 26;
    const xf = (i) => L + (R - L) * (i / (pts.length - 1)), yf = (v) => bot - (v - lo) / (hi - lo) * (bot - top);
    let s = `<text x="0" y="14" class="cap">${apple ? 'AAPL' : 'SPCX'}${x.narrow ? '' : ' · key moments as reported, not tick data'}</text>`;
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) s += `<line x1="${L}" y1="${yf(v).toFixed(1)}" x2="${W}" y2="${yf(v).toFixed(1)}" class="s-grid"/><text x="${L - 6}" y="${(yf(v) + 3.5).toFixed(1)}" text-anchor="end" class="xs mut mono">${v}</text>`;
    s += `<line x1="${L}" y1="${yf(pts[0].p).toFixed(1)}" x2="${W}" y2="${yf(pts[0].p).toFixed(1)}" class="s-mut w1 dash2"/>`;
    const mid = (q) => q.p != null ? q.p : q.lo != null ? (q.lo + q.hi) / 2 : null;
    const tt = pts.map((q, i) => x.m(q.k, 0.4 + i * 1.6));
    pts.forEach((q, i) => {
      const id = x.A({ k: 'op', t0: tt[i], t1: tt[i] + 0.35 }), cx = xf(i);
      let g = '';
      if (i > 0 && mid(q) != null && mid(pts[i - 1]) != null) g += `<line x1="${xf(i - 1).toFixed(1)}" y1="${yf(mid(pts[i - 1])).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yf(mid(q)).toFixed(1)}" class="s-${dir} w25${q.lo != null || pts[i - 1].lo != null ? ' dash2' : ''}"/>`;
      if (q.lo != null) g += `<rect x="${(cx - 6).toFixed(1)}" y="${yf(q.hi).toFixed(1)}" width="12" height="${(yf(q.lo) - yf(q.hi)).toFixed(1)}" rx="4" class="f-${dir}-t s-${dir} w15"/>`;
      if (q.p != null) g += `<circle cx="${cx.toFixed(1)}" cy="${yf(q.p).toFixed(1)}" r="5.5" class="${i === 0 ? 'f-ink' : 'f-' + dir}"/>`;
      if (q.early) g += `<circle cx="${cx.toFixed(1)}" cy="${yf(q.early).toFixed(1)}" r="4" class="f-ink"/><text x="${(cx + (x.narrow ? -10 : 9)).toFixed(1)}" y="${(yf(q.early) + 4).toFixed(1)}" text-anchor="${x.narrow ? 'end' : 'start'}" class="xs ink mono">≈${U0(q.early)} early</text>`;
      if (q.lock) g += `<line x1="${cx.toFixed(1)}" y1="${top}" x2="${cx.toFixed(1)}" y2="${bot}" class="s-vio w15 dash"/>`;
      const last = i === pts.length - 1 && !q.lock;
      const ly = q.lock ? top + 12 : q.p != null ? yf(q.p) + (i === 0 ? (dir === 'up' ? 20 : -12) : last ? -12 : 20) : yf(q.lo) + 16;
      const anc = i === pts.length - 1 ? 'end' : i === 0 ? 'start' : 'middle';
      const lx = i === pts.length - 1 ? cx + (q.lock ? -6 : 6) : i === 0 ? cx - 4 : cx;
      g += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${q.lock ? 'end' : anc}" class="${x.narrow ? 'xs' : 'sm'} mono b ${i === 0 ? 'ink' : q.lock ? 'vio' : dir}">${q.t}</text>`;
      g += `<text x="${cx.toFixed(1)}" y="${bot + 16}" text-anchor="${i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}" class="xs mut">${x.narrow ? q.s : q.l}</text>`;
      s += `<g id="${id}" style="opacity:0">${g}</g>`;
    });
    const yc = yourCall(x);
    const ycId = yc ? x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.show.step === 'why' ? x.m('y', 0.2) : tt[tt.length - 1] + 0.6, inv: true }) : '';
    const why = whyOn ? `<div class="rcc-chips" style="margin-top:4px"><span class="rcc-chip dn rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('c', 1), inv: true })}">Capex ${B(SX.capex.cur)}</span></div>` : '';
    return `<div style="position:relative">${yc ? `<div class="rcc-fade" id="${ycId}" style="position:absolute;right:0;top:-2px;z-index:1">${yc}</div>` : ''}<svg viewBox="0 0 ${W} ${Hs}" width="${W}" height="${Hs}" role="img" aria-label="Stock price around the earnings report">${s}</svg>${why}</div>`;
  };

  SC.pe = (x) => {
    const eps = AP.ttmEps, pe0 = AR.closeBefore / eps, pe1 = AR.closeAfter / eps, ta = x.m('a', 1), tb = x.m('b', 2.5);
    const row = (lab, pe, price, t0, cls, cnt) => `<div class="rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: t0, inv: true })}" style="display:flex;flex-direction:column;gap:4px"><span class="rcc-lab">${lab}</span><div class="rcc-eq"><span class="rcc-box"><small>12-mo EPS</small><b>${F.usd(eps)}</b></span><i>×</i><span class="rcc-box ${cls}"><small>P/E</small><b${cnt ? ` id="${x.A({ k: 'count', from: pe0, to: pe1, fmt: (v) => F.num(v, 1), t0, t1: t0 + 1.2 })}"` : ''}>${F.num(pe, 1)}</b></span><i>≈</i><span class="rcc-box"><small>Price</small><b>${price}</b></span></div></div>`;
    const yc = yourCall(x);
    return `<div style="display:flex;flex-direction:column;gap:${x.narrow ? 7 : 10}px">
      ${row('July 30 close · price ≈ EPS × P/E', pe0, F.usd(AR.closeBefore), ta, 'hl', false)}${row('July 31 close', pe1, '≈' + U0(AR.closeAfter), tb, 'hl', true)}
      <span class="rcc-sub">${x.narrow ? `EPS (last four quarters) did not change overnight; the multiple did.` : `12-month EPS: ${A_TTM.map((r) => F.usd(r.eps)).join(' + ')} = ${F.usd(eps)}. Earnings did not change overnight; the multiple did.`}</span>
      ${yc ? `<div class="rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('y', 0.2), inv: true })}">${yc}</div>` : ''}</div>`;
  };

  SC.targets = (x) => {
    const W = x.W - 28, y = 78, H = y + 84, lo = 230, hi = 410, L = 10, R = W - 10;
    const xf = (v) => L + (v - lo) / (hi - lo) * (R - L), SHORT = { JPMorgan: 'JPM', 'Morgan Stanley': 'MS' };
    let s = `<text x="0" y="14" class="cap">Reported price targets after the call</text><line x1="${L}" y1="${y}" x2="${R}" y2="${y}" class="s-line w2"/>`;
    for (let v = 250; v <= 400; v += 50) s += `<line x1="${xf(v).toFixed(1)}" y1="${y - 4}" x2="${xf(v).toFixed(1)}" y2="${y + 4}" class="s-line"/>`;
    const n = A_TARGETS.length;
    A_TARGETS.forEach(([f, v], i) => {
      const t0 = i === 0 ? x.m('lo', 0.5) : i === n - 1 ? x.m('hi', 2) : x.m('lo', 0.5) + 0.4 + i * 0.25, up = i % 2 === 0;
      const id = x.A({ k: 'op', t0, t1: t0 + 0.3 }), anc = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', tx = xf(v) + (i === 0 ? -6 : i === n - 1 ? 6 : 0);
      s += `<g id="${id}" style="opacity:0"><circle cx="${xf(v).toFixed(1)}" cy="${y}" r="6" class="f-info"/><line x1="${xf(v).toFixed(1)}" y1="${up ? y - 8 : y + 8}" x2="${xf(v).toFixed(1)}" y2="${up ? y - 22 : y + 22}" class="s-info w1"/>
        <text x="${tx.toFixed(1)}" y="${up ? y - 40 : y + 36}" text-anchor="${anc}" class="sm b ink">${x.narrow ? SHORT[f] || f : f}</text><text x="${tx.toFixed(1)}" y="${up ? y - 27 : y + 50}" text-anchor="${anc}" class="sm mono info">${U0(v)}</text></g>`;
    });
    const px = xf(AR.closeAfter), pid = x.A({ k: 'op', t0: 0.2, t1: 0.5 });
    s += `<g id="${pid}" style="opacity:0"><path d="M${px.toFixed(1)} ${y + 12}l-6 10h12z" class="f-acc"/><text x="${px.toFixed(1)}" y="${y + 76}" text-anchor="middle" class="sm mono acc">≈${U0(AR.closeAfter)} close, Jul 31</text></g>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Analyst price targets after Apple’s call, from 245 to 400 dollars">${s}</svg><div class="rcc-sub" style="text-align:center">${x.narrow ? 'Targets are opinions. JPM, MS and BofA targets as reported by MacDailyNews.' : 'Same quarter, very different views. Targets are opinions, not forecasts you can rely on. JPMorgan, Morgan Stanley and BofA targets as reported by MacDailyNews.'}</div>`;
  };

  SC.next = (x) => {
    const apple = x.script.key === 'apple';
    const chips = apple ? (x.narrow ? ['Guidance first', 'Supply', 'Memory costs', 'Gross margin'] : ['Guidance first', 'Supply', 'Memory costs', 'Gross margin', 'Temporary items']) : x.narrow ? ['Capex vs the guide', 'Free cash flow', 'Below-the-line items', 'Share count'] : [`Capex vs the ${B(SX.capex.q4Guide[0], 0)}–${F.num(SX.capex.q4Guide[1] / 1000, 0)}B guide`, 'Free cash flow', 'Profit from operations vs below the line', 'Share count', 'Q1 2027 revenue guide'];
    return `<div style="display:flex;flex-direction:column;gap:${x.narrow ? 8 : 12}px;align-items:flex-start"><span class="rcc-lab">Up next</span>
      <b style="font:600 ${x.narrow ? 16.5 : 19}px/1.35 var(--sans);color:var(--ink)">${apple ? esc(AP.next) : 'SpaceX’s next report covers the fourth quarter of 2026, expected in early 2027.'}</b>
      <span class="rcc-lab">Listen for</span><div class="rcc-chips">${chips.map((c, i) => `<span class="rcc-chip acc rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: 0.6 + i * 0.35, inv: true })}">${c}</span>`).join('')}</div>
      <a href="#calendar" style="color:var(--accent);font-size:13.5px">Earnings dates on the calendar →</a></div>`;
  };

  SC.ipo = (x) => {
    const I = SX.ipo, p = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('p', 0.3), inv: true }), o = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('o', 1), inv: true });
    const r = x.A({ k: 'count', from: 0, to: I.netProceeds, fmt: (v) => B(v), t0: x.m('r', 2), t1: x.m('r', 2) + 1 });
    return `<div style="display:flex;flex-direction:column;gap:12px"><div class="rcc-eq"><span class="rcc-box rcc-fade" id="${p}"><small>IPO price</small><b>${F.usd(I.priced, 0)}</b></span><i>→</i><span class="rcc-box hl rcc-fade" id="${o}"><small>First trade, ${I.firstTrade.replace(', 2026', '')}</small><b>${F.usd(I.open, 0)}</b></span><span class="rcc-chip up">${SP(yoy(I.open, I.priced), 0)} at the open</span></div>
      <div class="rcc-eq"><span class="rcc-box"><small>Raised, net</small><b id="${r}">${B(I.netProceeds)}</b></span><span class="rcc-sub" style="flex:1 1 160px">${I.exchange} · ticker ${SX.ticker}. Reported as the largest IPO ever.</span></div></div>`;
  };

  SC.segs = (x) => {
    const st = x.show.step, cur = SX.segments.cur, ya = SX.segments.ya, N = SX.segments.notes;
    const short = { conn: 'Starlink', ai: 'Super Intelligence', space: 'Space' }, sub = { conn: 'Connectivity', ai: 'Grok, cloud, X, Cursor', space: 'Launch, Starship, Dragon' };
    const shown = (k) => st === 'rest' || (st === 'si' && k === 'ai');
    const mark = { conn: 'c', ai: 'a', space: 's' };
    const tiles = cur.map((sg) => {
      const y0 = ya.find((q) => q.k === sg.k), rev = sg.revenue, op = sg.opInc, mg = op / rev * 100, vis = shown(sg.k);
      const lit = vis ? x.A({ k: 'cls', cls: 'on', t0: st === 'si' ? x.m('a', 0.3) : (x.has(mark[sg.k]) ? x.m(mark[sg.k]) : 9e9) }) : '';
      return `<div class="rcc-tile base"${lit ? ` id="${lit}"` : ''} style="flex-direction:column;gap:4px"><div style="display:flex;justify-content:space-between;width:100%;gap:8px"><b>${short[sg.k]}</b><span class="mono" style="margin:0">${sub[sg.k]}</span></div>
        ${vis ? `<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><b class="mono" style="font-size:18px">${B(rev, 2)}</b><span class="up mono" style="margin:0">${SP(yoy(rev, y0.revenue), 0)}</span><span style="margin:0">· operating</span><b class="mono ${op >= 0 ? 'up' : 'dn'}">${SB(op, 2)}</b><span class="mono ${op >= 0 ? 'up' : 'dn'}" style="margin:0">${P(mg)}</span></div>`
          : `<div style="display:flex;gap:8px;align-items:baseline"><span style="margin:0">Revenue</span><b class="mono flame">?</b></div>`}</div>`;
    }).join('');
    const notes = st === 'si' ? `<div class="rcc-chips" style="margin-top:8px"><span class="rcc-chip vio rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('c', 3), inv: true })}">Cursor (since ${N.cursorClosed.replace(', 2026', '')}): ${Mn(N.cursorRevenue)} of revenue</span><span class="rcc-chip dn rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('k', 5), inv: true })}">${B(N.cursorStockComp)} deal stock pay</span></div>` : '';
    return `<div><div class="rcc-tiles segs">${tiles}</div>${notes}</div>`;
  };

  /* where the Q3 profit came from: operations vs below the operating line */
  SC.below = (x) => {
    const BL = SX.belowTheLine, parts = [['o', 'Operating income', XI.opInc, 'a'], ['x', 'Other income', BL.other, 'c'], ['x', 'Net interest', BL.netInterest, 'c'], ['t', 'Tax benefit', BL.taxBenefit, 'm']];
    const tot = parts.reduce((q, r) => q + r[2], 0), below = tot - XI.opInc;
    return `<div style="display:flex;flex-direction:column;gap:${x.narrow ? 7 : 10}px"><span class="rcc-lab">Where the ${B(XI.netInc)} of net income came from</span>
      <div class="rcc-stack" style="height:34px">${parts.map(([k, l, v, c], i) => `<i class="${c}" id="${x.A({ k: 'w', to: v / tot * 100, t0: x.m(k, 0.3 + i * 0.5), t1: x.m(k, 0.3 + i * 0.5) + 0.7 })}">${v / tot > 0.15 ? B(v) : ''}</i>`).join('')}</div>
      <div class="rcc-hb" style="gap:${x.narrow ? 2 : 8}px">${parts.map(([k, l, v], i) => `<div class="rcc-hr${i ? '' : ' on'}"><span class="l">${l}</span><span class="t" style="height:0"></span><b>${B(v, 2)}</b><em class="${i ? 'vio' : 'info'}">${i ? 'below the line' : 'operations'}</em></div>`).join('')}</div>
      <div class="rcc-chips"><span class="rcc-chip vio rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('b', 1.5), inv: true })}">≈${B(below)} below the ${x.narrow ? 'line' : 'operating line'} (${P(below / tot * 100, 0)} of the profit)</span><span class="rcc-chip flame rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('h', 9e9), inv: true })}">Hoppy: ${x.narrow ? 'plus an old grinder sold' : 'a great month, plus selling an old grinder'}</span></div>
      ${x.narrow ? '' : `<span class="rcc-sub">Other income includes ${Mn(BL.otherRelatedParty)} from a related party (reported by TIKR).</span>`}</div>`;
  };

  SC.bridge = (x) => {
    const W = x.W - 28, H = x.H - 14, br = SX.ebitda.bridge, first = br[0];
    const sum = (f) => br.slice(1).filter(f).reduce((q, r) => q + r[1], 0);
    const isDA = (r) => /^Depreciation/.test(r[0]), isSBC = (r) => /stock/i.test(r[0]), isInt = (r) => /^Interest/.test(r[0]);
    const steps = [[first[1] >= 0 ? 'Net income' : 'Net loss', first[1]], ['D&A', sum(isDA)], ['Stock pay', sum(isSBC)], ['Interest, net', sum(isInt)], ['Other, tax', sum((r) => !isDA(r) && !isSBC(r) && !isInt(r))]];
    const walk = x.show.step === 'walk', Hs = H - (walk ? (x.narrow ? 46 : 34) : 0);
    const total = steps.reduce((q, r) => q + r[1], 0);
    let run = 0, mx = 0, mn = 0; steps.forEach((r) => { run += r[1]; mx = Math.max(mx, run); mn = Math.min(mn, run); });
    const lo = Math.min(0, mn) - 500, hi = Math.max(mx, total) * 1.12, top = 26, bot = Hs - 30;
    const n = steps.length + 1, cw = (W - 6) / n, bw = Math.min(56, cw * 0.62), yf = (v) => bot - (v - lo) / (hi - lo) * (bot - top);
    let s = `<text x="0" y="14" class="cap">${x.narrow ? 'Net income to adjusted EBITDA, $B' : 'From GAAP net income to adjusted EBITDA, $ billions'}</text><line x1="0" y1="${yf(0).toFixed(1)}" x2="${W}" y2="${yf(0).toFixed(1)}" class="s-line w15"/>`;
    const td = x.m('d', 1.5);
    const times = walk ? [0.2, td, x.m('s', td + 1.5), x.m('s', td + 1.5) + 0.8, x.m('s', td + 1.5) + 1.4, x.m('s', td + 1.5) + 2.2] : [0.1, 0.35, 0.6, 0.85, 1.1, x.m('v', 1.4)];
    run = 0;
    steps.concat([['Adj. EBITDA', total]]).forEach(([l, v], i) => {
      const last = i === n - 1, a = last ? 0 : run, b = last ? total : run + v, cx = 3 + cw * i + cw / 2;
      const y1 = yf(Math.max(a, b)), y2 = yf(Math.min(a, b)), cls = last ? 'f-up' : v < 0 ? 'f-dn' : 'f-info';
      const id = x.A({ k: 'op', t0: times[i], t1: times[i] + 0.35 });
      s += `<g id="${id}" style="opacity:0"><rect x="${(cx - bw / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2, y2 - y1).toFixed(1)}" rx="3" class="${cls}"/>`;
      if (!last && i < n - 2) s += `<line x1="${(cx + bw / 2).toFixed(1)}" y1="${yf(b).toFixed(1)}" x2="${(cx + cw - bw / 2).toFixed(1)}" y2="${yf(b).toFixed(1)}" class="s-mut w1 dash2"/>`;
      s += `<text x="${cx.toFixed(1)}" y="${(v < 0 && !last ? y2 + 13 : y1 - 5).toFixed(1)}" text-anchor="middle" class="${x.narrow ? 'xs' : 'sm'} mono b ${last ? 'up' : v < 0 ? 'dn' : 'info'}">${i === 0 || last ? B(v, 1) : SB(v, 1)}</text>`;
      s += `<text x="${cx.toFixed(1)}" y="${bot + 16}" text-anchor="middle" class="xs ${last ? 'up b' : 'mut'}">${x.narrow ? l.replace('Interest, net', 'Interest').replace('Other, tax', 'Other').replace('Adj. EBITDA', 'EBITDA').replace('Net income', 'Net inc.') : l}</text></g>`;
      run = b;
    });
    if (!walk) {
      const cy = yf(SX.ebitda.pq), cid = x.A({ k: 'op', t0: x.m('y', 1.8), t1: x.m('y', 1.8) + 0.4 });
      s += `<g id="${cid}" style="opacity:0"><line x1="${(W - cw).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${W}" y2="${cy.toFixed(1)}" class="s-acc w2 dash2"/><text x="${(W - cw - 4).toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="end" class="xs acc mono">June quarter ${B(SX.ebitda.pq)}</text></g>`;
    }
    const hop = walk ? `<div class="rcc-chip flame rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('h', 9e9), inv: true })}" style="margin-top:6px">Hoppy: ${U0(HOP.op[0])} operating income + ${U0(HOP.dep)} machine wear = ${U0(HOP.op[0] + HOP.dep)} EBITDA</div>` : '';
    return `<div><svg viewBox="0 0 ${W} ${Hs}" width="${W}" height="${Hs}" role="img" aria-label="Bridge from SpaceX net income to adjusted EBITDA">${s}</svg>${hop}</div>`;
  };

  SC.capex = (x) => {
    const W = x.W - 28, H = x.H - 14, C = SX.capex, seg = SX.segments.cur, top = 28, bot = H - 34, max = 22000;
    const qs = [['Sep 2025', C.ya, XY.revenue, 'y'], ['Jun 2026', C.pq, XQ.revenue, 'p'], ['Sep 2026', C.cur, XI.revenue, 'q']];
    const L = 34, cw = (W - L) / 3, bw = Math.min(70, cw * 0.5), yf = (v) => bot - v / max * (bot - top);
    let s = `<text x="0" y="14" class="cap">SpaceX capex vs revenue, $ billions</text>`;
    for (let v = 0; v <= 20; v += 5) s += `<line x1="${L}" y1="${yf(v * 1000).toFixed(1)}" x2="${W}" y2="${yf(v * 1000).toFixed(1)}" class="s-grid"/><text x="${L - 6}" y="${(yf(v * 1000) + 3.5).toFixed(1)}" text-anchor="end" class="xs mut mono">${v}</text>`;
    qs.forEach(([l, cap, rev, k], i) => {
      const cx = L + cw * i + cw / 2, t0 = x.m(k, 0.3 + i * 0.4), cur = i === 2;
      const id = x.A({ k: 'sh', base: bot, h: bot - yf(cap), t0, t1: t0 + 0.8 });
      s += `<rect id="${id}" x="${(cx - bw / 2).toFixed(1)}" y="${yf(cap).toFixed(1)}" width="${bw.toFixed(1)}" height="${(bot - yf(cap)).toFixed(1)}" rx="3" class="f-dn${cur ? '' : ' o70'}"/>`;
      if (cur) {
        const ai = seg.find((q) => q.k === 'ai').capex, sid = x.A({ k: 'op', t0: x.m('ai', t0 + 2), t1: x.m('ai', t0 + 2) + 0.4 });
        s += `<g id="${sid}" style="opacity:0"><rect x="${(cx - bw / 2).toFixed(1)}" y="${yf(cap).toFixed(1)}" width="${bw.toFixed(1)}" height="${(yf(cap - ai) - yf(cap)).toFixed(1)}" rx="3" class="f-vio"/>${x.narrow ? `<text x="${cx.toFixed(1)}" y="${((yf(cap) + yf(cap - ai)) / 2 - 3).toFixed(1)}" text-anchor="middle" class="xs b onacc">SI</text><text x="${cx.toFixed(1)}" y="${((yf(cap) + yf(cap - ai)) / 2 + 9).toFixed(1)}" text-anchor="middle" class="xs b onacc">${B(ai)}</text>` : `<text x="${(cx - bw / 2 - 8).toFixed(1)}" y="${((yf(cap) + yf(cap - ai)) / 2 + 4).toFixed(1)}" text-anchor="end" class="sm b vio">Super Intelligence ${B(ai)}</text>`}</g>`;
      }
      const lid = x.A({ k: 'op', t0: t0 + 0.6, t1: t0 + 1 });
      s += `<g id="${lid}" style="opacity:0"><text x="${cx.toFixed(1)}" y="${(yf(Math.max(cap, rev)) - 7).toFixed(1)}" text-anchor="middle" class="sm mono b ${cur ? 'dn' : 'ink'}">${B(cap)}</text>
        <line x1="${(cx - bw / 2 - 4).toFixed(1)}" y1="${yf(rev).toFixed(1)}" x2="${(cx + bw / 2 + 4).toFixed(1)}" y2="${yf(rev).toFixed(1)}" class="s-acc w25"/></g>`;
      s += `<text x="${cx.toFixed(1)}" y="${bot + 16}" text-anchor="middle" class="xs mut">${l}</text>`;
    });
    s += `<g><line x1="${W - 120}" y1="${H - 6}" x2="${W - 104}" y2="${H - 6}" class="s-acc w25"/><text x="${W - 100}" y="${H - 2}" class="xs acc">revenue that quarter</text></g>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="SpaceX capital spending against revenue by quarter">${s}</svg>`;
  };

  SC.pairs = (x) => {
    const BS = SX.bs, gw = BS.assets.find((r) => r.k === 'gw'), rows = [['c', 'Cash and securities', X_CASH('prev'), X_CASH('cur')], ['b', 'Debt and leases', X_DEBT('prev'), X_DEBT('cur')], ['g', 'Goodwill (Cursor deal)', gw.prev, gw.cur]];
    const max = Math.max(...rows.map((r) => Math.max(r[2], r[3])));
    return `<div class="rcc-lab" style="margin-bottom:${x.narrow ? 4 : 10}px">${x.narrow ? 'Balance sheet, Dec → Sep' : `Balance sheet: ${BS.labels.prev} → ${BS.labels.cur}`}</div><div class="rcc-hb" style="gap:${x.narrow ? 6 : 12}px">${rows.map(([k, l, a, b], i) => {
      const t0 = k && x.has(k) ? x.m(k) : 0.4 + i * 0.5;
      return `<div style="display:flex;flex-direction:column;gap:${x.narrow ? 1 : 3}px"><span class="rcc-sub" style="color:var(--ink)">${l}</span>
        <div class="rcc-hr"><span class="l mono">${x.narrow ? 'Dec' : 'Dec 2025'}</span><span class="t"><i class="mut" id="${x.A({ k: 'w', to: a / max * 100, t0: 0.1, t1: 0.7 })}"></i></span><b>${B(a)}</b><em></em></div>
        <div class="rcc-hr on"><span class="l mono">${x.narrow ? 'Sep' : 'Sep 2026'}</span><span class="t"><i id="${x.A({ k: 'w', to: b / max * 100, t0, t1: t0 + 0.9 })}"></i></span><b>${B(b)}</b><em></em></div></div>`;
    }).join('')}</div><div class="rcc-chips" style="margin-top:${x.narrow ? 6 : 10}px"><span class="rcc-chip up">Net cash ≈${B(X_CASH('cur') - X_DEBT('cur'))}</span></div>`;
  };

  SC.dilution = (x) => {
    const per = 200, t0 = x.m('s', 0.3), SO = SX.bs.sharesOutstanding;
    const rows = [['Sep 2025 quarter', XY.sh, '--muted', false], ['Jun 2026 quarter', XQ.sh, '--muted', false], ['Sep 2026 quarter (diluted)', XI.sh, '--violet', true]];
    const dots = (n, cls, anim) => `<div style="display:flex;flex-wrap:wrap;gap:4px">${Array.from({ length: n }, (_, i) => `<i ${anim ? `id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: t0 + i * 0.02, inv: true })}" ` : ''}class="rcc-fade" style="display:block;width:8px;height:8px;border-radius:50%;background:var(${cls})"></i>`).join('')}</div>`;
    return `<div style="display:flex;flex-direction:column;gap:${x.narrow ? 6 : 9}px"><span class="rcc-lab">Average shares · each dot = ${per} million</span>
      ${rows.map(([l, v, c, anim]) => `<div><span class="rcc-sub" style="color:var(--ink)">${l}: ${F.num(v / 1000, 2)}B</span>${dots(Math.round(v / per), c, anim)}</div>`).join('')}
      <div class="rcc-chips rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('w', 3), inv: true })}"><span class="rcc-chip vio">Class A ${F.num(SO.classA[1])}M → ${F.num(SO.classA[0])}M</span><span class="rcc-chip vio">Class B ${F.num(SO.classB[1])}M → ${F.num(SO.classB[0])}M</span>${x.narrow ? '' : '<span class="rcc-chip">Outstanding, Dec 31 → Sep 30</span>'}</div></div>`;
  };

  SC.subs = (x) => {
    const W = x.W - 28, H = x.H - 14, Mx = SX.metrics, lab = ['Sep 2025', 'Jun 2026', 'Sep 2026'], subs = [Mx.subs[2], Mx.subs[1], Mx.subs[0]], arpu = [Mx.arpu[2], Mx.arpu[1], Mx.arpu[0]];
    const Hs = H - (x.narrow ? 40 : 34), L = 30, R = W - 46, top = 30, bot = Hs - 22, cw = (R - L) / 3, bw = Math.min(64, cw * 0.5), yf = (v) => bot - v / 16 * (bot - top), af = (v) => bot - (v - 40) / 60 * (bot - top);
    let s = `<text x="0" y="14" class="cap">${x.narrow ? 'Subscribers (M) and ARPU ($/month)' : 'Starlink consumer subscribers (millions) and ARPU'}</text>`;
    subs.forEach((v, i) => {
      const cx = L + cw * i + cw / 2, t0 = 0.2 + i * 0.25;
      s += `<rect id="${x.A({ k: 'sh', base: bot, h: bot - yf(v), t0, t1: t0 + 0.8 })}" x="${(cx - bw / 2).toFixed(1)}" y="${yf(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(bot - yf(v)).toFixed(1)}" rx="3" class="${i === 2 ? 'f-info' : 'f-info o50'}"/>`;
      s += `<text x="${cx.toFixed(1)}" y="${(yf(v) - 6).toFixed(1)}" text-anchor="middle" class="sm mono ink">${F.num(v, 1)}M</text><text x="${cx.toFixed(1)}" y="${bot + 16}" text-anchor="middle" class="xs mut">${lab[i]}</text>`;
    });
    const ta = x.m('a', 1.5), aid = x.A({ k: 'op', t0: ta, t1: ta + 0.4 });
    s += `<g id="${aid}" style="opacity:0"><polyline points="${arpu.map((v, i) => `${(L + cw * i + cw / 2).toFixed(1)},${af(v).toFixed(1)}`).join(' ')}" class="nf s-acc w25"/>${arpu.map((v, i) => `<circle cx="${(L + cw * i + cw / 2).toFixed(1)}" cy="${af(v).toFixed(1)}" r="5" class="f-acc"/><text x="${(L + cw * i + cw / 2 + 9).toFixed(1)}" y="${(af(v) - 7).toFixed(1)}" class="sm mono b acc">$${v}</text>`).join('')}${x.narrow ? '' : `<text x="${W}" y="14" text-anchor="end" class="xs acc">ARPU, $ a month</text>`}</g>`;
    const nid = x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('s', 1), inv: true });
    return `<svg viewBox="0 0 ${W} ${Hs}" width="${W}" height="${Hs}" role="img" aria-label="Starlink subscribers and revenue per user">${s}</svg>
      <div class="rcc-chips"><span class="rcc-chip info rcc-fade" id="${nid}">${SP(yoy(Mx.subs[0], Mx.subs[2]), 0)} subscribers in a year</span><span class="rcc-chip rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: ta + 0.6, inv: true })}">${Mx.netAdds}M added in the quarter</span></div>`;
  };

  /* SpaceX's Q3 guidance against expectations, on two number lines */
  SC.sxguide = (x) => {
    const gap = x.show.step === 'gap', W = x.W - 28, lo = 10, hi = 42, L = 10, R = W - 10, xf = (v) => L + (v - lo) / (hi - lo) * (R - L), y1 = 58, y2 = gap ? 170 : 150, H = y2 + 34;
    const cons = XE.q1_2027Revenue / 1000, g0 = X_Q1G[0] / 1000, g1 = X_Q1G[1] / 1000, c0 = SX.capex.q4Guide[0] / 1000, c1 = SX.capex.q4Guide[1] / 1000;
    const op = (k, d) => { const t = gap ? 0.1 : x.m(k, d); return x.A({ k: 'op', t0: t, t1: t + 0.4 }); };
    const axis = (y) => { let a = `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" class="s-line w2"/>`; for (let v = lo; v <= hi; v += x.narrow ? 10 : 5) a += `<line x1="${xf(v).toFixed(1)}" y1="${y - 4}" x2="${xf(v).toFixed(1)}" y2="${y + 4}" class="s-line"/><text x="${xf(v).toFixed(1)}" y="${y + 17}" text-anchor="middle" class="xs mut mono">${v}</text>`; return a; };
    let s = `<text x="0" y="12" class="cap">Q1 2027 revenue, $ billions</text>${axis(y1)}`;
    s += `<circle cx="${xf(XI.revenue / 1000).toFixed(1)}" cy="${y1}" r="5" class="f-mut"/><text x="${xf(XI.revenue / 1000).toFixed(1)}" y="${y1 + 32}" text-anchor="middle" class="xs mut mono">Q3 actual ${B(XI.revenue)}</text>`;
    s += `<g id="${op('c', 2)}" style="opacity:0"><path d="M${xf(cons).toFixed(1)} ${y1 - 8}l-6 -10h12z" class="f-info"/><text x="${xf(cons).toFixed(1)}" y="${y1 - 22}" text-anchor="middle" class="sm b info">Analysts ≈${B(XE.q1_2027Revenue)}</text></g>`;
    s += `<g id="${op('g', 0.5)}" style="opacity:0"><rect x="${xf(g0).toFixed(1)}" y="${y1 - 11}" width="${(xf(g1) - xf(g0)).toFixed(1)}" height="22" rx="4" class="f-acc-t s-acc w15"/><text x="${xf((g0 + g1) / 2).toFixed(1)}" y="${y1 - 18}" text-anchor="middle" class="sm b acc">Guide ${F.usd(g0, 0)}–${F.num(g1, 0)}B</text></g>`;
    if (gap) s += `<g id="${x.A({ k: 'op', t0: x.m('g', 0.4), t1: x.m('g', 0.4) + 0.4 })}" style="opacity:0"><path d="M${xf(cons).toFixed(1)} ${y1 + 38}v6H${xf(g0).toFixed(1)}v-6" class="nf s-up w15"/><text x="${xf((cons + g0) / 2).toFixed(1)}" y="${y1 + 58}" text-anchor="middle" class="sm b up">${SP(yoy(g0, cons), 0)} at the low end</text></g>`;
    s += `<text x="0" y="${y2 - 40}" class="cap">Quarterly capex, $ billions</text>${axis(y2)}`;
    s += `<circle cx="${xf(SX.capex.cur / 1000).toFixed(1)}" cy="${y2}" r="5" class="f-mut"/><text x="${xf(SX.capex.cur / 1000).toFixed(1)}" y="${y2 + 32}" text-anchor="middle" class="xs mut mono">Q3 actual ${B(SX.capex.cur)}</text>`;
    s += `<g id="${op('x', 4)}" style="opacity:0"><rect x="${xf(c0).toFixed(1)}" y="${y2 - 11}" width="${(xf(c1) - xf(c0)).toFixed(1)}" height="22" rx="4" class="f-dn-t s-dn w15"/><text x="${Math.min(xf((c0 + c1) / 2), R - 40).toFixed(1)}" y="${y2 - 18}" text-anchor="middle" class="sm b dn">Q4 guide ${F.usd(c0, 0)}–${F.num(c1, 0)}B</text></g>`;
    const chips = `<div class="rcc-chips" style="margin-top:4px">${gap && x.narrow ? '' : `<span class="rcc-chip vio rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: gap ? 0.2 : x.m('w', 6), inv: true })}">Compute ${F.num(SX.metrics.computeGW[0], 1)} GW → ${X_GW[0]}–${X_GW[1]} GW by year end</span>`}${gap ? `<span class="rcc-chip info rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('k', 3), inv: true })}">Backlog ${B(SX.metrics.backlog, 0)} (≈${B(SX.metrics.backlogNext12m, 0)} within a year)</span>` : ''}</div>`;
    return `<div><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="SpaceX guidance against analyst expectations">${s}</svg>${chips}</div>`;
  };

  /* the same lesson from two calls: Apple (beat, guide below) vs SpaceX Q3 (beat, guide far above) */
  SC.compare = (x) => {
    const card = (name, when, rows, move, cls, t0) => `<div class="rcc-box rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: t0, inv: true })}" style="flex:1 1 0;gap:6px"><small>${name} · ${when}</small>
      ${rows.map(([l, v, c]) => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;color:var(--text)"><span>${l}</span><span class="${c}" style="font-weight:600">${v}</span></div>`).join('')}
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;border-top:1px solid var(--line);padding-top:6px"><span class="rcc-lab">Next day</span><b class="${cls}">${move}</b></div></div>`;
    const yc = yourCall(x);
    return `<div style="display:flex;flex-direction:column;gap:10px">${yc ? `<div class="rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('y', 0.2), inv: true })}">${yc}</div>` : ''}
      <div style="display:flex;gap:10px">${card('Apple', 'Jul 30', [['Results', 'Beat', 'up'], ['Guidance', 'Below', 'dn']], SP(AR.closePct), 'dn', x.m('a', 1.5))}${card('SpaceX', 'Oct 20', [['Results', 'Beat', 'up'], ['Guidance', 'Far above', 'up']], SP(XR.nextDayPct), 'up', 0.2)}</div>
      <span class="rcc-chip acc rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('b', 4), inv: true })}">Both beat. The outlook decided the direction.</span></div>`;
  };

  /* three months earlier: the first report (Aug 4) against the latest one (Oct 20) */
  SC.flash = (x) => {
    const W = x.W - 28, H = x.H - 14 - (x.narrow ? 50 : 34), Q = XQ2.reaction, R2 = XR;
    const pts = [['Aug 4', Q.closeBefore, 'r', 'ink'], ['Aug 5', Q.nextDayClose, 'd', 'dn'], ['Oct 20', R2.closeBefore, '', 'ink'], ['Oct 21', R2.closeAfter, '', 'up']];
    const lo = 90, hi = 165, L = 34, Rr = W - 14, top = 30, bot = H - 24, xs = [0, 0.28, 0.72, 1].map((f) => L + (Rr - L) * f), yf = (v) => bot - (v - lo) / (hi - lo) * (bot - top);
    let s = `<text x="0" y="14" class="cap">${x.narrow ? 'SPCX closes, two reports' : 'SPCX closing prices around its two reports'}</text>`;
    for (let v = 100; v <= 160; v += 20) s += `<line x1="${L}" y1="${yf(v).toFixed(1)}" x2="${W}" y2="${yf(v).toFixed(1)}" class="s-grid"/><text x="${L - 6}" y="${(yf(v) + 3.5).toFixed(1)}" text-anchor="end" class="xs mut mono">${v}</text>`;
    const tD = x.m('d', 4);
    s += `<g id="${x.A({ k: 'op', t0: tD, t1: tD + 0.4 })}" style="opacity:0"><line x1="${xs[0]}" y1="${yf(pts[0][1]).toFixed(1)}" x2="${xs[1]}" y2="${yf(pts[1][1]).toFixed(1)}" class="s-dn w25"/></g>`;
    s += `<line x1="${xs[1]}" y1="${yf(pts[1][1]).toFixed(1)}" x2="${xs[2]}" y2="${yf(pts[2][1]).toFixed(1)}" class="s-mut w15 dash2"/><text x="${((xs[1] + xs[2]) / 2).toFixed(1)}" y="${(yf((pts[1][1] + pts[2][1]) / 2) + 18).toFixed(1)}" text-anchor="middle" class="xs mut">11 weeks</text>`;
    s += `<line x1="${xs[2]}" y1="${yf(pts[2][1]).toFixed(1)}" x2="${xs[3]}" y2="${yf(pts[3][1]).toFixed(1)}" class="s-up w25"/>`;
    pts.forEach(([l, v, k, c], i) => {
      const id = k ? x.A({ k: 'op', t0: k === 'd' ? tD : x.m(k, 0.3), t1: (k === 'd' ? tD : x.m(k, 0.3)) + 0.4 }) : '';
      const above = i !== 1, anc = i === 0 ? 'start' : i === 3 ? 'end' : 'middle';
      s += `<g${id ? ` id="${id}" style="opacity:0"` : ''}><circle cx="${xs[i]}" cy="${yf(v).toFixed(1)}" r="5" class="f-${c === 'ink' ? 'ink' : c}"/><text x="${xs[i] + (i === 0 ? -4 : i === 3 ? 4 : 0)}" y="${(yf(v) + (above ? -10 : 18)).toFixed(1)}" text-anchor="${anc}" class="sm mono b ${c}">${F.usd(v)}${i === 1 ? ` (${SP(Q.nextDayPct)})` : i === 3 ? ` (${SP(R2.nextDayPct)})` : ''}</text><text x="${xs[i]}" y="${bot + 16}" text-anchor="${i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}" class="xs mut">${l}</text></g>`;
    });
    const chips = `<div class="rcc-chips" style="margin-top:4px"><span class="rcc-chip dn rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('c', 2), inv: true })}">Q2 capex ${B(SX.capex.pq)} vs ≈${B(XQ2.expectations.capex, 0)} expected</span><span class="rcc-chip vio rcc-fade" id="${x.A({ k: 'cls', cls: 'rcc-hide', t0: -1, t1: x.m('l', 3), inv: true })}">First lockup release: Aug 6</span></div>`;
    return `<div><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="SpaceX share price after its first and second reports">${s}</svg>${chips}</div>`;
  };

  /* ======================================================================
     The player
     ====================================================================== */
  const PATH = { play: '<path d="M8 5.5v13l11-6.5z"/>', pause: '<path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/>', prev: '<path d="M6 5h2v14H6zM19 5v14L9 12z"/>', next: '<path d="M16 5h2v14h-2zM5 5v14l10-7z"/>', replay: '<path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/>' };
  const svgI = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${PATH[k]}</svg>`;
  const tfmt = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const ease = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  let lastActive = null;

  SML.widgets.callPlayer = function (root, opts) {
    opts = opts || {};
    const fixed = SCRIPTS[opts.call] ? opts.call : null;
    const id = SML.uid('rcc');
    const me = {};
    let script = SCRIPTS[fixed || 'apple'];
    root.classList.add('rcc');
    const st = { mode: 'audio', playing: false, t: 0, rate: 1, cue: -1, answers: {}, cpOpen: null, cpDone: {}, ended: false, tab: 'tr', userScroll: 0, started: false };
    let audio = null, audioState = 'none', raf = 0, vclock = null, speech = null, loadTimer = 0, destroyed = false, seekTok = null;
    const reduced = SML.reduced();

    root.innerHTML = `
      <div class="wg-bar rcc-bar"><div class="rcc-head"><span class="wg-title">Earnings call, explained</span><span class="rcc-name" id="${id}-name"></span></div><span class="grow"></span>
        ${fixed ? '' : ui.seg(id + '-call', [{ v: 'apple', label: 'Apple' }, { v: 'spacex', label: 'SpaceX' }], 'apple', 'Choose a call')}</div>
      <div class="rcc-main">
        <div class="rcc-left">
          <div class="wg-fig rcc-stage" id="${id}-stage" tabindex="-1">
            <div class="rcc-top"><span class="rcc-who n" id="${id}-who"></span><span class="grow"></span><span class="rcc-chap" id="${id}-chap"></span></div>
            <div class="rcc-scene" id="${id}-scene"></div>
            <div class="rcc-cp" id="${id}-cp" hidden></div>
          </div>
          <div class="rcc-cap idle" id="${id}-cap" aria-live="off"></div>
          <div class="rcc-tp">
            <button type="button" class="rcc-play" id="${id}-play" aria-label="Play">${svgI('play')}</button>
            <div class="rcc-tpm">
              <div class="rcc-scrub" id="${id}-scrub" role="slider" tabindex="0" aria-label="Position in the call" aria-valuemin="0"><div class="rcc-sg" id="${id}-sg"></div><span class="rcc-th" id="${id}-th"></span></div>
              <div class="rcc-tr"><span class="rcc-time" id="${id}-time">0:00</span><span class="rcc-cn" id="${id}-cn"></span><span class="grow"></span>
                <button type="button" class="rcc-ib" data-a="prev" aria-label="Previous line">${svgI('prev')}</button><button type="button" class="rcc-ib" data-a="next" aria-label="Next line">${svgI('next')}</button></div>
            </div>
          </div>
          <div class="rcc-opts"><span><span class="rcc-lab">Speed</span>${ui.seg(id + '-rate', [{ v: '0.75', label: '0.75×' }, { v: '1', label: '1×' }, { v: '1.25', label: '1.25×' }, { v: '1.5', label: '1.5×' }], '1', 'Playback speed')}</span>
            <span><span class="rcc-lab">Mode</span>${ui.seg(id + '-mode', [{ v: 'audio', label: 'Audio' }, { v: 'speech', label: 'Device voice' }, { v: 'read', label: 'Read along' }], 'audio', 'How to play the narration')}</span></div>
          <div class="rcc-fb" id="${id}-fb" hidden></div>
        </div>
        <div class="rcc-right"><div class="rcc-rin">
          <div class="rcc-tabs">${ui.seg(id + '-tab', [{ v: 'tr', label: 'Transcript' }, { v: 'ch', label: 'Chapters' }], 'tr', 'Transcript or chapters')}</div>
          <div class="rcc-list" id="${id}-list" tabindex="0" aria-label="Transcript: click a line to jump there"></div>
        </div></div>
      </div>
      <div class="wg-note rcc-note"><span>Narration written by FiredBunny: a plain-words retelling of the call, not the recording. Voices: Piper text-to-speech, LibriTTS voices (CC BY 4.0).</span><span id="${id}-src"></span><span>Space bar plays and pauses; arrow keys skip 5 seconds. Education only, not investment advice.</span></div>`;

    const $ = (s) => document.getElementById(id + '-' + s);
    const stageEl = $('stage'), sceneEl = $('scene'), capEl = $('cap'), playBtn = $('play'), scrub = $('scrub'), listEl = $('list'), cpEl = $('cp'), fbEl = $('fb');
    let anims = [], capUnits = [], capSent = -1, lastU = -2, sceneCue = -1, sceneW = 0, sceneH = 0, phaseShown = -1;

    /* ---------- layout ---------- */
    const layout = () => {
      const w = root.clientWidth; root.classList.toggle('rcc-wide', w >= 940);
      const sw = sceneEl.clientWidth || (w - 2);
      const narrow = sw < 480; root.classList.toggle('rcc-n', narrow);
      const H = narrow ? 268 : sw < 700 ? 292 : 316;
      if (Math.abs(sw - sceneW) > 1 || H !== sceneH) { sceneW = sw; sceneH = H; sceneEl.style.height = H + 'px'; sceneCue = -1; sizeCaption(); render(true); }
    };
    /* keep the caption box as tall as the longest sentence of this call, so the controls never jump */
    function sizeCaption() {
      let best = null, n = 0;
      script.cues.forEach((c) => c.sents.forEach(([a, b]) => { const txt = c.units.slice(a, b).map((u) => u.cap).join(' '); if (txt.length > n) { n = txt.length; best = txt; } }));
      capEl.style.minHeight = '';
      capEl.innerHTML = `<span class="who">Bunny coach</span><p>${esc(best || '')}</p>`;
      capEl.style.minHeight = capEl.offsetHeight + 'px';
      capSent = -1;
    }

    /* ---------- header, scrubber, transcript ---------- */
    function setupScript() {
      $('name').innerHTML = `${esc(script.company)} · ${esc(script.title)}<small>${esc(script.when)}</small>`;
      const src = (script.key === 'apple' ? AP : SX).sources[0];
      $('src').innerHTML = `Official source: <a href="${esc(src.u)}" target="_blank" rel="noopener noreferrer">${esc(src.t)}</a>. Figures as of ${esc(RC.asOf)}.`;
      $('sg').innerHTML = script.chapterList.map((ch) => `<i style="flex:${Math.max(0.5, ch.end - ch.start).toFixed(2)} 1 0" title="${esc(ch.label)}"><b></b></i>`).join('');
      scrub.querySelectorAll('.rcc-cpm').forEach((e) => e.remove());
      script.cues.forEach((c) => { if (c.cp) scrub.insertAdjacentHTML('beforeend', `<b class="rcc-cpm" data-cp="${c.cp}" style="left:${(c.end / script.dur * 100).toFixed(2)}%" title="Checkpoint"></b>`); });
      scrub.setAttribute('aria-valuemax', Math.round(script.dur));
      buildList();
      st.t = 0; st.cue = -1; st.ended = false; st.answers = {}; st.cpDone = {}; sceneCue = -1; capSent = -1;
      if (sceneW) { sizeCaption(); render(true); }
    }
    function buildList() {
      if (st.tab === 'ch') {
        listEl.innerHTML = `<ol class="rcc-chl">${script.chapterList.map((ch, n) => `<li><button type="button" data-t="${ch.start.toFixed(2)}" data-ch="${n}"><span class="n">${String(n + 1).padStart(2, '0')}</span><span>${esc(ch.label)}</span><span class="d">${tfmt(ch.start)}</span></button></li>`).join('')}</ol>`;
      } else {
        let h = '', ch = '';
        script.cues.forEach((c, i) => {
          if (c.chapter !== ch) { ch = c.chapter; const C2 = script.chapterList.find((q) => q.k === ch); h += `<button type="button" class="rcc-chh" data-t="${C2.start.toFixed(2)}"><span>${esc(C2.label)}</span><span>${tfmt(C2.start)}</span></button>`; }
          h += `<button type="button" class="rcc-li" data-i="${i}"><span class="ts">${tfmt(c.start)}</span><span><span class="sp${c.speaker === 'coach' ? ' c' : ''}">${c.speaker === 'coach' ? 'Bunny coach' : 'Narrator'}${c.cp ? '<span class="cpt">Checkpoint</span>' : ''}</span>${esc(c.cap)}</span></button>`;
        });
        listEl.innerHTML = h;
      }
      markList(true);
    }
    function markList(scroll) {
      if (st.tab === 'ch') {
        const n = chapterAt(st.t);
        listEl.querySelectorAll('.rcc-chl button').forEach((b) => b.classList.toggle('on', Number(b.dataset.ch) === n));
        return;
      }
      let on = null;
      listEl.querySelectorAll('.rcc-li').forEach((b) => { const yes = Number(b.dataset.i) === st.cue; b.classList.toggle('on', yes); if (yes) on = b; });
      if (on && scroll && Date.now() - st.userScroll > 4000) {
        const top = on.offsetTop - listEl.offsetTop, h = listEl.clientHeight;
        if (top < listEl.scrollTop + 20 || top + on.offsetHeight > listEl.scrollTop + h - 20) listEl.scrollTo({ top: Math.max(0, top - h * 0.3), behavior: reduced ? 'auto' : 'smooth' });
      }
    }
    listEl.addEventListener('wheel', () => { st.userScroll = Date.now(); }, { passive: true });
    listEl.addEventListener('touchmove', () => { st.userScroll = Date.now(); }, { passive: true });
    listEl.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || !listEl.contains(b)) return;
      st.userScroll = 0;
      if (b.dataset.i != null) seek(script.cues[Number(b.dataset.i)].start + 0.02);
      else if (b.dataset.t != null) seek(Number(b.dataset.t) + 0.16);
    });

    /* ---------- time helpers ---------- */
    const cueAt = (t) => { const C2 = script.cues; let lo = 0, hi = C2.length - 1, r = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (C2[m].start - 0.18 <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
    const chapterAt = (t) => { const L = script.chapterList; let n = 0; L.forEach((ch, i) => { if (t >= ch.start) n = i; }); return n; };

    /* ---------- the scene ---------- */
    function sceneCtx(c) {
      const marks = c.marks;
      const x = { W: sceneW, H: sceneH - 20, narrow: sceneW < 480, show: c.show, cue: c, script, D: c.end - c.start, answers: st.answers,
        has: (k) => marks[k] != null,
        m: (k, d) => marks[k] != null ? Math.max(0, c.ut[marks[k]] - c.start) : (d == null ? 0 : d),
        A: (spec) => { const eid = id + '-e' + anims.length; anims.push(Object.assign({ el: eid }, spec)); return eid; } };
      return x;
    }
    function drawScene(i) {
      const c = script.cues[i]; anims = [];
      let html = '';
      try { html = (SC[c.show.k] || SC.title)(sceneCtx(c)); } catch (err) { console.error('callPlayer scene ' + c.show.k, err); html = ''; }
      sceneEl.innerHTML = html; sceneCue = i; phaseShown = -1;
      anims.forEach((a) => { a.node = document.getElementById(a.el); });
    }
    function applyAnims(phase) {
      const fin = reduced || phase >= 1e8;
      for (const a of anims) {
        const el = a.node; if (!el) continue;
        if (a.k === 'cls') { const on = fin ? (a.inv ? true : a.t0 < 1e8) : (a.inv ? phase >= a.t1 : phase >= a.t0); if (a.inv) el.classList.toggle(a.cls, !on); else el.classList.toggle(a.cls, on); continue; }
        if (a.k === 'wave') { const kids = el.children, on = st.playing && !fin; for (let j = 0; j < kids.length; j++) { const h = on ? 6 + 26 * Math.abs(Math.sin(phase * 3.1 + j * 0.55) * Math.sin(phase * 1.3 + j * 0.21)) : 6 + 18 * Math.abs(Math.sin(j * 0.55) * Math.sin(j * 0.21 + 1)); kids[j].style.height = h.toFixed(1) + 'px'; } continue; }
        const p = fin ? 1 : ease(SML.clamp((phase - a.t0) / Math.max(0.001, a.t1 - a.t0), 0, 1));
        if (a.k === 'count') { const txt = a.fmt(SML.lerp(a.from, a.to, p)); if (el._t !== txt) { el.textContent = txt; el._t = txt; } }
        else if (a.k === 'w') el.style.width = (a.to * p).toFixed(2) + '%';
        else if (a.k === 'op') el.style.opacity = p.toFixed(3);
        else if (a.k === 'sh') { el.setAttribute('height', (a.h * p).toFixed(1)); el.setAttribute('y', (a.base - a.h * p).toFixed(1)); }
        else if (a.k === 'sw') { el.setAttribute('width', (a.w * p).toFixed(1)); el.setAttribute('x', (a.x0 - a.w * p / 2).toFixed(1)); }
      }
    }

    /* ---------- caption ---------- */
    function drawCaption(c, k) {
      const [a, b] = c.sents[k];
      capUnits = [];
      const who = c.speaker === 'coach' ? 'Bunny coach' : 'Narrator';
      capEl.className = 'rcc-cap' + (c.speaker === 'coach' ? ' c' : '') + (st.started ? '' : ' idle');
      capEl.innerHTML = `<span class="who">${who}</span><p>${c.units.slice(a, b).map((u, j) => `<span class="w" data-u="${a + j}">${esc(u.cap)}</span>`).join(' ')}</p>`;
      capUnits = Array.from(capEl.querySelectorAll('.w')); capSent = k; lastU = -2;
    }
    function setWho(c) {
      const w = $('who');
      w.className = 'rcc-who ' + (c.speaker === 'coach' ? 'c' : 'n');
      w.innerHTML = c.speaker === 'coach' ? `<span class="av">${SML.bunnyMark(22)}</span>Bunny coach` : `<span class="av">${ICON.mic}</span>Narrator`;
      const ch = script.chapterList.find((q) => q.k === c.chapter);
      $('chap').innerHTML = `<span class="rcc-live"></span>${ch.k === 'after' || ch.k === 'flash' ? '' : 'On the call · '}${esc(ch.label)}`;
    }

    /* ---------- main render for time st.t ---------- */
    function render(force) {
      if (destroyed) return;
      const t = st.t, i = cueAt(t), c = script.cues[i];
      if (i !== st.cue || force) {
        st.cue = i; setWho(c); markList(true);
        if (sceneCue !== i || force) drawScene(i);
        capSent = -1;
      }
      // sentence + word highlight
      let k = 0; for (let j = 0; j < c.st.length; j++) if (t >= c.st[j][0] - 0.05) k = j;
      if (k !== capSent) drawCaption(c, k);
      let u = -1; if (st.started) { const [a, b] = c.sents[k]; for (let j = a; j < b; j++) if (t >= c.ut[j] - 0.02) u = j; }
      if (u !== lastU) { const a = c.sents[k][0]; capUnits.forEach((el, j) => { const g = a + j; el.className = 'w' + (g < u ? ' p' : g === u ? ' k' : ''); }); lastU = u; }
      // stage animation phase: when paused near a cue start, show the finished picture
      let phase = t - c.start; if (!st.playing && !st.started) phase = 1e9; else if (!st.playing && phase < 0.25) phase = 1e9;
      if (phase !== phaseShown || anims.some((a) => a.k === 'wave')) { applyAnims(phase); phaseShown = phase; }
      // scrubber
      script.chapterList.forEach((ch, n) => { const seg = $('sg').children[n]; if (seg) seg.firstChild.style.width = (SML.clamp((t - ch.start) / Math.max(0.01, ch.end - ch.start), 0, 1) * 100).toFixed(2) + '%'; });
      $('th').style.left = (SML.clamp(t / script.dur, 0, 1) * 100).toFixed(3) + '%';
      $('time').textContent = `${tfmt(t)} / ${tfmt(script.dur)}`;
      const chn = chapterAt(t); $('cn').textContent = `${String(chn + 1).padStart(2, '0')} · ${script.chapterList[chn].label}`;
      scrub.setAttribute('aria-valuenow', Math.round(t)); scrub.setAttribute('aria-valuetext', `${tfmt(t)} of ${tfmt(script.dur)}, ${script.chapterList[chn].label}`);
      scrub.querySelectorAll('.rcc-cpm').forEach((m) => m.classList.toggle('done', !!st.cpDone[m.dataset.cp]));
      if (st.tab === 'ch') markList(false);
    }

    /* ---------- clocks ---------- */
    const now = () => performance.now() / 1000;
    function curTime() {
      if (st.mode === 'audio' && audio && audioState === 'ok') return audio.currentTime;
      if (st.mode === 'speech' && speech) return speech.time();
      if (vclock) return vclock.t0 + (now() - vclock.n0) * st.rate;
      return st.t;
    }
    function loop() {
      raf = 0; if (destroyed || !root.isConnected) { stopAll(); return; }
      if (!st.playing) return;
      const prev = st.t; let t = curTime();
      // checkpoints: stop at the end of a checkpoint cue that has not been answered
      const c = script.cues[cueAt(prev)];
      if (c && c.cp && !st.cpDone[c.cp] && prev < c.end + 0.05 && t >= c.end + 0.05) { t = c.end + 0.05; st.t = t; pause(); openCheckpoint(c.cp); render(); return; }
      if (t >= script.dur - 0.05) { st.t = script.dur; finish(); return; }
      st.t = t; render();
      raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    /* recording */
    function ensureAudio() {
      if (audio) return audio;
      audio = new Audio();
      audio.preload = 'auto';
      const can = (m) => { try { return audio.canPlayType(m); } catch (e) { return ''; } };
      const ext = can('audio/mp4; codecs="mp4a.40.2"') ? 'mp4' : can('audio/webm; codecs="opus"') ? 'webm' : 'mp4';
      audio.src = `audio/${script.file}.${ext}`;
      audioState = 'loading';
      audio.addEventListener('error', () => { if (destroyed) return; audioState = 'err'; if (st.mode === 'audio') { st.playing = false; showFallback('The recording could not load here (offline, or the page was opened as a file).'); updatePlay(); } });
      audio.addEventListener('playing', () => { audioState = 'ok'; playBtn.classList.remove('busy'); clearTimeout(loadTimer); hideFallback(); });
      audio.addEventListener('waiting', () => { if (st.playing) playBtn.classList.add('busy'); });
      audio.addEventListener('canplay', () => { if (audioState === 'loading') audioState = 'ok'; playBtn.classList.remove('busy'); });
      audio.addEventListener('ended', () => { if (st.mode === 'audio') { st.t = script.dur; finish(); } });
      return audio;
    }
    function playAudio() {
      const a = ensureAudio();
      if (audioState === 'err') { showFallback('The recording could not load here (offline, or the page was opened as a file).'); return false; }
      a.playbackRate = st.rate;
      if (Math.abs(a.currentTime - st.t) > 0.3) { try { a.currentTime = st.t; } catch (e) {} }
      playBtn.classList.add('busy');
      clearTimeout(loadTimer);
      loadTimer = setTimeout(() => { if (st.playing && st.mode === 'audio' && audioState !== 'ok') showFallback('The recording is taking a while to load.'); }, 9000);
      let p; try { p = a.play(); } catch (e) { p = null; }
      if (p && p.then) p.then(() => { audioState = 'ok'; if (Math.abs(a.currentTime - st.t) > 0.3) { try { a.currentTime = st.t; } catch (e) {} } }).catch((err) => {
        if (destroyed) return; playBtn.classList.remove('busy');
        if (err && err.name === 'NotAllowedError') { st.playing = false; updatePlay(); return; }
        if (err && err.name === 'AbortError') return;
        audioState = 'err'; st.playing = false; updatePlay(); showFallback('The recording could not play here.');
      });
      return true;
    }

    /* device voice: one utterance per sentence, advancing on end */
    function speechSupported() { return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'; }
    function startSpeech() {
      if (!speechSupported()) { voiceFailed('This browser has no built-in voice, so this switched to Read along.'); return; }
      const synth = window.speechSynthesis, token = {};
      let ci = cueAt(st.t), si = 0, s0 = 0, base = 0, started = false;
      const c0 = script.cues[ci]; for (let j = 0; j < c0.st.length; j++) if (st.t >= c0.st[j][0] - 0.05) si = j;
      const voices = () => { try { return synth.getVoices().filter((v) => /^en/i.test(v.lang)); } catch (e) { return []; } };
      const say = () => {
        if (speech !== token || destroyed) return;
        const c = script.cues[ci]; if (!c) { st.t = script.dur; finish(); return; }
        const [a, b] = c.st[si]; base = a; s0 = now(); token.span = b - a;
        const u = new SpeechSynthesisUtterance(c.sentSay[si]);
        const vs = voices(); if (vs.length) u.voice = vs[(c.speaker === 'coach' && vs.length > 1) ? 1 : 0];
        u.lang = 'en-US'; u.rate = st.rate;
        u.onstart = () => { started = true; s0 = now(); };
        u.onboundary = (e) => { if (speech !== token || !e || e.charIndex == null) return; const L = c.sentSay[si].length || 1; token.frac = e.charIndex / L; };
        u.onend = () => {
          if (speech !== token) return;
          token.frac = 0;
          if (si < c.st.length - 1) { si++; say(); return; }
          if (c.cp && !st.cpDone[c.cp]) { st.t = c.end + 0.05; speech = null; st.playing = false; updatePlay(); openCheckpoint(c.cp); render(); return; }
          ci++; si = 0; if (ci >= script.cues.length) { speech = null; st.t = script.dur; finish(); return; }
          say();
        };
        u.onerror = (e) => { if (speech !== token) return; if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; speech = null; voiceFailed('Your device’s voice is not available here, so this switched to Read along.'); };
        try { synth.speak(u); } catch (err) { speech = null; voiceFailed('Your device’s voice is not available here, so this switched to Read along.'); }
      };
      token.time = () => { const span = token.span || 1; const est = token.frac ? token.frac * span : (now() - s0) * st.rate * 0.95; return base + Math.min(span - 0.02, est); };
      try { synth.cancel(); } catch (e) {}
      speech = token;
      say();
      setTimeout(() => { if (speech === token && !started && !destroyed) { try { synth.cancel(); } catch (e) {} speech = null; voiceFailed('Your device’s voice did not start, so this switched to Read along.'); } }, 3000);
    }
    function voiceFailed(msg) { st.playing = false; vclock = null; setMode('read'); showFallback(msg, true); play(); }
    function stopSpeech() { if (speech) { speech = null; try { window.speechSynthesis.cancel(); } catch (e) {} } }

    /* ---------- transport ---------- */
    function play() {
      if (st.cpOpen) return;
      if (st.ended || st.t >= script.dur - 0.1) { st.t = 0; st.ended = false; }
      st.started = true; lastActive = me;
      if (st.mode === 'audio') { st.playing = true; if (!playAudio()) { st.playing = false; updatePlay(); return; } }
      else if (st.mode === 'speech') { st.playing = true; startSpeech(); }
      else { st.playing = true; vclock = { t0: st.t, n0: now() }; }
      updatePlay(); render(true); kick();
    }
    function pause() {
      st.t = curTime();
      st.playing = false;
      if (audio) { try { audio.pause(); } catch (e) {} }
      stopSpeech(); vclock = null; playBtn.classList.remove('busy');
      updatePlay(); render();
    }
    function finish() { st.playing = false; st.ended = true; if (audio) { try { audio.pause(); } catch (e) {} } stopSpeech(); vclock = null; updatePlay(); render(); }
    function toggle() { if (st.playing) pause(); else play(); }
    function seek(t) {
      t = SML.clamp(t, 0, script.dur); st.t = t; st.ended = false; st.started = true;
      if (st.mode === 'audio' && audio && audioState !== 'err') {
        try { audio.currentTime = t; } catch (e) {}
        const tok = (seekTok = {});
        setTimeout(() => {   // some hosts cannot serve byte ranges, so the recording cannot jump: offer Read along
          if (destroyed || !audio || seekTok !== tok || st.mode !== 'audio' || audio.readyState < 1) return;
          if (Math.abs(audio.currentTime - t) > 4 + 1.5 * st.rate) showFallback('This connection cannot jump inside the recording.');
        }, 1200);
      }
      if (st.mode === 'speech' && st.playing) { stopSpeech(); startSpeech(); }
      if (vclock) vclock = { t0: t, n0: now() };
      sceneCue = -1; render(true);
    }
    function updatePlay() {
      playBtn.innerHTML = svgI(st.playing ? 'pause' : st.ended ? 'replay' : 'play');
      playBtn.setAttribute('aria-label', st.playing ? 'Pause' : st.ended ? 'Play again' : 'Play');
      root.classList.toggle('playing', st.playing);
      if (!st.playing) playBtn.classList.remove('busy');
    }
    function setMode(m) {
      const was = st.playing; if (was) pause();
      st.mode = m; vclock = null;
      const g = document.getElementById(id + '-mode'); if (g) g.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      if (m !== 'audio') hideFallback(true);
      return was;
    }
    function showFallback(msg, info) {
      fbEl.hidden = false;
      fbEl.innerHTML = `<p>${esc(msg)}${info ? '' : ' You can still follow along.'}</p>${info ? '' : `${speechSupported() ? '<button type="button" class="btn btn-g sm" data-fb="speech">Use my device’s voice</button>' : ''}<button type="button" class="btn btn-p sm" data-fb="read">Read along</button>`}`;
    }
    function hideFallback(force) { if (force || st.mode === 'audio') { fbEl.hidden = true; fbEl.innerHTML = ''; } }
    fbEl.addEventListener('click', (e) => { const b = e.target.closest('button[data-fb]'); if (!b) return; setMode(b.dataset.fb); play(); });

    playBtn.addEventListener('click', () => toggle());
    root.querySelector('.rcc-tr').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const i = cueAt(st.t), c = script.cues[i];
      if (b.dataset.a === 'prev') seek((st.t - c.start > 1.5 ? c : script.cues[Math.max(0, i - 1)]).start + 0.02);
      else seek((script.cues[i + 1] || c).start + 0.02);
    });

    /* scrubber drag */
    let dragging = false;
    const scrubTo = (e) => { const r = scrub.getBoundingClientRect(); seek(SML.clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1) * script.dur); };
    scrub.addEventListener('pointerdown', (e) => { dragging = true; lastActive = me; try { scrub.setPointerCapture(e.pointerId); } catch (err) {} scrubTo(e); e.preventDefault(); });
    scrub.addEventListener('pointermove', (e) => { if (dragging) scrubTo(e); });
    const endDrag = () => { dragging = false; };
    scrub.addEventListener('pointerup', endDrag); scrub.addEventListener('pointercancel', endDrag);
    scrub.addEventListener('keydown', (e) => {
      const k = e.key; let d = 0;
      if (k === 'ArrowRight' || k === 'ArrowUp') d = 5; else if (k === 'ArrowLeft' || k === 'ArrowDown') d = -5; else if (k === 'PageUp') d = 30; else if (k === 'PageDown') d = -30;
      if (k === 'Home') { seek(0); e.preventDefault(); return; } if (k === 'End') { seek(script.dur - 0.5); e.preventDefault(); return; }
      if (d) { seek(st.t + d); e.preventDefault(); e.stopPropagation(); }
    });

    /* segs: call, speed, mode, tab */
    ui.wire(root, (e) => {
      const g = e && e.target && e.target.closest ? e.target.closest('.seg') : null; if (!g) return;
      const v = (g.querySelector('button.on') || {}).dataset ? g.querySelector('button.on').dataset.v : null;
      if (g.id === id + '-call') { if (SCRIPTS[v] && v !== script.key) { pause(); if (audio) { try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch (err) {} audio = null; audioState = 'none'; } hideFallback(true); script = SCRIPTS[v]; closeCheckpoint(); setupScript(); updatePlay(); } }
      else if (g.id === id + '-rate') { st.rate = Number(v) || 1; if (audio) { try { audio.playbackRate = st.rate; } catch (err) {} } if (vclock) vclock = { t0: curTime(), n0: now() }; if (st.mode === 'speech' && st.playing) { st.t = curTime(); stopSpeech(); startSpeech(); } }
      else if (g.id === id + '-mode') { const was = setMode(v); if (was) play(); }
      else if (g.id === id + '-tab') { st.tab = v; buildList(); }
    });

    /* ---------- checkpoints ---------- */
    function openCheckpoint(k) {
      const base = CPS[k]; if (!base) return;
      const q = k === 'dir' ? Object.assign({}, base, dirQ(script.key)) : base;
      st.cpOpen = k;
      cpEl.hidden = false;
      cpEl.innerHTML = `<div class="rcc-cpc" role="dialog" aria-label="Checkpoint"><div style="display:flex;align-items:center;gap:8px"><span class="pill solid">Checkpoint</span><span class="rcc-lab">${q.kind === 'predict' ? 'Make your call' : 'Quick check'}</span></div>
        <p class="rcc-cpq">${esc(q.q)}</p><div class="rcc-cpo">${q.opts.map((o, j) => `<button type="button" data-o="${j}">${esc(o)}</button>`).join('')}</div>
        <p class="rcc-cpf" hidden></p><div class="rcc-cpa"><button type="button" class="rcc-skip" data-x="skip">Skip</button><button type="button" class="btn btn-p sm" data-x="go" hidden>Continue ${svgI('play')}</button></div></div>`;
      const first = cpEl.querySelector('button[data-o]'); if (first) { try { first.focus({ preventScroll: true }); } catch (e) {} }
    }
    function closeCheckpoint() { st.cpOpen = null; cpEl.hidden = true; cpEl.innerHTML = ''; }
    cpEl.addEventListener('click', (e) => {
      const k = st.cpOpen; if (!k) return;
      const base = CPS[k], q = k === 'dir' ? Object.assign({}, base, dirQ(script.key)) : base;
      const o = e.target.closest('button[data-o]'), x2 = e.target.closest('button[data-x]');
      if (o) {
        const j = Number(o.dataset.o); st.answers[k] = j; st.cpDone[k] = true;
        cpEl.querySelectorAll('button[data-o]').forEach((b, n) => { b.classList.remove('pick', 'ok', 'bad'); if (q.kind === 'quiz') { if (n === q.ans) b.classList.add('ok'); else if (n === j) b.classList.add('bad'); } else if (n === j) b.classList.add('pick'); });
        const f = cpEl.querySelector('.rcc-cpf'); f.hidden = false;
        f.textContent = q.kind === 'quiz' ? (j === q.ans ? q.ok : q.no) : `Locked in: ${q.opts[j]}. Keep listening; the answer comes after the call.`;
        const go = cpEl.querySelector('[data-x="go"]'); go.hidden = false; try { go.focus({ preventScroll: true }); } catch (err) {}
        sceneCue = -1; render(true);
      } else if (x2) {
        st.cpDone[k] = true; closeCheckpoint(); render(true); play();
      }
    });

    /* ---------- keyboard: Space toggles, arrows skip ---------- */
    const onKey = (e) => {
      if (destroyed || !root.isConnected) return;
      const sp = e.key === ' ' || e.code === 'Space', ar = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
      if (!sp && !ar) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tg = e.target, tag = tg && tg.tagName ? tg.tagName : '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (tg && tg.isContentEditable)) return;
      const inside = root.contains(tg);
      if (!inside) { if (!(lastActive === me && (tg === document.body || tg === document.documentElement || !tg))) return; const r = root.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return; }
      if (tg === scrub && ar) return;
      if (/^(BUTTON|A)$/.test(tag) && inside && sp) return;   // the focused button handles its own Space
      if (st.cpOpen) return;
      e.preventDefault();
      if (sp) toggle(); else seek(st.t + (e.key === 'ArrowRight' ? 5 : -5));
    };
    document.addEventListener('keydown', onKey);
    root.addEventListener('pointerdown', () => { lastActive = me; });
    root.addEventListener('focusin', () => { lastActive = me; });

    /* ---------- lifecycle ---------- */
    function stopAll() {
      destroyed = true; st.playing = false;
      if (raf) cancelAnimationFrame(raf); raf = 0;
      clearTimeout(loadTimer);
      if (audio) { try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch (e) {} audio = null; }
      stopSpeech(); vclock = null;
      document.removeEventListener('keydown', onKey);
      if (lastActive === me) lastActive = null;
    }
    SML.onCleanup(stopAll);
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => requestAnimationFrame(() => { if (!destroyed) layout(); })); ro.observe(root); SML.onCleanup(() => ro.disconnect()); }
    else window.addEventListener('resize', layout);

    setupScript();
    layout();
    updatePlay();
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  const pick = (arr, idx) => idx.map((i) => arr[i]).filter(Boolean);
  const TRANSCRIPT_SRC = { t: 'Webull: Apple (AAPL) Q3 2026 earnings call transcript (used for the Q&A themes)', u: 'https://www.webull.com/news/15364638775387136' };

  SML.lessons.push({
    id: 'l-rc-apple-call', course: 'realco', order: 5, title: 'Listen: Apple’s earnings call, explained', mins: 14, level: 'Intermediate',
    summary: 'Hear Apple’s July 2026 call retold step by step, with every number explained.',
    idea: 'The results tell you about the last three months. The call tells you about the next three, and that is what moves the stock.',
    widget: 'callPlayer', opts: { call: 'apple' },
    try: 'Press play and watch the stage light up each number as it is said. Answer the two checkpoints, then jump around with the transcript.',
    body: [
      `<h3>What an earnings call is</h3><p>Every quarter, a public company publishes its results, usually right after the market closes, and then hosts a live call, often about an hour long. Anyone can listen to the webcast, and the replay and slides usually go up on the company’s investor relations page. This lesson replays the call for <b>Apple’s fiscal third quarter of 2026</b>, the latest reported quarter as of October 2026. Apple’s fiscal year ends in late September, so its fiscal Q3 is April to June. The call was on July 30, 2026, with Tim Cook as CEO; John Ternus took over as CEO on September 1, 2026.</p>`,
      `<h3>Every call follows the same script</h3><ul><li><b>Opening and safe harbor.</b> Investor relations introduces the speakers and reads a legal notice: anything about the future is a forecast that can turn out wrong. It is routine.</li><li><b>CEO highlights.</b> The big picture and the best news first. In Apple’s results release that day, Tim Cook called it “our strongest June quarter ever”.</li><li><b>CFO walk-through.</b> Revenue, products and regions, gross margin, operating expenses, net income, EPS, cash and buybacks, the dividend.</li><li><b>Guidance.</b> Management’s forecast for the next quarter: revenue growth, gross margin, expenses and tax rate.</li><li><b>Analyst Q&A.</b> Analysts from banks and research firms ask questions. Their questions show what worries the market.</li></ul>`,
      `<h3>Why the call can move the stock more than the numbers</h3><p>By the time the call starts, the stock price already reflects what analysts expected, the <b>consensus</b>. A beat or a miss against that consensus moves the price after hours. But the results describe the past. The call reveals the future: guidance changes what investors expect the company to earn next quarter and next year, and the tone of the answers changes how much they are willing to pay for those earnings. Price is roughly EPS × P/E, so a weaker outlook can cut both at once (see <a href="#l-rc-price">how earnings move the stock price</a>).</p><p>Apple is the textbook case. Revenue of $109.4 billion (up 16%) and EPS of $2.02 (up 29%) both beat estimates. But $0.11 of that EPS came from temporary tariff refunds (the September-quarter guide still counts on about 1 point of margin from them), the guide of 9% to 11% growth fell short of the roughly 12% analysts expected, and gross margin was guided down to 47% to 48% from 50.1%. The stock fell about 7.4% the next day. SpaceX shows the mirror image: on October 20, 2026 it beat and guided far above expectations, and its stock rose about 7.8%.</p>`,
      `<h3>How to listen like an analyst</h3><ul><li><b>Know the bar first.</b> Write down the consensus for revenue, EPS and next-quarter guidance before the release (the <a href="#calendar">calendar</a> has the dates).</li><li><b>Strip temporary items.</b> Refunds, legal settlements and asset sales flatter a quarter for a while. Apple’s EPS without the refund was about $1.91.</li><li><b>Compare the guide with the consensus,</b> not with this quarter. A forecast that is good but below expectations is bad news for the price.</li><li><b>Count the worries in the Q&A.</b> On Apple’s call, supply, memory costs and margins came up again and again.</li><li><b>Respect the volatility.</b> Prices can gap overnight (Apple fell about 7% the next day; SpaceX rose about 8% after its latest report and fell about 14% after its first), and option prices often drop after the event (<a href="#l-iv-crush">IV crush</a>). Size positions for that (<a href="#l-position-size">position sizing</a>).</li></ul>`,
      `<h3>About this replay</h3><p>The narration is a plain-words retelling written by FiredBunny, not the recording or the transcript. The voices are text-to-speech. Management’s comments are paraphrased and attributed; the only quotes are the two short phrases Apple’s CEO used publicly. For the line-by-line statements, see <a href="#l-rc-apple-income">Apple’s earnings, line by line</a>, <a href="#l-rc-apple-balance">the balance sheet</a> and <a href="#l-rc-apple-cash">cash flow</a>; for a fast grower that just turned profitable, listen to <a href="#l-rc-spacex-call">SpaceX’s third-quarter call</a>. Education only, not investment advice.</p>`,
    ],
    example: {
      title: 'Reading Apple’s July 30 call in five steps',
      intro: 'Real figures from Apple’s release and the call, with analyst expectations as reported in the news.',
      steps: [
        'Results vs the bar: revenue $109.4 billion vs about $108.7 to $109.0 billion expected; EPS $2.02 vs about $1.88 to $1.89. Both beat.',
        'Quality: temporary tariff refunds added $0.11 to EPS and about 2 points to gross margin. Without them, EPS was about $1.91 and gross margin about 48%.',
        'Guidance: 9% to 11% growth on last September quarter’s $102.5 billion is about $111.7 to $113.7 billion, below the roughly $115 billion (about 12%) analysts expected.',
        'Margin outlook: 47% to 48%, down from 50.1%, mainly because memory chips got more expensive.',
        'Price: the stock closed at $333.43 before the report and near $309 the next day. On 12-month EPS of $8.72, the P/E went from about 38 to about 35.',
      ],
      result: 'A beat on the past and a softer outlook: the multiple shrank by about 3 points and the stock fell about 7%.',
    },
    mistakes: [
      'Trading the headline beat in the first minutes after hours, before the guidance is out.',
      'Counting temporary items as real growth, like the $0.11 of EPS Apple got from tariff refunds.',
      'Comparing a seasonal business with the previous quarter: Apple’s June quarter was 1.6% smaller than March but 16% bigger than a year earlier.',
      'Treating “record quarter” language as news. The market already expected a strong quarter; only the surprise moves the price.',
    ],
    points: [
      'Calls follow a script: safe harbor, CEO highlights, CFO numbers, guidance, then analyst Q&A.',
      'Stocks move on the surprise against expectations, and most of all on the outlook.',
      'Strip temporary items before you decide whether a quarter really beat.',
      'The questions analysts repeat point to the risk the market cares about most.',
      'Apple beat on July 30, 2026, guided below expectations and fell about 7% the next day.',
    ],
    terms: ['Earnings call', 'Guidance', 'Beat', 'One-time item', 'Diluted EPS', 'P/E'],
    quiz: { q: 'Apple beat revenue and EPS estimates on July 30, 2026, yet the stock fell about 7% the next day. What was the main reason?', options: ['Investors had expected a loss', 'Its outlook for the next quarter, including growth and gross margin, came in below what analysts expected', 'Apple cut its dividend'], answer: 1, why: 'The quarter was strong, but the guidance of 9% to 11% growth and a 47% to 48% gross margin was below expectations, so investors lowered what they would pay for future earnings.' },
    sources: pick(AP.sources, [0, 1, 4, 5, 6]).concat([TRANSCRIPT_SRC]),
  });

  SML.lessons.push({
    id: 'l-rc-spacex-call', course: 'realco', order: 7, title: 'Listen: SpaceX’s third-quarter call', mins: 12, level: 'Intermediate',
    summary: 'SpaceX’s October 2026 call, retold: a first profit, giant guidance, giant spending.',
    idea: 'A beat plus guidance far above expectations lifted the stock, even with capex about to nearly double.',
    widget: 'callPlayer', opts: { call: 'spacex' },
    try: 'Play the call, guess which business brings in the most revenue, then call the next-day move before you hear it.',
    body: [
      `<h3>The latest call: October 20, 2026</h3><p>SpaceX listed on the Nasdaq as SPCX in June 2026. Its third-quarter report on October 20, 2026 (July to September) is the latest reported quarter as of October 2026, and its second as a public company. Revenue was $14.6 billion, up 161% from a year earlier and nearly double the June quarter, and SpaceX posted net income of $4.4 billion, or $0.35 a share: its first profitable quarter as a public company.</p>`,
      `<h3>Read the profit twice</h3><p>Operating income, the profit from the business itself, was $2.8 billion. About $1.6 billion more came from below the operating line: other income (part of it from a related party), interest earned on its cash and a tax benefit. Those items count, but investors usually value them less than profit from selling launches, Starlink service and computing. Then there is <b>adjusted EBITDA</b>, positive $8.8 billion on SpaceX’s own measure: it adds back $3.6 billion of depreciation and $2.4 billion of stock pay (including $1.2 billion tied to the Cursor deal) and takes the below-the-line gains back out. Useful, but it is the company’s own math; always read it next to the GAAP numbers (see <a href="#l-rc-spacex">the SpaceX statements lesson</a>).</p>`,
      `<h3>Guidance far above expectations</h3><p>SpaceX guided first-quarter 2027 revenue to $33 billion to $37 billion, against about $22.2 billion analysts expected: even the low end was about 49% higher. Guidance like that makes analysts raise their estimates for every quarter after it, which is why the stock rose about 4% after hours and closed up 7.8% at $159.31 the next day. Apple’s call shows the mirror image: a beat with guidance below expectations, and a 7.4% drop (<a href="#l-rc-apple-call">listen to Apple’s call</a>).</p>`,
      `<h3>The costs of the plan</h3><ul><li><b>Capex:</b> $19.6 billion in the quarter, more than twice adjusted EBITDA, and $35 billion to $40 billion guided for the fourth quarter. Nine-month free cash flow was roughly −$35 billion (FiredBunny’s math: operating cash minus capex).</li><li><b>Dilution:</b> about 12.5 billion diluted shares on average, against 5.9 billion in June. Shares outstanding jumped with the preferred conversion, the IPO and other share issuance; the release does not break the weighted-average change down.</li><li><b>The questions analysts asked:</b> JPMorgan asked about power for the new data centers and how the capex will be funded; Deutsche Bank asked about a possible combination with Tesla (both companies formed special committees of independent directors; no terms agreed).</li><li><b>Margins:</b> gross margin was 62%, but the CFO said the fourth quarter’s should look more like the second quarter’s, because the third had one-time benefits and a helpful customer mix.</li></ul>`,
      `<h3>Three months earlier</h3><p>SpaceX’s first report, on August 4, 2026, also beat estimates, but capex of $18.4 billion blew past the roughly $13 billion expected, and the first lockup release, when some insiders could start selling, came on August 6 (more releases follow). The stock closed down 13.6% at $108.27 the day after the report. Same company, both reports beat: the outlook and the supply of shares decided the direction. Education only, not investment advice.</p>`,
    ],
    example: {
      title: 'Reading SpaceX’s October 20 numbers',
      intro: 'Real figures from SpaceX’s release, with expectations and price moves as reported in the news.',
      steps: [
        'Results vs the bar: revenue $14.6 billion vs about $12.7 to $12.9 billion expected; EPS $0.35 vs about $0.13 to $0.16. Both beat by a wide margin.',
        'Quality: net income $4.4 billion = $2.8 billion of operating income + about $1.6 billion from below the line (other income, net interest, a tax benefit).',
        'Adjusted EBITDA, positive $8.8 billion on SpaceX’s own measure, against capex of $19.6 billion: capex is about 2.2 times that number.',
        'Guidance: Q1 2027 revenue of $33 to $37 billion vs about $22.2 billion expected, or 49% to 67% above.',
        'Price: closed at $147.79 before the report, up about 4% after hours, and closed at $159.31 the next day, up 7.8%.',
      ],
      result: 'Strong results and an outlook far above expectations outweighed the spending plan: the stock rose about 8%.',
    },
    mistakes: [
      'Treating all of a profit as equal: about $1.6 billion of SpaceX’s $4.4 billion came from below the operating line.',
      'Calling adjusted EBITDA a profit. It is the company’s own measure and leaves out real costs like depreciation and stock pay.',
      'Watching revenue and profit but not capex and free cash flow, which were deeply negative.',
      'Forgetting the share count: per-share numbers shrink as shares are added, and lockup releases can add sellers.',
    ],
    points: [
      'SpaceX beat and guided Q1 2027 revenue far above expectations; the stock rose 7.8% the next day.',
      'Its first profit as a public company leaned on about $1.6 billion from below the operating line.',
      'Capex of $19.6 billion, with $35 to $40 billion guided for Q4, keeps free cash flow deeply negative.',
      'After its first report the stock fell 13.6%: same beat, different outlook and a lockup release.',
    ],
    terms: ['Earnings call', 'Guidance', 'Adjusted EBITDA', 'Capex', 'Dilution', 'Lockup'],
    quiz: { q: 'Both SpaceX reports beat estimates. After the first the stock fell 13.6%; after the latest it rose 7.8%. What made the difference?', options: ['The latest report had more Starlink subscribers', 'The outlook: the latest guided revenue far above expectations, while the first had a capex surprise and a lockup release', 'The first report was in a different currency'], answer: 1, why: 'Prices already reflect the expected results. What moved the stock was the surprise in the outlook and in the supply of shares.' },
    sources: ['sec.gov', 'tikr.com', 'teslarati', 'stock-market-today', 'call-transcripts', 'archyde', 'startuphub'].map((k) => SX.sources.find((x) => x.u.indexOf(k) >= 0)).filter(Boolean),
  });
})();
