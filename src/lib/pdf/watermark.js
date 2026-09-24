import { rgb, degrees, StandardFonts } from "pdf-lib";
import { loadPdfDocument, parsePageRanges } from "./core.js";

function hexToRgb(hex) {
  const normalized = String(hex || "#64748b").trim().replace(/^#/, "");
  const value = normalized.length === 3 ? normalized.split("").map((x)=>x+x).join("") : normalized;
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error("Choose a valid watermark color.");
  return { r: parseInt(value.slice(0,2),16)/255, g: parseInt(value.slice(2,4),16)/255, b: parseInt(value.slice(4,6),16)/255 };
}

export async function addWatermark(bytes, text, options = {}) {
  if (!text || !text.trim()) throw new Error("Enter watermark text.");
  const {
    opacity = 0.3,
    fontSize = 48,
    color = "#64748b",
    rotation = 45,
    position = "center",
    pagesInput = "all",
  } = options;
  const alpha = Math.max(0.05, Math.min(1, Number(opacity) || 0.3));
  const size = Math.max(8, Math.min(180, Number(fontSize) || 48));
  const angle = Math.max(-180, Math.min(180, Number(rotation) || 0));
  const parsedColor = typeof color === "string" ? hexToRgb(color) : color;
  const doc = await loadPdfDocument(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const indices = !pagesInput || String(pagesInput).trim().toLowerCase() === "all"
    ? doc.getPageIndices()
    : parsePageRanges(pagesInput, doc.getPageCount());

  for (const index of indices) {
    const page = doc.getPage(index);
    const { width, height } = page.getSize();
    const value = text.trim();
    const textWidth = font.widthOfTextAtSize(value, size);
    let x = width / 2 - textWidth / 2;
    let y = height / 2 - size / 2;
    if (position === "top") y = height - size * 1.7;
    if (position === "bottom") y = size * 0.8;
    if (position === "top") x = width / 2 - textWidth / 2;
    if (position === "bottom") x = width / 2 - textWidth / 2;
    page.drawText(value, { x, y, size, font, color: rgb(parsedColor.r, parsedColor.g, parsedColor.b), opacity: alpha, rotate: degrees(angle) });
  }
  return doc.save({ useObjectStreams: true });
}
