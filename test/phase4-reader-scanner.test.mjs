import assert from "node:assert/strict";
import fs from "node:fs";
import {
  calculatePdfFitScale, clampPdfZoom, countTextOccurrences, friendlyPdfOpenError,
  nextZoomLevel, normalizePdfPageInput,
} from "../src/lib/pdf/reader.js";

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (error) {
    console.error(`  FAIL - ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

console.log("PDF reader interaction model");
check("fit width is calculated from the real viewport, not a magic scale", () => {
  const scale = calculatePdfFitScale({ pageWidth: 600, pageHeight: 800, availableWidth: 360, availableHeight: 700, mode: "width", horizontalPadding: 20 });
  assert.equal(scale, 340 / 600);
});
check("fit page respects both available width and height", () => {
  const scale = calculatePdfFitScale({ pageWidth: 600, pageHeight: 800, availableWidth: 1000, availableHeight: 500, mode: "page", verticalPadding: 20 });
  assert.equal(scale, 480 / 800);
});
check("zoom is bounded and uses predictable professional steps", () => {
  assert.equal(clampPdfZoom(9), 4);
  assert.equal(clampPdfZoom(0.1), 0.35);
  assert.equal(nextZoomLevel(1, 1), 1.15);
  assert.equal(nextZoomLevel(1, -1), 0.85);
});
check("page entry clamps safely", () => {
  assert.equal(normalizePdfPageInput(25, 50), 25);
  assert.equal(normalizePdfPageInput(0, 50), 1);
  assert.equal(normalizePdfPageInput(500, 50), 50);
});
check("text search counts real occurrences", () => {
  assert.equal(countTextOccurrences("PDF reader PDF tools pdf", "pdf"), 3);
  assert.equal(countTextOccurrences("nothing here", "pdf"), 0);
});
check("password/corruption errors become user-facing messages", () => {
  assert.match(friendlyPdfOpenError({ name: "PasswordException" }), /password protected/i);
  assert.match(friendlyPdfOpenError({ name: "InvalidPDFException" }), /corrupted|incomplete/i);
});

const viewer = fs.readFileSync("src/tools/office/PdfViewer.jsx", "utf8");
const pageView = fs.readFileSync("src/tools/office/pdf-reader/PdfPageView.jsx", "utf8");
const thumbnail = fs.readFileSync("src/tools/office/pdf-reader/PdfThumbnail.jsx", "utf8");
const scanner = fs.readFileSync("src/tools/scanner/SmartDocumentScanner.jsx", "utf8");

console.log("PDF reader source contracts");
check("reader is continuous-scroll with active-page synchronization", () => {
  assert.match(viewer, /data-pdf-page/);
  assert.match(viewer, /updateActivePageFromScroll/);
  assert.match(viewer, /scrollToPage/);
});
check("page rendering uses the Phase 3 high-DPI renderer", () => {
  assert.match(pageView, /beginPdfPageRender/);
  assert.match(pageView, /renderTask\.promise/);
});
check("offscreen page canvases are released", () => {
  assert.match(pageView, /canvas\.width = 1/);
  assert.match(pageView, /nearViewport/);
});
check("reader exposes selection/search text from PDF text content", () => {
  assert.match(viewer, /getTextContent/);
  assert.match(pageView, /mz-pdf-text-layer/);
  assert.match(pageView, /dataset\.searchMatch/);
});
check("thumbnails are lazy and revoke resources when far away", () => {
  assert.match(thumbnail, /IntersectionObserver/);
  assert.match(thumbnail, /renderPdfThumbnail/);
  assert.match(thumbnail, /revokeObjectURL/);
});
check("reader has real original-download, print, fullscreen and view-only rotation", () => {
  assert.match(viewer, /downloadBlob\(file/);
  assert.match(viewer, /target\?\.print/);
  assert.match(viewer, /requestFullscreen/);
  assert.match(viewer, /setRotation/);
  assert.doesNotMatch(viewer, /PDFDocument\.load|embedJpg|embedPng/);
});
check("reader supports cursor-centered wheel zoom and touch pinch", () => {
  assert.match(viewer, /onWheel/);
  assert.match(viewer, /zoomAtPoint/);
  assert.match(viewer, /onTouchMove/);
  assert.match(viewer, /event\.touches\.length !== 2/);
});

console.log("Scanner source contracts");
check("scanner captures from a still photo when supported and retains video-frame fallback", () => {
  assert.match(scanner, /ImageCapture/);
  assert.match(scanner, /takePhoto/);
  assert.match(scanner, /drawImage\(currentVideo/);
});
check("scanner offers real camera capability controls", () => {
  assert.match(scanner, /getCapabilities/);
  assert.match(scanner, /torchSupported/);
  assert.match(scanner, /applyConstraints/);
  assert.match(scanner, /switchCamera/);
});
check("scanner requires editable four-corner review before final perspective processing", () => {
  assert.match(scanner, /mz-scanner-crop-handle/);
  assert.match(scanner, /validateDocumentCorners/);
  assert.match(scanner, /warpPerspective\(master/);
});
check("scanner preview and export sources are separated", () => {
  assert.match(scanner, /thumbnailUrl/);
  assert.match(scanner, /outputBlob/);
  assert.match(scanner, /pageData\.outputBlob/);
  assert.doesNotMatch(scanner, /embedPng\([^)]*thumbnail/);
});
check("scanner page manager supports retake, rotate, delete and reorder", () => {
  assert.match(scanner, /retakeSelected/);
  assert.match(scanner, /rotatePage/);
  assert.match(scanner, /removePage/);
  assert.match(scanner, /reorderPage/);
  assert.match(scanner, /draggable/);
});
check("scanner exposes only real primary enhancement modes", () => {
  for (const label of ["Original", "Document", "Grayscale", "Black & White", "Enhanced"]) assert.ok(scanner.includes(`\"${label}\"`));
});
check("Phase 4 components contain no fake timing/progress delays", () => {
  assert.doesNotMatch(viewer, /setTimeout\s*\(/);
  assert.doesNotMatch(scanner, /setTimeout\s*\(/);
});

console.log(`\n${passed} Phase 4 reader/scanner tests passed.`);
if (process.exitCode === 1) process.exitCode = 1;
