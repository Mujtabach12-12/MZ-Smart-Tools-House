import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, RotateCcw, Copy, Download, Server, ShieldCheck, Code2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { COMPILER_LANGUAGES, executeRemoteCode, getCompilerCapabilities, getCompilerConfig } from "../../services/compiler";
import { downloadBlob } from "../../lib/download";

const SAMPLES = {
  javascript: 'const [a,b] = input().trim().split(/\\s+/).map(Number);\nconsole.log(a + b);',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << a + b;\n  return 0;\n}',
  c: '#include <stdio.h>\nint main(){ int a,b; scanf("%d %d", &a, &b); printf("%d", a+b); return 0; }',
  python: 'a, b = map(int, input().split())\nprint(a + b)',
  java: 'import java.util.*;\nclass Main { public static void main(String[] args){ Scanner s=new Scanner(System.in); System.out.println(s.nextInt()+s.nextInt()); } }',
  typescript: 'const message: string = "Hello from TypeScript";\nconsole.log(message);',
  csharp: 'using System;\nclass Program { static void Main(){ var p=Console.ReadLine().Split(); Console.WriteLine(int.Parse(p[0])+int.Parse(p[1])); } }',
  go: 'package main\nimport "fmt"\nfunc main(){ var a,b int; fmt.Scan(&a,&b); fmt.Println(a+b) }',
  rust: 'use std::io::{self, Read};\nfn main(){ let mut s=String::new(); io::stdin().read_to_string(&mut s).unwrap(); let v:Vec<i32>=s.split_whitespace().map(|x|x.parse().unwrap()).collect(); println!("{}", v[0]+v[1]); }',
  php: '<?php\n$parts = preg_split("/\\s+/", trim(fgets(STDIN)));\necho intval($parts[0]) + intval($parts[1]);',
  ruby: 'a, b = gets.split.map(&:to_i)\nputs a + b',
  kotlin: 'fun main(){ val p=readLine()!!.trim().split(" ").map{it.toInt()}; println(p[0]+p[1]) }',
  swift: 'if let line = readLine() { let p=line.split(separator:" ").compactMap{Int($0)}; print(p[0]+p[1]) }',
  dart: "import 'dart:io';\nvoid main(){ final p=stdin.readLineSync()!.split(' ').map(int.parse).toList(); print(p[0]+p[1]); }",
};

function runJavascriptWorker(source, stdin, { timeoutMs = 3000, signal } = {}) {
  return new Promise((resolve, reject) => {
    const workerSource = `self.onmessage=async(e)=>{const {source,stdin}=e.data;const lines=String(stdin||'').split(/\\r?\\n/);let cursor=0;self.fetch=()=>Promise.reject(new Error('Network disabled in browser runner'));self.XMLHttpRequest=undefined;self.WebSocket=undefined;self.EventSource=undefined;self.SharedWorker=undefined;self.importScripts=()=>{throw new Error('Network imports are disabled')};const input=()=>lines[cursor++]??'';const out=[],err=[];const console={log:(...a)=>out.push(a.map(String).join(' ')),error:(...a)=>err.push(a.map(String).join(' ')),warn:(...a)=>err.push(a.map(String).join(' '))};try{const fn=new Function('input','console',\`"use strict";return (async()=>{\\n\${source}\\n})()\`);await fn(input,console);self.postMessage({stdout:out.join('\\n'),stderr:err.join('\\n'),exitCode:0});}catch(ex){self.postMessage({stdout:out.join('\\n'),stderr:[...err,String(ex&&ex.stack||ex)].filter(Boolean).join('\\n'),exitCode:1});}}`;
    const blob = new Blob([workerSource], { type:"text/javascript" });
    const url = URL.createObjectURL(blob); const worker = new Worker(url);
    let settled = false;
    const cleanup = () => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); signal?.removeEventListener("abort", onAbort); };
    const finish = (fn, value) => { if (settled) return; settled = true; cleanup(); fn(value); };
    const onAbort = () => finish(reject, new DOMException("Execution stopped by user.", "AbortError"));
    const timer = setTimeout(() => finish(reject, new Error(`Execution stopped after ${timeoutMs} ms.`)), timeoutMs);
    signal?.addEventListener("abort", onAbort, { once:true });
    if (signal?.aborted) { onAbort(); return; }
    worker.onmessage = (event) => finish(resolve, event.data);
    worker.onerror = (event) => finish(reject, new Error(event.message || "JavaScript worker failed."));
    worker.postMessage({ source, stdin });
  });
}

function CodeEditor({ value, onChange }) {
  const textarea = useRef(null), gutter = useRef(null);
  const lines = useMemo(() => value.split("\n").length, [value]);
  return <div className="relative grid min-h-[430px] grid-cols-[3.25rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-navy-200 bg-[#0f172a] dark:border-navy-700">
    <pre ref={gutter} className="m-0 select-none overflow-hidden border-r border-white/10 bg-black/20 py-4 pr-3 text-right font-mono text-xs leading-6 text-slate-500" aria-hidden="true">{Array.from({length:lines},(_,i)=>i+1).join("\n")}</pre>
    <textarea ref={textarea} value={value} onChange={(e)=>onChange(e.target.value)} onScroll={(e)=>{ if(gutter.current) gutter.current.scrollTop=e.currentTarget.scrollTop; }} spellCheck="false" aria-label="Source code editor" className="min-h-[430px] resize-y overflow-auto bg-transparent p-4 font-mono text-[13px] leading-6 text-slate-100 outline-none" />
  </div>;
}

function WebPlayground() {
  const [tab,setTab]=useState("html"); const [html,setHtml]=useState("<main>\n  <h1>Hello MZ</h1>\n  <button id=\"hello\">Click me</button>\n</main>"); const [css,setCss]=useState("body{font-family:system-ui;padding:2rem} h1{color:#15803d}"); const [js,setJs]=useState("document.querySelector('#hello').onclick=()=>alert('Hello!');");
  const srcDoc = useMemo(() => {
    // Encode user content before embedding it into srcDoc so HTML/CSS/JS cannot
    // accidentally terminate the bootstrap script while the iframe is parsed.
    const encode = (value) => JSON.stringify(String(value))
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'"><style id="mz-user-style"></style></head><body><div id="mz-root"></div><script>
      const userHtml=${encode(html)};
      const userCss=${encode(css)};
      const userJs=${encode(js)};
      window.onerror=(message)=>parent.postMessage({type:'mz-web-error',message:String(message)},'*');
      window.onunhandledrejection=(event)=>parent.postMessage({type:'mz-web-error',message:String(event.reason||'Unhandled promise rejection')},'*');
      document.getElementById('mz-user-style').textContent=userCss;
      document.getElementById('mz-root').innerHTML=userHtml;
      const userScript=document.createElement('script');
      userScript.textContent=userJs;
      document.body.appendChild(userScript);
    <\/script></body></html>`;
  }, [html, css, js]);
  const current = tab==="html"?html:tab==="css"?css:js; const setCurrent = tab==="html"?setHtml:tab==="css"?setCss:setJs;
  return <div className="grid gap-4 lg:grid-cols-2"><div><div className="mb-2 flex gap-2">{["html","css","js"].map(t=><button key={t} className={tab===t?"mz-btn-primary":"mz-btn-secondary"} onClick={()=>setTab(t)}>{t.toUpperCase()}</button>)}</div><CodeEditor value={current} onChange={setCurrent}/></div><div className="overflow-hidden rounded-2xl border border-navy-200 bg-white dark:border-navy-700"><div className="border-b border-navy-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy-500 dark:border-navy-800">Sandboxed preview</div><iframe title="HTML CSS JavaScript playground preview" sandbox="allow-scripts" srcDoc={srcDoc} className="h-[460px] w-full bg-white" /></div></div>;
}

export default function ProgrammingLab() {
  const [searchParams,setSearchParams]=useSearchParams();
  const requestedLanguage=searchParams.get("language");
  const initialLanguage=["web",...COMPILER_LANGUAGES.map((item)=>item.id)].includes(requestedLanguage)?requestedLanguage:"javascript";
  const [language,setLanguage]=useState(initialLanguage); const [source,setSource]=useState(SAMPLES[initialLanguage]||""); const [stdin,setStdin]=useState("5 7"); const [stdout,setStdout]=useState(""); const [stderr,setStderr]=useState(""); const [status,setStatus]=useState("idle"); const [capabilities,setCapabilities]=useState([]); const controllerRef=useRef(null);
  const config=getCompilerConfig();
  useEffect(()=>{if(!config.configured)return;const c=new AbortController();getCompilerCapabilities({signal:c.signal}).then(r=>setCapabilities(r.languages)).catch(()=>setCapabilities([]));return()=>c.abort();},[]);
  const selected=COMPILER_LANGUAGES.find(l=>l.id===language); const backendSupported=!selected?.browser&&capabilities.includes(language); const supported=selected?.browser||backendSupported;
  const changeLanguage=(id)=>{setLanguage(id);setSearchParams((current)=>{const next=new URLSearchParams(current);if(id==="javascript")next.delete("language");else next.set("language",id);return next},{replace:true});setSource(SAMPLES[id]||"");setStdout("");setStderr("");setStatus("idle")};
  const run=async()=>{if(!supported){setStatus("unsupported");setStderr(`${selected?.name || "This language"} is coming soon. Thanks for your interest.`);return;}setStatus("loading");setStdout("");setStderr("");const controller=new AbortController();controllerRef.current=controller;try{const result=selected.browser?await runJavascriptWorker(source,stdin,{timeoutMs:3000,signal:controller.signal}):await executeRemoteCode({language,source,stdin,timeoutMs:5000,signal:controller.signal});setStdout(result.stdout||"");setStderr(result.stderr||"");setStatus(result.exitCode===0?"success":"error");}catch(e){if(e.name==="AbortError"){setStderr("Execution stopped by user.");}else setStderr(e.message||"Execution failed.");setStatus("error");}finally{controllerRef.current=null;}};
  const stop=()=>{controllerRef.current?.abort();setStatus("error");setStderr("Execution stopped by user.");};
  if(language==="web") return <div className="space-y-5"><div className="flex flex-wrap gap-2"><select className="mz-input max-w-xs" value={language} onChange={(e)=>changeLanguage(e.target.value)}><option value="web">HTML/CSS/JS Playground</option>{COMPILER_LANGUAGES.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select><span className="mz-badge">Browser sandbox</span></div><WebPlayground/></div>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-navy-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900"><select className="mz-input max-w-xs" value={language} onChange={(e)=>changeLanguage(e.target.value)}><option value="web">HTML/CSS/JS Playground</option>{COMPILER_LANGUAGES.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select><span className={`rounded-full px-3 py-1 text-xs font-bold ${supported?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`}>{selected?.browser?"Browser supported":backendSupported?"Backend connected":"Coming soon"}</span><span className="ml-auto flex items-center gap-1.5 text-xs text-navy-400"><ShieldCheck className="h-4 w-4"/>{selected?.browser?"Runs safely in your browser":"Thanks for your interest"}</span></div>
    {!supported?<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"><div className="flex gap-2"><Server className="mt-0.5 h-5 w-5 shrink-0"/><div><strong>{selected?.name} is coming soon.</strong><p className="mt-1">Thanks for your interest. We&apos;re preparing this language for a reliable experience. JavaScript and the HTML/CSS/JS playground are available now.</p></div></div></div>:null}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]"><div><div className="mb-2 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><Code2 className="h-4 w-4"/> Code</h3><div className="flex gap-2"><button className="mz-btn-ghost" onClick={()=>navigator.clipboard?.writeText(source)}><Copy className="h-4 w-4"/> Copy</button><button className="mz-btn-ghost" onClick={()=>downloadBlob(new Blob([source],{type:'text/plain'}),`main-${language}.txt`)}><Download className="h-4 w-4"/> Download</button></div></div><CodeEditor value={source} onChange={setSource}/></div><div className="space-y-4"><label className="block text-sm font-bold">INPUT<textarea className="mz-input mt-2 min-h-32 font-mono" value={stdin} onChange={(e)=>setStdin(e.target.value)} placeholder="Standard input"/></label><div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold">OUTPUT</h3><span className="text-xs uppercase text-navy-400">{status}</span></div><pre className="min-h-36 overflow-auto rounded-2xl bg-[#0f172a] p-4 font-mono text-sm text-emerald-300">{stdout||"Output will appear here."}</pre></div><div><h3 className="mb-2 text-sm font-bold">ERRORS</h3><pre className="min-h-28 overflow-auto rounded-2xl bg-[#0f172a] p-4 font-mono text-sm text-red-300">{stderr||"No errors."}</pre></div></div></div>
    <div className="flex flex-wrap gap-2"><button className="mz-btn-primary" onClick={run} disabled={status==="loading"||!supported}><Play className="h-4 w-4"/> Run</button><button className="mz-btn-secondary" onClick={stop} disabled={status!=="loading"}><Square className="h-4 w-4"/> Stop</button><button className="mz-btn-secondary" onClick={()=>{setSource(SAMPLES[language]||"");setStdout("");setStderr("");setStatus("idle")}}><RotateCcw className="h-4 w-4"/> Reset</button><button className="mz-btn-ghost" onClick={()=>{setStdout("");setStderr("");setStatus("idle")}}>Clear output</button></div>
  </div>;
}
