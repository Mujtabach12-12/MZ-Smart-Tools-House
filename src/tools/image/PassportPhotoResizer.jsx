import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createPassportPhoto } from "../../lib/image/process";
import { browserImageDeps } from "../../lib/image/canvas";
import { assertSupportedImage } from "../../lib/image/core";
import { PASSPORT_PRESETS, DPI_OPTIONS, DEFAULT_DPI, presetPixelSize, checkSourceResolution } from "../../lib/image/passport";
import FileDropzone from "../../components/tools/FileDropzone";
import ImagePreview from "../../components/tools/ImagePreview";
import ImageResult from "../../components/tools/ImageResult";
import QualitySlider from "../../components/tools/QualitySlider";
import Field from "../../components/tools/Field";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function PassportPhotoResizer() {
  const [file, setFile] = useState(null);
  const [natural, setNatural] = useState(null);
  const [presetId, setPresetId] = useState(PASSPORT_PRESETS[0].id);
  const [dpi, setDpi] = useState(DEFAULT_DPI);
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [quality, setQuality] = useState(92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  let target = null;
  try {
    target = presetPixelSize(presetId, dpi);
  } catch {
    target = null;
  }

  const resolutionCheck =
    natural && target
      ? checkSourceResolution(natural.width, natural.height, target.width, target.height)
      : null;

  function handleFiles([selected]) {
    setError("");
    setResult(null);
    setNatural(null);
    try {
      assertSupportedImage(selected, ACCEPTED);
      setFile(selected);
    } catch (err) {
      setFile(null);
      setError(err.message);
    }
  }

  async function handleCreate() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setResult(null);
    try {
      const output = await createPassportPhoto(
        file,
        { presetId, dpi, format: outputFormat, quality: quality / 100 },
        browserImageDeps
      );
      setResult(output);
    } catch (err) {
      setError(err.message || "Something went wrong while preparing your photo.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setNatural(null);
    setPresetId(PASSPORT_PRESETS[0].id);
    setDpi(DEFAULT_DPI);
    setOutputFormat("jpeg");
    setQuality(92);
    setResult(null);
    setError("");
  }

  return (
    <div className="mz-card p-6">
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        This tool resizes and crops your photo to the correct printed dimensions. It does not check
        biometric requirements — head size and position, background colour, lighting, expression and
        glasses rules are set by the issuing authority, and you should check their current guidance
        before submitting.
      </div>

      {!file ? (
        <FileDropzone
          accept={ACCEPTED.join(",")}
          onFiles={handleFiles}
          label="Drop your photo here — JPG, PNG or WebP"
        />
      ) : (
        <ImagePreview file={file} onRemove={handleReset} onLoad={setNatural} label="Source photo" />
      )}

      {file && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Photo size" htmlFor="passport-preset">
              <select
                id="passport-preset"
                value={presetId}
                onChange={(e) => { setPresetId(e.target.value); setResult(null); }}
                className="mz-input"
              >
                {PASSPORT_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Print resolution (DPI)"
              htmlFor="passport-dpi"
              hint="300 DPI is the standard for photo printing."
            >
              <select
                id="passport-dpi"
                value={dpi}
                onChange={(e) => { setDpi(Number(e.target.value)); setResult(null); }}
                className="mz-input"
              >
                {DPI_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} DPI
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {target && (
            <p className="text-sm text-navy-500 dark:text-navy-400">
              Output will be{" "}
              <span className="font-semibold text-brand-700 dark:text-brand-300">
                {target.width} × {target.height} px
              </span>{" "}
              ({target.preset.widthMm} × {target.preset.heightMm} mm at {dpi} DPI). Your photo is
              centre-cropped to that shape first, so nothing is stretched.
            </p>
          )}

          {resolutionCheck?.tooSmall && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {resolutionCheck.message}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Output format" htmlFor="passport-format">
              <select
                id="passport-format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="mz-input"
              >
                <option value="jpeg">JPG (accepted almost everywhere)</option>
                <option value="png">PNG</option>
              </select>
            </Field>
            {outputFormat === "jpeg" && (
              <QualitySlider value={quality} onChange={setQuality} id="passport-quality" />
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!file || isProcessing}
          className="mz-btn-primary"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Preparing..." : "Create Passport Photo"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <ErrorMessage message={error} />
        <ImageResult result={result}>
          {result?.resolutionWarning && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {result.resolutionWarning}
            </div>
          )}
        </ImageResult>
      </div>

      <ToolExtras
        toolId="passport-photo-resizer"
        category="image-tools"
        showPrivacyNote
        howTo={[
          "Drop your photo onto the box above, or click to browse.",
          "Pick the document size you need — 35 × 45 mm covers most countries.",
          "Leave the resolution at 300 DPI unless your photo lab asks for more.",
          "Click Create Passport Photo, check the preview, then download.",
        ]}
        faq={[
          { q: "What size should a passport photo be?", a: "35 × 45 mm is the standard for most countries including the UK, Schengen states, Pakistan and Australia. US passport and visa photos are 2 × 2 inches (51 × 51 mm), and India uses 35 × 35 mm. All of these are in the size list." },
          { q: "How is my photo cropped?", a: "It's cropped from the centre to the exact aspect ratio of the size you chose, then scaled to the right pixel dimensions. Nothing is stretched or squashed. If your face isn't centred in the original, crop it first with the Image Cropper." },
          { q: "Does this check whether my photo meets passport rules?", a: "No, and no browser tool honestly can. Head height, eye position, background colour, shadows, expression and glasses are judged by the issuing authority. This tool guarantees the dimensions are right — the rest is up to you and their published guidance." },
          { q: "Can it remove or whiten the background?", a: "Not in this version. Reliable background removal needs a machine-learning model, and a naive colour-based cut-out would ruin photos with hair or similar-coloured clothing. Take your photo against a plain, evenly lit wall instead." },
          { q: "Why does it say my photo will be enlarged?", a: "Your photo has fewer pixels than the chosen print size needs, so it has to be scaled up, which looks soft when printed. Use a higher-resolution photo — most phone cameras are more than good enough." },
          { q: "Is my photo uploaded anywhere?", a: "No. Everything happens inside your browser, and your photo is never sent to or stored on any server." },
        ]}
      />
    </div>
  );
}
