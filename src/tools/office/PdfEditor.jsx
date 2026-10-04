import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, Copy, Download, FilePlus2, FileText, Highlighter,
  ImagePlus, Loader2, Minus, PencilLine, Plus, RotateCcw, RotateCw, ScanText,
  Square, Trash2, Type, Upload, X,
} from "lucide-react";
import { downloadBlob, downloadBytes } from "../../lib/download";
import { validateOoxmlOutput } from "../../lib/files/outputValidation.js";
import { announceToolSuccess } from "../../lib/toolSuccess.js";
import { recognizeCanvasDetailed } from "../../lib/pdf/ocr.js";
import {
  buildEditableTextBlocks,
  countDirtyBlocks,
  pageBlocksToPlainText,
  restoreEditableBlock,
  updateEditableBlock,
} from "../../lib/pdf/editableText.js";

const MAX_FILE_BYTES = 80 * 1024 * 1024;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function EditablePdfTextBlock({ block, active, busy, displayScale, onSelect, onCommit }) {
  const ref = useRef(null);
  const focusedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || focusedRef.current) return;
    if (node.textContent !== block.text) node.textContent = block.text;
  }, [block.text]);

  const commit = (event) => {
    onCommit(block.id, { text: event.currentTarget.textContent || "" });
  };

  const showEditingLayer = active || hovered || block.dirty;
  const editBackground = block.background && block.background !== "transparent" ? block.background : "#ffffff";
  const editColor = block.textColor || "#111827";

  return <div
    ref={ref}
    role="textbox"
    aria-label={`Editable PDF text: ${block.originalText}`}
    aria-multiline="false"
    contentEditable={!busy}
    suppressContentEditableWarning
    spellCheck="false"
    onFocus={(event) => {
      focusedRef.current = true;
      onSelect(block.id);
      if (event.currentTarget.textContent !== block.text) event.currentTarget.textContent = block.text;
    }}
    onBlur={(event) => { focusedRef.current = false; commit(event); }}
    onInput={() => {
      // Keep browser-owned contentEditable DOM untouched while typing so the caret never jumps.
      // The final text is committed on blur; the side-panel editor still updates state directly.
    }}
    onPointerEnter={() => setHovered(true)}
    onPointerLeave={() => setHovered(false)}
    onKeyDown={(event) => {
      if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
    }}
    className={`mz-pdf-editor-text-block ${active ? "is-active" : ""} ${block.dirty ? "is-dirty" : ""}`}
    style={{
      left: `${block.leftPct}%`, top: `${block.topPct}%`,
      width: `${Math.min(100 - block.leftPct, Math.max(block.widthPct, 4))}%`,
      minHeight: `${Math.max(block.heightPct, 1)}%`,
      fontSize: `${Math.max(7, block.fontSizeViewport * displayScale)}px`,
      lineHeight: 1.05,
      color: showEditingLayer ? editColor : "transparent",
      WebkitTextFillColor: showEditingLayer ? editColor : "transparent",
      background: showEditingLayer ? editBackground : "transparent",
      boxShadow: showEditingLayer ? `0 0 0 2px ${editBackground}` : "none",
      textShadow: "none",
      filter: "none",
    }}
  />;
}

async function loadPdfLib() { return import("pdf-lib"); }
async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}
async function readFile(file) { return new Uint8Array(await file.arrayBuffer()); }

async function inspectPdf(bytes) {
  const { PDFDocument } = await loadPdfLib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
  return { pageCount: doc.getPageCount() };
}

async function rebuildPdf(bytes, indices) {
  const { PDFDocument } = await loadPdfLib();
  const source = await PDFDocument.load(bytes);
  const output = await PDFDocument.create();
  const copies = await output.copyPages(source, indices);
  copies.forEach((page) => output.addPage(page));
  return output.save({ useObjectStreams: true });
}

async function renderPdfPages(bytes, { selected = 0, thumbs = true } = {}) {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  try {
    const renderPage = async (index, scale, format = "image/png", quality) => {
      const page = await pdf.getPage(index + 1);
      try {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL(format, quality);
      } finally { page.cleanup?.(); }
    };
    const preview = await renderPage(Math.min(selected, pdf.numPages - 1), 1.35);
    const thumbnails = [];
    if (thumbs) {
      for (let index = 0; index < pdf.numPages; index += 1) thumbnails.push(await renderPage(index, 0.2));
    }
    return { preview, thumbnails, pageCount: pdf.numPages };
  } finally { try { await pdf.destroy?.(); } catch {} }
}

async function extractEditablePage(bytes, pageIndex) {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  try {
    const page = await pdf.getPage(pageIndex + 1);
    try {
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      return {
        blocks: buildEditableTextBlocks(content, viewport, pdfjs),
        metrics: { width: viewport.width, height: viewport.height, rotation: viewport.rotation || 0 },
      };
    } finally { page.cleanup?.(); }
  } finally { try { await pdf.destroy?.(); } catch {} }
}

async function ocrEditablePage(bytes, pageIndex, language = "eng") {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  try {
    const page = await pdf.getPage(pageIndex + 1);
    try {
      const base = page.getViewport({ scale: 1 });
      let scale = 2;
      if (base.width * base.height * scale * scale > 16_000_000) scale = Math.sqrt(16_000_000 / (base.width * base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
      if (!ctx) throw new Error("OCR rendering surface could not be created.");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const recognized = await recognizeCanvasDetailed(canvas, language);
      const words = Array.isArray(recognized.words) ? recognized.words : [];
      const blocks = words.map((word, index) => {
        const text = String(word?.text || "").trim();
        const box = word?.bbox;
        if (!text || !box) return null;
        const leftPct = (box.x0 / canvas.width) * 100;
        const topPct = (box.y0 / canvas.height) * 100;
        const widthPct = Math.max(1, ((box.x1 - box.x0) / canvas.width) * 100);
        const heightPct = Math.max(.8, ((box.y1 - box.y0) / canvas.height) * 100);
        const pdfX = (box.x0 / canvas.width) * base.width;
        const pdfBottom = base.height - (box.y1 / canvas.height) * base.height;
        const pdfHeight = Math.max(6, ((box.y1 - box.y0) / canvas.height) * base.height);
        const pdfWidth = Math.max(5, ((box.x1 - box.x0) / canvas.width) * base.width);
        return {
          id: `ocr-${index}`,
          text,
          originalText: text,
          dirty: false,
          removed: false,
          leftPct,
          topPct,
          widthPct,
          heightPct,
          fontSizeViewport: Math.max(7, pdfHeight * .82),
          pdfX,
          pdfY: pdfBottom + pdfHeight * .18,
          pdfWidth,
          pdfHeight,
          pdfFontSize: Math.max(6, pdfHeight * .82),
          fontFamily: "sans-serif",
          background: "#ffffff",
          textColor: "#111827",
          ocr: true,
        };
      }).filter(Boolean);
      canvas.width = 1; canvas.height = 1;
      return { blocks, metrics: { width: base.width, height: base.height, rotation: base.rotation || 0 }, text: recognized.text || "" };
    } finally { page.cleanup?.(); }
  } finally { try { await pdf.destroy?.(); } catch {} }
}

function validOverlay(rect) {
  const values = Object.fromEntries(Object.entries(rect).map(([key, value]) => [key, Number(value)]));
  const { x, y, width, height } = values;
  if ([x, y, width, height].some((value) => !Number.isFinite(value))) throw new Error("Overlay values must be numbers.");
  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 100 || y + height > 100) {
    throw new Error("Overlay position and size must stay inside the page.");
  }
  return values;
}

function parseHexColor(hex, fallback = [1, 1, 1]) {
  const match = String(hex || "").trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return fallback;
  const value = Number.parseInt(match[1], 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function chooseStandardFont(StandardFonts, family = "") {
  const value = String(family).toLowerCase();
  if (value.includes("courier") || value.includes("mono")) return StandardFonts.Courier;
  if (value.includes("times") || value.includes("serif")) return StandardFonts.TimesRoman;
  return StandardFonts.Helvetica;
}

function fitFontSize(font, text, preferred, maxWidth) {
  let size = Math.max(6, Math.min(72, Number(preferred) || 11));
  const value = String(text || "").replace(/[\r\n]+/g, " ");
  if (!value) return size;
  while (size > 6 && font.widthOfTextAtSize(value, size) > maxWidth) size -= .5;
  return size;
}

async function applyTextEdits(bytes, pageBlocks) {
  const dirty = countDirtyBlocks(pageBlocks);
  if (!dirty) return new Uint8Array(bytes);
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
  const doc = await PDFDocument.load(bytes);
  const fontCache = new Map();
  const getFont = async (family) => {
    const key = chooseStandardFont(StandardFonts, family);
    if (!fontCache.has(key)) fontCache.set(key, await doc.embedFont(key));
    return fontCache.get(key);
  };

  for (const [pageKey, blocks] of Object.entries(pageBlocks)) {
    const pageIndex = Number(pageKey);
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= doc.getPageCount()) continue;
    const page = doc.getPage(pageIndex);
    for (const block of Array.isArray(blocks) ? blocks : []) {
      if (!block?.dirty) continue;
      const bg = parseHexColor(block.background, [1, 1, 1]);
      const color = parseHexColor(block.textColor, [.07, .09, .13]);
      const coverY = Math.max(0, Number(block.pdfY || 0) - Number(block.pdfHeight || 10) * .30);
      const coverWidth = Math.min(page.getWidth() - Number(block.pdfX || 0), Math.max(2, Number(block.pdfWidth || 10) + 1.5));
      const coverHeight = Math.min(page.getHeight() - coverY, Math.max(4, Number(block.pdfHeight || 10) * 1.20));
      page.drawRectangle({ x: Math.max(0, Number(block.pdfX || 0) - .75), y: coverY, width: Math.max(2, coverWidth), height: Math.max(4, coverHeight), color: rgb(...bg), opacity: 1 });
      const text = String(block.text || "").trimEnd();
      if (!text) continue;
      const font = await getFont(block.fontFamily);
      const singleLine = text.replace(/[\r\n]+/g, " ");
      try { font.encodeText(singleLine); }
      catch { throw new Error("One or more edited characters cannot be embedded safely with the current browser PDF fonts. Export DOCX instead so the text is not corrupted."); }
      const size = fitFontSize(font, singleLine, block.pdfFontSize, Math.max(6, coverWidth - 1));
      const natural = font.widthOfTextAtSize(singleLine, size) || coverWidth;
      if (natural > coverWidth + 1) {
        throw new Error("One edited text line is too long for its original PDF area. Shorten that replacement or export DOCX so nearby content is not overwritten.");
      }
      page.drawText(singleLine, {
        x: Math.max(0, Number(block.pdfX || 0)),
        y: Math.max(1, Number(block.pdfY || 0)),
        size,
        font,
        color: rgb(...color),
      });
    }
  }
  return new Uint8Array(await doc.save({ useObjectStreams: true }));
}

export default function PdfEditor() {
  const inputRef = useRef(null);
  const appendRef = useRef(null);
  const imageRef = useRef(null);
  const signatureRef = useRef(null);
  const pageStageRef = useRef(null);
  const [bytes, setBytes] = useState(null);
  const [name, setName] = useState("edited-document.pdf");
  const [selected, setSelected] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState([]);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [annotation, setAnnotation] = useState("");
  const [watermark, setWatermark] = useState("");
  const [crop, setCrop] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [overlay, setOverlay] = useState({ x: 12, y: 18, width: 76, height: 8 });
  const [zoom, setZoom] = useState(100);
  const [editMode, setEditMode] = useState(false);
  const [pageBlocks, setPageBlocks] = useState({});
  const [pageMetrics, setPageMetrics] = useState({});
  const [textLayerState, setTextLayerState] = useState({});
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [displayScale, setDisplayScale] = useState(1);
  const ready = Boolean(bytes && pageCount);
  const busy = status === "processing" || status === "loading-preview" || status === "extracting-text" || status === "ocr" || status === "exporting";
  const dirtyCount = useMemo(() => countDirtyBlocks(pageBlocks), [pageBlocks]);
  const selectedBlocks = pageBlocks[selected] || [];
  const selectedBlock = selectedBlocks.find((block) => block.id === selectedBlockId) || null;

  async function refresh(nextBytes, nextSelected = selected, notice = "") {
    setStatus("processing");
    setError("");
    try {
      const check = await inspectPdf(nextBytes);
      const clamped = Math.max(0, Math.min(nextSelected, check.pageCount - 1));
      const rendered = await renderPdfPages(nextBytes, { selected: clamped, thumbs: true });
      setBytes(new Uint8Array(nextBytes));
      setPageCount(check.pageCount);
      setSelected(clamped);
      setPreview(rendered.preview);
      setThumbnails(rendered.thumbnails);
      setStatus("success");
      setMessage(notice);
    } catch (err) {
      setStatus("error");
      setError(err?.message || "The PDF could not be processed.");
    }
  }

  useEffect(() => {
    if (!bytes || !pageCount) return undefined;
    let cancelled = false;
    setSelectedBlockId(null);
    setStatus((value) => (value === "processing" ? value : "loading-preview"));
    renderPdfPages(bytes, { selected, thumbs: false })
      .then((result) => {
        if (!cancelled) { setPreview(result.preview); setStatus("success"); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setStatus("error"); }
      });
    return () => { cancelled = true; };
  }, [selected]);

  useEffect(() => {
    const node = pageStageRef.current;
    const metrics = pageMetrics[selected];
    if (!node || !metrics?.width) return undefined;
    const update = () => setDisplayScale(Math.max(.1, node.clientWidth / metrics.width));
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [selected, pageMetrics, preview, zoom]);

  useEffect(() => {
    if (!editMode || !bytes || pageBlocks[selected] || textLayerState[selected] === "loading") return;
    void loadTextLayer(selected);
  }, [editMode, selected, bytes]);

  async function openFile(file) {
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setError("Choose a PDF file."); return; }
    if (file.size > MAX_FILE_BYTES) { setError("This browser editor accepts PDFs up to 80 MB. Use a smaller PDF or a desktop PDF editor for very large files."); return; }
    setName(file.name.replace(/\.pdf$/i, "") + "-edited.pdf");
    setPageBlocks({}); setPageMetrics({}); setTextLayerState({}); setSelectedBlockId(null); setEditMode(false); setZoom(100);
    await refresh(await readFile(file), 0, "PDF opened. The original file stays unchanged in your browser until you export a result.");
  }

  async function loadTextLayer(pageIndex, force = false) {
    if (!bytes) return;
    if (!force && pageBlocks[pageIndex]) return;
    setStatus("extracting-text");
    setError("");
    setTextLayerState((current) => ({ ...current, [pageIndex]: "loading" }));
    try {
      const result = await extractEditablePage(bytes, pageIndex);
      setPageBlocks((current) => ({ ...current, [pageIndex]: result.blocks }));
      setPageMetrics((current) => ({ ...current, [pageIndex]: result.metrics }));
      setTextLayerState((current) => ({ ...current, [pageIndex]: result.blocks.length ? "ready" : "empty" }));
      setMessage(result.blocks.length
        ? `${result.blocks.length} editable text line${result.blocks.length === 1 ? "" : "s"} detected on page ${pageIndex + 1}. Tap a line to edit or remove it.`
        : `No selectable text was found on page ${pageIndex + 1}. If this is a scan/photo PDF, use OCR this page.`);
      setStatus("success");
    } catch (err) {
      setTextLayerState((current) => ({ ...current, [pageIndex]: "error" }));
      setStatus("error");
      setError(err?.message || "Selectable PDF text could not be extracted.");
    }
  }

  async function runOcrForPage() {
    if (!bytes) return;
    setStatus("ocr");
    setError("");
    setMessage("OCR is reading this page. Accuracy depends on scan quality and language.");
    try {
      const result = await ocrEditablePage(bytes, selected, "eng");
      setPageBlocks((current) => ({ ...current, [selected]: result.blocks }));
      setPageMetrics((current) => ({ ...current, [selected]: result.metrics }));
      setTextLayerState((current) => ({ ...current, [selected]: result.blocks.length ? "ocr-ready" : "empty" }));
      setMessage(result.blocks.length
        ? `OCR detected ${result.blocks.length} editable word${result.blocks.length === 1 ? "" : "s"}. Review OCR text carefully before export.`
        : "OCR did not detect editable text on this page.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "OCR could not read this page.");
    }
  }

  function updateBlock(blockId, updater) {
    setPageBlocks((current) => ({ ...current, [selected]: updateEditableBlock(current[selected] || [], blockId, updater) }));
  }

  function restoreBlock(blockId) {
    setPageBlocks((current) => ({ ...current, [selected]: restoreEditableBlock(current[selected] || [], blockId) }));
  }

  function resetPageTextEdits() {
    setPageBlocks((current) => ({ ...current, [selected]: (current[selected] || []).map((block) => ({ ...block, text: block.originalText, removed: false, dirty: false, background: "#ffffff", textColor: "#111827" })) }));
    setSelectedBlockId(null);
    setMessage(`Text changes on page ${selected + 1} were restored.`);
  }

  async function applyMutation(mutator, notice, { invalidatesText = false } = {}) {
    if (!bytes) return;
    if (invalidatesText && dirtyCount) {
      setError("This page operation can move text coordinates. Download the edited PDF first or reset pending text edits before changing page structure.");
      return;
    }
    setStatus("processing");
    setError("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(bytes);
      await mutator(doc);
      const output = await doc.save({ useObjectStreams: true });
      if (invalidatesText) { setPageBlocks({}); setPageMetrics({}); setTextLayerState({}); setSelectedBlockId(null); }
      await refresh(output, selected, notice);
      announceToolSuccess({ source: "pdf-edit" });
    } catch (err) {
      setStatus("error");
      setError(err?.message || "The PDF change could not be applied.");
    }
  }

  const rotate = () => applyMutation(async (doc) => {
    const { degrees } = await loadPdfLib();
    const page = doc.getPage(selected);
    page.setRotation(degrees((page.getRotation().angle + 90) % 360));
  }, "Page rotated 90°.", { invalidatesText: true });

  const remove = async () => {
    if (pageCount <= 1) { setError("A PDF must contain at least one page."); return; }
    if (dirtyCount) { setError("Download the edited PDF first or reset pending text edits before deleting pages."); return; }
    const nextSelected = Math.max(0, Math.min(selected, pageCount - 2));
    await applyMutation((doc) => doc.removePage(selected), "Page deleted.", { invalidatesText: true });
    setSelected(nextSelected);
  };
  const duplicate = async () => {
    if (dirtyCount) { setError("Download the edited PDF first or reset pending text edits before duplicating pages."); return; }
    const indices = Array.from({ length: pageCount }, (_, i) => i);
    indices.splice(selected + 1, 0, selected);
    setPageBlocks({}); setPageMetrics({}); setTextLayerState({}); setSelectedBlockId(null);
    await refresh(await rebuildPdf(bytes, indices), selected + 1, "Page duplicated.");
    announceToolSuccess({ source: "pdf-edit" });
  };
  const move = async (direction) => {
    if (dirtyCount) { setError("Download the edited PDF first or reset pending text edits before reordering pages."); return; }
    const target = selected + direction;
    if (target < 0 || target >= pageCount) return;
    const indices = Array.from({ length: pageCount }, (_, i) => i);
    [indices[selected], indices[target]] = [indices[target], indices[selected]];
    setPageBlocks({}); setPageMetrics({}); setTextLayerState({}); setSelectedBlockId(null);
    await refresh(await rebuildPdf(bytes, indices), target, "Page reordered.");
    announceToolSuccess({ source: "pdf-edit" });
  };

  async function appendPdf(file) {
    if (!file || !bytes) return;
    if (dirtyCount) { setError("Download the edited PDF first or reset pending text edits before inserting another PDF."); return; }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setError("Choose another PDF to insert."); return; }
    if (file.size > MAX_FILE_BYTES) { setError("The PDF being inserted is too large for this browser workflow."); return; }
    setStatus("processing");
    setError("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const base = await PDFDocument.load(bytes);
      const other = await PDFDocument.load(await readFile(file));
      const copies = await base.copyPages(other, other.getPageIndices());
      copies.forEach((page) => base.addPage(page));
      setPageBlocks({}); setPageMetrics({}); setTextLayerState({});
      await refresh(await base.save({ useObjectStreams: true }), selected, `${copies.length} page${copies.length === 1 ? "" : "s"} appended.`);
      announceToolSuccess({ source: "pdf-edit" });
    } catch (err) {
      setStatus("error");
      setError(err?.message || "The additional PDF could not be inserted.");
    }
  }

  async function addText() {
    const text = annotation.trim();
    if (!text) { setError("Enter annotation text first."); return; }
    await applyMutation(async (doc) => {
      const { StandardFonts, rgb } = await loadPdfLib();
      const page = doc.getPage(selected);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const { height } = page.getSize();
      page.drawText(text, { x: 36, y: Math.max(28, height - 60), size: 14, font, color: rgb(.08, .15, .28), maxWidth: Math.max(80, page.getWidth() - 72) });
    }, "Text annotation added near the top of the selected page.");
  }

  async function addPageNumbers() {
    await applyMutation(async (doc) => {
      const { StandardFonts, rgb } = await loadPdfLib();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      doc.getPages().forEach((page, index) => {
        const label = String(index + 1);
        const width = font.widthOfTextAtSize(label, 10);
        page.drawText(label, { x: (page.getWidth() - width) / 2, y: 18, size: 10, font, color: rgb(.25, .3, .4) });
      });
    }, "Page numbers added to every page.");
  }

  async function addWatermark() {
    const text = watermark.trim();
    if (!text) { setError("Enter watermark text first."); return; }
    await applyMutation(async (doc) => {
      const { StandardFonts, rgb, degrees } = await loadPdfLib();
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      doc.getPages().forEach((page) => {
        const size = Math.min(44, Math.max(24, page.getWidth() / 11));
        const width = font.widthOfTextAtSize(text, size);
        page.drawText(text, { x: (page.getWidth() - width * .72) / 2, y: page.getHeight() / 2, size, font, color: rgb(.35, .45, .65), opacity: .18, rotate: degrees(35) });
      });
    }, "Watermark added to all pages.");
  }

  async function applyCrop() {
    const values = Object.fromEntries(Object.entries(crop).map(([key, value]) => [key, Number(value)]));
    if (Object.values(values).some((value) => !Number.isFinite(value) || value < 0 || value > 40)) { setError("Crop percentages must be between 0 and 40."); return; }
    await applyMutation((doc) => {
      const page = doc.getPage(selected);
      const { width, height } = page.getSize();
      const left = width * values.left / 100;
      const right = width * values.right / 100;
      const top = height * values.top / 100;
      const bottom = height * values.bottom / 100;
      const nextWidth = width - left - right;
      const nextHeight = height - top - bottom;
      if (nextWidth < 72 || nextHeight < 72) throw new Error("Crop margins leave too little of the page.");
      page.setCropBox(left, bottom, nextWidth, nextHeight);
    }, "Crop box applied to the selected page.", { invalidatesText: true });
  }

  async function drawOverlay(kind) {
    let rect;
    try { rect = validOverlay(overlay); } catch (err) { setError(err.message); return; }
    await applyMutation(async (doc) => {
      const { rgb } = await loadPdfLib();
      const page = doc.getPage(selected);
      const { width, height } = page.getSize();
      const x = width * rect.x / 100;
      const y = height * (100 - rect.y - rect.height) / 100;
      const w = width * rect.width / 100;
      const h = height * rect.height / 100;
      if (kind === "highlight") page.drawRectangle({ x, y, width: w, height: h, color: rgb(1, .86, .1), opacity: .28 });
      else page.drawRectangle({ x, y, width: w, height: h, color: rgb(1, 1, 1), opacity: 1 });
    }, kind === "highlight" ? "Highlight added to the selected page." : "Visual whiteout added. Underlying PDF content may still exist and this is not secure redaction.");
  }

  async function insertImage(file, signature = false) {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) { setError("Choose an image smaller than 12 MB."); return; }
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const isJpg = ["image/jpeg", "image/jpg"].includes(file.type) || /\.jpe?g$/i.test(file.name);
    if (!isPng && !isJpg) { setError("Use a PNG or JPG image."); return; }
    const imageBytes = await readFile(file);
    await applyMutation(async (doc) => {
      const page = doc.getPage(selected);
      const image = isPng ? await doc.embedPng(imageBytes) : await doc.embedJpg(imageBytes);
      const maxWidth = page.getWidth() * (signature ? .30 : .42);
      const maxHeight = page.getHeight() * (signature ? .16 : .35);
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = signature ? page.getWidth() - width - 36 : (page.getWidth() - width) / 2;
      const y = signature ? 42 : (page.getHeight() - height) / 2;
      page.drawImage(image, { x: Math.max(12, x), y: Math.max(12, y), width, height });
    }, signature ? "Signature image inserted near the bottom-right of the selected page." : "Image inserted in the selected page.");
  }

  async function buildOutputPdf() {
    if (!bytes) throw new Error("Open a PDF first.");
    return applyTextEdits(bytes, pageBlocks);
  }

  async function downloadPdf() {
    if (!bytes) return;
    setStatus("exporting");
    setError("");
    try {
      const output = await buildOutputPdf();
      const check = await inspectPdf(output);
      if (check.pageCount !== pageCount) throw new Error("PDF validation failed before download.");
      await downloadBytes(output, name.endsWith(".pdf") ? name : `${name}.pdf`, "application/pdf");
      setMessage(`Validated ${check.pageCount} page${check.pageCount === 1 ? "" : "s"}${dirtyCount ? ` with ${dirtyCount} text edit${dirtyCount === 1 ? "" : "s"}` : ""} and prepared the PDF download.`);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err.message || "The PDF could not be validated for download.");
    }
  }

  async function ensureAllTextPages() {
    if (!bytes) return {};
    const next = { ...pageBlocks };
    for (let index = 0; index < pageCount; index += 1) {
      if (next[index]) continue;
      const result = await extractEditablePage(bytes, index);
      next[index] = result.blocks;
      setPageMetrics((current) => ({ ...current, [index]: result.metrics }));
    }
    setPageBlocks(next);
    return next;
  }

  async function exportDocx() {
    if (!bytes) return;
    setStatus("exporting");
    setError("");
    try {
      const model = await ensureAllTextPages();
      const api = await import("docx");
      const { Document, Packer, Paragraph, TextRun } = api;
      const children = [];
      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const blocks = (model[pageIndex] || []).slice().sort((a, b) => (a.topPct - b.topPct) || (a.leftPct - b.leftPct));
        if (pageIndex > 0) children.push(new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }));
        if (!blocks.length) children.push(new Paragraph({ text: " " }));
        for (const block of blocks) {
          if (!String(block.text || "").trim()) continue;
          children.push(new Paragraph({ children: [new TextRun({ text: String(block.text), font: "Arial", size: Math.max(16, Math.min(36, Math.round((block.pdfFontSize || 11) * 2))) })], spacing: { after: 40 } }));
        }
      }
      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      await validateOoxmlOutput(blob, DOCX_MIME);
      await downloadBlob(blob, `${name.replace(/\.pdf$/i, "")}.docx`);
      setMessage("Editable DOCX exported. Text is preserved as editable Word paragraphs; complex PDF positioning, fonts, tables and graphics may not map exactly to Word flow layout.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "The editable DOCX could not be created.");
    }
  }

  async function exportText() {
    if (!bytes) return;
    setStatus("exporting");
    setError("");
    try {
      const model = await ensureAllTextPages();
      const content = Array.from({ length: pageCount }, (_, index) => pageBlocksToPlainText(model[index] || [])).join("\n\n--- Page break ---\n\n");
      await downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), `${name.replace(/\.pdf$/i, "")}.txt`);
      setMessage("Editable text exported as TXT.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Text export failed.");
    }
  }

  async function extractSelectedPage() {
    if (!bytes) return;
    setStatus("processing");
    setError("");
    try {
      const sourceForExtract = dirtyCount ? await buildOutputPdf() : bytes;
      const output = await rebuildPdf(sourceForExtract, [selected]);
      const check = await inspectPdf(output);
      if (check.pageCount !== 1) throw new Error("Extract validation failed: expected one page.");
      await downloadBytes(new Uint8Array(output), `${name.replace(/\.pdf$/i, "")}-page-${selected + 1}.pdf`, "application/pdf");
      setMessage(`Page ${selected + 1} extracted as a validated PDF.`);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "The selected page could not be extracted.");
    }
  }

  async function downloadSelectedImage(format) {
    if (!bytes) return;
    setStatus("processing");
    setError("");
    try {
      const sourceForRender = dirtyCount ? await buildOutputPdf() : bytes;
      const rendered = await renderPdfPages(sourceForRender, { selected, thumbs: false });
      let dataUrl = rendered.preview;
      if (format === "jpg") {
        const image = new Image();
        image.src = rendered.preview;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        dataUrl = canvas.toDataURL("image/jpeg", .92);
      }
      const blob = await fetch(dataUrl).then((r) => r.blob());
      if (!blob.size) throw new Error("Image export produced an empty file.");
      await downloadBytes(new Uint8Array(await blob.arrayBuffer()), `page-${selected + 1}.${format}`, format === "jpg" ? "image/jpeg" : "image/png");
      setMessage(`Page ${selected + 1} exported as ${format.toUpperCase()}.`);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "The selected page could not be exported as an image.");
    }
  }

  function reset() {
    setBytes(null); setPageCount(0); setSelected(0); setThumbnails([]); setPreview("");
    setStatus("idle"); setError(""); setMessage(""); setZoom(100); setEditMode(false);
    setPageBlocks({}); setPageMetrics({}); setTextLayerState({}); setSelectedBlockId(null);
  }

  const pageWidthStyle = zoom <= 100 ? `${zoom}%` : `${zoom}%`;
  const layerState = textLayerState[selected];

  return <div className="space-y-5 min-w-0">
    {!ready ? <section className="mz-card p-6 text-center sm:p-10">
      <Upload className="mx-auto h-10 w-10 text-brand-600"/>
      <h2 className="mt-4 text-xl font-extrabold">Open a PDF to edit</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-navy-500 dark:text-navy-400">Open a digital PDF as a centered editable document workspace. Selectable text can be edited or removed in place; scanned pages can use OCR. Page operations and exports run in your browser.</p>
      <button className="mz-btn-primary mt-5" onClick={() => inputRef.current?.click()}>Choose PDF</button>
      <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => openFile(event.target.files?.[0])}/>
    </section> : <>
      <div className="mz-pdf-editor-topbar rounded-2xl border border-navy-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-900">
        <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{name}</strong><span className="mt-1 block text-xs text-navy-400">{pageCount} pages · {dirtyCount ? `${dirtyCount} pending text edit${dirtyCount === 1 ? "" : "s"}` : "No pending text edits"}</span></div>
        <button className={`mz-btn-secondary ${editMode ? "border-brand-400 text-brand-700" : ""}`} disabled={busy} onClick={() => { setEditMode((value) => !value); setError(""); }}><PencilLine className="h-4 w-4"/> {editMode ? "Exit text edit" : "Edit existing text"}</button>
        <button className="mz-btn-secondary" disabled={busy || dirtyCount > 0} onClick={() => appendRef.current?.click()}><FilePlus2 className="h-4 w-4"/> Insert PDF</button>
        <input ref={appendRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => appendPdf(event.target.files?.[0])}/>
        <button className="mz-btn-secondary" onClick={reset}><X className="h-4 w-4"/> Close</button>
        <button className="mz-btn-primary" disabled={busy} onClick={downloadPdf}><Download className="h-4 w-4"/> Download PDF</button>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[170px_minmax(0,1fr)_300px] 2xl:grid-cols-[190px_minmax(0,1fr)_320px]">
        <aside className="min-w-0 rounded-2xl border border-navy-100 bg-white p-2 dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-2 px-2 py-1 text-xs font-bold uppercase tracking-wide text-navy-400">Pages</div>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-2 xl:block xl:max-h-[720px] xl:space-y-2 xl:overflow-y-auto xl:overflow-x-hidden xl:pr-1">
            {thumbnails.map((url, index) => <button key={index} className={`min-w-24 shrink-0 rounded-xl border p-2 text-left transition sm:min-w-28 xl:w-full ${selected === index ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-navy-100 hover:border-brand-300 dark:border-navy-800"}`} onClick={() => setSelected(index)}>
              <img src={url} alt={`Page ${index + 1}`} className="mx-auto max-h-36 max-w-full rounded bg-white shadow-sm"/>
              <span className="mt-1 block text-center text-xs font-semibold">Page {index + 1}</span>
            </button>)}
          </div>
        </aside>

        <section className="mz-pdf-editor-stage min-w-0 rounded-2xl border border-navy-100 bg-slate-200 dark:border-navy-800 dark:bg-navy-950">
          <div className="mz-pdf-editor-toolbar sticky top-0 z-30 border-b border-slate-300/60 bg-slate-200/95 p-2 backdrop-blur dark:border-navy-800 dark:bg-navy-950/95">
            <div className="mz-pdf-editor-toolbar-scroll">
              <button className="mz-btn-secondary shrink-0" disabled={busy || dirtyCount > 0} onClick={rotate}><RotateCw className="h-4 w-4"/><span className="hidden sm:inline">Rotate</span></button>
              <button className="mz-btn-secondary shrink-0" disabled={busy || selected === 0 || dirtyCount > 0} onClick={() => move(-1)}><ArrowUp className="h-4 w-4"/><span className="hidden sm:inline">Move up</span></button>
              <button className="mz-btn-secondary shrink-0" disabled={busy || selected === pageCount - 1 || dirtyCount > 0} onClick={() => move(1)}><ArrowDown className="h-4 w-4"/><span className="hidden sm:inline">Move down</span></button>
              <button className="mz-btn-secondary shrink-0" disabled={busy || dirtyCount > 0} onClick={duplicate}><Copy className="h-4 w-4"/><span className="hidden sm:inline">Duplicate</span></button>
              <button className="mz-btn-secondary shrink-0" disabled={busy || dirtyCount > 0} onClick={remove}><Trash2 className="h-4 w-4"/><span className="hidden sm:inline">Delete page</span></button>
              <span className="h-8 w-px shrink-0 bg-slate-300 dark:bg-navy-700" aria-hidden="true"/>
              <button className={`mz-btn-secondary shrink-0 ${editMode ? "border-brand-400 bg-white text-brand-700" : ""}`} disabled={busy} onClick={() => setEditMode((value) => !value)}><PencilLine className="h-4 w-4"/><span>{editMode ? "Editing text" : "Edit text"}</span></button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <button className="mz-btn-ghost" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(50, value - 10))}><Minus className="h-4 w-4"/></button>
              <button className="min-w-16 rounded-lg px-2 py-1 text-xs font-bold" onClick={() => setZoom(100)} title="Fit width">{zoom === 100 ? "Fit" : `${zoom}%`}</button>
              <button className="mz-btn-ghost" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(200, value + 10))}><Plus className="h-4 w-4"/></button>
            </div>
          </div>

          {editMode ? <div className="border-b border-slate-300/60 bg-white/90 px-3 py-2 text-xs leading-5 text-navy-600 dark:border-navy-800 dark:bg-navy-900/90 dark:text-navy-300">
            <div className="flex flex-wrap items-center gap-2"><span className="font-bold text-brand-700 dark:text-brand-300">Word-like text edit:</span><span>tap a detected text line, type to replace it, or remove it. Unedited page graphics stay unchanged.</span>{layerState === "empty" ? <button className="mz-btn-secondary ml-auto" disabled={busy} onClick={runOcrForPage}><ScanText className="h-4 w-4"/> OCR this page</button> : null}</div>
          </div> : null}

          <div className="mz-pdf-editor-stage-scroll">
            {busy ? <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/55 backdrop-blur-sm dark:bg-navy-950/55"><Loader2 className="h-7 w-7 animate-spin text-brand-600"/><span className="ml-2 text-sm font-semibold">{status === "ocr" ? "Reading page text…" : status === "extracting-text" ? "Preparing editable text…" : "Processing PDF…"}</span></div> : null}
            {preview ? <div className="mx-auto flex w-full items-start justify-center py-4 sm:p-5">
              <div ref={pageStageRef} className="mz-pdf-editor-page relative mx-auto" style={{ width: pageWidthStyle, maxWidth: zoom <= 100 ? "900px" : "none" }}>
                <img src={preview} alt={`Preview of page ${selected + 1}`} className="block h-auto w-full select-none bg-white" draggable="false"/>
                {editMode && selectedBlocks.length ? <div className="absolute inset-0 z-10" aria-label={`Editable text layer for page ${selected + 1}`}>
                  {selectedBlocks.map((block) => (
                    <EditablePdfTextBlock
                      key={block.id}
                      block={block}
                      active={selectedBlockId === block.id}
                      busy={busy}
                      displayScale={displayScale}
                      onSelect={setSelectedBlockId}
                      onCommit={updateBlock}
                    />
                  ))}
                </div> : null}
              </div>
            </div> : null}
          </div>
        </section>

        <aside className="min-w-0 space-y-3">
          {editMode ? <section className="mz-card p-4">
            <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">Edit existing text</h3><p className="mt-1 text-xs leading-5 text-navy-500">Best for normal selectable PDFs. OCR is available when a scanned page has no text layer.</p></div><PencilLine className="h-5 w-5 shrink-0 text-brand-600"/></div>
            {layerState === "ready" || layerState === "ocr-ready" ? <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800 dark:bg-brand-950/30 dark:text-brand-200">{selectedBlocks.length} editable text block{selectedBlocks.length === 1 ? "" : "s"} · {selectedBlocks.filter((block) => block.dirty).length} changed on this page</p> : null}
            {layerState === "empty" ? <button className="mz-btn-primary mt-3 w-full" disabled={busy} onClick={runOcrForPage}><ScanText className="h-4 w-4"/> OCR this scanned page</button> : null}
            {selectedBlock ? <div className="mt-3 space-y-3 rounded-xl border border-navy-100 p-3 dark:border-navy-800">
              <label className="block text-xs font-semibold">Selected text<textarea className="mz-input mt-1 min-h-24" value={selectedBlock.text} onChange={(event) => updateBlock(selectedBlock.id, { text: event.target.value })}/></label>
              <div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold">Text color<input className="mt-1 h-10 w-full rounded-lg border border-navy-200 bg-white p-1" type="color" value={selectedBlock.textColor} onChange={(event) => updateBlock(selectedBlock.id, { textColor: event.target.value })}/></label><label className="text-xs font-semibold">Background<input className="mt-1 h-10 w-full rounded-lg border border-navy-200 bg-white p-1" type="color" value={selectedBlock.background} onChange={(event) => updateBlock(selectedBlock.id, { background: event.target.value })}/></label></div>
              <div className="grid grid-cols-2 gap-2"><button className="mz-btn-secondary" onClick={() => updateBlock(selectedBlock.id, { text: "" })}><Trash2 className="h-4 w-4"/> Remove text</button><button className="mz-btn-secondary" onClick={() => restoreBlock(selectedBlock.id)}><RotateCcw className="h-4 w-4"/> Restore</button></div>
            </div> : <p className="mt-3 text-xs leading-5 text-navy-500">Tap text directly on the centered page to select it. The original PDF is not overwritten while you edit.</p>}
            <button className="mz-btn-ghost mt-3 w-full" disabled={!selectedBlocks.some((block) => block.dirty)} onClick={resetPageTextEdits}>Reset text changes on this page</button>
            <p className="mt-3 text-[11px] leading-5 text-navy-400">PDF text is stored as positioned drawing commands, not Word paragraphs. MZ keeps the original page and overlays only changed text regions; it does not rewrite arbitrary existing PDF content streams like Microsoft Word rewrites paragraphs. Complex backgrounds/fonts can require manual color adjustment; scanned PDFs depend on OCR accuracy.</p>
          </section> : null}

          <section className="mz-card p-4">
            <h3 className="font-bold">Add new text</h3>
            <p className="mt-1 text-xs text-navy-500">Adds a new annotation without changing existing text.</p>
            <textarea className="mz-input mt-3 min-h-24" value={annotation} onChange={(event) => setAnnotation(event.target.value)} placeholder="Annotation text"/>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={addText}><Type className="h-4 w-4"/> Add to selected page</button>
          </section>

          <section className="mz-card p-4">
            <h3 className="font-bold">Images & signature</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <button className="mz-btn-secondary" disabled={busy} onClick={() => imageRef.current?.click()}><ImagePlus className="h-4 w-4"/> Insert image</button>
              <button className="mz-btn-secondary" disabled={busy} onClick={() => signatureRef.current?.click()}>Insert signature image</button>
            </div>
            <input ref={imageRef} hidden type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(event) => insertImage(event.target.files?.[0], false)}/>
            <input ref={signatureRef} hidden type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(event) => insertImage(event.target.files?.[0], true)}/>
          </section>

          <details className="mz-card p-4"><summary className="cursor-pointer font-bold">Highlight / visual whiteout</summary><p className="mt-2 text-xs leading-5 text-navy-500">Position is measured from the page top-left. Whiteout covers content visually; it is not secure redaction.</p><div className="mt-3 grid grid-cols-2 gap-2">{Object.keys(overlay).map((key) => <label key={key} className="text-xs font-semibold capitalize">{key} %<input className="mz-input mt-1" type="number" min="0" max="100" value={overlay[key]} onChange={(event) => setOverlay((current) => ({ ...current, [key]: event.target.value }))}/></label>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><button className="mz-btn-secondary" disabled={busy} onClick={() => drawOverlay("highlight")}><Highlighter className="h-4 w-4"/> Highlight</button><button className="mz-btn-secondary" disabled={busy} onClick={() => drawOverlay("whiteout")}><Square className="h-4 w-4"/> Whiteout</button></div></details>

          <details className="mz-card p-4"><summary className="cursor-pointer font-bold">Page crop</summary><div className="mt-3 grid grid-cols-2 gap-2">{Object.keys(crop).map((key) => <label key={key} className="text-xs font-semibold capitalize">{key} %<input className="mz-input mt-1" type="number" min="0" max="40" value={crop[key]} onChange={(event) => setCrop((current) => ({ ...current, [key]: event.target.value }))}/></label>)}</div><button className="mz-btn-secondary mt-3 w-full" disabled={busy || dirtyCount > 0} onClick={applyCrop}>Apply crop box</button></details>

          <section className="mz-card p-4">
            <h3 className="font-bold">Export & document tools</h3>
            <input className="mz-input mt-3" value={watermark} onChange={(event) => setWatermark(event.target.value)} placeholder="Watermark text"/>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={addWatermark}>Add watermark</button>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={addPageNumbers}>Add page numbers</button>
            <button className="mz-btn-primary mt-2 w-full" disabled={busy} onClick={downloadPdf}><Check className="h-4 w-4"/> Export edited PDF</button>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={exportDocx}><FileText className="h-4 w-4"/> Export editable Word (.docx)</button>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={exportText}>Export text (.txt)</button>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={extractSelectedPage}>Extract selected page PDF</button>
            <div className="mt-2 grid grid-cols-2 gap-2"><button className="mz-btn-secondary" disabled={busy} onClick={() => downloadSelectedImage("png")}>Export selected page PNG</button><button className="mz-btn-secondary" disabled={busy} onClick={() => downloadSelectedImage("jpg")}>Export selected page JPG</button></div>
          </section>
        </aside>
      </div>
    </>}

    {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">{message}</div> : null}
    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">{error}</div> : null}
  </div>;
}
