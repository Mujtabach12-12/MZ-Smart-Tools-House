const PROVIDERS = {
  openai: { url: "https://api.openai.com/v1/chat/completions", model: process.env.AI_MODEL || "gpt-4o-mini" },
  groq: { url: "https://api.groq.com/openai/v1/chat/completions", model: process.env.AI_MODEL || "llama-3.3-70b-versatile" },
};

export default async function handler(request) {
  if (request.method !== "POST") return new Response(JSON.stringify({ message: "Method not allowed." }), { status: 405, headers: { "content-type": "application/json" } });
  const providerName = process.env.AI_PROVIDER || "openai";
  const provider = PROVIDERS[providerName];
  const key = process.env.AI_API_KEY;
  if (!provider || !key) return new Response(JSON.stringify({ message: "AI service is not configured. Set AI_PROVIDER and AI_API_KEY on the server." }), { status: 503, headers: { "content-type": "application/json" } });
  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ message: "Invalid JSON request." }), { status: 400, headers: { "content-type": "application/json" } }); }
  const input = String(body?.input || "").trim();
  const task = String(body?.task || "general").trim();
  if (!input) return new Response(JSON.stringify({ message: "Input is required." }), { status: 400, headers: { "content-type": "application/json" } });
  const prompt = `Task: ${task}\n\nUser content:\n${input}`;
  try {
    const upstream = await fetch(provider.url, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ model: provider.model, temperature: 0.2, messages: [{ role: "system", content: "You are a concise utility assistant. Return only the requested result." }, { role: "user", content: prompt }] }) });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return new Response(JSON.stringify({ message: data?.error?.message || `AI provider returned HTTP ${upstream.status}.` }), { status: 502, headers: { "content-type": "application/json" } });
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return new Response(JSON.stringify({ message: "AI provider returned no text." }), { status: 502, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ text }), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch (error) {
    return new Response(JSON.stringify({ message: error?.message || "AI provider request failed." }), { status: 502, headers: { "content-type": "application/json" } });
  }
}
