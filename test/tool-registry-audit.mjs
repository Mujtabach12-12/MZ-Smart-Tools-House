import { formulaToolRecords } from "../src/tools/science/formulaRegistry.js";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registrySource = fs.readFileSync(path.join(root, "src/data/tools.js"), "utf8");
const loaderSource = fs.readFileSync(path.join(root, "src/tools/index.js"), "utf8");
const activeIds = [...registrySource.matchAll(/id:\s*["']([^"']+)["'][\s\S]{0,600}?status:\s*["']active["']/g)].map((m) => m[1]);
const converterSource = fs.readFileSync(path.join(root, "src/tools/converters/conversionRegistry.js"), "utf8");
for (const m of converterSource.matchAll(/toolId:"([^"]+)"/g)) if (!activeIds.includes(m[1])) activeIds.push(m[1]);
if (!activeIds.includes("universal-conversion-hub")) activeIds.push("universal-conversion-hub");
for (const tool of formulaToolRecords) if (!activeIds.includes(tool.id)) activeIds.push(tool.id);
const loaderIds = new Set([...loaderSource.matchAll(/["']([a-z0-9-]+)["']\s*:\s*\(\)\s*=>/g)].map((m) => m[1]));
const missing = activeIds.filter((id) => !loaderIds.has(id));
const invalidIcons = [];
for (const file of walk(path.join(root, "src"))) {
  if (!/\.(jsx|js)$/.test(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  if (/FileUser/.test(source)) invalidIcons.push(file);
}
if (missing.length || invalidIcons.length) {
  console.error({ missing, invalidIcons });
  process.exit(1);
}
console.log(`Tool registry audit passed: ${activeIds.length} active tools have implementations and no known invalid FileUser imports were found.`);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full); else yield full;
  }
}
