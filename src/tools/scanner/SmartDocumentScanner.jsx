import { useEffect, useRef, useState } from "react";
import {
  Camera, CameraOff, Download, Image as ImageIcon, Plus, RefreshCcw, RotateCw,
  Trash2, Upload, ArrowLeft, ArrowRight, CheckCircle2, FileDown, ScanLine,
  SlidersHorizontal, SwitchCamera, Zap, GripVertical,
} from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { downloadBlob, downloadBytes } from "../../lib/download";
import { recognizeImage } from "../../lib/ocr";
import { loadImage as decodeImage, browserImageDeps } from "../../lib/image/canvas.js";
import { convertImage } from "../../lib/image/process.js";
import { createFileAsset, attachImageMetadata } from "../../lib/files/fileAsset.js";
import { assertFileSignature } from "../../lib/files/signatures.js";
import { validateImageOutput, validatePdfOutput } from "../../lib/files/outputValidation.js";
import {
  detectDocumentBoundary, normalizeCorners, validateDocumentCorners,
} from "../../lib/scanner/detectDocument";
import {
  SCANNER_DETECTION_MAX_SIDE, SCANNER_PREVIEW_MAX_SIDE, createRotatedProxy,
  drawRotatedMaster, dimensionsAfterRotation, normalizedPointsToPixels,
  warpPerspective, canvasToBlob as scannerCanvasToBlob,
} from "../../lib/scanner/qualityPipeline.js";

const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const ACCEPTED_SCANNER_MIMES = ["image/jpeg", "image/png", "image/webp"];

function snapshotPage(page) {
  return {
    detectedCrop: page.detectedCrop, detected: page.detected, detectionConfidence: page.detectionConfidence,
    cropApplied: page.cropApplied, filterApplied: page.filterApplied, filterMode: page.filterMode,
    brightness: page.brightness, contrast: page.contrast, sharpen: page.sharpen, rotation: page.rotation,
  };
}
function withPageHistory(page, next) {
  return { ...next, history: [...(page.history || []), snapshotPage(page)].slice(-16), future: [] };
}

function autoBounds(canvas) {
  const image = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
  return detectDocumentBoundary(image.data, canvas.width, canvas.height);
}

function revokePageUrls(page) {
  for (const url of [page?.sourceData, page?.outputUrl, page?.thumbnailUrl]) {
    if (typeof url === "string" && url.startsWith("blob:")) {
      try { URL.revokeObjectURL(url); } catch { /* best effort */ }
    }
  }
}

async function analyzeMaster(asset, rotation = 0) {
  const decoded = await decodeImage(asset.original);
  try {
    const proxy = createRotatedProxy(decoded.source, decoded.width, decoded.height, rotation, SCANNER_DETECTION_MAX_SIDE);
    const detection = autoBounds(proxy);
    const full = [[0, 0], [proxy.width, 0], [proxy.width, proxy.height], [0, proxy.height]];
    const normalized = normalizeCorners(detection?.corners || full, proxy.width, proxy.height);
    const oriented = dimensionsAfterRotation(decoded.width, decoded.height, rotation);
    return { detection, normalized, oriented, proxy };
  } finally {
    decoded?.close?.();
  }
}

async function displayUrlForAsset(_asset, _rotation, analysisProxy) {
  // Always display a bounded proxy. The immutable original remains the master
  // for perspective correction and export, so camera-sized images do not need
  // to be decoded at full resolution merely to draw the crop UI.
  const blob = await scannerCanvasToBlob(analysisProxy, "image/jpeg", 0.94);
  return URL.createObjectURL(blob); // display-only preview; never used for export
}

export default function SmartDocumentScanner() {
  const video = useRef(null);
  const stream = useRef(null);
  const input = useRef(null);
  const pagesRef = useRef([]);
  const pendingReplaceRef = useRef(null);
  const dragIndexRef = useRef(null);

  const [camera, setCamera] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);
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

  const stop = (cancelPendingReplacement = true) => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setTorchOn(false);
    setTorchSupported(false);
    setCamera(false);
    if (cancelPendingReplacement) pendingReplaceRef.current = null;
  };

  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => () => {
    stop();
    pagesRef.current.forEach(revokePageUrls);
  }, []);

  useEffect(() => {
    const page = pages[selected];
    if (!page || workflowStep !== "filter") {
      setPreviewData("");
      setPreviewBusy(false);
      return undefined;
    }
    let cancelled = false;
    let previewUrl = "";
    const frame = window.requestAnimationFrame(async () => {
      setPreviewBusy(true);
      let decoded;
      try {
        decoded = await decodeImage(page.asset.original);
        const proxy = createRotatedProxy(decoded.source, decoded.width, decoded.height, page.rotation || 0, SCANNER_PREVIEW_MAX_SIDE);
        const raw = normalizedPointsToPixels(page.detectedCrop || [[0,0],[1,0],[1,1],[0,1]], proxy.width, proxy.height);
        const points = validateDocumentCorners(raw, proxy.width, proxy.height, 0.001) || [[0,0],[proxy.width,0],[proxy.width,proxy.height],[0,proxy.height]];
        const preview = await warpPerspective(proxy, points, mode, { brightness, contrast, sharpen }, { maxSide: SCANNER_PREVIEW_MAX_SIDE, maxPixels: 1_500_000, yieldEveryRows: 0 });
        const blob = await scannerCanvasToBlob(preview.canvas, "image/jpeg", 0.92);
        if (!cancelled) {
          previewUrl = URL.createObjectURL(blob);
          setPreviewData(previewUrl);
        }
      } catch {
        if (!cancelled) setPreviewData(page.data || page.sourceData || "");
      } finally {
        decoded?.close?.();
        if (!cancelled) setPreviewBusy(false);
      }
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [
    workflowStep, selected, pages[selected]?.id, pages[selected]?.asset, pages[selected]?.rotation,
    pages[selected]?.detectedCrop, mode, brightness, contrast, sharpen,
  ]);

  const start = async (requestedFacing = null) => {
    const desiredFacing = typeof requestedFacing === "string" ? requestedFacing : facingMode;
    setError("");
    setMessage("");
    setWorkflowStep("capture");
    try {
      if (!window.isSecureContext) {
        throw Error("Camera access requires HTTPS. Choose a photo from your device instead.");
      }
      if (!cameraSupported) {
        throw Error("Camera access is not supported by this browser. Choose a photo from your device instead.");
      }
      stop(false);
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: desiredFacing },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      stream.current = nextStream;
      setFacingMode(desiredFacing);
      const track = nextStream.getVideoTracks?.()[0];
      const capabilities = track?.getCapabilities?.() || {};
      setTorchSupported(Boolean(capabilities.torch));
      try {
        const devices = await navigator.mediaDevices.enumerateDevices?.();
        setCanSwitchCamera((devices || []).filter((device) => device.kind === "videoinput").length > 1);
      } catch {
        setCanSwitchCamera(false);
      }
      setCamera(true);
      requestAnimationFrame(() => {
        if (video.current) video.current.srcObject = nextStream;
      });
    } catch (e) {
      pendingReplaceRef.current = null;
      const msg =
        e.name === "NotAllowedError"
          ? "Camera permission was denied or blocked. Allow camera access in your browser settings, or choose a photo instead."
          : e.name === "NotFoundError"
            ? "No camera was found on this device. Choose a photo instead."
            : e.name === "NotReadableError"
              ? "The camera is busy or unavailable. Close other camera apps and try again."
              : e.name === "OverconstrainedError"
                ? "This camera cannot use the requested capture settings. Try switching camera or choose a photo instead."
                : e.message || "Unable to access the camera.";
      setError(msg);
    }
  };

  const switchCamera = async () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    await start(nextFacing);
  };

  const toggleTorch = async () => {
    const track = stream.current?.getVideoTracks?.()[0];
    if (!track || !torchSupported) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
      setTorchOn(false);
      setError("Flash is not available for the active camera on this device.");
    }
  };

  const process = async (blob, name, { replaceIndex = null } = {}) => {
    setBusy(true);
    setError("");
    setMessage("Detecting document edges…");
    try {
      if (!(blob instanceof Blob)) throw new Error("The captured image could not be read.");
      if (blob.size > 40 * 1024 * 1024) {
        throw new Error("This image is larger than 40 MB. The original is preserved, but browser processing at this size is not reliable.");
      }
      await assertFileSignature(blob, ACCEPTED_SCANNER_MIMES);
      let asset = createFileAsset(blob, { kind: "image", filename: name, mimeType: blob.type });
      const analysis = await analyzeMaster(asset, 0);
      asset = attachImageMetadata(asset, analysis.oriented.width, analysis.oriented.height);
      const sourceData = await displayUrlForAsset(asset, 0, analysis.proxy);
      const replacing = Number.isInteger(replaceIndex) && replaceIndex >= 0 && replaceIndex < pages.length;
      const nextIndex = replacing ? replaceIndex : pages.length;
      const nextPage = {
        id: replacing ? pages[replaceIndex].id : crypto.randomUUID(), asset, data: sourceData, sourceData, outputBlob: null, outputUrl: null, thumbnailUrl: null,
        detectedCrop: analysis.normalized, detected: Boolean(analysis.detection?.corners),
        detectionConfidence: analysis.detection?.confidence || 0, cropApplied: false, filterApplied: false,
        filterMode: "auto", brightness: 0, contrast: 0, sharpen: 0, rotation: 0, name,
        orientedWidth: analysis.oriented.width, orientedHeight: analysis.oriented.height,
        width: analysis.oriented.width, height: analysis.oriented.height, history: [], future: [],
      };
      if (replacing) {
        revokePageUrls(pages[replaceIndex]);
        setPages((current) => current.map((item, index) => index === replaceIndex ? nextPage : item));
      } else {
        setPages((current) => [...current, nextPage]);
      }
      setSelected(nextIndex);
      setCrop(analysis.normalized);
      setMode("auto"); setBrightness(0); setContrast(0); setSharpen(0); setOcrText("");
      setWorkflowStep("crop");
      setMessage(
        analysis.detection?.corners
          ? "Auto crop is ready. Drag any corner directly if it needs correction, then continue."
          : "Document boundary could not be detected confidently. The four corners are already editable—place them around the document, then continue.",
      );
    } catch (e) {
      setError(e.message || "Unable to process this image.");
    } finally {
      setBusy(false);
    }
  };

  const capture = async () => {
    const currentVideo = video.current;
    const track = stream.current?.getVideoTracks?.()[0];
    if (!track && !currentVideo?.videoWidth) return;
    setBusy(true);
    setError("");
    try {
      let blob = null;
      if (track && typeof window.ImageCapture === "function") {
        try {
          const captureDevice = new window.ImageCapture(track);
          blob = await captureDevice.takePhoto();
        } catch {
          // Some browsers expose ImageCapture but do not support takePhoto for
          // the current camera. Fall back to the video frame below.
        }
      }
      if (!blob) {
        if (!currentVideo?.videoWidth) throw new Error("The camera is not ready yet.");
        const canvas = document.createElement("canvas");
        canvas.width = currentVideo.videoWidth;
        canvas.height = currentVideo.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(currentVideo, 0, 0);
        blob = await scannerCanvasToBlob(canvas, "image/jpeg", 0.96);
      }
      const replaceIndex = pendingReplaceRef.current;
      pendingReplaceRef.current = null;
      stop(false);
      await process(blob, `page-${Number.isInteger(replaceIndex) ? replaceIndex + 1 : pages.length + 1}.${blob.type === "image/png" ? "png" : "jpg"}`, { replaceIndex });
    } catch (e) {
      setError(e.message || "Unable to capture this document.");
    } finally {
      setBusy(false);
    }
  };

  const choose = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!ACCEPTED_SCANNER_MIMES.includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    process(file, file.name);
    event.target.value = "";
  };

  const retakeSelected = async () => {
    if (!selectedPage) return;
    if (!cameraSupported) {
      setError("Camera access is unavailable in this browser. Delete this page and choose another photo instead.");
      return;
    }
    pendingReplaceRef.current = selected;
    await start(facingMode);
  };

  const redetect = async () => {
    const page = pages[selected];
    if (!page) return;
    setBusy(true);
    setError("");
    setMessage("Detecting document edges again…");
    try {
      const analysis = await analyzeMaster(page.asset, page.rotation || 0);
      if (page.outputUrl) URL.revokeObjectURL(page.outputUrl);
      if (page.thumbnailUrl) URL.revokeObjectURL(page.thumbnailUrl);
      setPages((items) => items.map((item, index) => index === selected
        ? withPageHistory(item, {
            ...item, data: item.sourceData, outputBlob: null, outputUrl: null, thumbnailUrl: null,
            detected: Boolean(analysis.detection?.corners), detectionConfidence: analysis.detection?.confidence || 0,
            detectedCrop: analysis.normalized, cropApplied: false, filterApplied: false,
            orientedWidth: analysis.oriented.width, orientedHeight: analysis.oriented.height,
            width: analysis.oriented.width, height: analysis.oriented.height,
          }) : item));
      setCrop(analysis.normalized);
      setMessage(analysis.detection?.corners
        ? "Boundary detected again. Drag a corner if needed, then confirm the crop."
        : "No confident boundary was found. Adjust the four corners directly on the image.");
    } catch (e) {
      setError(e.message || "Unable to analyze this image.");
    } finally { setBusy(false); }
  };

  const rotatePage = async (pageIndex = selected) => {
    const page = pages[pageIndex];
    if (!page || busy) return;
    setBusy(true); setError("");
    try {
      const nextRotation = ((page.rotation || 0) + 90) % 360;
      const analysis = await analyzeMaster(page.asset, nextRotation);
      const sourceData = await displayUrlForAsset(page.asset, nextRotation, analysis.proxy);
      if (page.sourceData) URL.revokeObjectURL(page.sourceData);
      if (page.outputUrl) URL.revokeObjectURL(page.outputUrl);
      if (page.thumbnailUrl) URL.revokeObjectURL(page.thumbnailUrl);
      setPages((items) => items.map((item, index) => index === pageIndex
        ? withPageHistory(item, {
            ...item, sourceData, data: sourceData, outputBlob: null, outputUrl: null, thumbnailUrl: null, rotation: nextRotation,
            orientedWidth: analysis.oriented.width, orientedHeight: analysis.oriented.height,
            width: analysis.oriented.width, height: analysis.oriented.height, detectedCrop: analysis.normalized,
            detected: Boolean(analysis.detection?.corners), detectionConfidence: analysis.detection?.confidence || 0,
            cropApplied: false, filterApplied: false,
          }) : item));
      setSelected(pageIndex);
      setCrop(analysis.normalized);
      setWorkflowStep("crop");
      setMessage("Page rotated from the preserved original. Review the detected crop before continuing.");
    } catch (e) {
      setError(e.message || "Unable to rotate this page.");
    } finally { setBusy(false); }
  };

  const confirmCrop = async () => {
    const page = pages[selected];
    if (!page) return;
    setBusy(true); setError("");
    try {
      const rawPoints = normalizedPointsToPixels(crop, page.orientedWidth, page.orientedHeight);
      const points = validateDocumentCorners(rawPoints, page.orientedWidth, page.orientedHeight);
      if (!points) throw new Error("The crop corners overlap or form an invalid page shape. Move the four handles apart and try again.");
      const normalized = normalizeCorners(points, page.orientedWidth, page.orientedHeight);
      if (page.outputUrl) URL.revokeObjectURL(page.outputUrl);
      if (page.thumbnailUrl) URL.revokeObjectURL(page.thumbnailUrl);
      setPages((items) => items.map((item, index) => index === selected
        ? withPageHistory(item, {
            ...item, data: item.sourceData, outputBlob: null, outputUrl: null, thumbnailUrl: null, detectedCrop: normalized,
            cropApplied: true, filterApplied: false, width: item.orientedWidth, height: item.orientedHeight,
          }) : item));
      setCrop(normalized);
      setMode(page.filterMode || "auto"); setBrightness(page.brightness || 0); setContrast(page.contrast || 0); setSharpen(page.sharpen || 0);
      setWorkflowStep("filter");
      setMessage("Crop confirmed. The high-resolution master is still untouched; now choose the page enhancement.");
    } catch (e) {
      setError(e.message || "Unable to crop this page.");
    } finally { setBusy(false); }
  };

  const applyEnhancementAndContinue = async () => {
    const page = pages[selected];
    if (!page?.cropApplied || !page.detectedCrop) {
      setError("Confirm the crop before applying a filter."); setWorkflowStep("crop"); return;
    }
    setBusy(true); setError("");
    let decoded;
    try {
      decoded = await decodeImage(page.asset.original);
      const master = drawRotatedMaster(decoded.source, decoded.width, decoded.height, page.rotation || 0);
      const raw = normalizedPointsToPixels(page.detectedCrop, master.width, master.height);
      const points = validateDocumentCorners(raw, master.width, master.height, 0.001);
      if (!points) throw new Error("The saved crop boundary is invalid. Review the crop again.");
      const output = await warpPerspective(master, points, mode, { brightness, contrast, sharpen });
      // Page masters are stored losslessly as PNG. JPG is only produced later
      // when the user explicitly requests a JPG export.
      const outputBlob = await scannerCanvasToBlob(output.canvas, "image/png");
      await validateImageOutput(outputBlob, {
        expectedMime: "image/png", expectedWidth: output.width, expectedHeight: output.height, decodeImage,
      });
      const outputUrl = URL.createObjectURL(outputBlob);
      const thumbnailCanvas = createRotatedProxy(output.canvas, output.width, output.height, 0, 320);
      const thumbnailBlob = await scannerCanvasToBlob(thumbnailCanvas, "image/jpeg", 0.8);
      const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
      if (page.outputUrl) URL.revokeObjectURL(page.outputUrl);
      if (page.thumbnailUrl) URL.revokeObjectURL(page.thumbnailUrl);
      setPages((items) => items.map((item, index) => index === selected
        ? withPageHistory(item, {
            ...item, data: outputUrl, outputBlob, outputUrl, thumbnailUrl, width: output.width, height: output.height,
            filterApplied: true, filterMode: mode, brightness, contrast, sharpen,
          }) : item));
      setWorkflowStep("export");
      setMessage(`Page ${selected + 1} is ready at ${output.width} × ${output.height}px from the high-resolution master.`);
    } catch (e) {
      setError(e.message || "Unable to apply enhancements.");
    } finally { decoded?.close?.(); setBusy(false); }
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
    revokePageUrls(pages[index]);
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

  const reorderPage = (from, to) => {
    if (from === to || from < 0 || to < 0 || from >= pages.length || to >= pages.length) return;
    setPages((items) => {
      const copy = [...items];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
    setSelected(to);
    setMessage(`Page moved to position ${to + 1}.`);
  };

  const movePage = (index, direction) => reorderPage(index, index + direction);

  const runOcr = async () => {
    const page = pages[selected];
    if (!page) return;
    setOcrBusy(true);
    setError("");
    setMessage("Recognizing text locally…");
    try {
      const text = await recognizeImage(page.outputBlob || page.asset.original, "eng", () => {});
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
    setBusy(true); setError("");
    try {
      const doc = await PDFDocument.create();
      for (const [index, pageData] of pages.entries()) {
        if (!(pageData.outputBlob instanceof Blob)) throw new Error(`Page ${index + 1} has no validated high-quality master.`);
        const bytes = new Uint8Array(await pageData.outputBlob.arrayBuffer());
        const image = pageData.outputBlob.type === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const { width, height, margin } = pdfLayout();
        const page = doc.addPage([width, height]);
        const scale = Math.min((width - margin * 2) / image.width, (height - margin * 2) / image.height);
        const imageWidth = image.width * scale;
        const imageHeight = image.height * scale;
        page.drawImage(image, { x: (width - imageWidth) / 2, y: (height - imageHeight) / 2, width: imageWidth, height: imageHeight });
      }
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const validation = await validatePdfOutput(pdfBytes, { expectedPageCount: pages.length });
      await downloadBytes(pdfBytes, "mz-smart-scans.pdf", "application/pdf");
      setMessage(`Validated ${validation.pageCount}-page high-quality PDF exported successfully.`);
    } catch (e) {
      setError(e.message || "Unable to export PDF.");
    } finally { setBusy(false); }
  };

  const exportSearchablePdf = async () => {
    if (!pages.length || hasUnreviewedPages) {
      setError("Finish crop and filter steps for every page before exporting.");
      return;
    }
    setBusy(true); setError("");
    try {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont("Helvetica");
      for (const [index, pageData] of pages.entries()) {
        if (!(pageData.outputBlob instanceof Blob)) throw new Error(`Page ${index + 1} has no validated high-quality master.`);
        const bytes = new Uint8Array(await pageData.outputBlob.arrayBuffer());
        const image = pageData.outputBlob.type === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const { width, height, margin } = pdfLayout();
        const page = doc.addPage([width, height]);
        const scale = Math.min((width - margin * 2) / image.width, (height - margin * 2) / image.height);
        const imageWidth = image.width * scale;
        const imageHeight = image.height * scale;
        page.drawImage(image, { x: (width - imageWidth) / 2, y: (height - imageHeight) / 2, width: imageWidth, height: imageHeight });
        const text = pageData.id === pages[selected]?.id && ocrText
          ? ocrText
          : await recognizeImage(pageData.outputBlob, "eng");
        if (text.trim()) {
          const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
          let y = 26;
          for (const line of lines.slice(0, 220)) {
            if (y > height - 22) break;
            page.drawText(line.slice(0, 180), { x: 24, y, size: 5, font, color: rgb(1, 1, 1), opacity: 0.01, maxWidth: width - 48 });
            y += 6.5;
          }
        }
      }
      const bytes = await doc.save({ useObjectStreams: true });
      await validatePdfOutput(bytes, { expectedPageCount: pages.length });
      await downloadBytes(bytes, "mz-searchable-scan.pdf", "application/pdf");
      setMessage("Validated searchable PDF exported successfully.");
    } catch (e) {
      setError(e.message || "Unable to create searchable PDF.");
    } finally { setBusy(false); }
  };

  const downloadPageImages = async (format) => {
    if (!pages.length || hasUnreviewedPages) {
      setError("Finish crop and filter steps for every page before exporting.");
      return;
    }
    setBusy(true); setError("");
    try {
      const files = [];
      for (const [index, page] of pages.entries()) {
        if (!(page.outputBlob instanceof Blob)) throw new Error(`Page ${index + 1} has no validated high-quality master.`);
        let blob = page.outputBlob;
        let extension = "png";
        let mime = "image/png";
        if (format === "jpg") {
          const source = new File([page.outputBlob], `scan-${index + 1}.png`, { type: page.outputBlob.type || "image/png" });
          const converted = await convertImage(source, { format: "jpeg", quality: 0.95, background: "#ffffff" }, browserImageDeps);
          blob = converted.blob; extension = "jpg"; mime = "image/jpeg";
        }
        const validation = await validateImageOutput(blob, { expectedMime: mime, expectedWidth: page.width, expectedHeight: page.height, decodeImage });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        files.push({ bytes, name: `scan-${index + 1}.${extension}`, mime, validation });
      }
      if (files.length === 1) {
        await downloadBytes(files[0].bytes, files[0].name, files[0].mime);
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        files.forEach((file) => zip.file(file.name, file.bytes));
        const zipBytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
        const verified = await JSZip.loadAsync(zipBytes);
        if (Object.keys(verified.files).filter((name) => !verified.files[name].dir).length !== files.length) {
          throw new Error("Image ZIP validation failed before download.");
        }
        await downloadBytes(zipBytes, `mz-scans-${format}.zip`, "application/zip");
      }
      setMessage(files.length === 1 ? `${format.toUpperCase()} image downloaded at full processed resolution.` : `${files.length} ${format.toUpperCase()} pages prepared at full processed resolution.`);
    } catch (e) {
      setError(e.message || "Unable to export scanned images.");
    } finally { setBusy(false); }
  };

  const resetScan = () => {
    stop();
    pages.forEach(revokePageUrls);
    setPages([]); setSelected(0); setOcrText(""); setError(""); setMessage(""); setWorkflowStep("capture");
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
              <button className="mz-scanner-big-action is-primary" onClick={() => start()} disabled={busy}>
                <Camera />
                <strong>Open Camera</strong>
                <small>Use the rear camera</small>
              </button>
              <button className="mz-scanner-big-action" onClick={() => input.current?.click()} disabled={busy}>
                <Upload />
                <strong>Choose from Files</strong>
                <small>Open phone file manager · JPG, PNG or WebP</small>
              </button>
            </div>
          ) : (
            <div className="mz-scanner-camera-stage">
              <video ref={video} autoPlay playsInline muted />
              <div className="mz-scanner-camera-guide" aria-hidden="true"><span>Keep the document inside the guide</span></div>
              <div className="mz-scanner-camera-tools">
                {canSwitchCamera ? <button type="button" onClick={switchCamera} aria-label="Switch camera" title="Switch camera"><SwitchCamera /></button> : null}
                {torchSupported ? <button type="button" className={torchOn ? "is-active" : ""} onClick={toggleTorch} aria-label={torchOn ? "Turn flash off" : "Turn flash on"} title="Flash"><Zap /></button> : null}
              </div>
              <button onClick={capture} aria-label="Capture document" className="mz-scanner-shutter"><Camera /></button>
              <button onClick={() => stop(true)} className="mz-scanner-camera-close"><CameraOff /> Close</button>
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
            <button className="mz-btn-secondary" onClick={() => rotatePage(selected)} disabled={busy}><RotateCw className="h-4 w-4" /> Rotate</button>
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
            <button className="mz-btn-secondary" onClick={retakeSelected} disabled={busy || !cameraSupported}><Camera className="h-4 w-4" /> Retake</button>
            <button className="mz-btn-ghost" onClick={() => removePage(selected)} disabled={busy}><Trash2 className="h-4 w-4" /> Delete page</button>
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
            <p>Every mode updates a lightweight preview. Final processing is applied once to the high-resolution master when you continue.</p>
          </div>

          <div className="mz-scanner-filter-preview is-large">
            <img src={previewData || selectedPage.data} alt={`Filter preview page ${selected + 1}`} />
            <span>{previewBusy ? "Updating…" : "Live preview"}</span>
          </div>

          <div className="mz-scanner-filter-strip" role="group" aria-label="Document filters">
            {[
              ["original", "Original"],
              ["document", "Document"],
              ["grayscale", "Grayscale"],
              ["bw", "Black & White"],
              ["auto", "Enhanced"],
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

          {selectedPage?.outputUrl ? (
            <div className="mz-scanner-master-preview" aria-label={`High-quality preview of page ${selected + 1}`}>
              <div className="mz-scanner-master-preview-head">
                <div>
                  <strong>High-quality page preview</strong>
                  <span>Page {selected + 1} · {selectedPage.width} × {selectedPage.height}px</span>
                </div>
                <span className="mz-scanner-master-badge">MASTER OUTPUT</span>
              </div>
              <div className="mz-scanner-master-preview-stage">
                <img src={selectedPage.outputUrl} alt={`Processed high-quality scan page ${selected + 1}`} />
              </div>
              <p>The page manager below uses small thumbnails for speed. PDF and image exports use this full-resolution processed master.</p>
            </div>
          ) : null}

          <div className="mz-scanner-ready-grid">
            {pages.map((page, index) => (
              <article
                key={page.id}
                className={`mz-scanner-ready-page ${selected === index ? "is-selected" : ""}`}
                draggable
                onDragStart={() => { dragIndexRef.current = index; }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); const from = dragIndexRef.current; dragIndexRef.current = null; if (Number.isInteger(from)) reorderPage(from, index); }}
                onDragEnd={() => { dragIndexRef.current = null; }}
              >
                <button className="mz-scanner-ready-preview" onClick={() => setSelected(index)}>
                  <img src={page.thumbnailUrl || page.data} alt={`Ready scan page ${index + 1}`} />
                  <span>Page {index + 1}</span>
                  <i aria-hidden="true"><GripVertical /></i>
                </button>
                <div className="mz-scanner-ready-actions">
                  <button onClick={() => editCrop(index)}>Crop</button>
                  <button onClick={() => editFilter(index)}>Filter</button>
                  <button onClick={() => rotatePage(index)} aria-label={`Rotate page ${index + 1}`}><RotateCw /></button>
                  <button onClick={() => movePage(index, -1)} disabled={index === 0} aria-label={`Move page ${index + 1} earlier`}><ArrowLeft /></button>
                  <button onClick={() => movePage(index, 1)} disabled={index === pages.length - 1} aria-label={`Move page ${index + 1} later`}><ArrowRight /></button>
                  <button className="is-danger" onClick={() => removePage(index)} aria-label={`Delete page ${index + 1}`}><Trash2 /></button>
                </div>
              </article>
            ))}
          </div>

          <div className="mz-scanner-add-more">
            <button className="mz-scanner-add-card" onClick={() => input.current?.click()} disabled={busy}>
              <Plus />
              <strong>Add from Files</strong>
              <small>Open phone file manager and crop it next</small>
            </button>
            <button className="mz-scanner-add-card" onClick={() => start()} disabled={busy || !cameraSupported}>
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

          <button className="mz-btn-ghost mz-scanner-start-over" onClick={resetScan}>
            <RefreshCcw className="h-4 w-4" /> Start a new scan
          </button>
        </section>
      ) : null}
    </div>
  );
}
