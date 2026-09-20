import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, GraduationCap } from "lucide-react";
import Seo from "../components/layout/Seo";
import Breadcrumbs from "../components/layout/Breadcrumbs";
import ToolCard from "../components/ui/ToolCard";
import { getToolById } from "../data/tools";

const GROUPS=[
 {title:"Write & submit",ids:["mz-online-word","smart-document-scanner","pdf-compressor","mz-pdf-editor"]},
 {title:"Study & understand",ids:["mz-dictionary","study-notes-generator","flashcard-generator","quiz-generator"]},
 {title:"Calculate & plan",ids:["gpa-calculator","cgpa-calculator","attendance-calculator","study-hours-calculator"]},
 {title:"Create & present",ids:["mz-online-excel","mz-online-powerpoint","citation-generator","pomodoro-timer"]},
];
export default function StudentHub(){return <div className="mz-section py-8 sm:py-12"><Seo path="/student-hub" title="MZ Student Hub – Assignments, Study, GPA & Office Tools" description="A focused student productivity hub for assignments, scanning, PDF, dictionary, GPA, study planning, spreadsheets and presentations."/><Breadcrumbs items={[{label:"Student Hub"}]}/><section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 dark:border-emerald-950/60 dark:from-emerald-950/25 dark:via-navy-900 dark:to-teal-950/20 sm:p-9"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg"><GraduationCap className="h-8 w-8"/></span><div><span className="mz-eyebrow">Student productivity</span><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">MZ Student Hub</h1><p className="mt-3 max-w-3xl text-base leading-7 text-navy-600 dark:text-navy-300">From the first assignment page to the final compressed PDF: writing, reference, scanning, calculations, study planning and presentation tools are organized around student workflows.</p></div></div><div className="mt-6 flex flex-wrap gap-3"><Link className="mz-btn-primary" to="/tools/online-word">Write assignment <ArrowRight className="h-4 w-4"/></Link><Link className="mz-btn-secondary" to="/tools/dictionary"><BookOpenCheck className="h-4 w-4"/> Dictionary</Link></div></section>{GROUPS.map((group)=><section key={group.title} className="py-8"><h2 className="text-2xl font-extrabold">{group.title}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{group.ids.map(getToolById).filter(Boolean).map((tool)=><ToolCard key={tool.id} tool={tool}/>)}</div></section>)}</div>}
