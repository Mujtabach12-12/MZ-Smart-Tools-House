import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { getPdfMetadata } from "../../lib/pdf/metadata";
import { inspectPdfFile } from "../../lib/pdf/toolkit.js";
import { formatBytes } from "../../lib/pdf/core.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfFileSummary from "../../components/tools/pdf/PdfFileSummary.jsx";

const FIELDS=[["title","Title"],["author","Author"],["subject","Subject"],["keywords","Keywords"],["creator","Creator"],["producer","Producer"],["creationDate","Created"],["modificationDate","Modified"],["pageCount","Pages"],["version","PDF version"]];
export default function PdfMetadataViewer(){
 const [source,setSource]=useState(null),[meta,setMeta]=useState(null),[error,setError]=useState(""),[copied,setCopied]=useState(false);
 async function handleFiles([file]){setError("");setMeta(null);setCopied(false);if(!file)return;try{const info=await inspectPdfFile(file);setSource(info);setMeta(await getPdfMetadata(info.bytes));}catch(e){setSource(null);setError(e.message||"Could not read PDF metadata.")}}
 function reset(){setSource(null);setMeta(null);setError("");setCopied(false)}
 async function copyAll(){if(!meta)return;const text=FIELDS.map(([key,label])=>`${label}: ${meta[key]}`).join("\n");try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1500)}catch{setError("Clipboard access was blocked by this browser. You can still select the metadata manually.")}}
 return <div className="mz-card p-4 sm:p-6">{!source?<FileDropzone accept="application/pdf" onFiles={handleFiles} label="Choose a PDF to inspect metadata"/>:<PdfFileSummary name={source.name} size={source.size} pageCount={source.pageCount} onRemove={reset}/>}<div className="mt-4"><ErrorMessage message={error}/></div>{meta?<section className="mt-5"><div className="mb-3 flex items-center justify-between gap-3"><div><strong className="text-sm">Actual PDF metadata</strong><p className="mt-1 text-xs text-navy-500">Missing fields are shown as “Not provided”; MZ does not invent values.</p></div><button type="button" className="mz-btn-secondary" onClick={copyAll}>{copied?<Check className="h-4 w-4"/>:<Copy className="h-4 w-4"/>}{copied?"Copied":"Copy metadata"}</button></div><div className="overflow-hidden rounded-xl border border-navy-100 dark:border-navy-800">{FIELDS.map(([key,label])=><div key={key} className="grid grid-cols-[110px_1fr] gap-4 border-b border-navy-100 px-4 py-3 text-sm last:border-0 dark:border-navy-800 sm:grid-cols-[160px_1fr]"><span className="font-semibold text-navy-500">{label}</span><span className="min-w-0 break-words text-navy-900 dark:text-white">{meta[key]}</span></div>)}</div><p className="mt-3 text-xs text-navy-500">File size: {formatBytes(source.size)}</p></section>:null}</div>
}
