import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { imagesToPdf } from "../../lib/pdf/imageToPdf";
import { fileToUint8Array } from "../../lib/download";
import { assertFileSignature } from "../../lib/files/signatures.js";
import { buildValidatedPdfArtifact } from "../../lib/pdf/toolkit.js";
import { formatBytes } from "../../lib/pdf/core.js";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ErrorMessage from "../../components/tools/ErrorMessage";
import PdfStepIndicator from "../../components/tools/pdf/PdfStepIndicator.jsx";
import PdfResultPanel from "../../components/tools/pdf/PdfResultPanel.jsx";

const MARGINS = { none: 0, small: 18, normal: 36 };

export default function JpgToPdf() {
  const [files, setFiles] = useState([]);
  const [pageSize, setPageSize] = useState("auto");
  const [orientation, setOrientation] = useState("auto");
  const [margin, setMargin] = useState("small");
  const [fit, setFit] = useState("contain");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [artifact, setArtifact] = useState(null);

  async function handleFiles(newFiles) {
    setError(""); setArtifact(null);
    try {
      const next = [];
      for (const file of newFiles || []) {
        const mime = await assertFileSignature(file, ["image/jpeg", "image/png"]);
        next.push({ id: crypto.randomUUID(), file, mime });
      }
      setFiles((prev) => [...prev, ...next]);
    } catch (e) { setError(e.message || "Please choose valid JPG or PNG images."); }
  }

  function removeFile(id) { setFiles((prev) => prev.filter((item) => item.id !== id)); setArtifact(null); }
  function move(index, direction) {
    setFiles((prev) => { const next=[...prev]; const target=index+direction; if(target<0||target>=next.length)return prev; [next[index],next[target]]=[next[target],next[index]]; return next; });
    setArtifact(null);
  }
  function reset() { setFiles([]); setPageSize("auto"); setOrientation("auto"); setMargin("small"); setFit("contain"); setArtifact(null); setError(""); }

  async function convert() {
    if (!files.length) return setError("Add at least one JPG or PNG image.");
    setBusy(true); setError(""); setArtifact(null);
    try {
      const images = await Promise.all(files.map(async (item) => ({ bytes: await fileToUint8Array(item.file), type: item.mime })));
      const pdfBytes = await imagesToPdf(images, { pageSize, orientation, margin: pageSize === "auto" ? 0 : MARGINS[margin], fit });
      const output = await buildValidatedPdfArtifact(pdfBytes, {
        sourceName: files[0].file.name.replace(/\.[^.]+$/, ".pdf"),
        suffix: "images",
        expectedPageCount: files.length,
        metadata: { pageSize, orientation, margin, fit, sourceImages: files.length },
      });
      setArtifact(output);
    } catch (e) { setError(e.message || "The images could not be converted to PDF."); }
    finally { setBusy(false); }
  }

  const step = artifact ? 4 : busy ? 3 : files.length ? 2 : 1;
  return <div className="mz-card p-4 sm:p-6">
    <PdfStepIndicator current={step} steps={["Select", "Arrange", "Generate", "Download"]}/>
    <FileDropzone accept="image/jpeg,image/png" multiple onFiles={handleFiles} label={files.length ? "Add more JPG or PNG images" : "Choose JPG or PNG images"}/>
    {files.length ? <div className="mt-4 space-y-2">{files.map((item,index)=><div key={item.id} className="flex items-center gap-2"><div className="min-w-0 flex-1"><FileListItem name={item.file.name} size={item.file.size} onRemove={()=>removeFile(item.id)}/></div><div className="flex shrink-0 gap-1"><button type="button" className="mz-pdf-toolbar-button" onClick={()=>move(index,-1)} disabled={index===0} aria-label={`Move ${item.file.name} earlier`}><ArrowUp/></button><button type="button" className="mz-pdf-toolbar-button" onClick={()=>move(index,1)} disabled={index===files.length-1} aria-label={`Move ${item.file.name} later`}><ArrowDown/></button></div></div>)}</div> : null}
    {files.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-semibold">Paper<select className="mz-input mt-2" value={pageSize} onChange={(e)=>{setPageSize(e.target.value);setArtifact(null)}}><option value="auto">Auto (image size)</option><option value="a4">A4</option><option value="letter">Letter</option><option value="a5">A5</option></select></label>
      <label className="text-sm font-semibold">Orientation<select className="mz-input mt-2" value={orientation} onChange={(e)=>{setOrientation(e.target.value);setArtifact(null)}} disabled={pageSize==="auto"}><option value="auto">Auto</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
      <label className="text-sm font-semibold">Margins<select className="mz-input mt-2" value={margin} onChange={(e)=>{setMargin(e.target.value);setArtifact(null)}} disabled={pageSize==="auto"}><option value="none">None</option><option value="small">Small</option><option value="normal">Normal</option></select></label>
      <label className="text-sm font-semibold">Image fit<select className="mz-input mt-2" value={fit} onChange={(e)=>{setFit(e.target.value);setArtifact(null)}} disabled={pageSize==="auto"}><option value="contain">Contain (no crop)</option><option value="fill">Fill page (may crop edges)</option></select></label>
    </div> : null}
    {fit==="fill"&&pageSize!=="auto"?<p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">Fill keeps the image aspect ratio but may crop edges that extend beyond the selected paper size.</p>:null}
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" className="mz-btn-primary" onClick={convert} disabled={!files.length||busy}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:null}{busy?"Generating PDF…":"Generate PDF"}</button>{files.length?<button type="button" className="mz-btn-secondary" onClick={reset}>Reset</button>:null}</div>
    <div className="mt-4"><ErrorMessage message={error}/></div>
    <PdfResultPanel artifact={artifact} title="Image PDF ready" stats={artifact?[["Output",artifact.filename],["Pages",String(artifact.pageCount)],["Images",String(files.length)],["Size",formatBytes(artifact.data.byteLength)]]:[]} onReset={reset} note="The final PDF uses the original image bytes for JPG/PNG embedding; preview sizing is not used as the export source."/>
  </div>;
}
