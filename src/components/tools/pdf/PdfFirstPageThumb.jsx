import { useEffect, useRef, useState } from "react";
import { fileToUint8Array } from "../../../lib/download.js";
import { loadPdfJsDocument } from "../../../lib/pdf/toolkit.js";
import { renderPdfThumbnail } from "../../../lib/pdf/rendering.js";

export default function PdfFirstPageThumb({ file }) {
  const urlRef = useRef("");
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    let pdf = null;
    if (!file) return undefined;
    (async () => {
      try {
        const bytes = await fileToUint8Array(file);
        const loaded = await loadPdfJsDocument(bytes);
        pdf = loaded.doc;
        const page = await pdf.getPage(1);
        const thumb = await renderPdfThumbnail(page, { maxWidth: 96, quality: 0.8 });
        page.cleanup?.();
        if (!active) return;
        const url = URL.createObjectURL(thumb.blob);
        urlRef.current = url;
        setSrc(url);
      } catch { /* thumbnail is optional */ }
    })();
    return () => {
      active = false;
      try { pdf?.destroy?.(); } catch {}
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    };
  }, [file]);
  return <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 shadow-inner dark:bg-slate-800">{src ? <img src={src} alt="" className="h-full w-full object-contain bg-white" /> : null}</div>;
}
