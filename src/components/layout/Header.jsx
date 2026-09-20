import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CheckCircle2, ChevronDown, Download, Home, Menu, MessageCircle, X } from "lucide-react";
import { categories } from "../../data/categories";
import SearchBar from "../ui/SearchBar";
import ThemeToggle from "../ui/ThemeToggle";
import ToolIcon from "../ui/ToolIcon";
import FeedbackDialog from "../ui/FeedbackDialog";

const PRIMARY = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tools", label: "Tools" },
  { to: "/categories", label: "Categories" },
  { to: "/office", label: "MZ Office" },
  { to: "/programming-tools", label: "Programming" },
  { to: "/student-hub", label: "Student" },
  { to: "/ai-tools", label: "AI" },
];
const PRIMARY_CATEGORY_SLUGS = new Set(["office-tools", "programming-tools", "student-tools", "ai-tools"]);

export default function Header() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pwa, setPwa] = useState({ available: false, installed: false });

  useEffect(() => {
    const onPwaState = (event) => setPwa((value) => ({ ...value, ...(event.detail || {}) }));
    const openFeedback = () => setFeedbackOpen(true);
    window.addEventListener("mz-pwa-state", onPwaState);
    window.addEventListener("mz-feedback-open", openFeedback);
    return () => {
      window.removeEventListener("mz-pwa-state", onPwaState);
      window.removeEventListener("mz-feedback-open", openFeedback);
    };
  }, []);

  const secondary = categories.filter((category) => !PRIMARY_CATEGORY_SLUGS.has(category.slug));
  const installLabel = pwa.installed ? "Installed" : "Install App";
  const InstallIcon = pwa.installed ? CheckCircle2 : Download;
  const install = () => window.dispatchEvent(new Event("mz-pwa-install-request"));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/90 backdrop-blur-2xl dark:border-navy-800/70 dark:bg-navy-950/90">
        <div className="mz-section flex min-h-[4rem] items-center gap-2 py-2 sm:min-h-[4.5rem]">
          <Link
            to="/"
            className="group flex min-w-0 max-w-[58vw] items-center gap-2.5 sm:max-w-none"
            onClick={() => setMobileOpen(false)}
            aria-label="MZ Smart Tool House home"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/20 transition group-hover:-translate-y-0.5">
              <img src="/icons/icon-192.png" width="40" height="40" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0 truncate text-sm font-extrabold tracking-tight text-navy-950 sm:text-base dark:text-white">
              MZ <span className="text-brand-600 dark:text-brand-400">Smart Tool House</span>
            </span>
          </Link>

          <nav className="ml-2 hidden flex-1 items-center gap-0.5 xl:flex" aria-label="Primary navigation">
            {PRIMARY.map((link) => (
              <NavLink
                end={link.to === "/"}
                key={link.to}
                to={link.to}
                className={({ isActive }) => `rounded-xl px-2.5 py-2 text-sm font-semibold transition ${isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "text-navy-600 hover:bg-brand-50/80 hover:text-brand-700 dark:text-navy-300 dark:hover:bg-navy-900"}`}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="relative" onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
              <button className="flex items-center gap-1 rounded-xl px-2.5 py-2 text-sm font-semibold text-navy-600 hover:bg-brand-50 dark:text-navy-300 dark:hover:bg-navy-900" aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}>
                More <ChevronDown className="h-4 w-4" />
              </button>
              {moreOpen ? (
                <div className="absolute left-1/2 top-full z-50 mt-2 max-h-[70vh] w-[min(900px,80vw)] -translate-x-1/2 overflow-auto rounded-2xl border border-navy-100 bg-white/98 p-3 shadow-2xl dark:border-navy-800 dark:bg-navy-900/98">
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                    {secondary.map((category) => (
                      <Link key={category.slug} to={category.route || `/categories/${category.slug}`} onClick={() => setMoreOpen(false)} className="flex gap-3 rounded-xl p-3 hover:bg-brand-50 dark:hover:bg-navy-800">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950"><ToolIcon name={category.icon} className="h-4 w-4" /></span>
                        <span><strong className="block text-sm">{category.name}</strong><small className="mt-1 line-clamp-1 block text-xs text-navy-400">{category.description}</small></span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </nav>

          <div className="ml-auto hidden w-[min(22vw,18rem)] 2xl:block"><SearchBar size="sm" placeholder="Search tools…" /></div>
          <button className="mz-btn-ghost hidden lg:inline-flex" onClick={() => setFeedbackOpen(true)}><MessageCircle className="h-4 w-4" /> Feedback</button>
          <button className="mz-btn-ghost hidden lg:inline-flex" onClick={install}><InstallIcon className="h-4 w-4" /> {installLabel}</button>
          <ThemeToggle className="hidden sm:inline-flex" />

          <button
            type="button"
            className={`mz-mobile-install-btn xl:hidden ${pwa.installed ? "is-installed" : ""}`}
            onClick={install}
            aria-label={installLabel}
            title={installLabel}
          >
            <InstallIcon className="h-4 w-4" />
            <span className="hidden min-[430px]:inline">{pwa.installed ? "Installed" : "Install"}</span>
          </button>

          <button className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-navy-200/80 bg-white/80 text-navy-600 shadow-sm xl:hidden dark:border-navy-700 dark:bg-navy-900/80 dark:text-navy-300" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className="mz-section pb-2.5 2xl:hidden"><SearchBar size="sm" placeholder="Search 300+ tools…" /></div>

        {mobileOpen ? (
          <div className="border-t border-navy-100 bg-white px-4 py-4 shadow-lg dark:border-navy-800 dark:bg-navy-950 xl:hidden">
            <div className="mz-section !px-0">
              {!pwa.installed ? (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-3 dark:border-brand-900/60 dark:bg-brand-950/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"><Download className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-extrabold">Get the MZ app</p><p className="mt-0.5 text-xs text-navy-500 dark:text-navy-400">Add MZ Smart Tool House to your home screen.</p></div>
                  <button className="mz-btn-primary !min-h-10 !px-3" onClick={() => { install(); setMobileOpen(false); }}>Install</button>
                </div>
              ) : null}

              <div className="max-h-[52vh] overflow-y-auto overscroll-contain pr-1">
                <div className="grid gap-1 sm:grid-cols-2">
                  {PRIMARY.map((link) => (
                    <NavLink key={link.to} end={link.to === "/"} to={link.to} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-navy-700 hover:bg-brand-50 dark:text-navy-200 dark:hover:bg-navy-900">{link.label}</NavLink>
                  ))}
                  {secondary.map((category) => (
                    <NavLink key={category.slug} to={category.route || `/categories/${category.slug}`} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-navy-700 hover:bg-brand-50 dark:text-navy-200 dark:hover:bg-navy-900">{category.name}</NavLink>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button className="mz-btn-secondary w-full" onClick={() => { setFeedbackOpen(true); setMobileOpen(false); }}><MessageCircle className="h-4 w-4" /> Feedback</button>
                <button className="mz-btn-secondary w-full" onClick={() => { install(); setMobileOpen(false); }}><InstallIcon className="h-4 w-4" /> {installLabel}</button>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-navy-100 px-3 py-3 dark:border-navy-800"><span className="text-sm font-medium">Appearance</span><ThemeToggle /></div>
            </div>
          </div>
        ) : null}
      </header>
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
