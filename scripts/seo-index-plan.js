import { getToolSeo } from "../src/data/toolSeo.js";
export const CORE_TOOL_IDS = new Set([
"pdf-compressor","mz-pdf-editor","mz-pdf-viewer","smart-document-scanner","pdf-merger","pdf-splitter","pdf-to-word","word-to-pdf","pdf-to-jpg","jpg-to-pdf","pdf-ocr",
"image-compressor","image-resizer","image-cropper","jpg-to-png","png-to-jpg","mz-online-word","mz-online-excel","mz-online-powerpoint","mz-dictionary",
"gpa-calculator","cgpa-calculator","attendance-calculator","marks-calculator","grade-calculator","programming-lab","json-formatter","json-validator","regex-tester","base64-encoder","url-encoder","uuid-generator","password-generator",
"percentage-calculator","age-calculator","discount-calculator","average-calculator","emi-calculator"
]);
export function hasRichSeo(tool){const s=getToolSeo(tool);const d=[s.intro,s.formula,s.example,s.howTo,s.features,s.useCases,s.supportedFormats,s.faq].filter(Boolean);return CORE_TOOL_IDS.has(tool.id)||d.length>=2;}
export function getSearchFocusedTools(tools){return tools.filter(t=>t.status==="active"&&t.seoIndexable!==false&&hasRichSeo(t));}
