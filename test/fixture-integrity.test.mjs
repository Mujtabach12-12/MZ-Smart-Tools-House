import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve("test/fixtures");
const required = ["sample.png","sample.pdf","sample.docx","sample.json","sample.csv","sample.js","sample.txt","sample.html","sample.md"];
for (const name of required) {
  const file = path.join(root,name);
  assert.ok(fs.existsSync(file), `${name} is missing`);
  assert.ok(fs.statSync(file).size > 0, `${name} is empty`);
}
const png=fs.readFileSync(path.join(root,"sample.png"));
assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
const pdf=fs.readFileSync(path.join(root,"sample.pdf"),"utf8");
assert.ok(pdf.startsWith("%PDF-"));
assert.match(pdf,/%%EOF\s*$/);
assert.doesNotThrow(()=>JSON.parse(fs.readFileSync(path.join(root,"sample.json"),"utf8")));
try {
  execFileSync("unzip",["-t",path.join(root,"sample.docx")],{stdio:"ignore"});
} catch {
  throw new Error("sample.docx is not a valid ZIP/OOXML package");
}
console.log(`Fixture integrity passed: ${required.length} reusable files.`);
