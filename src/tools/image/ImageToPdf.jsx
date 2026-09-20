import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { imageFilesToPdf } from "../../lib/image/toPdf";
import { browserImageDeps } from "../../lib/image/canvas";
import { assertSupportedImage, SUPPORTED_INPUT_MIMES } from "../../lib/image/core";
import { downloadBytes } from "../../lib/download";
import { formatBytes } from "../../lib/pdf/core";
import FileDropzone from "../../components/tools/FileDropzone";
import FileListItem from "../../components/tools/FileListItem";
import ProgressBar from "../../components/tools/ProgressBar";
import Field from "../../components/tools/Field";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function ImageToPdf() {
  const [items, setItems] = useState([]);
  const [pageSize, setPageSize] = useState("auto");
  const [orientation, setOrientation] = useState("auto");
  const [margin, setMargin] = useState("0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleFiles(newFiles) {
    setError("");
    setDone(false);
    const accepted = [];
    for (const file of newFiles) {
      try {
        assertSupportedImage(file, SUPPORTED_INPUT_MIMES);
        accepted.push({ id: crypto.randomUUID(), file });
      } catch (err) {
        setError(err.message);
      }
    }
    if (accepted.length > 0) setItems((prev) => [...prev, ...accepted]);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDone(false);
  }

  function move(index, delta) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDone(false);
  }

  async function handleConvert() {
    if (items.length === 0) {
      setError("Add at least one image.");
      return;
    }
    setIsProcessing(true);
    setError("");
    setDone(false);
    setProgress({ done: 0, total: items.length });
    try {
      const marginPoints = Number(margin);
      if (!Number.isFinite(marginPoints) || marginPoints < 0) {
        throw new Error("Margin must be 0 or a positive number.");
      }
      const bytes = await imageFilesToPdf(
        items.map((i) => i.file),
        browserImageDeps,
        {
          pageSize,
          orientation,
          margin: pageSize === "auto" ? 0 : marginPoints,
          onProgress: (doneCount, total) => setProgress({ done: doneCount, total }),
        }
      );
      downloadBytes(bytes, "images.pdf", "application/pdf");
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong while building your PDF.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setItems([]);
    setPageSize("auto");
    setOrientation("auto");
    setMargin("0");
    setError("");
    setDone(false);
    setProgress({ done: 0, total: 0 });
  }

  const totalSize = items.reduce((sum, i) => sum + i.file.size, 0);

  return (
    <div className="mz-card p-6">
      <FileDropzone
        accept={SUPPORTED_INPUT_MIMES.join(",")}
        multiple
        onFiles={handleFiles}
        label="Drop images here — JPG, PNG, WebP, GIF or BMP"
      />

      {items.length > 0 && (
        <>
          <div className="mt-4 space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center text-xs text-navy-400 dark:text-navy-500">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <FileListItem
                    name={item.file.name}
                    size={item.file.size}
                    onRemove={() => removeItem(item.id)}
                  />
                </div>
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${item.file.name} up`}
                    className="text-navy-400 transition hover:text-brand-600 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label={`Move ${item.file.name} down`}
                    className="text-navy-400 transition hover:text-brand-600 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm text-navy-500 dark:text-navy-400">
            {items.length} image{items.length === 1 ? "" : "s"} · {formatBytes(totalSize)} total
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Field label="Page size" htmlFor="pdf-page-size">
              <select
                id="pdf-page-size"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="mz-input"
              >
                <option value="auto">Fit page to image</option>
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
                <option value="a5">A5</option>
              </select>
            </Field>
            <Field label="Orientation" htmlFor="pdf-orientation">
              <select
                id="pdf-orientation"
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                disabled={pageSize === "auto"}
                className="mz-input disabled:opacity-50"
              >
                <option value="auto">Match each image</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </Field>
            <Field label="Margin (pt)" htmlFor="pdf-margin" hint="72 pt = 1 inch">
              <input
                id="pdf-margin"
                type="number"
                min="0"
                inputMode="numeric"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                disabled={pageSize === "auto"}
                className="mz-input disabled:opacity-50"
              />
            </Field>
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleConvert}
          disabled={items.length === 0 || isProcessing}
          className="mz-btn-primary"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isProcessing ? "Building PDF..." : "Convert to PDF"}
        </button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {isProcessing && progress.total > 0 && (
          <ProgressBar current={progress.done} total={progress.total} label="Preparing images" />
        )}
        <ErrorMessage message={error} />
        {done && !error && (
          <p className="text-sm font-medium text-green-600">Your PDF has been downloaded.</p>
        )}
      </div>

      <ToolExtras
        toolId="image-to-pdf"
        category="image-tools"
        showPrivacyNote
        howTo={[
          "Drop one or more images onto the box above, or click to browse.",
          "Use the arrows to put them in the order you want the pages to appear.",
          "Choose a page size — \"Fit page to image\" keeps each page exactly the size of its image.",
          "Click Convert to PDF and the file downloads straight away.",
        ]}
        faq={[
          { q: "Which image formats can I use?", a: "JPG, PNG, WebP, GIF and BMP. PDFs can only store JPG and PNG internally, so WebP, GIF and BMP images are converted to JPG in your browser first — the rest are embedded untouched." },
          { q: "How do I change the page order?", a: "Use the up and down arrows next to each file. The numbered list shows exactly what order the pages will be in." },
          { q: "Should I pick A4 or \"Fit page to image\"?", a: "Choose A4 or Letter if you're going to print the PDF or submit it somewhere with a page-size requirement. \"Fit page to image\" is better for screenshots and scans you just want to share." },
          { q: "How many images can I add?", a: "There's no fixed limit, but everything is processed in your browser's memory, so very large batches of high-resolution photos may be slow on an older phone." },
          { q: "Are my images uploaded to a server?", a: "No. The PDF is built entirely in your browser and downloads directly to your device." },
        ]}
      />
    </div>
  );
}
