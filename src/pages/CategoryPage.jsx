import { Link, useParams } from "react-router-dom";
import Seo, { BASE_URL } from "../components/layout/Seo";
import ToolCard from "../components/ui/ToolCard";
import ToolIcon from "../components/ui/ToolIcon";
import Breadcrumbs from "../components/layout/Breadcrumbs";
import { getCategoryBySlug, categories } from "../data/categories";
import { getActiveToolsByCategory } from "../data/tools";
import NotFound from "./NotFound";

export default function CategoryPage({slugOverride}){
 const params=useParams(); const slug=slugOverride||params.slug; const category=getCategoryBySlug(slug); if(!category)return <NotFound/>;
 const list=getActiveToolsByCategory(slug); const others=categories.filter(c=>c.slug!==slug); const route=category.route||`/categories/${slug}`;
 const schema={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage",name:category.name,description:category.description,url:`${BASE_URL}${route}`,mainEntity:{"@type":"ItemList",numberOfItems:list.length,itemListElement:list.map((tool,index)=>({"@type":"ListItem",position:index+1,name:tool.name,url:`${BASE_URL}${tool.route}`}))}},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:`${BASE_URL}/`},{"@type":"ListItem",position:2,name:category.name,item:`${BASE_URL}${route}`}]}]};
 return <div className="mz-section py-8 sm:py-12"><Seo path={route} title={`${category.name} – Online Tools`} description={`${category.description} Explore ${list.length} focused tools at MZ Smart Tool House.`} schema={schema} robots={category.seoIndexable === false ? "noindex,follow" : undefined}/><Breadcrumbs items={[{label:category.name}]}/>
  <section className={`mz-category-hero mz-category-${category.accent||"blue"} mb-10 overflow-hidden rounded-3xl border p-6 sm:p-9`}><div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="mz-category-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"><ToolIcon name={category.icon} className="h-7 w-7"/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] opacity-70">Category</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{category.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-navy-600 dark:text-navy-300">{category.description}</p></div></div><div className="rounded-2xl border border-white/70 bg-white/70 px-5 py-4 text-center shadow-sm backdrop-blur dark:border-navy-700/70 dark:bg-navy-900/70"><div className="text-2xl font-extrabold">{list.length}</div><div className="text-xs text-navy-500">tools available</div></div></div></section>
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Tools in {category.name}</h2><p className="mt-1 text-sm text-navy-500 dark:text-navy-400">Choose a tool and start working. Heavy libraries load only after you open the relevant workspace.</p></div><Link to="/tools" className="mz-btn-ghost">Search all tools</Link></div>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{list.map(t=><ToolCard key={t.id} tool={t}/>)}</div>
  <div className="mt-14"><h2 className="text-xl font-bold">Explore other categories</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{others.slice(0,8).map(c=><Link key={c.slug} to={c.route||`/categories/${c.slug}`} className="mz-card mz-card-hover p-4"><div className="font-semibold">{c.name}</div><div className="mt-1 text-xs leading-5 text-navy-500 dark:text-navy-400">{c.description}</div></Link>)}</div></div>
 </div>
}
