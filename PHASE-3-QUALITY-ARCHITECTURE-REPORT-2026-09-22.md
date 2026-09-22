# MZ Smart Tool House — Phase 3 Quality Architecture Report

Date: 2026-09-22

## Status

Phase 3 core architecture has been implemented in the supplied source tree. No
site-wide redesign or mass tool migration was performed. Source-level and
framework-independent quality regression suites pass. A full Vite production
build and dependency-backed pixel/PDF integration tests could **not** be run in
this execution environment because the supplied ZIP does not contain
`node_modules` and the local npm cache is incomplete. For that reason this
report does not claim that all browser/device quality issues are production-
verified yet.

## 1. Previous image-quality causes

- Multiple Canvas operations could cause avoidable resampling; rotation used a
  resized/cropped intermediate canvas and then a second transformed canvas.
- Lossy formats are re-encoded by Canvas, so repeated tool-to-tool processing
  can accumulate JPEG/WebP loss.
- File/preview/output lifecycle was not represented by a shared immutable model,
  making it easier for individual tools to accidentally treat a derivative as
  the next source.
- Several tool implementations own independent Canvas logic. Not all have been
  migrated yet.

Phase 3 changes the shared image path to draw directly into the final operation
canvas, returns the original file for a no-op rotate, validates encoded output,
and introduces an immutable original/preview/working/output file lifecycle.

## 2. Previous PDF-blur causes

- `PdfViewer.jsx` sized the canvas backing store to the CSS viewport and ignored
  `devicePixelRatio`, producing visibly soft pages on DPR 2/3 mobile screens.
- The viewer defaulted to 115% rather than fitting mobile width.
- PDF thumbnails were eagerly generated and the rendering architecture did not
  centralize render-resolution/pixel-budget policy.
- `PdfEditor.jsx` still has a legacy 1.25x raster-preview path that can be CSS-
  enlarged; it is intentionally listed as a remaining migration rather than
  being redesigned in Phase 3.
- PDF raster exports used implicit scale values rather than explicit DPI.
- The searchable-PDF utility rebuilt pages from rendered PNGs even though only
  OCR recognition required rasterization.

Phase 3 adds DPR-aware PDF.js rendering, memory-aware backing-canvas limits,
lazy thumbnails, fit-width opening, explicit raster-export DPI, and changes the
searchable-PDF path to retain the original PDF pages while OCR uses a temporary
render only for recognition.

## 3. Previous scanner-quality causes

- Uploaded/captured images were reduced to an 1800px master early in the flow.
- Perspective output was capped around 1800 x 2400.
- Crop/filter/rotate stages generated repeated JPEG derivatives.
- Perspective mapping used rounded source coordinates (nearest-neighbour-like
  sampling), which damages small text and edges.
- Camera capture preferred a video frame around 1920px-class constraints rather
  than attempting a high-resolution still.
- Large page/history data used base64 strings, increasing memory pressure.

Phase 3 preserves the uploaded/captured Blob as the master, uses reduced proxies
only for detection/live preview, maps normalized corners back to the full master,
uses bilinear perspective sampling, stores processed page masters as PNG, tries
`ImageCapture.takePhoto()` first, requests higher camera constraints, and uses
Blob/object URLs instead of base64 page masters.

## 4. Files/components changed

New shared modules:

- `src/lib/files/fileAsset.js`
- `src/lib/files/signatures.js`
- `src/lib/files/outputValidation.js`
- `src/lib/files/format.js`
- `src/lib/pdf/rendering.js`
- `src/lib/scanner/qualityPipeline.js`
- `test/quality-architecture.test.mjs`
- `docs/QUALITY-ARCHITECTURE.md`

Modified architecture/representative tools:

- `src/lib/download.js`
- `src/lib/image/canvas.js`
- `src/lib/image/core.js`
- `src/lib/image/process.js`
- `src/lib/pdf/core.js`
- `src/lib/pdf/pdfToImages.js`
- `src/lib/pdf/compress.js`
- `src/tools/image/ImageRotator.jsx`
- `src/tools/pdf/RotatePdf.jsx`
- `src/tools/pdf/CompressPdf.jsx`
- `src/tools/office/PdfViewer.jsx`
- `src/tools/scanner/SmartDocumentScanner.jsx`
- `src/tools/expanded/ExpandedTool.jsx` (searchable-PDF preservation change only)
- `test/image.test.mjs`
- `test/pdf.test.mjs`
- `test/scanner.test.mjs`
- `package.json` (`test:quality` gate)

## 5. New shared architecture

- `FileAsset`: immutable original plus metadata, preview, working, output,
  processing state and errors.
- Signature validation: PDF/JPEG/PNG/WebP/GIF/BMP magic-byte checks.
- Output validation: non-zero file, MIME/signature, image dimensions, PDF parse/
  page count, filename/extension agreement.
- Download manager: Blob/bytes/artifact support with object-URL revocation.
- Shared image processor: one final draw canvas for crop/resize/rotate/flip and
  encoded-output validation.
- Shared PDF renderer: device-pixel-ratio backing canvas, memory pixel/dimension
  budgets, explicit DPI conversion, navigation-thumbnail contract.
- Scanner quality pipeline: proxy detection/preview plus full-master rotation,
  normalized coordinate mapping, bilinear perspective transform and lossless
  page-master encoding.

## 6. Libraries added/removed

None. Phase 3 uses the project's existing browser APIs, PDF.js, pdf-lib and
existing OCR stack. No new dependency was introduced and none was removed.

## 7. Image-quality tests performed

Automated dependency-free regression tests verify:

- a 4000 x 3000 non-resizing operation remains 4000 x 3000;
- 90-degree rotation uses one final canvas and one encode;
- no-op rotation returns the original without encoding;
- immutable original cannot be replaced;
- core image signatures are detected;
- zero-byte output and MIME/extension mismatches are rejected.

The existing dependency-backed `test:image` suite was updated for the new
single-pass/no-op behavior but could not execute because `pdf-lib` is unavailable
without installed dependencies in this environment.

## 8. PDF tests performed

Automated quality tests verify:

- DPR 2 creates a 2x backing canvas while preserving CSS size;
- PDF render pixel budgets are enforced;
- extreme viewports may render below 1x backing scale rather than allocate an
  unsafe canvas;
- 72/150/300 DPI scales are explicit;
- PDF rotation source remains structural and contains no Canvas raster path;
- thumbnails are lazy navigation-only renders;
- the searchable-PDF path preserves original PDF pages instead of embedding PNG
  screenshots.

The existing dependency-backed `test:pdf` suite was updated for the revised PDF
compression preset but could not execute because `pdf-lib` is not installed in
the supplied ZIP environment.

## 9. Scanner tests performed

- Existing scanner Capture/Crop/Filter/Export regression suite passes.
- Full-master 4000 x 3000 perspective output is not capped to 1800 x 2400.
- 90/180-degree master-dimension mapping is verified.
- An unsafe 8000 x 6000 full correction produces an explicit memory-safety error
  instead of silently reducing the image.
- Source-level regression verifies export uses `outputBlob`, not preview/source
  data, and nearest-neighbour round(u)/round(v) sampling is absent.

Real camera-device, low-light and optical-detail validation still needs a real
browser/mobile run after dependencies are installed.

## 10. Build result

**Not completed in this environment.**

`npm run build` stops in `verify:deps` with:

> DEPENDENCY ERROR: vite is not installed. Run repair-and-run.cmd or npm ci.

A local-only install attempt with `npm ci --offline --ignore-scripts --no-audit`
also fails because the npm cache does not contain all packages (first missing
cached tarball reported: `zlibjs-0.3.1`). No network install was attempted.

## 11. Test result

25 dependency-free/source regression suites pass in the final Phase 3 source,
including registry, no-fake, converters, science formulas, platform, Office,
production master, SEO source checks, compiler-service source checks, PWA,
Capacitor, mobile UI, scanner, bundle/import graph and the new quality suite.

The new `test:quality` suite reports **20 passing quality architecture tests**.
The bundle/import graph check reports **196 modules / 191 reachable**, 307/307
active tools wired, no syntax errors, no unresolved imports and no missing
exports. Two pre-existing unused calculator-module warnings remain.

Dependency-backed `test:image` and `test:pdf` do not start because `pdf-lib` is
not installed in this execution environment.

## 12. Remaining limitations

- Full browser/Vite build validation is pending dependency installation.
- Real pixel-level image output tests and real PDF parse/render integration tests
  are pending the browser/dependency environment.
- Real Android/mobile scanner tests (normal, angled, receipt, low light,
  multi-page) remain mandatory before calling scanner quality production-ready.
- `PdfEditor.jsx` retains its legacy fixed-resolution preview path and is not yet
  migrated to the new rendering foundation.
- Several legacy image/PDF implementations in generic tool dispatchers still own
  custom Canvas/file logic and will migrate in their later category phases.
- Canvas transformations intentionally do not claim EXIF/ancillary metadata
  preservation; metadata-sensitive transformations need a dedicated strategy.
- Animated GIF editing is not preserved by the generic Canvas pipeline.
- Scanner CPU-heavy perspective processing currently yields to the event loop but
  is not yet moved to a Worker/OffscreenCanvas worker architecture.
- Scanner full-resolution browser processing has a 24 MP safety budget. Larger
  masters are preserved but processing is rejected rather than silently reduced.
- OCR searchable text placement is still approximate; visual PDF pages are now
  preserved, but OCR word-level bounding-box placement is a later improvement.
- Phase 3 intentionally migrated only representative tools plus the scanner/
  viewer foundations. It did not mass-migrate all 307 tools.

## Phase 3 conclusion

The architecture now enforces the intended direction:

**PRESERVE ORIGINAL → PROCESS CORRECTLY → RENDER AT REQUIRED QUALITY → VALIDATE OUTPUT → DOWNLOAD**

The source foundation and non-browser regression gates are in place. Browser,
real-file and real-device validation is still required before declaring the
quality work fully production-verified.
