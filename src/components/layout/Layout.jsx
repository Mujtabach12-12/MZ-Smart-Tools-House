import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import ErrorBoundary from "./ErrorBoundary";
import ViewportLock from "./ViewportLock";
import AnalyticsTracker from "../analytics/AnalyticsTracker";
import NetworkStatusOverlay from "../network/NetworkStatusOverlay";

const CommandPalette = lazy(() => import("../ui/CommandPalette"));
const MzAiRobot = lazy(() => import("../ai/MzAiRobot"));

export default function Layout() {
  const { pathname } = useLocation();
  const [assistantsReady, setAssistantsReady] = useState(false);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [pathname]);
  useEffect(() => {
    let timeout = 0; let idleId = 0; const show = () => setAssistantsReady(true);
    if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(show, { timeout: 1400 });
    else timeout = window.setTimeout(show, 900);
    return () => { if (idleId && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId); if (timeout) window.clearTimeout(timeout); };
  }, []);
  return (
    <div className="mz-app-shell flex min-h-screen flex-col bg-white text-navy-900 dark:bg-navy-950 dark:text-navy-50">
      <ViewportLock /><AnalyticsTracker /><NetworkStatusOverlay /><Header />
      <main className="flex-1"><ErrorBoundary><Outlet /></ErrorBoundary></main>
      <Footer />
      {assistantsReady ? <Suspense fallback={null}><button type="button" className="mz-ai-floating-assistant" aria-label="Search tools with MZ AI" title="Search tools with MZ AI" onClick={() => window.dispatchEvent(new CustomEvent("mz:open-command-palette", { detail: { query: "" } }))}><MzAiRobot mood="happy" /></button><CommandPalette /></Suspense> : null}
      <MobileBottomNav />
    </div>
  );
}
