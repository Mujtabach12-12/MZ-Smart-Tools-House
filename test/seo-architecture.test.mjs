import assert from "node:assert/strict";
import fs from "node:fs";
import { tools } from "../src/data/tools.js";
import { categories } from "../src/data/categories.js";

const toolRoutes = tools.map((tool)=>tool.route);
assert.equal(new Set(toolRoutes).size,toolRoutes.length,"Canonical tool routes must be unique");
const categoryRoutes = categories.map((category)=>category.route);
assert.equal(new Set(categoryRoutes).size,categoryRoutes.length,"Canonical category routes must be unique");
for (const tool of tools) {
  assert.ok(tool.route.startsWith("/tools/") || tool.route.startsWith("/convert/") || tool.route==="/convert",`${tool.id} has an invalid canonical route`);
  assert.ok(tool.seoTitle?.trim(),`${tool.id} lacks seoTitle`);
  assert.ok(tool.seoDescription?.trim(),`${tool.id} lacks seoDescription`);
}
const sitemap = fs.readFileSync("public/sitemap.xml","utf8");
for (const path of ["/tools/online-word","/tools/pdf-editor","/tools/online-excel","/tools/online-powerpoint","/tools/dictionary","/office","/student-hub"]) {
  assert.ok(sitemap.includes(path),`Sitemap missing ${path}`);
}
const robots = fs.readFileSync("public/robots.txt","utf8");
assert.match(robots,/Sitemap:\s*https?:\/\//i,"robots.txt must expose sitemap URL");
const seo = fs.readFileSync("src/components/layout/Seo.jsx","utf8");
assert.ok(seo.includes("canonical"),"SEO component must manage canonical URLs");
assert.ok(seo.includes("og:title") || seo.includes("property",),"SEO component must support Open Graph metadata");

console.log("SEO architecture regression checks passed.");
