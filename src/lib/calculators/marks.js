/**
 * subjects: [{ obtained: number, total: number }]
 * Returns { totalObtained, totalMax, percentage, average }
 */
export function computeMarks(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new Error("Add at least one subject.");
  }

  let totalObtained = 0;
  let totalMax = 0;

  for (const s of subjects) {
    const obtained = Number(s.obtained);
    const total = Number(s.total);

    if (!Number.isFinite(obtained) || obtained < 0) {
      throw new Error("Obtained marks must be zero or a positive number.");
    }
    if (!Number.isFinite(total) || total <= 0) {
      throw new Error("Total marks must be a positive number.");
    }
    if (obtained > total) {
      throw new Error("Obtained marks cannot be greater than total marks.");
    }

    totalObtained += obtained;
    totalMax += total;
  }

  return {
    totalObtained: Number(totalObtained.toFixed(2)),
    totalMax: Number(totalMax.toFixed(2)),
    percentage: Number(((totalObtained / totalMax) * 100).toFixed(2)),
    average: Number((totalObtained / subjects.length).toFixed(2)),
  };
}
