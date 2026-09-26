import assert from "node:assert/strict";
import {
  buildGeneratorModel,
  documentStatistics,
  formatMarkdown,
  inclusiveDayCount,
  markdownBlocks,
  markdownToSafeHtml,
  modelToHtml,
  modelToPlainText,
  validateTimetableEntries,
} from "../src/lib/studentDocuments/toolkit.js";

let passed=0; const tests=[];
const test=(name,fn)=>tests.push([name,fn]);
const throws=(name,fn,re)=>test(name,()=>assert.throws(fn,re));

test("assignment cover preserves every supplied field",()=>{
  const data={university:"University of Lahore",department:"Computer Science",course:"Artificial Intelligence",assignment:"Assignment 01",topic:"Search Algorithms",studentName:"Muhammad Mujtaba",rollNumber:"12345",semester:"5th Semester",submittedTo:"Dr. Ahmed Ali",submissionDate:"2026-09-26"};
  const model=buildGeneratorModel("assignment-cover-page-generator",data);
  const text=modelToPlainText(model);
  for(const value of Object.values(data)) assert.ok(text.includes(value),`missing ${value}`);
  const html=modelToHtml(model); assert.ok(html.startsWith("<!doctype html>")); assert.ok(html.includes("University of Lahore"));
});

test("student CV contains supplied sections and no invented achievements",()=>{
  const model=buildGeneratorModel("student-cv-builder",{name:"Muhammad Mujtaba",title:"BSCS Student | AI & Software Developer",email:"m@example.com",phone:"123",links:"https://example.com",summary:"Student developer",education:"BS Computer Science\nUniversity of Lahore",skills:"Python\nJavaScript\nReact",projects:"MZ Smart Tool House\nMZ AI Hospital",experience:"Student / Developer"});
  const text=modelToPlainText(model);
  assert.ok(text.includes("MZ Smart Tool House")); assert.ok(text.includes("Python")); assert.doesNotMatch(text,/award|certified|expert/i);
});

test("resume hides omitted optional sections",()=>{
  const model=buildGeneratorModel("resume-builder",{name:"A",email:"a@example.com",summary:"Summary",phone:"",links:"",skills:"",education:"",experience:"",projects:"",certifications:"",achievements:""});
  const text=modelToPlainText(model); assert.doesNotMatch(text,/Certifications|Achievements|Projects/);
});

throws("resume invalid email is rejected",()=>buildGeneratorModel("resume-builder",{name:"A",email:"bad",summary:"x"}),/valid email/i);
throws("resume unsafe URL is rejected",()=>buildGeneratorModel("resume-builder",{name:"A",email:"a@example.com",summary:"x",links:"javascript:alert(1)"}),/valid http/i);

test("leave application uses inclusive day count",()=>{
  const model=buildGeneratorModel("leave-application",{student:"Muhammad Mujtaba",to:"HOD",reason:"Personal leave",fromDate:"2026-09-28",toDate:"2026-09-30"});
  assert.ok(modelToPlainText(model).includes("3 calendar days"));
});
test("inclusive date count same day",()=>assert.equal(inclusiveDayCount("2026-09-28","2026-09-28"),1));
throws("leave application end before start rejected",()=>inclusiveDayCount("2026-09-30","2026-09-28"),/before start/);

test("timetable sorts and validates entries",()=>{
  const {entries,overlaps}=validateTimetableEntries([
    {day:"Tuesday",subject:"Database",start:"10:00",end:"11:30"},
    {day:"Monday",subject:"AI",start:"09:00",end:"10:30"},
  ]);
  assert.equal(overlaps.length,0); assert.equal(entries[0].day,"Monday");
});
test("timetable detects overlap",()=>{
  const {overlaps}=validateTimetableEntries([
    {day:"Monday",subject:"AI",start:"09:00",end:"10:00"},
    {day:"Monday",subject:"DB",start:"09:30",end:"10:30"},
  ]); assert.equal(overlaps.length,1);
});
throws("timetable rejects reversed times",()=>validateTimetableEntries([{day:"Monday",subject:"AI",start:"10:00",end:"09:00"}]),/after start/);

test("document statistics exact sample",()=>{
  const s=documentStatistics("Hello world. This is a test document.");
  assert.equal(s.words,7); assert.equal(s.characters,37); assert.equal(s.sentences,2); assert.equal(s.paragraphs,1); assert.equal(s.wordsPerMinute,200);
});
test("empty document has zero reading time",()=>assert.equal(documentStatistics("").readingMinutes,0));
test("Unicode words counted",()=>assert.ok(documentStatistics("Hello پاکستان مرحبا 你好").words>=4));

test("Markdown safe HTML supports headings, lists, emphasis, link and code",()=>{
  const md="# MZ Smart Tool House\n\n## Features\n\n* Developer Tools\n* Student Tools\n\n**Bold** and *italic* with `code`.\n\n[Example](https://example.com)\n\n```\nconst x = 1;\n```";
  const html=markdownToSafeHtml(md); assert.ok(html.includes("<h1>MZ Smart Tool House</h1>")); assert.ok(html.includes("<ul>")); assert.ok(html.includes("<strong>Bold</strong>")); assert.ok(html.includes("<em>italic</em>")); assert.ok(html.includes("<pre><code>")); assert.ok(html.includes('href="https://example.com"'));
});
test("Markdown raw script is escaped",()=>{
  const html=markdownToSafeHtml('<script>alert(1)</script>'); assert.doesNotMatch(html,/<script>/i); assert.ok(html.includes("&lt;script&gt;"));
});
test("Markdown javascript link neutralized",()=>{
  const html=markdownToSafeHtml('[x](javascript:alert(1))'); assert.ok(html.includes('href="#"'));
});
test("Markdown formatter preserves fenced code",()=>{
  const source="#Heading   \n\n\n```js\nconst x = 1;   \n```\n* item";
  const out=formatMarkdown(source); assert.ok(out.startsWith("# Heading")); assert.ok(out.includes("const x = 1;   ")); assert.ok(out.endsWith("- item"));
});
test("Markdown blocks parse structure",()=>{
  const blocks=markdownBlocks("# H\n- A\n1. B\n> Q\n---\n```\ncode\n```"); assert.deepEqual(blocks.map(b=>b.type),["h1","bullet","number","quote","hr","code"]);
});

test("cover letter uses supplied facts",()=>{
  const model=buildGeneratorModel("cover-letter-generator",{applicant:"Muhammad Mujtaba",position:"AI Engineer Intern",company:"Example Technology Company",recipient:"",skills:"Python, Machine Learning, React",experience:"Academic and personal projects",customMessage:"I want to contribute to practical AI products.",date:"2026-09-26"});
  const text=modelToPlainText(model); for(const v of ["Muhammad Mujtaba","AI Engineer Intern","Example Technology Company","Python, Machine Learning, React","Academic and personal projects"])assert.ok(text.includes(v));
});

test("scholarship content preserves user statement",()=>{
  const statement="My own personal statement."; const model=buildGeneratorModel("scholarship-application",{student:"M",program:"BS Computer Science",university:"University of Lahore",semester:"5",scholarship:"Merit",achievements:"Dean list",statement,date:"2026-09-26"}); assert.ok(modelToPlainText(model).includes(statement));
});

for(const [name,fn] of tests){try{await fn();passed++;}catch(err){console.error(`FAIL: ${name}`);console.error(err);process.exitCode=1;}}
if(process.exitCode)process.exit(process.exitCode);
console.log(`Student Document core tests PASS (${passed}/${tests.length})`);
