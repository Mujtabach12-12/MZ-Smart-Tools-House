function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

/** Simplify a:b to lowest terms. */
export function simplifyRatio(a, b) {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) {
    throw new Error("Both ratio values must be positive numbers.");
  }
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    // Scale up decimals to integers before reducing (e.g. 1.5:2 -> 15:20 -> 3:4)
    const factor = 10 ** Math.max(decimalPlaces(x), decimalPlaces(y));
    return simplifyRatio(x * factor, y * factor);
  }
  const divisor = gcd(x, y);
  return { a: x / divisor, b: y / divisor };
}

function decimalPlaces(n) {
  const s = n.toString();
  return s.includes(".") ? s.split(".")[1].length : 0;
}

/**
 * Solve a proportion a:b = c:d where exactly one of the four values is null.
 * Uses cross multiplication: a*d = b*c
 */
export function solveProportion({ a, b, c, d }) {
  const values = { a, b, c, d };
  const missingKeys = Object.entries(values).filter(([, v]) => v === null || v === "" || v === undefined);
  if (missingKeys.length !== 1) {
    throw new Error("Leave exactly one value empty to solve for it.");
  }
  const nums = {};
  for (const key of ["a", "b", "c", "d"]) {
    if (values[key] === null || values[key] === "" || values[key] === undefined) continue;
    const n = Number(values[key]);
    if (!Number.isFinite(n) || n <= 0) throw new Error("All provided values must be positive numbers.");
    nums[key] = n;
  }

  const missing = missingKeys[0][0];
  let result;
  if (missing === "a") result = (nums.b * nums.c) / nums.d;
  else if (missing === "b") result = (nums.a * nums.d) / nums.c;
  else if (missing === "c") result = (nums.a * nums.d) / nums.b;
  else result = (nums.b * nums.c) / nums.a;

  return { [missing]: Number(result.toFixed(2)) };
}
