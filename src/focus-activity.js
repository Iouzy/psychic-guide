// Bridge from the PWA to the native FocusActivity Capacitor plugin.
// No-ops gracefully when running in a plain browser or when the native plugin
// is not present, so the web app works without any native build.
//
// CRITICAL — lazy resolution: the native plugin and the "are we native?" check
// are resolved ON EVERY CALL, never frozen at load. The previous version froze
// `isNative` in an IIFE the instant this script parsed; if Capacitor's bridge
// wasn't ready at that exact moment (timing varies by WebView/Android version),
// `isNative` stuck at false FOREVER. Inside the Capacitor WebView the web
// Notification API and service-worker notifications don't exist, so the native
// plugin is the ONLY notification channel — a false `isNative` meant the app
// wrongly reported "this device doesn't support notifications", never fired a
// reminder, and bounced app updates out to the browser. A live getter +
// per-call plugin lookup removes the timing race entirely.
(function () {
  "use strict";

  function noopHandle() { return { remove: function () {} }; }

  function getCap() {
    return (typeof Capacitor !== "undefined") ? Capacitor
         : (typeof window !== "undefined" ? window.Capacitor : null);
  }

  // Live check — re-evaluated on every read, never cached.
  function nativePlatform() {
    var cap = getCap();
    try { return !!(cap && cap.isNativePlatform && cap.isNativePlatform()); }
    catch (e) { return false; }
  }

  // Resolve (and cache once successful) the native plugin proxy. Capacitor 6:
  // a native-only custom plugin registered via registerPlugin() in MainActivity
  // must be obtained from JS with Capacitor.registerPlugin() — the legacy
  // `Capacitor.Plugins.FocusActivity` global isn't populated for custom plugins
  // without a bundler-side registration. We only cache after a real resolve, so
  // an early call (before the bridge is ready) doesn't poison later ones.
  var cached = null;
  function plugin() {
    if (cached) return cached;
    var cap = getCap();
    if (!cap || !nativePlatform()) return null;
    try {
      if (typeof cap.registerPlugin === "function") {
        cached = cap.registerPlugin("FocusActivity");
      } else if (cap.Plugins && cap.Plugins.FocusActivity) {
        cached = cap.Plugins.FocusActivity;
      }
    } catch (e) { cached = null; }
    return cached;
  }

  // FocusActivity.start({ title, startedAt, elapsedMs, targetMs, accent })
  //   Launches the foreground service and shows the ongoing notification.
  //   elapsedMs is the total accumulated focus time (all previous sessions
  //   for the same block), so the chronometer starts from the right offset.
  //   targetMs (optional, 0 = open-ended) makes the notification count DOWN to
  //   the Pomodoro target instead of up. accent (optional hex) tints the
  //   notification so it reads like the in-app focus control.
  //
  // FocusActivity.update({ elapsedMs, paused })
  //   Switches the notification between chronometer and static "Pausado" text.
  //
  // FocusActivity.stop()
  //   Stops the foreground service and removes the notification.
  //
  // FocusActivity.addListener("action", ({ kind }) => ...)
  //   kind: "pause" | "resume" | "conclude" — a notification button was tapped.
  //
  // FocusActivity.checkPermission() → Promise<{ granted }>
  //   Whether POST_NOTIFICATIONS is granted (always true pre-Android 13).
  //
  // FocusActivity.requestPermission() → Promise<{ granted }>
  //   Prompts for POST_NOTIFICATIONS. The system only shows the dialog once —
  //   after a hard denial the user must enable it in system Settings, so callers
  //   should guide there if the result is still false.
  //
  // FocusActivity.notify({ title, body, tag }) → Promise<{ shown }>
  //   Posts a one-shot local reminder on its own channel. This is the ONLY
  //   notification channel that works inside the Capacitor WebView. `tag`
  //   dedupes/replaces (habits vs reflection get stable, distinct ids).
  //
  // FocusActivity.scheduleReminders({ enabled, habitsTime, reflectionTime,
  //   habitsTitle, habitsBody, reflectionTitle, reflectionBody })
  //   → Promise<{ scheduled, exact }>  — daily AlarmManager reminders that fire
  //   even with the app fully CLOSED. Times are "HH:mm"; strings arrive
  //   already-localized. `exact` is false when the OS denied exact alarms.
  //
  // FocusActivity.cancelReminders() → Promise<{ scheduled:false }>

  window.FocusActivity = {
    get isNative() { return nativePlatform(); },
    start:       function (o) { var p = plugin(); if (p) p.start(o); },
    update:      function (o) { var p = plugin(); if (p) p.update(o); },
    stop:        function ()  { var p = plugin(); if (p) p.stop(); },
    notify:      function (o) { var p = plugin(); return p ? p.showReminder(o)      : Promise.resolve({ shown: false }); },
    scheduleReminders: function (o) { var p = plugin(); return p ? p.scheduleReminders(o) : Promise.resolve({ scheduled: false, exact: false }); },
    cancelReminders:   function ()  { var p = plugin(); return p ? p.cancelReminders()    : Promise.resolve({ scheduled: false }); },
    addListener: function (ev, cb) { var p = plugin(); return p ? p.addListener(ev, cb) : noopHandle(); },
    checkPermission:   function () { var p = plugin(); return p ? p.checkPermission()   : Promise.resolve({ granted: false }); },
    requestPermission: function () { var p = plugin(); return p ? p.requestPermission() : Promise.resolve({ granted: false }); },
  };
})();
