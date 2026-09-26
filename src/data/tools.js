import { getCategoryRoute } from "./categories.js";
import { converterToolRecords } from "../tools/converters/conversionRegistry.js";
import { formulaToolRecords } from "../tools/science/formulaRegistry.js";
import { pdfToolMeta } from "./pdfToolMeta.js";

/**
 * Central tool registry.
 *
 * Every tool on the platform is described ONCE here. The homepage, global
 * search, category pages and the generic tool page all read from this file.
 * Adding a new tool later means:
 *   1. Add an entry here.
 *   2. Build its real implementation component (Phase 2+).
 *   3. Flip `status` to `active` only after a real implementation ships.
 * No other file needs to change for the tool to appear in nav/search.
 *
 * Fields:
 *  - id        kebab-case unique id, also used in the route: /tools/:id
 *  - name      display name
 *  - category  must match a `slug` in categories.js
 *  - description  one-sentence, human, non-keyword-stuffed summary
 *  - icon      lucide-react icon name (string, resolved by <ToolIcon />)
 *  - keywords  extra search terms (synonyms, abbreviations)
 *  - status    "active" | "coming-soon" (non-active entries are hidden behind a clear status)
 *  - popular   shown in the homepage "Popular Tools" section
 *  - isNew     shown in the homepage "Recently Added" section
 */
const tools = [
    { id: "ai-writing-assistant", name: "AI Writing Assistant", category: "ai-tools", description: "A polished AI writing workspace for rewriting, summaries, outlines and explanations — coming soon.", icon: "sparkles", keywords: ["ai", "rewrite", "summarize", "assignment", "email"], aliases: ["AI writer", "AI assistant"], status: "active", isNew: true, requiresBackend: true, requiresApi: true, requiresInternet: true, processingType: "api", seoIndexable: false },
  { id: "mz-online-word", slug: "online-word", name: "MZ Online Word", category: "office-tools", description: "Write assignments and documents in an A4 rich-text editor with local auto-save and real DOCX/PDF/TXT/HTML export paths.", icon: "file-text", keywords: ["write", "assignment", "write assignment", "assignment editor", "word editor", "online word", "docx editor"], aliases: ["write assignment", "word processor"], status: "active", popular: true, isNew: true },
  { id: "programming-lab", name: "MZ Programming Lab", category: "programming-tools", description: "Write and run browser-supported code now, with more programming languages coming soon.", icon: "code", keywords: ["cpp", "c++", "python", "java", "compiler", "coding lab", "run code", "html css js"], aliases: ["C++ Compiler", "Python Compiler", "Code Runner"], status: "active", popular: true, isNew: true, requiresBackend: false, processingType: "hybrid" },
  { id: "mz-pdf-viewer", slug: "pdf-viewer", name: "MZ PDF Viewer", category: "office-tools", description: "Open and view PDFs locally with thumbnails, page navigation, zoom, rotation, text search, fullscreen, print and download.", icon: "file-search", keywords: ["view pdf", "pdf viewer", "open pdf", "read pdf", "search pdf"], aliases: ["PDF Reader", "Open PDF"], status: "active", popular: true, isNew: true, processingType: "browser" },
  { id: "mz-pdf-editor", slug: "pdf-editor", name: "MZ PDF Editor", category: "office-tools", description: "Open a PDF, manage pages, add text and page numbering, append another PDF, then export a real updated PDF in your browser.", icon: "file-pen-line", keywords: ["edit pdf", "pdf editor", "annotate pdf", "reorder pdf", "delete pdf page", "add page number"], aliases: ["PDF Editor", "Edit PDF"], status: "active", popular: true, isNew: true, processingType: "browser" },
  { id: "mz-online-excel", slug: "online-excel", name: "MZ Online Excel", category: "office-tools", description: "Create multi-sheet spreadsheets, use common formulas, import XLSX/CSV and export genuine XLSX or CSV files in your browser.", icon: "table-2", keywords: ["excel", "spreadsheet", "xlsx", "csv", "formula", "create excel", "online excel"], aliases: ["Excel Online", "Spreadsheet Editor", "Create Spreadsheet"], status: "active", popular: true, isNew: true, processingType: "browser" },
  { id: "mz-powerpoint-viewer", slug: "powerpoint-viewer", name: "MZ PowerPoint Viewer", category: "office-tools", description: "Open real PPTX files locally and inspect slide text and embedded images with thumbnails, zoom, fullscreen, original download and compatibility PDF export.", icon: "presentation", keywords: ["pptx viewer", "powerpoint viewer", "view powerpoint", "open pptx", "view presentation"], aliases: ["PPTX Viewer", "Presentation Viewer"], status: "active", isNew: true, processingType: "browser" },
  { id: "mz-online-powerpoint", slug: "online-powerpoint", name: "MZ Online PowerPoint", category: "office-tools", description: "Build slide decks with editable layouts, images and notes, then export a genuine PPTX presentation in your browser.", icon: "presentation", keywords: ["powerpoint", "pptx", "presentation", "slides", "create presentation", "assignment presentation"], aliases: ["PowerPoint Online", "Presentation Maker", "Create Presentation"], status: "active", popular: true, isNew: true, processingType: "browser" },
  { id: "mz-dictionary", slug: "dictionary", name: "MZ Dictionary", category: "student-tools", description: "Look up real English definitions, pronunciation, examples, synonyms and antonyms from a configured dictionary data source.", icon: "book-open-check", keywords: ["dictionary", "word meaning", "english dictionary", "definition", "synonym", "antonym", "pronunciation"], aliases: ["Word Meaning", "English Dictionary"], status: "active", popular: true, isNew: true, requiresInternet: true, processingType: "api" },
  { id: "smart-document-scanner", name: "Smart Document Scanner", category: "scanner-tools", description: "Scan documents with your camera or photos, straighten pages and export a PDF in your browser.", icon: "scan-line", keywords: ["scan", "scanner", "document scanner", "camera scanner", "photo scanner", "scan to pdf", "crop document", "auto crop", "document crop"], aliases: ["scan document", "smart scanner"], status: "active", popular: true, isNew: true },
  // ---------------------------------------------------------------- Calculators
  { id: "gpa-calculator", name: "GPA & CGPA Calculator for Pakistani Universities", category: "calculators", description: "Calculate GPA and CGPA with explicitly verified university policies when available, or a clearly labeled custom grading scale.", icon: "calculator", keywords: ["gpa", "cgpa", "pakistan university", "grade point average", "semester"], status: "active", popular: true },
  { id: "cgpa-calculator", name: "CGPA Calculator for Pakistani Universities", category: "calculators", description: "Calculate credit-weighted CGPA using an explicitly verified university policy when available, or a clearly labeled custom grading scale.", icon: "calculator", keywords: ["cgpa", "cumulative gpa", "pakistan university", "university"], status: "active", popular: true },
  { id: "percentage-calculator", name: "Percentage Calculator", category: "utility-tools", description: "Find percentages, percentage change and percentage of a total.", icon: "percent", keywords: ["percent", "percentage"], status: "active", popular: true },
  { id: "marks-calculator", name: "Marks Calculator", category: "calculators", description: "Calculate total and average marks across subjects.", icon: "calculator", keywords: ["marks", "total marks", "obtained marks"], status: "active" },
  { id: "grade-calculator", name: "Grade Calculator", category: "calculators", description: "Convert a percentage into a letter grade using an explicitly selected verified policy or a clearly labeled custom manual scale.", icon: "calculator", keywords: ["grade", "letter grade"], status: "active" },
  { id: "attendance-calculator", name: "Attendance Calculator", category: "calculators", description: "Check your attendance percentage and how many classes you can safely miss.", icon: "calendar-check", keywords: ["attendance", "classes", "75%"], status: "active", popular: true },
  { id: "age-calculator", name: "Age Calculator", category: "utility-tools", description: "Calculate exact age in years, months and days from a date of birth.", icon: "cake", keywords: ["age", "date of birth", "dob"], status: "active" },
  { id: "discount-calculator", name: "Discount Calculator", category: "utility-tools", description: "Calculate the discounted price and amount saved.", icon: "tag", keywords: ["discount", "sale price"], status: "active" },
  { id: "average-calculator", name: "Average Calculator", category: "utility-tools", description: "Find the average (mean) of a list of numbers.", icon: "sigma", keywords: ["average", "mean"], status: "active" },
  { id: "ratio-calculator", name: "Ratio Calculator", category: "utility-tools", description: "Simplify ratios and solve for a missing value.", icon: "divide", keywords: ["ratio", "proportion"], status: "active" },
  { id: "time-calculator", name: "Time Calculator", category: "utility-tools", description: "Add or subtract hours, minutes and seconds.", icon: "clock", keywords: ["time", "duration"], status: "active" },
  { id: "study-hours-calculator", name: "Study Hours Calculator", category: "calculators", description: "Plan how many hours a day you need to study before an exam.", icon: "clock", keywords: ["study hours", "exam prep"], status: "active" },

  // ---------------------------------------------------------------- PDF Tools
  { id: "pdf-merger", name: "Merge PDF", category: "pdf-tools", description: "Combine multiple PDF files into a single document, in your browser.", icon: "file-plus", keywords: ["merge pdf", "combine pdf"], status: "active", popular: true },
  { id: "pdf-splitter", name: "Split PDF", category: "pdf-tools", description: "Split a PDF into separate files by page range.", icon: "scissors", keywords: ["split pdf"], status: "active" },
  { id: "pdf-compressor", name: "Compress PDF", category: "pdf-tools", description: "Reduce PDF size with measured results and clear quality modes; MZ never claims savings that were not achieved.", icon: "file-down", keywords: ["compress pdf", "reduce pdf size"], status: "active", popular: true },
  { id: "pdf-to-jpg", name: "PDF to JPG", category: "pdf-tools", description: "Convert PDF pages into JPG images.", icon: "image", keywords: ["pdf to jpg", "pdf to image"], status: "active" },
  { id: "jpg-to-pdf", name: "JPG to PDF", category: "pdf-tools", description: "Arrange JPG/PNG images and create a validated PDF using the original image sources.", icon: "file-plus", keywords: ["jpg to pdf", "image to pdf"], status: "active", popular: true },
  { id: "pdf-to-png", name: "PDF to PNG", category: "pdf-tools", description: "Convert PDF pages into PNG images.", icon: "image", keywords: ["pdf to png"], status: "active" },
  { id: "pdf-rotator", name: "Rotate PDF", category: "pdf-tools", description: "Rotate one or more pages in a PDF file.", icon: "rotate-cw", keywords: ["rotate pdf"], status: "active" },
  { id: "pdf-delete-pages", name: "Delete PDF Pages", category: "pdf-tools", description: "Remove specific pages from a PDF.", icon: "file-x", keywords: ["delete pdf pages", "remove pages"], status: "active" },
  { id: "pdf-extract-pages", name: "Extract PDF Pages", category: "pdf-tools", description: "Pull out specific pages into a new PDF.", icon: "file-output", keywords: ["extract pdf pages"], status: "active" },
  { id: "pdf-reorder-pages", name: "Reorder PDF Pages", category: "pdf-tools", description: "Drag and drop to rearrange PDF pages.", icon: "list-ordered", keywords: ["reorder pdf pages", "rearrange"], status: "active" },
  { id: "pdf-page-counter", name: "PDF Page Counter", category: "pdf-tools", description: "Instantly see how many pages are in a PDF.", icon: "hash", keywords: ["pdf page count"], status: "active" },
  { id: "pdf-watermark", name: "Add Watermark", category: "pdf-tools", description: "Add a text watermark across every page of a PDF.", icon: "stamp", keywords: ["watermark pdf"], status: "active" },
  { id: "pdf-metadata-viewer", name: "PDF Metadata Viewer", category: "pdf-tools", description: "View a PDF's title, author, creation date and other metadata.", icon: "info", keywords: ["pdf metadata", "pdf properties"], status: "active" },

  // ---------------------------------------------------------------- Image Tools
  { id: "image-compressor", name: "Image Compressor", category: "image-tools", description: "Reduce image file size while preserving quality.", icon: "image-down", keywords: ["compress image", "reduce image size"], status: "active", popular: true },
  { id: "image-resizer", name: "Image Resizer", category: "image-tools", description: "Resize an image to exact pixel dimensions.", icon: "scaling", keywords: ["resize image"], status: "active" },
  { id: "jpg-to-png", name: "JPG to PNG", category: "image-tools", description: "Convert JPG images to PNG format.", icon: "image", keywords: ["jpg to png"], status: "active" },
  { id: "png-to-jpg", name: "PNG to JPG", category: "image-tools", description: "Convert PNG images to JPG format.", icon: "image", keywords: ["png to jpg"], status: "active" },
  { id: "jpg-to-webp", name: "JPG to WebP", category: "image-tools", description: "Convert JPG images to the modern WebP format.", icon: "image", keywords: ["jpg to webp"], status: "active" },
  { id: "png-to-webp", name: "PNG to WebP", category: "image-tools", description: "Convert PNG images to the modern WebP format.", icon: "image", keywords: ["png to webp"], status: "active" },
  { id: "webp-to-jpg", name: "WebP to JPG", category: "image-tools", description: "Convert WebP images to JPG format.", icon: "image", keywords: ["webp to jpg"], status: "active" },
  { id: "image-cropper", name: "Image Cropper", category: "image-tools", description: "Crop an image to the exact area you need.", icon: "crop", keywords: ["crop image"], status: "active" },
  { id: "image-rotator", name: "Image Rotator", category: "image-tools", description: "Rotate or flip an image.", icon: "rotate-cw", keywords: ["rotate image"], status: "active" },
  { id: "image-to-pdf", name: "Image to PDF", category: "image-tools", description: "Convert one or more images into a PDF file.", icon: "file-plus", keywords: ["image to pdf"], status: "active" },
  { id: "passport-photo-resizer", name: "Passport Photo Resizer", category: "image-tools", description: "Resize and crop a photo to standard passport/ID sizes.", icon: "id-card", keywords: ["passport photo", "id photo"], status: "active", popular: true },

  // ---------------------------------------------------------------- Text Tools
  { id: "word-counter", name: "Word Counter", category: "text-tools", description: "Count words, characters, sentences and paragraphs instantly.", icon: "type", keywords: ["word count", "character count"], status: "active", popular: true },
  { id: "character-counter", name: "Character Counter", category: "text-tools", description: "Count characters with and without spaces.", icon: "type", keywords: ["character count"], status: "active" },
  { id: "sentence-counter", name: "Sentence Counter", category: "text-tools", description: "Count the number of sentences in your text.", icon: "type", keywords: ["sentence count"], status: "active" },
  { id: "case-converter", name: "Case Converter", category: "text-tools", description: "Convert text to UPPERCASE, lowercase, Title Case and more.", icon: "case-sensitive", keywords: ["uppercase", "lowercase", "title case"], status: "active" },
  { id: "remove-extra-spaces", name: "Remove Extra Spaces", category: "text-tools", description: "Clean up double spaces and stray whitespace from text.", icon: "eraser", keywords: ["remove spaces", "trim text"], status: "active" },
  { id: "remove-duplicate-lines", name: "Remove Duplicate Lines", category: "text-tools", description: "Delete repeated lines from a block of text.", icon: "layers", keywords: ["duplicate lines"], status: "active" },
  { id: "text-cleaner", name: "Text Cleaner", category: "text-tools", description: "Strip formatting, extra line breaks and hidden characters from text.", icon: "sparkles", keywords: ["clean text"], status: "active" },
  { id: "text-sorter", name: "Text Sorter", category: "text-tools", description: "Sort lines of text alphabetically or by length.", icon: "arrow-down-a-z", keywords: ["sort text", "sort lines"], status: "active" },
  { id: "text-reverser", name: "Text Reverser", category: "text-tools", description: "Reverse text, words or line order.", icon: "flip-horizontal", keywords: ["reverse text"], status: "active" },
  { id: "text-to-slug", name: "Text to Slug", category: "text-tools", description: "Convert text into a URL-friendly slug.", icon: "link", keywords: ["slugify", "url slug"], status: "active" },
  { id: "reading-time-calculator", name: "Reading Time Calculator", category: "text-tools", description: "Estimate how long it will take to read a piece of text.", icon: "book-open", keywords: ["reading time"], status: "active" },

  { id: "line-counter", name: "Line Counter", category: "text-tools", description: "Count total, non-empty and unique lines in text.", icon: "list-ordered", keywords: ["line count", "lines"], status: "active" },

  // ---------------------------------------------------------------- Developer Tools
  { id: "json-viewer", name: "JSON Viewer", category: "developer-tools", description: "Inspect valid JSON as a readable formatted tree-style text view.", icon: "braces", keywords: ["json tree", "json viewer", "inspect json"], status: "active" },
  { id: "json-formatter", name: "JSON Formatter", category: "developer-tools", description: "Format and beautify messy JSON.", icon: "braces", keywords: ["json format", "beautify json"], status: "active", popular: true },
  { id: "json-validator", name: "JSON Validator", category: "developer-tools", description: "Check whether a JSON document is valid.", icon: "check-circle", keywords: ["validate json"], status: "active" },
  { id: "json-minifier", name: "JSON Minifier", category: "developer-tools", description: "Minify JSON by removing whitespace.", icon: "minimize-2", keywords: ["minify json"], status: "active" },
  { id: "base64-encoder", name: "Base64 Encoder", category: "developer-tools", description: "Encode text or files into Base64.", icon: "lock", keywords: ["base64 encode"], status: "active" },
  { id: "base64-decoder", name: "Base64 Decoder", category: "developer-tools", description: "Decode Base64 back into text.", icon: "unlock", keywords: ["base64 decode"], status: "active" },
  { id: "url-encoder", name: "URL Encoder", category: "developer-tools", description: "Percent-encode a URL or query string.", icon: "link", keywords: ["url encode"], status: "active" },
  { id: "url-decoder", name: "URL Decoder", category: "developer-tools", description: "Decode a percent-encoded URL.", icon: "link", keywords: ["url decode"], status: "active" },
  { id: "html-formatter", name: "HTML Formatter", category: "developer-tools", description: "Beautify and indent HTML markup.", icon: "code", keywords: ["format html"], status: "active" },
  { id: "css-formatter", name: "CSS Formatter", category: "developer-tools", description: "Beautify and indent CSS.", icon: "code", keywords: ["format css"], status: "active" },
  { id: "javascript-formatter", name: "JavaScript Formatter", category: "developer-tools", description: "Beautify and indent JavaScript code.", icon: "code", keywords: ["format javascript", "js beautifier"], status: "active" },
  { id: "regex-tester", name: "Regex Tester", category: "developer-tools", description: "Test regular expressions against sample text with live matches.", icon: "regex", keywords: ["regex", "regular expression"], status: "active", popular: true },
  { id: "binary-converter", name: "Binary Converter", category: "developer-tools", description: "Convert numbers to and from binary.", icon: "binary", keywords: ["binary"], status: "active" },
  { id: "decimal-converter", name: "Decimal Converter", category: "developer-tools", description: "Convert numbers to and from decimal.", icon: "hash", keywords: ["decimal"], status: "active" },
  { id: "hex-converter", name: "Hex Converter", category: "developer-tools", description: "Convert numbers to and from hexadecimal.", icon: "hash", keywords: ["hex", "hexadecimal"], status: "active" },
  { id: "unix-timestamp-converter", name: "Unix Timestamp Converter", category: "developer-tools", description: "Convert explicit Unix seconds or milliseconds to UTC and local date-time without guessing the unit.", icon: "clock", keywords: ["unix timestamp", "epoch"], status: "active" },
  { id: "uuid-generator", name: "UUID Generator", category: "developer-tools", description: "Generate random UUID v4 identifiers.", icon: "fingerprint", keywords: ["uuid", "guid"], status: "active" },
  { id: "password-generator", name: "Password Generator", category: "developer-tools", description: "Generate strong, random passwords.", icon: "key", keywords: ["password generator"], status: "active", popular: true },

  // ---------------------------------------------------------------- Student Document Tools
  { id: "assignment-cover-page-generator", name: "Assignment Cover Page Generator", category: "document-tools", description: "Create a clean cover page for university assignments.", icon: "file-signature", keywords: ["assignment cover page", "cover page"], status: "active", popular: true },
  { id: "student-cv-builder", name: "Student CV Builder", category: "document-tools", description: "Build a simple, professional CV as a student.", icon: "file-user", keywords: ["cv builder", "student cv"], status: "active" },
  { id: "resume-builder", name: "Resume Builder", category: "document-tools", description: "Build a clean, ATS-friendly resume.", icon: "file-user", keywords: ["resume builder"], status: "active", popular: true },
  { id: "cover-letter-generator", name: "Cover Letter Generator", category: "document-tools", description: "Generate a customizable cover letter.", icon: "mail", keywords: ["cover letter"], status: "active" },
  { id: "application-generator", name: "Simple Application Generator", category: "document-tools", description: "Generate a simple formal application letter.", icon: "file-text", keywords: ["application letter"], status: "active" },
  { id: "study-timetable-generator", name: "Study Timetable Generator", category: "document-tools", description: "Build and print a weekly study timetable.", icon: "calendar", keywords: ["timetable", "study schedule"], status: "active" },
  { id: "project-report-cover-generator", name: "Project Report Cover Generator", category: "document-tools", description: "Create a cover page for a project report.", icon: "file-signature", keywords: ["project report cover"], status: "active" },

  { id: "internship-application", name: "Internship Application", category: "document-tools", description: "Generate a structured internship application document from your details.", icon: "file-signature", keywords: ["internship", "application letter"], status: "active" },
  { id: "leave-application", name: "Leave Application", category: "document-tools", description: "Generate a professional leave application document.", icon: "file-signature", keywords: ["leave letter", "leave application"], status: "active" },
  { id: "scholarship-application", name: "Scholarship Application", category: "document-tools", description: "Generate a structured scholarship application document.", icon: "file-signature", keywords: ["scholarship letter", "scholarship application"], status: "active" },

  // ---------------------------------------------------------------- University Tools
  { id: "university-aggregate-calculator", name: "University Aggregate Calculator", category: "university-tools", description: "Calculate your admission aggregate from matric, intermediate and test scores.", icon: "percent", keywords: ["aggregate calculator", "admission aggregate"], status: "active", popular: true },
  { id: "merit-calculator", name: "Merit Calculator", category: "university-tools", description: "Estimate your merit position for university admission.", icon: "trophy", keywords: ["merit calculator"], status: "active" },
  { id: "semester-calculator", name: "Semester Calculator", category: "university-tools", description: "Calculate your GPA for a single semester.", icon: "calculator", keywords: ["semester gpa"], status: "active" },
  { id: "credit-hour-calculator", name: "Credit Hour Calculator", category: "university-tools", description: "Calculate weighted grade points based on credit hours.", icon: "calculator", keywords: ["credit hours"], status: "active" },
  { id: "scholarship-percentage-calculator", name: "Scholarship Percentage Calculator", category: "university-tools", description: "Estimate scholarship eligibility from your percentage or CGPA.", icon: "percent", keywords: ["scholarship calculator"], status: "active" },

  // ---------------------------------------------------------------- Productivity Tools
  { id: "pomodoro-timer", name: "Pomodoro Timer", category: "productivity-tools", description: "Study in focused Pomodoro sessions with short breaks.", icon: "timer", keywords: ["pomodoro", "focus timer"], status: "active", popular: true, isNew: true },
  { id: "stopwatch", name: "Stopwatch", category: "productivity-tools", description: "A simple, accurate stopwatch with lap times.", icon: "timer", keywords: ["stopwatch"], status: "active", isNew: true },
  { id: "countdown-timer", name: "Countdown Timer", category: "productivity-tools", description: "Count down to an exam, deadline or event.", icon: "hourglass", keywords: ["countdown timer"], status: "active", isNew: true },
  { id: "study-timer", name: "Study Timer", category: "productivity-tools", description: "Track how long you've studied today.", icon: "timer", keywords: ["study timer"], status: "active" },
  { id: "todo-list", name: "To-Do List", category: "productivity-tools", description: "A simple, distraction-free to-do list.", icon: "list-checks", keywords: ["todo list", "task list"], status: "active", isNew: true },
  { id: "daily-study-planner", name: "Daily Study Planner", category: "productivity-tools", description: "Plan your study day hour by hour.", icon: "calendar-days", keywords: ["study planner"], status: "active" },
  { id: "random-study-topic-generator", name: "Random Study Topic Generator", category: "productivity-tools", description: "Get a random topic suggestion from your subject list.", icon: "shuffle", keywords: ["random topic generator"], status: "active" },

// ---------------------------------------------------------------- Phase 14-style expansion: browser-first utility suite
  { id: "pdf-to-word", name: "PDF to Word", category: "pdf-tools", description: "Create a real DOCX from selectable PDF text with an honest text-focused conversion workflow.", icon: "file-text", keywords: ["pdf word", "convert pdf to doc"], status: "active" },
  { id: "pdf-to-excel", name: "PDF to Excel", category: "pdf-tools", description: "Extract selectable PDF text into a real XLSX workbook with page, line and text columns.", icon: "file-text", keywords: ["pdf excel", "pdf csv"], status: "active" },
  { id: "pdf-to-powerpoint", name: "PDF to PowerPoint", category: "pdf-tools", description: "Create a real PPTX as high-quality page slides or a simplified editable text outline.", icon: "file-text", keywords: ["pdf ppt", "pdf presentation"], status: "active" },
  { id: "pdf-to-text", name: "PDF to Text", category: "pdf-tools", description: "Extract selectable text from a PDF locally in your browser.", icon: "file-text", keywords: ["pdf text extraction"], status: "active" },
  { id: "pdf-ocr", name: "PDF OCR", category: "pdf-tools", description: "Render PDF pages and run real local OCR with Tesseract.js to extract text.", icon: "scan-line", keywords: ["ocr pdf", "extract pdf text"], status: "active" },
  { id: "scanned-pdf-to-searchable-pdf", name: "Scanned PDF to Searchable PDF", category: "pdf-tools", description: "OCR image-only PDF pages and add an invisible selectable text layer while preserving the original page appearance.", icon: "scan-line", keywords: ["searchable pdf", "ocr"], status: "active" },
  { id: "text-to-pdf", name: "Text to PDF", category: "document-tools", description: "Create a clean PDF from plain text in your browser.", icon: "file-text", keywords: ["txt pdf"], status: "active" },
  { id: "markdown-to-pdf", name: "Markdown to PDF", category: "document-tools", description: "Render Markdown-like text into a simple PDF document.", icon: "file-text", keywords: ["markdown pdf"], status: "active" },
  { id: "docx-viewer", name: "DOCX Viewer", category: "document-tools", description: "Inspect a DOCX package and download its document text where available.", icon: "file-text", keywords: ["docx viewer", "word viewer"], status: "active" },
  { id: "docx-text-extractor", name: "DOCX Text Extractor", category: "document-tools", description: "Extract readable XML text from a DOCX package in the browser.", icon: "file-text", keywords: ["docx text"], status: "active" },
  { id: "txt-to-docx", name: "TXT to DOCX", category: "document-tools", description: "Create a real DOCX document from plain text in the browser.", icon: "file-text", keywords: ["txt docx"], status: "active" },
  { id: "html-to-docx", name: "HTML to DOCX", category: "document-tools", description: "Create a real DOCX document from HTML text content in the browser.", icon: "code", keywords: ["html docx"], status: "active" },
  { id: "markdown-to-html", name: "Markdown to HTML", category: "document-tools", description: "Convert basic Markdown syntax to downloadable HTML.", icon: "code", keywords: ["markdown html"], status: "active" },
  { id: "markdown-formatter", name: "Markdown Formatter", category: "document-tools", description: "Clean common Markdown spacing and heading structure.", icon: "type", keywords: ["markdown format"], status: "active" },
  { id: "document-statistics", name: "Document Statistics", category: "document-tools", description: "Measure words, characters, sentences, paragraphs and reading time.", icon: "sigma", keywords: ["document stats"], status: "active" },
  { id: "find-replace", name: "Find & Replace", category: "text-tools", description: "Replace text throughout a document with a live preview.", icon: "type", keywords: ["find replace"], status: "active" },
  { id: "whitespace-cleaner", name: "Whitespace Cleaner", category: "text-tools", description: "Normalize spaces, tabs and excessive blank lines.", icon: "eraser", keywords: ["whitespace", "clean spaces"], status: "active" },
  { id: "line-break-cleaner", name: "Line Break Cleaner", category: "text-tools", description: "Turn unwanted line breaks into clean flowing text.", icon: "eraser", keywords: ["remove line breaks"], status: "active" },
  { id: "speaking-time-calculator", name: "Speaking Time Calculator", category: "text-tools", description: "Estimate speaking time from word count.", icon: "clock", keywords: ["speaking time"], status: "active" },
  { id: "alternating-case", name: "Alternating Case", category: "text-tools", description: "Convert letters into alternating upper/lower case.", icon: "case-sensitive", keywords: ["alternating case"], status: "active" },
  { id: "title-case", name: "Title Case", category: "text-tools", description: "Convert text to title case.", icon: "case-sensitive", keywords: ["title case"], status: "active" },
  { id: "sentence-case", name: "Sentence Case", category: "text-tools", description: "Normalize text into sentence case.", icon: "case-sensitive", keywords: ["sentence case"], status: "active" },
  { id: "extract-emails", name: "Extract Emails", category: "text-tools", description: "Find email addresses inside pasted text.", icon: "mail", keywords: ["email extractor"], status: "active" },
  { id: "extract-urls", name: "Extract URLs", category: "text-tools", description: "Find HTTP and HTTPS URLs inside text.", icon: "link", keywords: ["url extractor"], status: "active" },
  { id: "extract-numbers", name: "Extract Numbers", category: "text-tools", description: "Extract numeric values from text.", icon: "hash", keywords: ["number extractor"], status: "active" },
  { id: "temperature-converter", name: "Temperature Converter", category: "converter-tools", description: "Convert Celsius, Fahrenheit, Kelvin and Rankine.", icon: "calculator", keywords: ["celsius fahrenheit", "temperature"], status: "active", popular: true },
  { id: "length-converter", name: "Length Converter", category: "converter-tools", description: "Convert metric, imperial and nautical length units.", icon: "divide", keywords: ["length", "distance converter"], status: "active" },
  { id: "weight-converter", name: "Weight Converter", category: "converter-tools", description: "Convert grams, kilograms, pounds, ounces, stones and tons.", icon: "calculator", keywords: ["weight", "mass converter"], status: "active" },
  { id: "area-converter", name: "Area Converter", category: "converter-tools", description: "Convert square units, acres and hectares.", icon: "calculator", keywords: ["area converter"], status: "active" },
  { id: "volume-converter", name: "Volume Converter", category: "converter-tools", description: "Convert liters, milliliters, cups, pints, quarts and gallons.", icon: "calculator", keywords: ["volume converter"], status: "active" },
  { id: "time-unit-converter", name: "Time Unit Converter", category: "converter-tools", description: "Convert milliseconds through years using a reusable conversion engine.", icon: "clock", keywords: ["time units"], status: "active" },
  { id: "speed-converter", name: "Speed Converter", category: "converter-tools", description: "Convert km/h, mph, m/s and knots.", icon: "calculator", keywords: ["speed converter"], status: "active" },
  { id: "data-unit-converter", name: "Data Unit Converter", category: "converter-tools", description: "Convert bits, bytes, KB, MB, GB and TB.", icon: "calculator", keywords: ["data converter", "mb gb"], status: "active" },
  { id: "pressure-converter", name: "Pressure Converter", category: "converter-tools", description: "Convert Pa, kPa, bar, PSI and atm.", icon: "calculator", keywords: ["pressure converter"], status: "active" },
  { id: "energy-converter", name: "Energy Converter", category: "converter-tools", description: "Convert joules, calories, kilocalories and kWh.", icon: "calculator", keywords: ["energy converter"], status: "active" },
  { id: "power-converter", name: "Power Converter", category: "converter-tools", description: "Convert watts, kilowatts and horsepower.", icon: "calculator", keywords: ["power converter"], status: "active" },
  { id: "cm-to-feet", name: "CM to Feet & Inches", category: "converter-tools", description: "Convert centimeters into feet and inches.", icon: "calculator", keywords: ["cm feet", "height converter"], status: "active" },
  { id: "kg-to-lbs", name: "KG to LBS", category: "converter-tools", description: "Convert kilograms to pounds and back.", icon: "calculator", keywords: ["kg lbs"], status: "active" },
  { id: "date-difference-calculator", name: "Date Difference Calculator", category: "date-time-tools", description: "Find the number of days between two dates.", icon: "calendar", keywords: ["date difference"], status: "active" },
  { id: "days-between-dates", name: "Days Between Dates", category: "date-time-tools", description: "Count calendar days between two dates.", icon: "calendar", keywords: ["days between"], status: "active" },
  { id: "weeks-between-dates", name: "Weeks Between Dates", category: "date-time-tools", description: "Estimate the number of weeks between dates.", icon: "calendar", keywords: ["weeks between"], status: "active" },
  { id: "months-between-dates", name: "Months Between Dates", category: "date-time-tools", description: "Estimate months between two dates.", icon: "calendar", keywords: ["months between"], status: "active" },
  { id: "years-between-dates", name: "Years Between Dates", category: "date-time-tools", description: "Estimate years between two dates.", icon: "calendar", keywords: ["years between"], status: "active" },
  { id: "date-plus-days", name: "Date + Days", category: "date-time-tools", description: "Add days to a date.", icon: "calendar", keywords: ["add days"], status: "active" },
  { id: "date-minus-days", name: "Date - Days", category: "date-time-tools", description: "Subtract days from a date.", icon: "calendar", keywords: ["subtract days"], status: "active" },
  { id: "age-calculator-plus", name: "Age Calculator Pro", category: "date-time-tools", description: "Calculate age from a date of birth.", icon: "cake", keywords: ["age calculator"], status: "active" },
  { id: "working-days-calculator", name: "Working Days Calculator", category: "date-time-tools", description: "Count weekdays between two dates.", icon: "calendar-check", keywords: ["working days"], status: "active" },
  { id: "business-days-calculator", name: "Business Days Calculator", category: "date-time-tools", description: "Count Monday–Friday business days between dates.", icon: "calendar-check", keywords: ["business days"], status: "active" },
  { id: "bmi-calculator", name: "BMI Calculator", category: "health-tools", description: "Estimate adult BMI from height and weight.", icon: "calculator", keywords: ["bmi", "body mass index"], status: "active", popular: true },
  { id: "bmr-calculator", name: "BMR Calculator", category: "health-tools", description: "Estimate basal metabolic rate using Mifflin–St Jeor.", icon: "calculator", keywords: ["bmr"], status: "active" },
  { id: "tdee-calculator", name: "TDEE Calculator", category: "health-tools", description: "Estimate total daily energy expenditure from activity.", icon: "calculator", keywords: ["tdee"], status: "active" },
  { id: "calorie-calculator", name: "Calorie Calculator", category: "nutrition-tools", description: "Estimate daily calories from BMR and activity.", icon: "calculator", keywords: ["calories", "calorie calculator"], status: "active", popular: true },
  { id: "calorie-deficit-calculator", name: "Calorie Deficit Calculator", category: "nutrition-tools", description: "Estimate a modest calorie-deficit target.", icon: "calculator", keywords: ["calorie deficit"], status: "active" },
  { id: "calorie-surplus-calculator", name: "Calorie Surplus Calculator", category: "nutrition-tools", description: "Estimate a modest calorie-surplus target.", icon: "calculator", keywords: ["calorie surplus"], status: "active" },
  { id: "maintenance-calories", name: "Maintenance Calories", category: "nutrition-tools", description: "Estimate maintenance calories from activity.", icon: "calculator", keywords: ["maintenance calories"], status: "active" },
  { id: "weight-loss-calorie-calculator", name: "Weight Loss Calories", category: "nutrition-tools", description: "Estimate an informational weight-loss calorie target.", icon: "calculator", keywords: ["weight loss calories"], status: "active" },
  { id: "weight-gain-calorie-calculator", name: "Weight Gain Calories", category: "nutrition-tools", description: "Estimate an informational weight-gain calorie target.", icon: "calculator", keywords: ["weight gain calories"], status: "active" },
  { id: "protein-intake-calculator", name: "Protein Intake Calculator", category: "nutrition-tools", description: "Estimate daily protein from body weight.", icon: "calculator", keywords: ["protein"], status: "active" },
  { id: "carbohydrate-calculator", name: "Carbohydrate Calculator", category: "nutrition-tools", description: "Estimate a carbohydrate target from calorie intake.", icon: "calculator", keywords: ["carbs"], status: "active" },
  { id: "fat-intake-calculator", name: "Fat Intake Calculator", category: "nutrition-tools", description: "Estimate dietary fat from calorie intake.", icon: "calculator", keywords: ["fat intake"], status: "active" },
  { id: "water-intake-estimator", name: "Water Intake Estimator", category: "nutrition-tools", description: "Estimate a starting daily hydration target.", icon: "calculator", keywords: ["water intake", "hydration"], status: "active" },
  { id: "ideal-weight-calculator", name: "Ideal Weight Calculator", category: "health-tools", description: "Show a reference BMI-based weight range.", icon: "calculator", keywords: ["ideal weight"], status: "active" },
  { id: "healthy-weight-range-calculator", name: "Healthy Weight Range", category: "health-tools", description: "Show a reference adult BMI-based weight range.", icon: "calculator", keywords: ["healthy weight"], status: "active" },
  { id: "body-surface-area-calculator", name: "Body Surface Area", category: "health-tools", description: "Estimate body surface area from height and weight.", icon: "calculator", keywords: ["bsa"], status: "active" },
  { id: "lean-body-mass-calculator", name: "Lean Body Mass Calculator", category: "health-tools", description: "Provide a simple BMI-derived lean-mass estimate.", icon: "calculator", keywords: ["lean body mass"], status: "active" },
  { id: "heart-rate-zone-calculator", name: "Heart Rate Zone Calculator", category: "health-tools", description: "Estimate heart-rate training zones from age.", icon: "calculator", keywords: ["heart rate zone"], status: "active" },
  { id: "target-heart-rate-calculator", name: "Target Heart Rate Calculator", category: "health-tools", description: "Estimate a moderate training heart-rate zone.", icon: "calculator", keywords: ["target heart rate"], status: "active" },
  { id: "pulse-counter", name: "Pulse Counter", category: "health-tools", description: "Tap for each pulse during a timed interval and estimate BPM.", icon: "calendar-check", keywords: ["pulse", "bpm", "heart rate"], status: "active", popular: true },
  { id: "simple-interest-calculator", name: "Simple Interest Calculator", category: "finance-tools", description: "Calculate simple interest and total amount.", icon: "calculator", keywords: ["simple interest"], status: "active" },
  { id: "compound-interest-calculator", name: "Compound Interest Calculator", category: "finance-tools", description: "Estimate compound growth from principal, rate and years.", icon: "calculator", keywords: ["compound interest"], status: "active" },
  { id: "emi-calculator", name: "EMI Calculator", category: "finance-tools", description: "Estimate a monthly loan installment.", icon: "calculator", keywords: ["emi", "loan"], status: "active" },
  { id: "loan-payment-calculator", name: "Loan Payment Calculator", category: "finance-tools", description: "Estimate monthly loan payments.", icon: "calculator", keywords: ["loan payment"], status: "active" },
  { id: "savings-goal-calculator", name: "Savings Goal Calculator", category: "finance-tools", description: "Estimate months needed to reach a savings goal without investment growth.", icon: "calculator", keywords: ["savings goal"], status: "active" },
  { id: "investment-growth-calculator", name: "Investment Growth Calculator", category: "finance-tools", description: "Estimate compound growth of a single initial investment over time.", icon: "calculator", keywords: ["investment growth"], status: "active" },
  { id: "profit-margin-calculator", name: "Profit Margin Calculator", category: "finance-tools", description: "Calculate margin and markup from cost and sale price.", icon: "percent", keywords: ["profit margin", "markup"], status: "active" },
  { id: "percentage-change-calculator", name: "Percentage Change Calculator", category: "finance-tools", description: "Calculate percentage increase or decrease.", icon: "percent", keywords: ["percentage change"], status: "active" },
  { id: "budget-planner", name: "Budget Planner", category: "finance-tools", description: "Calculate monthly expenses, remaining income and deficit from your own budget entries.", icon: "calendar", keywords: ["budget"], status: "active" },
  { id: "salary-breakdown-calculator", name: "Salary Breakdown Calculator", category: "finance-tools", description: "Convert annual salary into monthly, weekly and working-day equivalents.", icon: "calculator", keywords: ["salary"], status: "active" },
  { id: "loan-affordability-calculator", name: "Loan Affordability Calculator", category: "finance-tools", description: "Estimate a simple annual-income-multiple borrowing ceiling; not lender approval.", icon: "calculator", keywords: ["loan affordability"], status: "active" },
  { id: "tip-calculator", name: "Tip Calculator", category: "daily-life-tools", description: "Calculate a tip and total bill.", icon: "percent", keywords: ["tip"], status: "active" },
  { id: "bill-splitter", name: "Bill Splitter", category: "daily-life-tools", description: "Split a bill evenly across people.", icon: "divide", keywords: ["split bill"], status: "active" },
  { id: "tax-calculator", name: "Tax Calculator", category: "daily-life-tools", description: "Apply a user-supplied tax percentage.", icon: "percent", keywords: ["tax"], status: "active" },
  { id: "fuel-cost-calculator", name: "Fuel Cost Calculator", category: "daily-life-tools", description: "Estimate fuel cost from quantity and unit price.", icon: "calculator", keywords: ["fuel cost"], status: "active" },
  { id: "speed-distance-time", name: "Speed Distance Time Calculator", category: "daily-life-tools", description: "Calculate speed from distance and time.", icon: "clock", keywords: ["speed distance time"], status: "active" },
  { id: "pace-calculator", name: "Pace Calculator", category: "daily-life-tools", description: "Estimate pace from distance and elapsed time.", icon: "clock", keywords: ["pace"], status: "active" },
  { id: "running-pace-calculator", name: "Running Pace Calculator", category: "daily-life-tools", description: "Estimate running pace from distance and time.", icon: "clock", keywords: ["running pace"], status: "active" },
  { id: "study-hours-calculator-plus", name: "Study Hours Calculator Pro", category: "student-tools", description: "Estimate daily study hours from total workload and days available.", icon: "clock", keywords: ["study hours"], status: "active" },
  { id: "percentage-calculator-plus", name: "Percentage Calculator Pro", category: "student-tools", description: "Calculate a percentage of a value.", icon: "percent", keywords: ["percentage"], status: "active" },
  { id: "marks-required-calculator", name: "Marks Required Calculator", category: "student-tools", description: "Estimate the final score required to reach a target weighted mark.", icon: "calculator", keywords: ["marks required", "final marks"], status: "active" },
  { id: "smart-study-schedule-generator", name: "Smart Study Schedule Generator", category: "productivity-tools", description: "Generate a simple editable study allocation from subjects, hours and duration.", icon: "calendar-days", keywords: ["study schedule", "study planner"], status: "active", popular: true },
  { id: "pakistan-university-gpa-calculator", name: "Pakistan University GPA Calculator", category: "university-tools", description: "Select a Pakistani university and calculate GPA only when its grading policy is verified; otherwise use a custom scale.", icon: "graduation-cap", keywords: ["pakistan gpa", "university gpa", "pakistan university"], status: "active", popular: true },
  { id: "uol-gpa-calculator", name: "UOL GPA Calculator", category: "university-tools", description: "UOL policy data is listed for review, but calculation is blocked until the current official policy is explicitly verified in this release; custom scale remains available.", icon: "graduation-cap", keywords: ["uol gpa", "university of lahore"], status: "active", popular: true },
  { id: "ucp-gpa-calculator", name: "UCP GPA Calculator", category: "university-tools", description: "UCP policy data is listed for review, but calculation is blocked until the current official policy is explicitly verified in this release; custom scale remains available.", icon: "graduation-cap", keywords: ["ucp gpa", "university of central punjab"], status: "active", popular: true },
  { id: "custom-gpa-calculator", name: "Custom University GPA Calculator", category: "university-tools", description: "Build your own grade-to-point mapping for institutions not yet verified in the data layer.", icon: "graduation-cap", keywords: ["custom gpa", "custom grading scale"], status: "active" },
  { id: "hash-generator", name: "SHA-256 Hash Generator", category: "developer-tools", description: "Hash text with the browser's native Web Crypto API.", icon: "fingerprint", keywords: ["sha256", "hash"], status: "active" },
  { id: "color-converter", name: "Color Converter (HEX ↔ RGB)", category: "developer-tools", description: "Convert between HEX and RGB with validation and a real color preview.", icon: "calculator", keywords: ["hex rgb", "rgb hex", "color converter"], status: "active" },
  { id: "rgb-to-hex", name: "RGB to HEX", category: "developer-tools", description: "Convert RGB values to a HEX color.", icon: "calculator", keywords: ["rgb hex"], status: "active" },
  { id: "hex-to-rgb", name: "HEX to RGB", category: "developer-tools", description: "Convert a HEX color to RGB values.", icon: "calculator", keywords: ["hex rgb"], status: "active" },
  { id: "html-escape", name: "HTML Escape", category: "developer-tools", description: "Escape HTML-sensitive characters locally.", icon: "code", keywords: ["html escape"], status: "active" },
  { id: "html-unescape", name: "HTML Unescape", category: "developer-tools", description: "Decode common named and numeric HTML entities locally without executing markup.", icon: "code", keywords: ["html unescape", "html entities"], status: "active" },
  { id: "lorem-ipsum-generator", name: "Lorem Ipsum Generator", category: "developer-tools", description: "Generate a ready-to-copy placeholder paragraph.", icon: "type", keywords: ["lorem ipsum"], status: "active" },
  { id: "unix-timestamp-converter-plus", name: "Unix Timestamp Converter Pro", category: "developer-tools", description: "Convert Unix seconds, milliseconds or microseconds to dates and convert ISO date-times back to timestamps.", icon: "clock", keywords: ["unix timestamp", "epoch", "milliseconds", "microseconds"], aliases: ["Unix Timestamp Converter Pro"], status: "active" },
  { id: "image-metadata-viewer", name: "Image Metadata Viewer", category: "image-tools", description: "Inspect image type, dimensions and file size in your browser.", icon: "info", keywords: ["image metadata"], status: "active" },
  { id: "image-metadata-remover", name: "Image Metadata Remover", category: "image-tools", description: "Re-encode an image locally to remove metadata not carried into the new image.", icon: "eraser", keywords: ["remove image metadata"], status: "active" },

{ id: "world-clock", name: "World Clock", category: "world-tools", description: "Track multiple cities with live local date and time using the browser IANA timezone database.", icon: "clock", keywords: ["world time", "timezone", "lahore time", "london time", "new york time", "dubai time"], aliases: ["City Clock", "World Time"], status: "active", popular: true },
  { id: "time-zone-converter", name: "Time Zone Converter", category: "world-tools", description: "Convert a date and wall-clock time between common IANA time zones with daylight-saving rules.", icon: "clock", keywords: ["timezone converter", "time difference", "convert time", "business hours"], aliases: ["Time Converter"], status: "active", popular: true },
  { id: "pregnancy-due-date-calculator", name: "Pregnancy Due Date Calculator", category: "health-tools", description: "Estimate a due date from the first day of the last menstrual period as an informational date calculation.", icon: "calendar", keywords: ["due date", "pregnancy calculator"], status: "active" },
  { id: "internet-data-usage-calculator", name: "Internet Data Usage Calculator", category: "daily-life-tools", description: "Estimate monthly data use from device activities and usage hours.", icon: "calculator", keywords: ["data usage", "internet usage"], status: "active" },
{ id: "pdf-repair", name: "PDF Repair & Validate", category: "pdf-tools", description: "Validate and re-save a readable PDF to normalize its structure.", icon: "check-circle", keywords: ["repair pdf", "validate pdf"], status: "active" },
  { id: "pdf-metadata-editor", name: "PDF Metadata Editor", category: "pdf-tools", description: "Edit common PDF title, author, subject and keyword metadata.", icon: "info", keywords: ["edit pdf metadata"], status: "active" },
  { id: "pdf-page-size-converter", name: "PDF Page Size Converter", category: "pdf-tools", description: "Resize PDF pages to common paper dimensions.", icon: "scaling", keywords: ["pdf page size", "a4 pdf"], status: "active" },
  { id: "pdf-compare", name: "PDF Compare", category: "pdf-tools", description: "Compare extracted text from two PDFs and report basic differences.", icon: "layers", keywords: ["compare pdf", "pdf diff"], status: "active" },
  { id: "image-flipper", name: "Image Flipper", category: "image-tools", description: "Flip an image horizontally or vertically on a canvas.", icon: "flip-horizontal", keywords: ["flip image"], status: "active" },
  { id: "image-brightness", name: "Image Brightness", category: "image-tools", description: "Adjust image brightness locally in the browser.", icon: "image", keywords: ["brightness"], status: "active" },
  { id: "image-contrast", name: "Image Contrast", category: "image-tools", description: "Adjust image contrast locally in the browser.", icon: "image", keywords: ["contrast"], status: "active" },
  { id: "grayscale-image", name: "Grayscale Image", category: "image-tools", description: "Convert an image to grayscale locally.", icon: "image", keywords: ["grayscale"], status: "active" },
  { id: "image-blur", name: "Image Blur", category: "image-tools", description: "Apply a controllable blur effect to an image.", icon: "image", keywords: ["blur image"], status: "active" },
  { id: "image-sharpen", name: "Image Sharpen", category: "image-tools", description: "Apply a lightweight local sharpening effect.", icon: "image", keywords: ["sharpen image"], status: "active" },
  { id: "favicon-generator", name: "Favicon Generator", category: "image-tools", description: "Create a square PNG favicon from an uploaded image.", icon: "image", keywords: ["favicon"], status: "active" },
  { id: "smart-text-summarizer", name: "Smart Text Summarizer", category: "text-tools", description: "Create a basic extractive summary locally without an external AI service.", icon: "sparkles", keywords: ["ai summarizer", "summary"], status: "active" },
  { id: "study-notes-generator", name: "Study Notes Generator", category: "student-tools", description: "Turn pasted study text into headings and bullet-style notes locally.", icon: "book-open", keywords: ["study notes", "notes generator"], status: "active" },
  { id: "flashcard-generator", name: "Flashcard Generator", category: "student-tools", description: "Convert lines in Question :: Answer format into downloadable flashcards.", icon: "layers", keywords: ["flashcards"], status: "active" },
  { id: "quiz-generator", name: "Quiz Generator", category: "student-tools", description: "Turn numbered study points into a simple self-test quiz locally.", icon: "help-circle", keywords: ["quiz generator"], status: "active" },
  { id: "email-generator", name: "Professional Email Generator", category: "text-tools", description: "Generate a structured professional email from a subject and purpose without an API.", icon: "mail", keywords: ["email writer", "professional email"], status: "active" },
  { id: "formal-text-converter", name: "Formal Text Converter", category: "text-tools", description: "Apply a basic local cleanup for professional tone and formatting.", icon: "file-signature", keywords: ["formal text", "professional writing"], status: "active" },
{ id: "word-to-pdf", name: "Word to PDF", category: "document-tools", description: "Upload a DOCX file, extract its paragraph text locally, and create a browser-generated PDF.", icon: "file-text", keywords: ["word pdf", "doc pdf"], status: "active" },
];

// Single source of truth for discovery, routing, search, favorites and SEO.
// Defaults are derived here so individual tool records can stay concise.
const existingToolIds = new Set(tools.map((tool) => tool.id));
const converterMetaByToolId = new Map(converterToolRecords.map((tool) => [tool.id, tool]));
const formulaMetaByToolId = new Map(formulaToolRecords.map((tool) => [tool.id, tool]));
const allTools = [...tools, ...converterToolRecords.filter((tool) => !existingToolIds.has(tool.id)), ...formulaToolRecords.filter((tool) => !existingToolIds.has(tool.id))];

const registry = allTools.map((originalTool) => {
  const converterMeta = converterMetaByToolId.get(originalTool.id);
  const formulaMeta = formulaMetaByToolId.get(originalTool.id);
  const categoryMeta = pdfToolMeta[originalTool.id];
  const extraMeta = converterMeta || formulaMeta || categoryMeta;
  const tool = extraMeta ? {
    ...originalTool,
    ...extraMeta,
    keywords: [...new Set([...(originalTool.keywords || []), ...(extraMeta.keywords || [])])],
    aliases: [...new Set([...(originalTool.aliases || []), ...(extraMeta.aliases || [])])],
  } : originalTool;
  return {
    ...tool,
    slug: tool.slug || tool.id,
    route: tool.route || `/tools/${tool.slug || tool.id}`,
    categoryRoute: getCategoryRoute(tool.category),
    tags: Array.isArray(tool.tags) ? tool.tags : [],
    commonPhrases: Array.isArray(tool.commonPhrases) ? tool.commonPhrases : [],
    type: tool.type || (tool.category?.includes("calculator") ? "calculator" : "tool"),
    requiresBackend: Boolean(tool.requiresBackend),
    requiresApi: Boolean(tool.requiresApi),
    requiresInternet: Boolean(tool.requiresInternet || tool.requiresApi || tool.requiresBackend),
    requiresEnvironment: Array.isArray(tool.requiresEnvironment) ? tool.requiresEnvironment : [],
    implementation: tool.implementation || "browser",
    processingType: tool.processingType || (tool.requiresBackend ? "backend" : tool.requiresApi ? "api" : "browser"),
    seoTitle: tool.seoTitle || tool.seo?.title || tool.name,
    seoDescription: tool.seoDescription || tool.seo?.description || tool.description,
    relatedTools: Array.isArray(tool.relatedTools) ? tool.relatedTools : [],
    seo: tool.seo || { title: tool.seoTitle || tool.name, description: tool.seoDescription || tool.description },
  };
});

export { registry as tools };

export function getToolById(id) {
  return registry.find((t) => t.id === id);
}

export function getToolBySlug(slug) {
  return registry.find((t) => t.slug === slug || t.id === slug);
}

export function getToolsByCategory(categorySlug) {
  return registry.filter((t) => t.category === categorySlug);
}

export function getActiveToolsByCategory(categorySlug) {
  return registry.filter((t) => t.status === "active" && t.category === categorySlug);
}

export function getCategoryCounts({ activeOnly = true } = {}) {
  const source = activeOnly ? getActiveTools() : registry;
  return source.reduce((counts, tool) => {
    counts[tool.category] = (counts[tool.category] || 0) + 1;
    return counts;
  }, {});
}

export function getPopularTools() {
  return registry.filter((t) => t.status === "active" && t.popular);
}

export function getRecentlyAddedTools() {
  return registry.filter((t) => t.status === "active" && t.isNew);
}

export function getActiveTools() {
  return registry.filter((t) => t.status === "active");
}

/**
 * Lightweight client-side search — no server required.
 * Matches on name, description, id and keywords, ranked by relevance.
 */
function editDistance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let left = prev[0], next = i;
    for (let j = 1; j <= b.length; j++) {
      const old = prev[j];
      next = Math.min(next + 1, prev[j] + 1, left + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev[j] = next; left = old;
    }
  }
  return prev[b.length];
}
export function searchTools(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  return registry.map((tool) => {
    const category = tool.category.replace(/-/g, " ");
    const fields = [tool.name, tool.description, category, tool.id, tool.slug, ...(tool.keywords || []), ...(tool.aliases || []), ...(tool.tags || []), ...(tool.commonPhrases || [])].map(x => String(x).toLowerCase());
    let score = fields.some((field) => field === q) ? 220 : fields.some((field) => field.startsWith(q)) ? 90 : fields.some((field) => field.includes(q)) ? 45 : 0;
    for (const term of terms) {
      let best = 0;
      for (const field of fields) {
        if (field === term) best = Math.max(best, 100);
        else if (field.startsWith(term)) best = Math.max(best, 55);
        else if (field.includes(term)) best = Math.max(best, 25);
        else {
          const first = field.split(/[\s-]+/).find(w => w.length >= 3);
          if (first && term.length >= 3) {
            const d = editDistance(term, first);
            if (d <= Math.max(1, Math.floor(term.length / 3))) best = Math.max(best, 12);
          }
        }
      }
      score += best;
    }
    if (tool.popular) score += 2;
    return { tool, score };
  }).filter(r => r.score > 0).sort((a,b)=>b.score-a.score || a.tool.name.localeCompare(b.tool.name)).map(r=>r.tool);
}
