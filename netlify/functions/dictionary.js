const BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
export default async (request) => {
  const url = new URL(request.url);
  const word = String(url.searchParams.get("word") || "").trim();
  if (!/^[a-zA-Z][a-zA-Z\s'-]{0,79}$/.test(word)) return new Response(JSON.stringify({ error:"Enter a valid English word." }), { status:400, headers:{"content-type":"application/json"} });
  try {
    const upstream = await fetch(`${BASE}/${encodeURIComponent(word)}`, { headers:{ accept:"application/json", "user-agent":"MZ-Smart-Tool-House/1.0" } });
    const body = await upstream.text();
    return new Response(body, { status:upstream.status, headers:{ "content-type":"application/json; charset=utf-8", "cache-control": upstream.ok ? "public, max-age=3600, s-maxage=86400" : "no-store" } });
  } catch {
    return new Response(JSON.stringify({ error:"Dictionary provider is temporarily unavailable." }), { status:502, headers:{"content-type":"application/json","cache-control":"no-store"} });
  }
};
