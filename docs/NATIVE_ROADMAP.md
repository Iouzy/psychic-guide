# Native roadmap — fullscreen, Dynamic Island, Live Activities, TestFlight

Pauta today is a self-contained React PWA (Babel-in-browser, no build step)
wrapped for **Android only** via Capacitor (`@capacitor/android`). The features
below cannot run inside the WebView and were **not** built in the web tree —
they require native code compiled by platform toolchains. This document is the
build-ready plan for someone working on a **macOS machine with Xcode** (iOS) and
the **Android SDK** (Android).

## Why these can't ship from the web codebase

- A Capacitor app is a web page in `WKWebView`/`Android WebView`. JavaScript has
  **no API** to ActivityKit (Dynamic Island), Live Activities, foreground
  services, or OS-level fullscreen. Each needs a native module + a Capacitor
  plugin bridge.
- The repo has **no `ios/` project** — only Android is wired up. Adding iOS
  (`npx cap add ios`) requires **macOS + Xcode + CocoaPods**.
- Producing a `.ipa` / TestFlight build requires an Xcode archive **code-signed**
  with an Apple Developer certificate + provisioning profile, tied to a paid
  **Apple Developer Program** account ($99/yr), distributed through App Store
  Connect. None of this exists in a headless Linux CI container.

## The bridge contract (shared by both platforms)

The focus timer already lives in the store (`src/store.jsx`):

- `startBlock(title)` → session begins (`status: "active"`, a `sessions[]`
  segment with `startedAt`).
- `pauseActive()` → closes the open segment (`status: "paused"`).
- `resumeBlock(id)` → opens a new segment (`status: "active"`).
- `concludeActive(reflection)` → `status: "done"`.
- `activeBlock` → the currently running/paused block; elapsed time is the sum of
  its segment durations (`buildTimeline` / `blockFocusMs`).

Define **one** Capacitor plugin, `FocusActivity`, with a symmetric JS API so the
web layer drives the native surface and native actions call back into the store:

```ts
// JS → native
FocusActivity.start({ title, startedAt, elapsedMs })
FocusActivity.update({ elapsedMs, paused })   // throttle to ~1/sec or on state change
FocusActivity.stop()

// native → JS (via plugin listeners)
FocusActivity.addListener("action", ({ kind }) => {
  // kind: "pause" | "resume" | "conclude"
  if (kind === "pause")   store.pauseActive();
  if (kind === "resume")  store.resumeBlock(store.activeBlock.id);
  if (kind === "conclude") store.concludeActive("");
});
```

Wire these calls in `TabPauta` where `startBlock` / `pauseActive` /
`resumeBlock` / `concludeActive` are invoked. Because the bridge mirrors the
store, the timer survives the app being backgrounded — the source of truth is
`activeBlock`'s segment timestamps, so on resume the elapsed time is recomputed
from `startedAt`, never from a drifting in-JS counter.

## iOS — Dynamic Island + Live Activity (ActivityKit)

1. `npx cap add ios` (on macOS). Set the team/bundle id in Xcode.
2. Add a **Widget Extension** target; declare a Live Activity with
   `ActivityAttributes` carrying `{ title }` (static) and a `ContentState` of
   `{ elapsedMs, paused }` (dynamic).
3. Implement the Lock Screen / banner view and the **Dynamic Island** regions
   (compact + expanded) in SwiftUI. Put pause/resume/conclude as
   `Button(intent:)` using **App Intents** (`LiveActivityIntent`) so taps work
   without launching the app.
4. Write the native Capacitor plugin (`FocusActivityPlugin.swift`):
   - `start` → `Activity.request(attributes:contentState:)`
   - `update` → `activity.update(using:)`
   - `stop` → `activity.end(...)`
   - App Intents post a Darwin notification / use the plugin to emit the
     `"action"` event back to JS.
5. Requirements: iOS 16.1+ for Live Activities; iPhone 14 Pro+ for the physical
   Dynamic Island (the Live Activity still renders on the Lock Screen elsewhere).
   `Info.plist`: `NSSupportsLiveActivities = YES`.

## Android — persistent timer + notification actions

Android has no Dynamic Island; the equivalent is a **foreground Service** with an
ongoing notification (and, on Android 14+, a promoted ongoing/"Live Updates"
style notification).

1. `FocusActivityPlugin.kt`: `start` launches a `Service` with
   `startForeground(id, notification)`; the notification uses a chronometer
   (`setUsesChronometer(true)` / `setWhen(startedAt)`) so the timer ticks without
   per-second updates.
2. Add notification **action buttons** (Pause / Resume / Conclude) as
   `PendingIntent`s targeting a `BroadcastReceiver`; the receiver forwards to the
   plugin, which emits the `"action"` event to JS.
3. Permissions: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE` (or a
   typed service), and `POST_NOTIFICATIONS` (Android 13+, request at runtime).
4. `update`/`stop` mutate or cancel the notification.

## Fullscreen / immersive mode

- **Android:** a small plugin calling `WindowInsetsControllerCompat` to hide the
  system bars (immersive sticky), toggled from a Settings switch. The system
  clock/battery/Wi-Fi reappear on a swipe from the edge — that satisfies "leave
  only essential system info" while staying distraction-free.
- **iOS:** a real native app is already full-bleed; `prefersStatusBarHidden`
  controls the status bar. The web `Fullscreen API` is **not** an option — iOS
  Safari does not support `requestFullscreen` on non-video elements, which is why
  no web toggle was added.
- **PWA (today):** installing to the home screen already runs chrome-less in
  standalone mode; that's the closest the web build gets.

## Distribution — TestFlight / IPA

1. Apple Developer Program account; create an **App ID** + bundle id in the
   developer portal; register the app in **App Store Connect**.
2. In Xcode: set signing (automatic with the team, or manual cert +
   provisioning profile), bump version/build.
3. **Product → Archive → Distribute App → TestFlight & App Store Connect.**
   Internal testers get builds immediately; external testers after a light
   Beta App Review.
4. CI option: **Xcode Cloud** or GitHub Actions on a **macOS runner** with
   `fastlane` (`gym` to build the signed `.ipa`, `pilot` to upload to
   TestFlight). Signing assets via App Store Connect API key + `fastlane match`.
5. There is no supported way to install an arbitrary `.ipa` on a non-jailbroken
   iPhone outside TestFlight / the App Store (or an enterprise/ad-hoc profile
   limited to registered device UDIDs).
