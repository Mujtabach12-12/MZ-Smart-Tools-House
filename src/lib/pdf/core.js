import { PDFDocument } from "pdf-lib";

/**
 * Loads a PDF from raw bytes with a friendly error on invalid/corrupt/encrypted files.
 */
export async function loadPdfDocument(bytes) {
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (err) {
    if (String(err.message || "").toLowerCase().includes("encrypted")) {
      throw new Error("This PDF is password-protected. Please remove the password before using this tool.");
    }
    throw new Error("This file doesn't look like a valid PDF, or it may be corrupted.");
  }
}

export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/** Parses a human page-range string like "1-3,5,8-9" into 0-based indices, validated against pageCount. */
export function parsePageRanges(input, pageCount) {
  const raw = String(input).trim();
  if (!raw) throw new Error("Enter at least one page or page range.");

  const indices = new Set();
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    const singleMatch = /^(\d+)$/.exec(part);

    if (rangeMatch) {
      let [, start, end] = rangeMatch.map(Number);
      if (start > end) [start, end] = [end, start];
      for (let p = start; p <= end; p++) indices.add(p);
    } else if (singleMatch) {
      indices.add(Number(singleMatch[1]));
    } else {
      throw new Error(`"${part}" is not a valid page or range.`);
    }
  }

  const sorted = [...indices].sort((a, b) => a - b);
  for (const p of sorted) {
    if (p < 1 || p > pageCount) {
      throw new Error(`Page ${p} is out of range — this PDF has ${pageCount} page(s).`);
    }
  }

  return sorted.map((p) => p - 1); // convert to 0-based
}
