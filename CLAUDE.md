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

The native Android layer is Kotlin in `native/android/`: a foreground-service
focus-timer plugin (`FocusActivityPlugin`, `FocusService`,
`FocusActionReceiver`, `MainActivity`) and an in-app updater plugin
(`AppUpdaterPlugin`, which downloads the release APK and launches the system
package installer — no browser). It is **not** part of a checked-in Android
project — `scripts/inject-native.mjs` copies it into the `android/` project that
Capacitor generates, patches `AndroidManifest.xml` (permissions + the updater
FileProvider), and bumps the version. The JS↔native bridges are
`src/focus-activity.js` and `src/app-updater.js`, which both no-op cleanly in a
plain browser.

## Commands

```bash
npm install                 # install Capacitor CLI/deps + the Vitest dev dep

npm run build:web           # assemble web assets into ./www (the Capacitor webDir)
npm run inject:native       # patch the generated android/ project with native Kotlin
npm run sync                # build:web + npx cap sync android

npm run check               # full gate: check:jsx + check:i18n + test:cadence + vitest
npm run check:jsx           # transpile every src/*.jsx with vendored Babel — RUN BEFORE COMMITTING
npm run check:i18n          # report PT strings used via tr()/trf() with no English translation
npm test                    # Vitest: store logic, schema/migration, backup round-trip + hardening
npm run test:cadence        # smoke-test the date/cadence math in store.jsx
node tools/gen-icons.mjs    # regenerate app icons
```

`npm run check` is the lint/test gate — run it before committing. `check:jsx`
catches the syntax errors that would otherwise silently break the in-browser
app; `check:i18n` catches untranslated UI; the Vitest suite (`tests/`) loads the
real `store.jsx` in a sandbox (via vendored Babel, like `test-cadence.mjs`) and
covers the schema, the v4 migration and the backup export→import round-trip.
Run `test:cadence` after touching date math or the habit/cadence helpers.

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
the Android platform, injects the native plugin, and builds a debug APK (signed
with the committed `debug.keystore` so updates preserve user data). The in-app
update checker (`app.jsx`) compares the build stamp injected by `build-web.mjs`
against the rolling `latest` GitHub Release.

**Only `main` publishes that release.** The publish step is gated on
`github.ref == 'refs/heads/main'`, so feature-branch pushes still run the
`check` gate and build/upload the APK *artifact* (handy for validation) but
never overwrite the `latest` release the app updates from. This matters because
the `versionCode` is a reset-proof epoch value: without the gate, a push to any
branch would look "newer" and could silently downgrade installed users to a
build missing other branches' work. **Work on a branch, open a PR, and merge to
`main` to actually ship to devices** — pushing to a branch alone never reaches
the release.

> Before adding commits toward an existing PR, confirm it's still open (e.g.
> `pull_request_read`). A merged PR's branch still accepts pushes and CI still
> builds from it, but those commits land in no open PR — branch off fresh `main`
> and open a new PR instead.

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
</content>
</invoke>
