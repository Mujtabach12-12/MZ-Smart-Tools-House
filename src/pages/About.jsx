import { Link } from "react-router-dom";
import { Mail, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import Seo from "../components/layout/Seo";

export default function About() {
  return (
    <div className="mz-section max-w-5xl py-12 sm:py-16">
      <Seo
        path="/about"
        title="About MZ Smart Tool House"
        description="Learn about MZ Smart Tool House, created and developed by Muhammad Mujtaba, and get direct contact information."
      />

      <section className="overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-cyan-50 p-6 shadow-soft sm:p-10 dark:border-brand-900/50 dark:from-brand-950/30 dark:via-navy-950 dark:to-cyan-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 dark:border-brand-800 dark:bg-navy-900/70 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" /> About the platform
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-navy-950 sm:text-5xl dark:text-white">
              MZ Smart Tool House
            </h1>
            <p className="mt-4 text-base leading-7 text-navy-600 dark:text-navy-300">
              A browser-first digital productivity platform that brings useful tools for documents, study, programming, calculations, images, science, engineering and everyday work into one focused workspace.
            </p>
          </div>
          <div className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-navy-800 dark:bg-navy-900/80">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white"><UserRound className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy-400">Created &amp; developed by</p>
                <h2 className="text-lg font-black text-navy-950 dark:text-white">Muhammad Mujtaba</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <section className="mz-card p-6 sm:p-8">
          <h2 className="text-xl font-black text-navy-950 dark:text-white">Why MZ Smart Tool House exists</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-navy-600 dark:text-navy-300">
            <p>
              The platform was created to reduce the need to jump between many unrelated websites for common tasks. Instead, MZ Smart Tool House organizes practical tools in one consistent interface that works across phones, tablets and desktop browsers.
            </p>
            <p>
              Wherever practical, file-based tools process data locally in the browser. Features that genuinely require online services use explicit server-backed paths rather than pretending a result was created locally.
            </p>
            <p>
              The project is actively developed and improved with a focus on clear workflows, mobile usability, privacy-conscious processing and dependable exports.
            </p>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p><strong>Product direction:</strong> useful tools should be understandable, testable and honest about what is processed locally and what requires an online service.</p>
          </div>
        </section>

        <aside className="mz-card p-6 sm:p-7">
          <h2 className="text-lg font-black text-navy-950 dark:text-white">Developer contact</h2>
          <p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">For feedback, bug reports, tool requests or project enquiries.</p>

          <div className="mt-5 space-y-3">
            <a href="mailto:mujtaba31202@gmail.com" className="flex items-center gap-3 rounded-2xl border border-navy-100 p-4 transition hover:border-brand-300 hover:bg-brand-50 dark:border-navy-800 dark:hover:border-brand-700 dark:hover:bg-brand-950/20">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300"><Mail className="h-5 w-5" /></span>
              <span className="min-w-0"><small className="block text-xs font-bold uppercase tracking-wide text-navy-400">Email</small><strong className="block break-all text-sm text-navy-800 dark:text-navy-100">mujtaba31202@gmail.com</strong></span>
            </a>
            <a href="tel:03704892504" className="flex items-center gap-3 rounded-2xl border border-navy-100 p-4 transition hover:border-brand-300 hover:bg-brand-50 dark:border-navy-800 dark:hover:border-brand-700 dark:hover:bg-brand-950/20">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"><Phone className="h-5 w-5" /></span>
              <span><small className="block text-xs font-bold uppercase tracking-wide text-navy-400">Contact</small><strong className="block text-sm text-navy-800 dark:text-navy-100">03704892504</strong></span>
            </a>
          </div>

          <Link to="/contact" className="mz-btn-primary mt-5 w-full justify-center">Open contact form</Link>
        </aside>
      </div>
    </div>
  );
}
