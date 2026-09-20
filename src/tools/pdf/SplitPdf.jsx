import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { splitPdf } from "../../lib/pdf/split";
import { formatBytes } from "../../lib/pdf/core";
import { getPdfPageCount } from "../../lib/pdf/pageCount";
import { fileToUint8Array, downloadBytes } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function SplitPdf() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [ranges, setRanges] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [parts, setParts] = useState([]);

  async function handleFiles([selected]) {
    setError(""); setParts([]);
    if (selected.type !== "application/pdf") {
      setError(`"${selected.name}" is not a PDF file.`);
      return;
    }
    setFile(selected);
    try {
      const bytes = await fileToUint8Array(selected);
      setPageCount(await getPdfPageCount(bytes));
    } catch {
      setError("This file doesn't look like a valid PDF, or it may be corrupted.");
      setFile(null);
    }
  }

  async function handleSplit() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setParts([]);
    try {
      const bytes = await fileToUint8Array(file);
      const results = await splitPdf(bytes, ranges);
      setParts(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null); setPageCount(null); setRanges(""); setParts([]); setError("");
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop a PDF file here to split" />
      ) : (
        <div className="space-y-4">
          <FileListItem name={file.name} size={file.size} onRemove={handleReset} />
          {pageCount && (
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">
                Page ranges (this PDF has {pageCount} page{pageCount > 1 ? "s" : ""})
              </label>
              <input
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="e.g. 1-2,3-4,5-6"
                className="mz-input"
              />
              <p className="mt-1 text-xs text-navy-400 dark:text-navy-500">
                Each comma-separated group becomes its own downloadable PDF.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleSplit} disabled={!file || isProcessing} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Splitting..." : "Split PDF"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {parts.length > 0 && (
          <div className="space-y-2">
            {parts.map((part) => (
              <div key={part.label} className="flex items-center justify-between rounded-xl border border-navy-100 bg-white px-4 py-3 dark:border-navy-800 dark:bg-navy-900">
                <div>
                  <p className="text-sm font-medium text-navy-800 dark:text-navy-100">Pages {part.label}</p>
                  <p className="text-xs text-navy-400">{part.pageCount} page(s) &middot; {formatBytes(part.bytes.byteLength)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadBytes(part.bytes, `split-${part.label.replace(/[^0-9-]/g, "")}.pdf`, "application/pdf")}
                  className="mz-btn-secondary"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolExtras
        toolId="pdf-splitter"
        category="pdf-tools"
        showPrivacyNote
        howTo={[
          "Upload a PDF file.",
          "Enter comma-separated page ranges, e.g. \"1-2,3-4,5-6\".",
          "Click Split PDF, then download each resulting file individually.",
        ]}
        faq={[
          { q: "What if I enter a single page like \"5\"?", a: "That's fine — a single number is treated as a one-page range." },
          { q: "Can ranges overlap?", a: "Yes, ranges can overlap if you want the same pages in more than one output file." },
        ]}
      />
    </div>
  );
}
