import { useState } from "react";
import { Loader2 } from "lucide-react";
import { parsePageRanges, formatBytes } from "../../lib/pdf/core.js";
import { inspectPdfFile, buildValidatedPdfArtifact, selectedPagesToRangeInput } from "../../lib/pdf/toolkit.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfFileSummary from "../../components/tools/pdf/PdfFileSummary.jsx";
import PdfPagePicker from "../../components/tools/pdf/PdfPagePicker.jsx";
import PdfStepIndicator from "../../components/tools/pdf/PdfStepIndicator.jsx";
import PdfResultPanel from "../../components/tools/pdf/PdfResultPanel.jsx";

export default function PageSelectionToolBase({
  processFn, actionLabel, processingLabel, filenamePrefix, placeholder,
  mode = "extract",
}) {
  const [source, setSource] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [rangeInput, setRangeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [artifact, setArtifact] = useState(null);

  async function handleFiles([file]) {
    setError(""); setArtifact(null); setSelectedPages([]); setRangeInput("");
    if (!file) return;
    try { setSource(await inspectPdfFile(file)); }
    catch (e) { setSource(null); setError(e.message || "Could not open this PDF."); }
  }
  function reset() { setSource(null); setSelectedPages([]); setRangeInput(""); setArtifact(null); setError(""); }
  function togglePage(page) { setSelectedPages((prev)=>prev.includes(page)?prev.filter((n)=>n!==page):[...prev,page].sort((a,b)=>a-b)); setArtifact(null); }
  function applyRange() {
    if (!source) return;
    try { setSelectedPages(parsePageRanges(rangeInput, source.pageCount).map((index)=>index+1)); setError(""); setArtifact(null); }
    catch (e) { setError(e.message); }
  }

  async function run() {
    if (!source) return;
    setBusy(true); setError(""); setArtifact(null);
    try {
      if (!selectedPages.length) throw new Error(`Select at least one page to ${mode === "delete" ? "delete" : "extract"}.`);
      if (mode === "delete" && selectedPages.length >= source.pageCount) throw new Error("You cannot delete every page. At least one page must remain.");
      const selection = selectedPagesToRangeInput(selectedPages);
      const outBytes = await processFn(source.bytes, selection);
      const expectedPageCount = mode === "delete" ? source.pageCount - selectedPages.length : selectedPages.length;
      const output = await buildValidatedPdfArtifact(outBytes, { sourceName: source.name, suffix: filenamePrefix, expectedPageCount, metadata: { structural: true, selectedPages } });
      setArtifact(output);
    } catch (e) { setError(e.message || "The PDF could not be processed."); }
    finally { setBusy(false); }
  }

  const step = artifact ? 4 : busy ? 3 : source ? 2 : 1;
  const selectionSummary = selectedPages.length ? `${selectedPages.length} page${selectedPages.length===1?"":"s"} selected` : "No pages selected";
  return <div className="mz-card p-4 sm:p-6">
    <PdfStepIndicator current={step} steps={["Select", "Choose pages", mode === "delete" ? "Delete" : "Extract", "Download"]}/>
    {!source?<FileDropzone accept="application/pdf" onFiles={handleFiles} label={`Choose a PDF to ${mode === "delete" ? "remove pages from" : "extract pages from"}`}/>:<PdfFileSummary name={source.name} size={source.size} pageCount={source.pageCount} onRemove={reset}/>} 
    {source?<div className="mt-5 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold">Select by range<input className="mz-input mt-2" value={rangeInput} onChange={(e)=>setRangeInput(e.target.value)} placeholder={placeholder || "1-3,5"}/></label><button type="button" className="mz-btn-secondary" onClick={applyRange}>Apply range</button></div>
      <div className="flex items-center justify-between"><strong className="text-sm">{selectionSummary}</strong>{selectedPages.length?<button type="button" className="text-xs font-bold text-brand-600" onClick={()=>{setSelectedPages([]);setArtifact(null)}}>Clear selection</button>:null}</div>
      <PdfPagePicker file={source.file} selectedPages={selectedPages} onToggle={togglePage} selectedLabel={mode==="delete"?"DELETE":"EXTRACT"} unselectedLabel="KEEP"/>
      {mode==="delete"&&selectedPages.length?<p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">{selectedPages.length} page{selectedPages.length===1?"":"s"} will be removed. {source.pageCount-selectedPages.length} page{source.pageCount-selectedPages.length===1?"":"s"} will remain.</p>:null}
    </div>:null}
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" className="mz-btn-primary" onClick={run} disabled={!source||busy||!selectedPages.length}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:null}{busy?processingLabel:actionLabel}</button>{source?<button type="button" className="mz-btn-secondary" onClick={reset}>Reset</button>:null}</div>
    <div className="mt-4"><ErrorMessage message={error}/></div>
    <PdfResultPanel artifact={artifact} title={mode==="delete"?"Updated PDF ready":"Extracted PDF ready"} stats={artifact?[["Output",artifact.filename],["Pages",String(artifact.pageCount)],[mode==="delete"?"Removed":"Extracted",String(selectedPages.length)],["Size",formatBytes(artifact.data.byteLength)]]:[]} onReset={reset} note="Selected pages were copied/removed structurally; the remaining PDF content was not rasterized."/>
  </div>;
}
