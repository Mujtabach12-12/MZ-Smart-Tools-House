export function normalizeGrade(grade) {
  return String(grade || "").trim().toUpperCase();
}

export function gradeForMarks(policy, rawMarks) {
  const marks = Number(rawMarks);
  if (!Number.isFinite(marks) || marks < 0 || marks > 100) throw new Error("Marks must be between 0 and 100.");
  const rounded = policy.rounding === "nearest" ? Math.round(marks) : marks;
  if (typeof policy.pointForMark === "function") return policy.pointForMark(rounded);
  const band = policy.grades.find((g) => rounded >= g.minPercentage && rounded <= g.maxPercentage);
  if (!band) throw new Error("This policy does not define a marks-to-grade band for the entered mark.");
  return { letter: band.letter, gradePoint: band.gradePoint };
}

export function gradePointForLetter(policy, letter) {
  const normalized = normalizeGrade(letter);
  const grade = policy.grades.find((g) => g.letter === normalized);
  if (grade) return { letter: grade.letter, gradePoint: grade.gradePoint };
  const special = policy.specialGrades?.find((g) => normalizeGrade(g.letter) === normalized);
  if (special) return { letter: special.letter, gradePoint: special.gradePoint ?? null, countsInGpa: special.countsInGpa !== false };
  throw new Error(`Grade ${normalized || "—"} is not part of the selected university policy.`);
}

export function calculateGpa(courses, policy) {
  let totalQualityPoints = 0;
  let totalCredits = 0;
  const details = [];
  for (const course of courses) {
    const creditHours = Number(course.creditHours);
    if (!Number.isFinite(creditHours) || creditHours <= 0) continue;
    let gradeInfo;
    if (course.mode === "marks") gradeInfo = gradeForMarks(policy, course.marks);
    else gradeInfo = gradePointForLetter(policy, course.grade);
    if (gradeInfo.countsInGpa === false || gradeInfo.gradePoint == null) continue;
    const qualityPoints = creditHours * Number(gradeInfo.gradePoint);
    totalQualityPoints += qualityPoints;
    totalCredits += creditHours;
    details.push({ ...course, letter: gradeInfo.letter, gradePoint: Number(gradeInfo.gradePoint), qualityPoints });
  }
  if (!totalCredits) throw new Error("Enter at least one course with valid credit hours and a GPA-bearing grade.");
  const gpa = totalQualityPoints / totalCredits;
  return { gpa, totalQualityPoints, totalCredits, details };
}

export function calculateCgpaFromSemesters(semesters, policy) {
  let qualityPoints = 0;
  let credits = 0;
  for (const semester of semesters) {
    const gpa = Number(semester.gpa);
    const creditHours = Number(semester.creditHours);
    if (!Number.isFinite(gpa) || !Number.isFinite(creditHours) || creditHours <= 0) continue;
    if (gpa < 0 || gpa > policy.maxGPA) throw new Error(`Semester GPA must be between 0 and ${policy.maxGPA}.`);
    qualityPoints += gpa * creditHours;
    credits += creditHours;
  }
  if (!credits) throw new Error("Enter at least one semester with a valid GPA and credit-hour total.");
  return { cgpa: qualityPoints / credits, totalQualityPoints: qualityPoints, totalCredits: credits };
}

export function calculateCgpaFromCourses(courses, policy) {
  // Course-level CGPA is useful when a university's repeat policy needs to be applied.
  const grouped = new Map();
  for (const course of courses) {
    const key = String(course.courseCode || course.name || course.id || "").trim().toLowerCase() || crypto.randomUUID();
    const info = course.mode === "marks" ? gradeForMarks(policy, course.marks) : gradePointForLetter(policy, course.grade);
    const creditHours = Number(course.creditHours);
    if (!Number.isFinite(creditHours) || creditHours <= 0 || info.countsInGpa === false || info.gradePoint == null) continue;
    const attempt = { ...course, gradePoint: Number(info.gradePoint), letter: info.letter, creditHours };
    const current = grouped.get(key);
    if (!current) grouped.set(key, attempt);
    else if (policy.repeatRule === "most-recent") grouped.set(key, attempt);
    else if (policy.repeatRule === "highest") grouped.set(key, attempt.gradePoint >= current.gradePoint ? attempt : current);
    else if (policy.repeatRule === "better") grouped.set(key, attempt.gradePoint > current.gradePoint ? attempt : current);
  }
  const selected = [...grouped.values()];
  const totalCredits = selected.reduce((s,c)=>s+c.creditHours,0);
  const totalQualityPoints = selected.reduce((s,c)=>s+c.creditHours*c.gradePoint,0);
  if (!totalCredits) throw new Error("Enter at least one valid GPA-bearing course.");
  return { cgpa: totalQualityPoints / totalCredits, totalCredits, totalQualityPoints, details:selected };
}
