import { useState } from "react";
import { Copy, Download, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { generateAi, getAiConfigStatus } from "../../services/ai";
import { downloadBytes } from "../../lib/download";

const TASKS = [
  ["rewrite-professional", "Rewrite professionally"],
  ["summarize", "Summarize"],
  ["assignment-outline", "Create assignment outline"],
  ["email", "Draft professional email"],
  ["explain", "Explain clearly"],
];

export default function AiWritingAssistant() {
  const config = getAiConfigStatus();
  const [task,setTask]=useState(TASKS[0][0]); const [input,setInput]=useState(""); const [output,setOutput]=useState(""); const [error,setError]=useState(""); const [state,setState]=useState("idle");
  const run=async()=>{setError("");setOutput("");if(!input.trim()){setState("error");setError("Enter text or instructions before running the AI tool.");return;}setState("loading");try{const text=await generateAi({task,input});setOutput(text);setState("success");}catch(e){setError(e.message||"The AI service could not complete this request.");setState("error");}};
  const reset=()=>{setInput("");setOutput("");setError("");setState("idle")};
  return <div className="space-y-5">
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"><div className="flex gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><div><strong>Real server-backed AI only.</strong><p className="mt-1">This tool sends requests to <code>{config.endpoint || "an unconfigured endpoint"}</code>. An AI provider key must be configured on the server/Netlify environment; no API secret is stored in the browser.</p></div></div></div>
    <div className="grid gap-4 lg:grid-cols-2"><div className="mz-card p-5"><label className="text-sm font-bold">Task<select className="mz-input mt-2" value={task} onChange={(e)=>setTask(e.target.value)}>{TASKS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label className="mt-4 block text-sm font-bold">Your text / instructions<textarea className="mz-input mt-2 min-h-72" value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Paste text or describe what you want…"/></label><div className="mt-4 flex flex-wrap gap-2"><button className="mz-btn-primary" onClick={run} disabled={state==="loading"}>{state==="loading"?<Loader2 className="h-4 w-4 animate-spin"/>:null}{state==="loading"?"Processing…":"Run AI"}</button><button className="mz-btn-secondary" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset</button></div></div><div className="mz-card p-5"><div className="flex items-center justify-between gap-2"><h3 className="font-bold">Result</h3>{output?<div className="flex gap-2"><button className="mz-btn-ghost" onClick={()=>navigator.clipboard?.writeText(output)}><Copy className="h-4 w-4"/>Copy</button><button className="mz-btn-ghost" onClick={()=>downloadBytes(new TextEncoder().encode(output),"mz-ai-result.txt","text/plain")}><Download className="h-4 w-4"/>Download</button></div>:null}</div>{state==="idle"?<div className="mz-empty-state mt-4">Your verified AI response will appear here after the server returns it.</div>:null}{state==="loading"?<div className="mt-4 rounded-2xl bg-navy-50 p-6 text-sm text-navy-500 dark:bg-navy-950">Waiting for the configured AI provider…</div>:null}{output?<pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl bg-navy-50 p-4 text-sm leading-6 dark:bg-navy-950">{output}</pre>:null}{error?<div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{error}</div>:null}</div></div>
  </div>;
}
