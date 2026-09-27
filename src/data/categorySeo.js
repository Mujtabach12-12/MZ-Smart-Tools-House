const categorySeo = {
  "office-tools": {
    title: "Online Office Tools – Word, Excel, PowerPoint & PDF",
    h1: "Online Office Tools",
    description: "Create documents, spreadsheets and presentations, view or edit PDFs, and work in browser-based office tools from one MZ Smart Tool House workspace.",
    intro: "Open a focused browser workspace for documents, spreadsheets, presentations and PDFs without switching between unrelated tool sites.",
    about: "MZ Office groups the main document-creation and PDF workspaces in one category. Use the tool that matches the file you need to create, view or edit, then export a real file format where the workspace supports it.",
    quickLinks: [
      ["mz-online-word", "Write documents online", "Create assignments, notes and reports and export DOCX/PDF."],
      ["mz-online-excel", "Create spreadsheets online", "Work with sheets, common formulas and XLSX/CSV files."],
      ["mz-online-powerpoint", "Create presentations online", "Build slide decks and export PPTX."],
      ["mz-pdf-editor", "Edit PDF online", "Edit selectable text, pages and export updated files."],
    ],
  },
  "pdf-tools": {
    title: "Free Online PDF Tools – Compress, Merge, Convert & Edit",
    h1: "Free Online PDF Tools",
    description: "Compress, merge, split, convert, OCR, organize and edit PDF files online with browser-based PDF tools from MZ Smart Tool House.",
    intro: "Choose the PDF task you need: reduce file size, combine documents, split pages, convert formats, extract text, run OCR or organize pages.",
    about: "The PDF collection focuses on real document workflows rather than placeholder buttons. Conversion tools state their limitations, page operations preserve PDF structure where practical, and file-processing pages explain when browser-only processing is used.",
    quickLinks: [
      ["pdf-compressor", "Compress PDF online", "Reduce PDF file size and compare measured output size."],
      ["pdf-merger", "Merge PDF files", "Combine multiple PDFs in the order you choose."],
      ["pdf-to-word", "Convert PDF to Word", "Create an editable text-focused DOCX from selectable PDF text."],
      ["pdf-ocr", "OCR a scanned PDF", "Extract readable text from image-based PDF pages."],
    ],
  },
  "image-tools": {
    title: "Free Online Image Tools – Compress, Resize & Convert",
    h1: "Free Online Image Tools",
    description: "Compress, resize, crop, rotate and convert JPG, PNG and WebP images online with browser-based image tools from MZ Smart Tool House.",
    intro: "Edit everyday images without installing a desktop application. Start with compression, resizing, cropping or format conversion depending on your output requirement.",
    about: "Image tools are designed around source preservation and deliberate output settings. When a task changes quality, dimensions or format, review the preview and output information before downloading the result.",
    quickLinks: [
      ["image-compressor", "Compress an image", "Reduce JPG, PNG or WebP size with measurable output."],
      ["image-resizer", "Resize an image by pixels", "Set exact dimensions and control aspect ratio."],
      ["image-cropper", "Crop an image", "Keep only the part of the image you need."],
      ["jpg-to-webp", "Convert JPG to WebP", "Create a WebP version for modern web use."],
    ],
  },
  "student-tools": {
    title: "Student Tools – Study, Writing, GPA & Productivity",
    h1: "Online Student Tools",
    description: "Use student tools for study planning, writing support, dictionary lookup, marks, attendance and academic productivity in one browser-based collection.",
    intro: "Find practical student workflows for calculations, study organization and writing without searching through unrelated categories.",
    about: "Student tools support routine academic work but do not replace your university's official policies or records. For GPA, grade and attendance calculations, review the selected policy and your source data before making academic decisions.",
    quickLinks: [
      ["gpa-calculator", "Calculate semester GPA", "Use credit hours and a verified or custom grading scale."],
      ["attendance-calculator", "Check attendance percentage", "Estimate current attendance and a required target."],
      ["study-hours-calculator-plus", "Plan study hours", "Estimate daily study time from workload and days available."],
      ["mz-dictionary", "Look up English words", "Check definitions, pronunciation and examples from the configured source."],
    ],
  },
  "programming-tools": {
    title: "Online Programming Tools – Code Editor & Practice Lab",
    h1: "Online Programming Tools",
    description: "Practice JavaScript and HTML/CSS/JS in a browser coding lab, with additional compiler languages available when the configured backend supports them.",
    intro: "Use the programming lab for quick coding practice, small algorithm experiments and sandboxed web previews without turning unsupported languages into fake execution.",
    about: "JavaScript runs in a constrained browser worker and the web playground uses a sandboxed preview. Other languages depend on the compiler backend capabilities detected by the application, so the interface clearly reports when a language is not available.",
    quickLinks: [
      ["programming-lab", "Open the programming lab", "Run JavaScript, build web previews and use supported compiler languages."],
      ["json-formatter", "Format JSON", "Beautify API payloads while debugging code."],
      ["regex-tester", "Test regular expressions", "Check patterns against sample text."],
      ["base64-encoder", "Encode Base64", "Encode text or files for development workflows."],
    ],
  },
  "developer-tools": {
    title: "Developer Tools – JSON, Regex, Base64, URL & Hash Utilities",
    h1: "Online Developer Tools",
    description: "Use JSON, regex, Base64, URL, hash, color and encoding utilities online with focused browser-based developer tools from MZ Smart Tool House.",
    intro: "Open a small, focused utility for common developer tasks instead of loading a full IDE when you only need to format, validate, encode or inspect data.",
    about: "Developer utilities are designed for predictable transformations and transparent validation. Where the browser can complete the operation locally, the tool avoids unnecessary server processing.",
    quickLinks: [
      ["json-formatter", "Format JSON", "Beautify valid JSON for easier reading and debugging."],
      ["json-validator", "Validate JSON", "Check whether a JSON document is syntactically valid."],
      ["regex-tester", "Test regex", "Review regular-expression matches against sample text."],
      ["password-generator", "Generate a random password", "Create a configurable password locally in the browser."],
    ],
  },
  "calculators": {
    title: "Student Calculators – GPA, CGPA, Attendance & Marks",
    h1: "Student Calculators",
    description: "Calculate GPA, CGPA, attendance, grades, marks, averages and percentages with transparent formulas and validated inputs.",
    intro: "Use a focused calculator for common academic numbers and review the method or grading policy shown with the result.",
    about: "Academic calculators are estimates based on the information and grading policy you select. They are useful for planning and checking your own calculations, but official results still come from your institution.",
    quickLinks: [
      ["gpa-calculator", "GPA calculator", "Calculate credit-weighted semester GPA."],
      ["cgpa-calculator", "CGPA calculator", "Combine semester results with credit-hour weighting."],
      ["attendance-calculator", "Attendance calculator", "Check attendance percentage and target status."],
      ["percentage-calculator", "Percentage calculator", "Calculate a percentage, percentage share or percentage change."],
    ],
  },
  "document-tools": {
    title: "Student Document Tools – Resume, Applications & PDF Creation",
    h1: "Student Document Tools",
    description: "Create resumes, cover letters, applications, assignment covers and browser-generated documents with structured student document tools.",
    intro: "Start from a focused document workflow and export a real file where supported instead of copying content from a generic text generator.",
    about: "Document generators use the information you provide to create structured output. Always review names, dates, claims and formatting before submitting a generated document to a university or employer.",
    quickLinks: [
      ["resume-builder", "Build an ATS-friendly resume", "Create a structured resume and export DOCX."],
      ["cover-letter-generator", "Create a cover letter", "Generate and customize a job-specific letter."],
      ["assignment-cover-page-generator", "Create an assignment cover page", "Prepare a structured academic cover page."],
      ["word-to-pdf", "Convert Word text to PDF", "Extract DOCX paragraph text and create a browser-generated PDF."],
    ],
  },
  "converter-tools": {
    title: "Online Unit Converters – Length, Temperature, Data & More",
    h1: "Online Unit Converters",
    description: "Convert length, temperature, mass, area, volume, time, speed, data storage, pressure and other units with explicit conversion rules.",
    intro: "Choose a measurement type, enter a value and convert between supported units with clearly labeled systems and units.",
    about: "Converters keep unit labels explicit so similar-looking units are not silently mixed. Where standards differ, such as decimal versus binary data units or US versus Imperial liquid measures, the interface labels the distinction.",
  },
  "finance-tools": {
    title: "Business & Finance Calculators – EMI, Loans, Savings & Margins",
    h1: "Business & Finance Calculators",
    description: "Estimate EMI, loan payments, savings goals, investment growth, margins, salary breakdowns and budgets with transparent finance calculators.",
    intro: "Use the calculator that matches the financial question you are exploring and review assumptions before using an estimate for a real decision.",
    about: "Finance tools provide mathematical estimates from your inputs. They do not represent lender approval, investment advice, tax advice or a guaranteed financial outcome.",
    quickLinks: [
      ["emi-calculator", "Calculate monthly EMI", "Estimate monthly payment, total repayment and interest."],
      ["loan-payment-calculator", "Estimate a loan payment", "Calculate a standard monthly repayment estimate."],
      ["profit-margin-calculator", "Calculate profit margin", "Compare margin and markup from cost and sale price."],
      ["budget-planner", "Plan a monthly budget", "Compare entered income and expense totals."],
    ],
  },
};

export function getCategorySeo(category, list = []) {
  const custom = categorySeo[category.slug] || {};
  const count = list.length;
  const noun = count === 1 ? "tool" : "tools";
  return {
    title: custom.title || `${category.name} – Online Tools`,
    h1: custom.h1 || category.name,
    description: custom.description || `${category.description} Explore ${count} focused ${noun} at MZ Smart Tool House.`,
    intro: custom.intro || category.description,
    about: custom.about || "Choose the tool that matches your task, review the available options and verify the result before using it in important work.",
    quickLinks: custom.quickLinks || [],
  };
}

export default categorySeo;
