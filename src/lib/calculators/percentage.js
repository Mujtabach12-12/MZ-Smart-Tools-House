function assertFiniteNumber(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${label} must be a valid number.`);
  return n;
}

/** What percentage is `part` of `whole`? */
export function percentageOf(part, whole) {
  const p = assertFiniteNumber(part, "Part value");
  const w = assertFiniteNumber(whole, "Whole value");
  if (w === 0) throw new Error("Whole value cannot be zero.");
  return Number(((p / w) * 100).toFixed(2));
}

/** What is `percent`% of `whole`? */
export function valueFromPercentage(percent, whole) {
  const pc = assertFiniteNumber(percent, "Percentage");
  const w = assertFiniteNumber(whole, "Whole value");
  return Number(((pc / 100) * w).toFixed(2));
}

/** Percentage change from `oldValue` to `newValue`. */
export function percentageChange(oldValue, newValue) {
  const o = assertFiniteNumber(oldValue, "Old value");
  const n = assertFiniteNumber(newValue, "New value");
  if (o === 0) throw new Error("Old value cannot be zero.");
  return Number((((n - o) / o) * 100).toFixed(2));
}
