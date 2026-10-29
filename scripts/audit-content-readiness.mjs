/** Read-only audit: never changes indexing, routes, or user data. */
import { tools } from '../src/data/tools.js';
import { getToolSeo, hasRichSeo } from '../src/data/toolSeo.js';
const issues=[];
const count=x=>String(x||'').trim().split(/\s+/).filter(Boolean).length;
for(const tool of tools.filter(x=>x.status==='active')){
 const seo=getToolSeo(tool), reasons=[];
 if(!hasRichSeo(tool)) reasons.push('not search-focused');
 if(count(seo.intro)<22) reasons.push('short intro');
 if(count(seo.example)<12) reasons.push('little worked-example detail');
 if(count(seo.limitations)<18) reasons.push('missing limitations');
 if(!Array.isArray(seo.howTo)||seo.howTo.length<3||seo.howTo.some(x=>/enter the required information|run the tool and review|open .* tool/i.test(x))) reasons.push('generic or short how-to');
 if(!Array.isArray(seo.faq)||seo.faq.length<2) reasons.push('limited FAQ');
 if(reasons.length)issues.push({id:tool.id,route:tool.route||'/tools/'+tool.id,reasons});
}
console.log(JSON.stringify({active:tools.filter(x=>x.status==='active').length,reviewCandidates:issues.length,firstCandidates:issues.slice(0,40),warning:'Heuristic only; do not automatically noindex pages.'},null,2));
