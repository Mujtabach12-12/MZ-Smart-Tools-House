import { deletePdfPages } from "../../lib/pdf/deletePages";
import PageSelectionToolBase from "./PageSelectionToolBase";
export default function DeletePdfPages(){return <PageSelectionToolBase mode="delete" processFn={deletePdfPages} actionLabel="Delete selected pages" processingLabel="Deleting pages…" filenamePrefix="pages-removed" placeholder="e.g. 2,4-5"/>;}
