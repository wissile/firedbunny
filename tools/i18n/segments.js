/* Finds the visible English text in FiredBunny's source files and rewrites it with translations.

   A "segment" is one piece of text a reader sees: a sentence, a heading, a button label. It comes from
   - a template literal (`<p>You have ${n} lessons</p>`): its text between block-level HTML tags, with ${...} kept as
     numbered placeholders {0} {1} and inline tags (<b>, <a href=...>, <em>, <code>...) kept as they are;
   - a plain string literal ('Save your plan', '<b>Tip:</b> start small'), the same way;
   - the title / aria-label / placeholder / alt attributes inside that HTML.
   Strings that look like code (ids, CSS classes, selectors, URLs, event names, single lowercase words, keys) are left
   alone, and a few contexts never hold text (object keys, comparisons, querySelector, addEventListener...).

   extract(src, file) -> [{ key, en, file, line }]          (key = sha1 of the English text, first 12 hex)
   apply(src, file, dict) -> { out, used, missing }         (dict: key -> translated text; missing keeps English)

   Translations must keep every placeholder {N} and every tag of the English; a translation that doesn't is ignored
   (reported as "bad") and the English stays, so a slip can never break the code. */
'use strict';
const acorn = require('acorn');
const walk = require('acorn-walk');
const crypto = require('crypto');

const INLINE = new Set(['a', 'b', 'strong', 'i', 'em', 'u', 'code', 'kbd', 'abbr', 'sup', 'sub', 'small', 'mark', 'span', 'br', 'wbr', 's', 'del', 'ins', 'q', 'cite', 'dfn', 'time', 'var', 'samp']);
const TEXT_ATTRS = ['title', 'aria-label', 'placeholder', 'alt', 'data-tip', 'aria-description'];
const keyOf = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const PH = (n) => `\u0001${n}\u0002`; // placeholder marker used while working on a template

/* ---------- is this text worth translating? ---------- */
const LETTERS = /[A-Za-z]{2,}/;
function looksLikeText(s, ctx) {
  const t = s.replace(/\u0001\d+\u0002/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').trim();
  if (!LETTERS.test(t)) return false;
  if (/^(https?:|mailto:|data:|\/|#|\.)/.test(t) || /^\[[\w-]+(=|\])/.test(t)) return false; // URLs, paths, selectors
  if (/^[a-z0-9_$.-]+$/.test(t) && !(ctx === 'text' && /\u0001\d+\u0002/.test(s) && /^[a-z]+$/.test(t))) return false; // ids, keys, classes, events: one lowercase token ('{0} min' in a template is text)
  if (/^[A-Z0-9_]+$/.test(t) && t.length > 1) return ctx === 'text';         // CONSTANTS, but "OK"/"ETF" as visible text
  if (/^[\w-]+$/.test(t) && /[-_]/.test(t) && !/^[A-Z][a-z]+(-[A-Za-z]+)+$/.test(t)) return false; // kebab-case ids; 'Self-assessment' is text
  if (/[{};]\s*$|^\s*[\w-]+\s*:\s*[^:]+;/.test(t) && /;/.test(t)) return false; // CSS
  if (/^(rgba?|hsla?|var|calc|url|translate|rotate|scale|cubic-bezier)\(/.test(t)) return false;
  if (/^[\w.-]+\.(js|css|png|jpe?g|svg|mp3|mp4|json|webp|woff2?)(\?.*)?$/i.test(t)) return false;
  if (/^M[\d .,-]+/.test(t) && /\d/.test(t) && !/\s[a-z]{3,}/.test(t)) return false; // SVG path data
  if (/^[a-z]+(\s[a-z-]+)+$/.test(t) && ctx === 'attr-class') return false;
  // single words: visible text only when capitalised (labels like "Save", "Next") or in a text context
  if (!/\s/.test(t)) return /^[A-Z][a-z]/.test(t) || ctx === 'text';
  return true;
}

/* ---------- split HTML-ish text into segments ---------- */
// returns [{start, end, text}] ranges inside s (s may contain placeholder markers)
function htmlSegments(s) {
  const out = [];
  const re = /<\/?([a-zA-Z][\w-]*)\b[^>]*>|<!--[\s\S]*?-->/g;
  let last = 0, m, runStart = 0;
  const flush = (end) => {
    let a = runStart, b = end;
    const chunk = s.slice(a, b);
    if (!chunk.trim()) return;
    // trim surrounding whitespace only: placeholders and inline tags at the edges stay in the segment, so a translation
    // can move them ('{0} of {1} lessons done' -> 'Il reste {1} lecons...')
    const lead = chunk.match(/^\s*/)[0];
    const trail = chunk.match(/\s*$/)[0];
    a += lead.length; b -= trail.length;
    if (b <= a) return;
    const text = s.slice(a, b);
    if (looksLikeText(text, 'text')) out.push({ start: a, end: b, text });
  };
  while ((m = re.exec(s))) {
    const tag = (m[1] || '').toLowerCase();
    if (m[0].startsWith('<!--')) { flush(m.index); runStart = re.lastIndex; continue; }
    // attributes worth translating, inside any tag
    for (const attr of TEXT_ATTRS) {
      const ar = new RegExp(`\\s${attr}=(["'])(.*?)\\1`, 'g');
      let am;
      while ((am = ar.exec(m[0]))) {
        const v = am[2];
        const vs = m.index + am.index + am[0].indexOf(am[1]) + 1;
        if (looksLikeText(v, 'attr') && !/\u0001\d+\u0002/.test(v.replace(/^\s*\u0001\d+\u0002\s*$/, ''))) {
          if (!/^\s*\u0001\d+\u0002\s*$/.test(v)) out.push({ start: vs, end: vs + v.length, text: v, attr: true });
        }
      }
    }
    if (INLINE.has(tag)) continue;   // inline tags stay inside the segment
    flush(m.index);
    runStart = re.lastIndex;
    last = re.lastIndex;
  }
  flush(s.length);
  return out;
}

/* ---------- where a string sits decides how it is translated ----------
   'code'    never translated (keys, selectors, event names, CSS, ids)
   'runtime' left English in the code and translated on screen, by exact match, as it is drawn (src/i18n.js): labels
             the code may also use as values (button options, compared strings, table keys, state defaults). Safe for
             the logic whatever the code does with them; the only cost is a label glued into a longer string stays English.
   false     translated in the code (sentences, HTML, lesson and page text) */
const CODE_KEYS = /^(id|key|icon|widget|course|track|tool|tools|type|kind|cls|class|className|color|bg|fill|stroke|unit|fmt|format|sym|symbol|ticker|slug|path|href|src|url|u|img|image|svg|audio|voice|lang|locale|token|tok|route|cat|group|tag|tags|level|sort|sel|selector|event|action|mode|style|font|css|ico|emoji|code|ccy|currency|tz|field|prop|attr|el|elId|target|terms|links|related|series|data|seed|var|vars|grid|align|side|pos|dir|shape|layout|variant|status|state|flag|country|region|lessonId|ref|l|w|g)$/;
const RUNTIME_KEYS = /^(v|value|k|opt|choice|def|default|name|t|abbr|short|sk|lbl)$/;
const TEXT_KEYS = /^(title|label|lab|desc|description|summary|idea|body|h|html|q|a|text|note|notes|tip|tips|msg|message|caption|sub|subtitle|lede|kicker|hint|help|why|what|how|example|try|takeaway|takeaways|points|mistakes|d|full|brief|deep|faq|say|reply|answer|intro|outro|blurb|teaser|cta|more|warn|warning|info|empty|placeholder|tooltip|legend|headline|heading|line|lines|steps|step|detail|details|meaning|explain|explanation|story|quote|verdict|read|reads|lesson|after|before|then|ok|bad|good|caveat|source|t2|sentence)$/;
const CODE_CALLS = /^(querySelector(All)?|getElementById|getElementsByClassName|closest|matches|addEventListener|removeEventListener|dispatchEvent|getItem|setItem|removeItem|getAttribute|setAttribute|removeAttribute|hasAttribute|toggleAttribute|add|remove|toggle|contains|createElement|createElementNS|fetch|import|require|postMessage|track|event|send|use|split|join|replace|replaceAll|startsWith|endsWith|includes|indexOf|lastIndexOf|test|match|matchAll|search|RegExp|padStart|padEnd|toLocaleString|toLocaleDateString|toLocaleTimeString|NumberFormat|DateTimeFormat|Date|key|go|route|path|token|exists|pathOf|tokenOf|assetURL|warn|log|error|info|debug|define|on|off|emit|has|get|set|delete|store|load|save|plays|cssVar|getPropertyValue|setProperty|removeProperty|scrollTo|animate|focus|open|\$|\$\$|seg|on|n|uid|svg|el|attr|css|style|byId|lessonById|toolById|trackById|courseById|now|wire|chips|getContext|createLinearGradient|addColorStop|font|measureText|insertAdjacentHTML)$/;
const OPTION_CALLS = /^(seg|chips|tabs|select|radios|pills|toggle|picker|choice|segs|options)$/;
const DISPLAY_PROPS = /^(textContent|innerText|title|placeholder|ariaLabel|alt|innerHTML|outerHTML|nodeValue|data)$/;

function calleeName(c) { return c.type === 'MemberExpression' ? (c.property.name || c.property.value) : c.name; }

function classify(node, ancestors) {
  let i = ancestors.length - 2, parent = ancestors[i], child = node;
  if (!parent) return false;
  if (parent.type === 'ExpressionStatement') return 'code'; // 'use strict' and other directives
  if (parent.type === 'Property' && parent.key === child && !parent.computed) return 'code';
  if (parent.type === 'MemberExpression' && parent.property === child) return 'code';
  if (parent.type === 'BinaryExpression' && /^(in|instanceof)$/.test(parent.operator)) return 'code';
  if (parent.type === 'ImportDeclaration' || parent.type === 'ExportNamedDeclaration') return 'code';
  const single = node.type === 'Literal' && !/\s/.test(String(node.value).trim());
  // look through glue that doesn't change the meaning: 'a' + b, x || 'a', c ? 'a' : 'b', ['a', 'b']
  let inArray = false, glued = false;
  while (parent && ((parent.type === 'BinaryExpression' && parent.operator === '+') || parent.type === 'LogicalExpression' ||
         (parent.type === 'ConditionalExpression' && parent.test !== child) || parent.type === 'ArrayExpression' ||
         parent.type === 'TemplateLiteral' || parent.type === 'SpreadElement')) {
    if (parent.type === 'ArrayExpression') inArray = true;
    if (parent.type === 'BinaryExpression' || parent.type === 'TemplateLiteral') glued = true;
    child = parent; parent = ancestors[--i];
  }
  if (!parent) return false;
  if (parent.type === 'BinaryExpression' && /^(===|!==|==|!=)$/.test(parent.operator)) return 'runtime';
  if (parent.type === 'SwitchCase' && parent.test === child) return 'runtime';
  if (parent.type === 'CallExpression' || parent.type === 'NewExpression') {
    const name = calleeName(parent.callee) || '';
    const at = parent.arguments.indexOf(child);
    if (OPTION_CALLS.test(name) && (at === 1 || at === 2)) return 'runtime';
    if (CODE_CALLS.test(name) && at === 0) return 'code';
    if (name === 'setAttribute' && at === 1) {
      const a0 = parent.arguments[0];
      return a0 && a0.type === 'Literal' && TEXT_ATTRS.includes(a0.value) ? false : 'code';
    }
    if (/^(classList|dataset)$/.test(name)) return 'code';
  }
  if (parent.type === 'AssignmentExpression' && parent.right === child) {
    if (parent.left.type === 'MemberExpression') {
      const p = parent.left.property.name || parent.left.property.value || '';
      if (DISPLAY_PROPS.test(p)) return false;
      if (/^(className|id|type|href|src|rel|name|value|cssText|display|position|background|color|width|height|transform|cursor|hash|search|pathname|key|lang|dir|role|fill|stroke)$/.test(p)) return 'code';
      if (/^(textContent|innerText)$/.test(p)) return false;
    }
    if (single) return 'runtime';
  }
  if (parent.type === 'Property' && parent.value === child && !parent.computed) {
    const k = String(parent.key.name || parent.key.value || '');
    if (CODE_KEYS.test(k)) return 'code';
    if (RUNTIME_KEYS.test(k)) return 'runtime';
    if (TEXT_KEYS.test(k)) return false;
    return single ? 'runtime' : false;
  }
  if (parent.type === 'VariableDeclarator' || parent.type === 'AssignmentPattern' || parent.type === 'ReturnStatement' || inArray) {
    return single ? 'runtime' : false;
  }
  return single && !glued ? 'runtime' : (glued ? 'glued' : false);
}

function inClassAttr(src, node, ancestors) {
  for (let i = ancestors.length - 2; i >= 0; i--) {
    const a = ancestors[i];
    if (a.type === 'TemplateLiteral') {
      const q = a.quasis.filter((x) => x.end <= node.start).pop();
      return !!q && /\b(class|style|id|data-[\w-]+|href|for|type|name)=["'][^"']*$/.test(src.slice(q.start, q.end));
    }
    if (a.type === 'CallExpression' || a.type === 'AssignmentExpression' || a.type === 'VariableDeclarator' || a.type === 'Property') return false;
  }
  return false;
}

/* ---------- walk a file ---------- */
function parse(src) {
  return acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true, allowReturnOutsideFunction: true, locations: true });
}

// every string or template literal with its translatable ranges (in source coordinates)
function collect(src) {
  const ast = parse(src);
  const items = [];
  walk.fullAncestor(ast, (node, _st, ancestors) => {
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const how = classify(node, ancestors);
      if (how === 'code') return;
      const raw = src.slice(node.start + 1, node.end - 1);  // between the quotes, as written (escapes kept)
      const gluedText = how === 'glued' && /^\s|\s$/.test(raw) && /[A-Za-z]{2,}/.test(raw) && !/[{};:=<>]/.test(raw) && !inClassAttr(src, node, ancestors);
      const segs = /<[a-zA-Z\/!]/.test(raw) ? htmlSegments(raw) : ((looksLikeText(raw, 'string') || gluedText) ? [{ start: 0, end: raw.length, text: raw }] : []);
      for (const g of segs) items.push({ kind: 'str', quote: src[node.start], abs: node.start + 1 + g.start, absEnd: node.start + 1 + g.end, text: g.text, line: node.loc.start.line, runtime: how === 'runtime' && !/<[a-zA-Z]/.test(raw) });
    } else if (node.type === 'TemplateLiteral') {
      const parentTag = ancestors[ancestors.length - 2];
      if (parentTag && parentTag.type === 'TaggedTemplateExpression') return;
      if (classify(node, ancestors) === 'code') return;
      // the template's text with each ${expr} replaced by a marker; remember where every piece lives in the source
      let s = '';
      const map = []; // [sIndexStart, srcStart, length] for quasis
      node.quasis.forEach((q, i) => {
        const raw = src.slice(q.start, q.end);
        map.push([s.length, q.start, raw.length]);
        s += raw;
        if (i < node.expressions.length) s += PH(i);
      });
      const segs = htmlSegments(s);
      for (const g of segs) {
        // source range: from the source position of g.start to that of g.end (markers stand for ${...})
        const toSrc = (k, isEnd) => {
          for (let j = map.length - 1; j >= 0; j--) {
            const [ss, so, len] = map[j];
            if (k >= ss && k <= ss + len) return so + (k - ss);
          }
          // inside a marker: move to the expression boundary
          for (let j = 0; j < node.expressions.length; j++) {
            const mk = s.indexOf(PH(j));
            if (k >= mk && k <= mk + PH(j).length) return isEnd ? node.expressions[j].end + 1 : node.expressions[j].start - 2;
          }
          return null;
        };
        const a = toSrc(g.start, false), b = toSrc(g.end, true);
        if (a == null || b == null) continue;
        const idx = [...g.text.matchAll(/\u0001(\d+)\u0002/g)].map((m) => +m[1]);
        items.push({ kind: 'tpl', node, abs: a, absEnd: b, text: g.text, exprs: idx, line: node.loc.start.line });
      }
    }
  });
  return items;
}

// the English as a translator sees it: markers become {0} {1} ... numbered within the segment
function normalise(item) {
  if (item.kind !== 'tpl' || !item.exprs.length) return { en: item.text, order: [] };
  const order = [];
  const en = item.text.replace(/\u0001(\d+)\u0002/g, (_, n) => { order.push(+n); return `{${order.length - 1}}`; });
  return { en, order };
}

function extract(src, file) {
  const out = [];
  for (const it of collect(src)) {
    const { en } = normalise(it);
    out.push({ key: keyOf(en), en, file, line: it.line, attr: !!it.attr, runtime: !!it.runtime });
  }
  return out;
}

/* ---------- checks a translation keeps what the code needs ---------- */
const tagsOf = (s) => (s.match(/<\/?[a-zA-Z][\w-]*\b[^>]*>/g) || []).map((t) => t.replace(/\s(title|aria-label|alt|placeholder|data-tip)=(["']).*?\2/g, '')).sort().join('|');
const phsOf = (s) => (s.match(/\{\d+\}/g) || []).sort().join('|');
function valid(en, tr, quote) {
  if (typeof tr !== 'string' || !tr.trim()) return false;
  if (tagsOf(en) !== tagsOf(tr)) return false;
  if (phsOf(en) !== phsOf(tr)) return false;
  if (quote && tr.includes(quote) && !en.includes(quote)) return false; // would close the string literal
  if (tr.includes('`') && !en.includes('`')) return false;
  if (/\$\{/.test(tr) && !/\$\{/.test(en)) return false;
  return true;
}

/* ---------- rewrite a file with translations ---------- */
function apply(src, file, dict) {
  // innermost and last first; an outer segment that contains already-rewritten ranges reads them from the new text
  const items = collect(src).filter((it) => !it.runtime).sort((a, b) => b.abs - a.abs || a.absEnd - b.absEnd);
  let out = src;
  const used = [], missing = [], bad = [];
  const edits = []; // [origStart, origEnd, delta]
  const adj = (p) => { let d = 0; for (const [a, b, dd] of edits) if (b <= p) d += dd; return p + d; };
  for (const it of items) {
    // skip a range that cuts through an earlier edit without containing it
    if (edits.some(([a, b]) => (a < it.abs && b > it.abs && b < it.absEnd) || (a < it.absEnd && b > it.absEnd && a > it.abs) || (a < it.abs && b > it.absEnd))) continue;
    const { en, order } = normalise(it);
    const key = keyOf(en);
    const tr = dict[key];
    if (tr == null) { missing.push({ key, en, file, line: it.line }); continue; }
    if (!valid(en, tr, it.kind === 'str' ? it.quote : null)) { bad.push({ key, en, tr, file, line: it.line }); continue; }
    let text = tr;
    if (it.kind === 'tpl' && order.length) {
      text = tr.replace(/\{(\d+)\}/g, (_, n) => { const e = it.node.expressions[order[+n]]; return '${' + out.slice(adj(e.start), adj(e.end)) + '}'; });
    }
    const a = adj(it.abs), b = adj(it.absEnd);
    out = out.slice(0, a) + text + out.slice(b);
    edits.push([it.abs, it.absEnd, text.length - (b - a)]);
    used.push(key);
  }
  return { out, used, missing, bad };
}

module.exports = { extract, apply, keyOf, collect, looksLikeText };

if (require.main === module) {
  // node segments.js file.js ... -> prints a summary (segments, words) and the first few segments
  const fs = require('fs');
  let n = 0, w = 0; const seen = new Set(); let uw = 0;
  for (const f of process.argv.slice(2)) {
    const segs = extract(fs.readFileSync(f, 'utf8'), f);
    for (const g of segs) {
      n++; const words = (g.en.replace(/<[^>]+>/g, ' ').match(/[A-Za-z]+/g) || []).length; w += words;
      if (!seen.has(g.key)) { seen.add(g.key); uw += words; }
    }
    if (process.env.SHOW) for (const g of segs.slice(0, +process.env.SHOW)) console.log(`${f}:${g.line} [${g.key}] ${JSON.stringify(g.en).slice(0, 160)}`);
  }
  console.log(`segments ${n}, unique ${seen.size}, words ${w}, unique words ${uw}`);
}
