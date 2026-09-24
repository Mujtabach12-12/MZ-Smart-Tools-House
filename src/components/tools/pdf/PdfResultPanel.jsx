import { useEffect, useRef } from "react";
import { CheckCircle2, Download, RotateCcw, Share2 } from "lucide-react";
import { downloadArtifact } from "../../../lib/download.js";
import { formatBytes } from "../../../lib/pdf/core.js";
import { announceToolSuccess } from "../../../lib/toolSuccess.js";

async function shareArtifact(artifact) {
  if (!artifact?.data || !navigator.share || !navigator.canShare) return false;
  try {
    const blob = artifact.data instanceof Blob ? artifact.data : new Blob([artifact.data], { type: artifact.mimeType || "application/octet-stream" });
    const file = new File([blob], artifact.filename, { type: artifact.mimeType || blob.type });
    if (!navigator.canShare({ files: [file] })) return false;
    await navigator.share({ title: artifact.filename, files: [file] });
    return true;
  } catch (error) {
    if (error?.name === "AbortError") return true;
    return false;
  }
}

export default function PdfResultPanel({ artifact, title = "Your PDF is ready", stats = [], onReset, note = "" }) {
  const announcedRef = useRef("");
  useEffect(() => {
    if (!artifact) return;
    const size = artifact.data instanceof Blob ? artifact.data.size : artifact.data?.byteLength || 0;
    const key = `${artifact.filename}:${size}`;
    if (announcedRef.current === key) return;
    announcedRef.current = key;
    announceToolSuccess({ source: "result", filename: artifact.filename });
  }, [artifact]);
  if (!artifact) return null;
  const fallbackStats = [
    ["File", artifact.filename],
    ["Size", formatBytes(artifact.data instanceof Blob ? artifact.data.size : artifact.data?.byteLength || 0)],
    ...(artifact.pageCount ? [["Pages", String(artifact.pageCount)]] : []),
  ];
  const rows = stats.length ? stats : fallbackStats;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function";
  return (
    <section className="mz-pdf-result" aria-live="polite">
      <div className="mz-pdf-result-head"><CheckCircle2 /><div><strong>{title}</strong><span>Output validated before download.</span></div></div>
      <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {note ? <p>{note}</p> : null}
      <div className="mz-pdf-result-actions">
        <button type="button" className="mz-btn-primary" onClick={() => downloadArtifact(artifact)}><Download className="h-4 w-4" /> Download</button>
        {canShare ? <button type="button" className="mz-btn-secondary" onClick={() => shareArtifact(artifact)}><Share2 className="h-4 w-4" /> Share</button> : null}
        {onReset ? <button type="button" className="mz-btn-ghost" onClick={onReset}><RotateCcw className="h-4 w-4" /> Process another</button> : null}
      </div>
    </section>
  );
}
