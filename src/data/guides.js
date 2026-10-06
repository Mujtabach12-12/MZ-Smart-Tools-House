export const guides = [
  {
    slug: "how-pdf-compression-works",
    title: "How PDF Compression Works: File Size, Image Quality and Real Trade-offs",
    description: "Understand why some PDFs compress well, why others barely shrink, and how image resolution, rasterization and document structure affect the result.",
    updated: "2026-10-06",
    readingTime: "6 min read",
    relatedTools: ["pdf-compressor", "mz-pdf-editor", "pdf-to-jpg"],
    intro: "PDF compression is not a single operation. A PDF can contain text, vector graphics, embedded fonts, photographs, scanned pages, metadata and already-compressed streams. The best compression method depends on what is actually inside the file.",
    sections: [
      {
        heading: "Why two PDFs can behave very differently",
        paragraphs: [
          "A text-heavy PDF may already be compact because text and vector instructions require little storage. Re-saving that file can remove some redundant structure, but there may be very little to gain. A scanned PDF is different: every page may be a large photograph, so image resolution and image encoding can dominate the file size.",
          "That is why a responsible compressor should measure the real output instead of promising a fixed saving such as 70%. If the processed candidate is not smaller, the honest result is to report that fact rather than pretend compression succeeded."
        ]
      },
      {
        heading: "Lossless structure vs image-based compression",
        paragraphs: [
          "A lossless or structure-focused pass tries to preserve the existing visual content while rewriting the PDF more efficiently. It can be useful for files containing duplicated objects or inefficient streams, but it cannot magically remove data that is already compact.",
          "An image-heavy compression mode may rasterize pages or recompress embedded images at a lower effective resolution. This can produce much larger savings, but it introduces a quality trade-off. Small text, diagrams and screenshots are usually the first places where aggressive compression becomes visible."
        ]
      },
      {
        heading: "What DPI and pixel dimensions change",
        paragraphs: [
          "For scanned pages, effective dots per inch (DPI) controls how many pixels represent the printed page. Higher resolution preserves more fine detail but uses more storage. Lower resolution reduces file size, especially for long scanned documents, but can soften text and lines.",
          "A sensible workflow is to keep the original file, choose the least aggressive mode that meets the upload limit, and visually inspect several pages before replacing your source document."
        ],
        bullets: [
          "Keep the original PDF as a backup.",
          "Use measured before-and-after file sizes.",
          "Inspect small text, charts and signatures after compression.",
          "Avoid repeated recompression because quality loss can accumulate."
        ]
      },
      {
        heading: "How MZ Smart Tools House approaches compression",
        paragraphs: [
          "The MZ PDF Compressor separates quality modes and reports measured output size instead of claiming a guaranteed saving. The high-quality path is intended to preserve more of the original document structure, while smaller-file modes are more suitable when image-heavy pages are the main source of size.",
          "The tool also makes the trade-off visible before download. This matters because the smallest possible file is not always the best result: an assignment, contract or scanned form still needs to remain readable."
        ]
      },
      {
        heading: "When compression is the wrong tool",
        paragraphs: [
          "If the PDF contains pages you no longer need, removing those pages is often more effective than lowering quality. If only a few photographs are oversized, editing or replacing those images may give a better result. If the goal is extracting text from a scanned document, OCR solves a different problem and should not be confused with file-size compression."
        ]
      }
    ]
  },
  {
    slug: "how-document-scanning-auto-crop-works",
    title: "How Document Scanning, Auto-Crop and Perspective Correction Work",
    description: "A practical explanation of document edge detection, four-corner crop review, perspective correction, filters, OCR and multi-page export.",
    updated: "2026-10-06",
    readingTime: "7 min read",
    relatedTools: ["smart-document-scanner", "pdf-ocr", "jpg-to-pdf"],
    intro: "A phone camera captures a rectangular image, but a sheet of paper inside that image is often tilted, rotated or photographed from an angle. A document scanner turns that camera photo into a page-like result by finding the page boundary, letting the user correct it and then remapping the selected quadrilateral into a flat rectangle.",
    sections: [
      {
        heading: "Step 1: capture enough of the page",
        paragraphs: [
          "Good scanning starts before any algorithm runs. The full document should be visible, all four page corners should stay inside the camera frame, and the page should have reasonable contrast against the background. Cutting off a corner gives the crop detector less information and can make automatic detection unreliable.",
          "A camera preview is only for framing. A high-quality scanner should keep the full captured image as the master source and use smaller proxy images only for fast edge detection and interactive previews."
        ]
      },
      {
        heading: "Step 2: detect the page boundary",
        paragraphs: [
          "Edge detection looks for strong changes in brightness or colour that could represent the border of a sheet. The detector then evaluates candidate quadrilaterals and chooses a likely page boundary. This is probabilistic, not magic: patterned desks, shadows, curled paper and low contrast can confuse the detector.",
          "For that reason, MZ Smart Tools House does not treat automatic crop as final. The detected four corners remain editable so the user can move each handle before perspective correction."
        ]
      },
      {
        heading: "Step 3: perspective correction",
        paragraphs: [
          "If a rectangular sheet is photographed at an angle, it appears as a trapezoid or irregular quadrilateral. Perspective correction maps the four selected corners to a rectangular output. This is the step that makes an angled photo look more like a flat scanned page.",
          "The correction should be applied from the preserved original image, not from a small preview. Using the preview as the export source is a common reason scanner output becomes blurry."
        ]
      },
      {
        heading: "Step 4: filters and readability",
        paragraphs: [
          "Document, grayscale and black-and-white filters are different presentation choices. Grayscale removes colour while preserving intensity. A black-and-white threshold can make clean printed text stand out, but may damage photographs or faint handwriting. An enhancement mode may adjust contrast and sharpening, but excessive sharpening can create halos around letters.",
          "The safest workflow is to compare the filtered preview with the original and choose the mode that preserves the information you actually need."
        ]
      },
      {
        heading: "OCR and searchable PDFs",
        paragraphs: [
          "Optical character recognition (OCR) attempts to identify text in a scanned image. OCR does not improve the photograph itself; it adds a text interpretation that can support copying or searchable-PDF workflows. Accuracy depends on focus, lighting, font clarity, language support and page layout.",
          "For important documents, always review OCR output. Names, numbers and tables are particularly important to verify before relying on the recognized text."
        ],
        bullets: [
          "Capture the complete page.",
          "Review all four crop corners.",
          "Apply perspective correction before export.",
          "Use filters for readability, not decoration.",
          "Verify OCR instead of assuming it is perfect."
        ]
      }
    ]
  },
  {
    slug: "how-gpa-cgpa-calculation-works",
    title: "How GPA and CGPA Calculation Works with Credit Hours",
    description: "Learn the difference between GPA and CGPA, how credit-hour weighting works, and why university grading policies must be verified before use.",
    updated: "2026-10-06",
    readingTime: "6 min read",
    relatedTools: ["gpa-calculator", "cgpa-calculator", "grade-calculator", "marks-calculator"],
    intro: "GPA and CGPA calculations look simple, but the result depends on two separate things: the grade-point value assigned to each course grade and the number of credit hours attached to that course. University policies can also differ, so a calculator should never silently invent one universal grading table.",
    sections: [
      {
        heading: "The credit-weighted GPA formula",
        paragraphs: [
          "For each course, multiply the course grade point by its credit hours. These products are often called quality points. Add the quality points for all counted courses, then divide by the total counted credit hours.",
          "In compact form: GPA = total quality points ÷ total credit hours. This means a four-credit course has more influence on the semester GPA than a one-credit course."
        ]
      },
      {
        heading: "A worked example",
        paragraphs: [
          "Suppose a student has three courses: a 3-credit course with grade point 4.0, a 3-credit course with grade point 3.0, and a 2-credit course with grade point 3.5. The quality points are 12, 9 and 7. The total is 28 quality points across 8 credit hours, so GPA = 28 ÷ 8 = 3.50.",
          "This example demonstrates the weighting only. The mapping from a letter grade or percentage to a grade-point value must come from the relevant institutional policy or from a clearly labelled custom scale."
        ]
      },
      {
        heading: "How CGPA differs from semester GPA",
        paragraphs: [
          "Semester GPA describes one academic term. CGPA combines results across multiple terms. A correct CGPA should normally use total quality points divided by total counted credit hours across those terms, rather than simply averaging semester GPAs when the semesters have different credit loads.",
          "For example, a 12-credit semester and an 18-credit semester should not automatically contribute equally to a credit-weighted cumulative result."
        ]
      },
      {
        heading: "Why university policy matters",
        paragraphs: [
          "Institutions can differ in grade boundaries, repeat-course treatment, withdrawn courses, pass/fail modules and the number of decimal places used for official reporting. That is why MZ Smart Tools House distinguishes verified policy data from a custom manual scale.",
          "A calculator result is an estimate unless it uses the exact rules published by the institution for the student's programme and academic period. Official transcripts and university records remain the authoritative source."
        ]
      },
      {
        heading: "A safer way to use GPA calculators",
        bullets: [
          "Check the university's official grading policy first.",
          "Enter credit hours exactly as they appear in the course record.",
          "Do not assume every A, B or percentage maps to the same points at every institution.",
          "Use the calculator for planning and checking, then compare with the official academic record."
        ]
      }
    ]
  },
  {
    slug: "browser-tools-privacy-and-local-processing",
    title: "Browser-Based Tools and Privacy: What Local Processing Really Means",
    description: "Understand what browser-first processing can keep on your device, what still requires internet access, and how to judge privacy claims honestly.",
    updated: "2026-10-06",
    readingTime: "6 min read",
    relatedTools: ["mz-online-word", "image-compressor", "pdf-merger", "smart-document-scanner"],
    intro: "A web tool can run code inside your browser without uploading every file to a server, but 'browser-based' does not automatically mean 'offline', 'anonymous' or 'nothing ever leaves the device'. The exact behaviour depends on the feature.",
    sections: [
      {
        heading: "What local browser processing means",
        paragraphs: [
          "For a truly local file operation, JavaScript running in the page reads the file selected by the user, processes it in browser memory and creates the result on the same device. Examples can include image resizing, some PDF page operations and simple calculators.",
          "The browser may still have downloaded the application code from the website, and analytics or advertising requests can still occur separately. Local file processing describes the file workflow, not every network request made by the page."
        ]
      },
      {
        heading: "Features that usually need the internet",
        paragraphs: [
          "Services such as online dictionaries, remote AI APIs, server-side compilers or cloud OCR may require a network request. A responsible interface should distinguish these features from local processing rather than placing one blanket privacy claim over the entire application.",
          "MZ Smart Tools House uses tool metadata and interface notices to separate browser-first operations from features that require an online service."
        ]
      },
      {
        heading: "Why offline behaviour varies",
        paragraphs: [
          "A Progressive Web App can cache application assets so parts of the interface continue to load without a connection. However, a cached interface cannot make an online API work while the device is offline. A calculator may continue to work, while a dictionary lookup or server-backed feature may not.",
          "That is also why a useful offline warning should explain the connection problem without falsely claiming that every tool has stopped working."
        ]
      },
      {
        heading: "Practical privacy checks for users",
        bullets: [
          "Read the tool's privacy or processing notice.",
          "Avoid uploading confidential files to any feature that explicitly requires an online service unless you accept that service's terms.",
          "Keep backups of important originals before editing or converting.",
          "Review exported documents before relying on them.",
          "Use the site's Privacy Policy for analytics, advertising and contact-data disclosures."
        ]
      },
      {
        heading: "What MZ Smart Tools House does not claim",
        paragraphs: [
          "The platform does not treat 'browser-first' as a promise that every feature works offline or that every network request disappears. The goal is narrower and more testable: use local processing where practical, disclose when a feature needs the network, and avoid pretending a server-backed result was produced locally."
        ]
      }
    ]
  },
  {
    slug: "ratio-and-proportion-calculator-guide",
    title: "Ratios and Proportions: How Simplifying and Cross-Multiplication Work",
    description: "Learn how to simplify a ratio, solve A:B = C:D with cross-multiplication, and avoid common denominator mistakes.",
    updated: "2026-10-06",
    readingTime: "5 min read",
    relatedTools: ["ratio-calculator", "percentage-calculator", "average-calculator"],
    intro: "Ratios compare quantities, while proportions state that two ratios are equal. The calculations are straightforward when the relationship is written clearly and denominator values are valid.",
    sections: [
      {
        heading: "Simplifying a ratio",
        paragraphs: [
          "For whole-number ratios, divide both parts by their greatest common divisor. The ratio 8:12 has a greatest common divisor of 4, so it simplifies to 2:3.",
          "The value of the comparison has not changed; only the representation is smaller. This is similar to reducing a fraction while keeping the same numerical relationship."
        ]
      },
      {
        heading: "Solving a proportion",
        paragraphs: [
          "A proportion such as A:B = C:D can be written A/B = C/D. Cross-multiplication gives A × D = B × C. If one value is unknown, rearrange that equation to solve it.",
          "For example, 2:3 = 8:X becomes 2/3 = 8/X. Cross-multiplication gives 2X = 24, so X = 12."
        ]
      },
      {
        heading: "Why zero denominators matter",
        paragraphs: [
          "A ratio can be written in colon form, but proportion calculations still rely on division. If a denominator becomes zero, the relationship is undefined. A calculator should validate this instead of silently producing Infinity or an incorrect result.",
          "The MZ ratio calculator intentionally focuses on positive ratios and positive proportions to keep these cases clear."
        ]
      },
      {
        heading: "Common mistakes",
        bullets: [
          "Swapping the order of one ratio but not the other.",
          "Cross-multiplying the wrong pair of terms.",
          "Using zero where it becomes a denominator.",
          "Mixing units without converting them first.",
          "Assuming a ratio is a percentage without converting it."
        ]
      },
      {
        heading: "Ratio vs percentage",
        paragraphs: [
          "A ratio such as 1:4 compares two quantities. A percentage expresses a part relative to a whole out of 100. They can be related, but the conversion depends on what the terms represent. If one part is 1 out of a total of 4 equal parts, that share is 25%; the ratio notation itself does not automatically mean 25% without the part-to-whole interpretation."
        ]
      }
    ]
  }
];

export function getGuideBySlug(slug) {
  return guides.find((guide) => guide.slug === slug) || null;
}
