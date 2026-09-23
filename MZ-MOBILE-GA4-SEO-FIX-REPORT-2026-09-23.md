# MZ Smart Tool House — Mobile Card, GA4 & SEO Update

Date: 2026-09-23

## Mobile dashboard issue fixed
The mobile screenshot exposed a CSS selector collision: `.mz-mobile-quick-card > span` applied fixed 40x40 sizing to both the 3D icon wrapper and the text-copy `<span>`. That forced helper text such as “Capture documents” and “Reduce PDF size” into a 40px box, which visually clipped the first/remaining words and made the quick cards look broken.

The quick cards now use a dedicated top row for the icon + arrow and an independent full-width copy area. Tool names and helper text wrap naturally instead of being ellipsized. Mobile category labels, popular-tool names/descriptions, and recent-tool labels were also changed to wrap instead of being silently truncated.

## Google Analytics 4
Measurement ID: `G-1LKZ5FMH6R`

No previous Google Analytics/gtag implementation was present in the inspected source, so one implementation was added only once.

Implementation:
- Google tag script added once in `index.html`.
- Initial automatic GA pageview is disabled with `send_page_view: false`.
- React Router SPA pageviews are sent by `AnalyticsTracker` when the pathname changes.
- StrictMode duplicate pageviews are deduplicated.
- Search/filter query-string changes on the same page do not inflate page-view counts.
- Analytics events are restricted to `mztoolshouse.com` and `www.mztoolshouse.com`; localhost and Capacitor localhost do not pollute production analytics.
- Privacy Policy now accurately discloses Google Analytics 4 usage.

## SEO improvements
- Added site-level Organization + WebSite + SearchAction JSON-LD in initial HTML.
- Strengthened dynamic SEO metadata: canonical URL, English/x-default alternates, Open Graph image dimensions, Twitter image alt, application name, author, referrer policy and page WebPage schema.
- Added build-time route-specific SEO HTML shells so canonical tool/category/static routes can return the correct title, description, canonical URL, OG metadata and WebPage JSON-LD before React boots.
- The unfinished “coming soon” blog is now `noindex,follow` and removed from the XML sitemap until real articles are published.
- Robots now allows normal crawling while keeping Netlify internals disallowed; noindex is handled in page metadata rather than blocking the crawler from seeing it.
- Sitemap now contains 360 indexable canonical URLs; the SEO shell generator writes 361 route shells because the noindex Blog route also receives correct non-index metadata.

No ranking position can be guaranteed by code alone. Search rankings also depend on useful original content, backlinks/authority, competition, crawl/index status and Core Web Vitals.

## Files changed/added
- `index.html`
- `package.json`
- `public/robots.txt`
- `public/sitemap.xml`
- `scripts/generate-sitemap.js`
- `scripts/prerender-seo.js` (new)
- `src/components/analytics/AnalyticsTracker.jsx` (new)
- `src/lib/analytics.js` (new)
- `src/components/layout/Layout.jsx`
- `src/components/layout/Seo.jsx`
- `src/components/home/MobileHome.jsx`
- `src/index.css`
- `src/pages/PrivacyPolicy.jsx`
- `src/pages/Blog.jsx`
- `test/analytics-mobile-seo.test.mjs` (new)

## Tests actually run
- Analytics/mobile/SEO regression: 21/21 PASS
- SEO architecture regression: PASS
- Mobile UI audit: PASS
- Global UX regression: PASS
- Viewport lock regression: PASS
- Tool registry: 307/307 active tools wired
- No-fake-feature audit: PASS
- Phase 3 quality architecture: 20/20 PASS
- Phase 4 PDF Reader/Scanner: 20/20 PASS
- Bundle/import audit: 209 modules checked; no syntax errors, unresolved imports, missing exports or registry errors
- Build-time SEO shell generator: PASS using a representative generated `dist/index.html`; verified `/tools/pdf-compressor` route metadata

Two pre-existing bundle warnings remain for unused `src/lib/calculators/cgpa.js` and `src/lib/calculators/gpa.js`.

## Production build status in this environment
`npm run build` was attempted. It could not start Vite because this uploaded/project copy does not contain an installed Vite dependency (`node_modules` is not shipped in the ZIP), and network package installation is unavailable in this execution environment.

The failure was:
`DEPENDENCY ERROR: vite is not installed. Run repair-and-run.cmd or npm ci.`

This is an environment/dependency-installation block, not a source-test assertion failure. The project should be built on the user's machine after `npm install`/`npm ci` to complete production build verification for this exact revision.
