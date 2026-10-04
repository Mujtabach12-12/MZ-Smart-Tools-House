# MZ Smart Tools House — 2026-10-04 Upgrade

Implemented in this package:

- Added **Web Development Live Lab** as a separate tool: HTML + CSS + JavaScript editors on one page, sandboxed live preview, console/errors and downloadable HTML project.
- Kept the general Programming Lab separate for language runners.
- GPA/CGPA policy handling now activates only source-backed policy records already present in the repository that have an official source URL, verification date, grade table and max GPA. Placeholder universities without a complete source-backed policy remain blocked instead of guessed.
- Word editor now has an **Export document as** selector for DOCX, PDF, HTML, TXT and Print/Save PDF, plus quick DOCX/PDF actions.
- Added real browser-side **PowerPoint to Word** conversion (PPTX slide text -> DOCX).
- Added real browser-side **Word to PowerPoint** conversion (DOCX paragraphs -> editable PPTX outline slides).
- Existing Word->PDF, PDF->Word and PDF->PowerPoint tools remain available.
- New tools use responsive layouts intended for phone, tablet, laptop and desktop.

Verification performed in this environment:

- Tool registry audit: PASS (310 active tools have implementations)
- Category registry audit: PASS
- No-fake-feature regression audit: PASS
- Academic calculator product/source audit: PASS
- SEO growth regression: PASS

Environment limitation:

- Live web access was disabled in this session, so every university website could not be independently re-opened and re-verified on 2026-10-04. The upgrade therefore uses only source-backed university policy records already stored in the project and does not invent missing university rules.
- `npm install` could not complete in the sandbox because the dependency installation timed out. Run `npm install` and `npm run build` on the target PC before production deployment.
