import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileUp } from "lucide-react";

export default function FileDropzone({ accept, multiple=false, onFiles, label="Drop files here" }) {
 const [isDragging,setIsDragging]=useState(false); const inputRef=useRef(null);
 const handleFiles=useCallback((fileList)=>{const files=Array.from(fileList||[]);if(files.length)onFiles(multiple?files:[files[0]]);},[multiple,onFiles]);
 const browse=()=>inputRef.current?.click();
 return <div onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={e=>{if(e.currentTarget===e.target)e.currentTarget.classList.remove("x");setIsDragging(false)}} onDrop={e=>{e.preventDefault();setIsDragging(false);handleFiles(e.dataTransfer.files)}} onClick={browse} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ") {e.preventDefault();browse()}}} role="button" tabIndex={0} aria-label={`${label}. Click to choose a file`} className={`group flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition duration-200 ${isDragging?"border-brand-400 bg-brand-50 shadow-lg shadow-brand-500/10 dark:bg-brand-950/40":"border-navy-200 bg-navy-50/50 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 dark:border-navy-700 dark:bg-navy-900/50 dark:hover:border-brand-700"}`}>
   <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-md transition group-hover:scale-105 dark:bg-navy-800 dark:text-brand-300 ${isDragging?"scale-110":""}`}><FileUp className="h-6 w-6"/></span>
   <div><p className="font-semibold text-navy-800 dark:text-navy-100">{isDragging?"Release to upload":label}</p><p className="mt-1 text-sm text-navy-400 dark:text-navy-500">Drag & drop or click to browse</p></div>
   <div className="inline-flex items-center gap-1 text-xs text-navy-400"><UploadCloud className="h-3.5 w-3.5"/>{accept?.replaceAll("application/","").replaceAll("image/","").replaceAll(","," · ") || "Supported files"}</div>
   <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={e=>{handleFiles(e.target.files);e.target.value=""}} onClick={e=>e.stopPropagation()}/>
 </div>
}
