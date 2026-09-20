import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const compressLib = read("src/lib/pdf/compress.js");
const compressUi = read("src/tools/pdf/CompressPdf.jsx");
const scanner = read("src/tools/scanner/SmartDocumentScanner.jsx");
const expanded = read("src/tools/expanded/ExpandedTool.jsx");

assert.match(compressLib, /candidateSize > 0 && candidateSize < originalSize/, "PDF compression must compare real byte sizes");
assert.match(compressLib, /strategy: compressed \? strategy : "original-retained"/, "larger PDF candidates must not be reported as compressed");
assert.match(compressUi, /No smaller valid PDF was produced/, "UI must disclose when no compression was achieved");
assert.doesNotMatch(compressUi, /percentLarger|result\.grew/, "old larger-output pseudo-compression path must be removed");

assert.match(scanner, /Document boundary could not be detected confidently/, "scanner must disclose low-confidence detection");
assert.match(scanner, /sourceData \|\| pages\[selected\]\.data/, "manual crop preview must use original source coordinates");
assert.match(scanner, /validateDocumentCorners/, "manual crop must validate its quadrilateral");
assert.match(scanner, /touch-none/, "scanner crop handles must be touch-friendly");

assert.match(expanded, /const \{PDFDocument\}=await import\("pdf-lib"\)/, "expanded PDF tools must load pdf-lib before use");
assert.match(expanded, /function escapeHtml\(/, "document conversion must define HTML escaping");
assert.match(expanded, /text-document\.docx/, "TXT conversion must generate a DOCX filename");
assert.match(expanded, /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/, "DOCX output must use the DOCX MIME type");
assert.match(expanded, /Choose a DOCX file/, "Word-to-PDF must accept a real DOCX input path");
assert.doesNotMatch(expanded, /Word-compatible \.doc created/, "HTML disguised as .doc must not remain");

for (const source of [expanded, read("src/tools/UtilityTool.jsx")]) {
  assert.doesNotMatch(source, /This .*tool is not configured yet/i, "production placeholder text must not be shown as a working tool");
}

console.log("No-fake-feature regression audit passed.");
