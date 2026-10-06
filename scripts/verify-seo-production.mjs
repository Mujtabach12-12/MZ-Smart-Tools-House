import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { tools } from "../src/data/tools.js";
import { getSearchFocusedTools } from "./seo-index-plan.js";
import { guides } from "../src/data/guides.js";

const root = resolve(process.cwd(), "dist");
const firstGuide = guides[0];
const critical = [
  "index.html",
  "sitemap.xml",
  "robots.txt",
  "tools/pdf-compressor/index.html",
  "tools/pdf-editor/index.html",
  "tools/smart-document-scanner/index.html",
  "tools/gpa-calculator/index.html",
  "tools/programming-lab/index.html",
  "blog/index.html",
  firstGuide ? `blog/${firstGuide.slug}/index.html` : null,
].filter(Boolean);

const missing = critical.filter((path) => !existsSync(resolve(root, path)));
if (missing.length) throw new Error(`SEO build verification failed. Missing: ${missing.join(", ")}`);

for (const path of critical.filter((item) => item.endsWith("index.html"))) {
  const html = readFileSync(resolve(root, path), "utf8");
  if (!/rel="canonical"/i.test(html)) throw new Error(`${path}: canonical missing`);
  if (/name="robots" content="noindex/i.test(html)) throw new Error(`${path}: critical page is noindex`);
  if (!/<h1[\s>]/i.test(html)) throw new Error(`${path}: crawlable H1 missing`);
}

const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
if (!sitemap.includes("https://mztoolshouse.com/tools/pdf-compressor")) throw new Error("Priority URL missing from sitemap");
if (!sitemap.includes("https://mztoolshouse.com/blog")) throw new Error("Guide hub missing from sitemap");
if (firstGuide && !sitemap.includes(`https://mztoolshouse.com/blog/${firstGuide.slug}`)) throw new Error("Editorial guide missing from sitemap");

const focused = new Set(getSearchFocusedTools(tools).map((tool) => tool.id));
for (const tool of tools.filter((item) => item.status === "active" && item.seoIndexable !== false && !focused.has(item.id))) {
  const route = tool.route || `/tools/${tool.id}`;
  if (sitemap.includes(`<loc>https://mztoolshouse.com${route}</loc>`)) {
    throw new Error(`Thin/unreviewed tool leaked into sitemap: ${tool.id}`);
  }
}

console.log(`SEO production verification passed. Search-focused tools: ${focused.size}; editorial guides: ${guides.length}.`);
