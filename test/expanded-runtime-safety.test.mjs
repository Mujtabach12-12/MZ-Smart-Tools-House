import assert from "node:assert/strict";
import fs from "node:fs";
import { tools } from "../src/data/tools.js";

const source = fs.readFileSync("src/tools/expanded/ExpandedTool.jsx", "utf8");
const requiredComponents = ["UnitConverter","HealthTool","DateTimeExtra","DateTool","SmartText","TextAdvanced","PulseCounter","StudySchedule","UniversityGpa","PdfAdvanced","PdfTextConverter","ImageAdjuster","ImageMetadataTool","SmallConverter","SimpleCalculator"];
for (const name of requiredComponents) assert.match(source, new RegExp(`function\\s+${name}\\s*\\(`), `ExpandedTool references ${name} but does not define it`);

const requiredActiveIds = ["image-flipper","image-brightness","image-contrast","grayscale-image","image-blur","image-sharpen","favicon-generator","image-metadata-viewer","image-metadata-remover","tip-calculator","bill-splitter","tax-calculator","fuel-cost-calculator","speed-distance-time","pace-calculator","running-pace-calculator","study-hours-calculator-plus","percentage-calculator-plus","marks-required-calculator"];
for (const id of requiredActiveIds) {
  const tool = tools.find((item) => item.id === id);
  assert.ok(tool, `${id} missing from registry`);
  assert.equal(tool.status, "active", `${id} should be active only with a real implementation`);
  assert.ok(source.includes(`"${id}"`), `${id} is not routed inside ExpandedTool`);
}
assert.match(source, /createImageBitmap\(/, "Image adjustments should decode real image pixels");
assert.match(source, /calculateSimpleTool\(id,values\)/, "Simple calculator UI must use the tested calculation engine");
assert.match(source, /metadata-removed/, "Metadata remover should create a new re-encoded output file");
console.log(`Expanded runtime safety PASS: ${requiredComponents.length} components and ${requiredActiveIds.length} active tool routes verified.`);
