import assert from "node:assert/strict";
import fs from "node:fs";
import { getToolById, getToolBySlug, searchTools, tools } from "../src/data/tools.js";

const officeIds = ["mz-online-word","mz-pdf-editor","mz-online-excel","mz-online-powerpoint"];
for (const id of officeIds) {
  const tool = getToolById(id);
  assert.ok(tool, `${id} missing from registry`);
  assert.equal(tool.category,"office-tools",`${id} must use the MZ Office category`);
  for (const field of ["id","name","slug","category","description","keywords","icon","status","processingType","requiresBackend","requiresInternet","seoTitle","seoDescription","relatedTools","route"]) {
    assert.ok(Object.hasOwn(tool,field), `${id} missing registry field ${field}`);
  }
  assert.equal(getToolBySlug(tool.slug)?.id,id,`${id} clean slug must resolve`);
}

const routes = new Set(tools.map((tool)=>tool.route));
assert.equal(routes.size,tools.length,"Tool routes must be unique");
assert.equal(searchTools("edit pdf")[0]?.id,"mz-pdf-editor");
assert.equal(searchTools("create excel")[0]?.id,"mz-online-excel");
assert.equal(searchTools("make presentation")[0]?.id,"mz-online-powerpoint");
assert.equal(searchTools("dictionary")[0]?.id,"mz-dictionary");

const pdf = fs.readFileSync("src/tools/office/PdfEditor.jsx","utf8");
for (const token of ["PDFDocument","getPageCount","rotate","crop","Download PDF","Export selected page PNG"]) assert.ok(pdf.includes(token),`PDF editor missing ${token}`);
assert.match(pdf,/does not|not.*existing.*text/i,"PDF editor must disclose the existing-text editing limitation");

const excel = fs.readFileSync("src/tools/office/OnlineExcel.jsx","utf8");
for (const token of ['import("xlsx")',"Formula bar","XLSX","CSV","computeCell"]) assert.ok(excel.toLowerCase().includes(token.toLowerCase()),`Online Excel missing ${token}`);
assert.doesNotMatch(excel,/\beval\s*\(|new Function\s*\(/,"Spreadsheet formulas must not use eval/new Function");

const ppt = fs.readFileSync("src/tools/office/OnlinePowerPoint.jsx","utf8");
for (const token of ['import("pptxgenjs")',"PPTX","speaker","presentation","PNG","PDF"]) assert.ok(ppt.toLowerCase().includes(token.toLowerCase()),`Online PowerPoint missing ${token}`);

const dictionary = fs.readFileSync("src/tools/reference/MzDictionary.jsx","utf8");
const service = fs.readFileSync("src/services/dictionary.js","utf8");
for (const token of ["definitions","synonyms","antonyms","pronunciation","favorite","recent"]) assert.ok(dictionary.toLowerCase().includes(token),`Dictionary missing ${token}`);
assert.ok(service.includes("fetch("),"Dictionary service must call a real data source");
assert.doesNotMatch(service,/const\s+definitions\s*=\s*\[/,"Dictionary service must not bundle invented definitions");

const officeHub = fs.readFileSync("src/pages/OfficeHub.jsx","utf8");
for (const id of officeIds) assert.ok(officeHub.includes(id),`Office hub missing ${id}`);

console.log("MZ Office and Dictionary source-level regression checks passed.");
