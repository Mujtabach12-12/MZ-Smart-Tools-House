import { useMemo, useState } from 'react';
import { Calculator, Copy, RotateCcw } from 'lucide-react';
import { formulaDefinitions } from './formulaEngine.js';
import { notify } from '../../lib/toast';
import { announceToolSuccess } from '../../lib/toolSuccess.js';

function initialValues(fields){return Object.fromEntries(fields.map(([key,,,unit])=>[key,'']));}

export default function FormulaTool({ id, tool }) {
  const definition = formulaDefinitions[id];
  const fields = definition?.fields || [];
  const [values,setValues] = useState(()=>initialValues(fields));
  const [result,setResult] = useState(null);
  const [error,setError] = useState('');
  const formula = useMemo(()=>definition?.formula || tool?.formula || '',[definition,tool]);
  if(!definition) throw new Error(`Formula implementation missing for ${id}`);
  const calculate=()=>{setError('');setResult(null);try{const next=definition.calculate(values);setResult(next);announceToolSuccess({source:'calculation'});}catch(e){setError(e?.message||'Could not calculate this result.')}};
  const reset=()=>{setValues(initialValues(fields));setResult(null);setError('')};
  const copy=async()=>{if(!result?.display)return;try{await navigator.clipboard.writeText(result.display);notify('Result copied to clipboard.',{type:'success',title:'Calculation'});}catch{notify('Clipboard access is unavailable in this browser.',{type:'error',title:'Copy result'});}};
  return <div className="space-y-6">
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900 dark:bg-brand-950/20">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm dark:bg-navy-900 dark:text-brand-300"><Calculator className="h-5 w-5"/></span><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Validated formula</p><code className="mt-1 block text-sm font-semibold text-navy-800 dark:text-navy-100">{formula}</code></div></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map(([key,label,type='number',unit])=><label key={key} className="text-sm font-semibold text-navy-800 dark:text-navy-100"><span>{label}{unit?` (${unit})`:''}</span>{type==='text'?<input className="mz-input mt-2" type="text" value={values[key]} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))} autoCapitalize="characters"/>:<input className="mz-input mt-2" type="number" step="any" inputMode="decimal" value={values[key]} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/>}</label>)}
    </div>
    <div className="flex flex-wrap gap-2"><button type="button" className="mz-btn-primary" onClick={calculate}><Calculator className="h-4 w-4"/>Calculate</button><button type="button" className="mz-btn-secondary" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset</button>{result?.display?<button type="button" className="mz-btn-ghost" onClick={copy}><Copy className="h-4 w-4"/>Copy result</button>:null}</div>
    {error?<div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</div>:null}
    <div className="rounded-3xl border border-navy-100 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900"><p className="text-xs font-bold uppercase tracking-wider text-navy-400">Result</p><p className="mt-2 break-words text-2xl font-black tracking-tight text-navy-950 dark:text-white">{result?.display || 'Enter the required values and calculate.'}</p>{result?.details?.length?<ul className="mt-3 space-y-1 text-sm text-navy-500 dark:text-navy-400">{result.details.map((d,i)=><li key={`${d}-${i}`}>{d}</li>)}</ul>:null}</div>
    {(tool?.category==='health-tools')?<p className="text-xs leading-5 text-navy-500 dark:text-navy-400">Educational calculation only. This tool does not diagnose or replace professional medical advice.</p>:null}
  </div>;
}
