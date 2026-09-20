/**
 * Shared, framework-free helpers for every image tool.
 *
 * Nothing in this file touches the DOM or Canvas, so all of it is unit-tested
 * in Node (see test/image.test.mjs). The browser-only pieces live in
 * ./canvas.js and are injected into ./process.js as dependencies.
 */

export { formatBytes } from "../pdf/core.js";

/** Output formats the tools can encode to, in canvas `toBlob` terms. */
export const OUTPUT_FORMATS = {
  jpeg: { mime: "image/jpeg", ext: "jpg", label: "JPG", lossy: true, supportsAlpha: false },
  png: { mime: "image/png", ext: "png", label: "PNG", lossy: false, supportsAlpha: true },
  webp: { mime: "image/webp", ext: "webp", label: "WebP", lossy: true, supportsAlpha: true },
};

/** Input types every tool accepts unless it narrows the list further. */
export const SUPPORTED_INPUT_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
];

const MIME_LABELS = {
  "image/jpeg": "JPG",
  "image/jpg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
  "image/bmp": "BMP",
  "image/avif": "AVIF",
  "image/heic": "HEIC",
  "image/heif": "HEIF",
  "image/tiff": "TIFF",
};

/** Canvas is capped by the browser; keep well under the common ~16k limit. */
export const MAX_DIMENSION = 10000;

export function formatLabel(mime) {
  return MIME_LABELS[String(mime || "").toLowerCase()] || "this";
}

/** Resolves a format key ("jpeg" | "png" | "webp") to its descriptor. */
export function getFormat(formatKey) {
  const key = String(formatKey || "").toLowerCase();
  const normalized = key === "jpg" ? "jpeg" : key;
  const format = OUTPUT_FORMATS[normalized];
  if (!format) {
    throw new Error(`"${formatKey}" is not a supported output format. Choose JPG, PNG or WebP.`);
  }
  return format;
}

/** Maps a source mime type onto the closest output format key. */
export function formatKeyFromMime(mime) {
  switch (String(mime || "").toLowerCase()) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    case "image/jpg":
      return "jpeg";
    default:
      return "jpeg";
  }
}

/**
 * Validates a File (or File-like {name, type, size}) before any decoding work.
 * Throws an Error with a message that's safe to show directly to a user.
 */
export function assertSupportedImage(file, allowedMimes = SUPPORTED_INPUT_MIMES) {
  if (!file) throw new Error("Choose an image file first.");

  const name = file.name || "This file";
  const type = String(file.type || "").toLowerCase();

  if (!type.startsWith("image/")) {
    throw new Error(`"${name}" is not an image file. Please choose a JPG, PNG or WebP image.`);
  }

  const allowed = allowedMimes.map((m) => m.toLowerCase());
  if (!allowed.includes(type)) {
    const expected = [...new Set(allowed.map(formatLabel))].join(", ");
    throw new Error(`"${name}" is a ${formatLabel(type)} image — this tool accepts ${expected}.`);
  }

  if (typeof file.size === "number" && file.size === 0) {
    throw new Error(`"${name}" is empty (0 bytes) and can't be read.`);
  }

  return true;
}

/** Strips the extension from a filename, keeping dots inside the base name. */
export function stripExtension(filename) {
  const name = String(filename || "image");
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return name;
  return name.slice(0, dot);
}

/**
 * Builds an output filename, e.g.
 *   buildOutputName("holiday.png", "jpeg")               -> "holiday.jpg"
 *   buildOutputName("holiday.png", "png", "compressed")  -> "holiday-compressed.png"
 */
export function buildOutputName(originalName, formatKey, suffix = "") {
  const { ext } = getFormat(formatKey);
  const base = stripExtension(originalName) || "image";
  return suffix ? `${base}-${suffix}.${ext}` : `${base}.${ext}`;
}

/**
 * Before/after size summary. `percentSaved` is 0 (never negative) so the UI
 * can show "Saved 0%" honestly when a file grew instead of shrank.
 */
export function describeSizeChange(originalSize, newSize) {
  const original = Number(originalSize) || 0;
  const updated = Number(newSize) || 0;
  const difference = original - updated;
  const percentSaved = original > 0 && difference > 0 ? Math.round((difference / original) * 100) : 0;
  const percentLarger = original > 0 && difference < 0 ? Math.round((-difference / original) * 100) : 0;

  return {
    originalSize: original,
    newSize: updated,
    bytesSaved: Math.max(0, difference),
    percentSaved,
    percentLarger,
    grew: difference < 0,
  };
}

/** Parses a user-typed pixel value into a valid dimension, or throws. */
export function parseDimension(value, label = "Value") {
  if (value === "" || value === null || value === undefined) {
    throw new Error(`${label} is required.`);
  }
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error(`${label} must be a number.`);
  const rounded = Math.round(num);
  if (rounded < 1) throw new Error(`${label} must be at least 1 pixel.`);
  if (rounded > MAX_DIMENSION) {
    throw new Error(`${label} can't be larger than ${MAX_DIMENSION} pixels.`);
  }
  return rounded;
}
