import { useMemo, useState } from "react";
import { Download, Loader2, PackageOpen } from "lucide-react";
import { splitPdf } from "../../lib/pdf/split";
import { formatBytes } from "../../lib/pdf/core";
import { downloadBytes, downloadBlob } from "../../lib/download";
import { inspectPdfFile, buildSplitRangeGroups, makePdfOutputName, validatePdfFileOutput } from "../../lib/pdf/toolkit.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfStepIndicator from "../../components/tools/pdf/PdfStepIndicator.jsx";
import PdfFileSummary from "../../components/tools/pdf/PdfFileSummary.jsx";
import PdfPagePicker from "../../components/tools/pdf/PdfPagePicker.jsx";

const MODES = [
  ["ranges", "Page ranges", "Create one PDF for each range, e.g. 1-3, 5, 8-12."],
  ["every-page", "Every page", "Create a separate one-page PDF for every page."],
  ["every-n", "Every N pages", "Create equal-size groups such as every 5 pages."],
  ["selected", "Selected pages", "Tap page previews to choose individual pages."],
];

export default function SplitPdf() {
  const [source, setSource] = useState(null);
  const [mode, setMode] = useState("ranges");
  const [ranges, setRanges] = useState("");
  const [everyN, setEveryN] = useState(1);
  const [selectedPages, setSelectedPages] = useState([]);
  const [parts, setParts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles([file]) {
    setError(""); setParts([]); setSelectedPages([]);
    if (!file) return;
    try { setSource(await inspectPdfFile(file)); }
    catch (e) { setSource(null); setError(e.message || "Could not open this PDF."); }
  }

  function reset() {
    setSource(null); setMode("ranges"); setRanges(""); setEveryN(1); setSelectedPages([]); setParts([]); setError("");
  }

  function togglePage(page) {
    setSelectedPages((prev) => prev.includes(page) ? prev.filter((value) => value !== page) : [...prev, page].sort((a, b) => a - b));
    setParts([]);
  }

  async function run() {
    if (!source) return;
    setBusy(true); setError(""); setParts([]);
    try {
      const input = buildSplitRangeGroups(mode, source.pageCount, { ranges, everyN, selectedPages });
      if (mode === "ranges" && !input) throw new Error("Enter at least one page range, for example 1-3,5,8-12.");
      const results = await splitPdf(source.bytes, input);
      const validated = [];
      for (let i = 0; i < results.length; i += 1) {
        const item = results[i];
        const validation = await validatePdfFileOutput(item.bytes, item.pageCount);
        validated.push({
          ...item,
          filename: `${source.name.replace(/\.pdf$/i, "")}-split-${i + 1}.pdf`,
          size: validation.size,
          valid: true,
        });
      }
      setParts(validated);
    } catch (e) {
      setError(e.message || "The PDF could not be split.");
    } finally { setBusy(false); }
  }

  async function downloadZip() {
    if (!parts.length) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    parts.forEach((part) => zip.file(part.filename, part.bytes));
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    await downloadBlob(blob, `${source.name.replace(/\.pdf$/i, "")}-split-files.zip`);
  }

  const step = parts.length ? 4 : busy ? 3 : source ? 2 : 1;
  const modeDescription = useMemo(() => MODES.find(([id]) => id === mode)?.[2] || "", [mode]);

  return (
    <div className="mz-card p-4 sm:p-6">
      <PdfStepIndicator current={step} steps={["Select", "Choose split", "Process", "Download"]} />
      {!source ? <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Choose a PDF to split" /> : <PdfFileSummary name={source.name} size={source.size} pageCount={source.pageCount} onRemove={reset} />}

      {source ? <div className="mt-5 space-y-4">
        <fieldset>
          <legend className="text-sm font-bold text-navy-900 dark:text-white">How should MZ split this PDF?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {MODES.map(([id, label, help]) => <label key={id} className={`cursor-pointer rounded-2xl border p-4 ${mode === id ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-navy-200 dark:border-navy-700"}`}>
              <input type="radio" name="split-mode" value={id} checked={mode === id} onChange={() => { setMode(id); setParts([]); }} className="mr-2" />
              <strong className="text-sm">{label}</strong><span className="mt-1 block text-xs leading-5 text-navy-500">{help}</span>
            </label>)}
          </div>
        </fieldset>

        {mode === "ranges" ? <label className="block text-sm font-semibold text-navy-800 dark:text-white">Page ranges
          <input value={ranges} onChange={(e) => { setRanges(e.target.value); setParts([]); }} className="mz-input mt-2" placeholder="1-3,5,8-12" />
          <span className="mt-1 block text-xs font-normal text-navy-500">This PDF has {source.pageCount} pages. Each comma-separated group becomes one output PDF.</span>
        </label> : null}
        {mode === "every-n" ? <label className="block max-w-sm text-sm font-semibold text-navy-800 dark:text-white">Pages per file
          <input type="number" min="1" max={source.pageCount} value={everyN} onChange={(e) => { setEveryN(e.target.value); setParts([]); }} className="mz-input mt-2" />
        </label> : null}
        {mode === "selected" ? <div><p className="mb-2 text-sm font-semibold">Select pages ({selectedPages.length} selected)</p><PdfPagePicker file={source.file} selectedPages={selectedPages} onToggle={togglePage} /></div> : null}
        {mode !== "selected" ? <p className="text-xs text-navy-500">{modeDescription}</p> : null}
      </div> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={run} disabled={!source || busy} className="mz-btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{busy ? "Splitting PDF…" : "Split PDF"}</button>
        {source ? <button type="button" onClick={reset} className="mz-btn-secondary">Reset</button> : null}
      </div>
      <div className="mt-4"><ErrorMessage message={error} /></div>

      {parts.length ? <section className="mt-5 rounded-2xl border border-green-200 bg-green-50/60 p-4 dark:border-green-900 dark:bg-green-950/10">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-sm text-green-900 dark:text-green-200">Split complete</strong><p className="mt-1 text-xs text-navy-500">{parts.length} validated PDF{parts.length === 1 ? "" : "s"} created.</p></div>{parts.length > 1 ? <button type="button" className="mz-btn-primary" onClick={downloadZip}><PackageOpen className="h-4 w-4" /> Download ZIP</button> : null}</div>
        <div className="mt-4 space-y-2">{parts.map((part) => <div key={part.filename} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 dark:bg-navy-900"><div><strong className="text-sm">{part.filename}</strong><span className="mt-1 block text-xs text-navy-500">{part.pageCount} page{part.pageCount === 1 ? "" : "s"} · {formatBytes(part.size)}</span></div><button type="button" className="mz-btn-secondary" onClick={() => downloadBytes(part.bytes, part.filename, "application/pdf")}><Download className="h-4 w-4" /> Download</button></div>)}</div>
      </section> : null}
    </div>
  );
}
