import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Seo from "../components/layout/Seo";
import ToolCard from "../components/ui/ToolCard";
import ToolIcon from "../components/ui/ToolIcon";
import { categories } from "../data/categories";
import { tools, searchTools, getActiveTools, getActiveToolsByCategory } from "../data/tools";

export default function AllTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const activeTools = getActiveTools();
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const popularOnly = searchParams.get("popular") === "true";
  useEffect(() => { setQuery(searchParams.get("q") || ""); setActiveCategory(searchParams.get("category") || "all"); }, [searchParams]);

  const filteredTools = useMemo(() => {
    let list = query.trim() ? searchTools(query).filter((t) => t.status === "active") : activeTools;
    if (popularOnly) list = list.filter((t) => t.popular);
    if (activeCategory !== "all") {
      list = list.filter((t) => t.category === activeCategory);
    }
    return list;
  }, [query, activeCategory, popularOnly, activeTools]);

  return (
    <div className="mz-section py-12">
      <Seo
        path="/tools"
        title="All Tools"
        description="Browse every active MZ Smart Tool House utility across office, PDF, science, engineering, education, developer, health, conversion and productivity categories."
      />

      <div className="mz-page-intro">
        <span className="mz-eyebrow">The complete toolbox</span>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-navy-950 dark:text-white">Find a tool for the task.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-500 dark:text-navy-400">{activeTools.length} tools across {categories.length} categories, organized for quick discovery.</p>
      </div>

      <div className="mt-7 flex flex-col gap-4">
        <input aria-label="Search all tools" type="search" inputMode="search" autoComplete="off" value={query} onChange={(e) => { const value=e.target.value; setQuery(value); const next=new URLSearchParams(searchParams); value?next.set("q",value):next.delete("q"); setSearchParams(next,{replace:true}); }} placeholder={`Search ${activeTools.length} tools...`} className="mz-input mz-search-premium sm:max-w-xl" />
        <div className="mz-category-rail !bg-transparent !shadow-none !backdrop-blur-none">
          <button type="button" onClick={() => { setActiveCategory("all"); const next=new URLSearchParams(searchParams); next.delete("category"); setSearchParams(next,{replace:true}); }} className={`mz-rail-tab ${activeCategory === "all" ? "mz-rail-tab-active" : ""}`}>All <span>{activeTools.length}</span></button>
          {categories.map((cat) => <button key={cat.slug} type="button" onClick={() => { setActiveCategory(cat.slug); const next=new URLSearchParams(searchParams); next.set("category",cat.slug); setSearchParams(next,{replace:true}); }} className={`mz-rail-tab ${activeCategory === cat.slug ? "mz-rail-tab-active" : ""}`}><ToolIcon name={cat.icon} className="h-4 w-4" />{cat.name}<span>{getActiveToolsByCategory(cat.slug).length}</span></button>)}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredTools.length === 0 ? (
          <p className="col-span-full text-navy-500 dark:text-navy-400">No tools match your search.</p>
        ) : (
          filteredTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)
        )}
      </div>
    </div>
  );
}
