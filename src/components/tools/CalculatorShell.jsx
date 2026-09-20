import { Link } from "react-router-dom";
import { ChevronDown, Lock } from "lucide-react";
import { useState } from "react";
import Seo from "../layout/Seo";
import ToolIcon from "../ui/ToolIcon";
import ToolCard from "../ui/ToolCard";
import { getCategoryBySlug } from "../../data/categories";
import { getToolsByCategory } from "../../data/tools";

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mz-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-navy-900 dark:text-navy-50">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-navy-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-4 text-sm text-navy-500 dark:text-navy-400">{a}</div>}
    </div>
  );
}

/**
 * `tool` comes straight from the registry (src/data/tools.js).
 * `howToUse`: string[] — ordered steps.
 * `faq`: { q, a }[]
 * `children`: the actual interactive calculator UI.
 */
export default function CalculatorShell({ tool, howToUse = [], faq = [], children }) {
  const category = getCategoryBySlug(tool.category);
  const related = getToolsByCategory(tool.category)
    .filter((t) => t.id !== tool.id)
    .slice(0, 4);

  return (
    <div className="mz-section py-12">
      <Seo path={tool.route || `/tools/${tool.id}`} title={tool.name} description={tool.description} />

      <nav className="mb-6 text-sm text-navy-400 dark:text-navy-500">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to={category?.route || `/categories/${tool.category}`} className="hover:text-brand-600">{category?.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-navy-600 dark:text-navy-300">{tool.name}</span>
      </nav>

      <div className="flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          <ToolIcon name={tool.icon} className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-navy-50">{tool.name}</h1>
          <p className="text-navy-500 dark:text-navy-400">{tool.description}</p>
        </div>
      </div>

      <div className="mt-8">{children}</div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {howToUse.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-navy-900 dark:text-navy-50">How to use {tool.name}</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-navy-500 dark:text-navy-400">
                {howToUse.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </>
          )}

          {faq.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-semibold text-navy-900 dark:text-navy-50">Frequently Asked Questions</h2>
              <div className="mt-3 space-y-3">
                {faq.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="mz-card p-5">
            <div className="flex items-center gap-2 text-navy-800 dark:text-navy-100">
              <Lock className="h-4 w-4 text-brand-600 dark:text-brand-300" />
              <h3 className="text-sm font-semibold">Privacy</h3>
            </div>
            <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
              All calculations run instantly in your browser. Nothing you type here is sent to a server.
            </p>
          </div>

          {related.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50">Related Tools</h3>
              <div className="mt-3 space-y-3">
                {related.map((t) => (
                  <ToolCard key={t.id} tool={t} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
