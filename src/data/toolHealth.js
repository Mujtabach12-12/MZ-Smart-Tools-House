import { tools } from "./tools.js";

// Health is intentionally conservative. A routed component or a passing pure
// function test does not prove UI, download or mobile behavior. Only rows with
// every applicable check passing may become `working`.
export const CURRENT_LOGIC_PASS_IDS = new Set([
  "gpa-calculator","cgpa-calculator","percentage-calculator","marks-calculator","grade-calculator","attendance-calculator","age-calculator","discount-calculator","average-calculator","ratio-calculator","time-calculator","study-hours-calculator",
  "smart-document-scanner",
  "tip-calculator","bill-splitter","tax-calculator","fuel-cost-calculator","speed-distance-time","pace-calculator","running-pace-calculator","study-hours-calculator-plus","percentage-calculator-plus","marks-required-calculator",
]);

// These families have deterministic regression suites in the repository, but
// this audit environment could not execute them because npm dependencies were
// unavailable. They stay NOT RUN instead of being presented as green.
export const REGRESSION_SUITE_IDS = new Set([
  "pdf-merger","pdf-splitter","pdf-compressor","pdf-to-jpg","jpg-to-pdf","pdf-to-png","pdf-rotator","pdf-delete-pages","pdf-extract-pages","pdf-reorder-pages","pdf-page-counter","pdf-watermark","pdf-metadata-viewer",
  "image-compressor","image-resizer","jpg-to-png","png-to-jpg","jpg-to-webp","png-to-webp","webp-to-jpg","image-cropper","image-rotator","image-to-pdf","passport-photo-resizer",
]);

const LAST_LOGIC_TEST_TIME = "2026-09-20 01:19 PKT";
const NOT_TESTED = "NOT TESTED";
const NOT_RUN = "NOT RUN";
const PASS = "PASS";
const NA = "N/A";

function hasDownloadWorkflow(tool) {
  return ["pdf-tools","image-tools","scanner-tools","document-tools","office-tools","text-tools","developer-tools"].includes(tool.category);
}

function buildChecks(tool) {
  const currentLogicPass = CURRENT_LOGIC_PASS_IDS.has(tool.id);
  const hasRegressionSuite = REGRESSION_SUITE_IDS.has(tool.id);
  const functionTest = currentLogicPass ? PASS : hasRegressionSuite ? NOT_RUN : NOT_TESTED;
  const outputTest = currentLogicPass && tool.id !== "smart-document-scanner" ? PASS : hasRegressionSuite ? NOT_RUN : NOT_TESTED;
  const errorHandlingTest = currentLogicPass ? PASS : hasRegressionSuite ? NOT_RUN : NOT_TESTED;
  return {
    functionTest,
    uiTest: NOT_TESTED,
    outputTest,
    downloadTest: hasDownloadWorkflow(tool) ? (hasRegressionSuite ? NOT_RUN : NOT_TESTED) : NA,
    mobileTest: NOT_TESTED,
    errorHandlingTest,
    lastTestTime: currentLogicPass ? LAST_LOGIC_TEST_TIME : hasRegressionSuite ? "Suite present — not run in this audit" : "Not yet behavior-tested",
  };
}

function isFullyPassing(checks) {
  return [checks.functionTest, checks.uiTest, checks.outputTest, checks.downloadTest, checks.mobileTest, checks.errorHandlingTest]
    .filter((value) => value !== NA)
    .every((value) => value === PASS);
}

export const healthRows = tools.map((tool) => {
  const checks = buildChecks(tool);
  const disabled = tool.status !== "active";
  const health = disabled ? "not-implemented" : isFullyPassing(checks) ? "working" : "warning";
  const note = disabled
    ? "Disabled in registry"
    : CURRENT_LOGIC_PASS_IDS.has(tool.id)
      ? tool.id === "smart-document-scanner"
        ? "Detection/crop regression tests pass; real camera, export and mobile browser workflows still require E2E verification."
        : "Deterministic calculation/error tests pass; browser UI and mobile layout remain unverified."
      : REGRESSION_SUITE_IDS.has(tool.id)
        ? "A deterministic regression suite exists, but it was not executed in this audit environment because npm dependencies were unavailable."
        : "Component is wired, but complete behavior, output, download and mobile workflows are not yet automatically verified.";
  return { id: tool.id, name: tool.name, category: tool.category, health, note, ...checks };
});

export const healthSummary = healthRows.reduce((summary,row)=>{
  summary.total += 1; summary[row.health] += 1; return summary;
},{ total:0, working:0, warning:0, failed:0, "not-implemented":0 });

export const HEALTH_AUDIT_DATE = "2026-09-20";
export const HEALTH_CHECK_VALUES = Object.freeze({ PASS, NOT_RUN, NOT_TESTED, NA });
