import { announceToolSuccess } from "./toolSuccess.js";
export const GA_MEASUREMENT_ID = "G-1LKZ5FMH6R";

const LAST_PAGE_VIEW_KEY = "__mzGaLastPageView";
const PRODUCTION_HOSTS = new Set(["mztoolshouse.com", "www.mztoolshouse.com"]);

function canTrack() {
  return (
    typeof window !== "undefined" &&
    PRODUCTION_HOSTS.has(window.location.hostname) &&
    typeof window.gtag === "function"
  );
}

export function trackPageView({ pathname = "/", title } = {}) {
  if (!canTrack()) return false;

  const pagePath = pathname || "/";
  const pageLocation = `${window.location.origin}${pagePath}`;
  const dedupeKey = `${pagePath}|${title || document.title || ""}`;

  // React StrictMode intentionally mounts effects twice in development.
  // Prevent duplicate page_view events while still tracking every real SPA route change.
  if (window[LAST_PAGE_VIEW_KEY] === dedupeKey) return false;
  window[LAST_PAGE_VIEW_KEY] = dedupeKey;

  window.gtag("event", "page_view", {
    page_title: title || document.title,
    page_location: pageLocation,
    page_path: pagePath,
  });
  return true;
}

function isMeaningfulToolSuccess(name, parameters = {}) {
  const value = String(name || "");
  if (!value) return false;
  if (/(?:_complete|_generate|_download|_process|_success)$/.test(value)) return true;
  return value === "developer_tool_action" && parameters?.action === "complete";
}

export function trackEvent(name, parameters = {}) {
  if (!name) return false;
  // Feedback is a local product interaction and must not depend on GA being
  // available. Only the event name is used; private tool input is never copied.
  if (typeof window !== "undefined" && isMeaningfulToolSuccess(name, parameters)) {
    announceToolSuccess({ source: `event:${name}` });
  }
  if (!canTrack()) return false;
  window.gtag("event", name, parameters);
  return true;
}
