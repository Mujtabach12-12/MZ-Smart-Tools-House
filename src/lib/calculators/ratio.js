function parsePositive(value, label) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error(`${label} is required.`);
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${label} must be a valid number greater than 0.`);
  return n;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function decimalPlaces(value) {
  const text = Math.abs(value).toString().toLowerCase();
  const [coefficient, exponentText] = text.split("e");
  const exponent = exponentText ? Number(exponentText) : 0;
  const fractionDigits = (coefficient.split(".")[1] || "").length;
  return Math.max(0, fractionDigits - exponent);
}

function scaledIntegers(a, b) {
  const places = Math.max(decimalPlaces(a), decimalPlaces(b));
  if (places > 12) {
    throw new Error("This ratio has more than 12 decimal places. Round the inputs slightly and try again.");
  }
  const factor = 10 ** places;
  const x = Math.round(a * factor);
  const y = Math.round(b * factor);
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) {
    throw new Error("These ratio values are too large to simplify safely.");
  }
  return [x, y];
}

/** Simplify a:b to lowest terms. Positive ratios only. */
export function simplifyRatio(a, b) {
  const x = parsePositive(a, "First ratio value");
  const y = parsePositive(b, "Second ratio value");
  const [scaledX, scaledY] = scaledIntegers(x, y);
  const divisor = gcd(scaledX, scaledY);
  return { a: scaledX / divisor, b: scaledY / divisor };
}

/**
 * Solve a proportion a:b = c:d where exactly one value is missing.
 * Positive values only, so no denominator can be zero.
 */
export function solveProportion({ a, b, c, d }) {
  const values = { a, b, c, d };
  const missingKeys = Object.entries(values).filter(([, v]) => v === null || v === "" || v === undefined);
  if (missingKeys.length !== 1) throw new Error("Leave exactly one value empty to solve for it.");

  const nums = {};
  for (const key of ["a", "b", "c", "d"]) {
    if (values[key] === null || values[key] === "" || values[key] === undefined) continue;
    nums[key] = parsePositive(values[key], key.toUpperCase());
  }

  const missing = missingKeys[0][0];
  let result;
  if (missing === "a") result = (nums.b * nums.c) / nums.d;
  else if (missing === "b") result = (nums.a * nums.d) / nums.c;
  else if (missing === "c") result = (nums.a * nums.d) / nums.b;
  else result = (nums.b * nums.c) / nums.a;

  if (!Number.isFinite(result) || result <= 0) throw new Error("The proportion cannot be solved to a positive finite value with these inputs.");
  return { [missing]: result };
}
