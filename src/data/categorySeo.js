const categorySeo = {
  "office-tools": {
    title: "Online Office Tools – Word, Excel, PowerPoint & PDF Editor",
    h1: "Online Office Tools",
    description: "Create documents, spreadsheets and presentations or edit PDFs with browser-based office tools from MZ Smart Tool House.",
    intro: "Work across documents, spreadsheets, presentations and PDFs from one connected browser workspace. These tools focus on common student and office workflows with real export formats where supported.",
    workflows: ["Write assignments and documents", "Create spreadsheets and formulas", "Build presentations", "Edit and view PDFs"],
  },
  "pdf-tools": {
    title: "Free Online PDF Tools – Compress, Merge, Convert & Edit PDF",
    h1: "Free Online PDF Tools",
    description: "Compress, merge, split, convert, OCR and manage PDF files online with browser-based PDF tools from MZ Smart Tool House.",
    intro: "Choose a focused PDF workflow instead of uploading a document to multiple unrelated websites. MZ PDF tools cover compression, page management, conversion, text extraction, OCR and validation while keeping claims about quality and privacy explicit.",
    workflows: ["Compress and optimize PDFs", "Merge, split and organize pages", "Convert PDF to images or Office formats", "Extract text and run OCR"],
  },
  "image-tools": {
    title: "Free Online Image Tools – Compress, Resize, Crop & Convert",
    h1: "Free Online Image Tools",
    description: "Compress, resize, crop, rotate and convert images online with practical browser-based image tools.",
    intro: "Prepare images for websites, forms, assignments and everyday sharing with focused controls for dimensions, compression and file formats.",
    workflows: ["Compress large images", "Resize to exact pixels", "Crop and rotate photos", "Convert JPG, PNG and WebP formats"],
  },
  "student-tools": {
    title: "Student Tools Online – Study, Notes, GPA & Productivity",
    h1: "Online Tools for Students",
    description: "Use practical student tools for study notes, flashcards, quizzes, planning and academic productivity.",
    intro: "This collection brings common study workflows into one place so students can calculate, plan and prepare learning material without jumping between unrelated websites.",
    workflows: ["Create study notes", "Build flashcards and quizzes", "Plan study time", "Use academic calculators"],
  },
  "finance-tools": {
    title: "Business & Finance Calculators – EMI, Interest, ROI & Budget",
    h1: "Business & Finance Calculators",
    description: "Estimate EMI, interest, savings, ROI, budgets and other common finance calculations with transparent formulas and inputs.",
    intro: "Use these calculators for planning and comparison rather than lender, tax or investment advice. Each tool should make its assumptions visible so results can be checked.",
    workflows: ["Estimate loan and EMI payments", "Compare interest and savings", "Calculate ROI and margins", "Plan personal budgets"],
  },
  "calculators": {
    title: "Student Calculators – GPA, CGPA, Attendance, Marks & Percentage",
    h1: "Student Calculators",
    description: "Calculate GPA, CGPA, attendance, marks, grades and percentages with transparent student-focused calculators.",
    intro: "Use clear formulas and verified policy data where available. University-specific results remain estimates unless the exact institutional policy and your official records are confirmed.",
    workflows: ["Calculate GPA and CGPA", "Check attendance percentage", "Calculate marks and grades", "Plan study hours"],
  },
  "utility-tools": {
    title: "Everyday Online Utilities – Percentage, Age, Discount & More",
    h1: "Everyday Online Utilities",
    description: "Use fast browser utilities for percentages, age, discounts, averages, ratios and time calculations.",
    intro: "Simple utilities should be easy to verify. These tools focus on clear inputs, transparent calculations and useful results without unnecessary setup.",
    workflows: ["Calculate percentages", "Find exact age", "Work out discounts", "Add and compare time"],
  },
  "developer-tools": {
    title: "Developer Tools Online – JSON, Base64, Regex, URL & Hash Utilities",
    h1: "Online Developer Tools",
    description: "Format JSON, test regex, encode Base64, work with URLs, hashes and other everyday developer utilities in the browser.",
    intro: "Use focused developer utilities for debugging, formatting and data transformation without moving small tasks into a full IDE.",
    workflows: ["Format and validate JSON", "Test regular expressions", "Encode and decode Base64 or URLs", "Generate IDs, hashes and developer values"],
  },
  "document-tools": {
    title: "Student Document Tools – Resume, Applications, DOCX & PDF",
    h1: "Student Document Tools",
    description: "Create resumes, applications, cover pages and common student documents, or convert simple document formats in your browser.",
    intro: "Build practical academic and career documents from information you provide. Document generators should organize real content rather than invent achievements or claims.",
    workflows: ["Create resumes and CVs", "Write applications and cover letters", "Build assignment cover pages", "Convert text and document formats"],
  },
  "text-tools": {
    title: "Text Tools Online – Word Counter, Case Converter & Text Cleaner",
    h1: "Online Text Tools",
    description: "Count, clean, format, extract and transform text with browser-based text utilities.",
    intro: "Use lightweight text tools for editing and cleanup tasks that do not need a full document editor or external AI service.",
    workflows: ["Count words and characters", "Clean whitespace and duplicate lines", "Convert text case", "Extract URLs, emails and numbers"],
  },
  "converter-tools": {
    title: "Unit Converters Online – Length, Temperature, Weight, Data & More",
    h1: "Online Unit Converters",
    description: "Convert length, temperature, mass, area, volume, time, data storage, pressure and many other units with explicit formulas and unit labels.",
    intro: "Convert everyday and technical units with categories that keep SI, imperial and specialized measurements clearly labeled.",
    workflows: ["Convert everyday measurements", "Convert science and engineering units", "Work with data-storage units", "Compare metric and imperial values"],
  },
  "date-time-tools": {
    title: "Date & Time Tools – Date Difference, Working Days & Time Calculators",
    h1: "Date & Time Tools",
    description: "Calculate date differences, working days, date arithmetic and other time-based values with browser date tools.",
    intro: "Use date-only logic where appropriate so calendar calculations are not accidentally shifted by timezone conversions.",
    workflows: ["Find date differences", "Count working days", "Add or subtract dates", "Calculate time durations"],
  },
  "university-tools": {
    title: "University Calculators – Aggregate, Merit, Semester & Credit Hours",
    h1: "University Calculators",
    description: "Use aggregate, merit, semester, scholarship and credit-hour calculators for university planning and academic estimates.",
    intro: "University rules vary by institution. Treat results as planning estimates unless the exact official policy has been verified for the selected university.",
    workflows: ["Estimate aggregate and merit", "Work with semester averages", "Calculate credit hours", "Estimate scholarship percentages"],
  },
  "productivity-tools": {
    title: "Productivity Tools – Pomodoro, Study Timer, To-Do & Planner",
    h1: "Online Productivity Tools",
    description: "Use timers, to-do lists and study planners to organize focused work and daily tasks.",
    intro: "Keep lightweight productivity workflows close to the tools you already use for study and office work.",
    workflows: ["Run focus timers", "Track study sessions", "Manage to-do lists", "Plan daily study work"],
  },
};

export function getCategorySeo(category, count) {
  const item = categorySeo[category.slug] || {};
  const plural = count === 1 ? "tool" : "tools";
  return {
    title: item.title || `${category.name} – Online ${plural}`,
    h1: item.h1 || category.name,
    description: item.description || `${category.description} Explore ${count} focused ${plural} at MZ Smart Tool House.`,
    intro: item.intro || category.description,
    workflows: item.workflows || [],
  };
}

export default categorySeo;
