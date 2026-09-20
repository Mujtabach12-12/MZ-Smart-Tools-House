import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { convertImage } from "../../lib/image/process";
import { browserImageDeps, isEncodingSupported } from "../../lib/image/canvas";
import { getFormat, assertSupportedImage, formatLabel } from "../../lib/image/core";
import { qualityAppliesTo } from "../../lib/image/compress";
import FileDropzone from "../../components/tools/FileDropzone";
import ImagePreview from "../../components/tools/ImagePreview";
import ImageResult from "../../components/tools/ImageResult";
import QualitySlider from "../../components/tools/QualitySlider";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

/**
 * One real implementation behind JPG→PNG, PNG→JPG, JPG→WebP, PNG→WebP and
 * WebP→JPG. Only the accepted input types, the output format and the copy
 * differ, so duplicating five near-identical components would just be five
 * places to fix the same bug.
 */
export default function ImageConverterBase({
  toolId,
  inputMimes,
  inputLabel,
  outputFormat,
  howTo,
  faq,
  note,
}) {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [unsupported, setUnsupported] = useState(false);

  const format = getFormat(outputFormat);
  const showQuality = qualityAppliesTo(outputFormat);

  useEffect(() => {
    // Check up front whether this browser can even write the target format,
    // so the user is warned before selecting a file rather than after.
    setUnsupported(!isEncodingSupported(format.mime));
  }, [format.mime]);

  function handleFiles([selected]) {
    setError("");
    setResult(null);
    try {
      assertSupportedImage(selected, inputMimes);
      setFile(selected);
    } catch (err) {
      setFile(null);
      setError(err.message);
    }
  }

  async function handleConvert() {
    if (!file) return;
    setIsProcessing(true);
    setError("");
    setResult(null);
    try {
      const output = await convertImage(
        file,
        { format: outputFormat, quality: quality / 100, allowedMimes: inputMimes },
        browserImageDeps
      );
      setResult(output);
    } catch (err) {
      setError(err.message || "Something went wrong while converting this image.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError("");
    setQuality(92);
  }

  return (
    <div className="mz-card p-6">
      {unsupported && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Your browser can't save {format.label} images, so this conversion won't work here. Chrome,
          Edge, Firefox and Safari 14+ all support it.
        </div>
      )}

      {!file ? (
        <FileDropzone
          accept={inputMimes.join(",")}
          onFiles={handleFiles}
          label={`Drop a ${inputLabel} image here`}
        />
      ) : (
        <ImagePreview file={file} onRemove={handleReset} />
      )}

      {file && showQuality && (
        <div className="mt-6 max-w-sm">
          <QualitySlider value={quality} onChange={setQuality} id={`${toolId}-quality`} />
        </div>
      )}

      {file && !showQuality && (
        <p className="mt-4 text-sm text-navy-500 dark:text-navy-400">
          {format.label} is a lossless format, so there is no quality setting — every pixel is kept
          exactly as it is.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleConvert}
          disabled={!file || isProcessing || unsupported}
          className="mz-btn-primary"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Converting..." : `Convert to ${format.label}`}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <ErrorMessage message={error} />
        <ImageResult result={result} />
      </div>

      {note && <p className="mt-6 text-sm text-navy-500 dark:text-navy-400">{note}</p>}

      <ToolExtras
        toolId={toolId}
        category="image-tools"
        showPrivacyNote
        howTo={
          howTo || [
            `Drop a ${inputLabel} image onto the box above, or click to browse.`,
            showQuality ? "Pick a quality level if you want a smaller file." : "Check the preview.",
            `Click "Convert to ${format.label}" and download the result.`,
          ]
        }
        faq={faq}
      />
    </div>
  );
}

export { formatLabel };
