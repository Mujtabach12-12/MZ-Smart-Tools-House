import assert from "node:assert/strict";
import {
  parseJson, formatJson, minifyJson, validateJson,
  encodeBase64Text, decodeBase64Text, encodeBase64Bytes, decodeBase64Bytes,
  encodeUrl, decodeUrl, formatHtml, formatCss, formatJavaScript,
  executeRegexCore, convertInteger, timestampToDate, dateToTimestamps,
  generateUuidV4, generateSecurePassword, sha256Text,
  hexToRgb, rgbToHex, escapeHtmlText, unescapeHtmlText, generateLorem,
} from "../src/lib/developer/toolkit.js";

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }
function throws(name, fn, pattern) { test(name, () => assert.throws(fn, pattern)); }

// JSON
const sample = '{"name":"Mujtaba","age":22,"skills":["Python","JavaScript"],"active":true}';
test("JSON parses real structure", () => { const v=parseJson(sample); assert.equal(v.name,"Mujtaba"); assert.equal(v.age,22); assert.deepEqual(v.skills,["Python","JavaScript"]); assert.equal(v.active,true); });
test("JSON formatter returns valid readable JSON", () => { const out=formatJson(sample); assert.ok(out.includes('\n  "name"')); assert.deepEqual(JSON.parse(out),JSON.parse(sample)); });
test("JSON nested objects survive formatting", () => { const input='{"user":{"name":"Mujtaba","profile":{"country":"Pakistan"}},"projects":[{"name":"MZ Smart Tool House"}]}'; assert.deepEqual(JSON.parse(formatJson(input)),JSON.parse(input)); });
throws("JSON trailing comma rejected", () => formatJson('{"name":"Mujtaba",}'), /Invalid JSON/);
throws("JSON single quotes rejected", () => validateJson("{'name':'Mujtaba'}"), /Invalid JSON/);
test("JSON null zero false and empty remain distinct", () => { const v=parseJson('{"value":null,"number":0,"boolean":false,"empty":""}'); assert.equal(v.value,null); assert.equal(v.number,0); assert.equal(v.boolean,false); assert.equal(v.empty,""); });
test("JSON minifier changes only representation", () => { const input='{\n  "name": "Mujtaba",\n  "age": 22\n}'; assert.equal(minifyJson(input),'{"name":"Mujtaba","age":22}'); });
test("JSON validator returns success only for valid input", () => assert.equal(validateJson('{"ok":true}'),"Valid JSON"));

// Base64
const base64Vectors = [
  ["Hello World","SGVsbG8gV29ybGQ="],
  ["A","QQ=="],
  ["MZ AI Smart Tools","TVogQUkgU21hcnQgVG9vbHM="],
  ["", ""],
];
for (const [plain, encoded] of base64Vectors) test(`Base64 vector ${JSON.stringify(plain)}`,()=>{ assert.equal(encodeBase64Text(plain),encoded); assert.equal(decodeBase64Text(encoded),plain); });
test("Base64 Unicode roundtrip", () => { const value="Hello 🌍 — اردو 中文"; assert.equal(decodeBase64Text(encodeBase64Text(value)),value); });
test("Base64 special characters roundtrip", () => { const value="!@#$%^&*()"; assert.equal(decodeBase64Text(encodeBase64Text(value)),value); });
test("Base64 binary bytes roundtrip", () => { const bytes=new Uint8Array([0,1,2,127,128,255]); assert.deepEqual([...decodeBase64Bytes(encodeBase64Bytes(bytes))],[...bytes]); });
throws("Invalid Base64 characters rejected", () => decodeBase64Text("%%%INVALID%%%"), /Invalid Base64/);
throws("Malformed Base64 length rejected", () => decodeBase64Text("A"), /Invalid Base64 length/);

// URL
const urlText="MZ Smart Tool House 🌍";
test("URL component spaces",()=>assert.equal(encodeUrl("hello world"),"hello%20world"));
test("URL component reserved chars",()=>assert.equal(decodeUrl(encodeUrl("hello world & test")),"hello world & test"));
test("URL Unicode roundtrip",()=>assert.equal(decodeUrl(encodeUrl(urlText)),urlText));
test("URL plus sign remains plus through component roundtrip",()=>assert.equal(decodeUrl(encodeUrl("a+b")),"a+b"));
test("Full URL mode keeps URL structure",()=>{ const out=encodeUrl("https://example.com/search?q=hello world","full-url"); assert.ok(out.startsWith("https://example.com/search?q=")); assert.ok(out.includes("hello")); });
throws("Malformed URL percent sequence rejected",()=>decodeUrl("hello%ZZ"),/Malformed percent-encoding/);

// Formatters
const html='<div><h1>Hello</h1><p>World</p></div>';
test("HTML formatter adds readable structure",()=>{ const out=formatHtml(html); assert.ok(out.includes("<div>\n")); assert.ok(out.includes("<h1>")); assert.ok(out.includes("World")); });
test("HTML formatter preserves quoted attributes",()=>{ const input='<div class="test" id="main"><p>Hello</p></div>'; const out=formatHtml(input); assert.ok(out.includes('class="test" id="main"')); });
test("HTML formatter preserves raw pre text",()=>{ const input='<div><pre> a\n  b </pre></div>'; const out=formatHtml(input); assert.ok(out.includes(' a\n  b ')); });
throws("HTML unclosed tag token rejected",()=>formatHtml('<div class="x"'),/not closed/);
const css=':root{--primary:#2563eb}body{margin:0;color:var(--primary)}@media (max-width:768px){body{padding:10px}}';
test("CSS formatter preserves variables and media query",()=>{ const out=formatCss(css); assert.ok(out.includes("--primary: #2563eb")); assert.ok(out.includes("@media")); assert.ok(out.includes("var(--primary)")); });
test("CSS formatter preserves semicolon in strings",()=>{ const out=formatCss('a{content:"a;b";color:red}'); assert.ok(out.includes('"a;b"')); });
test("CSS formatter preserves calc expression",()=>{ const out=formatCss('a{width:calc(100% - 20px)}'); assert.ok(out.includes('calc(100% - 20px)')); });
throws("CSS unbalanced block rejected",()=>formatCss('body{color:red'),/unbalanced/i);
const js='const user={name:"Mujtaba",age:22};console.log(user?.name ?? "Unknown");';
test("JavaScript formatter preserves modern syntax",()=>{ const out=formatJavaScript(js); assert.ok(out.includes('user?.name ?? "Unknown"')); assert.ok(out.includes('name:"Mujtaba"')); });
test("JavaScript formatter preserves semicolon in string",()=>{ const out=formatJavaScript('const s="a;b";console.log(s);'); assert.ok(out.includes('"a;b"')); });
test("JavaScript formatter preserves template literal",()=>{ const out=formatJavaScript('const s=`hello; ${name}`;console.log(s);'); assert.ok(out.includes('`hello; ${name}`')); });
test("JavaScript formatter preserves regex literal",()=>{ const out=formatJavaScript('const re=/a{2};b/g;console.log(re);'); assert.ok(out.includes('/a{2};b/g')); });
throws("JavaScript unbalanced delimiters rejected",()=>formatJavaScript('const x={a:1'),/unbalanced/i);

// Regex
const regexA=executeRegexCore({pattern:"\\d+",flags:"g",text:"Order 123 and item 456"});
test("Regex finds two numeric matches",()=>assert.deepEqual(regexA.matches.map(m=>m.match),["123","456"]));
const regexB=executeRegexCore({pattern:"([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})",flags:"g",text:"test@example.com"});
test("Regex captures groups",()=>{ assert.equal(regexB.matches[0].match,"test@example.com"); assert.equal(regexB.matches[0].groups[0],"test"); assert.equal(regexB.matches[0].groups[1],"example.com"); });
test("Regex no-match is empty array",()=>assert.equal(executeRegexCore({pattern:"xyz",text:"abc"}).matches.length,0));
throws("Invalid regex rejected",()=>executeRegexCore({pattern:"[abc",text:"abc"}),/Invalid regular expression/);
throws("Regex excessive pattern length rejected",()=>executeRegexCore({pattern:"a".repeat(501),text:"abc"}),/Pattern is too long/);
throws("Regex excessive text length rejected",()=>executeRegexCore({pattern:"a",text:"a".repeat(500001)}),/Test text is too large/);

// Integer converters / BigInt
for (const [input,base,decimal,binary,hex] of [
  ["10",10,"10","1010","A"], ["255",10,"255","11111111","FF"], ["1010",2,"10","1010","A"], ["11111111",2,"255","11111111","FF"], ["FF",16,"255","11111111","FF"], ["0xFF",16,"255","11111111","FF"], ["0",10,"0","0","0"],
]) test(`Integer conversion ${input} base ${base}`,()=>{ const v=convertInteger(input,base); assert.deepEqual(v,{decimal,binary,hex}); });
throws("Invalid binary rejected",()=>convertInteger("10201",2),/valid base-2/);
throws("Invalid hex rejected",()=>convertInteger("GHI",16),/valid base-16/);
test("BigInt conversion preserves unsafe Number integer exactly",()=>assert.equal(convertInteger("9007199254740993",10).decimal,"9007199254740993"));
test("Negative integer sign preserved",()=>assert.equal(convertInteger("-255",10).hex,"-FF"));

// Timestamp
for (const [value,unit,iso] of [["0","seconds","1970-01-01T00:00:00.000Z"],["1","seconds","1970-01-01T00:00:01.000Z"],["86400","seconds","1970-01-02T00:00:00.000Z"],["-1","seconds","1969-12-31T23:59:59.000Z"],["1000","milliseconds","1970-01-01T00:00:01.000Z"],["1000000","microseconds","1970-01-01T00:00:01.000Z"]]) test(`Timestamp ${value} ${unit}`,()=>assert.equal(timestampToDate(value,unit).iso,iso));
test("Date to timestamp reverse conversion",()=>{ const v=dateToTimestamps("1970-01-01T00:00:01Z"); assert.equal(v.seconds,"1"); assert.equal(v.milliseconds,"1000"); assert.equal(v.microseconds,"1000000"); });
throws("Timestamp decimal rejected",()=>timestampToDate("1.5","seconds"),/whole numbers/);

// UUID
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
test("100 UUID v4 values are valid and unique",()=>{ const list=Array.from({length:100},()=>generateUuidV4()); assert.equal(new Set(list).size,100); for(const id of list)assert.match(id,uuidPattern); });

// Password
for (const length of [12,16,32]) test(`Password length ${length}`,()=>assert.equal(generateSecurePassword(length,{uppercase:true,lowercase:true,numbers:true,symbols:true}).length,length));
test("Password selected classes represented",()=>{ for(let i=0;i<50;i++){const p=generateSecurePassword(16,{uppercase:true,lowercase:true,numbers:true,symbols:true});assert.match(p,/[A-Z]/);assert.match(p,/[a-z]/);assert.match(p,/[2-9]/);assert.match(p,/[!@#$%^&*_\-+=?]/);} });
test("1000 secure passwords respect length and are unique in smoke sample",()=>{ const list=Array.from({length:1000},()=>generateSecurePassword(16,{uppercase:true,lowercase:true,numbers:true,symbols:true})); assert.equal(new Set(list).size,1000); assert.ok(list.every(value=>value.length===16)); });
test("Password uppercase-only works",()=>assert.match(generateSecurePassword(12,{uppercase:true,lowercase:false,numbers:false,symbols:false}),/^[A-Z]+$/));
test("Password lowercase-only works",()=>assert.match(generateSecurePassword(12,{uppercase:false,lowercase:true,numbers:false,symbols:false}),/^[a-z]+$/));
test("Password numbers-only works",()=>assert.match(generateSecurePassword(12,{uppercase:false,lowercase:false,numbers:true,symbols:false}),/^[2-9]+$/));
test("Password symbols-only works",()=>assert.match(generateSecurePassword(12,{uppercase:false,lowercase:false,numbers:false,symbols:true}),/^[!@#$%^&*_\-+=?]+$/));
throws("Password no selected class rejected",()=>generateSecurePassword(12,{uppercase:false,lowercase:false,numbers:false,symbols:false}),/Select at least one/);

// SHA-256
const hashVectors=[
  ["hello","2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"],
  ["","e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
  ["abc","ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
];
for(const [value,expected] of hashVectors)test(`SHA-256 vector ${JSON.stringify(value)}`,async()=>assert.equal(await sha256Text(value),expected));
test("SHA-256 Unicode deterministic",async()=>{const a=await sha256Text("Hello 🌍");const b=await sha256Text("Hello 🌍");assert.equal(a,b);assert.equal(a.length,64);});

// Colors
for(const [hex,r,g,b] of [["#FFFFFF",255,255,255],["#000000",0,0,0],["#FF0000",255,0,0],["#00FF00",0,255,0],["#0000FF",0,0,255],["#336699",51,102,153],["#fff",255,255,255]]) test(`HEX ${hex}`,()=>assert.deepEqual(({r:hexToRgb(hex).r,g:hexToRgb(hex).g,b:hexToRgb(hex).b}),{r,g,b}));
test("RGB to HEX white",()=>assert.equal(rgbToHex(255,255,255),"#FFFFFF"));
test("RGB to HEX sample",()=>assert.equal(rgbToHex(51,102,153),"#336699"));
throws("RGB negative rejected",()=>rgbToHex(-1,0,0),/0 to 255/);
throws("RGB >255 rejected",()=>rgbToHex(256,0,0),/0 to 255/);
throws("RGB decimal rejected",()=>rgbToHex(1.5,0,0),/whole numbers/);
throws("8-digit HEX rejected instead of dropping alpha",()=>hexToRgb("#336699FF"),/3-digit or 6-digit/);

// HTML entities / XSS text
const xss='<img src=x onerror=alert(1)>';
test("HTML escape escapes XSS string as text",()=>{const escaped=escapeHtmlText(xss);assert.ok(escaped.startsWith("&lt;img"));assert.ok(!escaped.includes("<img"));});
test("HTML escape/unescape roundtrip",()=>{const value='<div>Hello & welcome — "MZ" \'Tools\'</div>';assert.equal(unescapeHtmlText(escapeHtmlText(value)),value);});
test("HTML common entity decode",()=>assert.equal(unescapeHtmlText("&lt;div&gt;Hello&lt;/div&gt;"),"<div>Hello</div>"));
test("HTML numeric entity decode",()=>assert.equal(unescapeHtmlText("&#65;&#x42;"),"AB"));

// Lorem
for(const count of [1,3,5,20])test(`Lorem ${count} paragraphs`,()=>assert.equal(generateLorem(count).split(/\n\n/).length,count));
throws("Lorem count 0 rejected",()=>generateLorem(0),/1 to 20/);

// Cross-tool integration
const chainedJson=minifyJson(formatJson('{"a":1,"b":[2,3]}'));
test("JSON Formatter → Minifier → parse",()=>assert.deepEqual(JSON.parse(chainedJson),{a:1,b:[2,3]}));
test("Base64 Encoder → Decoder roundtrip",()=>{const value="Cross tool 🌍";assert.equal(decodeBase64Text(encodeBase64Text(value)),value);});
test("URL Encoder → Decoder roundtrip",()=>{const value="a+b & 🌍";assert.equal(decodeUrl(encodeUrl(value)),value);});
test("HEX → RGB → HEX roundtrip",()=>{const c=hexToRgb("#336699");assert.equal(rgbToHex(c.r,c.g,c.b),"#336699");});
test("HTML Escape → Unescape roundtrip",()=>{const value='<script>alert("x")</script>';assert.equal(unescapeHtmlText(escapeHtmlText(value)),value);});
test("Binary → Decimal → Hex chain",()=>{const b=convertInteger("1010",2);const d=convertInteger(b.decimal,10);assert.equal(d.hex,"A");});

for (const [name, fn] of tests) {
  try { await fn(); passed += 1; }
  catch (error) { console.error(`FAIL: ${name}`); console.error(error); process.exitCode = 1; }
}
if (process.exitCode) process.exit(process.exitCode);
console.log(`Developer core tests PASS (${passed}/${tests.length})`);
