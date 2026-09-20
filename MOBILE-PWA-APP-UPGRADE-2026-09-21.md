# MZ Smart Tool House — Mobile App / PWA Upgrade

Date: 2026-09-21
Production domain: https://mztoolshouse.com

## What changed

This release modifies the existing Global V12 React/Vite project; it does not create a second application or replace the current architecture.

### Mobile app experience

- Added a compact branded mobile header with a permanent **Install App** action.
- Added a fixed five-item mobile bottom navigation: Home, Tools, Office, Install, More.
- Added safe-area spacing for modern Android/iOS devices.
- Kept all existing routes, categories and 307 active tools.
- Mobile hero no longer repeats the same large search field already present in the sticky header.
- Quick actions are horizontally scrollable on small screens instead of creating a tall wall of chips.

### Install experience

- Added a professional first-session install bottom sheet on non-installed mobile browsers.
- The sheet explains Home Screen, Quick Launch and No App Store benefits.
- When the browser exposes `beforeinstallprompt`, the Install button invokes the browser installation UI.
- If one-tap install is not available, the UI provides accurate browser-menu instructions instead of claiming success.
- iPhone/iPad Safari receives Share → Add to Home Screen instructions.
- Install UI is hidden automatically in standalone/native mode.
- `appinstalled` updates the interface to Installed and closes install promotion.
- Dismissing the automatic promotion suppresses it for the current browser session, while permanent Install buttons remain available.
- The install event is not cancelled with `preventDefault()`, avoiding the previous deferred-prompt diagnostic from application code.

### Installed/native startup

- The custom branded startup overlay is now intended for installed/native use only.
- Its duration was reduced from 4.2 seconds to 1.8 seconds so the app opens faster.

### Live-domain readiness

- Static canonical, Open Graph and Twitter fallback URLs now use `https://mztoolshouse.com`.
- SEO runtime fallback uses `https://mztoolshouse.com`.
- Sitemap generator fallback uses `https://mztoolshouse.com`.
- `public/sitemap.xml` regenerated with 361 canonical URLs on the live domain.
- `robots.txt` now points to `https://mztoolshouse.com/sitemap.xml`.
- Added mobile/Apple web-app meta tags.

## Verification performed in the workspace

Passed source/regression suites:

- React/PWA warning and install-flow regression
- PWA manifest/icon/service-worker audit
- Production master regression
- Platform feature regression
- Final platform regression
- Calculator tests: 54
- Shared calculator regression
- Fixture integrity
- Universal converter tests: 60 / 45 converter definitions
- Science/engineering formula tests: 49 tools
- Dependency safety source audit
- Tool registry: 307 active tools wired
- Functional tool audit: 307 active, 0 production placeholder occurrences
- Category registry: 307 tools / 27 categories
- No-fake-feature regression audit
- MZ Office + Dictionary source checks
- Spreadsheet formula regression
- SEO architecture regression
- Capacitor configuration/native integration audit
- Scanner detection/crop-drag regression

A full `npm ci` / Vite production build could not be completed in this isolated workspace because dependency installation did not finish. Netlify should run the actual production build from the lockfile. Do not call the release production-verified until that deploy succeeds and the mobile browser install flow is checked on a real Android Chrome device.

## Deployment

After replacing the current local project with this updated version (or copying the changed files into the existing Git checkout):

```bat
git add .
git commit -m "Improve mobile app UI and PWA install experience"
git push
```

Netlify auto-publishing on `main` should deploy the same production domain. No new domain or Netlify project is required.
