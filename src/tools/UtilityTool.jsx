import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Play, RotateCcw, Shuffle, Plus, Trash2, CheckCircle2, Clock3 } from "lucide-react";
import { downloadBlob } from "../lib/download";

const TEXT_TOOLS = new Set([
  "word-counter","character-counter","sentence-counter","case-converter","remove-extra-spaces",
  "remove-duplicate-lines","text-cleaner","text-sorter","text-reverser","text-to-slug","reading-time-calculator","line-counter"
]);
const TIMER_TOOLS = new Set(["pomodoro-timer","stopwatch","countdown-timer","study-timer"]);

const UNIVERSITY_TOOLS = new Set(["university-aggregate-calculator","merit-calculator","semester-calculator","credit-hour-calculator","scholarship-percentage-calculator"]);

function safeFilename(value) {
  return String(value || "result").replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, " ").trim().slice(0, 90) || "result";
}
function downloadText(filename, text, type="text/plain") {
  return downloadBlob(new Blob([text], { type }), safeFilename(filename));
}
async function copyText(text, setCopied) {
  try { await navigator.clipboard?.writeText(text); setCopied?.(true); setTimeout(() => setCopied?.(false), 1200); }
  catch { setCopied?.(false); }
}
function countText(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).filter(s => s.trim()).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(s => s.trim()).length : 0;
  const lines = text ? text.split(/\r?\n/).length : 0;
  const nonEmptyLines = text ? text.split(/\r?\n/).filter(line => line.trim()).length : 0;
  const uniqueLines = text ? new Set(text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)).size : 0;
  return { words, chars: text.length, charsNoSpaces: text.replace(/\s/g, "").length, sentences, paragraphs, lines, nonEmptyLines, uniqueLines };
}
function slugify(text) { return text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, ""); }
function TextTool({ id }) {
  const [text, setText] = useState(""); const [copied, setCopied] = useState(false); const [caseMode, setCaseMode] = useState("upper");
  const counts = useMemo(() => countText(text), [text]);
  const output = useMemo(() => {
    switch(id) {
      case "case-converter": return caseMode === "upper" ? text.toUpperCase() : caseMode === "lower" ? text.toLowerCase() : text.toLowerCase().replace(/(^|[.!?\n]\s+)(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
      case "remove-extra-spaces": return text.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
      case "remove-duplicate-lines": return [...new Set(text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean))].join("\n");
      case "text-cleaner": return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      case "text-sorter": return text.split(/\r?\n/).filter(Boolean).sort((a,b)=>a.localeCompare(b, undefined, {numeric:true})).join("\n");
      case "text-reverser": return text.split("").reverse().join("");
      case "text-to-slug": return slugify(text);
      default: return text;
    }
  }, [text,id,caseMode]);
  const liveOnly = ["word-counter","character-counter","sentence-counter","reading-time-calculator","line-counter"].includes(id);
  const title = id === "word-counter" ? "Live word and text statistics" : id === "character-counter" ? "Live character statistics" : id === "sentence-counter" ? "Live sentence statistics" : id === "reading-time-calculator" ? "Estimated reading time" : id === "line-counter" ? "Live line statistics" : "Text workspace";
  return <div className="space-y-5">
    <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <textarea className="mz-input min-h-[280px] resize-y" value={text} onChange={e=>setText(e.target.value)} placeholder="Type or paste your text here..." aria-label="Text input" />
      <div className="rounded-2xl border border-navy-100 bg-white/70 p-4 dark:border-navy-800 dark:bg-navy-900/50">
        <h3 className="font-semibold text-navy-900 dark:text-white">{title}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">{[["Words",counts.words],["Characters",counts.chars],["No spaces",counts.charsNoSpaces],["Sentences",counts.sentences],["Paragraphs",counts.paragraphs],["Lines",counts.lines],["Non-empty lines",counts.nonEmptyLines],["Unique lines",counts.uniqueLines],["Reading",`${Math.max(1,Math.ceil(counts.words/200))} min`]].map(([k,v])=><div key={k} className="rounded-xl bg-brand-50/70 p-3 dark:bg-brand-950/30"><div className="text-xs text-navy-500 dark:text-navy-400">{k}</div><div className="mt-1 text-lg font-bold text-navy-900 dark:text-white">{v}</div></div>)}</div>
      </div>
    </div>
    {!liveOnly && id === "case-converter" && <select className="mz-input max-w-xs" value={caseMode} onChange={e=>setCaseMode(e.target.value)}><option value="upper">UPPERCASE</option><option value="lower">lowercase</option><option value="title">Sentence Case</option></select>}
    {!liveOnly && <div className="rounded-2xl border border-navy-100 p-4 dark:border-navy-800"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-400">Result</div><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-sm text-navy-800 dark:text-navy-200">{output || "Your processed text will appear here."}</pre></div>}
    <div className="flex flex-wrap gap-2"><button className="mz-btn-primary" onClick={()=>copyText(liveOnly?text:output,setCopied)} disabled={!text}>{copied?<><CheckCircle2 className="h-4 w-4"/>Copied</>:<><Copy className="h-4 w-4"/>Copy</>}</button><button className="mz-btn-secondary" onClick={()=>downloadText("mz-text-result.txt",liveOnly?text:output)} disabled={!text}><Download className="h-4 w-4"/>Download</button><button className="mz-btn-ghost" onClick={()=>setText("")}><RotateCcw className="h-4 w-4"/>Clear</button></div>
  </div>;
}

function TimerTool({id}) {
  const defaults={"pomodoro-timer":25*60,"study-timer":50*60,"countdown-timer":10*60};
  if(id==="stopwatch") return <Stopwatch/>;
  return <Countdown secondsDefault={defaults[id]||0}/>;
}
function Countdown({secondsDefault}) {
  const [remaining,setRemaining]=useState(secondsDefault); const [running,setRunning]=useState(false); const endAt=useRef(null);
  useEffect(()=>{ if(!running) return; endAt.current=Date.now()+remaining*1000; const tick=()=>{const next=Math.max(0,Math.ceil((endAt.current-Date.now())/1000));setRemaining(next);if(next===0)setRunning(false)}; tick(); const id=setInterval(tick,250); return()=>clearInterval(id); },[running]);
  const mm=String(Math.floor(remaining/60)).padStart(2,"0"), ss=String(remaining%60).padStart(2,"0");
  return <div className="text-center"><div className="text-7xl font-extrabold tracking-tight text-navy-900 dark:text-white">{mm}:{ss}</div><p className="mt-3 text-sm text-navy-500">{remaining===0?"Session complete.":running?"Timer running":"Ready when you are."}</p><div className="mt-7 flex justify-center gap-2"><button className="mz-btn-primary" onClick={()=>setRunning(r=>!r)} disabled={remaining===0}>{running?"Pause":"Start"}</button><button className="mz-btn-secondary" onClick={()=>{setRunning(false);setRemaining(secondsDefault)}}>Reset</button></div></div>;
}
function Stopwatch(){ const [elapsed,setElapsed]=useState(0),[run,setRun]=useState(false),[laps,setLaps]=useState([]),startedAt=useRef(0),base=useRef(0); useEffect(()=>{if(!run)return;startedAt.current=performance.now();const tick=()=>setElapsed(base.current+(performance.now()-startedAt.current));tick();const id=setInterval(tick,50);return()=>clearInterval(id)},[run]); const total=Math.floor(elapsed/1000),m=String(Math.floor(total/60)).padStart(2,"0"),s=String(total%60).padStart(2,"0"),cs=String(Math.floor((elapsed%1000)/10)).padStart(2,"0"); const toggle=()=>{if(run){base.current=elapsed;setRun(false)}else{startedAt.current=performance.now();setRun(true)}}; return <div className="text-center"><div className="text-7xl font-extrabold text-navy-900 dark:text-white">{m}:{s}<span className="text-3xl text-brand-500">.{cs}</span></div><div className="mt-7 flex flex-wrap justify-center gap-2"><button className="mz-btn-primary" onClick={toggle}>{run?"Pause":"Start"}</button><button className="mz-btn-secondary" onClick={()=>setLaps(l=>[...l,elapsed])} disabled={!run}>Lap</button><button className="mz-btn-ghost" onClick={()=>{setRun(false);setElapsed(0);base.current=0;setLaps([])}}>Reset</button></div>{laps.length>0&&<div className="mx-auto mt-6 max-w-sm text-left">{laps.map((l,i)=><div key={i} className="flex justify-between border-b border-navy-100 py-2 text-sm dark:border-navy-800"><span>Lap {i+1}</span><span>{Math.floor(l/60000)}:{String(Math.floor(l/1000)%60).padStart(2,"0")}</span></div>)}</div>}</div> }

function readStoredTodos() { try { const value=JSON.parse(localStorage.getItem("mz-todos")||"[]"); return Array.isArray(value)?value.filter(x=>x&&typeof x.text==="string"):[]; } catch { return []; } }
function Todo(){const [items,setItems]=useState(readStoredTodos),[text,setText]=useState("");useEffect(()=>{try{localStorage.setItem("mz-todos",JSON.stringify(items))}catch{}},[items]); const add=()=>{if(!text.trim())return;setItems(prev=>[...prev,{id:crypto.randomUUID(),text:text.trim(),done:false}]);setText("")};return <div className="space-y-4"><div className="flex gap-2"><input className="mz-input" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Add a task..."/><button className="mz-btn-primary" onClick={add}><Plus className="h-4 w-4"/>Add</button></div>{items.length===0?<div className="mz-empty-state">No tasks yet. Add your first task above.</div>:items.map(i=><div key={i.id} className="flex items-center gap-3 rounded-xl border border-navy-100 p-3 dark:border-navy-800"><input type="checkbox" checked={i.done} onChange={()=>setItems(prev=>prev.map(x=>x.id===i.id?{...x,done:!x.done}:x))}/><span className={i.done?"flex-1 line-through opacity-50":"flex-1"}>{i.text}</span><button className="mz-btn-ghost" aria-label={`Delete ${i.text}`} onClick={()=>setItems(prev=>prev.filter(x=>x.id!==i.id))}><Trash2 className="h-4 w-4"/></button></div>)}</div>}

function Planner(){const key="mz-daily-planner"; const [data,setData]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||"null")||{date:new Date().toISOString().slice(0,10),focus:"",tasks:"",notes:""}}catch{return {date:new Date().toISOString().slice(0,10),focus:"",tasks:"",notes:""}}}); useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(data))}catch{}},[data]); return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Date<input className="mz-input mt-2" type="date" value={data.date} onChange={e=>setData({...data,date:e.target.value})}/></label><label className="text-sm font-semibold">Main focus<input className="mz-input mt-2" value={data.focus} onChange={e=>setData({...data,focus:e.target.value})} placeholder="What matters most today?"/></label></div><label className="text-sm font-semibold block">Tasks<textarea className="mz-input mt-2 min-h-40" value={data.tasks} onChange={e=>setData({...data,tasks:e.target.value})} placeholder="One task per line"/></label><label className="text-sm font-semibold block">Notes<textarea className="mz-input mt-2 min-h-32" value={data.notes} onChange={e=>setData({...data,notes:e.target.value})}/></label><button className="mz-btn-ghost" onClick={()=>setData({date:new Date().toISOString().slice(0,10),focus:"",tasks:"",notes:""})}><RotateCcw className="h-4 w-4"/>Clear day</button><p className="flex items-center gap-2 text-xs text-navy-400"><Clock3 className="h-3.5 w-3.5"/>Saved locally in this browser.</p></div>}

function UniversityTool({id}){const [a,setA]=useState(""),[b,setB]=useState(""),[c,setC]=useState(""),[w1,setW1]=useState("30"),[w2,setW2]=useState("70"),[w3,setW3]=useState("0");const n=x=>Number(x);let result="";let hint="";if(id==="university-aggregate-calculator"){const total=n(w1)+n(w2);result=Number.isFinite(n(a))&&Number.isFinite(n(b))&&total>0?`Weighted aggregate: ${((n(a)*n(w1)+n(b)*n(w2))/total).toFixed(2)}%`:"Enter scores and weights.";hint="Weights are configurable; different institutions use different admission formulas."}if(id==="merit-calculator"){const total=n(w1)+n(w2)+n(w3);result=total>0?`Weighted merit score: ${((n(a)*n(w1)+n(b)*n(w2)+n(c)*n(w3))/total).toFixed(2)}%`:"Enter weights that add up to more than zero.";hint="Use the exact weightings published by your institution."}if(id==="semester-calculator"){const vals=[a,b,c].map(Number).filter(Number.isFinite);result=vals.length?`Semester average: ${(vals.reduce((x,y)=>x+y,0)/vals.length).toFixed(2)}`:"Enter at least one value.";hint="This is a simple arithmetic average; it is not a GPA conversion."}if(id==="credit-hour-calculator"){result=`Total credit hours: ${(Number(a)||0)+(Number(b)||0)+(Number(c)||0)}`;hint="Enter credit hours for up to three courses."}if(id==="scholarship-percentage-calculator"){const pct=n(a);result=Number.isFinite(pct)?`Scholarship percentage: ${Math.min(100,Math.max(0,pct)).toFixed(2)}%`:"Enter a percentage.";hint="This reports the percentage you enter; eligibility rules vary by institution."}return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3">{[setA,setB,setC].map((set,i)=><label key={i} className="text-sm font-semibold">{["Score / Input A","Score / Input B","Score / Input C"][i]}<input className="mz-input mt-2" type="number" value={[a,b,c][i]} onChange={e=>set(e.target.value)}/></label>)}</div>{["university-aggregate-calculator","merit-calculator"].includes(id)&&<div className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-semibold">Weight A (%)<input className="mz-input mt-2" type="number" min="0" value={w1} onChange={e=>setW1(e.target.value)}/></label><label className="text-sm font-semibold">Weight B (%)<input className="mz-input mt-2" type="number" min="0" value={w2} onChange={e=>setW2(e.target.value)}/></label>{id==="merit-calculator"&&<label className="text-sm font-semibold">Weight C (%)<input className="mz-input mt-2" type="number" min="0" value={w3} onChange={e=>setW3(e.target.value)}/></label>}</div>}<div className="rounded-2xl bg-brand-50 p-5 text-center text-lg font-bold text-brand-800 dark:bg-brand-950/30 dark:text-brand-200">{result}</div><p className="text-xs text-navy-400">{hint}</p></div>}

function RandomTopic(){const [input,setInput]=useState(""),[topic,setTopic]=useState("");return <div className="text-center"><p className="text-sm text-navy-500">Enter subjects separated by commas.</p><input className="mz-input mx-auto mt-4 max-w-xl" value={input} onChange={e=>setInput(e.target.value)}/><button className="mz-btn-primary mt-4" onClick={()=>{const a=input.split(",").map(x=>x.trim()).filter(Boolean);setTopic(a[Math.floor(Math.random()*a.length)]||"")}}><Shuffle className="h-4 w-4"/>Pick a topic</button>{topic&&<div className="mx-auto mt-6 max-w-xl rounded-2xl bg-brand-50 p-5 font-bold text-brand-800 dark:bg-brand-950/30 dark:text-brand-200">{topic}</div>}</div>}

export default function UtilityTool({ id }) {
 if(TEXT_TOOLS.has(id)) return <TextTool id={id}/>;
 if(TIMER_TOOLS.has(id)) return <TimerTool id={id}/>;
 if(id==="todo-list") return <Todo/>;
 if(id==="daily-study-planner") return <Planner/>;
 if(id==="random-study-topic-generator") return <RandomTopic/>;
 if(UNIVERSITY_TOOLS.has(id)) return <UniversityTool id={id}/>;
 throw new Error(`No utility implementation registered for tool: ${id || "unknown"}`);
}
