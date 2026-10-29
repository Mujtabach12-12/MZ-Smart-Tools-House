import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { reviewedToolSeo } from "../src/data/reviewedToolSeo.js";
import { guides } from "../src/data/guides.js";
const root=resolve("dist");
const check=(relative)=>{const p=resolve(root,relative);assert.ok(existsSync(p),"Missing "+relative);return readFileSync(p,"utf8");};
const sitemap=check("sitemap.xml");
for(const id of Object.keys(reviewedToolSeo)){
 const route="tools/"+id+"/";
 const url="https://mztoolshouse.com/"+route;
 const page=check(route+"index.html");
 assert.ok(sitemap.includes("<loc>"+url+"</loc>"),"Sitemap missing "+id);
 assert.ok(page.includes('rel="canonical" href="'+url+'"'),"Canonical wrong "+id);
 assert.ok(page.includes('data-prerender-content'),"Prerender missing "+id);
 assert.ok(page.includes("<h2>Limitations to know</h2>"),"Missing limitations "+id);
 assert.ok(page.includes("<h2>Example</h2>"),"Missing example "+id);
 assert.ok(!/name="robots" content="noindex/i.test(page),"Unexpected noindex "+id);
}
for(const slug of ["understanding-scholarship-marks-percentage","parallel-resistors-explained"]){
 const url="https://mztoolshouse.com/blog/"+slug+"/";
 const page=check("blog/"+slug+"/index.html");
 assert.ok(page.includes('rel="canonical" href="'+url+'"'),"Guide canonical "+slug);
 assert.ok(sitemap.includes("<loc>"+url+"</loc>"),"Guide sitemap "+slug);
 assert.ok(page.includes("<h2>"),"Missing guide sections "+slug);
}
const res=check("tools/parallel-resistance-calculator/index.html");
assert.ok(res.includes("parallel-resistors-explained"),"Related article not in pre-rendered tool content");
console.log("Production SEO: "+Object.keys(reviewedToolSeo).length+" reviewed tools and 2 articles verified.");
