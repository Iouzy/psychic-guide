# Pauta

> Intenções, blocos de foco e hábitos — a sua pauta diária.

**Pauta** is an offline-first daily-planning app: set your intentions for the
day, run focus blocks with a built-in timer, and keep honest habit streaks. It
runs as an installable Progressive Web App (PWA) and ships as a self-contained
native **Android** build via [Capacitor](https://capacitorjs.com/).

The interface is in Portuguese (pt-PT / pt-BR). Everything is stored locally on
your device — there is no account, no server, and no network dependency.

---

## Table of contents

- [Highlights](#highlights)
- [The three tabs](#the-three-tabs)
- [Data, privacy & backup](#data-privacy--backup)
- [Settings & extras](#settings--extras)
- [Architecture](#architecture)
- [Project layout](#project-layout)
- [Getting started](#getting-started)
  - [Run the web app locally](#run-the-web-app-locally)
  - [Build the web bundle](#build-the-web-bundle)
  - [Build the Android app](#build-the-android-app)
- [Continuous integration](#continuous-integration)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Browser & platform support](#browser--platform-support)
- [License](#license)

---

## Highlights

- **Fully offline & self-contained.** React, ReactDOM and Babel are vendored
  locally — no CDN, no analytics, no backend. The service worker precaches the
  app shell so it works with zero connectivity.
- **Installable PWA.** Add it to your home screen on Android or iOS, or install
  the generated `.apk` directly.
- **Native Android build.** Capacitor wraps the web app into an installable
  Android package; a GitHub Actions workflow builds the APK on every push.
- **Local-only data.** All state lives in `localStorage`. Export and import a
  full JSON backup whenever you like.
- **Light & dark themes.** Auto-follows the OS, or pick a fixed theme. A warm
  "paper & ink" design system with a configurable accent colour.
- **Local reminders.** Optional notifications for pending habits and the nightly
  reflection (delivered while the app is open — no push server).

---

## The three tabs

Pauta is organised into three tabs, navigable by tap, swipe, or keyboard.

### 1. Hoje (Today)
Your day at a glance. Capture the day's **intentions**, check them off, and close
the day with a **nightly reflection**. Intentions can be promoted straight into a
focus block on the Pauta tab.

### 2. Pauta (Focus blocks)
A focus timer with a full block lifecycle. Start a block (optionally tied to an
intention or project), pause and resume it, jot session notes, and conclude it.
Completed and in-progress blocks appear on a filterable timeline, each block
tracking its individual work sessions and elapsed time.

### 3. Marés (Habits / "Tides")
A habit tracker built around a maritime metaphor. Habits are tracked on a
month-by-month calendar with:

- **Streak tiers** that grow with consistency — from *Onda* (wave) up to *Oceano*
  (ocean).
- **Respiros** ("breaths") — honest, guilt-free breaks that don't shatter a streak.
- **Flexible recurrence** — permanent habits, fixed-period habits, or single-month
  habits.
- **Heatmaps & trends** — a per-habit detail view plus a 12-month "wave" trend.

---

## Data, privacy & backup

- **Storage:** everything persists in the browser's `localStorage` under the key
  `pauta.v4`. Nothing leaves your device.
- **No tracking:** there are no analytics, telemetry, or third-party requests.
- **Backup:** *Definições → Backup → Exportar dados* downloads a `.json` file with
  all of your data. *Importar dados* restores from that file (replacing current
  data after a confirmation prompt).
- **Reset:** *Recarregar exemplo* repopulates demo data; *Apagar tudo* permanently
  clears everything.

---

## Settings & extras

Open **Definições** from the status-bar menu. It includes:

- **Análise** — *Revisão semanal* (a 7-day review of focus, habits and patterns,
  including best-hour and correlation insights) and a guide to how the Marés tiers
  work.
- **Preferências** — theme (Auto / Claro / Escuro) and haptic feedback.
- **Lembretes** — enable local notifications and set times for pending-habit and
  nightly-reflection reminders.
- **Backup** — export / import JSON.
- **Instalar** — install prompt (Android) or platform-specific instructions (iOS).
- **Aplicação** — reseed demo data or wipe everything.

A built-in **Tweaks panel** exposes accent colour, timer visibility and layout
density for quick experimentation, and a one-time **onboarding** overlay greets
first-time users.

---

## Architecture

Pauta deliberately avoids a JavaScript build step for application code. JSX is
transpiled **in the browser** by Babel Standalone, and React is loaded from
vendored files. This keeps the project dependency-light and trivially portable —
the same files run as a plain website, a PWA, and inside the Android WebView.

- **UI:** React (function components + hooks), styled with inline styles and CSS
  custom properties (the design tokens defined in `index.html`).
- **State:** a hand-rolled store (`src/store.jsx`, schema `pauta.v4`) backed by
  `localStorage`.
- **Offline:** `service-worker.js` precaches the app shell (`CACHE_VERSION` is
  bumped whenever precached assets change).
- **Packaging:** `scripts/build-web.mjs` copies `index.html`, `manifest.json`,
  `icons/`, `src/` and `vendor/` into `www/`, which Capacitor bundles into the
  native app (`webDir: "www"`, `appId: "com.pauta.app"`).

---

## Project layout

```
.
├── index.html              App shell, design tokens, script loading, PWA + SW bootstrap
├── manifest.json           PWA manifest
├── service-worker.js       Offline app-shell cache
├── capacitor.config.json   Capacitor config (appId, appName, webDir)
├── package.json            Scripts and Capacitor dependencies
├── debug.keystore          Stable debug signing key (so app updates keep data)
├── icons/                  App / PWA icons
├── vendor/                 Local React, ReactDOM and Babel (no CDN)
├── scripts/
│   └── build-web.mjs       Assembles the web bundle into ./www
├── tools/
│   └── gen-icons.mjs       Icon generation helper
├── src/
│   ├── app.jsx             App root: tabs, settings sheet, shortcuts, swipe nav
│   ├── store.jsx           localStorage-backed state store (v4)
│   ├── ui-primitives.jsx   Shared primitives (Sheet, TabBar, icons, inputs…)
│   ├── sub-components.jsx   Block cards, timeline, filter chips, sheets
│   ├── sheets.jsx          Bottom-modal sheets (start / pause / conclude…)
│   ├── tab-hoje.jsx        "Hoje" tab — intentions + reflection
│   ├── tab-pauta.jsx       "Pauta" tab — active block + timeline
│   ├── tab-mares.jsx       "Marés" tab — habit tracker
│   ├── mares-phrases.jsx   Maritime-metaphor phrase library
│   ├── mares-sheets.jsx    Marés trend + habit-detail sheets
│   ├── extras.jsx          Onboarding, insights, tier guide, reminders, haptics
│   └── tweaks-panel.jsx    Reusable tweaks shell + form controls
└── .github/workflows/
    └── android.yml         CI: build APK and publish a rolling "latest" release
```

---

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 20+. Building the Android app
additionally requires a JDK 17 and the Android SDK (handled automatically in CI).

```bash
npm install
```

### Run the web app locally

Because everything is static and self-contained, any static file server works.
For example:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the served URL (e.g. `http://localhost:8000`). The app transpiles its
JSX in the browser, so no build step is required for development.

### Build the web bundle

Assemble the deployable bundle into `./www`:

```bash
npm run build:web
```

This is also what you deploy to any static host (GitHub Pages, Netlify, etc.).

### Build the Android app

Assemble the web bundle and sync it into the Android project:

```bash
npm run sync          # runs build:web, then `npx cap sync android`
npx cap add android   # first time only, to create the android/ project
```

From there, open `android/` in Android Studio or build from the command line
(`cd android && ./gradlew assembleDebug`). The `android/`, `www/` and `*.apk`
artifacts are git-ignored.

---

## Continuous integration

`.github/workflows/android.yml` builds an installable `.apk` on every push (and
on manual dispatch) and publishes it to a rolling **`latest`** GitHub Release, so
you never need a local Android toolchain. The committed `debug.keystore` keeps the
signing key stable across builds, so reinstalling an update preserves your data.

---

## Keyboard shortcuts

When the app is focused (and you're not typing in a field):

| Key | Action            |
|-----|-------------------|
| `1` | Hoje tab          |
| `2` | Pauta tab         |
| `3` | Marés tab         |
| `g` | Open Definições   |
| `i` | Open Revisão semanal (insights) |
| `?` | Open the Marés tier guide |

On mobile, swipe left/right to move between tabs.

---

## Browser & platform support

Targets modern evergreen browsers (Chromium, Firefox, Safari) and Android
WebView. PWA install is available on Chromium-based browsers and via *Add to Home
Screen* on iOS Safari. Local notifications and haptics degrade gracefully where
unsupported.

---

## License

This project is licensed under
[Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).

You are free to use, share, and adapt the work **for non-commercial purposes**,
with attribution. **Commercial use is not permitted.**
