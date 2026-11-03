// Build the spoken script for every lesson (same code the site uses), write tools/narration/scripts.json.
// Usage: node tools/narration/make-scripts.js [--ids l-a,l-b] [--print l-id]
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..'), SRC = path.join(ROOT, 'src');
const noop = () => {};
const el = () => ({ style: {}, setAttribute: noop, appendChild: noop, addEventListener: noop, classList: { add: noop, remove: noop, toggle: noop }, querySelector: () => null, querySelectorAll: () => [] });
const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, Date, Intl, Promise };
ctx.window = ctx; ctx.globalThis = ctx;
ctx.document = { addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, createElement: el, createElementNS: el, head: el(), body: el(), documentElement: el(), querySelector: () => null, querySelectorAll: () => [], getElementById: () => null };
ctx.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
ctx.CustomEvent = function () {}; ctx.addEventListener = noop; ctx.removeEventListener = noop; ctx.location = { protocol: 'file:', hash: '' }; ctx.navigator = { userAgent: 'node' };
ctx.matchMedia = () => ({ matches: false, addEventListener: noop }); ctx.requestAnimationFrame = noop;
vm.createContext(ctx);
const order = ['core.js', 'brand.js', 'content.js', 'content-money.js', 'content-macro.js', 'content-realco.js', 'account.js', 'assets.js'];
const fixed = ['mod-options.js', 'mod-charts.js', 'mod-risk.js', 'mod-company.js', 'mod-play.js', 'mod-indicator.js'];
const mods = fs.readdirSync(SRC).filter((f) => /^mod-.*\.js$/.test(f));
const files = order.concat(fixed.filter((m) => mods.includes(m)), mods.filter((m) => !fixed.includes(m)).sort());
for (const f of files) { try { vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, { filename: f }); } catch (e) { console.error('load', f, e.message); } }
const SML = ctx.SML;
const args = process.argv.slice(2);
const want = args.includes('--ids') ? args[args.indexOf('--ids') + 1].split(',') : null;
const print = args.includes('--print') ? args[args.indexOf('--print') + 1] : null;
// play order: track order, course order, lesson order
const courses = SML.courses.slice();
const cIdx = (id) => { const c = courses.find((x) => x.id === id); return c ? courses.indexOf(c) : 999; };
const lessons = SML.lessons.slice().sort((a, b) => cIdx(a.course) - cIdx(b.course) || (a.order || 0) - (b.order || 0));
const out = [];
for (const l of lessons) {
  if (want && !want.includes(l.id)) continue;
  const sc = SML.narrate.script(l);
  out.push({ id: l.id, title: l.title, hash: SML.narrate.hash(sc), words: SML.narrate.words(sc), chapters: sc.chapters });
}
if (print) { const x = out.find((o) => o.id === print); x.chapters.forEach((c) => { console.log('## ' + c.name); c.paras.forEach((p) => console.log(p + '\n')); }); process.exit(0); }
fs.writeFileSync(path.join(__dirname, 'scripts.json'), JSON.stringify(out, null, 1));
console.log(out.length, 'lessons,', out.reduce((n, o) => n + o.words, 0), 'words');
