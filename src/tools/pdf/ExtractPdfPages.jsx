import { extractPdfPages } from "../../lib/pdf/extractPages";
import PageSelectionToolBase from "./PageSelectionToolBase";
export default function ExtractPdfPages(){return <PageSelectionToolBase mode="extract" processFn={extractPdfPages} actionLabel="Extract selected pages" processingLabel="Extracting pages…" filenamePrefix="extracted-pages" placeholder="e.g. 1-3,5"/>;}
