import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { inspectPdfFile, buildValidatedPdfArtifact } from "../../lib/pdf/toolkit.js";
import { getPdfMetadata } from "../../lib/pdf/metadata.js";
import { extractPdfTextByPage } from "../../lib/pdf/text.js";
import { formatBytes } from "../../lib/pdf/core.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfFileSummary from "../../components/tools/pdf/PdfFileSummary.jsx";
import PdfStepIndicator from "../../components/tools/pdf/PdfStepIndicator.jsx";
import PdfResultPanel from "../../components/tools/pdf/PdfResultPanel.jsx";

const PAGE_SIZES={A4:[595.28,841.89],Letter:[612,792],Legal:[612,1008],A3:[841.89,1190.55],A5:[419.53,595.28]};

function lineDiff(a,b){
 const left=a.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),right=b.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const leftSet=new Set(left),rightSet=new Set(right);
 const removed=left.filter(line=>!rightSet.has(line));
 const added=right.filter(line=>!leftSet.has(line));
 const same=left.filter(line=>rightSet.has(line));
 return{leftCount:left.length,rightCount:right.length,added,removed,sameCount:same.length};
}

async function resizePages(bytes,{target,customWidth,customHeight,orientation,fit}){
 const doc=await PDFDocument.load(bytes.slice());
 let dims=target==="Custom"?[Number(customWidth),Number(customHeight)]:PAGE_SIZES[target];
 if(!dims||!(dims[0]>0)||!(dims[1]>0))throw new Error("Enter valid target page dimensions in PDF points.");
 let [baseW,baseH]=dims;
 for(const page of doc.getPages()){
   const current=page.getSize();
   const landscape=orientation==="landscape"||(orientation==="auto"&&current.width>current.height);
   const targetW=landscape?Math.max(baseW,baseH):Math.min(baseW,baseH);
   const targetH=landscape?Math.min(baseW,baseH):Math.max(baseW,baseH);
   if(fit==="keep"){
     const dx=(targetW-current.width)/2,dy=(targetH-current.height)/2;
     page.translateContent?.(dx,dy);page.setSize(targetW,targetH);continue;
   }
   const scale=fit==="fill"?Math.max(targetW/current.width,targetH/current.height):Math.min(targetW/current.width,targetH/current.height);
   page.scaleContent(scale,scale);page.scaleAnnotations?.(scale,scale);
   const scaledW=current.width*scale,scaledH=current.height*scale;
   page.translateContent?.((targetW-scaledW)/2,(targetH-scaledH)/2);
   page.setSize(targetW,targetH);
 }
 return doc.save({useObjectStreams:true});
}

export default function PdfAdvancedTool({id}){
 const [source,setSource]=useState(null),[source2,setSource2]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[artifact,setArtifact]=useState(null),[result,setResult]=useState("");
 const [title,setTitle]=useState(""),[author,setAuthor]=useState(""),[subject,setSubject]=useState(""),[keywords,setKeywords]=useState("");
 const [target,setTarget]=useState("A4"),[orientation,setOrientation]=useState("auto"),[fit,setFit]=useState("fit"),[customWidth,setCustomWidth]=useState(595),[customHeight,setCustomHeight]=useState(842);
 async function handlePrimary([file]){setError("");setArtifact(null);setResult("");if(!file)return;try{const info=await inspectPdfFile(file);setSource(info);if(id==="pdf-metadata-editor"){const meta=await getPdfMetadata(info.bytes);setTitle(meta.title==="Not provided"?"":meta.title);setAuthor(meta.author==="Not provided"?"":meta.author);setSubject(meta.subject==="Not provided"?"":meta.subject);setKeywords(meta.keywords==="Not provided"?"":meta.keywords)}}catch(e){setSource(null);setError(e.message||"Could not open this PDF.")}}
 async function handleSecondary([file]){setError("");setArtifact(null);setResult("");if(!file)return;try{setSource2(await inspectPdfFile(file))}catch(e){setSource2(null);setError(e.message||"Could not open the second PDF.")}}
 function reset(){setSource(null);setSource2(null);setArtifact(null);setResult("");setError("");setTitle("");setAuthor("");setSubject("");setKeywords("");setTarget("A4");setOrientation("auto");setFit("fit");setCustomWidth(595);setCustomHeight(842)}
 async function run(){if(!source)return;setBusy(true);setError("");setArtifact(null);setResult("");try{
   if(id==="pdf-repair"){
     const doc=await PDFDocument.load(source.bytes.slice());const bytes=await doc.save({useObjectStreams:true,addDefaultPage:false});setArtifact(await buildValidatedPdfArtifact(bytes,{sourceName:source.name,suffix:"normalized",expectedPageCount:source.pageCount,metadata:{repair:"parse-and-resave"}}));setResult("The PDF was parsed and re-saved successfully. This can normalize a readable document structure, but it is not a recovery engine for severely corrupted content.");
   }else if(id==="pdf-metadata-editor"){
     const doc=await PDFDocument.load(source.bytes.slice());doc.setTitle(title.trim());doc.setAuthor(author.trim());doc.setSubject(subject.trim());doc.setKeywords(keywords.split(/[,;]+/).map(x=>x.trim()).filter(Boolean));const bytes=await doc.save({useObjectStreams:true});setArtifact(await buildValidatedPdfArtifact(bytes,{sourceName:source.name,suffix:"metadata-updated",expectedPageCount:source.pageCount,metadata:{structural:true}}));setResult("Metadata was updated without rasterizing or redrawing PDF pages.");
   }else if(id==="pdf-page-size-converter"){
     const bytes=await resizePages(source.bytes,{target,customWidth,customHeight,orientation,fit});setArtifact(await buildValidatedPdfArtifact(bytes,{sourceName:source.name,suffix:"page-size",expectedPageCount:source.pageCount,metadata:{target,orientation,fit}}));setResult(fit==="fill"?"Pages were scaled to fill the target size. Some edge content may be cropped by the page boundary.":fit==="keep"?"Page boxes changed and original content size was kept centered. Smaller target pages can clip content.":"Page content was proportionally fitted inside the target page size.");
   }else if(id==="pdf-compare"){
     if(!source2)throw new Error("Choose a second PDF to compare.");const [aPages,bPages]=await Promise.all([extractPdfTextByPage(source.bytes),extractPdfTextByPage(source2.bytes)]);const a=aPages.map(p=>p.text).join("\n"),b=bPages.map(p=>p.text).join("\n");if(!a.trim()&&!b.trim())throw new Error("No selectable text was found in either PDF. Run OCR first for scanned PDFs.");const diff=lineDiff(a,b);setResult(`Text comparison\n\nPDF A lines: ${diff.leftCount}\nPDF B lines: ${diff.rightCount}\nUnchanged lines: ${diff.sameCount}\nAdded in B: ${diff.added.length}\nRemoved from A: ${diff.removed.length}\n\nADDED\n${diff.added.slice(0,80).map(x=>`+ ${x}`).join("\n")||"None"}\n\nREMOVED\n${diff.removed.slice(0,80).map(x=>`- ${x}`).join("\n")||"None"}`);
   }
 }catch(e){setError(e.message||"The PDF operation failed.")}finally{setBusy(false)}}
 const step=id==="pdf-compare"?(result?4:busy?3:source&&source2?2:1):(artifact?4:busy?3:source?2:1);
 const action=id==="pdf-repair"?"Validate & normalize":id==="pdf-metadata-editor"?"Save metadata":id==="pdf-page-size-converter"?"Convert page size":"Compare text";
 return <div className="mz-card p-4 sm:p-6"><PdfStepIndicator current={step} steps={["Select","Configure","Process","Result"]}/>{!source?<FileDropzone accept="application/pdf" onFiles={handlePrimary} label={id==="pdf-compare"?"Choose PDF A":"Choose a PDF"}/>:<PdfFileSummary name={source.name} size={source.size} pageCount={source.pageCount} onRemove={reset}/>} {id==="pdf-compare"&&source&&!source2?<div className="mt-4"><FileDropzone accept="application/pdf" onFiles={handleSecondary} label="Choose PDF B"/></div>:null}{id==="pdf-compare"&&source2?<div className="mt-3"><PdfFileSummary name={source2.name} size={source2.size} pageCount={source2.pageCount} onRemove={()=>{setSource2(null);setResult("");setError("")}}/></div>:null}
 {id==="pdf-metadata-editor"&&source?<div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Title<input className="mz-input mt-2" value={title} onChange={(e)=>setTitle(e.target.value)}/></label><label className="text-sm font-semibold">Author<input className="mz-input mt-2" value={author} onChange={(e)=>setAuthor(e.target.value)}/></label><label className="text-sm font-semibold">Subject<input className="mz-input mt-2" value={subject} onChange={(e)=>setSubject(e.target.value)}/></label><label className="text-sm font-semibold">Keywords<input className="mz-input mt-2" value={keywords} onChange={(e)=>setKeywords(e.target.value)} placeholder="keyword one, keyword two"/></label></div>:null}
 {id==="pdf-page-size-converter"&&source?<div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold">Target size<select className="mz-input mt-2" value={target} onChange={(e)=>setTarget(e.target.value)}>{["A4","Letter","Legal","A3","A5","Custom"].map(x=><option key={x}>{x}</option>)}</select></label><label className="text-sm font-semibold">Orientation<select className="mz-input mt-2" value={orientation} onChange={(e)=>setOrientation(e.target.value)}><option value="auto">Auto</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label><label className="text-sm font-semibold">Fit behavior<select className="mz-input mt-2" value={fit} onChange={(e)=>setFit(e.target.value)}><option value="fit">Fit inside</option><option value="fill">Fill (may crop)</option><option value="keep">Keep content size & center</option></select></label>{target==="Custom"?<><label className="text-sm font-semibold">Width (pt)<input type="number" min="72" className="mz-input mt-2" value={customWidth} onChange={(e)=>setCustomWidth(e.target.value)}/></label><label className="text-sm font-semibold">Height (pt)<input type="number" min="72" className="mz-input mt-2" value={customHeight} onChange={(e)=>setCustomHeight(e.target.value)}/></label></>:null}{fit!=="fit"?<p className="sm:col-span-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">{fit==="fill"?"Fill preserves aspect ratio but content can extend beyond the target page edges.":"Keeping original content size can clip content when the target page is smaller."}</p>:null}</div>:null}
 {id==="pdf-repair"&&source?<p className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-900 dark:bg-brand-950/20 dark:text-brand-200">Repair here means validating, parsing and re-saving a readable PDF structure. MZ does not claim recovery of content that the parser cannot read.</p>:null}
 {id==="pdf-compare"&&source&&source2?<p className="mt-4 text-xs text-navy-500">Text compare uses selectable PDF text. It does not claim pixel-perfect visual comparison. Scanned/image-only PDFs should be OCRed first.</p>:null}
 <div className="mt-5 flex flex-wrap gap-3"><button type="button" className="mz-btn-primary" onClick={run} disabled={!source||busy||(id==="pdf-compare"&&!source2)}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:null}{busy?"Processing…":action}</button>{source?<button type="button" className="mz-btn-secondary" onClick={reset}>Reset</button>:null}</div><div className="mt-4"><ErrorMessage message={error}/></div>{result?<pre className="mt-4 max-h-[440px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-6 text-white">{result}</pre>:null}<PdfResultPanel artifact={artifact} title="PDF output ready" stats={artifact?[["Output",artifact.filename],["Pages",String(artifact.pageCount)],["Size",formatBytes(artifact.data.byteLength)]]:[]} onReset={reset}/></div>
}
