import assert from "node:assert/strict";
import { categories } from "../src/data/categories.js";
import { tools, getActiveTools, getActiveToolsByCategory, getCategoryCounts } from "../src/data/tools.js";

const categorySlugs = new Set(categories.map((c) => c.slug));
assert.equal(categorySlugs.size, categories.length, "Duplicate category slugs found");
const invalid = tools.filter((tool) => !categorySlugs.has(tool.category));
assert.deepEqual(invalid, [], "Tools reference categories that are not registered");

const active = getActiveTools();
const counts = getCategoryCounts();
const totalByCategory = Object.values(counts).reduce((sum, count) => sum + count, 0);
assert.equal(totalByCategory, active.length, "Category counts do not reconcile with active registry total");

for (const category of categories) {
  const actual = getActiveToolsByCategory(category.slug).length;
  assert.equal(actual, counts[category.slug] || 0, `Count mismatch for ${category.slug}`);
}

const ids = new Set();
for (const tool of active) {
  assert.ok(!ids.has(tool.id), `Duplicate active tool id: ${tool.id}`);
  ids.add(tool.id);
}

const utility = getActiveToolsByCategory("utility-tools");
assert.equal(utility.length, 6, "Utility taxonomy should contain the six general-purpose calculators moved from the mixed calculator bucket");
assert.deepEqual(utility.map((t) => t.id), [
  "percentage-calculator",
  "age-calculator",
  "discount-calculator",
  "average-calculator",
  "ratio-calculator",
  "time-calculator",
]);

console.log(`Category registry audit passed: ${active.length} active tools across ${categories.length} categories.`);
console.log(`Utility Tools: ${utility.length}`);
console.log(Object.fromEntries(categories.map((c) => [c.name, getActiveToolsByCategory(c.slug).length])));
