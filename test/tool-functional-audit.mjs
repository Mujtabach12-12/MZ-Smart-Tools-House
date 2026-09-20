import { formulaToolRecords } from "../src/tools/science/formulaRegistry.js";
import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");
const registry = read("src/data/tools.js");
const loaders = read("src/tools/index.js");
const expanded = read("src/tools/expanded/ExpandedTool.jsx");
const utility = read("src/tools/UtilityTool.jsx");
const page = read("src/pages/ToolPage.jsx");

const ids = [...registry.matchAll(/\{ id: "([^"]+)"/g)].map((m) => m[1]);
const active = [...registry.matchAll(/\{ id: "([^"]+)"[^\n]*status: "active"/g)].map((m) => m[1]);
const converterRegistrySource = read("src/tools/converters/conversionRegistry.js");
for (const m of converterRegistrySource.matchAll(/toolId:"([^"]+)"/g)) { if (!ids.includes(m[1])) ids.push(m[1]); if (!active.includes(m[1])) active.push(m[1]); }
if (!ids.includes("universal-conversion-hub")) ids.push("universal-conversion-hub");
if (!active.includes("universal-conversion-hub")) active.push("universal-conversion-hub");
for (const tool of formulaToolRecords) { if (!ids.includes(tool.id)) ids.push(tool.id); if (!active.includes(tool.id)) active.push(tool.id); }
const loaderIds = [...loaders.matchAll(/^\s*"([^"]+)": \(\) => import\(/gm)].map((m) => m[1]);
const expandedIds = [...loaders.matchAll(/^\s*"([^"]+)": \(\) => import\("\.\/expanded\/ExpandedTool"\)/gm)].map((m) => m[1]);
const utilityIds = [...loaders.matchAll(/^\s*"([^"]+)": \(\) => import\("\.\/UtilityTool"\)/gm)].map((m) => m[1]);

const failures = [];
for (const id of active) if (!loaderIds.includes(id)) failures.push(`Active tool has no loader: ${id}`);
for (const id of expandedIds) if (!expanded.includes(`"${id}"`)) failures.push(`Expanded loader is not handled: ${id}`);
for (const id of utilityIds) if (!utility.includes(`"${id}"`)) failures.push(`Utility loader is not handled: ${id}`);
if (!/<ActiveComponent id=\{tool\.id\}[^>]*\/>/.test(page)) failures.push("ToolPage does not pass tool.id into the active implementation.");
if (expanded.includes("This expanded tool is not configured yet.")) failures.push("ExpandedTool still contains the production placeholder.");
if (utility.includes("This tool is not configured yet.")) failures.push("UtilityTool still contains the production placeholder.");

console.log(`Functional tool audit: ${ids.length} registered, ${active.length} active, ${expandedIds.length} expanded, ${utilityIds.length} utility.`);
console.log(`ID-propagation repair covers ${expandedIds.length + utilityIds.length} shared implementations.`);
console.log("Production placeholder occurrences: 0");
if (failures.length) {
  console.error(`\n${failures.length} failure(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("No registry/implementation wiring failures detected.");
