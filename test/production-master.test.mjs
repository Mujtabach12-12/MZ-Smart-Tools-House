import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");


function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(path) : /\.(?:js|jsx)$/.test(entry.name) ? [path] : [];
  });
}
const rogueDownloads = sourceFiles("src").filter((path) => path !== "src/lib/download.js" && /\.download\s*=/.test(read(path)));
assert.deepEqual(rogueDownloads, [], `direct browser download assignments must use the shared download system: ${rogueDownloads.join(", ")}`);

const main = read("src/main.jsx");
assert.ok(main.includes("ToastCenter") && main.includes("<ToastCenter"), "global toast center must be mounted");

const download = read("src/lib/download.js");
assert.ok(download.includes("notify(") && download.includes("Your file is ready"), "downloads must publish a truthful shared ready notification");

const feedback = read("src/components/ui/FeedbackDialog.jsx");
for (const token of ["rating", "postFeedback", "mz-feedback", "queueFeedback", "Feedback received", "Escape", "firstFieldRef"])
  assert.ok(feedback.includes(token), `feedback system missing ${token}`);
const html = read("index.html");
assert.ok(html.includes('name="rating"'), "Netlify feedback detector form must declare the rating field");

const errorBoundary = read("src/components/layout/ErrorBoundary.jsx");
assert.ok(errorBoundary.includes("mz-feedback-open") && errorBoundary.includes("Report problem"), "global error state must expose feedback/reporting");

const scanner = read("src/tools/scanner/SmartDocumentScanner.jsx");
for (const token of [
  'useState("capture")', "Confirm Crop & Continue", "Apply Filter & Continue", "Export or add another image", "US Letter", "PDF margins", "JSZip", "Enhanced", "Document", "Grayscale", "Black & White", "Searchable PDF", "OCR Page"
]) assert.ok(scanner.includes(token), `scanner production workflow missing ${token}`);

const recent = read("src/components/home/RecentFiles.jsx");
for (const token of ["mz-online-word-library-v1", "mz-online-excel-workbook-v1", "mz-online-powerpoint-deck-v1", "No recent files yet"])
  assert.ok(recent.includes(token), `dashboard recent-work integration missing ${token}`);

const toolPage = read("src/pages/ToolPage.jsx");
assert.ok(toolPage.includes("APP_WORKSPACES") && toolPage.includes("mz-app-workspace"), "major apps must use an application workspace layout");
for (const id of ["mz-online-word", "mz-online-excel", "mz-online-powerpoint", "mz-pdf-editor", "mz-pdf-viewer", "mz-powerpoint-viewer", "smart-document-scanner", "programming-lab"]) assert.ok(toolPage.includes(`"${id}"`), `application workspace set missing ${id}`);
assert.ok(toolPage.includes("url: BASE_URL") && !toolPage.includes('url: "https://www.mzsolutions.app"'), "tool schema must use the configured site URL");

const dictionary = read("src/tools/reference/MzDictionary.jsx");
assert.ok(dictionary.includes("12000") && dictionary.includes("request took too long"), "dictionary must have a bounded network timeout and actionable error");

const pwa = read("src/components/pwa/PwaManager.jsx");
assert.ok(pwa.includes("App installed successfully") && pwa.includes("notify("), "PWA install/update flow must provide user feedback");


const contact = read("src/pages/Contact.jsx");
for (const token of ['"form-name": "mz-feedback"', 'fetch("/"', 'Open Feedback'])
  assert.ok(contact.includes(token), `contact form must use the real Netlify feedback path: missing ${token}`);
assert.ok(!contact.includes("isn't wired") && !contact.includes("not wired"), "contact form must not present a fake success stub");

const pdfViewer = read("src/tools/office/PdfViewer.jsx");
for (const token of ["Fit width", "Fit page", 'fitView("width")', 'fitView("page")', "Download original"])
  assert.ok(pdfViewer.includes(token), `PDF viewer missing ${token}`);

const hardcodedSiteUrls = sourceFiles("src").filter((path) => path !== "src/components/layout/Seo.jsx" && read(path).includes("https://www.mzsolutions.app"));
assert.deepEqual(hardcodedSiteUrls, [], `production site URL must be configurable outside Seo fallback: ${hardcodedSiteUrls.join(", ")}`);

const netlify = read("netlify.toml");
for (const token of ['for = "/sw.js"', 'no-cache, no-store, must-revalidate', 'for = "/manifest.webmanifest"', 'for = "/index.html"'])
  assert.ok(netlify.includes(token), `Netlify PWA cache policy missing ${token}`);

console.log("Production master regression checks passed.");
