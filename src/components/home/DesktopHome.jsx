import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Hero from "./Hero";
import CategoryRail from "./CategoryRail";
import DashboardQuickStart from "./DashboardQuickStart";
import PersonalTools from "./PersonalTools";

const DesktopBelowFold = lazy(() => import("./DesktopBelowFold"));

export default function DesktopHome(){
  const [showMore,setShowMore]=useState(false);
  const sentinelRef=useRef(null);

  useEffect(()=>{
    let timeout=0;
    let idleId=0;
    let observer;
    const reveal=()=>setShowMore(true);
    if("IntersectionObserver" in window && sentinelRef.current){
      observer=new IntersectionObserver((entries)=>{
        if(entries.some((entry)=>entry.isIntersecting)){reveal();observer?.disconnect()}
      },{rootMargin:"700px 0px"});
      observer.observe(sentinelRef.current);
    }
    if("requestIdleCallback" in window) idleId=window.requestIdleCallback(reveal,{timeout:2200});
    else timeout=window.setTimeout(reveal,1600);
    return()=>{observer?.disconnect();if(idleId&&"cancelIdleCallback" in window)window.cancelIdleCallback(idleId);if(timeout)window.clearTimeout(timeout)};
  },[]);

  return <><Hero/><DashboardQuickStart/><CategoryRail/><PersonalTools/><div ref={sentinelRef} className="h-px" aria-hidden="true"/>{showMore?<Suspense fallback={<div className="mz-section min-h-48" aria-hidden="true"/>}><DesktopBelowFold/></Suspense>:<div className="mz-section min-h-48" aria-hidden="true"/>}</>;
}
