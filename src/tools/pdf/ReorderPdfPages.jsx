import { useState } from "react";
import { GripVertical, Loader2 } from "lucide-react";
import { reorderPdfPages } from "../../lib/pdf/reorderPages";
import { getPdfPageCount } from "../../lib/pdf/pageCount";
import { fileToUint8Array, downloadBytes } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function ReorderPdfPages() {
  const [file, setFile] = useState(null);
  const [order, setOrder] = useState([]); // 0-based indices in current display order
  const [dragIndex, setDragIndex] = useState(null);
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
      const count = await getPdfPageCount(bytes);
      setOrder(Array.from({ length: count }, (_, i) => i));
    } catch {
      setError("This file doesn't look like a valid PDF, or it may be corrupted.");
      setFile(null);
    }
  }

  function movePage(from, to) {
    if (to < 0 || to >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function handleDrop(index) {
    if (dragIndex === null || dragIndex === index) return;
    movePage(dragIndex, index);
    setDragIndex(null);
  }

  async function handleReorder() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setDone(false);
    try {
      const bytes = await fileToUint8Array(file);
      const outBytes = await reorderPdfPages(bytes, order);
      downloadBytes(outBytes, `reordered-${file.name}`, "application/pdf");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null); setOrder([]); setError(""); setDone(false);
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop a PDF file here to reorder its pages" />
      ) : (
        <div className="space-y-4">
          <FileListItem name={file.name} size={file.size} onRemove={handleReset} />
          <p className="text-xs text-navy-400 dark:text-navy-500">Drag pages to reorder them, or use the arrows.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {order.map((originalIndex, displayIndex) => (
              <div
                key={originalIndex}
                draggable
                onDragStart={() => setDragIndex(displayIndex)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(displayIndex)}
                className="flex cursor-move items-center gap-2 rounded-xl border border-navy-200 bg-white px-3 py-2 dark:border-navy-700 dark:bg-navy-900"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-navy-300" />
                <span className="flex-1 text-sm text-navy-700 dark:text-navy-200">Page {originalIndex + 1}</span>
                <div className="flex flex-col">
                  <button type="button" onClick={() => movePage(displayIndex, displayIndex - 1)} aria-label="Move earlier" className="text-navy-400 hover:text-brand-700">▲</button>
                  <button type="button" onClick={() => movePage(displayIndex, displayIndex + 1)} aria-label="Move later" className="text-navy-400 hover:text-brand-700">▼</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleReorder} disabled={!file || isProcessing} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Reordering..." : "Save New Order & Download"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {done && !error && <p className="text-sm font-medium text-green-600">Your reordered PDF has been downloaded.</p>}
      </div>

      <ToolExtras
        toolId="pdf-reorder-pages"
        category="pdf-tools"
        showPrivacyNote
        howTo={[
          "Upload a PDF file — its pages appear as a grid of numbered cards.",
          "Drag a card to a new position, or use the ▲/▼ buttons.",
          "Click \"Save New Order & Download\" when you're happy with the arrangement.",
        ]}
        faq={[
          { q: "Do I need to move every page?", a: "No — only move the pages you want repositioned; the rest stay in place relative to each other." },
        ]}
      />
    </div>
  );
}
