import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const fail = (message) => { console.error(`\nDEPENDENCY ERROR: ${message}\n`); process.exit(1); };

const major = Number(process.versions.node.split(".")[0]);
if (!Number.isFinite(major) || major < 20) fail(`Node.js ${process.versions.node} is too old. Use Node.js 20 LTS or newer.`);

const required = {
  "vite": 8,
  "pptxgenjs": 4,
  "pdf-lib": 1,
  "react": 18,
  "react-dom": 18,
};

for (const [name, expectedMajor] of Object.entries(required)) {
  const pkgPath = path.join(root, "node_modules", ...name.split("/"), "package.json");
  if (!fs.existsSync(pkgPath)) fail(`${name} is not installed. Run repair-and-run.cmd or npm ci.`);
  const installed = readJson(pkgPath).version;
  const installedMajor = Number(String(installed).split(".")[0]);
  if (installedMajor !== expectedMajor) {
    fail(`${name}@${installed} is installed, but this release expects major ${expectedMajor}. Remove node_modules and run npm ci.`);
  }
}

// These packages belong to the obsolete PptxGenJS 1.x/2.x chain that caused
// Rolldown/Vite parser crashes on the user's machine. They must not exist at
// the top level in the locked V10 install.
for (const legacy of ["jquery-node", "request", "jsdom", "cssstyle"]) {
  const legacyPath = path.join(root, "node_modules", legacy);
  if (fs.existsSync(legacyPath)) {
    fail(`obsolete package ${legacy} is present. The install is stale/corrupted. Delete node_modules and run npm ci.`);
  }
}

const pptx = readJson(path.join(root, "node_modules", "pptxgenjs", "package.json"));
console.log(`Dependency verification PASS (Node ${process.versions.node}, PptxGenJS ${pptx.version}, Vite ${readJson(path.join(root,"node_modules","vite","package.json")).version}).`);
