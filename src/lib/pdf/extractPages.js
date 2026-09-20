import { PDFDocument } from "pdf-lib";
import { loadPdfDocument, parsePageRanges } from "./core.js";

export async function extractPdfPages(bytes, pagesInput) {
  const doc = await loadPdfDocument(bytes);
  const pageCount = doc.getPageCount();
  const indices = parsePageRanges(pagesInput, pageCount);

  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, indices);
  pages.forEach((p) => out.addPage(p));

  return out.save();
}
