import { extractPdfPages } from "../../lib/pdf/extractPages";
import PageSelectionToolBase from "./PageSelectionToolBase";

export default function ExtractPdfPages() {
  return (
    <PageSelectionToolBase
      toolId="pdf-extract-pages"
      processFn={extractPdfPages}
      actionLabel="Extract Pages & Download"
      processingLabel="Extracting..."
      filenamePrefix="extracted"
      placeholder="e.g. 1,3-4"
      howTo={[
        "Upload a PDF file.",
        "Enter the pages you want to keep, e.g. \"1,3-4\".",
        "Click Extract Pages & Download — only those pages are kept, in their original page order.",
      ]}
      faq={[
        { q: "What's the difference between this and Delete Pages?", a: "Delete Pages removes the pages you list and keeps the rest. Extract Pages keeps only the pages you list." },
        { q: "Will the pages be reordered to match what I typed?", a: "No — extracted pages keep their original order from the source PDF. Use the Reorder Pages tool if you need a custom order." },
      ]}
    />
  );
}
