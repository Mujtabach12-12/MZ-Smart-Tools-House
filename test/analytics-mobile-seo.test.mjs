import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const index = read('index.html');
const layout = read('src/components/layout/Layout.jsx');
const tracker = read('src/components/analytics/AnalyticsTracker.jsx');
const analytics = read('src/lib/analytics.js');
const mobile = read('src/components/home/MobileHome.jsx');
const css = read('src/index.css');
const seo = read('src/components/layout/Seo.jsx');
const blog = read('src/pages/Blog.jsx');
const sitemap = read('scripts/generate-sitemap.js');
const prerender = read('scripts/prerender-seo.js');
const pkg = JSON.parse(read('package.json'));

const checks = [];
function check(name, condition) {
  checks.push([name, Boolean(condition)]);
  if (!condition) throw new Error(`FAIL: ${name}`);
}

check('GA4 measurement ID is present', index.includes('G-1LKZ5FMH6R'));
check('Google tag script is included once', (index.match(/googletagmanager\.com\/gtag\/js/g) || []).length === 1);
check('automatic initial page view is disabled', index.includes("send_page_view: false"));
check('SPA tracker uses React Router pathname', tracker.includes('useLocation') && tracker.includes('pathname'));
check('filter query-string changes do not create fake page views', !tracker.includes('const { pathname, search }'));
check('layout mounts analytics tracker once', (layout.match(/<AnalyticsTracker\s*\/>/g) || []).length === 1);
check('route tracker sends real GA page_view', analytics.includes('window.gtag("event", "page_view"'));
check('StrictMode duplicate page views are guarded', analytics.includes('__mzGaLastPageView'));
check('analytics is limited to the production mztoolshouse.com hosts', analytics.includes('PRODUCTION_HOSTS') && analytics.includes('mztoolshouse.com'));

check('mobile quick cards have separated icon/action row', mobile.includes('mz-mobile-quick-top'));
check('mobile quick-card copy is separate from icon wrapper', mobile.includes('mz-mobile-quick-copy'));
check('legacy generic quick-card span sizing selector removed', !css.includes('.mz-mobile-quick-card > span { grid-row:1 / span 2'));
check('quick-card helper wraps instead of ellipsis', css.includes('.mz-mobile-quick-copy small{display:block') && css.includes('white-space:normal'));
check('category labels are allowed to wrap', css.includes('.mz-mobile-category-card strong{min-height:1.88rem') && css.includes('white-space:normal'));

check('SEO maintains canonical metadata', seo.includes('upsertLink("canonical"'));
check('single-language SEO avoids redundant hreflang alternates', !seo.includes('hreflang:'));
check('site-level structured data is in initial HTML', index.includes('mz-site-structured-data') && index.includes('SearchAction'));
check('route-specific prerender shell generator exists', prerender.includes('SEO route shells written') && prerender.includes('data-prerender-schema="page"'));
check('postbuild runs SEO route shell generator', pkg.scripts.postbuild.includes('prerender-seo.js'));
check('unfinished blog is noindex', blog.includes('robots="noindex,follow"'));
check('unfinished blog is not forced into sitemap static routes', !/staticRoutes=\[[^\]]*"\/blog"/.test(sitemap));

console.log(`analytics/mobile/SEO regression: ${checks.length}/${checks.length} PASS`);
