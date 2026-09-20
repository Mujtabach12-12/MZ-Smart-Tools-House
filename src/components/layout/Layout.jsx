import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import CommandPalette from "../ui/CommandPalette";
import ErrorBoundary from "./ErrorBoundary";

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-navy-900 dark:bg-navy-950 dark:text-navy-50">
      <Header />
      <main className="flex-1">
        <ErrorBoundary><Outlet /></ErrorBoundary>
      </main>
      <Footer />
      <CommandPalette />
    </div>
  );
}
