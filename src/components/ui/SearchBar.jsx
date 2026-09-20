import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, TrendingUp } from "lucide-react";
import { searchTools, getPopularTools } from "../../data/tools";
import { categories } from "../../data/categories";
import ToolIcon from "./ToolIcon";
import { addRecentSearch, getRecentSearches } from "../../lib/localPreferences";

const EXAMPLES = ["compress pdf", "write assignment", "edit pdf", "create excel", "make presentation", "cpp", "python compiler", "dictionary", "gpa"];

function Highlight({ text, query }) {
  const q = query.trim();
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((p,i)=>p.toLowerCase()===q.toLowerCase()?<mark key={i} className="rounded bg-brand-100 px-0.5 text-brand-800 dark:bg-brand-900 dark:text-brand-200">{p}</mark>:p);
}

export default function SearchBar({ size = "lg", placeholder = "What do you need?" }) {
  const [query,setQuery]=useState(""); const [open,setOpen]=useState(false); const [activeIndex,setActiveIndex]=useState(-1); const [recent,setRecent]=useState([]);
  const containerRef=useRef(null); const navigate=useNavigate(); const listId=useId();
  const results=query.trim()?searchTools(query).slice(0,8):[];
  const popular=getPopularTools().slice(0,5);
  const categorySuggestions = query.trim()
    ? categories.filter((category) => `${category.name} ${category.description}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 4)
    : [];

  useEffect(()=>{setRecent(getRecentSearches()); const sync=()=>setRecent(getRecentSearches()); window.addEventListener("mz-preferences-change",sync); return()=>window.removeEventListener("mz-preferences-change",sync)},[]);
  useEffect(()=>{const h=e=>{if(containerRef.current&&!containerRef.current.contains(e.target))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);
  function goToTool(tool){setOpen(false);setQuery("");setActiveIndex(-1);addRecentSearch(query);window.dispatchEvent(new Event("mz-preferences-change"));navigate(tool.route || `/tools/${tool.id}`)}
  function runSearchTerm(term){setQuery(term);setOpen(true);setActiveIndex(-1)}
  function handleKeyDown(e){
    if(e.key==="Escape"){setOpen(false);return}
    const count=results.length;
    if(e.key==="ArrowDown"&&count){e.preventDefault();setActiveIndex(i=>(i+1)%count)}
    else if(e.key==="ArrowUp"&&count){e.preventDefault();setActiveIndex(i=>(i-1+count)%count)}
    else if(e.key==="Enter"){if(activeIndex>=0&&results[activeIndex]){e.preventDefault();goToTool(results[activeIndex])}}
  }
  const sizeClasses=size==="lg"?"py-4 text-base pl-12 pr-4":"py-2.5 text-sm pl-10 pr-3";
  return <div ref={containerRef} className="relative w-full">
    <div className="relative"><Search className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 ${size==="lg"?"h-5 w-5":"h-4 w-4"}`}/>
      <input type="search" role="combobox" autoComplete="off" spellCheck="false" enterKeyHint="search" aria-label={placeholder} aria-expanded={open} aria-controls={listId} aria-autocomplete="list" value={query}
        onChange={e=>{setQuery(e.target.value);setOpen(true);setActiveIndex(-1)}} onFocus={()=>setOpen(true)} onKeyDown={handleKeyDown} placeholder={placeholder}
        className={`w-full rounded-2xl border border-navy-200 bg-white shadow-soft outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50 dark:focus:ring-brand-950 ${sizeClasses}`}/>
    </div>
    {open&&<div id={listId} role="listbox" className="mz-card absolute z-30 mt-2 w-full overflow-hidden p-2">
      {query.trim()?results.length===0?<div className="px-3 py-4 text-center text-sm text-navy-500 dark:text-navy-400">No tools found for “{query}”. Try a category, abbreviation, or synonym.{categorySuggestions.length>0&&<div className="mt-3 flex flex-wrap justify-center gap-2">{categorySuggestions.map(c=><button key={c.slug} type="button" onClick={()=>navigate(c.route || `/categories/${c.slug}`)} className="mz-badge">{c.name}</button>)}</div>}</div>:
        results.map((tool,i)=><button key={tool.id} type="button" role="option" aria-selected={i===activeIndex} onMouseDown={e=>e.preventDefault()} onClick={()=>goToTool(tool)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${i===activeIndex?"bg-brand-50 dark:bg-brand-950":"hover:bg-navy-50 dark:hover:bg-navy-800"}`}>
          <ToolIcon name={tool.icon} className="h-4 w-4 shrink-0 text-brand-600"/><span className="flex-1 truncate text-navy-800 dark:text-navy-100"><Highlight text={tool.name} query={query}/></span>{tool.status!=="active"&&<span className="mz-badge-muted">Soon</span>}
        </button>)
      :<div className="grid gap-3 p-2 sm:grid-cols-2">
        <div><div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-navy-400"><Clock className="h-3.5 w-3.5"/> Recent</div>
          {recent.length?<div className="space-y-1">{recent.map(term=><button key={term} type="button" onClick={()=>runSearchTerm(term)} className="block w-full rounded-lg px-2.5 py-2 text-left text-sm text-navy-600 hover:bg-navy-50 dark:text-navy-300 dark:hover:bg-navy-800">{term}</button>)}</div>:<p className="px-2.5 py-2 text-xs text-navy-400">No recent searches.</p>}</div>
        <div><div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-navy-400"><TrendingUp className="h-3.5 w-3.5"/> Popular</div>
          {popular.map(t=><button key={t.id} type="button" onClick={()=>goToTool(t)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-navy-600 hover:bg-navy-50 dark:text-navy-300 dark:hover:bg-navy-800"><ToolIcon name={t.icon} className="h-4 w-4 text-brand-600"/>{t.name}</button>)}</div>
      </div>}
    </div>}
  </div>;
}
export { EXAMPLES };
