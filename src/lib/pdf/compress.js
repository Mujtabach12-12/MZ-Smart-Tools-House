import { PDFDocument } from "pdf-lib";
import { loadPdfDocument } from "./core.js";

export const PDF_COMPRESSION_PRESETS = Object.freeze({
  low: { label: "Low compression", scale: 1.75, jpegQuality: 0.86 },
  medium: { label: "Medium compression", scale: 1.4, jpegQuality: 0.7 },
  high: { label: "High compression", scale: 1.05, jpegQuality: 0.5 },
});

function byteLength(value) {
  return value?.byteLength ?? value?.length ?? 0;
}

function buildReport(originalBytes, candidateBytes, strategy, candidateStrategy = strategy) {
  const originalSize = byteLength(originalBytes);
  const candidateSize = byteLength(candidateBytes);
  const compressed = candidateSize > 0 && candidateSize < originalSize;
  const bytes = compressed ? candidateBytes : originalBytes;
  const compressedSize = byteLength(bytes);
  const difference = originalSize - compressedSize;

  return {
    bytes,
    originalSize,
    compressedSize,
    candidateSize,
    percentSaved:
      originalSize > 0 && difference > 0
        ? Number(((difference / originalSize) * 100).toFixed(1))
        : 0,
    compressed,
    retainedOriginal: !compressed,
    strategy: compressed ? strategy : "original-retained",
    candidateStrategy,
  };
}

/**
 * Compress a PDF without ever pretending that a larger candidate is a
 * successful compression. The returned `bytes` are guaranteed to be no larger
 * than the input. If no smaller candidate can be produced, the original bytes
 * are returned with `compressed: false` and `strategy: "original-retained"`.
 *
 * Low mode re-saves the PDF with object streams and keeps vectors, text, links
 * and forms intact. Medium/high modes render pages to JPEG and can reduce
 * scan/image-heavy PDFs substantially, but flatten interactive/selectable
 * content. For those modes we also compute the lossless candidate and choose
 * the smallest real result among rasterized, lossless and original bytes.
 */
export async function compressPdf(bytes, { quality = "low", renderPage } = {}) {
  if (!PDF_COMPRESSION_PRESETS[quality]) {
    throw new Error("Choose a valid compression quality.");
  }

  const doc = await loadPdfDocument(bytes);
  const losslessBytes = await doc.save({ useObjectStreams: true });

  if (quality === "low") {
    const report = buildReport(bytes, losslessBytes, "lossless");
    const verified = await loadPdfDocument(report.bytes);
    if (verified.getPageCount() !== doc.getPageCount()) {
      throw new Error("Compressed PDF validation failed because the page count changed.");
    }
    return { ...report, validated: true, pageCount: verified.getPageCount() };
  }

  if (typeof renderPage !== "function") {
    throw new Error("Medium and high compression require the browser page renderer.");
  }

  const output = await PDFDocument.create();
  const preset = PDF_COMPRESSION_PRESETS[quality];
  for (let index = 0; index < doc.getPageCount(); index += 1) {
    const rendered = await renderPage(index, preset);
    if (!rendered?.bytes?.length || !(rendered.width > 0) || !(rendered.height > 0)) {
      throw new Error(`Page ${index + 1} could not be rendered for compression.`);
    }
    const image = await output.embedJpg(rendered.bytes);
    const sourcePage = doc.getPage(index);
    const { width, height } = sourcePage.getSize();
    const page = output.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }

  const rasterBytes = await output.save({ useObjectStreams: true });
  const rasterSize = byteLength(rasterBytes);
  const losslessSize = byteLength(losslessBytes);

  const report = losslessSize <= rasterSize
    ? buildReport(bytes, losslessBytes, "lossless-fallback", "rasterized")
    : buildReport(bytes, rasterBytes, "rasterized");

  const verified = await loadPdfDocument(report.bytes);
  if (verified.getPageCount() !== doc.getPageCount()) {
    throw new Error("Compressed PDF validation failed because the page count changed.");
  }
  return { ...report, validated: true, pageCount: verified.getPageCount() };
}
