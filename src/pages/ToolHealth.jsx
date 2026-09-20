import Seo from "../components/layout/Seo";
import { healthRows, healthSummary, HEALTH_AUDIT_DATE } from "../data/toolHealth";

const cards=[['Total tools','total'],['Working','working'],['Warning','warning'],['Failed','failed'],['Not implemented','not-implemented']];
const checks=[
  ["Function","functionTest"],["UI","uiTest"],["Output","outputTest"],["Download","downloadTest"],["Mobile","mobileTest"],["Error handling","errorHandlingTest"],
];
function Badge({value}){
  const tone=value==='PASS'?'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200':value==='FAIL'?'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200':value==='N/A'?'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300':'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{value}</span>;
}
function HealthBadge({value}){
  const tone=value==='working'?'bg-emerald-100 text-emerald-800':value==='failed'?'bg-red-100 text-red-800':'bg-amber-100 text-amber-800';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{value}</span>;
}
export default function ToolHealth(){
 return <><Seo title="Tool Health Dashboard" description="Internal verification status for MZ Smart Tool House." path="/tool-health" robots="noindex,nofollow,noarchive"/>
 <main className="mz-section py-10 sm:py-14"><div className="max-w-4xl"><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Internal quality</p><h1 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">Tool Health Dashboard</h1><p className="mt-2 text-navy-500 dark:text-navy-400">Green requires every applicable verification dimension to pass. A routed page or a pure function test alone is never counted as fully working. Audit date: {HEALTH_AUDIT_DATE}.</p></div>
 <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">{cards.map(([label,key])=><section key={key} className="mz-card p-4"><p className="text-xs font-bold uppercase tracking-wider text-navy-400">{label}</p><p className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">{healthSummary[key]}</p></section>)}</div>
 <section className="mt-8 space-y-3 md:hidden">{healthRows.map(row=><article key={row.id} className="mz-card p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-navy-900 dark:text-white">{row.name}</h2><p className="mt-1 text-xs text-navy-400">{row.category}</p></div><HealthBadge value={row.health}/></div><div className="mt-4 grid grid-cols-2 gap-2">{checks.map(([label,key])=><div key={key} className="rounded-xl border border-navy-100 p-2.5 dark:border-navy-800"><p className="text-[10px] font-bold uppercase tracking-wide text-navy-400">{label}</p><div className="mt-1"><Badge value={row[key]}/></div></div>)}</div><p className="mt-3 text-xs leading-5 text-navy-500 dark:text-navy-400">{row.note}</p><p className="mt-2 text-[11px] text-navy-400">Last test: {row.lastTestTime}</p></article>)}</section>
 <section className="mz-card mt-8 hidden overflow-hidden md:block"><div className="overflow-x-auto"><table className="w-full min-w-[1240px] text-left text-sm"><thead className="bg-navy-50 dark:bg-navy-900"><tr><th className="p-4">Tool</th><th className="p-4">Health</th>{checks.map(([label])=><th key={label} className="p-4">{label}</th>)}<th className="p-4">Last test</th><th className="p-4">Evidence</th></tr></thead><tbody>{healthRows.map(row=><tr key={row.id} className="border-t border-navy-100 align-top dark:border-navy-800"><td className="p-4"><div className="font-semibold">{row.name}</div><div className="mt-1 text-xs text-navy-400">{row.category}</div></td><td className="p-4"><HealthBadge value={row.health}/></td>{checks.map(([,key])=><td key={key} className="p-4"><Badge value={row[key]}/></td>)}<td className="p-4 text-xs text-navy-500">{row.lastTestTime}</td><td className="max-w-sm p-4 text-navy-500">{row.note}</td></tr>)}</tbody></table></div></section></main></>;
}
