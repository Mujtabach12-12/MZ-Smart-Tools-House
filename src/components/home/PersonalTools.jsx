import { useEffect, useState } from "react";
import { Clock3, Heart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getToolById } from "../../data/tools";
import { clearFavoriteTools, clearRecentTools, getFavoriteTools, getRecentTools } from "../../lib/localPreferences";
import ToolIcon from "../ui/ToolIcon";

function Strip({ title, icon:Icon, ids, clear, empty }) {
  const items=ids.map(getToolById).filter(Boolean).slice(0,8);
  return <section className="mz-section pb-2 pt-8">
    <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><Icon className="h-4 w-4 text-brand-600"/>{title}</h2>
      {items.length ? <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:hover:bg-navy-800"><Trash2 className="h-3.5 w-3.5"/> Clear</button> : null}</div>
    {items.length ? <div className="flex gap-3 overflow-x-auto pb-2">{items.map(t=><Link key={t.id} to={t.route || `/tools/${t.id}`} className="mz-card flex min-w-[190px] items-center gap-3 p-3 transition hover:-translate-y-0.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300"><ToolIcon name={t.icon} className="h-5 w-5"/></span><span className="min-w-0"><strong className="block truncate text-sm">{t.name}</strong><span className="block truncate text-xs text-navy-400">{t.description}</span></span>
    </Link>)}</div> : <div className="rounded-2xl border border-dashed border-navy-200 bg-navy-50/50 px-4 py-4 text-sm text-navy-500 dark:border-navy-700 dark:bg-navy-900/40 dark:text-navy-400"><strong className="block text-navy-700 dark:text-navy-200">Ready when you are.</strong><span className="mt-1 block">{empty}</span></div>}
  </section>;
}
export default function PersonalTools() {
 const [recent,setRecent]=useState(getRecentTools()); const [favorites,setFavorites]=useState(getFavoriteTools());
 useEffect(()=>{const s=()=>{setRecent(getRecentTools());setFavorites(getFavoriteTools())};window.addEventListener("mz-preferences-change",s);return()=>window.removeEventListener("mz-preferences-change",s)},[]);
 return <div className="grid lg:grid-cols-2"><Strip title="Recently Used" icon={Clock3} ids={recent} clear={()=>{clearRecentTools();setRecent([]);}} empty="Open a tool and it will appear here for quick access."/><Strip title="Favorite Tools" icon={Heart} ids={favorites} clear={()=>{clearFavoriteTools();setFavorites([]);}} empty="Favorite the tools you use most and they will stay here."/></div>;
}
