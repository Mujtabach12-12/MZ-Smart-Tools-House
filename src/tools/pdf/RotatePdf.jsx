import { useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { rotatePdf } from "../../lib/pdf/rotate";
import { getPdfPageCount } from "../../lib/pdf/pageCount";
import { fileToUint8Array, downloadArtifact } from "../../lib/download";
import { createFileAsset, attachPdfMetadata, setOutput } from "../../lib/files/fileAsset.js";
import { assertFileSignature } from "../../lib/files/signatures.js";
import { createOutputArtifact, validatePdfOutput } from "../../lib/files/outputValidation.js";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

const ANGLES = [90, 180, 270];

export default function RotatePdf() {
  const [asset, setAsset] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [angle, setAngle] = useState(90);
  const [pagesInput, setPagesInput] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const file = asset?.original || null;

  async function handleFiles([selected]) {
    setError(""); setDone(false);
    if (!selected) return;
    try {
      await assertFileSignature(selected, "application/pdf");
      const bytes = await fileToUint8Array(selected);
      const count = await getPdfPageCount(bytes);
      setPageCount(count);
      setAsset(attachPdfMetadata(createFileAsset(selected, { kind: "pdf" }), count));
    } catch (err) {
      setError(err.message || "This file doesn't look like a valid PDF, or it may be corrupted.");
      setAsset(null);
    }
  }

  async function handleRotate() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setDone(false);
    try {
      const bytes = await fileToUint8Array(file);
      // rotatePdf edits the PDF page rotation structurally with pdf-lib. It
      // never rasterizes pages, so text/vector/image quality is preserved.
      const rotated = await rotatePdf(bytes, angle, pagesInput);
      const validation = await validatePdfOutput(rotated, { expectedPageCount: pageCount });
      const output = createOutputArtifact({
        data: rotated,
        filename: `rotated-${file.name}`,
        mimeType: "application/pdf",
        pageCount: validation.pageCount,
        metadata: { structural: true, rasterized: false },
      });
      setAsset((current) => setOutput(current, output));
      await downloadArtifact(output);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setAsset(null); setPageCount(null); setAngle(90); setPagesInput("all"); setError(""); setDone(false);
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop a PDF file here to rotate" />
      ) : (
        <div className="space-y-4">
          <FileListItem name={file.name} size={file.size} onRemove={handleReset} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Rotate by</label>
              <div className="flex gap-2">
                {ANGLES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAngle(a)}
                    className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-sm ${angle === a ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950" : "border-navy-200 dark:border-navy-700"}`}
                  >
                    <RotateCw className="h-3.5 w-3.5" /> {a}°
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">
                Pages {pageCount ? `(1-${pageCount})` : ""}
              </label>
              <input
                type="text"
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
                placeholder="all, or e.g. 1,3-4"
                className="mz-input"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleRotate} disabled={!file || isProcessing} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Rotating..." : "Rotate & Download"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {done && !error && <p className="text-sm font-medium text-green-600">Your structurally rotated PDF was validated and downloaded without rasterizing its pages.</p>}
      </div>

      <ToolExtras
        toolId="pdf-rotator"
        category="pdf-tools"
        showPrivacyNote
        howTo={[
          "Upload a PDF file.",
          "Choose a rotation angle and which pages to rotate (\"all\" or a range like \"1,3-4\").",
          "Click Rotate & Download.",
        ]}
        faq={[
          { q: "Can I rotate only some pages?", a: "Yes — enter a page range like \"2-3\" instead of \"all\"." },
          { q: "Does this reduce PDF quality?", a: "No rasterization is used. The page rotation is changed structurally inside the PDF and the generated file is validated before download." },
        ]}
      />
    </div>
  );
}
