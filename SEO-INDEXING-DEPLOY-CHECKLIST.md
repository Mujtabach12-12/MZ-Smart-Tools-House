# MZ Smart Tools House — Google Indexing Deployment Checklist

This build focuses the sitemap on substantial canonical pages instead of submitting every functional route at once. Lower-content tool routes stay usable but use `noindex,follow` until they have enough unique content.

## Deploy
1. `npm install`
2. `npm run build`
3. Deploy the generated `dist` folder.
4. Confirm direct public 200 responses for `/`, `/tools/pdf-compressor`, `/tools/mz-pdf-editor`, `/tools/smart-document-scanner`, `/tools/gpa-calculator`.
5. Confirm `/robots.txt` and `/sitemap.xml` load publicly.

## Google Search Console
Submit `https://mztoolshouse.com/sitemap.xml`, inspect priority URLs, run Test Live URL, and request indexing for the strongest pages first. Review Indexing → Pages for 404, soft 404, canonical mismatch, blocked/noindex or crawled-not-indexed reasons.

Do not use fake trending keywords, hidden text, doorway pages or fabricated review/FAQ schema.
