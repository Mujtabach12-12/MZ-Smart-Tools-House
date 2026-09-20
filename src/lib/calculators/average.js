/**
 * numbers: number[]
 * Returns { average, sum, count, min, max }
 */
export function computeAverage(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error("Add at least one number.");
  }
  const nums = numbers.map((n, i) => {
    const parsed = Number(n);
    if (!Number.isFinite(parsed)) throw new Error(`Value #${i + 1} is not a valid number.`);
    return parsed;
  });

  const sum = nums.reduce((acc, n) => acc + n, 0);
  return {
    average: Number((sum / nums.length).toFixed(2)),
    sum: Number(sum.toFixed(2)),
    count: nums.length,
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
}
