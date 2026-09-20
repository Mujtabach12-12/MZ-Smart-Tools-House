import { PDFDocument } from "pdf-lib";
import { loadPdfDocument, parsePageRanges } from "./core.js";

/**
 * Splits a PDF into multiple PDFs by comma-separated page ranges (e.g. "1-3,4-6").
 * Returns [{ label, bytes }]
 */
export async function splitPdf(bytes, rangesInput) {
  const doc = await loadPdfDocument(bytes);
  const pageCount = doc.getPageCount();

  const groups = String(rangesInput)
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  if (groups.length === 0) throw new Error("Enter at least one page range to split by.");

  const results = [];
  for (const group of groups) {
    const indices = parsePageRanges(group, pageCount);
    const out = await PDFDocument.create();
    const pages = await out.copyPages(doc, indices);
    pages.forEach((p) => out.addPage(p));
    const outBytes = await out.save();
    results.push({ label: group, bytes: outBytes, pageCount: indices.length });
  }

  return results;
}
