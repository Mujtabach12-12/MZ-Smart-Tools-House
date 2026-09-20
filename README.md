# MZ Smart Tool House — Production V9 Candidate

MZ Smart Tool House is an existing React/Vite productivity platform that has been audited, repaired and expanded **in place**. The project was not replaced by an unrelated scaffold.

## Release position

This repository is a **production candidate**, not a claim of full production verification.

- Registry: **224 tools / 21 categories**
- Registry wiring: **224/224 active tools resolve to components**
- Dependency-free release gate: **19/19 suites PASS**
- Static integrity: **177 modules checked; 0 syntax errors; 0 unresolved imports; 0 missing exports**
- Strict Tool Health: **0 Working / 224 Warning / 0 Broken / 0 Not Implemented**
- Full dependency-backed `npm run test:all`: **NOT COMPLETE in this audit environment** because `pdf-lib` is not installed locally
- Production Vite build: **NOT VERIFIED in this audit environment** because the offline npm cache cannot supply `zlibjs@0.3.1`, so `vite` is unavailable
- Browser/device E2E: **NOT RUN here** because the app cannot be served without the dependency install

The conservative Tool Health count is deliberate. Source wiring and unit tests are not treated as proof of UI/download/mobile success.

## Run on a normal development machine

Requirements: Node.js 20+ and internet access for the first clean install.

```bash
npm ci
npm run test:all
npm run build
npm run dev
```

Do not deploy if `npm run test:all` or `npm run build` exits non-zero.

## Production V9 highlights

### One application shell

- Centralized registry drives discovery, categories, related tools, SEO metadata and health reporting.
- Responsive navigation exposes Home, Tools, Categories, MZ Office, Programming, Student, AI and More.
- Top-level Search, Feedback, Install App and Theme actions are available without forcing an account.
- Recently used/favorite tools and recent Office work use browser-local persistence.
- Shared non-intrusive toast notifications provide consistent success/error/info feedback.

### Shared download architecture

Generated downloads are routed through `src/lib/download.js` rather than scattered one-off `<a download>` handlers. Browser and supported native/Capacitor paths share the same service and truthful status messaging.

### Feedback and contact

- Global Feedback supports category, optional 1–5 rating, message, optional identity fields, current page and device context.
- Production submits through the Netlify `mz-feedback` form.
- Offline/local failures are stored in an explicitly local queue; queued feedback is **not** presented as received by the server.
- Contact uses the same real production submission path and does not show fake success when delivery fails.

### Smart Document Scanner

The scanner preserves the original photo and performs real browser-side boundary analysis rather than a fixed center crop.

Flow:

`Original -> Detect boundary -> Review corners -> Auto/Manual crop -> Perspective correction -> Enhancement -> Pages -> Export`

Implemented:

- camera/upload
- real edge/candidate boundary analysis with confidence
- visible four-corner quadrilateral
- large draggable manual corners using original-image coordinates
- manual-crop zoom
- rotate + re-detect
- undo/redo page edits
- Original (default), Auto, Document, Light, Grayscale, B&W, High Contrast and Sharpen modes
- Before/After comparison
- brightness/contrast/sharpen controls
- multi-page add/delete/reorder/edit
- PDF/JPG/PNG export
- multi-image ZIP export
- A4/US Letter PDF options and margins
- OCR/searchable-PDF path where dependencies/browser capability support it

Scanner regression tests pass. Real camera/device testing is still required before a strict WORKING status.

### PDF Compressor

Compression savings are calculated from actual input/output byte sizes. A larger generated result is not reported as successful compression. Low mode avoids blind page rasterization; stronger modes may optimize image-heavy pages and compare candidates. Generated PDF/page-count validation exists in source.

The dependency-heavy PDF suite must still run on a machine with the complete npm installation before release.

### MZ Online Word

A full application workspace, not a tiny textarea/card:

- File/Edit/View/Insert/Format/Layout/Tools menus
- A4/Letter, portrait/landscape, margins
- common document-safe fonts and rich text formatting
- headings, lists, alignment, indentation, line/paragraph spacing
- tables, images, links, horizontal rules, page breaks
- header/footer/page-number options
- assignment/research/lab/report/notes/letter/CV templates
- assignment cover fields
- autosave, draft recovery, recent documents, rename/duplicate/delete
- DOCX/TXT/HTML import
- genuine DOCX/PDF/TXT/HTML export paths with structural validation
- print/print-preview workflow
- live words/characters/paragraphs and an explicitly estimated page count

Complex Microsoft Word layout parity is not claimed.

### MZ Online Excel

- multi-sheet browser workbook
- formula bar, cell editing and formatting
- sheet search, zoom and print
- autosave
- XLSX/CSV import/export
- common formula engine: SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, IF, AND, OR, ROUND, ROUNDUP, ROUNDDOWN, ABS, MOD, CONCAT/CONCATENATE, LEFT, RIGHT, MID, LEN, TODAY, NOW
- chart previews

Full Excel feature parity and complex workbook fidelity are not claimed.

### MZ Online PowerPoint + Viewer

- slide creation/delete/duplicate/reorder
- common layouts, images, notes, templates and presentation mode
- genuine PPTX export with Office ZIP/slide validation
- PDF handout and image export paths
- PPTX compatibility viewer parses actual PPTX ZIP/XML content rather than presenting a fake screenshot

Advanced PowerPoint animation/SmartArt/theme fidelity is not claimed.

### PDF Editor + Viewer

PDF Editor provides real page/document operations, annotations, watermark/page numbers, image/signature insertion, selected-page PDF extraction and image export. Visual whiteout is **not** described as secure redaction, and arbitrary rewriting of existing PDF text is not claimed.

PDF Viewer uses PDF.js with thumbnails, navigation, zoom, **Fit Width**, **Fit Page**, rotate, fullscreen, text search where text exists, print and original download.

### Dictionary

Dictionary results come from real external sources. Production defaults to the Netlify `/api/dictionary` gateway to DictionaryAPI.dev, with Datamuse for suggestions. The UI handles loading, no result, timeout/network error and success separately. No bundled fake definitions are used.

Live provider availability must be verified after deployment.

### Programming Lab

Real browser JavaScript execution and an HTML/CSS/JS sandbox are available. Native/runtime languages remain unavailable until the separate isolated compiler service is deployed and its execution matrix passes.

The compiler-service architecture includes queueing, temporary workspaces, timeout termination, CPU/RAM/PID/output/source limits, network-off containers and cleanup. Do **not** execute untrusted code in the main web/API process.

See `compiler-service/README.md` and `docs/COMPILER-BACKEND.md`.

### PWA / installable app

- manifest/icons/standalone display
- generated versioned service worker
- real `beforeinstallprompt` lifecycle
- visible Install App action
- accepted/dismissed/installed/update states
- no-cache headers for `sw.js` and `index.html`
- browser guidance when native install prompting is unavailable
- Capacitor/Android integration checks

Source PWA audit passes. Real install/update testing on Windows/Android/iOS-supported flows remains a deployment gate.

### SEO / Netlify

- `VITE_SITE_URL` controls client canonical/schema origin
- sitemap/robots generation uses configured origin
- current generated sitemap: **273 canonical URLs**
- canonical/Open Graph/Twitter/structured-data architecture
- registry-driven related/internal links and breadcrumbs
- SPA fallback, Netlify function redirects, security/cache headers
- Search Console/Bing setup documented

No indexing or ranking result is claimed without live search-engine verification.

## Environment variables

Copy `.env.example` as appropriate. Never place secrets in `VITE_` variables.

Important values:

- `VITE_SITE_URL`
- `VITE_API_BASE_URL`
- `VITE_COMPILER_API_URL` (only after the isolated compiler service is deployed)
- `VITE_DICTIONARY_API_URL` (optional override)
- server-only `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`

## Quality commands

```bash
npm run test:calculators
npm run test:simple-calculators
npm run test:fixtures
npm run test:registry
npm run test:functional-audit
npm run test:category-registry
npm run test:no-fake
npm run test:platform
npm run test:office-platform
npm run test:final-platform
npm run test:production-master
npm run test:spreadsheet
npm run test:seo-architecture
npm run test:compiler-service
npm run test:health
npm run test:capacitor
npm run test:image
npm run test:pdf
npm run test:scanner
npm run test:bundle
npm run test:pwa
npm run test:all
npm run audit:tools
npm run build
```

GitHub Actions runs the clean install, full test suite and production build on push/pull request.

## Release documents

- `FINAL-PRODUCTION-MASTER-REPORT-2026-09-20.md`
- `docs/NETLIFY-DEPLOYMENT-CHECKLIST.md`
- `docs/SEO-SEARCH-CONSOLE.md`
- `audit/tool-inventory.md`
- `audit/tool-inventory.csv`
- `audit/tool-inventory.json`

A release should be called production-verified only after the complete dependency install, full test suite, Vite build and real browser/device matrix pass on the deployment candidate.

## Global science & engineering expansion (V12)

V12 adds a centralized, tested formula platform covering Physics, Chemistry, Biology, Mathematics, Engineering and Robotics. The platform now exposes 307 active registry tools across 27 categories; counts shown in the UI are derived from the registry rather than hard-coded marketing numbers.

### PWA install mode

The default PWA mode is native-first and does not defer `beforeinstallprompt`, avoiding Chromium's deferred-prompt diagnostic. If a deployment explicitly prefers a custom one-click deferred Chromium prompt, set:

```env
VITE_PWA_DEFER_INSTALL=true
```

That opt-in uses the standard saved-event + `prompt()` flow. Chromium may log its own deferred-prompt diagnostic between event deferral and the user's install click; this is browser behavior, not a suppressed application error.

### V12 verification

```bash
npm run test:science
npm run test:warning-fixes
npm run test:converters
npm run test:registry
npm run test:category-registry
npm run test:bundle
npm run test:pwa
```

For a real release, still run `npm ci`, `npm run test:all`, `npm run build`, and browser/mobile testing on a machine with the complete dependency tree.
