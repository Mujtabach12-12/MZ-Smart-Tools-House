import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import Tool3DIcon from "./Tool3DIcon";
import { getCategoryBySlug } from "../../data/categories";

export default function ToolCard({ tool, featured = false }) {
  const category = getCategoryBySlug(tool.category);
  const active = tool.status === "active";
  return (
    <article className={`mz-tool-card group ${featured ? "mz-tool-card-featured" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <Tool3DIcon tool={tool} size={featured ? "lg" : "md"} />
        <div className="flex items-center gap-1">
          <FavoriteButton toolId={tool.id} />
          <span className="mz-tool-card-arrow"><ArrowUpRight className="h-5 w-5" /></span>
        </div>
      </div>
      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mz-category-pill">{category?.name}</span>
          <span className={active ? "mz-status-live" : "mz-status-unavailable"}>{active ? "Available" : "Unavailable"}</span>
        </div>
        <h3 className="mt-3 text-lg font-bold tracking-tight text-navy-950 dark:text-white">{tool.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-navy-500 dark:text-navy-400">{tool.description}</p>
        <Link to={tool.route || `/tools/${tool.id}`} className="mz-btn-primary mz-btn-card mt-5 w-full sm:w-fit">
          {active ? "Open Tool" : "View Tool"} <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
