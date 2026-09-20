import { PDFDocument } from "pdf-lib";
import { loadPdfDocument } from "./core.js";

/**
 * newOrder: 0-based indices describing the desired page order.
 * Must be a permutation of [0, pageCount).
 */
export async function reorderPdfPages(bytes, newOrder) {
  const doc = await loadPdfDocument(bytes);
  const pageCount = doc.getPageCount();

  if (!Array.isArray(newOrder) || newOrder.length !== pageCount) {
    throw new Error("The new page order must include every page exactly once.");
  }
  const seen = new Set(newOrder);
  if (seen.size !== pageCount || [...seen].some((i) => i < 0 || i >= pageCount)) {
    throw new Error("The new page order must include every page exactly once.");
  }

  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, newOrder);
  pages.forEach((p) => out.addPage(p));

  return out.save();
}
