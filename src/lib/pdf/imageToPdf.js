import { PDFDocument } from "pdf-lib";

/** Standard page sizes in PDF points (1pt = 1/72 inch), portrait. */
export const PAGE_SIZES = {
  a4: { label: "A4", width: 595.28, height: 841.89 },
  letter: { label: "US Letter", width: 612, height: 792 },
  a5: { label: "A5", width: 419.53, height: 595.28 },
};

/**
 * Computes the page box and the image's drawn rectangle inside it.
 * Pure maths — unit-tested directly.
 *
 * pageSize "auto" keeps the original Phase 3 behaviour: the page is exactly
 * the size of the image. Any named size fits the image inside the page
 * (preserving its aspect ratio), centred, with `margin` points of whitespace
 * on every side.
 */
export function computePageLayout(
  imageWidth,
  imageHeight,
  { pageSize = "auto", orientation = "auto", margin = 0, fit = "contain" } = {}
) {
  if (!(imageWidth > 0) || !(imageHeight > 0)) {
    throw new Error("Image dimensions could not be read — the file may be corrupted.");
  }

  if (pageSize === "auto") {
    return {
      pageWidth: imageWidth,
      pageHeight: imageHeight,
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight,
    };
  }

  const preset = PAGE_SIZES[String(pageSize).toLowerCase()];
  if (!preset) {
    throw new Error(`"${pageSize}" is not a supported page size.`);
  }

  const landscape =
    orientation === "landscape" || (orientation === "auto" && imageWidth > imageHeight);

  const pageWidth = landscape ? preset.height : preset.width;
  const pageHeight = landscape ? preset.width : preset.height;

  const safeMargin = Math.max(
    0,
    Math.min(Number(margin) || 0, Math.min(pageWidth, pageHeight) / 2 - 1)
  );
  const boxWidth = pageWidth - safeMargin * 2;
  const boxHeight = pageHeight - safeMargin * 2;

  if (!["contain", "fill"].includes(fit)) throw new Error("Image fit must be contain or fill.");
  const scale = fit === "fill"
    ? Math.max(boxWidth / imageWidth, boxHeight / imageHeight)
    : Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    pageWidth,
    pageHeight,
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
    width,
    height,
  };
}

/**
 * images: [{ bytes: Uint8Array, type: "image/jpeg" | "image/png" }]
 *
 * By default (no options) each image becomes its own page sized to the image's
 * natural dimensions — unchanged from Phase 3. Pass `{ pageSize: "a4" }` to fit
 * images onto standard pages instead.
 */
export async function imagesToPdf(images, options = {}) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("Add at least one image.");
  }

  const doc = await PDFDocument.create();

  for (const [i, img] of images.entries()) {
    let embedded;
    try {
      if (img.type === "image/png") {
        embedded = await doc.embedPng(img.bytes);
      } else if (img.type === "image/jpeg" || img.type === "image/jpg") {
        embedded = await doc.embedJpg(img.bytes);
      } else {
        throw new Error("unsupported");
      }
    } catch {
      throw new Error(`Image #${i + 1} could not be read — please use a JPG or PNG file.`);
    }

    const layout = computePageLayout(embedded.width, embedded.height, options);
    const page = doc.addPage([layout.pageWidth, layout.pageHeight]);
    page.drawImage(embedded, {
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
    });
  }

  return doc.save();
}
