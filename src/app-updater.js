// Bridge from the PWA to the native AppUpdater Capacitor plugin.
// Lets the app install an update in-place (download the APK + hand it to the
// system package installer) instead of bouncing the user out to the browser.
// No-ops / reports "not native" in a plain browser or PWA, where there is no
// installer — callers fall back to opening the download URL there.
(function () {
  "use strict";

  function noopHandle() { return { remove: function () {} }; }

  var cap = (typeof Capacitor !== "undefined") ? Capacitor
          : (typeof window !== "undefined" ? window.Capacitor : null);
  var native = null;

  // Custom native plugins must be obtained via Capacitor.registerPlugin() (see
  // focus-activity.js for the full rationale); the legacy Plugins global isn't
  // populated for them without a bundler-side registration.
  try {
    if (cap && cap.isNativePlatform && cap.isNativePlatform()
        && typeof cap.registerPlugin === "function") {
      native = cap.registerPlugin("AppUpdater");
    }
  } catch (e) { native = null; }

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
    isNative:    !!native,
    canInstall:          function () { return native ? native.canInstall()          : Promise.resolve({ granted: false }); },
    openInstallSettings: function () { return native ? native.openInstallSettings() : Promise.resolve(); },
    downloadAndInstall:  function (o) { return native ? native.downloadAndInstall(o) : Promise.reject(new Error("not native")); },
    addListener: function (ev, cb) { return native ? native.addListener(ev, cb) : noopHandle(); },
  };
})();
