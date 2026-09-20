import { useEffect, useRef, useState } from "react";
import { Download, Maximize2, Minus, Plus, Printer, RotateCw, Search, Upload, X } from "lucide-react";
import { downloadBlob } from "../../lib/download";

const MAX_BYTES = 100 * 1024 * 1024;
const clampZoom = (value) => Math.max(0.35, Math.min(3.5, value));

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

export default function PdfViewer() {
  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const [file, setFile] = useState(null);
  const [doc, setDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.15);
  const [rotation, setRotation] = useState(0);
  const [thumbs, setThumbs] = useState([]);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!doc) return undefined;
    let cancelled = false;
    let renderTask = null;
    (async () => {
      setBusy(true);
      try {
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale: zoom, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        renderTask = pdfPage.render({ canvasContext: canvas.getContext("2d", { alpha: false }), viewport });
        await renderTask.promise;
      } catch (err) {
        if (!cancelled && err?.name !== "RenderingCancelledException") setError(err?.message || "Unable to render this page.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
      try { renderTask?.cancel(); } catch { /* already completed */ }
    };
  }, [doc, page, zoom, rotation]);

  useEffect(() => () => { try { doc?.destroy?.(); } catch { /* best effort cleanup */ } }, [doc]);

  async function open(next) {
    if (!next) return;
    setError("");
    if (!/\.pdf$/i.test(next.name) && next.type !== "application/pdf") { setError("Choose a PDF file."); return; }
    if (next.size > MAX_BYTES) { setError("This viewer accepts PDFs up to 100 MB in the browser."); return; }
    try {
      setBusy(true);
      const pdfjs = await loadPdfJs();
      const bytes = new Uint8Array(await next.arrayBuffer());
      const loaded = await pdfjs.getDocument({ data: bytes.slice() }).promise;
      const nextThumbs = [];
      for (let index = 1; index <= Math.min(loaded.numPages, 80); index++) {
        const pdfPage = await loaded.getPage(index);
        const viewport = pdfPage.getViewport({ scale: 0.15 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        await pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        nextThumbs.push(canvas.toDataURL("image/jpeg", 0.75));
      }
      setFile(next);
      setDoc(loaded);
      setPage(1);
      setZoom(1.15);
      setRotation(0);
      setThumbs(nextThumbs);
      setMatches([]);
      setQuery("");
    } catch (err) {
      setError(err?.message || "The PDF could not be opened. It may be encrypted or corrupted.");
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    if (!doc || !query.trim()) return;
    setBusy(true);
    setError("");
    try {
      const needle = query.trim().toLowerCase();
      const found = [];
      for (let index = 1; index <= doc.numPages; index++) {
        const pdfPage = await doc.getPage(index);
        const text = await pdfPage.getTextContent();
        const joined = text.items.map((item) => item.str).join(" ").toLowerCase();
        if (joined.includes(needle)) found.push(index);
      }
      setMatches(found);
      if (found.length) setPage(found[0]);
    } catch (err) {
      setError(err?.message || "Text search is unavailable for this PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function fit(kind) {
    if (!doc) return;
    try {
      const pdfPage = await doc.getPage(page);
      const base = pdfPage.getViewport({ scale: 1, rotation });
      const host = viewerRef.current;
      const availableWidth = Math.max(240, (host?.clientWidth || window.innerWidth) - 32);
      const availableHeight = Math.max(320, Math.min(window.innerHeight * 0.72, 900));
      const widthScale = availableWidth / base.width;
      const pageScale = Math.min(widthScale, availableHeight / base.height);
      setZoom(clampZoom(kind === "width" ? widthScale : pageScale));
    } catch (err) {
      setError(err?.message || "Unable to fit this PDF page.");
    }
  }

  function download() { if (file) downloadBlob(file, file.name); }
  function print() {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const popup = window.open(url, "_blank");
    if (popup) window.setTimeout(() => { popup.focus(); popup.print(); }, 900);
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  function close() {
    try { doc?.destroy?.(); } catch { /* best effort cleanup */ }
    setDoc(null); setFile(null); setThumbs([]); setMatches([]); setError("");
  }

  return <div className="space-y-4">
    {!doc ? <section className="mz-card p-8 text-center">
      <Upload className="mx-auto h-10 w-10 text-brand-600"/>
      <h2 className="mt-4 text-xl font-extrabold">Open a PDF</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-navy-500">View PDFs locally with thumbnails, page navigation, fit controls, zoom, rotation, text search where the PDF contains text, download and print.</p>
      <button className="mz-btn-primary mt-5" onClick={() => fileRef.current?.click()}>Choose PDF</button>
      <input ref={fileRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => open(event.target.files?.[0])}/>
    </section> : <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-navy-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-900">
        <strong className="mr-auto max-w-full truncate">{file?.name}</strong>
        <form className="flex min-w-[220px] flex-1 gap-1 sm:max-w-sm" onSubmit={(event) => { event.preventDefault(); search(); }}>
          <input className="mz-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search text…" aria-label="Search PDF text"/>
          <button className="mz-btn-secondary" aria-label="Search PDF"><Search className="h-4 w-4"/></button>
        </form>
        <button className="mz-btn-secondary" onClick={print}><Printer className="h-4 w-4"/> Print</button>
        <button className="mz-btn-primary" onClick={download}><Download className="h-4 w-4"/> Download</button>
        <button className="mz-btn-ghost" onClick={close} aria-label="Close PDF"><X className="h-4 w-4"/></button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[170px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-navy-100 bg-white p-2 dark:border-navy-800 dark:bg-navy-900">
          <div className="max-h-[650px] space-y-2 overflow-auto">{thumbs.map((src, index) => <button key={index} className={`w-full rounded-xl border p-2 ${page === index + 1 ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-navy-100 dark:border-navy-800"}`} onClick={() => setPage(index + 1)}>
            <img src={src} alt={`Page ${index + 1} thumbnail`} className="mx-auto max-h-32 bg-white"/>
            <span className="mt-1 block text-xs font-semibold">Page {index + 1}</span>
          </button>)}</div>
        </aside>
        <main className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-navy-100 bg-white p-2 dark:border-navy-800 dark:bg-navy-900">
            <button className="mz-btn-ghost" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>Previous</button>
            <span className="text-sm font-bold">{page} / {doc.numPages}</span>
            <button className="mz-btn-ghost" onClick={() => setPage((value) => Math.min(doc.numPages, value + 1))} disabled={page >= doc.numPages}>Next</button>
            <button className="mz-btn-ghost" onClick={() => setZoom((value) => clampZoom(value - 0.15))} aria-label="Zoom out"><Minus className="h-4 w-4"/></button>
            <span className="min-w-14 text-center text-xs font-bold">{Math.round(zoom * 100)}%</span>
            <button className="mz-btn-ghost" onClick={() => setZoom((value) => clampZoom(value + 0.15))} aria-label="Zoom in"><Plus className="h-4 w-4"/></button>
            <button className="mz-btn-ghost" onClick={() => fit("width")}>Fit width</button>
            <button className="mz-btn-ghost" onClick={() => fit("page")}>Fit page</button>
            <button className="mz-btn-ghost" onClick={() => setRotation((value) => (value + 90) % 360)}><RotateCw className="h-4 w-4"/> Rotate</button>
            <button className="mz-btn-ghost" onClick={() => document.fullscreenElement ? document.exitFullscreen() : viewerRef.current?.requestFullscreen?.()}><Maximize2 className="h-4 w-4"/> Fullscreen</button>
          </div>
          {matches.length ? <div className="mb-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-800 dark:bg-brand-950/30 dark:text-brand-200">Found on pages: {matches.map((number) => <button key={number} className="mx-1 font-bold underline" onClick={() => setPage(number)}>{number}</button>)}</div> : query && !busy ? <div className="mb-3 rounded-xl bg-navy-50 p-3 text-sm text-navy-500 dark:bg-navy-900">No text matches found. Scanned/image-only PDFs may need OCR.</div> : null}
          <div ref={viewerRef} className="min-h-[520px] max-h-[76vh] overflow-auto rounded-2xl bg-slate-200 p-4 text-center dark:bg-navy-950">
            {busy ? <div className="mb-2 text-sm text-navy-500" role="status">Rendering…</div> : null}
            <canvas ref={canvasRef} className="mx-auto max-w-none bg-white shadow-xl"/>
          </div>
        </main>
      </div>
    </>}
    {error ? <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</div> : null}
  </div>;
}
