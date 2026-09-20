import assert from "node:assert/strict";

import {
  assertSupportedImage,
  buildOutputName,
  describeSizeChange,
  formatKeyFromMime,
  formatLabel,
  getFormat,
  parseDimension,
  stripExtension,
  MAX_DIMENSION,
} from "../src/lib/image/core.js";
import {
  resolveResizeDimensions,
  fitWithin,
  coverWithin,
  scaleByPercent,
  limitLongestSide,
  formatDimensions,
} from "../src/lib/image/dimensions.js";
import {
  normalizeCropRect,
  cropRectFromPercent,
  centerCropRect,
  fullImageRect,
  applyAspectToRect,
} from "../src/lib/image/crop.js";
import {
  normalizeAngle,
  rotatedDimensions,
  rotationTransform,
  addRotation,
  isNoOpTransform,
} from "../src/lib/image/rotate.js";
import {
  clampQuality,
  qualityFromPercent,
  parseTargetKb,
  findQualityForTargetSize,
  suggestQualityForSize,
  qualityAppliesTo,
} from "../src/lib/image/compress.js";
import {
  PASSPORT_PRESETS,
  getPreset,
  mmToPx,
  presetPixelSize,
  checkSourceResolution,
} from "../src/lib/image/passport.js";
import {
  processImage,
  convertImage,
  resizeImage,
  rotateImage,
  cropImage,
  compressImage,
  createPassportPhoto,
} from "../src/lib/image/process.js";
import { computePageLayout, PAGE_SIZES } from "../src/lib/pdf/imageToPdf.js";
import { needsReEncoding, prepareImageForPdf } from "../src/lib/image/toPdf.js";

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}`);
    console.error(`    ${err.stack || err.message}`);
    process.exitCode = 1;
  }
}

/* -------------------------------------------------------------- fixtures */

/** A File-like object. Node has no File in older versions and no image decoding at all. */
function fakeFile(name, type, size = 1000, bytes = null) {
  return {
    name,
    type,
    size,
    arrayBuffer: async () => (bytes ? bytes.buffer : new ArrayBuffer(size)),
  };
}

/**
 * A fake of src/lib/image/canvas.js that records every call instead of
 * touching a real Canvas. This is what lets the whole processImage pipeline —
 * crop rect, output size, rotation transform, mime type, quality, filename —
 * be verified in Node. Real pixel output still needs a browser.
 */
function fakeDeps({ width = 800, height = 600, sizeForQuality, failLoad = false, blobType } = {}) {
  const calls = { canvases: [], draws: [], transforms: [], encodes: [], fills: [] };

  const deps = {
    calls,
    loadImage: async () => {
      if (failLoad) throw new Error("This file could not be read — it may be corrupted.");
      return { source: { tag: "image", width, height }, width, height, close: () => {} };
    },
    createCanvas: (w, h) => {
      if (!(w > 0) || !(h > 0)) throw new Error("Cannot create an image with zero width or height.");
      const canvas = { width: w, height: h, id: calls.canvases.length };
      calls.canvases.push({ width: w, height: h });
      return canvas;
    },
    getContext: (canvas) => ({
      canvas,
      set fillStyle(value) { calls.fills.push({ canvas: canvas.id, style: value }); },
      fillRect: () => {},
      drawImage: (...args) => calls.draws.push({ canvas: canvas.id, args }),
      translate: (x, y) => calls.transforms.push({ op: "translate", x, y }),
      rotate: (r) => calls.transforms.push({ op: "rotate", radians: r }),
      scale: (x, y) => calls.transforms.push({ op: "scale", x, y }),
    }),
    canvasToBlob: async (canvas, mime, quality) => {
      calls.encodes.push({ canvas: canvas.id, mime, quality });
      const size = sizeForQuality
        ? sizeForQuality(quality ?? 1, canvas)
        : Math.round(canvas.width * canvas.height * (quality ?? 1));
      return { size, type: blobType || mime, arrayBuffer: async () => new ArrayBuffer(4) };
    },
  };

  return deps;
}

/* ------------------------------------------------------------------ core */

console.log("Image core helpers");
await test("getFormat resolves jpeg/jpg/png/webp", () => {
  assert.equal(getFormat("jpeg").mime, "image/jpeg");
  assert.equal(getFormat("jpg").mime, "image/jpeg");
  assert.equal(getFormat("png").ext, "png");
  assert.equal(getFormat("webp").label, "WebP");
});
await test("getFormat rejects an unknown format with a readable message", () => {
  assert.throws(() => getFormat("tiff"), /not a supported output format/);
});
await test("formatKeyFromMime maps input types, defaulting to jpeg", () => {
  assert.equal(formatKeyFromMime("image/png"), "png");
  assert.equal(formatKeyFromMime("image/webp"), "webp");
  assert.equal(formatKeyFromMime("image/jpg"), "jpeg");
  assert.equal(formatKeyFromMime("image/gif"), "jpeg");
  assert.equal(formatKeyFromMime(undefined), "jpeg");
});
await test("formatLabel gives human names", () => {
  assert.equal(formatLabel("image/jpeg"), "JPG");
  assert.equal(formatLabel("image/webp"), "WebP");
});
await test("assertSupportedImage accepts a valid image", () => {
  assert.equal(assertSupportedImage(fakeFile("a.png", "image/png", 10)), true);
});
await test("assertSupportedImage rejects a non-image file", () => {
  assert.throws(() => assertSupportedImage(fakeFile("notes.pdf", "application/pdf", 10)), /not an image file/);
});
await test("assertSupportedImage rejects a format outside the allowed list", () => {
  assert.throws(
    () => assertSupportedImage(fakeFile("a.gif", "image/gif", 10), ["image/png"]),
    /this tool accepts PNG/
  );
});
await test("assertSupportedImage rejects a zero-byte (corrupted/empty) file", () => {
  assert.throws(() => assertSupportedImage(fakeFile("empty.png", "image/png", 0)), /empty/);
});
await test("assertSupportedImage rejects a missing file", () => {
  assert.throws(() => assertSupportedImage(null), /Choose an image file/);
});
await test("stripExtension handles dots inside names and no extension", () => {
  assert.equal(stripExtension("my.holiday.photo.jpg"), "my.holiday.photo");
  assert.equal(stripExtension("noextension"), "noextension");
  assert.equal(stripExtension(".hidden"), ".hidden");
});
await test("buildOutputName swaps the extension and adds a suffix", () => {
  assert.equal(buildOutputName("photo.png", "jpeg"), "photo.jpg");
  assert.equal(buildOutputName("photo.jpg", "webp"), "photo.webp");
  assert.equal(buildOutputName("photo.png", "png", "compressed"), "photo-compressed.png");
});
await test("describeSizeChange reports savings, and never a negative saving", () => {
  const shrunk = describeSizeChange(1000, 250);
  assert.equal(shrunk.percentSaved, 75);
  assert.equal(shrunk.bytesSaved, 750);
  assert.equal(shrunk.grew, false);

  const grew = describeSizeChange(1000, 1500);
  assert.equal(grew.percentSaved, 0);
  assert.equal(grew.percentLarger, 50);
  assert.equal(grew.grew, true);
});
await test("describeSizeChange survives a zero original size", () => {
  const r = describeSizeChange(0, 100);
  assert.equal(r.percentSaved, 0);
});
await test("parseDimension accepts, rounds and rejects", () => {
  assert.equal(parseDimension("1920", "Width"), 1920);
  assert.equal(parseDimension(100.6, "Width"), 101);
  assert.throws(() => parseDimension("", "Width"), /required/);
  assert.throws(() => parseDimension("abc", "Width"), /must be a number/);
  assert.throws(() => parseDimension(0, "Width"), /at least 1 pixel/);
  assert.throws(() => parseDimension(-5, "Width"), /at least 1 pixel/);
  assert.throws(() => parseDimension(MAX_DIMENSION + 1, "Width"), /can't be larger/);
});
await test("parseDimension accepts the exact maximum boundary", () => {
  assert.equal(parseDimension(MAX_DIMENSION, "Width"), MAX_DIMENSION);
});

/* ------------------------------------------------------------ dimensions */

console.log("Resize maths");
await test("width only with aspect lock derives the height", () => {
  const r = resolveResizeDimensions({ naturalWidth: 1600, naturalHeight: 900, width: 800, lockAspect: true });
  assert.deepEqual(r, { width: 800, height: 450 });
});
await test("height only with aspect lock derives the width", () => {
  const r = resolveResizeDimensions({ naturalWidth: 1600, naturalHeight: 900, height: 450, lockAspect: true });
  assert.deepEqual(r, { width: 800, height: 450 });
});
await test("both sides with aspect lock fits inside the box instead of stretching", () => {
  const r = resolveResizeDimensions({ naturalWidth: 1600, naturalHeight: 900, width: 800, height: 800, lockAspect: true });
  assert.deepEqual(r, { width: 800, height: 450 });
});
await test("aspect lock off uses the exact typed values", () => {
  const r = resolveResizeDimensions({ naturalWidth: 1600, naturalHeight: 900, width: 300, height: 900, lockAspect: false });
  assert.deepEqual(r, { width: 300, height: 900 });
});
await test("aspect lock off requires both sides", () => {
  assert.throws(
    () => resolveResizeDimensions({ naturalWidth: 100, naturalHeight: 100, width: 50, lockAspect: false }),
    /both a width and a height/
  );
});
await test("rejects being given neither width nor height", () => {
  assert.throws(() => resolveResizeDimensions({ naturalWidth: 100, naturalHeight: 100 }), /Enter a width/);
});
await test("rejects unreadable natural dimensions", () => {
  assert.throws(() => resolveResizeDimensions({ naturalWidth: 0, naturalHeight: 0, width: 10 }), /corrupted/);
});
await test("clamps output to at least 1px for extreme downscales", () => {
  const r = resolveResizeDimensions({ naturalWidth: 4000, naturalHeight: 10, width: 1, lockAspect: true });
  assert.equal(r.width, 1);
  assert.equal(r.height, 1);
});
await test("clamps output to the maximum dimension", () => {
  const r = resolveResizeDimensions({ naturalWidth: 100, naturalHeight: 100, width: 99999, lockAspect: true });
  assert.equal(r.width, MAX_DIMENSION);
});
await test("fitWithin contains, coverWithin covers", () => {
  assert.deepEqual(fitWithin(1000, 500, 400, 400), { width: 400, height: 200 });
  assert.deepEqual(coverWithin(1000, 500, 400, 400), { width: 800, height: 400 });
});
await test("fitWithin rejects a zero-sized box", () => {
  assert.throws(() => fitWithin(100, 100, 0, 50), /greater than zero/);
});
await test("scaleByPercent halves and rejects nonsense", () => {
  assert.deepEqual(scaleByPercent(1000, 800, 50), { width: 500, height: 400 });
  assert.deepEqual(scaleByPercent(1000, 800, 100), { width: 1000, height: 800 });
  assert.throws(() => scaleByPercent(100, 100, 0), /greater than 0%/);
  assert.throws(() => scaleByPercent(100, 100, 5000), /more than 1000%/);
});
await test("limitLongestSide only shrinks when needed", () => {
  assert.deepEqual(limitLongestSide(4000, 3000, 1920), { width: 1920, height: 1440, scaled: true });
  assert.deepEqual(limitLongestSide(800, 600, 1920), { width: 800, height: 600, scaled: false });
});
await test("limitLongestSide handles the exact boundary as no-op", () => {
  assert.equal(limitLongestSide(1920, 1080, 1920).scaled, false);
});
await test("formatDimensions renders a readable label", () => {
  assert.equal(formatDimensions(1920, 1080), "1920 × 1080");
});

/* ------------------------------------------------------------------ crop */

console.log("Crop maths");
await test("normalizeCropRect rounds to whole pixels", () => {
  assert.deepEqual(normalizeCropRect({ x: 10.4, y: 20.6, width: 99.5, height: 50.2 }, 500, 500), {
    x: 10, y: 21, width: 100, height: 50,
  });
});
await test("clamps a rectangle that runs off the right/bottom edge", () => {
  assert.deepEqual(normalizeCropRect({ x: 450, y: 450, width: 200, height: 200 }, 500, 500), {
    x: 450, y: 450, width: 50, height: 50,
  });
});
await test("pulls a negative origin back inside the image", () => {
  assert.deepEqual(normalizeCropRect({ x: -20, y: -10, width: 100, height: 100 }, 500, 500), {
    x: 0, y: 0, width: 80, height: 90,
  });
});
await test("accepts a full-image rectangle exactly at the bounds", () => {
  assert.deepEqual(normalizeCropRect({ x: 0, y: 0, width: 500, height: 400 }, 500, 400), {
    x: 0, y: 0, width: 500, height: 400,
  });
});
await test("rejects a zero-size crop", () => {
  assert.throws(() => normalizeCropRect({ x: 0, y: 0, width: 0, height: 10 }, 100, 100), /at least 1 × 1/);
});
await test("rejects a crop entirely outside the image", () => {
  assert.throws(() => normalizeCropRect({ x: 600, y: 0, width: 10, height: 10 }, 500, 500), /completely outside/);
});
await test("rejects non-numeric crop values", () => {
  assert.throws(() => normalizeCropRect({ x: "abc", y: 0, width: 10, height: 10 }, 100, 100), /must be a number/);
});
await test("rejects a crop against an unreadable image size", () => {
  assert.throws(() => normalizeCropRect({ x: 0, y: 0, width: 10, height: 10 }, 0, 0), /corrupted/);
});
await test("cropRectFromPercent converts a drag selection to pixels", () => {
  assert.deepEqual(cropRectFromPercent({ x: 25, y: 50, width: 50, height: 25 }, 400, 400), {
    x: 100, y: 200, width: 200, height: 100,
  });
});
await test("centerCropRect on a wide image is limited by height", () => {
  const r = centerCropRect(1000, 500, 1); // square from a 2:1 image
  assert.deepEqual(r, { x: 250, y: 0, width: 500, height: 500 });
});
await test("centerCropRect on a tall image is limited by width", () => {
  const r = centerCropRect(500, 1000, 1);
  assert.deepEqual(r, { x: 0, y: 250, width: 500, height: 500 });
});
await test("centerCropRect with the image's own ratio keeps everything", () => {
  const r = centerCropRect(1000, 500, 2);
  assert.deepEqual(r, { x: 0, y: 0, width: 1000, height: 500 });
});
await test("centerCropRect produces the passport 35:45 ratio", () => {
  const r = centerCropRect(1200, 1600, 35 / 45);
  assert.ok(Math.abs(r.width / r.height - 35 / 45) < 0.01);
  assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= 1200 && r.y + r.height <= 1600);
});
await test("centerCropRect rejects a non-positive ratio", () => {
  assert.throws(() => centerCropRect(100, 100, 0), /greater than zero/);
});
await test("fullImageRect covers the whole image", () => {
  assert.deepEqual(fullImageRect(640, 480), { x: 0, y: 0, width: 640, height: 480 });
});
await test("applyAspectToRect reshapes around the selection's centre", () => {
  const r = applyAspectToRect({ x: 100, y: 100, width: 200, height: 50 }, 1, 1000, 1000);
  assert.equal(r.width, r.height);
  assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= 1000 && r.y + r.height <= 1000);
});
await test("applyAspectToRect stays inside the image when the rect is near an edge", () => {
  const r = applyAspectToRect({ x: 950, y: 950, width: 40, height: 40 }, 1, 1000, 1000);
  assert.ok(r.x + r.width <= 1000);
  assert.ok(r.y + r.height <= 1000);
});

/* ---------------------------------------------------------------- rotate */

console.log("Rotation maths");
await test("normalizeAngle wraps negatives and values over 360", () => {
  assert.equal(normalizeAngle(0), 0);
  assert.equal(normalizeAngle(-90), 270);
  assert.equal(normalizeAngle(450), 90);
  assert.equal(normalizeAngle(720), 0);
});
await test("normalizeAngle rejects non-right angles", () => {
  assert.throws(() => normalizeAngle(45), /90° steps/);
  assert.throws(() => normalizeAngle("abc"), /must be a number/);
});
await test("rotatedDimensions swaps width/height at 90 and 270 only", () => {
  assert.deepEqual(rotatedDimensions(800, 600, 0), { width: 800, height: 600 });
  assert.deepEqual(rotatedDimensions(800, 600, 90), { width: 600, height: 800 });
  assert.deepEqual(rotatedDimensions(800, 600, 180), { width: 800, height: 600 });
  assert.deepEqual(rotatedDimensions(800, 600, 270), { width: 600, height: 800 });
});
await test("rotatedDimensions rejects unreadable input dimensions", () => {
  assert.throws(() => rotatedDimensions(0, 100, 90), /corrupted/);
});
await test("rotationTransform centres the draw on the rotated canvas", () => {
  const t = rotationTransform(800, 600, 90);
  assert.equal(t.canvasWidth, 600);
  assert.equal(t.canvasHeight, 800);
  assert.equal(t.translateX, 300);
  assert.equal(t.translateY, 400);
  assert.ok(Math.abs(t.rotateRadians - Math.PI / 2) < 1e-9);
  assert.equal(t.drawX, -400);
  assert.equal(t.drawY, -300);
});
await test("rotationTransform encodes flips as negative scale", () => {
  const t = rotationTransform(100, 100, 0, { flipHorizontal: true, flipVertical: false });
  assert.equal(t.scaleX, -1);
  assert.equal(t.scaleY, 1);
});
await test("addRotation accumulates and wraps", () => {
  assert.equal(addRotation(270, 90), 0);
  assert.equal(addRotation(0, 270), 270);
  assert.equal(addRotation(180, 180), 0);
});
await test("isNoOpTransform is true only with no rotation and no flips", () => {
  assert.equal(isNoOpTransform(0), true);
  assert.equal(isNoOpTransform(0, { flipHorizontal: true }), false);
  assert.equal(isNoOpTransform(90), false);
  assert.equal(isNoOpTransform(360), true);
});

/* -------------------------------------------------------------- compress */

console.log("Compression strategy");
await test("clampQuality bounds values and survives junk", () => {
  assert.equal(clampQuality(0.5), 0.5);
  assert.equal(clampQuality(2), 1);
  assert.equal(clampQuality(0), 0.1);
  assert.equal(clampQuality(-1), 0.1);
  assert.equal(clampQuality("abc"), 0.8);
});
await test("qualityFromPercent converts slider values", () => {
  assert.equal(qualityFromPercent(80), 0.8);
  assert.equal(qualityFromPercent(100), 1);
  assert.equal(qualityFromPercent(5), 0.1);
});
await test("parseTargetKb converts and validates", () => {
  assert.equal(parseTargetKb(200), 204800);
  assert.throws(() => parseTargetKb(0), /at least 1 KB/);
  assert.throws(() => parseTargetKb("abc"), /must be a number/);
  assert.throws(() => parseTargetKb(200001), /can't be larger/);
});
await test("qualityAppliesTo is false for lossless PNG", () => {
  assert.equal(qualityAppliesTo("jpeg"), true);
  assert.equal(qualityAppliesTo("webp"), true);
  assert.equal(qualityAppliesTo("png"), false);
});
await test("suggestQualityForSize gets stricter as files get bigger", () => {
  assert.equal(suggestQualityForSize(100 * 1024), 0.9);
  assert.equal(suggestQualityForSize(1024 * 1024), 0.8);
  assert.equal(suggestQualityForSize(3 * 1024 * 1024), 0.7);
  assert.equal(suggestQualityForSize(9 * 1024 * 1024), 0.6);
});
await test("target search returns max quality immediately when it already fits", async () => {
  const encode = async (q) => ({ blob: { q }, size: 1000 });
  const r = await findQualityForTargetSize(encode, 5000);
  assert.equal(r.quality, 1);
  assert.equal(r.hitTarget, true);
  assert.equal(r.attempts, 1);
});
await test("target search converges to a size under the target", async () => {
  // Linear model: size scales with quality.
  const encode = async (q) => ({ blob: { q }, size: Math.round(q * 1000000) });
  const r = await findQualityForTargetSize(encode, 400000);
  assert.equal(r.hitTarget, true);
  assert.ok(r.size <= 400000, `expected <= 400000, got ${r.size}`);
  assert.ok(r.quality > 0.35 && r.quality <= 0.4, `quality ${r.quality} should be just under 0.4`);
});
await test("target search reports honestly when the target is unreachable", async () => {
  const encode = async () => ({ blob: {}, size: 900000 }); // never shrinks
  const r = await findQualityForTargetSize(encode, 1000);
  assert.equal(r.hitTarget, false);
  assert.equal(r.size, 900000);
});
await test("target search stays within its attempt budget", async () => {
  let calls = 0;
  const encode = async (q) => { calls++; return { blob: {}, size: Math.round(q * 1000000) }; };
  await findQualityForTargetSize(encode, 1, { maxAttempts: 4 });
  assert.ok(calls <= 4, `expected at most 4 encodes, got ${calls}`);
});
await test("target search rejects invalid arguments", async () => {
  await assert.rejects(() => findQualityForTargetSize(null, 100), /encode function is required/);
  await assert.rejects(() => findQualityForTargetSize(async () => ({ size: 1 }), 0), /greater than zero/);
});

/* -------------------------------------------------------------- passport */

console.log("Passport photo maths");
await test("mmToPx converts at 300 DPI", () => {
  assert.equal(mmToPx(25.4, 300), 300);
  assert.equal(mmToPx(35, 300), 413);
  assert.equal(mmToPx(45, 300), 531);
});
await test("mmToPx rejects invalid input", () => {
  assert.throws(() => mmToPx(0, 300), /greater than zero/);
  assert.throws(() => mmToPx(35, 0), /DPI must be greater than zero/);
});
await test("presetPixelSize returns pixels and the correct aspect ratio", () => {
  const r = presetPixelSize("passport-35x45", 300);
  assert.equal(r.width, 413);
  assert.equal(r.height, 531);
  assert.ok(Math.abs(r.aspectRatio - 35 / 45) < 1e-9);
});
await test("the US 2x2 preset is square", () => {
  const r = presetPixelSize("us-passport-2x2", 300);
  assert.equal(r.width, r.height);
  assert.equal(r.width, 600);
});
await test("600 DPI doubles the pixel output (each rounded independently)", () => {
  const at300 = presetPixelSize("india-passport-35x35", 300);
  const at600 = presetPixelSize("india-passport-35x35", 600);
  // 35mm is 413.39px at 300 DPI and 826.77px at 600 — each is rounded from the
  // exact value, so the pair can differ by a pixel from a straight doubling.
  assert.ok(
    Math.abs(at600.width - at300.width * 2) <= 1,
    `expected ~${at300.width * 2}, got ${at600.width}`
  );
  assert.ok(at600.width > at300.width);
});
await test("every preset is valid and has positive dimensions", () => {
  for (const preset of PASSPORT_PRESETS) {
    const r = presetPixelSize(preset.id, 300);
    assert.ok(r.width > 0 && r.height > 0, `${preset.id} produced ${r.width}x${r.height}`);
  }
});
await test("getPreset rejects an unknown id", () => {
  assert.throws(() => getPreset("not-a-preset"), /Choose a photo size/);
});
await test("checkSourceResolution flags photos that need upscaling", () => {
  const small = checkSourceResolution(200, 250, 413, 531);
  assert.equal(small.tooSmall, true);
  assert.match(small.message, /enlarged/);

  const big = checkSourceResolution(3000, 4000, 413, 531);
  assert.equal(big.tooSmall, false);
  assert.equal(big.message, "");
});
await test("checkSourceResolution treats an exact match as sufficient", () => {
  assert.equal(checkSourceResolution(413, 531, 413, 531).tooSmall, false);
});

/* ------------------------------------------------- pipeline (fake canvas) */

console.log("Processing pipeline (fake canvas renderer)");
await test("convertImage picks the right mime, quality and filename", async () => {
  const deps = fakeDeps({ width: 400, height: 300 });
  const r = await convertImage(fakeFile("holiday.png", "image/png", 5000), { format: "jpeg", quality: 0.8 }, deps);
  assert.equal(r.mime, "image/jpeg");
  assert.equal(r.filename, "holiday.jpg");
  assert.equal(deps.calls.encodes[0].mime, "image/jpeg");
  assert.equal(deps.calls.encodes[0].quality, 0.8);
});
await test("PNG output ignores quality because the format is lossless", async () => {
  const deps = fakeDeps();
  await convertImage(fakeFile("a.jpg", "image/jpeg"), { format: "png", quality: 0.5 }, deps);
  assert.equal(deps.calls.encodes[0].quality, undefined);
});
await test("converting to JPG paints a white background for transparency", async () => {
  const deps = fakeDeps();
  await convertImage(fakeFile("logo.png", "image/png"), { format: "jpeg" }, deps);
  assert.ok(deps.calls.fills.some((f) => f.style === "#ffffff"), "expected a white background fill");
});
await test("converting to PNG does not paint a background", async () => {
  const deps = fakeDeps();
  await convertImage(fakeFile("logo.png", "image/png"), { format: "png" }, deps);
  assert.equal(deps.calls.fills.length, 0);
});
await test("output defaults to the input's own format", async () => {
  const deps = fakeDeps();
  const r = await convertImage(fakeFile("a.webp", "image/webp"), {}, deps);
  assert.equal(r.mime, "image/webp");
});
await test("resizeImage creates a canvas of the resolved size", async () => {
  const deps = fakeDeps({ width: 1600, height: 900 });
  const r = await resizeImage(fakeFile("wide.jpg", "image/jpeg"), { width: 800, lockAspect: true }, deps);
  assert.equal(r.width, 800);
  assert.equal(r.height, 450);
  assert.deepEqual(deps.calls.canvases[0], { width: 800, height: 450 });
  assert.equal(r.filename, "wide-resized.jpg");
});
await test("resizeImage without aspect lock uses exact dimensions", async () => {
  const deps = fakeDeps({ width: 1000, height: 1000 });
  const r = await resizeImage(fakeFile("sq.jpg", "image/jpeg"), { width: 300, height: 900, lockAspect: false }, deps);
  assert.equal(r.width, 300);
  assert.equal(r.height, 900);
});
await test("resize draws the full source rect into the output rect", async () => {
  const deps = fakeDeps({ width: 1600, height: 900 });
  await resizeImage(fakeFile("wide.jpg", "image/jpeg"), { width: 800 }, deps);
  const [, sx, sy, sw, sh, dx, dy, dw, dh] = deps.calls.draws[0].args;
  assert.deepEqual([sx, sy, sw, sh], [0, 0, 1600, 900]);
  assert.deepEqual([dx, dy, dw, dh], [0, 0, 800, 450]);
});
await test("cropImage draws only the selected source rectangle", async () => {
  const deps = fakeDeps({ width: 1000, height: 1000 });
  const r = await cropImage(fakeFile("a.jpg", "image/jpeg"), { crop: { x: 100, y: 200, width: 400, height: 300 } }, deps);
  const [, sx, sy, sw, sh] = deps.calls.draws[0].args;
  assert.deepEqual([sx, sy, sw, sh], [100, 200, 400, 300]);
  assert.equal(r.width, 400);
  assert.equal(r.height, 300);
  assert.equal(r.filename, "a-cropped.jpg");
});
await test("cropImage clamps an oversized rect rather than failing", async () => {
  const deps = fakeDeps({ width: 500, height: 500 });
  const r = await cropImage(fakeFile("a.jpg", "image/jpeg"), { crop: { x: 400, y: 400, width: 500, height: 500 } }, deps);
  assert.equal(r.width, 100);
  assert.equal(r.height, 100);
});
await test("cropImage rejects a crop outside the image with a clear message", async () => {
  const deps = fakeDeps({ width: 500, height: 500 });
  await assert.rejects(
    () => cropImage(fakeFile("a.jpg", "image/jpeg"), { crop: { x: 900, y: 0, width: 50, height: 50 } }, deps),
    /completely outside/
  );
});
await test("cropImage requires a selection", () => {
  assert.throws(() => cropImage(fakeFile("a.jpg", "image/jpeg"), {}, fakeDeps()), /Select the area/);
});
await test("rotateImage 90° makes a second, swapped canvas and applies the transform", async () => {
  const deps = fakeDeps({ width: 800, height: 600 });
  const r = await rotateImage(fakeFile("p.jpg", "image/jpeg"), { rotation: 90 }, deps);
  assert.equal(r.width, 600);
  assert.equal(r.height, 800);
  assert.equal(deps.calls.canvases.length, 2);
  assert.deepEqual(deps.calls.canvases[1], { width: 600, height: 800 });

  const ops = deps.calls.transforms;
  assert.equal(ops[0].op, "translate");
  assert.deepEqual([ops[0].x, ops[0].y], [300, 400]);
  assert.equal(ops[1].op, "rotate");
  assert.ok(Math.abs(ops[1].radians - Math.PI / 2) < 1e-9);
});
await test("rotateImage with no rotation skips the second canvas entirely", async () => {
  const deps = fakeDeps({ width: 800, height: 600 });
  await rotateImage(fakeFile("p.jpg", "image/jpeg"), { rotation: 0 }, deps);
  assert.equal(deps.calls.canvases.length, 1);
  assert.equal(deps.calls.transforms.length, 0);
});
await test("flip alone still applies a transform pass", async () => {
  const deps = fakeDeps({ width: 100, height: 100 });
  await rotateImage(fakeFile("p.jpg", "image/jpeg"), { rotation: 0, flipHorizontal: true }, deps);
  const scaleOp = deps.calls.transforms.find((o) => o.op === "scale");
  assert.deepEqual([scaleOp.x, scaleOp.y], [-1, 1]);
});
await test("rotateImage rejects a non-right angle", async () => {
  await assert.rejects(
    () => rotateImage(fakeFile("p.jpg", "image/jpeg"), { rotation: 37 }, fakeDeps()),
    /90° steps/
  );
});
await test("compressImage in quality mode passes the quality straight through", async () => {
  const deps = fakeDeps({ width: 100, height: 100 });
  const r = await compressImage(fakeFile("big.jpg", "image/jpeg", 9000), { mode: "quality", quality: 0.6 }, deps);
  assert.equal(deps.calls.encodes[0].quality, 0.6);
  assert.equal(r.filename, "big-compressed.jpg");
});
await test("compressImage in target mode searches and reports the result", async () => {
  const deps = fakeDeps({
    width: 1000,
    height: 1000,
    sizeForQuality: (q) => Math.round(q * 2000000),
  });
  const r = await compressImage(
    fakeFile("big.jpg", "image/jpeg", 2000000),
    { mode: "target", targetBytes: 500000 },
    deps
  );
  assert.equal(r.hitTarget, true);
  assert.ok(r.size <= 500000);
  assert.ok(deps.calls.encodes.length > 1, "expected more than one encode attempt");
});
await test("compressImage target mode flags an unreachable target instead of lying", async () => {
  const deps = fakeDeps({ width: 100, height: 100, sizeForQuality: () => 800000 });
  const r = await compressImage(
    fakeFile("big.jpg", "image/jpeg", 800000),
    { mode: "target", targetBytes: 1024 },
    deps
  );
  assert.equal(r.hitTarget, false);
});
await test("compressImage refuses target mode for lossless PNG with an explanation", () => {
  assert.throws(
    () => compressImage(fakeFile("a.png", "image/png"), { mode: "target", targetBytes: 1000, format: "png" }, fakeDeps()),
    /lossless/
  );
});
await test("compressImage can shrink dimensions via maxSide", async () => {
  const deps = fakeDeps({ width: 4000, height: 3000 });
  const r = await compressImage(fakeFile("photo.jpg", "image/jpeg"), { maxSide: 1920 }, deps);
  assert.equal(r.width, 1920);
  assert.equal(r.height, 1440);
});
await test("processImage surfaces a decode failure as a friendly error", async () => {
  await assert.rejects(
    () => processImage(fakeFile("broken.jpg", "image/jpeg"), {}, fakeDeps({ failLoad: true })),
    /corrupted/
  );
});
await test("processImage rejects an image whose dimensions read as zero", async () => {
  await assert.rejects(
    () => processImage(fakeFile("broken.jpg", "image/jpeg"), {}, fakeDeps({ width: 0, height: 0 })),
    /corrupted/
  );
});
await test("processImage rejects a missing renderer dependency", async () => {
  await assert.rejects(
    () => processImage(fakeFile("a.jpg", "image/jpeg"), {}, { loadImage: () => {} }),
    /missing "createCanvas"/
  );
});
await test("processImage validates the file before doing any work", async () => {
  const deps = fakeDeps();
  await assert.rejects(() => processImage(fakeFile("doc.pdf", "application/pdf"), {}, deps), /not an image file/);
  assert.equal(deps.calls.canvases.length, 0);
});
await test("size reporting compares original and output bytes", async () => {
  const deps = fakeDeps({ width: 100, height: 100, sizeForQuality: () => 2500 });
  const r = await convertImage(fakeFile("a.jpg", "image/jpeg", 10000), { format: "jpeg" }, deps);
  assert.equal(r.originalSize, 10000);
  assert.equal(r.size, 2500);
  assert.equal(r.percentSaved, 75);
});

console.log("Passport pipeline");
await test("createPassportPhoto centre-crops then scales to the exact print size", async () => {
  const deps = fakeDeps({ width: 2000, height: 3000 });
  const r = await createPassportPhoto(fakeFile("me.jpg", "image/jpeg", 500000), { presetId: "passport-35x45", dpi: 300 }, deps);
  assert.equal(r.width, 413);
  assert.equal(r.height, 531);
  assert.equal(r.filename, "me-passport.jpg");

  const [, sx, sy, sw, sh] = deps.calls.draws[0].args;
  assert.ok(Math.abs(sw / sh - 35 / 45) < 0.01, "source rect should already be the target ratio");
  assert.ok(sx >= 0 && sy >= 0 && sx + sw <= 2000 && sy + sh <= 3000);
});
await test("createPassportPhoto warns when the source is too small to print", async () => {
  const deps = fakeDeps({ width: 200, height: 260 });
  const r = await createPassportPhoto(fakeFile("tiny.jpg", "image/jpeg"), { presetId: "passport-35x45", dpi: 300 }, deps);
  assert.match(r.resolutionWarning, /enlarged/);
});
await test("createPassportPhoto gives no warning for a high-resolution photo", async () => {
  const deps = fakeDeps({ width: 3000, height: 4000 });
  const r = await createPassportPhoto(fakeFile("good.jpg", "image/jpeg"), { presetId: "passport-35x45" }, deps);
  assert.equal(r.resolutionWarning, "");
});
await test("createPassportPhoto rejects an unknown preset", async () => {
  await assert.rejects(
    () => createPassportPhoto(fakeFile("a.jpg", "image/jpeg"), { presetId: "nope" }, fakeDeps()),
    /Choose a photo size/
  );
});
await test("createPassportPhoto always fills a white background", async () => {
  const deps = fakeDeps({ width: 1000, height: 1000 });
  await createPassportPhoto(fakeFile("a.png", "image/png"), { presetId: "us-passport-2x2", format: "png" }, deps);
  assert.ok(deps.calls.fills.some((f) => f.style === "#ffffff"));
});

/* ------------------------------------------------------------ image->pdf */

console.log("Image to PDF layout");
await test("pageSize auto keeps the Phase 3 behaviour exactly", () => {
  assert.deepEqual(computePageLayout(640, 480), {
    pageWidth: 640, pageHeight: 480, x: 0, y: 0, width: 640, height: 480,
  });
});
await test("A4 portrait fits a tall image with no margin", () => {
  const l = computePageLayout(1000, 2000, { pageSize: "a4" });
  assert.equal(Math.round(l.pageWidth), Math.round(PAGE_SIZES.a4.width));
  assert.ok(l.width <= l.pageWidth + 0.01 && l.height <= l.pageHeight + 0.01);
  assert.ok(Math.abs(l.width / l.height - 0.5) < 1e-9, "aspect ratio must be preserved");
});
await test("A4 auto-orientation switches to landscape for a wide image", () => {
  const l = computePageLayout(2000, 1000, { pageSize: "a4", orientation: "auto" });
  assert.ok(l.pageWidth > l.pageHeight, "expected a landscape page");
});
await test("forced portrait overrides auto-orientation", () => {
  const l = computePageLayout(2000, 1000, { pageSize: "a4", orientation: "portrait" });
  assert.ok(l.pageHeight > l.pageWidth);
});
await test("margins shrink the drawn image and keep it centred", () => {
  const none = computePageLayout(1000, 1000, { pageSize: "a4" });
  const margined = computePageLayout(1000, 1000, { pageSize: "a4", margin: 72 });
  assert.ok(margined.width < none.width);
  assert.ok(Math.abs(margined.x + margined.width / 2 - margined.pageWidth / 2) < 0.01);
});
await test("an absurd margin is clamped instead of producing a negative size", () => {
  const l = computePageLayout(1000, 1000, { pageSize: "a5", margin: 100000 });
  assert.ok(l.width > 0 && l.height > 0);
});
await test("computePageLayout rejects an unknown page size and bad dimensions", () => {
  assert.throws(() => computePageLayout(100, 100, { pageSize: "a9" }), /not a supported page size/);
  assert.throws(() => computePageLayout(0, 100, { pageSize: "a4" }), /corrupted/);
});
await test("needsReEncoding is true only for formats pdf-lib can't embed", () => {
  assert.equal(needsReEncoding("image/jpeg"), false);
  assert.equal(needsReEncoding("image/png"), false);
  assert.equal(needsReEncoding("image/webp"), true);
  assert.equal(needsReEncoding("image/gif"), true);
});
await test("prepareImageForPdf passes a JPG through without re-encoding", async () => {
  const deps = fakeDeps();
  const r = await prepareImageForPdf(fakeFile("a.jpg", "image/jpeg", 100), deps);
  assert.equal(r.reEncoded, false);
  assert.equal(r.type, "image/jpeg");
  assert.equal(deps.calls.encodes.length, 0);
});
await test("prepareImageForPdf re-encodes WebP to JPG so pdf-lib can embed it", async () => {
  const deps = fakeDeps({ width: 100, height: 100 });
  const r = await prepareImageForPdf(fakeFile("a.webp", "image/webp", 100), deps);
  assert.equal(r.reEncoded, true);
  assert.equal(r.type, "image/jpeg");
  assert.equal(deps.calls.encodes[0].mime, "image/jpeg");
});
await test("prepareImageForPdf rejects a non-image file", async () => {
  await assert.rejects(() => prepareImageForPdf(fakeFile("a.pdf", "application/pdf", 10), fakeDeps()), /not an image/);
});

console.log(`\n${passed} tests passed.`);
if (process.exitCode === 1) {
  console.error("\nSome tests FAILED. See above.");
} else {
  console.log(
    "All image logic tests passed. NOTE: these exercise the pure maths and the\n" +
    "pipeline's call sequence through a fake canvas renderer. Real pixel output,\n" +
    "real encoders and drag-and-drop still require manual browser testing."
  );
}
