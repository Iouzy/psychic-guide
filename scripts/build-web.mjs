// Assembles the web assets Capacitor bundles into the native app (webDir).
// Everything is copied locally so the installed app has zero network/CDN deps.
import { cpSync, mkdirSync, rmSync } from "node:fs";

const OUT = "www";

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const files = ["index.html", "manifest.json"];
const dirs = ["icons", "src", "vendor"];

for (const f of files) cpSync(f, `${OUT}/${f}`);
for (const d of dirs) cpSync(d, `${OUT}/${d}`, { recursive: true });

console.log("Web bundle assembled in ./" + OUT);
