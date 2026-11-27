/* Pseudo-translation: every visible segment becomes accented text in brackets (Save -> ⟦Šàvé⟧). If a code string was
   taken for text, the pseudo site breaks or shows brackets in odd places, which is how the extractor is checked.
   node tools/i18n/pseudo.js OUTDIR  -> writes a translated copy of src/ to OUTDIR */
'use strict';
const fs = require('fs'), path = require('path');
const { extract, apply } = require('./segments');
const SRC = path.join(__dirname, '..', '..', 'src');
const OUT = process.argv[2];
const ACC = { a: 'à', e: 'é', i: 'î', o: 'ö', u: 'ü', A: 'Å', E: 'É', I: 'Î', O: 'Ö', U: 'Û', c: 'ç', n: 'ñ', s: 'š', y: 'ÿ' };
const pseudo = (en) => '⟦' + en.split(/(<[^>]*>|\{\d+\}|&[a-z#0-9]+;)/).map((p, i) => (i % 2 ? p : p.replace(/[aeiouAEIOUcnsy]/g, (c) => ACC[c]))).join('') + '⟧';
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true });
let total = 0, bad = 0; const rt = {};
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(SRC, f), 'utf8');
  const dict = {};
  for (const g of extract(src, f)) { dict[g.key] = pseudo(g.en); if (g.runtime) rt[g.en] = pseudo(g.en); }
  const r = apply(src, f, dict);
  total += r.used.length; bad += r.bad.length;
  fs.writeFileSync(path.join(OUT, f), r.out);
}
fs.writeFileSync(path.join(OUT, 'i18n-data.js'), `(function(){window.SML=window.SML||{};SML.I18N_RT=${JSON.stringify(rt)};})();\n`);
console.log('pseudo segments written', total, 'refused', bad, 'on-screen labels', Object.keys(rt).length);
