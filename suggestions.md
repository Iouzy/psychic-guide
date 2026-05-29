# Suggestions — worthwhile follow-ups left out of this pass

Things I found worth doing but deliberately scoped out, each with a one-line
rationale. Ordered roughly by value.

## Offline / PWA
- **Vendor the Geist / Instrument Serif fonts locally.** `index.html` still
  loads them from `fonts.googleapis.com`, the one remaining network dependency
  in an otherwise zero-CDN, offline-first app. It works offline after the first
  online load (the service worker caches them cache-first) and falls back to
  system fonts, but truly offline-first would ship the `.woff2` files. *Left
  out:* adds binary assets + needs an SFL/OFL license check, bigger than a
  correctness pass.
- **Drop/relax the "Third-party CDN deps" branch in `service-worker.js`** once
  fonts are vendored — it would then only ever serve Google Fonts.

## Data / storage hygiene
- **Prune stale reminder flags.** `useReminders` writes `pauta.reminded.<kind>.<dayKey>`
  keys to `localStorage` and never deletes them, so they accumulate one-per-day
  forever. A tiny sweep (drop keys older than ~2 days) would stop the slow leak.
- **Backup file size guard.** `importData` reads the whole file into memory with
  no size cap. Not a real risk for a personal JSON backup, but a defensive
  `if (text.length > N) throw` would harden against accidentally importing a
  giant/wrong file.

## Accessibility
- **Focus-trap the onboarding overlay.** `OnboardingOverlay` is a full-screen
  overlay that doesn't use the shared `Sheet`, so it doesn't get the new
  `useFocusTrap`. It's full-screen (less critical) but Tab can still reach the
  swipe-hidden content behind it.
- **Formalize accent-on-surface contrast.** The seven accent swatches are used
  as text/border colour on `--paper`/`--surface-dark` in both themes; a quick
  WCAG contrast check (and nudging any that fail AA) would make the palette
  provably accessible rather than eyeballed.

## Testing
- **Component/interaction tests** (sheets open/close, swipe nav, timer ticking)
  would need a DOM environment (jsdom/@testing-library). *Left out:* keeps the
  zero-build, near-zero-dep ethos; the new Vitest suite covers the pure store
  layer where the real data-loss risk lives.

## Updates / distribution
- **In-app one-tap installer** (Android `PackageInstaller` + `REQUEST_INSTALL_PACKAGES`)
  remains the most "native" option if Play Store distribution isn't wanted: the
  app downloads the APK and launches the install directly (one system confirm),
  no browser round-trip.

## Misc
- **Update checker is the only outbound request in the web app** (`app.jsx`
  fetches the GitHub Releases API, native-only and user-initiated). It's not
  tracking, but worth a one-line note in the privacy docs for transparency.
