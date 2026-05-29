// Bridge from the PWA to the native FocusActivity Capacitor plugin.
// No-ops gracefully when running in a plain browser or when the native plugin
// is not present, so the web app works without any native build.
(function () {
  "use strict";

  function noopHandle() { return { remove: function () {} }; }

  var cap = (typeof Capacitor !== "undefined") ? Capacitor
          : (typeof window !== "undefined" ? window.Capacitor : null);
  var native = null;

  // Capacitor 6: a native-only custom plugin (registered via registerPlugin()
  // in MainActivity) must be obtained from JS with Capacitor.registerPlugin().
  // The previous code used the legacy `Capacitor.Plugins.FocusActivity` global
  // gated by isPluginAvailable() — but that global is NOT populated for custom
  // plugins without a bundler-side registration, so `native` was always null
  // and every call silently no-opped (no notification ever, the in-app toggle
  // stuck "off"). registerPlugin() returns a working proxy regardless.
  try {
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      if (typeof cap.registerPlugin === "function") {
        native = cap.registerPlugin("FocusActivity");
      } else if (cap.Plugins && cap.Plugins.FocusActivity) {
        native = cap.Plugins.FocusActivity;
      }
    }
  } catch (e) { native = null; }

  // FocusActivity.start({ title, startedAt, elapsedMs, targetMs, accent })
  //   Launches the foreground service and shows the ongoing notification.
  //   elapsedMs is the total accumulated focus time (all previous sessions
  //   for the same block), so the chronometer starts from the right offset.
  //   targetMs (optional, 0 = open-ended) makes the notification count DOWN to
  //   the Pomodoro target instead of up. accent (optional hex) tints the
  //   notification so it reads like the in-app focus control.
  //
  // FocusActivity.update({ elapsedMs, paused })
  //   Called when the block is paused/resumed to switch the notification
  //   between chronometer mode and static "Pausado" text.
  //
  // FocusActivity.stop()
  //   Stops the foreground service and removes the notification.
  //
  // FocusActivity.addListener("action", ({ kind }) => ...)
  //   kind: "pause" | "resume" | "conclude"
  //   Fires when the user taps a notification action button.
  //
  // FocusActivity.checkPermission() → Promise<{ granted }>
  //   Whether POST_NOTIFICATIONS is currently granted (always true pre-Android 13).
  //
  // FocusActivity.requestPermission() → Promise<{ granted }>
  //   Prompts for POST_NOTIFICATIONS. No-ops if already granted; on Android the
  //   system only shows the dialog once — after a hard denial the user must
  //   enable it in system Settings, so callers should guide there if still false.
  //
  // FocusActivity.notify({ title, body, tag }) → Promise<{ shown }>
  //   Posts a one-shot local reminder notification on its own channel (separate
  //   from the ongoing focus-timer one). This is the ONLY notification channel
  //   that works inside the Capacitor WebView — the web Notification API and
  //   service-worker notifications are unavailable there, so without this the
  //   reminder toggle did nothing on the native app. `tag` dedupes/replaces
  //   (habits vs reflection get stable, distinct notifications).
  //
  // FocusActivity.scheduleReminders({ enabled, habitsTime, reflectionTime,
  //                                   habitsTitle, habitsBody,
  //                                   reflectionTitle, reflectionBody })
  //                                   → Promise<{ scheduled, exact }>
  //   Schedules the daily habit/reflection reminders via native AlarmManager so
  //   they fire even when the app is fully CLOSED (the JS reminder loop only runs
  //   while the page is open). Times are "HH:mm"; the title/body strings are
  //   passed already-localized (translation stays in the JS i18n layer). `exact`
  //   is false when the OS denied exact alarms (Android 12+) → inexact fallback.
  //
  // FocusActivity.cancelReminders() → Promise<{ scheduled:false }>
  //   Cancels any scheduled background reminders.

  window.FocusActivity = {
    isNative:    !!native,
    start:       function (o) { if (native) native.start(o); },
    update:      function (o) { if (native) native.update(o); },
    stop:        function ()  { if (native) native.stop(); },
    notify:      function (o) { return native ? native.showReminder(o) : Promise.resolve({ shown: false }); },
    scheduleReminders: function (o) { return native ? native.scheduleReminders(o) : Promise.resolve({ scheduled: false, exact: false }); },
    cancelReminders:   function ()  { return native ? native.cancelReminders()    : Promise.resolve({ scheduled: false }); },
    addListener: function (ev, cb) { return native ? native.addListener(ev, cb) : noopHandle(); },
    checkPermission:   function () { return native ? native.checkPermission()   : Promise.resolve({ granted: false }); },
    requestPermission: function () { return native ? native.requestPermission() : Promise.resolve({ granted: false }); },
  };
})();
