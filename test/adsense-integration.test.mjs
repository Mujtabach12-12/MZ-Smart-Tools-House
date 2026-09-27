import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const adsTxt = fs.readFileSync(path.join(root, 'public', 'ads.txt'), 'utf8').trim();
const publisher = 'ca-pub-9089683978943846';
const scriptNeedle = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`;

assert.equal((html.match(new RegExp(publisher, 'g')) || []).length, 1, 'AdSense publisher ID must appear exactly once in index.html');
assert.ok(html.includes(scriptNeedle), 'AdSense script URL/client is missing');
assert.match(html, /<script\s+async\s+src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-9089683978943846"\s+crossorigin="anonymous"><\/script>/s, 'AdSense script must remain async and crossorigin=anonymous');
assert.ok(html.indexOf(scriptNeedle) < html.indexOf('</head>'), 'AdSense script must be inside <head>');
assert.equal(adsTxt, 'google.com, pub-9089683978943846, DIRECT, f08c47fec0942fa0', 'ads.txt publisher authorization is incorrect');

console.log('AdSense integration PASS (head script + ads.txt)');
