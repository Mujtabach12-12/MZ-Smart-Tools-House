const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

export function cleanText(value, max = 50000) {
  return String(value ?? "").replace(CONTROL, "").replace(/\r\n?/g, "\n").slice(0, max);
}

export function escapeHtml(value) {
  return cleanText(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function safeFilename(value, fallback = "document") {
  const out = String(value || fallback).replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, " ").trim().slice(0, 90);
  return out || fallback;
}

export function nonEmpty(value) { return cleanText(value).trim().length > 0; }

export function isValidEmail(value) {
  const v = cleanText(value, 320).trim();
  return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isValidHttpUrl(value) {
  const v = cleanText(value, 2048).trim();
  if (!v) return true;
  try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
}

export function parseDateOnly(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!m) return null;
  const y = Number(m[1]), mon = Number(m[2]), d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mon - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mon - 1 || dt.getUTCDate() !== d) return null;
  return { y, m: mon, d, ordinal: Math.floor(dt.getTime() / 86400000) };
}

export function inclusiveDayCount(start, end) {
  const a = parseDateOnly(start), b = parseDateOnly(end);
  if (!a || !b) throw new Error("Enter valid start and end dates.");
  if (b.ordinal < a.ordinal) throw new Error("End date cannot be before start date.");
  return b.ordinal - a.ordinal + 1;
}

export function timeToMinutes(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || ""));
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function validateTimetableEntries(entries) {
  const normalized = (entries || []).map((e, i) => ({
    index: i,
    day: cleanText(e.day, 30).trim(),
    subject: cleanText(e.subject, 160).trim(),
    start: cleanText(e.start, 8).trim(),
    end: cleanText(e.end, 8).trim(),
  })).filter(e => e.day || e.subject || e.start || e.end);
  if (!normalized.length) throw new Error("Add at least one timetable entry.");
  for (const e of normalized) {
    if (!e.day || !e.subject || !e.start || !e.end) throw new Error("Each timetable entry needs a day, subject, start time and end time.");
    const s = timeToMinutes(e.start), en = timeToMinutes(e.end);
    if (s === null || en === null) throw new Error(`Enter valid 24-hour times for ${e.subject}.`);
    if (en <= s) throw new Error(`End time must be after start time for ${e.subject}.`);
    e.startMinutes = s; e.endMinutes = en;
  }
  const overlaps = [];
  for (let i = 0; i < normalized.length; i++) for (let j = i + 1; j < normalized.length; j++) {
    const a = normalized[i], b = normalized[j];
    if (a.day === b.day && Math.max(a.startMinutes, b.startMinutes) < Math.min(a.endMinutes, b.endMinutes)) overlaps.push([a, b]);
  }
  return { entries: normalized.sort((a,b)=>a.day.localeCompare(b.day)||a.startMinutes-b.startMinutes), overlaps };
}

export function documentStatistics(text, wordsPerMinute = 200) {
  const src = cleanText(text, 2_000_000);
  const words = src.match(/[\p{L}\p{N}]+(?:[’'\-][\p{L}\p{N}]+)*/gu) || [];
  const sentences = src.trim() ? (src.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) || []).filter(s => s.trim()).length : 0;
  const paragraphs = src.trim() ? src.split(/\n\s*\n/).filter(x => x.trim()).length : 0;
  const charsNoSpaces = src.replace(/\s/gu, "").length;
  const readingMinutes = words.length ? words.length / wordsPerMinute : 0;
  return { words: words.length, characters: src.length, charactersNoSpaces: charsNoSpaces, sentences, paragraphs, readingMinutes, wordsPerMinute };
}

function safeLink(href) {
  try {
    const u = new URL(href, "https://mztoolshouse.com/");
    return ["http:","https:","mailto:"].includes(u.protocol) ? href : "#";
  } catch { return "#"; }
}

function inlineMarkdown(value) {
  let s = escapeHtml(value);
  const code = [];
  s = s.replace(/`([^`]+)`/g, (_,x)=>{ code.push(x); return `\u0000CODE${code.length-1}\u0000`; });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href)=>`<a href="${escapeHtml(safeLink(href))}" rel="noopener noreferrer">${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>");
  s = s.replace(/\u0000CODE(\d+)\u0000/g, (_,i)=>`<code>${code[Number(i)]}</code>`);
  return s;
}

export function markdownToSafeHtml(markdown, { fullDocument = true } = {}) {
  const lines = cleanText(markdown, 500000).split("\n");
  const out = [];
  let inCode = false, code = [], list = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of lines) {
    if (/^```/.test(raw.trim())) {
      closeList();
      if (inCode) { out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); code=[]; inCode=false; }
      else inCode=true;
      continue;
    }
    if (inCode) { code.push(raw); continue; }
    const line = raw.trimEnd(), t = line.trim();
    if (!t) { closeList(); continue; }
    if (/^---+$/.test(t) || /^\*\*\*+$/.test(t)) { closeList(); out.push("<hr>"); continue; }
    const hm = /^(#{1,6})\s+(.+)$/.exec(t);
    if (hm) { closeList(); const level=hm[1].length; out.push(`<h${level}>${inlineMarkdown(hm[2])}</h${level}>`); continue; }
    const ul = /^[-*+]\s+(.+)$/.exec(t), ol = /^\d+[.)]\s+(.+)$/.exec(t);
    if (ul || ol) {
      const wanted = ul ? "ul" : "ol";
      if (list !== wanted) { closeList(); out.push(`<${wanted}>`); list = wanted; }
      out.push(`<li>${inlineMarkdown((ul||ol)[1])}</li>`); continue;
    }
    closeList();
    if (/^>\s?/.test(t)) { out.push(`<blockquote>${inlineMarkdown(t.replace(/^>\s?/,""))}</blockquote>`); continue; }
    out.push(`<p>${inlineMarkdown(t)}</p>`);
  }
  closeList();
  if (inCode) out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  const body = out.join("\n");
  if (!fullDocument) return body;
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Markdown document</title><style>body{font-family:Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;line-height:1.65;color:#172033}pre{white-space:pre-wrap;background:#f3f4f6;padding:14px;border-radius:10px;overflow:auto}code{font-family:ui-monospace,monospace}blockquote{border-left:4px solid #94a3b8;margin-left:0;padding-left:16px;color:#475569}img{max-width:100%}</style></head><body>${body}</body></html>`;
}

export function formatMarkdown(markdown) {
  const lines = cleanText(markdown, 500000).split("\n");
  const out=[]; let inCode=false, blank=false;
  for (const raw of lines) {
    if (/^```/.test(raw.trim())) { inCode=!inCode; out.push(raw.trimEnd()); blank=false; continue; }
    if (inCode) { out.push(raw); continue; }
    let line = raw.replace(/[ \t]+$/g, "");
    line = line.replace(/^(#{1,6})([^ #])/u, "$1 $2");
    line = line.replace(/^\s*[*+]\s+/u, "- ");
    if (!line.trim()) { if (!blank && out.length) out.push(""); blank=true; continue; }
    out.push(line); blank=false;
  }
  while (out.length && !out[out.length-1]) out.pop();
  return out.join("\n").trim();
}

export function markdownBlocks(markdown) {
  const lines = cleanText(markdown, 500000).split("\n");
  const blocks=[]; let inCode=false, code=[];
  for (const raw of lines) {
    const t=raw.trimEnd();
    if (/^```/.test(t.trim())) { if (inCode) { blocks.push({type:"code",text:code.join("\n")}); code=[]; inCode=false; } else inCode=true; continue; }
    if (inCode) { code.push(raw); continue; }
    if (!t.trim()) { blocks.push({type:"space",text:""}); continue; }
    const h=/^(#{1,6})\s+(.+)$/.exec(t.trim()); if(h){blocks.push({type:`h${h[1].length}`,text:h[2]});continue;}
    const ul=/^[-*+]\s+(.+)$/.exec(t.trim()); if(ul){blocks.push({type:"bullet",text:ul[1]});continue;}
    const ol=/^(\d+)[.)]\s+(.+)$/.exec(t.trim()); if(ol){blocks.push({type:"number",number:Number(ol[1]),text:ol[2]});continue;}
    if(/^>\s?/.test(t.trim())){blocks.push({type:"quote",text:t.trim().replace(/^>\s?/,"")});continue;}
    if(/^---+$/.test(t.trim())||/^\*\*\*+$/.test(t.trim())){blocks.push({type:"hr",text:""});continue;}
    blocks.push({type:"p",text:t.trim()});
  }
  if (inCode) blocks.push({type:"code",text:code.join("\n")});
  return blocks;
}

export function stripMarkdownInline(value) {
  return cleanText(value).replace(/!\[([^\]]*)\]\([^)]+\)/g,"$1").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/\*\*([^*]+)\*\*/g,"$1").replace(/__([^_]+)__/g,"$1").replace(/`([^`]+)`/g,"$1").replace(/[*_~]/g,"");
}

export const GENERATOR_SCHEMAS = {
  "assignment-cover-page-generator": {
    title:"Assignment Cover Page", filename:"assignment-cover", required:["university","department","course","assignment","studentName"],
    fields:[
      ["university","University"],["department","Department"],["course","Course"],["assignment","Assignment"],["topic","Topic"],["studentName","Student name"],["rollNumber","Roll number"],["semester","Semester"],["submittedTo","Submitted to"],["submissionDate","Submission date","date"]
    ]
  },
  "student-cv-builder": {
    title:"Student CV", filename:"student-cv", required:["name","title","education","skills"],
    fields:[["name","Full name"],["title","Professional title"],["email","Email","email"],["phone","Phone"],["links","Links"],["summary","Profile summary","textarea"],["education","Education (one item per line)","textarea"],["skills","Skills (one per line)","textarea"],["projects","Projects (one per line)","textarea"],["experience","Experience (one per line)","textarea"]]
  },
  "resume-builder": {
    title:"Resume", filename:"resume", required:["name","email","summary"],
    fields:[["name","Full name"],["email","Email","email"],["phone","Phone"],["links","Portfolio / LinkedIn URL","url"],["summary","Professional summary","textarea"],["skills","Skills (one per line)","textarea"],["education","Education (one per line)","textarea"],["experience","Experience (one per line)","textarea"],["projects","Projects (one per line)","textarea"],["certifications","Certifications (one per line)","textarea"],["achievements","Achievements (one per line)","textarea"]]
  },
  "cover-letter-generator": {
    title:"Cover Letter", filename:"cover-letter", required:["applicant","position","company"],
    fields:[["applicant","Applicant name"],["position","Position"],["company","Company"],["recipient","Recipient / Hiring manager"],["skills","Relevant skills","textarea"],["experience","Relevant experience (only facts you provide)","textarea"],["customMessage","Why you are applying / custom message","textarea"],["date","Date","date"]]
  },
  "application-generator": {
    title:"Formal Application", filename:"application", required:["to","subject","applicant","reason"],
    fields:[["to","To"],["subject","Subject"],["applicant","Applicant name"],["reason","Reason / request","textarea"],["date","Date","date"]]
  },
  "project-report-cover-generator": {
    title:"Project Report Cover", filename:"project-report-cover", required:["project","department","university","student"],
    fields:[["project","Project title"],["department","Department"],["university","University"],["student","Student name"],["supervisor","Supervisor"],["session","Session / year"]]
  },
  "internship-application": {
    title:"Internship Application", filename:"internship-application", required:["student","university","degree","company","position"],
    fields:[["student","Student name"],["university","University"],["degree","Degree / program"],["semester","Semester"],["company","Company"],["position","Internship position"],["skills","Skills","textarea"],["projects","Projects","textarea"],["availability","Availability"],["date","Date","date"]]
  },
  "leave-application": {
    title:"Leave Application", filename:"leave-application", required:["student","reason","fromDate","toDate"],
    fields:[["student","Student name"],["to","To / department"],["reason","Reason","textarea"],["fromDate","From date","date"],["toDate","To date","date"]]
  },
  "scholarship-application": {
    title:"Scholarship Application", filename:"scholarship-application", required:["student","program","university","statement"],
    fields:[["student","Student name"],["program","Program"],["university","University"],["semester","Semester"],["scholarship","Scholarship name"],["achievements","Academic achievements (facts you provide)","textarea"],["statement","Personal / financial statement","textarea"],["date","Date","date"]]
  }
};

function lines(value) { return cleanText(value).split("\n").map(x=>x.trim()).filter(Boolean); }
function textSection(title, value) { const vals=lines(value); return vals.length ? {title, items:vals} : null; }

export function validateGeneratorData(id, data) {
  const schema = GENERATOR_SCHEMAS[id];
  if (!schema) throw new Error("Unknown document generator.");
  for (const key of schema.required) if (!nonEmpty(data[key])) throw new Error(`${schema.fields.find(f=>f[0]===key)?.[1] || key} is required.`);
  if (data.email && !isValidEmail(data.email)) throw new Error("Enter a valid email address.");
  if (data.links && !isValidHttpUrl(data.links)) throw new Error("Enter a valid http:// or https:// link.");
  if (data.fromDate || data.toDate) inclusiveDayCount(data.fromDate, data.toDate);
  return true;
}

export function buildGeneratorModel(id, data) {
  validateGeneratorData(id, data);
  const v = Object.fromEntries(Object.entries(data).map(([k,x])=>[k,cleanText(x).trim()]));
  const schema = GENERATOR_SCHEMAS[id];
  let blocks=[];
  if (id === "assignment-cover-page-generator") {
    blocks=[{type:"title",text:v.university},{type:"subtitle",text:v.department},{type:"space"},{type:"heading",text:v.assignment},{type:"heading",text:v.topic||v.course},{type:"space"},{type:"label",label:"Course",text:v.course},{type:"label",label:"Student",text:v.studentName},{type:"label",label:"Roll number",text:v.rollNumber},{type:"label",label:"Semester",text:v.semester},{type:"label",label:"Submitted to",text:v.submittedTo},{type:"label",label:"Submission date",text:v.submissionDate}].filter(b=>b.type==="space"||b.text);
  } else if (id === "student-cv-builder" || id === "resume-builder") {
    blocks=[{type:"title",text:v.name},{type:"subtitle",text:v.title||""},{type:"contact",text:[v.email,v.phone,v.links].filter(Boolean).join(" • ")},{type:"paragraph",text:v.summary||""}].filter(b=>b.text);
    const sec = id === "student-cv-builder" ? [["Education",v.education],["Skills",v.skills],["Projects",v.projects],["Experience",v.experience]] : [["Skills",v.skills],["Experience",v.experience],["Education",v.education],["Projects",v.projects],["Certifications",v.certifications],["Achievements",v.achievements]];
    for (const [title,val] of sec) { const s=textSection(title,val); if(s){blocks.push({type:"section",text:title}); for(const item of s.items) blocks.push({type:"bullet",text:item});} }
  } else if (id === "cover-letter-generator") {
    blocks=[{type:"meta",text:v.date},{type:"heading",text:v.recipient||"Hiring Manager"},{type:"paragraph",text:v.company},{type:"space"},{type:"paragraph",text:`Subject: Application for ${v.position}`},{type:"paragraph",text:`Dear ${v.recipient||"Hiring Manager"},`},{type:"paragraph",text:`I am writing to apply for the ${v.position} position at ${v.company}.`},{type:"paragraph",text:v.customMessage},{type:"paragraph",text:v.skills?`Relevant skills: ${v.skills}`:""},{type:"paragraph",text:v.experience?`Relevant experience: ${v.experience}`:""},{type:"paragraph",text:"Sincerely,"},{type:"paragraph",text:v.applicant}].filter(b=>b.type==="space"||b.text);
  } else if (id === "application-generator") {
    blocks=[{type:"meta",text:v.date},{type:"paragraph",text:`To: ${v.to}`},{type:"paragraph",text:`Subject: ${v.subject}`},{type:"paragraph",text:"Respected Sir/Madam,"},{type:"paragraph",text:v.reason},{type:"paragraph",text:"Sincerely,"},{type:"paragraph",text:v.applicant}].filter(b=>b.text);
  } else if (id === "project-report-cover-generator") {
    blocks=[{type:"title",text:v.university},{type:"subtitle",text:v.department},{type:"space"},{type:"heading",text:v.project},{type:"paragraph",text:"Project Report"},{type:"space"},{type:"label",label:"Student",text:v.student},{type:"label",label:"Supervisor",text:v.supervisor},{type:"label",label:"Session",text:v.session}].filter(b=>b.type==="space"||b.text);
  } else if (id === "internship-application") {
    blocks=[{type:"meta",text:v.date},{type:"paragraph",text:`To: ${v.company}`},{type:"paragraph",text:`Subject: Internship Application — ${v.position}`},{type:"paragraph",text:"Dear Hiring Team,"},{type:"paragraph",text:`My name is ${v.student}. I am studying ${v.degree}${v.semester?` (${v.semester})`:""} at ${v.university}. I am applying for the ${v.position} internship.`},{type:"paragraph",text:v.skills?`Skills: ${v.skills}`:""},{type:"paragraph",text:v.projects?`Projects: ${v.projects}`:""},{type:"paragraph",text:v.availability?`Availability: ${v.availability}`:""},{type:"paragraph",text:"Sincerely,"},{type:"paragraph",text:v.student}].filter(b=>b.text);
  } else if (id === "leave-application") {
    const days=inclusiveDayCount(v.fromDate,v.toDate);
    blocks=[{type:"paragraph",text:`To: ${v.to||"Concerned Authority"}`},{type:"paragraph",text:"Subject: Leave Application"},{type:"paragraph",text:"Respected Sir/Madam,"},{type:"paragraph",text:`I request leave from ${v.fromDate} to ${v.toDate} (${days} calendar day${days===1?"":"s"}, inclusive).`},{type:"paragraph",text:`Reason: ${v.reason}`},{type:"paragraph",text:"Sincerely,"},{type:"paragraph",text:v.student}];
  } else if (id === "scholarship-application") {
    blocks=[{type:"meta",text:v.date},{type:"heading",text:v.scholarship?`Application for ${v.scholarship}`:"Scholarship Application"},{type:"paragraph",text:`Applicant: ${v.student}`},{type:"paragraph",text:`Program: ${v.program}`},{type:"paragraph",text:`University: ${v.university}`},{type:"paragraph",text:v.semester?`Semester: ${v.semester}`:""},{type:"section",text:"Academic achievements"},{type:"paragraph",text:v.achievements||"Not provided"},{type:"section",text:"Personal statement"},{type:"paragraph",text:v.statement}].filter(b=>b.text);
  }
  return { title:schema.title, filename:schema.filename, blocks };
}

export function modelToPlainText(model) {
  return model.blocks.map(b => b.type === "label" ? `${b.label}: ${b.text}` : b.text || "").join("\n").replace(/\n{3,}/g,"\n\n").trim();
}

export function modelToHtml(model) {
  const rows=model.blocks.map(b=>{
    const text=escapeHtml(b.text||"");
    if(b.type==="title")return `<h1>${text}</h1>`;
    if(b.type==="subtitle")return `<p class="subtitle">${text}</p>`;
    if(b.type==="heading")return `<h2>${text}</h2>`;
    if(b.type==="section")return `<h3>${text}</h3>`;
    if(b.type==="bullet")return `<p class="bullet">• ${text}</p>`;
    if(b.type==="label")return `<p><strong>${escapeHtml(b.label)}:</strong> ${text}</p>`;
    if(b.type==="space")return `<div class="space"></div>`;
    if(b.type==="contact")return `<p class="contact">${text}</p>`;
    if(b.type==="meta")return `<p class="meta">${text}</p>`;
    return `<p>${text}</p>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(model.title)}</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:0 auto;padding:28px;color:#172033;line-height:1.55}h1{font-size:28px;margin:0 0 8px;text-align:center}h2{font-size:21px;margin:16px 0 8px;text-align:center}h3{font-size:15px;margin:18px 0 6px;border-bottom:1px solid #cbd5e1;padding-bottom:4px}p{margin:6px 0;white-space:pre-wrap;overflow-wrap:anywhere}.subtitle,.contact,.meta{text-align:center;color:#475569}.space{height:24px}.bullet{padding-left:14px}@media print{body{padding:0;max-width:none}}</style></head><body>${rows}</body></html>`;
}
