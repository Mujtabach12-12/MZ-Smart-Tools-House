import { FileText, X } from "lucide-react";
import { formatBytes } from "../../../lib/pdf/core.js";

export default function PdfFileSummary({ name, size, pageCount, onRemove, children }) {
  return (
    <div className="mz-pdf-file-summary">
      <div className="mz-pdf-file-summary-icon"><FileText /></div>
      <div className="min-w-0 flex-1">
        <strong title={name}>{name}</strong>
        <span>{formatBytes(size)}{pageCount ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : ""}</span>
        {children}
      </div>
      {onRemove ? <button type="button" onClick={onRemove} aria-label={`Remove ${name}`}><X /></button> : null}
    </div>
  );
}
