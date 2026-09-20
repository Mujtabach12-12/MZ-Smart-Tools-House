import assert from "node:assert/strict";
import { calculateSimpleTool, SIMPLE_CALCULATOR_FIELDS } from "../src/lib/simpleCalculators.js";

const cases = [
  ["tip-calculator", [100, 15], "Tip: 15 | Total: 115"],
  ["bill-splitter", [90, 3], "Each person: 30"],
  ["tax-calculator", [100, 18], "Tax: 18 | Total: 118"],
  ["fuel-cost-calculator", [20, 250], "Fuel cost: 5000"],
  ["speed-distance-time", [120, 2], "Speed: 60 distance-units/hour"],
  ["pace-calculator", [5, 30], "Pace: 6 min/distance-unit"],
  ["running-pace-calculator", [10, 55], "Running pace: 5.5 min/distance-unit"],
  ["study-hours-calculator-plus", [21, 7], "Required daily study: 3 hours/day"],
  ["percentage-calculator-plus", [25, 200], "25% of 200 = 50"],
  ["marks-required-calculator", [70, 65, 40], "Required final score: 77.5%"],
];

for (const [id, input, expected] of cases) {
  assert.equal(calculateSimpleTool(id, input), expected, id);
}
assert.equal(Object.keys(SIMPLE_CALCULATOR_FIELDS).length, 10);
assert.throws(() => calculateSimpleTool("bill-splitter", [100, 0]), /at least 1/);
assert.throws(() => calculateSimpleTool("speed-distance-time", [100, 0]), /greater than zero/);
assert.throws(() => calculateSimpleTool("marks-required-calculator", [80, 70, 0]), /greater than 0/);
assert.throws(() => calculateSimpleTool("tip-calculator", ["", 10]), /required/);
assert.match(calculateSimpleTool("marks-required-calculator", [95, 50, 20]), /not reachable/);
console.log("Shared calculator regression tests passed: 10 formulas plus validation cases.");
