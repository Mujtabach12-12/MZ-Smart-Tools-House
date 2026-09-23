import fs from "node:fs";
import assert from "node:assert/strict";

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("src/index.css", "utf8");
const layout = fs.readFileSync("src/components/layout/Layout.jsx", "utf8");
const lock = fs.readFileSync("src/components/layout/ViewportLock.jsx", "utf8");

assert.match(html, /minimum-scale=1/);
assert.match(html, /maximum-scale=1/);
assert.match(html, /user-scalable=no/);
assert.ok(layout.includes("<ViewportLock />"));
assert.ok(lock.includes("window.visualViewport?.addEventListener(\"resize\", applyViewport"));
assert.ok(lock.includes("scroller.scrollLeft = 0"));
assert.ok(lock.includes("event.preventDefault()"));
assert.ok(css.includes("overflow-x: hidden !important"));
assert.ok(css.includes("max-width: 80rem !important"));
assert.ok(css.includes("--mz-app-viewport-width"));
assert.ok(!css.includes("zoom:var(--mz-ui-scale)"));

console.log("Viewport lock + automatic fit: PASS");
