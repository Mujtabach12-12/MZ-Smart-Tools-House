import { useState } from "react";
import { Loader2 } from "lucide-react";
import { addWatermark } from "../../lib/pdf/watermark";
import { fileToUint8Array, downloadBytes } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function PdfWatermark() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleFiles([selected]) {
    setError(""); setDone(false);
    if (selected.type !== "application/pdf") {
      setError(`"${selected.name}" is not a PDF file.`);
      return;
    }
    setFile(selected);
  }

  async function handleApply() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setDone(false);
    try {
      const bytes = await fileToUint8Array(file);
      const outBytes = await addWatermark(bytes, text, { opacity: opacity / 100 });
      downloadBytes(outBytes, `watermarked-${file.name}`, "application/pdf");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null); setText("CONFIDENTIAL"); setOpacity(30); setError(""); setDone(false);
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop a PDF file here to watermark" />
      ) : (
        <div className="space-y-4">
          <FileListItem name={file.name} size={file.size} onRemove={handleReset} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Watermark Text</label>
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="mz-input" placeholder="e.g. CONFIDENTIAL" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Opacity: {opacity}%</label>
              <input type="range" min="10" max="80" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-brand-600" />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleApply} disabled={!file || isProcessing || !text.trim()} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Applying..." : "Add Watermark & Download"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {done && !error && <p className="text-sm font-medium text-green-600">Your watermarked PDF has been downloaded.</p>}
      </div>

      <ToolExtras
        toolId="pdf-watermark"
        category="pdf-tools"
        showPrivacyNote
        howTo={[
          "Upload a PDF file.",
          "Type the watermark text and adjust its opacity.",
          "Click \"Add Watermark & Download\" — every page gets a diagonal watermark.",
        ]}
        faq={[
          { q: "Can I change the watermark's position?", a: "The current version centers a diagonal watermark on every page. Custom positioning may be added in a future update." },
        ]}
      />
    </div>
  );
}
