/**
 * Shared PDF.js page-rendering helpers.
 *
 * Display size (CSS pixels) is deliberately separate from backing-store
 * resolution. High-density screens render sharply without mutating the PDF,
 * while a pixel budget prevents pathological zoom/DPR combinations from
 * exhausting browser memory.
 */

export const DEFAULT_MAX_RENDER_PIXELS = 16_000_000;
export const DEFAULT_MAX_RENDER_DIMENSION = 8192;

export function getSafeDevicePixelRatio() {
  const dpr = Number(globalThis.window?.devicePixelRatio || 1);
  return Number.isFinite(dpr) && dpr > 0 ? Math.min(dpr, 4) : 1;
}

export function computeOutputScale(cssWidth, cssHeight, {
  devicePixelRatio = getSafeDevicePixelRatio(),
  maxPixels = DEFAULT_MAX_RENDER_PIXELS,
  maxDimension = DEFAULT_MAX_RENDER_DIMENSION,
} = {}) {
  if (!(cssWidth > 0) || !(cssHeight > 0)) throw new Error("PDF viewport dimensions are invalid.");
  const requested = Math.max(1, Number(devicePixelRatio) || 1);
  const byPixels = Math.sqrt(maxPixels / (cssWidth * cssHeight));
  const byDimension = Math.min(maxDimension / cssWidth, maxDimension / cssHeight);
  // On extremely large pages/zoom levels, safety can require a backing scale
  // below 1. That is preferable to silently allocating a 100+ MP canvas and
  // crashing the tab. Normal pages still receive DPR-level backing pixels.
  return Math.max(Number.EPSILON, Math.min(requested, byPixels, byDimension));
}

export function prepareCanvasForPdfPage(canvas, page, {
  scale = 1,
  rotation = 0,
  devicePixelRatio,
  maxPixels,
  maxDimension,
} = {}) {
  if (!canvas) throw new Error("A canvas is required to render the PDF page.");
  const cssViewport = page.getViewport({ scale, rotation });
  const outputScale = computeOutputScale(cssViewport.width, cssViewport.height, {
    devicePixelRatio,
    maxPixels,
    maxDimension,
  });
  const renderViewport = page.getViewport({ scale: scale * outputScale, rotation });

  canvas.width = Math.max(1, Math.round(renderViewport.width));
  canvas.height = Math.max(1, Math.round(renderViewport.height));
  // CSS size controls layout only. Backing pixels stay high resolution.
  canvas.style.width = `${Math.max(1, Math.round(cssViewport.width))}px`;
  canvas.style.height = `${Math.max(1, Math.round(cssViewport.height))}px`;

  return { cssViewport, renderViewport, outputScale };
}

export function beginPdfPageRender(page, canvas, options = {}) {
  const prepared = prepareCanvasForPdfPage(canvas, page, options);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Unable to create a PDF rendering canvas.");
  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
  const renderTask = page.render({ canvasContext: context, viewport: prepared.renderViewport });
  return { ...prepared, renderTask, width: canvas.width, height: canvas.height };
}

export async function renderPdfPageToCanvas(page, canvas, options = {}) {
  const started = beginPdfPageRender(page, canvas, options);
  await started.renderTask.promise;
  return started;
}

export function scaleForDpi(dpi = 150) {
  const value = Number(dpi);
  if (!Number.isFinite(value) || value < 36 || value > 600) {
    throw new Error("PDF image resolution must be between 36 and 600 DPI.");
  }
  return value / 72;
}

/** Render a low-resolution navigation thumbnail. Never use its output for export. */
export async function renderPdfThumbnail(page, { maxWidth = 120, format = "image/jpeg", quality = 0.78 } = {}) {
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(1, maxWidth / base.width);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, format === "image/png" ? undefined : quality));
  if (!blob) throw new Error("Unable to create PDF thumbnail.");
  return { blob, width: canvas.width, height: canvas.height, role: "thumbnail" };
}
