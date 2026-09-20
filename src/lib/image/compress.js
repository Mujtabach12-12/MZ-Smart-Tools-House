/**
 * Compression strategy — deliberately separated from the Canvas encoder.
 *
 * `findQualityForTargetSize` takes an `encode(quality) => Promise<{ blob, size }>`
 * function as a dependency, so the search itself is fully unit-tested in Node
 * against a fake encoder. In the browser the injected encoder is the real
 * `canvas.toBlob()` call.
 */

export const MIN_QUALITY = 0.1;
export const MAX_QUALITY = 1;
export const DEFAULT_QUALITY = 0.8;

/** Clamps a 0–1 quality value, falling back to the default for junk input. */
export function clampQuality(quality) {
  const value = Number(quality);
  if (!Number.isFinite(value)) return DEFAULT_QUALITY;
  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, value));
}

/** Converts a 1–100 slider value into a 0–1 canvas quality value. */
export function qualityFromPercent(percent) {
  const value = Number(percent);
  if (!Number.isFinite(value)) return DEFAULT_QUALITY;
  return clampQuality(value / 100);
}

/** Parses a user-entered target size in KB into bytes. */
export function parseTargetKb(value) {
  const kb = Number(value);
  if (!Number.isFinite(kb)) throw new Error("Target size must be a number.");
  if (kb < 1) throw new Error("Target size must be at least 1 KB.");
  if (kb > 100000) throw new Error("Target size can't be larger than 100,000 KB.");
  return Math.round(kb * 1024);
}

/**
 * Binary-searches encoder quality for the largest result that still fits in
 * `targetBytes`.
 *
 * Returns `{ blob, size, quality, hitTarget, attempts }`. When even the lowest
 * quality overshoots the target, it returns the smallest result it managed
 * with `hitTarget: false` — the UI tells the user plainly rather than
 * pretending the target was met.
 */
export async function findQualityForTargetSize(
  encode,
  targetBytes,
  { minQuality = MIN_QUALITY, maxQuality = MAX_QUALITY, maxAttempts = 8, tolerance = 0.02 } = {}
) {
  if (typeof encode !== "function") throw new Error("An encode function is required.");
  if (!(targetBytes > 0)) throw new Error("Target size must be greater than zero.");

  let low = clampQuality(minQuality);
  let high = clampQuality(maxQuality);
  if (low > high) [low, high] = [high, low];

  let attempts = 0;

  // Best result that fits within the target.
  let best = null;
  // Smallest result seen overall, used as the fallback when nothing fits.
  let smallest = null;

  // Fast path: if the highest quality already fits, don't degrade the image.
  const topResult = await encode(high);
  attempts += 1;
  smallest = { ...topResult, quality: high };
  if (topResult.size <= targetBytes) {
    return { ...topResult, quality: high, hitTarget: true, attempts };
  }

  while (attempts < maxAttempts && high - low > tolerance) {
    const mid = (low + high) / 2;
    const result = await encode(mid);
    attempts += 1;

    if (result.size < smallest.size) smallest = { ...result, quality: mid };

    if (result.size <= targetBytes) {
      best = { ...result, quality: mid };
      low = mid; // try to spend the remaining budget on quality
    } else {
      high = mid;
    }
  }

  if (best) return { ...best, hitTarget: true, attempts };

  // Nothing fit — try the floor once, then report honestly.
  if (attempts < maxAttempts) {
    const floorResult = await encode(clampQuality(minQuality));
    attempts += 1;
    if (floorResult.size < smallest.size) smallest = { ...floorResult, quality: clampQuality(minQuality) };
    if (floorResult.size <= targetBytes) {
      return { ...floorResult, quality: clampQuality(minQuality), hitTarget: true, attempts };
    }
  }

  return { ...smallest, hitTarget: false, attempts };
}

/**
 * Suggests a starting quality for a given file size — bigger files can take
 * more aggressive compression before it becomes visible.
 */
export function suggestQualityForSize(bytes) {
  const size = Number(bytes) || 0;
  if (size > 5 * 1024 * 1024) return 0.6;
  if (size > 2 * 1024 * 1024) return 0.7;
  if (size > 500 * 1024) return 0.8;
  return 0.9;
}

/**
 * PNG is lossless: `canvas.toBlob()` ignores the quality argument entirely.
 * The UI uses this to hide the quality slider instead of showing a control
 * that silently does nothing.
 */
export function qualityAppliesTo(formatKey) {
  return formatKey === "jpeg" || formatKey === "webp";
}
