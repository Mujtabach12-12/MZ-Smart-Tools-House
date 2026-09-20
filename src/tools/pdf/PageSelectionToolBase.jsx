import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getPdfPageCount } from "../../lib/pdf/pageCount";
import { fileToUint8Array, downloadBytes } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

/**
 * processFn(bytes, pagesInput) -> Promise<Uint8Array>
 */
export default function PageSelectionToolBase({
  processFn, actionLabel, processingLabel, filenamePrefix, placeholder,
  toolId, howTo, faq,
}) {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [pagesInput, setPagesInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleFiles([selected]) {
    setError(""); setDone(false);
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

  async function handleRun() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setDone(false);
    try {
      const bytes = await fileToUint8Array(file);
      const outBytes = await processFn(bytes, pagesInput);
      downloadBytes(outBytes, `${filenamePrefix}-${file.name}`, "application/pdf");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null); setPageCount(null); setPagesInput(""); setError(""); setDone(false);
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop a PDF file here" />
      ) : (
        <div className="space-y-4">
          <FileListItem name={file.name} size={file.size} onRemove={handleReset} />
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">
              Pages {pageCount ? `(1-${pageCount})` : ""}
            </label>
            <input
              type="text"
              value={pagesInput}
              onChange={(e) => setPagesInput(e.target.value)}
              placeholder={placeholder}
              className="mz-input max-w-xs"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleRun} disabled={!file || isProcessing} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? processingLabel : actionLabel}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {done && !error && <p className="text-sm font-medium text-green-600">Your PDF has been downloaded.</p>}
      </div>

      <ToolExtras toolId={toolId} category="pdf-tools" showPrivacyNote howTo={howTo} faq={faq} />
    </div>
  );
}
