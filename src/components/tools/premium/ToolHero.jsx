import { Cloud, ShieldCheck, WifiOff } from "lucide-react";
import ToolIcon from "../../ui/ToolIcon";
import FavoriteButton from "../../ui/FavoriteButton";
import { getCategoryBySlug } from "../../../data/categories";
import Breadcrumbs from "../../layout/Breadcrumbs";

export default function ToolHero({ tool, compact = false }) {
  const category = getCategoryBySlug(tool.category);
  return <div className={compact ? "mb-4" : "mb-6"}>
    <Breadcrumbs items={[{ label: category?.name || "Category", href: category?.route || `/categories/${tool.category}` }, { label: tool.name }]} />
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        <span className={`flex shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950 dark:text-brand-300 ${compact ? "h-11 w-11" : "h-14 w-14"}`}>
          <ToolIcon name={tool.icon} className={compact ? "h-5 w-5" : "h-7 w-7"}/>
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={`${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"} font-extrabold tracking-tight text-navy-900 dark:text-white`}>{tool.name}</h1>
            {tool.status === "active" && <span className="mz-badge">Free</span>}
          </div>
          <p className={`${compact ? "mt-1 text-sm" : "mt-2"} max-w-2xl leading-6 text-navy-500 dark:text-navy-400`}>{tool.description}</p>
          <div className={`${compact ? "mt-2" : "mt-3"} flex flex-wrap items-center gap-3 text-xs text-navy-400`}>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600"/> Browser-first privacy where supported</span>
            <span className="inline-flex items-center gap-2">{tool.requiresInternet ? <Cloud className="h-4 w-4 text-sky-500"/> : <WifiOff className="h-4 w-4 text-emerald-600"/>}{tool.requiresInternet ? "Online required" : "Offline-ready after assets are cached"}</span>
          </div>
        </div>
      </div>
      <FavoriteButton toolId={tool.id} className="shrink-0"/>
    </div>
  </div>;
}
