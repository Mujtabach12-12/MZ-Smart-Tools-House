import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Download,
  Image as ImageIcon,
  Plus,
  RefreshCcw,
  RotateCw,
  Trash2,
  Upload,
  Wand2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileDown,
  ScanLine,
  SlidersHorizontal,
} from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { downloadBlob, downloadBytes } from "../../lib/download";
import { recognizeImage } from "../../lib/ocr";
import {
  detectDocumentBoundary,
  normalizeCorners,
  validateDocumentCorners,
} from "../../lib/scanner/detectDocument";

const MAX_SIDE = 1800;
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
function snapshotPage(page) {
  return {
    data: page.data, sourceData: page.sourceData, detectedCrop: page.detectedCrop,
    detected: page.detected, detectionConfidence: page.detectionConfidence, cropApplied: page.cropApplied,
    width: page.width, height: page.height,
  };
}
function withPageHistory(page, next) {
  return { ...next, history: [...(page.history || []), snapshotPage(page)].slice(-16), future: [] };
}

function canvasFromImage(img, maxSide = MAX_SIDE) {
  const scale = Math.min(
    1,
    maxSide /
      Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height),
  );
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * scale));
  c.height = Math.max(1, Math.round(img.height * scale));
  c.getContext("2d", { willReadFrequently: true }).drawImage(
    img,
    0,
    0,
    c.width,
    c.height,
  );
  return c;
}
function autoBounds(c) {
  const image = c
    .getContext("2d", { willReadFrequently: true })
    .getImageData(0, 0, c.width, c.height);
  return detectDocumentBoundary(image.data, c.width, c.height);
}
function solve(A, b) {
  const n = 8,
    M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++)
      if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const q = M[c][c];
    if (Math.abs(q) < 1e-9) throw Error("Perspective correction failed.");
    for (let j = c; j <= n; j++) M[c][j] /= q;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((r) => r[n]);
}
function warp(source, pts, mode, adjustments = {}) {
  const [tl, tr, br, bl] = pts,
    w = Math.max(
      Math.hypot(tr[0] - tl[0], tr[1] - tl[1]),
      Math.hypot(br[0] - bl[0], br[1] - bl[1]),
    ),
    h = Math.max(
      Math.hypot(bl[0] - tl[0], bl[1] - tl[1]),
      Math.hypot(br[0] - tr[0], br[1] - tr[1]),
    );
  const out = document.createElement("canvas");
  out.width = Math.min(1800, Math.max(1, Math.round(w)));
  out.height = Math.min(2400, Math.max(1, Math.round((h * out.width) / w)));
  const dst = [
      [0, 0],
      [out.width, 0],
      [out.width, out.height],
      [0, out.height],
    ],
    A = [],
    b = [];
  dst.forEach(([x, y], i) => {
    const [u, v] = pts[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  });
  const outputContext = out.getContext("2d", { willReadFrequently: true });
  const H = solve(A, b),
    s = source
      .getContext("2d", { willReadFrequently: true })
      .getImageData(0, 0, source.width, source.height),
    d = outputContext.createImageData(out.width, out.height);
  let presetBrightness = 0, presetContrast = 0;
  if (mode === "auto") {
    let total = 0, totalSq = 0, count = 0;
    const stride = Math.max(1, Math.floor((source.width * source.height) / 30000));
    for (let pixel = 0; pixel < source.width * source.height; pixel += stride) {
      const i = pixel * 4;
      const lum = 0.299 * s.data[i] + 0.587 * s.data[i + 1] + 0.114 * s.data[i + 2];
      total += lum; totalSq += lum * lum; count += 1;
    }
    const mean = count ? total / count : 160;
    const deviation = count ? Math.sqrt(Math.max(0, totalSq / count - mean * mean)) : 55;
    presetBrightness = clamp((188 - mean) / 2.55, -18, 18);
    presetContrast = deviation < 38 ? 26 : deviation < 55 ? 16 : 8;
  } else if (mode === "light") {
    presetBrightness = 12; presetContrast = 5;
  }
  const brightnessOffset = clamp(Number(adjustments.brightness || 0) + presetBrightness, -100, 100) * 2.55;
  const contrastFactor = 1 + clamp(Number(adjustments.contrast || 0) + presetContrast, -80, 100) / 100;
  for (let y = 0; y < out.height; y++)
    for (let x = 0; x < out.width; x++) {
      const den = H[6] * x + H[7] * y + 1,
        u = (H[0] * x + H[1] * y + H[2]) / den,
        v = (H[3] * x + H[4] * y + H[5]) / den,
        sx = Math.max(0, Math.min(source.width - 1, Math.round(u))),
        sy = Math.max(0, Math.min(source.height - 1, Math.round(v))),
        si = (sy * source.width + sx) * 4,
        di = (y * out.width + x) * 4;
      let r = s.data[si],
        g = s.data[si + 1],
        q = s.data[si + 2];
      r = clamp(((r - 128) * contrastFactor + 128 + brightnessOffset) / 255) * 255;
      g = clamp(((g - 128) * contrastFactor + 128 + brightnessOffset) / 255) * 255;
      q = clamp(((q - 128) * contrastFactor + 128 + brightnessOffset) / 255) * 255;
      const l = 0.299 * r + 0.587 * g + 0.114 * q;
      if (mode === "grayscale") r = g = q = l;
      else if (mode === "bw") r = g = q = l > 150 ? 255 : 0;
      else if (mode === "color") {
        const sat = 1.34;
        r = clamp((l + (r - l) * sat) / 255) * 255;
        g = clamp((l + (g - l) * sat) / 255) * 255;
        q = clamp((l + (q - l) * sat) / 255) * 255;
      } else if (mode === "contrast") {
        r = clamp((r / 255 - 0.5) * 1.45 + 0.5) * 255;
        g = clamp((g / 255 - 0.5) * 1.45 + 0.5) * 255;
        q = clamp((q / 255 - 0.5) * 1.45 + 0.5) * 255;
      } else if (mode === "document") {
        const paperLift = l > 150 ? 20 : 8;
        const docContrast = 1.2;
        r = clamp((((r - 128) * docContrast + 128 + paperLift) / 255)) * 255;
        g = clamp((((g - 128) * docContrast + 128 + paperLift) / 255)) * 255;
        q = clamp((((q - 128) * docContrast + 128 + paperLift) / 255)) * 255;
        const cleanLum = 0.299 * r + 0.587 * g + 0.114 * q;
        r = clamp((cleanLum + (r - cleanLum) * 0.72) / 255) * 255;
        g = clamp((cleanLum + (g - cleanLum) * 0.72) / 255) * 255;
        q = clamp((cleanLum + (q - cleanLum) * 0.72) / 255) * 255;
      }
      d.data[di] = r;
      d.data[di + 1] = g;
      d.data[di + 2] = q;
      d.data[di + 3] = 255;
    }
  outputContext.putImageData(d, 0, 0);
  const sharpenAmount = Math.max(mode === "sharpen" ? 0.65 : 0, clamp(Number(adjustments.sharpen || 0), 0, 100) / 100);
  if (sharpenAmount > 0 && out.width * out.height <= 4_500_000) {
    const current = outputContext.getImageData(0, 0, out.width, out.height);
    const copy = new Uint8ClampedArray(current.data);
    const strength = 0.55 * sharpenAmount;
    for (let y = 1; y < out.height - 1; y += 1) {
      for (let x = 1; x < out.width - 1; x += 1) {
        const i = (y * out.width + x) * 4;
        const up = i - out.width * 4, down = i + out.width * 4, left = i - 4, right = i + 4;
        for (let channel = 0; channel < 3; channel += 1) {
          const center = copy[i + channel];
          const blurred = (copy[up + channel] + copy[down + channel] + copy[left + channel] + copy[right + channel]) / 4;
          current.data[i + channel] = clamp((center + (center - blurred) * strength) / 255) * 255;
        }
      }
    }
    outputContext.putImageData(current, 0, 0);
  }
  return out;
}

export default function SmartDocumentScanner() {
  const video = useRef(null);
  const stream = useRef(null);
  const input = useRef(null);

  const [camera, setCamera] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pages, setPages] = useState([]);
  const [selected, setSelected] = useState(0);
  const [workflowStep, setWorkflowStep] = useState("capture");
  const [mode, setMode] = useState("auto");
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [pdfSize, setPdfSize] = useState("a4");
  const [pdfMargin, setPdfMargin] = useState("normal");
  const [busy, setBusy] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [previewData, setPreviewData] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [crop, setCrop] = useState([
    [0.03, 0.03],
    [0.97, 0.03],
    [0.97, 0.97],
    [0.03, 0.97],
  ]);

  const selectedPage = pages[selected] || null;
  const cameraSupported =
    typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const stop = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCamera(false);
  };

  useEffect(() => () => stop(), []);

  useEffect(() => {
    const page = pages[selected];
    if (!page || workflowStep !== "filter") {
      setPreviewData("");
      setPreviewBusy(false);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreviewBusy(true);
      try {
        const img = await loadImage(page.sourceData || page.data);
        const canvas = canvasFromImage(img, 900);
        let points = [
          [0, 0],
          [canvas.width, 0],
          [canvas.width, canvas.height],
          [0, canvas.height],
        ];
        if (page.detectedCrop) {
          const candidate = page.detectedCrop.map(([x, y]) => [
            x * canvas.width,
            y * canvas.height,
          ]);
          points =
            validateDocumentCorners(candidate, canvas.width, canvas.height, 0.001) ||
            points;
        }
        const preview = warp(canvas, points, mode, {
          brightness,
          contrast,
          sharpen,
        });
        if (!cancelled) setPreviewData(preview.toDataURL("image/jpeg", 0.86));
      } catch {
        if (!cancelled) setPreviewData(page.data || page.sourceData || "");
      } finally {
        if (!cancelled) setPreviewBusy(false);
      }
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    workflowStep,
    selected,
    pages[selected]?.id,
    pages[selected]?.sourceData,
    pages[selected]?.detectedCrop,
    mode,
    brightness,
    contrast,
    sharpen,
  ]);

  const start = async () => {
    setError("");
    setMessage("");
    setWorkflowStep("capture");
    try {
      if (!window.isSecureContext) {
        throw Error(
          "Camera access requires HTTPS. Use Upload / Use Photo if camera access is unavailable.",
        );
      }
      if (!cameraSupported) {
        throw Error(
          "Camera access is not supported by this browser. Use Upload / Use Photo instead.",
        );
      }
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        audio: false,
      });
      stream.current = nextStream;
      setCamera(true);
      requestAnimationFrame(() => {
        if (video.current) video.current.srcObject = nextStream;
      });
    } catch (e) {
      const msg =
        e.name === "NotAllowedError"
          ? "Camera permission was denied. Use Upload / Use Photo instead."
          : e.name === "NotFoundError"
            ? "No camera was found on this device. Use Upload / Use Photo instead."
            : e.name === "NotReadableError"
              ? "The camera is busy or unavailable. Close other camera apps and try again."
              : e.message || "Unable to access the camera.";
      setError(msg);
    }
  };

  const process = async (src, name) => {
    setBusy(true);
    setError("");
    setMessage("Detecting document edges…");
    try {
      const img = await loadImage(src);
      const canvas = canvasFromImage(img);
      const detection = autoBounds(canvas);
      const corners = detection?.corners || null;
      const full = [
        [0, 0],
        [canvas.width, 0],
        [canvas.width, canvas.height],
        [0, canvas.height],
      ];
      const normalized = normalizeCorners(corners || full, canvas.width, canvas.height);
      const sourceData = canvas.toDataURL("image/jpeg", 0.94);
      const nextIndex = pages.length;
      const nextPage = {
        id: crypto.randomUUID(),
        data: sourceData,
        sourceData,
        detectedCrop: normalized,
        detected: Boolean(corners),
        detectionConfidence: detection?.confidence || 0,
        cropApplied: false,
        filterApplied: false,
        filterMode: "auto",
        brightness: 0,
        contrast: 0,
        sharpen: 0,
        name,
        width: canvas.width,
        height: canvas.height,
        history: [],
        future: [],
      };
      setPages((current) => [...current, nextPage]);
      setSelected(nextIndex);
      setCrop(normalized);
      setMode("auto");
      setBrightness(0);
      setContrast(0);
      setSharpen(0);
      setOcrText("");
      setWorkflowStep("crop");
      setMessage(
        corners
          ? "Auto crop is ready. Drag any corner directly if it needs correction, then continue."
          : "Document boundary could not be detected confidently. The four corners are already editable—place them around the document, then continue.",
      );
    } catch (e) {
      setError(e.message || "Unable to process this image.");
    } finally {
      setBusy(false);
    }
  };

  const capture = () => {
    const currentVideo = video.current;
    if (!currentVideo?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = currentVideo.videoWidth;
    canvas.height = currentVideo.videoHeight;
    canvas.getContext("2d").drawImage(currentVideo, 0, 0);
    stop();
    process(
      canvas.toDataURL("image/jpeg", 0.94),
      `page-${pages.length + 1}.jpg`,
    );
  };

  const choose = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      setError(
        "This image is larger than 40 MB. Use a smaller photo so your browser can process it reliably.",
      );
      event.target.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    process(url, file.name).finally(() => URL.revokeObjectURL(url));
    event.target.value = "";
  };

  const redetect = async () => {
    const page = pages[selected];
    if (!page) return;
    setBusy(true);
    setError("");
    setMessage("Detecting document edges again…");
    try {
      const img = await loadImage(page.sourceData || page.data);
      const canvas = canvasFromImage(img);
      const detection = autoBounds(canvas);
      const full = [
        [0, 0],
        [canvas.width, 0],
        [canvas.width, canvas.height],
        [0, canvas.height],
      ];
      const normalized = normalizeCorners(
        detection?.corners || full,
        canvas.width,
        canvas.height,
      );
      setPages((items) =>
        items.map((item, index) =>
          index === selected
            ? withPageHistory(item, {
                ...item,
                data: item.sourceData || item.data,
                detected: Boolean(detection?.corners),
                detectionConfidence: detection?.confidence || 0,
                detectedCrop: normalized,
                cropApplied: false,
                filterApplied: false,
                width: canvas.width,
                height: canvas.height,
              })
            : item,
        ),
      );
      setCrop(normalized);
      setMessage(
        detection?.corners
          ? "Boundary detected again. Drag a corner if needed, then confirm the crop."
          : "No confident boundary was found. Adjust the four corners directly on the image.",
      );
    } catch (e) {
      setError(e.message || "Unable to analyze this image.");
    } finally {
      setBusy(false);
    }
  };

  const rotate = async () => {
    const page = pages[selected];
    if (!page || busy) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(page.sourceData || page.data);
      const canvas = document.createElement("canvas");
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const sourceData = canvas.toDataURL("image/jpeg", 0.94);
      const detection = autoBounds(canvas);
      const full = [
        [0, 0],
        [canvas.width, 0],
        [canvas.width, canvas.height],
        [0, canvas.height],
      ];
      const normalized = normalizeCorners(
        detection?.corners || full,
        canvas.width,
        canvas.height,
      );
      setPages((items) =>
        items.map((item, index) =>
          index === selected
            ? withPageHistory(item, {
                ...item,
                data: sourceData,
                sourceData,
                width: canvas.width,
                height: canvas.height,
                detectedCrop: normalized,
                detected: Boolean(detection?.corners),
                detectionConfidence: detection?.confidence || 0,
                cropApplied: false,
                filterApplied: false,
              })
            : item,
        ),
      );
      setCrop(normalized);
      setMessage("Page rotated. The crop boundary has been detected again.");
    } catch (e) {
      setError(e.message || "Unable to rotate this page.");
    } finally {
      setBusy(false);
    }
  };

  const confirmCrop = async () => {
    const page = pages[selected];
    if (!page) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(page.sourceData || page.data);
      const canvas = canvasFromImage(img);
      const rawPoints = crop.map(([x, y]) => [x * canvas.width, y * canvas.height]);
      const points = validateDocumentCorners(rawPoints, canvas.width, canvas.height);
      if (!points) {
        throw new Error(
          "The crop corners overlap or form an invalid page shape. Move the four handles apart and try again.",
        );
      }
      const normalized = normalizeCorners(points, canvas.width, canvas.height);
      const cropped = warp(canvas, points, "original", {
        brightness: 0,
        contrast: 0,
        sharpen: 0,
      });
      setPages((items) =>
        items.map((item, index) =>
          index === selected
            ? withPageHistory(item, {
                ...item,
                data: cropped.toDataURL("image/jpeg", 0.93),
                detectedCrop: normalized,
                cropApplied: true,
                filterApplied: false,
                width: cropped.width,
                height: cropped.height,
              })
            : item,
        ),
      );
      setCrop(normalized);
      setMode(page.filterMode || "auto");
      setBrightness(page.brightness || 0);
      setContrast(page.contrast || 0);
      setSharpen(page.sharpen || 0);
      setWorkflowStep("filter");
      setMessage("Crop confirmed. Now choose the look you want for this page.");
    } catch (e) {
      setError(e.message || "Unable to crop this page.");
    } finally {
      setBusy(false);
    }
  };

  const applyEnhancementAndContinue = async () => {
    const page = pages[selected];
    if (!page?.cropApplied || !page.detectedCrop) {
      setError("Confirm the crop before applying a filter.");
      setWorkflowStep("crop");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(page.sourceData || page.data);
      const canvas = canvasFromImage(img);
      const raw = page.detectedCrop.map(([x, y]) => [
        x * canvas.width,
        y * canvas.height,
      ]);
      const points = validateDocumentCorners(
        raw,
        canvas.width,
        canvas.height,
        0.001,
      );
      if (!points) {
        throw new Error("The saved crop boundary is invalid. Review the crop again.");
      }
      const output = warp(canvas, points, mode, {
        brightness,
        contrast,
        sharpen,
      });
      setPages((items) =>
        items.map((item, index) =>
          index === selected
            ? withPageHistory(item, {
                ...item,
                data: output.toDataURL("image/jpeg", 0.93),
                width: output.width,
                height: output.height,
                filterApplied: true,
                filterMode: mode,
                brightness,
                contrast,
                sharpen,
              })
            : item,
        ),
      );
      setWorkflowStep("export");
      setMessage(
        `Page ${selected + 1} is ready. Export now or add another image.`,
      );
    } catch (e) {
      setError(e.message || "Unable to apply enhancements.");
    } finally {
      setBusy(false);
    }
  };

  const editCrop = (index) => {
    const page = pages[index];
    if (!page) return;
    setSelected(index);
    setCrop(
      page.detectedCrop || [
        [0.03, 0.03],
        [0.97, 0.03],
        [0.97, 0.97],
        [0.03, 0.97],
      ],
    );
    setError("");
    setMessage("Adjust the four crop corners directly, then continue.");
    setWorkflowStep("crop");
  };

  const editFilter = (index) => {
    const page = pages[index];
    if (!page) return;
    setSelected(index);
    setMode(page.filterMode || "auto");
    setBrightness(page.brightness || 0);
    setContrast(page.contrast || 0);
    setSharpen(page.sharpen || 0);
    setError("");
    setMessage("Choose a filter or fine-tune the page, then continue.");
    setWorkflowStep("filter");
  };

  const removePage = (index) => {
    const remaining = pages.filter((_, pageIndex) => pageIndex !== index);
    setPages(remaining);
    setSelected(Math.max(0, Math.min(index, remaining.length - 1)));
    setOcrText("");
    if (remaining.length === 0) {
      setWorkflowStep("capture");
      setMessage("");
    } else {
      setWorkflowStep("export");
      setMessage("Page removed.");
    }
  };

  const movePage = (index, direction) => {
    const destination = index + direction;
    if (destination < 0 || destination >= pages.length) return;
    setPages((items) => {
      const copy = [...items];
      [copy[index], copy[destination]] = [copy[destination], copy[index]];
      return copy;
    });
    setSelected(destination);
  };

  const runOcr = async () => {
    const page = pages[selected];
    if (!page) return;
    setOcrBusy(true);
    setError("");
    setMessage("Recognizing text locally…");
    try {
      const text = await recognizeImage(page.data, "eng", () => {});
      setOcrText(text);
      setMessage(
        text.trim()
          ? "OCR completed successfully."
          : "OCR completed, but no text was detected.",
      );
    } catch (e) {
      setError(e.message || "OCR could not process this page.");
    } finally {
      setOcrBusy(false);
    }
  };

  const hasUnreviewedPages = pages.some(
    (page) => !page.cropApplied || !page.filterApplied,
  );

  const pdfLayout = () => {
    const [width, height] =
      pdfSize === "letter" ? [612, 792] : [595.28, 841.89];
    const margin = pdfMargin === "none" ? 0 : pdfMargin === "small" ? 18 : 36;
    return { width, height, margin };
  };

  const pdf = async () => {
    if (!pages.length || hasUnreviewedPages) {
      setError("Finish crop and filter steps for every page before exporting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const doc = await PDFDocument.create();
      for (const pageData of pages) {
        const bytes = await fetch(pageData.data).then((response) =>
          response.arrayBuffer(),
        );
        const image = await doc.embedJpg(bytes);
        const { width, height, margin } = pdfLayout();
        const page = doc.addPage([width, height]);
        const scale = Math.min(
          (width - margin * 2) / image.width,
          (height - margin * 2) / image.height,
        );
        const imageWidth = image.width * scale;
        const imageHeight = image.height * scale;
        page.drawImage(image, {
          x: (width - imageWidth) / 2,
          y: (height - imageHeight) / 2,
          width: imageWidth,
          height: imageHeight,
        });
      }
      const pdfBytes = await doc.save();
      const verified = await PDFDocument.load(pdfBytes);
      if (verified.getPageCount() !== pages.length) {
        throw new Error("PDF validation failed: page count changed during export.");
      }
      downloadBytes(pdfBytes, "mz-smart-scans.pdf", "application/pdf");
      setMessage(
        `Validated ${verified.getPageCount()}-page PDF exported successfully.`,
      );
    } catch (e) {
      setError(e.message || "Unable to export PDF.");
    } finally {
      setBusy(false);
    }
  };

  const exportSearchablePdf = async () => {
    if (!pages.length || hasUnreviewedPages) {
      setError("Finish crop and filter steps for every page before exporting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont("Helvetica");
      for (const pageData of pages) {
        const bytes = await fetch(pageData.data).then((response) =>
          response.arrayBuffer(),
        );
        const image = await doc.embedJpg(bytes);
        const { width, height, margin } = pdfLayout();
        const page = doc.addPage([width, height]);
        const scale = Math.min(
          (width - margin * 2) / image.width,
          (height - margin * 2) / image.height,
        );
        const imageWidth = image.width * scale;
        const imageHeight = image.height * scale;
        page.drawImage(image, {
          x: (width - imageWidth) / 2,
          y: (height - imageHeight) / 2,
          width: imageWidth,
          height: imageHeight,
        });
        const text =
          pageData.id === pages[selected]?.id && ocrText
            ? ocrText
            : await recognizeImage(pageData.data, "eng");
        if (text.trim()) {
          const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
          let y = 26;
          for (const line of lines.slice(0, 220)) {
            if (y > height - 22) break;
            page.drawText(line.slice(0, 180), {
              x: 24,
              y,
              size: 5,
              font,
              color: rgb(1, 1, 1),
              opacity: 0.01,
              maxWidth: width - 48,
            });
            y += 6.5;
          }
        }
      }
      const bytes = await doc.save();
      const verified = await PDFDocument.load(bytes);
      if (verified.getPageCount() !== pages.length) {
        throw new Error("Searchable PDF validation failed.");
      }
      downloadBytes(bytes, "mz-searchable-scan.pdf", "application/pdf");
      setMessage("Searchable PDF exported successfully.");
    } catch (e) {
      setError(e.message || "Unable to create searchable PDF.");
    } finally {
      setBusy(false);
    }
  };

  const downloadPageImages = async (format) => {
    if (!pages.length || hasUnreviewedPages) {
      setError("Finish crop and filter steps for every page before exporting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const files = [];
      for (const [index, page] of pages.entries()) {
        let bytes;
        let extension;
        let mime;
        if (format === "png") {
          const img = await loadImage(page.data);
          const canvas = canvasFromImage(img);
          const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png"),
          );
          if (!blob) throw new Error(`PNG conversion failed for page ${index + 1}.`);
          bytes = new Uint8Array(await blob.arrayBuffer());
          extension = "png";
          mime = "image/png";
        } else {
          bytes = new Uint8Array(
            await fetch(page.data).then((response) => response.arrayBuffer()),
          );
          extension = "jpg";
          mime = "image/jpeg";
        }
        if (bytes.length < 32) {
          throw new Error(`Image validation failed for page ${index + 1}.`);
        }
        files.push({ bytes, name: `scan-${index + 1}.${extension}`, mime });
      }
      if (files.length === 1) {
        await downloadBytes(files[0].bytes, files[0].name, files[0].mime);
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        files.forEach((file) => zip.file(file.name, file.bytes));
        const zipBytes = await zip.generateAsync({
          type: "uint8array",
          compression: "DEFLATE",
        });
        const verified = await JSZip.loadAsync(zipBytes);
        if (
          Object.keys(verified.files).filter((name) => !verified.files[name].dir)
            .length !== files.length
        ) {
          throw new Error("Image ZIP validation failed before download.");
        }
        await downloadBytes(
          zipBytes,
          `mz-scans-${format}.zip`,
          "application/zip",
        );
      }
      setMessage(
        files.length === 1
          ? `${format.toUpperCase()} image downloaded.`
          : `${files.length} ${format.toUpperCase()} pages prepared in a ZIP.`,
      );
    } catch (e) {
      setError(e.message || "Unable to export scanned images.");
    } finally {
      setBusy(false);
    }
  };

  const stepNumber =
    workflowStep === "capture" ? 1 : workflowStep === "crop" ? 2 : workflowStep === "filter" ? 3 : 4;

  const stepLabels = ["Capture", "Crop", "Filter", "Export"];

  return (
    <div className="mz-scanner-app">
      <input
        ref={input}
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={choose}
      />

      <div className="mz-scanner-flow-head">
        <div>
          <span className="mz-scanner-step">SMART DOCUMENT SCANNER</span>
          <h2>Scan one clear step at a time</h2>
          <p>Capture → correct the automatic crop → choose a filter → export or add another page.</p>
        </div>
        <span className="mz-scanner-local-badge">Private · on device</span>
      </div>

      <div className="mz-scanner-stepper" aria-label={`Scanner step ${stepNumber} of 4`}>
        {stepLabels.map((label, index) => {
          const number = index + 1;
          const active = number === stepNumber;
          const complete = number < stepNumber;
          return (
            <div
              key={label}
              className={`mz-scanner-stepper-item ${active ? "is-active" : ""} ${complete ? "is-complete" : ""}`}
            >
              <span>{complete ? <CheckCircle2 aria-hidden="true" /> : number}</span>
              <small>{label}</small>
            </div>
          );
        })}
      </div>

      {error ? (
        <div role="alert" className="mz-scanner-alert is-error">{error}</div>
      ) : null}
      {message ? (
        <div role="status" className="mz-scanner-alert is-info">{message}</div>
      ) : null}

      {workflowStep === "capture" ? (
        <section className="mz-scanner-flow-card" aria-labelledby="scanner-capture-title">
          <div className="mz-scanner-flow-title">
            <span>STEP 1 OF 4</span>
            <h3 id="scanner-capture-title">{pages.length ? "Add another document page" : "Capture your document"}</h3>
            <p>Take one photo or choose one image. We will detect its page edges automatically.</p>
          </div>

          {!camera ? (
            <div className="mz-scanner-capture-actions">
              <button className="mz-scanner-big-action is-primary" onClick={start} disabled={busy}>
                <Camera />
                <strong>Open Camera</strong>
                <small>Use the rear camera</small>
              </button>
              <button className="mz-scanner-big-action" onClick={() => input.current?.click()} disabled={busy}>
                <Upload />
                <strong>Choose Photo</strong>
                <small>JPG, PNG or WebP</small>
              </button>
            </div>
          ) : (
            <div className="mz-scanner-camera-stage">
              <video ref={video} autoPlay playsInline muted />
              <div className="mz-scanner-camera-guide" aria-hidden="true" />
              <button onClick={capture} aria-label="Capture document" className="mz-scanner-shutter"><Camera /></button>
              <button onClick={stop} className="mz-scanner-camera-close"><CameraOff /> Close</button>
            </div>
          )}

          {pages.length ? (
            <button className="mz-btn-ghost mz-scanner-back-export" onClick={() => { stop(); setWorkflowStep("export"); setError(""); }}>
              <ArrowLeft className="h-4 w-4" /> Back to ready pages
            </button>
          ) : null}
        </section>
      ) : null}

      {workflowStep === "crop" && selectedPage ? (
        <section className="mz-scanner-flow-card" aria-labelledby="scanner-crop-title">
          <div className="mz-scanner-flow-title">
            <span>STEP 2 OF 4</span>
            <h3 id="scanner-crop-title">Check the automatic crop</h3>
            <p>The four handles are already active. Drag any corner directly—no “manual crop” button is required.</p>
          </div>

          <div className="mz-scanner-crop-toolbar">
            <span className={selectedPage.detected ? "is-detected" : "is-review"}>
              <ScanLine /> {selectedPage.detected ? "Auto boundary found" : "Adjust boundary"}
            </span>
            <button className="mz-btn-secondary" onClick={redetect} disabled={busy}><RefreshCcw className="h-4 w-4" /> Detect again</button>
            <button className="mz-btn-secondary" onClick={rotate} disabled={busy}><RotateCw className="h-4 w-4" /> Rotate</button>
          </div>

          <div className="mz-scanner-crop-stage">
            <div className="mz-scanner-crop-image-wrap">
              <img src={selectedPage.sourceData || pages[selected].data} alt={`Crop page ${selected + 1}`} draggable="false" />
              <svg className="mz-scanner-crop-polygon" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polygon
                  points={crop.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
                  fill="rgba(37,99,235,.10)"
                  stroke="rgb(59 130 246)"
                  strokeWidth="0.9"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {crop.map(([x, y], index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Move crop corner ${index + 1}`}
                  className="mz-scanner-crop-handle touch-none"
                  style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    const handle = event.currentTarget;
                    const overlay = handle.parentElement;
                    if (!overlay) return;
                    const rect = overlay.getBoundingClientRect();
                    handle.setPointerCapture?.(event.pointerId);
                    const move = (moveEvent) => {
                      const nextX = clamp((moveEvent.clientX - rect.left) / rect.width, 0.01, 0.99);
                      const nextY = clamp((moveEvent.clientY - rect.top) / rect.height, 0.01, 0.99);
                      setCrop((current) => current.map((point, pointIndex) => pointIndex === index ? [nextX, nextY] : point));
                    };
                    const up = () => {
                      window.removeEventListener("pointermove", move);
                      window.removeEventListener("pointerup", up);
                    };
                    window.addEventListener("pointermove", move);
                    window.addEventListener("pointerup", up);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mz-scanner-flow-actions">
            <button className="mz-btn-secondary" onClick={() => {
              const p = pages[selected];
              if (p) setCrop(p.detectedCrop || [[0.03,0.03],[0.97,0.03],[0.97,0.97],[0.03,0.97]]);
            }}>Reset corners</button>
            <button className="mz-btn-primary" onClick={confirmCrop} disabled={busy}>
              {busy ? "Cropping…" : "Confirm Crop & Continue"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}

      {workflowStep === "filter" && selectedPage ? (
        <section className="mz-scanner-flow-card" aria-labelledby="scanner-filter-title">
          <div className="mz-scanner-flow-title">
            <span>STEP 3 OF 4</span>
            <h3 id="scanner-filter-title">Choose a document filter</h3>
            <p>Every option updates the preview live. Auto keeps colour, while Document and B&amp;W are stronger paper-cleanup looks.</p>
          </div>

          <div className="mz-scanner-filter-preview is-large">
            <img src={previewData || selectedPage.data} alt={`Filter preview page ${selected + 1}`} />
            <span>{previewBusy ? "Updating…" : "Live preview"}</span>
          </div>

          <div className="mz-scanner-filter-strip" role="group" aria-label="Document filters">
            {[
              ["original", "Original"],
              ["auto", "Auto"],
              ["color", "Color Boost"],
              ["document", "Document"],
              ["light", "Light"],
              ["grayscale", "Grayscale"],
              ["bw", "B&W"],
              ["contrast", "Contrast"],
              ["sharpen", "Sharpen"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mz-scanner-filter ${mode === value ? "is-active" : ""}`}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mz-scanner-adjust-grid">
            <label>Brightness <span>{brightness}</span><input type="range" min="-60" max="60" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} /></label>
            <label>Contrast <span>{contrast}</span><input type="range" min="-60" max="80" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} /></label>
            <label>Sharpen <span>{sharpen}</span><input type="range" min="0" max="100" value={sharpen} onChange={(e) => setSharpen(Number(e.target.value))} /></label>
          </div>

          <div className="mz-scanner-flow-actions">
            <button className="mz-btn-secondary" onClick={() => editCrop(selected)}><ArrowLeft className="h-4 w-4" /> Back to Crop</button>
            <button className="mz-btn-ghost" onClick={() => { setMode("original"); setBrightness(0); setContrast(0); setSharpen(0); }}>Reset filter</button>
            <button className="mz-btn-primary" onClick={applyEnhancementAndContinue} disabled={busy}>
              {busy ? "Applying…" : "Apply Filter & Continue"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}

      {workflowStep === "export" && pages.length ? (
        <section className="mz-scanner-flow-card" aria-labelledby="scanner-export-title">
          <div className="mz-scanner-flow-title">
            <span>STEP 4 OF 4</span>
            <h3 id="scanner-export-title">Export or add another image</h3>
            <p>{pages.length} ready page{pages.length === 1 ? "" : "s"}. Add another page and it will go through Crop → Filter before returning here.</p>
          </div>

          <div className="mz-scanner-ready-grid">
            {pages.map((page, index) => (
              <article key={page.id} className={`mz-scanner-ready-page ${selected === index ? "is-selected" : ""}`}>
                <button className="mz-scanner-ready-preview" onClick={() => setSelected(index)}>
                  <img src={page.data} alt={`Ready scan page ${index + 1}`} />
                  <span>Page {index + 1}</span>
                </button>
                <div className="mz-scanner-ready-actions">
                  <button onClick={() => editCrop(index)}>Crop</button>
                  <button onClick={() => editFilter(index)}>Filter</button>
                  <button onClick={() => movePage(index, -1)} disabled={index === 0} aria-label={`Move page ${index + 1} left`}><ArrowLeft /></button>
                  <button onClick={() => movePage(index, 1)} disabled={index === pages.length - 1} aria-label={`Move page ${index + 1} right`}><ArrowRight /></button>
                  <button className="is-danger" onClick={() => removePage(index)} aria-label={`Delete page ${index + 1}`}><Trash2 /></button>
                </div>
              </article>
            ))}
          </div>

          <div className="mz-scanner-add-more">
            <button className="mz-scanner-add-card" onClick={() => input.current?.click()} disabled={busy}>
              <Plus />
              <strong>Add another image</strong>
              <small>Choose a photo and crop it next</small>
            </button>
            <button className="mz-scanner-add-card" onClick={start} disabled={busy || !cameraSupported}>
              <Camera />
              <strong>Scan another page</strong>
              <small>Open the camera</small>
            </button>
          </div>

          <div className="mz-scanner-export-settings">
            <label>PDF page size<select className="mz-input" value={pdfSize} onChange={(e) => setPdfSize(e.target.value)}><option value="a4">A4</option><option value="letter">US Letter</option></select></label>
            <label>PDF margins<select className="mz-input" value={pdfMargin} onChange={(e) => setPdfMargin(e.target.value)}><option value="none">None</option><option value="small">Small</option><option value="normal">Normal</option></select></label>
          </div>

          <div className="mz-scanner-export-grid">
            <button className="mz-scanner-export-primary" onClick={pdf} disabled={busy || hasUnreviewedPages}><FileDown /> <span><strong>Download PDF</strong><small>Best for documents</small></span></button>
            <button className="mz-scanner-export-option" onClick={() => downloadPageImages("jpg")} disabled={busy || hasUnreviewedPages}><ImageIcon /> JPG</button>
            <button className="mz-scanner-export-option" onClick={() => downloadPageImages("png")} disabled={busy || hasUnreviewedPages}><ImageIcon /> PNG</button>
            <button className="mz-scanner-export-option" onClick={runOcr} disabled={ocrBusy || !selectedPage}><SlidersHorizontal /> {ocrBusy ? "OCR…" : "OCR Page"}</button>
            <button className="mz-scanner-export-option" onClick={exportSearchablePdf} disabled={busy || hasUnreviewedPages}><Download /> Searchable PDF</button>
          </div>

          {ocrText ? (
            <div className="mz-scanner-ocr-box">
              <div><strong>Extracted text</strong><button onClick={() => navigator.clipboard?.writeText(ocrText)}>Copy</button></div>
              <textarea className="mz-input" value={ocrText} onChange={(e) => setOcrText(e.target.value)} />
              <button className="mz-btn-secondary" onClick={() => downloadBlob(new Blob([ocrText], { type: "text/plain" }), "ocr-text.txt")}>Download TXT</button>
            </div>
          ) : null}

          <button className="mz-btn-ghost mz-scanner-start-over" onClick={() => { stop(); setPages([]); setSelected(0); setOcrText(""); setError(""); setMessage(""); setWorkflowStep("capture"); }}>
            <RefreshCcw className="h-4 w-4" /> Start a new scan
          </button>
        </section>
      ) : null}
    </div>
  );
}
