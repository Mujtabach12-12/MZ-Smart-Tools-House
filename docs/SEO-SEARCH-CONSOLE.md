# SEO & Google Search Console deployment checklist

MZ Smart Tool House is configured around the canonical production origin currently used in source: `https://www.mzsolutions.app`.

If the production domain changes, update it consistently in:

- `src/components/layout/Seo.jsx` (`BASE_URL`)
- `scripts/generate-sitemap.js`
- `public/robots.txt`
- any Netlify/custom-domain redirects

Do not launch with canonical URLs pointing at a different domain.

## Canonical URL strategy

- Important tools: `/tools/<clean-slug>`
- MZ Office: `/office`
- Student Hub: `/student-hub`
- Categories use their preferred routes such as `/pdf-tools`, `/image-tools`, `/student-tools`, `/programming-tools` and `/calculators`.
- Legacy `/categories/:slug` and legacy internal tool-id routes may still resolve for compatibility, but pages emit the preferred canonical URL.
- Search/filter URLs are discovery states, not new SEO landing pages.

## Sitemap

Generate before deployment:

```bash
npm run generate:sitemap
```

Production sitemap:

`https://www.mzsolutions.app/sitemap.xml`

The generator de-duplicates canonical routes and includes important static hubs, categories and active tool pages.

## robots.txt

Production robots file:

`https://www.mzsolutions.app/robots.txt`

Confirm it:

1. Allows normal public pages and assets to be crawled.
2. Does not accidentally block `/tools/`, category routes or required JS/CSS.
3. Points to the production sitemap URL.
4. Keeps internal-only areas such as Tool Health out of the index through page-level `noindex` metadata.

## Google Search Console setup

1. Deploy the final production domain over HTTPS.
2. Add a **Domain property** in Google Search Console where DNS access is available (or URL-prefix property if necessary).
3. Complete ownership verification using the method Google provides.
4. Submit `https://www.mzsolutions.app/sitemap.xml` under **Sitemaps**.
5. Use **URL Inspection** on the home page, MZ Office, Student Hub and several important tool pages after deployment.
6. Monitor **Page indexing**, **Core Web Vitals**, **HTTPS**, **Mobile usability** (where available) and search performance.
7. Fix real crawl/index problems before requesting repeated recrawls.

Do not claim that a URL is indexed until Search Console or a live Google result confirms it.

## Structured data

The application emits appropriate schema from actual page content:

- `Organization` + `WebSite` on general pages
- `WebPage` / `WebApplication` on tool pages
- `BreadcrumbList` on tools/categories
- `FAQPage` only when matching FAQ content is visibly rendered

Before production launch, validate representative URLs with Google's Rich Results Test / Schema.org validator. Structured data does not guarantee a rich result.

## Content rules

- Each important tool receives a useful, unique title, description, explanation, usage method, example, FAQ and related-tool links.
- Do not create thin keyword variants merely to increase indexed page count.
- Do not publish compiler-language pages as “online compiler” pages until that language genuinely executes through the isolated backend.
- Do not describe unsupported PDF/Office capabilities as present.

## Performance / crawl readiness

Before final launch run:

```bash
npm install
npm run test:all
npm run build
```

Then use an actual deployed build to measure Core Web Vitals. Source-level code splitting exists, but **LCP, CLS and INP cannot be truthfully reported as passing until measured in a browser/field or lab tool against the deployed site**.

Heavy PDF, spreadsheet, presentation, OCR and programming modules must stay dynamically imported so they are not part of the landing-page critical bundle unless required.
