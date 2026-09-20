import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Undo2, Redo2, Link as LinkIcon, Image as ImageIcon, Table2,
  Minus, FileDown, Printer, Save, Search, Replace, Plus, Type, Highlighter,
} from "lucide-react";
import { downloadBytes } from "../../lib/download";

const STORAGE_KEY = "mz-online-word-draft-v1";
const LIBRARY_KEY = "mz-online-word-library-v1";
const uid = () => globalThis.crypto?.randomUUID?.() || `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const DEFAULT_HTML = "<h1>Untitled Document</h1><p>Start writing your document here…</p>";

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function readDraft() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (parsed && typeof parsed.html === "string") return parsed;
  } catch { /* ignore unavailable/corrupt local storage */ }
  return { documentId: uid(), title: "Untitled Document", html: DEFAULT_HTML, header: "", footer: "", lineSpacing: 1.5, paragraphSpacing: 10, marginSize: "normal", pageSize: "a4", orientation: "portrait", pageNumbers: true, zoom: 100 };
}

function readLibrary() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.html === "string").slice(0, 20) : [];
  } catch { return []; }
}


function sanitizeImportedHtml(raw) {
  const parsed = new DOMParser().parseFromString(raw, "text/html");
  parsed.querySelectorAll("script,style,iframe,object,embed,meta,base,link,form").forEach((node) => node.remove());
  parsed.querySelectorAll("*").forEach((node) => {
    for (const attr of [...node.attributes]) {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || "").trim();
      if (name.startsWith("on")) node.removeAttribute(attr.name);
      if ((name === "href" || name === "src" || name === "xlink:href") && /^javascript:/i.test(value)) node.removeAttribute(attr.name);
      if (name === "srcdoc") node.removeAttribute(attr.name);
    }
  });
  return parsed.body.innerHTML;
}

function htmlToPlainText(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.innerText || container.textContent || "";
}

function paragraphsFromHtml(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  const blocks = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote,pre")];
  if (!blocks.length) return [{ text: container.innerText || "", heading: 0 }];
  return blocks.map((node) => ({ text: node.innerText || node.textContent || "", heading: /^H[1-6]$/.test(node.tagName) ? Number(node.tagName.slice(1)) : 0 }));
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function MzOnlineWord() {
  const initial = useMemo(readDraft, []);
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const importInputRef = useRef(null);
  const saveTimer = useRef(null);
  const [documentId, setDocumentId] = useState(initial.documentId || uid());
  const [documents, setDocuments] = useState(() => readLibrary());
  const [title, setTitle] = useState(initial.title || "Untitled Document");
  const [html, setHtml] = useState(initial.html || DEFAULT_HTML);
  const [header, setHeader] = useState(initial.header || "");
  const [footer, setFooter] = useState(initial.footer || "");
  const [lineSpacing, setLineSpacing] = useState(Number(initial.lineSpacing) || 1.5);
  const [paragraphSpacing, setParagraphSpacing] = useState(Number(initial.paragraphSpacing) || 10);
  const [marginSize, setMarginSize] = useState(initial.marginSize || "normal");
  const [pageSize, setPageSize] = useState(initial.pageSize || "a4");
  const [orientation, setOrientation] = useState(initial.orientation || "portrait");
  const [pageNumbers, setPageNumbers] = useState(initial.pageNumbers !== false);
  const [zoom, setZoom] = useState(Number(initial.zoom) || 100);
  const [saveState, setSaveState] = useState("Saved");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [recoveredAt] = useState(initial.savedAt || null);
  const [assignment, setAssignment] = useState({ institute:"", course:"", assignmentTitle:"", studentName:"", rollNumber:"", teacher:"", submissionDate:"" });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) editorRef.current.innerHTML = html;
  }, []); // initialize the editable surface once

  useEffect(() => {
    setSaveState("Saving…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const savedAt = Date.now();
        const snapshot = { documentId, title, html, header, footer, lineSpacing, paragraphSpacing, marginSize, pageSize, orientation, pageNumbers, zoom, savedAt };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        setDocuments((current) => {
          const next = [snapshot, ...current.filter((item) => item.documentId !== documentId)].sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).slice(0,20);
          localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
          return next;
        });
        setSaveState("Saved");
      } catch {
        setSaveState("Local save unavailable");
      }
    }, 450);
    return () => clearTimeout(saveTimer.current);
  }, [documentId, title, html, header, footer, lineSpacing, paragraphSpacing, marginSize, pageSize, orientation, pageNumbers, zoom]);

  const plainText = useMemo(() => {
    if (typeof document === "undefined") return "";
    return htmlToPlainText(html);
  }, [html]);
  const words = wordCount(plainText);
  const characters = plainText.length;
  const estimatedPages = Math.max(1, (html.match(/data-page-break/g) || []).length + 1, Math.ceil(words / 550));

  const syncHtml = () => setHtml(editorRef.current?.innerHTML || "");
  const command = (name, value = null) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    syncHtml();
  };

  const insertTable = () => {
    command("insertHTML", '<table style="width:100%;border-collapse:collapse;margin:1rem 0"><tbody><tr><td style="border:1px solid #94a3b8;padding:8px">Cell 1</td><td style="border:1px solid #94a3b8;padding:8px">Cell 2</td></tr><tr><td style="border:1px solid #94a3b8;padding:8px">Cell 3</td><td style="border:1px solid #94a3b8;padding:8px">Cell 4</td></tr></tbody></table><p><br></p>');
  };

  const insertLink = () => {
    const url = window.prompt("Enter a valid https:// link:");
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
      command("createLink", parsed.href);
    } catch {
      setError("Please enter a valid http:// or https:// link.");
    }
  };

  const insertImage = (file) => {
    setError("");
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) { setError("Choose a PNG, JPG or WebP image."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Choose an image smaller than 8 MB for this browser document."); return; }
    const reader = new FileReader();
    reader.onload = () => command("insertHTML", `<p><img src="${reader.result}" alt="Inserted document image" style="max-width:100%;height:auto" /></p><p><br></p>`);
    reader.onerror = () => setError("The image could not be read.");
    reader.readAsDataURL(file);
  };

  const replaceAll = () => {
    const needle = findText;
    if (!needle) { setError("Enter text to find first."); return; }
    let changed = 0;
    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!node.nodeValue?.includes(needle)) continue;
      const occurrences = node.nodeValue.split(needle).length - 1;
      node.nodeValue = node.nodeValue.split(needle).join(replaceText);
      changed += occurrences;
    }
    syncHtml();
    setMessage(changed ? `Replaced ${changed} occurrence${changed === 1 ? "" : "s"}.` : "No matching text was found.");
  };

  const createAssignment = () => {
    const safe = Object.fromEntries(Object.entries(assignment).map(([k,v]) => [k, escapeHtml(v)]));
    const next = `<div style="text-align:center;min-height:760px;display:flex;flex-direction:column;justify-content:center"><h1>${safe.assignmentTitle || "Assignment Title"}</h1><p><strong>${safe.institute || "University / Institute"}</strong></p><p>${safe.course || "Course"}</p><br><p><strong>Student:</strong> ${safe.studentName || "Student Name"}</p><p><strong>Roll Number:</strong> ${safe.rollNumber || "—"}</p><p><strong>Teacher:</strong> ${safe.teacher || "—"}</p><p><strong>Submission Date:</strong> ${safe.submissionDate || "—"}</p></div><div style="break-before:page"><h2>Introduction</h2><p>Start your assignment here…</p></div>`;
    setTitle(assignment.assignmentTitle || "Assignment");
    setHtml(next);
    if (editorRef.current) editorRef.current.innerHTML = next;
    setTemplateOpen(false);
    setMessage("Assignment template created and saved as an editable draft.");
  };

  const applySimpleTemplate = (kind) => {
    const templates = {
      report: "<h1>Report Title</h1><p><strong>Prepared by:</strong> Your Name</p><h2>Executive Summary</h2><p>Write a concise summary…</p><h2>Introduction</h2><p>Introduce the topic…</p><h2>Findings</h2><p>Add your findings…</p><h2>Conclusion</h2><p>Summarize the report…</p>",
      notes: "<h1>Study Notes</h1><h2>Topic</h2><ul><li>Key point</li><li>Key point</li></ul><h2>Questions</h2><ol><li>Review question</li></ol>",
      letter: "<p>Date</p><p>Recipient Name<br>Organization</p><p>Dear Sir/Madam,</p><p>Write your letter here…</p><p>Sincerely,<br>Your Name</p>",
      cv: "<h1>Your Name</h1><p>Email · Phone · City</p><h2>Profile</h2><p>Short professional summary…</p><h2>Education</h2><p>Degree — Institution</p><h2>Skills</h2><ul><li>Skill</li><li>Skill</li></ul><h2>Projects</h2><p>Project description…</p>",
      research: "<h1>Research Paper Title</h1><p><strong>Author:</strong> Your Name</p><h2>Abstract</h2><p>Summarize the study…</p><h2>Introduction</h2><p>Provide background and research objectives…</p><h2>Methodology</h2><p>Describe the method…</p><h2>Results</h2><p>Present findings…</p><h2>Discussion</h2><p>Interpret the findings…</p><h2>References</h2><p>Add references in the required style…</p>",
      lab: "<h1>Lab Report</h1><p><strong>Course:</strong> Course Name</p><p><strong>Experiment:</strong> Experiment Title</p><h2>Objective</h2><p>State the objective…</p><h2>Materials / Tools</h2><ul><li>Item</li></ul><h2>Procedure</h2><ol><li>Step</li></ol><h2>Results</h2><p>Record observations and results…</p><h2>Conclusion</h2><p>Summarize what was learned…</p>",
    };
    const next = templates[kind];
    setHtml(next); if (editorRef.current) editorRef.current.innerHTML = next; setMessage(`${kind[0].toUpperCase()+kind.slice(1)} template loaded.`);
  };

  const importDocument = async (file) => {
    setError(""); setMessage("Importing document…");
    try {
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) throw new Error("Choose a document smaller than 20 MB.");
      let importedHtml = "";
      if (file.name.toLowerCase().endsWith(".docx")) {
        const { default: JSZip } = await import("jszip");
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const xml = await zip.file("word/document.xml")?.async("string");
        if (!xml) throw new Error("This DOCX does not contain a readable document body.");
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        const paragraphs = [...doc.getElementsByTagNameNS("*", "p")].map((p) => [...p.getElementsByTagNameNS("*", "t")].map((t) => t.textContent || "").join(""));
        importedHtml = paragraphs.map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`).join("");
      } else if (file.type === "text/html" || file.name.toLowerCase().endsWith(".html")) {
        const raw = await file.text();
        importedHtml = sanitizeImportedHtml(raw);
      } else if (file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt")) {
        importedHtml = (await file.text()).split(/\r?\n/).map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`).join("");
      } else throw new Error("Import supports DOCX, TXT and HTML files.");
      setHtml(importedHtml || "<p><br></p>");
      if (editorRef.current) editorRef.current.innerHTML = importedHtml || "<p><br></p>";
      setTitle(file.name.replace(/\.[^.]+$/, "") || "Imported Document");
      setMessage("Document imported. Review formatting before export.");
    } catch (e) { setError(e.message || "Unable to import this document."); setMessage(""); }
    finally { if (importInputRef.current) importInputRef.current.value = ""; }
  };

  const exportHtml = () => {
    const full = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;max-width:794px;margin:32px auto;padding:40px;line-height:${lineSpacing}}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:8px}</style></head><body>${header ? `<header>${escapeHtml(header)}</header><hr>` : ""}${html}${footer ? `<hr><footer>${escapeHtml(footer)}</footer>` : ""}</body></html>`;
    downloadBytes(new TextEncoder().encode(full), `${title || "document"}.html`, "text/html");
  };
  const exportTxt = () => downloadBytes(new TextEncoder().encode(plainText), `${title || "document"}.txt`, "text/plain");

  const exportDocx = async () => {
    setError(""); setMessage("Creating DOCX…");
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const blocks = paragraphsFromHtml(html);
      const headingMap = {1:HeadingLevel.HEADING_1,2:HeadingLevel.HEADING_2,3:HeadingLevel.HEADING_3,4:HeadingLevel.HEADING_4,5:HeadingLevel.HEADING_5,6:HeadingLevel.HEADING_6};
      const children = [];
      if (header) children.push(new Paragraph({ children:[new TextRun({ text:header, italics:true })] }));
      for (const block of blocks) children.push(new Paragraph({ text:block.text || " ", heading:block.heading ? headingMap[block.heading] : undefined }));
      if (footer) children.push(new Paragraph({ children:[new TextRun({ text:footer, italics:true })] }));
      const doc = new Document({ sections:[{ properties:{}, children }] });
      const blob = await Packer.toBlob(doc);
      const docxBytes = new Uint8Array(await blob.arrayBuffer());
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(docxBytes);
      if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) throw new Error("DOCX validation failed before download.");
      downloadBytes(docxBytes, `${title || "document"}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      const rich = /<(img|table)\b/i.test(html);
      setMessage(rich ? "DOCX created. Text/headings are preserved; embedded images/tables remain best preserved in HTML or Print/Save PDF." : "DOCX created successfully.");
    } catch (e) { setError(e.message || "Unable to create DOCX."); setMessage(""); }
  };

  const exportPdf = async () => {
    setError(""); setMessage("Creating PDF…");
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const baseSize = pageSize === "letter" ? [612,792] : [595.28,841.89]; const [pageWidth,pageHeight] = orientation === "landscape" ? [baseSize[1],baseSize[0]] : baseSize; const margin = 48, bodySize = 11, lineHeight = 16;
      let page = doc.addPage([pageWidth,pageHeight]); let y = pageHeight - margin;
      const addPage = () => { page = doc.addPage([pageWidth,pageHeight]); y = pageHeight - margin; };
      if (header) { page.drawText(header.slice(0,120),{x:margin,y,size:9,font,color:rgb(.35,.4,.5)}); y -= 24; }
      const blocks = paragraphsFromHtml(html);
      for (const block of blocks) {
        const size = block.heading ? Math.max(13, 22 - block.heading * 2) : bodySize;
        const activeFont = block.heading ? boldFont : font;
        const words = block.text.split(/\s+/).filter(Boolean); let line=""; const lines=[];
        for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (activeFont.widthOfTextAtSize(candidate,size) > pageWidth-margin*2 && line) { lines.push(line); line=word; } else line=candidate; }
        if (line || !words.length) lines.push(line || " ");
        for (const current of lines) { if (y < margin + 30) addPage(); page.drawText(current,{x:margin,y,size,font:activeFont,color:rgb(.08,.12,.2),maxWidth:pageWidth-margin*2}); y -= block.heading ? size+8 : lineHeight; }
        y -= block.heading ? 5 : 7;
      }
      if (footer) page.drawText(footer.slice(0,120),{x:margin,y:24,size:8,font,color:rgb(.35,.4,.5)});
      if (pageNumbers) {
        const pages = doc.getPages();
        pages.forEach((pdfPage, index) => {
          const label = `Page ${index + 1} of ${pages.length}`;
          const width = font.widthOfTextAtSize(label, 8);
          pdfPage.drawText(label, { x:(pageWidth-width)/2, y:14, size:8, font, color:rgb(.45,.5,.58) });
        });
      }
      const pdfBytes = await doc.save();
      const verifiedPdf = await PDFDocument.load(pdfBytes);
      if (verifiedPdf.getPageCount() < 1) throw new Error("PDF validation failed before download.");
      downloadBytes(pdfBytes, `${title || "document"}.pdf`, "application/pdf");
      setMessage(/<(img|table)\b/i.test(html) ? "Validated PDF created from document text. Use Print / Save PDF when you need browser-rendered images and tables." : `Validated PDF created with ${verifiedPdf.getPageCount()} page${verifiedPdf.getPageCount()===1?"":"s"}.`);
    } catch (e) { setError(e.message || "Unable to create PDF."); setMessage(""); }
  };

  const loadLibraryDocument = (doc) => {
    if (!doc) return;
    setDocumentId(doc.documentId || uid()); setTitle(doc.title || "Untitled Document"); setHtml(doc.html || DEFAULT_HTML); setHeader(doc.header || ""); setFooter(doc.footer || ""); setLineSpacing(Number(doc.lineSpacing) || 1.5); setParagraphSpacing(Number(doc.paragraphSpacing) || 10); setMarginSize(doc.marginSize || "normal"); setPageSize(doc.pageSize || "a4"); setOrientation(doc.orientation || "portrait"); setPageNumbers(doc.pageNumbers !== false); setZoom(Number(doc.zoom) || 100);
    if (editorRef.current) editorRef.current.innerHTML = doc.html || DEFAULT_HTML;
    setMessage(`Opened ${doc.title || "document"} from this browser.`);
  };

  const duplicateCurrentDocument = () => {
    const newId = uid();
    setDocumentId(newId); setTitle(`${title || "Untitled Document"} Copy`);
    setMessage("Duplicated as a separate browser draft.");
  };

  const deleteLibraryDocument = (id) => {
    if (!window.confirm("Delete this locally saved document from this browser?")) return;
    setDocuments((current) => { const next=current.filter((item)=>item.documentId!==id); try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(next));}catch{} return next; });
    if (id === documentId) {
      setDocumentId(uid()); setTitle("Untitled Document"); setHtml(DEFAULT_HTML); setHeader(""); setFooter(""); setLineSpacing(1.5); setParagraphSpacing(10); setMarginSize("normal"); setPageSize("a4"); setOrientation("portrait"); setPageNumbers(true); setZoom(100);
      if (editorRef.current) editorRef.current.innerHTML = DEFAULT_HTML;
      setMessage("Local document deleted. A new blank draft is ready.");
    }
  };

  const clearDocument = () => {
    if (!window.confirm("Clear this draft and start a new document?")) return;
    setDocumentId(uid()); setTitle("Untitled Document"); setHtml(DEFAULT_HTML); setHeader(""); setFooter(""); setLineSpacing(1.5); setParagraphSpacing(10); setMarginSize("normal"); setPageSize("a4"); setOrientation("portrait"); setPageNumbers(true); setZoom(100);
    if (editorRef.current) editorRef.current.innerHTML = DEFAULT_HTML;
    setMessage("New blank document created.");
  };

  return <div className="space-y-5">
    <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 pb-3 dark:border-navy-800">
        <input className="mz-input max-w-sm font-bold" value={title} onChange={(e)=>setTitle(e.target.value)} aria-label="Document title" />
        <span className={`ml-auto text-xs font-semibold ${saveState === "Saved" ? "text-emerald-600" : "text-navy-400"}`}>{saveState}</span>
        <button type="button" className="mz-btn-secondary" onClick={()=>{ try{const savedAt=Date.now();const snapshot={documentId,title,html,header,footer,lineSpacing,paragraphSpacing,marginSize,pageSize,pageNumbers,zoom,savedAt};localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot));setDocuments((current)=>{const next=[snapshot,...current.filter((item)=>item.documentId!==documentId)].slice(0,20);localStorage.setItem(LIBRARY_KEY,JSON.stringify(next));return next});setSaveState("Saved");}catch{setError("This browser could not save the draft locally.");}}}><Save className="h-4 w-4"/> Save</button>
      </div>
      <div className="relative z-30 mt-2 flex flex-wrap items-center gap-1 border-b border-navy-100 pb-2 text-sm dark:border-navy-800" aria-label="Document menu bar">
        <details className="group relative"><summary className="cursor-pointer list-none rounded-lg px-3 py-2 font-semibold hover:bg-navy-50 dark:hover:bg-navy-800">File</summary><div className="absolute left-0 top-full z-40 mt-1 min-w-52 rounded-xl border border-navy-200 bg-white p-2 shadow-xl dark:border-navy-700 dark:bg-navy-900"><button className="mz-menu-item" onClick={clearDocument}>New document</button><button className="mz-menu-item" onClick={()=>importInputRef.current?.click()}>Open DOCX/TXT/HTML</button><button className="mz-menu-item" onClick={duplicateCurrentDocument}>Save as copy</button><button className="mz-menu-item" onClick={exportDocx}>Download DOCX</button><button className="mz-menu-item" onClick={exportPdf}>Download PDF</button><button className="mz-menu-item" onClick={()=>window.print()}>Print</button></div></details>
        <details className="group relative"><summary className="cursor-pointer list-none rounded-lg px-3 py-2 font-semibold hover:bg-navy-50 dark:hover:bg-navy-800">Edit</summary><div className="absolute left-0 top-full z-40 mt-1 min-w-44 rounded-xl border border-navy-200 bg-white p-2 shadow-xl dark:border-navy-700 dark:bg-navy-900"><button className="mz-menu-item" onClick={()=>command("undo")}>Undo</button><button className="mz-menu-item" onClick={()=>command("redo")}>Redo</button><button className="mz-menu-item" onClick={()=>command("selectAll")}>Select all</button><button className="mz-menu-item" onClick={()=>setMessage("Use the Find & replace panel on the right side.")}>Find / Replace</button></div></details>
        <details className="group relative"><summary className="cursor-pointer list-none rounded-lg px-3 py-2 font-semibold hover:bg-navy-50 dark:hover:bg-navy-800">View</summary><div className="absolute left-0 top-full z-40 mt-1 min-w-48 rounded-xl border border-navy-200 bg-white p-2 shadow-xl dark:border-navy-700 dark:bg-navy-900"><button className="mz-menu-item" onClick={()=>setFocusMode(v=>!v)}>{focusMode?"Exit focus mode":"Focus document"}</button><button className="mz-menu-item" onClick={()=>setZoom(z=>Math.min(140,z+10))}>Zoom in</button><button className="mz-menu-item" onClick={()=>setZoom(z=>Math.max(70,z-10))}>Zoom out</button></div></details>
        <details className="group relative"><summary className="cursor-pointer list-none rounded-lg px-3 py-2 font-semibold hover:bg-navy-50 dark:hover:bg-navy-800">Insert</summary><div className="absolute left-0 top-full z-40 mt-1 min-w-48 rounded-xl border border-navy-200 bg-white p-2 shadow-xl dark:border-navy-700 dark:bg-navy-900"><button className="mz-menu-item" onClick={()=>imageInputRef.current?.click()}>Image</button><button className="mz-menu-item" onClick={insertTable}>Table</button><button className="mz-menu-item" onClick={insertLink}>Link</button><button className="mz-menu-item" onClick={()=>command("insertHorizontalRule")}>Horizontal line</button><button className="mz-menu-item" onClick={()=>command("insertHTML",'<div style="break-after:page;height:1px;border-top:1px dashed #cbd5e1;margin:24px 0" data-page-break="true"></div><p><br></p>')}>Page break</button></div></details>
        <details className="group relative"><summary className="cursor-pointer list-none rounded-lg px-3 py-2 font-semibold hover:bg-navy-50 dark:hover:bg-navy-800">Format</summary><div className="absolute left-0 top-full z-40 mt-1 min-w-48 rounded-xl border border-navy-200 bg-white p-2 shadow-xl dark:border-navy-700 dark:bg-navy-900"><button className="mz-menu-item" onClick={()=>command("bold")}>Bold</button><button className="mz-menu-item" onClick={()=>command("italic")}>Italic</button><button className="mz-menu-item" onClick={()=>command("underline")}>Underline</button><button className="mz-menu-item" onClick={()=>command("removeFormat")}>Clear formatting</button></div></details>
        <details className="group relative"><summary className="cursor-pointer list-none rounded-lg px-3 py-2 font-semibold hover:bg-navy-50 dark:hover:bg-navy-800">Layout</summary><div className="absolute left-0 top-full z-40 mt-1 min-w-48 rounded-xl border border-navy-200 bg-white p-2 shadow-xl dark:border-navy-700 dark:bg-navy-900"><button className="mz-menu-item" onClick={()=>setPageSize("a4")}>A4</button><button className="mz-menu-item" onClick={()=>setPageSize("letter")}>US Letter</button><button className="mz-menu-item" onClick={()=>setOrientation("portrait")}>Portrait</button><button className="mz-menu-item" onClick={()=>setOrientation("landscape")}>Landscape</button><button className="mz-menu-item" onClick={()=>setMarginSize("normal")}>Normal margins</button></div></details>
        <details className="group relative"><summary className="cursor-pointer list-none rounded-lg px-3 py-2 font-semibold hover:bg-navy-50 dark:hover:bg-navy-800">Tools</summary><div className="absolute left-0 top-full z-40 mt-1 min-w-52 rounded-xl border border-navy-200 bg-white p-2 shadow-xl dark:border-navy-700 dark:bg-navy-900"><button className="mz-menu-item" onClick={()=>setTemplateOpen(true)}>Create Assignment</button><button className="mz-menu-item" onClick={duplicateCurrentDocument}>Duplicate document</button><button className="mz-menu-item" onClick={()=>setMessage(`${words} words · ${characters} characters`)}>Word count</button></div></details>
        <span className="ml-auto hidden text-xs text-navy-400 sm:inline">{recoveredAt ? `Recovered draft · ${new Date(recoveredAt).toLocaleString()}` : "Auto-save enabled"}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Document formatting">
        <button className="mz-editor-btn" type="button" onClick={()=>command("bold")} aria-label="Bold"><Bold/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("italic")} aria-label="Italic"><Italic/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("underline")} aria-label="Underline"><Underline/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("strikeThrough")} aria-label="Strikethrough"><Strikethrough/></button>
        <select className="mz-editor-select" aria-label="Block style" onChange={(e)=>command("formatBlock",e.target.value)} defaultValue="p"><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select>
        <select className="mz-editor-select" aria-label="Font family" onChange={(e)=>command("fontName",e.target.value)} defaultValue="Arial"><option>Arial</option><option>Calibri</option><option>Times New Roman</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option><option>Trebuchet MS</option><option>Courier New</option><option>Impact</option></select>
        <select className="mz-editor-select" aria-label="Font size" onChange={(e)=>command("fontSize",e.target.value)} defaultValue="3"><option value="2">10</option><option value="3">12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">32</option></select>
        <label className="mz-editor-color" title="Text color"><Type/><input type="color" aria-label="Text color" onChange={(e)=>command("foreColor",e.target.value)} /></label>
        <label className="mz-editor-color" title="Highlight"><Highlighter/><input type="color" aria-label="Highlight color" defaultValue="#fff59d" onChange={(e)=>command("hiliteColor",e.target.value)} /></label>
        <button className="mz-editor-btn" type="button" onClick={()=>command("justifyLeft")} aria-label="Align left"><AlignLeft/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("justifyCenter")} aria-label="Align center"><AlignCenter/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("justifyRight")} aria-label="Align right"><AlignRight/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("justifyFull")} aria-label="Justify text">J</button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("insertUnorderedList")} aria-label="Bullet list"><List/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("insertOrderedList")} aria-label="Numbered list"><ListOrdered/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("outdent")} aria-label="Decrease indent">−</button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("indent")} aria-label="Increase indent">+</button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("undo")} aria-label="Undo"><Undo2/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("redo")} aria-label="Redo"><Redo2/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("removeFormat")} aria-label="Clear formatting">Clear</button>
        <button className="mz-editor-btn" type="button" onClick={insertLink} aria-label="Insert link"><LinkIcon/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>imageInputRef.current?.click()} aria-label="Insert image"><ImageIcon/></button>
        <button className="mz-editor-btn" type="button" onClick={insertTable} aria-label="Insert table"><Table2/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("insertHorizontalRule")} aria-label="Insert horizontal line"><Minus/></button>
        <button className="mz-editor-btn" type="button" onClick={()=>command("insertHTML",'<div style="break-after:page;height:1px;border-top:1px dashed #cbd5e1;margin:24px 0" data-page-break="true"></div><p><br></p>')} aria-label="Insert page break">Page break</button>
        <input ref={imageInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>{insertImage(e.target.files?.[0]);e.target.value="";}} />
      </div>
    </div>

    <div className={focusMode ? "grid gap-4" : "grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_250px]"}>
      {!focusMode ? <aside className="mz-card p-4 space-y-4">
        <div><h3 className="font-bold">Templates</h3><p className="mt-1 text-xs text-navy-400">Start from a professional structure.</p></div>
        <button className="mz-btn-primary w-full justify-center" onClick={()=>setTemplateOpen((v)=>!v)}><Plus className="h-4 w-4"/> Assignment</button>
        <div className="grid gap-2">{[["report","Report"],["research","Research Paper"],["lab","Lab Report"],["notes","Notes"],["letter","Letter"],["cv","Simple CV"]].map(([id,label])=><button key={id} className="mz-btn-secondary justify-start" onClick={()=>applySimpleTemplate(id)}>{label}</button>)}</div>
        <hr className="border-navy-100 dark:border-navy-800"/>
        <input ref={importInputRef} hidden type="file" accept=".docx,.txt,.html,text/plain,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e)=>importDocument(e.target.files?.[0])}/>
        <button className="mz-btn-secondary w-full justify-center" onClick={()=>importInputRef.current?.click()}>Import DOCX/TXT/HTML</button>
        <button className="mz-btn-ghost w-full justify-center" onClick={clearDocument}>New document</button>
        <hr className="border-navy-100 dark:border-navy-800"/>
        <div><div className="flex items-center justify-between gap-2"><h3 className="font-bold">Recent documents</h3><span className="text-[11px] text-navy-400">This browser</span></div><div className="mt-2 grid gap-2">{documents.length ? documents.slice(0,6).map((doc)=><div key={doc.documentId} className={`rounded-xl border p-2 ${doc.documentId===documentId?"border-brand-300 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-950/20":"border-navy-100 dark:border-navy-800"}`}><button className="block w-full truncate text-left text-sm font-semibold hover:text-brand-600" onClick={()=>loadLibraryDocument(doc)} title={doc.title}>{doc.title || "Untitled Document"}</button><div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-navy-400"><span>{doc.savedAt?new Date(doc.savedAt).toLocaleDateString():"Local"}</span><button className="font-semibold text-red-500 hover:text-red-700" onClick={()=>deleteLibraryDocument(doc.documentId)} aria-label={`Delete ${doc.title || "document"}`}>Delete</button></div></div>) : <p className="text-xs text-navy-400">Your auto-saved documents will appear here.</p>}</div></div>
      </aside> : null}

      <div className="min-w-0 overflow-auto rounded-2xl bg-slate-100 p-3 sm:p-6 dark:bg-navy-950">
        <div className="mx-auto origin-top bg-white text-slate-900 shadow-xl" style={{ width:orientation === "landscape" ? (pageSize === "letter" ? "min(100%, 1056px)" : "min(100%, 1123px)") : (pageSize === "letter" ? "min(100%, 816px)" : "min(100%, 794px)"), minHeight:orientation === "landscape" ? (pageSize === "letter" ? "816px" : "794px") : (pageSize === "letter" ? "1056px" : "1123px"), padding:marginSize === "narrow" ? "clamp(22px, 4vw, 44px)" : marginSize === "wide" ? "clamp(42px, 8vw, 92px)" : "clamp(28px, 6vw, 72px)", lineHeight:lineSpacing, zoom:`${zoom}%`, "--mz-paragraph-spacing":`${paragraphSpacing}px` }}>
          {header ? <div className="mb-5 border-b border-slate-200 pb-2 text-xs text-slate-500">{header}</div> : null}
          <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncHtml} className="mz-word-editor min-h-[850px] outline-none" aria-label="Editable document" spellCheck="true" />
          {footer || pageNumbers ? <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-2 text-xs text-slate-500"><span>{footer}</span>{pageNumbers ? <span>Page 1</span> : null}</div> : null}
        </div>
      </div>

      {!focusMode ? <aside className="mz-card p-4 space-y-4">
        <div><h3 className="font-bold">Document</h3><div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-xl bg-navy-50 p-3 dark:bg-navy-950"><span className="text-xs text-navy-400">Pages est.</span><strong className="block text-lg">{estimatedPages}</strong></div><div className="rounded-xl bg-navy-50 p-3 dark:bg-navy-950"><span className="text-xs text-navy-400">Words</span><strong className="block text-lg">{words}</strong></div><div className="rounded-xl bg-navy-50 p-3 dark:bg-navy-950"><span className="text-xs text-navy-400">Characters</span><strong className="block text-lg">{characters}</strong></div></div></div>
        <label className="block text-xs font-bold uppercase tracking-wide text-navy-500">Header<input className="mz-input mt-2" value={header} onChange={(e)=>setHeader(e.target.value)} placeholder="Optional header"/></label>
        <label className="block text-xs font-bold uppercase tracking-wide text-navy-500">Footer<input className="mz-input mt-2" value={footer} onChange={(e)=>setFooter(e.target.value)} placeholder="Optional footer"/></label>
        <label className="block text-xs font-bold uppercase tracking-wide text-navy-500">Line spacing<select className="mz-input mt-2" value={lineSpacing} onChange={(e)=>setLineSpacing(Number(e.target.value))}><option value="1">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">2.0</option></select></label>
        <label className="block text-xs font-bold uppercase tracking-wide text-navy-500">Paragraph spacing<select className="mz-input mt-2" value={paragraphSpacing} onChange={(e)=>setParagraphSpacing(Number(e.target.value))}><option value="4">Compact</option><option value="10">Normal</option><option value="18">Relaxed</option></select></label>
        <label className="block text-xs font-bold uppercase tracking-wide text-navy-500">Margins<select className="mz-input mt-2" value={marginSize} onChange={(e)=>setMarginSize(e.target.value)}><option value="narrow">Narrow</option><option value="normal">Normal</option><option value="wide">Wide</option></select></label>
        <label className="flex items-center gap-2 text-sm font-semibold text-navy-600 dark:text-navy-300"><input type="checkbox" checked={pageNumbers} onChange={(e)=>setPageNumbers(e.target.checked)} className="h-4 w-4 accent-brand-600"/> Page numbers in PDF</label>
        <label className="block text-xs font-bold uppercase tracking-wide text-navy-500">Zoom {zoom}%<input className="mt-2 w-full accent-brand-600" type="range" min="70" max="140" step="10" value={zoom} onChange={(e)=>setZoom(Number(e.target.value))}/></label>
        <label className="block text-xs font-bold uppercase tracking-wide text-navy-500">Page size<select className="mz-input mt-2" value={pageSize} onChange={(e)=>setPageSize(e.target.value)}><option value="a4">A4</option><option value="letter">US Letter</option></select></label><label className="block text-xs font-bold uppercase tracking-wide text-navy-500">Orientation<select className="mz-input mt-2" value={orientation} onChange={(e)=>setOrientation(e.target.value)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
        <div className="rounded-xl border border-navy-100 p-3 dark:border-navy-800"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-500"><Search className="h-3.5 w-3.5"/> Find & replace</div><input className="mz-input mt-2" value={findText} onChange={(e)=>setFindText(e.target.value)} placeholder="Find"/><input className="mz-input mt-2" value={replaceText} onChange={(e)=>setReplaceText(e.target.value)} placeholder="Replace with"/><button className="mz-btn-secondary mt-2 w-full justify-center" onClick={replaceAll}><Replace className="h-4 w-4"/> Replace all</button></div>
      </aside> : null}
    </div>

    {templateOpen ? <section className="mz-card p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">Assignment template</h3><p className="text-sm text-navy-500">Create an editable university assignment cover and starter page.</p></div><button className="mz-btn-ghost" onClick={()=>setTemplateOpen(false)}>Close</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["institute","University / Institute"],["course","Course"],["assignmentTitle","Assignment Title"],["studentName","Student Name"],["rollNumber","Roll Number"],["teacher","Teacher"],["submissionDate","Submission Date"]].map(([key,label])=><label key={key} className="text-sm font-semibold">{label}<input className="mz-input mt-1.5" type={key==="submissionDate"?"date":"text"} value={assignment[key]} onChange={(e)=>setAssignment((a)=>({...a,[key]:e.target.value}))}/></label>)}</div><button className="mz-btn-primary mt-4" onClick={createAssignment}>Create Assignment</button></section> : null}

    <section className="mz-card p-4"><div className="flex flex-wrap items-center gap-2"><span className="mr-2 text-sm font-bold">Export</span><button className="mz-btn-primary" onClick={exportDocx}><FileDown className="h-4 w-4"/> DOCX</button><button className="mz-btn-secondary" onClick={exportPdf}><FileDown className="h-4 w-4"/> PDF</button><button className="mz-btn-secondary" onClick={exportHtml}>HTML</button><button className="mz-btn-secondary" onClick={exportTxt}>TXT</button><button className="mz-btn-secondary" onClick={()=>window.print()}><Printer className="h-4 w-4"/> Print / Save PDF</button></div><p className="mt-3 text-xs leading-5 text-navy-400">Drafts auto-save in this browser. Direct DOCX/PDF export preserves text and headings; for the closest visual match when using images/tables, use Print / Save PDF or HTML export.</p></section>
    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{error}</div> : null}
    {message ? <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">{message}</div> : null}
  </div>;
}
