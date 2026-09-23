import assert from "node:assert/strict";
import fs from "node:fs";

const dictionary = fs.readFileSync("src/services/dictionary.js", "utf8");
const dictionaryUi = fs.readFileSync("src/tools/reference/MzDictionary.jsx", "utf8");
const dictionaryFn = fs.readFileSync("netlify/functions/dictionary.js", "utf8");
const scanner = fs.readFileSync("src/tools/scanner/SmartDocumentScanner.jsx", "utf8");
const scannerPipeline = fs.readFileSync("src/lib/scanner/qualityPipeline.js", "utf8");
const css = fs.readFileSync("src/index.css", "utf8");

assert.match(dictionary, /REQUEST_TIMEOUT_MS = 3500/, "Dictionary must fail over from a slow source quickly");
assert.match(dictionary, /DATAMUSE_WORD_BASE/, "Dictionary must have a second real definition source");
assert.match(dictionary, /Free Dictionary API with Datamuse \+ MZ fallback/, "Dictionary source disclosure must describe fallbacks");
assert.match(dictionary, /SITE_ORIGIN = "https:\/\/mztoolshouse\.com"/, "Installed app needs a production gateway origin fallback");
assert.match(dictionaryFn, /UPSTREAM_TIMEOUT_MS = 5500/, "Dictionary serverless proxy must have a bounded upstream timeout");
assert.match(dictionaryFn, /access-control-allow-origin/, "Installed app must be able to use the production dictionary gateway fallback");
assert.doesNotMatch(dictionaryUi, /Check your connection and try again/, "Dictionary should not misdiagnose every provider timeout as the user's connection");

assert.match(scanner, /useState\("original"\)/, "Scanner filter must default to Original, not automatic enhancement");
assert.match(scanner, /filterMode: "original"/, "New scanner pages must keep an unfiltered default");
assert.match(scanner, /width: \{ ideal: 1920, max: 2560 \}/, "Camera preview must avoid unnecessary 4K live-stream load");
assert.match(scanner, /frameRate: \{ ideal: 24, max: 30 \}/, "Camera preview should use a mobile-friendly frame-rate constraint");
assert.match(scanner, /ImageCapture/, "Scanner must preserve the high-resolution still-photo path");
assert.match(scanner, /contentHint = "detail"/, "Scanner should prefer document detail when the browser exposes content hints");
assert.match(scanner, /cameraReady/, "Scanner camera must expose a real readiness state");
assert.match(scanner, /Ready · no filter applied/, "Scanner must tell users that capture is unfiltered");
assert.match(css, /mz-scanner-camera-dock/, "Scanner must provide the new touch-friendly camera dock");
assert.match(css, /object-fit:contain/, "Camera preview must show the complete stream instead of hiding edges with cover crop");
assert.match(scannerPipeline, /Math\.max\(-10, Math\.min\(10, \(172 - mean\) \/ 3\.2\)\)/, "Enhanced mode must use a gentler auto-brightness correction");

console.log("Dictionary reliability and scanner camera-quality regression checks passed.");
