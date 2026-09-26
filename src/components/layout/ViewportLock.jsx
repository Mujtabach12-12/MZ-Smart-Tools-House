import { useEffect, useRef } from "react";

/**
 * Keeps the application canvas anchored to the real browser/WebView viewport.
 *
 * This does not try to fake browser zoom with CSS. Instead it prevents the app
 * from retaining a horizontal scroll offset after resize or orientation
 * changes. Native browser zoom remains available for accessibility; tool-specific
 * zoom controls (for example the PDF reader) remain independent.
 */
export default function ViewportLock() {
  const frameRef = useRef(0);

  useEffect(() => {
    const root = document.documentElement;

    const applyViewport = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const visualWidth = Math.max(
          320,
          Math.round(window.visualViewport?.width || root.clientWidth || window.innerWidth || 320),
        );
        root.style.setProperty("--mz-app-viewport-width", `${visualWidth}px`);

        // Browser zoom/resizing can preserve a previous horizontal offset even
        // after the layout becomes narrower again. Always re-anchor the app.
        const scroller = document.scrollingElement || root;
        if (scroller.scrollLeft !== 0) scroller.scrollLeft = 0;
        if (root.scrollLeft !== 0) root.scrollLeft = 0;
        if (document.body?.scrollLeft) document.body.scrollLeft = 0;
      });
    };

    const onVisibility = () => {
      if (!document.hidden) applyViewport();
    };

    applyViewport();
    window.addEventListener("resize", applyViewport, { passive: true });
    window.addEventListener("orientationchange", applyViewport, { passive: true });
    window.addEventListener("pageshow", applyViewport, { passive: true });
    window.addEventListener("focus", applyViewport, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.visualViewport?.addEventListener("resize", applyViewport, { passive: true });

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", applyViewport);
      window.removeEventListener("orientationchange", applyViewport);
      window.removeEventListener("pageshow", applyViewport);
      window.removeEventListener("focus", applyViewport);
      document.removeEventListener("visibilitychange", onVisibility);
      window.visualViewport?.removeEventListener("resize", applyViewport);
      root.style.removeProperty("--mz-app-viewport-width");
    };
  }, []);

  return null;
}
