import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tools = readFileSync(new URL('../src/data/tools.js', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../src/tools/index.js', import.meta.url), 'utf8');
const seo = readFileSync(new URL('../src/data/toolSeo.js', import.meta.url), 'utf8');
const components = [
  'PercentageCalculator.jsx','AgeCalculator.jsx','DiscountCalculator.jsx','AverageCalculator.jsx','RatioCalculator.jsx','TimeCalculator.jsx',
].map((file) => readFileSync(new URL(`../src/tools/calculators/${file}`, import.meta.url), 'utf8'));
const ids = ['percentage-calculator','age-calculator','discount-calculator','average-calculator','ratio-calculator','time-calculator'];

for (const id of ids) {
  assert.match(tools, new RegExp(`id: ["']${id}["']`), `${id} missing from tool registry`);
  assert.match(registry, new RegExp(`["']${id}["']`), `${id} missing from component registry`);
  assert.match(seo, new RegExp(`["']${id}["']\\s*:`), `${id} missing curated SEO`);
}
for (const source of components) {
  assert.match(source, /calculator_complete/, 'calculator success analytics event missing');
  assert.match(source, /calculator_validation_error/, 'calculator validation analytics event missing');
  assert.match(source, /calculator_reset/, 'calculator reset analytics event missing');
  assert.match(source, /aria-live="polite"/, 'accessible live result region missing');
  assert.doesNotMatch(source, /ToolExtras/, 'calculator must not duplicate the page-level ToolExtras block');
}
assert.match(components[4], /sm:grid-cols-2 lg:grid-cols-4/, 'ratio solve layout should be responsive rather than a cramped fixed four-column equation');
assert.match(components[5], /20h \+ 8h = 28h/, 'time tool must clearly describe duration semantics');
assert.match(components[1], /timezone and daylight-saving date shifts/, 'age tool should explain date-only timezone safety');

console.log('Utilities product/source audit PASS');
