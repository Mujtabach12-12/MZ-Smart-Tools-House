import { sniffFileMime } from "./signatures.js";

const MIME_EXTENSIONS = {
  "application/pdf": new Set(["pdf"]),
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
  "image/gif": new Set(["gif"]),
  "image/bmp": new Set(["bmp"]),
  "text/plain": new Set(["txt"]),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": new Set(["docx"]),
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": new Set(["xlsx"]),
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": new Set(["pptx"]),
};

function extensionOf(filename = "") {
  const match = String(filename).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

export function validateOutputFilename(filename, mimeType) {
  if (!filename) throw new Error("Output filename is required.");
  const allowed = MIME_EXTENSIONS[mimeType];
  if (!allowed) return true;
  const extension = extensionOf(filename);
  if (!allowed.has(extension)) {
    throw new Error(`Output filename extension .${extension || "(none)"} does not match ${mimeType}.`);
  }
  return true;
}

export function assertNonEmptyOutput(value, label = "Output") {
  const size = value instanceof Blob ? value.size : value?.byteLength ?? value?.length ?? 0;
  if (!(size > 0)) throw new Error(`${label} is empty and cannot be downloaded.`);
  return size;
}

export function assertMime(value, expectedMime) {
  if (!expectedMime || !(value instanceof Blob)) return true;
  if (value.type && value.type !== expectedMime) {
    throw new Error(`Output MIME type is ${value.type}, expected ${expectedMime}.`);
  }
  return true;
}

export async function validateImageOutput(blob, {
  expectedMime,
  expectedWidth,
  expectedHeight,
  decodeImage,
  preserveDimensions = false,
} = {}) {
  assertNonEmptyOutput(blob, "Image output");
  assertMime(blob, expectedMime);
  const sniffed = await sniffFileMime(blob);
  if (expectedMime && sniffed && sniffed !== expectedMime) {
    throw new Error(`Encoded image signature is ${sniffed}, expected ${expectedMime}.`);
  }
  if (typeof decodeImage !== "function") {
    return { valid: true, mime: sniffed || blob.type, width: null, height: null };
  }
  const decoded = await decodeImage(blob);
  try {
    if (!(decoded?.width > 0) || !(decoded?.height > 0)) {
      throw new Error("The output image could not be decoded.");
    }
    if (preserveDimensions && (decoded.width !== expectedWidth || decoded.height !== expectedHeight)) {
      throw new Error(`Output dimensions changed unexpectedly from ${expectedWidth} × ${expectedHeight} to ${decoded.width} × ${decoded.height}.`);
    }
    if (expectedWidth && decoded.width !== expectedWidth) throw new Error(`Output width is ${decoded.width}px; expected ${expectedWidth}px.`);
    if (expectedHeight && decoded.height !== expectedHeight) throw new Error(`Output height is ${decoded.height}px; expected ${expectedHeight}px.`);
    return { valid: true, mime: sniffed || blob.type, width: decoded.width, height: decoded.height };
  } finally {
    decoded?.close?.();
  }
}

export async function validatePdfOutput(bytesOrBlob, { expectedPageCount } = {}) {
  assertNonEmptyOutput(bytesOrBlob, "PDF output");
  const blob = bytesOrBlob instanceof Blob
    ? bytesOrBlob
    : new Blob([bytesOrBlob], { type: "application/pdf" });
  const sniffed = await sniffFileMime(blob);
  if (sniffed !== "application/pdf") throw new Error("Generated output is not a valid PDF file signature.");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const { loadPdfDocument } = await import("../pdf/core.js");
  const doc = await loadPdfDocument(bytes);
  const pageCount = doc.getPageCount();
  if (expectedPageCount != null && pageCount !== expectedPageCount) {
    throw new Error(`PDF page count changed unexpectedly: expected ${expectedPageCount}, got ${pageCount}.`);
  }
  return { valid: true, pageCount, size: blob.size, mime: "application/pdf" };
}


const OOXML_REQUIRED_ENTRIES = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["[Content_Types].xml", "word/document.xml"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["[Content_Types].xml", "xl/workbook.xml"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["[Content_Types].xml", "ppt/presentation.xml"],
};

export async function validateOoxmlOutput(value, expectedMime) {
  const size = assertNonEmptyOutput(value, "Office output");
  const required = OOXML_REQUIRED_ENTRIES[expectedMime];
  if (!required) throw new Error(`Unsupported Office output MIME type: ${expectedMime || "unknown"}.`);
  const bytes = value instanceof Blob ? new Uint8Array(await value.arrayBuffer()) : value instanceof Uint8Array ? value : new Uint8Array(value);
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("Generated Office output is not a valid ZIP/OOXML container.");
  }
  const JSZip = (await import("jszip")).default;
  let zip;
  try { zip = await JSZip.loadAsync(bytes); }
  catch { throw new Error("Generated Office output could not be opened as an OOXML document."); }
  for (const entry of required) {
    if (!zip.file(entry)) throw new Error(`Generated Office output is missing required entry: ${entry}.`);
  }
  return { valid: true, size, mime: expectedMime };
}

export function createOutputArtifact({ data, filename, mimeType, width = null, height = null, pageCount = null, metadata = {} }) {
  assertNonEmptyOutput(data, "Output");
  const resolvedMime = mimeType || (data instanceof Blob ? data.type : "application/octet-stream");
  validateOutputFilename(filename, resolvedMime);
  return { data, filename, mimeType: resolvedMime, width, height, pageCount, metadata };
}
