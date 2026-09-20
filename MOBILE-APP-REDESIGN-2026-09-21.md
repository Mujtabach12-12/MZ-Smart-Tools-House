# MZ Smart Tool House — Mobile App Redesign

Date: 2026-09-21

## What changed

- Replaced the mobile homepage with a true mobile-only application layout instead of squeezing the desktop homepage.
- Added explicit full-width viewport safeguards for `html`, `body`, `#root`, app shell and main content.
- Rebuilt the mobile header with the new MZ brand mark, compact branding, install action and cleaner menu.
- Rebuilt the bottom navigation as Home / Tools / Scan / Office / More, with Scanner as the center primary action.
- Added a single mobile homepage search, compact quick actions, category grid, popular tools, recent tools and favorites.
- Removed the large mobile footer from app mode to keep the mobile experience focused.
- Kept the existing desktop homepage and all 307 active tools / 27 categories intact.

## New logo

- MZ remains the center identity.
- Document, calculator, code, image and wrench/tool symbols orbit the MZ core.
- Replaced web PWA icons, favicon, Android launcher icons, Android adaptive foreground and splash logo assets.

## Smart Document Scanner

- Added a real live enhancement preview generated from the existing canvas processing pipeline.
- Filter changes now visibly update the preview before export.
- Added a dedicated live preview beside the enhancement controls.
- Preserved full-resolution processing for final exported pages.
- Retained Original, Auto, Document, Light, Grayscale, B&W, Contrast and Sharpen modes.
- Retained brightness, contrast and sharpen controls.
- Reworked scanner controls for mobile with two-column action grids and larger touch targets.
- Kept camera capture, upload, edge detection, manual crop, perspective correction, undo/redo, OCR and PDF/JPG/PNG export.

## PWA installation

- Preserved the mobile install bottom sheet and header Install button.
- Changed `beforeinstallprompt` handling to defer the browser event correctly so the custom Install button can invoke the native prompt when Chromium makes the site installable.
- iOS continues to show Add to Home Screen instructions.
- Installed/standalone mode continues to hide install promotion.

## Validation completed

The following source/regression tests pass in this workspace:

- Mobile app layout / branding / scanner live-preview audit
- Scanner detection and crop-drag regression tests
- PWA audit
- React/PWA install-flow regression checks
- SEO architecture regression checks
- Tool registry audit: 307 active tools
- Category registry audit: 27 categories
- Platform feature regression checks
- JSX syntax parse check for all modified React components

A full Vite production build could not be rerun in this sandbox because package installation is unavailable here. Run `npm ci` and `npm run build` on the Windows project before pushing. The previous project build succeeded before these UI changes.

## Production update

After copying this version into the existing Git project:

```bat
npm ci
npm run build
git add .
git commit -m "Rebuild mobile app UI logo scanner and PWA install"
git push
```

Netlify auto-publishing can then update the existing `https://mztoolshouse.com` site from the same repository.
