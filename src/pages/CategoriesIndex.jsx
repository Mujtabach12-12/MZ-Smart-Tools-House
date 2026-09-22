import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import Seo, { BASE_URL } from "../components/layout/Seo";
import ToolIcon from "../components/ui/ToolIcon";
import { categories } from "../data/categories";
import { getActiveToolsByCategory } from "../data/tools";
import { getFavoriteTools } from "../lib/localPreferences";
import Breadcrumbs from "../components/layout/Breadcrumbs";

export default function CategoriesIndex() {
  const [favoriteCount, setFavoriteCount] = useState(() => getFavoriteTools().length);
  useEffect(() => {
    const sync = () => setFavoriteCount(getFavoriteTools().length);
    window.addEventListener("mz-preferences-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("mz-preferences-change", sync); window.removeEventListener("storage", sync); };
  }, []);
  const schema = { "@context":"https://schema.org", "@type":"CollectionPage", name:"Tool Categories", description:"Browse MZ Smart Tool House categories and discover focused online tools.", url:`${BASE_URL}/categories`, breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:`${BASE_URL}/`},{"@type":"ListItem",position:2,name:"Categories",item:`${BASE_URL}/categories`}]}};
  return <div className="mz-section py-8 sm:py-12"><Seo path="/categories" title="Tool Categories" description="Browse MZ Smart Tool House categories for health, student, PDF, image, text, finance, converter and developer tools." schema={schema}/><Breadcrumbs items={[{label:"Categories"}]}/><header className="max-w-3xl"><span className="mz-eyebrow">Browse by category</span><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Find the right tool faster.</h1><p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">Explore focused collections of practical browser-based tools for study, work, documents and everyday tasks.</p></header><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <Link to="/tools?category=favorites" className="mz-card mz-card-hover p-4 sm:p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"><Heart className={`h-5 w-5 ${favoriteCount ? "fill-current" : ""}`}/></span><h2 className="mt-3 text-base font-bold">Favorite Tools</h2><p className="mt-1 text-sm leading-5 text-navy-500 dark:text-navy-400">Your personal collection. Tap the heart on any tool to add or remove it.</p><span className="mt-3 inline-flex text-xs font-semibold text-rose-600 dark:text-rose-300">{favoriteCount} favorite{favoriteCount===1?"":"s"}</span></Link>
    {categories.map(c=>{const count=getActiveToolsByCategory(c.slug).length;return <Link key={c.slug} to={c.route || `/categories/${c.slug}`} className="mz-card mz-card-hover p-4 sm:p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300"><ToolIcon name={c.icon} className="h-5 w-5"/></span><h2 className="mt-3 text-base font-bold">{c.name}</h2><p className="mt-1 text-sm leading-5 text-navy-500 dark:text-navy-400">{c.description}</p><span className="mt-3 inline-flex text-xs font-semibold text-brand-600 dark:text-brand-300">{count} tools</span></Link>})}
  </div></div>;
}
