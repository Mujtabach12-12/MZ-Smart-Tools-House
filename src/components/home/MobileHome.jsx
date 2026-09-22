import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  Calculator,
  Code2,
  FileText,
  Grid2X2,
  Image as ImageIcon,
  ScanLine,
  Sparkles,
  Heart,
  Wrench,
} from "lucide-react";
import SearchBar from "../ui/SearchBar";
import ToolIcon from "../ui/ToolIcon";
import { categories } from "../../data/categories";
import { getActiveTools, getPopularTools, getToolById } from "../../data/tools";
import { getFavoriteTools, getRecentTools } from "../../lib/localPreferences";

const quickTools = [
  ["Scan", "smart-document-scanner", ScanLine, "mint"],
  ["Compress PDF", "pdf-compressor", FileText, "blue"],
  ["Write", "mz-online-word", BookOpenText, "violet"],
  ["Convert", "length-converter", Wrench, "amber"],
];

const categorySlugs = [
  "office-tools",
  "pdf-tools",
  "image-tools",
  "student-tools",
  "programming-tools",
  "converter-tools",
];

function ToolRow({ tool }) {
  if (!tool) return null;
  return (
    <Link to={tool.route || `/tools/${tool.id}`} className="mz-mobile-tool-row">
      <span className="mz-mobile-tool-row-icon"><ToolIcon name={tool.icon} /></span>
      <span className="min-w-0 flex-1">
        <strong>{tool.name}</strong>
        <small>{tool.description}</small>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0" />
    </Link>
  );
}

export default function MobileHome() {
  const [recent, setRecent] = useState(() => getRecentTools());
  const [favorites, setFavorites] = useState(() => getFavoriteTools());
  const toolCount = getActiveTools().length;
  const categoryCount = categories.length;
  const featured = useMemo(() => getPopularTools().filter((tool) => tool.status === "active").slice(0, 5), []);
  const homeCategories = useMemo(() => categorySlugs.map((slug) => categories.find((item) => item.slug === slug)).filter(Boolean), []);
  const recentTools = recent.map(getToolById).filter(Boolean).slice(0, 4);
  const favoriteTools = favorites.map(getToolById).filter(Boolean).slice(0, 4);

  useEffect(() => {
    const sync = () => {
      setRecent(getRecentTools());
      setFavorites(getFavoriteTools());
    };
    window.addEventListener("mz-preferences-change", sync);
    return () => window.removeEventListener("mz-preferences-change", sync);
  }, []);

  return (
    <div className="mz-mobile-home md:hidden">
      <section className="mz-mobile-hero-card">
        <div className="mz-mobile-hero-glow" aria-hidden="true" />
        <div className="relative z-10">
          <span className="mz-mobile-kicker"><Sparkles className="h-3.5 w-3.5" /> SMART TOOL HOUSE</span>
          <h1>Everything you need.<br /><span>One smart app.</span></h1>
          <p>Work, study, scan, convert and create without jumping between different websites.</p>
          <div className="mt-5"><SearchBar size="lg" placeholder="Search tools, PDFs, calculators…" /></div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {quickTools.map(([label, id, Icon, tone]) => {
              const tool = getToolById(id);
              if (!tool) return null;
              return (
                <Link key={id} to={tool.route} className={`mz-mobile-quick-card tone-${tone}`}>
                  <span><Icon className="h-5 w-5" /></span>
                  <strong>{label}</strong>
                  <small>Open tool</small>
                </Link>
              );
            })}
          </div>
          <div className="mz-mobile-stats">
            <span><b>{toolCount}</b> active tools</span>
            <i />
            <span><b>{categoryCount}</b> categories</span>
            <i />
            <span>Browser-first</span>
          </div>
        </div>
      </section>

      <section className="mz-mobile-block">
        <div className="mz-mobile-section-head">
          <div><span>EXPLORE</span><h2>Popular categories</h2></div>
          <Link to="/categories">See all</Link>
        </div>
        <div className="mz-mobile-category-grid">
          {homeCategories.map((category) => (
            <Link key={category.slug} to={category.route || `/categories/${category.slug}`} className="mz-mobile-category-card">
              <span><ToolIcon name={category.icon} /></span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="mz-mobile-block">
        <div className="mz-mobile-section-head">
          <div><span>START FAST</span><h2>Popular tools</h2></div>
          <Link to="/tools?popular=true">See all</Link>
        </div>
        <div className="space-y-2.5">
          {featured.map((tool) => <ToolRow key={tool.id} tool={tool} />)}
        </div>
      </section>

      {recentTools.length > 0 ? (
        <section className="mz-mobile-block">
          <div className="mz-mobile-section-head"><div><span>CONTINUE</span><h2>Recently used</h2></div></div>
          <div className="mz-mobile-chip-scroll">
            {recentTools.map((tool) => (
              <Link key={tool.id} to={tool.route} className="mz-mobile-history-chip">
                <ToolIcon name={tool.icon} /><span>{tool.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {favoriteTools.length > 0 ? (
        <section className="mz-mobile-block">
          <div className="mz-mobile-section-head"><div><span>PINNED</span><h2>Favorites</h2></div><Heart className="h-4 w-4 fill-current text-rose-500" /></div>
          <div className="space-y-2.5">{favoriteTools.map((tool) => <ToolRow key={tool.id} tool={tool} />)}</div>
        </section>
      ) : null}

      <section className="mz-mobile-discover-card">
        <div className="mz-mobile-discover-icon"><Grid2X2 /></div>
        <div className="min-w-0 flex-1"><strong>Need something else?</strong><p>Browse all tools by category or search by task.</p></div>
        <Link to="/tools" aria-label="Browse all tools"><ArrowRight /></Link>
      </section>

      <div className="mz-mobile-feature-strip" aria-label="Platform highlights">
        <span><FileText /> Documents</span>
        <span><ImageIcon /> Images</span>
        <span><Code2 /> Code</span>
        <span><Calculator /> Calculators</span>
      </div>
    </div>
  );
}
