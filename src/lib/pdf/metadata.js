import { loadPdfDocument } from "./core.js";

export async function getPdfMetadata(bytes) {
  const doc = await loadPdfDocument(bytes);
  return {
    title: doc.getTitle() || "—",
    author: doc.getAuthor() || "—",
    subject: doc.getSubject() || "—",
    creator: doc.getCreator() || "—",
    producer: doc.getProducer() || "—",
    creationDate: doc.getCreationDate()?.toLocaleString() || "—",
    modificationDate: doc.getModificationDate()?.toLocaleString() || "—",
    pageCount: doc.getPageCount(),
  };
}
