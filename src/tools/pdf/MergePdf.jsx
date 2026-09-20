import { useState } from "react";
import { ArrowDown, ArrowUp, FileText, Loader2, X } from "lucide-react";
import { mergePdfs } from "../../lib/pdf/merge";
import { formatBytes } from "../../lib/pdf/core";
import { fileToUint8Array, downloadBytes } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function MergePdf() {
  const [files, setFiles] = useState([]); // [{id, file}]
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleFiles(newFiles) {
    setError("");
    setDone(false);
    const invalid = newFiles.find((f) => f.type !== "application/pdf");
    if (invalid) {
      setError(`"${invalid.name}" is not a PDF file.`);
      return;
    }
    setFiles((prev) => [...prev, ...newFiles.map((file) => ({ id: crypto.randomUUID(), file }))]);
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setDone(false);
  }

  function moveFile(index, direction) {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleMerge() {
    if (files.length < 2) {
      setError("Add at least two PDF files to merge.");
      return;
    }
    setIsProcessing(true);
    setError("");
    setDone(false);
    try {
      const byteArrays = await Promise.all(files.map((f) => fileToUint8Array(f.file)));
      const mergedBytes = await mergePdfs(byteArrays);
      downloadBytes(mergedBytes, "merged.pdf", "application/pdf");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFiles([]);
    setError("");
    setDone(false);
  }

  return (
    <div className="mz-card p-6">
      <FileDropzone accept="application/pdf" multiple onFiles={handleFiles} label="Drop PDF files here to merge" />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2 rounded-xl border border-navy-100 bg-white px-3 py-2 dark:border-navy-800 dark:bg-navy-900">
              <FileText className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
              <span className="flex-1 truncate text-sm text-navy-700 dark:text-navy-200">{i + 1}. {f.file.name}</span>
              <span className="shrink-0 text-xs text-navy-400">{formatBytes(f.file.size)}</span>
              <button type="button" onClick={() => moveFile(i, -1)} disabled={i === 0} aria-label="Move up" className="text-navy-400 hover:text-brand-700 disabled:opacity-30">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => moveFile(i, 1)} disabled={i === files.length - 1} aria-label="Move down" className="text-navy-400 hover:text-brand-700 disabled:opacity-30">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => removeFile(f.id)} aria-label="Remove file" className="text-navy-400 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleMerge} disabled={isProcessing || files.length < 2} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Merging..." : "Merge & Download"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {done && !error && (
          <p className="text-sm font-medium text-green-600">Your merged PDF has been downloaded.</p>
        )}
      </div>

      <ToolExtras
        toolId="pdf-merger"
        category="pdf-tools"
        showPrivacyNote
        howTo={[
          "Drag and drop two or more PDF files, or click to browse.",
          "Reorder files using the up/down arrows — they'll be merged in this order.",
          "Click \"Merge & Download\" to get your combined PDF.",
        ]}
        faq={[
          { q: "Is there a limit on how many PDFs I can merge?", a: "No hard limit, but very large files may be slower since everything is processed in your browser's memory." },
          { q: "Are my files uploaded anywhere?", a: "No — merging happens entirely in your browser using JavaScript. Your files never leave your device." },
        ]}
      />
    </div>
  );
}
