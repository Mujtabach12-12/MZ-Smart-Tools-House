/**
 * PDF reader interaction helpers.
 *
 * These helpers deliberately operate on view state only. They never mutate or
 * rebuild the source PDF. Rendering remains delegated to PDF.js + the Phase 3
 * DPR-aware rendering foundation.
 */

export const PDF_READER_MIN_ZOOM = 0.35;
export const PDF_READER_MAX_ZOOM = 4;
export const PDF_READER_ZOOM_STEP = 0.15;

export function clampPdfZoom(value, min = PDF_READER_MIN_ZOOM, max = PDF_READER_MAX_ZOOM) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(min, Math.min(max, numeric));
}

export function calculatePdfFitScale({
  pageWidth,
  pageHeight,
  availableWidth,
  availableHeight,
  mode = "width",
  horizontalPadding = 24,
  verticalPadding = 24,
} = {}) {
  const width = Number(pageWidth);
  const height = Number(pageHeight);
  const hostWidth = Number(availableWidth);
  const hostHeight = Number(availableHeight);
  if (!(width > 0) || !(height > 0) || !(hostWidth > 0) || !(hostHeight > 0)) {
    throw new Error("PDF fit dimensions are invalid.");
  }
  const usableWidth = Math.max(1, hostWidth - Math.max(0, horizontalPadding));
  const usableHeight = Math.max(1, hostHeight - Math.max(0, verticalPadding));
  const widthScale = usableWidth / width;
  const pageScale = Math.min(widthScale, usableHeight / height);
  return clampPdfZoom(mode === "page" ? pageScale : widthScale);
}

export function normalizePdfPageInput(value, pageCount, fallback = 1) {
  const count = Math.max(1, Math.trunc(Number(pageCount) || 1));
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return Math.max(1, Math.min(count, fallback));
  return Math.max(1, Math.min(count, Math.trunc(numeric)));
}

export function countTextOccurrences(text, query) {
  const source = String(text || "").toLocaleLowerCase();
  const needle = String(query || "").trim().toLocaleLowerCase();
  if (!needle) return 0;
  let count = 0;
  let cursor = 0;
  while (cursor <= source.length - needle.length) {
    const found = source.indexOf(needle, cursor);
    if (found < 0) break;
    count += 1;
    cursor = found + Math.max(1, needle.length);
  }
  return count;
}

export function nextZoomLevel(current, direction = 1) {
  const zoom = clampPdfZoom(current);
  const delta = PDF_READER_ZOOM_STEP * (direction < 0 ? -1 : 1);
  return clampPdfZoom(Math.round((zoom + delta) * 100) / 100);
}

export function friendlyPdfOpenError(error) {
  const name = String(error?.name || "");
  const message = String(error?.message || "");
  if (name === "PasswordException" || /password|encrypted/i.test(message)) {
    return "This PDF is password protected. Unlock it first, then open the unlocked PDF in the reader.";
  }
  if (name === "InvalidPDFException" || /invalid pdf|corrupt/i.test(message)) {
    return "Unable to open this PDF. The file may be corrupted or incomplete.";
  }
  if (name === "MissingPDFException") return "The PDF file could not be read. Try choosing the file again.";
  if (name === "UnexpectedResponseException") return "The browser could not read this PDF correctly. Try another copy of the file.";
  return "Unable to open this PDF. The file may be corrupted, unsupported, or password protected.";
}
