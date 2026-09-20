export function notify(message, { type = "info", title = "", duration = 3200 } = {}) {
  if (typeof window === "undefined" || !message) return;
  window.dispatchEvent(new CustomEvent("mz-toast", { detail: { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, message: String(message), title: String(title || ""), type, duration } }));
}
