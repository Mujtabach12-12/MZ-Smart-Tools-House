# MZ Smart Tool House — Dictionary + Scanner Reliability Fix

Date: 2026-09-24

## Dictionary

Changed `src/services/dictionary.js`, `src/tools/reference/MzDictionary.jsx`, and `netlify/functions/dictionary.js`.

- Reduced per-provider timeout so one stalled source cannot consume the entire lookup.
- Free Dictionary API remains the rich primary source.
- Added a real Datamuse definition fallback before the MZ serverless gateway.
- Kept the MZ gateway as a third fallback.
- Added an absolute `mztoolshouse.com` gateway fallback for production Capacitor/localhost builds.
- Added CORS response headers to the read-only dictionary Netlify function.
- Added a bounded upstream timeout to the Netlify function.
- Removed the misleading generic “check your connection” wording for provider-side timeouts.
- Suggestion requests now also have a bounded timeout.

A mocked HTTP regression verified that when the primary provider returns HTTP 503, the second real provider returns and normalizes a definition successfully.

## Document Scanner

Changed `src/tools/scanner/SmartDocumentScanner.jsx`, `src/lib/scanner/qualityPipeline.js`, and `src/index.css`.

- Scanner now defaults to **Original** instead of automatic enhancement.
- New captured pages also default to Original with brightness/contrast/sharpen at zero.
- Live camera stream changed from an unnecessary 4K/30 request to a smoother 1080p-class preview target with an upper bound, while `ImageCapture.takePhoto()` remains the preferred full-resolution still capture path.
- Added a real camera-ready state so the shutter is disabled until the stream is usable.
- Added document-detail content hint and optional continuous-focus request when the device exposes it.
- Did not force exposure/brightness constraints.
- Camera preview now uses `object-fit: contain` so the full stream is visible rather than being cropped by `cover`.
- Rebuilt the camera workspace with a clearer top bar, corner guide, readiness state, large shutter, files shortcut, flash/switch controls, and “no filter applied” status.
- The Enhanced filter remains available but its automatic brightness/contrast correction is now deliberately gentler.
- Document preset brightness lift was reduced to avoid washed-out pages.
- Phase 3 master/preview/output separation is preserved; export still uses the high-quality processed master rather than the camera preview.

## Tests actually run

Passed:

- `test/dictionary-scanner-reliability.test.mjs`
- `test/scanner.test.mjs`
- `test/phase4-reader-scanner.test.mjs` — 20/20
- `test/office-platform.test.mjs`
- `test/quality-architecture.test.mjs` — 20/20
- `test/mobile-ui.test.mjs`
- `test/no-fake-features.test.mjs`
- `test/final-platform.test.mjs`
- `test/pwa-audit.mjs`
- Mocked dictionary provider failover/normalization test

## Build status

`npm run build` was attempted in the provided project copy but could not start Vite because `node_modules` is not included in the uploaded archive:

`DEPENDENCY ERROR: vite is not installed. Run repair-and-run.cmd or npm ci.`

This is an environment/dependency block, not a successful build claim.

## Remaining verification

- Real production dictionary calls on `mztoolshouse.com` still need one live-device check after deployment.
- Camera smoothness, autofocus, exposure behavior, and image sharpness still need physical Android-device testing because this environment has no phone camera/browser hardware access.
- Native camera auto-exposure/white-balance behavior is device-controlled; MZ now avoids adding its own automatic filter by default.
