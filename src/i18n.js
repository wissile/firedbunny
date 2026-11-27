/* On-screen translation for labels the code also uses as values (FiredBunny in other languages, see docs/i18n/).
   Most text is translated in the code itself when a language is built (tools/i18n). Short labels that the code may also
   compare or look up ('Married', 'All', a table's row names) stay English in the code, and this file swaps them on
   screen, by exact match, as pages draw: text nodes and the title / aria-label / placeholder / alt attributes. The
   English site has no dictionary (SML.I18N_RT is unset) and this file does nothing.
   SML.tr(s) gives the translation of one such label, for code that builds text by hand. */
(function () {
  'use strict';
  const SML = window.SML;
  const RT = SML && SML.I18N_RT;
  SML.tr = (s) => s;
  if (!RT) return;
  const map = new Map(Object.keys(RT).map((k) => [k, RT[k]]));
  SML.tr = (s) => { const v = map.get(String(s).trim()); return v == null ? s : v; };
  const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  const swap = (s) => {
    const t = s.trim(); if (!t || t.length > 200) return null;
    const v = map.get(t); if (v == null || v === t) return null;
    return s.replace(t, v);
  };
  function textNode(n) { const r = swap(n.nodeValue); if (r != null) n.nodeValue = r; }
  function element(el) {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
    for (const a of ATTRS) { const v = el.getAttribute(a); if (v) { const r = swap(v); if (r != null) el.setAttribute(a, r); } }
  }
  function walk(root) {
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1) return;
    element(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => (n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'STYLE') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    while (w.nextNode()) { const n = w.currentNode; if (n.nodeType === 3) textNode(n); else element(n); }
  }
  SML.translateDOM = walk;
  const start = () => {
    walk(document.documentElement);
    new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') element(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start);
})();
