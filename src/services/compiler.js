const ENV = import.meta.env || {};
const API_BASE = String(ENV.VITE_COMPILER_API_URL || "").replace(/\/$/, "");

export const COMPILER_LANGUAGES = Object.freeze([
  { id:"javascript", name:"JavaScript", browser:true },
  { id:"c", name:"C" }, { id:"cpp", name:"C++" }, { id:"python", name:"Python" },
  { id:"java", name:"Java" }, { id:"typescript", name:"TypeScript" }, { id:"csharp", name:"C#" },
  { id:"go", name:"Go" }, { id:"rust", name:"Rust" }, { id:"php", name:"PHP" },
  { id:"ruby", name:"Ruby" }, { id:"kotlin", name:"Kotlin" }, { id:"swift", name:"Swift" }, { id:"dart", name:"Dart" },
]);

export function getCompilerConfig() { return { configured:Boolean(API_BASE), endpoint:API_BASE || null }; }

export async function getCompilerCapabilities({ signal } = {}) {
  if (!API_BASE) return { configured:false, languages:[] };
  const response = await fetch(`${API_BASE}/status`, { headers:{ accept:"application/json" }, signal });
  if (!response.ok) throw new Error(`Compiler service status returned HTTP ${response.status}.`);
  const payload = await response.json();
  return { configured:true, languages:Array.isArray(payload.languages) ? payload.languages : [] };
}

export async function executeRemoteCode({ language, source, stdin = "", timeoutMs = 5000, signal } = {}) {
  if (!API_BASE) {
    const error = new Error("This language is coming soon. Thanks for your interest.");
    error.code = "COMPILER_BACKEND_REQUIRED";
    throw error;
  }
  const response = await fetch(`${API_BASE}/execute`, {
    method:"POST", headers:{ "content-type":"application/json", accept:"application/json" }, signal,
    body:JSON.stringify({ language, source, stdin, limits:{ timeoutMs } }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Compiler service returned HTTP ${response.status}.`);
  return {
    stdout:String(payload.stdout || ""), stderr:String(payload.stderr || ""),
    exitCode:Number.isInteger(payload.exitCode) ? payload.exitCode : null,
    durationMs:Number.isFinite(payload.durationMs) ? payload.durationMs : null,
  };
}
