import { assertFileSignature } from "../files/signatures.js";
import { validatePdfOutput, createOutputArtifact } from "../files/outputValidation.js";
import { fileToUint8Array } from "../download.js";
import { loadPdfDocument } from "./core.js";

export const DEFAULT_PDF_BROWSER_LIMIT = 100 * 1024 * 1024;

export function stripPdfExtension(filename = "document.pdf") {
  const cleaned = String(filename || "document.pdf").trim() || "document.pdf";
  return cleaned.replace(/\.pdf$/i, "") || "document";
}

export function makePdfOutputName(filename, suffix) {
  const base = stripPdfExtension(filename);
  const safeSuffix = String(suffix || "output").replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "") || "output";
  return `${base}-${safeSuffix}.pdf`;
}

export function makePageImageName(filename, pageNumber, extension) {
  const base = stripPdfExtension(filename);
  return `${base}-page-${String(pageNumber).padStart(2, "0")}.${extension}`;
}

export async function inspectPdfFile(file, { maxBytes = DEFAULT_PDF_BROWSER_LIMIT } = {}) {
  if (!(file instanceof Blob)) throw new Error("Choose a PDF file first.");
  if (!(file.size > 0)) throw new Error("The selected PDF is empty (0 bytes).");
  if (file.size > maxBytes) {
    const mb = Math.ceil(maxBytes / (1024 * 1024));
    throw new Error(`This PDF is too large for safe browser processing on this device. Please use a file smaller than ${mb} MB.`);
  }
  await assertFileSignature(file, "application/pdf");
  const bytes = await fileToUint8Array(file);
  const doc = await loadPdfDocument(bytes);
  const pageCount = doc.getPageCount();
  if (!(pageCount > 0)) throw new Error("This PDF does not contain any readable pages.");
  return { file, bytes, pageCount, size: file.size, name: file.name || "document.pdf" };
}

export async function buildValidatedPdfArtifact(bytes, {
  sourceName,
  suffix,
  expectedPageCount,
  metadata = {},
} = {}) {
  const validation = await validatePdfOutput(bytes, { expectedPageCount });
  return createOutputArtifact({
    data: bytes,
    filename: makePdfOutputName(sourceName, suffix),
    mimeType: "application/pdf",
    pageCount: validation.pageCount,
    metadata: { ...metadata, validated: true, size: validation.size },
  });
}

export async function validatePdfFileOutput(blobOrBytes, expectedPageCount) {
  return validatePdfOutput(blobOrBytes, { expectedPageCount });
}

export async function loadPdfJsDocument(bytes) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  try {
    const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
    const doc = await loadingTask.promise;
    return { pdfjs, doc };
  } catch (error) {
    if (error?.name === "PasswordException" || /password|encrypted/i.test(String(error?.message || ""))) {
      throw new Error("This PDF appears to be password protected. Unlock it before using this tool.");
    }
    throw new Error("This PDF could not be opened. It may be corrupted or incomplete.");
  }
}

export function selectedPagesToRangeInput(selectedPages) {
  const sorted = [...new Set((selectedPages || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b);
  if (!sorted.length) return "";
  const chunks = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i += 1) {
    const value = sorted[i];
    if (value === prev + 1) {
      prev = value;
      continue;
    }
    chunks.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = value;
    prev = value;
  }
  return chunks.join(",");
}

export function buildSplitRangeGroups(mode, pageCount, { ranges = "", everyN = 1, selectedPages = [] } = {}) {
  if (!(pageCount > 0)) throw new Error("PDF page count is unavailable.");
  if (mode === "ranges") return String(ranges || "").trim();
  if (mode === "every-page") return Array.from({ length: pageCount }, (_, i) => String(i + 1)).join(",");
  if (mode === "every-n") {
    const size = Math.max(1, Math.min(pageCount, Math.trunc(Number(everyN) || 1)));
    const groups = [];
    for (let start = 1; start <= pageCount; start += size) groups.push(`${start}-${Math.min(pageCount, start + size - 1)}`);
    return groups.join(",");
  }
  if (mode === "selected") {
    const selection = selectedPagesToRangeInput(selectedPages);
    if (!selection) throw new Error("Select at least one page to split.");
    return selection.split(",").join(",");
  }
  throw new Error("Choose a valid split mode.");
}
