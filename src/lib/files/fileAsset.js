/**
 * MZ shared file lifecycle model.
 *
 * The original user-provided File/Blob is immutable for the lifetime of an
 * asset. Preview and output derivatives are stored separately so UI-sized
 * representations can never silently become export sources.
 */

const FILE_STATES = new Set(["idle", "validating", "ready", "processing", "success", "error", "cancelled"]);

export function getExtension(filename = "") {
  const name = String(filename);
  const dot = name.lastIndexOf(".");
  return dot > -1 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : "";
}

export function createFileAsset(original, metadata = {}) {
  if (!(original instanceof Blob)) throw new Error("A File or Blob is required.");
  if (original.size <= 0) throw new Error("The selected file is empty (0 bytes).");

  const filename = metadata.filename || original.name || "file";
  const mimeType = metadata.mimeType || original.type || "application/octet-stream";
  return {
    id: metadata.id || globalThis.crypto?.randomUUID?.() || `mz-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    original,
    filename,
    mimeType,
    extension: metadata.extension || getExtension(filename),
    size: original.size,
    kind: metadata.kind || "file",
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    aspectRatio: metadata.aspectRatio ?? (metadata.width && metadata.height ? metadata.width / metadata.height : null),
    pageCount: metadata.pageCount ?? null,
    preview: metadata.preview ?? null,
    working: metadata.working ?? null,
    output: metadata.output ?? null,
    processingState: metadata.processingState || "ready",
    error: metadata.error || null,
    createdAt: metadata.createdAt || Date.now(),
  };
}

export function updateFileAsset(asset, patch = {}) {
  if (!asset?.original) throw new Error("Invalid file asset.");
  if (Object.prototype.hasOwnProperty.call(patch, "original") && patch.original !== asset.original) {
    throw new Error("The original file is immutable. Store transformed data in working/output instead.");
  }
  if (patch.processingState && !FILE_STATES.has(patch.processingState)) {
    throw new Error(`Unknown processing state: ${patch.processingState}`);
  }
  return { ...asset, ...patch, original: asset.original, size: asset.original.size };
}

export function attachImageMetadata(asset, width, height) {
  if (!(width > 0) || !(height > 0)) throw new Error("Image dimensions are invalid.");
  return updateFileAsset(asset, { width, height, aspectRatio: width / height });
}

export function attachPdfMetadata(asset, pageCount) {
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error("PDF page count is invalid.");
  return updateFileAsset(asset, { pageCount });
}

export function setPreview(asset, preview) {
  return updateFileAsset(asset, { preview });
}

export function setWorking(asset, working) {
  return updateFileAsset(asset, { working });
}

export function setOutput(asset, output) {
  return updateFileAsset(asset, { output, processingState: "success", error: null });
}

export function setProcessing(asset, processingState, error = null) {
  return updateFileAsset(asset, { processingState, error });
}

/** Ensures a caller did not replace the original by accident. */
export function assertOriginalPreserved(asset, original) {
  if (asset?.original !== original) throw new Error("Original file preservation check failed.");
  return true;
}

/**
 * Create a short-lived object URL with an explicit cleanup function.
 * Prefer this to base64/data URLs for large files.
 */
export function createManagedObjectUrl(blob) {
  if (!(blob instanceof Blob)) throw new Error("A Blob is required to create a preview URL.");
  const url = URL.createObjectURL(blob);
  let revoked = false;
  return {
    url,
    revoke() {
      if (!revoked) URL.revokeObjectURL(url);
      revoked = true;
    },
  };
}
