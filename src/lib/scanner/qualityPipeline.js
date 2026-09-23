/**
 * Scanner quality primitives.
 * Detection/preview canvases may be reduced, but the master image is never
 * replaced by those derivatives. Final perspective correction receives the
 * full-resolution master coordinates and preserves the crop's natural pixel
 * dimensions unless memory safety requires an explicit error.
 */

export const SCANNER_DETECTION_MAX_SIDE = 1600;
export const SCANNER_PREVIEW_MAX_SIDE = 1400;
export const SCANNER_MAX_OUTPUT_PIXELS = 24_000_000;

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const clamp255 = (n) => Math.min(255, Math.max(0, n));

export function dimensionsAfterRotation(width, height, rotation = 0) {
  const angle = ((Number(rotation) % 360) + 360) % 360;
  if (![0, 90, 180, 270].includes(angle)) throw new Error("Scanner rotation must be a 90° step.");
  return angle === 90 || angle === 270 ? { width: height, height: width } : { width, height };
}

export function createProxyCanvas(source, sourceWidth, sourceHeight, maxSide = SCANNER_DETECTION_MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  return canvas;
}


export function createRotatedProxy(source, sourceWidth, sourceHeight, rotation = 0, maxSide = SCANNER_DETECTION_MAX_SIDE) {
  const angle = ((Number(rotation) % 360) + 360) % 360;
  const proxy = createProxyCanvas(source, sourceWidth, sourceHeight, maxSide);
  if (angle === 0) return proxy;
  const size = dimensionsAfterRotation(proxy.width, proxy.height, angle);
  const rotated = document.createElement("canvas");
  rotated.width = size.width;
  rotated.height = size.height;
  const context = rotated.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.translate(rotated.width / 2, rotated.height / 2);
  context.rotate((angle * Math.PI) / 180);
  context.drawImage(proxy, -proxy.width / 2, -proxy.height / 2);
  return rotated;
}
/** Draws a 90°-step rotated master without any scale-down. */
export function drawRotatedMaster(source, sourceWidth, sourceHeight, rotation = 0) {
  const angle = ((Number(rotation) % 360) + 360) % 360;
  const size = dimensionsAfterRotation(sourceWidth, sourceHeight, angle);
  const pixels = size.width * size.height;
  if (pixels > SCANNER_MAX_OUTPUT_PIXELS) {
    throw new Error(`This ${sourceWidth} × ${sourceHeight} image is too large for safe full-resolution browser processing. The original is preserved; use a smaller camera photo or a desktop browser.`);
  }
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.translate(size.width / 2, size.height / 2);
  context.rotate((angle * Math.PI) / 180);
  context.drawImage(source, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
  return canvas;
}

export function normalizedPointsToPixels(points, width, height) {
  return points.map(([x, y]) => [x * width, y * height]);
}

export function outputSizeForPerspective(points, { maxPixels = SCANNER_MAX_OUTPUT_PIXELS, maxSide = null } = {}) {
  const [tl, tr, br, bl] = points;
  const naturalWidth = Math.max(
    Math.hypot(tr[0] - tl[0], tr[1] - tl[1]),
    Math.hypot(br[0] - bl[0], br[1] - bl[1]),
  );
  const naturalHeight = Math.max(
    Math.hypot(bl[0] - tl[0], bl[1] - tl[1]),
    Math.hypot(br[0] - tr[0], br[1] - tr[1]),
  );
  let scale = 1;
  if (Number.isFinite(maxSide) && maxSide > 0) scale = Math.min(scale, maxSide / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));
  if (width * height > maxPixels) {
    throw new Error(`The corrected scan would be ${width} × ${height} (${Math.round(width * height / 1_000_000)} MP), which is too large for safe browser processing. The original image remains untouched.`);
  }
  return { width, height, naturalWidth: Math.round(naturalWidth), naturalHeight: Math.round(naturalHeight), scale };
}

function solveHomography(A, b) {
  const n = 8;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const q = M[c][c];
    if (Math.abs(q) < 1e-9) throw new Error("Perspective correction failed because the crop corners are invalid.");
    for (let j = c; j <= n; j++) M[c][j] /= q;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((r) => r[n]);
}

function sampleBilinear(data, width, height, x, y, channel) {
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const x1 = Math.max(0, Math.min(width - 1, x0 + 1));
  const y1 = Math.max(0, Math.min(height - 1, y0 + 1));
  const fx = Math.max(0, Math.min(1, x - x0));
  const fy = Math.max(0, Math.min(1, y - y0));
  const p00 = data[(y0 * width + x0) * 4 + channel];
  const p10 = data[(y0 * width + x1) * 4 + channel];
  const p01 = data[(y1 * width + x0) * 4 + channel];
  const p11 = data[(y1 * width + x1) * 4 + channel];
  const top = p00 + (p10 - p00) * fx;
  const bottom = p01 + (p11 - p01) * fx;
  return top + (bottom - top) * fy;
}

function enhancementPreset(source, mode) {
  let presetBrightness = 0;
  let presetContrast = 0;
  if (mode === "auto") {
    let total = 0, totalSq = 0, count = 0;
    const pixels = source.width * source.height;
    const stride = Math.max(1, Math.floor(pixels / 30000));
    for (let pixel = 0; pixel < pixels; pixel += stride) {
      const i = pixel * 4;
      const lum = 0.299 * source.data[i] + 0.587 * source.data[i + 1] + 0.114 * source.data[i + 2];
      total += lum; totalSq += lum * lum; count += 1;
    }
    const mean = count ? total / count : 160;
    const deviation = count ? Math.sqrt(Math.max(0, totalSq / count - mean * mean)) : 55;
    presetBrightness = Math.max(-10, Math.min(10, (172 - mean) / 3.2));
    presetContrast = deviation < 38 ? 16 : deviation < 55 ? 10 : 5;
  } else if (mode === "light") {
    presetBrightness = 12;
    presetContrast = 5;
  }
  return { presetBrightness, presetContrast };
}

function applyEnhancement(r, g, b, mode, brightnessOffset, contrastFactor) {
  r = clamp255((r - 128) * contrastFactor + 128 + brightnessOffset);
  g = clamp255((g - 128) * contrastFactor + 128 + brightnessOffset);
  b = clamp255((b - 128) * contrastFactor + 128 + brightnessOffset);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (mode === "grayscale") return [lum, lum, lum];
  if (mode === "bw") {
    const value = lum > 150 ? 255 : 0;
    return [value, value, value];
  }
  if (mode === "color") {
    const sat = 1.34;
    return [clamp255(lum + (r - lum) * sat), clamp255(lum + (g - lum) * sat), clamp255(lum + (b - lum) * sat)];
  }
  if (mode === "contrast") {
    return [r, g, b].map((v) => clamp255(((v / 255 - 0.5) * 1.45 + 0.5) * 255));
  }
  if (mode === "document") {
    const paperLift = lum > 165 ? 10 : 4;
    const docContrast = 1.12;
    r = clamp255((r - 128) * docContrast + 128 + paperLift);
    g = clamp255((g - 128) * docContrast + 128 + paperLift);
    b = clamp255((b - 128) * docContrast + 128 + paperLift);
    const cleanLum = 0.299 * r + 0.587 * g + 0.114 * b;
    return [
      clamp255(cleanLum + (r - cleanLum) * 0.72),
      clamp255(cleanLum + (g - cleanLum) * 0.72),
      clamp255(cleanLum + (b - cleanLum) * 0.72),
    ];
  }
  return [r, g, b];
}

/**
 * Bilinear perspective correction. This replaces nearest-neighbour sampling.
 * The function yields periodically so multi-megapixel scans do not monopolize
 * the UI thread for one uninterrupted task.
 */
export async function warpPerspective(sourceCanvas, points, mode = "original", adjustments = {}, options = {}) {
  const size = outputSizeForPerspective(points, options);
  const output = document.createElement("canvas");
  output.width = size.width;
  output.height = size.height;
  const outputContext = output.getContext("2d", { willReadFrequently: true });
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const source = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const dest = outputContext.createImageData(output.width, output.height);

  const dst = [[0, 0], [output.width, 0], [output.width, output.height], [0, output.height]];
  const A = [], b = [];
  dst.forEach(([x, y], i) => {
    const [u, v] = points[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]); b.push(v);
  });
  const H = solveHomography(A, b);
  const { presetBrightness, presetContrast } = enhancementPreset(source, mode);
  const brightnessOffset = Math.max(-100, Math.min(100, Number(adjustments.brightness || 0) + presetBrightness)) * 2.55;
  const contrastFactor = 1 + Math.max(-80, Math.min(100, Number(adjustments.contrast || 0) + presetContrast)) / 100;
  const yieldEveryRows = options.yieldEveryRows ?? (output.width * output.height > 2_000_000 ? 40 : 0);

  for (let y = 0; y < output.height; y++) {
    for (let x = 0; x < output.width; x++) {
      const den = H[6] * x + H[7] * y + 1;
      const u = (H[0] * x + H[1] * y + H[2]) / den;
      const v = (H[3] * x + H[4] * y + H[5]) / den;
      let r = sampleBilinear(source.data, source.width, source.height, u, v, 0);
      let g = sampleBilinear(source.data, source.width, source.height, u, v, 1);
      let q = sampleBilinear(source.data, source.width, source.height, u, v, 2);
      [r, g, q] = applyEnhancement(r, g, q, mode, brightnessOffset, contrastFactor);
      const di = (y * output.width + x) * 4;
      dest.data[di] = r; dest.data[di + 1] = g; dest.data[di + 2] = q; dest.data[di + 3] = 255;
    }
    if (yieldEveryRows && y && y % yieldEveryRows === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  outputContext.putImageData(dest, 0, 0);

  const sharpenAmount = Math.max(mode === "sharpen" ? 0.65 : 0, clamp01(Number(adjustments.sharpen || 0) / 100));
  if (sharpenAmount > 0 && output.width * output.height <= 4_500_000) {
    const current = outputContext.getImageData(0, 0, output.width, output.height);
    const copy = new Uint8ClampedArray(current.data);
    const strength = 0.55 * sharpenAmount;
    for (let y = 1; y < output.height - 1; y++) {
      for (let x = 1; x < output.width - 1; x++) {
        const i = (y * output.width + x) * 4;
        const up = i - output.width * 4, down = i + output.width * 4, left = i - 4, right = i + 4;
        for (let c = 0; c < 3; c++) {
          const center = copy[i + c];
          const blurred = (copy[up + c] + copy[down + c] + copy[left + c] + copy[right + c]) / 4;
          current.data[i + c] = clamp255(center + (center - blurred) * strength);
        }
      }
      if (yieldEveryRows && y % yieldEveryRows === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    outputContext.putImageData(current, 0, 0);
  }

  return { canvas: output, ...size };
}

export async function canvasToBlob(canvas, type = "image/png", quality) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, type === "image/png" ? undefined : quality));
  if (!blob) throw new Error("The browser could not encode the processed scan.");
  return blob;
}
