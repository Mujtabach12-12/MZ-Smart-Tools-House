// Generate a sitemap only from canonical, indexable application routes.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { tools } from "../src/data/tools.js";
import { categories } from "../src/data/categories.js";
import { universityPolicies } from "../src/data/universities/policies.js";

const __dirname=dirname(fileURLToPath(import.meta.url));
const BASE_URL=String(process.env.SITE_URL||process.env.VITE_SITE_URL||"https://mztoolshouse.com").replace(/\/+$/,"");
const staticRoutes=["/","/tools","/categories","/office","/student-hub","/about","/contact","/privacy-policy","/terms","/disclaimer"];
const categoryRoutes=categories.filter((c)=>c.seoIndexable!==false).map((c)=>c.route||`/categories/${c.slug}`);
const toolRoutes=tools.filter((t)=>t.status==="active"&&t.seoIndexable!==false).map((t)=>t.route||`/tools/${t.id}`);
const universityRoutes=universityPolicies.filter((u)=>u.verified!==false).map((u)=>`/gpa-calculator/${u.id}`);
const allRoutes=[...new Set([...staticRoutes,...categoryRoutes,...toolRoutes,...universityRoutes])];
const escapeXml=(s)=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const urlEntries=allRoutes.map((path)=>`  <url>\n    <loc>${escapeXml(`${BASE_URL}${path}`)}</loc>\n  </url>`).join("\n");
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
const outputPath=resolve(__dirname,"../public/sitemap.xml");writeFileSync(outputPath,xml,"utf-8");
const robots=`User-agent: *\nAllow: /\nDisallow: /.netlify/\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
const robotsPath=resolve(__dirname,"../public/robots.txt");writeFileSync(robotsPath,robots,"utf-8");
try{writeFileSync(resolve(__dirname,"../dist/sitemap.xml"),xml,"utf-8");writeFileSync(resolve(__dirname,"../dist/robots.txt"),robots,"utf-8")}catch{}
console.log(`Sitemap written with ${allRoutes.length} canonical URLs -> ${outputPath}`);
console.log(`Robots written for ${BASE_URL} -> ${robotsPath}`);
