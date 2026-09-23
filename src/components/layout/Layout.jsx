import { useEffect } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import CommandPalette from "../ui/CommandPalette";
import ErrorBoundary from "./ErrorBoundary";
import ViewportLock from "./ViewportLock";
import AnalyticsTracker from "../analytics/AnalyticsTracker";

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="mz-app-shell flex min-h-screen flex-col bg-white text-navy-900 dark:bg-navy-950 dark:text-navy-50">
      <ViewportLock />
      <AnalyticsTracker />
      <Header />
      <main className="flex-1">
        <ErrorBoundary><Outlet /></ErrorBoundary>
      </main>
      <Footer />
      <MobileBottomNav />
      <CommandPalette />
    </div>
  );
}
