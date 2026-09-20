# Netlify Production Deployment Checklist

## Required local/CI gate

Use Node.js 20 (the version configured in `netlify.toml`). From the project root:

```bash
npm ci
npm run test:all
npm run build
```

Do not deploy if either the test suite or Vite build fails. The expected publish directory is `dist/`.

## Environment variables

Set only the variables you actually use:

- `VITE_SITE_URL` — final public origin, for example `https://mztoolshouse.com` (no trailing slash).
- `VITE_API_BASE_URL=/api`
- `VITE_COMPILER_API_URL` — optional separate sandbox compiler gateway. Leave blank until the isolated service is deployed and tested.
- `VITE_DICTIONARY_API_URL` — optional provider override. Leave blank to use `/api/dictionary` in production.
- `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY` — server-only Netlify variables for AI. Never use a `VITE_` prefix for secrets.

If the compiler service is deployed, configure it separately. Never run arbitrary user code in the Netlify function or main web process.

## Netlify configuration already present

- Build command: `npm run build`
- Publish directory: `dist`
- Node: 20
- `/api/ai` -> Netlify AI function
- `/api/dictionary` -> Netlify dictionary gateway
- SPA fallback: `/* /index.html 200` in `public/_redirects`
- Security headers and immutable cache headers in `netlify.toml`

## PWA checks after deployment

1. Open the production URL over HTTPS.
2. Confirm `/manifest.webmanifest` returns 200.
3. Confirm the service worker registers with no console error.
4. Use the visible **Install App** action in a supported Chromium browser.
5. Test Android installation and iOS Safari Add to Home Screen guidance.
6. Reload offline and confirm browser-only cached routes behave as described. Do not assume API/compiler/dictionary tools work offline.
7. Deploy a second build and verify the update banner/service-worker update path.

## SEO checks after deployment

1. Confirm canonical URLs use the final `VITE_SITE_URL`.
2. Open `/robots.txt` and `/sitemap.xml` on production.
3. Verify the sitemap contains only canonical/indexable routes.
4. Add the property in Google Search Console and Bing Webmaster Tools.
5. Submit `/sitemap.xml`.
6. Inspect the homepage and several major tool URLs before requesting indexing.
7. Validate Organization/WebSite/Breadcrumb structured data against the rendered production pages.

## Manual high-risk workflows

Test on desktop and at least one real mobile device:

- Smart Scanner: camera permission, detection, manual corner drag, perspective crop, multi-page PDF.
- PDF Compressor: vector PDF, image-heavy PDF, already-optimized PDF, download/open/page-count validation.
- MZ Online Word: autosave/reload, DOCX import, DOCX/PDF export, print.
- MZ Online Excel: XLSX import, formulas, search, sheet switching, XLSX/CSV export.
- MZ Online PowerPoint and viewer: create/export PPTX, upload PPTX, thumbnails/navigation, compatibility PDF export.
- PDF Editor/Viewer: open, page operations, annotations, selected-page export, final PDF openability.
- Dictionary: definitions, no-result, provider outage/fallback.
- Feedback: verify a real Netlify form submission appears in the Netlify dashboard.
- PWA: install, launch standalone, update.

## Compiler deployment gate

Native languages remain unavailable until the separate container execution service is deployed. Before enabling a language, run its full matrix: hello world, stdin/stdout, loops/functions/classes, compile errors, runtime errors, timeout, output limit and large-but-reasonable source. Enable only languages whose container/runtime image passes the matrix.

## Production V9 verification additions

- Confirm the global **Feedback** form appears under Netlify Forms as `mz-feedback`; test a real submission, rating, and Contact-page submission.
- Confirm `sw.js` and `index.html` return revalidation/no-cache headers so deployments do not stay on stale application shells.
- Verify PDF Viewer **Fit Width** / **Fit Page**, shared downloads, and scanner multi-page ZIP/PDF export on both desktop and mobile.
- Verify dictionary timeout/no-result/network-error states against the deployed `/api/dictionary` function.
- Do not enable native compiler languages until `VITE_COMPILER_API_URL` points to the isolated service and the per-language execution matrix has passed.

