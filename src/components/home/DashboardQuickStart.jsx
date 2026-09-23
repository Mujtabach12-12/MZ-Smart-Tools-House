import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { getToolById } from "../../data/tools";
import Tool3DIcon from "../ui/Tool3DIcon";

const ACTIONS=[
 ["Write Assignment","mz-online-word","Start a clean document"],
 ["Create Spreadsheet","mz-online-excel","Work with tables & formulas"],
 ["Create Presentation","mz-online-powerpoint","Build slides quickly"],
 ["Scan Document","smart-document-scanner","Camera or file scan"],
 ["Programming Lab","programming-lab","Write and run code"],
 ["World Clock","world-clock","Check global time"],
];
function greeting(){const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening";}
export default function DashboardQuickStart(){const[now,setNow]=useState(()=>new Date());useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);const times=useMemo(()=>[["Lahore","Asia/Karachi"],["London","Europe/London"],["New York","America/New_York"]].map(([city,zone])=>({city,time:new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit",timeZone:zone}).format(now)})),[now]);return <section className="mz-section py-8 sm:py-10"><div className="mz-dashboard-shell"><div className="mz-dashboard-light mz-dashboard-light-a" aria-hidden="true"/><div className="mz-dashboard-light mz-dashboard-light-b" aria-hidden="true"/><div className="relative z-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><span className="mz-eyebrow">YOUR PRODUCTIVITY DASHBOARD</span><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{greeting()}. Ready to get something done?</h2><p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">Jump straight into common work. Your recent and favorite tools stay on this device.</p></div><Link to="/tools" className="mz-btn-ghost">All tools <ArrowRight className="h-4 w-4"/></Link></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{ACTIONS.map(([label,id,helper])=>{const tool=getToolById(id);return tool?<Link key={id} to={tool.route} className="mz-dashboard-action"><Tool3DIcon tool={tool} size="sm"/><span className="min-w-0"><strong>{label}</strong><small>{helper}</small></span><ArrowRight className="mz-dashboard-action-arrow"/></Link>:null})}</div><div className="mz-dashboard-world-time"><span className="mr-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-400"><Clock3 className="h-4 w-4"/> World time</span>{times.map((item)=><span key={item.city} className="mz-dashboard-time-chip"><b>{item.city}</b> · <span className="tabular-nums">{item.time}</span></span>)}<Link to={getToolById("world-clock")?.route||"/tools/world-clock"} className="ml-auto text-xs font-bold text-brand-600">Manage cities →</Link></div></div></div></section>}
