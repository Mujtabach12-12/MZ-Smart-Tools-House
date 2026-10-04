import { existsSync, readFileSync } from "node:fs";import { resolve } from "node:path";
const root=resolve(process.cwd(),"dist");const critical=["index.html","sitemap.xml","robots.txt","tools/pdf-compressor/index.html","tools/pdf-editor/index.html","tools/smart-document-scanner/index.html","tools/gpa-calculator/index.html","tools/programming-lab/index.html"];
const missing=critical.filter(p=>!existsSync(resolve(root,p)));if(missing.length)throw new Error(`SEO build verification failed. Missing: ${missing.join(", ")}`);
for(const p of critical.filter(x=>x.endsWith("index.html"))){const h=readFileSync(resolve(root,p),"utf8");if(!/rel="canonical"/i.test(h))throw new Error(`${p}: canonical missing`);if(/name="robots" content="noindex/i.test(h))throw new Error(`${p}: critical page is noindex`);if(!/<h1[\s>]/i.test(h))throw new Error(`${p}: crawlable H1 missing`)}
const sm=readFileSync(resolve(root,"sitemap.xml"),"utf8");if(!sm.includes("https://mztoolshouse.com/tools/pdf-compressor"))throw new Error("Priority URL missing from sitemap");console.log("SEO production verification passed.");

