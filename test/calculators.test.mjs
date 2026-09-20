import assert from "node:assert/strict";
import { computeGpa } from "../src/lib/calculators/gpa.js";
import { computeCgpa } from "../src/lib/calculators/cgpa.js";
import { percentageOf, valueFromPercentage, percentageChange } from "../src/lib/calculators/percentage.js";
import { computeMarks } from "../src/lib/calculators/marks.js";
import { percentageToGrade } from "../src/lib/calculators/grade.js";
import { currentAttendancePercentage, maxMissableClasses, classesNeededToReach } from "../src/lib/calculators/attendance.js";
import { calculateAge } from "../src/lib/calculators/age.js";
import { applyDiscount, discountPercentFromPrices } from "../src/lib/calculators/discount.js";
import { computeAverage } from "../src/lib/calculators/average.js";
import { simplifyRatio, solveProportion } from "../src/lib/calculators/ratio.js";
import { combineDurations, clockTimeDifference } from "../src/lib/calculators/time.js";
import { planStudyHours } from "../src/lib/calculators/studyHours.js";

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log("GPA Calculator");
test("normal case: 3 courses", () => {
  const r = computeGpa([
    { creditHours: 3, grade: "A" },
    { creditHours: 4, grade: "B+" },
    { creditHours: 3, grade: "C" },
  ]);
  // (3*4 + 4*3.3 + 3*2) / 10 = (12+13.2+6)/10 = 3.12
  assert.equal(r.gpa, 3.12);
  assert.equal(r.totalCredits, 10);
});
test("single course = grade point itself", () => {
  const r = computeGpa([{ creditHours: 3, grade: "A+" }]);
  assert.equal(r.gpa, 4.0);
});
test("rejects empty course list", () => {
  assert.throws(() => computeGpa([]));
});
test("rejects negative credit hours", () => {
  assert.throws(() => computeGpa([{ creditHours: -3, grade: "A" }]));
});
test("rejects unknown grade", () => {
  assert.throws(() => computeGpa([{ creditHours: 3, grade: "Z" }]));
});

console.log("CGPA Calculator");
test("weighted average across semesters", () => {
  const r = computeCgpa([
    { gpa: 3.5, creditHours: 15 },
    { gpa: 3.0, creditHours: 18 },
  ]);
  // (3.5*15 + 3.0*18)/33 = (52.5+54)/33 = 3.2272... -> 3.23
  assert.equal(r.cgpa, 3.23);
});
test("rejects gpa > 4", () => {
  assert.throws(() => computeCgpa([{ gpa: 4.5, creditHours: 15 }]));
});
test("rejects zero credit hours", () => {
  assert.throws(() => computeCgpa([{ gpa: 3.0, creditHours: 0 }]));
});

console.log("Percentage Calculator");
test("part is what % of whole", () => {
  assert.equal(percentageOf(45, 60), 75);
});
test("value from percentage", () => {
  assert.equal(valueFromPercentage(25, 200), 50);
});
test("percentage increase", () => {
  assert.equal(percentageChange(50, 75), 50);
});
test("percentage decrease", () => {
  assert.equal(percentageChange(80, 60), -25);
});
test("rejects divide by zero whole", () => {
  assert.throws(() => percentageOf(10, 0));
});

console.log("Marks Calculator");
test("aggregates multiple subjects", () => {
  const r = computeMarks([
    { obtained: 45, total: 50 },
    { obtained: 38, total: 50 },
    { obtained: 90, total: 100 },
  ]);
  assert.equal(r.totalObtained, 173);
  assert.equal(r.totalMax, 200);
  assert.equal(r.percentage, 86.5);
});
test("rejects obtained > total", () => {
  assert.throws(() => computeMarks([{ obtained: 60, total: 50 }]));
});
test("rejects negative obtained", () => {
  assert.throws(() => computeMarks([{ obtained: -5, total: 50 }]));
});

console.log("Grade Calculator");
test("90% -> A+", () => assert.equal(percentageToGrade(90), "A+"));
test("82% -> A", () => assert.equal(percentageToGrade(82), "A"));
test("40% -> F", () => assert.equal(percentageToGrade(40), "F"));
test("boundary 85% -> A+", () => assert.equal(percentageToGrade(85), "A+"));
test("rejects percentage > 100", () => assert.throws(() => percentageToGrade(150)));
test("rejects negative percentage", () => assert.throws(() => percentageToGrade(-5)));

console.log("Attendance Calculator");
test("current percentage", () => assert.equal(currentAttendancePercentage(45, 50), 90));
test("max missable classes above requirement", () => {
  // attended 45/50 = 90%, required 75% -> can miss floor(45*100/75 - 50) = floor(60-50)=10
  assert.equal(maxMissableClasses(45, 50, 75), 10);
});
test("max missable is 0 when already below requirement", () => {
  assert.equal(maxMissableClasses(20, 50, 75), 0);
});
test("classes needed to reach requirement when below", () => {
  // attended 20/50=40%, need 75%: y >= (0.75*50-20)/(1-0.75) = (37.5-20)/0.25 = 70
  assert.equal(classesNeededToReach(20, 50, 75), 70);
});
test("classes needed is 0 when already at requirement", () => {
  assert.equal(classesNeededToReach(45, 50, 75), 0);
});
test("rejects attended > total", () => assert.throws(() => currentAttendancePercentage(60, 50)));

console.log("Age Calculator");
test("exact years", () => {
  const r = calculateAge("2000-01-01", "2024-01-01");
  assert.equal(r.years, 24);
  assert.equal(r.months, 0);
  assert.equal(r.days, 0);
});
test("years/months/days mixed", () => {
  const r = calculateAge("2000-05-15", "2024-03-01");
  assert.equal(r.years, 23);
  assert.equal(r.months, 9);
  assert.equal(r.days, 15);
});
test("rejects future dob", () => {
  assert.throws(() => calculateAge("2099-01-01", "2024-01-01"));
});
test("rejects invalid date string", () => {
  assert.throws(() => calculateAge("not-a-date", "2024-01-01"));
});

console.log("Discount Calculator");
test("apply discount", () => {
  const r = applyDiscount(2000, 25);
  assert.equal(r.finalPrice, 1500);
  assert.equal(r.saved, 500);
});
test("reverse: find discount percent", () => {
  const r = discountPercentFromPrices(2000, 1500);
  assert.equal(r.percent, 25);
});
test("rejects discount > 100", () => assert.throws(() => applyDiscount(100, 150)));
test("rejects final > original", () => assert.throws(() => discountPercentFromPrices(100, 200)));

console.log("Average Calculator");
test("basic average", () => {
  const r = computeAverage([10, 20, 30]);
  assert.equal(r.average, 20);
  assert.equal(r.sum, 60);
  assert.equal(r.min, 10);
  assert.equal(r.max, 30);
});
test("single value", () => {
  const r = computeAverage([42]);
  assert.equal(r.average, 42);
});
test("rejects empty list", () => assert.throws(() => computeAverage([])));
test("rejects non-numeric entry", () => assert.throws(() => computeAverage([1, "abc", 3])));

console.log("Ratio Calculator");
test("simplify integer ratio", () => {
  const r = simplifyRatio(8, 12);
  assert.equal(r.a, 2);
  assert.equal(r.b, 3);
});
test("simplify decimal ratio", () => {
  const r = simplifyRatio(1.5, 2);
  assert.equal(r.a, 3);
  assert.equal(r.b, 4);
});
test("solve proportion for d", () => {
  const r = solveProportion({ a: 2, b: 3, c: 10, d: null });
  assert.equal(r.d, 15);
});
test("solve proportion for a", () => {
  const r = solveProportion({ a: null, b: 3, c: 10, d: 15 });
  assert.equal(r.a, 2);
});
test("rejects zero/negative ratio values", () => assert.throws(() => simplifyRatio(0, 5)));
test("rejects more than one missing value", () => assert.throws(() => solveProportion({ a: null, b: null, c: 1, d: 2 })));

console.log("Time Calculator");
test("add durations with carry", () => {
  const r = combineDurations({ h: 1, m: 45, s: 0 }, { h: 0, m: 30, s: 0 }, "add");
  assert.equal(r.h, 2);
  assert.equal(r.m, 15);
});
test("subtract durations", () => {
  const r = combineDurations({ h: 2, m: 0, s: 0 }, { h: 0, m: 45, s: 0 }, "subtract");
  assert.equal(r.h, 1);
  assert.equal(r.m, 15);
});
test("clock time difference same day", () => {
  const r = clockTimeDifference("09:00", "17:30");
  assert.equal(r.h, 8);
  assert.equal(r.m, 30);
});
test("clock time difference crossing midnight", () => {
  const r = clockTimeDifference("22:00", "02:00");
  assert.equal(r.h, 4);
  assert.equal(r.m, 0);
});
test("rejects malformed clock time", () => assert.throws(() => clockTimeDifference("9am", "5pm")));

console.log("Study Hours Calculator");
test("feasible plan", () => {
  const r = planStudyHours(10, 40, 5);
  assert.equal(r.requiredHoursPerDay, 4);
  assert.equal(r.feasible, true);
});
test("infeasible plan reports shortfall", () => {
  const r = planStudyHours(5, 40, 4);
  // needs 8/day, only have 4/day -> total available 20, need 40, shortfall 20
  assert.equal(r.feasible, false);
  assert.equal(r.shortfallHours, 20);
});
test("rejects zero days", () => assert.throws(() => planStudyHours(0, 40, 5)));

console.log(`\n${passed} tests passed.`);
if (process.exitCode === 1) {
  console.error("\nSome tests FAILED. See above.");
} else {
  console.log("All calculator logic tests passed.");
}
