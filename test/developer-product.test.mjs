import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT=resolve(new URL("..",import.meta.url).pathname);
const read=(path)=>readFileSync(resolve(ROOT,path),"utf8");
const ids=["json-viewer","json-formatter","json-validator","json-minifier","base64-encoder","base64-decoder","url-encoder","url-decoder","html-formatter","css-formatter","javascript-formatter","regex-tester","binary-converter","decimal-converter","hex-converter","unix-timestamp-converter","uuid-generator","password-generator","hash-generator","color-converter","rgb-to-hex","hex-to-rgb","html-escape","html-unescape","lorem-ipsum-generator","unix-timestamp-converter-plus"];
const tools=read("src/data/tools.js");
const loaders=read("src/tools/index.js");
const component=read("src/tools/developer/DeveloperTool.jsx");
const toolkit=read("src/lib/developer/toolkit.js");
const worker=read("src/workers/regexWorker.js");
const seo=read("src/data/developerToolSeo.js");
const routes=read("src/router/AppRoutes.jsx");
const redirects=read("public/_redirects");
const pkg=JSON.parse(read("package.json"));

for(const id of ids){
  assert.match(tools,new RegExp(`id: "${id}"[^\\n]+category: "developer-tools"[^\\n]+status: "active"`),`${id} missing active Developer registry entry`);
  assert.match(loaders,new RegExp(`"${id}": \\(\\) => import\\("\\./developer/DeveloperTool"\\)`),`${id} not routed to dedicated DeveloperTool`);
  assert.ok(seo.includes(`"${id}"`),`${id} missing dedicated SEO record`);
}
assert.equal(ids.length,26);
assert.match(component,/new Worker\(new URL\("\.\.\/\.\.\/workers\/regexWorker\.js"/);
assert.match(component,/600\)/,"Regex UI timeout contract missing");
assert.match(worker,/executeRegexCore/);
assert.match(toolkit,/cryptoObject\.getRandomValues/);
assert.match(toolkit,/cryptoObject\.randomUUID/);
assert.match(toolkit,/subtle\.digest\("SHA-256"/);
for(const forbidden of [/Math\.random\(/,/\beval\s*\(/,/new Function\s*\(/,/dangerouslySetInnerHTML/,/\.innerHTML\s*=/,/\bbtoa\s*\(/,/\batob\s*\(/]){
  assert.doesNotMatch(component,forbidden,`Developer component contains unsafe/deprecated pattern ${forbidden}`);
  assert.doesNotMatch(toolkit,forbidden,`Developer toolkit contains unsafe/deprecated pattern ${forbidden}`);
  assert.doesNotMatch(worker,forbidden,`Regex worker contains unsafe/deprecated pattern ${forbidden}`);
}
assert.match(routes,/tools\/unix-timestamp-converter-pro/);
assert.match(redirects,/\/tools\/unix-timestamp-converter-pro \/tools\/unix-timestamp-converter-plus 301/);
assert.equal(pkg.scripts["test:developer"],"node test/developer-tools.test.mjs");
assert.equal(pkg.scripts["test:developer-product"],"node test/developer-product.test.mjs");
assert.ok(pkg.scripts["test:all"].includes("test:developer"));
assert.doesNotMatch(read("src/tools/UtilityTool.jsx"),/function CodeTool\(/,"Dead legacy Developer CodeTool should be removed");
assert.doesNotMatch(read("src/tools/expanded/ExpandedTool.jsx"),/function DeveloperAdvanced\(/,"Dead legacy DeveloperAdvanced should be removed");
console.log("Developer product/source audit PASS (26/26 dedicated routes + security/SEO/worker contracts)");
