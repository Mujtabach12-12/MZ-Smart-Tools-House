# MZ Smart Tool House — Truthful Tool Verification Ledger

This ledger separates code wiring from actual sample execution. It must not be used to claim browser/mobile/output verification that did not happen.

Total registered tools: **307**
- **BLOCKED_OR_KNOWN_ISSUE:** 6
- **WIRED_NOT_SAMPLE_EXECUTED:** 180
- **SOURCE_AND_INTERACTION_CONTRACT_TESTED:** 2
- **SAMPLE_LOGIC_EXECUTED:** 117
- **QUALITY_CONTRACT_TESTED:** 2

| Tool | Category | Verification | Evidence | Note |
|---|---|---|---|---|
| AI Writing Assistant | ai-tools | BLOCKED_OR_KNOWN_ISSUE | repository audit | Requires a configured server/provider before end-to-end generation can be verified. |
| MZ Online Word | office-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| MZ Programming Lab | programming-tools | BLOCKED_OR_KNOWN_ISSUE | repository audit | Compiled-language execution depends on the external compiler service; browser-only paths do not verify every advertised runtime. |
| MZ PDF Viewer | office-tools | SOURCE_AND_INTERACTION_CONTRACT_TESTED | test/phase4-reader-scanner.test.mjs | Reader/scanner interaction and quality contracts passed; real browser/device QA is still required. |
| MZ PDF Editor | office-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| MZ Online Excel | office-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| MZ PowerPoint Viewer | office-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| MZ Online PowerPoint | office-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| MZ Dictionary | student-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Smart Document Scanner | scanner-tools | SOURCE_AND_INTERACTION_CONTRACT_TESTED | test/phase4-reader-scanner.test.mjs | Reader/scanner interaction and quality contracts passed; real browser/device QA is still required. |
| GPA & CGPA Calculator for Pakistani Universities | calculators | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| CGPA Calculator for Pakistani Universities | calculators | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Percentage Calculator | utility-tools | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Marks Calculator | calculators | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Grade Calculator | calculators | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Attendance Calculator | calculators | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Age Calculator | utility-tools | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Discount Calculator | utility-tools | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Average Calculator | utility-tools | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Ratio Calculator | utility-tools | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Time Calculator | utility-tools | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Study Hours Calculator | calculators | SAMPLE_LOGIC_EXECUTED | test/calculators.test.mjs | Dedicated calculator logic executed numeric reference and error samples. |
| Merge PDF | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Split PDF | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Compress PDF | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF to JPG | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| JPG to PDF | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF to PNG | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Rotate PDF | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Delete PDF Pages | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Extract PDF Pages | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Reorder PDF Pages | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF Page Counter | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Add Watermark | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF Metadata Viewer | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Compressor | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Resizer | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| JPG to PNG | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PNG to JPG | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| JPG to WebP | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PNG to WebP | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| WebP to JPG | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Cropper | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Rotator | image-tools | QUALITY_CONTRACT_TESTED | test/quality-architecture.test.mjs | Source-quality contract passed; browser output inspection is still required. |
| Image to PDF | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Passport Photo Resizer | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Word Counter | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Character Counter | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Sentence Counter | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Case Converter | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Remove Extra Spaces | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Remove Duplicate Lines | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Text Cleaner | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Text Sorter | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Text Reverser | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Text to Slug | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Reading Time Calculator | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Line Counter | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| JSON Viewer | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| JSON Formatter | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| JSON Validator | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| JSON Minifier | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Base64 Encoder | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Base64 Decoder | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| URL Encoder | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| URL Decoder | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| HTML Formatter | developer-tools | BLOCKED_OR_KNOWN_ISSUE | repository audit | Known regex formatter correctness defect; complex source can be changed incorrectly. |
| CSS Formatter | developer-tools | BLOCKED_OR_KNOWN_ISSUE | repository audit | Known regex formatter correctness defect; quoted/complex CSS can be changed incorrectly. |
| JavaScript Formatter | developer-tools | BLOCKED_OR_KNOWN_ISSUE | repository audit | Known regex formatter correctness defect; strings/statements can be changed incorrectly. |
| Regex Tester | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Binary Converter | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Decimal Converter | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Hex Converter | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Unix Timestamp Converter | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| UUID Generator | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Password Generator | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Assignment Cover Page Generator | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Student CV Builder | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Resume Builder | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Cover Letter Generator | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Simple Application Generator | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Study Timetable Generator | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Project Report Cover Generator | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Internship Application | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Leave Application | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Scholarship Application | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| University Aggregate Calculator | university-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Merit Calculator | university-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Semester Calculator | university-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Credit Hour Calculator | university-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Scholarship Percentage Calculator | university-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Pomodoro Timer | productivity-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Stopwatch | productivity-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Countdown Timer | productivity-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Study Timer | productivity-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| To-Do List | productivity-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Daily Study Planner | productivity-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Random Study Topic Generator | productivity-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF to Word | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF to Excel | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF to PowerPoint | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF to Text | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF OCR | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Scanned PDF to Searchable PDF | pdf-tools | QUALITY_CONTRACT_TESTED | test/quality-architecture.test.mjs | Source-quality contract passed; browser output inspection is still required. |
| Text to PDF | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Markdown to PDF | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| DOCX Viewer | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| DOCX Text Extractor | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| TXT to DOCX | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| HTML to DOCX | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Markdown to HTML | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Markdown Formatter | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Document Statistics | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Find & Replace | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Whitespace Cleaner | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Line Break Cleaner | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Speaking Time Calculator | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Alternating Case | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Title Case | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Sentence Case | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Extract Emails | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Extract URLs | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Extract Numbers | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Temperature Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Length & Distance Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Weight & Mass Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Area Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Volume Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Time Unit Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Speed Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Data Storage Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Pressure Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Energy Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Power Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| CM to Feet & Inches | converter-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| KG to LBS | converter-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Date Difference Calculator | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Days Between Dates | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Weeks Between Dates | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Months Between Dates | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Years Between Dates | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Date + Days | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Date - Days | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Age Calculator Pro | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Working Days Calculator | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Business Days Calculator | date-time-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| BMI Calculator | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| BMR Calculator | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| TDEE Calculator | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Calorie Calculator | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Calorie Deficit Calculator | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Calorie Surplus Calculator | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Maintenance Calories | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Weight Loss Calories | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Weight Gain Calories | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Protein Intake Calculator | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Carbohydrate Calculator | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Fat Intake Calculator | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Water Intake Estimator | nutrition-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Ideal Weight Calculator | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Healthy Weight Range | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Body Surface Area | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Lean Body Mass Calculator | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Heart Rate Zone Calculator | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Target Heart Rate Calculator | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Pulse Counter | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Simple Interest Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Compound Interest Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| EMI Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Loan Payment Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Savings Goal Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Investment Growth Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Profit Margin Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Percentage Change Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Budget Planner | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Salary Breakdown Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Loan Affordability Calculator | finance-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Tip Calculator | daily-life-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Bill Splitter | daily-life-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Tax Calculator | daily-life-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Fuel Cost Calculator | daily-life-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Speed Distance Time Calculator | daily-life-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Pace Calculator | daily-life-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Running Pace Calculator | daily-life-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Study Hours Calculator Pro | student-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Percentage Calculator Pro | student-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Marks Required Calculator | student-tools | SAMPLE_LOGIC_EXECUTED | test/simple-calculators.test.mjs | Shared simple-calculator engine executed formula and validation samples. |
| Smart Study Schedule Generator | productivity-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Pakistan University GPA Calculator | university-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| UOL GPA Calculator | university-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| UCP GPA Calculator | university-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Custom University GPA Calculator | university-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| SHA-256 Hash Generator | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| HEX to RGB Converter | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| RGB to HEX | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| HEX to RGB | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| HTML Escape | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| HTML Unescape | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Lorem Ipsum Generator | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Unix Timestamp Converter Pro | developer-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Metadata Viewer | image-tools | BLOCKED_OR_KNOWN_ISSUE | repository audit | Current viewer does not provide full EXIF/IPTC/XMP metadata coverage implied by the tool name. |
| Image Metadata Remover | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| World Clock | world-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Time Zone Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Pregnancy Due Date Calculator | health-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Internet Data Usage Calculator | daily-life-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF Repair & Validate | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF Metadata Editor | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF Page Size Converter | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| PDF Compare | pdf-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Flipper | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Brightness | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Contrast | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Grayscale Image | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Blur | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Image Sharpen | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Favicon Generator | image-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Smart Text Summarizer | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Study Notes Generator | student-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Flashcard Generator | student-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Quiz Generator | student-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Professional Email Generator | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Formal Text Converter | text-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Word to PDF | document-tools | WIRED_NOT_SAMPLE_EXECUTED | registry + functional + bundle audits | Implementation is wired, but no truthful per-tool sample output execution was completed in this environment. |
| Universal Conversion Hub | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Height Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| BMI Calculator | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Time Duration Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Date Converter & Calculator | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Acceleration Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Data Transfer Speed Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Download Time Calculator | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Frequency Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Image Size & Aspect Ratio | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Angle Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Force Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Torque Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Voltage Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Electric Current Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Resistance Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Electric Charge Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Illuminance Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Fuel Economy Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Cooking Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Health Units Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Currency Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Cryptocurrency Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Number System Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Roman Numeral Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Percentage Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Fraction Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Density Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Molar Mass Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Concentration Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Radiation Units Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Flow Rate Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Typography & CSS Unit Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Pakistan Land Area Converter | converter-tools | SAMPLE_LOGIC_EXECUTED | test/converters.test.mjs | Shared conversion engine executed reference, round-trip and validation samples. |
| Velocity Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Force Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Work Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Kinetic Energy Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Potential Energy Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Momentum Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Density Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Pressure Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Wavelength Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Frequency & Period Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Ohm’s Law Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Electrical Power Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Specific Heat Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Thin Lens Calculator | physics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Molarity Calculator | chemistry-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Molality Calculator | chemistry-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Normality Calculator | chemistry-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Dilution Calculator | chemistry-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| pH Calculator | chemistry-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Ideal Gas Law Calculator | chemistry-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Percent Composition Calculator | chemistry-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Hardy-Weinberg Calculator | biology-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Population Growth Calculator | biology-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Microscope Magnification Calculator | biology-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| DNA Complement Tool | biology-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| DNA to RNA Tool | biology-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| RNA to Protein Helper | biology-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Punnett Square Calculator | biology-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Quadratic Equation Calculator | mathematics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Pythagorean Theorem Calculator | mathematics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Vector Magnitude Calculator | mathematics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Permutation & Combination Calculator | mathematics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Stress Calculator | engineering-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Strain Calculator | engineering-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Voltage Divider Calculator | engineering-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Series Resistance Calculator | engineering-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Parallel Resistance Calculator | engineering-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| LED Resistor Calculator | engineering-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| RC Time Constant Calculator | engineering-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Concrete Volume Calculator | engineering-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Slope & Gradient Calculator | engineering-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Gear Ratio Calculator | robotics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Wheel Speed Calculator | robotics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Battery Runtime Estimator | robotics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| PWM Duty Cycle Calculator | robotics-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Break-even Calculator | finance-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| CAGR Calculator | finance-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| ROI Calculator | finance-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
| Commission Calculator | finance-tools | SAMPLE_LOGIC_EXECUTED | test/science-formulas.test.mjs | Formula engine executed a smoke/reference sample and validation coverage. |
