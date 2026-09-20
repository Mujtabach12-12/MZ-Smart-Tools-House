const ALLOWED = new Set(["USD","EUR","GBP","PKR","AED","SAR","CAD","AUD","JPY","CNY","INR","TRY"]);
export default async (request) => {
  const url=new URL(request.url); const from=String(url.searchParams.get("from")||"").toUpperCase(); const to=String(url.searchParams.get("to")||"").toUpperCase();
  if(!ALLOWED.has(from)||!ALLOWED.has(to)) return new Response(JSON.stringify({error:"Unsupported currency."}),{status:400,headers:{"content-type":"application/json"}});
  if(from===to) return Response.json({rate:1,source:"Identity",updated:new Date().toISOString()});
  try{
    const upstream=await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`,{headers:{accept:"application/json","user-agent":"MZ-Smart-Tool-House/1.0"}});
    if(!upstream.ok) throw new Error(`provider ${upstream.status}`); const data=await upstream.json(); const rate=Number(data?.rates?.[to]);
    if(!Number.isFinite(rate)||rate<=0) throw new Error("rate missing");
    return Response.json({rate,source:"ExchangeRate-API public feed",updated:data.time_last_update_utc||new Date().toISOString()},{headers:{"cache-control":"public, max-age=900, s-maxage=3600"}});
  }catch{return new Response(JSON.stringify({error:"Live currency rates are temporarily unavailable."}),{status:502,headers:{"content-type":"application/json","cache-control":"no-store"}})}
};
