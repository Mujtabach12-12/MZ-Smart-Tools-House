/**
 * The orchestration layer: turns a File + user options into an output Blob.
 *
 * The Canvas API is reached only through the `deps` object
 * ({ loadImage, createCanvas, getContext, canvasToBlob }). In the browser that
 * is `browserImageDeps` from ./canvas.js; in the Node test suite it is a fake
 * recorder, which is how the pipeline's geometry (crop rect, output size,
 * rotation transform, chosen mime type, filename, quality) is verified without
 * a real browser.
 *
 * What the tests CAN'T verify here: actual pixel output and real encoder
 * behaviour. Those need a browser — see the manual checklist in the README.
 */

import {
  assertSupportedImage,
  buildOutputName,
  describeSizeChange,
  formatKeyFromMime,
  getFormat,
  SUPPORTED_INPUT_MIMES,
} from "./core.js";
import { resolveResizeDimensions, coverWithin, limitLongestSide } from "./dimensions.js";
import { normalizeCropRect, centerCropRect, fullImageRect } from "./crop.js";
import { rotationTransform, isNoOpTransform } from "./rotate.js";
import {
  clampQuality,
  findQualityForTargetSize,
  qualityAppliesTo,
} from "./compress.js";
import { presetPixelSize, checkSourceResolution } from "./passport.js";

function requireDeps(deps) {
  const required = ["loadImage", "createCanvas", "getContext", "canvasToBlob"];
  for (const key of required) {
    if (typeof deps?.[key] !== "function") {
      throw new Error(`Image renderer is missing "${key}". This is a bug — please report it.`);
    }
  }
  return deps;
}

/**
 * Draws `image` into a canvas: takes `sourceRect` out of the source, scales it
 * to outputWidth x outputHeight, then applies rotation/flips as a second pass.
 * Returns the finished canvas plus its dimensions.
 */
function renderToCanvas(image, options, deps) {
  const {
    sourceRect,
    outputWidth,
    outputHeight,
    rotation = 0,
    flipHorizontal = false,
    flipVertical = false,
    background = null,
  } = options;

  const transformed = !isNoOpTransform(rotation, { flipHorizontal, flipVertical });
  const t = transformed
    ? rotationTransform(outputWidth, outputHeight, rotation, { flipHorizontal, flipVertical })
    : {
        canvasWidth: outputWidth, canvasHeight: outputHeight,
        translateX: 0, translateY: 0, rotateRadians: 0, scaleX: 1, scaleY: 1,
      };

  // Draw the source directly into the final canvas. The previous pipeline first
  // resized/cropped into one bitmap and then drew that bitmap into a second
  // rotation canvas, causing an avoidable second resampling pass.
  const canvas = deps.createCanvas(t.canvasWidth, t.canvasHeight);
  const ctx = deps.getContext(canvas);

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, t.canvasWidth, t.canvasHeight);
  }

  if (transformed) {
    ctx.translate(t.translateX, t.translateY);
    ctx.rotate(t.rotateRadians);
    ctx.scale(t.scaleX, t.scaleY);
    ctx.drawImage(
      image.source,
      sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
      -outputWidth / 2, -outputHeight / 2, outputWidth, outputHeight
    );
  } else {
    ctx.drawImage(
      image.source,
      sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
      0, 0, outputWidth, outputHeight
    );
  }

  return { canvas, width: t.canvasWidth, height: t.canvasHeight };
}

/**
 * The single code path every image tool goes through.
 *
 * options:
 *   crop        {x,y,width,height} in source pixels, or null for the whole image
 *   width/height  output size; omitted means "same as the crop"
 *   lockAspect  preserve the source ratio when only one side is given
 *   rotation, flipHorizontal, flipVertical
 *   format      "jpeg" | "png" | "webp" (defaults to the input's format)
 *   quality     0–1, ignored for PNG
 *   background  CSS colour painted underneath (used when flattening alpha to JPG)
 *   suffix      appended to the output filename
 *   targetBytes when set, quality is searched for instead of used directly
 */
export async function processImage(file, options = {}, deps) {
  requireDeps(deps);
  assertSupportedImage(file, options.allowedMimes || SUPPORTED_INPUT_MIMES);

  const image = await deps.loadImage(file);
  try {
    if (!(image?.width > 0) || !(image?.height > 0)) {
      throw new Error(`"${file.name}" could not be read — the file may be corrupted.`);
    }

    const sourceRect = options.crop
      ? normalizeCropRect(options.crop, image.width, image.height)
      : fullImageRect(image.width, image.height);

    let outputWidth = sourceRect.width;
    let outputHeight = sourceRect.height;

    if (Number.isFinite(options.width) || Number.isFinite(options.height)) {
      const resolved = resolveResizeDimensions({
        naturalWidth: sourceRect.width,
        naturalHeight: sourceRect.height,
        width: Number.isFinite(options.width) ? options.width : undefined,
        height: Number.isFinite(options.height) ? options.height : undefined,
        lockAspect: options.lockAspect !== false,
      });
      outputWidth = resolved.width;
      outputHeight = resolved.height;
    } else if (Number.isFinite(options.maxSide)) {
      const limited = limitLongestSide(sourceRect.width, sourceRect.height, options.maxSide);
      outputWidth = limited.width;
      outputHeight = limited.height;
    }

    const formatKey = options.format ? getFormatKey(options.format) : formatKeyFromMime(file.type);
    const format = getFormat(formatKey);

    // JPG has no alpha channel: without this, transparent PNG areas render black.
    const background = options.background || (format.supportsAlpha ? null : "#ffffff");

    const { canvas, width, height } = renderToCanvas(
      image,
      {
        sourceRect,
        outputWidth,
        outputHeight,
        rotation: options.rotation || 0,
        flipHorizontal: !!options.flipHorizontal,
        flipVertical: !!options.flipVertical,
        background,
      },
      deps
    );

    const useQuality = qualityAppliesTo(formatKey);
    const requestedQuality = useQuality ? clampQuality(options.quality ?? 0.9) : undefined;

    let blob;
    let quality = requestedQuality;
    let hitTarget = true;
    let attempts = 1;

    if (Number.isFinite(options.targetBytes) && useQuality) {
      const encode = async (q) => {
        const candidate = await deps.canvasToBlob(canvas, format.mime, q);
        return { blob: candidate, size: candidate.size };
      };
      const found = await findQualityForTargetSize(encode, options.targetBytes);
      blob = found.blob;
      quality = found.quality;
      hitTarget = found.hitTarget;
      attempts = found.attempts;
    } else {
      blob = await deps.canvasToBlob(canvas, format.mime, requestedQuality);
    }

    if (!blob) {
      throw new Error("Your browser couldn't produce the output image. Try a different format.");
    }

    // Browser adapter validates that the encoded output can be decoded and
    // has the exact dimensions produced by the operation before a download is
    // exposed. Test adapters may omit this hook.
    const validation = typeof deps.validateImageOutput === "function"
      ? await deps.validateImageOutput(blob, { expectedMime: format.mime, expectedWidth: width, expectedHeight: height })
      : { valid: true, width, height, mime: format.mime };

    return {
      blob,
      size: blob.size,
      mime: format.mime,
      formatKey,
      width,
      height,
      quality,
      hitTarget,
      attempts,
      filename: buildOutputName(file.name, formatKey, options.suffix || ""),
      originalSize: file.size,
      validation,
      metadataPreserved: false, // Canvas re-encoding does not preserve EXIF/ancillary metadata reliably.
      originalWidth: image.width,
      originalHeight: image.height,
      ...describeSizeChange(file.size, blob.size),
    };
  } finally {
    image?.close?.();
  }
}

function getFormatKey(format) {
  const key = String(format).toLowerCase();
  const normalized = key === "jpg" ? "jpeg" : key;
  getFormat(normalized); // throws with a friendly message for anything else
  return normalized;
}

/* ------------------------------------------------------------------ tools */

/** Format conversion (JPG↔PNG↔WebP) at full size. */
export function convertImage(file, { format, quality = 0.92, background, allowedMimes } = {}, deps) {
  return processImage(file, { format, quality, background, allowedMimes, suffix: "" }, deps);
}

/** Resize to exact pixels, optionally preserving the aspect ratio. */
export function resizeImage(file, { width, height, lockAspect = true, format, quality = 0.92 } = {}, deps) {
  return processImage(file, { width, height, lockAspect, format, quality, suffix: "resized" }, deps);
}

/** Rotate in 90° steps and/or mirror. */
export async function rotateImage(
  file,
  { rotation = 0, flipHorizontal = false, flipVertical = false, format, quality = 0.92 } = {},
  deps
) {
  requireDeps(deps);
  assertSupportedImage(file);
  const sourceFormat = formatKeyFromMime(file.type);
  const targetFormat = format ? getFormatKey(format) : sourceFormat;
  if (isNoOpTransform(rotation, { flipHorizontal, flipVertical }) && targetFormat === sourceFormat) {
    const image = await deps.loadImage(file);
    try {
      return {
        blob: file, size: file.size, mime: file.type, formatKey: sourceFormat,
        width: image.width, height: image.height, quality: null, hitTarget: true, attempts: 0,
        filename: file.name, originalSize: file.size, originalWidth: image.width, originalHeight: image.height,
        ...describeSizeChange(file.size, file.size),
        validation: { valid: true, width: image.width, height: image.height, mime: file.type },
        metadataPreserved: true, retainedOriginal: true,
      };
    } finally {
      image?.close?.();
    }
  }
  return processImage(file, { rotation, flipHorizontal, flipVertical, format, quality, suffix: "rotated" }, deps);
}

/** Crop to a rectangle in source-image pixels. */
export function cropImage(file, { crop, format, quality = 0.92 } = {}, deps) {
  if (!crop) throw new Error("Select the area you want to keep first.");
  return processImage(file, { crop, format, quality, suffix: "cropped" }, deps);
}

/**
 * Compress. Two modes:
 *   mode "quality" — use the slider value directly
 *   mode "target"  — search for the best quality that fits `targetBytes`
 * `maxSide` optionally downscales first, which is what actually moves the
 * needle on very large photos.
 */
export function compressImage(
  file,
  { mode = "quality", quality = 0.8, targetBytes, maxSide, format } = {},
  deps
) {
  const formatKey = format ? getFormatKey(format) : formatKeyFromMime(file?.type);

  if (mode === "target") {
    if (!qualityAppliesTo(formatKey)) {
      throw new Error(
        "PNG is a lossless format, so it has no quality setting to trade away. Convert to JPG or WebP to compress to a target size."
      );
    }
    return processImage(file, { targetBytes, maxSide, format: formatKey, suffix: "compressed" }, deps);
  }

  return processImage(file, { quality, maxSide, format: formatKey, suffix: "compressed" }, deps);
}

/**
 * Passport / ID photo: centre-crops to the document's aspect ratio, then
 * scales to the exact print pixel size for the chosen DPI.
 */
export async function createPassportPhoto(
  file,
  { presetId, dpi = 300, format = "jpeg", quality = 0.92, background = "#ffffff", crop } = {},
  deps
) {
  requireDeps(deps);
  assertSupportedImage(file);

  const target = presetPixelSize(presetId, dpi);

  // Peek at the source dimensions so we can centre-crop and warn about upscaling.
  const probe = await deps.loadImage(file);
  let sourceWidth;
  let sourceHeight;
  try {
    sourceWidth = probe.width;
    sourceHeight = probe.height;
  } finally {
    probe?.close?.();
  }

  const resolution = checkSourceResolution(sourceWidth, sourceHeight, target.width, target.height);
  const rect = crop
    ? normalizeCropRect(crop, sourceWidth, sourceHeight)
    : centerCropRect(sourceWidth, sourceHeight, target.aspectRatio);

  const result = await processImage(
    file,
    {
      crop: rect,
      width: target.width,
      height: target.height,
      lockAspect: false, // the rect already has the right ratio
      format,
      quality,
      background,
      suffix: "passport",
    },
    deps
  );

  return { ...result, preset: target.preset, dpi: target.dpi, resolutionWarning: resolution.message };
}

/** Exported for the passport tool's live preview of the crop box. */
export { centerCropRect, coverWithin };
