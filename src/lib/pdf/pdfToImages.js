// Browser-only: renders PDF pages to raster images using pdfjs-dist + the
// native <canvas> element. This module is not used during SSR/Node builds.
import * as pdfjsLib from "pdfjs-dist";
// Vite-specific `?url` import resolves to the built worker file's URL so it
// can be bundled and served correctly in production.
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/**
 * bytes: Uint8Array of the PDF
 * format: "image/jpeg" | "image/png"
 * scale: render scale (2 = ~144 DPI-ish, good default for readability)
 * onProgress: (current, total) => void
 * Returns [{ pageNumber, blob }]
 */
export async function renderPdfPagesToImages(bytes, { format = "image/jpeg", quality = 0.92, scale = 2, onProgress } = {}) {
  let pdf;
  try {
    // pdfjs mutates the buffer it's given in some versions; pass a copy.
    pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  } catch {
    throw new Error("This file doesn't look like a valid PDF, or it may be corrupted.");
  }

  const results = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");

    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, quality));
    if (!blob) throw new Error(`Could not render page ${pageNumber} to an image.`);

    results.push({ pageNumber, blob });
    onProgress?.(pageNumber, pdf.numPages);
  }

  return results;
}
