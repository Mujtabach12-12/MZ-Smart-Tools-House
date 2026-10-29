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
          "A ratio and a percentage are not automatically interchangeable because the meaning of each term matters. If 1:4 means part-to-whole, the first quantity is 1/4 of the whole, which is 25%. But if 1:4 means one group compared with another group, the combined total is 1 + 4 = 5 parts, so the first group is 1/5 of the total, or 20%.",
          "Before converting a ratio to a percentage, decide whether the second term represents the whole or another part. This small interpretation step prevents a common mistake in mixture, class-composition and probability examples."
        ],
        bullets: [
          "Part-to-whole 1:4 means 1 ÷ 4 = 25%.",
          "Part-to-part 1:4 means the first part is 1 ÷ (1 + 4) = 20% of the combined total.",
          "Keep units consistent before simplifying or solving a proportion.",
          "Write down what each term represents before converting to a percentage."
        ]
      }
    ]
  },
{
  "slug": "understanding-scholarship-marks-percentage",
  "title": "Scholarship Percentage: Calculate Marks Correctly Before Checking Eligibility",
  "description": "Calculate an accurate marks percentage from obtained and maximum marks, and understand why scholarship eligibility requires official institution rules.",
  "updated": "2026-10-29",
  "readingTime": "6 min read",
  "relatedTools": [
    "scholarship-percentage-calculator",
    "percentage-calculator",
    "gpa-calculator",
    "cgpa-calculator"
  ],
  "intro": "Scholarship forms often ask for your percentage, grade or CGPA, but these are not interchangeable numbers. A marks-percentage calculator can accurately handle obtained and maximum marks. It cannot decide whether a scholarship provider will accept your qualification, or invent a CGPA conversion policy. This guide separates the arithmetic from the official scholarship requirements so you can submit more reliable information.",
  "sections": [
    {
      "heading": "Start with obtained marks and total possible marks",
      "paragraphs": [
        "The standard marks percentage formula is obtained marks divided by the total maximum possible marks, multiplied by one hundred. Both numbers must represent the same set of exams or subjects. If you add the obtained marks for five subjects, you must also add the maximum marks for those same five subjects.",
        "For example, 420 out of 500 gives 420 ÷ 500 × 100 = 84%. If different subjects have different maximum marks, add the raw obtained and maximum totals rather than taking an unweighted average of individual percentages. A high-scoring 50-mark paper should not count the same as a 200-mark paper unless your institution specifically defines that policy."
      ]
    },
    {
      "heading": "What the calculator checks and what it cannot know",
      "paragraphs": [
        "A valid maximum marks total must be positive, and obtained marks should fall between zero and that maximum. Entering 560 out of 500 indicates either a data entry mistake or inconsistent totals. Incomplete fields should not silently turn into a zero percent result.",
        "The result only describes the marks you supplied. It does not know whether an applicant meets residency requirements, financial-need rules, a subject-specific minimum, institution affiliation, seat allocation or an application deadline. These conditions belong to the scholarship provider's published notice."
      ]
    },
    {
      "heading": "Why CGPA is not a universal percentage",
      "paragraphs": [
        "A CGPA is calculated using an institution's grading scale and course-credit rules. Different universities can map the same numeric CGPA to different marks percentages. A generic multiplication rule can therefore produce a misleading application value.",
        "If a scholarship asks for CGPA, use the official CGPA field when provided. If it specifically asks for a percentage conversion, read your university's published conversion policy or request an official equivalence certificate where appropriate. Do not assume one conversion formula works for every Pakistani or international university."
      ]
    },
    {
      "heading": "Practical checklist before applying",
      "bullets": [
        "Use the exact marks and maximum marks shown on an official transcript or result card.",
        "Check whether the application requests annual percentage, final-degree percentage or a semester-specific number.",
        "If it requests an aggregate across subjects, ensure obtained and maximum totals cover the same assessment set.",
        "Read the official scholarship eligibility notice, not a copied social-media cutoff.",
        "Keep a copy of the calculation and verify it against any official institutional equivalence or merit formula."
      ]
    },
    {
      "heading": "Avoid these common mistakes",
      "paragraphs": [
        "A percentage is not an acceptance probability, and a result of 84% does not mean an 84% chance of winning a scholarship. Universities may use additional components, tests, category rules or a selection process. Likewise, a minimum requirement is not necessarily a guaranteed award.",
        "When a scholarship changes its rules or application year, use its latest official announcement. The MZ calculator is useful for arithmetic verification; authority over selection remains entirely with the provider."
      ]
    }
  ]
},
{
  "slug": "parallel-resistors-explained",
  "title": "Parallel Resistance Explained: Formula, Worked Example and Common Errors",
  "description": "Understand two-resistor parallel circuits using 100Ω and 200Ω, reciprocal formulas, and the difference between series and parallel connections.",
  "updated": "2026-10-29",
  "readingTime": "5 min read",
  "relatedTools": [
    "parallel-resistance-calculator",
    "series-resistance-calculator",
    "ohms-law-calculator"
  ],
  "intro": "Equivalent resistance is a convenient way to replace a network of resistors with one value that produces the same relationship between terminal voltage and total current. For two ideal resistors in parallel, current can flow through both branches. This guide explains the calculation implemented by the MZ Parallel Resistance Calculator and shows why the result must be smaller than either positive branch resistance.",
  "sections": [
    {
      "heading": "What parallel connection means",
      "paragraphs": [
        "Two elements are in parallel when each is connected between the same pair of nodes, so each experiences the same voltage between those nodes. The currents through their branches add at the junction. This differs from a series connection, where the same current passes through each element consecutively.",
        "For resistors with positive values, adding an extra parallel current path lowers the overall equivalent resistance. This intuitive check is useful before you reach for any formula: if you calculate 300 Ω for 100 Ω and 200 Ω in parallel, you probably used the series formula by mistake."
      ]
    },
    {
      "heading": "The reciprocal formula and its two-resistor shortcut",
      "paragraphs": [
        "The relationship is 1/Rtotal = 1/R1 + 1/R2. Multiplying through by R1 × R2 gives the two-resistor shortcut Rtotal = (R1 × R2) / (R1 + R2). These formulas are equivalent when both resistances are positive and finite.",
        "Enter both resistance values in ohms. If the source lists a value in kilo-ohms, convert it first: 1 kΩ equals 1,000 Ω. Mixing kilo-ohms and ohms without converting is a common source of errors larger than any rounding difference."
      ]
    },
    {
      "heading": "Worked example: 100 Ω and 200 Ω",
      "paragraphs": [
        "Multiply the resistances: 100 × 200 = 20,000. Add them: 100 + 200 = 300. Divide 20,000 by 300 to obtain approximately 66.67 Ω. This is below 100 Ω, which makes sense because there are two available paths.",
        "You can cross-check using reciprocals: 1/100 + 1/200 = 0.01 + 0.005 = 0.015; the reciprocal of 0.015 is approximately 66.67. Both methods give the same result."
      ]
    },
    {
      "heading": "When the simple calculator is insufficient",
      "paragraphs": [
        "A large resistor network may contain series and parallel stages, bridges or other components that cannot be replaced using a single two-resistor shortcut. Physical resistors also have tolerances and temperature-dependent properties. A quick mathematical estimate is useful, but it does not certify an electronics design.",
        "A zero-ohm short circuit is a special case and the MZ tool intentionally validates that resistance inputs are positive. Check datasheets and safety requirements for real electrical installations, particularly where high current or mains power may be involved."
      ]
    },
    {
      "heading": "Quick checks for homework and experiments",
      "bullets": [
        "Confirm that both resistors connect to the same two circuit nodes.",
        "Convert both values to the same ohm unit before calculating.",
        "Use the reciprocal formula or the two-resistor shortcut, not simple addition.",
        "Check that the result is lower than the smaller of two positive resistances.",
        "For a larger network, reduce only valid series or parallel subgroups, then re-evaluate."
      ]
    }
  ]
}
];

export function getGuideBySlug(slug) {
  return guides.find((guide) => guide.slug === slug) || null;
}
