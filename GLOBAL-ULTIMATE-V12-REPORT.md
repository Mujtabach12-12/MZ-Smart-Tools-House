# MZ Smart Tool House — Global Ultimate V12 Engineering Report

Date: 2026-09-20

## Summary

V12 preserves the existing React/Vite architecture and adds a tested science/engineering expansion while fixing the two reported front-end warnings at their source.

### Registry

- 307 active tools
- 27 categories
- 307/307 active tools wired to components
- 361 canonical sitemap URLs
- New categories: Mathematics, Physics, Chemistry, Biology, Engineering, Robotics
- New tested formula tools: 49

### React warning fix

`fetchPriority="high"` was removed from the React 18 hero `<img>` because it produced an invalid-DOM-property warning in the user's environment. The image remains prioritized with a document-level `<link rel="preload" as="image">` in `index.html`.

Regression: `npm run test:warning-fixes` PASS.

### PWA install warning fix

Chromium emits a diagnostic when `beforeinstallprompt.preventDefault()` is used to defer the install prompt before `prompt()` is called. V12 defaults to a native-first install flow and does not call `preventDefault()` unless `VITE_PWA_DEFER_INSTALL=true` is explicitly configured.

Default behavior:
- no deferred-prompt diagnostic from application code
- browser-native install UI remains authoritative
- Install App/Install Help action explains the supported native installation route
- `appinstalled` updates installed state and displays `App installed successfully.`
- one-click deferred mode remains available as an explicit opt-in environment setting

PWA source audit: PASS.

### New formula platform

49 new tools share one formula engine and one application UI. They are not separate copied calculator implementations.

Physics: 14
- velocity
- force
- work
- kinetic energy
- potential energy
- momentum
- density
- pressure
- wavelength
- frequency/period
- Ohm's law
- electrical power
- specific heat
- thin lens

Chemistry: 7
- molarity
- molality
- normality
- dilution
- pH
- ideal gas law
- percent composition

Biology: 7
- Hardy-Weinberg
- population growth
- microscope magnification
- DNA complement
- DNA to RNA
- RNA to protein
- monohybrid Punnett square

Mathematics: 4
- quadratic equation
- Pythagorean theorem
- vector magnitude
- permutations/combinations

Engineering: 9
- stress
- strain
- voltage divider
- series resistance
- parallel resistance
- LED resistor
- RC time constant
- concrete volume
- slope/gradient

Robotics: 4
- gear ratio
- wheel speed
- battery runtime estimate
- PWM duty cycle

Business/finance additions: 4
- break-even
- CAGR
- ROI
- commission

All new formula tools expose the formula, validated inputs, units, a real result, reset and copy controls.

### Automated evidence

PASS:
- 54 core calculator tests
- 10 shared-calculator regression tests
- 60 Universal Conversion Hub tests across 45 converter definitions
- 49 new formula tools smoke-tested plus exact reference/validation cases
- React/PWA warning regression
- dependency-safety regression
- registry audit
- functional audit
- category-registry audit
- no-fake-feature audit
- platform regression
- Office/Dictionary source regression
- final-platform regression
- production-master regression
- spreadsheet formula regression
- SEO architecture regression
- compiler service security/API gate
- Tool Health manifest
- Capacitor audit
- Smart Scanner regression
- whole-app static bundle/source audit
- PWA audit

Whole-app static audit result:
- 307/307 tool mappings consistent
- 0 syntax errors
- 0 unresolved imports
- 0 missing exports
- two informational unused warnings for `src/lib/calculators/gpa.js` and `cgpa.js`; these files are intentionally imported by the calculator test suite rather than the runtime bundle

### Full test-suite boundary

`npm run test:all` reaches `test:image` and then stops because this sandbox has no installed npm package tree and cannot import `pdf-lib`.

This is an environment/dependency-execution blocker, not a passing PDF/image result. PDF/image suites are therefore NOT marked PASS in this report.

### Production build

Status: NOT VERIFIED in this sandbox.

`npm run build` runs `verify:deps` first and stops with:

`DEPENDENCY ERROR: vite is not installed. Run repair-and-run.cmd or npm ci.`

No build-success claim is made.

### Browser console

Targeted source regressions for the two reported warnings are PASS:
- no `fetchPriority` / `fetchpriority` usage remains in application source
- default PWA mode does not defer `beforeinstallprompt`

A real served-browser console session cannot be executed in this sandbox because Vite/dependencies are not installed. Final browser-console verification must be run after `npm ci` on the user's Windows machine.

### Programming

Browser JavaScript/web playground remains available. Native C/C++/Python/Java/etc. execution remains gated behind the existing isolated compiler-service/VPS architecture and is not falsely marked as locally supported.

### Health/medical safety

Existing informational health tools are retained. V12 does not add dosage/IV or diagnostic tools. No medical result is presented as diagnosis or treatment advice.

## Required Windows release gate

From the folder containing `package.json`:

```bat
npm ci
npm run test:all
npm run build
npm run dev
```

Then verify in browser DevTools:
- no React invalid-DOM-property warning
- no deferred-PWA-prompt diagnostic under default configuration
- no application-generated console errors
- no failed app assets/network requests
- direct science category URLs load after refresh
- install behavior works for the actual browser/OS

Only after those dependency-backed/browser checks pass should the project be called production-verified.
