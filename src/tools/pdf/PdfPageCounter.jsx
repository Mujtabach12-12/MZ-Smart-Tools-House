import { useState } from "react";
import { formatBytes } from "../../lib/pdf/core";
import { getPdfPageCount } from "../../lib/pdf/pageCount";
import { fileToUint8Array } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function PdfPageCounter() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [error, setError] = useState("");

  async function handleFiles([selected]) {
    setError(""); setPageCount(null);
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

  function handleReset() {
    setFile(null); setPageCount(null); setError("");
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop a PDF file here to count its pages" />
      ) : (
        <FileListItem name={file.name} size={file.size} onRemove={handleReset} />
      )}

      {file && (
        <div className="mt-6">
          <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {pageCount !== null && (
          <ResultStat label="Total Pages" value={pageCount} highlight />
        )}
      </div>

      <ToolExtras
        toolId="pdf-page-counter"
        category="pdf-tools"
        showPrivacyNote
        howTo={["Upload a PDF file — its page count appears instantly, no button needed."]}
        faq={[
          { q: "Does this open or upload my PDF anywhere?", a: "No — the page count is read directly in your browser using the file's internal structure." },
        ]}
      />
    </div>
  );
}
