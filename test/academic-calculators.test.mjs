import assert from "node:assert/strict";
import { universityPolicies, verifiedUniversities, getUniversityPolicy, isUniversityPolicyVerified } from "../src/data/universities/policies.js";
import {
  calculateGpa,
  calculateCgpaFromSemesters,
  createCustomPolicy,
  gradeForMarks,
  isPolicyUsable,
} from "../src/lib/calculators/universityGpa.js";
import { computeMarks } from "../src/lib/calculators/marks.js";
import { percentageToGrade } from "../src/lib/calculators/grade.js";
import { currentAttendancePercentage, maxMissableClasses, classesNeededToReach } from "../src/lib/calculators/attendance.js";
import { planStudyHours } from "../src/lib/calculators/studyHours.js";

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (error) {
    console.error(`  FAIL - ${name}`);
    console.error(`    ${error.message}`);
    process.exitCode = 1;
  }
}

const policyA = {
  id: "fixture-a",
  name: "Synthetic Test Policy A",
  verified: true,
  sourceUrl: "https://example.test/policy-a",
  lastVerified: "test-fixture",
  maxGPA: 4,
  grades: [
    { letter: "A", minPercentage: 80, maxPercentage: 100, gradePoint: 4 },
    { letter: "B", minPercentage: 70, maxPercentage: 79.99, gradePoint: 3 },
    { letter: "C", minPercentage: 60, maxPercentage: 69.99, gradePoint: 2 },
    { letter: "F", minPercentage: 0, maxPercentage: 59.99, gradePoint: 0 },
  ],
  specialGrades: [],
};

const policyB = {
  id: "fixture-b",
  name: "Synthetic Test Policy B",
  verified: true,
  sourceUrl: "https://example.test/policy-b",
  lastVerified: "test-fixture",
  maxGPA: 4,
  grades: [
    { letter: "A", minPercentage: 90, maxPercentage: 100, gradePoint: 4 },
    { letter: "B", minPercentage: 80, maxPercentage: 89.99, gradePoint: 3 },
    { letter: "C", minPercentage: 70, maxPercentage: 79.99, gradePoint: 2 },
    { letter: "D", minPercentage: 60, maxPercentage: 69.99, gradePoint: 1 },
    { letter: "F", minPercentage: 0, maxPercentage: 59.99, gradePoint: 0 },
  ],
  specialGrades: [],
};

console.log("University policy safety");
test("configured source alone never counts as verified", () => {
  for (const policy of universityPolicies) {
    if (policy.verified !== true) assert.equal(isUniversityPolicyVerified(policy), false);
  }
});
test("verifiedUniversities contains only explicitly verified records", () => {
  assert.ok(verifiedUniversities.every((policy) => policy.verified === true && isUniversityPolicyVerified(policy)));
});
test("current UOL record is blocked until explicitly verified", () => {
  const uol = getUniversityPolicy("uol");
  assert.equal(isPolicyUsable(uol), false);
  assert.throws(() => calculateGpa([{ name: "Programming", creditHours: 3, mode: "grade", grade: "A" }], uol), /not been verified/i);
});

test("custom scale is usable but remains explicitly custom", () => {
  const custom = createCustomPolicy({
    name: "My Manual Scale",
    maxGPA: 4,
    grades: [
      { letter: "A", min: 80, max: 100, point: 4 },
      { letter: "B", min: 70, max: 79.99, point: 3 },
      { letter: "F", min: 0, max: 69.99, point: 0 },
    ],
  });
  assert.equal(custom.isCustom, true);
  assert.equal(custom.verified, false);
  assert.equal(isPolicyUsable(custom), true);
  const result = calculateGpa([{ name: "Programming", creditHours: 3, mode: "marks", marks: 85 }], custom);
  assert.equal(result.gpa, 4);
});

test("custom scale rejects overlapping percentage bands", () => {
  assert.throws(() => createCustomPolicy({
    name: "Broken scale",
    maxGPA: 4,
    grades: [
      { letter: "A", min: 80, max: 100, point: 4 },
      { letter: "B", min: 75, max: 85, point: 3 },
    ],
  }), /overlap/i);
});

console.log("GPA / CGPA engine");
const sameMarks = [85, 78, 72, 68, 81];
const toCourses = (marks) => marks.map((value, index) => ({
  name: `Course ${index + 1}`,
  creditHours: 3,
  mode: "marks",
  marks: value,
}));

test("same marks can produce different GPA under different verified policies", () => {
  const a = calculateGpa(toCourses(sameMarks), policyA).gpa;
  const b = calculateGpa(toCourses(sameMarks), policyB).gpa;
  assert.equal(a, 3.2);
  assert.equal(b, 2.2);
  assert.notEqual(a, b);
});

test("policy isolation: switching A -> B -> A does not mutate A", () => {
  assert.equal(gradeForMarks(policyA, 85).letter, "A");
  assert.equal(gradeForMarks(policyB, 85).letter, "B");
  assert.equal(gradeForMarks(policyA, 85).letter, "A");
});

test("GPA rejects an empty subject name instead of inventing a course", () => {
  assert.throws(() => calculateGpa([{ name: "", creditHours: 3, mode: "grade", grade: "A" }], policyA), /course name/i);
});

test("GPA rejects zero credit hours", () => {
  assert.throws(() => calculateGpa([{ name: "Programming", creditHours: 0, mode: "grade", grade: "A" }], policyA), /greater than 0/i);
});

test("weighted CGPA uses semester credit hours", () => {
  const result = calculateCgpaFromSemesters([
    { label: "Semester 1", gpa: 3.0, creditHours: 15 },
    { label: "Semester 2", gpa: 3.5, creditHours: 18 },
  ], policyA);
  assert.ok(Math.abs(result.cgpa - (108 / 33)) < 1e-12);
});

test("CGPA rejects partial semester data", () => {
  assert.throws(() => calculateCgpaFromSemesters([{ label: "Semester 1", gpa: 3.2, creditHours: "" }], policyA), /credit hours/i);
});

console.log("Marks Calculator");
test("85 + 78 + 92 + 67 + 88 = total 410, average 82, percentage 82", () => {
  const result = computeMarks([85, 78, 92, 67, 88].map((obtained) => ({ obtained, total: 100 })));
  assert.equal(result.totalObtained, 410);
  assert.equal(result.totalMax, 500);
  assert.equal(result.average, 82);
  assert.equal(result.percentage, 82);
});
test("marks calculator rejects empty obtained marks", () => {
  assert.throws(() => computeMarks([{ obtained: "", total: 100 }]), /enter obtained/i);
});
test("marks calculator rejects marks above maximum", () => {
  assert.throws(() => computeMarks([{ obtained: 101, total: 100 }]), /cannot be greater/i);
});
test("marks calculator rejects impractically large values", () => {
  assert.throws(() => computeMarks([{ obtained: 1e13, total: 1e13 }]), /too large/i);
});

console.log("Grade Calculator engine");
const manualScale = [
  { min: 90, max: 100, grade: "A" },
  { min: 80, max: 89.99, grade: "B" },
  { min: 0, max: 79.99, grade: "F" },
];
test("manual boundary 89.99 -> B, 90 -> A, 100 -> A", () => {
  assert.equal(percentageToGrade(89.99, manualScale), "B");
  assert.equal(percentageToGrade(90, manualScale), "A");
  assert.equal(percentageToGrade(100, manualScale), "A");
});
test("grade calculator rejects values outside 0-100", () => {
  assert.throws(() => percentageToGrade(100.01, manualScale));
  assert.throws(() => percentageToGrade(-0.01, manualScale));
});
test("grade calculator rejects overlapping custom bands", () => {
  assert.throws(() => percentageToGrade(85, [
    { min: 80, max: 100, grade: "A" },
    { min: 75, max: 85, grade: "B" },
  ]), /overlap/i);
});

console.log("Attendance Calculator");
test("80/100 = 80%", () => assert.equal(currentAttendancePercentage(80, 100), 80));
test("45/50 = 90%", () => assert.equal(currentAttendancePercentage(45, 50), 90));
test("0/10 = 0%", () => assert.equal(currentAttendancePercentage(0, 10), 0));
test("total 0 is rejected", () => assert.throws(() => currentAttendancePercentage(0, 0), /positive whole number/i));
test("50/100 to 90% requires 400 consecutive classes", () => assert.equal(classesNeededToReach(50, 100, 90), 400));
test("100% target below 100 current attendance explains impossibility", () => assert.throws(() => classesNeededToReach(99, 100, 100), /cannot be reached/i));
test("future-miss / reach logic works across common thresholds", () => {
  for (const threshold of [50, 60, 70, 75, 80, 85, 90]) {
    const current = currentAttendancePercentage(80, 100);
    if (current >= threshold) assert.ok(maxMissableClasses(80, 100, threshold) >= 0);
    else assert.ok(classesNeededToReach(80, 100, threshold) > 0);
  }
});

console.log("Study Hours Calculator");
test("40 hours / 5 days = 8 hours/day", () => assert.equal(planStudyHours(5, 40).requiredHoursPerDay, 8));
test("30 hours / 6 days = 5 hours/day", () => assert.equal(planStudyHours(6, 30).requiredHoursPerDay, 5));
test("25.5 hours / 5 days = 5.1 hours/day", () => assert.equal(planStudyHours(5, 25.5).requiredHoursPerDay, 5.1));
test("0 workload = 0 hours/day", () => assert.equal(planStudyHours(5, 0).requiredHoursPerDay, 0));
test("0 days is rejected", () => assert.throws(() => planStudyHours(0, 40), /greater than 0/i));
test("optional availability computes feasibility only when supplied", () => {
  assert.equal(planStudyHours(5, 40).feasible, null);
  assert.equal(planStudyHours(5, 40, 8).feasible, true);
  assert.equal(planStudyHours(5, 40, 4).shortfallHours, 20);
});

console.log(`\n${passed} academic calculator tests passed.`);
if (process.exitCode === 1) {
  console.error("Some academic calculator tests FAILED.");
} else {
  console.log("Academic calculator formula/safety tests passed.");
}
