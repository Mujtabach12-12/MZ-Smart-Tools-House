const ENV = import.meta.env || {};
const API_BASE = (ENV.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export function getAiConfigStatus() {
  return {
    configured: Boolean(API_BASE),
    provider: ENV.VITE_AI_PROVIDER || "server-configured",
    endpoint: API_BASE ? `${API_BASE}/ai` : null,
  };
}

export async function generateAi({ task, input, options = {} }) {
  if (!API_BASE) {
    const error = new Error("This AI feature requires backend configuration. Set VITE_API_BASE_URL to your server API.");
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }
  const response = await fetch(`${API_BASE}/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, input, options }),
  });
  let payload = null;
  try { payload = await response.json(); } catch { /* non-JSON error */ }
  if (!response.ok) throw new Error(payload?.detail || payload?.message || `AI service returned HTTP ${response.status}.`);
  if (!payload?.text) throw new Error("The AI service returned no text result.");
  return payload.text;
}
