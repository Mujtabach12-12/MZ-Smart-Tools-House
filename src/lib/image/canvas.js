/**
 * BROWSER-ONLY adapter around Canvas / createImageBitmap.
 *
 * Everything in this file needs a real DOM, so it is NOT unit-tested in Node.
 * It is kept deliberately thin: all decisions (sizes, rectangles, transforms,
 * quality search) live in the pure modules next to it, and ./process.js wires
 * the two together through an injectable `deps` object. The Node tests pass a
 * fake version of this adapter; the browser passes this one.
 *
 * See README "Phase 4" for the manual browser checks this file requires.
 */

import { formatLabel } from "./core.js";
import { validateImageOutput } from "../files/outputValidation.js";

/**
 * Decodes a File into something drawable, preferring `createImageBitmap`
 * (off-main-thread, honours EXIF orientation) and falling back to an
 * <img> + object URL for older browsers.
 */
export async function loadImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close?.() };
    } catch {
      // Some browsers reject the options bag rather than the file — retry bare
      // before deciding the file itself is the problem.
      try {
        const bitmap = await createImageBitmap(file);
        return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close?.() };
      } catch {
        /* fall through to the <img> path below */
      }
    }
  }

  return loadImageViaElement(file);
}

function loadImageViaElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        URL.revokeObjectURL(url);
        reject(new Error(`"${file.name}" could not be read — the file may be corrupted.`));
        return;
      }
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          `"${file.name}" could not be opened. It may be corrupted, or your browser may not support ${formatLabel(file.type)} images.`
        )
      );
    };

    img.src = url;
  });
}

/** Creates a drawing surface, preferring OffscreenCanvas where available. */
export function createCanvas(width, height) {
  if (!(width > 0) || !(height > 0)) {
    throw new Error("Cannot create an image with zero width or height.");
  }

  if (typeof OffscreenCanvas === "function") {
    try {
      return new OffscreenCanvas(width, height);
    } catch {
      /* fall through to a DOM canvas */
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function getContext(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Your browser blocked the canvas needed to process this image. Try a different browser.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

/**
 * Encodes a canvas to a Blob. Rejects with a friendly message when the browser
 * can't encode the requested format (older Safari and WebP, for example)
 * rather than silently handing back a PNG.
 */
export async function canvasToBlob(canvas, mimeType, quality) {
  const blob = await encode(canvas, mimeType, quality);

  if (!blob) {
    throw new Error(`Your browser couldn't save this image as ${formatLabel(mimeType)}. Try a different output format.`);
  }

  // Canvas silently falls back to PNG for formats it doesn't support.
  if (blob.type && mimeType && blob.type !== mimeType) {
    throw new Error(
      `Your browser doesn't support saving ${formatLabel(mimeType)} images, so the conversion was stopped instead of giving you the wrong format.`
    );
  }

  return blob;
}

function encode(canvas, mimeType, quality) {
  if (typeof canvas.convertToBlob === "function") {
    // OffscreenCanvas
    return canvas.convertToBlob({ type: mimeType, quality });
  }
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Feature-detects encoder support so the UI can warn *before* the user picks
 * an output format that this browser can't write.
 */
export function isEncodingSupported(mimeType) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
  } catch {
    return false;
  }
}

/** The default dependency bundle handed to ./process.js in the browser. */
export const browserImageDeps = {
  loadImage,
  createCanvas,
  getContext,
  canvasToBlob,
  validateImageOutput: (blob, options) => validateImageOutput(blob, { ...options, decodeImage: loadImage }),
};
