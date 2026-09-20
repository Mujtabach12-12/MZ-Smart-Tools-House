import assert from 'node:assert/strict';
import fs from 'node:fs';

const hero = fs.readFileSync('src/components/home/Hero.jsx', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pwa = fs.readFileSync('src/components/pwa/PwaManager.jsx', 'utf8');
const dash = fs.readFileSync('src/components/home/DashboardQuickStart.jsx', 'utf8');

assert.doesNotMatch(hero, /fetchPriority|fetchpriority/, 'Hero must not pass unsupported fetchPriority DOM props under React 18');
assert.match(html, /rel="preload" as="image" href="\/assets\/mz-smart-office-hero\.webp"/, 'Hero image should retain early preload without a React DOM prop');
assert.match(pwa, /beforeinstallprompt/, 'PWA manager must listen for browser install eligibility');
assert.match(pwa, /deferred\.prompt\(\)/, 'Install buttons must be able to invoke the browser install prompt when available');
const beforeInstallHandler = pwa.match(/const onBeforeInstall = \(event\) => \{([\s\S]*?)\n    \};/)?.[1] || '';
assert.doesNotMatch(beforeInstallHandler, /event\.preventDefault\(\)/, 'Install flow must not suppress the native browser path or reintroduce the deferred-prompt diagnostic');
assert.match(pwa, /mz-pwa-install-request/, 'Shared install request event must remain wired');
assert.match(pwa, /sessionStorage/, 'First-visit app promotion should not spam the user within one browser session');
assert.doesNotMatch(dash, /👋/, 'Dashboard welcome must not use the waving-hand emoji');
console.log('React/PWA warning and install-flow regression checks passed.');
