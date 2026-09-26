import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tools } from '../src/data/tools.js';
import financeToolSeo from '../src/data/financeToolSeo.js';
import { FINANCE_TOOL_IDS } from '../src/lib/finance/calculators.js';

const financeTools = tools.filter((tool) => tool.category === 'finance-tools');
assert.equal(financeTools.length, 15, 'Business & Finance should contain exactly 15 tools');
assert.deepEqual(new Set(financeTools.map((tool) => tool.id)), new Set(FINANCE_TOOL_IDS), 'Finance registry and calculation engine should cover the same 15 tools');

const toolIndex = fs.readFileSync('src/tools/index.js', 'utf8');
for (const id of FINANCE_TOOL_IDS) {
  assert.ok(toolIndex.includes(`\"${id}\": () => import(\"./finance/FinanceCalculator\")`), `${id} must use FinanceCalculator`);
  assert.ok(financeToolSeo[id]?.title, `${id} needs unique SEO title`);
  assert.ok(financeToolSeo[id]?.description, `${id} needs unique SEO description`);
  assert.ok(financeToolSeo[id]?.formula, `${id} needs a visible formula/explanation`);
  assert.ok(Array.isArray(financeToolSeo[id]?.related) && financeToolSeo[id].related.length >= 3, `${id} needs curated related tools`);
}

const component = fs.readFileSync('src/tools/finance/FinanceCalculator.jsx', 'utf8');
assert.match(component, /role="alert"/, 'Finance validation errors need an accessible alert');
assert.match(component, /aria-live="polite"/, 'Finance results need a polite live region');
assert.match(component, /inputMode="decimal"/, 'Finance numeric fields should request a mobile decimal keyboard');
assert.match(component, /calculator_complete/, 'Successful finance calculations should emit a meaningful analytics event');
assert.match(component, /calculator_validation_error/, 'Validation errors should emit a meaningful analytics event');
assert.match(component, /Formatting only — no exchange-rate conversion is performed/, 'Currency selector must not pretend to convert currency');

const expanded = fs.readFileSync('src/tools/expanded/ExpandedTool.jsx', 'utf8');
assert.ok(!expanded.includes('function FinanceTool({id})'), 'Legacy finance implementation should be removed from ExpandedTool');

const routes = fs.readFileSync('src/router/AppRoutes.jsx', 'utf8');
assert.match(routes, /categories\/business-finance/, 'Legacy Business & Finance category path should redirect');
const redirects = fs.readFileSync('public/_redirects', 'utf8');
assert.match(redirects, /^\/categories\/business-finance \/business-tools 301/m, 'Netlify should permanently redirect the prompt-era category URL');
assert.match(redirects, /^\/categories\/finance-tools \/business-tools 301/m, 'Netlify should permanently redirect the generic legacy category URL');

console.log('Business & Finance product audit passed: 15 routes, shared finance engine, dedicated UI, SEO coverage, analytics hooks, accessibility hooks and category redirects verified.');
