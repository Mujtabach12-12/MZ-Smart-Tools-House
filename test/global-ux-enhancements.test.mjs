import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const startup = read('src/components/pwa/StartupWelcome.jsx');
const favorite = read('src/components/ui/FavoriteButton.jsx');
const allTools = read('src/pages/AllTools.jsx');
const categories = read('src/pages/CategoriesIndex.jsx');
const feedback = read('src/components/ui/ToolSuccessFeedback.jsx');
const toolPage = read('src/pages/ToolPage.jsx');
const download = read('src/lib/download.js');
const resultCard = read('src/components/tools/ResultCard.jsx');
const header = read('src/components/layout/Header.jsx');
const settings = read('src/pages/Settings.jsx');
const css = read('src/index.css');
const html = read('index.html');

const appMs = Number(startup.match(/APP_STARTUP_MS\s*=\s*(\d+)/)?.[1]);
const webMs = Number(startup.match(/WEB_STARTUP_MS\s*=\s*(\d+)/)?.[1]);
assert.ok(appMs >= 500 && appMs <= 2000, `installed/native startup should stay brief, got ${appMs}`);
assert.equal(webMs, 0, `normal web startup must not be artificially delayed, got ${webMs}`);
assert.ok(startup.includes("startup.remove();"), "normal web startup must be removed immediately");
for (const name of ['PDF Tools','Image Tools','Document Scanner','Calculators','Developer Tools','Converters']) {
  assert.ok(startup.includes(`"${name}"`), `startup step missing ${name}`);
}
assert.ok(html.includes('Developed by <strong>Muhammad Mujtaba</strong>'));
assert.ok(html.includes('data-mz-startup-tool'));
assert.ok(html.includes('data-mz-startup-progress'));

assert.ok(favorite.includes('Heart'));
assert.ok(favorite.includes('fill-current text-rose-500'));
assert.ok(!favorite.includes('Star'));
assert.ok(allTools.includes('activeCategory === "favorites"'));
assert.ok(allTools.includes('getFavoriteTools'));
assert.ok(categories.includes('Favorite Tools'));
assert.ok(categories.includes('/tools?category=favorites'));

assert.ok(toolPage.includes('ToolSuccessFeedback'));
assert.ok(download.includes('announceToolSuccess'));
assert.ok(resultCard.includes('announceToolSuccess'));
assert.ok(feedback.includes('mz-tool-success'));
assert.ok(feedback.includes('Tool Reaction'));
assert.ok(feedback.includes('Optional'));
assert.ok(html.includes('name="reaction"'));
assert.ok(html.includes('name="tool"'));

assert.ok(!header.includes('ViewScaleControl'), 'page zoom must not clutter the front header');
assert.ok(!header.includes('Page zoom'), 'page zoom label must not appear in the mobile front menu');
assert.ok(!settings.includes('ViewScaleControl'), 'custom app-level zoom must not be exposed; browser/app stay on native 100%');
assert.ok(header.includes('mz-close-navigation'));
assert.ok(header.includes('mz-mobile-menu-backdrop'));
assert.ok(!css.includes('zoom:var(--mz-ui-scale)'), 'custom root zoom must not compound browser/device scaling');
assert.ok(!css.includes('width:calc(100% / var(--mz-ui-scale))'));
assert.ok(css.includes('font-size:16px'));
assert.ok(css.includes('-webkit-text-size-adjust:100%'));
assert.ok(css.includes('.mz-app-shell::before'));
assert.ok(css.includes('.mz-success-feedback'));

console.log('Global UX enhancements: PASS');
