import { useEffect, useMemo, useRef, useState } from "react";
import { Command, Search, Moon, Sun, Home, FolderOpen, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchTools, getPopularTools } from "../../data/tools";
import { categories } from "../../data/categories";
import ToolIcon from "./ToolIcon";
import { useTheme } from "../../context/ThemeContext";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  const items = useMemo(() => {
    const q = query.trim();
    const toolItems = (q ? searchTools(q) : getPopularTools()).slice(0, 7).map(t => ({ type:"tool", id:t.id, route:t.route, label:t.name, icon:t.icon }));
    const actions = [
      { type:"action", label:"Go home", icon:Home, run:()=>navigate("/") },
      { type:"action", label:"Open all tools", icon:FolderOpen, run:()=>navigate("/tools") },
      { type:"action", label:"Toggle theme", icon:isDark?Sun:Moon, run:toggleTheme },
    ];
    const categoryItems = (q ? categories.filter(c => `${c.name} ${c.description}`.toLowerCase().includes(q.toLowerCase())) : []).slice(0,3).map(c => ({type:"category", label:c.name, icon:FolderOpen, run:()=>navigate(c.route || `/categories/${c.slug}`)}));
    return [...toolItems, ...categoryItems, ...actions];
  }, [query, isDark, navigate, toggleTheme]);

  useEffect(() => {
    const down = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", down); return () => window.removeEventListener("keydown", down);
  }, []);
  useEffect(() => { if (open) { setQuery(""); setActive(0); setTimeout(()=>inputRef.current?.focus(),0); } }, [open]);

  function choose(item) {
    if (item.type === "tool") navigate(item.route || `/tools/${item.id}`); else item.run();
    setOpen(false);
  }
  function keyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => items.length ? (i+1)%items.length : 0); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => items.length ? (i-1+items.length)%items.length : 0); }
    if (e.key === "Enter" && items[active]) { e.preventDefault(); choose(items[active]); }
  }
  if (!open) return <button type="button" onClick={()=>setOpen(true)} className="fixed bottom-5 right-5 z-40 hidden items-center gap-2 rounded-full border border-navy-200 bg-white/90 px-4 py-2 text-xs font-semibold text-navy-600 shadow-xl backdrop-blur md:flex dark:border-navy-700 dark:bg-navy-900/90 dark:text-navy-300" aria-label="Open command palette"><Command className="h-3.5 w-3.5"/> Ctrl K</button>;
  return <div className="fixed inset-0 z-[100] flex items-start justify-center bg-navy-950/45 p-4 pt-[10vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={e=>e.currentTarget===e.target&&setOpen(false)}>
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-2xl dark:border-navy-700 dark:bg-navy-900">
      <div className="flex items-center gap-3 border-b border-navy-100 px-4 dark:border-navy-800">
        <Search className="h-5 w-5 text-navy-400"/><input ref={inputRef} value={query} onChange={e=>{setQuery(e.target.value);setActive(0)}} onKeyDown={keyDown} placeholder="Search tools..." className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none dark:text-white"/><kbd className="rounded-md border px-2 py-1 text-[10px] text-navy-400">ESC</kbd>
      </div>
      <div className="max-h-[55vh] overflow-y-auto p-2">
        {items.length===0 ? <div className="px-4 py-10 text-center text-sm text-navy-500">No commands or tools found.</div> : items.map((item,i)=>{
          const Icon=item.icon && typeof item.icon !== "string" ? item.icon : ToolIcon;
          return <button key={`${item.type}-${item.label}`} type="button" onMouseEnter={()=>setActive(i)} onClick={()=>choose(item)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${i===active?"bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300":"text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-800"}`}>
            {typeof item.icon==="string"?<ToolIcon name={item.icon} className="h-4 w-4"/>:<Icon className="h-4 w-4"/>}<span className="flex-1">{item.label}</span>{item.type==="tool"&&<span className="text-xs text-navy-400">Open</span>}
          </button>
        })}
      </div>
    </div>
  </div>;
}
