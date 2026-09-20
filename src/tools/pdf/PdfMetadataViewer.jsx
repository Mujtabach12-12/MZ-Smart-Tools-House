import { useState } from "react";
import { getPdfMetadata } from "../../lib/pdf/metadata";
import { fileToUint8Array } from "../../lib/download";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

const FIELDS = [
  ["title", "Title"], ["author", "Author"], ["subject", "Subject"],
  ["creator", "Creator"], ["producer", "Producer"],
  ["creationDate", "Created"], ["modificationDate", "Modified"],
  ["pageCount", "Pages"],
];

export default function PdfMetadataViewer() {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  async function handleFiles([selected]) {
    setError(""); setMeta(null);
    if (selected.type !== "application/pdf") {
      setError(`"${selected.name}" is not a PDF file.`);
      return;
    }
    setFile(selected);
    try {
      const bytes = await fileToUint8Array(selected);
      setMeta(await getPdfMetadata(bytes));
    } catch {
      setError("This file doesn't look like a valid PDF, or it may be corrupted.");
      setFile(null);
    }
  }

  function handleReset() {
    setFile(null); setMeta(null); setError("");
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop a PDF file here to view its metadata" />
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
        {meta && (
          <div className="overflow-hidden rounded-xl border border-navy-100 dark:border-navy-800">
            {FIELDS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between border-b border-navy-100 px-4 py-2.5 text-sm last:border-b-0 dark:border-navy-800">
                <span className="font-medium text-navy-500 dark:text-navy-400">{label}</span>
                <span className="text-navy-900 dark:text-navy-50">{meta[key]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolExtras
        toolId="pdf-metadata-viewer"
        category="pdf-tools"
        showPrivacyNote
        howTo={["Upload a PDF file — its title, author and other metadata appear instantly."]}
        faq={[
          { q: "What if a field shows \"—\"?", a: "That means the PDF simply doesn't have that piece of metadata set — it's not an error." },
        ]}
      />
    </div>
  );
}
