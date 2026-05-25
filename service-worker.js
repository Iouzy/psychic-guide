// Pauta service worker — offline app shell.
// Bump CACHE_VERSION whenever the precached assets change so clients refresh.
const CACHE_VERSION = "pauta-v5";

// Same-origin assets that make up the app shell. Relative paths keep this
// working whether served from a domain root or a GitHub Pages subpath.
const LOCAL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
  "./src/focus-activity.js",
  "./src/i18n.jsx",
  "./src/tweaks-panel.jsx",
  "./src/store.jsx",
  "./src/ui-primitives.jsx",
  "./src/sub-components.jsx",
  "./src/sheets.jsx",
  "./src/tab-hoje.jsx",
  "./src/tab-pauta.jsx",
  "./src/mares-phrases.jsx",
  "./src/tab-mares.jsx",
  "./src/mares-sheets.jsx",
  "./src/extras.jsx",
  "./src/app.jsx",
  "./vendor/react.development.js",
  "./vendor/react-dom.development.js",
  "./vendor/babel.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(LOCAL_ASSETS.map((u) => new Request(u, { cache: "reload" })));
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isLocal = url.origin === self.location.origin;

  // Our own app (navigations + same-origin HTML/JSX/manifest): network-first so
  // a new deploy shows up immediately. Cache is only a fallback for offline,
  // which is why a fresh push previously needed a manual cache clear to appear.
  if (req.mode === "navigate" || isLocal) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_VERSION);
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return (
            (await cache.match(req)) ||
            (await cache.match("./index.html")) ||
            (await cache.match("./")) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // Third-party CDN deps: pinned to versioned URLs, so cache-first is safe and
  // keeps the app fast/offline-capable.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === "opaque")) {
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        return cached || Response.error();
      }
    })()
  );
});
