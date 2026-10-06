import { ArrowRight, BookOpenCheck, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/layout/Seo";
import { guides } from "../data/guides";

export default function Blog() {
  return (
    <div className="mz-section max-w-6xl py-12 sm:py-16">
      <Seo
        path="/blog"
        title="Practical Guides for PDFs, Study & Online Tools"
        description="Read original MZ Smart Tools House guides about PDF compression, document scanning, GPA calculations, browser privacy, ratios and practical tool workflows."
      />

      <header className="max-w-3xl">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-brand-600"><BookOpenCheck className="h-4 w-4" /> MZ Guides</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-navy-950 sm:text-5xl dark:text-white">Practical guides that explain how the tools work</h1>
        <p className="mt-4 text-base leading-7 text-navy-600 dark:text-navy-300">
          These guides are written for MZ Smart Tools House users. They explain the real workflow, formulas, limitations and quality trade-offs behind common tasks instead of repeating generic search text.
        </p>
      </header>

      <div className="mt-9 grid gap-5 lg:grid-cols-2">
        {guides.map((guide) => (
          <article key={guide.slug} className="mz-card flex min-h-[260px] flex-col p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-navy-400">
              <span>Updated {guide.updated}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {guide.readingTime}</span>
            </div>
            <h2 className="mt-4 text-xl font-black tracking-tight text-navy-950 dark:text-white">{guide.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-navy-500 dark:text-navy-400">{guide.description}</p>
            <Link to={`/blog/${guide.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:underline">
              Read guide <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border border-navy-100 bg-navy-50/70 p-6 dark:border-navy-800 dark:bg-navy-900/70">
        <h2 className="text-lg font-black text-navy-950 dark:text-white">Editorial approach</h2>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-navy-600 dark:text-navy-300">
          We focus on practical explanations that match the behaviour of the tools currently available on this site. We avoid invented product claims, guaranteed file-size savings, universal university grading rules and other statements that the software cannot support.
        </p>
      </section>
    </div>
  );
}
