import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumbs({ items = [] }) {
  return <nav aria-label="Breadcrumb" className="mb-5 overflow-x-auto text-xs text-navy-500 dark:text-navy-400">
    <ol className="flex min-w-max items-center gap-1.5">
      <li><Link to="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1.5 hover:text-brand-600"><Home className="h-3.5 w-3.5" aria-hidden="true" />Home</Link></li>
      {items.map((item) => <li key={item.href || item.label} className="inline-flex items-center gap-1.5"><ChevronRight className="h-3.5 w-3.5 text-navy-300" aria-hidden="true" />{item.href ? <Link to={item.href} className="inline-flex min-h-11 items-center rounded-lg px-1.5 hover:text-brand-600">{item.label}</Link> : <span aria-current="page" className="inline-flex min-h-11 items-center px-1.5 text-navy-700 dark:text-navy-200">{item.label}</span>}</li>)}
    </ol>
  </nav>;
}
