import { useRef, useState } from "react";
import { Copy, Loader2, Square } from "lucide-react";
import { createOutputArtifact, validateOoxmlOutput } from "../../lib/files/outputValidation.js";
import { inspectPdfFile, buildValidatedPdfArtifact, stripPdfExtension } from "../../lib/pdf/toolkit.js";
import { extractPdfTextByPage, joinPdfTextPages } from "../../lib/pdf/text.js";
import { ocrPdfToText, createSearchablePdf } from "../../lib/pdf/ocr.js";
import { formatBytes } from "../../lib/pdf/core.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ProgressBar from "../../components/tools/ProgressBar";
import PdfFileSummary from "../../components/tools/pdf/PdfFileSummary.jsx";
import PdfStepIndicator from "../../components/tools/pdf/PdfStepIndicator.jsx";
import PdfResultPanel from "../../components/tools/pdf/PdfResultPanel.jsx";

const LABELS={
 "pdf-to-word":{title:"PDF to Word",action:"Create Word document"},
 "pdf-to-excel":{title:"PDF to Excel",action:"Create spreadsheet"},
 "pdf-to-powerpoint":{title:"PDF to PowerPoint",action:"Create presentation"},
 "pdf-to-text":{title:"PDF to Text",action:"Extract text"},
 "pdf-ocr":{title:"PDF OCR",action:"Run OCR"},
 "scanned-pdf-to-searchable-pdf":{title:"Scanned PDF to Searchable PDF",action:"Create searchable PDF"},
};

function dataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error("Could not read rendered page."));reader.readAsDataURL(blob)})}
function imageContain(width,height,boxX,boxY,boxW,boxH){const ratio=Math.min(boxW/width,boxH/height);const w=width*ratio,h=height*ratio;return{x:boxX+(boxW-w)/2,y:boxY+(boxH-h)/2,w,h}}

export default function PdfConversionTool({id}){
 const config=LABELS[id]||LABELS["pdf-to-text"];
 const [source,setSource]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[artifact,setArtifact]=useState(null),[text,setText]=useState(""),[progress,setProgress]=useState({current:0,total:0}),[language,setLanguage]=useState("eng"),[pptMode,setPptMode]=useState("page-image"),[preserveLines,setPreserveLines]=useState(true),[ocrPages,setOcrPages]=useState(0);
 const abortRef=useRef(null);
 const textTool=id==="pdf-to-text"||id==="pdf-ocr";
 const ocrTool=id==="pdf-ocr"||id==="scanned-pdf-to-searchable-pdf";
 async function handleFiles([file]){setError("");setArtifact(null);setText("");setProgress({current:0,total:0});setOcrPages(0);if(!file)return;try{setSource(await inspectPdfFile(file))}catch(e){setSource(null);setError(e.message||"Could not open this PDF.")}}
 function reset(){abortRef.current?.abort();setSource(null);setArtifact(null);setText("");setError("");setProgress({current:0,total:0});setLanguage("eng");setPptMode("page-image");setPreserveLines(true);setOcrPages(0)}
 function cancel(){abortRef.current?.abort()}
 async function extractText(signal){const pages=await extractPdfTextByPage(source.bytes,{signal,onProgress:(current,total)=>setProgress({current,total}),normalizeWhitespace:!preserveLines});return{pages,text:joinPdfTextPages(pages)}}
 async function run(){if(!source)return;setBusy(true);setError("");setArtifact(null);setText("");setProgress({current:0,total:source.pageCount});setOcrPages(0);const controller=new AbortController();abortRef.current=controller;try{
   if(id==="pdf-to-text"){
     const result=await extractText(controller.signal);if(!result.text.replace(/--- Page \d+ ---/g,"").trim())throw new Error("No selectable text was detected. This PDF may contain scanned images. Try PDF OCR instead.");setText(result.text);const blob=new Blob([result.text],{type:"text/plain;charset=utf-8"});setArtifact(createOutputArtifact({data:blob,filename:`${stripPdfExtension(source.name)}-text.txt`,mimeType:"text/plain"}));
   }else if(id==="pdf-ocr"){
     const pages=await ocrPdfToText(source.bytes,{language,signal:controller.signal,onProgress:(current,total)=>setProgress({current,total})});const value=joinPdfTextPages(pages);if(!value.trim())throw new Error("OCR completed but no readable text was detected. Try a clearer scan or another OCR language.");setText(value);const blob=new Blob([value],{type:"text/plain;charset=utf-8"});setArtifact(createOutputArtifact({data:blob,filename:`${stripPdfExtension(source.name)}-ocr.txt`,mimeType:"text/plain"}));
   }else if(id==="scanned-pdf-to-searchable-pdf"){
     const result=await createSearchablePdf(source.bytes,{language,signal:controller.signal,onProgress:(current,total,count)=>{setProgress({current,total});setOcrPages(count)}});const output=await buildValidatedPdfArtifact(result.bytes,{sourceName:source.name,suffix:"searchable",expectedPageCount:source.pageCount,metadata:{ocrPages:result.ocrPages,visualSourcePreserved:true}});setOcrPages(result.ocrPages);setArtifact(output);
   }else{
     const textResult=await extractText(controller.signal);
     if(id==="pdf-to-word"){
       if(!textResult.text.replace(/--- Page \d+ ---/g,"").trim())throw new Error("No selectable text was detected. Run PDF OCR first for scanned documents.");const {Document,Packer,Paragraph,HeadingLevel}=await import("docx");const children=[];for(const page of textResult.pages){children.push(new Paragraph({text:`Page ${page.pageNumber}`,heading:HeadingLevel.HEADING_2}));for(const line of (page.text||"").split(/\n+/).filter(Boolean))children.push(new Paragraph(line));}const doc=new Document({sections:[{children}]});const blob=await Packer.toBlob(doc);const mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document";await validateOoxmlOutput(blob,mime);setArtifact(createOutputArtifact({data:blob,filename:`${stripPdfExtension(source.name)}-text-focused.docx`,mimeType:mime,metadata:{mode:"text-focused",validated:true}}));setText("Text-focused DOCX created. Exact PDF layout, fonts, tables and floating graphics are not recreated.");
     }else if(id==="pdf-to-excel"){
       if(!textResult.text.replace(/--- Page \d+ ---/g,"").trim())throw new Error("No selectable text was detected. Run OCR first for scanned documents.");const XLSX=await import("xlsx");const rows=[];for(const page of textResult.pages){const lines=(page.text||"").split(/\n+/).filter(Boolean);if(!lines.length)rows.push({Page:page.pageNumber,Line:"",Text:""});lines.forEach((line,index)=>rows.push({Page:page.pageNumber,Line:index+1,Text:line}))}const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"PDF Text");const array=XLSX.write(wb,{bookType:"xlsx",type:"array"});const bytes=new Uint8Array(array);const mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";await validateOoxmlOutput(bytes,mime);setArtifact(createOutputArtifact({data:bytes,filename:`${stripPdfExtension(source.name)}-text-extraction.xlsx`,mimeType:mime,metadata:{mode:"text-extraction",validated:true}}));setText("Text extraction workbook created. This does not claim automatic table/layout reconstruction.");
     }else if(id==="pdf-to-powerpoint"){
       const PptxGenJS=(await import("pptxgenjs")).default;const pptx=new PptxGenJS();pptx.layout="LAYOUT_WIDE";pptx.author="MZ Smart Tool House";
       if(pptMode==="page-image"){
         const {renderPdfPagesToImages}=await import("../../lib/pdf/pdfToImages.js");const images=await renderPdfPagesToImages(source.bytes,{format:"image/png",dpi:150,onProgress:(current,total)=>setProgress({current,total})});for(const image of images){if(controller.signal.aborted)throw new DOMException("Operation cancelled","AbortError");const slide=pptx.addSlide();slide.background={color:"FFFFFF"};const box=imageContain(image.width,image.height,0,0,13.333,7.5);slide.addImage({data:await dataUrl(image.blob),...box});}
       }else{
         for(const page of textResult.pages){const slide=pptx.addSlide();slide.addText(`Page ${page.pageNumber}`,{x:.6,y:.35,w:12,h:.4,fontSize:16,bold:true,color:"2563EB"});slide.addText(page.text||"No selectable text on this page.",{x:.6,y:.9,w:12.1,h:5.9,fontSize:18,margin:.08,fit:"shrink",breakLine:false,color:"0F172A"});}
       }
       const blob=await pptx.write({outputType:"blob"});const mime="application/vnd.openxmlformats-officedocument.presentationml.presentation";await validateOoxmlOutput(blob,mime);setArtifact(createOutputArtifact({data:blob,filename:`${stripPdfExtension(source.name)}-${pptMode==="page-image"?"page-slides":"text-outline"}.pptx`,mimeType:mime,metadata:{mode:pptMode,validated:true}}));setText(pptMode==="page-image"?"Each PDF page became a high-quality slide image. The slide is visually faithful but not fully editable as reconstructed objects.":"Selectable PDF text became editable slide text. Original layout recreation is intentionally not claimed.");
     }
   }
 }catch(e){if(e?.name==="AbortError")setError("Processing was cancelled.");else setError(e.message||"The document could not be processed.")}finally{setBusy(false);abortRef.current=null}}
 const step=artifact?4:busy?3:source?2:1;const resultStats=artifact?[["Output",artifact.filename],["Source pages",String(source.pageCount)],["Size",formatBytes(artifact.data instanceof Blob?artifact.data.size:artifact.data.byteLength||0)]]:[];
 return <div className="mz-card p-4 sm:p-6"><PdfStepIndicator current={step} steps={["Select","Options","Process","Download"]}/>{!source?<FileDropzone accept="application/pdf" onFiles={handleFiles} label={`Choose a PDF for ${config.title}`}/>:<PdfFileSummary name={source.name} size={source.size} pageCount={source.pageCount} onRemove={reset}/>} {source?<div className="mt-5 space-y-4">{ocrTool?<label className="block max-w-sm text-sm font-semibold">OCR language<select className="mz-input mt-2" value={language} onChange={(e)=>setLanguage(e.target.value)}><option value="eng">English</option><option value="urd">Urdu</option><option value="ara">Arabic</option></select><span className="mt-1 block text-xs font-normal text-navy-500">OCR language data may need an internet connection the first time it is loaded.</span></label>:null}{id==="pdf-to-powerpoint"?<fieldset><legend className="text-sm font-bold">Conversion mode</legend><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className={`rounded-xl border p-3 ${pptMode==="page-image"?"border-brand-500 bg-brand-50 dark:bg-brand-950/30":"border-navy-200 dark:border-navy-700"}`}><input type="radio" className="mr-2" checked={pptMode==="page-image"} onChange={()=>setPptMode("page-image")}/><strong>Page-as-slide</strong><span className="mt-1 block text-xs text-navy-500">Best visual fidelity: each PDF page is rendered as a high-quality slide image.</span></label><label className={`rounded-xl border p-3 ${pptMode==="text-outline"?"border-brand-500 bg-brand-50 dark:bg-brand-950/30":"border-navy-200 dark:border-navy-700"}`}><input type="radio" className="mr-2" checked={pptMode==="text-outline"} onChange={()=>setPptMode("text-outline")}/><strong>Text outline</strong><span className="mt-1 block text-xs text-navy-500">Editable text, simplified layout. Exact PDF design is not recreated.</span></label></div></fieldset>:null}{id==="pdf-to-text"?<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={preserveLines} onChange={(e)=>setPreserveLines(e.target.checked)}/> Preserve page/line separation where available</label>:null}{id==="pdf-to-word"?<p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"><strong>Text-focused conversion:</strong> creates a real DOCX from selectable PDF text. It does not promise exact page layout, fonts, tables or floating graphics.</p>:null}{id==="pdf-to-excel"?<p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"><strong>Text extraction to spreadsheet:</strong> creates a real XLSX with page/line/text columns. Automatic table reconstruction is not claimed.</p>:null}</div>:null}
 <div className="mt-5 flex flex-wrap gap-3"><button type="button" className="mz-btn-primary" onClick={run} disabled={!source||busy}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:null}{busy?"Processing…":config.action}</button>{busy&&ocrTool?<button type="button" className="mz-btn-secondary" onClick={cancel}><Square className="h-4 w-4"/> Cancel after current page</button>:null}{source?<button type="button" className="mz-btn-secondary" onClick={reset}>Reset</button>:null}</div>
 {busy&&progress.total?<div className="mt-4"><ProgressBar current={progress.current} total={progress.total} label={`Processing page ${progress.current} of ${progress.total}`}/></div>:null}<div className="mt-4"><ErrorMessage message={error}/></div>
 {textTool&&text?<section className="mt-5"><div className="mb-2 flex items-center justify-between"><strong className="text-sm">Extracted text</strong><button type="button" className="mz-btn-secondary" onClick={()=>navigator.clipboard.writeText(text)}><Copy className="h-4 w-4"/> Copy all</button></div><pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-navy-950 p-4 text-xs leading-6 text-white">{text}</pre></section>:null}
 {!textTool&&text?<p className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-900 dark:bg-brand-950/20 dark:text-brand-200">{text}</p>:null}
 {id==="scanned-pdf-to-searchable-pdf"&&artifact?<p className="mt-3 text-xs text-navy-500">OCR text layer added to {ocrPages} image-only page{ocrPages===1?"":"s"}; pages that already contained selectable text were left untouched.</p>:null}
 <PdfResultPanel artifact={artifact} title={id==="scanned-pdf-to-searchable-pdf"?"Searchable PDF ready":`${config.title} output ready`} stats={resultStats} onReset={reset}/></div>
}
