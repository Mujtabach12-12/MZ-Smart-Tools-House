function validateCounts(attended, total) {
  const a = Number(attended);
  const t = Number(total);
  if (!Number.isFinite(a) || a < 0 || !Number.isSafeInteger(a)) {
    throw new Error("Attended classes must be a whole number of 0 or more.");
  }
  if (!Number.isFinite(t) || t <= 0 || !Number.isSafeInteger(t)) {
    throw new Error("Total classes must be a positive whole number.");
  }
  if (a > t) throw new Error("Attended classes cannot be greater than total classes.");
  return { a, t };
}

function validateRequired(requiredPercent) {
  const req = Number(requiredPercent);
  if (!Number.isFinite(req) || req <= 0 || req > 100) {
    throw new Error("Required attendance percentage must be greater than 0 and no more than 100.");
  }
  return req;
}

export function currentAttendancePercentage(attended, total) {
  const { a, t } = validateCounts(attended, total);
  return (a / t) * 100;
}

/**
 * How many additional future classes can be missed while remaining at or
 * above the required attendance percentage?
 */
export function maxMissableClasses(attended, total, requiredPercent) {
  const { a, t } = validateCounts(attended, total);
  const req = validateRequired(requiredPercent);
  const raw = (a * 100) / req - t;
  return Math.max(0, Math.floor(raw + 1e-12));
}

/**
 * If currently below the target, how many consecutive future classes must be
 * attended to reach it? Returns 0 when already at/above the target.
 */
export function classesNeededToReach(attended, total, requiredPercent) {
  const { a, t } = validateCounts(attended, total);
  const req = validateRequired(requiredPercent);
  const current = (a / t) * 100;
  if (current >= req) return 0;
  if (req === 100) {
    throw new Error("A 100% target cannot be reached in a finite number of future classes after any class has already been missed.");
  }
  const reqFraction = req / 100;
  const raw = (reqFraction * t - a) / (1 - reqFraction);
  return Math.max(0, Math.ceil(raw - 1e-12));
}
