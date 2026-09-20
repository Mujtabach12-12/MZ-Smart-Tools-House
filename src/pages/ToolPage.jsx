import { Link, useParams } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { Construction } from "lucide-react";
import Seo, { BASE_URL } from "../components/layout/Seo";
import ToolExtras from "../components/tools/ToolExtras";
import ToolPageLayout from "../components/tools/premium/ToolPageLayout";
import ToolWorkspace from "../components/tools/premium/ToolWorkspace";
import { getToolBySlug } from "../data/tools";
import toolComponents from "../tools";
import NotFound from "./NotFound";
import { addRecentTool } from "../lib/localPreferences";
import { getToolSeo } from "../data/toolSeo";

const FILE_TOOL_CATEGORIES = new Set(["pdf-tools", "image-tools", "scanner-tools", "document-tools", "office-tools"]);
const APP_WORKSPACES = new Set([
  "mz-online-word", "mz-online-excel", "mz-online-powerpoint", "mz-pdf-editor", "mz-pdf-viewer", "mz-powerpoint-viewer",
  "smart-document-scanner", "programming-lab",
]);

export default function ToolPage() {
 const {toolId}=useParams(); const tool=getToolBySlug(toolId);
 useEffect(() => { if (tool) { addRecentTool(tool.id); window.dispatchEvent(new Event("mz-preferences-change")); } }, [tool?.id]);
 if(!tool)return <NotFound/>;
 const ActiveComponent=tool.status==="active"?toolComponents[tool.id]:null;
 const missingImplementation = tool.status === "active" && !ActiveComponent;
 const seo = getToolSeo(tool);
 const faq = (seo.faq || []).map(([q,a]) => ({q,a}));
 const schema = {
   "@context": "https://schema.org",
   "@graph": [
     {
       "@type": "WebPage",
       name: `${tool.name} | MZ Smart Tool House`,
       description: tool.description,
       url: `${BASE_URL}${tool.route}`,
       isPartOf: { "@type": "WebSite", name: "MZ Smart Tool House", url: BASE_URL },
     },
     {
       "@type": "WebApplication",
       name: tool.name,
       description: tool.description,
       url: `${BASE_URL}${tool.route}`,
       applicationCategory: "UtilitiesApplication",
       operatingSystem: "Any",
       offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
       isAccessibleForFree: true,
     },
     {
       "@type": "BreadcrumbList",
       itemListElement: [
         { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
         { "@type": "ListItem", position: 2, name: tool.category.replace(/-/g, " "), item: `${BASE_URL}${tool.categoryRoute || `/categories/${tool.category}`}` },
         { "@type": "ListItem", position: 3, name: tool.name, item: `${BASE_URL}${tool.route}` },
       ],
     },
     ...(faq.length ? [{
       "@type": "FAQPage",
       mainEntity: faq.map((item) => ({
         "@type": "Question",
         name: item.q,
         acceptedAnswer: { "@type": "Answer", text: item.a },
       })),
     }] : []),
   ],
 };
 return <>
   <Seo path={tool.route} title={seo.title} description={seo.description} type="article" schema={schema}/>
   <ToolPageLayout tool={tool}>
    {ActiveComponent ? <ToolWorkspace className={APP_WORKSPACES.has(tool.id) ? "mz-app-workspace" : ""}><Suspense fallback={<div className="mz-tool-loading" role="status">Loading tool workspace…</div>}><ActiveComponent id={tool.id} tool={tool}/></Suspense></ToolWorkspace> :
      <ToolWorkspace className="min-h-[360px] flex flex-col items-center justify-center text-center">
       <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300"><Construction className="h-7 w-7"/></span>
       <h2 className="mt-5 text-xl font-bold text-navy-900 dark:text-white">{tool.status === "coming-soon" ? "Coming Soon 🚀" : "Tool temporarily unavailable"}</h2>
       <p className="mt-2 max-w-md text-sm leading-6 text-navy-500 dark:text-navy-400">{tool.status === "coming-soon" ? "We’re building this carefully so it works properly. Thanks for your patience — please check back soon." : missingImplementation ? "This tool is registered but its implementation is missing from this build. Please use Feedback to report this issue." : "This tool is not currently enabled in the production registry."}</p>
       <Link to="/tools" className="mz-btn-primary mt-5">Browse available tools</Link>
      </ToolWorkspace>}
    <div className="mt-8"><ToolExtras toolId={tool.id} category={tool.category} showPrivacyNote={FILE_TOOL_CATEGORIES.has(tool.category)} howTo={[`Open ${tool.name}.`,"Enter the required information and review the options.","Run the tool and review, copy or download the result."]} faq={faq} seo={seo}/></div>
   </ToolPageLayout>
 </>;
}
