import fs from "node:fs";
import assert from "node:assert/strict";

const pwa = fs.readFileSync("src/components/pwa/PwaManager.jsx", "utf8");
const sw = fs.readFileSync("public/sw.js", "utf8");
const lock = fs.readFileSync("src/components/layout/ViewportLock.jsx", "utf8");

assert.ok(pwa.includes("reg.update()"), "PWA should actively check for new deployments");
assert.ok(pwa.includes("controllerchange"), "PWA should react when a new service worker takes control");
assert.ok(pwa.includes("window.location.reload()"), "new shell should be loaded automatically after controller change");
assert.ok(pwa.includes("30 * 60 * 1000"), "updates should be rechecked during long-running sessions");
assert.ok(sw.includes("self.skipWaiting()"));
assert.ok(sw.includes("self.clients.claim()"));
assert.ok(lock.includes("visualViewport"));
assert.ok(lock.includes("scrollLeft = 0"));
console.log("Auto update + viewport lock contract: PASS");
