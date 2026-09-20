# MZ Smart Tool House — Ultimate Expansion Audit

Creator: Muhammad Mujtaba

## Registry
- 215 registered tools
- 215 unique IDs
- 17 categories
- 215 lazy loaders
- 0 missing category mappings
- 0 missing loaders
- 0 extra loaders
- 4 tools honestly marked Coming Soon: PDF OCR, scanned-PDF-to-searchable-PDF, DOCX Viewer, DOCX Text Extractor
- Sitemap: 240 URLs

## Implemented browser-first expansion
- Reusable unit conversion engine covering temperature, length, weight, area, volume, time, speed, data, pressure, energy and power.
- Health estimates: BMI, BMR, TDEE, calories, protein, macros, hydration, BSA, lean-mass reference, heart-rate zones and reference weight ranges.
- Pulse counter with 15/30/60-second timing and local BPM history.
- Finance: simple/compound interest, EMI, loan payment, savings goal, investment growth, margin/markup, budget and salary breakdown helpers.
- Date/time: date differences, working days, date arithmetic, world clock and browser-timezone output.
- Daily-life: tip, bill split, tax, fuel, speed/distance/time and pace helpers.
- Student: marks-required, study-hours, study schedule, notes, flashcards and quiz generation.
- Pakistan university GPA layer with 30 university profiles. UOL and UCP have verified policy configurations; other universities are explicitly unverified until their current official policy is checked. Custom grading is available.
- PDF text extraction plus practical Word-compatible `.doc`, CSV and text-outline exports; PDF validation/re-save, metadata editing, page-size conversion and text comparison.
- Text utilities: find/replace, whitespace cleanup, line-break cleanup, speaking time, extraction helpers and local rule-based smart-text tools.
- Developer utilities: SHA-256 via Web Crypto, HEX/RGB conversion, HTML escaping and timestamp conversion.
- Image adjustments: flip, brightness, contrast, grayscale, blur, sharpen, favicon generation, metadata inspection/re-encoding.
- Existing Smart Document Scanner retained and integrated.
- New two-person Smart Office hero asset integrated into `public/assets/mz-smart-office-hero.webp`.
- Existing favorites/recent tools/local preference architecture retained.

## Honest limitations
- No external AI API or secret key was added. Smart Text tools are local rule/template based and are not presented as model-generated AI.
- Native DOCX/OOXML rendering and native Office conversion require a dedicated parser/library and are not faked. The affected DOCX tools are Coming Soon.
- OCR for scanned images is not included; PDF OCR/searchable-PDF entries remain Coming Soon rather than pretending text extraction is OCR.
- PDF-to-Word/Excel/PowerPoint uses compatibility outputs (HTML `.doc`, CSV and text outline), not native OOXML files.
- PDF comparison is extracted-text comparison, not pixel-perfect visual diffing.
- Browser-only background removal, QR generation/reading, and native Office-to-PDF conversion were not added because the current dependency set does not provide those capabilities without introducing a large new processing stack.
- Production `npm install` and therefore `npm run build` could not be executed in the sandbox because the npm registry is not reachable and the dependency cache is empty. This is an environment limitation, not a claimed build pass.

## Verification performed
- TypeScript parser syntax audit: 157 JS/JSX/MJS files, 0 syntax errors.
- Local relative import target audit: 0 missing targets.
- Tool registry consistency audit: PASS.
- Calculator test suite: 54/54 PASS.
- University data checks: 30 profiles; UOL/UCP policy objects present.
- Sitemap generation: PASS, 240 URLs.
- Invalid legacy `FileUser` import: 0 occurrences.
- Localhost/loopback production references: 0 occurrences in source/public/config search.
- ZIP integrity is checked after packaging.

## Netlify
Build command: `npm run build`
Publish directory: `dist`
SPA fallback: `public/_redirects` → `/* /index.html 200`
Node: 20
Backend: none required for core browser-first tools
Camera: requires HTTPS/secure context and user permission in the deployed browser

## Deployment
1. Upload this project to a Git repository.
2. In Netlify, create a site from the repository.
3. Build command: `npm run build`.
4. Publish directory: `dist`.
5. Node version is set to 20 in `netlify.toml`.
6. Do not add a second SPA redirect in Netlify UI; `public/_redirects` is already included.
7. No environment variables are required for the current core browser-first build.
8. After the first deploy, directly open `/tools/...` routes to verify the SPA fallback.
9. Test camera tools on the HTTPS site and grant browser camera permission.
