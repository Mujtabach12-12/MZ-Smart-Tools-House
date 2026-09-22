# MZ Smart Tool House — Requested Fixes Report

Date: 2026-09-22

## Implemented

- Document Scanner gallery/file selection no longer uses `capture="environment"`; choosing an image now invokes the normal system file picker instead of forcing the camera.
- Scanner interactive preview quality increased from 900px max side to 1400px and preview JPEG quality increased.
- After scan processing, the main accepted-page preview now uses the validated full-resolution `outputUrl`; 320px thumbnails remain only for the page manager.
- Added a full-resolution accepted-page preview with actual output dimensions and a clear note that thumbnails are navigation-only.
- Scanner PDF/image exports continue using the high-resolution `outputBlob` master from the Phase 3/4 quality architecture.
- PDF Compressor presets now show estimated saving ranges: High Quality 0–15%, Balanced 20–60%, Small File 40–80%. These are explicitly described as estimates, while the actual measured saved percentage is still shown after compression.
- Replaced the old video-based startup screen with a lightweight MZ tools-loader animation using the MZ logo, PDF/code/image/calculator tool chips, `Loading your tools…`, and `Developed by Muhammad Mujtaba`.
- Removed startup MP4/poster assets and removed them from service-worker precache.
- Shortened native Android splash handoff and disabled the Android splash animation so the branded tools-loader appears quickly.

## Tests run

Passed:
- `node test/user-requested-quality-fixes.test.mjs`
- `node test/scanner.test.mjs`
- `node test/phase4-reader-scanner.test.mjs` — 20/20
- `node test/pwa-audit.mjs`
- `node test/capacitor-audit.mjs` — 18 checks
- `node test/mobile-ui.test.mjs`
- `node test/bundle-check-global.mjs` — 201 modules checked, 307/307 tools wired, no syntax/import/export errors

Two existing unused calculator-module warnings remain (`cgpa.js`, `gpa.js`).

## Build status

`npm run build` was attempted but cannot run in this archive because `node_modules` is not installed. The dependency gate reports that Vite is not installed. Run `npm install`/`npm ci` on your development PC, then run `npm run build`.

## Important platform note

Removing the HTML `capture` attribute prevents the scanner's file-selection button from forcing the camera. On Android, the exact picker UI is controlled by the operating system; it normally opens the system file/Documents picker and may expose Files/Photos providers depending on the device.
