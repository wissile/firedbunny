/* Help chat ("Ask Bunny"): what it understands and what it says. The engine is src/chat.js; this file is data, so it
 * can be extended without touching the matching code. No AI: every answer comes from the site's own content (lessons,
 * glossary, tools, courses, notes) or from the fixed replies below, which restate the About, Editorial standards,
 * Settings, Support and Plans pages. If one of those pages changes, change the matching reply here in the same commit.
 *
 * How a message is read (details in src/chat.js):
 *   1. It is normalised: lower case, accents and punctuation removed, "401(k)" -> "401k", "P/E" -> "pe", "4%" ->
 *      "4 percent", "what's" -> "whats". Patterns below are written against that form.
 *   2. While a feedback note is being written, the text goes to the note.
 *   3. Otherwise the intents run in order; the first whose pattern matches (and whose `max` word count, if any, is not
 *      exceeded) answers. An intent either says a fixed reply (`say`, `links`, `chips`) or runs a handler in chat.js
 *      (`do`). A handler may pass, and the next intent is tried.
 *   4. Nothing matched: the words are looked up in the site's content (titles count most, then glossary full names,
 *      abbreviations and lesson terms, then summaries), with the synonyms below and small typos forgiven.
 *
 * Links are page tokens ('l-wheel', 'tool-compound', 'settings'...). Chips are suggested replies: an array of
 * { l: label, a: action, v: value } or one of the named sets in `chipSets`. Actions: ask (send v as if typed), menu,
 * lesson, term, tool, toolgroup, start, track, feedback (v = kind), go (v = page token), search (v = words).
 */
(function () {
  'use strict';
  const SML = window.SML;
  // The plans intent's loose patterns ("premium plan", "upgrade my account") skip messages that are about someone else's
  // plans or accounts: insurance, brokers, banks, retirement accounts. Those go to the lessons instead.
  const ELSEWHERE = '^(?!.*\\b(insurance|insurer|health|medicare|medicaid|aca|marketplace|obamacare|dental|vision|life|broker|brokers|brokerage|margin|options level|vanguard|fidelity|schwab|robinhood|webull|etrade|e trade|ibkr|interactive brokers|tastytrade|tradingview|bank|banks|card|ira|roth|401k|403b|457b|hsa|fsa|annuity|employer|company)\\b)';
  const plansRe = (src) => new RegExp(ELSEWHERE + '.*' + src);

  SML.chatData = {
    name: 'Bunny',
    title: 'Ask Bunny',
    subtitle: 'Lessons, terms, feedback',
    greeting: 'Hi, I’m Bunny. I can find you a lesson, explain a term, pick the right calculator, or pass a note to the person who runs FiredBunny. What would you like to do?',
    welcomeBack: 'Welcome back. Where were we?',
    foot: 'Answers come from FiredBunny’s own pages. Education, not advice.',
    placeholder: 'Ask about a lesson, a term or a tool',

    chipSets: {
      menu: [
        { l: 'Find a lesson', a: 'lesson' },
        { l: 'Explain a term', a: 'term' },
        { l: 'Which tool should I use?', a: 'tool' },
        { l: 'Where do I start?', a: 'start' },
        { l: 'Send feedback', a: 'feedback' },
      ],
      after: [
        { l: 'Find a lesson', a: 'lesson' },
        { l: 'Explain a term', a: 'term' },
        { l: 'Something else', a: 'menu' },
      ],
    },

    /* Prompts for the menu choices. {n} is filled in with a live count. */
    prompts: {
      lesson: 'Sure. What topic? Type a few words, like “covered calls”, “Roth IRA” or “VWAP”, or pick a track.',
      term: 'Which word? The glossary has {n} of them in plain English. Try “theta”, “wash sale” or “coast FIRE”.',
      tool: 'What would you like to work out? Pick an area, or tell me in your own words.',
      start: 'Good question. FiredBunny has three tracks. Which sounds most like you?',
      notSure: 'Then start with the self-assessment: seven short parts, about 7 minutes. You get your investor type, a risk profile, a starting mix, your FIRE number and a learning path.',
      fallback: 'I couldn’t find that on FiredBunny.',
      fallbackNear: 'I’m not sure I’ve got that right. These are the closest pages I found:',
    },
    // terms offered after "Explain a term" (only those in the glossary are shown)
    termStarters: ['VWAP', 'Theta', 'Wash sale', 'Roth IRA', 'Coast FIRE', 'Covered call', 'Expense ratio', '4% rule', 'Delta', 'HSA'],
    lessonStarters: ['Candlesticks', 'The wheel strategy', 'Traditional or Roth?', 'Your FIRE number'],

    /* "Which tool should I use?": tools grouped by their category (SML.tools[].cat). A category not listed here still
       shows up, under "More tools". */
    toolGroups: [
      { l: 'Trade size and risk', cats: ['Risk'] },
      { l: 'Options and the wheel', cats: ['Options'] },
      { l: 'Investing and stocks', cats: ['Investing', 'Stocks', 'Getting started'] },
      { l: 'Budget, debt and cash', cats: ['Budget', 'Debt', 'Banking'] },
      { l: 'Taxes', cats: ['Taxes'] },
      { l: 'Retirement and benefits', cats: ['Retirement', 'Benefits'] },
      { l: 'Home and rentals', cats: ['Housing'] },
      { l: 'FIRE and early retirement', cats: ['FIRE', 'Where to live', 'Health', 'Abroad', 'Plan'] },
      { l: 'Markets, macro and crypto', cats: ['Macro', 'Commodities', 'Crypto'] },
    ],

    /* Pages that are not lessons, courses, tools or notes. keys: extra words people use for them. say: one line about
       the page, true to what it shows. */
    pages: [
      { tok: 'learn', title: 'All lessons', keys: 'lessons courses curriculum browse learn library list', say: 'Every lesson, track by track, with a search box and a level filter.' },
      { tok: 'tools', title: 'All tools', keys: 'tools calculators calculator calc simulators', say: 'Every calculator and simulator, grouped by track. Each one draws a picture of its answer.' },
      { tok: 'glossary', title: 'Glossary', keys: 'glossary dictionary terms words definitions jargon vocabulary', say: 'Every term in plain English, each linked to the lesson where you can try it.' },
      { tok: 'dashboard', title: 'Your dashboard', keys: 'dashboard my space goals net worth progress household', say: 'Your goals, net worth, investor profile and lesson progress in one place.' },
      { tok: 'assessment', title: 'Investor self-assessment', keys: 'self assessment assessment investor type profile risk tolerance personality quiz test', say: 'Seven short parts, about 7 minutes: your investor type, a risk profile, a starting mix, your FIRE number and a learning path.' },
      { tok: 'results', title: 'Your assessment results', keys: 'results my profile investor profile assessment results', say: 'Your investor profile from the self-assessment, once you have taken it.' },
      { tok: 'calendar', title: 'Market & tax calendar', keys: 'calendar dates schedule fed meetings cpi jobs report tax deadlines holidays earnings season options expiration', say: 'Fed meetings, inflation and jobs reports, options expiration, market holidays, tax deadlines and open enrollment, with why each date matters.' },
      { tok: 'portfolio', title: 'Portfolio', keys: 'portfolio brokerage connect brokerage snaptrade my holdings my brokerage account read only', say: 'Your brokerage accounts, connected read-only through SnapTrade, explained: allocation, concentration, gains and losses by tax term, open options and income. Without a connection it shows a made-up sample portfolio.' },
      { tok: 'offline', title: 'Offline & app', keys: 'offline install app home screen download audio save audio pwa', say: 'Use FiredBunny without a connection: save lesson audio for offline listening and install the site as an app.' },
      { tok: 'apps', title: 'Apps', keys: 'apps mobile app iphone android ios app store play store', say: 'Three FiredBunny mobile apps (wheel tracker, retirement runway and trader toolkit) are in development, with previews you can try.' },
      { tok: 'settings', title: 'Privacy & settings', keys: 'settings privacy preferences export import delete data backup analytics cookies', say: 'Preferences, lesson progress and your data: export it, import it or delete it.' },
      { tok: 'signin', title: 'Sign in', keys: 'sign in signin login log in account create account sign up register password', say: 'Sign in, or see how saving your progress works.' },
      { tok: 'profile', title: 'Your profile', keys: 'profile my details birth year age income', say: 'The basics FiredBunny uses to tailor your dashboard, goals and assessment.' },
      { tok: 'about', title: 'About FiredBunny', keys: 'about story who why owner creator', say: 'Why FiredBunny exists, what it believes, and the feedback form.' },
      { tok: 'support', title: 'Support FiredBunny', keys: 'chip in tip jar funding', say: 'Why FiredBunny is free, what running it costs, and how optional support works: it unlocks nothing and is not tax-deductible.' },
      { tok: 'plans', title: 'Plans', keys: 'plans pricing waitlist paid plan', say: 'Everything on FiredBunny stays free. An optional paid plan for a few extras that cost money per person to run is being considered, with a waitlist.' },
      { tok: 'editorial', title: 'Editorial standards', keys: 'editorial standards sources fact check accuracy corrections how lessons are written', say: 'Who writes FiredBunny, how lessons are checked against sources, and how to report an error.' },
      { tok: 'sheets', title: 'Spreadsheets', keys: 'spreadsheets spreadsheet templates google sheets excel trade journal wheel tracker watchlist', say: 'Trade journal, wheel tracker, retirement planner and watchlist templates you can copy into Google Sheets or Excel.' },
      { tok: 'indicator', title: 'TradingView indicator', keys: 'tradingview indicator pine script chart levels alerts', say: 'A free Pine Script indicator that draws PDH, PDL, PMH, PML, VWAP and the 13/48/200 EMA ribbon, with alerts.' },
      { tok: 'play', title: 'Trade replay', keys: 'playground replay practice simulator paper trading fake money day trading practice', say: 'Replay a trading morning one 2-minute candle at a time with fake money, with coaching on every trade. Prices are simulated.' },
      { tok: 'wheel', title: 'Wheel simulator', keys: 'wheel simulator practice wheel fake money', say: 'Sell puts and covered calls month by month with fake money, and watch premium, assignment and cost basis add up.' },
      { tok: 'blog', title: 'Trade notes', keys: 'notes blog posts articles breakdowns checklists routines', say: 'Trade breakdowns, wheel logs, checklists and routines, each with a chart you can step through.' },
      { tok: 'home', title: 'Home page', keys: 'home homepage front page main page start page', say: 'The front page: tracks, tools and a few lessons in miniature.' },
    ],

    /* Extra lines the privacy and delete answers (src/chat.js) add when they apply: they restate the Portfolio page and
       Settings. Change them with those pages. */
    notes: {
      privacy: () => [
        SML.portfolio && SML.portfolio.enabled() ? 'If you connect a brokerage on the Portfolio page, SnapTrade links it read-only. Your balances, positions and transactions are fetched when you open that page and kept on this device only, not in your account; your account holds just an encrypted key for SnapTrade. Disconnect there any time.' : '',
        // the Plans waitlist (src/mod-y-plans.js), on the website only
        SML.plans && SML.plans.where() === 'supabase' ? 'If you join the waitlist on the Plans page, FiredBunny’s database keeps the extras you tick, any note and the time, with your account id if you’re signed in or the email you give if you’re not, used only to tell you if the plan opens.' : '',
      ].filter(Boolean).join(' '),
      delete: () => [
        SML.portfolio && SML.portfolio.enabled() && SML.cloud && SML.cloud.user ? 'A connected brokerage stays connected after Delete everything: press Disconnect on the Portfolio page. Delete my account too removes it as well.' : '',
        SML.plans && SML.plans.signedIn() ? 'If you joined the Plans waitlist, leave it on the Plans page; Delete my account too removes it as well.' : '',
      ].filter(Boolean).join(' '),
    },

    /* Words that say what kind of page someone wants. They are not used as search words themselves. */
    typeWords: {
      lesson: ['lesson', 'lessons', 'learn', 'teach', 'course', 'courses', 'class', 'tutorial', 'guide'],
      tool: ['calculator', 'calculators', 'calc', 'calcs', 'tool', 'tools', 'simulator', 'planner', 'estimator', 'calculate', 'compute'],
      term: ['term', 'word', 'glossary', 'definition', 'define', 'meaning', 'mean', 'means', 'acronym', 'abbreviation', 'stand'],
    },

    /* Synonyms and abbreviations: when the left side appears in a message (as whole words, in normalised form), the right
       side is looked up too. */
    synonyms: {
      'cc': 'covered call', 'ccs': 'covered call', 'covered calls': 'covered call',
      'csp': 'cash secured put', 'csps': 'cash secured put', 'cash secured': 'cash secured put',
      'the wheel': 'wheel strategy', 'wheeling': 'wheel strategy', 'wheel trade': 'wheel strategy',
      'tlh': 'tax loss harvesting', 'tax loss': 'tax loss harvesting', 'harvest losses': 'tax loss harvesting', 'loss harvesting': 'tax loss harvesting',
      'pdh': 'previous day high', 'pdl': 'previous day low', 'pmh': 'premarket high', 'pml': 'premarket low', 'key levels': 'pdh pdl pmh pml',
      'vwap': 'volume weighted average price',
      'ema': 'exponential moving average', 'emas': 'exponential moving average', 'sma': 'simple moving average', 'ma': 'sma ema', 'moving average': 'sma ema', 'moving averages': 'sma ema',
      'rsi': 'relative strength index', 'oversold': 'rsi', 'overbought': 'rsi',
      'etf': 'exchange traded fund', 'etfs': 'exchange traded fund', 'index funds': 'index fund',
      'fire': 'financial independence retire early', 'retire early': 'fire', 'early retirement': 'fire', 'financial independence': 'fire',
      'swr': 'safe withdrawal rate', 'withdrawal rule': '4 percent rule',
      'hysa': 'high yield savings account', 'hsa': 'health savings account', 'fsa': 'flexible spending account',
      'ss': 'social security', 'soc sec': 'social security', 'socsec': 'social security',
      'dca': 'dollar cost averaging', 'iv': 'implied volatility', 'dte': 'expiration', 'days to expiration': 'expiration', 'greeks': 'delta gamma theta vega',
      'time decay': 'theta', 'theta decay': 'theta',
      'btc': 'bitcoin', 'eth': 'ethereum', 'crypto': 'cryptocurrency',
      'fed': 'federal reserve', 'interest rate': 'rates', 'interest rates': 'rates',
      'nfp': 'nonfarm payrolls jobs report', 'jobs report': 'nonfarm payrolls',
      'cpi': 'consumer price index inflation',
      'pe': 'price to earnings', 'pe ratio': 'price to earnings',
      'eps': 'earnings per share', 'fcf': 'free cash flow',
      'rr': 'risk reward', 'r r': 'risk reward', 'reward to risk': 'risk reward', 'risk to reward': 'risk reward',
      'pdt': 'pattern day trader', '25k rule': 'pattern day trader', '25000 rule': 'pattern day trader',
      'daytrading': 'day trading', 'day trade': 'day trading', 'swing trade': 'swing trading',
      'compounding': 'compound interest',
      'buy a house': 'rent or buy', 'buying a house': 'rent or buy', 'renting': 'rent or buy',
      'obamacare': 'aca marketplace', 'aca': 'aca marketplace health insurance',
      'llm': 'large language model', 'chatgpt': 'ai', 'robinhood': 'robinhood mcp',
      'tradingview': 'tradingview indicator', 'pine': 'pine script',
      'excel': 'spreadsheet', 'google sheets': 'spreadsheet', 'sheets': 'spreadsheet',
      'candles': 'candlestick', 'candle': 'candlestick', 'candlesticks': 'candlestick',
      'fakeout': 'false breakout', 'fake breakout': 'false breakout', 'fake out': 'false breakout',
      '2min': '2 min', '15min': '15 min', 'timeframes': 'timeframe',
      'geoarbitrage': 'geographic arbitrage', 'geo arbitrage': 'geographic arbitrage',
      'expat': 'retiring abroad', 'move abroad': 'retiring abroad', 'living abroad': 'retiring abroad',
      'stop loss': 'stop', 'stops': 'stop',
      '1 percent rule': '1 percent rule risk', 'one percent rule': '1 percent rule',
      'backdoor': 'backdoor roth', 'mega backdoor': 'mega backdoor roth',
      '401 k': '401k', 'four oh one k': '401k',
      'rmds': 'required minimum distribution', 'rmd': 'required minimum distribution',
      'credit card': 'card', 'credit cards': 'card',
      'emergency savings': 'emergency fund', 'rainy day fund': 'emergency fund',
      'stock options': 'iso nso stock options',
    },

    /* "When is the next ...?" answered from the site's calendar (SML.calendarEvents). k: the calendar's event kinds. */
    calendar: [
      { k: ['fomc', 'fomcsep'], words: ['fed meeting', 'fomc', 'fed decision', 'rate decision', 'interest rate decision', 'fed rate decision', 'rate cut', 'rate hike', 'fed announcement'] },
      { k: ['minutes'], words: ['fed minutes', 'fomc minutes'] },
      { k: ['cpi'], words: ['cpi', 'inflation report', 'inflation data', 'consumer price index'] },
      { k: ['jobs'], words: ['jobs report', 'nfp', 'nonfarm payrolls', 'payrolls', 'employment report', 'unemployment report'] },
      { k: ['ppi'], words: ['ppi', 'producer price'] },
      { k: ['pce'], words: ['pce'] },
      { k: ['gdp'], words: ['gdp'] },
      { k: ['retail'], words: ['retail sales'] },
      { k: ['claims'], words: ['jobless claims', 'unemployment claims'] },
      { k: ['quad'], words: ['quad witching', 'triple witching'] },
      { k: ['opex', 'quad'], words: ['opex', 'options expiration', 'option expiration', 'options expiry', 'monthly expiration'] },
      { k: ['holiday'], words: ['market holiday', 'market closed', 'stock market closed', 'market close', 'holiday'] },
      { k: ['filing'], words: ['tax deadline', 'tax day', 'filing deadline', 'taxes due', 'file my taxes', 'file taxes'] },
      { k: ['esttax'], words: ['estimated tax', 'quarterly tax', 'estimated payment'] },
      { k: ['contrib'], words: ['ira deadline', 'contribution deadline', 'hsa deadline'] },
      { k: ['earnings'], words: ['earnings season'] },
      { k: ['aca', 'employer', 'medicare'], words: ['open enrollment'] },
      { k: ['jackson'], words: ['jackson hole'] },
    ],

    /* Intents, in order. patterns run against the normalised message; max = most words for the pattern to count. */
    intents: [
      { id: 'greet', max: 5, patterns: [/^(hi|hello|hey|hiya|howdy|yo|hola|heya|greetings|good (morning|afternoon|evening))\b/], do: 'greet' },
      { id: 'thanks', max: 7, patterns: [/\b(thanks|thank you|thank u|thx|ty|cheers|appreciate it|much appreciated)\b/, /^(perfect|great|awesome|cool|nice|lovely|brilliant|got it|that helps|very helpful|helpful)$/], say: 'You’re welcome. Anything else I can find for you?', chips: 'after' },
      { id: 'bye', max: 5, patterns: [/^(bye|goodbye|good bye|see you|see ya|cya|later|thats all|that is all|im done|nothing else|all good|no thanks|nope)\b/], say: 'Happy learning. I’ll be here in the corner if you need me.', chips: [{ l: 'Something else', a: 'menu' }] },
      { id: 'menu', max: 4, patterns: [/^(menu|main menu|start over|restart|reset|back|options|help|help me|what now|something else)$/], do: 'menu' },
      { id: 'whoami', patterns: [/\b(who|what) are you\b/, /\bare you (an? )?(ai|bot|robot|human|real|person|chatgpt|gpt|llm|machine)\b/, /\bwhat can you do\b/, /\bhow (do|does) (you|this chat|this) work\b/, /\bis this (an? )?(ai|bot|chatgpt)\b/],
        say: 'I’m Bunny, a simple guide built from FiredBunny’s own pages. I’m not an AI and I don’t make things up: I match your words to the site’s lessons, glossary and tools, and show you where to go. I can also pass a note to the person who runs FiredBunny.', chips: 'menu' },
      // feedback comes before the content lookup, so "the wheel lesson has a typo" becomes a note
      { id: 'feedback', patterns: [
        /\b(send|give|leave|share|submit|write) (you )?(some |a |an |my )?(feedback|suggestion|idea|note|comment)\b/, /^(feedback|suggestion|i have an idea|idea for you)\b/,
        /\b(report|found|there is|theres|spotted) (a |an )?(bug|problem|issue|mistake|error|typo|broken link)\b/, /\b(typo|broken link|doesnt work|does not work|not working|isnt working|wont load|is broken|seems broken)\b/,
        /\b(is|looks|seems|might be) (wrong|incorrect|outdated|out of date)\b/, /\b(correction|inaccurate|inaccuracy)\b/, /\bfeature request\b/,
        /\b(contact|email|message|talk to|speak to|reach) (the )?(owner|author|creator|admin|team|a human|human|real person|person|someone|you)\b/] , do: 'feedback' },
      { id: 'price', patterns: [/\b(price of|stock price|share price|quote for|live price|current price)\b/, /\bhow much is (a |one )?(share|bitcoin|btc|eth|ethereum|gold)\b/, /\b(market|dow|nasdaq|s and p 500|spy) (today|right now)\b/],
        say: 'I can’t look up live prices or today’s market; I only know what’s on FiredBunny’s pages. For a company’s latest results in plain words, try the Earnings lookup.', links: ['tool-earnings', 'calendar'], chips: 'after' },
      { id: 'advice', patterns: [/\b(financial|investment|investing|tax|legal) advi[cs]e\b/, /\bis (this|it|that) advice\b/, /\bshould i (buy|sell|short|get|invest in|put my money in(to)?) (this |that |the |a |an |some |more |any )?(stock|stocks|share|shares|crypto|bitcoin|btc|eth|ethereum|coin|coins|etf|etfs|fund|funds|option|options|call|calls|put|puts|tesla|apple|nvidia|amazon|google|meta|microsoft|spy|qqq|voo|vti|gold|silver)\b/, /\bshould i (buy|sell) (it |them )?(now|today|tomorrow)\b/, /\b(what|which) (stock|stocks|crypto|coin|etf|fund|shares) should i\b/, /\b(recommend|tip|hot tip|pick) (me )?(a |some |any )?(stock|stocks|coin|crypto|trade|etf)\b/, /\bwill (the market|stocks|it|bitcoin|tesla|apple|nvidia)\b.*\b(go up|go down|crash|rise|fall|moon)\b/, /\b(price target|guaranteed returns?|get rich|make me rich)\b/],
        say: 'No, FiredBunny is education only. Nothing here is financial, investment, tax or legal advice, and nothing is tailored to your situation, so I can’t tell you what to buy or sell, or where prices are going. For big decisions, talk to a professional who knows your details. What I can show you is how people think it through.', links: ['l-stock-picking', 'l-value', 'assessment', 'editorial'], chips: 'after' },
      // chipping in (the Support page, src/mod-y-support.js): only phrasings aimed at the site, so "support and resistance",
      // "contribute to a Roth" or "donate appreciated stock" still reach their lessons
      { id: 'support', patterns: [
        /\b(donate|donating|donation|donations|tip|tips|chip in|contribute|give money|send money|pay)\s+(to\s+)?(you|firedbunny|fired bunny|the site|this site|the website|this website|the bunny|the project|this project|the creator|the author|the owner)\b/,
        /\b(donate|donating|donation|donations|tip jar|chip in|chipping in|tipping)$/,
        /\b(support|fund|sponsor|back)\s+(you|firedbunny|fired bunny|the site|this site|the website|this website|the bunny|your work|the project|this project|the creator|the author)\b/,
        /\bhow (can|could|do|would|might) i (help|support|give back)( you| out| firedbunny| the site| this site)?$/, /\bways? to (help|support)( you| firedbunny| the site| this site)?$/,
        /\b(buy|get) (you|the bunny|firedbunny) a (coffee|carrot|beer|drink)\b/, /\b(patreon|kofi|ko fi|buy me a coffee|buymeacoffee|github sponsors)\b/,
        /\bhow (is|are) (firedbunny|this site|the site|this website|the website|it|this|you) (funded|paid for|financed)\b/, /\bhow (is|are) (firedbunny|this site|the site|this website|the website|it|this) free\b/,
        /\bhow (does|do) (firedbunny|this site|the site|this website|the website) (make money|pay for itself|stay free|afford it|earn money|pay the bills)\b/,
        /^how do you (make money|pay for (it|this|the site|hosting)|keep (it|this|the site) free|afford (it|this))$/, /\bwho pays for (it|this|the site|this site|firedbunny|the hosting|hosting|the servers)\b/],
        say: () => {
          const S = SML.support, on = !!(S && S.live()), elsewhere = !!(S && !on && S.configured());
          const tail = ' It isn’t tax-deductible: FiredBunny is not a charity. Pointing out a mistake or a missing topic helps just as much.';
          if (on) return 'Thank you for asking. Everything on FiredBunny stays free, and a tip unlocks nothing. If you’d like to chip in toward hosting, data and the time it takes, the Support page has the options, and you pay on Stripe’s own page.' + tail;
          if (elsewhere) return 'Thank you for asking. Everything on FiredBunny stays free, and a tip unlocks nothing. Support is handled on the FiredBunny website, at firedbunny.com/support; this copy doesn’t take payments.' + tail;
          return 'Thank you for asking. FiredBunny is free, and there’s no way to chip in yet: the person who runs it pays for it. The best help right now is a note: tell me what’s wrong, out of date or missing. The Support page explains what running the site costs.';
        },
        links: ['support'], chips: [{ l: 'Send feedback', a: 'feedback' }, { l: 'Is it free?', a: 'ask', v: 'is it free' }, { l: 'Is there a paid plan?', a: 'ask', v: 'is there a paid plan' }, { l: 'Something else', a: 'menu', q: 1 }] },
      // leaving the Plans waitlist: signed in, on the Plans page; joined with an email, by sending a note
      { id: 'waitlist-leave', patterns: [/\b(leave|quit|remove|delete|unsubscribe|get off|take me off|cancel)\b.*\b(waitlist|wait list|waiting list)\b/, /\b(waitlist|wait list|waiting list)\b.*\b(leave|quit|remove|delete|unsubscribe|cancel)\b/],
        say: () => (SML.plans && SML.plans.signedIn() ? 'You can leave it yourself: open the Plans page and press Leave the waitlist, and your sign-up is deleted. Deleting your account removes it too. If you also joined with an email before signing in, send a note with that address to have it deleted.'
          : 'If you joined with your email, send a note with that address asking to be taken off, and the sign-up will be deleted. If you joined while signed in, sign in and press Leave the waitlist on the Plans page.'),
        links: ['plans'], chips: [{ l: 'Send a note', a: 'feedback', v: 'Other' }, { l: 'Something else', a: 'menu', q: 1 }] },
      // a paid plan, pricing, the waitlist (the Plans page, src/mod-y-plans.js). "Premium" counts only next to plan words,
      // so "option premium", "sell premium", "insurance premium" and "premium tax credit" still reach their lessons
      { id: 'plans', patterns: [
        plansRe('\\b(paid|pro|plus|premium) (plan|plans|tier|tiers|version|versions|membership|memberships|account|accounts|subscription|subscriptions|features?|content|access|edition)\\b'),
        /\b(firedbunny|fired bunny) (plus|pro|premium)\b/, /\b(waitlist|wait list|waiting list)\b/,
        /^(plans|pricing|prices|plans and pricing|pricing plans?|price plans?|subscription|subscriptions|subscribe|membership|memberships)$/,
        /\b(your|firedbunny|fired bunny|the site|this site|the website|site) (pricing|prices|plans|subscription|subscriptions|membership)\b/,
        /\b(is there|do you have|do you offer|do you sell|can i buy|can i get|how much is|how much does|sign up for|join) (a |an |the |any )?(subscription|membership|waitlist)\b/, /^is there (a |any )?(premium|paid|pro)$/,
        plansRe('\\bupgrade (my |to |to a |to the )?(account|plan|plus|pro|premium|firedbunny|membership)\\b'),
        /\bwill (it|this|firedbunny|the site|the website|everything|the lessons|the tools) (always |still |stay |remain |keep being )+(be )?free\b/,
        // charging: only when the question is about FiredBunny ("will you start charging"), not a broker or a bank
        /\bwill (you|firedbunny|fired bunny|the site|the website|this site) (ever |start to |start |begin to )?charg(e|ing)\b/,
        /\b(are you|is firedbunny|is fired bunny|is the site|is this site|is the website|will you|do you|you) (ever )?(start|starting|going to|plan to|planning to|planning on) charg(e|ing)\b/],
        say: () => 'Everything on FiredBunny is free today and stays free: every lesson, quiz, tool and simulator. An optional paid plan is being considered for a few new extras that cost money each time one person uses them, like an AI review that explains your own portfolio numbers with the lessons (never what to buy or sell) or a printable self-assessment report. Nothing is decided: no price, no date. ' + (SML.plans && SML.plans.where() !== 'supabase' ? 'If you’d use it, the Plans page explains, and the waitlist is on the FiredBunny website, at firedbunny.com/plans.' : 'If you’d use it, join the waitlist on the Plans page and tick the extras you want.'),
        links: ['plans'], chips: [{ l: 'Is it free?', a: 'ask', v: 'is it free' }, { l: 'Something else', a: 'menu', q: 1 }] },
      { id: 'free', patterns: [/\b(is|are) (it|this|the site|the website|firedbunny|everything|the lessons|the tools|the courses|this site|the app) (really |actually |totally |completely )?free\b/, /\b(does|do) (it|this|firedbunny|the lessons|the tools) cost\b/, /\bhow much (does|is|do) (it|this|firedbunny|the lessons|the courses|the tools)\b/, /\b(paywall|upsell|free trial)\b/,
        // "do I have to pay?" about the site, not "do I have to pay taxes on dividends"
        /\b(do|will) i (have|need) to pay( (for|to use) (it|this|firedbunny|the site|the website|the lessons|the tools|the courses|anything))?$/, /^(free|is it free|cost|price|how much)$/],
        say: () => 'Yes. Every lesson, tool and simulator is free: no paywall, no course upsell, no “premium” tier for the important parts, and no ads or affiliate links.' + (SML.support && SML.support.live() ? ' If you want to, you can chip in on the Support page, but it’s optional and unlocks nothing.' : '') + ' A paid plan for a few extras that cost money per person to run is only being considered; the Plans page explains.', links: ['about', 'plans', 'editorial'], chips: 'after' },
      { id: 'who', patterns: [/\bwho (made|makes|built|runs|owns|wrote|writes|created|is behind|are you guys)\b/, /\bwho is (firedbunny|the bunny|behind)\b/, /\bwhat is firedbunny\b/, /\b(about|tell me about) (this site|the site|firedbunny|you guys)\b/, /\bwhy (does this site exist|did you make this|firedbunny)\b/],
        say: 'FiredBunny is a pen name: the name the person who writes and runs this site publishes under. The site is published by FluidWeb LLC. They spent about ten years learning about money the slow way, and turned those notes into free lessons and tools. Lessons are drafted with AI tools and checked against the primary sources cited on each page.', links: ['about', 'editorial'], chips: [{ l: 'Is it free?', a: 'ask', v: 'is it free' }, { l: 'Send feedback', a: 'feedback' }, { l: 'Something else', a: 'menu' }] },
      { id: 'written', patterns: [/\b(written|made|created|generated|drafted) (by|with) (ai|chatgpt|a robot|a computer|claude)\b/, /\b(ai generated|ai written)\b/, /\b(are|is) (the )?(lessons|numbers|figures|facts|this site|the site|it|content) (accurate|reliable|checked|correct|true|up to date|current|trustworthy)\b/, /\bwhere (do|does) (you|the lessons|firedbunny) get\b/, /\b(your )?sources\b/],
        say: 'Lessons, examples and calculator guides are drafted with AI tools and checked against the primary sources cited on each page (the IRS, the SEC, the Federal Reserve and others), and the numbers in worked examples are recalculated, not copied. Each sourced lesson shows the month its figures were last checked. Rules change every year, so confirm current figures with the official source before you act.', links: ['editorial'], chips: [{ l: 'Report an inaccuracy', a: 'feedback', v: 'Correct an inaccuracy' }, { l: 'Something else', a: 'menu' }] },
      // connecting a brokerage (the Portfolio page); before 'delete' so "disconnect my brokerage" lands here
      { id: 'portfolio', patterns: [
        /\b(connect|link|linking|hook up|import|sync|add)\b.*\b(brokerage|broker|robinhood|schwab|fidelity|vanguard|webull|etrade|e trade|holdings|positions|portfolio|investment accounts?)\b/,
        /\b(brokerage|broker|robinhood|portfolio|holdings)\b.*\b(connect|connection|connected|link|linked|import|disconnect|unlink|revoke)\b/,
        /\b(disconnect|unlink|revoke)\b.*\b(brokerage|broker|robinhood|portfolio|snaptrade|account)\b/,
        /\b(see|view|show|check|track|analy[sz]e|review)\b.*\bmy (portfolio|holdings|positions|brokerage)\b/, /\bsnaptrade\b/, /^(my )?portfolio( page| dashboard| tracker)?$/],
        say: () => 'The Portfolio page ' + (SML.portfolio && SML.portfolio.enabled() ? 'lets you connect a brokerage read-only through SnapTrade (Robinhood, or any brokerage SnapTrade supports)' : 'will let you connect a brokerage read-only through SnapTrade; for now it shows a made-up sample portfolio') + ' and explains your accounts: allocation, concentration, gains and losses by tax term, open options and income, each with its lesson. FiredBunny can’t place trades. Your holdings are fetched only when you open the page and kept on your device, not in your account, and Disconnect removes the access at SnapTrade.',
        links: ['portfolio', 'settings'], chips: 'after' },
      // accounts and data
      { id: 'delete', patterns: [/\b(delete|erase|remove|wipe|clear|reset|destroy)\b.*\b(data|account|progress|everything|info|information|history|profile|details)\b/, /\bforget (me|my data)\b/, /\bclose my account\b/, /\bdelete my\b/], do: 'delete' },
      { id: 'signin', patterns: [/\b(sign|log) ?(in|on|up|into)\b/, /\b(create|make|open|register|need|get) (an |my |a free |a )?account\b/, /\b(forgot|reset|change|lost) (my )?password\b/, /\bpassword\b/, /^(login|account|my account)$/], do: 'signin' },
      { id: 'offline', patterns: [/\b(offline|without internet|no internet|without a connection|no connection|install|home screen|pwa)\b/, /\b(download|save) (the )?(audio|lessons?|app|site)\b/, /\b(mobile app|iphone app|android app|ios app|app store|play store)\b/, /^(app|apps|the app|mobile app|is there an app)$/, /\bis there an app\b/], do: 'offline' },
      { id: 'sync', patterns: [/\b(sync|syncing|synced|other device|another device|other devices|my phone|different computer|other computer|new phone|new computer)\b/, /\b(save|keep|lost|lose|losing|saving) (my )?(progress|data|work|stuff|results)\b/, /\bwhere (is|are) my (data|progress|results) (saved|stored|kept)\b/, /\b(export|backup|back up|import) (my |all my )?(data|progress|everything|results|file)\b/], do: 'sync' },
      { id: 'privacy', patterns: [/\b(privacy|cookies?|tracking|track me|tracked|analytics|google analytics|gdpr|personal data|sell my data|my information)\b/, /\bwhat (data|information) do you (collect|keep|store)\b/], do: 'privacy' },
      { id: 'audio', patterns: [/\b(audio|listen|narration|read aloud|read out|podcast|voice)\b/],
        say: 'Lessons have a Listen button near the top. The audio is read by a computer: recordings made with the open Kokoro-82M text-to-speech model, or your device’s own voice when a recording isn’t available. On the website you can save lesson audio for offline listening.', links: ['offline', 'editorial'], chips: 'after' },
      // getting started
      { id: 'start', patterns: [/\b(where|how) (do|should|can|would) i (start|begin)\b/, /\bwhere (to|should i) (start|begin)\b/, /\b(beginner|beginners|newbie|noob|new to (this|investing|trading|the stock market|stocks|the market|money|finance|options)|complete beginner|know nothing|just starting|getting started|get started|starting out|learning path|where do i begin|first steps)\b/, /^(start|begin|start here|lets start|lets begin)$/], do: 'start' },
      { id: 'when', patterns: [/\b(when|what day|what date|which day|next|upcoming|schedule|date of|dates for|how long until|how many days)\b/], do: 'when' },
      { id: 'tool', patterns: [/\b(calculator|calculators|calc|calcs|tools?|simulator|planner|estimator|work out|figure out|compute|calculate)\b/], do: 'tool' },
      { id: 'compare', patterns: [/\b(vs|versus|compared to|compared with|or|better than)\b/, /\bdifference between\b/, /\bdifferences between\b/], do: 'compare' },
      { id: 'navigate', patterns: [/^(take me to|take me|go to|goto|open|open up|show me|bring me to|navigate to|jump to|link to|link me to|i want to see|i want to go to|lets go to|can you open|can you show me|where is|where are|where can i find|where do i find|how do i get to|find me|find the|find)\b/, /\b(page|section) (for|about|on|with)\b/], do: 'navigate' },
      // follow-ups to the last answer
      { id: 'more', max: 6, patterns: [/^(tell me more|more|more please|go on|continue|details|more details|more info|key takeaways|takeaways|summary|summarize|sum it up|what else|and then|explain more|explain it|how does it work|how it works)$/], do: 'more' },
      { id: 'open', max: 5, patterns: [/^(open it|open that|take me there|go there|yes|yes please|yep|yeah|yup|sure|ok|okay|show me|lets go|go|do it|that one|open the lesson|open the tool|y)$/], do: 'open' },
      { id: 'define', patterns: [/^(whats|what is|what are|what does|what do|what was|define|explain|meaning of|definition of|tell me about|describe|teach me|how does|how do|how is|how are|why is|why are|why do|why does|who is|what s)\b/, /\b(mean|means|meaning|stand for|stands for)\b/], do: 'define' },
    ],
  };
})();
