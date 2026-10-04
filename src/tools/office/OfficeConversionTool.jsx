import { useRef, useState } from "react";
import { Download, FileText, Loader2, Presentation, Upload } from "lucide-react";
import JSZip from "jszip";
import { downloadBytes } from "../../lib/download";
import { validateOoxmlOutput } from "../../lib/files/outputValidation.js";

const DOCX_MIME="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX_MIME="application/vnd.openxmlformats-officedocument.presentationml.presentation";
const clean=(name)=>String(name||"document").replace(/\.(docx|pptx)$/i,"");

async function pptxToText(file){
  const zip=await JSZip.loadAsync(await file.arrayBuffer());
  const names=Object.keys(zip.files).filter((n)=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
  if(!names.length) throw new Error("No readable slides were found in this PPTX.");
  const slides=[];
  for(const name of names){const xml=await zip.file(name).async("text");const doc=new DOMParser().parseFromString(xml,"application/xml");const texts=[...doc.getElementsByTagNameNS("*","t")].map((n)=>n.textContent||"").filter(Boolean);slides.push(texts);}
  return slides;
}
async function docxToParagraphs(file){
  const zip=await JSZip.loadAsync(await file.arrayBuffer());
  const xml=await zip.file("word/document.xml")?.async("text"); if(!xml) throw new Error("This DOCX does not contain readable document text.");
  const doc=new DOMParser().parseFromString(xml,"application/xml");
  return [...doc.getElementsByTagNameNS("*","p")].map((p)=>[...p.getElementsByTagNameNS("*","t")].map((t)=>t.textContent||"").join("").trim()).filter(Boolean);
}

export default function OfficeConversionTool({ toolId, id }){
  toolId = toolId || id;
  const inputRef=useRef(null); const [file,setFile]=useState(null); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");
  const isPptToWord=toolId==="powerpoint-to-word";
  const accept=isPptToWord?".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation":".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const title=isPptToWord?"PowerPoint to Word":"Word to PowerPoint";
  const pick=(f)=>{setError("");setMessage("");if(!f)return;const ok=isPptToWord?/\.pptx$/i.test(f.name):/\.docx$/i.test(f.name);if(!ok){setError(`Choose a ${isPptToWord?"PPTX":"DOCX"} file.`);return;}if(f.size>40*1024*1024){setError("Choose a file smaller than 40 MB.");return;}setFile(f);};
  const run=async()=>{if(!file)return;setBusy(true);setError("");setMessage("");try{
    if(isPptToWord){const slides=await pptxToText(file);const {Document,Packer,Paragraph,HeadingLevel}=await import("docx");const children=[];slides.forEach((texts,index)=>{children.push(new Paragraph({text:`Slide ${index+1}`,heading:HeadingLevel.HEADING_1}));texts.forEach((text)=>children.push(new Paragraph(text)));});const blob=await Packer.toBlob(new Document({sections:[{children}]}));await validateOoxmlOutput(blob,DOCX_MIME);downloadBytes(new Uint8Array(await blob.arrayBuffer()),`${clean(file.name)}-slides.docx`,DOCX_MIME);setMessage(`Created an editable Word document from ${slides.length} slide${slides.length===1?"":"s"}. Text is preserved; exact slide layout is not recreated.`);
    }else{const paragraphs=await docxToParagraphs(file);const PptxGenJS=(await import("pptxgenjs")).default;const pptx=new PptxGenJS();pptx.layout="LAYOUT_WIDE";pptx.author="MZ Smart Tools House";const groups=[];for(let i=0;i<paragraphs.length;i+=7)groups.push(paragraphs.slice(i,i+7));if(!groups.length)throw new Error("No readable paragraphs were found in this DOCX.");groups.forEach((group,index)=>{const slide=pptx.addSlide();const [heading,...body]=group;slide.addText(heading||`Slide ${index+1}`,{x:.7,y:.55,w:11.9,h:.7,fontSize:28,bold:true,color:"0F172A"});slide.addText(body.join("\n")||"",{x:.8,y:1.55,w:11.7,h:4.9,fontSize:18,color:"334155",breakLine:false,fit:"shrink",bullet:body.length?{type:"ul"}:undefined});});const blob=await pptx.write({outputType:"blob"});await validateOoxmlOutput(blob,PPTX_MIME);downloadBytes(new Uint8Array(await blob.arrayBuffer()),`${clean(file.name)}-presentation.pptx`,PPTX_MIME);setMessage(`Created ${groups.length} editable slide${groups.length===1?"":"s"} from the Word document. Complex Word layout, tables and floating images are intentionally not claimed as reconstructed.`);}
  }catch(e){setError(e.message||"Conversion failed.");}finally{setBusy(false);}};
  return <div className="mz-card p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/30">{isPptToWord?<Presentation className="h-6 w-6"/>:<FileText className="h-6 w-6"/>}</span><div><h2 className="text-xl font-black">{title}</h2><p className="text-sm text-navy-500">Real browser-side OOXML conversion with honest layout limits.</p></div></div><input ref={inputRef} hidden type="file" accept={accept} onChange={(e)=>pick(e.target.files?.[0])}/><button className="mz-btn-secondary mt-5" onClick={()=>inputRef.current?.click()}><Upload className="h-4 w-4"/> {file?"Choose another file":`Choose ${isPptToWord?"PPTX":"DOCX"}`}</button>{file?<div className="mt-4 rounded-xl border border-navy-100 p-3 text-sm dark:border-navy-800"><strong>{file.name}</strong><span className="ml-2 text-navy-400">{(file.size/1024/1024).toFixed(2)} MB</span></div>:null}<button className="mz-btn-primary mt-4" disabled={!file||busy} onClick={run}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Download className="h-4 w-4"/>}{busy?"Converting…":`Convert ${title}`}</button>{error?<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}{message?<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>:null}</div>;
}
