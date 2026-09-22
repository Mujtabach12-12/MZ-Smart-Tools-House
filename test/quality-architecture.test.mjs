import assert from "node:assert/strict";
import fs from "node:fs";
import { createFileAsset, updateFileAsset, attachImageMetadata, assertOriginalPreserved } from "../src/lib/files/fileAsset.js";
import { sniffFileMime, assertFileSignature } from "../src/lib/files/signatures.js";
import { assertNonEmptyOutput, createOutputArtifact } from "../src/lib/files/outputValidation.js";
import { computeOutputScale, prepareCanvasForPdfPage, scaleForDpi } from "../src/lib/pdf/rendering.js";
import { dimensionsAfterRotation, outputSizeForPerspective } from "../src/lib/scanner/qualityPipeline.js";
import { rotateImage, processImage } from "../src/lib/image/process.js";

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (error) {
    console.error(`  FAIL - ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

function fakeImageFile(name = "photo.jpg", type = "image/jpeg", size = 2_000_000) {
  const blob = new Blob([new Uint8Array(Math.max(1, Math.min(size, 64)))], { type });
  Object.defineProperties(blob, { name: { value: name }, size: { value: size } });
  return blob;
}

function fakeImageDeps(width = 4000, height = 3000) {
  const calls = { canvases: [], draws: [], encodes: 0 };
  return {
    calls,
    loadImage: async () => ({ source: { width, height }, width, height, close() {} }),
    createCanvas: (w, h) => {
      const canvas = { width: w, height: h, id: calls.canvases.length };
      calls.canvases.push({ width: w, height: h });
      return canvas;
    },
    getContext: (canvas) => ({
      canvas,
      fillRect() {},
      set fillStyle(_) {},
      translate() {}, rotate() {}, scale() {},
      drawImage: (...args) => calls.draws.push(args),
    }),
    canvasToBlob: async (_canvas, mime) => {
      calls.encodes += 1;
      return { size: 1_000_000, type: mime, arrayBuffer: async () => new ArrayBuffer(16) };
    },
  };
}

console.log("File lifecycle");
await test("original Blob cannot be replaced by updateFileAsset", () => {
  const original = new Blob(["original"], { type: "image/png" });
  const asset = createFileAsset(original, { filename: "a.png", kind: "image" });
  assert.throws(() => updateFileAsset(asset, { original: new Blob(["other"]) }), /original file is immutable/i);
  assertOriginalPreserved(asset, original);
});
await test("image metadata records 4000x3000 without changing original", () => {
  const original = new Blob(["x"], { type: "image/jpeg" });
  const asset = attachImageMetadata(createFileAsset(original, { filename: "photo.jpg", kind: "image" }), 4000, 3000);
  assert.equal(asset.width, 4000);
  assert.equal(asset.height, 3000);
  assert.equal(asset.original, original);
});
await test("file signatures detect PDF, JPEG and PNG bytes", async () => {
  const pdf = new Blob([Uint8Array.from([0x25,0x50,0x44,0x46,0x2d,0x31])], { type: "application/pdf" });
  const jpg = new Blob([Uint8Array.from([0xff,0xd8,0xff,0xdb])], { type: "image/jpeg" });
  const png = new Blob([Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])], { type: "image/png" });
  assert.equal(await sniffFileMime(pdf), "application/pdf");
  assert.equal(await sniffFileMime(jpg), "image/jpeg");
  assert.equal(await sniffFileMime(png), "image/png");
  await assertFileSignature(pdf, "application/pdf");
});
await test("empty outputs are rejected", () => {
  assert.throws(() => assertNonEmptyOutput(new Blob([])), /empty/i);
});
await test("output artifact rejects MIME/extension mismatches", () => {
  assert.throws(() => createOutputArtifact({
    data: new Blob(["x"], { type: "application/pdf" }),
    filename: "wrong.jpg",
    mimeType: "application/pdf",
  }), /does not match application\/pdf/i);
});

console.log("Image quality regression");
await test("non-resizing 4000x3000 processing keeps 4000x3000", async () => {
  const deps = fakeImageDeps(4000, 3000);
  const result = await processImage(fakeImageFile(), { format: "jpeg", quality: 0.92 }, deps);
  assert.equal(result.width, 4000);
  assert.equal(result.height, 3000);
  assert.deepEqual(deps.calls.canvases[0], { width: 4000, height: 3000 });
});
await test("90-degree rotation uses one final canvas, not a resize-then-rotate chain", async () => {
  const deps = fakeImageDeps(4000, 3000);
  const result = await rotateImage(fakeImageFile(), { rotation: 90 }, deps);
  assert.equal(result.width, 3000);
  assert.equal(result.height, 4000);
  assert.equal(deps.calls.canvases.length, 1);
  assert.equal(deps.calls.encodes, 1);
});
await test("no-op rotation returns the original without JPEG re-encoding", async () => {
  const file = fakeImageFile();
  const deps = fakeImageDeps(4000, 3000);
  const result = await rotateImage(file, { rotation: 0 }, deps);
  assert.equal(result.blob, file);
  assert.equal(result.retainedOriginal, true);
  assert.equal(deps.calls.encodes, 0);
});

console.log("PDF render quality");
await test("DPR 2 uses 2x backing pixels while CSS size stays unchanged", () => {
  const page = { getViewport: ({ scale }) => ({ width: 600 * scale, height: 800 * scale }) };
  const canvas = { width: 0, height: 0, style: {} };
  const result = prepareCanvasForPdfPage(canvas, page, { scale: 1, devicePixelRatio: 2 });
  assert.equal(canvas.width, 1200);
  assert.equal(canvas.height, 1600);
  assert.equal(canvas.style.width, "600px");
  assert.equal(canvas.style.height, "800px");
  assert.equal(result.outputScale, 2);
});
await test("PDF backing scale obeys memory pixel budget", () => {
  const outputScale = computeOutputScale(2400, 3200, { devicePixelRatio: 4, maxPixels: 16_000_000, maxDimension: 8192 });
  assert.ok(outputScale < 2, `expected capped scale, got ${outputScale}`);
  assert.ok(2400 * 3200 * outputScale * outputScale <= 16_000_001);
});
await test("huge PDF viewport may render below 1x rather than violate the memory budget", () => {
  const outputScale = computeOutputScale(10000, 10000, { devicePixelRatio: 4, maxPixels: 16_000_000, maxDimension: 8192 });
  assert.ok(outputScale < 1);
  assert.ok(10000 * 10000 * outputScale * outputScale <= 16_000_001);
});
await test("PDF raster export DPI is explicit", () => {
  assert.equal(scaleForDpi(72), 1);
  assert.equal(scaleForDpi(150), 150 / 72);
  assert.equal(scaleForDpi(300), 300 / 72);
});

console.log("Scanner quality regression");
await test("scanner rotation preserves full master dimensions", () => {
  assert.deepEqual(dimensionsAfterRotation(4000, 3000, 90), { width: 3000, height: 4000 });
  assert.deepEqual(dimensionsAfterRotation(4000, 3000, 180), { width: 4000, height: 3000 });
});
await test("perspective output is not silently capped at 1800x2400", () => {
  const size = outputSizeForPerspective([[0,0],[4000,0],[4000,3000],[0,3000]]);
  assert.equal(size.width, 4000);
  assert.equal(size.height, 3000);
});
await test("overly large scanner output fails instead of silently downscaling", () => {
  assert.throws(
    () => outputSizeForPerspective([[0,0],[8000,0],[8000,6000],[0,6000]]),
    /too large for safe browser processing/i,
  );
});

console.log("Source-level quality contracts");
await test("PDF rotate remains structural and contains no page raster renderer", () => {
  const source = fs.readFileSync("src/lib/pdf/rotate.js", "utf8");
  assert.match(source, /setRotation/);
  assert.doesNotMatch(source, /canvas|toDataURL|toBlob|drawImage/);
});
await test("scanner exports from outputBlob, not previewData/sourceData", () => {
  const source = fs.readFileSync("src/tools/scanner/SmartDocumentScanner.jsx", "utf8");
  assert.match(source, /pageData\.outputBlob/);
  assert.match(source, /Page masters are stored losslessly as PNG/);
  assert.doesNotMatch(source, /const sourceData = canvas\.toDataURL/);
  assert.doesNotMatch(source, /Math\.round\(u\).*Math\.round\(v\)/s);
});
await test("PDF viewer uses shared DPR-aware render architecture", () => {
  const viewer = fs.readFileSync("src/tools/office/PdfViewer.jsx", "utf8");
  const pageView = fs.readFileSync("src/tools/office/pdf-reader/PdfPageView.jsx", "utf8");
  assert.match(pageView, /beginPdfPageRender/);
  assert.match(viewer, /Download original/i);
  assert.doesNotMatch(pageView, /canvas\.width = Math\.max\(1, Math\.round\(viewport\.width\)\)/);
});
await test("PDF viewer thumbnails are lazy navigation-only renders", () => {
  const viewer = fs.readFileSync("src/tools/office/PdfViewer.jsx", "utf8");
  const thumbnail = fs.readFileSync("src/tools/office/pdf-reader/PdfThumbnail.jsx", "utf8");
  assert.match(thumbnail, /IntersectionObserver/);
  assert.match(thumbnail, /renderPdfThumbnail/);
  assert.match(thumbnail, /revokeObjectURL/);
  assert.doesNotMatch(viewer, /Math\.min\(loaded\.numPages, 80\)/);
});
await test("searchable-PDF OCR preserves original PDF pages instead of rebuilding them from PNG screenshots", () => {
  const source = fs.readFileSync("src/tools/expanded/ExpandedTool.jsx", "utf8");
  const match = source.match(/async function makeSearchablePdf\(bytes\)\{([\s\S]*?)\nfunction PdfAdvanced/);
  assert.ok(match, "makeSearchablePdf implementation should be present");
  const body = match[1];
  assert.match(body, /PDFDocument\.load\(bytes\.slice\(\)\)/);
  assert.doesNotMatch(body, /embedPng|drawImage\(/);
});

console.log(`\n${passed} quality architecture tests passed.`);
if (process.exitCode === 1) process.exitCode = 1;
