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
const scale = read('src/components/ui/ViewScaleControl.jsx');
const header = read('src/components/layout/Header.jsx');
const css = read('src/index.css');
const html = read('index.html');

const appMs = Number(startup.match(/APP_STARTUP_MS\s*=\s*(\d+)/)?.[1]);
const webMs = Number(startup.match(/WEB_STARTUP_MS\s*=\s*(\d+)/)?.[1]);
assert.ok(appMs >= 5000 && appMs <= 7000, `app startup should be 5-7 seconds, got ${appMs}`);
assert.ok(webMs >= 5000 && webMs <= 7000, `web startup should be 5-7 seconds, got ${webMs}`);
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

assert.ok(scale.includes('const MIN = 85'));
assert.ok(scale.includes('const MAX = 125'));
assert.ok(scale.includes('100%'));
assert.ok(header.includes('ViewScaleControl'));
assert.ok(header.includes('Page zoom'));
assert.ok(css.includes('width:calc(100% / var(--mz-ui-scale))'));
assert.ok(css.includes('.mz-app-shell::before'));
assert.ok(css.includes('.mz-success-feedback'));

console.log('Global UX enhancements: PASS');
