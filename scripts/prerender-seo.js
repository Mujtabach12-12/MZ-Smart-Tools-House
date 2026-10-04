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
import { getCategorySeo } from "../src/data/categorySeo.js";
import { getActiveToolsByCategory } from "../src/data/tools.js";
import { hasRichSeo } from "./seo-index-plan.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, "../dist");
const BASE_URL = String(process.env.SITE_URL || process.env.VITE_SITE_URL || "https://mztoolshouse.com").replace(/\/+$/, "");
const SITE_NAME = "MZ Smart Tools House";
const DEFAULT_IMAGE = `${BASE_URL}/assets/mz-og-1200x630.webp`;
const INDEX_ROBOTS = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

const staticPages = [
  ["/", "Free Online PDF, Image, Document & Student Tools", "Free online PDF, image, document, scanner, student, calculator and developer tools. Edit, convert, compress, scan and create files in one fast browser workspace."],
  ["/tools", "Free Online Tools – PDF, Image, Student, Developer & More", "Browse active online tools for PDF, images, documents, students, developers, calculators, converters, business, science and everyday productivity."],
  ["/categories", "Online Tool Categories – PDF, Image, Student, Developer & More", "Browse online tool categories for PDF, images, documents, students, developers, calculators, converters, finance, science and productivity."],
  ["/office", "Online Office Suite – Word, Excel, PowerPoint & PDF", "Create documents, spreadsheets and presentations, view or edit PDFs, and export real files from one browser-based office workspace."],
  ["/student-hub", "MZ Student Hub – Assignments, Study, GPA & Office Tools", "A focused student productivity hub for assignments, scanning, PDF, dictionary, GPA, study planning, spreadsheets and presentations."],
  ["/about", "About", "Learn about MZ Smart Tools House, its browser-first tools, privacy approach and product mission."],
  ["/contact", "Contact Us", "Get in touch with the MZ Smart Tools House team."],
  ["/privacy-policy", "Privacy Policy", "How MZ Smart Tools House handles your data, files and website analytics."],
  ["/terms", "Terms & Conditions", "Terms and conditions for using MZ Smart Tools House."],
  ["/disclaimer", "Disclaimer", "Disclaimer for calculators and tools on MZ Smart Tools House."],
  ["/blog", "Blog", "Guides and articles for students, study, productivity and tool workflows.", "noindex,follow"],
];

const utilityPages = [
  ["/settings", "Tool Configuration", "Configure optional integrations and local tool preferences.", "noindex,follow"],
  ["/tool-health", "Tool Health", "Internal tool-health and implementation status view.", "noindex,follow"],
];

const records = new Map();
function buildFullTitle(title) {
  const clean = String(title || "").trim();
  if (!clean) return `${SITE_NAME} – Free Online Tools for Work & Study`;
  if (clean.includes(SITE_NAME)) return clean;
  const branded = `${clean} | ${SITE_NAME}`;
  return branded.length <= 70 ? branded : clean;
}

function add(path, title, description, robots = INDEX_ROBOTS, extra = {}) {
  const normalized = path === "/" ? "/" : `/${String(path).replace(/^\/+|\/+$/g, "")}`;
  const fullTitle = buildFullTitle(title);
  records.set(normalized, { path: normalized, title: fullTitle, description, robots, ...extra });
}

for (const [path, title, description, robots] of [...staticPages, ...utilityPages]) add(path, title, description, robots);
for (const category of categories) {
  const path = category.route || `/categories/${category.slug}`;
  const categorySeo = getCategorySeo(category, getActiveToolsByCategory(category.slug));
  add(path, categorySeo.title, categorySeo.description, category.seoIndexable === false ? "noindex,follow" : INDEX_ROBOTS, { kind: "category", category, seo: categorySeo });
}
for (const tool of tools.filter((item) => item.status === "active")) {
  const seo = getToolSeo(tool);
  const indexable = tool.seoIndexable !== false && hasRichSeo(tool);
  add(tool.route || `/tools/${tool.id}`, seo.title, seo.description || tool.description, indexable ? INDEX_ROBOTS : "noindex,follow", { kind: "tool", tool, seo });
}
for (const university of universityPolicies) {
  const verified = university.verified === true;
  add(
    `/gpa-calculator/${university.id}`,
    `${university.shortName || university.name} GPA Calculator`,
    verified
      ? `Calculate GPA using ${university.name} grading references, course credit hours and grade points. Review the published policy source before academic decisions.`
      : `${university.name} grading policy is not currently verified by MZ Smart Tools House. This route remains available for transparency and custom-scale workflows.`,
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
  const graph=[{"@type":"WebPage","@id":`${canonicalUrl}#webpage`,url:canonicalUrl,name:record.title,description:record.description,inLanguage:"en",isPartOf:{"@id":`${BASE_URL}/#website`},primaryImageOfPage:{"@type":"ImageObject",url:DEFAULT_IMAGE}}];
  if(record.kind==="tool"&&record.tool){graph.push({"@type":"SoftwareApplication","@id":`${canonicalUrl}#app`,name:record.tool.name,url:canonicalUrl,applicationCategory:"WebApplication",operatingSystem:"Any",offers:{"@type":"Offer",price:"0",priceCurrency:"USD"},description:record.description});const faq=Array.isArray(record.seo?.faq)?record.seo.faq:[];if(faq.length)graph.push({"@type":"FAQPage",mainEntity:faq.slice(0,8).map(([q,a])=>({"@type":"Question",name:String(q),acceptedAnswer:{"@type":"Answer",text:String(a)}}))});}
  return JSON.stringify({"@context":"https://schema.org","@graph":graph}).replace(/</g,"\\u003c");
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
  const seo=record.seo||{};
  const list=(title,items)=>Array.isArray(items)&&items.length?`<section><h2>${escapeHtml(title)}</h2><ul>${items.slice(0,8).map((x)=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></section>`:"";
  const faq=Array.isArray(seo.faq)&&seo.faq.length?`<section><h2>Frequently asked questions</h2>${seo.faq.slice(0,6).map(([q,a])=>`<h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p>`).join("")}</section>`:"";
  const detail=record.kind==="tool"?`${seo.intro?`<p>${escapeHtml(seo.intro)}</p>`:""}${seo.formula?`<section><h2>How it works</h2><p>${escapeHtml(seo.formula)}</p></section>`:""}${seo.example?`<section><h2>Example</h2><p>${escapeHtml(seo.example)}</p></section>`:""}${list("How to use",seo.howTo)}${list("Key features",seo.features)}${list("Common uses",seo.useCases)}${list("Supported formats",seo.supportedFormats)}${faq}`:"";
  const crawlSummary = `<main data-prerender-content style="max-width:980px;margin:48px auto;padding:0 20px;font:16px/1.65 system-ui;color:#172033"><nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/tools">Tools</a></nav><h1 style="font-size:32px;line-height:1.2;margin:12px 0">${escapeHtml(record.title.replace(/\s*\|\s*MZ Smart Tools House$/i, ""))}</h1><p>${escapeHtml(record.description)}</p>${detail}<section><h2>Explore more tools</h2><p><a href="/tools">Browse all tools</a> · <a href="/pdf-tools">PDF tools</a> · <a href="/image-tools">Image tools</a> · <a href="/student-tools">Student tools</a> · <a href="/developer-tools">Developer tools</a></p></section></main>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${crawlSummary}</div>`);
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

const notFoundRecord = { path: "/404", title: `Page Not Found | ${SITE_NAME}`, description: "The requested MZ Smart Tools House page could not be found.", robots: "noindex,nofollow" };
writeFileSync(resolve(DIST_DIR, "404.html"), renderShell(template, notFoundRecord), "utf8");

console.log(`SEO route shells written: ${written}; 404 shell written`);
