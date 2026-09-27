export const articles = [
  {
    slug: "how-to-reduce-pdf-file-size",
    title: "How to Reduce PDF File Size Without Ruining Readability",
    description: "Learn why PDF files become large, what compression changes, how to choose a quality mode and how to verify the result before sharing or submitting a PDF.",
    primaryKeyword: "how to reduce pdf file size",
    relatedTools: ["pdf-compressor", "pdf-to-jpg", "pdf-ocr"],
    updated: "2026-09-28",
    sections: [
      { heading: "Why PDF files become large", paragraphs: ["A PDF can contain text, vector graphics, embedded fonts and high-resolution images. Image-heavy scans, presentation exports and documents with many photos are usually much larger than simple text PDFs.", "Because PDFs can already contain compressed resources, a second compression pass does not guarantee a dramatic reduction. The useful question is not whether a tool promises a fixed percentage, but whether the final file is actually smaller while remaining readable."] },
      { heading: "Choose compression based on the job", paragraphs: ["Use a higher-quality mode when the document contains small text, diagrams or pages that will be printed. A balanced mode is useful for everyday sharing and most university submissions. A smaller-file mode can help when a portal has a strict upload limit, but the visual result should be reviewed carefully."], bullets: ["High quality: prioritize readability and visual detail.", "Balanced: trade some image detail for a smaller file.", "Smaller file: prioritize size reduction when the upload limit is the main constraint."] },
      { heading: "How to compress a PDF safely", paragraphs: ["Keep the original PDF. Compress a copy, compare the before-and-after size, then open the output and check important pages at normal zoom. Pay special attention to screenshots, scanned signatures, tables and small text."], bullets: ["Keep the original file unchanged.", "Choose a quality mode based on the document purpose.", "Compare measured file sizes after compression.", "Open the output and check readability before submitting it."] },
      { heading: "When compression may not help much", paragraphs: ["A text-focused PDF, a file already optimized by another application or a document dominated by vector graphics may have little redundant data to remove. In those cases, aggressive recompression can reduce quality without producing a meaningful size saving." ] },
      { heading: "A practical rule", paragraphs: ["Treat compression as an optimization step, not a guarantee. The best output is the smallest file that still preserves the quality needed for its purpose."] },
    ],
  },
  {
    slug: "how-to-calculate-attendance-percentage",
    title: "How to Calculate Attendance Percentage and Plan Future Classes",
    description: "Understand the attendance percentage formula, how to calculate classes you can miss and how to estimate the classes needed to reach a target percentage.",
    primaryKeyword: "how to calculate attendance percentage",
    relatedTools: ["attendance-calculator", "gpa-calculator", "study-hours-calculator"],
    updated: "2026-09-28",
    sections: [
      { heading: "The attendance percentage formula", paragraphs: ["Attendance percentage is calculated by dividing attended classes by total classes and multiplying by 100. If you attended 80 of 100 classes, your attendance is 80%."], bullets: ["Attendance % = attended classes ÷ total classes × 100", "Example: 80 ÷ 100 × 100 = 80%"] },
      { heading: "How to estimate classes you can miss", paragraphs: ["If your current attendance is above the required threshold, each future absence increases the total class count without increasing the attended count. The limit is reached when another absence would push the ratio below the required percentage." ] },
      { heading: "How to estimate classes needed to recover", paragraphs: ["If your attendance is below the target, future attended classes increase both the attended and total counts. A calculator can solve the number of consecutive classes required for the ratio to reach the target." ] },
      { heading: "Why university rules still matter", paragraphs: ["The arithmetic is simple, but institutional policies may include separate laboratory attendance, medical leave, course-specific thresholds or rounding rules. Use the calculated ratio for planning and follow your university's official attendance policy for final decisions." ] },
    ],
  },
  {
    slug: "gpa-vs-cgpa-difference",
    title: "GPA vs CGPA: Difference, Formula and Credit-Hour Weighting",
    description: "Learn the difference between GPA and CGPA, why credit hours matter and why a simple average of semester GPAs can be misleading.",
    primaryKeyword: "gpa vs cgpa",
    relatedTools: ["gpa-calculator", "cgpa-calculator", "grade-calculator"],
    updated: "2026-09-28",
    sections: [
      { heading: "What GPA usually means", paragraphs: ["GPA commonly describes performance for one semester or academic period. A credit-weighted GPA multiplies each course grade point by its credit hours, adds the quality points and divides by the counted credit hours." ] },
      { heading: "What CGPA usually means", paragraphs: ["CGPA combines performance across multiple semesters or periods. The exact institutional rule matters because universities may handle repeats, exclusions, transferred credits and grading scales differently." ] },
      { heading: "Why credit hours matter", paragraphs: ["A three-credit course usually contributes more to a weighted GPA than a one-credit course. For the same reason, two semester GPAs should not always be averaged equally when the semesters have different credit loads."], bullets: ["Quality points = grade point × credit hours", "GPA = total quality points ÷ counted credit hours"] },
      { heading: "Do not assume one universal grading scale", paragraphs: ["Grade boundaries and grade-point mappings differ among institutions. Use a verified university policy when one is available, or clearly label a custom scale instead of presenting a generic table as official." ] },
    ],
  },
  {
    slug: "resize-image-to-exact-pixels",
    title: "How to Resize an Image to Exact Pixels Without Distortion",
    description: "Learn how width, height and aspect ratio work when resizing images for forms, websites, profile photos and other pixel-specific requirements.",
    primaryKeyword: "resize image to exact pixels",
    relatedTools: ["image-resizer", "image-cropper", "image-compressor", "passport-photo-resizer"],
    updated: "2026-09-28",
    sections: [
      { heading: "Width, height and aspect ratio", paragraphs: ["Image dimensions are usually written as width × height in pixels. The aspect ratio describes the relationship between those two dimensions. If you change width and height independently, the image can look stretched or squashed." ] },
      { heading: "Resize versus crop", paragraphs: ["Resizing changes pixel dimensions. Cropping removes part of the image. If a form requires a different aspect ratio from the original photo, cropping first and resizing second usually gives a cleaner result than forcing the image into the new shape." ] },
      { heading: "Why enlarging does not create detail", paragraphs: ["Increasing the pixel dimensions of a small source image adds more pixels, but it cannot recreate fine detail that was not captured originally. Very large upscales can therefore look soft or pixelated." ] },
      { heading: "A reliable workflow", bullets: ["Check the required width and height.", "Crop to the required aspect ratio if necessary.", "Resize to the exact pixel dimensions.", "Compress only after checking image clarity.", "Open the final file and verify its dimensions before upload."] },
    ],
  },
  {
    slug: "json-formatter-vs-validator",
    title: "JSON Formatter vs JSON Validator: What Is the Difference?",
    description: "Understand how JSON formatting and JSON validation differ, why JavaScript object syntax is not always valid JSON and how to debug malformed JSON safely.",
    primaryKeyword: "json formatter vs validator",
    relatedTools: ["json-formatter", "json-validator", "json-viewer", "json-minifier"],
    updated: "2026-09-28",
    sections: [
      { heading: "What a JSON formatter does", paragraphs: ["A formatter takes valid JSON and rewrites it with consistent indentation and line breaks. It makes nested objects and arrays easier to inspect, but formatting cannot repair arbitrary invalid syntax safely without changing the data." ] },
      { heading: "What a JSON validator does", paragraphs: ["A validator checks whether the input follows JSON syntax. It can identify errors such as missing commas, invalid quoting or malformed structures so you know why parsing failed." ] },
      { heading: "JSON is not the same as a JavaScript object literal", paragraphs: ["JavaScript allows syntax that JSON does not. JSON requires double-quoted string values and property names, and it does not support comments, functions, undefined or trailing commas in standard JSON." ] },
      { heading: "A safe debugging workflow", bullets: ["Validate the input first.", "Fix syntax errors without changing the intended data.", "Format the valid JSON for readability.", "Use a viewer when you need to inspect deeply nested structures.", "Test production data in the same environment that will consume it."] },
    ],
  },
  {
    slug: "scan-documents-clearly-with-phone",
    title: "How to Scan Documents Clearly With a Phone",
    description: "Improve phone document scans with better lighting, camera angle, corner adjustment, contrast and final PDF review before submission or sharing.",
    primaryKeyword: "how to scan documents with phone",
    relatedTools: ["smart-document-scanner", "pdf-ocr", "jpg-to-pdf", "pdf-compressor"],
    updated: "2026-09-28",
    sections: [
      { heading: "Start with the page, not the filter", paragraphs: ["A clear scan begins with a flat page, even lighting and a camera positioned as parallel to the paper as possible. Heavy shadows, glare and a steep camera angle make edge detection and OCR less reliable." ] },
      { heading: "Check the page corners", paragraphs: ["Automatic document detection is convenient but not perfect. Busy backgrounds, similar paper and desk colors or partially cropped pages can move the detected corners. Review the four corners before export and adjust them manually when needed." ] },
      { heading: "Use enhancement carefully", paragraphs: ["Color, grayscale, black-and-white and enhanced modes can improve readability for different documents. Strong contrast may help printed text but can hide faint handwriting, stamps or pencil marks. Compare the processed page with the source before keeping it." ] },
      { heading: "Review the final PDF", bullets: ["Check page order.", "Zoom in on small text and signatures.", "Confirm no edge of the page was cropped incorrectly.", "Run OCR only when you need selectable/searchable text.", "Compress the PDF only after visual quality is acceptable."] },
    ],
  },
];

export function getArticleBySlug(slug) {
  return articles.find((article) => article.slug === slug);
}
