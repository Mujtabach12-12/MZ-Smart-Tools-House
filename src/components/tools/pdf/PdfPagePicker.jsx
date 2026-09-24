import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronFirst, ChevronLast, GripVertical } from "lucide-react";
import { fileToUint8Array } from "../../../lib/download.js";
import { loadPdfJsDocument } from "../../../lib/pdf/toolkit.js";
import { renderPdfThumbnail } from "../../../lib/pdf/rendering.js";

function PageCard({ doc, pageNumber, selected, onToggle, moveActions, orderLabel, selectedLabel = "Selected", unselectedLabel = "Keep", dragProps = {} }) {
  const hostRef = useRef(null);
  const urlRef = useRef("");
  const [src, setSrc] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { rootMargin: "350px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!visible || !doc || urlRef.current) return undefined;
    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        const thumb = await renderPdfThumbnail(page, { maxWidth: 150, quality: 0.8 });
        page.cleanup?.();
        if (cancelled) return;
        const url = URL.createObjectURL(thumb.blob);
        urlRef.current = url;
        setSrc(url);
      } catch { /* isolated thumbnail failure */ }
    })();
    return () => { cancelled = true; };
  }, [doc, pageNumber, visible]);

  useEffect(() => {
    if (!visible && urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
      setSrc("");
    }
  }, [visible]);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  return (
    <div ref={hostRef} className={`mz-pdf-page-card ${selected ? "is-selected" : ""}`} {...dragProps}>
      {onToggle ? <button type="button" className="mz-pdf-page-card-preview" onClick={onToggle} aria-pressed={selected} aria-label={`${selected ? "Unselect" : "Select"} page ${pageNumber}`}>
        <span className="mz-pdf-page-card-paper">{src ? <img src={src} alt="" /> : <span className="mz-pdf-thumbnail-skeleton" />}</span>
        <strong>{orderLabel || `Page ${pageNumber}`}</strong>
        <span className="mz-pdf-page-card-state">{selected ? selectedLabel : unselectedLabel}</span>
      </button> : <div className="mz-pdf-page-card-preview" aria-label={orderLabel || `Page ${pageNumber}`}>
        <span className="mz-pdf-page-card-paper">{src ? <img src={src} alt="" /> : <span className="mz-pdf-thumbnail-skeleton" />}</span>
        <strong>{orderLabel || `Page ${pageNumber}`}</strong>
      </div>}
      {moveActions ? <div className="mz-pdf-page-card-move" aria-label={`Move page ${pageNumber}`}>
        <GripVertical aria-hidden="true" />
        <button type="button" onClick={moveActions.first} aria-label={`Move page ${pageNumber} to first`}><ChevronFirst /></button>
        <button type="button" onClick={moveActions.last} aria-label={`Move page ${pageNumber} to last`}><ChevronLast /></button>
      </div> : null}
    </div>
  );
}

export default function PdfPagePicker({ file, selectedPages = [], onToggle, order = null, onMoveFirst, onMoveLast, onReorder, selectedLabel = "Selected", unselectedLabel = "Keep", className = "" }) {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const selection = useMemo(() => new Set(selectedPages), [selectedPages]);

  useEffect(() => {
    let active = true;
    let loaded = null;
    setError("");
    setDoc(null);
    if (!file) return undefined;
    (async () => {
      try {
        const bytes = await fileToUint8Array(file);
        const result = await loadPdfJsDocument(bytes);
        loaded = result.doc;
        if (active) setDoc(loaded);
      } catch (e) {
        if (active) setError(e.message || "Could not load page previews.");
      }
    })();
    return () => { active = false; try { loaded?.destroy?.(); } catch {} };
  }, [file]);

  if (!file) return null;
  if (error) return <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>;
  if (!doc) return <div className="mz-pdf-page-grid-loading" role="status">Loading page previews…</div>;

  const pages = order || Array.from({ length: doc.numPages }, (_, i) => i);
  return (
    <div className={`mz-pdf-page-grid ${className}`}>
      {pages.map((originalIndex, displayIndex) => {
        const pageNumber = originalIndex + 1;
        return <PageCard
          key={`${pageNumber}-${displayIndex}`}
          doc={doc}
          pageNumber={pageNumber}
          selected={onToggle ? selection.has(pageNumber) : null}
          onToggle={onToggle ? () => onToggle(pageNumber) : undefined}
          orderLabel={order ? `${displayIndex + 1} · Page ${pageNumber}` : undefined}
          selectedLabel={selectedLabel}
          unselectedLabel={unselectedLabel}
          moveActions={order ? {
            first: () => onMoveFirst?.(displayIndex),
            last: () => onMoveLast?.(displayIndex),
          } : null}
          dragProps={order && onReorder ? {
            draggable: true,
            onDragStart: () => setDragIndex(displayIndex),
            onDragOver: (event) => event.preventDefault(),
            onDrop: () => { if (dragIndex != null && dragIndex !== displayIndex) onReorder(dragIndex, displayIndex); setDragIndex(null); },
            onDragEnd: () => setDragIndex(null),
          } : {}}
        />;
      })}
    </div>
  );
}
