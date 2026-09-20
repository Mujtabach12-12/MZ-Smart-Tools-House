import { useState } from "react";
import { Loader2 } from "lucide-react";
import { compressImage } from "../../lib/image/process";
import { browserImageDeps } from "../../lib/image/canvas";
import { assertSupportedImage, formatKeyFromMime, getFormat } from "../../lib/image/core";
import { parseTargetKb, qualityAppliesTo, suggestQualityForSize } from "../../lib/image/compress";
import { parseDimension } from "../../lib/image/core";
import FileDropzone from "../../components/tools/FileDropzone";
import ImagePreview from "../../components/tools/ImagePreview";
import ImageResult from "../../components/tools/ImageResult";
import QualitySlider from "../../components/tools/QualitySlider";
import Field from "../../components/tools/Field";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("quality");
  const [quality, setQuality] = useState(80);
  const [targetKb, setTargetKb] = useState("200");
  const [outputFormat, setOutputFormat] = useState("auto");
  const [limitSize, setLimitSize] = useState(false);
  const [maxSide, setMaxSide] = useState("1920");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const sourceFormat = file ? formatKeyFromMime(file.type) : "jpeg";
  const effectiveFormat = outputFormat === "auto" ? sourceFormat : outputFormat;
  const lossy = qualityAppliesTo(effectiveFormat);

  function handleFiles([selected]) {
    setError("");
    setResult(null);
    try {
      assertSupportedImage(selected, ACCEPTED);
      setFile(selected);
      setQuality(Math.round(suggestQualityForSize(selected.size) * 100));
    } catch (err) {
      setFile(null);
      setError(err.message);
    }
  }

  async function handleCompress() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setResult(null);
    try {
      const options = {
        mode,
        format: outputFormat === "auto" ? undefined : outputFormat,
      };

      if (mode === "target") {
        options.targetBytes = parseTargetKb(targetKb);
      } else {
        options.quality = quality / 100;
      }

      if (limitSize) {
        options.maxSide = parseDimension(maxSide, "Maximum side");
      }

      const output = await compressImage(file, options, browserImageDeps);
      setResult(output);
    } catch (err) {
      setError(err.message || "Something went wrong while compressing this image.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError("");
    setMode("quality");
    setQuality(80);
    setTargetKb("200");
    setOutputFormat("auto");
    setLimitSize(false);
    setMaxSide("1920");
  }

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone
          accept={ACCEPTED.join(",")}
          onFiles={handleFiles}
          label="Drop a JPG, PNG or WebP image here to compress"
        />
      ) : (
        <ImagePreview file={file} onRemove={handleReset} />
      )}

      {file && (
        <div className="mt-6 space-y-5">
          <Field label="Compression mode">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("quality")}
                className={mode === "quality" ? "mz-btn-primary" : "mz-btn-secondary"}
              >
                Choose quality
              </button>
              <button
                type="button"
                onClick={() => setMode("target")}
                className={mode === "target" ? "mz-btn-primary" : "mz-btn-secondary"}
              >
                Target a file size
              </button>
            </div>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            {mode === "quality" ? (
              lossy ? (
                <QualitySlider value={quality} onChange={setQuality} id="compress-quality" />
              ) : (
                <p className="text-sm text-navy-500 dark:text-navy-400">
                  PNG is lossless, so it has no quality setting. To make a PNG meaningfully smaller,
                  either reduce its dimensions below or switch the output format to JPG or WebP.
                </p>
              )
            ) : (
              <Field
                label="Target size (KB)"
                htmlFor="target-kb"
                hint="We search for the highest quality that still fits under this size."
              >
                <input
                  id="target-kb"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={targetKb}
                  onChange={(e) => setTargetKb(e.target.value)}
                  className="mz-input"
                />
              </Field>
            )}

            <Field label="Output format" htmlFor="compress-format">
              <select
                id="compress-format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="mz-input"
              >
                <option value="auto">Keep original ({getFormat(sourceFormat).label})</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP (smallest)</option>
                <option value="png">PNG (lossless)</option>
              </select>
            </Field>
          </div>

          <div className="rounded-xl border border-navy-100 p-4 dark:border-navy-800">
            <label className="flex items-center gap-2 text-sm font-medium text-navy-700 dark:text-navy-200">
              <input
                type="checkbox"
                checked={limitSize}
                onChange={(e) => setLimitSize(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Also shrink the dimensions
            </label>
            {limitSize && (
              <div className="mt-3 max-w-xs">
                <Field
                  label="Longest side (px)"
                  htmlFor="max-side"
                  hint="The aspect ratio is always preserved. This is the single biggest win for phone photos."
                >
                  <input
                    id="max-side"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={maxSide}
                    onChange={(e) => setMaxSide(e.target.value)}
                    className="mz-input"
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCompress}
          disabled={!file || isProcessing}
          className="mz-btn-primary"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Compressing..." : "Compress Image"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <ErrorMessage message={error} />
        <ImageResult result={result}>
          {result && mode === "target" && !result.hitTarget && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Even at the lowest quality this image wouldn't fit under {targetKb} KB. This is the
              smallest version we could produce at these dimensions — tick "Also shrink the
              dimensions" to get below your target.
            </div>
          )}
          {result && result.percentSaved === 0 && !result.grew && (
            <p className="text-sm text-navy-500 dark:text-navy-400">
              This image was already well optimised, so there was little left to save.
            </p>
          )}
        </ImageResult>
      </div>

      <ToolExtras
        toolId="image-compressor"
        category="image-tools"
        showPrivacyNote
        howTo={[
          "Drop a JPG, PNG or WebP image onto the box above, or click to browse.",
          "Either drag the quality slider or type the file size you need in KB.",
          "Optionally shrink the dimensions too — this is the biggest saving for phone photos.",
          "Click Compress Image, compare the before/after sizes, then download.",
        ]}
        faq={[
          { q: "How small can I make my image?", a: "It depends on the photo. Lowering quality alone often saves 40–80%; combining it with a smaller pixel size can save well over 95%. If a target size can't be reached, the tool tells you instead of silently missing it." },
          { q: "Why can't I compress a PNG with the quality slider?", a: "PNG is a lossless format — there is no quality value to trade away, and your browser ignores one if given. To shrink a PNG, reduce its dimensions or convert it to JPG or WebP." },
          { q: "Does compressing reduce image quality?", a: "Lossy compression always discards some detail, but between 80% and 90% quality the difference is usually invisible on screen. Compare the preview against your original before downloading." },
          { q: "Is my image uploaded to a server?", a: "No. Compression runs entirely in your browser with the Canvas API — the file never leaves your device, and nothing is stored." },
          { q: "Will EXIF data like location be kept?", a: "No. Re-encoding through the browser strips EXIF metadata, including GPS coordinates and camera details. That's usually a privacy win, but keep your original if you need that data." },
        ]}
      />
    </div>
  );
}
