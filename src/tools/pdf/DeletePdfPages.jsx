import { deletePdfPages } from "../../lib/pdf/deletePages";
import PageSelectionToolBase from "./PageSelectionToolBase";

export default function DeletePdfPages() {
  return (
    <PageSelectionToolBase
      toolId="pdf-delete-pages"
      processFn={deletePdfPages}
      actionLabel="Delete Pages & Download"
      processingLabel="Deleting..."
      filenamePrefix="edited"
      placeholder="e.g. 2,4-5"
      howTo={[
        "Upload a PDF file.",
        "Enter the pages you want removed, e.g. \"2,4-5\".",
        "Click Delete Pages & Download.",
      ]}
      faq={[
        { q: "Can I delete every page?", a: "No — at least one page must remain in the output PDF." },
      ]}
    />
  );
}
