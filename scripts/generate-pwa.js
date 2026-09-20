import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const swPath = path.join(root, 'public', 'sw.js');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const index = fs.readFileSync(path.join(root, 'index.html'));
const version = `${pkg.version}-${crypto.createHash('sha256').update(index).digest('hex').slice(0, 10)}`;
let source = fs.readFileSync(swPath, 'utf8');
source = source.replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = '${version}';`);
fs.writeFileSync(swPath, source);
console.log(`PWA service worker cache version: ${version}`);
