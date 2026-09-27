import assert from "node:assert/strict";
import fs from "node:fs";
import { tools, getActiveToolsByCategory } from "../src/data/tools.js";
import { categories } from "../src/data/categories.js";
import { getToolSeo } from "../src/data/toolSeo.js";
import { getCategorySeo } from "../src/data/categorySeo.js";
import { articles } from "../src/data/articles.js";

const sitemap = fs.readFileSync("public/sitemap.xml", "utf8");
const seoSource = fs.readFileSync("src/components/layout/Seo.jsx", "utf8");
const toolExtras = fs.readFileSync("src/components/tools/ToolExtras.jsx", "utf8");
const categoryPage = fs.readFileSync("src/pages/CategoryPage.jsx", "utf8");

const priorityIds = [
  "pdf-compressor", "mz-pdf-editor", "pdf-merger", "pdf-to-word", "pdf-ocr",
  "jpg-to-pdf", "pdf-to-jpg", "image-compressor", "image-resizer", "mz-online-word",
  "resume-builder", "gpa-calculator", "cgpa-calculator", "attendance-calculator", "emi-calculator",
  "json-formatter", "password-generator", "regex-tester", "smart-document-scanner", "programming-lab",
];

for (const id of priorityIds) {
  const tool = tools.find((item) => item.id === id);
  assert.ok(tool, `Missing priority tool ${id}`);
  const seo = getToolSeo(tool);
  assert.ok(seo.title && !/Free Online Tool$/i.test(seo.title), `${id} still has generic SEO title`);
  assert.ok(seo.description?.length >= 80, `${id} needs a useful meta description`);
  assert.ok(seo.h1?.trim(), `${id} needs an intent-focused H1`);
  assert.ok(Array.isArray(seo.howTo) && seo.howTo.length >= 3, `${id} needs useful how-to steps`);
  assert.ok(Array.isArray(seo.faq) && seo.faq.length >= 2, `${id} needs visible FAQ content`);
}


const indexableTools = tools.filter((tool) => tool.status === "active" && tool.seoIndexable !== false);
const allTitles = indexableTools.map((tool) => getToolSeo(tool).title);
const allDescriptions = indexableTools.map((tool) => getToolSeo(tool).description);
assert.equal(new Set(allTitles).size, allTitles.length, "Indexable tool SEO titles must be unique");
assert.equal(new Set(allDescriptions).size, allDescriptions.length, "Indexable tool meta descriptions must be unique");
assert.equal(allTitles.filter((title) => /Free Online Tool$/i.test(title)).length, 0, "Generic 'Free Online Tool' title fallback must not remain on indexable tools");

for (const category of categories) {
  const count = getActiveToolsByCategory(category.slug).length;
  const seo = getCategorySeo(category, count);
  assert.ok(seo.title?.trim(), `${category.slug} missing category SEO title`);
  assert.ok(seo.description?.trim(), `${category.slug} missing category SEO description`);
  if (count < 2) assert.equal(category.seoIndexable, false, `${category.slug} is thin and should be noindex until expanded`);
  if (category.seoIndexable === false) assert.ok(!sitemap.includes(`<loc>https://mztoolshouse.com${category.route}</loc>`), `${category.route} should not be in sitemap`);
}

assert.ok(articles.length >= 6, "Expected cornerstone guide content");
for (const article of articles) {
  assert.ok(article.sections.length >= 4, `${article.slug} needs substantive sections`);
  assert.ok(sitemap.includes(`<loc>https://mztoolshouse.com/blog/${article.slug}</loc>`), `${article.slug} missing from sitemap`);
}
assert.ok(sitemap.includes("<loc>https://mztoolshouse.com/blog</loc>"), "Guide hub missing from sitemap");
assert.ok(seoSource.includes("buildPageTitle"), "SEO title normalization helper missing");
assert.ok(seoSource.includes("normalizeCanonicalPath"), "Canonical path normalization missing");
assert.ok(toolExtras.includes("Key features") && toolExtras.includes("Important limitations"), "Tool-page helpful content blocks missing");
assert.ok(categoryPage.includes("What you can do with"), "Category intent/content section missing");

console.log(`SEO growth upgrade PASS: ${priorityIds.length} priority tools, ${articles.length} guides, ${categories.length} categories validated.`);
