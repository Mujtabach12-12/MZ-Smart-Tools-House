import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reviewedToolSeo } from "../src/data/reviewedToolSeo.js";
import { getToolById } from "../src/data/tools.js";
import { getToolSeo,hasRichSeo } from "../src/data/toolSeo.js";
import { guides } from "../src/data/guides.js";
import { formulaDefinitions } from "../src/tools/science/formulaEngine.js";
for(const [id,editorial] of Object.entries(reviewedToolSeo)){
 const tool=getToolById(id);
 assert.equal(tool?.status,"active",id+" has no active tool");
 const seo=getToolSeo(tool);
 assert.equal(seo.intro,editorial.intro,id+" content not connected");
 assert.ok(hasRichSeo(tool),id+" should be curated for search");
 assert.ok(seo.description.length>=80 && seo.intro.length>=100 && seo.limitations.length>=75,id+" lacks specific explanation");
 assert.ok(seo.howTo.length>=3 && seo.faq.length>=2 && seo.example.length>=65,id+" lacks worked help");
 assert.ok(!seo.howTo.some(x=>/^Open .*tool|Enter the required information/i.test(x)),id+" generic boilerplate");
}
const cases=[["parallel-resistance-calculator",{r1:100,r2:200},20000/300],
["potential-energy-calculator",{mass:2,height:3},2*9.80665*3],
["electrical-power-calculator",{voltage:12,current:2},24],
["specific-heat-calculator",{mass:2,specificHeat:500,temperatureChange:10},10000],
["normality-calculator",{equivalents:0.5,volume:2},0.25],
["force-calculator",{mass:5,acceleration:2},10]];
for(const [id,input,expected] of cases){
 const d=formulaDefinitions[id];assert.ok(d,id+" engine missing");
 assert.ok(Math.abs(d.calculate(input).value-expected)<0.00001,id+" example mismatch");
}
const special=formulaDefinitions["permutation-combination-calculator"].calculate({n:5,r:2});
assert.ok(special.display.includes("20")&&special.display.includes("10"),"Permutation example mismatch");
for(const slug of ["understanding-scholarship-marks-percentage","parallel-resistors-explained"]){
 const guide=guides.find(g=>g.slug===slug);
 assert.ok(guide?.sections.length>=4,slug+" incomplete");
 assert.ok(guide.relatedTools.every(id=>getToolById(id)),slug+" broken tool links");
 const length=[guide.intro,...guide.sections.flatMap(s=>[s.heading,...(s.paragraphs||[]),...(s.bullets||[])])].join(" ").length;
 assert.ok(length>=1800,slug+" not substantive");
}
const extras=readFileSync("src/components/tools/ToolExtras.jsx","utf8");
assert.ok(extras.includes("relevantGuides")&&extras.includes("/blog/"),"Missing visible guide links");
const script=readFileSync("scripts/prerender-seo.js","utf8");
assert.ok(script.includes("relatedGuideLinks"),"Missing search crawler guide links");
console.log("Curated site-quality checks passed for "+Object.keys(reviewedToolSeo).length+" real tools, 2 original guides and 7 numeric cases.");
