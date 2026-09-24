import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { loadPdfJsDocument } from "./toolkit.js";

let workerCache = new Map();
async function getOcrWorker(language) {
  if (!workerCache.has(language)) {
    workerCache.set(language, import("tesseract.js").then(({ createWorker }) => createWorker(language)));
  }
  return workerCache.get(language);
}

async function renderOcrCanvas(page, dpi = 150, maxPixels = 20_000_000) {
  const requestedScale = dpi / 72;
  const base = page.getViewport({ scale: 1 });
  let scale = requestedScale;
  const requestedPixels = base.width * base.height * scale * scale;
  if (requestedPixels > maxPixels) scale = Math.sqrt(maxPixels / (base.width * base.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!context) throw new Error("OCR rendering surface could not be created.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return { canvas, scale, width: canvas.width, height: canvas.height };
}

function flattenWords(data) {
  if (Array.isArray(data?.words)) return data.words;
  const words = [];
  for (const block of data?.blocks || []) for (const paragraph of block.paragraphs || []) for (const line of paragraph.lines || []) for (const word of line.words || []) words.push(word);
  return words;
}

export async function recognizeCanvasDetailed(canvas, language = "eng") {
  const worker = await getOcrWorker(language);
  const result = await worker.recognize(canvas, {}, { blocks: true });
  return { text: result?.data?.text || "", words: flattenWords(result?.data || {}) };
}

export async function ocrPdfToText(bytes, { language = "eng", onProgress, signal, dpi = 150 } = {}) {
  const { doc } = await loadPdfJsDocument(bytes);
  const pages = [];
  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      if (signal?.aborted) throw new DOMException("Operation cancelled", "AbortError");
      const page = await doc.getPage(pageNumber);
      try {
        const rendered = await renderOcrCanvas(page, dpi);
        const recognized = await recognizeCanvasDetailed(rendered.canvas, language);
        pages.push({ pageNumber, text: recognized.text.trim() });
        rendered.canvas.width = 1; rendered.canvas.height = 1;
      } finally { page.cleanup?.(); }
      onProgress?.(pageNumber, doc.numPages);
    }
  } finally { try { await doc.destroy?.(); } catch {} }
  return pages;
}

export async function createSearchablePdf(bytes, { language = "eng", onProgress, signal, dpi = 150 } = {}) {
  const [{ doc: renderDoc }, output] = await Promise.all([
    loadPdfJsDocument(bytes),
    PDFDocument.load(bytes.slice()),
  ]);
  const font = await output.embedFont(StandardFonts.Helvetica);
  const outputPages = output.getPages();
  let ocrPages = 0;
  try {
    for (let pageNumber = 1; pageNumber <= renderDoc.numPages; pageNumber += 1) {
      if (signal?.aborted) throw new DOMException("Operation cancelled", "AbortError");
      const pdfPage = await renderDoc.getPage(pageNumber);
      try {
        const textContent = await pdfPage.getTextContent();
        const hasText = (textContent.items || []).some((item) => String(item?.str || "").trim());
        if (!hasText) {
          const rendered = await renderOcrCanvas(pdfPage, dpi);
          const recognized = await recognizeCanvasDetailed(rendered.canvas, language);
          const outPage = outputPages[pageNumber - 1];
          const pageSize = outPage.getSize();
          for (const word of recognized.words) {
            const value = String(word?.text || "").trim();
            const box = word?.bbox;
            if (!value || !box) continue;
            const x = (box.x0 / rendered.width) * pageSize.width;
            const y = pageSize.height - (box.y1 / rendered.height) * pageSize.height;
            const boxWidth = Math.max(1, ((box.x1 - box.x0) / rendered.width) * pageSize.width);
            const fontSize = Math.max(3, ((box.y1 - box.y0) / rendered.height) * pageSize.height * 0.84);
            const naturalWidth = font.widthOfTextAtSize(value, fontSize) || boxWidth;
            const scaleX = naturalWidth > 0 ? boxWidth / naturalWidth : 1;
            outPage.drawText(value, {
              x, y, size: fontSize, font,
              color: rgb(0, 0, 0), opacity: 0,
              xScale: Math.max(20, Math.min(500, scaleX * 100)),
            });
          }
          rendered.canvas.width = 1; rendered.canvas.height = 1;
          ocrPages += 1;
        }
      } finally { pdfPage.cleanup?.(); }
      onProgress?.(pageNumber, renderDoc.numPages, ocrPages);
    }
  } finally { try { await renderDoc.destroy?.(); } catch {} }
  const outBytes = await output.save({ useObjectStreams: true });
  return { bytes: outBytes, pageCount: outputPages.length, ocrPages };
}
