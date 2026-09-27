import assert from "node:assert/strict";
import fs from "node:fs";
import { tools } from "../src/data/tools.js";
import { categories } from "../src/data/categories.js";
import { getToolSeo } from "../src/data/toolSeo.js";

const priorityIds = [
  "pdf-compressor", "mz-pdf-editor", "pdf-merger", "pdf-to-word", "image-compressor",
  "image-resizer", "mz-online-word", "resume-builder", "gpa-calculator", "attendance-calculator",
  "emi-calculator", "json-formatter", "password-generator", "smart-document-scanner", "pdf-ocr",
  "jpg-to-pdf", "pdf-to-jpg", "regex-tester", "cgpa-calculator", "programming-lab",
];

for (const id of priorityIds) {
  const tool = tools.find((item) => item.id === id);
  assert.ok(tool, `Missing priority tool: ${id}`);
  const seo = getToolSeo(tool);
  assert.ok(seo.title && !seo.title.includes("Free Online Tool"), `${id} still uses generic title boilerplate`);
  assert.ok(seo.description && !seo.description.includes("Use this free online tool from MZ Smart Tool House"), `${id} still uses generic description boilerplate`);
  assert.ok((seo.intro || "").trim(), `${id} should have unique explanatory intro content`);
}

for (const slug of ["pdf-tools", "image-tools", "student-tools", "developer-tools", "calculators"]) {
  const category = categories.find((item) => item.slug === slug);
  assert.ok(category?.seoTitle, `${slug} needs a curated SEO title`);
  assert.ok(category?.seoDescription, `${slug} needs a curated SEO description`);
}

const seoComponent = fs.readFileSync("src/components/layout/Seo.jsx", "utf8");
assert.ok(seoComponent.includes("trimmedTitle.includes(SITE_NAME)"), "SEO component must prevent duplicate brand suffixes");
const toolPage = fs.readFileSync("src/pages/ToolPage.jsx", "utf8");
assert.ok(toolPage.includes('tool.status !== "active" || missingImplementation || tool.seoIndexable === false'), "Unavailable tools must be noindex");
const categoryPage = fs.readFileSync("src/pages/CategoryPage.jsx", "utf8");
assert.ok(categoryPage.includes('list.length===1?"tool":"tools"'), "Category metadata must use correct singular/plural wording");

console.log(`SEO growth hardening: ${priorityIds.length} priority tools + core metadata guards PASS`);
