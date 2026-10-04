import { useEffect, useMemo, useRef, useState } from "react";
import { Code2, Download, MonitorPlay, RotateCcw, Sparkles } from "lucide-react";
import { downloadBytes } from "../../lib/download";

const DEFAULTS = {
  html: `<main class="card">\n  <h1>Hello MZ</h1>\n  <p>Edit HTML, CSS and JavaScript together.</p>\n  <button id="hello">Click me</button>\n</main>`,
  css: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  font-family: system-ui, sans-serif;\n  background: #f5f7fb;\n}\n.card {\n  width: min(90%, 520px);\n  padding: 2rem;\n  border-radius: 24px;\n  background: white;\n  box-shadow: 0 20px 60px rgba(15,23,42,.12);\n}\nbutton { padding: .7rem 1rem; border: 0; border-radius: 12px; cursor: pointer; }`,
  js: `const button = document.querySelector('#hello');\nbutton.addEventListener('click', () => {\n  button.textContent = 'JavaScript is working ✓';\n});`,
};

function Editor({ label, value, onChange }) {
  const lines = value.split("\n").length;
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-navy-200 bg-[#0f172a] dark:border-navy-700">
    <header className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-300"><span>{label}</span><span className="text-slate-500">{lines} lines</span></header>
    <textarea value={value} onChange={(e)=>onChange(e.target.value)} spellCheck="false" className="h-[270px] w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-6 text-slate-100 outline-none" aria-label={`${label} editor`} />
  </section>;
}

export default function WebDevelopmentLab() {
  const [html,setHtml]=useState(DEFAULTS.html);
  const [css,setCss]=useState(DEFAULTS.css);
  const [js,setJs]=useState(DEFAULTS.js);
  const [autoRun,setAutoRun]=useState(true);
  const [revision,setRevision]=useState(0);
  const [consoleLines,setConsoleLines]=useState([]);
  const [previewDoc,setPreviewDoc]=useState("");
  const iframeRef=useRef(null);

  const srcDoc = useMemo(() => {
    const enc=(value)=>JSON.stringify(String(value)).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026");
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'"><style>${css}</style></head><body>${html}<script>\nconst __send=(kind,args)=>parent.postMessage({type:'mz-web-console',kind,args:args.map(v=>String(v))},'*');['log','warn','error'].forEach(k=>{const old=console[k];console[k]=(...a)=>{__send(k,a);old(...a);};});window.onerror=(m)=>__send('error',[m]);window.onunhandledrejection=(e)=>__send('error',[e.reason||'Unhandled promise rejection']);\ntry{(0,eval)(${enc(js)});}catch(e){__send('error',[e&&e.stack||e]);}\n<\/script></body></html>`;
  }, [html,css,js,revision]);

  useEffect(()=>{
    if (typeof window === "undefined") return undefined;
    const handler=(event)=>{ if(event.data?.type!=="mz-web-console") return; setConsoleLines((lines)=>[...lines,{kind:event.data.kind,text:(event.data.args||[]).join(" ")}].slice(-100)); };
    window.addEventListener("message",handler);
    return ()=>window.removeEventListener("message",handler);
  }, []);

  useEffect(()=>{ if(autoRun) setPreviewDoc(srcDoc); },[autoRun,srcDoc]);

  const run=()=>{ setConsoleLines([]); setRevision((v)=>v+1); setPreviewDoc(srcDoc); };
  const reset=()=>{ setHtml(DEFAULTS.html);setCss(DEFAULTS.css);setJs(DEFAULTS.js);setConsoleLines([]);setRevision((v)=>v+1); };
  const download=()=>{
    const file=`<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n<\/script>\n</body>\n</html>`;
    downloadBytes(new TextEncoder().encode(file),"mz-web-project.html","text/html");
  };

  return <div className="space-y-5">
    <section className="mz-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><Code2 className="h-5 w-5 text-brand-600"/><h2 className="text-lg font-black">HTML + CSS + JavaScript Live Lab</h2></div><p className="mt-1 text-sm text-navy-500">Build a complete webpage with all three core web languages on one screen and see the result immediately.</p></div>
        <div className="flex flex-wrap gap-2"><label className="mz-btn-secondary cursor-pointer"><input type="checkbox" className="mr-2" checked={autoRun} onChange={(e)=>setAutoRun(e.target.checked)}/> Live preview</label><button className="mz-btn-primary" onClick={run}><MonitorPlay className="h-4 w-4"/> Run</button><button className="mz-btn-secondary" onClick={reset}><RotateCcw className="h-4 w-4"/> Reset</button><button className="mz-btn-secondary" onClick={download}><Download className="h-4 w-4"/> Download HTML</button></div>
      </div>
    </section>

    <div className="grid gap-4 xl:grid-cols-3"><Editor label="HTML" value={html} onChange={setHtml}/><Editor label="CSS" value={css} onChange={setCss}/><Editor label="JavaScript" value={js} onChange={setJs}/></div>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="overflow-hidden rounded-2xl border border-navy-200 bg-white dark:border-navy-700"><header className="flex items-center gap-2 border-b border-navy-100 px-4 py-3 text-xs font-black uppercase tracking-wide text-navy-500 dark:border-navy-800"><Sparkles className="h-4 w-4"/> Live browser preview</header><iframe ref={iframeRef} title="HTML CSS JavaScript live preview" sandbox="allow-scripts" srcDoc={previewDoc || srcDoc} className="h-[560px] w-full bg-white"/></section>
      <section className="overflow-hidden rounded-2xl border border-navy-200 bg-[#0b1020] dark:border-navy-700"><header className="border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">Console / errors</header><div className="h-[560px] overflow-auto p-4 font-mono text-xs leading-6 text-slate-200">{consoleLines.length?consoleLines.map((line,i)=><div key={`${i}-${line.text}`} className={line.kind==="error"?"text-red-300":line.kind==="warn"?"text-amber-300":"text-emerald-300"}><span className="mr-2 text-slate-600">{i+1}</span>{line.text}</div>):<p className="text-slate-500">Console output and JavaScript errors will appear here.</p>}</div></section>
    </div>
  </div>;
}
