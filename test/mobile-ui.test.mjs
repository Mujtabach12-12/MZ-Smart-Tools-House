import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync('src/pages/Home.jsx', 'utf8');
const mobileHome = fs.readFileSync('src/components/home/MobileHome.jsx', 'utf8');
const header = fs.readFileSync('src/components/layout/Header.jsx', 'utf8');
const nav = fs.readFileSync('src/components/layout/MobileBottomNav.jsx', 'utf8');
const scanner = fs.readFileSync('src/tools/scanner/SmartDocumentScanner.jsx', 'utf8');
const css = fs.readFileSync('src/index.css', 'utf8');
const logo = fs.readFileSync('public/icons/mz-tools-icon.svg', 'utf8');

assert.match(home, /useMobileLayout/, 'Homepage should select a true mobile layout instead of squeezing desktop content');
assert.match(home, /<MobileHome\s*\/>/, 'Mobile homepage must be mounted');
assert.match(mobileHome, /SearchBar/, 'Mobile homepage needs one primary search');
assert.match(mobileHome, /mz-mobile-category-grid/, 'Mobile category grid missing');
assert.match(header, /BrandMark/, 'Header must use the redesigned MZ brand mark');
assert.match(header, /mz-pwa-install-request/, 'Header must expose the install action');
assert.match(nav, /smart-document-scanner/, 'Bottom navigation must promote scanner as a primary app action');
assert.match(scanner, /previewData/, 'Scanner must generate a live enhancement preview');
assert.match(scanner, /Capture → correct the automatic crop → choose a filter → export or add another page/, 'Scanner must present the guided mobile workflow');
assert.match(css, /\.mz-app-shell\s*>\s*main\s*\{[^}]*width:\s*100%/s, 'App main content must explicitly fill mobile viewport');
assert.match(css, /\.mz-mobile-home/, 'Mobile-first homepage styles missing');
assert.match(logo, /central MZ identity/, 'New logo must keep MZ as the central identity');
assert.match(logo, /tool orbit/, 'New logo must include tool symbols around MZ');
console.log('Mobile app layout, brand and scanner live-preview audit passed.');

const about = fs.readFileSync('src/pages/About.jsx', 'utf8');
const startup = fs.readFileSync('index.html', 'utf8');
assert.match(about, /Muhammad Mujtaba/, 'About page must identify the developer');
assert.match(about, /mujtaba31202@gmail\.com/, 'About page must expose the developer email');
assert.match(about, /03704892504/, 'About page must expose the developer contact number');
assert.match(startup, /Developed by <strong>Muhammad Mujtaba<\/strong>/, 'Startup screen must credit the developer');
