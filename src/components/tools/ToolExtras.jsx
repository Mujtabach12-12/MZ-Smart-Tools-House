import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { getToolById, getToolsByCategory } from "../../data/tools";
import ToolCard from "../ui/ToolCard";

/**
 * howTo: string[]
 * faq: { q: string, a: string }[]
 * toolId: current tool id (excluded from the related-tools list)
 * showPrivacyNote: whether this tool touches files (PDF/image tools) — shows
 *   the "processed locally" note; calculators don't need it.
 */
export default function ToolExtras({ toolId, category, howTo = [], faq = [], showPrivacyNote = false, seo = {} }) {
  const [openIndex, setOpenIndex] = useState(0);
  const categoryRelated = getToolsByCategory(category).filter((t) => t.id !== toolId && t.status === "active");
  const curated = (seo.related || []).map(getToolById).filter((t) => t && t.id !== toolId && t.status === "active");
  const related = (curated.length ? curated : categoryRelated).slice(0, 4);

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {seo.intro && <section className="mb-7"><h2 className="text-lg font-bold">About this tool</h2><p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">{seo.intro}</p></section>}
        {howTo.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-navy-900 dark:text-navy-50">How to use this tool</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-navy-500 dark:text-navy-400">
              {howTo.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </>
        )}

        {(seo.formula || seo.example) && <section className="mt-7 grid gap-3 sm:grid-cols-2"><div className="mz-card p-4"><h2 className="text-sm font-bold">Formula / method</h2><p className="mt-2 text-sm leading-5 text-navy-500 dark:text-navy-400">{seo.formula}</p></div><div className="mz-card p-4"><h2 className="text-sm font-bold">Example</h2><p className="mt-2 text-sm leading-5 text-navy-500 dark:text-navy-400">{seo.example}</p></div></section>}

        {faq.length > 0 && (
          <>
            <h2 className="mt-8 text-lg font-semibold text-navy-900 dark:text-navy-50">Frequently Asked Questions</h2>
            <div className="mt-3 space-y-2">
              {faq.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={item.q} className="mz-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? -1 : i)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-medium text-navy-900 dark:text-navy-50">{item.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-navy-400 transition ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && <div className="px-4 pb-3 text-sm text-navy-500 dark:text-navy-400">{item.a}</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <aside className="space-y-6">
        {showPrivacyNote && (
          <div className="mz-card p-5">
            <div className="flex items-center gap-2 text-navy-800 dark:text-navy-100">
              <Lock className="h-4 w-4 text-brand-600 dark:text-brand-300" />
              <h3 className="text-sm font-semibold">Privacy</h3>
            </div>
            <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
              This tool processes files locally in your browser. No server upload is required for its core processing.
            </p>
          </div>
        )}

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
  );
}
