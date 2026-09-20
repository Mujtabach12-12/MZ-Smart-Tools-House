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

function canvasFromImage(img) {
  const scale = Math.min(
    1,
    MAX_SIDE /
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
      else if (mode === "contrast") {
        r = clamp((r / 255 - 0.5) * 1.45 + 0.5) * 255;
        g = clamp((g / 255 - 0.5) * 1.45 + 0.5) * 255;
        q = clamp((q / 255 - 0.5) * 1.45 + 0.5) * 255;
      } else if (mode === "document")
        r = g = q = clamp((l / 255 - 0.5) * 1.25 + 0.5) * 255;
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
  const video = useRef(null),
    stream = useRef(null),
    input = useRef(null);
  const [camera, setCamera] = useState(false),
    [error, setError] = useState(""),
    [pages, setPages] = useState([]),
    [selected, setSelected] = useState(0),
    [mode, setMode] = useState("original"),
    [brightness, setBrightness] = useState(0),
    [contrast, setContrast] = useState(0),
    [sharpen, setSharpen] = useState(0),
    [pdfSize, setPdfSize] = useState("a4"),
    [pdfMargin, setPdfMargin] = useState("normal"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [ocrText, setOcrText] = useState(""),
    [ocrBusy, setOcrBusy] = useState(false),
    [cropOpen, setCropOpen] = useState(false),
    [cropZoom, setCropZoom] = useState(1),
    [compareOpen, setCompareOpen] = useState(false),
    [crop, setCrop] = useState([
      [0.03, 0.03],
      [0.97, 0.03],
      [0.97, 0.97],
      [0.03, 0.97],
    ]);
  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setCamera(false);
  };
  const cameraSupported =
    typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  const start = async () => {
    setError("");
    try {
      if (!window.isSecureContext)
        throw Error(
          "Camera access requires HTTPS (a secure local development origin is also permitted by browsers). Use Upload / Use Photo instead on an insecure connection.",
        );
      if (!cameraSupported)
        throw Error(
          "Camera access is not supported by this browser. Use Upload / Use Photo instead.",
        );
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        audio: false,
      });
      stream.current = s;
      setCamera(true);
      requestAnimationFrame(() => {
        if (video.current) video.current.srcObject = s;
      });
    } catch (e) {
      const msg =
        e.name === "NotAllowedError"
          ? "Camera permission was denied. Use Upload / Use Photo instead."
          : e.name === "NotFoundError"
            ? "No camera was found on this device. Use Upload / Use Photo instead."
            : e.name === "NotReadableError"
              ? "The camera is busy or unavailable. Close other camera apps and try again."
              : e.name === "SecurityError"
                ? "Camera access was blocked by the browser security policy. Use Upload / Use Photo instead."
                : e.message || "Unable to access the camera.";
      setError(msg);
    }
  };
  useEffect(() => () => stop(), []);
  const process = async (src, name) => {
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(src),
        c = canvasFromImage(img);
      setMessage("Detecting document edges…");
      const detection = autoBounds(c);
      const corners = detection?.corners || null;
      const full = [
        [0, 0],
        [c.width, 0],
        [c.width, c.height],
        [0, c.height],
      ];
      const sourceData = c.toDataURL("image/jpeg", 0.94);
      setPages((p) => [
        ...p,
        {
          id: crypto.randomUUID(),
          data: sourceData,
          sourceData,
          detectedCrop: normalizeCorners(corners || full, c.width, c.height),
          detected: Boolean(corners),
          detectionConfidence: detection?.confidence || 0,
          cropApplied: false,
          name,
          width: c.width,
          height: c.height,
          history: [],
          future: [],
        },
      ]);
      setSelected(pages.length);
      setMessage(
        corners
          ? detection.confidence >= 0.62
            ? "Document boundary detected with a strong edge score. Review the four corners, then apply Auto Crop or adjust them manually."
            : "A possible document boundary was detected with a moderate edge score. Review the four corners carefully before cropping."
          : "Document boundary could not be detected confidently. Adjust the four corners manually before export.",
      );
    } catch (e) {
      setError(e.message || "Unable to process this image.");
    } finally {
      setBusy(false);
    }
  };
  const capture = () => {
    const v = video.current;
    if (!v?.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    stop();
    process(c.toDataURL("image/jpeg", 0.94), `page-${pages.length + 1}`);
  };
  const choose = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (f.size > 40 * 1024 * 1024) {
      setError("This image is larger than 40 MB. Use a smaller photo so your browser can process it reliably.");
      return;
    }
    const u = URL.createObjectURL(f);
    process(u, f.name).finally(() => URL.revokeObjectURL(u));
    e.target.value = "";
  };
  const rotate = async () => {
    const p = pages[selected];
    if (!p || busy) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(p.sourceData || p.data);
      const c = document.createElement("canvas");
      c.width = img.height;
      c.height = img.width;
      const x = c.getContext("2d");
      x.translate(c.width / 2, c.height / 2);
      x.rotate(Math.PI / 2);
      x.drawImage(img, -img.width / 2, -img.height / 2);
      const sourceData = c.toDataURL("image/jpeg", 0.94);
      const detection = autoBounds(c);
      const corners = detection?.corners || null;
      const full = [[0, 0], [c.width, 0], [c.width, c.height], [0, c.height]];
      setPages((a) => a.map((v, i) => i === selected ? withPageHistory(v, {
        ...v,
        data: sourceData,
        sourceData,
        width: c.width,
        height: c.height,
        detectedCrop: normalizeCorners(corners || full, c.width, c.height),
        detected: Boolean(corners),
        detectionConfidence: detection?.confidence || 0,
        cropApplied: false,
      }) : v));
      setCropOpen(false);
      setMessage(corners
        ? "Page rotated and document boundary detected again. Review the corners before applying the crop."
        : "Page rotated. Document boundary could not be detected confidently; adjust the corners manually.");
    } catch (e) {
      setError(e.message || "Unable to rotate this page.");
    } finally {
      setBusy(false);
    }
  };
  const undoPage = () => {
    setPages((items) => items.map((item, index) => {
      if (index !== selected || !item.history?.length) return item;
      const previous = item.history[item.history.length - 1];
      return { ...item, ...previous, history: item.history.slice(0, -1), future: [snapshotPage(item), ...(item.future || [])].slice(0, 16) };
    }));
    setMessage("Last page edit undone.");
  };
  const redoPage = () => {
    setPages((items) => items.map((item, index) => {
      if (index !== selected || !item.future?.length) return item;
      const [next, ...rest] = item.future;
      return { ...item, ...next, history: [...(item.history || []), snapshotPage(item)].slice(-16), future: rest };
    }));
    setMessage("Page edit restored.");
  };
  const remove = () => {
    setPages((a) => a.filter((_, i) => i !== selected));
    setSelected((s) => Math.max(0, Math.min(s, pages.length - 2)));
  };
  const move = (dir) => {
    setPages((a) => {
      const b = [...a],
        to = selected + dir;
      if (to < 0 || to >= b.length) return a;
      [b[selected], b[to]] = [b[to], b[selected]];
      return b;
    });
    setSelected((s) => s + dir);
  };
  const openCrop = () => {
    const p = pages[selected];
    if (!p) return;
    setError("");
    setCrop(
      p.detectedCrop || [
        [0.03, 0.03],
        [0.97, 0.03],
        [0.97, 0.97],
        [0.03, 0.97],
      ],
    );
    setCropZoom(1);
    setCropOpen(true);
  };
  const applyDetectedCrop = async () => {
    const p = pages[selected];
    if (!p?.detected || !p.detectedCrop) {
      setError("Document boundary could not be detected confidently. Choose Adjust Manually and place the four corners around the page.");
      openCrop();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(p.sourceData || p.data);
      const c = canvasFromImage(img);
      const raw = p.detectedCrop.map(([x, y]) => [x * c.width, y * c.height]);
      const pts = validateDocumentCorners(raw, c.width, c.height);
      if (!pts) throw new Error("The detected page boundary is invalid. Adjust the corners manually.");
      const out = warp(c, pts, mode, { brightness, contrast, sharpen });
      setPages((items) => items.map((item, index) => index === selected ? withPageHistory(item, {
        ...item,
        data: out.toDataURL("image/jpeg", 0.92),
        cropApplied: true,
        width: out.width,
        height: out.height,
      }) : item));
      setMessage("Auto crop and perspective correction applied. Review the result before export.");
    } catch (e) {
      setError(e.message || "Unable to apply the detected crop.");
    } finally {
      setBusy(false);
    }
  };

  const redetect = async () => {
    const p = pages[selected];
    if (!p) return;
    setBusy(true);
    setError("");
    setMessage("Analyzing document boundary…");
    try {
      const img = await loadImage(p.sourceData || p.data);
      const c = canvasFromImage(img);
      const detection = autoBounds(c);
      const corners = detection?.corners || null;
      const full = [[0,0],[c.width,0],[c.width,c.height],[0,c.height]];
      setPages((items) => items.map((item, index) => index === selected ? withPageHistory(item, {
        ...item,
        data: item.sourceData || item.data,
        detected: Boolean(corners),
        detectionConfidence: detection?.confidence || 0,
        detectedCrop: normalizeCorners(corners || full, c.width, c.height),
        cropApplied: false,
        width: c.width,
        height: c.height,
      }) : item));
      setMessage(corners ? (detection.confidence >= 0.62 ? "Document boundary detected with a strong edge score. Review the corners before applying." : "Possible document boundary detected with a moderate edge score. Review carefully or adjust manually.") : "Document boundary could not be detected confidently. Use Adjust Manually.");
    } catch (e) {
      setError(e.message || "Unable to analyze this image.");
    } finally {
      setBusy(false);
    }
  };
  const useFullPhoto = async () => {
    const p = pages[selected];
    if (!p) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(p.sourceData || p.data);
      const c = canvasFromImage(img);
      const full = [[0,0],[c.width,0],[c.width,c.height],[0,c.height]];
      const out = warp(c, full, mode, { brightness, contrast, sharpen });
      setPages((items) => items.map((item, index) => index === selected ? withPageHistory(item, {
        ...item,
        data: out.toDataURL("image/jpeg", 0.92),
        detectedCrop: normalizeCorners(full, c.width, c.height),
        cropApplied: true,
        width: out.width,
        height: out.height,
      }) : item));
      setMessage("Full photo accepted without automatic page cropping. Review it before export.");
    } catch (e) {
      setError(e.message || "Unable to use the full photo.");
    } finally {
      setBusy(false);
    }
  };

  const applyEnhancement = async () => {
    const p = pages[selected];
    if (!p?.cropApplied || !p.detectedCrop) {
      setError("Apply Auto Crop, Manual Crop, or Use Full Photo before applying enhancements.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(p.sourceData || p.data);
      const c = canvasFromImage(img);
      const raw = p.detectedCrop.map(([x, y]) => [x * c.width, y * c.height]);
      const pts = validateDocumentCorners(raw, c.width, c.height, 0.001);
      if (!pts) throw new Error("The saved crop boundary is invalid. Adjust the corners again.");
      const out = warp(c, pts, mode, { brightness, contrast, sharpen });
      setPages((items) => items.map((item, index) => index === selected ? withPageHistory(item, { ...item, data: out.toDataURL("image/jpeg", 0.92), width: out.width, height: out.height }) : item));
      setMessage("Enhancement preview updated.");
    } catch (e) {
      setError(e.message || "Unable to apply enhancements.");
    } finally {
      setBusy(false);
    }
  };

  const applyCrop = async () => {
    const p = pages[selected];
    if (!p) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(p.sourceData || p.data),
        c = canvasFromImage(img),
        rawPoints = crop.map(([x, y]) => [x * c.width, y * c.height]),
        pts = validateDocumentCorners(rawPoints, c.width, c.height);
      if (!pts) throw new Error("The crop corners overlap or form an invalid page shape. Move the handles apart and try again.");
      const normalizedCrop = normalizeCorners(pts, c.width, c.height),
        out = warp(c, pts, mode, { brightness, contrast, sharpen });
      setPages((a) =>
        a.map((v, i) =>
          i === selected
            ? withPageHistory(v, {
                ...v,
                data: out.toDataURL("image/jpeg", 0.92),
                detectedCrop: normalizedCrop,
                detected: true,
                detectionConfidence: null,
                cropApplied: true,
                width: out.width,
                height: out.height,
              })
            : v,
        ),
      );
      setCrop(normalizedCrop);
      setCropOpen(false);
      setMessage("Manual four-corner crop and perspective correction applied.");
    } catch (e) {
      setError(e.message || "Unable to crop this page.");
    } finally {
      setBusy(false);
    }
  };
  const runOcr = async () => {
    const p = pages[selected];
    if (!p) return;
    setOcrBusy(true);
    setError("");
    setMessage("Recognizing text locally…");
    try {
      const text = await recognizeImage(p.data, "eng", () => {});
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
  const hasUnreviewedPages = pages.some((p) => !p.cropApplied);
  const pdfLayout = () => {
    const [width, height] = pdfSize === "letter" ? [612, 792] : [595.28, 841.89];
    const margin = pdfMargin === "none" ? 0 : pdfMargin === "small" ? 18 : 36;
    return { width, height, margin };
  };
  const exportSearchablePdf = async () => {
    if (hasUnreviewedPages) { setError("Review every page before export. Apply a crop or choose Use Full Photo for each unreviewed page."); return; }
    setBusy(true);
    setError("");
    try {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont("Helvetica");
      for (const p of pages) {
        const bytes = await fetch(p.data).then((r) => r.arrayBuffer()),
          im = await doc.embedJpg(bytes),
          { width: pageWidth, height: pageHeight, margin } = pdfLayout(),
          page = doc.addPage([pageWidth, pageHeight]),
          scale = Math.min((pageWidth - margin * 2) / im.width, (pageHeight - margin * 2) / im.height),
          w = im.width * scale,
          h = im.height * scale;
        page.drawImage(im, {
          x: (pageWidth - w) / 2,
          y: (pageHeight - h) / 2,
          width: w,
          height: h,
        });
        const text =
          p.id === pages[selected]?.id && ocrText
            ? ocrText
            : await recognizeImage(p.data, "eng");
        if (text.trim()) {
          const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
          const fontSize = 5;
          let y = 26;
          for (const line of lines.slice(0, 220)) {
            if (y > pdfLayout().height - 22) break;
            page.drawText(line.slice(0, 180), {
              x: 24,
              y,
              size: fontSize,
              font,
              color: rgb(1, 1, 1),
              opacity: 0.01,
              maxWidth: pdfLayout().width - 48,
            });
            y += fontSize + 1.5;
          }
        }
      }
      const searchableBytes = await doc.save();
      const verified = await PDFDocument.load(searchableBytes);
      if (verified.getPageCount() !== pages.length) throw new Error("Searchable PDF validation failed: page count changed during export.");
      downloadBytes(searchableBytes, "mz-searchable-scan.pdf", "application/pdf");
      setMessage(`Validated searchable PDF exported with ${verified.getPageCount()} page${verified.getPageCount()===1?"":"s"}.`);
    } catch (e) {
      setError(e.message || "Unable to create searchable PDF.");
    } finally {
      setBusy(false);
    }
  };
  const downloadPageImages = async (format) => {
    if (hasUnreviewedPages) { setError("Review every page before exporting images."); return; }
    setBusy(true); setError("");
    try {
      const files = [];
      for (const [index, page] of pages.entries()) {
        let bytes;
        let extension;
        let mime;
        if (format === "png") {
          const img = await loadImage(page.data);
          const canvas = canvasFromImage(img);
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
          if (!blob) throw new Error(`PNG conversion failed for page ${index + 1}.`);
          bytes = new Uint8Array(await blob.arrayBuffer()); extension = "png"; mime = "image/png";
        } else {
          bytes = new Uint8Array(await fetch(page.data).then((response) => response.arrayBuffer())); extension = "jpg"; mime = "image/jpeg";
        }
        if (bytes.length < 32) throw new Error(`Image validation failed for page ${index + 1}.`);
        files.push({ bytes, name:`scan-${index + 1}.${extension}`, mime });
      }
      if (files.length === 1) {
        await downloadBytes(files[0].bytes, files[0].name, files[0].mime);
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        files.forEach((file) => zip.file(file.name, file.bytes));
        const bytes = await zip.generateAsync({ type:"uint8array", compression:"DEFLATE" });
        const verified = await JSZip.loadAsync(bytes);
        if (Object.keys(verified.files).filter((name) => !verified.files[name].dir).length !== files.length) throw new Error("Image ZIP validation failed before download.");
        await downloadBytes(bytes, `mz-scans-${format}.zip`, "application/zip");
      }
      setMessage(files.length === 1 ? `${format.toUpperCase()} image prepared.` : `${files.length} ${format.toUpperCase()} pages prepared in a validated ZIP.`);
    } catch (e) {
      setError(e.message || "Unable to export scanned images.");
    } finally { setBusy(false); }
  };
  const pdf = async () => {
    if (hasUnreviewedPages) { setError("Review every page before export. Apply a crop or choose Use Full Photo for each unreviewed page."); return; }
    setBusy(true);
    setError("");
    try {
      const doc = await PDFDocument.create();
      for (const p of pages) {
        const bytes = await fetch(p.data).then((r) => r.arrayBuffer()),
          im = await doc.embedJpg(bytes),
          { width: pageWidth, height: pageHeight, margin } = pdfLayout(),
          page = doc.addPage([pageWidth, pageHeight]),
          scale = Math.min((pageWidth - margin * 2) / im.width, (pageHeight - margin * 2) / im.height),
          w = im.width * scale,
          h = im.height * scale;
        page.drawImage(im, {
          x: (pageWidth - w) / 2,
          y: (pageHeight - h) / 2,
          width: w,
          height: h,
        });
      }
      const pdfBytes = await doc.save();
      const verified = await PDFDocument.load(pdfBytes);
      if (verified.getPageCount() !== pages.length) throw new Error("PDF validation failed: page count changed during export.");
      downloadBytes(pdfBytes, "mz-smart-scans.pdf", "application/pdf");
      setMessage(`Validated ${verified.getPageCount()}-page PDF exported successfully.`);
    } catch (e) {
      setError(e.message || "Unable to export PDF.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="mz-scanner-panel">
        {!camera ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                className="mz-btn-primary mz-liquid-btn min-h-28"
                onClick={start}
                disabled={busy}
              >
                <Camera className="h-7 w-7" />
                <span>Open Camera</span>
              </button>
              <button
                className="mz-btn-secondary min-h-28"
                onClick={() => input.current?.click()}
                disabled={busy}
              >
                <Upload className="h-7 w-7" />
                <span>Upload / Use Photo</span>
              </button>
              <input
                ref={input}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={choose}
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-navy-400">
              Camera capture needs a secure HTTPS page and browser permission.
              If camera access is unavailable, Upload / Use Photo remains
              available.
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-black">
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              className="aspect-[3/4] w-full object-cover sm:aspect-video"
            />
            <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/70" />
            <div className="absolute inset-x-0 bottom-5 flex justify-center">
              <button
                onClick={capture}
                aria-label="Capture document"
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-white shadow-2xl"
              >
                <Camera className="h-7 w-7" />
              </button>
            </div>
            <button
              onClick={stop}
              className="absolute right-4 top-4 mz-btn-secondary"
            >
              <CameraOff className="h-4 w-4" />
              Close
            </button>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="self-center text-xs font-bold uppercase tracking-wider text-navy-400">
            Enhance
          </span>
          {[
            ["original", "Original"],
            ["auto", "Auto"],
            ["document", "Document"],
            ["light", "Light"],
            ["grayscale", "Grayscale"],
            ["bw", "B&W"],
            ["contrast", "High Contrast"],
            ["sharpen", "Sharpen"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={mode === v ? "mz-btn-primary" : "mz-btn-secondary"}
              onClick={() => setMode(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 rounded-2xl border border-navy-100 bg-white/60 p-4 sm:grid-cols-3 dark:border-navy-800 dark:bg-navy-900/40">
          <label className="text-xs font-bold uppercase tracking-wide text-navy-500">Brightness <span className="float-right font-medium normal-case">{brightness}</span><input className="mt-2 w-full accent-emerald-600" type="range" min="-60" max="60" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} /></label>
          <label className="text-xs font-bold uppercase tracking-wide text-navy-500">Contrast <span className="float-right font-medium normal-case">{contrast}</span><input className="mt-2 w-full accent-emerald-600" type="range" min="-60" max="80" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} /></label>
          <label className="text-xs font-bold uppercase tracking-wide text-navy-500">Sharpen <span className="float-right font-medium normal-case">{sharpen}</span><input className="mt-2 w-full accent-emerald-600" type="range" min="0" max="100" value={sharpen} onChange={(e) => setSharpen(Number(e.target.value))} /></label>
          <div className="sm:col-span-3 flex flex-wrap gap-2"><button type="button" className="mz-btn-secondary" onClick={applyEnhancement} disabled={busy || !pages[selected]?.cropApplied}>Apply Enhancement</button><button type="button" className="mz-btn-ghost" onClick={() => { setBrightness(0); setContrast(0); setSharpen(0); setMode("original"); }}>Reset Enhancement</button></div>
        </div>
      </div>
      {message && (
        <div
          className="rounded-2xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-800 dark:border-brand-900/50 dark:bg-brand-950/30 dark:text-brand-200"
          role="status"
        >
          {message}
        </div>
      )}
      {pages[selected] && !cropOpen && (
        <section className="mz-scanner-pages" aria-labelledby="scanner-review-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Document analysis</p>
              <h2 id="scanner-review-title" className="mt-1 text-lg font-extrabold text-navy-900 dark:text-white">Review page {selected + 1}</h2>
              <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
                {pages[selected].detected
                  ? pages[selected].cropApplied
                    ? "Perspective correction is applied. You can re-detect or adjust the original corners."
                    : "Green lines show the detected physical page. Confirm them before cropping."
                  : "No confident boundary was found. Place the four corners manually around the page."}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${pages[selected].detected ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"}`}>
              {pages[selected].detected ? "Boundary detected" : "Manual review needed"}
            </span>
            {pages[selected].detected && Number.isFinite(pages[selected].detectionConfidence) ? <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-600 dark:bg-navy-800 dark:text-navy-300" title="Algorithmic boundary score, not a probability">Edge score {pages[selected].detectionConfidence.toFixed(2)}</span> : null}
          </div>
          <div className="mx-auto mt-5 flex max-w-3xl justify-center overflow-auto rounded-2xl bg-black p-2">
            <div className="relative inline-block max-w-full">
              <img src={pages[selected].cropApplied ? pages[selected].data : (pages[selected].sourceData || pages[selected].data)} alt={`Document analysis for page ${selected + 1}`} className="block max-h-[65vh] max-w-full select-none" draggable="false" />
              {!pages[selected].cropApplied && pages[selected].detectedCrop ? (
                <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <polygon points={pages[selected].detectedCrop.map(([x,y]) => `${x*100},${y*100}`).join(" ")} fill="rgba(34,197,94,.10)" stroke="rgb(34 197 94)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
                  {pages[selected].detectedCrop.map(([x,y],index) => <circle key={index} cx={x*100} cy={y*100} r="1.8" fill="rgb(22 163 74)" stroke="white" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />)}
                </svg>
              ) : null}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {pages[selected].detected && !pages[selected].cropApplied ? <button type="button" className="mz-btn-primary" onClick={applyDetectedCrop} disabled={busy}>Apply Auto Crop</button> : null}
            <button type="button" className="mz-btn-secondary" onClick={openCrop}>Adjust Manually</button>
            <button type="button" className="mz-btn-secondary" onClick={redetect} disabled={busy}>Auto Detect</button>
            {!pages[selected].cropApplied ? <button type="button" className="mz-btn-ghost" onClick={useFullPhoto} disabled={busy}>Use Full Photo</button> : null}
            <button type="button" className="mz-btn-secondary" onClick={rotate} disabled={busy}><RotateCw className="h-4 w-4" /> Rotate</button>
            {pages[selected].cropApplied ? <button type="button" className="mz-btn-secondary" onClick={()=>setCompareOpen((value)=>!value)}>{compareOpen ? "Hide comparison" : "Before / After"}</button> : null}
            <button type="button" className="mz-btn-secondary" onClick={undoPage} disabled={!pages[selected].history?.length}>Undo</button>
            <button type="button" className="mz-btn-secondary" onClick={redoPage} disabled={!pages[selected].future?.length}>Redo</button>
            <button type="button" className="mz-btn-ghost" onClick={remove}>Retake / Remove</button>
          </div>
          {compareOpen && pages[selected].cropApplied ? <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Before and after comparison"><figure className="overflow-hidden rounded-2xl border border-navy-100 bg-white p-2 dark:border-navy-800 dark:bg-navy-900"><img src={pages[selected].sourceData || pages[selected].data} alt="Original uploaded document photo" className="max-h-[42vh] w-full object-contain"/><figcaption className="px-2 pb-1 pt-2 text-xs font-semibold text-navy-500">Before · original photo</figcaption></figure><figure className="overflow-hidden rounded-2xl border border-brand-200 bg-white p-2 dark:border-brand-900 dark:bg-navy-900"><img src={pages[selected].data} alt="Current cropped and enhanced document result" className="max-h-[42vh] w-full object-contain"/><figcaption className="px-2 pb-1 pt-2 text-xs font-semibold text-brand-700 dark:text-brand-300">After · current result</figcaption></figure></div> : null}
        </section>
      )}
      {cropOpen && pages[selected] && (
        <div className="mz-scanner-pages">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-navy-900 dark:text-white">
                Manual crop
              </h2>
              <p className="text-sm text-navy-500">
                Drag the four corners, then apply the crop.
              </p>
            </div>
            <button
              className="mz-btn-secondary"
              onClick={() => setCropOpen(false)}
            >
              Cancel
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label="Manual crop zoom controls">
            <button type="button" className="mz-btn-secondary" onClick={() => setCropZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))} disabled={cropZoom <= 1}>Zoom out</button>
            <span className="min-w-16 text-center text-sm font-bold text-navy-600 dark:text-navy-300">{Math.round(cropZoom * 100)}%</span>
            <button type="button" className="mz-btn-secondary" onClick={() => setCropZoom((value) => Math.min(2.5, Number((value + 0.25).toFixed(2))))} disabled={cropZoom >= 2.5}>Zoom in</button>
          </div>
          <div className="mx-auto mt-3 max-h-[72vh] max-w-4xl overflow-auto rounded-2xl bg-black p-2">
            <div className="relative mx-auto" style={{ width: `${cropZoom * 100}%` }}>
            <img
              src={pages[selected].sourceData || pages[selected].data}
              alt="Manual crop preview from the original photo"
              className="block h-auto w-full select-none"
              draggable="false"
            />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polygon points={crop.map(([x,y]) => `${x*100},${y*100}`).join(" ")} fill="rgba(34,197,94,.10)" stroke="rgb(34 197 94)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="pointer-events-none absolute inset-0">
              {crop.map(([x, y], i) => (
                <button
                  key={i}
                  aria-label={`Move crop corner ${i + 1}`}
                  onPointerDown={(e) => {
                    const handle = e.currentTarget;
                    const cropOverlay = handle.parentElement;
                    if (!cropOverlay) return;
                    const r = cropOverlay.getBoundingClientRect();
                    handle.setPointerCapture?.(e.pointerId);
                    const moveEv = (ev) => {
                      const nx = clamp(
                          (ev.clientX - r.left) / r.width,
                          0.01,
                          0.99,
                        ),
                        ny = clamp((ev.clientY - r.top) / r.height, 0.01, 0.99);
                      setCrop((a) =>
                        a.map((pt, j) => (j === i ? [nx, ny] : pt)),
                      );
                    };
                    const up = () => {
                      window.removeEventListener("pointermove", moveEv);
                      window.removeEventListener("pointerup", up);
                    };
                    window.addEventListener("pointermove", moveEv);
                    window.addEventListener("pointerup", up);
                  }}
                  style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                  className="pointer-events-auto absolute -ml-5 -mt-5 h-10 w-10 touch-none rounded-full border-2 border-white bg-brand-600 shadow-lg sm:-ml-4 sm:-mt-4 sm:h-8 sm:w-8"
                />
              ))}
            </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              className="mz-btn-secondary"
              onClick={() =>
                setCrop([
                  [0.03, 0.03],
                  [0.97, 0.03],
                  [0.97, 0.97],
                  [0.03, 0.97],
                ])
              }
            >
              Reset Crop
            </button>
            <button
              className="mz-btn-primary"
              onClick={applyCrop}
              disabled={busy}
            >
              Apply Manual Crop
            </button>
          </div>
        </div>
      )}{" "}
      {pages.length > 0 && (
        <div className="mz-scanner-pages">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-navy-900 dark:text-white">
                Scanned pages
              </h2>
              <p className="text-sm text-navy-500">
                {pages.length} page{pages.length > 1 ? "s" : ""} · processed
                locally
              </p>
            </div>
            <button
              className="mz-btn-secondary"
              onClick={() => {
                setPages([]);
                setSelected(0);
                setOcrText("");
                setMessage("");
                setError("");
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              Clear all
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelected(i)}
                className={`overflow-hidden rounded-2xl border text-left ${selected === i ? "border-brand-500 ring-2 ring-brand-200" : "border-navy-100 dark:border-navy-800"}`}
              >
                <img
                  src={p.data}
                  alt={`Scanned page ${i + 1}`}
                  className="aspect-[3/4] w-full object-contain bg-slate-100 dark:bg-navy-950"
                />
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm font-semibold">Page {i + 1}</span>
                  <span className={`text-xs font-semibold ${p.cropApplied ? "text-emerald-600" : "text-amber-600"}`}>
                    {p.cropApplied ? "Ready" : "Review"} · {p.width}×{p.height}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {hasUnreviewedPages ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Review each page before creating PDF/JPG output. Select a page and apply Auto Crop, Manual Crop, or Use Full Photo.</p> : null}
          <div className="mt-4 grid gap-3 rounded-2xl border border-navy-100 bg-white/70 p-3 sm:grid-cols-2 dark:border-navy-800 dark:bg-navy-900/50"><label className="text-xs font-bold uppercase tracking-wide text-navy-500">PDF page size<select className="mz-input mt-2" value={pdfSize} onChange={(e)=>setPdfSize(e.target.value)}><option value="a4">A4</option><option value="letter">US Letter</option></select></label><label className="text-xs font-bold uppercase tracking-wide text-navy-500">PDF margins<select className="mz-input mt-2" value={pdfMargin} onChange={(e)=>setPdfMargin(e.target.value)}><option value="none">None</option><option value="small">Small</option><option value="normal">Normal</option></select></label></div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="mz-btn-secondary" onClick={openCrop}>
              Crop
            </button>
            <button
              className="mz-btn-secondary"
              onClick={() => move(-1)}
              disabled={selected === 0}
            >
              Move Left
            </button>
            <button
              className="mz-btn-secondary"
              onClick={() => move(1)}
              disabled={selected === pages.length - 1}
            >
              Move Right
            </button>
            <button className="mz-btn-secondary" onClick={rotate}>
              <RotateCw className="h-4 w-4" />
              Rotate
            </button>
            <button className="mz-btn-secondary" onClick={remove}>
              <Trash2 className="h-4 w-4" />
              Delete Page
            </button>
            <button className="mz-btn-primary" onClick={pdf} disabled={busy || hasUnreviewedPages}>
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              className="mz-btn-secondary"
              onClick={runOcr}
              disabled={ocrBusy}
            >
              {ocrBusy ? "OCR…" : "OCR Page"}
            </button>
            <button
              className="mz-btn-secondary"
              onClick={exportSearchablePdf}
              disabled={busy || hasUnreviewedPages}
            >
              Searchable PDF
            </button>
            <button className="mz-btn-secondary" onClick={() => downloadPageImages("jpg")} disabled={busy || hasUnreviewedPages}>
              <ImageIcon className="h-4 w-4" />
              Download JPG
            </button>
            <button className="mz-btn-secondary" onClick={() => downloadPageImages("png")} disabled={busy || hasUnreviewedPages}>
              <ImageIcon className="h-4 w-4" />
              Download PNG
            </button>
            <button
              className="mz-btn-secondary"
              onClick={start}
              disabled={!cameraSupported}
            >
              <Plus className="h-4 w-4" />
              Add Page
            </button>
          </div>
        </div>
      )}
      {ocrText && (
        <div className="rounded-2xl border border-navy-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-navy-900 dark:text-white">
              Extracted text
            </h3>
            <button
              className="mz-btn-ghost"
              onClick={() => navigator.clipboard?.writeText(ocrText)}
            >
              Copy
            </button>
          </div>
          <textarea
            className="mz-input min-h-40"
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
          />
          <button
            className="mz-btn-secondary mt-3"
            onClick={() => downloadBlob(new Blob([ocrText], { type: "text/plain" }), "ocr-text.txt")}
          >
            Download TXT
          </button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="mz-mini-feature">
          <Wand2 />
          <b>Edge detection</b>
          <span>
            Contrast-based boundary detection with a full-image fallback.
          </span>
        </div>
        <div className="mz-mini-feature">
          <RotateCw />
          <b>Perspective correction</b>
          <span>
            Detected corners are mapped to a straight page before export.
          </span>
        </div>
        <div className="mz-mini-feature">
          <Upload />
          <b>Browser-first</b>
          <span>Camera/photo processing happens locally in this scanner.</span>
        </div>
      </div>
    </div>
  );
}
