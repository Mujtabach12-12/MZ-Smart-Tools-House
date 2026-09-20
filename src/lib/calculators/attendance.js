function validateCounts(attended, total) {
  const a = Number(attended);
  const t = Number(total);
  if (!Number.isFinite(a) || a < 0) throw new Error("Attended classes must be zero or a positive number.");
  if (!Number.isFinite(t) || t <= 0) throw new Error("Total classes must be a positive number.");
  if (a > t) throw new Error("Attended classes cannot be greater than total classes.");
  return { a, t };
}

export function currentAttendancePercentage(attended, total) {
  const { a, t } = validateCounts(attended, total);
  return Number(((a / t) * 100).toFixed(2));
}

/**
 * How many additional classes (from now on, all missed) can the student
 * skip and still stay at/above `requiredPercent`?
 * Returns 0 if already below the requirement.
 */
export function maxMissableClasses(attended, total, requiredPercent) {
  const { a, t } = validateCounts(attended, total);
  const req = Number(requiredPercent);
  if (!Number.isFinite(req) || req <= 0 || req > 100) {
    throw new Error("Required attendance percentage must be between 1 and 100.");
  }
  const raw = (a * 100) / req - t;
  return Math.max(0, Math.floor(raw));
}

/**
 * If a student is below the requirement, how many classes must they attend
 * consecutively (assuming no further classes are missed) to reach it?
 * Returns 0 if already at/above the requirement.
 */
export function classesNeededToReach(attended, total, requiredPercent) {
  const { a, t } = validateCounts(attended, total);
  const req = Number(requiredPercent);
  if (!Number.isFinite(req) || req <= 0 || req > 100) {
    throw new Error("Required attendance percentage must be between 1 and 100.");
  }
  const reqFraction = req / 100;
  if (reqFraction >= 1) throw new Error("Required percentage must be less than 100.");
  const raw = (reqFraction * t - a) / (1 - reqFraction);
  return Math.max(0, Math.ceil(raw));
}
