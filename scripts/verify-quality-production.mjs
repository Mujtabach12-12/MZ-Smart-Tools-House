import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const dist=resolve(process.cwd(),'dist');
const ids=['ratio-calculator','average-calculator','percentage-calculator','age-calculator','discount-calculator','image-resizer','time-calculator','speaking-time-calculator'];
const load=p=>{const f=resolve(dist,p);assert.ok(existsSync(f),'Missing '+p);return readFileSync(f,'utf8')};
const sitemap=load('sitemap.xml');
assert.match(load('robots.txt'),/Sitemap:\s+https:\/\/mztoolshouse\.com\/sitemap\.xml/);
assert.match(load('ads.txt'),/google\.com,\s*pub-\d+,\s*DIRECT/);
for(const id of ids){
 const canonical='https://mztoolshouse.com/tools/'+id+'/';
 const html=load('tools/'+id+'/index.html');
 assert.ok(html.includes('rel="canonical" href="'+canonical+'"'),id+' canonical');
 assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),id+' sitemap');
 assert.ok(html.includes('data-prerender-content'),id+' prerender');
 assert.ok(/<h1\b/i.test(html),id+' H1');
 for(const heading of ['How it works','Example','How to use','Limitations to know','Frequently asked questions']) assert.ok(html.includes('<h2>'+heading+'</h2>'),id+' missing '+heading);
 assert.ok(/<meta name="robots" content="index,follow/i.test(html),id+' index status');
}
console.log('Eight production SEO HTML shells and sitemap entries verified.');
