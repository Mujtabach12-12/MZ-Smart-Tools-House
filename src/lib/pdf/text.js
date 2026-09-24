import { loadPdfJsDocument } from "./toolkit.js";

export async function extractPdfTextByPage(bytes, { onProgress, normalizeWhitespace = true, signal } = {}) {
  const { doc } = await loadPdfJsDocument(bytes);
  const pages = [];
  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      if (signal?.aborted) throw new DOMException("Operation cancelled", "AbortError");
      const page = await doc.getPage(pageNumber);
      try {
        const content = await page.getTextContent({ includeMarkedContent: true });
        let text = "";
        for (const item of content.items || []) {
          const value = item?.str || "";
          text += value;
          text += item?.hasEOL ? "\n" : " ";
        }
        if (normalizeWhitespace) text = text.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
        else text = text.replace(/[ \t]+\n/g, "\n").trim();
        pages.push({ pageNumber, text, itemCount: content.items?.length || 0 });
      } finally { page.cleanup?.(); }
      onProgress?.(pageNumber, doc.numPages);
    }
  } finally { try { await doc.destroy?.(); } catch {} }
  return pages;
}

export function joinPdfTextPages(pages) {
  return (pages || []).map((page) => `--- Page ${page.pageNumber} ---\n${page.text || ""}`.trimEnd()).join("\n\n").trim();
}
