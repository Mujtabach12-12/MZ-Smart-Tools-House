function parseFiniteNumber(value, label) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error(`${label} is required.`);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${label} must be a valid finite number.`);
  return n;
}

/** What percentage is `part` of `whole`? */
export function percentageOf(part, whole) {
  const p = parseFiniteNumber(part, "Part value");
  const w = parseFiniteNumber(whole, "Whole value");
  if (w === 0) throw new Error("Whole value cannot be zero because division by zero is undefined.");
  const result = (p / w) * 100;
  if (!Number.isFinite(result)) throw new Error("The values are too large to calculate safely.");
  return result;
}

/** What is `percent`% of `whole`? */
export function valueFromPercentage(percent, whole) {
  const pc = parseFiniteNumber(percent, "Percentage");
  const w = parseFiniteNumber(whole, "Whole value");
  const result = (pc / 100) * w;
  if (!Number.isFinite(result)) throw new Error("The values are too large to calculate safely.");
  return result;
}

/** Percentage change from `oldValue` to `newValue`. */
export function percentageChange(oldValue, newValue) {
  const o = parseFiniteNumber(oldValue, "Old value");
  const n = parseFiniteNumber(newValue, "New value");
  if (o === 0) throw new Error("Percentage change from a zero baseline is undefined. Enter a non-zero old value.");
  const result = ((n - o) / o) * 100;
  if (!Number.isFinite(result)) throw new Error("The values are too large to calculate safely.");
  return result;
}
