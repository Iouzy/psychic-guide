// Dev-only: report Portuguese source strings used via tr()/trf() that have no
// English translation in src/i18n.jsx. Portuguese is the source language and
// missing keys fall back to PT gracefully, so this is a warning gate — it lists
// gaps and exits non-zero so CI / pre-commit can catch untranslated UI.
//
//   node tools/check-i18n.mjs
//
// Not bundled into the app.
import { readFileSync, readdirSync } from "node:fs";

const srcDir = new URL("../src/", import.meta.url);
const i18nSrc = readFileSync(new URL("i18n.jsx", srcDir), "utf8");

// Collect every key defined in the two dictionary object literals. We scope to
// the dictionary spans so the regex doesn't pick up keys from doc comments or
// from the tr()/trf() examples in the header.
function dictSpan(text, startMarker, endMarker) {
  const a = text.indexOf(startMarker);
  const b = endMarker ? text.indexOf(endMarker, a) : text.length;
  return a < 0 ? "" : text.slice(a, b < 0 ? text.length : b);
}
const spans = [
  dictSpan(i18nSrc, "const I18N_EN = {", "=== I18N_EN_BULK_BEGIN ==="),
  dictSpan(i18nSrc, "=== I18N_EN_BULK_BEGIN ===", "=== I18N_EN_BULK_END ==="),
].join("\n");

const present = new Set();
const keyRe = /("(?:[^"\\]|\\.)*")\s*:/g;
let m;
while ((m = keyRe.exec(spans))) {
  try { present.add(JSON.parse(m[1])); } catch {}
}

// Collect every tr("…") / trf("…") first argument (string literals only).
const files = readdirSync(srcDir).filter(f => f.endsWith(".jsx") || f.endsWith(".js"));
const used = new Set();
const callRe = /\btrf?\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
for (const f of files) {
  if (f === "i18n.jsx") continue;  // the dictionary itself isn't UI
  const code = readFileSync(new URL(f, srcDir), "utf8");
  let c;
  while ((c = callRe.exec(code))) {
    let lit = c[1];
    try {
      if (lit[0] === "'") lit = '"' + lit.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"') + '"';
      const s = JSON.parse(lit);
      if (s.trim() !== "") used.add(s);
    } catch {}
  }
}

const missing = [...used].filter(k => !present.has(k)).sort((a, b) => a.localeCompare(b, "pt"));
console.log(`i18n: ${used.size} keys used · ${present.size} translated · ${missing.length} missing`);
for (const k of missing) console.error("  MISSING EN: " + JSON.stringify(k));
process.exit(missing.length ? 1 : 0);
