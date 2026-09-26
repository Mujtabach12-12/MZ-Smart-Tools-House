function parseFinite(value, index) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error(`Value #${index + 1} is empty.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Value #${index + 1} is not a valid finite number.`);
  return parsed;
}

/**
 * numbers: number[]
 * Returns { average, sum, count, min, max } using compensated summation.
 */
export function computeAverage(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error("Add at least one number.");
  }

  const nums = numbers.map(parseFinite);

  // Kahan compensated summation reduces avoidable floating-point drift for long lists.
  let sum = 0;
  let compensation = 0;
  for (const value of nums) {
    const adjusted = value - compensation;
    const next = sum + adjusted;
    compensation = (next - sum) - adjusted;
    sum = next;
  }

  if (!Number.isFinite(sum)) throw new Error("The values are too large to total safely.");
  const average = sum / nums.length;
  if (!Number.isFinite(average)) throw new Error("The average could not be represented as a finite number.");

  return {
    average,
    sum,
    count: nums.length,
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
}
