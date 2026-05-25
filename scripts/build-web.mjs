// Assembles the web assets Capacitor bundles into the native app (webDir).
// Everything is copied locally so the installed app has zero network/CDN deps.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const OUT = "www";

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const files = ["index.html", "manifest.json"];
const dirs = ["icons", "src", "vendor"];

for (const f of files) cpSync(f, `${OUT}/${f}`);
for (const d of dirs) cpSync(d, `${OUT}/${d}`, { recursive: true });

// Stamp the build with run number + timestamp so the in-app update check can
// compare against the latest GitHub release. Locally, `run` stays 0 and the
// in-app check just treats any published release as newer.
const run = Number(process.env.GITHUB_RUN_NUMBER || 0);
const ts  = Math.floor(Date.now() / 1000);

const indexPath = `${OUT}/index.html`;
const html = readFileSync(indexPath, "utf8").replace(
  /\/\*BUILD-INFO-BEGIN\*\/[\s\S]*?\/\*BUILD-INFO-END\*\//,
  `/*BUILD-INFO-BEGIN*/ ts: ${ts}, run: ${run} /*BUILD-INFO-END*/`,
);
writeFileSync(indexPath, html);

console.log(`Web bundle assembled in ./${OUT}  (build run=${run}, ts=${ts})`);
