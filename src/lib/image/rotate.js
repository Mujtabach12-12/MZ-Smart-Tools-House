/**
 * Pure rotation / flip maths.
 *
 * The canvas work in ./process.js is driven entirely by `rotationTransform()`,
 * which means the geometry can be unit-tested in Node without a browser: the
 * tests assert the canvas size and the exact transform matrix that would be
 * applied.
 */

/** Snaps an angle to 0 / 90 / 180 / 270, rejecting anything that isn't a right angle. */
export function normalizeAngle(degrees) {
  const value = Number(degrees);
  if (!Number.isFinite(value)) {
    throw new Error("Rotation angle must be a number.");
  }
  if (value % 90 !== 0) {
    throw new Error("Rotation is only supported in 90° steps (90, 180 or 270).");
  }
  return ((value % 360) + 360) % 360;
}

/** Output canvas size after rotating — width/height swap on 90° and 270°. */
export function rotatedDimensions(width, height, degrees) {
  if (!(width > 0) || !(height > 0)) {
    throw new Error("This image's dimensions could not be read — the file may be corrupted.");
  }
  const angle = normalizeAngle(degrees);
  const swapped = angle === 90 || angle === 270;
  return {
    width: Math.round(swapped ? height : width),
    height: Math.round(swapped ? width : height),
  };
}

/**
 * Everything the renderer needs for one rotate+flip pass.
 *
 * The caller does, in order:
 *   ctx.translate(translateX, translateY)
 *   ctx.rotate(rotateRadians)
 *   ctx.scale(scaleX, scaleY)
 *   ctx.drawImage(img, -width / 2, -height / 2, width, height)
 *
 * i.e. we move the origin to the centre of the *output* canvas, rotate and
 * mirror around it, then draw the source image centred on that origin.
 */
export function rotationTransform(width, height, degrees, { flipHorizontal = false, flipVertical = false } = {}) {
  const angle = normalizeAngle(degrees);
  const output = rotatedDimensions(width, height, angle);

  return {
    angle,
    canvasWidth: output.width,
    canvasHeight: output.height,
    translateX: output.width / 2,
    translateY: output.height / 2,
    rotateRadians: (angle * Math.PI) / 180,
    scaleX: flipHorizontal ? -1 : 1,
    scaleY: flipVertical ? -1 : 1,
    drawWidth: Math.round(width),
    drawHeight: Math.round(height),
    drawX: -Math.round(width) / 2,
    drawY: -Math.round(height) / 2,
  };
}

/** Combines two successive rotations (used by the "rotate left/right" buttons). */
export function addRotation(currentDegrees, deltaDegrees) {
  return normalizeAngle(normalizeAngle(currentDegrees) + normalizeAngle(deltaDegrees));
}

/** True when rotation + flips would leave the image untouched. */
export function isNoOpTransform(degrees, { flipHorizontal = false, flipVertical = false } = {}) {
  return normalizeAngle(degrees) === 0 && !flipHorizontal && !flipVertical;
}
