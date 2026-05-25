// Dev-only: transform every in-browser JSX source with the vendored Babel to
// catch syntax/JSX errors, since this app has no build step (Babel runs in the
// browser at load time). Not bundled into the app.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Babel = require("../vendor/babel.min.js");

const dir = new URL("../src/", import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith(".jsx"));

let failed = 0;
for (const f of files) {
  const code = readFileSync(new URL(f, dir), "utf8");
  try {
    Babel.transform(code, { presets: ["react"], filename: f });
    console.log("ok  " + f);
  } catch (e) {
    failed++;
    console.error("ERR " + f + "\n    " + e.message);
  }
}
process.exit(failed ? 1 : 0);
