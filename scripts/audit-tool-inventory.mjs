import fs from "node:fs";
import path from "node:path";
import { tools } from "../src/data/tools.js";
import { healthRows } from "../src/data/toolHealth.js";

const root = process.cwd();
const loaderSource = fs.readFileSync(path.join(root, "src/tools/index.js"), "utf8");
const loaderMap = new Map();
for (const match of loaderSource.matchAll(/"([a-z0-9-]+)"\s*:\s*\(\)\s*=>\s*import\("([^"]+)"\)/g)) loaderMap.set(match[1], match[2]);
const healthMap = new Map(healthRows.map((row) => [row.id, row]));

const fixedDuringAudit = new Set([
  "smart-document-scanner","pdf-compressor","pdf-repair","pdf-metadata-editor","pdf-page-size-converter","pdf-compare",
  "text-to-pdf","markdown-to-pdf","word-to-pdf","markdown-to-html","txt-to-docx","html-to-docx",
  "tip-calculator","bill-splitter","tax-calculator","fuel-cost-calculator","speed-distance-time","pace-calculator","running-pace-calculator","study-hours-calculator-plus","percentage-calculator-plus","marks-required-calculator",
  "lean-body-mass-calculator","smart-study-schedule-generator","image-metadata-remover",
]);
const optionalAi = new Set(["smart-text-summarizer","study-notes-generator","flashcard-generator","quiz-generator","email-generator","formal-text-converter"]);

function io(tool) {
  const id = tool.id;
  if (id === "smart-document-scanner") return ["Camera / JPG / PNG / WebP", "PDF / searchable PDF / JPG / PNG / TXT"];
  if (id === "word-to-pdf") return ["DOCX", "PDF"];
  if (id === "txt-to-docx") return ["Text", "DOCX"];
  if (id === "html-to-docx") return ["HTML text", "DOCX"];
  if (id === "docx-viewer" || id === "docx-text-extractor") return ["DOCX", "Text"];
  if (id === "pdf-to-jpg") return ["PDF", "JPG images"];
  if (id === "pdf-to-png") return ["PDF", "PNG images"];
  if (id === "jpg-to-pdf" || id === "image-to-pdf") return ["Image(s)", "PDF"];
  if (id === "pdf-to-word") return ["PDF", "DOCX"];
  if (id === "pdf-to-excel") return ["PDF", "XLSX"];
  if (id === "pdf-to-powerpoint") return ["PDF", "PPTX"];
  if (id === "pdf-to-text" || id === "pdf-ocr") return ["PDF", "Text"];
  if (id === "scanned-pdf-to-searchable-pdf") return ["Scanned PDF", "Searchable PDF"];
  if (tool.category === "pdf-tools") return ["PDF" + (id === "pdf-merger" ? " files" : ""), id === "pdf-metadata-viewer" || id === "pdf-page-counter" || id === "pdf-compare" ? "Metadata / text result" : "PDF"];
  if (tool.category === "image-tools") return ["Image", id.includes("metadata-viewer") ? "Metadata" : "Image / file"];
  if (tool.category === "calculators" || tool.category === "finance-tools" || tool.category === "health-tools" || tool.category === "nutrition-tools" || tool.category === "daily-life-tools") return ["Numeric/form input", "Calculated result"];
  if (tool.category === "converter-tools") return ["Numeric value + units", "Converted value"];
  if (tool.category === "date-time-tools") return ["Date/time input", "Date/time result"];
  if (tool.category === "text-tools") return ["Text", "Text / statistics"];
  if (tool.category === "developer-tools") return ["Text / code / structured data", "Text / code result"];
  if (tool.category === "document-tools") return ["Text / document fields", "Document / text file"];
  if (tool.category === "productivity-tools") return ["User entries / time", "On-screen/local result"];
  if (tool.category === "university-tools" || tool.category === "student-tools" || tool.category === "utility-tools") return ["Form/text input", "Calculated/text result"];
  return ["User input", "Result"];
}

function currentStatus(tool, loader, health) {
  if (tool.status !== "active") return "NOT IMPLEMENTED";
  if (!loader) return "BROKEN";
  if (health?.health === "working") return "WORKING";
  return "PARTIALLY WORKING";
}

function problems(tool, loader) {
  if (!loader) return "Active registry entry has no routed component.";
  const id = tool.id;
  const notes = [];
  if (fixedDuringAudit.has(id)) notes.push("A concrete runtime/behavior defect was repaired during the 2026-09-20 audit; browser E2E remains pending.");
  if (id === "pdf-compressor") notes.push("Medium/high mode may flatten selectable text/forms/links; output is now retained only when it is genuinely smaller.");
  if (id === "smart-document-scanner") notes.push("Real-device camera behavior, lighting/background robustness, OCR export and mobile gestures still need device E2E tests.");
  if (["pdf-to-word","pdf-to-excel","pdf-to-powerpoint"].includes(id)) notes.push("Conversion is text-extraction based and does not reproduce the source PDF layout/table semantics exactly.");
  if (id === "pdf-repair") notes.push("Repair is parse-and-re-save normalization; unreadable/severely corrupted PDFs cannot be recovered in-browser.");
  if (id === "word-to-pdf") notes.push("DOCX paragraph text is converted; complex Word layout, images, tables and exact pagination are not reproduced.");
  if (id === "html-to-docx") notes.push("Produces a real DOCX but intentionally simplifies advanced HTML/CSS styling.");
  if (optionalAi.has(id)) notes.push("Local deterministic mode works without a backend; optional AI mode requires the configured serverless endpoint and provider key.");
  if (!notes.length) notes.push("No complete browser E2E/mobile verification exists yet; wired/rendering status is not treated as proof of full functionality.");
  return notes.join(" ");
}

function requiredFix(tool, health) {
  if (tool.status !== "active") return "Implement real behavior before enabling the registry entry.";
  const gaps = [];
  for (const [label,key] of [["function","functionTest"],["UI","uiTest"],["output","outputTest"],["download","downloadTest"],["mobile","mobileTest"],["error handling","errorHandlingTest"]]) {
    const value = health?.[key];
    if (value && !["PASS","N/A"].includes(value)) gaps.push(label);
  }
  return gaps.length ? `Add/execute real tests for: ${gaps.join(", ")}.` : "No current verification gap recorded.";
}

const rows = tools.map((tool) => {
  const loader = loaderMap.get(tool.id) || "";
  const health = healthMap.get(tool.id);
  const [inputType, outputType] = io(tool);
  return {
    toolName: tool.name,
    id: tool.id,
    category: tool.category,
    route: tool.route,
    currentStatus: currentStatus(tool, loader, health),
    inputType,
    outputType,
    processing: optionalAi.has(tool.id) ? "Browser + optional Serverless/API" : tool.processingType || "browser",
    implementation: loader || "MISSING",
    knownProblems: problems(tool, loader),
    requiredFix: requiredFix(tool, health),
    functionTest: health?.functionTest || "NOT TESTED",
    uiTest: health?.uiTest || "NOT TESTED",
    outputTest: health?.outputTest || "NOT TESTED",
    downloadTest: health?.downloadTest || "NOT TESTED",
    mobileTest: health?.mobileTest || "NOT TESTED",
    errorHandlingTest: health?.errorHandlingTest || "NOT TESTED",
    lastTestTime: health?.lastTestTime || "Not tested",
  };
});

const csvEscape = (value) => `"${String(value ?? "").replaceAll('"','""')}"`;
const headers = Object.keys(rows[0]);
const csv = [headers.map(csvEscape).join(","), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))].join("\n") + "\n";
const summary = rows.reduce((a,row)=>(a[row.currentStatus]=(a[row.currentStatus]||0)+1,a),{});
const categories = rows.reduce((a,row)=>(a[row.category]=(a[row.category]||0)+1,a),{});

fs.mkdirSync(path.join(root,"audit"),{recursive:true});
fs.writeFileSync(path.join(root,"audit/tool-inventory.json"),JSON.stringify({generatedAt:"2026-09-20",summary,categories,rows},null,2)+"\n");
fs.writeFileSync(path.join(root,"audit/tool-inventory.csv"),csv);
let md = `# Tool Inventory — 2026-09-20\n\nThis inventory is conservative: a routed component is not considered fully working until all applicable function, UI, output, download, mobile and error-handling checks pass.\n\n## Summary\n\n`;
for (const [k,v] of Object.entries(summary)) md += `- ${k}: **${v}**\n`;
md += `\n## Tools\n\n| Tool | Category | Route | Status | Input | Output | Processing | Known problems / limitations | Required fix |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) md += `| ${r.toolName.replaceAll('|','\\|')} | ${r.category} | \`${r.route}\` | ${r.currentStatus} | ${r.inputType} | ${r.outputType} | ${r.processing} | ${r.knownProblems.replaceAll('|','\\|')} | ${r.requiredFix.replaceAll('|','\\|')} |\n`;
fs.writeFileSync(path.join(root,"audit/tool-inventory.md"),md);
console.log(`Inventory generated for ${rows.length} tools:`, summary);
