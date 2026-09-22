let lastAnnouncement = { at: 0, source: "" };

/**
 * Announces a genuine successful tool action to the shared optional feedback UI.
 * This never changes processing state and is intentionally decoupled from tools.
 */
export function announceToolSuccess(detail = {}) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const source = String(detail.source || "tool");
  if (lastAnnouncement.source === source && now - lastAnnouncement.at < 500) return;
  lastAnnouncement = { at: now, source };
  window.dispatchEvent(new CustomEvent("mz-tool-success", { detail: { ...detail, source, at: now } }));
}
