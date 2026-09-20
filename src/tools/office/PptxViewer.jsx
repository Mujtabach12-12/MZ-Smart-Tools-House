import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Maximize2, Minus, Plus, Printer, Upload, X } from "lucide-react";
import { downloadBlob, downloadBytes } from "../../lib/download";

const MAX_BYTES = 80 * 1024 * 1024;
const DEFAULT_W = 12192000;
const DEFAULT_H = 6858000;
const relNs = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function localName(node) { return node?.localName || String(node?.nodeName || "").split(":").pop(); }
function descendants(node, name) { return [...(node?.getElementsByTagNameNS?.("*", name) || [])]; }
function first(node, name) { return descendants(node, name)[0] || null; }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function normalizeTarget(base, target) {
  const parts = `${base}/${target}`.split("/"); const out=[];
  for (const part of parts) { if (!part || part === ".") continue; if (part === "..") out.pop(); else out.push(part); }
  return out.join("/");
}
function transformFrom(node) {
  const xfrm = first(node, "xfrm"); if (!xfrm) return null;
  const off = first(xfrm, "off"), ext = first(xfrm, "ext");
  if (!off || !ext) return null;
  return { x:num(off.getAttribute("x")), y:num(off.getAttribute("y")), w:num(ext.getAttribute("cx")), h:num(ext.getAttribute("cy")) };
}
function colorFrom(node) {
  const hex = first(node, "srgbClr")?.getAttribute("val"); return /^[0-9a-f]{6}$/i.test(hex || "") ? `#${hex}` : "#0f172a";
}
function textObject(shape) {
  const text = descendants(shape, "t").map((node) => node.textContent || "").join(" ").replace(/\s+/g," ").trim();
  if (!text) return null;
  const box = transformFrom(shape); if (!box) return null;
  const rPr = first(shape,"rPr") || first(shape,"defRPr");
  const fontSize = Math.max(10, Math.min(54, num(rPr?.getAttribute("sz"), 1800) / 100));
  const bold = rPr?.getAttribute("b") === "1";
  const italic = rPr?.getAttribute("i") === "1";
  const algn = first(shape,"pPr")?.getAttribute("algn") || "l";
  return { type:"text", text, ...box, fontSize, bold, italic, align:algn === "ctr" ? "center" : algn === "r" ? "right" : "left", color:colorFrom(shape) };
}
async function parsePresentation(file) {
  const { default:JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const presentationXml = await zip.file("ppt/presentation.xml")?.async("string");
  if (!presentationXml) throw new Error("This file does not contain a readable PowerPoint presentation.");
  const parser = new DOMParser();
  const presentation = parser.parseFromString(presentationXml,"application/xml");
  const sizeNode = first(presentation,"sldSz");
  const size = { w:num(sizeNode?.getAttribute("cx"),DEFAULT_W), h:num(sizeNode?.getAttribute("cy"),DEFAULT_H) };
  const slidePaths = Object.keys(zip.files).filter((name)=>/^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a,b)=>num(a.match(/slide(\d+)/)?.[1])-num(b.match(/slide(\d+)/)?.[1]));
  if (!slidePaths.length) throw new Error("No slides were found in this presentation.");
  const urls=[];
  const slides=[];
  for (const slidePath of slidePaths) {
    const xml = await zip.file(slidePath).async("string");
    const doc = parser.parseFromString(xml,"application/xml");
    const n = slidePath.match(/slide(\d+)/)?.[1];
    const relPath = `ppt/slides/_rels/slide${n}.xml.rels`;
    const relXml = await zip.file(relPath)?.async("string");
    const rels = new Map();
    if (relXml) {
      const relDoc=parser.parseFromString(relXml,"application/xml");
      descendants(relDoc,"Relationship").forEach((rel)=>rels.set(rel.getAttribute("Id"),rel.getAttribute("Target")));
    }
    const objects=[];
    descendants(doc,"sp").forEach((shape)=>{const obj=textObject(shape);if(obj)objects.push(obj)});
    for (const pic of descendants(doc,"pic")) {
      const box=transformFrom(pic); const blip=first(pic,"blip"); const id=blip?.getAttributeNS(relNs,"embed") || blip?.getAttribute("r:embed"); const target=rels.get(id);
      if (!box || !target) continue;
      const mediaPath=normalizeTarget("ppt/slides",target); const media=zip.file(mediaPath); if (!media) continue;
      const blob=await media.async("blob"); const url=URL.createObjectURL(blob); urls.push(url); objects.push({type:"image",...box,url,mime:blob.type || (/\.png$/i.test(mediaPath)?"image/png":"image/jpeg")});
    }
    const bgHex = first(first(doc,"bg"),"srgbClr")?.getAttribute("val");
    slides.push({ objects, background:/^[0-9a-f]{6}$/i.test(bgHex||"")?`#${bgHex}`:"#ffffff" });
  }
  return { slides, size, urls };
}

function SlideView({ slide, size, compact=false }) {
  const ratio=size.h/size.w;
  return <div className="relative w-full overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm dark:border-navy-700" style={{aspectRatio:`${size.w}/${size.h}`,background:slide.background}}>{slide.objects.map((obj,index)=>{const style={position:"absolute",left:`${obj.x/size.w*100}%`,top:`${obj.y/size.h*100}%`,width:`${obj.w/size.w*100}%`,height:`${obj.h/size.h*100}%`};if(obj.type==="image")return <img key={index} src={obj.url} alt="Slide visual" style={{...style,objectFit:"contain"}}/>;return <div key={index} style={{...style,fontSize:compact?`${Math.max(5,obj.fontSize*.2)}px`:`clamp(8px, ${obj.fontSize/9}vw, ${obj.fontSize}px)`,fontWeight:obj.bold?700:400,fontStyle:obj.italic?"italic":"normal",textAlign:obj.align,color:obj.color,overflow:"hidden",whiteSpace:"pre-wrap",lineHeight:1.18}}>{obj.text}</div>})}</div>;
}

export default function PptxViewer(){
  const inputRef=useRef(null); const [file,setFile]=useState(null),[slides,setSlides]=useState([]),[size,setSize]=useState({w:DEFAULT_W,h:DEFAULT_H}),[active,setActive]=useState(0),[zoom,setZoom]=useState(100),[urls,setUrls]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  useEffect(()=>()=>urls.forEach(URL.revokeObjectURL),[urls]);
  async function open(next){if(!next)return;setError("");setMessage("");if(!/\.pptx$/i.test(next.name)){setError("Choose a .pptx presentation. Legacy .ppt files are not supported by this browser viewer.");return}if(next.size>MAX_BYTES){setError("Choose a PPTX smaller than 80 MB for this browser viewer.");return}setBusy(true);try{urls.forEach(URL.revokeObjectURL);const parsed=await parsePresentation(next);setFile(next);setSlides(parsed.slides);setSize(parsed.size);setUrls(parsed.urls);setActive(0);setMessage(`Opened ${parsed.slides.length} slide${parsed.slides.length===1?"":"s"}. This compatibility viewer renders slide text and embedded images; advanced animations, SmartArt and some theme effects may not match PowerPoint exactly.`);}catch(e){setError(e.message||"The presentation could not be opened.")}finally{setBusy(false)}}
  function download(){if(!file)return;downloadBlob(file,file.name)}
  async function exportPdf(){if(!slides.length)return;setBusy(true);setError("");try{const{PDFDocument,StandardFonts,rgb}=await import("pdf-lib");const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);const pageW=960,pageH=pageW*(size.h/size.w);for(const slide of slides){const page=doc.addPage([pageW,pageH]);const bg=slide.background.replace("#","");page.drawRectangle({x:0,y:0,width:pageW,height:pageH,color:rgb(parseInt(bg.slice(0,2),16)/255,parseInt(bg.slice(2,4),16)/255,parseInt(bg.slice(4,6),16)/255)});for(const obj of slide.objects){const x=obj.x/size.w*pageW,w=obj.w/size.w*pageW,h=obj.h/size.h*pageH,y=pageH-(obj.y/size.h*pageH)-h;if(obj.type==="image"){try{const blob=await fetch(obj.url).then(r=>r.blob()),bytes=new Uint8Array(await blob.arrayBuffer());const img=obj.mime.includes("png")?await doc.embedPng(bytes):await doc.embedJpg(bytes);page.drawImage(img,{x,y,width:w,height:h})}catch{}}else{const hex=obj.color.replace("#","");const color=/^[0-9a-f]{6}$/i.test(hex)?rgb(parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255):rgb(.06,.09,.16);page.drawText(obj.text,{x,y:Math.max(4,y+h-Math.min(36,obj.fontSize)),size:Math.max(8,Math.min(28,obj.fontSize)),font:obj.bold?bold:font,color,maxWidth:w,lineHeight:Math.max(10,Math.min(34,obj.fontSize*1.2))})}}}const bytes=await doc.save({useObjectStreams:true});const verify=await PDFDocument.load(bytes);if(verify.getPageCount()!==slides.length)throw new Error("PDF validation failed before download.");downloadBytes(bytes,`${file.name.replace(/\.pptx$/i,"")}.pdf`,"application/pdf");setMessage(`Created a validated ${slides.length}-page compatibility PDF from the rendered text/images.`);}catch(e){setError(e.message||"PDF export failed.")}finally{setBusy(false)}}
  const slide=slides[active]; const count=slides.length;
  return <div className="space-y-4">{!count?<section className="mz-card p-8 text-center"><Upload className="mx-auto h-10 w-10 text-brand-600"/><h2 className="mt-4 text-xl font-extrabold">Open a PowerPoint presentation</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-navy-500">Upload a real PPTX file to inspect slide text and embedded images locally. The compatibility viewer does not pretend to reproduce unsupported animations, SmartArt or every Office theme effect.</p><button className="mz-btn-primary mt-5" disabled={busy} onClick={()=>inputRef.current?.click()}>{busy?"Opening…":"Choose PPTX"}</button><input ref={inputRef} hidden type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(e)=>open(e.target.files?.[0])}/></section>:<><div className="flex flex-wrap items-center gap-2 rounded-2xl border border-navy-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-900"><strong className="mr-auto truncate">{file?.name}</strong><button className="mz-btn-secondary" onClick={()=>window.print()}><Printer className="h-4 w-4"/> Print</button><button className="mz-btn-secondary" disabled={busy} onClick={exportPdf}>Export PDF</button><button className="mz-btn-primary" onClick={download}><Download className="h-4 w-4"/> Original PPTX</button><button className="mz-btn-ghost" onClick={()=>{urls.forEach(URL.revokeObjectURL);setUrls([]);setSlides([]);setFile(null)}} aria-label="Close presentation"><X className="h-4 w-4"/></button></div><div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)]"><aside className="rounded-2xl border border-navy-100 bg-white p-2 dark:border-navy-800 dark:bg-navy-900"><div className="max-h-[650px] space-y-2 overflow-auto">{slides.map((item,index)=><button key={index} className={`w-full rounded-xl border p-2 ${active===index?"border-brand-500 bg-brand-50 dark:bg-brand-950/30":"border-navy-100 dark:border-navy-800"}`} onClick={()=>setActive(index)}><SlideView slide={item} size={size} compact/><span className="mt-1 block text-xs font-semibold">Slide {index+1}</span></button>)}</div></aside><main className="min-w-0"><div className="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-navy-100 bg-white p-2 dark:border-navy-800 dark:bg-navy-900"><button className="mz-btn-ghost" disabled={active===0} onClick={()=>setActive(i=>Math.max(0,i-1))}>Previous</button><span className="text-sm font-bold">{active+1} / {count}</span><button className="mz-btn-ghost" disabled={active===count-1} onClick={()=>setActive(i=>Math.min(count-1,i+1))}>Next</button><button className="mz-btn-ghost" onClick={()=>setZoom(z=>Math.max(60,z-10))}><Minus className="h-4 w-4"/></button><span className="min-w-14 text-center text-xs font-bold">{zoom}%</span><button className="mz-btn-ghost" onClick={()=>setZoom(z=>Math.min(180,z+10))}><Plus className="h-4 w-4"/></button><button className="mz-btn-ghost" onClick={()=>document.fullscreenElement?document.exitFullscreen():document.getElementById("mz-pptx-stage")?.requestFullscreen?.()}><Maximize2 className="h-4 w-4"/> Fullscreen</button></div><div id="mz-pptx-stage" className="overflow-auto rounded-2xl bg-slate-200 p-4 dark:bg-navy-950"><div className="mx-auto origin-top" style={{width:`${zoom}%`,maxWidth:zoom<=100?"100%":"none"}}>{slide?<SlideView slide={slide} size={size}/>:null}</div></div></main></div></>}{message?<div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{message}</div>:null}{error?<div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</div>:null}</div>;
}
