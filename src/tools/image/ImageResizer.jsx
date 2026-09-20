import { useState } from "react";
import { Loader2 } from "lucide-react";
import { resizeImage } from "../../lib/image/process";
import { browserImageDeps } from "../../lib/image/canvas";
import { assertSupportedImage, formatKeyFromMime, getFormat, parseDimension } from "../../lib/image/core";
import { resolveResizeDimensions, scaleByPercent, formatDimensions } from "../../lib/image/dimensions";
import { qualityAppliesTo } from "../../lib/image/compress";
import FileDropzone from "../../components/tools/FileDropzone";
import ImagePreview from "../../components/tools/ImagePreview";
import ImageResult from "../../components/tools/ImageResult";
import QualitySlider from "../../components/tools/QualitySlider";
import Field from "../../components/tools/Field";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const PERCENT_PRESETS = [75, 50, 25];

export default function ImageResizer() {
  const [file, setFile] = useState(null);
  const [natural, setNatural] = useState(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockAspect, setLockAspect] = useState(true);
  const [outputFormat, setOutputFormat] = useState("auto");
  const [quality, setQuality] = useState(92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const sourceFormat = file ? formatKeyFromMime(file.type) : "jpeg";
  const effectiveFormat = outputFormat === "auto" ? sourceFormat : outputFormat;
  const lossy = qualityAppliesTo(effectiveFormat);

  function handleFiles([selected]) {
    setError("");
    setResult(null);
    setNatural(null);
    setWidth("");
    setHeight("");
    try {
      assertSupportedImage(selected, ACCEPTED);
      setFile(selected);
    } catch (err) {
      setFile(null);
      setError(err.message);
    }
  }

  function handleLoaded(dimensions) {
    setNatural(dimensions);
    setWidth(String(dimensions.width));
    setHeight(String(dimensions.height));
  }

  /** Keeps the paired field in step while the aspect lock is on. */
  function handleWidthChange(value) {
    setWidth(value);
    if (!lockAspect || !natural) return;
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) {
      setHeight(String(Math.max(1, Math.round(num / (natural.width / natural.height)))));
    }
  }

  function handleHeightChange(value) {
    setHeight(value);
    if (!lockAspect || !natural) return;
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) {
      setWidth(String(Math.max(1, Math.round(num * (natural.width / natural.height)))));
    }
  }

  function applyPercent(percent) {
    if (!natural) return;
    try {
      const scaled = scaleByPercent(natural.width, natural.height, percent);
      setWidth(String(scaled.width));
      setHeight(String(scaled.height));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  // Live preview of the size the user will actually get.
  let projected = null;
  if (natural && width && height) {
    try {
      projected = resolveResizeDimensions({
        naturalWidth: natural.width,
        naturalHeight: natural.height,
        width: Number(width),
        height: Number(height),
        lockAspect,
      });
    } catch {
      projected = null;
    }
  }

  async function handleResize() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setResult(null);
    try {
      const targetWidth = parseDimension(width, "Width");
      const targetHeight = parseDimension(height, "Height");
      const output = await resizeImage(
        file,
        {
          width: targetWidth,
          height: targetHeight,
          lockAspect,
          format: outputFormat === "auto" ? undefined : outputFormat,
          quality: quality / 100,
        },
        browserImageDeps
      );
      setResult(output);
    } catch (err) {
      setError(err.message || "Something went wrong while resizing this image.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setNatural(null);
    setWidth("");
    setHeight("");
    setLockAspect(true);
    setOutputFormat("auto");
    setQuality(92);
    setResult(null);
    setError("");
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone
          accept={ACCEPTED.join(",")}
          onFiles={handleFiles}
          label="Drop a JPG, PNG or WebP image here to resize"
        />
      ) : (
        <ImagePreview file={file} onRemove={handleReset} onLoad={handleLoaded} />
      )}

      {file && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Width (px)" htmlFor="resize-width">
              <input
                id="resize-width"
                type="number"
                min="1"
                inputMode="numeric"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="mz-input"
              />
            </Field>
            <Field label="Height (px)" htmlFor="resize-height">
              <input
                id="resize-height"
                type="number"
                min="1"
                inputMode="numeric"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="mz-input"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-navy-700 dark:text-navy-200">
            <input
              type="checkbox"
              checked={lockAspect}
              onChange={(e) => setLockAspect(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            Keep aspect ratio (no stretching)
          </label>

          {natural && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-navy-500 dark:text-navy-400">Quick scale:</span>
              {PERCENT_PRESETS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyPercent(pct)}
                  className="rounded-lg border border-navy-200 px-3 py-1 text-sm text-navy-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-navy-700 dark:text-navy-300"
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyPercent(100)}
                className="rounded-lg border border-navy-200 px-3 py-1 text-sm text-navy-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-navy-700 dark:text-navy-300"
              >
                Original
              </button>
            </div>
          )}

          {projected && natural && (
            <p className="text-sm text-navy-500 dark:text-navy-400">
              {formatDimensions(natural.width, natural.height)} px →{" "}
              <span className="font-semibold text-brand-700 dark:text-brand-300">
                {formatDimensions(projected.width, projected.height)} px
              </span>
              {lockAspect &&
                (projected.width !== Number(width) || projected.height !== Number(height)) &&
                " (fitted inside your box to keep the aspect ratio)"}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Output format" htmlFor="resize-format">
              <select
                id="resize-format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="mz-input"
              >
                <option value="auto">Keep original ({getFormat(sourceFormat).label})</option>
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </Field>
            {lossy && <QualitySlider value={quality} onChange={setQuality} id="resize-quality" />}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleResize}
          disabled={!file || isProcessing}
          className="mz-btn-primary"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Resizing..." : "Resize Image"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <ErrorMessage message={error} />
        <ImageResult result={result} />
      </div>

      <ToolExtras
        toolId="image-resizer"
        category="image-tools"
        showPrivacyNote
        howTo={[
          "Drop an image onto the box above, or click to browse.",
          "Type the width or height you need — with the aspect-ratio lock on, the other side follows automatically.",
          "Or use the quick 75% / 50% / 25% buttons to scale down.",
          "Click Resize Image and download the result.",
        ]}
        faq={[
          { q: "How do I resize without stretching the image?", a: "Leave \"Keep aspect ratio\" ticked. Set one side and the other is calculated for you; if you set both, the image is fitted inside that box rather than squashed to fill it." },
          { q: "Can I make an image larger?", a: "Yes, but enlarging can't invent detail that isn't there, so the result will look softer. Upscaling beyond about 200% rarely looks good." },
          { q: "What's the maximum size I can use?", a: "Up to 10,000 pixels on each side. Browsers impose their own canvas limits above this, so the tool stops before you hit an unhelpful error." },
          { q: "Does resizing reduce the file size too?", a: "Almost always, and often dramatically — halving both dimensions removes about 75% of the pixels. The before/after sizes are shown with your result." },
          { q: "Are my images uploaded anywhere?", a: "No. Resizing happens entirely in your browser; the file never leaves your device." },
        ]}
      />
    </div>
  );
}
