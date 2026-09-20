import { loadPdfDocument, parsePageRanges } from "./core.js";

export async function deletePdfPages(bytes, pagesInput) {
  const doc = await loadPdfDocument(bytes);
  const pageCount = doc.getPageCount();
  const toDelete = parsePageRanges(pagesInput, pageCount);

  if (toDelete.length >= pageCount) {
    throw new Error("You cannot delete every page — the PDF must have at least one page left.");
  }

  // Remove from highest index to lowest so earlier removals don't shift later indices.
  [...toDelete].sort((a, b) => b - a).forEach((i) => doc.removePage(i));

  return doc.save();
}
