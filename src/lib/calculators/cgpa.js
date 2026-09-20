/**
 * semesters: [{ gpa: number, creditHours: number }]
 * Weighted average of semester GPAs by that semester's total credit hours.
 * Returns { cgpa, totalCredits }
 */
export function computeCgpa(semesters) {
  if (!Array.isArray(semesters) || semesters.length === 0) {
    throw new Error("Add at least one semester.");
  }

  let totalCredits = 0;
  let totalPoints = 0;

  for (const sem of semesters) {
    const gpa = Number(sem.gpa);
    const credits = Number(sem.creditHours);

    if (!Number.isFinite(gpa) || gpa < 0 || gpa > 4) {
      throw new Error("Each semester GPA must be between 0 and 4.");
    }
    if (!Number.isFinite(credits) || credits <= 0) {
      throw new Error("Each semester's credit hours must be a positive number.");
    }

    totalCredits += credits;
    totalPoints += gpa * credits;
  }

  if (totalCredits === 0) {
    throw new Error("Total credit hours cannot be zero.");
  }

  return {
    cgpa: Number((totalPoints / totalCredits).toFixed(2)),
    totalCredits,
  };
}
