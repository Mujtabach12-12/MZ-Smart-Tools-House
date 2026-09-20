# MZ Smart Tool House Production Audit

## Verified status

- Registry tools found: 215
- Deterministically verified working: 36
- Warning or not yet behavior-tested end to end: 179
- Known failed after the final automated suite: 0
- Explicit registry placeholders: 0
- Build: PASS
- Registry wiring: 215 of 215 tools have routed components

The warning group is intentional. A component loading is not accepted as proof that its complete workflow, downloads, reset behavior, errors and mobile interface work. These tools remain warning until category-specific behavior or browser tests are added.

## Corrections completed

1. Fixed the Android splash audit to validate the splash asset actually referenced by the Android resources.
2. Rebuilt PDF compression with three real modes:
   - Low: lossless PDF structure optimization.
   - Medium: balanced page rasterization and JPEG compression.
   - High: stronger page rasterization and JPEG compression.
3. Compression results use actual input and generated output byte sizes. No estimated or fake saving is displayed.
4. Added document-boundary detection using image gradients and four corner estimation.
5. Scanner now reports a low-confidence detection and keeps the full photo for manual four-corner correction instead of silently claiming success.
6. Manual crop uses the original captured image and applies perspective correction from the selected corners.
7. Added an internal Tool Health Dashboard at `/tool-health`, linked from Settings.
8. Added processing type metadata to every registry record.

## Automated verification

- 54 calculator logic tests
- 116 image logic and pipeline tests
- 31 PDF tests using generated real PDFs and images
- Scanner geometry, lighting and graceful-failure tests
- Tool health manifest test
- Registry, category, bundle/import, Capacitor and PWA audits
- Production Vite build

## Remaining work

- Browser end-to-end tests are still required for 179 warning tools.
- Real camera tests are required on Android and iOS devices under varied backgrounds and lighting.
- Medium/high PDF compression flattens pages. It preserves page appearance and count but removes selectable text, forms and links. A server-side PDF optimizer is the practical future option for advanced object-level image recompression without flattening.
- The vendor bundle remains large because PDF, OCR and document libraries are substantial. More dependency-specific lazy chunking should be the next performance task.
- Twelve source modules are reported as unused and should be reviewed before deletion; they were preserved to avoid breaking user work.

## Recommended next phase

Continue category-by-category verification, starting with the remaining PDF tools, then image tools, calculators, text/developer utilities, mobile browser workflows, performance and SEO. Do not add major new tools until warning counts have been reduced through real behavior tests.
