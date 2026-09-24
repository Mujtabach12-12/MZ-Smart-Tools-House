import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, PackageOpen } from "lucide-react";
import { downloadBlob } from "../../lib/download";
import { inspectPdfFile, makePageImageName } from "../../lib/pdf/toolkit.js";
import { parsePageRanges } from "../../lib/pdf/core.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ProgressBar from "../../components/tools/ProgressBar";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfStepIndicator from "../../components/tools/pdf/PdfStepIndicator.jsx";
import PdfFileSummary from "../../components/tools/pdf/PdfFileSummary.jsx";
import PdfPagePicker from "../../components/tools/pdf/PdfPagePicker.jsx";

const RESOLUTIONS = {
  standard: { label: "Standard", dpi: 96, help: "Smaller files for screen use" },
  high: { label: "High", dpi: 150, help: "Sharper text and normal documents" },
  veryHigh: { label: "Very High", dpi: 300, help: "Large output for print/detail" },
};

function Preview({ image, filename, extension }) {
  const urlRef = useRef("");
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(image.blob);
    urlRef.current = url;
    setSrc(url);
    return () => { URL.revokeObjectURL(url); urlRef.current = ""; };
  }, [image.blob]);
  return <article className="overflow-hidden rounded-xl border border-navy-100 bg-white dark:border-navy-800 dark:bg-navy-900"><div className="aspect-[3/4] bg-slate-100 p-2 dark:bg-slate-800"><img src={src} alt={`Converted page ${image.pageNumber}`} className="h-full w-full object-contain" /></div><div className="flex items-center justify-between gap-2 p-2"><div><strong className="block text-xs">Page {image.pageNumber}</strong><span className="text-[10px] text-navy-500">{image.width}×{image.height} · {image.dpi} DPI</span></div><button type="button" className="mz-pdf-toolbar-button" onClick={() => downloadBlob(image.blob, makePageImageName(filename, image.pageNumber, extension))} aria-label={`Download page ${image.pageNumber}`}><Download /></button></div></article>;
}

export default function PdfToImageBase({ format, extension }) {
  const [source, setSource] = useState(null);
  const [pageMode, setPageMode] = useState("all");
  const [rangeInput, setRangeInput] = useState("");
  const [selectedPages, setSelectedPages] = useState([]);
  const [resolution, setResolution] = useState("high");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  async function handleFiles([file]) {
    setError(""); setImages([]); setSelectedPages([]);
    if (!file) return;
    try { setSource(await inspectPdfFile(file)); }
    catch (e) { setSource(null); setError(e.message || "Could not open this PDF."); }
  }

  function reset() { setSource(null); setImages([]); setSelectedPages([]); setRangeInput(""); setPageMode("all"); setResolution("high"); setProgress({ current: 0, total: 0 }); setError(""); }
  function togglePage(page) { setSelectedPages((prev) => prev.includes(page) ? prev.filter((n) => n !== page) : [...prev, page].sort((a,b)=>a-b)); setImages([]); }

  const pageNumbers = useMemo(() => {
    if (!source) return [];
    if (pageMode === "all") return Array.from({ length: source.pageCount }, (_, i) => i + 1);
    if (pageMode === "selected") return selectedPages;
    try { return parsePageRanges(rangeInput, source.pageCount).map((index) => index + 1); } catch { return []; }
  }, [source, pageMode, selectedPages, rangeInput]);

  async function convert() {
    if (!source) return;
    setBusy(true); setError(""); setImages([]); setProgress({ current: 0, total: pageNumbers.length });
    try {
      if (!pageNumbers.length) throw new Error(pageMode === "selected" ? "Select at least one page." : "Enter a valid page range, for example 1-3,5.");
      const { renderPdfPagesToImages } = await import("../../lib/pdf/pdfToImages.js");
      const results = await renderPdfPagesToImages(source.bytes, {
        format,
        quality: format === "image/jpeg" ? 0.94 : undefined,
        dpi: RESOLUTIONS[resolution].dpi,
        pageNumbers,
        onProgress: (current, total) => setProgress({ current, total }),
      });
      if (!results.length || results.some((item) => !(item.blob?.size > 0) || !(item.width > 0) || !(item.height > 0))) throw new Error("One or more converted images failed output validation.");
      setImages(results);
    } catch (e) { setError(e.message || "The PDF could not be converted."); }
    finally { setBusy(false); }
  }

  async function downloadZip() {
    if (!images.length) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const image of images) zip.file(makePageImageName(source.name, image.pageNumber, extension), image.blob);
    const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
    await downloadBlob(blob, `${source.name.replace(/\.pdf$/i, "")}-${extension}-pages.zip`);
  }

  const step = images.length ? 4 : busy ? 3 : source ? 2 : 1;

  return <div className="mz-card p-4 sm:p-6">
    <PdfStepIndicator current={step} steps={["Select", "Configure", "Convert", "Download"]} />
    {!source ? <FileDropzone accept="application/pdf" onFiles={handleFiles} label={`Choose a PDF to convert to ${extension.toUpperCase()}`} /> : <PdfFileSummary name={source.name} size={source.size} pageCount={source.pageCount} onRemove={reset} />}
    {source ? <div className="mt-5 space-y-5">
      <div><p className="text-sm font-bold">Pages</p><div className="mt-2 flex flex-wrap gap-2">{[["all","All pages"],["range","Range"],["selected","Selected"]].map(([id,label])=><button key={id} type="button" onClick={()=>{setPageMode(id);setImages([])}} className={pageMode===id?"mz-btn-primary":"mz-btn-secondary"}>{label}</button>)}</div></div>
      {pageMode === "range" ? <label className="block max-w-md text-sm font-semibold">Page range<input value={rangeInput} onChange={(e)=>{setRangeInput(e.target.value);setImages([])}} className="mz-input mt-2" placeholder="1-3,5,8-10" /></label> : null}
      {pageMode === "selected" ? <PdfPagePicker file={source.file} selectedPages={selectedPages} onToggle={togglePage} /> : null}
      <fieldset><legend className="text-sm font-bold">Output resolution</legend><div className="mt-2 grid gap-3 sm:grid-cols-3">{Object.entries(RESOLUTIONS).map(([id,item])=><label key={id} className={`cursor-pointer rounded-xl border p-3 ${resolution===id?"border-brand-500 bg-brand-50 dark:bg-brand-950/30":"border-navy-200 dark:border-navy-700"}`}><input type="radio" name={`pdf-${extension}-resolution`} checked={resolution===id} onChange={()=>{setResolution(id);setImages([])}} className="mr-2"/><strong className="text-sm">{item.label} · {item.dpi} DPI</strong><span className="mt-1 block text-xs text-navy-500">{item.help}</span></label>)}</div></fieldset>
    </div> : null}
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" className="mz-btn-primary" onClick={convert} disabled={!source||busy}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:null}{busy?"Rendering pages…":`Convert to ${extension.toUpperCase()}`}</button>{source?<button type="button" className="mz-btn-secondary" onClick={reset}>Reset</button>:null}</div>
    {busy && progress.total ? <div className="mt-4"><ProgressBar current={progress.current} total={progress.total} label={`Rendering ${progress.current} of ${progress.total}`} /></div> : null}
    <div className="mt-4"><ErrorMessage message={error}/></div>
    {images.length ? <section className="mt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-sm">{images.length} image{images.length===1?"":"s"} ready</strong><p className="mt-1 text-xs text-navy-500">Exported from the PDF source at {RESOLUTIONS[resolution].dpi} DPI, not from thumbnails.</p></div>{images.length>1?<button type="button" className="mz-btn-primary" onClick={downloadZip}><PackageOpen className="h-4 w-4"/> Download ZIP</button>:null}</div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{images.map((image)=><Preview key={image.pageNumber} image={image} filename={source.name} extension={extension}/>)}</div></section> : null}
  </div>;
}
