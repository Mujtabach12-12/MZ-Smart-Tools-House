import { useState } from "react";
import { Loader2 } from "lucide-react";
import { imagesToPdf } from "../../lib/pdf/imageToPdf";
import { fileToUint8Array, downloadBytes } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function JpgToPdf() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleFiles(newFiles) {
    setError(""); setDone(false);
    const invalid = newFiles.find((f) => !["image/jpeg", "image/jpg", "image/png"].includes(f.type));
    if (invalid) {
      setError(`"${invalid.name}" is not a JPG or PNG image.`);
      return;
    }
    setFiles((prev) => [...prev, ...newFiles.map((file) => ({ id: crypto.randomUUID(), file }))]);
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setDone(false);
  }

  async function handleConvert() {
    if (files.length === 0) {
      setError("Add at least one image.");
      return;
    }
    setIsProcessing(true);
    setError("");
    setDone(false);
    try {
      const images = await Promise.all(
        files.map(async (f) => ({ bytes: await fileToUint8Array(f.file), type: f.file.type }))
      );
      const pdfBytes = await imagesToPdf(images);
      downloadBytes(pdfBytes, "images.pdf", "application/pdf");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFiles([]); setError(""); setDone(false);
  }

  return (
    <div className="mz-card p-6">
      <FileDropzone accept="image/jpeg,image/png" multiple onFiles={handleFiles} label="Drop JPG or PNG images here" />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f) => (
            <FileListItem key={f.id} name={f.file.name} size={f.file.size} onRemove={() => removeFile(f.id)} />
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleConvert} disabled={files.length === 0 || isProcessing} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Converting..." : "Convert to PDF"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {done && !error && <p className="text-sm font-medium text-green-600">Your PDF has been downloaded.</p>}
      </div>

      <ToolExtras
        toolId="jpg-to-pdf"
        category="pdf-tools"
        showPrivacyNote
        howTo={[
          "Drag and drop one or more JPG/PNG images, or click to browse.",
          "Images become PDF pages in the order shown.",
          "Click \"Convert to PDF\" to download the result.",
        ]}
        faq={[
          { q: "Can I mix JPG and PNG files?", a: "Yes — you can combine both formats in a single PDF." },
          { q: "Will the page size match my image?", a: "Yes, each page is sized to match its image's exact pixel dimensions." },
        ]}
      />
    </div>
  );
}
