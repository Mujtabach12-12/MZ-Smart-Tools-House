import { PDFDocument } from "pdf-lib";
import { loadPdfDocument } from "./core.js";

/**
 * files: Uint8Array[] (in the order they should be merged)
 * Returns merged PDF bytes.
 */
export async function mergePdfs(files) {
  if (!Array.isArray(files) || files.length < 2) {
    throw new Error("Add at least two PDF files to merge.");
  }

  const merged = await PDFDocument.create();

  for (const [i, bytes] of files.entries()) {
    let doc;
    try {
      doc = await loadPdfDocument(bytes);
    } catch (err) {
      throw new Error(`File #${i + 1}: ${err.message}`);
    }
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }

  return merged.save();
}
