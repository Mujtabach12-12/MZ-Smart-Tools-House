// This is an editable example scale for manual/custom use only.
// It must never be presented as an official university policy.
export const CUSTOM_EXAMPLE_GRADE_SCALE = [
  { min: 85, max: 100, grade: "A+" },
  { min: 80, max: 84.99, grade: "A" },
  { min: 75, max: 79.99, grade: "A-" },
  { min: 70, max: 74.99, grade: "B+" },
  { min: 65, max: 69.99, grade: "B" },
  { min: 60, max: 64.99, grade: "B-" },
  { min: 55, max: 59.99, grade: "C+" },
  { min: 50, max: 54.99, grade: "C" },
  { min: 45, max: 49.99, grade: "D" },
  { min: 0, max: 44.99, grade: "F" },
];

// Backward-compatible export for existing tests/imports. The UI labels this as
// a custom example rather than a universal or official grading policy.
export const DEFAULT_GRADE_SCALE = CUSTOM_EXAMPLE_GRADE_SCALE;

export function validateGradeScale(scale) {
  if (!Array.isArray(scale) || !scale.length) throw new Error("A grading scale is required.");

  const normalized = scale.map((band, index) => {
    const min = Number(band.min);
    const max = Number(band.max);
    const grade = String(band.grade || "").trim().toUpperCase();
    if (!grade) throw new Error(`Grade row ${index + 1} needs a grade label.`);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 100 || min > max) {
      throw new Error(`Grade ${grade}: range must stay between 0 and 100, with minimum not greater than maximum.`);
    }
    return { min, max, grade };
  });

  const labels = normalized.map((band) => band.grade);
  if (new Set(labels).size !== labels.length) throw new Error("Each grade label must be unique.");

  const sorted = [...normalized].sort((a, b) => b.min - a.min);
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const higher = sorted[index];
    const lower = sorted[index + 1];
    if (lower.max >= higher.min) throw new Error(`Grade ranges overlap between ${higher.grade} and ${lower.grade}.`);
  }
  return sorted;
}

export function percentageToGrade(percentage, scale = CUSTOM_EXAMPLE_GRADE_SCALE) {
  const pct = Number(percentage);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    throw new Error("Percentage must be between 0 and 100.");
  }
  const normalized = validateGradeScale(scale);
  const match = normalized.find((band) => pct >= band.min && pct <= band.max);
  if (!match) throw new Error("The selected grading scale does not define a grade for this percentage.");
  return match.grade;
}
