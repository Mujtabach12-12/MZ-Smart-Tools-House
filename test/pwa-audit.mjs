import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const required = [
  ['public/manifest.webmanifest', 'manifest'],
  ['public/sw.js', 'service worker'],
  ['public/icons/icon-192.png', '192 icon'],
  ['public/icons/icon-512.png', '512 icon'],
  ['public/icons/icon-maskable.png', 'maskable icon'],
  ['src/components/pwa/PwaManager.jsx', 'PWA manager'],
  ['scripts/generate-pwa.js', 'PWA build generator'],
  ['public/startup/mz-office-welcome.mp4', 'office startup animation'],
  ['src/components/pwa/StartupWelcome.jsx', 'startup welcome screen'],
];
for (const [file, label] of required) if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${label}: ${file}`);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
for (const key of ['name','short_name','description','start_url','scope','display','orientation','theme_color','background_color','icons','categories']) if (!manifest[key]) throw new Error(`Manifest missing ${key}`);
if (manifest.display !== 'standalone') throw new Error('Manifest display must be standalone');
if (!manifest.icons.some(i => i.sizes === '192x192' && i.type === 'image/png')) throw new Error('Missing 192 PNG icon');
if (!manifest.icons.some(i => i.sizes === '512x512' && i.type === 'image/png')) throw new Error('Missing 512 PNG icon');
if (!manifest.icons.some(i => i.purpose === 'maskable')) throw new Error('Missing maskable icon');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!index.includes('rel="manifest"')) throw new Error('Manifest link missing');
if (!index.includes('apple-touch-icon')) throw new Error('Apple touch icon missing');
if (!index.includes('id="mz-native-startup"')) throw new Error('Guaranteed first-paint startup overlay missing');
if (!index.includes('/startup/mz-office-welcome.mp4')) throw new Error('Startup video is not embedded in first-paint overlay');
const main = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
if (!main.includes('PwaManager')) throw new Error('PWA manager not mounted');
if (!main.includes('StartupWelcome')) throw new Error('Startup welcome not mounted');
const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
if (!sw.includes('/startup/mz-office-welcome.mp4')) throw new Error('Startup animation is not in the offline shell');
for (const token of ['install', 'activate', 'fetch', 'CACHE_VERSION']) if (!sw.includes(token)) throw new Error(`Service worker missing ${token} handling`);
const scanner = fs.readFileSync(path.join(root, 'src/tools/scanner/SmartDocumentScanner.jsx'), 'utf8');
if (!scanner.includes('capture="environment"')) throw new Error('Scanner image input is missing mobile camera capture hint');
const dims = execFileSync('file', ['public/icons/icon-192.png','public/icons/icon-512.png','public/icons/icon-maskable.png'], {encoding:'utf8'});
if (!dims.includes('192 x 192') || !dims.includes('512 x 512')) throw new Error(`Unexpected icon dimensions:\n${dims}`);
console.log('PWA audit passed: manifest, icons, service worker, install manager, scanner capture and metadata verified.');
