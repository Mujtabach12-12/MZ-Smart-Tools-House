/**
 * subjects: [{ obtained: number|string, total: number|string }]
 * Returns { totalObtained, totalMax, percentage, average }
 */
export function computeMarks(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new Error("Add at least one subject.");
  }

  let totalObtained = 0;
  let totalMax = 0;

  for (const [index, subject] of subjects.entries()) {
    if (String(subject?.obtained ?? "").trim() === "") {
      throw new Error(`Subject ${index + 1}: enter obtained marks.`);
    }
    if (String(subject?.total ?? "").trim() === "") {
      throw new Error(`Subject ${index + 1}: enter maximum marks.`);
    }

    const obtained = Number(subject.obtained);
    const total = Number(subject.total);

    if (!Number.isFinite(obtained) || obtained < 0) {
      throw new Error(`Subject ${index + 1}: obtained marks must be 0 or a positive number.`);
    }
    if (!Number.isFinite(total) || total <= 0) {
      throw new Error(`Subject ${index + 1}: maximum marks must be greater than 0.`);
    }
    if (obtained > total) {
      throw new Error(`Subject ${index + 1}: obtained marks cannot be greater than maximum marks.`);
    }
    if (obtained > 1e12 || total > 1e12) {
      throw new Error(`Subject ${index + 1}: marks are too large for a practical calculation.`);
    }

    totalObtained += obtained;
    totalMax += total;
    if (!Number.isFinite(totalObtained) || !Number.isFinite(totalMax)) {
      throw new Error("The entered marks are too large to calculate safely.");
    }
  }

  const percentage = (totalObtained / totalMax) * 100;
  const average = totalObtained / subjects.length;

  return { totalObtained, totalMax, percentage, average };
}
