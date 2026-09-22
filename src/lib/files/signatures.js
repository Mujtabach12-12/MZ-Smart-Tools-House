const SIGNATURES = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF + WEBP checked below
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/bmp": [[0x42, 0x4d]],
};

function startsWith(bytes, signature) {
  return signature.every((value, index) => bytes[index] === value);
}

export async function sniffFileMime(blob) {
  if (!(blob instanceof Blob) || blob.size < 2) return null;
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  for (const [mime, signatures] of Object.entries(SIGNATURES)) {
    if (!signatures.some((signature) => startsWith(bytes, signature))) continue;
    if (mime === "image/webp") {
      const webp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
      if (!webp) continue;
    }
    return mime;
  }
  return null;
}

export async function assertFileSignature(blob, expectedMimes) {
  const expected = Array.isArray(expectedMimes) ? expectedMimes : [expectedMimes];
  const sniffed = await sniffFileMime(blob);
  if (!sniffed) throw new Error("The file signature is not recognized or the file may be corrupted.");
  const normalized = expected.map((m) => String(m || "").toLowerCase().replace("image/jpg", "image/jpeg"));
  const actual = sniffed.replace("image/jpg", "image/jpeg");
  if (!normalized.includes(actual)) {
    throw new Error(`The file contents are ${actual}, which does not match the expected format.`);
  }
  return sniffed;
}
