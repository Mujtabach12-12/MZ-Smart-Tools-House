import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import Seo, { BASE_URL } from "../components/layout/Seo";
import { getGuideBySlug } from "../data/guides";
import { getToolById } from "../data/tools";
import NotFound from "./NotFound";

export default function GuideArticle() {
  const { slug } = useParams();
  const guide = getGuideBySlug(slug);
  if (!guide) return <NotFound />;

  const relatedTools = guide.relatedTools.map(getToolById).filter(Boolean);
  const canonical = `${BASE_URL}/blog/${guide.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: guide.title,
        description: guide.description,
        author: { "@type": "Person", name: "Muhammad Mujtaba" },
        publisher: { "@id": `${BASE_URL}/#organization` },
        isPartOf: { "@id": `${BASE_URL}/#website` },
        inLanguage: "en",
      },
      {
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        headline: guide.title,
        description: guide.description,
        dateModified: guide.updated,
        datePublished: guide.updated,
        author: { "@type": "Person", name: "Muhammad Mujtaba" },
        publisher: { "@id": `${BASE_URL}/#organization` },
        mainEntityOfPage: { "@id": `${canonical}#webpage` },
        inLanguage: "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${BASE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: guide.title, item: canonical },
        ],
      },
    ],
  };

  return (
    <>
      <Seo path={`/blog/${guide.slug}`} title={guide.title} description={guide.description} schema={schema} />
      <article className="mz-section max-w-4xl py-10 sm:py-14">
        <nav className="mb-6" aria-label="Breadcrumb">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to guides
          </Link>
        </nav>

        <header className="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-cyan-50 p-6 shadow-soft sm:p-9 dark:border-brand-900/50 dark:from-brand-950/30 dark:via-navy-950 dark:to-cyan-950/20">
          <span className="text-xs font-black uppercase tracking-[.18em] text-brand-600">MZ Smart Tools House Guide</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-navy-950 sm:text-5xl dark:text-white">{guide.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-navy-600 dark:text-navy-300">{guide.description}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-navy-500 dark:text-navy-400">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Updated {guide.updated}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {guide.readingTime}</span>
            <span>By Muhammad Mujtaba</span>
          </div>
        </header>

        <div className="mt-8">
          <p className="text-[1.02rem] leading-8 text-navy-700 dark:text-navy-200">{guide.intro}</p>

          <div className="mt-8 space-y-9">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-black tracking-tight text-navy-950 sm:text-2xl dark:text-white">{section.heading}</h2>
                <div className="mt-3 space-y-4">
                  {(section.paragraphs || []).map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-navy-600 sm:text-base dark:text-navy-300">{paragraph}</p>
                  ))}
                  {section.bullets?.length ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-navy-600 sm:text-base dark:text-navy-300">
                      {section.bullets.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </div>

        {relatedTools.length ? (
          <aside className="mt-10 rounded-3xl border border-navy-100 bg-white p-5 sm:p-7 dark:border-navy-800 dark:bg-navy-900">
            <h2 className="text-lg font-black text-navy-950 dark:text-white">Try the related tools</h2>
            <p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">Use the guide as context, then open the tool that matches the task.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedTools.map((tool) => (
                <Link key={tool.id} to={tool.route || `/tools/${tool.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-navy-100 p-4 text-sm font-bold text-navy-800 transition hover:border-brand-300 hover:bg-brand-50 dark:border-navy-800 dark:text-navy-100 dark:hover:border-brand-700 dark:hover:bg-brand-950/20">
                  <span>{tool.name}</span><ArrowRight className="h-4 w-4 shrink-0 text-brand-600" />
                </Link>
              ))}
            </div>
          </aside>
        ) : null}

        <div className="mt-8 rounded-2xl bg-navy-50 p-4 text-xs leading-6 text-navy-500 dark:bg-navy-900 dark:text-navy-400">
          This guide explains the tool or calculation method in practical terms. For academic, legal, medical or financial decisions, verify any policy-specific requirement with the appropriate official source.
        </div>
      </article>
    </>
  );
}
