import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Download, FolderOpen,
  Hand, Maximize2, Minimize2, Minus, PanelLeft, Plus, Printer, RotateCcw,
  RotateCw, Search, Upload, X,
} from "lucide-react";
import { downloadBlob } from "../../lib/download";
import { createFileAsset, attachPdfMetadata } from "../../lib/files/fileAsset.js";
import { assertFileSignature } from "../../lib/files/signatures.js";
import {
  calculatePdfFitScale, clampPdfZoom, countTextOccurrences, friendlyPdfOpenError,
  nextZoomLevel, normalizePdfPageInput,
} from "../../lib/pdf/reader.js";
import PdfPageView from "./pdf-reader/PdfPageView.jsx";
import PdfThumbnail from "./pdf-reader/PdfThumbnail.jsx";

const MAX_BYTES = 100 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = { width: 612, height: 792 };

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

function ReaderButton({ label, active = false, className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`mz-pdf-toolbar-button ${active ? "is-active" : ""} ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}

export default function PdfViewer() {
  const fileRef = useRef(null);
  const readerShellRef = useRef(null);
  const viewerRef = useRef(null);
  const thumbnailsScrollRef = useRef(null);
  const textCacheRef = useRef(new Map());
  const scrollFrameRef = useRef(0);
  const pageInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const zoomRef = useRef(1);
  const mousePanRef = useRef(null);
  const pinchRef = useRef(null);
  const printJobRef = useRef(null);

  const [asset, setAsset] = useState(null);
  const [doc, setDoc] = useState(null);
  const [pdfjs, setPdfjs] = useState(null);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState("actual");
  const [rotation, setRotation] = useState(0);
  const [firstPageSize, setFirstPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchResult, setActiveSearchResult] = useState(-1);
  const [searchMessage, setSearchMessage] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const file = asset?.original || null;
  const pageCount = doc?.numPages || 0;
  const pages = useMemo(() => Array.from({ length: pageCount }, (_, index) => index + 1), [pageCount]);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { setPageInput(String(page)); }, [page]);

  const cleanupPrintJob = useCallback(() => {
    const job = printJobRef.current;
    if (!job) return;
    try { job.frame?.remove?.(); } catch { /* best effort */ }
    try { URL.revokeObjectURL(job.url); } catch { /* best effort */ }
    printJobRef.current = null;
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(scrollFrameRef.current);
    cleanupPrintJob();
    try { doc?.destroy?.(); } catch { /* best effort */ }
  }, [doc, cleanupPrintJob]);

  const getTextContent = useCallback(async (pageNumber, suppliedPage = null) => {
    if (!doc) return { items: [], styles: {} };
    const cached = textCacheRef.current.get(pageNumber);
    if (cached) return await cached;
    const task = (async () => {
      let pdfPage = suppliedPage;
      let ownsPage = false;
      try {
        if (!pdfPage) {
          pdfPage = await doc.getPage(pageNumber);
          ownsPage = true;
        }
        return await pdfPage.getTextContent({ includeMarkedContent: true });
      } finally {
        if (ownsPage) pdfPage?.cleanup?.();
      }
    })();
    textCacheRef.current.set(pageNumber, task);
    try {
      const content = await task;
      textCacheRef.current.set(pageNumber, content);
      return content;
    } catch (searchError) {
      textCacheRef.current.delete(pageNumber);
      throw searchError;
    }
  }, [doc]);

  const scrollToPage = useCallback((targetPage, behavior = "smooth") => {
    const normalized = normalizePdfPageInput(targetPage, pageCount, page);
    const viewer = viewerRef.current;
    const node = viewer?.querySelector?.(`[data-pdf-page="${normalized}"]`);
    if (viewer && node) {
      const top = Math.max(0, node.offsetTop - 16);
      viewer.scrollTo({ top, behavior });
    }
    setPage(normalized);
  }, [page, pageCount]);

  const updateActivePageFromScroll = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || !doc) return;
    cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      const rootRect = viewer.getBoundingClientRect();
      const focusY = rootRect.top + Math.min(rootRect.height * 0.34, 260);
      let bestPage = page;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const node of viewer.querySelectorAll("[data-pdf-page]")) {
        const rect = node.getBoundingClientRect();
        if (rect.bottom < rootRect.top || rect.top > rootRect.bottom) continue;
        const point = Math.max(rect.top, Math.min(focusY, rect.bottom));
        const distance = Math.abs(point - focusY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPage = Number(node.dataset.pdfPage || page);
        }
      }
      if (bestPage !== page) setPage(bestPage);
    });
  }, [doc, page]);

  const noOpVisibility = useCallback(() => {}, []);

  const fitView = useCallback(async (mode, overrides = {}) => {
    const activeDoc = overrides.document || doc;
    const targetPage = overrides.pageNumber || page;
    const targetRotation = overrides.rotation ?? rotation;
    const viewer = viewerRef.current;
    if (!activeDoc || !viewer) return;
    let pdfPage = null;
    try {
      pdfPage = await activeDoc.getPage(targetPage);
      const base = pdfPage.getViewport({ scale: 1, rotation: targetRotation });
      const scale = calculatePdfFitScale({
        pageWidth: base.width,
        pageHeight: base.height,
        availableWidth: viewer.clientWidth,
        availableHeight: viewer.clientHeight,
        mode,
        horizontalPadding: window.innerWidth < 768 ? 18 : 42,
        verticalPadding: 28,
      });
      setViewMode(mode);
      setZoom(scale);
    } catch {
      setError("Unable to calculate the best fit for this PDF page.");
    } finally {
      pdfPage?.cleanup?.();
    }
  }, [doc, page, rotation]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !doc || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      if (viewMode === "width" || viewMode === "page") {
        requestAnimationFrame(() => fitView(viewMode));
      }
    });
    observer.observe(viewer);
    return () => observer.disconnect();
  }, [doc, fitView, viewMode]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === readerShellRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!doc) return undefined;
    document.documentElement.classList.add("mz-pdf-reader-active");
    return () => document.documentElement.classList.remove("mz-pdf-reader-active");
  }, [doc]);

  useEffect(() => {
    if (!doc || !(viewMode === "width" || viewMode === "page")) return;
    // Fullscreen/orientation changes alter the real available viewport. Refit
    // from the PDF source instead of stretching the old canvas.
    requestAnimationFrame(() => fitView(viewMode));
  }, [isFullscreen, doc, fitView, viewMode]);

  async function open(next) {
    if (!next) return;
    setError("");
    if (!/\.pdf$/i.test(next.name) && next.type !== "application/pdf") {
      setError("Choose a PDF file.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("This browser reader accepts PDFs up to 100 MB. The file was not modified.");
      return;
    }
    setLoading(true);
    try {
      await assertFileSignature(next, "application/pdf");
      const library = await loadPdfJs();
      const bytes = new Uint8Array(await next.arrayBuffer());
      const loaded = await library.getDocument({ data: bytes.slice() }).promise;
      const first = await loaded.getPage(1);
      const firstViewport = first.getViewport({ scale: 1 });
      first.cleanup?.();

      try { doc?.destroy?.(); } catch { /* best effort */ }
      textCacheRef.current.clear();
      const baseAsset = createFileAsset(next, { kind: "pdf" });
      setAsset(attachPdfMetadata(baseAsset, loaded.numPages));
      setPdfjs(library);
      setDoc(loaded);
      setFirstPageSize({ width: firstViewport.width, height: firstViewport.height });
      setPage(1);
      setPageInput("1");
      setRotation(0);
      setSearchInput("");
      setSearchTerm("");
      setSearchResults([]);
      setActiveSearchResult(-1);
      setSearchMessage("");
      setThumbnailsOpen(window.innerWidth >= 768);
      setPanMode(false);
      setViewMode("actual");
      setZoom(1);

      requestAnimationFrame(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        const widthScale = calculatePdfFitScale({
          pageWidth: firstViewport.width,
          pageHeight: firstViewport.height,
          availableWidth: viewer.clientWidth,
          availableHeight: viewer.clientHeight,
          mode: "width",
          horizontalPadding: window.innerWidth < 768 ? 18 : 42,
          verticalPadding: 28,
        });
        if (window.innerWidth < 768 || widthScale < 1) {
          // Mobile reader always starts in true Fit Width. Desktop keeps
          // actual-size pages when they already fit comfortably.
          setViewMode("width");
          setZoom(widthScale);
          viewer.scrollLeft = 0;
        }
      });
    } catch (openError) {
      setError(friendlyPdfOpenError(openError));
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const setCustomZoom = useCallback((nextZoom) => {
    setViewMode("custom");
    setZoom(clampPdfZoom(nextZoom));
  }, []);

  const zoomAtPoint = useCallback((nextZoom, clientX, clientY) => {
    const viewer = viewerRef.current;
    if (!viewer) {
      setCustomZoom(nextZoom);
      return;
    }
    const oldZoom = zoomRef.current;
    const normalized = clampPdfZoom(nextZoom);
    if (Math.abs(normalized - oldZoom) < 0.001) return;
    const rect = viewer.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const contentX = viewer.scrollLeft + localX;
    const contentY = viewer.scrollTop + localY;
    zoomRef.current = normalized;
    setViewMode("custom");
    setZoom(normalized);
    requestAnimationFrame(() => {
      const ratio = normalized / oldZoom;
      viewer.scrollLeft = Math.max(0, contentX * ratio - localX);
      viewer.scrollTop = Math.max(0, contentY * ratio - localY);
    });
  }, [setCustomZoom]);

  const onWheel = useCallback((event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    zoomAtPoint(zoomRef.current * factor, event.clientX, event.clientY);
  }, [zoomAtPoint]);

  const onMousePointerDown = useCallback((event) => {
    if (event.pointerType === "touch") return;
    if (!(panMode && event.button === 0) && event.button !== 1) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    event.preventDefault();
    viewer.setPointerCapture?.(event.pointerId);
    mousePanRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: viewer.scrollLeft,
      top: viewer.scrollTop,
    };
  }, [panMode]);

  const onMousePointerMove = useCallback((event) => {
    const pan = mousePanRef.current;
    const viewer = viewerRef.current;
    if (!pan || !viewer || pan.pointerId !== event.pointerId) return;
    viewer.scrollLeft = pan.left - (event.clientX - pan.x);
    viewer.scrollTop = pan.top - (event.clientY - pan.y);
  }, []);

  const endMousePan = useCallback((event) => {
    if (mousePanRef.current?.pointerId === event.pointerId) mousePanRef.current = null;
  }, []);

  const onTouchStart = useCallback((event) => {
    if (event.touches.length !== 2) return;
    const [a, b] = Array.from(event.touches);
    const distance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    pinchRef.current = {
      distance: Math.max(1, distance),
      zoom: zoomRef.current,
      centerX: (a.clientX + b.clientX) / 2,
      centerY: (a.clientY + b.clientY) / 2,
    };
  }, []);

  const onTouchMove = useCallback((event) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;
    event.preventDefault();
    const [a, b] = Array.from(event.touches);
    const distance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    const centerX = (a.clientX + b.clientX) / 2;
    const centerY = (a.clientY + b.clientY) / 2;
    const next = pinchRef.current.zoom * (distance / pinchRef.current.distance);
    zoomAtPoint(next, centerX, centerY);
  }, [zoomAtPoint]);

  const onTouchEnd = useCallback((event) => {
    if (event.touches.length < 2) pinchRef.current = null;
  }, []);

  async function runSearch() {
    const needle = searchInput.trim();
    if (!doc || !needle) {
      setSearchTerm("");
      setSearchResults([]);
      setActiveSearchResult(-1);
      setSearchMessage("");
      return;
    }
    setSearchBusy(true);
    setError("");
    setSearchMessage("");
    try {
      const results = [];
      let searchableCharacters = 0;
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        const content = await getTextContent(pageNumber);
        const text = (content.items || []).map((item) => item.str || "").join(" ");
        searchableCharacters += text.trim().length;
        const count = countTextOccurrences(text, needle);
        for (let occurrence = 0; occurrence < count; occurrence += 1) results.push({ page: pageNumber, occurrence });
        if (pageNumber % 8 === 0) await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      setSearchTerm(needle);
      setSearchResults(results);
      if (results.length) {
        setActiveSearchResult(0);
        scrollToPage(results[0].page);
        setSearchMessage("");
      } else {
        setActiveSearchResult(-1);
        setSearchMessage(
          searchableCharacters === 0
            ? "No searchable text was found. This PDF may be scanned or image-only and requires OCR before text search is available."
            : `No matches found for “${needle}”.`,
        );
      }
    } catch {
      setSearchMessage("Text search is unavailable for this PDF.");
    } finally {
      setSearchBusy(false);
    }
  }

  function moveSearch(direction) {
    if (!searchResults.length) return;
    const next = (activeSearchResult + direction + searchResults.length) % searchResults.length;
    setActiveSearchResult(next);
    scrollToPage(searchResults[next].page);
  }

  function commitPageInput() {
    if (!doc) return;
    const numeric = Number(pageInput);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > doc.numPages) {
      setPageInput(String(page));
      setError(`Enter a page number from 1 to ${doc.numPages}.`);
      return;
    }
    setError("");
    scrollToPage(numeric);
  }

  function rotateView(direction = 1) {
    setRotation((current) => {
      const next = (current + (direction < 0 ? 270 : 90)) % 360;
      if (viewMode === "width" || viewMode === "page") requestAnimationFrame(() => fitView(viewMode, { rotation: next }));
      return next;
    });
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === readerShellRef.current) await document.exitFullscreen();
      else await readerShellRef.current?.requestFullscreen?.();
    } catch {
      setError("Fullscreen mode is not available in this browser.");
    }
  }

  function downloadOriginal() {
    if (file) downloadBlob(file, file.name || "document.pdf");
  }

  function printOriginal() {
    if (!file) return;
    cleanupPrintJob();
    try {
      const url = URL.createObjectURL(file);
      const frame = document.createElement("iframe");
      frame.title = "Print PDF";
      frame.style.position = "fixed";
      frame.style.width = "1px";
      frame.style.height = "1px";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.border = "0";
      frame.style.opacity = "0";
      frame.src = url;
      printJobRef.current = { url, frame };
      frame.addEventListener("load", () => {
        try {
          const target = frame.contentWindow;
          target?.addEventListener?.("afterprint", cleanupPrintJob, { once: true });
          target?.focus?.();
          target?.print?.();
        } catch {
          cleanupPrintJob();
          setError("Browser printing is unavailable here. Download the original PDF and print it from your PDF application.");
        }
      }, { once: true });
      document.body.appendChild(frame);
    } catch {
      cleanupPrintJob();
      setError("Browser printing is unavailable here. Download the original PDF and print it from your PDF application.");
    }
  }

  function closeReader() {
    cleanupPrintJob();
    try { doc?.destroy?.(); } catch { /* best effort */ }
    textCacheRef.current.clear();
    setDoc(null);
    setPdfjs(null);
    setAsset(null);
    setSearchResults([]);
    setSearchTerm("");
    setSearchInput("");
    setError("");
    setThumbnailsOpen(false);
  }

  useEffect(() => {
    if (!doc) return undefined;
    const onKeyDown = (event) => {
      const modifier = event.ctrlKey || event.metaKey;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || tag === "select" || document.activeElement?.isContentEditable;
      if (modifier && event.key.toLowerCase() === "o") {
        event.preventDefault();
        fileRef.current?.click();
      } else if (modifier && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
      } else if (modifier && event.key.toLowerCase() === "p") {
        event.preventDefault();
        printOriginal();
      } else if (modifier && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        setCustomZoom(nextZoomLevel(zoomRef.current, 1));
      } else if (modifier && event.key === "-") {
        event.preventDefault();
        setCustomZoom(nextZoomLevel(zoomRef.current, -1));
      } else if (!isTyping && event.key === "PageDown") {
        event.preventDefault();
        scrollToPage(page + 1);
      } else if (!isTyping && event.key === "PageUp") {
        event.preventDefault();
        scrollToPage(page - 1);
      } else if (!isTyping && event.key === "Home") {
        event.preventDefault();
        scrollToPage(1);
      } else if (!isTyping && event.key === "End") {
        event.preventDefault();
        scrollToPage(doc.numPages);
      } else if (event.key === "Escape" && searchOpen && !document.fullscreenElement) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doc, page, searchOpen, scrollToPage, setCustomZoom]);

  if (!doc || !pdfjs) {
    return (
      <div className="space-y-4">
        <section
          className="mz-card mz-pdf-open-card"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            open(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="mz-pdf-open-icon"><Upload aria-hidden="true" /></span>
          <h2>Open a PDF</h2>
          <p>Read PDFs locally with high-DPI rendering. Your original file stays untouched; thumbnails and page previews are render-only.</p>
          <button className="mz-btn-primary" type="button" onClick={() => fileRef.current?.click()} disabled={loading}>
            <FolderOpen className="h-4 w-4" /> {loading ? "Opening PDF…" : "Choose PDF"}
          </button>
          <small>PDF · up to 100 MB · processed in your browser</small>
          <input ref={fileRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => open(event.target.files?.[0])} />
        </section>
        {error ? <div role="alert" className="mz-pdf-error">{error}</div> : null}
      </div>
    );
  }

  return (
    <div ref={readerShellRef} className={`mz-pdf-reader ${isFullscreen ? "is-fullscreen" : ""}`}>
      <input ref={fileRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => open(event.target.files?.[0])} />

      <header className="mz-pdf-reader-header">
        <div className="mz-pdf-file-row">
          <button type="button" className="mz-pdf-file-button" onClick={() => fileRef.current?.click()} title="Open another PDF (Ctrl/Cmd + O)">
            <FolderOpen aria-hidden="true" />
            <span><strong>{file?.name}</strong><small>{pageCount} page{pageCount === 1 ? "" : "s"} · original preserved</small></span>
          </button>
          <div className="mz-pdf-file-actions">
            <ReaderButton label="Toggle page thumbnails" active={thumbnailsOpen} onClick={() => setThumbnailsOpen((value) => !value)}><PanelLeft /></ReaderButton>
            <ReaderButton label="Close PDF" onClick={closeReader}><X /></ReaderButton>
          </div>
        </div>

        <div className="mz-pdf-reader-toolbar" role="toolbar" aria-label="PDF reader controls">
          <div className="mz-pdf-toolbar-group is-navigation">
            <ReaderButton label="First page" onClick={() => scrollToPage(1)} disabled={page <= 1}><ChevronFirst /></ReaderButton>
            <ReaderButton label="Previous page" onClick={() => scrollToPage(page - 1)} disabled={page <= 1}><ChevronLeft /></ReaderButton>
            <label className="mz-pdf-page-input-wrap">
              <span className="sr-only">Page number</span>
              <input
                ref={pageInputRef}
                inputMode="numeric"
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value.replace(/[^0-9]/g, ""))}
                onBlur={commitPageInput}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitPageInput(); pageInputRef.current?.select(); } }}
                aria-label={`Page number, 1 to ${pageCount}`}
              />
              <span>/ {pageCount}</span>
            </label>
            <ReaderButton label="Next page" onClick={() => scrollToPage(page + 1)} disabled={page >= pageCount}><ChevronRight /></ReaderButton>
            <ReaderButton label="Last page" onClick={() => scrollToPage(pageCount)} disabled={page >= pageCount}><ChevronLast /></ReaderButton>
          </div>

          <div className="mz-pdf-toolbar-group is-zoom">
            <ReaderButton label="Zoom out" onClick={() => setCustomZoom(nextZoomLevel(zoom, -1))}><Minus /></ReaderButton>
            <select
              className="mz-pdf-zoom-select"
              aria-label="Zoom percentage"
              value={Math.round(zoom * 100)}
              onChange={(event) => setCustomZoom(Number(event.target.value) / 100)}
            >
              {[35, 50, 67, 75, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400].map((value) => <option key={value} value={value}>{value}%</option>)}
              {!([35,50,67,75,90,100,110,125,150,175,200,250,300,400].includes(Math.round(zoom * 100))) ? <option value={Math.round(zoom * 100)}>{Math.round(zoom * 100)}%</option> : null}
            </select>
            <ReaderButton label="Zoom in" onClick={() => setCustomZoom(nextZoomLevel(zoom, 1))}><Plus /></ReaderButton>
            <button type="button" className={`mz-pdf-toolbar-text ${viewMode === "width" ? "is-active" : ""}`} onClick={() => fitView("width")}>Fit width</button>
            <button type="button" className={`mz-pdf-toolbar-text ${viewMode === "page" ? "is-active" : ""}`} onClick={() => fitView("page")}>Fit page</button>
            <button type="button" className={`mz-pdf-toolbar-text ${viewMode === "actual" ? "is-active" : ""}`} onClick={() => { setViewMode("actual"); setZoom(1); }}>Actual size</button>
          </div>

          <div className="mz-pdf-toolbar-group is-actions">
            <ReaderButton label="Pan tool" active={panMode} onClick={() => setPanMode((value) => !value)}><Hand /></ReaderButton>
            <ReaderButton label="Rotate view counter-clockwise" onClick={() => rotateView(-1)}><RotateCcw /></ReaderButton>
            <ReaderButton label="Rotate view clockwise" onClick={() => rotateView(1)}><RotateCw /></ReaderButton>
            <ReaderButton label="Search PDF (Ctrl/Cmd + F)" active={searchOpen} onClick={() => { setSearchOpen((value) => !value); requestAnimationFrame(() => searchInputRef.current?.focus()); }}><Search /></ReaderButton>
            <ReaderButton label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</ReaderButton>
            <ReaderButton label="Print original PDF (Ctrl/Cmd + P)" onClick={printOriginal}><Printer /></ReaderButton>
            <button type="button" className="mz-pdf-download-button" onClick={downloadOriginal}><Download /> <span>Download original</span></button>
          </div>
        </div>

        {searchOpen ? (
          <form className="mz-pdf-searchbar" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
            <Search aria-hidden="true" />
            <input ref={searchInputRef} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search text in this PDF" aria-label="Search text in PDF" />
            <button type="submit" disabled={searchBusy}>{searchBusy ? "Searching…" : "Search"}</button>
            {searchResults.length ? (
              <>
                <span>{activeSearchResult + 1} / {searchResults.length}</span>
                <ReaderButton label="Previous search result" onClick={() => moveSearch(-1)}><ChevronLeft /></ReaderButton>
                <ReaderButton label="Next search result" onClick={() => moveSearch(1)}><ChevronRight /></ReaderButton>
              </>
            ) : null}
            <ReaderButton label="Close search" onClick={() => setSearchOpen(false)}><X /></ReaderButton>
          </form>
        ) : null}
        {searchMessage ? <div className="mz-pdf-search-message" role="status">{searchMessage}</div> : null}
        {error ? <div className="mz-pdf-error" role="alert">{error}</div> : null}
      </header>

      <div className={`mz-pdf-reader-body ${thumbnailsOpen ? "has-thumbnails" : ""}`}>
        {thumbnailsOpen ? <button type="button" className="mz-pdf-thumbnail-backdrop" aria-label="Close thumbnails" onClick={() => setThumbnailsOpen(false)} /> : null}
        <aside className={`mz-pdf-thumbnail-panel ${thumbnailsOpen ? "is-open" : ""}`} aria-label="PDF page thumbnails">
          <div className="mz-pdf-thumbnail-head"><strong>Pages</strong><span>{pageCount}</span><ReaderButton label="Close thumbnails" className="md:hidden" onClick={() => setThumbnailsOpen(false)}><X /></ReaderButton></div>
          <div ref={thumbnailsScrollRef} className="mz-pdf-thumbnail-scroll">
            {pages.map((pageNumber) => (
              <PdfThumbnail
                key={pageNumber}
                doc={doc}
                pageNumber={pageNumber}
                active={page === pageNumber}
                onSelect={() => { scrollToPage(pageNumber); if (window.innerWidth < 768) setThumbnailsOpen(false); }}
                scrollRootRef={thumbnailsScrollRef}
              />
            ))}
          </div>
        </aside>

        <main
          ref={viewerRef}
          className={`mz-pdf-document-viewport ${panMode ? "is-pan-mode" : ""}`}
          onScroll={updateActivePageFromScroll}
          onWheel={onWheel}
          onPointerDown={onMousePointerDown}
          onPointerMove={onMousePointerMove}
          onPointerUp={endMousePan}
          onPointerCancel={endMousePan}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          tabIndex={0}
          aria-label="PDF document reader"
        >
          <div className="mz-pdf-document-stack">
            {pages.map((pageNumber) => (
              <PdfPageView
                key={pageNumber}
                doc={doc}
                pdfjs={pdfjs}
                pageNumber={pageNumber}
                zoom={zoom}
                rotation={rotation}
                searchQuery={searchTerm}
                viewerRef={viewerRef}
                fallbackSize={firstPageSize}
                getTextContent={getTextContent}
                onVisibility={noOpVisibility}
              />
            ))}
          </div>
        </main>
      </div>

      <footer className="mz-pdf-reader-status" aria-live="polite">
        <span>Page {page} of {pageCount}</span>
        <span>{Math.round(zoom * 100)}%</span>
        <span>{rotation ? `View rotated ${rotation}°` : "Original orientation"}</span>
        <span>Ctrl/Cmd + wheel to zoom · pinch on touch screens</span>
      </footer>
    </div>
  );
}
