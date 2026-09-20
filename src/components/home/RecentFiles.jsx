import { FileText, Presentation, Table2 } from "lucide-react";
import { Link } from "react-router-dom";

function safeJson(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value ?? fallback; } catch { return fallback; }
}
function when(value) {
  if (!value) return "Saved locally";
  try { return new Intl.DateTimeFormat(undefined, { dateStyle:"medium", timeStyle:"short" }).format(new Date(value)); } catch { return "Saved locally"; }
}

export default function RecentFiles() {
  const word = safeJson("mz-online-word-library-v1", []);
  const excel = safeJson("mz-online-excel-workbook-v1", null);
  const slides = safeJson("mz-online-powerpoint-deck-v1", null);
  const files = [
    ...(Array.isArray(word) ? word.slice(0, 3).map((item) => ({ type:"Document", title:item.title || "Untitled Document", savedAt:item.savedAt, to:"/tools/online-word", Icon:FileText })) : []),
    ...(excel?.sheets?.length ? [{ type:"Spreadsheet", title:excel.title || "Untitled Spreadsheet", savedAt:excel.savedAt, to:"/tools/online-excel", Icon:Table2 }] : []),
    ...(slides?.slides?.length ? [{ type:"Presentation", title:slides.title || "Untitled Presentation", savedAt:slides.savedAt, to:"/tools/online-powerpoint", Icon:Presentation }] : []),
  ].sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).slice(0,5);

  return <section className="mz-section py-8">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><span className="mz-eyebrow">CONTINUE WORKING</span><h2 className="mt-2 text-2xl font-black tracking-tight">Recent local documents</h2><p className="mt-1 text-sm text-navy-500 dark:text-navy-400">Browser-saved Office work stays on this device unless you download or move it elsewhere.</p></div><Link to="/office" className="mz-btn-ghost">Open MZ Office →</Link></div>
    {files.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{files.map((file,index)=><Link key={`${file.type}-${file.title}-${index}`} to={file.to} className="mz-card p-4 hover:border-brand-300 dark:hover:border-brand-800"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300"><file.Icon className="h-5 w-5"/></span><strong className="mt-3 block truncate text-sm" title={file.title}>{file.title}</strong><span className="mt-1 block text-xs text-navy-400">{file.type} · {when(file.savedAt)}</span></Link>)}</div> : <div className="rounded-2xl border border-dashed border-navy-200 bg-white/60 p-5 text-sm text-navy-500 dark:border-navy-700 dark:bg-navy-900/40 dark:text-navy-400"><strong className="block text-navy-800 dark:text-navy-100">No recent files yet.</strong><span className="mt-1 block">Create a document, spreadsheet or presentation and your latest local work will appear here.</span></div>}
  </section>;
}
