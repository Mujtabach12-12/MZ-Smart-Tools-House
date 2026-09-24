import { loadPdfDocument } from "./core.js";

function pdfVersion(bytes) {
  try {
    const head = new TextDecoder("latin1").decode(bytes.slice(0, 16));
    return head.match(/%PDF-(\d\.\d)/)?.[1] || "Not provided";
  } catch { return "Not provided"; }
}

function valueOrNotProvided(value) {
  if (value == null || value === "") return "Not provided";
  return value;
}

export async function getPdfMetadata(bytes) {
  const doc = await loadPdfDocument(bytes);
  return {
    title: valueOrNotProvided(doc.getTitle()),
    author: valueOrNotProvided(doc.getAuthor()),
    subject: valueOrNotProvided(doc.getSubject()),
    keywords: valueOrNotProvided(doc.getKeywords?.()),
    creator: valueOrNotProvided(doc.getCreator()),
    producer: valueOrNotProvided(doc.getProducer()),
    creationDate: doc.getCreationDate()?.toLocaleString() || "Not provided",
    modificationDate: doc.getModificationDate()?.toLocaleString() || "Not provided",
    pageCount: doc.getPageCount(),
    version: pdfVersion(bytes),
  };
}
