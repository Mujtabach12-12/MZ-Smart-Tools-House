import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const mobileHome = read('src/components/home/MobileHome.jsx');
const dashboard = read('src/components/home/DashboardQuickStart.jsx');
const tool3d = read('src/components/ui/Tool3DIcon.jsx');
const header = read('src/components/layout/Header.jsx');
const bottomNav = read('src/components/layout/MobileBottomNav.jsx');
const settings = read('src/pages/Settings.jsx');
const css = read('src/index.css');

assert.ok(mobileHome.includes('Tool3DIcon'), 'mobile quick tools should use dimensional MZ tool visuals');
assert.ok(mobileHome.includes('mz-mobile-category-visual'), 'mobile categories should use enhanced category visuals');
assert.ok(mobileHome.includes('Compress PDF'), 'compress PDF label should remain explicit');
assert.ok(css.includes('.mz-mobile-quick-copy strong{white-space:normal'), 'quick tool labels must not be forced into ellipsis');
assert.ok(css.includes('.tool-3d-icon-sm'), 'small dimensional icons must exist for compact dashboard cards');
assert.ok(tool3d.includes('tool-3d-icon-shine'), 'tool icons should include a light/highlight layer');
assert.ok(dashboard.includes('mz-dashboard-shell'), 'desktop dashboard should use the enhanced shell');
assert.ok(dashboard.includes('Tool3DIcon'), 'desktop dashboard actions should use MZ tool visuals');
assert.ok(header.includes('useLocation'), 'navigation should react to route changes');
assert.ok(header.includes('mz-mobile-menu-backdrop'), 'mobile menu should close when tapping outside');
assert.ok(bottomNav.includes('mz-close-navigation'), 'bottom navigation should explicitly close an open drawer');
assert.ok(!header.includes('ViewScaleControl'), 'zoom control should not be visible on the main header');
assert.ok(!settings.includes('ViewScaleControl'), 'custom page zoom should be removed so native 100% sizing remains authoritative');
assert.ok(css.includes('.mz-dashboard-action'), 'desktop action cards should receive enhanced lighting/layout');

console.log('Dashboard/navigation polish: PASS');
