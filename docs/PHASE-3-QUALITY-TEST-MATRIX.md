# Phase 3 — Quality Verification Matrix

Legend: **AUTO-PASS** = automated in this source tree; **SOURCE-PASS** = source/contract regression; **PENDING-BROWSER** = requires installed frontend dependencies and a real browser; **PENDING-DEVICE** = requires a real camera/mobile device.

## Images

| Input | Required verification | Status |
|---|---|---|
| 500 × 500 JPG | decode, unchanged dimensions for non-resize, valid JPG output | PENDING-BROWSER |
| 1920 × 1080 JPG | decode, unchanged dimensions for non-resize, one encode for transform | PENDING-BROWSER |
| 4000 × 3000 JPG | no silent downscale | AUTO-PASS (geometry/architecture); PENDING-BROWSER (real pixels) |
| high-resolution PNG | preserve dimensions and PNG alpha-capable output path | PENDING-BROWSER |
| transparent PNG | alpha remains valid when output stays PNG | PENDING-BROWSER |
| WebP | correct MIME/signature/output dimensions | PENDING-BROWSER |
| large image | explicit memory-safe failure rather than silent source overwrite | SOURCE-PASS / PENDING-BROWSER |

Automated quality guard: a non-resizing 4000 × 3000 operation must report/output 4000 × 3000. No-op rotation must return the original object with zero Canvas encodes.

## PDFs

| Input | Required verification | Status |
|---|---|---|
| 1-page text PDF | sharp DPR render, original download unchanged | SOURCE/AUTO-PASS; PENDING-BROWSER visual |
| 10-page PDF | navigation and lazy thumbnails | SOURCE-PASS; PENDING-BROWSER |
| 50-page PDF | bounded memory and lazy navigation renders | SOURCE-PASS; PENDING-BROWSER |
| 100+ page PDF | usable navigation without eager high-res page allocation | SOURCE-PASS; PENDING-BROWSER |
| image-heavy PDF | render and explicit-DPI image export | AUTO-PASS scale contract; PENDING-BROWSER |
| scanned PDF | OCR render is temporary; searchable PDF preserves source pages | SOURCE-PASS; PENDING-BROWSER |
| mixed vector/image PDF | structural rotate preserves page count/content | SOURCE-PASS; dependency-backed PDF test PENDING |
| large PDF | pixel-budget/memory safety | AUTO-PASS render-budget contract; PENDING-BROWSER |

## Scanner

| Scenario | Required verification | Status |
|---|---|---|
| normal document | detect → adjust → perspective → export | SOURCE/AUTO-PASS; PENDING-DEVICE |
| angled document | normalized corners map to full master | AUTO-PASS geometry; PENDING-DEVICE visual |
| low-light document | enhancement remains readable without preview-to-output reuse | SOURCE-PASS; PENDING-DEVICE |
| multi-page document | page masters remain independent, reorder/export correct | SOURCE-PASS; PENDING-DEVICE |
| receipt | narrow document perspective quality | PENDING-DEVICE |
| printed page | small text/detail after perspective correction | PENDING-DEVICE |
| high-resolution capture | master retained; proxy only for detection/preview | SOURCE-PASS; PENDING-DEVICE |

Before Phase 4/production release, all **PENDING-BROWSER** and **PENDING-DEVICE** rows should be executed with representative real files and, for the scanner, at least one Android phone.
