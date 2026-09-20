import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lockText = fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8');
const lock = JSON.parse(lockText);

assert.equal(pkg.dependencies?.pptxgenjs, '4.0.1', 'PptxGenJS must stay pinned to the verified modern major');
assert.equal(pkg.devDependencies?.vite, '8.3.0', 'Vite must stay pinned for reproducible optimizer behavior');
assert.equal(lock.packages?.['node_modules/pptxgenjs']?.version, '4.0.1', 'lockfile must resolve PptxGenJS 4.0.1');
for (const legacy of ['node_modules/jquery-node','node_modules/request','node_modules/jsdom','node_modules/form-data','node_modules/qs','node_modules/tough-cookie']) {
  assert.ok(!lock.packages?.[legacy], `obsolete/vulnerable dependency must not be locked: ${legacy}`);
}
const viteConfig = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8');
assert.ok(viteConfig.includes('entries: ["index.html"]'), 'Vite optimizer must scan only the real app entry');
console.log('Dependency safety regression passed: modern PptxGenJS lock and focused Vite scan verified.');
