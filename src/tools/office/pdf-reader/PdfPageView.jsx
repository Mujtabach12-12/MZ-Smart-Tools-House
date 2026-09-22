import { useEffect, useRef, useState } from "react";
import { beginPdfPageRender } from "../../../lib/pdf/rendering.js";

function fallbackForRotation(size, rotation) {
  const normalized = ((rotation % 360) + 360) % 360;
  return normalized === 90 || normalized === 270
    ? { width: size.height, height: size.width }
    : size;
}

function buildSelectableTextLayer({ pdfjs, textContent, container, viewport, query }) {
  if (!container || !textContent) return;
  container.replaceChildren();
  container.style.width = `${viewport.width}px`;
  container.style.height = `${viewport.height}px`;

  const measureCanvas = document.createElement("canvas");
  const measure = measureCanvas.getContext("2d");
  const needle = String(query || "").trim().toLocaleLowerCase();

  for (const item of textContent.items || []) {
    if (!item?.str) continue;
    const style = textContent.styles?.[item.fontName] || {};
    const tx = pdfjs.Util.transform(viewport.transform, item.transform);
    const angle = Math.atan2(tx[1], tx[0]);
    const fontHeight = Math.max(1, Math.hypot(tx[2], tx[3]));
    const ascent = Number.isFinite(style.ascent)
      ? style.ascent
      : Number.isFinite(style.descent)
        ? 1 + style.descent
        : 0.8;
    const span = document.createElement("span");
    span.textContent = item.str;
    span.style.position = "absolute";
    span.style.left = `${tx[4]}px`;
    span.style.top = `${tx[5] - fontHeight * ascent}px`;
    span.style.fontSize = `${fontHeight}px`;
    span.style.fontFamily = style.fontFamily || "sans-serif";
    span.style.lineHeight = "1";
    span.style.whiteSpace = "pre";
    span.style.transformOrigin = "0 0";
    span.style.color = "transparent";
    span.style.cursor = "text";
    span.style.userSelect = "text";

    let scaleX = 1;
    if (measure) {
      measure.font = `${fontHeight}px ${style.fontFamily || "sans-serif"}`;
      const measured = measure.measureText(item.str).width;
      const target = Math.abs(Number(item.width || 0) * Number(viewport.scale || 1));
      if (measured > 0 && target > 0) scaleX = target / measured;
    }
    span.style.transform = `rotate(${angle}rad) scaleX(${scaleX})`;
    if (needle && item.str.toLocaleLowerCase().includes(needle)) {
      span.dataset.searchMatch = "true";
      span.style.background = "rgba(250, 204, 21, .42)";
      span.style.boxShadow = "0 0 0 1px rgba(202, 138, 4, .32)";
      span.style.borderRadius = "2px";
    }
    container.appendChild(span);
  }
}

export default function PdfPageView({
  doc,
  pdfjs,
  pageNumber,
  zoom,
  rotation,
  searchQuery,
  viewerRef,
  fallbackSize,
  getTextContent,
  onVisibility,
}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const viewportRef = useRef(null);
  const textContentRef = useRef(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [baseSize, setBaseSize] = useState(() => fallbackForRotation(fallbackSize, rotation));
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    setBaseSize(fallbackForRotation(fallbackSize, rotation));
  }, [fallbackSize.width, fallbackSize.height, rotation]);

  useEffect(() => {
    const node = hostRef.current;
    const root = viewerRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined" || !root) {
      setNearViewport(true);
      onVisibility(pageNumber, 1);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        setNearViewport(entry.isIntersecting || entry.intersectionRatio > 0);
        onVisibility(pageNumber, entry.intersectionRatio || 0);
      }
    }, { root, rootMargin: "1100px 0px", threshold: [0, 0.01, 0.2, 0.5, 0.8, 1] });
    observer.observe(node);
    return () => {
      onVisibility(pageNumber, 0);
      observer.disconnect();
    };
  }, [pageNumber, viewerRef, onVisibility]);

  useEffect(() => {
    if (!nearViewport || !doc) return undefined;
    let cancelled = false;
    let renderTask = null;
    let pdfPage = null;
    setRendering(true);
    (async () => {
      try {
        pdfPage = await doc.getPage(pageNumber);
        if (cancelled) return;
        const natural = pdfPage.getViewport({ scale: 1, rotation });
        setBaseSize({ width: natural.width, height: natural.height });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const started = beginPdfPageRender(pdfPage, canvas, { scale: zoom, rotation });
        renderTask = started.renderTask;
        await renderTask.promise;
        if (cancelled) return;
        viewportRef.current = started.cssViewport;
        const textContent = await getTextContent(pageNumber, pdfPage);
        if (cancelled) return;
        textContentRef.current = textContent;
        buildSelectableTextLayer({
          pdfjs,
          textContent,
          container: textLayerRef.current,
          viewport: started.cssViewport,
          query: searchQuery,
        });
      } catch (error) {
        if (!cancelled && error?.name !== "RenderingCancelledException") {
          // Page-level failures remain isolated so another page can still render.
          const layer = textLayerRef.current;
          if (layer) layer.replaceChildren();
        }
      } finally {
        if (!cancelled) setRendering(false);
        pdfPage?.cleanup?.();
      }
    })();
    return () => {
      cancelled = true;
      try { renderTask?.cancel(); } catch { /* already settled */ }
    };
  }, [doc, pdfjs, pageNumber, nearViewport, zoom, rotation, getTextContent]);

  useEffect(() => {
    if (!nearViewport || !textContentRef.current || !viewportRef.current) return;
    buildSelectableTextLayer({
      pdfjs,
      textContent: textContentRef.current,
      container: textLayerRef.current,
      viewport: viewportRef.current,
      query: searchQuery,
    });
  }, [searchQuery, nearViewport, pdfjs]);

  useEffect(() => {
    if (nearViewport) return;
    const canvas = canvasRef.current;
    if (canvas && canvas.width > 1) {
      canvas.width = 1;
      canvas.height = 1;
      canvas.style.width = "1px";
      canvas.style.height = "1px";
    }
    textLayerRef.current?.replaceChildren();
    viewportRef.current = null;
    textContentRef.current = null;
  }, [nearViewport]);

  const displayWidth = Math.max(1, Math.round(baseSize.width * zoom));
  const displayHeight = Math.max(1, Math.round(baseSize.height * zoom));

  return (
    <section
      ref={hostRef}
      id={`mz-pdf-page-${pageNumber}`}
      data-pdf-page={pageNumber}
      className="mz-pdf-page-shell"
      style={{ width: `${displayWidth}px`, minHeight: `${displayHeight}px` }}
      aria-label={`PDF page ${pageNumber}`}
    >
      <div className="mz-pdf-page-surface" style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}>
        <canvas ref={canvasRef} className="mz-pdf-page-canvas" aria-hidden="true" />
        <div ref={textLayerRef} className="mz-pdf-text-layer" aria-label={`Selectable text for page ${pageNumber}`} />
        {rendering ? <div className="mz-pdf-page-loading" role="status">Rendering page {pageNumber}…</div> : null}
      </div>
      <span className="mz-pdf-page-number">{pageNumber}</span>
    </section>
  );
}
