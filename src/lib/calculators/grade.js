// Default percentage -> letter grade table. Configurable/overridable by
// passing a custom `scale`, since grading bands vary by institution.
export const DEFAULT_GRADE_SCALE = [
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

export function percentageToGrade(percentage, scale = DEFAULT_GRADE_SCALE) {
  const pct = Number(percentage);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    throw new Error("Percentage must be between 0 and 100.");
  }
  const match = scale.find((band) => pct >= band.min && pct <= band.max);
  if (!match) throw new Error("Could not determine a grade for this percentage.");
  return match.grade;
}
