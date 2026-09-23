# MZ Smart Tool House — Backend/API Coming Soon UX Fix

Date: 2026-09-24

## Scope
Only user-facing areas that depend on unavailable backend/API execution were simplified. Existing Settings configuration UI and unrelated tools were not changed.

## Changes
- AI Writing Assistant now shows a clean friendly "Coming soon" message with "Thanks for your interest" instead of server/API/Netlify configuration details or HTTP errors.
- AI Writing Assistant no longer exposes a Run button that can fail with HTTP 404 while the feature is unavailable.
- Browser-based smart text tools keep their real local processing; their optional AI action is clearly disabled as "AI · Coming soon" with a friendly note.
- Programming Lab keeps working JavaScript and HTML/CSS/JS browser execution. Languages that require unavailable remote execution show a simple "Coming soon" / "Thanks for your interest" message instead of backend/compiler-service diagnostics.
- Contact local-development notice no longer mentions Netlify; it uses a friendly coming-soon message and directs users to Feedback.
- AI and Programming public descriptions were simplified so normal users do not see backend/provider implementation jargon.
- Low-level AI/compiler service fallbacks now return friendly coming-soon wording if a hidden call reaches them.

## Files changed
- src/tools/ai/AiWritingAssistant.jsx
- src/tools/programming/ProgrammingLab.jsx
- src/tools/expanded/ExpandedTool.jsx
- src/services/ai.js
- src/services/compiler.js
- src/data/tools.js
- src/data/categories.js
- src/components/home/IntentSections.jsx
- src/pages/Contact.jsx
- test/backend-coming-soon.test.mjs

## Tests actually run
- backend-coming-soon.test.mjs — PASS
- bundle-check-global.mjs — PASS (209 modules inspected; 307/307 tools wired; no syntax/import/export failures)
- compiler-service.test.mjs — PASS (source/API/security-gate regression only; container runtime not exercised)
- final-platform.test.mjs — PASS
- no-fake-features.test.mjs — PASS
- mobile-ui.test.mjs — PASS
- tool-registry-audit.mjs — PASS
- category-registry-audit.mjs — PASS (307 tools / 27 categories)

Two pre-existing unused calculator-module warnings remain in the bundle audit.

## Build status
`npm run build` was attempted in this environment and was blocked before Vite could start because the uploaded project does not include installed `node_modules` / Vite. Error: `DEPENDENCY ERROR: vite is not installed.`

Run `npm install` (or use the existing installed dependencies on the development PC) and then `npm run build` before deployment.
