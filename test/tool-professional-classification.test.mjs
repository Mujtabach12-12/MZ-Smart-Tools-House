import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tools } from '../src/data/tools.js';
import { categories } from '../src/data/categories.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'audit/professional-tool-classification.json');
assert.ok(fs.existsSync(file), 'classification audit must exist');
const audit = JSON.parse(fs.readFileSync(file, 'utf8'));
assert.equal(audit.summary.total, tools.length, 'every registry tool must be classified');
assert.equal(audit.summary.categories, categories.length, 'every category must be represented');
const ids = audit.rows.map((row) => row.id);
assert.equal(new Set(ids).size, tools.length, 'classification IDs must be unique');
for (const tool of tools) assert.ok(ids.includes(tool.id), `missing classification for ${tool.id}`);
for (const row of audit.rows) {
  assert.match(row.grade, /^[A-E]$/, `${row.id}: invalid grade`);
  assert.match(row.recommendedRegistryStatus, /^(ACTIVE|TESTING|DISABLED)$/, `${row.id}: invalid release recommendation`);
  assert.ok(row.implementation, `${row.id}: implementation path missing`);
  assert.ok(row.reason?.length > 20, `${row.id}: audit reason is too thin`);
}
assert.equal(audit.summary.grades.E, 0, 'no production tool should be classified as placeholder/mock after the no-fake audit');
assert.equal(audit.summary.grades.A, 0, 'no tool may be graded A before complete browser/mobile/output verification');
console.log(`Professional classification audit passed: ${tools.length} tools, ${categories.length} categories, all rows accounted for.`);
