# MZ Smart Tool House — Guided Scanner & Developer Identity Update

Date: 2026-09-21

## Smart Document Scanner

The scanner is now a four-stage guided workflow. Only the current stage is shown so the mobile experience does not mix capture, crop, filters and exports on one screen.

1. **Capture** — camera or one uploaded image.
2. **Crop** — automatic document detection runs immediately. The four detected corner handles are already draggable on the image; there is no separate “Manual Crop” mode to activate. The user corrects the automatic boundary directly and confirms it.
3. **Filter** — a dedicated live-preview screen with Original, Auto, Color Boost, Document, Light, Grayscale, B&W, Contrast and Sharpen plus brightness/contrast/sharpen adjustments.
4. **Export** — PDF, JPG, PNG, OCR and searchable PDF options plus clear **Add another image** and **Scan another page** actions. Every added page returns through Crop → Filter before joining the export set.

The existing browser-side perspective correction, PDF validation, OCR path, PDF page size/margins, multi-page image ZIP validation and local processing architecture are retained.

## Startup identity

The startup screen now displays:

**Developed by Muhammad Mujtaba**

- Installed PWA/native app: shown on app startup.
- Normal website: short welcome is shown once per browser session, then skipped on later reloads in that session.

## About & Contact

The About page has been rebuilt with a dedicated developer profile and direct contact cards:

- Developer: **Muhammad Mujtaba**
- Email: **mujtaba31202@gmail.com**
- Contact: **03704892504**

The Contact page also exposes these direct contact methods above the Netlify-backed contact form.

## Verification completed in the offline workspace

Passed:

- Whole-app JSX/JS parser and module graph audit: **190 modules checked; no syntax errors, unresolved imports or missing exports**
- Tool registry: **307 active tools / 27 categories / 307 wired components**
- Scanner detection + guided workflow regression audit
- Mobile UI audit
- PWA audit
- React/PWA warning audit
- No-fake-feature audit
- SEO architecture audit
- Category registry audit
- Platform/final/production-master audits
- Functional tool audit
- Capacitor audit
- Dependency-safety audit
- Spreadsheet/compiler source audits
- 54 calculator tests
- Shared calculator regression tests
- 60 universal converter tests
- 49 science/engineering formula smoke tests
- Sitemap regenerated with **361 canonical URLs** for `https://mztoolshouse.com`

## Production build note

The workspace does not have the project's npm packages cached, and internet package installation is unavailable here. Therefore `npm run build` could not be executed in this environment. The whole-app TypeScript parser audit did validate JSX/JavaScript syntax and import/export resolution. Run the normal production check on the deployment machine:

```bat
npm ci
npm run build
```

Then push only after the build succeeds.
