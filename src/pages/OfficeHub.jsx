import { Link } from "react-router-dom";
import { ArrowRight, Eye, FilePenLine, FileText, Presentation, Table2 } from "lucide-react";
import Seo, { BASE_URL } from "../components/layout/Seo";
import Breadcrumbs from "../components/layout/Breadcrumbs";
import ToolCard from "../components/ui/ToolCard";
import { getToolById } from "../data/tools";

const OFFICE_IDS=["mz-online-word","mz-online-excel","mz-online-powerpoint","mz-powerpoint-viewer","mz-pdf-viewer","mz-pdf-editor"];
const TEMPLATES=[
 {name:"University Assignment",tool:"mz-online-word",detail:"Cover page + editable assignment structure"},
 {name:"Study Spreadsheet",tool:"mz-online-excel",detail:"Track marks, attendance or project data"},
 {name:"Research Presentation",tool:"mz-online-powerpoint",detail:"Editable research presentation starter"},
 {name:"View PowerPoint",tool:"mz-powerpoint-viewer",detail:"Open PPTX text/images in a compatibility viewer"},
 {name:"Open & Read PDF",tool:"mz-pdf-viewer",detail:"Thumbnails, zoom, search, fullscreen and print"},
 {name:"Edit & Organize PDF",tool:"mz-pdf-editor",detail:"Manage pages and export a revised PDF"},
];
export default function OfficeHub(){
 const tools=OFFICE_IDS.map(getToolById).filter(Boolean);
 const schema={"@context":"https://schema.org","@type":"CollectionPage",name:"MZ Office",description:"Create documents, spreadsheets, presentations and edit PDFs in MZ Smart Tool House.",url:`${BASE_URL}/office`};
 return <div className="mz-section py-8 sm:py-12"><Seo path="/office" title="MZ Office – Online Word, Excel, PowerPoint & PDF Editor" description="Create assignments, spreadsheets and presentations, or edit PDFs in one browser-based MZ Office workspace." schema={schema}/><Breadcrumbs items={[{label:"MZ Office"}]}/>
  <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-soft dark:border-blue-950/60 dark:from-blue-950/25 dark:via-navy-900 dark:to-indigo-950/20 sm:p-9"><div className="grid items-center gap-7 lg:grid-cols-[1fr_.8fr]"><div><span className="mz-eyebrow">Unified productivity</span><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">MZ Office</h1><p className="mt-4 max-w-2xl text-base leading-7 text-navy-600 dark:text-navy-300">Write assignments, work with spreadsheets, build presentations and edit PDFs without jumping between unrelated websites. Each workspace autosaves locally where supported and exports real files.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="mz-btn-primary" to={tools[0]?.route||"/tools"}>Create document <ArrowRight className="h-4 w-4"/></Link><Link className="mz-btn-secondary" to="/office-tools">Browse Office tools</Link></div></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-2">{[[FileText,"Word","Assignments & reports"],[Table2,"Excel","Sheets & formulas"],[Presentation,"PowerPoint","Presentations"],[Eye,"PDF Viewer","Read, search & print"],[FilePenLine,"PDF Editor","Pages & annotations"]].map(([Icon,name,detail])=><div key={name} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-navy-700 dark:bg-navy-900/80"><Icon className="h-6 w-6 text-brand-600"/><strong className="mt-3 block">{name}</strong><span className="mt-1 block text-xs text-navy-500">{detail}</span></div>)}</div></div></section>
  <section className="py-10"><div className="mz-section-heading"><div><h2>Create something</h2><p>Open a full workspace rather than a demo-sized widget.</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">{tools.map((tool)=><ToolCard key={tool.id} tool={tool}/>)}</div></section>
  <section className="pb-6"><h2 className="text-2xl font-extrabold">Templates & starting points</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{TEMPLATES.map((item)=>{const tool=getToolById(item.tool);return <Link key={item.name} to={tool?.route||"/tools"} className="mz-card mz-card-hover flex items-center justify-between gap-4 p-5"><div><strong>{item.name}</strong><p className="mt-1 text-sm text-navy-500">{item.detail}</p></div><ArrowRight className="h-4 w-4 text-brand-600"/></Link>})}</div></section>
 </div>;
}
