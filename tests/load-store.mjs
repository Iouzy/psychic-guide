// Test helper: transpile src/store.jsx with the vendored Babel and evaluate it
// in a fresh VM sandbox (React / tr / localStorage stubbed), returning the
// helpers it exposes on `window`. This mirrors tools/test-cadence.mjs and keeps
// the tests aligned with how the app actually runs (no build step, globals on
// window). Each call gets an isolated sandbox so tests don't share state.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const Babel = require("../vendor/babel.min.js");

const src = readFileSync(new URL("../src/store.jsx", import.meta.url), "utf8");
const { code } = Babel.transform(src, { presets: ["react"], filename: "store.jsx" });

export function loadStore() {
  const noop = () => {};
  const win = {};
  // A minimal localStorage so loadState/saveState don't throw if exercised.
  const mem = new Map();
  const ls = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  };
  const ctx = {
    React: { useState: noop, useEffect: noop, useRef: noop, useCallback: noop, useMemo: noop },
    window: win,
    tr: (s) => s,
    trf: (s) => s,
    localStorage: ls,
    navigator: { language: "pt" },
    console, Date, Math, JSON, Object, Array,
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  win.__localStorage = ls; // expose for tests that want to inspect persistence
  return win;
}
