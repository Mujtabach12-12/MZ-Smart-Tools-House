const QUEUE_KEY = "mz-feedback-queue-v2";

export function feedbackDeviceLabel() {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  return width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
}

export function readFeedbackQueue() {
  try {
    const value = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeFeedbackQueue(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(Array.isArray(items) ? items.slice(-25) : []));
    return true;
  } catch {
    return false;
  }
}

export function queueFeedback(payload) {
  const next = [...readFeedbackQueue(), payload].slice(-25);
  return writeFeedbackQueue(next) ? next.length : 0;
}

export async function postFeedback(payload) {
  const body = new URLSearchParams({ "form-name": "mz-feedback", ...payload });
  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return true;
}

export async function submitFeedback(payload, { queueOnFailure = true } = {}) {
  const local = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!local) {
    try {
      await postFeedback(payload);
      return { status: "sent" };
    } catch (error) {
      if (!queueOnFailure) throw error;
    }
  }
  if (!queueOnFailure) return { status: "local" };
  const count = queueFeedback(payload);
  return { status: count ? "queued" : "failed", count };
}

export async function flushFeedbackQueue() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { sent: 0, remaining: readFeedbackQueue().length };
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return { sent: 0, remaining: readFeedbackQueue().length };
  }
  const queued = readFeedbackQueue();
  if (!queued.length) return { sent: 0, remaining: 0 };
  const remaining = [];
  for (const item of queued) {
    try { await postFeedback(item); } catch { remaining.push(item); }
  }
  writeFeedbackQueue(remaining);
  return { sent: queued.length - remaining.length, remaining: remaining.length };
}
