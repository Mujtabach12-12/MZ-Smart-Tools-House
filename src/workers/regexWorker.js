import { executeRegexCore } from "../lib/developer/toolkit.js";

self.onmessage = (event) => {
  try {
    const result = executeRegexCore(event.data || {});
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : "Regex execution failed." });
  }
};
