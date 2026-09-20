// Standard 4.0 grading scale. Flexible: the UI lets a student pick a grade
// per course, and this map converts it to grade points. Not tied to any
// single university's exact table.
export const GRADE_POINTS = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0, "F": 0.0,
};

export function gradeToPoint(grade) {
  if (!(grade in GRADE_POINTS)) {
    throw new Error(`Unknown grade "${grade}"`);
  }
  return GRADE_POINTS[grade];
}

/**
 * courses: [{ creditHours: number, grade: string }]
 * Returns { gpa, totalCredits, totalPoints }
 */
export function computeGpa(courses) {
  if (!Array.isArray(courses) || courses.length === 0) {
    throw new Error("Add at least one course.");
  }

  let totalCredits = 0;
  let totalPoints = 0;

  for (const course of courses) {
    const credits = Number(course.creditHours);
    if (!Number.isFinite(credits) || credits <= 0) {
      throw new Error("Credit hours must be a positive number.");
    }
    const point = gradeToPoint(course.grade);
    totalCredits += credits;
    totalPoints += credits * point;
  }

  if (totalCredits === 0) {
    throw new Error("Total credit hours cannot be zero.");
  }

  return {
    gpa: Number((totalPoints / totalCredits).toFixed(2)),
    totalCredits,
    totalPoints: Number(totalPoints.toFixed(2)),
  };
}
