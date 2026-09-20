/**
 * Pure crop-rectangle maths. No DOM — fully unit-tested.
 *
 * All rectangles are `{ x, y, width, height }` in source-image pixels, with
 * the origin at the image's top-left corner.
 */

function assertImageSize(imageWidth, imageHeight) {
  if (!(imageWidth > 0) || !(imageHeight > 0)) {
    throw new Error("This image's dimensions could not be read — the file may be corrupted.");
  }
}

/**
 * Validates and clamps a crop rectangle against the image bounds.
 *
 * Rounds to whole pixels, pulls a partially out-of-bounds rectangle back
 * inside the image, and throws a user-facing error if nothing usable is left.
 */
export function normalizeCropRect(rect, imageWidth, imageHeight) {
  assertImageSize(imageWidth, imageHeight);

  const { x, y, width, height } = rect || {};
  for (const [label, value] of [["X", x], ["Y", y], ["Width", width], ["Height", height]]) {
    if (!Number.isFinite(Number(value))) {
      throw new Error(`Crop ${label.toLowerCase()} must be a number.`);
    }
  }

  let rx = Math.round(Number(x));
  let ry = Math.round(Number(y));
  let rw = Math.round(Number(width));
  let rh = Math.round(Number(height));

  if (rw < 1 || rh < 1) {
    throw new Error("The crop area must be at least 1 × 1 pixel.");
  }

  if (rx >= imageWidth || ry >= imageHeight || rx + rw <= 0 || ry + rh <= 0) {
    throw new Error("The crop area is completely outside the image.");
  }

  // Pull a negative origin back to 0, shrinking the rect by the same amount.
  if (rx < 0) { rw += rx; rx = 0; }
  if (ry < 0) { rh += ry; ry = 0; }

  rw = Math.min(rw, imageWidth - rx);
  rh = Math.min(rh, imageHeight - ry);

  if (rw < 1 || rh < 1) {
    throw new Error("The crop area is outside the image bounds.");
  }

  return { x: rx, y: ry, width: rw, height: rh };
}

/**
 * Converts a percentage-based rectangle (0–100 of each axis) — what a
 * drag-to-select overlay produces — into pixels.
 */
export function cropRectFromPercent(percentRect, imageWidth, imageHeight) {
  assertImageSize(imageWidth, imageHeight);
  const { x = 0, y = 0, width = 0, height = 0 } = percentRect || {};
  return normalizeCropRect(
    {
      x: (Number(x) / 100) * imageWidth,
      y: (Number(y) / 100) * imageHeight,
      width: (Number(width) / 100) * imageWidth,
      height: (Number(height) / 100) * imageHeight,
    },
    imageWidth,
    imageHeight
  );
}

/**
 * Largest rectangle of the given aspect ratio (width / height), centred in
 * the image. Used by the aspect presets in the cropper and by the passport
 * photo tool.
 */
export function centerCropRect(imageWidth, imageHeight, aspectRatio) {
  assertImageSize(imageWidth, imageHeight);
  const ratio = Number(aspectRatio);
  if (!Number.isFinite(ratio) || ratio <= 0) {
    throw new Error("Aspect ratio must be greater than zero.");
  }

  const imageRatio = imageWidth / imageHeight;
  let width;
  let height;

  if (imageRatio > ratio) {
    // Source is wider than the target ratio: height is the limiting side.
    height = imageHeight;
    width = height * ratio;
  } else {
    width = imageWidth;
    height = width / ratio;
  }

  width = Math.floor(width);
  height = Math.floor(height);

  return normalizeCropRect(
    {
      x: Math.round((imageWidth - width) / 2),
      y: Math.round((imageHeight - height) / 2),
      width,
      height,
    },
    imageWidth,
    imageHeight
  );
}

/** A full-image rectangle — the cropper's starting selection and Reset target. */
export function fullImageRect(imageWidth, imageHeight) {
  assertImageSize(imageWidth, imageHeight);
  return { x: 0, y: 0, width: Math.round(imageWidth), height: Math.round(imageHeight) };
}

/**
 * Re-shapes an existing rectangle to a target aspect ratio while keeping its
 * centre, then clamps it into the image. Used when the user picks "1:1" after
 * already dragging a selection.
 */
export function applyAspectToRect(rect, aspectRatio, imageWidth, imageHeight) {
  const base = normalizeCropRect(rect, imageWidth, imageHeight);
  const ratio = Number(aspectRatio);
  if (!Number.isFinite(ratio) || ratio <= 0) {
    throw new Error("Aspect ratio must be greater than zero.");
  }

  const centerX = base.x + base.width / 2;
  const centerY = base.y + base.height / 2;

  let width = base.width;
  let height = width / ratio;
  if (height > imageHeight) {
    height = imageHeight;
    width = height * ratio;
  }
  if (width > imageWidth) {
    width = imageWidth;
    height = width / ratio;
  }

  let x = Math.round(centerX - width / 2);
  let y = Math.round(centerY - height / 2);
  x = Math.min(Math.max(0, x), Math.max(0, imageWidth - Math.round(width)));
  y = Math.min(Math.max(0, y), Math.max(0, imageHeight - Math.round(height)));

  return normalizeCropRect({ x, y, width, height }, imageWidth, imageHeight);
}
