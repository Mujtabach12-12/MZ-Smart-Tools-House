import { useMemo, useRef, useState } from "react";
import { Check, Clipboard, Download, Play, RefreshCcw, ShieldCheck } from "lucide-react";
import { downloadBlob } from "../../lib/download";
import { trackEvent } from "../../lib/analytics";
import {
  parseJson, formatJson, minifyJson, validateJson,
  encodeBase64Text, encodeBase64Bytes, decodeBase64Text,
  encodeUrl, decodeUrl, formatHtml, formatCss, formatJavaScript,
  convertInteger, timestampToDate, dateToTimestamps,
  generateUuidV4, generateSecurePassword, sha256Text,
  hexToRgb, rgbToHex, escapeHtmlText, unescapeHtmlText, generateLorem,
} from "../../lib/developer/toolkit";

const BASIC_TEXT_IDS = new Set([
  "json-viewer","json-formatter","json-validator","json-minifier","base64-encoder","base64-decoder",
  "url-encoder","url-decoder","html-formatter","css-formatter","javascript-formatter","hash-generator",
  "html-escape","html-unescape",
]);
const NUMBER_IDS = new Set(["binary-converter","decimal-converter","hex-converter"]);
const HEX_IDS = new Set(["color-converter","hex-to-rgb"]);

function humanError(error) { return error instanceof Error ? error.message : "Unable to process this input."; }
function safeName(name) { return String(name || "mz-developer-result.txt").replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-"); }
function downloadText(name, value, type = "text/plain;charset=utf-8") {
  return downloadBlob(new Blob([value], { type }), safeName(name));
}
function track(id, action, extra = {}) { trackEvent("developer_tool_action", { tool_id: id, action, ...extra }); }

function Label({ children, htmlFor }) { return <label htmlFor={htmlFor} className="text-sm font-semibold text-navy-800 dark:text-navy-100">{children}</label>; }
function ErrorBox({ message }) { return message ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{message}</div> : null; }
function Notice({ children }) { return <p className="rounded-xl border border-navy-100 bg-navy-50/70 p-3 text-xs leading-5 text-navy-600 dark:border-navy-800 dark:bg-navy-900/50 dark:text-navy-300">{children}</p>; }
function Output({ children, label = "Result" }) { return <section aria-live="polite" className="rounded-2xl border border-navy-100 bg-navy-950 p-4 text-slate-100 dark:border-navy-800"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</div><pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-sm leading-6">{children}</pre></section>; }

function ActionRow({ onRun, onReset, output, onCopy, onDownload, busy = false, runLabel = "Run", disableRun = false, copyStatus = "" }) {
  return <div className="flex flex-wrap gap-2">
    <button type="button" className="mz-btn-primary min-h-11" onClick={onRun} disabled={busy || disableRun}><Play className="h-4 w-4"/>{busy ? "Processing…" : runLabel}</button>
    {output !== "" && output != null && <>
      <button type="button" className="mz-btn-secondary min-h-11" onClick={onCopy}><Clipboard className="h-4 w-4"/>{copyStatus || "Copy"}</button>
      {onDownload && <button type="button" className="mz-btn-secondary min-h-11" onClick={onDownload}><Download className="h-4 w-4"/>Download</button>}
    </>}
    <button type="button" className="mz-btn-ghost min-h-11" onClick={onReset}><RefreshCcw className="h-4 w-4"/>Reset</button>
  </div>;
}

function useClipboard() {
  const [status, setStatus] = useState("");
  const copy = async (value) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable in this browser.");
      await navigator.clipboard.writeText(String(value));
      setStatus("Copied");
      window.setTimeout(() => setStatus(""), 1400);
      return true;
    } catch {
      setStatus("Copy failed");
      window.setTimeout(() => setStatus(""), 1800);
      return false;
    }
  };
  return { status, copy };
}

function JsonTreeNode({ value, name = null, depth = 0 }) {
  const prefix = name == null ? null : <span className="font-semibold text-brand-300">{name}: </span>;
  if (value === null) return <div className="pl-3">{prefix}<span className="text-amber-300">null</span></div>;
  if (typeof value !== "object") return <div className="pl-3">{prefix}<span className="text-slate-200">{JSON.stringify(value)}</span></div>;
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
  return <details open={depth < 2} className="pl-2">
    <summary className="cursor-pointer select-none py-1 text-slate-300">{prefix}{Array.isArray(value) ? `Array(${value.length})` : `Object(${entries.length})`}</summary>
    <div className="border-l border-slate-700 pl-2">{entries.map(([key, item]) => <JsonTreeNode key={key} name={key} value={item} depth={depth + 1}/>)}</div>
  </details>;
}

function JsonTool({ id }) {
  const [input, setInput] = useState(""); const [result, setResult] = useState(""); const [tree, setTree] = useState(null); const [error, setError] = useState("");
  const { status, copy } = useClipboard();
  const run = () => {
    setError(""); setTree(null); setResult("");
    try {
      if (id === "json-viewer") { const value = parseJson(input); setTree(value); setResult(JSON.stringify(value, null, 2)); }
      else if (id === "json-formatter") setResult(formatJson(input));
      else if (id === "json-validator") setResult(validateJson(input));
      else setResult(minifyJson(input));
      track(id, "complete");
    } catch (e) { setError(humanError(e)); track(id, "validation_error"); }
  };
  const reset = () => { setInput(""); setResult(""); setTree(null); setError(""); };
  return <div className="space-y-4">
    <div><Label htmlFor={`${id}-input`}>JSON input</Label><textarea id={`${id}-input`} className="mz-input mt-2 min-h-64 font-mono text-sm" spellCheck="false" value={input} onChange={(e)=>setInput(e.target.value)} placeholder='{"name":"Mujtaba","active":true}'/></div>
    <ErrorBox message={error}/>
    {tree !== null && <section className="max-h-[440px] overflow-auto rounded-2xl bg-navy-950 p-4 text-sm text-slate-100" aria-label="JSON tree"><JsonTreeNode value={tree}/></section>}
    {result && id !== "json-viewer" && <Output>{result}</Output>}
    <ActionRow onRun={run} onReset={reset} output={result} onCopy={()=>copy(result)} copyStatus={status} onDownload={()=>downloadText(id === "json-minifier" ? "data.min.json" : "data.json", result, "application/json;charset=utf-8")}/>
  </div>;
}

function TextTransformTool({ id }) {
  const [input,setInput]=useState(""); const [output,setOutput]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const [urlMode,setUrlMode]=useState("component"); const [file,setFile]=useState(null);
  const {status,copy}=useClipboard();
  const run=async()=>{setError("");setOutput("");setBusy(true);try{
    let out="";
    if(id==="base64-encoder") {
      if (file) out=encodeBase64Bytes(new Uint8Array(await file.arrayBuffer())); else out=encodeBase64Text(input);
    } else if(id==="base64-decoder") out=decodeBase64Text(input);
    else if(id==="url-encoder") out=encodeUrl(input,urlMode);
    else if(id==="url-decoder") out=decodeUrl(input,urlMode);
    else if(id==="html-formatter") out=formatHtml(input);
    else if(id==="css-formatter") out=formatCss(input);
    else if(id==="javascript-formatter") out=formatJavaScript(input);
    else if(id==="hash-generator") out=await sha256Text(input);
    else if(id==="html-escape") out=escapeHtmlText(input);
    else if(id==="html-unescape") out=unescapeHtmlText(input);
    setOutput(out); track(id,"complete");
  }catch(e){setError(humanError(e));track(id,"validation_error");}finally{setBusy(false)}};
  const reset=()=>{setInput("");setOutput("");setError("");setFile(null);};
  const isUrl=id.startsWith("url-");
  return <div className="space-y-4">
    {isUrl && <div className="max-w-sm"><Label htmlFor={`${id}-mode`}>Encoding context</Label><select id={`${id}-mode`} className="mz-input mt-2" value={urlMode} onChange={(e)=>setUrlMode(e.target.value)}><option value="component">Text / URL component</option><option value="full-url">Complete URL</option></select></div>}
    {id==="base64-encoder" && <div><Label htmlFor="base64-file">Optional file</Label><input id="base64-file" type="file" className="mz-input mt-2" onChange={(e)=>setFile(e.target.files?.[0]||null)}/><p className="mt-1 text-xs text-navy-500">If a file is selected, its actual bytes are encoded. Clear the file to encode text instead.</p></div>}
    <div><Label htmlFor={`${id}-input`}>{id==="hash-generator"?"Text to hash":id.includes("formatter")?"Source code":"Input"}</Label><textarea id={`${id}-input`} className="mz-input mt-2 min-h-64 font-mono text-sm" spellCheck="false" value={input} onChange={(e)=>setInput(e.target.value)} disabled={id==="base64-encoder"&&Boolean(file)} placeholder={id==="base64-decoder"?"Paste Base64 text…":"Type or paste input…"}/></div>
    {(id==="javascript-formatter"||id==="css-formatter"||id==="html-formatter")&&<Notice>This formatter is conservative: it formats structure without executing source code. Whitespace-sensitive strings/comments are preserved. It is not a full compiler or linter.</Notice>}
    {id==="hash-generator"&&<Notice>SHA-256 is calculated locally with Web Crypto using UTF-8 bytes. Your text is not sent to analytics or a server by this tool.</Notice>}
    <ErrorBox message={error}/>{output!==""&&<Output>{output}</Output>}
    <ActionRow onRun={run} onReset={reset} output={output} onCopy={()=>copy(output)} copyStatus={status} busy={busy} onDownload={()=>downloadText(`${id}-result.txt`,output)}/>
  </div>;
}

function RegexTool({ id }) {
  const [pattern,setPattern]=useState("\\d+"); const [flags,setFlags]=useState("g"); const [text,setText]=useState(""); const [result,setResult]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const workerRef=useRef(null); const timeoutRef=useRef(null);
  const {status,copy}=useClipboard();
  const cancel=()=>{workerRef.current?.terminate();workerRef.current=null;if(timeoutRef.current)window.clearTimeout(timeoutRef.current);timeoutRef.current=null;};
  const run=()=>{cancel();setBusy(true);setError("");setResult("");
    try{
      const worker=new Worker(new URL("../../workers/regexWorker.js",import.meta.url),{type:"module"});workerRef.current=worker;
      timeoutRef.current=window.setTimeout(()=>{worker.terminate();workerRef.current=null;setBusy(false);setError("Regex execution was stopped after 600 ms to protect this page from a potentially expensive expression.");track(id,"timeout");},600);
      worker.onmessage=(event)=>{if(timeoutRef.current)window.clearTimeout(timeoutRef.current);timeoutRef.current=null;worker.terminate();workerRef.current=null;setBusy(false);const data=event.data;if(!data?.ok){setError(data?.error||"Regex execution failed.");track(id,"validation_error");return;}const matches=data.result.matches;const lines=matches.map((m,index)=>{const groups=m.groups.length?` | groups: ${m.groups.map((g,i)=>`${i+1}=${JSON.stringify(g)}`).join(", ")}`:"";return `${index+1}. ${JSON.stringify(m.match)} @ ${m.index}${groups}`;});setResult(lines.length?`${lines.join("\n")}${data.result.truncated?"\n…match limit reached":""}`:"No matches.");track(id,"complete",{match_count:matches.length});};
      worker.onerror=()=>{cancel();setBusy(false);setError("The regex worker stopped unexpectedly. Check the expression and try again.");};
      worker.postMessage({pattern,flags,text,maxMatches:1000});
    }catch(e){cancel();setBusy(false);setError(humanError(e));}
  };
  const reset=()=>{cancel();setPattern("\\d+");setFlags("g");setText("");setResult("");setError("");setBusy(false);};
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-[1fr_140px]"><div><Label htmlFor="regex-pattern">Regular expression</Label><input id="regex-pattern" className="mz-input mt-2 font-mono" value={pattern} onChange={(e)=>setPattern(e.target.value)}/></div><div><Label htmlFor="regex-flags">Flags</Label><input id="regex-flags" className="mz-input mt-2 font-mono" value={flags} onChange={(e)=>setFlags(e.target.value)} placeholder="gim"/></div></div>
    <div><Label htmlFor="regex-text">Test text</Label><textarea id="regex-text" className="mz-input mt-2 min-h-56 font-mono text-sm" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Order 123 and item 456"/></div>
    <Notice>Regex execution runs in a dedicated Web Worker with a 600 ms timeout, 500-character pattern limit, 500,000-character text limit and 1,000-match display limit. These limits reduce, but cannot eliminate, regex complexity risks.</Notice>
    <ErrorBox message={error}/>{result&&<Output label="Matches">{result}</Output>}
    <ActionRow onRun={run} onReset={reset} output={result} onCopy={()=>copy(result)} copyStatus={status} busy={busy} onDownload={()=>downloadText("regex-matches.txt",result)}/>
  </div>;
}

function NumberConverter({ id }) {
  const base=id==="binary-converter"?2:id==="hex-converter"?16:10; const [input,setInput]=useState(""); const [output,setOutput]=useState(""); const [error,setError]=useState(""); const {status,copy}=useClipboard();
  const run=()=>{setError("");setOutput("");try{const v=convertInteger(input,base);setOutput(`Decimal: ${v.decimal}\nBinary: ${v.binary}\nHex: ${v.hex}`);track(id,"complete");}catch(e){setError(humanError(e));track(id,"validation_error");}};
  return <div className="space-y-4"><div><Label htmlFor={`${id}-input`}>{base===2?"Binary":base===16?"Hexadecimal":"Decimal"} integer</Label><input id={`${id}-input`} className="mz-input mt-2 font-mono" inputMode={base===10?"numeric":"text"} value={input} onChange={(e)=>setInput(e.target.value)} placeholder={base===2?"1010":base===16?"FF":"255"}/></div><Notice>Conversion uses BigInt, so integers larger than JavaScript's Number safe range are preserved exactly.</Notice><ErrorBox message={error}/>{output&&<Output>{output}</Output>}<ActionRow onRun={run} onReset={()=>{setInput("");setOutput("");setError("");}} output={output} onCopy={()=>copy(output)} copyStatus={status} onDownload={()=>downloadText(`${id}.txt`,output)}/></div>;
}

function TimestampTool({ id }) {
  const pro=id==="unix-timestamp-converter-plus"; const [mode,setMode]=useState("timestamp"); const [unit,setUnit]=useState("seconds"); const [input,setInput]=useState(""); const [output,setOutput]=useState(""); const [error,setError]=useState(""); const {status,copy}=useClipboard();
  const run=()=>{setError("");setOutput("");try{let data;if(mode==="date"){data=dateToTimestamps(input);setOutput(`UTC: ${data.iso}\nSeconds: ${data.seconds}\nMilliseconds: ${data.milliseconds}\nMicroseconds: ${data.microseconds}`);}else{data=timestampToDate(input,unit);setOutput(`UTC: ${data.iso}\nLocal: ${data.date.toLocaleString()}\nSeconds: ${data.seconds}\nMilliseconds: ${data.milliseconds}${pro?`\nMicroseconds: ${data.microseconds}`:""}`);}track(id,"complete");}catch(e){setError(humanError(e));track(id,"validation_error");}};
  return <div className="space-y-4">
    {pro&&<div className="max-w-xs"><Label htmlFor="timestamp-mode">Conversion direction</Label><select id="timestamp-mode" className="mz-input mt-2" value={mode} onChange={(e)=>setMode(e.target.value)}><option value="timestamp">Timestamp → date</option><option value="date">ISO date/time → timestamp</option></select></div>}
    {mode==="timestamp"&&<div className="max-w-xs"><Label htmlFor="timestamp-unit">Timestamp unit</Label><select id="timestamp-unit" className="mz-input mt-2" value={unit} onChange={(e)=>setUnit(e.target.value)}><option value="seconds">Seconds</option><option value="milliseconds">Milliseconds</option>{pro&&<option value="microseconds">Microseconds</option>}</select></div>}
    <div><Label htmlFor={`${id}-input`}>{mode==="date"?"ISO date/time":"Unix timestamp"}</Label><input id={`${id}-input`} className="mz-input mt-2 font-mono" value={input} onChange={(e)=>setInput(e.target.value)} placeholder={mode==="date"?"2026-09-26T09:00:00+05:00":"0"}/></div>
    <Notice>{pro?"Pro supports explicit seconds, milliseconds and microseconds plus reverse ISO date/time conversion.":"Basic mode converts explicit seconds or milliseconds to both UTC and local display. Units are never guessed from digit length."}</Notice>
    <ErrorBox message={error}/>{output&&<Output>{output}</Output>}<ActionRow onRun={run} onReset={()=>{setMode("timestamp");setUnit("seconds");setInput("");setOutput("");setError("");}} output={output} onCopy={()=>copy(output)} copyStatus={status} onDownload={()=>downloadText(`${id}.txt`,output)}/>
  </div>;
}

function UuidTool({ id }) {
  const [count,setCount]=useState(1); const [output,setOutput]=useState(""); const [error,setError]=useState(""); const {status,copy}=useClipboard();
  const run=()=>{setError("");try{const n=Number(count);if(!Number.isInteger(n)||n<1||n>100)throw new Error("UUID count must be a whole number from 1 to 100.");const list=Array.from({length:n},()=>generateUuidV4());setOutput(list.join("\n"));track(id,"complete",{count:n});}catch(e){setOutput("");setError(humanError(e));}};
  return <div className="space-y-4"><div className="max-w-xs"><Label htmlFor="uuid-count">Number of UUIDs</Label><input id="uuid-count" className="mz-input mt-2" type="number" inputMode="numeric" min="1" max="100" value={count} onChange={(e)=>setCount(e.target.value)}/></div><Notice><ShieldCheck className="mr-1 inline h-4 w-4"/>Uses crypto.randomUUID() when available, with a getRandomValues() UUID-v4 fallback.</Notice><ErrorBox message={error}/>{output&&<Output>{output}</Output>}<ActionRow runLabel="Generate" onRun={run} onReset={()=>{setCount(1);setOutput("");setError("");}} output={output} onCopy={()=>copy(output)} copyStatus={status} onDownload={()=>downloadText("mz-uuids.txt",output)}/></div>;
}

function PasswordTool({ id }) {
  const [length,setLength]=useState(18); const [options,setOptions]=useState({uppercase:true,lowercase:true,numbers:true,symbols:true}); const [output,setOutput]=useState(""); const [error,setError]=useState(""); const {status,copy}=useClipboard();
  const run=()=>{setError("");try{const value=generateSecurePassword(Number(length),options);setOutput(value);track(id,"complete",{length:Number(length)});}catch(e){setOutput("");setError(humanError(e));track(id,"validation_error");}};
  const toggle=(key)=>setOptions((prev)=>({...prev,[key]:!prev[key]}));
  return <div className="space-y-4"><div className="max-w-xs"><Label htmlFor="password-length">Length</Label><input id="password-length" className="mz-input mt-2" type="number" inputMode="numeric" min="8" max="128" value={length} onChange={(e)=>setLength(e.target.value)}/></div><fieldset className="grid gap-2 sm:grid-cols-2"><legend className="mb-2 text-sm font-semibold">Character groups</legend>{Object.entries({uppercase:"Uppercase A–Z",lowercase:"Lowercase a–z",numbers:"Numbers 2–9",symbols:"Symbols"}).map(([key,label])=><label key={key} className="flex min-h-11 items-center gap-3 rounded-xl border border-navy-100 px-3 dark:border-navy-800"><input type="checkbox" checked={options[key]} onChange={()=>toggle(key)}/><span className="text-sm">{label}</span></label>)}</fieldset><Notice>Passwords are generated locally with Web Crypto rejection sampling. The value is never included in analytics events by this tool.</Notice><ErrorBox message={error}/>{output&&<Output>{output}</Output>}<ActionRow runLabel="Generate" onRun={run} onReset={()=>{setLength(18);setOptions({uppercase:true,lowercase:true,numbers:true,symbols:true});setOutput("");setError("");}} output={output} onCopy={()=>copy(output)} copyStatus={status}/></div>;
}

function HexTool({ id }) {
  const advanced=id==="color-converter"; const [direction,setDirection]=useState("hex-rgb"); const [hex,setHex]=useState("#336699"); const [r,setR]=useState("51"),[g,setG]=useState("102"),[b,setB]=useState("153"); const [output,setOutput]=useState(""); const [color,setColor]=useState("#336699"); const [error,setError]=useState(""); const {status,copy}=useClipboard();
  const effectiveDirection=advanced?direction:id==="rgb-to-hex"?"rgb-hex":"hex-rgb";
  const run=()=>{setError("");setOutput("");try{if(effectiveDirection==="hex-rgb"){const v=hexToRgb(hex);setColor(v.hex);setOutput(`rgb(${v.r}, ${v.g}, ${v.b})`);}else{const v=rgbToHex(r,g,b);setColor(v);setOutput(v);}track(id,"complete");}catch(e){setError(humanError(e));track(id,"validation_error");}};
  return <div className="space-y-4">{advanced&&<div className="max-w-xs"><Label htmlFor="color-direction">Conversion</Label><select id="color-direction" className="mz-input mt-2" value={direction} onChange={(e)=>setDirection(e.target.value)}><option value="hex-rgb">HEX → RGB</option><option value="rgb-hex">RGB → HEX</option></select></div>}{effectiveDirection==="hex-rgb"?<div><Label htmlFor={`${id}-hex`}>HEX color</Label><input id={`${id}-hex`} className="mz-input mt-2 max-w-sm font-mono" value={hex} onChange={(e)=>setHex(e.target.value)} placeholder="#336699"/></div>:<div className="grid gap-3 sm:grid-cols-3">{[["Red",r,setR],["Green",g,setG],["Blue",b,setB]].map(([label,value,setter])=><div key={label}><Label htmlFor={`${id}-${label}`}>{label}</Label><input id={`${id}-${label}`} className="mz-input mt-2" type="number" inputMode="numeric" min="0" max="255" value={value} onChange={(e)=>setter(e.target.value)}/></div>)}</div>}<div className="flex items-center gap-3"><span className="h-12 w-12 rounded-xl border border-navy-200" style={{backgroundColor:color}} aria-hidden="true"/><span className="text-sm text-navy-500">Preview reflects the validated output color.</span></div><ErrorBox message={error}/>{output&&<Output>{output}</Output>}<ActionRow onRun={run} onReset={()=>{setDirection("hex-rgb");setHex("#336699");setR("51");setG("102");setB("153");setOutput("");setColor("#336699");setError("");}} output={output} onCopy={()=>copy(output)} copyStatus={status}/></div>;
}

function LoremTool({ id }) {
  const [count,setCount]=useState(3); const [output,setOutput]=useState(""); const [error,setError]=useState(""); const {status,copy}=useClipboard();
  const run=()=>{try{const text=generateLorem(Number(count));setOutput(text);setError("");track(id,"complete",{paragraph_count:Number(count)});}catch(e){setOutput("");setError(humanError(e));}};
  return <div className="space-y-4"><div className="max-w-xs"><Label htmlFor="lorem-count">Paragraphs</Label><input id="lorem-count" className="mz-input mt-2" type="number" inputMode="numeric" min="1" max="20" value={count} onChange={(e)=>setCount(e.target.value)}/></div><Notice>This generator intentionally uses standard deterministic Lorem Ipsum-style placeholder paragraphs. It does not claim AI or random prose generation.</Notice><ErrorBox message={error}/>{output&&<Output>{output}</Output>}<ActionRow runLabel="Generate" onRun={run} onReset={()=>{setCount(3);setOutput("");setError("");}} output={output} onCopy={()=>copy(output)} copyStatus={status} onDownload={()=>downloadText("lorem-ipsum.txt",output)}/></div>;
}

export default function DeveloperTool({ id }) {
  if (["json-viewer","json-formatter","json-validator","json-minifier"].includes(id)) return <JsonTool id={id}/>;
  if (BASIC_TEXT_IDS.has(id)) return <TextTransformTool id={id}/>;
  if (id==="regex-tester") return <RegexTool id={id}/>;
  if (NUMBER_IDS.has(id)) return <NumberConverter id={id}/>;
  if (id==="unix-timestamp-converter"||id==="unix-timestamp-converter-plus") return <TimestampTool id={id}/>;
  if (id==="uuid-generator") return <UuidTool id={id}/>;
  if (id==="password-generator") return <PasswordTool id={id}/>;
  if (HEX_IDS.has(id)||id==="rgb-to-hex") return <HexTool id={id}/>;
  if (id==="lorem-ipsum-generator") return <LoremTool id={id}/>;
  throw new Error(`Unknown Developer tool: ${id}`);
}
