/**
 * Bridges the image tools to the Phase 3 PDF writer.
 *
 * pdf-lib can only embed JPEG and PNG. WebP/GIF/BMP inputs are therefore
 * re-encoded to JPEG through the same injectable canvas renderer the rest of
 * the image tools use, so "Image to PDF" accepts every format the other tools
 * do without pretending pdf-lib supports them.
 */

import { imagesToPdf, PAGE_SIZES, computePageLayout } from "../pdf/imageToPdf.js";
import { assertSupportedImage, SUPPORTED_INPUT_MIMES } from "./core.js";
import { processImage } from "./process.js";

export { PAGE_SIZES, computePageLayout };

/** Formats pdf-lib can embed directly, without a re-encode pass. */
export const DIRECTLY_EMBEDDABLE = ["image/jpeg", "image/jpg", "image/png"];

export function needsReEncoding(mimeType) {
  return !DIRECTLY_EMBEDDABLE.includes(String(mimeType || "").toLowerCase());
}

/**
 * Converts one file into `{ bytes, type }` ready for `imagesToPdf`.
 * Already-embeddable files are passed through untouched, which keeps PNG
 * transparency and avoids a needless generation loss on JPEGs.
 */
export async function prepareImageForPdf(file, deps, { quality = 0.92 } = {}) {
  assertSupportedImage(file, SUPPORTED_INPUT_MIMES);

  if (!needsReEncoding(file.type)) {
    const buffer = await file.arrayBuffer();
    return { bytes: new Uint8Array(buffer), type: file.type === "image/jpg" ? "image/jpeg" : file.type, reEncoded: false };
  }

  const result = await processImage(file, { format: "jpeg", quality, background: "#ffffff" }, deps);
  const buffer = await result.blob.arrayBuffer();
  return { bytes: new Uint8Array(buffer), type: "image/jpeg", reEncoded: true };
}

/**
 * Full pipeline: files -> PDF bytes.
 * `onProgress(done, total)` is called after each image so the UI can show a
 * progress bar on large batches.
 */
export async function imageFilesToPdf(files, deps, { pageSize = "auto", orientation = "auto", margin = 0, quality = 0.92, onProgress } = {}) {
  const list = Array.from(files || []);
  if (list.length === 0) throw new Error("Add at least one image.");

  const prepared = [];
  for (const [index, file] of list.entries()) {
    prepared.push(await prepareImageForPdf(file, deps, { quality }));
    onProgress?.(index + 1, list.length);
  }

  return imagesToPdf(prepared, { pageSize, orientation, margin });
}
