// Build-bundle contract: every asset index.html loads at runtime must actually
// be copied into ./www by scripts/build-web.mjs. The original bug: index.html
// registers ./service-worker.js but the build script never copied it, so static
// web deploys (the documented ./www output) shipped with no offline cache — the
// registration 404'd and the .catch() hid it. These tests lock that down.
import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("build-web bundle", () => {
  beforeAll(() => {
    // Re-run the real build so we assert against actual output, not a snapshot.
    execFileSync("node", ["scripts/build-web.mjs"], { cwd: ROOT, stdio: "ignore" });
  });

  it("copies the service worker registered by index.html into ./www", () => {
    const index = readFileSync(resolve(ROOT, "index.html"), "utf8");
    const m = index.match(/serviceWorker\.register\(\s*["']([^"']+)["']/);
    expect(m, "index.html should register a service worker").toBeTruthy();
    const swPath = m[1].replace(/^\.?\//, "");
    expect(existsSync(resolve(ROOT, "www", swPath)),
      `${swPath} must exist in ./www so the deployed PWA can register it`).toBe(true);
  });

  it("ships the app shell index.html and manifest", () => {
    expect(existsSync(resolve(ROOT, "www", "index.html"))).toBe(true);
    expect(existsSync(resolve(ROOT, "www", "manifest.json"))).toBe(true);
  });

  it("every same-origin asset the service worker precaches exists in ./www", () => {
    // The SW's install step calls cache.addAll(LOCAL_ASSETS); any path missing
    // from the bundle makes addAll reject and the whole SW install fail.
    const sw = readFileSync(resolve(ROOT, "www", "service-worker.js"), "utf8");
    const block = sw.match(/LOCAL_ASSETS\s*=\s*\[([\s\S]*?)\]/);
    expect(block, "service-worker.js should declare LOCAL_ASSETS").toBeTruthy();
    const assets = [...block[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
    for (const a of assets) {
      const rel = a.replace(/^\.?\//, "");
      if (rel === "" || rel === "index.html") continue; // "./" and "./index.html" map to the shell
      expect(existsSync(resolve(ROOT, "www", rel)),
        `precached asset "${a}" is missing from ./www`).toBe(true);
    }
  });
});
