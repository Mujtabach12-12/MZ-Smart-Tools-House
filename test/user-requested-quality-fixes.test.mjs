import assert from "node:assert/strict";
import fs from "node:fs";

const scanner = fs.readFileSync("src/tools/scanner/SmartDocumentScanner.jsx", "utf8");
const quality = fs.readFileSync("src/lib/scanner/qualityPipeline.js", "utf8");
const compressor = fs.readFileSync("src/lib/pdf/compress.js", "utf8");
const compressorUi = fs.readFileSync("src/tools/pdf/CompressPdf.jsx", "utf8");
const startup = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("public/sw.js", "utf8");
const capacitor = fs.readFileSync("capacitor.config.ts", "utf8");
const androidStyles = fs.readFileSync("android/app/src/main/res/values/styles.xml", "utf8");

assert.doesNotMatch(scanner, /capture="environment"/, "Gallery/files picker must not force camera capture");
assert.match(scanner, /data: outputUrl, outputBlob, outputUrl, thumbnailUrl/, "Accepted scan must use full processed output for main preview, not the thumbnail");
assert.match(scanner, /page\.thumbnailUrl \|\| page\.data/, "Page manager may still use navigation thumbnails");
assert.match(scanner, /High-quality page preview/, "Scanner must expose the accepted full-resolution page preview");
assert.match(quality, /SCANNER_PREVIEW_MAX_SIDE = 1400/, "Scanner interactive preview should be sharp enough for high-DPI mobile displays");
assert.match(compressor, /expectedSaving: "0–15%"/, "High Quality estimate missing");
assert.match(compressor, /expectedSaving: "20–60%"/, "Balanced estimate missing");
assert.match(compressor, /expectedSaving: "40–80%"/, "Small File estimate missing");
assert.match(compressorUi, /Saving percentages are practical estimates, not guarantees/, "Compressor must explain that percentage ranges are estimates");
assert.match(startup, /mz-tool-loader/, "New lightweight tools loader missing");
assert.match(startup, /Developed by <strong>Muhammad Mujtaba<\/strong>/, "Developer credit missing");
assert.doesNotMatch(startup, /<video/i, "Old startup video must be removed");
assert.doesNotMatch(sw, /mz-office-welcome\.mp4/, "Service worker must not precache old startup video");
assert.match(capacitor, /launchShowDuration: 100/, "Native splash should hand off quickly to the custom tools loader");
assert.match(androidStyles, /windowSplashScreenAnimationDuration">0</, "Android system splash animation should be disabled");

console.log("Requested scanner, compressor, file-picker and startup regressions: PASS");
