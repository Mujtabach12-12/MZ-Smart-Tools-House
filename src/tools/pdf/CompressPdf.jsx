import { useState } from "react";
import { Loader2 } from "lucide-react";
import { compressPdf, PDF_COMPRESSION_PRESETS } from "../../lib/pdf/compress";
import { formatBytes } from "../../lib/pdf/core";
import { fileToUint8Array, downloadBytes } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function CompressPdf() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [outputBytes, setOutputBytes] = useState(null);
  const [quality, setQuality] = useState("medium");

  async function createPageRenderer(bytes) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    // PDF.js can transfer/detach the ArrayBuffer it receives. Keep the
    // original bytes intact because pdf-lib uses them immediately afterwards.
    const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
    const pdf = await loadingTask.promise;
    const renderPage = async (index, preset) => {
      const page = await pdf.getPage(index + 1);
      try {
        const viewport = page.getViewport({ scale: preset.scale });
        const pixels = viewport.width * viewport.height;
        if (pixels > 40_000_000) {
          throw new Error(`Page ${index + 1} is too large to raster-compress safely at ${preset.dpi} DPI. Choose High Quality or process the PDF on a desktop with more memory.`);
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", preset.jpegQuality));
        if (!blob) throw new Error(`Page ${index + 1} could not be encoded.`);
        return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
      } finally {
        page.cleanup?.();
      }
    };
    return { renderPage, cleanup: () => pdf.destroy?.() };
  }

  function handleFiles([selected]) {
    setError(""); setResult(null); setOutputBytes(null);
    if (selected.type !== "application/pdf") {
      setError(`"${selected.name}" is not a PDF file.`);
      return;
    }
    setFile(selected);
  }

  async function handleCompress() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setResult(null);
    try {
      const bytes = await fileToUint8Array(file);
      const renderer = quality === "low" ? null : await createPageRenderer(bytes);
      try {
        const r = await compressPdf(bytes, { quality, renderPage: renderer?.renderPage });
        setResult(r);
        setOutputBytes(r.bytes);
      } finally {
        await renderer?.cleanup?.();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null); setResult(null); setOutputBytes(null); setError("");
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop a PDF file here to compress" />
      ) : (
        <FileListItem name={file.name} size={file.size} onRemove={handleReset} />
      )}

      <fieldset className="mt-5" disabled={isProcessing}>
        <legend className="text-sm font-bold text-navy-800 dark:text-white">Compression quality</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {Object.entries(PDF_COMPRESSION_PRESETS).map(([id, preset]) => (
            <label key={id} className={`cursor-pointer rounded-2xl border p-4 ${quality === id ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-navy-200 dark:border-navy-700"}`}>
              <input className="mr-2" type="radio" name="pdf-quality" value={id} checked={quality === id} onChange={() => setQuality(id)} />
              <span className="font-semibold">{preset.label}</span>
              <span className="mt-1 block text-xs text-navy-500">{id === "low" ? "Structural/lossless; preserves text, vectors, links and forms" : id === "medium" ? "150 DPI raster option for scan/image-heavy PDFs" : "96 DPI raster option when file size matters most"}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCompress} disabled={!file || isProcessing} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Compressing..." : "Compress PDF"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <ResultStat label="Original Size" value={formatBytes(result.originalSize)} />
              <ResultStat label={result.compressed ? "Compressed Size" : "Output Size"} value={formatBytes(result.compressedSize)} />
              <ResultStat label="Saved" value={`${result.percentSaved}%`} highlight={result.compressed} />
              <ResultStat label="Validation" value={result.validated ? `${result.pageCount} page${result.pageCount === 1 ? "" : "s"} OK` : "Not verified"} highlight={result.validated} />
            </div>
            {!result.compressed ? (
              <p className="text-sm text-navy-500 dark:text-navy-400">
                No smaller valid PDF was produced. To avoid a fake compression claim, the original file is retained unchanged and the saving is reported as 0%. The retained PDF is still validated before download.
              </p>
            ) : null}
            {result.strategy === "rasterized" && <p className="text-sm text-amber-700 dark:text-amber-300">Medium/high compression flattened pages to images because that produced the smallest real file. Page appearance is preserved, but selectable text, forms and links are not.</p>}
            {result.strategy === "lossless-fallback" && <p className="text-sm text-navy-500 dark:text-navy-400">The rasterized candidate was not the smallest option, so the tool automatically kept the smaller lossless PDF instead.</p>}
            <button
              type="button"
              onClick={() => downloadBytes(outputBytes, result.compressed ? `compressed-${file.name}` : file.name, "application/pdf")}
              className="mz-btn-secondary"
            >
              {result.compressed ? "Download Compressed PDF" : "Download Original PDF"}
            </button>
          </>
        )}
      </div>

      <ToolExtras
        toolId="pdf-compressor"
        category="pdf-tools"
        showPrivacyNote
        howTo={[
          "Upload the PDF you want to shrink.",
          "Click Compress PDF.",
          "Compare the before/after size, then download.",
        ]}
        faq={[
          { q: "How much can I expect to save?", a: "It depends on the PDF. The displayed sizes and percentage are calculated from the actual generated file; no fixed saving is promised." },
          { q: "Will compression reduce quality?", a: "High Quality is lossless. Balanced and Small File are explicit raster-compression options for scan/image-heavy PDFs, so they can trade detail and selectable/interactive content for a smaller file." },
        ]}
      />
    </div>
  );
}
