import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, FolderKanban, ShieldCheck, Sparkles, Wrench, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { categories } from "../../data/categories";
import { getActiveTools, getToolById } from "../../data/tools";
import MzAiRobot from "../ai/MzAiRobot";
import Tool3DIcon from "../ui/Tool3DIcon";

const ACTIONS = [
  ["Write document","mz-online-word","Start writing in seconds"],
  ["Create sheet","mz-online-excel","Tables, formulas and data"],
  ["Build slides","mz-online-powerpoint","Create clear presentations"],
  ["Scan document","smart-document-scanner","Camera or file scanning"],
  ["Programming lab","programming-lab","Write and run code"],
  ["World clock","world-clock","Track city times quickly"],
];
const HIGHLIGHTS=["Fast browser tools","No sign-up","Private where local","Mobile ready"];

function greeting(){const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening"}
function openAiHelper(query=""){window.dispatchEvent(new CustomEvent("mz:open-command-palette",{detail:{query}}))}

export default function DashboardQuickStart(){
  const[now,setNow]=useState(()=>new Date());
  const activeTools=getActiveTools();
  const toolCount=activeTools.length;
  const categoryCount=categories.filter((category)=>activeTools.some((tool)=>tool.category===category.slug)).length;

  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
  const times=useMemo(()=>[["Lahore","Asia/Karachi"],["London","Europe/London"],["New York","America/New_York"]].map(([city,zone])=>({
    city,time:new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit",timeZone:zone}).format(now)
  })),[now]);

  return <section className="mz-section py-8 sm:py-10">
    <div className="mz-dashboard-shell">
      <div className="mz-dashboard-light mz-dashboard-light-a" aria-hidden="true"/><div className="mz-dashboard-light mz-dashboard-light-b" aria-hidden="true"/><div className="mz-dashboard-circuit" aria-hidden="true"/>
      <div className="relative z-10">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
          <div className="mz-dashboard-intro">
            <span className="mz-eyebrow">YOUR PRODUCTIVITY DASHBOARD</span>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{greeting()}. <span>Ready to get something done?</span></h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-navy-500 dark:text-navy-400">Jump straight into everyday work. Your recent tools and favorite shortcuts stay ready on this device.</p>
            <div className="mz-dashboard-highlight-row" aria-label="Platform highlights">{HIGHLIGHTS.map((item)=><span key={item}><Sparkles className="h-3.5 w-3.5"/>{item}</span>)}</div>
            <div className="mz-dashboard-tagline"><Zap className="h-4 w-4"/>Smart tools in one clean workspace.</div>
          </div>
          <aside className="mz-dashboard-ai-panel" aria-label="MZ AI assistant panel">
            <div className="mz-dashboard-ai-orb" aria-hidden="true"/>
            <button type="button" className="mz-dashboard-ai-head mz-dashboard-ai-head-button" onClick={()=>openAiHelper("")} title="Open MZ AI search" aria-label="Open MZ AI search">
              <MzAiRobot compact className="mz-dashboard-ai-robot" mood="cheerful" followCursor={false}/>
              <div className="min-w-0 text-left"><span className="mz-dashboard-ai-kicker">MZ AI</span><strong>Smart workspace guide</strong><p>Search tools quickly and jump straight into useful work.</p></div>
            </button>
            <div className="mz-dashboard-ai-stats"><span><Wrench className="h-3.5 w-3.5"/>{toolCount}+ tools</span><span><FolderKanban className="h-3.5 w-3.5"/>{categoryCount} categories</span><span><ShieldCheck className="h-3.5 w-3.5"/>Browser-first</span></div>
            <button type="button" onClick={()=>openAiHelper("")} className="mz-dashboard-ai-cta">Search tools <ArrowRight className="h-4 w-4"/></button>
          </aside>
        </div>
        <div className="mz-dashboard-actions-grid mt-5">{ACTIONS.map(([label,id,helper])=>{const tool=getToolById(id);return tool?<Link key={id} to={tool.route} className="mz-dashboard-action"><Tool3DIcon tool={tool} size="sm"/><span className="min-w-0 mz-dashboard-action-copy"><strong>{label}</strong><small>{helper}</small></span><ArrowRight className="mz-dashboard-action-arrow"/></Link>:null})}</div>
        <div className="mz-dashboard-world-time"><span className="mr-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-400"><Clock3 className="h-4 w-4"/>World time</span>{times.map((item)=><span key={item.city} className="mz-dashboard-time-chip"><b>{item.city}</b> · <span className="tabular-nums">{item.time}</span></span>)}<Link to={getToolById("world-clock")?.route||"/tools/world-clock/"} className="ml-auto text-xs font-bold text-brand-600">Manage cities →</Link></div>
      </div>
    </div>
  </section>;
}
