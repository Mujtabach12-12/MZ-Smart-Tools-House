import { rgb, degrees, StandardFonts } from "pdf-lib";
import { loadPdfDocument } from "./core.js";

/**
 * Adds a diagonal, semi-transparent text watermark to every page.
 */
export async function addWatermark(bytes, text, options = {}) {
  if (!text || !text.trim()) throw new Error("Enter watermark text.");

  const { opacity = 0.3, fontSize = 48, color = { r: 0.5, g: 0.5, b: 0.5 } } = options;
  const doc = await loadPdfDocument(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(45),
    });
  }

  return doc.save();
}
