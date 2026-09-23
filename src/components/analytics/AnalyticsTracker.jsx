import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../../lib/analytics";

export default function AnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Let route-level SEO effects update document.title before the page_view is sent.
    const frame = window.requestAnimationFrame(() => {
      trackPageView({ pathname, title: document.title });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
