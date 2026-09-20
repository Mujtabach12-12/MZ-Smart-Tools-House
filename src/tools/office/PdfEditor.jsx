import { useEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Copy, Download, FilePlus2, Highlighter, ImagePlus,
  Loader2, Minus, Plus, RotateCw, Square, Trash2, Type, Upload, X,
} from "lucide-react";
import { downloadBytes } from "../../lib/download";

const MAX_FILE_BYTES = 80 * 1024 * 1024;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

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
  const renderPage = async (index, scale, format = "image/png", quality) => {
    const page = await pdf.getPage(index + 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL(format, quality);
  };
  const preview = await renderPage(Math.min(selected, pdf.numPages - 1), 1.25);
  const thumbnails = [];
  if (thumbs) {
    for (let index = 0; index < pdf.numPages; index += 1) thumbnails.push(await renderPage(index, 0.2));
  }
  return { preview, thumbnails, pageCount: pdf.numPages, renderPage };
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

export default function PdfEditor() {
  const inputRef = useRef(null);
  const appendRef = useRef(null);
  const imageRef = useRef(null);
  const signatureRef = useRef(null);
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
  const ready = Boolean(bytes && pageCount);
  const busy = status === "processing" || status === "loading-preview";

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

  async function openFile(file) {
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setError("Choose a PDF file."); return; }
    if (file.size > MAX_FILE_BYTES) { setError("This browser editor accepts PDFs up to 80 MB. Use a smaller PDF or a desktop PDF editor for very large files."); return; }
    setName(file.name.replace(/\.pdf$/i, "") + "-edited.pdf");
    await refresh(await readFile(file), 0, "PDF opened. Changes stay in your browser until you download the result.");
  }

  async function applyMutation(mutator, notice) {
    if (!bytes) return;
    setStatus("processing");
    setError("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(bytes);
      await mutator(doc);
      const output = await doc.save({ useObjectStreams: true });
      await refresh(output, selected, notice);
    } catch (err) {
      setStatus("error");
      setError(err?.message || "The PDF change could not be applied.");
    }
  }

  const rotate = () => applyMutation(async (doc) => {
    const { degrees } = await loadPdfLib();
    const page = doc.getPage(selected);
    page.setRotation(degrees((page.getRotation().angle + 90) % 360));
  }, "Page rotated 90°." );

  const remove = async () => {
    if (pageCount <= 1) { setError("A PDF must contain at least one page."); return; }
    const nextSelected = Math.max(0, Math.min(selected, pageCount - 2));
    await applyMutation((doc) => doc.removePage(selected), "Page deleted.");
    setSelected(nextSelected);
  };
  const duplicate = async () => {
    const indices = Array.from({ length: pageCount }, (_, i) => i);
    indices.splice(selected + 1, 0, selected);
    await refresh(await rebuildPdf(bytes, indices), selected + 1, "Page duplicated.");
  };
  const move = async (direction) => {
    const target = selected + direction;
    if (target < 0 || target >= pageCount) return;
    const indices = Array.from({ length: pageCount }, (_, i) => i);
    [indices[selected], indices[target]] = [indices[target], indices[selected]];
    await refresh(await rebuildPdf(bytes, indices), target, "Page reordered.");
  };

  async function appendPdf(file) {
    if (!file || !bytes) return;
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
      await refresh(await base.save({ useObjectStreams: true }), selected, `${copies.length} page${copies.length === 1 ? "" : "s"} appended.`);
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
    }, "Crop box applied to the selected page.");
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

  async function downloadPdf() {
    if (!bytes) return;
    setError("");
    try {
      const check = await inspectPdf(bytes);
      if (check.pageCount !== pageCount) throw new Error("PDF validation failed before download.");
      await downloadBytes(bytes, name.endsWith(".pdf") ? name : `${name}.pdf`, "application/pdf");
      setMessage(`Validated ${check.pageCount} page${check.pageCount === 1 ? "" : "s"} and prepared the PDF download.`);
    } catch (err) {
      setError(err.message || "The PDF could not be validated for download.");
    }
  }

  async function extractSelectedPage() {
    if (!bytes) return;
    setStatus("processing");
    setError("");
    try {
      const output = await rebuildPdf(bytes, [selected]);
      const check = await inspectPdf(output);
      if (check.pageCount !== 1) throw new Error("Extract validation failed: expected one page.");
      downloadBytes(new Uint8Array(output), `${name.replace(/\.pdf$/i, "")}-page-${selected + 1}.pdf`, "application/pdf");
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
      const rendered = await renderPdfPages(bytes, { selected, thumbs: false });
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
    setStatus("idle"); setError(""); setMessage(""); setZoom(100);
  }

  return <div className="space-y-5">
    {!ready ? <section className="mz-card p-6 text-center sm:p-10">
      <Upload className="mx-auto h-10 w-10 text-brand-600"/>
      <h2 className="mt-4 text-xl font-extrabold">Open a PDF to edit</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-navy-500 dark:text-navy-400">Page operations, annotations and exports run locally in your browser. This editor does not pretend to rewrite arbitrary existing PDF paragraph text.</p>
      <button className="mz-btn-primary mt-5" onClick={() => inputRef.current?.click()}>Choose PDF</button>
      <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => openFile(event.target.files?.[0])}/>
    </section> : <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-navy-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-900">
        <strong className="mr-auto min-w-0 truncate text-sm">{name}</strong>
        <span className="mz-badge-muted">{pageCount} pages</span>
        <button className="mz-btn-secondary" disabled={busy} onClick={() => appendRef.current?.click()}><FilePlus2 className="h-4 w-4"/> Insert PDF</button>
        <input ref={appendRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => appendPdf(event.target.files?.[0])}/>
        <button className="mz-btn-secondary" onClick={reset}><X className="h-4 w-4"/> Close</button>
        <button className="mz-btn-primary" disabled={busy} onClick={downloadPdf}><Download className="h-4 w-4"/> Download PDF</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)_320px]">
        <aside className="rounded-2xl border border-navy-100 bg-white p-2 dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-2 px-2 py-1 text-xs font-bold uppercase tracking-wide text-navy-400">Pages</div>
          <div className="flex gap-2 overflow-x-auto pb-2 xl:block xl:max-h-[680px] xl:space-y-2 xl:overflow-y-auto xl:overflow-x-hidden xl:pr-1">
            {thumbnails.map((url, index) => <button key={index} className={`min-w-28 rounded-xl border p-2 text-left transition xl:w-full ${selected === index ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30" : "border-navy-100 hover:border-brand-300 dark:border-navy-800"}`} onClick={() => setSelected(index)}>
              <img src={url} alt={`Page ${index + 1}`} className="mx-auto max-h-40 rounded bg-white shadow-sm"/>
              <span className="mt-1 block text-center text-xs font-semibold">Page {index + 1}</span>
            </button>)}
          </div>
        </aside>

        <section className="relative min-h-[520px] overflow-auto rounded-2xl border border-navy-100 bg-slate-200 p-3 dark:border-navy-800 dark:bg-navy-950 sm:p-4">
          <div className="sticky top-2 z-10 mb-3 flex flex-wrap justify-center gap-2">
            <button className="mz-btn-secondary" disabled={busy} onClick={rotate}><RotateCw className="h-4 w-4"/> Rotate</button>
            <button className="mz-btn-secondary" disabled={busy || selected === 0} onClick={() => move(-1)}><ArrowUp className="h-4 w-4"/> Move up</button>
            <button className="mz-btn-secondary" disabled={busy || selected === pageCount - 1} onClick={() => move(1)}><ArrowDown className="h-4 w-4"/> Move down</button>
            <button className="mz-btn-secondary" disabled={busy} onClick={duplicate}><Copy className="h-4 w-4"/> Duplicate</button>
            <button className="mz-btn-secondary" disabled={busy} onClick={remove}><Trash2 className="h-4 w-4"/> Delete</button>
          </div>
          <div className="sticky top-14 z-10 mx-auto mb-3 flex w-fit items-center gap-1 rounded-xl border border-navy-200 bg-white/95 p-1 shadow-sm backdrop-blur dark:border-navy-700 dark:bg-navy-900/95" aria-label="PDF zoom controls">
            <button className="mz-btn-ghost" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(50, value - 10))}><Minus className="h-4 w-4"/></button>
            <button className="min-w-16 rounded-lg px-2 py-1 text-xs font-bold" onClick={() => setZoom(100)}>{zoom}%</button>
            <button className="mz-btn-ghost" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(200, value + 10))}><Plus className="h-4 w-4"/></button>
          </div>
          {busy ? <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 backdrop-blur-sm dark:bg-navy-950/55"><Loader2 className="h-7 w-7 animate-spin text-brand-600"/><span className="sr-only">Processing PDF</span></div> : null}
          {preview ? <div className="mx-auto flex min-h-[420px] items-start justify-center"><img src={preview} alt={`Preview of page ${selected + 1}`} style={{ width: `${zoom}%`, maxWidth: zoom <= 100 ? "100%" : "none" }} className="h-auto bg-white shadow-xl"/></div> : null}
        </section>

        <aside className="space-y-3">
          <section className="mz-card p-4">
            <h3 className="font-bold">Add text</h3>
            <p className="mt-1 text-xs text-navy-500">Adds a new text annotation; it does not rewrite existing PDF text objects.</p>
            <textarea className="mz-input mt-3 min-h-24" value={annotation} onChange={(event) => setAnnotation(event.target.value)} placeholder="Annotation text"/>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={addText}><Type className="h-4 w-4"/> Add to selected page</button>
          </section>

          <section className="mz-card p-4">
            <h3 className="font-bold">Images & signature</h3>
            <p className="mt-1 text-xs leading-5 text-navy-500">Insert a real PNG/JPG image into the PDF. Signature images are placed near the bottom-right.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <button className="mz-btn-secondary" disabled={busy} onClick={() => imageRef.current?.click()}><ImagePlus className="h-4 w-4"/> Insert image</button>
              <button className="mz-btn-secondary" disabled={busy} onClick={() => signatureRef.current?.click()}>Insert signature image</button>
            </div>
            <input ref={imageRef} hidden type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(event) => insertImage(event.target.files?.[0], false)}/>
            <input ref={signatureRef} hidden type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(event) => insertImage(event.target.files?.[0], true)}/>
          </section>

          <section className="mz-card p-4">
            <h3 className="font-bold">Highlight / visual whiteout</h3>
            <p className="mt-1 text-xs leading-5 text-navy-500">Position is measured from the page top-left. Whiteout only covers content visually; it is <strong>not secure redaction</strong>.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.keys(overlay).map((key) => <label key={key} className="text-xs font-semibold capitalize">{key} %<input className="mz-input mt-1" type="number" min="0" max="100" value={overlay[key]} onChange={(event) => setOverlay((current) => ({ ...current, [key]: event.target.value }))}/></label>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="mz-btn-secondary" disabled={busy} onClick={() => drawOverlay("highlight")}><Highlighter className="h-4 w-4"/> Highlight</button>
              <button className="mz-btn-secondary" disabled={busy} onClick={() => drawOverlay("whiteout")}><Square className="h-4 w-4"/> Whiteout</button>
            </div>
          </section>

          <section className="mz-card p-4">
            <h3 className="font-bold">Page crop</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">{Object.keys(crop).map((key) => <label key={key} className="text-xs font-semibold capitalize">{key} %<input className="mz-input mt-1" type="number" min="0" max="40" value={crop[key]} onChange={(event) => setCrop((current) => ({ ...current, [key]: event.target.value }))}/></label>)}</div>
            <button className="mz-btn-secondary mt-3 w-full" disabled={busy} onClick={applyCrop}>Apply crop box</button>
          </section>

          <section className="mz-card p-4">
            <h3 className="font-bold">Document additions & export</h3>
            <input className="mz-input mt-3" value={watermark} onChange={(event) => setWatermark(event.target.value)} placeholder="Watermark text"/>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={addWatermark}>Add watermark</button>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={addPageNumbers}>Add page numbers</button>
            <button className="mz-btn-secondary mt-2 w-full" disabled={busy} onClick={extractSelectedPage}>Extract selected page PDF</button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="mz-btn-secondary" disabled={busy} onClick={() => downloadSelectedImage("png")}>Export selected page PNG</button>
              <button className="mz-btn-secondary" disabled={busy} onClick={() => downloadSelectedImage("jpg")}>Export selected page JPG</button>
            </div>
          </section>
        </aside>
      </div>
    </>}

    {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">{message}</div> : null}
    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">{error}</div> : null}
  </div>;
}
