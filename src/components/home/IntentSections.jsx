import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getToolById } from "../../data/tools";
import ToolCard from "../ui/ToolCard";

const sections = [
  { title:"MZ Office", subtitle:"Create documents, spreadsheets and presentations or edit PDFs in one connected workspace.", ids:["mz-online-word","mz-online-excel","mz-online-powerpoint","mz-pdf-editor"] },
  { title:"Student Essentials", subtitle:"Write, look up words, calculate and plan without hunting through the full directory.", ids:["mz-online-word","mz-dictionary","gpa-calculator","attendance-calculator"] },
  { title:"PDF & Documents", subtitle:"Common document workflows with real browser processing where practical.", ids:["pdf-compressor","pdf-merger","pdf-splitter","smart-document-scanner"] },
  { title:"Image Tools", subtitle:"Fast local image processing for everyday tasks.", ids:["image-compressor","image-resizer","image-cropper","jpg-to-png"] },
  { title:"Programming", subtitle:"A real browser JavaScript sandbox plus a secure backend contract for compiled languages.", ids:["programming-lab","json-formatter","regex-tester","base64-encoder"] },
  { title:"AI Tools", subtitle:"Server-backed AI only—provider secrets never belong in the frontend.", ids:["ai-writing-assistant"] },
  { title:"Calculators", subtitle:"Focused formulas with validation and clear results.", ids:["percentage-calculator","age-calculator","discount-calculator","average-calculator"] },
  { title:"Business Tools", subtitle:"Finance and planning helpers for practical decisions.", ids:["budget-planner","loan-payment-calculator","profit-margin-calculator","salary-breakdown-calculator"] },
  { title:"Scientific Tools", subtitle:"Validated formulas for physics, chemistry, biology and mathematics learning.", ids:["force-calculator","molarity-calculator","hardy-weinberg-calculator","quadratic-equation-calculator"] },
  { title:"Engineering & Robotics", subtitle:"Practical mechanical, electronics, civil and robotics calculations with visible formulas.", ids:["voltage-divider-calculator","stress-calculator","gear-ratio-calculator","battery-runtime-calculator"] },
  { title:"Health Tools", subtitle:"Informational health and fitness calculations with clear limitations.", ids:["bmi-calculator","bmr-calculator","heart-rate-zone-calculator","pregnancy-due-date-calculator"] },
  { title:"Developer Tools", subtitle:"Format, validate, encode and debug common developer data.", ids:["json-validator","hash-generator","url-encoder","uuid-generator"] },
];

export default function IntentSections(){
  return <div className="space-y-2 py-6 sm:py-10">{sections.map((section)=>{const items=section.ids.map(getToolById).filter(Boolean);if(!items.length)return null;return <section key={section.title} className="mz-section py-9 sm:py-12"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-extrabold tracking-tight text-navy-900 dark:text-white">{section.title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-navy-500 dark:text-navy-400">{section.subtitle}</p></div><Link to="/tools" className="mz-btn-ghost">View all tools <ArrowRight className="h-4 w-4"/></Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map((tool)=><ToolCard key={tool.id} tool={tool}/>)}</div></section>})}</div>;
}
