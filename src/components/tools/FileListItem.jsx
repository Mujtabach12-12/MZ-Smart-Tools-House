import { FileText, X } from "lucide-react";
import { formatBytes } from "../../lib/pdf/core";

export default function FileListItem({ name, size, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-3 py-2 dark:border-navy-800 dark:bg-navy-900">
      <FileText className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
      <span className="flex-1 truncate text-sm text-navy-700 dark:text-navy-200">{name}</span>
      {typeof size === "number" && (
        <span className="shrink-0 text-xs text-navy-400 dark:text-navy-500">{formatBytes(size)}</span>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="shrink-0 text-navy-400 hover:text-red-600">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
