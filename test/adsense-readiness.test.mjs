import assert from "node:assert/strict";
import fs from "node:fs";
import { tools } from "../src/data/tools.js";
import { getSearchFocusedTools, hasRichSeo } from "../src/data/toolSeo.js";
import { guides } from "../src/data/guides.js";

const focused = getSearchFocusedTools(tools);
assert.ok(focused.length >= 20, `Expected a meaningful curated search set, got ${focused.length}`);
assert.ok(focused.length < tools.filter((tool) => tool.status === "active").length, "Quality gate should keep thin/unreviewed active tools out of the search-focused set");
assert.ok(focused.every((tool) => hasRichSeo(tool)), "Every search-focused tool must pass the rich-content policy");

for (const tool of focused) {
  const route = tool.route || `/tools/${tool.id}`;
  assert.ok(route.startsWith("/"), `${tool.id} needs a crawlable route`);
}

assert.ok(guides.length >= 5, "Publish at least five substantive original guides before the next AdSense review");
for (const guide of guides) {
  assert.ok(guide.slug && guide.title && guide.description && guide.intro, "Guide metadata is incomplete");
  assert.ok(Array.isArray(guide.sections) && guide.sections.length >= 4, `${guide.slug} needs at least four useful sections`);
  const body = [guide.intro, ...guide.sections.flatMap((section) => [section.heading, ...(section.paragraphs || []), ...(section.bullets || [])])].join(" ");
  assert.ok(body.length >= 1800, `${guide.slug} is too thin for the editorial guide set`);
  assert.ok(!/coming soon/i.test(body), `${guide.slug} contains placeholder copy`);
}

const blog = fs.readFileSync("src/pages/Blog.jsx", "utf8");
assert.ok(!/coming soon/i.test(blog), "Blog must not be a placeholder during AdSense review");
assert.ok(blog.includes("Editorial approach"), "Blog should explain its editorial approach");

const header = fs.readFileSync("src/components/layout/Header.jsx", "utf8");
assert.ok(header.includes("<strong>MZ Smart Tools House</strong>"), "Mobile/header brand must use the exact product name");
assert.ok(!header.includes("<strong>MZ</strong>"), "Standalone MZ header label should not remain");

const mobile = fs.readFileSync("src/components/home/MobileHome.jsx", "utf8");
assert.ok(mobile.includes("MobileAiFeatureStrip"), "Premium mobile feature strip is missing");
assert.ok(!mobile.includes('className="mz-mobile-stats"'), "Old duplicated mobile stats strip should be removed");

const network = fs.readFileSync("src/components/network/NetworkStatusOverlay.jsx", "utf8");
assert.ok(network.includes("navigator.onLine"), "Offline detection missing");
assert.ok(network.includes("effectiveType"), "Weak-connection detection missing");
assert.ok(network.includes("MZ AI lost the internet"), "MZ AI offline copy missing");

const routes = fs.readFileSync("src/router/AppRoutes.jsx", "utf8");
assert.ok(routes.includes('path="blog/:slug"'), "Guide article route missing");

const sitemap = fs.readFileSync("scripts/generate-sitemap.js", "utf8");
assert.ok(sitemap.includes("guideRoutes"), "Editorial guide sitemap routes missing");

console.log(`AdSense readiness source audit passed: ${focused.length} curated tool pages + ${guides.length} editorial guides.`);
