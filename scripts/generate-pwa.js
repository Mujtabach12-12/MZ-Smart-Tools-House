import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const swPath = path.join(root, 'public', 'sw.js');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const index = fs.readFileSync(path.join(root, 'index.html'));
let source = fs.readFileSync(swPath, 'utf8');
const normalizedServiceWorker = source.replace(/const CACHE_VERSION = '[^']+';/, "const CACHE_VERSION = '<generated>';" );
const digest = crypto.createHash('sha256')
  .update(index)
  .update(normalizedServiceWorker)
  .update(String(pkg.version || '0.0.0'))
  .digest('hex')
  .slice(0, 10);
const version = `${pkg.version}-${digest}`;
source = source.replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = '${version}';`);
fs.writeFileSync(swPath, source);
console.log(`PWA service worker cache version: ${version}`);
