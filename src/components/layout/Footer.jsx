import { Link } from "react-router-dom";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { categories } from "../../data/categories";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-navy-100 bg-white dark:border-navy-800 dark:bg-navy-950">
      <div className="mz-section grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-navy-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Sparkles className="h-4 w-4"/></span>
            <span>MZ Smart Tool House</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-navy-500 dark:text-navy-400">A fast, focused collection of useful tools for work, study and everyday productivity.</p><p className="mt-3 text-xs font-semibold text-navy-500 dark:text-navy-400">Created &amp; developed by Muhammad Mujtaba</p>
        </div>
        <div><h4 className="text-sm font-semibold">Tools</h4><ul className="mt-4 space-y-2.5">{categories.slice(0,5).map(c=><li key={c.slug}><Link to={c.route || `/categories/${c.slug}`} className="text-sm text-navy-500 hover:text-brand-600 dark:text-navy-400">{c.name}</Link></li>)}</ul></div>
        <div><h4 className="text-sm font-semibold">Company</h4><ul className="mt-4 space-y-2.5"><li><Link to="/about" className="text-sm text-navy-500 hover:text-brand-600 dark:text-navy-400">About</Link></li><li><Link to="/settings" className="text-sm text-navy-500 hover:text-brand-600 dark:text-navy-400">Tool Configuration</Link></li><li><Link to="/contact" className="text-sm text-navy-500 hover:text-brand-600 dark:text-navy-400">Contact</Link></li><li><Link to="/blog" className="text-sm text-navy-500 hover:text-brand-600 dark:text-navy-400">Blog</Link></li></ul></div>
        <div><h4 className="text-sm font-semibold">Legal</h4><ul className="mt-4 space-y-2.5"><li><Link to="/privacy-policy" className="text-sm text-navy-500 hover:text-brand-600 dark:text-navy-400">Privacy</Link></li><li><Link to="/terms" className="text-sm text-navy-500 hover:text-brand-600 dark:text-navy-400">Terms</Link></li><li><Link to="/disclaimer" className="text-sm text-navy-500 hover:text-brand-600 dark:text-navy-400">Disclaimer</Link></li></ul></div>
      </div>
      <div className="border-t border-navy-100 py-5 dark:border-navy-800"><p className="mz-section text-center text-xs text-navy-400">© {year} MZ Smart Tool House. All rights reserved.</p></div>
    </footer>
  );
}
