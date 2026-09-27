import assert from "node:assert/strict";
import fs from "node:fs";
import { getToolById } from "../src/data/tools.js";
import { getToolSeo } from "../src/data/toolSeo.js";
import { categories } from "../src/data/categories.js";
import { getCategorySeo } from "../src/data/categorySeo.js";

const priorityIds = [
  "pdf-compressor", "mz-pdf-editor", "pdf-merger", "pdf-to-word", "image-compressor",
  "image-resizer", "mz-online-word", "resume-builder", "gpa-calculator", "attendance-calculator",
  "emi-calculator", "json-formatter", "password-generator", "smart-document-scanner", "pdf-ocr",
  "jpg-to-pdf", "pdf-to-jpg", "regex-tester", "cgpa-calculator", "programming-lab",
];

const seenTitles = new Set();
for (const id of priorityIds) {
  const tool = getToolById(id);
  assert.ok(tool, `Missing priority SEO tool: ${id}`);
  const seo = getToolSeo(tool);
  assert.ok(seo.title?.trim(), `${id} missing SEO title`);
  assert.ok(seo.description?.trim().length >= 80, `${id} description is too thin`);
  assert.ok(!/Free Online Tool$/i.test(seo.title), `${id} still uses generic Free Online Tool title`);
  assert.ok(!seenTitles.has(seo.title), `Duplicate priority title: ${seo.title}`);
  seenTitles.add(seo.title);
  assert.ok(Array.isArray(seo.howTo) && seo.howTo.length >= 3, `${id} missing specific how-to steps`);
  assert.ok(Array.isArray(seo.features) && seo.features.length >= 3, `${id} missing feature content`);
  for (const relatedId of seo.related || []) {
    assert.ok(getToolById(relatedId), `${id} references missing related tool ${relatedId}`);
  }
}

for (const slug of ["pdf-tools", "image-tools", "programming-tools", "developer-tools", "calculators", "document-tools", "finance-tools"]) {
  const category = categories.find((item) => item.slug === slug);
  assert.ok(category, `Missing category ${slug}`);
  const seo = getCategorySeo(category, []);
  assert.ok(seo.title && seo.h1 && seo.description && seo.about, `${slug} category SEO incomplete`);
}

const seoComponent = fs.readFileSync("src/components/layout/Seo.jsx", "utf8");
assert.ok(seoComponent.includes("buildFullTitle"), "SEO title normalization missing");
assert.ok(seoComponent.includes("normalizeCanonicalPath"), "Canonical path normalization missing");
assert.ok(seoComponent.includes("branded.length <= 70"), "Long title protection missing");

const toolPage = fs.readFileSync("src/pages/ToolPage.jsx", "utf8");
assert.ok(toolPage.includes('robots={isIndexable ? undefined : "noindex,follow"}'), "Unavailable tools must be noindex");
assert.ok(toolPage.includes('"@type": "HowTo"'), "Visible how-to schema missing");

const analytics = fs.readFileSync("src/lib/analytics.js", "utf8");
assert.ok(analytics.includes('window.gtag("event", "tool_success"'), "Unified tool_success analytics event missing");

const prerender = fs.readFileSync("scripts/prerender-seo.js", "utf8");
assert.ok(prerender.includes("getCategorySeo"), "Prerender must use category SEO data");
assert.ok(prerender.includes("Free Online Tools for Work & Study"), "Homepage prerender title not updated");

console.log(`SEO growth regression checks passed for ${priorityIds.length} priority tools.`);
