import { useState } from "react";
import { Loader2, RotateCcw, RotateCw } from "lucide-react";
import { rotatePdf } from "../../lib/pdf/rotate";
import { inspectPdfFile, buildValidatedPdfArtifact, selectedPagesToRangeInput } from "../../lib/pdf/toolkit.js";
import { formatBytes } from "../../lib/pdf/core.js";
import FileDropzone from "../../components/tools/FileDropzone";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfFileSummary from "../../components/tools/pdf/PdfFileSummary.jsx";
import PdfStepIndicator from "../../components/tools/pdf/PdfStepIndicator.jsx";
import PdfPagePicker from "../../components/tools/pdf/PdfPagePicker.jsx";
import PdfResultPanel from "../../components/tools/pdf/PdfResultPanel.jsx";

export default function RotatePdf() {
  const [source, setSource] = useState(null);
  const [angle, setAngle] = useState(90);
  const [scope, setScope] = useState("all");
  const [selectedPages, setSelectedPages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [artifact, setArtifact] = useState(null);

  async function handleFiles([file]) {
    setError(""); setArtifact(null); setSelectedPages([]);
    if (!file) return;
    try { setSource(await inspectPdfFile(file)); }
    catch (e) { setSource(null); setError(e.message || "Could not open this PDF."); }
  }
  function reset() { setSource(null); setAngle(90); setScope("all"); setSelectedPages([]); setArtifact(null); setError(""); }
  function togglePage(page) { setSelectedPages((prev) => prev.includes(page) ? prev.filter((n)=>n!==page) : [...prev,page].sort((a,b)=>a-b)); setArtifact(null); }

  async function run() {
    if (!source) return;
    setBusy(true); setError(""); setArtifact(null);
    try {
      const pagesInput = scope === "all" ? "all" : selectedPagesToRangeInput(selectedPages);
      if (scope === "selected" && !pagesInput) throw new Error("Select at least one page to rotate.");
      const bytes = await rotatePdf(source.bytes, angle, pagesInput);
      const output = await buildValidatedPdfArtifact(bytes, { sourceName: source.name, suffix: "rotated", expectedPageCount: source.pageCount, metadata: { structural: true, rasterized: false, angle, pages: pagesInput } });
      setArtifact(output);
    } catch (e) { setError(e.message || "The PDF could not be rotated."); }
    finally { setBusy(false); }
  }

  const step = artifact ? 4 : busy ? 3 : source ? 2 : 1;
  return <div className="mz-card p-4 sm:p-6">
    <PdfStepIndicator current={step} steps={["Select", "Choose pages", "Rotate", "Download"]}/>
    {!source?<FileDropzone accept="application/pdf" onFiles={handleFiles} label="Choose a PDF to rotate"/>:<PdfFileSummary name={source.name} size={source.size} pageCount={source.pageCount} onRemove={reset}/>} 
    {source?<div className="mt-5 space-y-4">
      <div><p className="text-sm font-bold">Rotation</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" className={angle===-90?"mz-btn-primary":"mz-btn-secondary"} onClick={()=>{setAngle(-90);setArtifact(null)}}><RotateCcw className="h-4 w-4"/> Left 90°</button><button type="button" className={angle===90?"mz-btn-primary":"mz-btn-secondary"} onClick={()=>{setAngle(90);setArtifact(null)}}><RotateCw className="h-4 w-4"/> Right 90°</button><button type="button" className={angle===180?"mz-btn-primary":"mz-btn-secondary"} onClick={()=>{setAngle(180);setArtifact(null)}}>180°</button></div></div>
      <div><p className="text-sm font-bold">Pages</p><div className="mt-2 flex gap-2"><button type="button" className={scope==="all"?"mz-btn-primary":"mz-btn-secondary"} onClick={()=>{setScope("all");setArtifact(null)}}>All pages</button><button type="button" className={scope==="selected"?"mz-btn-primary":"mz-btn-secondary"} onClick={()=>{setScope("selected");setArtifact(null)}}>Selected pages</button></div></div>
      {scope==="selected"?<PdfPagePicker file={source.file} selectedPages={selectedPages} onToggle={togglePage}/>:null}
    </div>:null}
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" className="mz-btn-primary" onClick={run} disabled={!source||busy}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:null}{busy?"Rotating pages…":"Apply rotation"}</button>{source?<button type="button" className="mz-btn-secondary" onClick={reset}>Reset</button>:null}</div>
    <div className="mt-4"><ErrorMessage message={error}/></div>
    <PdfResultPanel artifact={artifact} title="Rotated PDF ready" stats={artifact?[["Output",artifact.filename],["Pages",String(artifact.pageCount)],["Rotation",`${angle>0?"+":""}${angle}°`],["Size",formatBytes(artifact.data.byteLength)]]:[]} onReset={reset} note="Rotation is stored structurally in the PDF. Pages are not converted to images."/>
  </div>;
}
