# MZ Smart Tool House — Zoom / Viewport Fix

Date: 2026-09-23

## Problem observed
Two screenshots showed the same desktop page at browser zoom 33% and 100%. At 33% the application appeared proportionate; at 100% the page content was abnormally oversized and the hero no longer fit the desktop viewport correctly.

## Code-level causes addressed
- The application contained a second app-level scale layer on `#root` using CSS `zoom` and width compensation (`--mz-ui-scale`). This could combine with browser/WebView scaling instead of letting responsive CSS be the single layout authority.
- Root font sizing was not explicitly normalized, so rem-based layout could be affected by browser/WebView text sizing preferences.
- Android/WebView text auto-adjustment was not explicitly normalized.
- A Settings-level interface scale could restore a non-native scale.
- Desktop hero grid children did not have an explicit `min-width: 0` shrink safeguard.

## Fixes
- Removed app-wide CSS `zoom` and inverse-width compensation.
- Removed the custom interface-scale control from Settings.
- Removed/restored no custom scale during first paint and clear legacy scale keys.
- Normalized root font size to 16px.
- Added `-webkit-text-size-adjust: 100%` and `text-size-adjust: 100%` for browser/WebView consistency.
- Added hero grid shrink protection.
- Bounded desktop hero heading size using a responsive clamp.
- Kept the existing viewport meta tag and responsive breakpoints.
- Did not disable native pinch/browser zoom, preserving accessibility.

## Verification actually run
PASS: viewport-normalization.test.mjs
PASS: global-ux-enhancements.test.mjs
PASS: dashboard-polish.test.mjs
PASS: mobile-ui.test.mjs
PASS: quality-architecture.test.mjs (20/20)
PASS: phase4-reader-scanner.test.mjs (20/20)
PASS: pwa-audit.mjs
PASS: capacitor-audit.mjs
PASS: tool-registry-audit.mjs (307 active tools wired)
PASS: bundle-check-global.mjs — 205 modules checked, no syntax/unresolved import/missing export errors. Two pre-existing unused calculator module warnings remain.

## Build status
`npm run build` was attempted but could not start because the uploaded project does not include installed dependencies (`vite is not installed`). This is a dependency-environment block, not a claimed successful production build.

## User-side validation after replacing files
1. Run `npm install`.
2. Run `npm run dev`.
3. In Chrome, set native page zoom to 100%.
4. Hard refresh with Ctrl+Shift+R.
5. Verify desktop at 100% and the installed app/WebView.
