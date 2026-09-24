import { useState } from "react";
import { Loader2 } from "lucide-react";
import { reorderPdfPages } from "../../lib/pdf/reorderPages";
import { inspectPdfFile, buildValidatedPdfArtifact } from "../../lib/pdf/toolkit.js";
import { formatBytes } from "../../lib/pdf/core.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfFileSummary from "../../components/tools/pdf/PdfFileSummary.jsx";
import PdfPagePicker from "../../components/tools/pdf/PdfPagePicker.jsx";
import PdfStepIndicator from "../../components/tools/pdf/PdfStepIndicator.jsx";
import PdfResultPanel from "../../components/tools/pdf/PdfResultPanel.jsx";

export default function ReorderPdfPages(){
 const [source,setSource]=useState(null),[order,setOrder]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[artifact,setArtifact]=useState(null);
 async function handleFiles([file]){setError("");setArtifact(null);if(!file)return;try{const info=await inspectPdfFile(file);setSource(info);setOrder(Array.from({length:info.pageCount},(_,i)=>i));}catch(e){setSource(null);setOrder([]);setError(e.message||"Could not open this PDF.")}}
 function move(from,to){setOrder(prev=>{if(to<0||to>=prev.length||from===to)return prev;const next=[...prev];const [item]=next.splice(from,1);next.splice(to,0,item);return next});setArtifact(null)}
 function first(index){move(index,0)} function last(index){move(index,order.length-1)}
 function reset(){setSource(null);setOrder([]);setArtifact(null);setError("")}
 async function run(){if(!source)return;setBusy(true);setError("");setArtifact(null);try{const bytes=await reorderPdfPages(source.bytes,order);setArtifact(await buildValidatedPdfArtifact(bytes,{sourceName:source.name,suffix:"reordered",expectedPageCount:source.pageCount,metadata:{structural:true,order}}));}catch(e){setError(e.message||"The PDF could not be reordered.")}finally{setBusy(false)}}
 const step=artifact?4:busy?3:source?2:1;
 return <div className="mz-card p-4 sm:p-6"><PdfStepIndicator current={step} steps={["Select","Arrange","Apply","Download"]}/>{!source?<FileDropzone accept="application/pdf" onFiles={handleFiles} label="Choose a PDF to reorder"/>:<PdfFileSummary name={source.name} size={source.size} pageCount={source.pageCount} onRemove={reset}/>} {source?<div className="mt-5"><div className="mb-3"><strong className="text-sm">Arrange pages</strong><p className="mt-1 text-xs text-navy-500">Drag on desktop. On touch devices use the first/last controls for an accessible alternative.</p></div><PdfPagePicker file={source.file} order={order} onMoveFirst={first} onMoveLast={last} onReorder={move}/></div>:null}<div className="mt-5 flex flex-wrap gap-3"><button type="button" className="mz-btn-primary" onClick={run} disabled={!source||busy}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:null}{busy?"Applying order…":"Apply new order"}</button>{source?<button type="button" className="mz-btn-secondary" onClick={reset}>Reset</button>:null}</div><div className="mt-4"><ErrorMessage message={error}/></div><PdfResultPanel artifact={artifact} title="Reordered PDF ready" stats={artifact?[["Output",artifact.filename],["Pages",String(artifact.pageCount)],["Size",formatBytes(artifact.data.byteLength)]]:[]} onReset={reset} note="Pages were copied in the selected order without rasterizing them."/></div>
}
