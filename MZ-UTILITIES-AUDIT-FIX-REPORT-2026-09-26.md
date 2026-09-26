# MZ Smart Tool House — Utilities Audit, Fix & Verification Report

Date: 2026-09-26

## Scope

Audited and modified exactly these six Utilities tools:

1. Percentage Calculator — `/tools/percentage-calculator`
2. Age Calculator — `/tools/age-calculator`
3. Discount Calculator — `/tools/discount-calculator`
4. Average Calculator — `/tools/average-calculator`
5. Ratio Calculator — `/tools/ratio-calculator`
6. Time Calculator — `/tools/time-calculator`

No unrelated routes were intentionally redesigned.

## Repository inventory

| Tool | Route | Component | Core logic | External API | State | Current status |
|---|---|---|---|---|---|---|
| Percentage Calculator | `/tools/percentage-calculator` | `src/tools/calculators/PercentageCalculator.jsx` | `src/lib/calculators/percentage.js` | None | React local state | PARTIAL |
| Age Calculator | `/tools/age-calculator` | `src/tools/calculators/AgeCalculator.jsx` | `src/lib/calculators/age.js` | None | React local state | PARTIAL |
| Discount Calculator | `/tools/discount-calculator` | `src/tools/calculators/DiscountCalculator.jsx` | `src/lib/calculators/discount.js` | None | React local state | PARTIAL |
| Average Calculator | `/tools/average-calculator` | `src/tools/calculators/AverageCalculator.jsx` | `src/lib/calculators/average.js` | None | React local state | PARTIAL |
| Ratio Calculator | `/tools/ratio-calculator` | `src/tools/calculators/RatioCalculator.jsx` | `src/lib/calculators/ratio.js` | None | React local state | PARTIAL |
| Time Calculator | `/tools/time-calculator` | `src/tools/calculators/TimeCalculator.jsx` | `src/lib/calculators/time.js` | None | React local state | PARTIAL |

All six are local-browser calculators and do not require a backend or external data source for their core functionality.

## Critical problems found

### Percentage Calculator

- Empty numeric fields could become `0` because `Number("") === 0`.
- Core functions rounded to two decimals internally rather than preserving calculation precision.
- Percentage change from a zero baseline had a generic zero-denominator error.
- No tool-specific calculation/reset/validation analytics events.

### Age Calculator

- The default current date used `new Date().toISOString().slice(0, 10)`, which is UTC and can differ from the user's local calendar date around midnight.
- Date arithmetic depended on local JavaScript Date objects and elapsed milliseconds, creating avoidable timezone/DST risk.
- The previous year/month/day borrowing logic could produce invalid component values around month-end dates such as January 31 → March 1.

### Discount Calculator

- Empty price fields could be interpreted as zero.
- Core calculation rounded intermediate values immediately.
- Input errors were less specific than the actual mathematical limitation.

### Average Calculator

- The calculation engine rounded sum and average internally to two decimals.
- Extremely large totals could overflow without a specific validation error.
- There was no compensated summation for long decimal lists.

### Ratio Calculator

- Decimal simplification recursively multiplied by powers of ten using a decimal-place helper that did not handle scientific notation. Very small values such as `1e-7` could recurse indefinitely.
- The four-value proportion UI used a cramped fixed grid that was poor on narrow mobile widths.
- No explicit product statement that this implementation models positive ratios only.

### Time Calculator

- `Number(value) || 0` could silently convert malformed/non-finite duration values to zero.
- Decimal duration units were not explicitly accepted/rejected.
- Duration arithmetic and clock-time arithmetic needed stronger product distinction.
- Negative subtraction was rejected in the UI, but the reason needed to be explicit rather than silently changing sign.

### Shared UX/SEO

- The six dedicated calculator components each rendered their own `ToolExtras`, while `ToolPage.jsx` already renders the shared page-level `ToolExtras`. That duplicated help/related-tool content.
- Only Percentage Calculator had curated tool SEO; the other five depended on generic fallback content.
- The six utilities did not emit dedicated calculator completion/reset/validation GA4 events.

## Fixes applied

### Calculation engines

- Added strict empty/finite-number validation to Percentage and Discount calculations.
- Removed premature rounding from calculation engines; formatting now happens in the UI.
- Added overflow checks where calculations can exceed finite JavaScript numbers.
- Reworked Age Calculator with strict `YYYY-MM-DD` parsing, Gregorian calendar validation, UTC date-only arithmetic, month-end clamping, and local-calendar default date handling.
- Added compensated summation to Average Calculator.
- Reworked Ratio decimal scaling to handle exponent notation and reject impractically precise/unsafe ratios rather than recurse or produce floating artifacts.
- Reworked Time duration parsing to require whole non-negative units; minutes/seconds must be `0–59`; invalid values are not silently converted to zero.
- Duration subtraction returns an explicit negative flag. The current UI intentionally rejects a negative duration with a clear message.

### UX/accessibility

- Added 44px-class action targets using existing MZ button classes/min-height utilities.
- Added explicit field labels and mobile `inputMode` values.
- Added `aria-pressed` to mode toggles.
- Added polite live result regions and retained assertive accessible error messages.
- Rebuilt the Ratio proportion input layout to 1/2/4-column responsive composition.
- Added clear duration-vs-clock-time explanation in Time Calculator.
- Removed duplicate component-level `ToolExtras`; the existing `ToolPage` shared help/FAQ/related-tools block remains the single source.

### Analytics

Added existing production-safe analytics helper calls for:

- `calculator_complete`
- `calculator_validation_error`
- `calculator_reset`

No synthetic events are emitted without actual user actions.

### SEO

Added curated metadata/content for all six utilities in `src/data/toolSeo.js`:

- unique title
- unique description
- useful intro
- formula/method
- real example
- two factual FAQs
- relevant internal related tools

## Mathematical/date/time verification

### Percentage

- 20% of 150 = 30 — PASS
- 15% of 200 = 30 — PASS
- 7.5% of 80 = 6 — PASS
- 12.5% of 64 = 8 — PASS
- 25 is 12.5% of 200 — PASS
- 100 → 120 = +20% — PASS
- 100 → 80 = -20% — PASS
- 0% of 500 = 0 — PASS
- percentage change from old value 0 — correctly rejected as undefined

### Age

- 2000-01-01 → 2020-01-01 = 20y 0m 0d — PASS
- 2000-01-15 → 2020-01-20 = 20y 0m 5d — PASS
- 2000-01-31 → 2000-03-01 = 0y 1m 1d using month-end clamping — PASS
- 2000-02-29 → 2020-02-28 = 19y 11m 30d under the implemented exact-calendar interpretation — PASS
- 2000-02-29 → 2020-02-29 = 20y 0m 0d — PASS
- invalid 1900-02-29 — rejected
- valid 2000-02-29 — accepted
- future DOB — rejected

### Discount

- 1000 at 20% = 200 saved / 800 final — PASS
- 2500 at 15% = 375 saved / 2125 final — PASS
- 999 at 10% = 99.9 saved / 899.1 final — PASS
- 0% = unchanged — PASS
- 100% = final price 0 — PASS
- >100% — rejected

### Average

- 10,20,30 → 20 — PASS
- 5,10,15,20,25 → 15 — PASS
- 2.5,3.5,4.5 → 3.5 — PASS
- -10,10 → 0 — PASS
- -5,10,15,-10 → 2.5 — PASS
- single 50 → 50 — PASS
- invalid token — rejected
- 10,000-value list — PASS
- overflowing finite inputs — rejected before Infinity leaks to UI

### Ratio

- 8:12 → 2:3 — PASS
- 15:25 → 3:5 — PASS
- 100:250 → 2:5 — PASS
- 1.5:3 → 1:2 — PASS
- 0.0000001:0.0000002 → 1:2 — PASS
- 2:3 = 8:X → 12 — PASS
- 5:7 = X:21 → 15 — PASS
- 4:9 = 20:X → 45 — PASS
- zero/negative ratio values — intentionally rejected with clear validation

### Time

- 1h30 + 2h45 = 4h15 — PASS
- 2h40m30s + 1h30m40s = 4h11m10s — PASS
- 2h50 + 1h20 = 4h10 — PASS
- 1:59:50 + 0:00:20 = 2:00:10 — PASS
- 5h30 − 2h15 = 3h15 — PASS
- 5:10:20 − 2:40:50 = 2:29:30 — PASS
- equal durations = 0 — PASS
- 2h − 5h returns explicit negative flag; UI reports unsupported negative result rather than converting it to +3h
- 20h + 8h = 28h — PASS, proving duration mode does not wrap at 24 hours
- minutes >59 — rejected
- decimal duration units — rejected as unsupported
- 09:00 → 17:30 = 8h30 — PASS
- 22:00 → 02:00 = 4h overnight — PASS

## Automated tests executed

### New utilities tests

`npm run test:utilities`

- 64/64 utility calculation and edge-case tests PASS.

`npm run test:utilities-product`

- route/registry presence PASS
- curated SEO presence PASS
- analytics hooks PASS
- live result accessibility contract PASS
- duplicate ToolExtras prevention PASS
- responsive Ratio layout contract PASS
- Age timezone-safety messaging contract PASS
- Time duration-semantics contract PASS

### Regression tests executed

- Existing calculator suite: 54/54 PASS
- Academic calculator suite: 31 PASS
- Academic calculator product audit: PASS
- Business & Finance formula suite: PASS
- Business & Finance product audit: PASS
- Shared simple-calculator suite: PASS
- Category registry: PASS — 307 active tools / 27 categories
- Tool registry: PASS — 307/307 wired
- Functional audit: PASS — 307 registered / 307 active
- No-fake-feature audit: PASS
- SEO architecture: PASS
- Analytics/mobile/SEO: 21/21 PASS
- Mobile UI source audit: PASS
- PWA audit: PASS
- Capacitor audit: 18 checks PASS
- Final platform regression: PASS
- Production master regression: PASS
- Viewport normalization: PASS
- Viewport lock: PASS
- Auto-update/viewport lock: PASS
- Platform features: PASS
- Global UX enhancements: PASS
- Dashboard/navigation polish: PASS
- Bundle/import audit: 224 modules checked; 307/307 tools wired; 0 syntax errors, 0 unresolved imports, 0 missing exports

Bundle audit retained three pre-existing unused-module warnings:

- `src/lib/calculators/cgpa.js`
- `src/lib/calculators/gpa.js`
- `src/lib/pdf/pageCount.js`

## Production build result

`npm run build` was actually attempted in this environment.

Result:

```text
DEPENDENCY ERROR: vite is not installed. Run repair-and-run.cmd or npm ci.
```

Therefore the revised Utilities build is **not** claimed as build-PASS in this sandbox.

## Browser / responsive verification status

Real Chrome/Edge/Firefox/Safari and installed-PWA interaction testing could not be performed in this execution environment because there is no installed project dependency/browser runtime available here.

Source-level responsive/accessibility contracts and the project's existing mobile/PWA tests passed, but those do **not** replace manual real-device/browser verification.

## Benchmark research status

Live web access is disabled in this session. Current live versions of Calculator.net, Omni Calculator, timeanddate and other benchmark products were therefore **not** independently opened or verified during this run. No claim is made that live benchmark research completed successfully.

The implementation was audited and corrected against the user's supplied functional requirements, independent mathematics, Gregorian date rules and the existing MZ architecture.

## Final tool status

| # | Tool | Core logic | Normal tests | Edge tests | Desktop | Mobile | PWA | Automated tests | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Percentage Calculator | Verified | PASS | PASS | Runtime QA pending | Runtime QA pending | Runtime QA pending | PASS | PARTIAL |
| 2 | Age Calculator | Verified/fixed | PASS | PASS | Runtime QA pending | Runtime QA pending | Runtime QA pending | PASS | PARTIAL |
| 3 | Discount Calculator | Verified/fixed | PASS | PASS | Runtime QA pending | Runtime QA pending | Runtime QA pending | PASS | PARTIAL |
| 4 | Average Calculator | Verified/fixed | PASS | PASS | Runtime QA pending | Runtime QA pending | Runtime QA pending | PASS | PARTIAL |
| 5 | Ratio Calculator | Verified/fixed | PASS | PASS | Runtime QA pending | Runtime QA pending | Runtime QA pending | PASS | PARTIAL |
| 6 | Time Calculator | Verified/fixed | PASS | PASS | Runtime QA pending | Runtime QA pending | Runtime QA pending | PASS | PARTIAL |

No tool is marked PASS because the user's final gate also requires a successful production build and real desktop/mobile/PWA/browser verification.

## Files changed

- `package.json`
- `src/data/toolSeo.js`
- `src/lib/calculators/age.js`
- `src/lib/calculators/average.js`
- `src/lib/calculators/discount.js`
- `src/lib/calculators/format.js` (new)
- `src/lib/calculators/percentage.js`
- `src/lib/calculators/ratio.js`
- `src/lib/calculators/time.js`
- `src/tools/calculators/AgeCalculator.jsx`
- `src/tools/calculators/AverageCalculator.jsx`
- `src/tools/calculators/DiscountCalculator.jsx`
- `src/tools/calculators/PercentageCalculator.jsx`
- `src/tools/calculators/RatioCalculator.jsx`
- `src/tools/calculators/TimeCalculator.jsx`
- `test/utilities.test.mjs` (new)
- `test/utilities-product.test.mjs` (new)

## Local final gate

Run on the user's Windows project after copying this revision:

```bat
npm install
npm run test:utilities
npm run test:utilities-product
npm run test:calculators
npm run build
```

Then manually verify the six routes at 320, 375, 390, 768, 1366 and 1440 widths plus installed PWA mode before promoting any tool to PASS.
