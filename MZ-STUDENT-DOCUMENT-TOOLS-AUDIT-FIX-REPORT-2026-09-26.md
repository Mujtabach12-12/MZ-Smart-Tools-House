# MZ Smart Tool House — Student Document Tools Audit & Fix Report

Date: 2026-09-26  
Category: Student Document Tools  
Audited public tools: 20

## Scope and release honesty

This work audited and modified the current MZ Smart Tool House project snapshot. No tool is marked PASS because real browser/device QA and the final production build could not be completed in this sandbox. The build was attempted but the sandbox has no installed `vite`; offline dependency installation was also attempted and failed because `zlibjs-0.3.1` is not present in the npm cache.

Live web research was unavailable in this environment. Therefore the current Microsoft Word / Google Docs / Canva / Acrobat / Smallpdf / iLovePDF / PDFgear products were not falsely claimed as reopened or re-benchmarked. Functional decisions use the user-supplied benchmark requirements plus actual DOCX/PDF/HTML format constraints and the existing repository architecture.

## Actual implementation before fixes

- The first 10 generators were routed to `src/tools/UtilityTool.jsx` and shared one generic `DocumentTool` with only Name, Email, Course/Role and Details. It downloaded HTML only and did not provide the tool-specific fields promised by the registry.
- Text/Markdown/Word-to-PDF and DOCX/Markdown utilities were routed to `src/tools/expanded/ExpandedTool.jsx`.
- The prior PDF creator generated real PDF bytes but did not re-open the generated file and verify page/text output before download.
- Markdown-to-PDF stripped a small subset of Markdown rather than rendering document structure.
- DOCX extraction opened ZIP/XML but did not verify the ZIP signature, required package parts, macros, entry count or XML size before parsing.
- TXT-to-DOCX used the real `docx` library but did not validate the generated package before download.
- HTML-to-DOCX flattened nearly everything to text and did not have an explicit security-oriented supported-element conversion path.
- Markdown-to-HTML only handled headings and one bold pattern and did not emit a full UTF-8 HTML document.
- Document Statistics forced at least 1 minute reading time even for empty text.
- Legacy document logic was duplicated across `UtilityTool.jsx` and `ExpandedTool.jsx`.

## Architecture after fixes

All 20 category tools now route to:

- `src/tools/student-documents/StudentDocumentTool.jsx`
- shared pure utilities: `src/lib/studentDocuments/toolkit.js`
- category-specific SEO: `src/data/studentDocumentSeo.js`

Legacy Student Document implementations were removed from `UtilityTool.jsx` and `ExpandedTool.jsx` so there is one production path for this category.

Heavy libraries remain lazy-loaded inside the document workspace:

- `docx`
- `jszip`
- `pdf-lib`
- `pdfjs-dist`

They are not imported by the home page or category registry.

## File integrity and security changes

### DOCX

Before a DOCX is parsed, the new implementation checks:

- non-empty file
- 20 MB browser-processing cap
- ZIP signature
- ZIP parse success
- package entry count <= 5000
- required `[Content_Types].xml`
- required `word/document.xml`
- rejects `vbaProject.bin` macro payloads
- caps individual XML processing size
- rejects malformed XML

Generated DOCX output is re-opened with JSZip before download and checks:

- required OOXML parts exist
- `word/document.xml` is non-empty
- expected generated text is present in the package

### PDF

Generated PDF output is not downloaded immediately. It is first checked for:

- `%PDF` signature
- non-empty bytes
- successful `PDFDocument.load()`
- page count >= 1
- successful PDF.js text extraction
- expected text present in extracted output

The current built-in PDF font is Latin-focused. Unsupported characters are rejected with a clear message instead of silently replacing/corrupting text. DOCX remains the full-Unicode document path.

### HTML / Markdown

- Raw Markdown HTML is escaped rather than executed.
- Generated Markdown links are restricted to `http`, `https`, or `mailto` schemes.
- HTML-to-DOCX parses input as inert HTML and discards `script`, `style`, `noscript`, `iframe`, `object`, `embed`, `meta` and `link` nodes.
- No `dangerouslySetInnerHTML`, `eval()` or `new Function()` was introduced.
- Generated HTML files include a UTF-8 declaration.

### Privacy / analytics

Document contents and personal fields are not passed to GA4. Events record actions such as:

- preview generated
- process completed
- validation error
- file downloaded
- print used

Event parameters contain tool id / format, not CV text, student names, application text or uploaded document contents.

## Generator fixes

The generic four-field generator was replaced with tool-specific input models.

- Assignment Cover: university, department, course, assignment, topic, student, roll number, semester, instructor and submission date.
- Student CV: name, title, contact, summary, education, skills, projects and experience.
- Resume: contact, summary, skills, experience, education, projects, certifications and achievements.
- Cover Letter: applicant, position, company, recipient, skills, actual experience, custom message and date.
- Formal Application: recipient, subject, applicant, reason and date.
- Project Cover: project, department, university, student, supervisor and session.
- Internship Application: student, university, degree, semester, company, position, skills, projects and availability.
- Leave Application: validated start/end dates, supplied reason, recipient and student; inclusive calendar day count is calculated with date-only arithmetic.
- Scholarship Application: applicant, program, university, semester, scholarship, user-supplied achievements and statement.
- Study Timetable: multiple editable rows, 24-hour time validation, chronological ordering and same-day overlap detection.

Generators provide real preview content and real DOCX/HTML downloads. Print uses the real browser print path so the user can choose Save as PDF; it is not represented as a fake programmatic PDF download.

## Converter / utility fixes

- Text to PDF: real PDF generation + post-generation PDF parse/text validation.
- Markdown to PDF: headings, lists, quotes, code blocks and horizontal rules are parsed into PDF blocks; unsupported complex Markdown tables are not claimed.
- Word to PDF: validates DOCX, extracts body text locally, creates PDF and validates output. It is explicitly labeled text-focused rather than full Word layout fidelity.
- DOCX Viewer: validates a real DOCX package and extracts body text; does not claim full Word rendering.
- DOCX Text Extractor: validates DOCX and downloads real TXT output.
- TXT to DOCX: generates a real OOXML package and validates it before download.
- HTML to DOCX: parses inert HTML, supports common document blocks/emphasis/lists, generates and validates a real DOCX.
- Markdown to HTML: safe HTML output with headings, lists, emphasis, links, code, quotes and rules.
- Markdown Formatter: conservative whitespace / heading / list normalization; fenced code content remains unchanged.
- Document Statistics: actual word, character, sentence, paragraph and reading-time calculations; empty text now reports zero reading time. Reading speed assumption is explicitly 200 words/minute.

## Mathematical / content verification executed

`node test/student-documents.test.mjs`

Result:

`Student Document core tests PASS (21/21)`

Verified examples include:

- Assignment cover preserves every provided test field.
- Student CV preserves supplied education, skills and projects and does not invent achievements.
- Resume optional empty sections are omitted.
- Invalid email and unsafe resume links are rejected.
- Leave 2026-09-28 → 2026-09-30 = 3 calendar days inclusive.
- Same-day leave = 1 day.
- Reversed leave range is rejected.
- Timetable 09:00–10:00 plus 09:30–10:30 on the same day is detected as an overlap.
- `Hello world. This is a test document.` = 7 words, 37 characters, 2 sentences.
- Empty document reading time = 0.
- Unicode word counting smoke test passes.
- Markdown headings, lists, bold, italic, code and safe links are parsed.
- `<script>` Markdown input is escaped.
- `javascript:` Markdown links are neutralized.
- Fenced code is preserved by the formatter.

`node test/student-documents-product.test.mjs`

Result:

`Student Document product/source audit PASS (20/20 dedicated routes + file-integrity/security/SEO contracts)`

## Regression verification executed

The following dependency-free/source-level suites passed after the changes:

- Student Document core: 21/21 PASS
- Student Document product/source: 20/20 route/security/SEO contracts PASS
- No-fake-feature regression: PASS
- Tool registry: 307/307 active tools wired
- Category registry: 307 tools / 27 categories / 20 Student Document Tools
- Platform features: PASS
- MZ Office + Dictionary source regression: PASS
- Final platform regression: PASS
- Production master regression: PASS
- SEO architecture: PASS
- Analytics/mobile/SEO: 21/21 PASS
- Mobile UI source audit: PASS
- PWA audit: PASS
- Capacitor audit: 18 checks PASS
- Phase 3 quality architecture: 20/20 PASS
- Phase 4 Reader/Scanner: 20/20 PASS
- Bundle/import audit: 231 modules checked, 307/307 tools wired, 0 syntax errors, 0 unresolved imports, 0 missing exports

Known unused-module warnings remain unrelated to this category:

- `src/lib/calculators/cgpa.js`
- `src/lib/calculators/gpa.js`
- `src/lib/pdf/pageCount.js`
- `src/workers/regexWorker.js` is referenced through `new Worker(new URL(...))`, so the static reachability audit does not count it as a normal import.

## Production build result

`npm run build` was actually attempted.

Result:

`DEPENDENCY ERROR: vite is not installed. Run repair-and-run.cmd or npm ci.`

An offline dependency install was also attempted:

`npm ci --offline --ignore-scripts`

Result:

`zlibjs-0.3.1` was not present in the sandbox npm cache, so dependency installation could not complete.

Therefore the revised production build is NOT marked PASS in this report.

## Tool-by-tool final status

| # | Tool | Core implementation after fix | Automated/source test | Browser/device test | Build | Final status |
|---|---|---|---|---|---|---|
| 1 | Assignment Cover Page Generator | Tool-specific fields, preview, DOCX/HTML/print | PASS | Not available here | Blocked by deps | PARTIAL |
| 2 | Student CV Builder | Single-column text-first CV, DOCX/HTML/print | PASS | Not available here | Blocked by deps | PARTIAL |
| 3 | Resume Builder | ATS-oriented text-first sections, DOCX/HTML/print | PASS | Not available here | Blocked by deps | PARTIAL |
| 4 | Cover Letter Generator | Uses only supplied facts, DOCX/HTML/print | PASS | Not available here | Blocked by deps | PARTIAL |
| 5 | Simple Application Generator | Formal deterministic template, real exports | PASS | Not available here | Blocked by deps | PARTIAL |
| 6 | Study Timetable Generator | Multi-row schedule + overlap detection | PASS | Not available here | Blocked by deps | PARTIAL |
| 7 | Project Report Cover Generator | Academic cover fields + real exports | PASS | Not available here | Blocked by deps | PARTIAL |
| 8 | Internship Application | User-data-only structured application | PASS | Not available here | Blocked by deps | PARTIAL |
| 9 | Leave Application | Date validation + inclusive day count | PASS | Not available here | Blocked by deps | PARTIAL |
| 10 | Scholarship Application | User-data-only structured application | PASS | Not available here | Blocked by deps | PARTIAL |
| 11 | Text to PDF | Real PDF + post-generation parse/text validation | Source contract PASS | Not available here | Blocked by deps | PARTIAL |
| 12 | Markdown to PDF | Structural Markdown subset + validated PDF | Source contract PASS | Not available here | Blocked by deps | PARTIAL |
| 13 | DOCX Viewer | OOXML package validation + body text extraction | Source contract PASS | Not available here | Blocked by deps | PARTIAL |
| 14 | DOCX Text Extractor | Validated OOXML extraction + real TXT download | Source contract PASS | Not available here | Blocked by deps | PARTIAL |
| 15 | TXT to DOCX | Real DOCX generation + package/text validation | Source contract PASS | Not available here | Blocked by deps | PARTIAL |
| 16 | HTML to DOCX | Inert HTML parsing + real validated DOCX | Source/security contract PASS | Not available here | Blocked by deps | PARTIAL |
| 17 | Markdown to HTML | Safe local conversion + real HTML download | Core PASS | Not available here | Blocked by deps | PARTIAL |
| 18 | Markdown Formatter | Conservative formatting, fenced code preserved | Core PASS | Not available here | Blocked by deps | PARTIAL |
| 19 | Document Statistics | Real local counts + documented reading assumption | Core PASS | Not available here | Blocked by deps | PARTIAL |
| 20 | Word to PDF | Validated DOCX text extraction + validated PDF | Source contract PASS | Not available here | Blocked by deps | PARTIAL |

No tool is marked PASS solely because its page opens.

## Remaining limitations

1. Real Chromium/mobile/PWA file-generation workflows still need manual runtime testing.
2. Actual generated DOCX files still need opening in Microsoft Word/LibreOffice on the user's machine before final release status.
3. Actual generated PDFs still need visual inspection and print testing on the user's machine.
4. PDF Unicode is limited by the built-in PDF font; unsupported characters are blocked rather than corrupted. DOCX is the recommended Unicode path.
5. DOCX Viewer/Extractor is text-focused and does not render exact Word layout, images, tables as visual tables, headers/footers or complex styling.
6. Word to PDF is text-focused and intentionally does not claim full Microsoft Word fidelity.
7. HTML to DOCX supports common document semantics, not arbitrary CSS/layout fidelity.
8. Markdown to PDF supports a documented subset; complex tables/raw HTML are not claimed.
9. Current live benchmark-product review could not be completed because web access is disabled in this environment.

## Files changed / added

Added:

- `src/lib/studentDocuments/toolkit.js`
- `src/tools/student-documents/StudentDocumentTool.jsx`
- `src/data/studentDocumentSeo.js`
- `test/student-documents.test.mjs`
- `test/student-documents-product.test.mjs`
- this report

Modified:

- `src/tools/index.js`
- `src/tools/UtilityTool.jsx`
- `src/tools/expanded/ExpandedTool.jsx`
- `src/data/toolSeo.js`
- `test/no-fake-features.test.mjs`
- `package.json`

## Local final release gate

Run on the normal Windows repository with dependencies installed:

```bat
cd /d "C:\Users\HP\Downloads\MZ-SMART-TOOL-HOUSE-GLOBAL-V12-FINAL"

npm install
npm run test:student-documents
npm run test:student-documents-product
npm run test:no-fake
npm run test:registry
npm run test:category-registry
npm run test:seo-architecture
npm run test:analytics-seo
npm run test:mobile-ui
npm run build
```

Then manually verify the 20 routes at desktop, tablet, mobile and installed PWA sizes, generate representative DOCX/PDF/HTML files, open those files, inspect PDF print output, and check console/network before promoting any tool from PARTIAL to PASS/FIXED.
