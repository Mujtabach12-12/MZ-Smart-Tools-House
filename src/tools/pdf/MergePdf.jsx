import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Plus, X } from "lucide-react";
import { mergePdfs } from "../../lib/pdf/merge";
import { formatBytes } from "../../lib/pdf/core";
import { inspectPdfFile, buildValidatedPdfArtifact } from "../../lib/pdf/toolkit.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfStepIndicator from "../../components/tools/pdf/PdfStepIndicator.jsx";
import PdfFirstPageThumb from "../../components/tools/pdf/PdfFirstPageThumb.jsx";
import PdfResultPanel from "../../components/tools/pdf/PdfResultPanel.jsx";

export default function MergePdf() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [artifact, setArtifact] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  async function handleFiles(newFiles) {
    setError("");
    setArtifact(null);
    if (!newFiles?.length) return;
    setIsAdding(true);
    try {
      const inspected = [];
      for (const file of newFiles) {
        const info = await inspectPdfFile(file);
        inspected.push({ id: crypto.randomUUID(), ...info });
      }
      setFiles((prev) => [...prev, ...inspected]);
    } catch (e) {
      setError(e.message || "One of the selected PDFs could not be opened.");
    } finally {
      setIsAdding(false);
    }
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    setArtifact(null);
  }

  function moveFile(from, to) {
    if (to < 0 || to >= files.length || from === to) return;
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setArtifact(null);
  }

  async function handleMerge() {
    if (files.length < 2) return setError("Add at least two PDF files to merge.");
    setIsProcessing(true);
    setError("");
    setArtifact(null);
    try {
      const totalPages = files.reduce((sum, item) => sum + item.pageCount, 0);
      const mergedBytes = await mergePdfs(files.map((item) => item.bytes));
      const output = await buildValidatedPdfArtifact(mergedBytes, {
        sourceName: files[0].name,
        suffix: "merged",
        expectedPageCount: totalPages,
        metadata: { sourceFiles: files.length, structural: true, rasterized: false },
      });
      setArtifact(output);
    } catch (e) {
      setError(e.message || "The PDFs could not be merged.");
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setFiles([]);
    setArtifact(null);
    setError("");
    setDragIndex(null);
  }

  const step = artifact ? 4 : isProcessing ? 3 : files.length >= 2 ? 2 : 1;
  const totalPages = files.reduce((sum, item) => sum + item.pageCount, 0);

  return (
    <div className="mz-card p-4 sm:p-6">
      <PdfStepIndicator current={step} steps={["Select", "Arrange", "Merge", "Download"]} />
      <FileDropzone accept="application/pdf" multiple onFiles={handleFiles} label={files.length ? "Add more PDF files" : "Choose two or more PDF files"} />
      {isAdding ? <p className="mt-3 text-sm text-navy-500" role="status">Validating selected PDFs…</p> : null}

      {files.length > 0 ? <div className="mt-5 space-y-3" aria-label="PDF merge order">
        {files.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => { if (dragIndex != null) moveFile(dragIndex, index); setDragIndex(null); }}
            className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-900"
          >
            <span className="hidden cursor-grab text-navy-300 sm:block" aria-hidden="true"><GripVertical className="h-5 w-5" /></span>
            <PdfFirstPageThumb file={item.file} />
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm text-navy-900 dark:text-white">{index + 1}. {item.name}</strong>
              <span className="mt-1 block text-xs text-navy-500">{item.pageCount} page{item.pageCount === 1 ? "" : "s"} · {formatBytes(item.size)}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="mz-pdf-toolbar-button" onClick={() => moveFile(index, index - 1)} disabled={index === 0} aria-label={`Move ${item.name} earlier`}><ArrowUp /></button>
              <button type="button" className="mz-pdf-toolbar-button" onClick={() => moveFile(index, index + 1)} disabled={index === files.length - 1} aria-label={`Move ${item.name} later`}><ArrowDown /></button>
              <button type="button" className="mz-pdf-toolbar-button" onClick={() => removeFile(item.id)} aria-label={`Remove ${item.name}`}><X /></button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm dark:bg-brand-950/30">
          <span className="font-semibold text-navy-700 dark:text-navy-200">{files.length} PDFs in merge order</span>
          <span className="text-navy-500">{totalPages} total pages</span>
        </div>
      </div> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={handleMerge} disabled={files.length < 2 || isProcessing || isAdding} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {isProcessing ? "Merging PDFs…" : "Merge PDFs"}
        </button>
        {files.length ? <button type="button" onClick={reset} className="mz-btn-secondary">Clear</button> : null}
      </div>

      <div className="mt-4"><ErrorMessage message={error} /></div>
      <PdfResultPanel
        artifact={artifact}
        title="Merged PDF ready"
        stats={artifact ? [["Output", artifact.filename], ["Files merged", String(files.length)], ["Pages", String(artifact.pageCount)], ["Size", formatBytes(artifact.data.byteLength)]] : []}
        onReset={reset}
        note="Pages were copied structurally into the output PDF; they were not converted to screenshots."
      />
    </div>
  );
}
