import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { fileToUint8Array, downloadBlob } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ProgressBar from "../../components/tools/ProgressBar";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

/**
 * format: "image/jpeg" | "image/png"
 * toolId/category/extension: passed by the two thin wrapper components below
 */
export default function PdfToImageBase({ format, extension, toolId }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);

  function handleFiles([selected]) {
    setError(""); setImages([]);
    if (selected.type !== "application/pdf") {
      setError(`"${selected.name}" is not a PDF file.`);
      return;
    }
    setFile(selected);
  }

  async function handleConvert() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setImages([]);
    setProgress({ current: 0, total: 0 });
    try {
      // Lazy-loaded: pdfjs-dist is large and only needed for this tool.
      const { renderPdfPagesToImages } = await import("../../lib/pdf/pdfToImages.js");
      const bytes = await fileToUint8Array(file);
      const results = await renderPdfPagesToImages(bytes, {
        format,
        onProgress: (current, total) => setProgress({ current, total }),
      });
      setImages(results);
    } catch (err) {
      setError(err.message || "Could not convert this PDF. It may be corrupted or password-protected.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null); setImages([]); setError(""); setProgress({ current: 0, total: 0 });
  }

  function downloadAll() {
    images.forEach((img) => downloadBlob(img.blob, `page-${img.pageNumber}.${extension}`));
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop a PDF file here to convert" />
      ) : (
        <FileListItem name={file.name} size={file.size} onRemove={handleReset} />
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleConvert} disabled={!file || isProcessing} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Converting..." : `Convert to ${extension.toUpperCase()}`}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      {isProcessing && progress.total > 0 && (
        <div className="mt-4">
          <ProgressBar current={progress.current} total={progress.total} label={`Rendering page ${progress.current} of ${progress.total}`} />
        </div>
      )}

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {images.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-navy-800 dark:text-navy-100">{images.length} page(s) converted</p>
              <button type="button" onClick={downloadAll} className="mz-btn-secondary">
                <Download className="h-4 w-4" /> Download All
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <div key={img.pageNumber} className="mz-card overflow-hidden">
                  <img
                    src={URL.createObjectURL(img.blob)}
                    alt={`Page ${img.pageNumber}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <div className="flex items-center justify-between p-2">
                    <span className="text-xs text-navy-500 dark:text-navy-400">Page {img.pageNumber}</span>
                    <button
                      type="button"
                      onClick={() => downloadBlob(img.blob, `page-${img.pageNumber}.${extension}`)}
                      aria-label={`Download page ${img.pageNumber}`}
                      className="text-navy-400 hover:text-brand-700"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ToolExtras
        toolId={toolId}
        category="pdf-tools"
        showPrivacyNote
        howTo={[
          "Upload the PDF you want to convert.",
          `Click Convert to ${extension.toUpperCase()} — each page is rendered as a separate image.`,
          "Download individual pages or all of them at once.",
        ]}
        faq={[
          { q: "Does image quality stay sharp?", a: "Pages are rendered at roughly 2x scale for good readability. Very high-resolution needs may require a dedicated desktop tool." },
          { q: "Is there a page limit?", a: "No hard limit, but very long PDFs will take longer since every page is rendered in your browser." },
        ]}
      />
    </div>
  );
}
