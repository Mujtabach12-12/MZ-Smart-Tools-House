const IDS={BTC:"bitcoin",ETH:"ethereum",USDT:"tether"};
export default async (request)=>{
 const url=new URL(request.url); const from=String(url.searchParams.get("from")||"").toUpperCase(),to=String(url.searchParams.get("to")||"").toUpperCase();
 if(!IDS[from]||!IDS[to])return new Response(JSON.stringify({error:"Unsupported cryptocurrency."}),{status:400,headers:{"content-type":"application/json"}});
 if(from===to)return Response.json({rate:1,source:"Identity",updated:new Date().toISOString()});
 try{const ids=[IDS[from],IDS[to]].join(",");const upstream=await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,{headers:{accept:"application/json","user-agent":"MZ-Smart-Tool-House/1.0"}});if(!upstream.ok)throw new Error();const data=await upstream.json();const a=Number(data?.[IDS[from]]?.usd),b=Number(data?.[IDS[to]]?.usd);const rate=a/b;if(!Number.isFinite(rate)||rate<=0)throw new Error();return Response.json({rate,source:"CoinGecko public market data",updated:new Date().toISOString()},{headers:{"cache-control":"public, max-age=60, s-maxage=120"}})}catch{return new Response(JSON.stringify({error:"Live crypto prices are temporarily unavailable."}),{status:502,headers:{"content-type":"application/json","cache-control":"no-store"}})}
};
