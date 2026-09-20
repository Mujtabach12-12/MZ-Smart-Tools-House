/**
 * Passport / ID photo sizing.
 *
 * Pure maths only — the actual crop+resize is done by ./process.js. Sizes are
 * the widely published print dimensions for each document type; always check
 * the current requirements of the authority you're applying to, since they do
 * change and some add rules this tool can't enforce (head height, background
 * colour, expression).
 */

export const PASSPORT_PRESETS = [
  { id: "passport-35x45", label: "Passport 35 × 45 mm (most countries)", widthMm: 35, heightMm: 45 },
  { id: "us-passport-2x2", label: "US Passport / Visa 2 × 2 in (51 × 51 mm)", widthMm: 50.8, heightMm: 50.8 },
  { id: "schengen-35x45", label: "Schengen Visa 35 × 45 mm", widthMm: 35, heightMm: 45 },
  { id: "uk-passport-35x45", label: "UK Passport 35 × 45 mm", widthMm: 35, heightMm: 45 },
  { id: "india-passport-35x35", label: "India Passport 35 × 35 mm", widthMm: 35, heightMm: 35 },
  { id: "pakistan-nadra-35x45", label: "Pakistan NADRA / Passport 35 × 45 mm", widthMm: 35, heightMm: 45 },
  { id: "china-visa-33x48", label: "China Visa 33 × 48 mm", widthMm: 33, heightMm: 48 },
  { id: "canada-50x70", label: "Canada Passport 50 × 70 mm", widthMm: 50, heightMm: 70 },
  { id: "australia-35x45", label: "Australia Passport 35 × 45 mm", widthMm: 35, heightMm: 45 },
  { id: "student-id-25x35", label: "Student / Exam ID 25 × 35 mm", widthMm: 25, heightMm: 35 },
];

export const DPI_OPTIONS = [300, 600];
export const DEFAULT_DPI = 300;

const MM_PER_INCH = 25.4;

export function getPreset(presetId) {
  const preset = PASSPORT_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    throw new Error("Choose a photo size from the list.");
  }
  return preset;
}

/** Millimetres -> pixels at a given print resolution. */
export function mmToPx(mm, dpi = DEFAULT_DPI) {
  const millimetres = Number(mm);
  const resolution = Number(dpi);
  if (!Number.isFinite(millimetres) || millimetres <= 0) {
    throw new Error("Size in millimetres must be greater than zero.");
  }
  if (!Number.isFinite(resolution) || resolution <= 0) {
    throw new Error("DPI must be greater than zero.");
  }
  return Math.round((millimetres / MM_PER_INCH) * resolution);
}

/** Pixel output size for a preset at a given DPI, plus its aspect ratio. */
export function presetPixelSize(presetId, dpi = DEFAULT_DPI) {
  const preset = getPreset(presetId);
  const width = mmToPx(preset.widthMm, dpi);
  const height = mmToPx(preset.heightMm, dpi);
  return {
    width,
    height,
    aspectRatio: preset.widthMm / preset.heightMm,
    preset,
    dpi: Number(dpi),
  };
}

/**
 * Warns when the source photo has fewer pixels than the target print size, so
 * the user knows the result will be upscaled (and softer) rather than finding
 * out at the print shop.
 */
export function checkSourceResolution(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  if (!(sourceWidth > 0) || !(sourceHeight > 0)) {
    throw new Error("This image's dimensions could not be read — the file may be corrupted.");
  }
  const tooSmall = sourceWidth < targetWidth || sourceHeight < targetHeight;
  return {
    tooSmall,
    message: tooSmall
      ? `Your photo is ${sourceWidth} × ${sourceHeight}px but the selected size needs ${targetWidth} × ${targetHeight}px. It will be enlarged, which can look soft when printed — a higher-resolution photo will give a better result.`
      : "",
  };
}
