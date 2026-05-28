# CLAUDE.md

Guidance for working in this repository. Read this before making changes — the
architecture is deliberately unusual and several conventions are easy to break.

## What this is

**Pauta** is a private, offline-first daily-planning app: write intentions, run
focus blocks, and track habits. No account, no server, no tracking — all data
lives in `localStorage`. It ships three ways from one codebase:

- a **PWA** (installable on Android/iOS, works offline),
- a **native Android app** via Capacitor (`com.pauta.app`),
- a static web page.

Three tabs map to the data model:

| Tab     | Portuguese | Meaning                                              |
|---------|------------|------------------------------------------------------|
| `hoje`  | Hoje       | Today's intentions + nightly reflection              |
| `pauta` | Pauta      | Focus blocks with a start/pause/resume/conclude timer|
| `mares` | Marés      | Habits ("tides") with daily/weekly/monthly cadence   |

## Architecture — read this first

**There is no build step and no bundler.** React, ReactDOM, and Babel are
vendored in `vendor/` and run **in the browser** at page load. Source files are
loaded as `<script type="text/babel" src="src/*.jsx">` and transpiled on the
fly. This keeps the app fully self-contained and offline (zero CDN/network
deps). Consequences that matter:

- **No ESM `import` / `export` in `src/*.jsx`.** Adding them breaks the app.
- **All `.jsx` files share one global scope.** Cross-file values are shared by
  declaring top-level functions and explicitly exposing them via
  `Object.assign(window, { ... })` at the bottom of the file (see `store.jsx`,
  `ui-primitives.jsx`, etc.). To use something from another file, just
  reference it as a global.
- **Script load order in `index.html` is significant.** Vendored React/ReactDOM/
  Babel load first, then the plain-JS `focus-activity.js`, then the `.jsx` files
  in dependency order: `i18n.jsx` (so `tr`/`trf` exist globally) → `tweaks-panel.jsx`
  → `store.jsx` → primitives (`ui-primitives.jsx`, `sub-components.jsx`) → `sheets.jsx`
  → tabs and their helpers → `extras.jsx` → `app.jsx` **last** (it calls
  `ReactDOM.createRoot(...).render(<App/>)`). When you add a file, slot its
  `<script>` after everything it references.
- **A JSX syntax error fails silently in the browser** (the whole app stops
  rendering). Always run the JSX check before committing — see below.

The native Android layer is Kotlin in `native/android/` (a foreground-service
focus-timer plugin: `FocusActivityPlugin`, `FocusService`,
`FocusActionReceiver`, `MainActivity`). It is **not** part of a checked-in
Android project — `scripts/inject-native.mjs` copies it into the `android/`
project that Capacitor generates, patches `AndroidManifest.xml`, and bumps the
version. The JS↔native bridge is `src/focus-activity.js`, which no-ops cleanly
in a plain browser.

## Commands

```bash
npm install                 # install Capacitor CLI/deps

npm run build:web           # assemble web assets into ./www (the Capacitor webDir)
npm run inject:native       # patch the generated android/ project with native Kotlin
npm run sync                # build:web + npx cap sync android

node tools/check-jsx.mjs    # transpile every src/*.jsx with vendored Babel — RUN BEFORE COMMITTING
node tools/test-cadence.mjs # smoke-test the date/cadence math in store.jsx (no test runner exists)
node tools/gen-icons.mjs    # regenerate app icons
```

`tools/check-jsx.mjs` is the closest thing to a lint/test gate — it catches the
syntax errors that would otherwise silently break the in-browser app. Run it
after editing any `.jsx`. Run `test-cadence.mjs` after touching date math or the
habit/cadence helpers in `store.jsx`.

To preview locally, serve the repo root over HTTP (e.g. `npx serve`) and open
`index.html` — opening via `file://` breaks the service worker and `text/babel`
fetches.

**Generated, gitignored — never edit by hand:** `www/`, `android/`,
`node_modules/`, `resources/` (except the versioned `resources/icon.png`).

## Conventions

- **No TypeScript.** Plain JSX, React function components + hooks. Hooks are
  pulled off the global `React` (`const { useState, ... } = React;`).
- **i18n: Portuguese (pt-PT) is the source language.** Write every user-facing
  string in Portuguese and wrap it in `tr("...")`, or `trf("... {n} ...", { n })`
  for interpolation. The Portuguese string *is* the lookup key; add the English
  value to the `I18N_EN` dictionary in `src/i18n.jsx`. Missing keys fall back to
  the Portuguese text, so untranslated strings degrade gracefully.
- **Styling is inline styles + CSS custom properties.** No CSS framework. Design
  tokens (`--paper`, `--ink`, `--accent`, fonts, etc.) live in the `:root` and
  `html[data-theme="dark"]` blocks of `index.html`. Theme is applied before
  React paints to avoid a flash; accent color is a live tweakable.
- **State lives in one place:** the `useStore()` hook in `store.jsx`, persisted
  to `localStorage` under `pauta.v4`. It returns immutable action methods
  (`startBlock`, `pauseActive`, `toggleHabitToday`, `addIntention`,
  `exportData`/`importData`, etc.). Treat state as immutable; never mutate.
- **Globals on `window`:** UI components (`Icon`, `Sheet`, `TabBar`, tab
  components…), date/format helpers (`fmtDuration`, `dayKeyOf`, `addDaysToKey`…),
  and `haptic()`. Check existing `Object.assign(window, …)` blocks before adding.
- **Comments are bilingual** (PT/EN) and explain *why*; match the surrounding
  density and tone when adding code.

## Adding a new source file

1. Create `src/your-file.jsx`.
2. Add `<script type="text/babel" src="src/your-file.jsx"></script>` to
   `index.html` **in dependency order** (after anything it relies on, before
   anything that relies on it; always before `src/app.jsx`).
3. Expose anything other files need via `Object.assign(window, { ... })` at the
   bottom of the file.
4. Run `node tools/check-jsx.mjs`.
5. `scripts/build-web.mjs` copies the whole `src/` dir, so no build-list edit is
   needed there.

## CI / releases

`.github/workflows/android.yml` runs on every push: builds the web bundle, adds
the Android platform, injects the native plugin, builds a debug APK (signed with
the committed `debug.keystore` so updates preserve user data), and publishes it
to a rolling `latest` GitHub Release. The in-app update checker (`app.jsx`)
compares the build stamp injected by `build-web.mjs` against that release.

## Pointers

- `src/store.jsx` — `useStore()`, persistence (`localStorage` key `pauta.v4`),
  all date/cadence/stat math, backup/export/import.
- `src/app.jsx` — root `App`, tab navigation, settings sheet, update checker.
- `src/tab-hoje.jsx` / `tab-pauta.jsx` / `tab-mares.jsx` — the three tabs.
- `src/i18n.jsx` — `tr`/`trf` + the English dictionary (`I18N_EN`).
- `src/ui-primitives.jsx` — shared atoms: `Icon`, `Sheet`, `TabBar`, `Button`,
  `AutoTextarea`, `useDragReorder`, etc.
- `src/sub-components.jsx` — focus-block UI: `ActiveBlockCard`, `PausedBlockCard`,
  `FilterChips`, `Timeline`.
- `src/sheets.jsx` — bottom-modal sheets for the Pauta tab (start/pause/conclude/switch).
- `src/tweaks-panel.jsx` — the live "Tweaks" panel shell + form controls, plus the
  host-protocol message handlers.
- `src/mares-phrases.jsx` — the Portuguese phrase library + small atoms for the
  Marés maritime metaphor (`pickPhrase`, etc.).
- `src/mares-sheets.jsx` — Marés sheets: `TrendSheet` (12-month wave),
  `HabitDetailSheet`, `WaveChart`, `HeatmapAllTime`.
- `src/extras.jsx` — onboarding, weekly insights, quarterly goals, reminders,
  `haptic()`, and the native focus-activity hook.
- `src/focus-activity.js` — plain-JS JS↔native bridge; no-ops in a plain browser.
- `docs/NATIVE_ROADMAP.md` — why iOS/Dynamic Island/Live Activities aren't in
  the web tree and what building them would take.
- `README.md` — user-facing docs (EN + PT) and developer guide.

> Note: `src/a299bb75-274c-46b1-b62c-8b3dea6000b7.jsx` is an unreferenced,
> byte-for-byte copy of `vendor/react.development.js` (loaded by no `<script>`),
> yet `build-web.mjs` still ships it into `www/` and `check-jsx.mjs` lints it.
> It's safe to delete.
</content>
</invoke>
