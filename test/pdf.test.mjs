import assert from "node:assert/strict";
import fs from "node:fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { loadPdfDocument, parsePageRanges, formatBytes } from "../src/lib/pdf/core.js";
import { mergePdfs } from "../src/lib/pdf/merge.js";
import { splitPdf } from "../src/lib/pdf/split.js";
import { getPdfPageCount } from "../src/lib/pdf/pageCount.js";
import { rotatePdf } from "../src/lib/pdf/rotate.js";
import { deletePdfPages } from "../src/lib/pdf/deletePages.js";
import { extractPdfPages } from "../src/lib/pdf/extractPages.js";
import { reorderPdfPages } from "../src/lib/pdf/reorderPages.js";
import { addWatermark } from "../src/lib/pdf/watermark.js";
import { getPdfMetadata } from "../src/lib/pdf/metadata.js";
import { compressPdf } from "../src/lib/pdf/compress.js";
import { imagesToPdf } from "../src/lib/pdf/imageToPdf.js";

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}`);
    console.error(`    ${err.stack || err.message}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------- fixtures
async function makePdf(pageCount, { withMetadata = false, label = "Page" } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  if (withMetadata) {
    doc.setTitle("Test Document");
    doc.setAuthor("MZ Solutions Test Suite");
    doc.setSubject("Unit testing");
  }
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`${label} ${i + 1}`, { x: 20, y: 350, size: 20, font, color: rgb(0, 0, 0) });
  }
  return doc.save();
}

async function makeJpegBytes() {
  return Uint8Array.from(Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9k=", "base64"));
}

async function makePngBytes() {
  return Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
}

// ---------------------------------------------------------------- tests
console.log("Core helpers");
await test("parsePageRanges: mixed ranges and singles", () => {
  assert.deepEqual(parsePageRanges("1-3,5,8-9", 10), [0, 1, 2, 4, 7, 8]);
});
await test("parsePageRanges: rejects out-of-range page", () => {
  assert.throws(() => parsePageRanges("1-3,20", 10));
});
await test("parsePageRanges: rejects garbage input", () => {
  assert.throws(() => parsePageRanges("abc", 10));
});
await test("formatBytes: formats sizes", () => {
  assert.equal(formatBytes(500), "500 B");
  assert.equal(formatBytes(2048), "2.00 KB");
});
await test("loadPdfDocument: rejects corrupt bytes", async () => {
  await assert.rejects(() => loadPdfDocument(new Uint8Array([1, 2, 3, 4, 5])));
});

console.log("Page Counter");
await test("counts pages correctly for 1, 5, 12 page PDFs", async () => {
  assert.equal(await getPdfPageCount(await makePdf(1)), 1);
  assert.equal(await getPdfPageCount(await makePdf(5)), 5);
  assert.equal(await getPdfPageCount(await makePdf(12)), 12);
});

console.log("Merge PDF");
await test("merges 3 PDFs into one with combined page count", async () => {
  const a = await makePdf(2, { label: "A" });
  const b = await makePdf(3, { label: "B" });
  const c = await makePdf(1, { label: "C" });
  const mergedBytes = await mergePdfs([a, b, c]);
  assert.equal(await getPdfPageCount(mergedBytes), 6);
});
await test("rejects fewer than 2 files", async () => {
  const single = await makePdf(1);
  await assert.rejects(() => mergePdfs([single]));
});
await test("rejects a corrupt file among valid ones with a clear message", async () => {
  const a = await makePdf(2);
  await assert.rejects(
    () => mergePdfs([a, new Uint8Array([9, 9, 9])]),
    /File #2/
  );
});

console.log("Split PDF");
await test("splits into correct groups with correct page counts", async () => {
  const pdf = await makePdf(6);
  const parts = await splitPdf(pdf, "1-2,3-4,5-6");
  assert.equal(parts.length, 3);
  assert.equal(await getPdfPageCount(parts[0].bytes), 2);
  assert.equal(await getPdfPageCount(parts[1].bytes), 2);
  assert.equal(await getPdfPageCount(parts[2].bytes), 2);
});
await test("rejects empty range input", async () => {
  const pdf = await makePdf(3);
  await assert.rejects(() => splitPdf(pdf, ""));
});

console.log("Rotate PDF");
await test("rotates all pages by 90", async () => {
  const pdf = await makePdf(3);
  const rotated = await rotatePdf(pdf, 90, "all");
  const doc = await PDFDocument.load(rotated);
  doc.getPages().forEach((p) => assert.equal(p.getRotation().angle, 90));
});
await test("rotates only specified pages", async () => {
  const pdf = await makePdf(3);
  const rotated = await rotatePdf(pdf, 180, "2");
  const doc = await PDFDocument.load(rotated);
  assert.equal(doc.getPage(0).getRotation().angle, 0);
  assert.equal(doc.getPage(1).getRotation().angle, 180);
  assert.equal(doc.getPage(2).getRotation().angle, 0);
});
await test("rejects invalid rotation amount", async () => {
  const pdf = await makePdf(2);
  await assert.rejects(() => rotatePdf(pdf, 45, "all"));
});

console.log("Delete PDF Pages");
await test("deletes specified pages", async () => {
  const pdf = await makePdf(5);
  const result = await deletePdfPages(pdf, "2,4");
  assert.equal(await getPdfPageCount(result), 3);
});
await test("rejects deleting every page", async () => {
  const pdf = await makePdf(2);
  await assert.rejects(() => deletePdfPages(pdf, "1-2"));
});

console.log("Extract PDF Pages");
await test("extracts specified pages only", async () => {
  const pdf = await makePdf(6);
  const result = await extractPdfPages(pdf, "2,4-5");
  assert.equal(await getPdfPageCount(result), 3);
});

console.log("Reorder PDF Pages");
await test("reorders pages per given permutation", async () => {
  const pdf = await makePdf(3, { label: "Page" });
  const reordered = await reorderPdfPages(pdf, [2, 0, 1]);
  assert.equal(await getPdfPageCount(reordered), 3);
});
await test("rejects a non-permutation order", async () => {
  const pdf = await makePdf(3);
  await assert.rejects(() => reorderPdfPages(pdf, [0, 0, 1]));
});
await test("rejects wrong-length order", async () => {
  const pdf = await makePdf(3);
  await assert.rejects(() => reorderPdfPages(pdf, [0, 1]));
});

console.log("Add Watermark");
await test("adds watermark without throwing and preserves page count", async () => {
  const pdf = await makePdf(2);
  const watermarked = await addWatermark(pdf, "CONFIDENTIAL");
  assert.equal(await getPdfPageCount(watermarked), 2);
});
await test("rejects empty watermark text", async () => {
  const pdf = await makePdf(1);
  await assert.rejects(() => addWatermark(pdf, "   "));
});

console.log("PDF Metadata Viewer");
await test("reads title/author/subject when present", async () => {
  const pdf = await makePdf(4, { withMetadata: true });
  const meta = await getPdfMetadata(pdf);
  assert.equal(meta.title, "Test Document");
  assert.equal(meta.author, "MZ Solutions Test Suite");
  assert.equal(meta.pageCount, 4);
});
await test("shows placeholder for missing metadata", async () => {
  const pdf = await makePdf(1);
  const meta = await getPdfMetadata(pdf);
  assert.equal(meta.title, "—");
});

console.log("Compress PDF");
await test("compression preserves page count and reports real sizes", async () => {
  const pdf = await makePdf(5);
  const result = await compressPdf(pdf);
  assert.equal(await getPdfPageCount(result.bytes), 5);
  assert.ok(result.originalSize > 0);
  assert.ok(result.compressedSize > 0);
  assert.ok(result.percentSaved >= 0);
  assert.equal(result.validated, true);
  assert.equal(result.pageCount, 5);
  assert.ok(result.compressedSize <= result.originalSize, "compressor must never return a larger file as compressed output");
  if (!result.compressed) {
    assert.equal(result.strategy, "original-retained");
    assert.deepEqual(result.bytes, pdf);
  }
});
await test("raster compression preserves pages and uses the supplied quality preset", async () => {
  const pdf = await makePdf(3);
  const jpg = await makeJpegBytes();
  const calls = [];
  const result = await compressPdf(pdf, { quality: "high", renderPage: async (index, preset) => {
    calls.push({ index, preset });
    return { bytes: jpg, width: 1, height: 1 };
  }});
  assert.equal(await getPdfPageCount(result.bytes), 3);
  assert.ok(["rasterized", "lossless-fallback", "original-retained"].includes(result.strategy));
  assert.equal(result.validated, true);
  assert.equal(result.pageCount, 3);
  assert.ok(result.compressedSize <= result.originalSize, "quality compression must never return a larger output");
  assert.deepEqual(calls.map((x) => x.index), [0, 1, 2]);
  assert.equal(calls[0].preset.jpegQuality, 0.68);
  assert.ok(Math.abs(calls[0].preset.scale - (96 / 72)) < 1e-9, "Small File mode should rasterize at 96 DPI");
});
await test("rejects unknown compression quality", async () => {
  const pdf = await makePdf(1);
  await assert.rejects(() => compressPdf(pdf, { quality: "extreme" }), /valid compression quality/i);
});

console.log("Image to PDF");
await test("converts a single JPG to a 1-page PDF", async () => {
  const jpg = await makeJpegBytes();
  const pdfBytes = await imagesToPdf([{ bytes: jpg, type: "image/jpeg" }]);
  assert.equal(await getPdfPageCount(pdfBytes), 1);
});
await test("converts multiple mixed JPG+PNG into a multi-page PDF", async () => {
  const jpg = await makeJpegBytes();
  const png = await makePngBytes();
  const pdfBytes = await imagesToPdf([
    { bytes: jpg, type: "image/jpeg" },
    { bytes: png, type: "image/png" },
  ]);
  assert.equal(await getPdfPageCount(pdfBytes), 2);
});
await test("rejects empty image list", async () => {
  await assert.rejects(() => imagesToPdf([]));
});
await test("rejects unsupported image type with clear message", async () => {
  const jpg = await makeJpegBytes();
  await assert.rejects(() => imagesToPdf([{ bytes: jpg, type: "image/gif" }]), /Image #1/);
});
await test("browser compressor preserves its source buffer for pdf-lib", async () => {
  const source = fs.readFileSync(new URL("../src/tools/pdf/CompressPdf.jsx", import.meta.url), "utf8");
  assert.match(source, /getDocument\(\{ data: bytes\.slice\(\) \}\)/);
});

console.log(`\n${passed} tests passed.`);
if (process.exitCode === 1) {
  console.error("\nSome tests FAILED. See above.");
} else {
  console.log("All PDF logic tests passed against real generated PDF/image files.");
}
