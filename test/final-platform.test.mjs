import assert from "node:assert/strict";
import fs from "node:fs";
import { getToolById, searchTools } from "../src/data/tools.js";

for (const id of ["mz-pdf-viewer","mz-powerpoint-viewer","world-clock","time-zone-converter"]) assert.equal(getToolById(id)?.status,"active",`${id} must be active`);
assert.equal(searchTools("view pdf")[0]?.id,"mz-pdf-viewer");
assert.equal(searchTools("pptx viewer")[0]?.id,"mz-powerpoint-viewer");
assert.equal(searchTools("world time")[0]?.id,"world-clock");
assert.equal(searchTools("timezone converter")[0]?.id,"time-zone-converter");

const viewer=fs.readFileSync("src/tools/office/PdfViewer.jsx","utf8");
for(const token of ["pdfjs-dist","getTextContent","requestFullscreen","print","Download"])assert.ok(viewer.includes(token),`PDF Viewer missing ${token}`);
const pptxViewer=fs.readFileSync("src/tools/office/PptxViewer.jsx","utf8");
for(const token of ["jszip","presentation.xml","slide","Export PDF","Original PPTX"])assert.ok(pptxViewer.toLowerCase().includes(token.toLowerCase()),`PPTX Viewer missing ${token}`);
const world=fs.readFileSync("src/tools/reference/WorldClock.jsx","utf8");
assert.ok(world.includes("Intl.DateTimeFormat")&&world.includes("timeZone")&&world.includes("localStorage"),"World Clock must use real IANA timezone formatting and persisted cities");
const converter=fs.readFileSync("src/tools/reference/TimeZoneConverter.jsx","utf8");
assert.ok(converter.includes("Intl.DateTimeFormat")&&converter.includes("formatToParts"),"Time Zone Converter must use timezone-aware Intl conversion");

const feedback=fs.readFileSync("src/components/ui/FeedbackDialog.jsx","utf8");
const feedbackLib=fs.readFileSync("src/lib/feedback.js","utf8");
for(const token of ["saved on this device","Current page".toLowerCase()]){
  if(token==="current page")assert.ok(feedback.toLowerCase().includes(token),`Feedback dialog missing ${token}`); else assert.ok(feedback.includes(token),`Feedback dialog missing ${token}`);
}
for(const token of ["mz-feedback","form-name","queueFeedback"]){
  assert.ok(feedbackLib.includes(token),`Feedback service missing ${token}`);
}
const html=fs.readFileSync("index.html","utf8");
assert.ok(html.includes('name="mz-feedback"')&&html.includes('data-netlify="true"'),"Netlify feedback form detector markup missing");
const netlify=fs.readFileSync("netlify.toml","utf8");
assert.ok(netlify.includes('/api/dictionary')&&netlify.includes('/.netlify/functions/dictionary'),"Dictionary Netlify proxy redirect missing");
const dictFn=fs.readFileSync("netlify/functions/dictionary.js","utf8");
assert.ok(dictFn.includes("dictionaryapi.dev")&&dictFn.includes("cache-control"),"Dictionary function must call the real provider and define caching");
const header=fs.readFileSync("src/components/layout/Header.jsx","utf8");
for(const token of ["Feedback","Install App","Categories","MZ Office"])assert.ok(header.includes(token),`Header missing ${token}`);
console.log("Final platform regression checks passed.");
