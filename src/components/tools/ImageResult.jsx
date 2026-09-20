import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { formatBytes } from "../../lib/pdf/core";
import { downloadBlob } from "../../lib/download";
import ResultStat from "./ResultStat";

/**
 * Shared "here's your processed image" panel used by every image tool:
 * before/after file size, output dimensions, a live preview, and the download
 * button. Keeping this in one place is what makes the size reporting and
 * download behaviour identical across all ten tools.
 *
 * result: the object returned by lib/image/process.js
 */
export default function ImageResult({ result, children }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!result?.blob) return undefined;
    const objectUrl = URL.createObjectURL(result.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [result]);

  if (!result) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <ResultStat label="Original Size" value={formatBytes(result.originalSize)} />
        <ResultStat label="New Size" value={formatBytes(result.size)} />
        {result.grew ? (
          <ResultStat label="Size Change" value={`+${result.percentLarger}%`} />
        ) : (
          <ResultStat label="Saved" value={`${result.percentSaved}%`} highlight />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ResultStat
          label="Output Dimensions"
          value={`${result.width} × ${result.height} px`}
        />
        <ResultStat label="Output Format" value={String(result.formatKey || "").toUpperCase()} />
      </div>

      {result.grew && (
        <p className="text-sm text-navy-500 dark:text-navy-400">
          This output is larger than the original. That is normal when converting a compressed
          format (JPG/WebP) to a lossless one (PNG), or when raising quality above the source.
        </p>
      )}

      {children}

      <div className="overflow-hidden rounded-2xl border border-navy-100 bg-navy-50 p-4 dark:border-navy-800 dark:bg-navy-900/60">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-navy-500 dark:text-navy-400">
          Preview
        </p>
        {url && (
          <img
            src={url}
            alt="Processed result"
            className="mx-auto max-h-80 max-w-full rounded-xl object-contain"
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => downloadBlob(result.blob, result.filename)}
        className="mz-btn-primary"
      >
        <Download className="h-4 w-4" />
        Download {String(result.formatKey || "image").toUpperCase()}
      </button>
    </div>
  );
}
