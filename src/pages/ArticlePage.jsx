import { Link, useParams } from "react-router-dom";
import Seo, { BASE_URL } from "../components/layout/Seo";
import Breadcrumbs from "../components/layout/Breadcrumbs";
import { getArticleBySlug } from "../data/articles";
import { getToolById } from "../data/tools";
import NotFound from "./NotFound";

export default function ArticlePage() {
  const { articleSlug } = useParams();
  const article = getArticleBySlug(articleSlug);
  if (!article) return <NotFound />;

  const path = `/blog/${article.slug}`;
  const relatedTools = article.relatedTools.map(getToolById).filter(Boolean);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.description,
        dateModified: article.updated,
        datePublished: article.updated,
        mainEntityOfPage: `${BASE_URL}${path}`,
        author: { "@type": "Person", name: "Muhammad Mujtaba" },
        publisher: { "@id": `${BASE_URL}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${BASE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: article.title, item: `${BASE_URL}${path}` },
        ],
      },
    ],
  };

  return (
    <main className="mz-section py-8 sm:py-12">
      <Seo path={path} title={article.title} description={article.description} type="article" schema={schema} />
      <Breadcrumbs items={[{ label: "Guides", href: "/blog" }, { label: article.title }]} />
      <article className="mx-auto max-w-4xl">
        <header>
          <span className="mz-eyebrow">MZ Practical Guide</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-navy-950 sm:text-5xl dark:text-white">{article.title}</h1>
          <p className="mt-4 text-base leading-7 text-navy-600 dark:text-navy-300">{article.description}</p>
          <p className="mt-3 text-xs text-navy-400">Updated {article.updated}</p>
        </header>

        <div className="mt-10 space-y-9">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-bold text-navy-900 dark:text-white">{section.heading}</h2>
              {(section.paragraphs || []).map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-7 text-navy-600 dark:text-navy-300">{paragraph}</p>)}
              {section.bullets?.length ? (
                <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-6 text-navy-600 dark:text-navy-300">
                  {section.bullets.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {relatedTools.length > 0 && (
          <section className="mt-12 rounded-3xl border border-brand-100 bg-brand-50/50 p-6 dark:border-brand-900 dark:bg-brand-950/20">
            <h2 className="text-xl font-bold">Try the related tools</h2>
            <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">Use the guide to understand the workflow, then complete the task with a focused tool.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedTools.map((tool) => <Link key={tool.id} to={tool.route} className="mz-btn-secondary">{tool.name}</Link>)}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
