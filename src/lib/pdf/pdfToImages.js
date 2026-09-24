// Browser-only PDF-to-raster export. Viewing uses ./rendering.js instead.
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { scaleForDpi } from "./rendering.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/**
 * Explicit raster export. `dpi` is preferred over the legacy `scale` option so
 * output resolution is a user/tool decision rather than a screen-preview size.
 * Returns [{ pageNumber, blob, width, height, dpi }].
 */
export async function renderPdfPagesToImages(bytes, {
  format = "image/jpeg",
  quality = 0.92,
  dpi = 150,
  scale,
  maxPixelsPerPage = 40_000_000,
  onProgress,
  pageNumbers = null,
} = {}) {
  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  } catch {
    throw new Error("This file doesn't look like a valid PDF, or it may be corrupted.");
  }

  const renderScale = Number.isFinite(scale) ? scale : scaleForDpi(dpi);
  const requestedPages = pageNumbers == null
    ? Array.from({ length: pdf.numPages }, (_, index) => index + 1)
    : [...new Set(pageNumbers.map(Number))].filter((pageNumber) => Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= pdf.numPages);
  if (!requestedPages.length) {
    try { await pdf.destroy?.(); } catch { /* best-effort cleanup */ }
    throw new Error("Select at least one valid PDF page to convert.");
  }

  const results = [];
  try {
    for (let requestIndex = 0; requestIndex < requestedPages.length; requestIndex += 1) {
      const pageNumber = requestedPages[requestIndex];
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: renderScale });
      const pixels = viewport.width * viewport.height;
      if (pixels > maxPixelsPerPage) {
        throw new Error(`Page ${pageNumber} would require ${Math.round(pixels / 1_000_000)} megapixels at this resolution. Choose a lower DPI to avoid running out of memory.`);
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      const context = canvas.getContext("2d", { alpha: format === "image/png" });
      if (!context) throw new Error(`Could not create a rendering surface for page ${pageNumber}.`);
      if (format === "image/jpeg") {
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, format === "image/png" ? undefined : quality));
      if (!blob) throw new Error(`Could not render page ${pageNumber} to an image.`);

      results.push({ pageNumber, blob, width: canvas.width, height: canvas.height, dpi: Number.isFinite(scale) ? Math.round(scale * 72) : dpi });
      onProgress?.(requestIndex + 1, requestedPages.length, pageNumber);
      page.cleanup?.();
    }
  } finally {
    try { await pdf.destroy?.(); } catch { /* best-effort cleanup */ }
  }

  return results;
}
