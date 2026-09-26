import { useMemo, useRef, useState } from "react";
import { Copy, Download, FileText, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { downloadBlob, downloadBytes } from "../../lib/download";
import { trackEvent } from "../../lib/analytics";
import {
  GENERATOR_SCHEMAS,
  buildGeneratorModel,
  cleanText,
  documentStatistics,
  escapeHtml,
  formatMarkdown,
  markdownBlocks,
  markdownToSafeHtml,
  modelToHtml,
  modelToPlainText,
  safeFilename,
  stripMarkdownInline,
  validateTimetableEntries,
} from "../../lib/studentDocuments/toolkit";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOCX_LIMIT = 20 * 1024 * 1024;
const TEXT_LIMIT = 500_000;
const XML_LIMIT = 12 * 1024 * 1024;
const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

function Alert({ children }) { return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{children}</p>; }
function Notice({ children }) { return <p className="text-xs leading-5 text-navy-500 dark:text-navy-400">{children}</p>; }
function ResultBox({ children }) { return <div className="rounded-2xl border border-navy-100 bg-white/80 p-4 dark:border-navy-800 dark:bg-navy-950/30">{children}</div>; }

async function copyText(value, setStatus) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is not available in this browser.");
    await navigator.clipboard.writeText(value);
    setStatus?.("Copied to clipboard.");
    trackEvent("document_copy", { document_tool: "student_documents" });
  } catch (error) { setStatus?.(error.message || "Could not copy to clipboard."); }
}

function bytesHaveZipSignature(bytes) {
  return bytes?.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03,0x05,0x07].includes(bytes[2]);
}

async function loadDocxPackage(source) {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(await source.arrayBuffer());
  if (!bytes.length) throw new Error("The selected DOCX file is empty.");
  if (bytes.length > DOCX_LIMIT) throw new Error("This DOCX is larger than the 20 MB browser-processing limit.");
  if (!bytesHaveZipSignature(bytes)) throw new Error("This file is not a valid DOCX ZIP package.");
  const JSZip = (await import("jszip")).default;
  let zip;
  try { zip = await JSZip.loadAsync(bytes); }
  catch { throw new Error("The DOCX package is corrupted or could not be opened."); }
  const names = Object.keys(zip.files);
  if (names.length > 5000) throw new Error("This DOCX contains too many package entries to process safely in the browser.");
  if (names.some(name => /(^|\/)vbaProject\.bin$/i.test(name))) throw new Error("Macro-enabled document content is not supported by this local DOCX tool.");
  if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) throw new Error("This package is missing required DOCX document parts.");
  return { zip, bytes };
}

function xmlPartToText(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("The DOCX document XML is malformed.");
  const paragraphs = [...doc.getElementsByTagNameNS(W_NS, "p")];
  const paragraphText = (p) => {
    let out = "";
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return;
      const local = node.localName;
      if (local === "t") out += node.textContent || "";
      else if (local === "tab") out += "\t";
      else if (local === "br" || local === "cr") out += "\n";
      else [...node.childNodes].forEach(walk);
    };
    [...p.childNodes].forEach(walk);
    return out;
  };
  return paragraphs.map(paragraphText).join("\n").replace(/\n{3,}/g,"\n\n").trim();
}

async function extractDocxText(source, { includeHeaders = false } = {}) {
  const { zip } = await loadDocxPackage(source);
  const parts = ["word/document.xml"];
  if (includeHeaders) {
    parts.push(...Object.keys(zip.files).filter(name => /^word\/(header|footer)\d+\.xml$/i.test(name)).sort());
  }
  const chunks=[];
  for (const part of parts) {
    const file = zip.file(part); if (!file) continue;
    const xml = await file.async("string");
    if (xml.length > XML_LIMIT) throw new Error("The DOCX XML content is too large to process safely in this browser.");
    const text = xmlPartToText(xml);
    if (text) chunks.push(text);
  }
  return chunks.join("\n\n").trim();
}

async function validateGeneratedDocx(blob, expectedText = "") {
  const { zip } = await loadDocxPackage(blob);
  const xml = await zip.file("word/document.xml").async("string");
  if (!xml.trim()) throw new Error("Generated DOCX contains an empty document XML part.");
  const extracted = xmlPartToText(xml);
  const probe = cleanText(expectedText).trim().split(/\s+/).slice(0,4).join(" ");
  if (probe && !extracted.includes(probe)) throw new Error("Generated DOCX validation failed: expected text was not found in the document package.");
  return { extracted, size: blob.size };
}

function blockToParagraph(block, api) {
  const { Paragraph, TextRun, HeadingLevel, AlignmentType } = api;
  const text = cleanText(block.text || "");
  if (block.type === "space") return new Paragraph({ children:[new TextRun("")] });
  if (block.type === "title") return new Paragraph({ text, heading:HeadingLevel.TITLE, alignment:AlignmentType.CENTER, spacing:{after:140} });
  if (block.type === "subtitle") return new Paragraph({ text, alignment:AlignmentType.CENTER, spacing:{after:100} });
  if (block.type === "heading" || block.type === "section") return new Paragraph({ text, heading:block.type === "heading" ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2, spacing:{before:140,after:80} });
  if (block.type === "bullet") return new Paragraph({ text, bullet:{level:0}, spacing:{after:50} });
  if (block.type === "label") return new Paragraph({ children:[new TextRun({text:`${block.label}: `,bold:true}),new TextRun(text)], spacing:{after:50} });
  if (block.type === "contact" || block.type === "meta") return new Paragraph({ text, alignment:AlignmentType.CENTER, spacing:{after:70} });
  return new Paragraph({ text, spacing:{after:90} });
}

async function generateDocxFromModel(model) {
  const api = await import("docx");
  const { Document, Packer } = api;
  const children = model.blocks.map(block => blockToParagraph(block, api));
  const doc = new Document({ sections:[{ properties:{}, children }] });
  const blob = await Packer.toBlob(doc);
  await validateGeneratedDocx(blob, modelToPlainText(model));
  return blob;
}

function domRuns(node, api, style = {}) {
  const { TextRun } = api;
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ? [new TextRun({text:node.nodeValue, ...style})] : [];
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const tag = node.tagName.toLowerCase();
  const next = { ...style };
  if (["strong","b"].includes(tag)) next.bold = true;
  if (["em","i"].includes(tag)) next.italics = true;
  if (tag === "code") next.font = "Courier New";
  if (tag === "br") return [new TextRun({text:"\n", break:1, ...next})];
  return [...node.childNodes].flatMap(child => domRuns(child, api, next));
}

async function generateDocxFromHtml(htmlText) {
  const parsed = new DOMParser().parseFromString(cleanText(htmlText, TEXT_LIMIT), "text/html");
  parsed.querySelectorAll("script,style,noscript,iframe,object,embed,meta,link").forEach(el => el.remove());
  const api = await import("docx");
  const { Document, Packer, Paragraph, HeadingLevel } = api;
  const children=[];
  const blocks = [...parsed.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,pre,blockquote")];
  for (const el of blocks) {
    const tag=el.tagName.toLowerCase();
    const opts={ children:domRuns(el,api), spacing:{after:80} };
    if (tag === "h1") opts.heading=HeadingLevel.HEADING_1;
    else if (tag === "h2") opts.heading=HeadingLevel.HEADING_2;
    else if (/^h[3-6]$/.test(tag)) opts.heading=HeadingLevel.HEADING_3;
    else if (tag === "li") opts.bullet={level:0};
    children.push(new Paragraph(opts));
  }
  if (!children.length) children.push(new Paragraph(parsed.body.textContent || ""));
  const doc=new Document({sections:[{children}]});
  const blob=await Packer.toBlob(doc);
  await validateGeneratedDocx(blob, parsed.body.textContent || "");
  return blob;
}

async function generateDocxFromText(text) {
  const api=await import("docx");
  const {Document,Packer,Paragraph}=api;
  const paragraphs=cleanText(text,TEXT_LIMIT).split("\n").map(line=>new Paragraph({text:line||" ",spacing:{after:60}}));
  const blob=await Packer.toBlob(new Document({sections:[{children:paragraphs}]}));
  await validateGeneratedDocx(blob,text);
  return blob;
}

function assertPdfTextSupported(text, font) {
  try { font.encodeText(String(text || "").replace(/[\r\n\t]/g, " ")); }
  catch { throw new Error("This browser PDF generator cannot safely embed one or more characters with its current built-in font. Use TXT to DOCX for full Unicode text instead of losing characters."); }
}

async function createPdfFromBlocks(blocks) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc=await PDFDocument.create();
  const regular=await doc.embedFont(StandardFonts.Helvetica);
  const bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const italic=await doc.embedFont(StandardFonts.HelveticaOblique);
  const mono=await doc.embedFont(StandardFonts.Courier);
  const W=595.28,H=841.89,M=50;
  let page=doc.addPage([W,H]),y=H-M;
  const newPage=()=>{page=doc.addPage([W,H]);y=H-M;};
  const ensure=(height)=>{if(y-height<M)newPage();};
  const wrap=(text,font,size,width)=>{
    const words=String(text).replace(/\s+/g," ").trim().split(" ").filter(Boolean); if(!words.length)return [""];
    const lines=[]; let line="";
    for(const word of words){const c=line?`${line} ${word}`:word;if(font.widthOfTextAtSize(c,size)<=width||!line)line=c;else{lines.push(line);line=word;}}
    if(line)lines.push(line); return lines;
  };
  const draw=(text,{font=regular,size=11,indent=0,color=rgb(.08,.12,.2),before=0,after=6,prefix=""}={})=>{
    y-=before;const usable=W-M*2-indent;const lines=wrap(`${prefix}${text}`,font,size,usable);const lh=size*1.45;
    for(const line of lines){ensure(lh);page.drawText(line||" ",{x:M+indent,y,size,font,color,maxWidth:usable});y-=lh;}y-=after;
  };
  for(const block of blocks){
    const raw=stripMarkdownInline(block.text||""); assertPdfTextSupported(raw, block.type==="code" ? mono : regular);
    if(block.type==="space"){y-=8;continue;}
    if(block.type==="hr"){ensure(12);page.drawLine({start:{x:M,y},end:{x:W-M,y},thickness:1,color:rgb(.75,.78,.82)});y-=12;continue;}
    if(block.type==="h1") draw(raw,{font:bold,size:22,before:6,after:10});
    else if(block.type==="h2") draw(raw,{font:bold,size:18,before:5,after:8});
    else if(["h3","h4","h5","h6"].includes(block.type)) draw(raw,{font:bold,size:14,before:4,after:6});
    else if(block.type==="bullet") draw(raw,{indent:12,prefix:"• ",after:3});
    else if(block.type==="number") draw(raw,{indent:12,prefix:`${block.number}. `,after:3});
    else if(block.type==="quote") draw(raw,{font:italic,indent:14,color:rgb(.27,.33,.42)});
    else if(block.type==="code"){for(const line of raw.split("\n")){assertPdfTextSupported(line, mono);draw(line||" ",{font:mono,size:9,indent:10,after:1});}y-=4;}
    else {
      let font=regular,txt=raw;
      if(/^\*\*.*\*\*$/.test(block.text||"")){font=bold;txt=stripMarkdownInline(block.text);}
      else if(/^\*.*\*$/.test(block.text||"")){font=italic;txt=stripMarkdownInline(block.text);}
      draw(txt,{font});
    }
  }
  const bytes=await doc.save({useObjectStreams:true});
  return bytes;
}

async function validateGeneratedPdf(bytes, expectedText) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 20 || String.fromCharCode(...bytes.slice(0,4)) !== "%PDF") throw new Error("Generated PDF failed its file signature validation.");
  const { PDFDocument }=await import("pdf-lib");
  const parsed=await PDFDocument.load(bytes.slice(),{ignoreEncryption:false});
  if(parsed.getPageCount()<1)throw new Error("Generated PDF has no pages.");
  const { getDocument }=await import("pdfjs-dist");
  const pdf=await getDocument({data:bytes.slice()}).promise;
  let text="";
  for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();text+=` ${c.items.map(x=>x.str).join(" ")}`;p.cleanup?.();}
  pdf.destroy?.();
  const probe=cleanText(expectedText).replace(/\s+/g," ").trim().split(" ").slice(0,3).join(" ");
  if(probe&&!text.replace(/\s+/g," ").includes(probe))throw new Error("Generated PDF validation failed because expected text could not be extracted.");
  return {pages:parsed.getPageCount(),text:text.trim()};
}

function modelFromTimetable(entries) {
  return {title:"Study Timetable",filename:"study-timetable",blocks:[{type:"title",text:"Study Timetable"},...entries.flatMap(e=>[{type:"section",text:e.day},{type:"paragraph",text:`${e.start}–${e.end}  ${e.subject}`}]) ]};
}

function GeneratorTool({id}) {
  const schema=GENERATOR_SCHEMAS[id];
  const [data,setData]=useState(()=>Object.fromEntries(schema.fields.map(([key])=>[key,""])));
  const [model,setModel]=useState(null),[error,setError]=useState(""),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
  const previewRef=useRef(null);
  const html=useMemo(()=>model?modelToHtml(model):"",[model]);
  const update=(key,value)=>setData(prev=>({...prev,[key]:value}));
  const build=()=>{setError("");setStatus("");try{const m=buildGeneratorModel(id,data);setModel(m);setStatus("Preview generated from your entered information.");trackEvent("student_document_generate",{tool_id:id,format:"preview"});}catch(e){setModel(null);setError(e.message||"Please check the document fields.");trackEvent("student_document_validation_error",{tool_id:id});}};
  const downloadHtml=async()=>{if(!model)return;const value=modelToHtml(model);if(!/^<!doctype html>/i.test(value)||/<script\b/i.test(value))return setError("Generated HTML failed safety validation.");await downloadBlob(new Blob([value],{type:"text/html;charset=utf-8"}),`${safeFilename(model.filename)}.html`);trackEvent("student_document_download",{tool_id:id,format:"html"});};
  const downloadDocx=async()=>{if(!model)return;setBusy(true);setError("");try{const blob=await generateDocxFromModel(model);await downloadBlob(blob,`${safeFilename(model.filename)}.docx`);trackEvent("student_document_download",{tool_id:id,format:"docx"});setStatus("DOCX generated, structurally validated, and prepared for download.");}catch(e){setError(e.message||"Could not generate the DOCX.");}finally{setBusy(false)}};
  const print=()=>{if(!model)return;try{previewRef.current?.contentWindow?.focus();previewRef.current?.contentWindow?.print();trackEvent("student_document_print",{tool_id:id});}catch{setError("Print preview could not be opened in this browser.");}};
  const reset=()=>{setData(Object.fromEntries(schema.fields.map(([key])=>[key,""])));setModel(null);setError("");setStatus("");};
  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2">{schema.fields.map(([key,label,type="text"])=>
      <label key={key} className={`text-sm font-semibold text-navy-800 dark:text-navy-100 ${type==="textarea"?"md:col-span-2":""}`}>{label}{type==="textarea"?<textarea className="mz-input mt-2 min-h-28" value={data[key]} onChange={e=>update(key,e.target.value)} maxLength={8000}/>:<input className="mz-input mt-2" type={type} value={data[key]} onChange={e=>update(key,e.target.value)} maxLength={type==="email"||type==="url"?320:300}/>}</label>
    )}</div>
    <div className="flex flex-wrap gap-2"><button className="mz-btn-primary" type="button" onClick={build}><FileText className="h-4 w-4"/>Generate preview</button><button className="mz-btn-ghost" type="button" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset</button></div>
    {error&&<Alert>{error}</Alert>}{status&&<p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{status}</p>}
    {model&&<><ResultBox><iframe ref={previewRef} title={`${schema.title} preview`} sandbox="allow-same-origin" srcDoc={html} className="h-[520px] w-full rounded-xl bg-white"/></ResultBox><div className="flex flex-wrap gap-2"><button className="mz-btn-primary" onClick={downloadDocx} disabled={busy}><Download className="h-4 w-4"/>{busy?"Validating DOCX…":"Download DOCX"}</button><button className="mz-btn-secondary" onClick={downloadHtml}><Download className="h-4 w-4"/>Download HTML</button><button className="mz-btn-secondary" onClick={print}><Printer className="h-4 w-4"/>Print / Save PDF</button></div></>}
    <Notice>Document content is generated only from the information you enter. No achievements, institutions, signatures, logos or personal claims are invented. DOCX export is validated as an Office Open XML package before download.</Notice>
  </div>;
}

function TimetableTool() {
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const blank=()=>({id:crypto.randomUUID(),day:"Monday",subject:"",start:"09:00",end:"10:00"});
  const [rows,setRows]=useState([blank()]),[model,setModel]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[status,setStatus]=useState("");const previewRef=useRef(null);
  const html=useMemo(()=>model?modelToHtml(model):"",[model]);
  const update=(id,key,val)=>setRows(rs=>rs.map(r=>r.id===id?{...r,[key]:val}:r));
  const build=()=>{setError("");setStatus("");try{const {entries,overlaps}=validateTimetableEntries(rows);if(overlaps.length){const [a,b]=overlaps[0];throw new Error(`${a.subject} overlaps with ${b.subject} on ${a.day}. Adjust the times before generating the timetable.`);}const m=modelFromTimetable(entries);setModel(m);setStatus("Timetable generated from the validated entries.");}catch(e){setModel(null);setError(e.message||"Could not build the timetable.");}};
  const docx=async()=>{if(!model)return;setBusy(true);setError("");try{const blob=await generateDocxFromModel(model);await downloadBlob(blob,"study-timetable.docx");setStatus("DOCX generated and validated.");}catch(e){setError(e.message||"Could not generate DOCX.");}finally{setBusy(false)}};
  return <div className="space-y-5"><div className="space-y-3">{rows.map((r,i)=><div key={r.id} className="grid gap-3 rounded-2xl border border-navy-100 p-3 dark:border-navy-800 sm:grid-cols-[1fr_1.4fr_1fr_1fr_auto]"><label className="text-xs font-semibold">Day<select className="mz-input mt-1" value={r.day} onChange={e=>update(r.id,"day",e.target.value)}>{days.map(d=><option key={d}>{d}</option>)}</select></label><label className="text-xs font-semibold">Subject<input className="mz-input mt-1" value={r.subject} onChange={e=>update(r.id,"subject",e.target.value)} maxLength={160}/></label><label className="text-xs font-semibold">Start<input className="mz-input mt-1" type="time" value={r.start} onChange={e=>update(r.id,"start",e.target.value)}/></label><label className="text-xs font-semibold">End<input className="mz-input mt-1" type="time" value={r.end} onChange={e=>update(r.id,"end",e.target.value)}/></label><button className="mz-btn-ghost self-end" aria-label={`Remove timetable row ${i+1}`} onClick={()=>setRows(rs=>rs.length>1?rs.filter(x=>x.id!==r.id):rs)} disabled={rows.length===1}><Trash2 className="h-4 w-4"/></button></div>)}</div><div className="flex flex-wrap gap-2"><button className="mz-btn-secondary" onClick={()=>setRows(rs=>[...rs,blank()])}><Plus className="h-4 w-4"/>Add entry</button><button className="mz-btn-primary" onClick={build}>Generate timetable</button><button className="mz-btn-ghost" onClick={()=>{setRows([blank()]);setModel(null);setError("");setStatus("")}}><RotateCcw className="h-4 w-4"/>Reset</button></div>{error&&<Alert>{error}</Alert>}{status&&<p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{status}</p>}{model&&<><ResultBox><iframe ref={previewRef} title="Study timetable preview" sandbox="allow-same-origin" srcDoc={html} className="h-[460px] w-full rounded-xl bg-white"/></ResultBox><div className="flex flex-wrap gap-2"><button className="mz-btn-primary" onClick={docx} disabled={busy}><Download className="h-4 w-4"/>{busy?"Validating DOCX…":"Download DOCX"}</button><button className="mz-btn-secondary" onClick={()=>previewRef.current?.contentWindow?.print()}><Printer className="h-4 w-4"/>Print / Save PDF</button></div></>}<Notice>Times use 24-hour values internally. Overlapping entries on the same day are rejected instead of silently overwriting each other.</Notice></div>;
}

function PdfTool({id}) {
  const isWord=id==="word-to-pdf", isMarkdown=id==="markdown-to-pdf";
  const [text,setText]=useState(""),[file,setFile]=useState(null),[error,setError]=useState(""),[status,setStatus]=useState(""),[busy,setBusy]=useState(false),[preview,setPreview]=useState("");
  const run=async()=>{setBusy(true);setError("");setStatus("");try{let source=cleanText(text,TEXT_LIMIT);if(isWord){if(!file)throw new Error("Choose a DOCX file.");source=await extractDocxText(file);if(!source)throw new Error("No readable body text was found in this DOCX.");}if(!source.trim())throw new Error("Enter text to create a PDF.");const blocks=isMarkdown?markdownBlocks(source):source.split("\n").map(line=>({type:line.trim()?"p":"space",text:line}));const bytes=await createPdfFromBlocks(blocks);const validation=await validateGeneratedPdf(bytes,stripMarkdownInline(source));const filename=isWord?`${safeFilename(file.name.replace(/\.docx$/i,""))}.pdf`:isMarkdown?"markdown-document.pdf":"text-document.pdf";await downloadBytes(bytes,filename,"application/pdf");setPreview(source);setStatus(`Validated ${validation.pages} PDF page${validation.pages===1?"":"s"} and prepared the file for download.`);trackEvent("student_document_download",{tool_id:id,format:"pdf"});}catch(e){setError(e.message||"Could not create the PDF.");}finally{setBusy(false)}};
  return <div className="space-y-5">{isWord?<label className="block text-sm font-semibold">DOCX file<input className="mz-input mt-2" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>{setFile(e.target.files?.[0]||null);setError("");setStatus("")}}/></label>:<label className="block text-sm font-semibold">{isMarkdown?"Markdown":"Text"}<textarea className="mz-input mt-2 min-h-64" value={text} onChange={e=>setText(e.target.value)} maxLength={TEXT_LIMIT} placeholder={isMarkdown?"# Heading\n\nWrite Markdown here...":"Type or paste text here..."}/></label>}<div className="flex flex-wrap gap-2"><button className="mz-btn-primary" onClick={run} disabled={busy||(isWord?!file:!text.trim())}><Download className="h-4 w-4"/>{busy?"Creating & validating…":"Create validated PDF"}</button><button className="mz-btn-ghost" onClick={()=>{setText("");setFile(null);setError("");setStatus("");setPreview("")}}><RotateCcw className="h-4 w-4"/>Reset</button></div>{error&&<Alert>{error}</Alert>}{status&&<p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{status}</p>}{preview&&<ResultBox><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-sm">{preview}</pre></ResultBox>}<Notice>{isWord?"This is a text-focused DOCX → PDF conversion. It extracts readable DOCX body text locally and does not claim Microsoft Word layout fidelity.":isMarkdown?"The PDF renderer supports headings, lists, quotes, code blocks and horizontal rules. Complex Markdown tables and arbitrary raw HTML are not claimed as supported.":"PDF output is parsed again and its extracted text is checked before download."} The current built-in PDF font is Latin-focused; unsupported Unicode is rejected rather than silently corrupted.</Notice></div>;
}

function DocxTool({id}) {
  const fileMode=id==="docx-viewer"||id==="docx-text-extractor";
  const [text,setText]=useState(""),[file,setFile]=useState(null),[out,setOut]=useState(""),[error,setError]=useState(""),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
  const run=async()=>{setBusy(true);setError("");setStatus("");setOut("");try{
    if(fileMode){if(!file)throw new Error("Choose a DOCX file.");const extracted=await extractDocxText(file,{includeHeaders:false});if(!extracted)throw new Error("The DOCX contains no readable body text.");setOut(extracted);if(id==="docx-text-extractor"){await downloadBlob(new Blob([extracted],{type:"text/plain;charset=utf-8"}),`${safeFilename(file.name.replace(/\.docx$/i,""))}-text.txt`);setStatus("Text extracted and prepared for download.");}else setStatus("DOCX body text extracted locally. This viewer does not claim full Word layout rendering.");
    } else if(id==="txt-to-docx"){if(!text.trim())throw new Error("Enter text to create a DOCX.");const blob=await generateDocxFromText(text);await downloadBlob(blob,"text-document.docx");setOut("A real DOCX package was generated and structurally validated before download.");setStatus("DOCX ready.");
    } else if(id==="html-to-docx"){if(!text.trim())throw new Error("Enter HTML to create a DOCX.");const blob=await generateDocxFromHtml(text);await downloadBlob(blob,"html-document.docx");setOut("HTML was parsed as inert document content, converted to DOCX, and structurally validated.");setStatus("DOCX ready.");
    } else if(id==="markdown-to-html"){if(!text.trim())throw new Error("Enter Markdown to convert.");const html=markdownToSafeHtml(text);if(/<script\b/i.test(html))throw new Error("Generated HTML failed the script-safety check.");setOut(html);await downloadBlob(new Blob([html],{type:"text/html;charset=utf-8"}),"markdown-document.html");setStatus("Safe HTML generated and prepared for download.");
    } else if(id==="markdown-formatter"){if(!text.trim())throw new Error("Enter Markdown to format.");const formatted=formatMarkdown(text);setOut(formatted);setStatus("Markdown whitespace and heading/list spacing normalized without executing content.");
    } else if(id==="document-statistics"){const stats=documentStatistics(text);setOut(`Words: ${stats.words}\nCharacters (including spaces): ${stats.characters}\nCharacters (excluding whitespace): ${stats.charactersNoSpaces}\nSentences: ${stats.sentences}\nParagraphs: ${stats.paragraphs}\nReading time: ${stats.readingMinutes===0?"0":stats.readingMinutes<1?"< 1":Math.ceil(stats.readingMinutes)} min\nReading speed assumption: ${stats.wordsPerMinute} words/min`);setStatus("Statistics calculated from the current text.");}
    trackEvent("student_document_process",{tool_id:id});
  }catch(e){setError(e.message||"Could not process the document.");trackEvent("student_document_validation_error",{tool_id:id});}finally{setBusy(false)}};
  const reset=()=>{setText("");setFile(null);setOut("");setError("");setStatus("");};
  return <div className="space-y-5">{fileMode?<label className="block text-sm font-semibold">DOCX file<input className="mz-input mt-2" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>{setFile(e.target.files?.[0]||null);setError("");setStatus("")}}/></label>:<label className="block text-sm font-semibold">{id.includes("markdown")?"Markdown":id==="html-to-docx"?"HTML":"Text"}<textarea className="mz-input mt-2 min-h-64" value={text} onChange={e=>setText(e.target.value)} maxLength={id==="document-statistics"?2_000_000:TEXT_LIMIT} placeholder="Type or paste document content..."/></label>}<div className="flex flex-wrap gap-2"><button className="mz-btn-primary" onClick={run} disabled={busy||(fileMode?!file:!text.trim()&&id!=="document-statistics")}>{busy?"Processing…":"Run"}</button><button className="mz-btn-ghost" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset</button>{out&&<button className="mz-btn-secondary" onClick={()=>copyText(out,setStatus)}><Copy className="h-4 w-4"/>Copy result</button>}{out&&["markdown-formatter","document-statistics"].includes(id)&&<button className="mz-btn-secondary" onClick={()=>downloadBlob(new Blob([out],{type:"text/plain;charset=utf-8"}),id==="markdown-formatter"?"formatted-markdown.md":"document-statistics.txt")}><Download className="h-4 w-4"/>Download</button>}</div>{error&&<Alert>{error}</Alert>}{status&&<p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{status}</p>}<ResultBox><pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-sm">{out||"Result will appear here."}</pre></ResultBox><Notice>{fileMode?"DOCX parsing validates the ZIP package and required OOXML parts before extracting body text. Full Word layout, images and advanced styling are not represented by this text-focused viewer/extractor.":id==="html-to-docx"?"HTML is parsed as inert content; script/style/embed elements are discarded and never executed. Supported document structure includes headings, paragraphs, basic emphasis and lists.":id==="markdown-to-html"?"Raw HTML inside Markdown is escaped. Generated links are restricted to safe http, https or mailto schemes.":id==="document-statistics"?"Reading time uses a documented 200 words/minute assumption.":"Processing runs locally in the browser."}</Notice></div>;
}

const GENERATOR_IDS=new Set(Object.keys(GENERATOR_SCHEMAS));
const PDF_IDS=new Set(["text-to-pdf","markdown-to-pdf","word-to-pdf"]);
const DOC_IDS=new Set(["docx-viewer","docx-text-extractor","txt-to-docx","html-to-docx","markdown-to-html","markdown-formatter","document-statistics"]);

export default function StudentDocumentTool({id}) {
  if (GENERATOR_IDS.has(id)) return <GeneratorTool id={id}/>;
  if (id === "study-timetable-generator") return <TimetableTool/>;
  if (PDF_IDS.has(id)) return <PdfTool id={id}/>;
  if (DOC_IDS.has(id)) return <DocxTool id={id}/>;
  throw new Error(`No Student Document Tools implementation registered for ${id || "unknown"}.`);
}
