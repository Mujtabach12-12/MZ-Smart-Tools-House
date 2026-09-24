import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pdfToolMeta } from "../src/data/pdfToolMeta.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const ok = (name, fn) => { fn(); console.log(`  ok - ${name}`); };

const expectedIds = [
  "pdf-merger","pdf-splitter","pdf-compressor","pdf-to-jpg","jpg-to-pdf","pdf-to-png",
  "pdf-rotator","pdf-delete-pages","pdf-extract-pages","pdf-reorder-pages","pdf-page-counter",
  "pdf-watermark","pdf-metadata-viewer","pdf-to-word","pdf-to-excel","pdf-to-powerpoint",
  "pdf-to-text","pdf-ocr","scanned-pdf-to-searchable-pdf","pdf-repair","pdf-metadata-editor",
  "pdf-page-size-converter","pdf-compare",
];

console.log("PDF registry and SEO contracts");
ok("all 23 PDF tools have capability metadata", () => {
  assert.equal(Object.keys(pdfToolMeta).length, 23);
  for (const id of expectedIds) assert.ok(pdfToolMeta[id], `Missing ${id}`);
});
ok("every PDF tool has input/output/related SEO metadata", () => {
  for (const id of expectedIds) {
    const item = pdfToolMeta[id];
    assert.ok(Array.isArray(item.supportedInput) && item.supportedInput.length);
    assert.ok(Array.isArray(item.output) && item.output.length);
    assert.ok(Array.isArray(item.relatedTools) && item.relatedTools.length >= 2);
    assert.ok(item.seoTitle?.includes("MZ Smart Tool House"));
    assert.ok(item.seoDescription?.length >= 80);
    assert.equal(item.releaseStatus, "testing");
  }
});
ok("central registry merges PDF metadata without changing route source of truth", () => {
  const source = read("src/data/tools.js");
  assert.match(source, /import \{ pdfToolMeta \} from "\.\/pdfToolMeta\.js"/);
  assert.match(source, /const categoryMeta = pdfToolMeta\[originalTool\.id\]/);
});

console.log("Structural PDF operations");
ok("merge validates inputs/output and never rasterizes pages", () => {
  const source = read("src/tools/pdf/MergePdf.jsx");
  assert.match(source, /inspectPdfFile/);
  assert.match(source, /buildValidatedPdfArtifact/);
  assert.match(source, /expectedPageCount: totalPages/);
  assert.doesNotMatch(source, /drawImage|toDataURL|canvas/i);
});
ok("split supports all required selection modes and real ZIP", () => {
  const source = read("src/tools/pdf/SplitPdf.jsx");
  for (const token of ["ranges","every-page","every-n","selected"]) assert.ok(source.includes(token));
  assert.match(source, /import\("jszip"\)/);
  assert.match(source, /validatePdfFileOutput/);
});
ok("rotate is structural and supports all/selected pages", () => {
  const source = read("src/tools/pdf/RotatePdf.jsx");
  assert.match(source, /scope === "all"/);
  assert.match(source, /selectedPagesToRangeInput/);
  assert.match(source, /structural: true/);
  assert.doesNotMatch(source, /drawImage|canvas/i);
});
ok("delete prevents removing every page and extraction validates page counts", () => {
  const source = read("src/tools/pdf/PageSelectionToolBase.jsx");
  assert.match(source, /You cannot delete every page/);
  assert.match(source, /expectedPageCount/);
  assert.match(source, /selectedLabel=\{mode==="delete"\?"DELETE":"EXTRACT"\}/);
});
ok("reorder supports drag plus non-drag first/last controls", () => {
  const source = read("src/tools/pdf/ReorderPdfPages.jsx");
  assert.match(source, /onReorder=\{move\}/);
  assert.match(source, /onMoveFirst=\{first\}/);
  assert.match(source, /onMoveLast=\{last\}/);
});

console.log("Conversion and quality contracts");
ok("PDF-to-image supports page subsets and explicit 96/150/300 DPI", () => {
  const ui = read("src/tools/pdf/PdfToImageBase.jsx");
  const engine = read("src/lib/pdf/pdfToImages.js");
  for (const dpi of [96,150,300]) assert.match(ui, new RegExp(String(dpi)));
  assert.match(engine, /pageNumbers/);
  assert.match(ui, /Selected/);
  assert.match(ui, /JSZip|jszip/i);
});
ok("JPG-to-PDF uses original image sources and exposes page/layout controls", () => {
  const source = read("src/tools/pdf/JpgToPdf.jsx");
  for (const token of ["A4","Letter","Portrait","Landscape","Margins","Contain","Fill"]) assert.ok(source.toLowerCase().includes(token.toLowerCase()), token);
  assert.match(source, /buildValidatedPdfArtifact/);
  assert.doesNotMatch(source, /thumbnail.*output|preview.*output/i);
});
ok("compression labels estimated ranges but reports measured output sizes", () => {
  const source = read("src/lib/pdf/compress.js");
  assert.match(source, /High Quality/);
  assert.match(source, /0–15%/);
  assert.match(source, /20–60%/);
  assert.match(source, /40–80%/);
  assert.match(source, /percentSaved/);
  assert.match(source, /original-retained/);
});
ok("watermark applies structural PDF text controls, not page screenshots", () => {
  const source = read("src/lib/pdf/watermark.js");
  for (const token of ["opacity","fontSize","rotation","position","color"]) assert.ok(source.includes(token));
  assert.doesNotMatch(source, /canvas|toDataURL/);
});
ok("Office conversions validate real OOXML container structure", () => {
  const validation = read("src/lib/files/outputValidation.js");
  const conversion = read("src/tools/pdf/PdfConversionTool.jsx");
  assert.match(validation, /validateOoxmlOutput/);
  assert.match(validation, /word\/document\.xml/);
  assert.match(validation, /xl\/workbook\.xml/);
  assert.match(validation, /ppt\/presentation\.xml/);
  assert.match(conversion, /validateOoxmlOutput/);
});
ok("PDF-to-Word and Excel make fidelity limitations explicit", () => {
  const source = read("src/tools/pdf/PdfConversionTool.jsx");
  assert.match(source, /Text-focused conversion/);
  assert.match(source, /Automatic table reconstruction is not claimed/);
});
ok("PDF-to-PowerPoint has honest page-image and text-outline modes", () => {
  const source = read("src/tools/pdf/PdfConversionTool.jsx");
  assert.match(source, /page-image/);
  assert.match(source, /text-outline/);
  assert.match(source, /visually faithful but not fully editable/);
});

console.log("OCR/searchable PDF contracts");
ok("PDF OCR uses real page progress and cancellation, not fake timers", () => {
  const source = read("src/lib/pdf/ocr.js");
  assert.match(source, /onProgress\?\.\(pageNumber, doc\.numPages\)/);
  assert.match(source, /signal\?\.aborted/);
  assert.doesNotMatch(source, /setTimeout|Math\.random/);
});
ok("searchable PDF preserves original source pages and adds OCR text", () => {
  const source = read("src/lib/pdf/ocr.js");
  assert.match(source, /PDFDocument\.load\(bytes\.slice\(\)\)/);
  assert.match(source, /getTextContent/);
  assert.match(source, /opacity: 0/);
  assert.match(source, /bbox/);
  assert.doesNotMatch(source, /embedPng|embedJpg/);
});
ok("repair and compare are conservative about their actual capabilities", () => {
  const source = read("src/tools/pdf/PdfAdvancedTool.jsx");
  assert.match(source, /not a recovery engine for severely corrupted content/);
  assert.match(source, /does not claim pixel-perfect visual comparison/);
});

console.log("Viewer, memory and feedback contracts");
ok("mobile PDF reader defaults/refits to calculated Fit Width and resets horizontal overflow", () => {
  const source = read("src/tools/office/PdfViewer.jsx");
  assert.match(source, /mode: "width"/);
  assert.match(source, /window\.innerWidth < 768 \|\| widthScale < 1/);
  assert.match(source, /viewer\.scrollLeft = 0/);
  assert.match(source, /mz-pdf-reader-active/);
});
ok("mobile immersive reader hides bottom navigation and uses safe viewport sizing", () => {
  const css = read("src/index.css");
  assert.match(css, /mz-pdf-reader-active[\s\S]*mz-mobile-bottom-nav/);
  assert.match(css, /100dvh/);
  assert.match(css, /safe-area-inset-bottom/);
});
ok("page thumbnails are lazy navigation previews and revoke object URLs offscreen", () => {
  const source = read("src/components/tools/pdf/PdfPagePicker.jsx");
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /URL\.revokeObjectURL/);
  assert.match(source, /if \(!visible && urlRef\.current\)/);
});
ok("validated result triggers optional shared feedback without blocking download", () => {
  const source = read("src/components/tools/pdf/PdfResultPanel.jsx");
  assert.match(source, /announceToolSuccess\(\{ source: "result"/);
  assert.match(source, /downloadArtifact\(artifact\)/);
});

console.log("\n23-tool PDF product suite source contracts passed.");
