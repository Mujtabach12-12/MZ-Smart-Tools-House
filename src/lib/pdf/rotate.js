import { degrees } from "pdf-lib";
import { loadPdfDocument, parsePageRanges } from "./core.js";

/**
 * Rotates pages by a multiple of 90 degrees.
 * pagesInput: "" or "all" for every page, or a range string like "1,3-4".
 */
export async function rotatePdf(bytes, rotationDegrees, pagesInput = "all") {
  const validRotations = [90, 180, 270, -90];
  const rot = Number(rotationDegrees);
  if (!validRotations.includes(rot)) throw new Error("Rotation must be 90, 180 or 270 degrees.");

  const doc = await loadPdfDocument(bytes);
  const pageCount = doc.getPageCount();

  const indices =
    !pagesInput || pagesInput.trim().toLowerCase() === "all"
      ? doc.getPageIndices()
      : parsePageRanges(pagesInput, pageCount);

  for (const i of indices) {
    const page = doc.getPage(i);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rot + 360) % 360));
  }

  return doc.save();
}
