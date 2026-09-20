import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cropImage } from "../../lib/image/process";
import { browserImageDeps } from "../../lib/image/canvas";
import { assertSupportedImage, formatKeyFromMime, getFormat } from "../../lib/image/core";
import { normalizeCropRect, centerCropRect, fullImageRect, applyAspectToRect } from "../../lib/image/crop";
import { qualityAppliesTo } from "../../lib/image/compress";
import FileDropzone from "../../components/tools/FileDropzone";
import ImageResult from "../../components/tools/ImageResult";
import QualitySlider from "../../components/tools/QualitySlider";
import Field from "../../components/tools/Field";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const ASPECT_PRESETS = [
  { id: "free", label: "Free", ratio: null },
  { id: "1-1", label: "1:1", ratio: 1 },
  { id: "4-3", label: "4:3", ratio: 4 / 3 },
  { id: "3-4", label: "3:4", ratio: 3 / 4 },
  { id: "16-9", label: "16:9", ratio: 16 / 9 },
  { id: "3-2", label: "3:2", ratio: 3 / 2 },
];

export default function ImageCropper() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [natural, setNatural] = useState(null);
  const [rect, setRect] = useState(null);
  const [aspect, setAspect] = useState("free");
  const [outputFormat, setOutputFormat] = useState("auto");
  const [quality, setQuality] = useState(92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const imageRef = useRef(null);
  const dragRef = useRef(null);

  const sourceFormat = file ? formatKeyFromMime(file.type) : "jpeg";
  const effectiveFormat = outputFormat === "auto" ? sourceFormat : outputFormat;
  const lossy = qualityAppliesTo(effectiveFormat);

  useEffect(() => {
    if (!file) return undefined;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function handleFiles([selected]) {
    setError("");
    setResult(null);
    setNatural(null);
    setRect(null);
    setAspect("free");
    try {
      assertSupportedImage(selected, ACCEPTED);
      setFile(selected);
    } catch (err) {
      setFile(null);
      setError(err.message);
    }
  }

  function handleImageLoad(e) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNatural({ width: naturalWidth, height: naturalHeight });
    setRect(fullImageRect(naturalWidth, naturalHeight));
  }

  /** Converts a pointer position into source-image pixel coordinates. */
  const toImagePoint = useCallback(
    (clientX, clientY) => {
      const el = imageRef.current;
      if (!el || !natural) return null;
      const bounds = el.getBoundingClientRect();
      const scaleX = natural.width / bounds.width;
      const scaleY = natural.height / bounds.height;
      return {
        x: Math.min(Math.max(0, (clientX - bounds.left) * scaleX), natural.width),
        y: Math.min(Math.max(0, (clientY - bounds.top) * scaleY), natural.height),
      };
    },
    [natural]
  );

  function startDrag(e) {
    if (!natural) return;
    const point = toImagePoint(e.clientX, e.clientY);
    if (!point) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = point;
    setResult(null);
    setError("");
  }

  function moveDrag(e) {
    const origin = dragRef.current;
    if (!origin || !natural) return;
    const point = toImagePoint(e.clientX, e.clientY);
    if (!point) return;

    const draft = {
      x: Math.min(origin.x, point.x),
      y: Math.min(origin.y, point.y),
      width: Math.abs(point.x - origin.x),
      height: Math.abs(point.y - origin.y),
    };

    if (draft.width < 2 || draft.height < 2) return;

    try {
      const preset = ASPECT_PRESETS.find((p) => p.id === aspect);
      const next = preset?.ratio
        ? applyAspectToRect(draft, preset.ratio, natural.width, natural.height)
        : normalizeCropRect(draft, natural.width, natural.height);
      setRect(next);
    } catch {
      // Mid-drag rectangles can momentarily be invalid; ignore and keep the last good one.
    }
  }

  function endDrag(e) {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function chooseAspect(presetId) {
    setAspect(presetId);
    setResult(null);
    if (!natural) return;
    const preset = ASPECT_PRESETS.find((p) => p.id === presetId);
    if (!preset?.ratio) return;
    try {
      setRect(centerCropRect(natural.width, natural.height, preset.ratio));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function updateRectField(key, value) {
    if (!natural || !rect) return;
    const draft = { ...rect, [key]: Number(value) };
    setResult(null);
    try {
      setRect(normalizeCropRect(draft, natural.width, natural.height));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function selectAll() {
    if (!natural) return;
    setAspect("free");
    setRect(fullImageRect(natural.width, natural.height));
    setResult(null);
    setError("");
  }

  async function handleCrop() {
    if (!file || !rect) return;
    setIsProcessing(true);
    setError("");
    setResult(null);
    try {
      const output = await cropImage(
        file,
        {
          crop: rect,
          format: outputFormat === "auto" ? undefined : outputFormat,
          quality: quality / 100,
        },
        browserImageDeps
      );
      setResult(output);
    } catch (err) {
      setError(err.message || "Something went wrong while cropping this image.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setUrl("");
    setNatural(null);
    setRect(null);
    setAspect("free");
    setOutputFormat("auto");
    setQuality(92);
    setResult(null);
    setError("");
  }

  // Overlay position as percentages so it scales with the responsive image.
  const overlayStyle =
    rect && natural
      ? {
          left: `${(rect.x / natural.width) * 100}%`,
          top: `${(rect.y / natural.height) * 100}%`,
          width: `${(rect.width / natural.width) * 100}%`,
          height: `${(rect.height / natural.height) * 100}%`,
        }
      : null;

  return (
    <div className="mz-card p-6">
      {!file ? (
        <FileDropzone
          accept={ACCEPTED.join(",")}
          onFiles={handleFiles}
          label="Drop a JPG, PNG or WebP image here to crop"
        />
      ) : (
        <div className="space-y-5">
          <div className="relative mx-auto w-fit max-w-full touch-none select-none overflow-hidden rounded-2xl border border-navy-100 bg-navy-50 dark:border-navy-800 dark:bg-navy-900/60">
            <img
              ref={imageRef}
              src={url}
              alt="Crop source"
              onLoad={handleImageLoad}
              onError={() => setError("This image could not be opened. It may be corrupted or in a format your browser can't read.")}
              draggable={false}
              className="block max-h-[28rem] max-w-full object-contain"
            />
            {overlayStyle && (
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute border-2 border-brand-500 bg-brand-500/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"
                  style={overlayStyle}
                />
              </div>
            )}
            <div
              className="absolute inset-0 cursor-crosshair"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              role="presentation"
            />
          </div>

          <p className="text-center text-sm text-navy-500 dark:text-navy-400">
            Drag on the image to select the area you want to keep, or type exact values below.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-navy-500 dark:text-navy-400">Aspect ratio:</span>
            {ASPECT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => chooseAspect(preset.id)}
                className={`rounded-lg border px-3 py-1 text-sm transition ${
                  aspect === preset.id
                    ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    : "border-navy-200 text-navy-600 hover:border-brand-300 dark:border-navy-700 dark:text-navy-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button type="button" onClick={selectAll} className="rounded-lg border border-navy-200 px-3 py-1 text-sm text-navy-600 hover:border-brand-300 dark:border-navy-700 dark:text-navy-300">
              Select all
            </button>
          </div>

          {rect && (
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="X (px)" htmlFor="crop-x">
                <input id="crop-x" type="number" min="0" value={rect.x} onChange={(e) => updateRectField("x", e.target.value)} className="mz-input" />
              </Field>
              <Field label="Y (px)" htmlFor="crop-y">
                <input id="crop-y" type="number" min="0" value={rect.y} onChange={(e) => updateRectField("y", e.target.value)} className="mz-input" />
              </Field>
              <Field label="Width (px)" htmlFor="crop-w">
                <input id="crop-w" type="number" min="1" value={rect.width} onChange={(e) => updateRectField("width", e.target.value)} className="mz-input" />
              </Field>
              <Field label="Height (px)" htmlFor="crop-h">
                <input id="crop-h" type="number" min="1" value={rect.height} onChange={(e) => updateRectField("height", e.target.value)} className="mz-input" />
              </Field>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Output format" htmlFor="crop-format">
              <select id="crop-format" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="mz-input">
                <option value="auto">Keep original ({getFormat(sourceFormat).label})</option>
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </Field>
            {lossy && <QualitySlider value={quality} onChange={setQuality} id="crop-quality" />}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCrop} disabled={!file || !rect || isProcessing} className="mz-btn-primary">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Cropping..." : "Crop Image"}
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
        toolId="image-cropper"
        category="image-tools"
        showPrivacyNote
        howTo={[
          "Drop an image onto the box above, or click to browse.",
          "Drag across the image to select the area you want to keep.",
          "Pick an aspect ratio preset, or fine-tune the exact X, Y, width and height values.",
          "Click Crop Image and download the result.",
        ]}
        faq={[
          { q: "Can I crop to an exact pixel size?", a: "Yes. Drag a rough selection first, then type exact X, Y, width and height values in the boxes — the selection on the image updates as you type." },
          { q: "What do the aspect ratio presets do?", a: "They snap your selection to a fixed shape — 1:1 for profile pictures, 16:9 for slides, 3:4 for portrait prints. Choose Free to crop to any shape." },
          { q: "Does cropping reduce quality?", a: "The kept pixels are copied exactly. Saving as JPG or WebP re-encodes them, which loses a small amount of detail; choose PNG for a lossless save." },
          { q: "Why is my selection snapping back inside the image?", a: "Crop areas are clamped to the image bounds, so a selection dragged past the edge is pulled back rather than producing blank space in your result." },
          { q: "Is my image uploaded?", a: "No. The crop is calculated and applied in your browser, and your file never leaves your device." },
        ]}
      />
    </div>
  );
}
