import { lazy, Suspense, useEffect, useState } from "react";
import Seo from "../components/layout/Seo";
import MobileHome from "../components/home/MobileHome";
const DesktopHome = lazy(() => import("../components/home/DesktopHome"));
function useMobileLayout(){const [mobile,setMobile]=useState(()=>typeof window!=="undefined"&&window.matchMedia("(max-width: 767px)").matches);useEffect(()=>{const media=window.matchMedia("(max-width: 767px)");const update=()=>setMobile(media.matches);update();media.addEventListener?.("change",update);return()=>media.removeEventListener?.("change",update)},[]);return mobile}
function HomeFallback(){return <div className="mz-section py-6" role="status" aria-live="polite"><div className="min-h-[520px] rounded-3xl bg-brand-50/45 dark:bg-navy-900/45 sm:min-h-[650px] lg:min-h-[720px]" /></div>}
export default function Home(){const mobile=useMobileLayout();return <><Seo path="/" title="Free Online Tools for Work & Study" description="Use free online tools for PDF, documents, images, study, coding, calculators and everyday work in one browser-based MZ Smart Tools House workspace."/><Suspense fallback={<HomeFallback />}>{mobile?<MobileHome/>:<DesktopHome/>}</Suspense></>}
