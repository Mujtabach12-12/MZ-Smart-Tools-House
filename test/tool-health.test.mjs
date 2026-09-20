import assert from "node:assert/strict";
import { tools } from "../src/data/tools.js";
import { healthRows, healthSummary } from "../src/data/toolHealth.js";
assert.equal(healthRows.length, tools.length);
assert.equal(healthSummary.total, tools.length);
assert.equal(healthSummary.total, healthSummary.working+healthSummary.warning+healthSummary.failed+healthSummary["not-implemented"]);
assert.ok(healthSummary.warning > 0, "Unverified tools must not be silently marked working");
for (const row of healthRows) {
  for (const key of ["functionTest","uiTest","outputTest","downloadTest","mobileTest","errorHandlingTest","lastTestTime"]) {
    assert.ok(row[key], `${row.id} is missing ${key}`);
  }
  if (row.health === "working") {
    for (const key of ["functionTest","uiTest","outputTest","downloadTest","mobileTest","errorHandlingTest"]) {
      assert.ok(["PASS","N/A"].includes(row[key]), `${row.id} cannot be working with ${key}=${row[key]}`);
    }
  }
}
console.log(`Tool health manifest passed: ${healthSummary.working} working, ${healthSummary.warning} warning, ${healthSummary.failed} failed, ${healthSummary["not-implemented"]} not implemented.`);
