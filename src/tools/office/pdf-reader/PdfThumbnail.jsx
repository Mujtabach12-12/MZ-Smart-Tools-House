import { useEffect, useRef, useState } from "react";
import { renderPdfThumbnail } from "../../../lib/pdf/rendering.js";

export default function PdfThumbnail({ doc, pageNumber, active, onSelect, scrollRootRef }) {
  const hostRef = useRef(null);
  const objectUrlRef = useRef("");
  const [src, setSrc] = useState("");
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setNearViewport(Boolean(entry?.isIntersecting));
    }, { root: scrollRootRef?.current || null, rootMargin: "500px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [scrollRootRef]);

  useEffect(() => {
    let cancelled = false;
    if (!nearViewport) {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
      setSrc("");
      return undefined;
    }
    if (!doc || objectUrlRef.current) return undefined;
    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        const thumbnail = await renderPdfThumbnail(page, { maxWidth: 126, quality: 0.78 });
        page.cleanup?.();
        if (cancelled) return;
        const url = URL.createObjectURL(thumbnail.blob);
        objectUrlRef.current = url;
        setSrc(url);
      } catch {
        // Thumbnail failure must never block reading the document.
      }
    })();
    return () => { cancelled = true; };
  }, [doc, pageNumber, nearViewport]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = "";
  }, []);

  useEffect(() => {
    if (active) hostRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  return (
    <button
      ref={hostRef}
      type="button"
      className={`mz-pdf-thumbnail ${active ? "is-active" : ""}`}
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      aria-label={`Go to page ${pageNumber}`}
    >
      <span className="mz-pdf-thumbnail-paper">
        {src ? <img src={src} alt="" /> : <span className="mz-pdf-thumbnail-skeleton" aria-hidden="true" />}
      </span>
      <span>Page {pageNumber}</span>
    </button>
  );
}
