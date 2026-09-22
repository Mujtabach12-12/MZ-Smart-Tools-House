# MZ Smart Tool House — Phase 4 Report

Date: 2026-09-22

Scope: Professional PDF Reader + Professional Document Scanner only.

Phase 3 quality foundations were preserved. This phase did **not** rewrite `src/lib/pdf/rendering.js`, `src/lib/scanner/qualityPipeline.js`, the immutable file model, output validation, or the shared download architecture.

## 1. Research / benchmark basis

Phase 4 used the benchmark gate supplied and authorized for the project:

### PDF reader benchmark set
- Adobe Acrobat / Acrobat Reader
- Smallpdf PDF Reader
- iLovePDF
- PDFgear

The implementation follows the common document-reader interaction model rather than any product's visual identity: compact document toolbar, direct page entry, continuous reading, optional page thumbnails, fit/zoom controls, search, print, fullscreen, and original-file download.

### Scanner benchmark set
- Adobe Scan
- CamScanner
- Genius Scan / comparable document-scanning workflows
- Current Microsoft Windows Camera / Scan workflow

The implementation follows the common scanner flow: camera/upload → boundary detection → four-corner review → perspective correction → enhancement → page review/management → export.

No third-party branding, proprietary assets, source code, or exact visual identity was copied.

## 2. PDF Reader changes

### Workspace
The old one-page canvas viewer was replaced by a document-first continuous reader:
- compact top file row
- professional grouped toolbar
- collapsible thumbnail panel
- continuous document viewport
- bottom status line
- mobile thumbnail drawer instead of a permanently narrow sidebar

### Page navigation
Implemented:
- first page
- previous page
- validated page-number input
- next page
- last page
- total page count
- page control synchronized with the page currently visible while scrolling

Invalid page input is rejected safely and resets to the active page.

### Rendering and zoom
The Phase 3 DPR-aware renderer remains authoritative. Each visible/nearby page rerenders from the PDF source at the current zoom level.

Implemented:
- zoom out / in
- percentage selector
- fit width calculated from real available viewport size
- fit page calculated from available width and height
- actual size (100% PDF.js view scale; no false physical-size claim)
- Ctrl/Cmd + wheel cursor-centered zoom
- touch pinch zoom around the gesture center
- desktop hand/pan tool and native overflow panning
- view-only clockwise/counter-clockwise rotation

The reader does not enlarge a permanent low-resolution screenshot for zoom.

### Continuous reading and memory behavior
- Pages render lazily near the viewport.
- Offscreen page canvases are reduced to 1×1 backing pixels so large documents do not retain every high-resolution bitmap.
- PDF.js page rendering tasks are cancellable when React tears down/re-renders a page.
- The active page is detected from the continuous scroll viewport.

### Thumbnails
- Thumbnails render only as they approach the thumbnail panel viewport.
- Thumbnail object URLs are revoked when thumbnails move far away and can be regenerated later.
- Thumbnails never enter PDF export/download/edit paths.

### Search and text layer
Implemented real PDF text-content search using `getTextContent()`:
- search field
- next / previous result
- result count
- page navigation to results
- visible highlight for text items containing the search term
- scanned/image-only message when no usable text exists

A selectable transparent text layer is positioned over the high-quality canvas so users can select/copy text while the canvas remains the visual source.

### Fullscreen / print / original download
- Fullscreen uses the browser Fullscreen API and keeps the reader controls available.
- Print uses the original PDF Blob in a hidden print frame; it does not print a canvas screenshot.
- Download Original uses the untouched uploaded File/Blob directly through the shared download system.
- View rotation never mutates the original PDF.

### Mobile
- Tool controls remain touch-sized.
- Thumbnail navigation becomes an overlay drawer.
- The reader viewport remains the primary area.
- Single-finger native document scrolling remains available.
- Two-finger pinch controls document zoom.
- Download remains visible without forcing the full desktop toolbar into one row.

## 3. Scanner changes

The Phase 3 high-resolution master pipeline remains intact.

### Camera workflow
Implemented capability-aware controls:
- rear-camera preference
- high-resolution ideal camera constraints
- `ImageCapture.takePhoto()` preferred when supported
- video-frame fallback when still capture is unavailable
- camera switch when multiple video inputs are available
- torch/flash only when the active track actually reports torch capability
- permission denied / blocked / no-device / camera-busy / unsupported recovery messages
- gallery/photo fallback remains available

The on-screen camera rectangle is a composition guide only; the application does not pretend that it is live automatic detection. Real boundary detection occurs on the captured/uploaded image.

### Boundary detection and corner review
- Existing real boundary detection is retained.
- Automatic corners immediately enter the four-corner review step.
- Four large draggable handles support direct mouse/touch correction.
- Failed detection falls back to editable full-image corners instead of fake detection.
- Detect Again remains available.

### Retake / delete / rotate
The crop review now includes:
- Retake using the camera while preserving the existing page until a replacement is successfully captured
- Delete page
- Rotate from the immutable original and redetect the crop
- Reset corners

### Perspective correction
Confirmed Phase 3 behavior is still used:
- normalized crop coordinates map back to the oriented high-resolution master
- real perspective warp, not rectangle-only cropping
- bilinear sampling
- no thumbnail/preview used as final source

### Enhancement
The primary scanner modes were simplified to the familiar document-scanner set:
- Original
- Document
- Grayscale
- Black & White
- Enhanced

Brightness, contrast and sharpness controls remain real processing controls. The UI preview is a bounded proxy; pressing Continue applies the selected settings once to the high-resolution master.

### Multi-page page manager
Implemented/retained:
- add page from gallery
- scan another page
- select page
- edit crop
- edit filter
- rotate
- delete
- move earlier/later (touch-friendly fallback)
- drag/reorder on desktop

A dedicated ~320px UI thumbnail is generated for the page manager. It is separate from the processed `outputBlob` master.

### Export
PDF export continues to use validated full processed page masters (`outputBlob`), not thumbnails or UI screenshots.

Implemented/retained:
- validated multi-page PDF
- A4 / US Letter options
- margin options
- full-resolution PNG export
- high-quality JPG export when explicitly selected
- ZIP for multiple image pages
- real Tesseract OCR path
- searchable-PDF path

## 4. Quality improvements in Phase 4

PDF Reader:
- high-DPI render path retained
- page render resolution follows zoom
- continuous lazy rendering
- offscreen bitmap cleanup
- lazy thumbnails with URL cleanup
- original PDF is unchanged for reading, search, zoom, rotation, print, fullscreen and download

Scanner:
- crop UI now always uses a bounded display proxy rather than decoding the full master merely for display
- processed page manager thumbnails are separate derivatives
- PDF/image export still uses full processed masters
- retake keeps the previous page until replacement succeeds
- no Phase 4 component uses fake timeout-based progress or artificial delays

## 5. Files/components created

- `src/lib/pdf/reader.js`
- `src/tools/office/pdf-reader/PdfPageView.jsx`
- `src/tools/office/pdf-reader/PdfThumbnail.jsx`
- `test/phase4-reader-scanner.test.mjs`

## 6. Files modified

- `src/tools/office/PdfViewer.jsx`
- `src/tools/scanner/SmartDocumentScanner.jsx`
- `src/index.css`
- `package.json`
- `test/scanner.test.mjs`
- `test/quality-architecture.test.mjs`
- `test/production-master.test.mjs`

No libraries were added or removed.

## 7. Tests performed

### Passing regression/source suites
The following 26 suites completed successfully after the Phase 4 changes:

1. calculators
2. simple calculators
3. fixture integrity
4. converters
5. science formulas
6. React/PWA warning fixes
7. dependency safety
8. tool registry
9. functional tool audit
10. category registry
11. no-fake-features audit
12. platform features
13. office platform
14. final platform
15. production master
16. spreadsheet formulas
17. SEO architecture
18. compiler service source/security gates
19. tool health manifest
20. Capacitor audit
21. Phase 3 quality architecture
22. scanner regression
23. Phase 4 reader/scanner regression
24. whole-app bundle/import graph audit
25. PWA audit
26. mobile UI audit

The Phase 4 test specifically reports **20/20 Phase 4 checks passing**. The Phase 3 quality suite reports **20/20 checks passing**.

The whole-app source/bundle audit checks 199 modules, reports 194 reachable, verifies 307/307 active tools remain wired, and reports no syntax errors, unresolved imports, missing exports, or registry failures. Two pre-existing unused calculator-module warnings remain (`cgpa.js`, `gpa.js`).

### Dependency-backed tests
`npm run test:image` and `npm run test:pdf` cannot execute in this uploaded-source environment because `node_modules` is absent and `pdf-lib` is therefore unavailable at runtime.

## 8. Build result

A real production build was attempted with:

`npm run build`

It stops at the repository's dependency gate before Vite starts:

`DEPENDENCY ERROR: vite is not installed. Run repair-and-run.cmd or npm ci.`

This is an environment/dependency-installation block, not a reported Vite compile failure. The uploaded ZIP does not contain `node_modules`, and this environment cannot fetch packages from the internet. Therefore this Phase 4 report does **not** claim a successful production Vite build.

There is no configured lint script in `package.json`, so no separate lint command was available to run.

## 9. Benchmark workflow comparison

### PDF Reader
Common professional pattern: open document → compact toolbar → optional thumbnails → continuous page workspace → direct page jump / zoom / search → print/download.

MZ now follows that familiar model while retaining MZ branding. It removes the previous single-page-only reader feel and avoids forcing Next/Previous navigation for normal reading.

### Scanner
Common professional pattern: camera/upload → automatic boundary → manual corner correction → enhancement → accept page → add/reorder/edit pages → export.

MZ now follows that model. Automatic detection never removes manual control, and output is generated from the high-resolution page master rather than from the thumbnail shown in the page manager.

## 10. Remaining limitations / risks

These are not hidden or marked as verified when they were not exercised in a real browser/device build:

1. **Real browser/mobile QA is still required after dependencies are installed.** This environment could not launch the Vite application.
2. **Complex PDF text-layer alignment** (unusual fonts, vertical writing, highly transformed glyphs) needs visual browser validation. Search itself uses real PDF text content, but highlight spans can only highlight within individual PDF.js text items.
3. **Pinch behavior varies by browser/OS.** The implementation is present, but Android Chrome/iOS Safari/Capacitor should be manually exercised.
4. **Print behavior depends on browser PDF support.** The implementation prints the original Blob and has a user-facing fallback message if the browser cannot print it.
5. **Scanner torch/camera switching is capability-dependent.** Controls are not shown when the browser/device does not expose the capability.
6. **Document boundary detection is post-capture, not live video-frame edge tracking.** No fake live detection was added.
7. **Very large scanner masters retain the Phase 3 24 MP browser safety policy.** The original is preserved and an explicit error is shown rather than silently downscaling.
8. **Perspective correction still runs in the browser main-thread pipeline with yielding.** A dedicated Worker/OffscreenCanvas version may be valuable on lower-end phones after real-device profiling.
9. **Searchable scanner PDF OCR positioning** remains the existing approximate text-overlay approach; Phase 4 did not rebuild OCR geometry.
10. **No tool outside PDF Reader and Scanner was migrated or redesigned.** This was intentional and within Phase 4 scope.

## 11. Phase 4 status

Phase 4 implementation is complete at source/regression-test level and stops here as requested.

It should not be labelled fully production-verified until dependencies are installed and the required real-browser, real-file and real-device matrix is completed with a successful production build.

Phase 5 has not been started.
