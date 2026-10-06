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
        {seo.directAnswer?.length === 2 ? (
          <section className="mb-7 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/50 dark:bg-brand-950/20">
            <h2 className="text-sm font-bold text-navy-900 dark:text-white">{seo.directAnswer[0]}</h2>
            <p className="mt-2 text-sm leading-6 text-navy-600 dark:text-navy-300">{seo.directAnswer[1]}</p>
          </section>
        ) : null}
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

        {(seo.formula || seo.example) && <section className="mt-7 grid gap-3 sm:grid-cols-2">{seo.formula ? <div className="mz-card p-4"><h2 className="text-sm font-bold">Formula / method</h2><p className="mt-2 text-sm leading-5 text-navy-500 dark:text-navy-400">{seo.formula}</p></div> : null}{seo.example ? <div className="mz-card p-4"><h2 className="text-sm font-bold">Example</h2><p className="mt-2 text-sm leading-5 text-navy-500 dark:text-navy-400">{seo.example}</p></div> : null}</section>}

        {(seo.features?.length || seo.useCases?.length || seo.supportedFormats?.length) ? (
          <section className="mt-7 grid gap-3 md:grid-cols-3">
            {seo.features?.length ? <div className="mz-card p-4"><h2 className="text-sm font-bold">Key features</h2><ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-5 text-navy-500 dark:text-navy-400">{seo.features.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
            {seo.useCases?.length ? <div className="mz-card p-4"><h2 className="text-sm font-bold">Common uses</h2><ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-5 text-navy-500 dark:text-navy-400">{seo.useCases.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
            {seo.supportedFormats?.length ? <div className="mz-card p-4"><h2 className="text-sm font-bold">Supported formats</h2><ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-5 text-navy-500 dark:text-navy-400">{seo.supportedFormats.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
          </section>
        ) : null}

        {seo.limitations ? (
          <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <h2 className="text-sm font-bold text-amber-950 dark:text-amber-100">Limitations to know</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/80 dark:text-amber-200/80">{seo.limitations}</p>
          </section>
        ) : null}

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
              Core processing for this tool is designed to run in your browser without uploading the working file to an MZ Smart Tools House server. Features that explicitly say they use an online service are separate.
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
