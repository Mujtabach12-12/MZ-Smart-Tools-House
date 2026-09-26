import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tools } from "../src/data/tools.js";
import { getToolSeo } from "../src/data/toolSeo.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const ids = [
  "gpa-calculator",
  "cgpa-calculator",
  "marks-calculator",
  "grade-calculator",
  "attendance-calculator",
  "study-hours-calculator",
];

const calculatorTools = tools.filter((tool) => tool.category === "calculators");
assert.deepEqual(calculatorTools.map((tool) => tool.id), ids, "Calculators category must contain exactly the six audited tools in registry order.");

for (const id of ids) {
  const tool = calculatorTools.find((item) => item.id === id);
  assert.ok(tool?.route === `/tools/${id}`, `${id} must preserve its public route.`);
  const seo = getToolSeo(tool);
  assert.ok(seo.title && seo.description, `${id} must have title/description SEO metadata.`);
  assert.ok(seo.title.length < 90, `${id} SEO title should remain concise.`);
}

const policySource = read("src/data/universities/policies.js");
assert.match(policySource, /policy\.verified !== true/, "Policy data must require explicit verification instead of trusting a source URL alone.");
assert.match(policySource, /source-configured-unverified/, "Configured but unverified university sources must have an explicit status.");

const gpaUi = read("src/tools/calculators/UniversityGpaCalculator.jsx");
assert.match(gpaUi, /Policy Not Verified/, "GPA UI must expose unverified-policy state.");
assert.match(gpaUi, /Custom Scale — User Defined/, "GPA UI must identify custom scale as user-defined.");
assert.match(gpaUi, /inputMode="decimal"/, "GPA/CGPA numeric inputs should request a mobile-friendly decimal keyboard.");
assert.match(gpaUi, /calculator_validation_error/, "GPA/CGPA UI must emit validation analytics only on real errors.");

const gradeUi = read("src/tools/calculators/GradeCalculator.jsx");
assert.match(gradeUi, /Choose a scale/, "Grade Calculator must not silently choose one universal grading table.");
assert.match(gradeUi, /Custom manual scale — not official/, "Grade Calculator custom scale must be clearly labeled.");
assert.match(gradeUi, /verifiedUniversities/, "Grade Calculator official mode must use the verified-policy list only.");

const marksUi = read("src/tools/calculators/MarksCalculator.jsx");
assert.match(marksUi, /Average Marks/, "Marks Calculator must show the requested average result.");
assert.match(marksUi, /sm:grid-cols/, "Marks Calculator must use responsive layout classes.");

const attendanceUi = read("src/tools/calculators/AttendanceCalculator.jsx");
assert.match(attendanceUi, /Consecutive Classes Needed/, "Attendance tool must expose recovery-to-target result.");
assert.match(attendanceUi, /inputMode="numeric"/, "Attendance class counts should request numeric mobile keyboard.");

const studyUi = read("src/tools/calculators/StudyHoursCalculator.jsx");
assert.match(studyUi, /optional/, "Study Hours availability input must be visibly optional.");
assert.match(studyUi, /Required Hours\/Day/, "Study Hours must expose the core workload/days result.");

const errorSource = read("src/components/tools/ErrorMessage.jsx");
assert.match(errorSource, /role="alert"/, "Calculator validation errors must be announced accessibly.");

console.log("Academic calculator product/source audit PASS: 6 routes, SEO, policy-safety, responsive/accessibility contracts checked.");
