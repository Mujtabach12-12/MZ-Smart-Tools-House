const BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
const UPSTREAM_TIMEOUT_MS = 5500;

export default async (request) => {
  const url = new URL(request.url);
  const word = String(url.searchParams.get("word") || "").trim();
  if (!/^[a-zA-Z][a-zA-Z\s'-]{0,79}$/.test(word)) {
    return new Response(JSON.stringify({ error: "Enter a valid English word." }), {
      status: 400,
      headers: { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" },
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(`${BASE}/${encodeURIComponent(word)}`, {
      headers: { accept: "application/json", "user-agent": "MZ-Smart-Tool-House/1.0" },
      signal: controller.signal,
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": upstream.ok ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" : "no-store",
        "access-control-allow-origin": "*",
      },
    });
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return new Response(JSON.stringify({
      error: timedOut ? "Dictionary provider timed out." : "Dictionary provider is temporarily unavailable.",
    }), {
      status: timedOut ? 504 : 502,
      headers: { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" },
    });
  } finally {
    clearTimeout(timeoutId);
  }
};
