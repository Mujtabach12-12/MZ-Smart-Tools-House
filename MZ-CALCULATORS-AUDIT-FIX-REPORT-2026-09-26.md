# MZ Smart Tool House — Calculators Category Audit / Fix Report

**Date:** 2026-09-26  
**Scope:** `/calculators` and exactly six registry tools: GPA, CGPA, Marks, Grade, Attendance, Study Hours.  
**Base project:** latest MZ Smart Tool House project snapshot available in this conversation, including the Business & Finance update.

## Release status

This revision is **not declared fully released / fully verified**. Core formula, source-contract, registry, SEO and regression tests passed, but two required gates could not be completed in this environment:

1. **Current official university-policy web verification** — live web access is disabled, so no university policy was promoted to `verified: true` in this audit.
2. **Production Vite build + real browser/device QA** — the sandbox project does not contain installed `node_modules`; `npm run build` stops at `vite is not installed`.

The product therefore fails safe: university-specific GPA/CGPA calculation is blocked unless a policy is explicitly verified, while a clearly labeled custom/manual scale remains available.

## 1. Actual repository inventory

| Tool | Route | Main component | Calculation/data layer | External API | Current product status |
|---|---|---|---|---|---|
| GPA & CGPA Calculator for Pakistani Universities | `/tools/gpa-calculator` | `src/tools/calculators/GpaCalculator.jsx` → `UniversityGpaCalculator.jsx` | `src/lib/calculators/universityGpa.js` + `src/data/universities/policies.js` | None | **BLOCKED** for official-university mode; custom mode formula-tested |
| CGPA Calculator for Pakistani Universities | `/tools/cgpa-calculator` | `src/tools/calculators/CgpaCalculator.jsx` → `UniversityGpaCalculator.jsx` | same shared GPA engine/policy data | None | **BLOCKED** for official-university mode; custom mode formula-tested |
| Marks Calculator | `/tools/marks-calculator` | `src/tools/calculators/MarksCalculator.jsx` | `src/lib/calculators/marks.js` | None | **PARTIAL** — core/formula tests pass; real browser/PWA QA pending |
| Grade Calculator | `/tools/grade-calculator` | `src/tools/calculators/GradeCalculator.jsx` | `src/lib/calculators/grade.js` + verified-policy list | None | **PARTIAL** — custom/manual scale works; no official policy promoted as verified |
| Attendance Calculator | `/tools/attendance-calculator` | `src/tools/calculators/AttendanceCalculator.jsx` | `src/lib/calculators/attendance.js` | None | **PARTIAL** — formula/edge tests pass; real browser/PWA QA pending |
| Study Hours Calculator | `/tools/study-hours-calculator` | `src/tools/calculators/StudyHoursCalculator.jsx` | `src/lib/calculators/studyHours.js` | None | **PARTIAL** — formula/edge tests pass; real browser/PWA QA pending |

All six tools are browser-local. No student grades/marks are sent to a backend by these calculators.

## 2. Critical problems found in the existing implementation

1. **University verification was inferred from `sourceUrl + grades` instead of an explicit verified state.** A source link alone is not proof that the policy is current or correct.
2. The university picker used `u.verified`, but the calculation view used `Boolean(sourceUrl && grades.length)`, producing inconsistent verification behavior.
3. GPA course rows defaulted to `3` credit hours plus the first grade, so a user could potentially calculate a GPA from blank subject rows instead of real subject input.
4. GPA/CGPA engine logic silently skipped several invalid rows instead of explaining incomplete/invalid data.
5. The Grade Calculator silently used one default percentage-to-letter table, even though university grade boundaries differ.
6. `Number("")` caused an empty Marks Calculator obtained-marks input to behave like `0` instead of an empty-field validation error.
7. Marks Calculator computed an average internally but did not display it; mobile rows were unnecessarily cramped.
8. Attendance accepted fractional class counts and the 100% recovery edge case did not explain mathematical impossibility clearly.
9. Study Hours required an “hours available per day” value even though the core calculation only needs workload ÷ days, and it incorrectly rejected a zero workload.
10. Validation banners were visible but were not consistently announced with `role="alert"` / live-region behavior.
11. Four of the six category tools relied on generic SEO fallback content rather than calculator-specific explanations.
12. Calculator-specific success/reset/validation analytics were missing from the revised calculator interactions.

## 3. Fixes applied

- Added explicit policy-safety rules: only `verified: true` + source + verification date + grading data can be used as an official university policy.
- Existing source-backed policy records are now **source-configured-unverified**, not silently treated as verified.
- Added `isPolicyUsable`, `assertPolicyUsable`, `createCustomPolicy`, strict course/semester validation and safe custom-scale handling.
- Blank GPA rows no longer produce fabricated course results; course names, valid credit hours and real grade/marks input are required.
- CGPA now rejects partial semester rows and keeps full precision internally.
- Grade Calculator now requires an explicit choice between a verified policy and a clearly labeled custom/manual scale; it no longer silently applies one universal university table.
- Custom grade/GPA scale ranges validate labels, numeric bounds, duplicate labels and overlaps.
- Marks Calculator now distinguishes empty from zero, rejects unsafe huge values, shows total, maximum, average and percentage, and uses a mobile-friendly stacked layout.
- Attendance counts require safe whole numbers; divide-by-zero is blocked; 100% unreachable target explains why; future-miss/recovery formulas are tested.
- Study Hours now implements the core `workload ÷ days` model, supports decimals, accepts zero workload, and makes availability/feasibility optional.
- Added mobile numeric/decimal keyboard hints and dynamic field labels where applicable.
- Added accessible error announcements and polite result live regions.
- Added calculator analytics events using the existing production-only GA4 helper; no events are simulated outside production.
- Added unique SEO content for all six calculator pages.
- Added two dedicated test suites and included them in `test:all`.

## 4. University policy audit

**Important:** the table below reports what exists in the repository. It does **not** claim current web verification. Live web access is unavailable in this execution environment, so every current production university remains unverified in this audit and official-university calculation is blocked.

| University | Verification status in this audit | Configured grading type | Grade records | Configured source URL | Existing metadata date |
|---|---|---:|---:|---|---|
| University of Lahore | Source configured; not independently re-verified | absolute | 9 | https://uol.edu.pk/wp-content/uploads/2025/06/Student-Handbook-2024_compressed.pdf | 2026-09-16 |
| University of Central Punjab | Source configured; not independently re-verified | relative | 11 | https://ucp.edu.pk/rules-regulations/ | 2026-09-16 |
| FAST-NUCES | Source configured; not independently re-verified | letter-points | 10 | https://www.nu.edu.pk/Student/Grading | 2026-09-16 |
| National University of Sciences & Technology | Source configured; not independently re-verified | absolute | 8 | https://nust.edu.pk/wp-content/uploads/2020/03/Revised-Undergraduate-Handbook.pdf | 2026-09-16 |
| Ghulam Ishaq Khan Institute of Engineering Sciences and Technology | Source configured; not independently re-verified | letter-points | 11 | https://giki.edu.pk/academics/academic-setup/ | 2026-09-16 |
| Bahria University | Source configured; not independently re-verified | absolute | 7 | https://archive.bahria.edu.pk/index.php/academic-rules/ | 2026-09-16 |
| Air University | Source configured; not independently re-verified | letter-points | 10 | https://webdata.au.edu.pk/Pages/Academics/assets/forms/AU_Regulation_2025_21_November.pdf | 2026-09-16 |
| IBA Karachi | Source configured; not independently re-verified | absolute-or-relative | 9 | https://examination.iba.edu.pk/General.php | 2026-09-16 |
| Forman Christian College | Source configured; not independently re-verified | absolute | 11 | https://www.fccollege.edu.pk/wp-content/uploads/Bacc-Catalog-2019-Latest.pdf | 2026-09-16 |
| Information Technology University | Source configured; not independently re-verified | letter-points | 12 | https://itu.edu.pk/academics/grading-policy/ | 2026-09-16 |
| Lahore Garrison University | Source configured; not independently re-verified | absolute-or-relative | 10 | https://lgu.edu.pk/wp-content/uploads/2025/09/Student-Handbook-Volume-2.pdf | 2026-09-16 |
| NED University of Engineering & Technology | Source configured; not independently re-verified | absolute | 12 | https://tiest.neduet.edu.pk/node/151 | 2026-09-16 |
| University of the Punjab | Source configured; not independently re-verified | absolute | 10 | https://www.pu.edu.pk/puac/download/Flax-Affiliated-Colleges.pdf | 2026-09-16 |
| National University of Modern Languages | Source configured; not independently re-verified | absolute | 9 | https://www.numl.edu.pk/gallery/1737095171Student%20guide%20and%20handbook.pdf | 2026-09-16 |
| Islamia University Bahawalpur | Policy Not Verified | — | 0 | — | — |
| University of Balochistan | Source configured; not independently re-verified | marks-derived-fractional | 8 | https://application.uob.edu.pk/gso/COURSE-WORK-EVALUATION%20new.html | 2026-09-16 |
| Riphah International University | Source configured; not independently re-verified | marks-derived-fractional | 12 | https://helpdesk.riphah.edu.pk/public/assets/download_images/DownloadAttachments-69661f00e614c.pdf | 2026-09-16 |
| Superior University | Source configured; not independently re-verified | absolute | 11 | https://my.superior.edu.pk/uploads/help/superior%20academic%20regulations%20%28undergraduate%20program%29.pdf | 2026-09-16 |
| COMSATS University Islamabad | Policy Not Verified | — | 0 | — | — |
| Government College University Lahore | Policy Not Verified | — | 0 | — | — |
| LUMS | Policy Not Verified | — | 0 | — | — |
| University of Engineering and Technology Lahore | Policy Not Verified | — | 0 | — | — |
| University of Gujrat | Policy Not Verified | — | 0 | — | — |
| University of Sialkot | Policy Not Verified | — | 0 | — | — |
| University of Management and Technology | Policy Not Verified | — | 0 | — | — |
| University of Education | Policy Not Verified | — | 0 | — | — |
| Bahauddin Zakariya University | Policy Not Verified | — | 0 | — | — |
| University of Peshawar | Policy Not Verified | — | 0 | — | — |

### Policy verification rule introduced

A university is eligible for official calculation only when all are true:

```js
policy.verified === true
&& policy.sourceUrl
&& policy.lastVerified
&& policy.grades.length > 0
&& Number.isFinite(Number(policy.maxGPA))
```

This deliberately prevents an old/source-only record from silently becoming “official.”

## 5. Mathematical verification

### GPA engine — policy differentiation test

The same marks were run through **two synthetic test policies** (not real university policies):

`85, 78, 72, 68, 81` with equal 3-credit courses.

- Synthetic Policy A actual GPA: **3.20**
- Synthetic Policy B actual GPA: **2.20**

This proves the engine loads and applies the selected policy independently instead of reusing one global table.

### Policy isolation

Test sequence:

`Policy A → marks 85 → A`  
`Policy B → marks 85 → B`  
`Policy A again → marks 85 → A`

Result: **PASS** — no cross-policy mutation/state contamination in the pure engine.

### CGPA weighted test

Semester 1: `3.00 × 15 credits`  
Semester 2: `3.50 × 18 credits`

Expected and actual internal result:

`(3.00×15 + 3.50×18) / 33 = 3.2727272727...`

The engine keeps full precision; UI presentation may show `3.27`.

### Marks Calculator

Inputs: `85, 78, 92, 67, 88`, each out of 100.

- Expected total: **410** — actual **410**
- Expected maximum: **500** — actual **500**
- Expected average: **82** — actual **82**
- Expected percentage: **82%** — actual **82%**

### Grade Calculator

Manual test scale: `90–100 = A`, `80–89.99 = B`.

- `89.99` → **B**
- `90` → **A**
- `100` → **A**
- overlapping custom bands → **validation error**
- below 0 / above 100 → **validation error**

### Attendance Calculator

- `80 / 100` → **80%**
- `45 / 50` → **90%**
- `0 / 10` → **0%**
- total `0` → **validation error**, no NaN/Infinity
- `50 / 100`, target `90%` → **400 consecutive attended classes**
- target `100%` when a class has already been missed → clear finite-reach impossibility error
- thresholds `50, 60, 70, 75, 80, 85, 90` exercised across miss/recovery branches

### Study Hours Calculator

- `40 / 5` → **8 hours/day**
- `30 / 6` → **5 hours/day**
- `25.5 / 5` → **5.1 hours/day**
- `0 / 5` → **0 hours/day**
- days `0` → **validation error**
- optional availability `4 h/day` with `40 h / 5 days` → **20-hour shortfall**

## 6. Automated and regression tests actually executed

- `node test/academic-calculators.test.mjs` → **31/31 PASS**
- `node test/calculators.test.mjs` → **54/54 PASS**
- `node test/academic-calculator-product.test.mjs` → **PASS**
- tool registry → **307/307 active tools wired**
- category registry → **307 tools / 27 categories; Calculators = 6**
- no-fake-feature regression → **PASS**
- SEO architecture → **PASS**
- analytics/mobile/SEO → **21/21 PASS**
- platform feature regression → **PASS**
- final platform regression → **PASS**
- production master regression → **PASS**
- Capacitor audit → **18 checks PASS**
- PWA audit → **PASS**
- mobile source/layout audit → **PASS**
- bundle/import audit → **223 modules checked, 307/307 tools wired, 0 syntax errors, 0 unresolved imports, 0 missing exports**

Bundle audit still reports the existing unused-module warnings:

- `src/lib/calculators/cgpa.js`
- `src/lib/calculators/gpa.js`
- `src/lib/pdf/pageCount.js`

These are cleanup warnings, not failures.

## 7. Production build attempt

Command actually executed:

```bash
npm run build
```

Result in this sandbox:

```text
DEPENDENCY ERROR: vite is not installed. Run repair-and-run.cmd or npm ci.
```

Therefore **production build is not claimed PASS for this revision in this environment**. The source/bundle audit passed, but the final Vite build must be run on the user's normal project machine where dependencies are installed.

## 8. Responsive / browser verification

Source-level responsive contracts were checked and the global mobile/PWA audits passed. The revised components use responsive grids, 44px-class actions, labels and mobile input modes.

However, this environment does not provide a real Chrome/Edge/Safari + installed PWA browser/device session. Therefore the requested 320/375/390/768/1366/1440 visual/manual matrix is **not claimed complete**.

## 9. Final status table

| # | Tool | Formula Verified | Policy Verified | Normal Tests | Edge Tests | Desktop | Mobile | PWA | Automated Tests | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | GPA & CGPA Calculator | Yes, engine/custom mode | **No official university promoted in this audit** | PASS in synthetic/custom engine | PASS | Not manually browser-tested | Not manually browser-tested | Source audit PASS | PASS | **BLOCKED** |
| 2 | CGPA Calculator | Yes, credit-weighted engine | **No official university promoted in this audit** | PASS in synthetic/custom engine | PASS | Not manually browser-tested | Not manually browser-tested | Source audit PASS | PASS | **BLOCKED** |
| 3 | Marks Calculator | Yes | N/A | PASS | PASS | Source contract only | Source contract only | Source audit PASS | PASS | **PARTIAL** |
| 4 | Grade Calculator | Yes, manual/verified-policy engine | Official policies currently unavailable | PASS custom scale | PASS | Source contract only | Source contract only | Source audit PASS | PASS | **PARTIAL** |
| 5 | Attendance Calculator | Yes | N/A | PASS | PASS | Source contract only | Source contract only | Source audit PASS | PASS | **PARTIAL** |
| 6 | Study Hours Calculator | Yes | N/A | PASS | PASS | Source contract only | Source contract only | Source audit PASS | PASS | **PARTIAL** |

## 10. Files changed

- `src/data/universities/policies.js`
- `src/lib/calculators/universityGpa.js`
- `src/lib/calculators/grade.js`
- `src/lib/calculators/marks.js`
- `src/lib/calculators/attendance.js`
- `src/lib/calculators/studyHours.js`
- `src/tools/calculators/UniversityGpaCalculator.jsx`
- `src/tools/calculators/GradeCalculator.jsx`
- `src/tools/calculators/MarksCalculator.jsx`
- `src/tools/calculators/AttendanceCalculator.jsx`
- `src/tools/calculators/StudyHoursCalculator.jsx`
- `src/components/tools/ErrorMessage.jsx`
- `src/components/tools/ErrorBanner.jsx`
- `src/components/tools/ResultCard.jsx`
- `src/data/tools.js`
- `src/data/toolSeo.js`
- `test/academic-calculators.test.mjs` (new)
- `test/academic-calculator-product.test.mjs` (new)
- `package.json`

## 11. Remaining limitations / required next gate

1. Re-enable live web research and independently verify each university source from current official regulations.
2. Only after that verification, set the specific policy record to `verified: true` and add/confirm policy version/year and special rules.
3. Run boundary tests for each newly verified university before exposing it as supported.
4. Run `npm install` / `npm ci`, `npm run build`, `npm run test:academic-calculators`, `npm run test:academic-calculator-product` on the production workstation.
5. Perform real browser/device QA at 320/375/390/768/1366/1440 plus installed PWA.
6. Do not change GPA/CGPA status to PASS until official policy verification and browser QA are complete.

This report deliberately does not claim current official-policy verification, live benchmark research, real-browser QA, or a successful production build when those gates were not available.
