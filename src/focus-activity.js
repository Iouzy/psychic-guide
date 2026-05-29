// Bridge from the PWA to the native FocusActivity Capacitor plugin.
// No-ops gracefully when running in a plain browser or when the native plugin
// is not present, so the web app works without any native build.
(function () {
  "use strict";

  function noopHandle() { return { remove: function () {} }; }

  var cap = typeof Capacitor !== "undefined" ? Capacitor : null;
  var native = null;

  if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
    var available = cap.isPluginAvailable ? cap.isPluginAvailable("FocusActivity") : !!(cap.Plugins && cap.Plugins.FocusActivity);
    if (available) native = cap.Plugins.FocusActivity;
  }

  // FocusActivity.start({ title, startedAt, elapsedMs })
  //   Launches the foreground service and shows the ongoing notification.
  //   elapsedMs is the total accumulated focus time (all previous sessions
  //   for the same block), so the chronometer starts from the right offset.
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

  window.FocusActivity = {
    isNative:    !!native,
    start:       function (o) { if (native) native.start(o); },
    update:      function (o) { if (native) native.update(o); },
    stop:        function ()  { if (native) native.stop(); },
    addListener: function (ev, cb) { return native ? native.addListener(ev, cb) : noopHandle(); },
    checkPermission:   function () { return native ? native.checkPermission()   : Promise.resolve({ granted: false }); },
    requestPermission: function () { return native ? native.requestPermission() : Promise.resolve({ granted: false }); },
  };
})();
