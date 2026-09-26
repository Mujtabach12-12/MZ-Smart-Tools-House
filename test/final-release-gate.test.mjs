import fs from "node:fs";
import assert from "node:assert/strict";
import { tools } from "../src/data/tools.js";
import { categories } from "../src/data/categories.js";

const read = (file) => fs.readFileSync(file, "utf8");
const index = read("index.html");
const startup = read("src/components/pwa/StartupWelcome.jsx");
const viewport = read("src/components/layout/ViewportLock.jsx");
const redirects = read("public/_redirects");
const sitemap = read("public/sitemap.xml");
const footer = read("src/components/layout/Footer.jsx");
const toolPage = read("src/pages/ToolPage.jsx");
const seo = read("src/components/layout/Seo.jsx");
const prerender = read("scripts/prerender-seo.js");
const serviceWorker = read("public/sw.js");
const pwaGenerator = read("scripts/generate-pwa.js");

assert.ok(!/maximum-scale=1|user-scalable=no/.test(index), "browser zoom must remain available");
assert.ok(!viewport.includes("blockPageWheelZoom") && !viewport.includes("blockPageKeyboardZoom"), "ViewportLock must not block native zoom");
assert.match(startup, /WEB_STARTUP_MS\s*=\s*0/);
assert.ok(!index.includes("<h1>MZ <span>Smart Tool House</span></h1>"), "startup overlay must not own the route H1");
assert.ok(index.includes("mz-native-startup-brand"));
assert.ok(redirects.includes("/* /404.html 404"), "unknown routes should return a real 404");
assert.ok(prerender.includes('resolve(DIST_DIR, "404.html")'), "build must generate 404.html");
assert.ok(footer.includes('c.route || `/categories/${c.slug}`'), "footer must link canonical category routes");
assert.ok(toolPage.includes('type="website"'), "tool OG type must be website, not article");
assert.ok(toolPage.includes("getCategoryBySlug"), "tool breadcrumb schema must resolve the canonical category");
assert.ok(!seo.includes("hreflang:"), "single-language site should not emit redundant hreflang links");
assert.ok(index.includes("mz-og-1200x630.webp") && fs.existsSync("public/assets/mz-og-1200x630.webp"));

const ai = tools.find((t) => t.id === "ai-writing-assistant");
assert.equal(ai?.seoIndexable, false, "coming-soon AI tool must not be indexed");
const aiCategory = categories.find((c) => c.slug === "ai-tools");
assert.equal(aiCategory?.seoIndexable, false, "thin AI category must not be indexed yet");
assert.ok(!sitemap.includes("/tools/ai-writing-assistant"));
assert.ok(!sitemap.includes("/ai-tools"));
assert.ok(!serviceWorker.includes("cache.put('/index.html'"), "route responses must not overwrite the offline app shell");
assert.ok(pwaGenerator.includes("normalizedServiceWorker"), "PWA cache version should change when service-worker logic changes");

console.log("Final release global regression gate: PASS");
