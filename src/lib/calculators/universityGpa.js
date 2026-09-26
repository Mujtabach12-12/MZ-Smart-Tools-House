export function normalizeGrade(grade) {
  return String(grade || "").trim().toUpperCase();
}

export function isPolicyUsable(policy) {
  if (!policy || !Array.isArray(policy.grades) || !policy.grades.length) return false;
  if (policy.isCustom === true) return true;
  return (
    policy.verified === true &&
    Boolean(policy.sourceUrl) &&
    Boolean(policy.lastVerified) &&
    Number.isFinite(Number(policy.maxGPA))
  );
}

export function assertPolicyUsable(policy) {
  if (isPolicyUsable(policy)) return policy;
  throw new Error(
    "This university policy has not been verified for calculation. Select a verified policy or create a custom grading scale from your institution's current rules."
  );
}

function finiteNumber(value, message) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(message);
  return number;
}

export function createCustomPolicy({ name, maxGPA, grades }) {
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Enter a name for your custom grading scale.");

  const scale = finiteNumber(maxGPA, "Enter a valid maximum GPA for the custom scale.");
  if (scale <= 0 || scale > 10) throw new Error("Maximum GPA must be greater than 0 and no more than 10.");
  if (!Array.isArray(grades) || grades.length === 0) throw new Error("Add at least one grade band.");

  const normalized = grades.map((grade, index) => {
    const letter = normalizeGrade(grade.letter);
    if (!letter) throw new Error(`Grade row ${index + 1} needs a grade label.`);

    const minPercentage = finiteNumber(grade.minPercentage ?? grade.min, `Grade ${letter}: enter a valid minimum percentage.`);
    const maxPercentage = finiteNumber(grade.maxPercentage ?? grade.max, `Grade ${letter}: enter a valid maximum percentage.`);
    const gradePoint = finiteNumber(grade.gradePoint ?? grade.point, `Grade ${letter}: enter a valid grade point.`);

    if (minPercentage < 0 || maxPercentage > 100 || minPercentage > maxPercentage) {
      throw new Error(`Grade ${letter}: percentage range must stay between 0 and 100, with minimum not greater than maximum.`);
    }
    if (gradePoint < 0 || gradePoint > scale) {
      throw new Error(`Grade ${letter}: grade point must be between 0 and ${scale}.`);
    }

    return { letter, minPercentage, maxPercentage, gradePoint };
  });

  const letters = normalized.map((grade) => grade.letter);
  if (new Set(letters).size !== letters.length) throw new Error("Each grade label must be unique.");

  const sorted = [...normalized].sort((a, b) => b.minPercentage - a.minPercentage);
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const higher = sorted[i];
    const lower = sorted[i + 1];
    if (lower.maxPercentage >= higher.minPercentage) {
      throw new Error(`Grade ranges overlap between ${higher.letter} and ${lower.letter}.`);
    }
  }

  return {
    id: "custom",
    name: cleanName,
    shortName: "Custom",
    isCustom: true,
    verified: false,
    policyStatus: "custom-user-defined",
    gradingType: "custom",
    scale,
    maxGPA: scale,
    minimumPassingGrade: "User-defined",
    minimumPassingPoint: null,
    grades: sorted,
    specialGrades: [],
    repeatPolicy: "Custom scale only. Repeat-course policy is not modeled automatically.",
    repeatRule: null,
    gradeReplacementPolicy: "Custom scale only. Grade replacement rules are not modeled automatically.",
    sourceUrl: null,
    sourceTitle: null,
    lastVerified: null,
    notes: "Custom scale — user-defined and not an official university policy.",
  };
}

export function gradeForMarks(policy, rawMarks) {
  assertPolicyUsable(policy);
  const marks = Number(rawMarks);
  if (!Number.isFinite(marks) || marks < 0 || marks > 100) throw new Error("Marks must be between 0 and 100.");
  const rounded = policy.rounding === "nearest" ? Math.round(marks) : marks;
  if (typeof policy.pointForMark === "function") return policy.pointForMark(rounded);
  const band = policy.grades.find((grade) => rounded >= grade.minPercentage && rounded <= grade.maxPercentage);
  if (!band) throw new Error("This policy does not define a marks-to-grade band for the entered mark.");
  return { letter: band.letter, gradePoint: band.gradePoint };
}

export function gradePointForLetter(policy, letter) {
  assertPolicyUsable(policy);
  const normalized = normalizeGrade(letter);
  const grade = policy.grades.find((item) => item.letter === normalized);
  if (grade) return { letter: grade.letter, gradePoint: grade.gradePoint };
  const special = policy.specialGrades?.find((item) => normalizeGrade(item.letter) === normalized);
  if (special) {
    return {
      letter: special.letter,
      gradePoint: special.gradePoint ?? null,
      countsInGpa: special.countsInGpa !== false,
    };
  }
  throw new Error(`Grade ${normalized || "—"} is not part of the selected grading policy.`);
}

function courseHasAnyInput(course) {
  return Boolean(
    String(course?.name || "").trim() ||
    String(course?.courseCode || "").trim() ||
    String(course?.creditHours ?? "").trim() ||
    String(course?.marks ?? "").trim() ||
    String(course?.grade ?? "").trim()
  );
}

export function calculateGpa(courses, policy) {
  assertPolicyUsable(policy);
  if (!Array.isArray(courses)) throw new Error("Course data is invalid.");

  let totalQualityPoints = 0;
  let totalCredits = 0;
  const details = [];

  for (const [index, course] of courses.entries()) {
    if (!courseHasAnyInput(course)) continue;

    const name = String(course?.name || course?.courseCode || "").trim();
    if (!name) throw new Error(`Course ${index + 1}: enter a subject or course name.`);

    const creditHours = Number(course.creditHours);
    if (!Number.isFinite(creditHours) || creditHours <= 0) {
      throw new Error(`Course ${index + 1}: credit hours must be greater than 0.`);
    }
    if (creditHours > 30) throw new Error(`Course ${index + 1}: credit hours look too large. Check the value.`);

    let gradeInfo;
    if (course.mode === "marks") {
      if (String(course.marks ?? "").trim() === "") throw new Error(`Course ${index + 1}: enter marks between 0 and 100.`);
      gradeInfo = gradeForMarks(policy, course.marks);
    } else {
      if (!normalizeGrade(course.grade)) throw new Error(`Course ${index + 1}: select a grade.`);
      gradeInfo = gradePointForLetter(policy, course.grade);
    }

    if (gradeInfo.countsInGpa === false || gradeInfo.gradePoint == null) continue;
    const gradePoint = Number(gradeInfo.gradePoint);
    if (!Number.isFinite(gradePoint) || gradePoint < 0 || gradePoint > Number(policy.maxGPA)) {
      throw new Error(`Course ${index + 1}: grade point is outside the selected scale.`);
    }

    const qualityPoints = creditHours * gradePoint;
    totalQualityPoints += qualityPoints;
    totalCredits += creditHours;
    details.push({ ...course, name, letter: gradeInfo.letter, gradePoint, qualityPoints });
  }

  if (!totalCredits) throw new Error("Enter at least one complete GPA-bearing course.");
  return { gpa: totalQualityPoints / totalCredits, totalQualityPoints, totalCredits, details };
}

function semesterHasAnyInput(semester) {
  return Boolean(
    String(semester?.label || "").trim() ||
    String(semester?.gpa ?? "").trim() ||
    String(semester?.creditHours ?? "").trim()
  );
}

export function calculateCgpaFromSemesters(semesters, policy) {
  assertPolicyUsable(policy);
  if (!Array.isArray(semesters)) throw new Error("Semester data is invalid.");

  let qualityPoints = 0;
  let credits = 0;
  let counted = 0;

  for (const [index, semester] of semesters.entries()) {
    if (!semesterHasAnyInput(semester)) continue;
    if (String(semester.gpa ?? "").trim() === "") throw new Error(`Semester ${index + 1}: enter a GPA.`);
    if (String(semester.creditHours ?? "").trim() === "") throw new Error(`Semester ${index + 1}: enter total credit hours.`);

    const gpa = Number(semester.gpa);
    const creditHours = Number(semester.creditHours);
    if (!Number.isFinite(gpa) || gpa < 0 || gpa > Number(policy.maxGPA)) {
      throw new Error(`Semester ${index + 1}: GPA must be between 0 and ${policy.maxGPA}.`);
    }
    if (!Number.isFinite(creditHours) || creditHours <= 0) {
      throw new Error(`Semester ${index + 1}: credit hours must be greater than 0.`);
    }
    if (creditHours > 100) throw new Error(`Semester ${index + 1}: credit hours look too large. Check the value.`);

    qualityPoints += gpa * creditHours;
    credits += creditHours;
    counted += 1;
  }

  if (!counted || !credits) throw new Error("Enter at least one complete semester with GPA and credit hours.");
  return { cgpa: qualityPoints / credits, totalQualityPoints: qualityPoints, totalCredits: credits };
}

export function calculateCgpaFromCourses(courses, policy) {
  assertPolicyUsable(policy);
  const grouped = new Map();
  for (const [index, course] of (courses || []).entries()) {
    if (!courseHasAnyInput(course)) continue;
    const key = String(course.courseCode || course.name || course.id || "").trim().toLowerCase();
    if (!key) throw new Error(`Course ${index + 1}: enter a course name or code.`);

    const creditHours = Number(course.creditHours);
    if (!Number.isFinite(creditHours) || creditHours <= 0) throw new Error(`Course ${index + 1}: credit hours must be greater than 0.`);

    const info = course.mode === "marks" ? gradeForMarks(policy, course.marks) : gradePointForLetter(policy, course.grade);
    if (info.countsInGpa === false || info.gradePoint == null) continue;

    const attempt = { ...course, gradePoint: Number(info.gradePoint), letter: info.letter, creditHours };
    const current = grouped.get(key);
    if (!current) grouped.set(key, attempt);
    else if (policy.repeatRule === "most-recent") grouped.set(key, attempt);
    else if (policy.repeatRule === "highest" || policy.repeatRule === "better") {
      grouped.set(key, attempt.gradePoint >= current.gradePoint ? attempt : current);
    } else {
      throw new Error("Repeat-course policy is not modeled for the selected grading policy.");
    }
  }

  const selected = [...grouped.values()];
  const totalCredits = selected.reduce((sum, course) => sum + course.creditHours, 0);
  const totalQualityPoints = selected.reduce((sum, course) => sum + course.creditHours * course.gradePoint, 0);
  if (!totalCredits) throw new Error("Enter at least one valid GPA-bearing course.");
  return { cgpa: totalQualityPoints / totalCredits, totalCredits, totalQualityPoints, details: selected };
}
