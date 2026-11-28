/* Pages built on US rules (401(k), IRA, IRS brackets, Social Security, US banks...), hidden in every language until a
   country version replaces them (tools/i18n/<lang>/content/). Loaded after every module by tools/i18n/make.js. Links to a
   hidden page from other pages become plain text (pages.js linkify), and the lists, counts and related lessons only see
   what is left. Lists are filtered in place, because modules keep references to SML.lessons and friends. */
(function () {
  'use strict';
  const SML = window.SML;
  const H = {
    courses: ['taxes', 'benefits', 'accounts', 'wtax', 'retire', 'fi-tax', 'fi-health', 'fi-abroad', 'banking'],
    lessons: ['l-broker', 'l-emergency', 'l-net-worth', 'l-credit-score', 'l-balance-transfer', 'l-smart-leverage',
      'l-index-funds', 'l-extra-money', 'l-kids-money', 'l-home-taxes', 'l-rental', 'l-insurance', 'l-estate',
      'l-household', 'l-visas', 'l-fire-planner', 'l-crypto-risks', 'l-ai-automate'],
    tools: ['tool-tlh', 'tool-match', 'tool-limits', 'tool-rsu', 'tool-espp', 'tool-roth', 'tool-backdoor', 'tool-ss',
      'tool-retire', 'tool-brackets', 'tool-wheeltax', 'tool-firetax', 'tool-ladder', 'tool-aca', 'tool-france',
      'tool-fireplan', 'tool-transfer', 'tool-cash', 'tool-rental'],
  };
  const extra = SML.LANG && SML.LANG.show ? new Set(SML.LANG.show) : new Set(); // a language may bring one back
  const hideC = new Set(H.courses.filter((x) => !extra.has(x)));
  const hideL = new Set(H.lessons.filter((x) => !extra.has(x)));
  const hideT = new Set(H.tools.filter((x) => !extra.has(x)));
  const inPlace = (arr, keep) => { let j = 0; for (let i = 0; i < arr.length; i++) if (keep(arr[i])) arr[j++] = arr[i]; arr.length = j; };
  const hidden = new Set();
  (SML.lessons || []).forEach((l) => { if (hideL.has(l.id) || hideC.has(l.course)) hidden.add(l.id); });
  (SML.courses || []).forEach((c) => { if (hideC.has(c.id)) hidden.add('c-' + c.id); });
  (SML.tools || []).forEach((t) => { if (hideT.has(t.id)) hidden.add(t.id); });
  inPlace(SML.lessons, (l) => !hidden.has(l.id));
  inPlace(SML.courses, (c) => !hidden.has('c-' + c.id));
  inPlace(SML.tools, (t) => !hidden.has(t.id));
  // glossary terms whose lesson is hidden are US jargon with nowhere to go (401(k), FDIC, Roth...): hidden too
  inPlace(SML.glossary, (g) => !(g.l && hidden.has(g.l)));
  SML.HIDDEN = hidden;
})();
