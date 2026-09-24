import { useState } from "react";
import { Link } from "react-router-dom";
import { inspectPdfFile } from "../../lib/pdf/toolkit.js";
import { formatBytes } from "../../lib/pdf/core.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfFileSummary from "../../components/tools/pdf/PdfFileSummary.jsx";
import ResultStat from "../../components/tools/ResultStat";
export default function PdfPageCounter(){
 const [source,setSource]=useState(null),[error,setError]=useState("");
 async function handleFiles([file]){setError("");if(!file)return;try{setSource(await inspectPdfFile(file))}catch(e){setSource(null);setError(e.message||"Could not read this PDF.")}}
 function reset(){setSource(null);setError("")}
 return <div className="mz-card p-4 sm:p-6">{!source?<FileDropzone accept="application/pdf" onFiles={handleFiles} label="Choose a PDF to count pages"/>:<PdfFileSummary name={source.name} size={source.size} pageCount={source.pageCount} onRemove={reset}/>}<div className="mt-4"><ErrorMessage message={error}/></div>{source?<div className="mt-5"><div className="grid gap-3 sm:grid-cols-3"><ResultStat label="Total Pages" value={source.pageCount} highlight/><ResultStat label="File Size" value={formatBytes(source.size)}/><ResultStat label="Validation" value="Valid PDF" highlight/></div><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="mz-btn-secondary" onClick={reset}>Check another PDF</button><Link className="mz-btn-primary" to="/tools/pdf-viewer">Open PDF Viewer</Link></div></div>:null}</div>
}
