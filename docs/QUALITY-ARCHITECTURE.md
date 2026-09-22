# MZ Smart Tool House — File, Image & PDF Quality Architecture

## Core invariant

The user-provided `File`/`Blob` is immutable for the lifetime of a tool session.
A tool may create preview, working and output derivatives, but it must never
replace the source object with one of those derivatives.

```text
ORIGINAL ───────→ WORKING ───────→ OUTPUT
   │
   └────────────→ PREVIEW
```

`PREVIEW → OUTPUT` is forbidden unless the preview is explicitly the same
full-quality working representation and the tool documents that fact.

## Shared modules

- `src/lib/files/fileAsset.js` — lifecycle/metadata model and immutable-original guard.
- `src/lib/files/signatures.js` — lightweight magic-byte validation for core PDF/image formats.
- `src/lib/files/outputValidation.js` — non-zero, MIME/signature, dimensions, PDF page-count and filename/extension checks.
- `src/lib/files/format.js` — dependency-free file-size formatting.
- `src/lib/download.js` — Blob/bytes/artifact download handling and object-URL cleanup.
- `src/lib/image/process.js` — shared full-resolution canvas processing path.
- `src/lib/pdf/rendering.js` — DPR-aware PDF.js render sizing and explicit DPI helpers.
- `src/lib/scanner/qualityPipeline.js` — scanner preview proxies plus full-resolution perspective/enhancement pipeline.

## Image rules

1. Decode the original file and record natural dimensions.
2. Do not resize merely to fit the UI. UI size is CSS size.
3. Canvas transformations render directly into the final operation canvas to
   avoid resize → second canvas → second resample chains.
4. No-op rotation returns the original file; it does not re-encode it.
5. PNG remains PNG by default. JPEG remains JPEG. WebP remains WebP. GIF/BMP
   transformations fall back to lossless PNG because Canvas cannot encode those
   source formats; animated GIFs require a dedicated animation-aware workflow.
6. Lossy quality is an export decision. It is not a preview decision.
7. Re-encoded Canvas output does not reliably preserve EXIF/ancillary metadata;
   the result reports `metadataPreserved: false` instead of claiming otherwise.
8. New/migrated image tools should validate MIME/signature and expected output
   dimensions before exposing a download.

## PDF rules

1. Opening/rendering a PDF never modifies the original file.
2. PDF.js receives a copy of source bytes where it may transfer/detach buffers.
3. Viewer CSS dimensions and backing-store dimensions are separate. The backing
   canvas uses device-pixel ratio when safe and a pixel/dimension budget when
   zoom/DPR/page size would otherwise create unsafe allocations.
4. Zoom causes a new PDF.js render. A low-resolution thumbnail is never stretched
   and treated as source data.
5. Navigation thumbnails are lazy, low-resolution derivatives only.
6. Structural operations (rotate/split/merge/reorder/extract/delete where
   technically possible) should operate on PDF objects/pages rather than page
   screenshots.
7. Rasterization is explicit for tasks such as PDF → image and raster-compression
   modes. Raster export resolution is expressed as DPI rather than a hidden
   preview scale.
8. Searchable-PDF OCR may raster-render pages for recognition, but the current
   migrated path preserves the original PDF pages in the output and overlays OCR
   text rather than rebuilding every page from a PNG screenshot.

## Scanner rules

1. Uploaded/captured media remains the immutable page master.
2. Edge detection and live enhancement previews use reduced proxy canvases.
3. Crop corners are stored as normalized coordinates so they map back to the
   master image.
4. Rotation is metadata/working state until final processing; it is recreated
   from the original master rather than from a previously encoded JPEG.
5. Perspective correction runs on the full master and uses bilinear sampling.
6. Corrected page masters are stored losslessly as PNG. JPG is generated only
   when the user explicitly requests JPG output.
7. Final PDF embeds the validated page master, never the UI preview.
8. Very large corrected pages fail with an explicit memory-safety error instead
   of being silently reduced. The original remains available.
9. Object URLs are revoked when pages/results are replaced or removed.

## Memory/performance rules

- Prefer Blob/File + object URLs to base64 for large binary data.
- Lazy-load PDF.js, OCR and other heavy engines through tool/module boundaries.
- Release PDF page resources after rendering.
- Lazy-render PDF thumbnails.
- Enforce pixel budgets before allocating large canvases.
- Scanner processing yields periodically for multi-megapixel CPU loops. A Worker/
  OffscreenCanvas migration remains a future optimization where browser support
  and complexity justify it.

## Output contract for migrated tools

Before download, validate as applicable:

- data exists and is non-zero;
- MIME type and file signature;
- filename extension matches MIME;
- image decodes and expected dimensions match;
- PDF parses and expected page count matches;
- object URLs are cleaned up after use.

## Representative Phase 3 migrations

- Image: `ImageRotator.jsx`
- Structural PDF operation: `RotatePdf.jsx`
- PDF viewing/rendering foundation: `PdfViewer.jsx`
- Scanner quality pipeline: `SmartDocumentScanner.jsx`

The remaining tools are intentionally **not** all migrated in Phase 3. They
should adopt these contracts during their later category phases rather than
being rewritten blindly.
