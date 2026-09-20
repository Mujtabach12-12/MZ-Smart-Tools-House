import { MAX_DIMENSION } from "./core.js";

/**
 * Pure resize maths. No DOM, no Canvas — every function here is unit-tested.
 */

function assertNaturalSize(naturalWidth, naturalHeight) {
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth < 1 || naturalHeight < 1) {
    throw new Error("This image's dimensions could not be read — the file may be corrupted.");
  }
}

function clamp(value) {
  return Math.min(MAX_DIMENSION, Math.max(1, Math.round(value)));
}

/**
 * Works out the final output size from whatever the user typed.
 *
 * - lockAspect + only width  -> height derived from the source ratio
 * - lockAspect + only height -> width derived
 * - lockAspect + both        -> the image is fitted *inside* the box (contain),
 *                               so the aspect ratio is genuinely preserved
 * - no lockAspect            -> exactly what was typed (both required)
 */
export function resolveResizeDimensions({
  naturalWidth,
  naturalHeight,
  width,
  height,
  lockAspect = true,
}) {
  assertNaturalSize(naturalWidth, naturalHeight);

  const hasWidth = Number.isFinite(width) && width > 0;
  const hasHeight = Number.isFinite(height) && height > 0;

  if (!hasWidth && !hasHeight) {
    throw new Error("Enter a width, a height, or both.");
  }

  if (!lockAspect) {
    if (!hasWidth || !hasHeight) {
      throw new Error("Enter both a width and a height, or turn on \"Keep aspect ratio\".");
    }
    return { width: clamp(width), height: clamp(height) };
  }

  const ratio = naturalWidth / naturalHeight;

  if (hasWidth && hasHeight) {
    return fitWithin(naturalWidth, naturalHeight, width, height);
  }
  if (hasWidth) {
    return { width: clamp(width), height: clamp(clamp(width) / ratio) };
  }
  return { width: clamp(clamp(height) * ratio), height: clamp(height) };
}

/** Largest size with the source ratio that fits fully inside maxW x maxH ("contain"). */
export function fitWithin(naturalWidth, naturalHeight, maxWidth, maxHeight) {
  assertNaturalSize(naturalWidth, naturalHeight);
  if (!(maxWidth > 0) || !(maxHeight > 0)) {
    throw new Error("Maximum width and height must both be greater than zero.");
  }
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
  return { width: clamp(naturalWidth * scale), height: clamp(naturalHeight * scale) };
}

/** Smallest size with the source ratio that fully covers targetW x targetH ("cover"). */
export function coverWithin(naturalWidth, naturalHeight, targetWidth, targetHeight) {
  assertNaturalSize(naturalWidth, naturalHeight);
  if (!(targetWidth > 0) || !(targetHeight > 0)) {
    throw new Error("Target width and height must both be greater than zero.");
  }
  const scale = Math.max(targetWidth / naturalWidth, targetHeight / naturalHeight);
  return { width: clamp(naturalWidth * scale), height: clamp(naturalHeight * scale) };
}

/** Scales a size by a percentage (100 = unchanged). */
export function scaleByPercent(naturalWidth, naturalHeight, percent) {
  assertNaturalSize(naturalWidth, naturalHeight);
  const pct = Number(percent);
  if (!Number.isFinite(pct) || pct <= 0) throw new Error("Scale must be greater than 0%.");
  if (pct > 1000) throw new Error("Scale can't be more than 1000%.");
  return { width: clamp((naturalWidth * pct) / 100), height: clamp((naturalHeight * pct) / 100) };
}

/** Shrinks a size so neither side exceeds `maxSide`; returns it unchanged if already small enough. */
export function limitLongestSide(naturalWidth, naturalHeight, maxSide) {
  assertNaturalSize(naturalWidth, naturalHeight);
  if (!(maxSide > 0)) throw new Error("Maximum side must be greater than zero.");
  const longest = Math.max(naturalWidth, naturalHeight);
  if (longest <= maxSide) {
    return { width: clamp(naturalWidth), height: clamp(naturalHeight), scaled: false };
  }
  const scale = maxSide / longest;
  return { width: clamp(naturalWidth * scale), height: clamp(naturalHeight * scale), scaled: true };
}

/** "1920 × 1080" for display. */
export function formatDimensions(width, height) {
  return `${Math.round(width)} × ${Math.round(height)}`;
}
