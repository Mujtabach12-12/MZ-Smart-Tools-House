import assert from "node:assert/strict";
import fs from "node:fs";
import { searchTools, getToolById } from "../src/data/tools.js";
import { getCompilerConfig, COMPILER_LANGUAGES } from "../src/services/compiler.js";

const first = (q) => searchTools(q)[0]?.id;
assert.equal(first("compress pdf"), "pdf-compressor", "compress pdf should resolve to PDF Compressor first");
assert.equal(first("crop document"), "smart-document-scanner", "crop document should resolve to Smart Scanner first");
assert.equal(first("cpp"), "programming-lab", "cpp should resolve to Programming Lab first");
assert.equal(first("write assignment"), "mz-online-word", "write assignment should resolve to MZ Online Word first");
assert.equal(first("gpa"), "gpa-calculator", "gpa should resolve to the main GPA calculator first");

for (const id of ["mz-online-word","programming-lab","ai-writing-assistant"]) {
  const tool = getToolById(id);
  assert.ok(tool, `${id} must be in the centralized registry`);
  for (const key of ["route","processingType","requiresBackend","requiresInternet"]) assert.ok(key in tool, `${id} missing registry field ${key}`);
}

const word = fs.readFileSync("src/tools/document/MzOnlineWord.jsx","utf8");
for (const token of ["contentEditable","localStorage","Packer.toBlob","PDFDocument","Assignment template","Import DOCX/TXT/HTML","sanitizeImportedHtml","name.startsWith(\"on\")","/^javascript:/i"]) assert.ok(word.includes(token), `MZ Online Word missing ${token}`);
assert.doesNotMatch(word, /\.doc\"|Word-compatible \.doc/i, "Word editor must not disguise HTML as DOC");

const lab = fs.readFileSync("src/tools/programming/ProgrammingLab.jsx","utf8");
for (const token of ["new Worker","Network disabled in browser runner","Thanks for your interest","sandbox=\"allow-scripts\"","signal?.addEventListener(\"abort\"","Run"]) assert.ok(lab.includes(token), `Programming Lab missing ${token}`);
assert.ok(COMPILER_LANGUAGES.some((l)=>l.id==="cpp"&&!l.browser), "C++ must not be labeled browser-supported");
assert.equal(getCompilerConfig().configured, false, "compiler backend must remain unconfigured unless VITE_COMPILER_API_URL is supplied");

const ai = fs.readFileSync("src/tools/ai/AiWritingAssistant.jsx","utf8");
assert.ok(ai.includes("Coming soon") && ai.includes("Thanks for your interest"), "AI UI must show the approved simple coming-soon state while its backend capability is unavailable");

const app = fs.readFileSync("src/App.jsx","utf8");
assert.ok(app.includes("v7_startTransition") && app.includes("v7_relativeSplatPath"), "React Router 6.26 future flags must be enabled");
const boundary = fs.readFileSync("src/components/layout/ErrorBoundary.jsx","utf8");
assert.ok(boundary.includes("componentStack") && boundary.includes("import.meta.env.DEV"), "ErrorBoundary must expose developer details only in development");
const pwa = fs.readFileSync("src/components/pwa/PwaManager.jsx","utf8");
assert.ok(pwa.includes("installEventRef.current") && pwa.includes("mz-pwa-install-request"), "PWA install event must be retained and callable from user interaction");

console.log("Platform feature regression checks passed.");
