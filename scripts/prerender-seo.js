// Generate route-specific HTML shells so crawlers/social previews receive the
// correct title, description, canonical URL and basic WebPage schema before
// the React SPA boots. This does not duplicate the application UI or prerender
// tool output; React still owns the page body and route behavior.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tools } from "../src/data/tools.js";
import { categories } from "../src/data/categories.js";
import { universityPolicies } from "../src/data/universities/policies.js";
import { getToolSeo } from "../src/data/toolSeo.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, "../dist");
const BASE_URL = String(process.env.SITE_URL || process.env.VITE_SITE_URL || "https://mztoolshouse.com").replace(/\/+$/, "");
const SITE_NAME = "MZ Smart Tool House";
const DEFAULT_IMAGE = `${BASE_URL}/assets/mz-og-1200x630.webp`;
const INDEX_ROBOTS = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

const staticPages = [
  ["/", null, "MZ Smart Tool House is a focused digital office for PDF, documents, images, study, programming, developer utilities, AI and everyday calculations."],
  ["/tools", "All Tools", "Browse every active MZ Smart Tool House utility across office, PDF, science, engineering, education, developer, health, conversion and productivity categories."],
  ["/categories", "Tool Categories", "Browse MZ Smart Tool House categories for health, student, PDF, image, text, finance, converter and developer tools."],
  ["/office", "MZ Office – Online Word, Excel, PowerPoint & PDF Editor", "Create assignments, spreadsheets and presentations, or edit PDFs in one browser-based MZ Office workspace."],
  ["/student-hub", "MZ Student Hub – Assignments, Study, GPA & Office Tools", "A focused student productivity hub for assignments, scanning, PDF, dictionary, GPA, study planning, spreadsheets and presentations."],
  ["/about", "About", "Learn about MZ Smart Tool House, its browser-first tools, privacy approach and product mission."],
  ["/contact", "Contact Us", "Get in touch with the MZ Smart Tool House team."],
  ["/privacy-policy", "Privacy Policy", "How MZ Smart Tool House handles your data, files and website analytics."],
  ["/terms", "Terms & Conditions", "Terms and conditions for using MZ Smart Tool House."],
  ["/disclaimer", "Disclaimer", "Disclaimer for calculators and tools on MZ Smart Tool House."],
  ["/blog", "Blog", "Guides and articles for students, study, productivity and tool workflows.", "noindex,follow"],
];

const utilityPages = [
  ["/settings", "Tool Configuration", "Configure optional integrations and local tool preferences.", "noindex,follow"],
  ["/tool-health", "Tool Health", "Internal tool-health and implementation status view.", "noindex,follow"],
];

const records = new Map();
function add(path, title, description, robots = INDEX_ROBOTS) {
  const normalized = path === "/" ? "/" : `/${String(path).replace(/^\/+|\/+$/g, "")}`;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Smart tools for work, study & productivity`;
  records.set(normalized, { path: normalized, title: fullTitle, description, robots });
}

for (const [path, title, description, robots] of [...staticPages, ...utilityPages]) add(path, title, description, robots);
for (const category of categories) {
  const path = category.route || `/categories/${category.slug}`;
  add(path, `${category.name} – Online Tools`, `${category.description} Explore focused ${category.name.toLowerCase()} tools at MZ Smart Tool House.`, category.seoIndexable === false ? "noindex,follow" : INDEX_ROBOTS);
}
for (const tool of tools.filter((item) => item.status === "active")) {
  const seo = getToolSeo(tool);
  add(tool.route || `/tools/${tool.id}`, seo.title, seo.description || tool.description, tool.seoIndexable === false ? "noindex,follow" : INDEX_ROBOTS);
}
for (const university of universityPolicies) {
  const verified = university.verified === true;
  add(
    `/gpa-calculator/${university.id}`,
    `${university.shortName || university.name} GPA Calculator`,
    verified
      ? `Calculate GPA using ${university.name} grading references, course credit hours and grade points. Review the published policy source before academic decisions.`
      : `${university.name} grading policy is not currently verified by MZ Smart Tool House. This route remains available for transparency and custom-scale workflows.`,
    verified ? INDEX_ROBOTS : "noindex,follow",
  );
}

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function replaceTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}
function replaceMeta(html, attribute, key, content) {
  const escaped = escapeAttr(content);
  const rx = new RegExp(`<meta\\s+([^>]*?)${attribute}=["']${key}["']([^>]*?)>`, "i");
  const existing = html.match(rx);
  if (existing) return html.replace(rx, `<meta ${attribute}="${key}" content="${escaped}"/>`);
  return html.replace("</head>", `<meta ${attribute}="${key}" content="${escaped}"/>\n</head>`);
}
function replaceCanonical(html, url) {
  const tag = `<link rel="canonical" href="${escapeAttr(url)}"/>`;
  const rx = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  return rx.test(html) ? html.replace(rx, tag) : html.replace("</head>", `${tag}\n</head>`);
}
function buildPageSchema(record, canonicalUrl) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: record.title,
    description: record.description,
    inLanguage: "en",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    primaryImageOfPage: { "@type": "ImageObject", url: DEFAULT_IMAGE },
  }).replace(/</g, "\\u003c");
}
function renderShell(template, record) {
  const canonicalUrl = `${BASE_URL}${record.path === "/" ? "/" : record.path}`;
  let html = replaceTitle(template, record.title);
  html = replaceMeta(html, "name", "description", record.description);
  html = replaceMeta(html, "name", "robots", record.robots);
  html = replaceMeta(html, "name", "googlebot", record.robots);
  html = replaceMeta(html, "property", "og:title", record.title);
  html = replaceMeta(html, "property", "og:description", record.description);
  html = replaceMeta(html, "property", "og:url", canonicalUrl);
  html = replaceMeta(html, "name", "twitter:title", record.title);
  html = replaceMeta(html, "name", "twitter:description", record.description);
  html = replaceCanonical(html, canonicalUrl);
  html = html.replace(/<script\s+type=["']application\/ld\+json["']\s+data-prerender-schema=["']page["'][^>]*>[\s\S]*?<\/script>\s*/i, "");
  html = html.replace("</head>", `<script type="application/ld+json" data-prerender-schema="page">${buildPageSchema(record, canonicalUrl)}</script>\n</head>`);
  return html;
}

const template = readFileSync(resolve(DIST_DIR, "index.html"), "utf8");
let written = 0;
for (const record of records.values()) {
  const output = record.path === "/"
    ? resolve(DIST_DIR, "index.html")
    : resolve(DIST_DIR, record.path.slice(1), "index.html");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, renderShell(template, record), "utf8");
  written += 1;
}

const notFoundRecord = { path: "/404", title: `Page Not Found | ${SITE_NAME}`, description: "The requested MZ Smart Tool House page could not be found.", robots: "noindex,nofollow" };
writeFileSync(resolve(DIST_DIR, "404.html"), renderShell(template, notFoundRecord), "utf8");

console.log(`SEO route shells written: ${written}; 404 shell written`);
