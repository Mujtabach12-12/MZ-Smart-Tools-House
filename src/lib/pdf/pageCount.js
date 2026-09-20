import { loadPdfDocument } from "./core.js";

export async function getPdfPageCount(bytes) {
  const doc = await loadPdfDocument(bytes);
  return doc.getPageCount();
}
