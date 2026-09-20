import { useEffect, useState } from "react";
import { FlipHorizontal, FlipVertical, Loader2, RotateCcw, RotateCw } from "lucide-react";
import { rotateImage } from "../../lib/image/process";
import { browserImageDeps } from "../../lib/image/canvas";
import { assertSupportedImage, formatKeyFromMime, getFormat } from "../../lib/image/core";
import { addRotation, rotatedDimensions, isNoOpTransform } from "../../lib/image/rotate";
import { qualityAppliesTo } from "../../lib/image/compress";
import { formatDimensions } from "../../lib/image/dimensions";
import FileDropzone from "../../components/tools/FileDropzone";
import ImagePreview from "../../components/tools/ImagePreview";
import ImageResult from "../../components/tools/ImageResult";
import QualitySlider from "../../components/tools/QualitySlider";
import Field from "../../components/tools/Field";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ImageRotator() {
  const [file, setFile] = useState(null);
  const [natural, setNatural] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [outputFormat, setOutputFormat] = useState("auto");
  const [quality, setQuality] = useState(92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const sourceFormat = file ? formatKeyFromMime(file.type) : "jpeg";
  const effectiveFormat = outputFormat === "auto" ? sourceFormat : outputFormat;
  const lossy = qualityAppliesTo(effectiveFormat);
  const unchanged = isNoOpTransform(rotation, { flipHorizontal, flipVertical });

  const projected = natural ? rotatedDimensions(natural.width, natural.height, rotation) : null;

  function handleFiles([selected]) {
    setError("");
    setResult(null);
    setNatural(null);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    try {
      assertSupportedImage(selected, ACCEPTED);
      setFile(selected);
    } catch (err) {
      setFile(null);
      setError(err.message);
    }
  }

  function turn(delta) {
    setRotation((current) => addRotation(current, delta));
    setResult(null);
  }

  async function handleRotate() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setResult(null);
    try {
      const output = await rotateImage(
        file,
        {
          rotation,
          flipHorizontal,
          flipVertical,
          format: outputFormat === "auto" ? undefined : outputFormat,
          quality: quality / 100,
        },
        browserImageDeps
      );
      setResult(output);
    } catch (err) {
      setError(err.message || "Something went wrong while rotating this image.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setNatural(null);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setOutputFormat("auto");
    setQuality(92);
    setResult(null);
    setError("");
  }

  const previewTransform = `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`;

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone
          accept={ACCEPTED.join(",")}
          onFiles={handleFiles}
          label="Drop a JPG, PNG or WebP image here to rotate"
        />
      ) : (
        <ImagePreview file={file} onRemove={handleReset} onLoad={setNatural} />
      )}

      {file && (
        <div className="mt-6 space-y-5">
          <LivePreview file={file} transform={previewTransform} />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => turn(270)} className="mz-btn-secondary">
              <RotateCcw className="h-4 w-4" />
              Rotate left
            </button>
            <button type="button" onClick={() => turn(90)} className="mz-btn-secondary">
              <RotateCw className="h-4 w-4" />
              Rotate right
            </button>
            <button
              type="button"
              onClick={() => { setFlipHorizontal((v) => !v); setResult(null); }}
              className={flipHorizontal ? "mz-btn-primary" : "mz-btn-secondary"}
              aria-pressed={flipHorizontal}
            >
              <FlipHorizontal className="h-4 w-4" />
              Flip horizontal
            </button>
            <button
              type="button"
              onClick={() => { setFlipVertical((v) => !v); setResult(null); }}
              className={flipVertical ? "mz-btn-primary" : "mz-btn-secondary"}
              aria-pressed={flipVertical}
            >
              <FlipVertical className="h-4 w-4" />
              Flip vertical
            </button>
          </div>

          <p className="text-sm text-navy-500 dark:text-navy-400">
            Rotation: <span className="font-semibold">{rotation}°</span>
            {natural && projected && (
              <>
                {" "}· Output will be{" "}
                <span className="font-semibold text-brand-700 dark:text-brand-300">
                  {formatDimensions(projected.width, projected.height)} px
                </span>
              </>
            )}
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Output format" htmlFor="rotate-format">
              <select
                id="rotate-format"
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
            {lossy && <QualitySlider value={quality} onChange={setQuality} id="rotate-quality" />}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleRotate}
          disabled={!file || isProcessing}
          className="mz-btn-primary"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Applying..." : "Apply & Save"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">
          Reset
        </button>
      </div>

      {file && unchanged && (
        <p className="mt-3 text-sm text-navy-500 dark:text-navy-400">
          No rotation or flip selected yet — saving now would just re-encode the image unchanged.
        </p>
      )}

      <div className="mt-6 space-y-4">
        <ErrorMessage message={error} />
        <ImageResult result={result} />
      </div>

      <ToolExtras
        toolId="image-rotator"
        category="image-tools"
        showPrivacyNote
        howTo={[
          "Drop an image onto the box above, or click to browse.",
          "Use Rotate left / Rotate right to turn it in 90° steps, and the flip buttons to mirror it.",
          "Watch the live preview until it looks right.",
          "Click Apply & Save, then download the rotated image.",
        ]}
        faq={[
          { q: "Can I rotate by an arbitrary angle like 30°?", a: "Not in this tool. Free-angle rotation leaves empty corners that have to be filled or cropped, which produces surprising results; 90° steps and flips are lossless in shape and cover almost every real need — fixing a sideways phone photo or a scan." },
          { q: "Why does my photo already look rotated when I open it?", a: "Phone cameras store an EXIF orientation flag rather than rotating the pixels. This tool reads that flag and shows the photo the right way up, then writes real rotated pixels so it looks correct everywhere." },
          { q: "Does rotating lose quality?", a: "The rotation itself is exact. Saving as JPG or WebP re-encodes the image, which loses a small amount of detail — choose PNG as the output format if you want a lossless save." },
          { q: "Does flipping change the file size?", a: "Barely. Mirroring doesn't change how much detail is in the image, so the file size stays roughly the same." },
          { q: "Is my photo uploaded?", a: "No. Everything runs in your browser and nothing is sent to a server." },
        ]}
      />
    </div>
  );
}

/** Small live preview that applies the transform with CSS — no canvas work until Apply. */
function LivePreview({ file, transform }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) return undefined;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  return (
    <div className="flex min-h-[16rem] items-center justify-center overflow-hidden rounded-2xl border border-navy-100 bg-navy-50 p-4 dark:border-navy-800 dark:bg-navy-900/60">
      <img
        src={url}
        alt="Rotation preview"
        style={{ transform }}
        className="max-h-56 max-w-full object-contain transition-transform duration-200"
      />
    </div>
  );
}
