import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildEditableTextBlocks,
  countDirtyBlocks,
  pageBlocksToPlainText,
  restoreEditableBlock,
  updateEditableBlock,
} from "../src/lib/pdf/editableText.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src/tools/office/PdfEditor.jsx"), "utf8");
const css = fs.readFileSync(path.join(root, "src/index.css"), "utf8");

const pdfjs = { Util: { transform: (_a, b) => b } };
const viewport = { width: 600, height: 800, scale: 1, transform: [1,0,0,1,0,0] };
const content = {
  styles: { f1: { fontFamily: "Arial" } },
  items: [
    { str: "Hello", width: 35, transform: [1,0,0,12,50,100], fontName: "f1", hasEOL: false },
    { str: "world", width: 34, transform: [1,0,0,12,90,100], fontName: "f1", hasEOL: true },
    { str: "Second line", width: 70, transform: [1,0,0,12,50,140], fontName: "f1", hasEOL: true },
  ],
};

const blocks = buildEditableTextBlocks(content, viewport, pdfjs);
assert.equal(blocks.length, 2);
assert.equal(blocks[0].text, "Hello world");
assert.equal(blocks[0].dirty, false);
assert.ok(blocks[0].leftPct > 0 && blocks[0].leftPct < 100);

const edited = updateEditableBlock(blocks, blocks[0].id, { text: "Hello MZ" });
assert.equal(edited[0].dirty, true);
assert.equal(countDirtyBlocks({ 0: edited }), 1);
assert.match(pageBlocksToPlainText(edited), /Hello MZ/);
const restored = restoreEditableBlock(edited, blocks[0].id);
assert.equal(restored[0].dirty, false);
assert.equal(restored[0].text, "Hello world");

for (const token of [
  "Edit existing text", "OCR this scanned page", "Export editable Word (.docx)",
  "contentEditable", "applyTextEdits", "validateOoxmlOutput", "announceToolSuccess",
]) assert.ok(source.includes(token), `Missing PDF editor capability token: ${token}`);

assert.match(source, /complex PDF positioning, fonts, tables and graphics may not map exactly/i);
assert.match(source, /not secure redaction/i);
assert.match(css, /mz-pdf-editor-toolbar-scroll/);
assert.match(css, /overflow-x:auto/);
assert.match(css, /mz-pdf-editor-page\{width:100%!important;max-width:100%!important/);

console.log("PDF editable-text/mobile workspace tests PASS (core transforms + source contracts)");
