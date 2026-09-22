import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CheckCircle2, ChevronDown, Download, Home, Menu, MessageCircle, X } from "lucide-react";
import { categories } from "../../data/categories";
import SearchBar from "../ui/SearchBar";
import ThemeToggle from "../ui/ThemeToggle";
import ToolIcon from "../ui/ToolIcon";
import FeedbackDialog from "../ui/FeedbackDialog";
import BrandMark from "../brand/BrandMark";
import ViewScaleControl from "../ui/ViewScaleControl";

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
      <header className="mz-app-header sticky top-0 z-50 border-b border-white/70 bg-white/94 backdrop-blur-2xl dark:border-navy-800/70 dark:bg-navy-950/94">
        <div className="mz-section flex min-h-[4rem] w-full items-center gap-2 py-2 sm:min-h-[4.5rem]">
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
            aria-label="MZ Smart Tool House home"
          >
            <BrandMark compact className="shrink-0" />
            <span className="mz-brand-wordmark min-w-0">
              <strong>MZ</strong>
              <span>Smart Tool House</span>
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
          <ViewScaleControl compact className="hidden lg:flex" />
          <ThemeToggle className="hidden sm:inline-flex" />

          {!pwa.installed ? (
            <button
              type="button"
              className="mz-mobile-install-btn ml-auto xl:hidden"
              onClick={install}
              aria-label="Install MZ Smart Tool House app"
              title="Install App"
            >
              <Download className="h-4 w-4" />
              <span>Install</span>
            </button>
          ) : <span className="ml-auto xl:hidden" />}

          <button className="mz-mobile-menu-btn xl:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="mz-mobile-menu-panel border-t border-navy-100 bg-white px-4 py-4 shadow-lg dark:border-navy-800 dark:bg-navy-950 xl:hidden">
            <div className="mz-section !px-0">
              <div className="mb-3"><SearchBar size="sm" placeholder="Search all tools…" /></div>
              {!pwa.installed ? (
                <button type="button" onClick={() => { install(); setMobileOpen(false); }} className="mz-mobile-menu-install">
                  <span><Download className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1 text-left"><strong>Install MZ Smart Tool House</strong><small>Launch it from your home screen like an app.</small></span>
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              ) : null}

              <div className="max-h-[54vh] overflow-y-auto overscroll-contain pr-1">
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
                {!pwa.installed ? <button className="mz-btn-secondary w-full" onClick={() => { install(); setMobileOpen(false); }}><Download className="h-4 w-4" /> Install App</button> : null}
              </div>
              <div className="mt-3 grid gap-2 rounded-xl border border-navy-100 px-3 py-3 dark:border-navy-800"><div className="flex items-center justify-between"><span className="text-sm font-medium">Appearance</span><ThemeToggle /></div><div className="flex items-center justify-between gap-3 border-t border-navy-100 pt-2 dark:border-navy-800"><span className="text-xs font-semibold text-navy-500 dark:text-navy-400">Page zoom</span><ViewScaleControl compact /></div></div>
            </div>
          </div>
        ) : null}
      </header>
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
