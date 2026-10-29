import assert from 'node:assert/strict';
import { qualityToolSeo } from '../src/data/qualityToolSeo.js';
import { getToolById } from '../src/data/tools.js';
import { getToolSeo, hasRichSeo } from '../src/data/toolSeo.js';
const ids = ['ratio-calculator','average-calculator','percentage-calculator','age-calculator','discount-calculator','image-resizer','time-calculator','speaking-time-calculator'];
for (const id of ids) {
 const source = qualityToolSeo[id];
 const tool = getToolById(id);
 assert.ok(tool && tool.status === 'active', id + ' missing active implementation');
 assert.ok(source.intro.length >= 100 && source.example.length >= 75);
 assert.ok(source.formula.length >= 60 && source.limitations.length >= 80);
 assert.ok(source.howTo.length >= 3 && source.faq.length >= 2);
 assert.ok(!source.howTo.some(x => /^open .*tool/i.test(x)), id + ' has generic help');
 const seo = getToolSeo(tool);
 assert.equal(seo.intro, source.intro, id + ' integration missing');
 assert.equal(seo.example, source.example, id + ' example not integrated');
 assert.ok(hasRichSeo(tool), id + ' not included in rich SEO plan');
}
assert.equal(Object.keys(qualityToolSeo).length, ids.length);
console.log('Eight integrated priority tool content checks passed.');
