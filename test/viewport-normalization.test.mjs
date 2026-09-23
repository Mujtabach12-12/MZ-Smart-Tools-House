import fs from "node:fs";
import assert from "node:assert/strict";

const css = fs.readFileSync("src/index.css", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const settings = fs.readFileSync("src/pages/Settings.jsx", "utf8");

assert.ok(css.includes("font-size:16px"), "root font size must be normalized to 16px");
assert.ok(css.includes("-webkit-text-size-adjust:100%"), "mobile/webview text auto-zoom must be normalized");
assert.ok(css.includes("text-size-adjust:100%"));
assert.ok(!css.includes("zoom:var(--mz-ui-scale)"), "app-level CSS zoom must not compound browser zoom");
assert.ok(!css.includes("width:calc(100% / var(--mz-ui-scale))"));
assert.ok(!html.includes("style.setProperty(\"--mz-ui-scale\""), "startup must not restore a custom UI scale");
assert.ok(html.includes("localStorage.removeItem(\"mz-ui-scale-settings-v2\")"), "legacy scale preference should be cleared");
assert.ok(!settings.includes("ViewScaleControl"));
assert.ok(css.includes(".mz-hero .grid>*{min-width:0}"), "desktop hero grid children must be allowed to shrink without overflow");
assert.ok(css.includes("font-size:clamp(2.55rem,4.2vw,3.75rem)"), "desktop hero heading must remain bounded");
console.log("Viewport normalization: PASS");
