// Bridge from the PWA to the native AppUpdater Capacitor plugin.
// Lets the app install an update in-place (download the APK + hand it to the
// system package installer) instead of bouncing the user out to the browser.
// No-ops / reports "not native" in a plain browser or PWA, where there is no
// installer — callers fall back to opening the download URL there.
//
// Lazy resolution (see focus-activity.js for the full rationale): `isNative`
// and the plugin proxy are resolved on EVERY call, never frozen at load. A
// frozen-false `isNative` was why the in-app updater silently fell back to
// window.open(apkUrl) even inside the APK — sending users to the browser and
// the "package conflicts" install error instead of updating in place.
(function () {
  "use strict";

  function noopHandle() { return { remove: function () {} }; }

  function getCap() {
    return (typeof Capacitor !== "undefined") ? Capacitor
         : (typeof window !== "undefined" ? window.Capacitor : null);
  }

  function nativePlatform() {
    var cap = getCap();
    try { return !!(cap && cap.isNativePlatform && cap.isNativePlatform()); }
    catch (e) { return false; }
  }

  var cached = null;
  function plugin() {
    if (cached) return cached;
    var cap = getCap();
    if (!cap || !nativePlatform() || typeof cap.registerPlugin !== "function") return null;
    try { cached = cap.registerPlugin("AppUpdater"); } catch (e) { cached = null; }
    return cached;
  }

  // AppUpdater.canInstall() → Promise<{ granted }>
  //   Whether the app may install APKs ("install unknown apps" allowed; always
  //   true before Android 8).
  //
  // AppUpdater.openInstallSettings() → Promise<void>
  //   Opens the system "install unknown apps" toggle for this app.
  //
  // AppUpdater.downloadAndInstall({ url }) → Promise<{ status }>
  //   status "installing"       → APK downloaded, system installer launched.
  //   status "needs-permission" → sent the user to the install-unknown-apps
  //                               toggle; they should allow it and try again.
  //   Rejects on download failure.
  //
  // AppUpdater.addListener("downloadProgress", ({ percent }) => …)
  //   Fires with 0–100 while the APK downloads (when the size is known).

  window.AppUpdater = {
    get isNative() { return nativePlatform(); },
    canInstall:          function ()  { var p = plugin(); return p ? p.canInstall()          : Promise.resolve({ granted: false }); },
    openInstallSettings: function ()  { var p = plugin(); return p ? p.openInstallSettings() : Promise.resolve(); },
    downloadAndInstall:  function (o) { var p = plugin(); return p ? p.downloadAndInstall(o)  : Promise.reject(new Error("not native")); },
    addListener:         function (ev, cb) { var p = plugin(); return p ? p.addListener(ev, cb) : noopHandle(); },
  };
})();
