import { Link } from "react-router-dom";
import { Home, Search, Wrench } from "lucide-react";
import Seo from "../components/layout/Seo";
import { getPopularTools } from "../data/tools";
import ToolIcon from "../components/ui/ToolIcon";

export default function NotFound() {
  const popular = getPopularTools().slice(0, 4);
  return (
    <div className="mz-section py-16 sm:py-24">
      <Seo path="/404" title="Page Not Found" description="The requested MZ Smart Tool House page could not be found." robots="noindex,nofollow,noarchive" />
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          <Wrench className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[.2em] text-brand-600">404</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-navy-950 dark:text-white">That page isn't here.</h1>
        <p className="mt-3 text-sm leading-6 text-navy-500 dark:text-navy-400">Try the tool search, browse the popular tools below, or return to the home page.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/tools" className="mz-btn-primary"><Search className="h-4 w-4" /> Search tools</Link>
          <Link to="/" className="mz-btn-secondary"><Home className="h-4 w-4" /> Go home</Link>
        </div>
      </div>
      <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {popular.map(tool => (
          <Link key={tool.id} to={tool.route || `/tools/${tool.id}`} className="mz-card p-4 text-left transition hover:-translate-y-0.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300"><ToolIcon name={tool.icon} className="h-5 w-5" /></span>
            <h2 className="mt-3 text-sm font-bold text-navy-900 dark:text-white">{tool.name}</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-navy-400">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
