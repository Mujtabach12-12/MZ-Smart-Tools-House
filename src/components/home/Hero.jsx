import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Sparkles, FileText, Image as ImageIcon, Code2, Calculator, CalendarCheck } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import { getToolById, getActiveTools } from "../../data/tools";
import { categories } from "../../data/categories";


const quickActions = [
  ["Compress PDF", "pdf-compressor"],
  ["Write Assignment", "mz-online-word"],
  ["Edit PDF", "mz-pdf-editor"],
  ["Create Presentation", "mz-online-powerpoint"],
  ["Create Spreadsheet", "mz-online-excel"],
  ["Run C++", "programming-lab", "?language=cpp"],
  ["Run Python", "programming-lab", "?language=python"],
  ["Check Word Meaning", "mz-dictionary"],
  ["Calculate GPA", "gpa-calculator"],
];

const floatingTools = [
  { label: "GPA Calculator", icon: Calculator, position: "tool-float-a" },
  { label: "PDF Tools", icon: FileText, position: "tool-float-b" },
  { label: "Image Compressor", icon: ImageIcon, position: "tool-float-c" },
  { label: "JSON Formatter", icon: Code2, position: "tool-float-d" },
  { label: "Attendance", icon: CalendarCheck, position: "tool-float-e" },
];

export default function Hero() {
  const toolCount = getActiveTools().length;
  const categoryCount = categories.length;
  return (
    <section className="mz-hero">
      <div className="mz-hero-grid" aria-hidden="true" />
      <div className="mz-hero-orb mz-hero-orb-a" aria-hidden="true" />
      <div className="mz-hero-orb mz-hero-orb-b" aria-hidden="true" />
      <div className="mz-section relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[.88fr_1.12fr] lg:gap-8">
          <div className="max-w-2xl">
            <div className="mz-hero-badge"><Sparkles className="h-3.5 w-3.5" /> SMART DIGITAL OFFICE <span>•</span> FREE TOOLS</div>
            <h1 className="mt-5 text-[2.65rem] font-black leading-[1.02] tracking-[-.055em] text-navy-950 sm:text-5xl lg:text-6xl dark:text-white">
              One digital workspace, <span className="mz-gradient-text">for every kind of work.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-navy-600 sm:text-lg dark:text-navy-300">
              Calculate, create, convert, study, code and get everyday work done across office, science, engineering, developer and productivity tools.
            </p>
            <div className="mt-7 max-w-2xl"><SearchBar placeholder="What do you want to do?" /></div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-navy-500 dark:text-navy-400" aria-label="Popular shortcuts">
              <span className="py-1.5 font-semibold">Quick:</span>
              {quickActions.map(([label,id,suffix=""]) => { const tool=getToolById(id); return tool ? <Link key={`${label}-${id}`} to={`${tool.route}${suffix}`} className="mz-example-pill">{label}</Link> : null; })}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/tools" className="mz-btn-primary mz-liquid-btn">Explore Tools <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/categories" className="mz-btn-secondary mz-liquid-btn">Browse Categories</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-xs font-semibold text-navy-500 dark:text-navy-400">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" /> {toolCount} active tools</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-600" /> {categoryCount} categories</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" /> Browser-first</span>
              <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-brand-600" /> No sign-up</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-600" /> Free to use</span>
            </div>
          </div>
          <div className="mz-hero-visual" aria-label="Modern smart office workspace with two professional colleagues working on laptops">
            <div className="mz-hero-scene-glow" aria-hidden="true" />
            <div className="mz-hero-scene">
              <img src="/assets/mz-smart-office-hero.webp" alt="Two professional colleagues working with laptops in a modern smart office" className="mz-hero-image" width="1536" height="1024" loading="eager" />
              <div className="mz-hero-scene-shine" aria-hidden="true" />
              {floatingTools.map(({ label, icon: Icon, position }) => <div key={label} className={`mz-floating-tool mz-floating-tool-premium ${position}`} aria-hidden="true"><Icon className="h-4 w-4 text-brand-600" /><span>{label}</span></div>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
