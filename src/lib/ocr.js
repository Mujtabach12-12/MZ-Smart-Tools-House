let workerPromise;

async function getWorker(language = "eng") {
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then(({ createWorker }) => createWorker(language));
  }
  return workerPromise;
}

export async function recognizeImage(source, language = "eng", onProgress) {
  const worker = await getWorker(language);
  const result = await worker.recognize(source, {}, { blocks: true });
  if (onProgress) onProgress(1);
  return result?.data?.text || "";
}
