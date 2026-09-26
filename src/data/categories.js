/**
 * Central category registry.
 * `route` is the preferred public/canonical category URL. Legacy
 * /categories/:slug routes remain available for backwards compatibility.
 */
export const categories = [
  { slug: "office-tools", name: "MZ Office", route: "/office-tools", accent: "blue", description: "Create documents, spreadsheets, presentations and edit PDFs in one connected productivity workspace.", icon: "briefcase-business" },
  { slug: "pdf-tools", name: "PDF & Documents", route: "/pdf-tools", accent: "blue", description: "Merge, split, compress, convert and edit PDF files — locally in your browser where supported.", icon: "file-text" },
  { slug: "image-tools", name: "Images", route: "/image-tools", accent: "purple", description: "Compress, resize, crop and convert images without unnecessary uploads.", icon: "image" },
  { slug: "student-tools", name: "Student", route: "/student-tools", accent: "emerald", description: "Study, writing, dictionary, marks, attendance, planning and student productivity tools.", icon: "graduation-cap" },
  { slug: "programming-tools", name: "Programming", route: "/programming-tools", accent: "indigo", description: "Browser playgrounds and secure compiler frontends for learning and coding practice.", icon: "code" },
  { slug: "ai-tools", name: "AI", route: "/ai-tools", accent: "violet", description: "AI-powered writing and productivity tools being prepared for MZ Smart Tool House.", icon: "sparkles", seoIndexable: false },
  { slug: "finance-tools", name: "Business & Finance", route: "/business-tools", accent: "slate", description: "Interest, EMI, savings, budgets and personal finance estimates.", icon: "briefcase-business" },
  { slug: "calculators", name: "Calculators", route: "/calculators", accent: "amber", description: "GPA, CGPA, attendance, marks and everyday student calculators.", icon: "calculator" },
  { slug: "utility-tools", name: "Utilities", route: "/utilities", accent: "cyan", description: "General-purpose browser utilities and everyday helpers.", icon: "sparkles" },
  { slug: "developer-tools", name: "Developer", route: "/developer-tools", accent: "indigo", description: "JSON, Base64, URL, regex, hash and other everyday developer utilities.", icon: "code" },
  { slug: "scanner-tools", name: "Scanner", route: "/scanner-tools", accent: "teal", description: "Scan documents with camera or photos, enhance pages and export PDFs locally.", icon: "scan-line" },
  { slug: "document-tools", name: "Student Document Tools", route: "/document-tools", accent: "blue", description: "Assignment covers, resumes, cover letters and browser document utilities.", icon: "file-signature" },
  { slug: "text-tools", name: "Text Tools", route: "/text-tools", accent: "slate", description: "Word counters, case converters, text cleaners and formatting utilities.", icon: "type" },
  { slug: "converter-tools", name: "Converters", route: "/convert", accent: "cyan", description: "Length, temperature, weight, data, pressure, energy, speed and more.", icon: "divide" },
  { slug: "date-time-tools", name: "Date & Time", route: "/date-time-tools", accent: "sky", description: "Date differences, working days, date arithmetic and time utilities.", icon: "calendar" },
  { slug: "world-tools", name: "World Tools", route: "/world-tools", accent: "cyan", description: "World clocks and time-zone conversion using reliable browser timezone data.", icon: "globe-2" },
  { slug: "daily-life-tools", name: "Daily Life", route: "/daily-life-tools", accent: "orange", description: "Bills, tips, fuel, percentages, tasks and everyday calculators.", icon: "calendar-check" },
  { slug: "university-tools", name: "University Tools", route: "/university-tools", accent: "emerald", description: "Aggregate, merit, semester and credit hour calculators for university students.", icon: "graduation-cap" },
  { slug: "productivity-tools", name: "Productivity", route: "/productivity-tools", accent: "blue", description: "Timers, to-do lists and planners to help you study and work smarter.", icon: "clock" },
  { slug: "mathematics-tools", name: "Mathematics", route: "/mathematics-tools", accent: "indigo", description: "Algebra, geometry, vectors, probability and validated mathematical calculators.", icon: "sigma" },
  { slug: "physics-tools", name: "Physics", route: "/physics-tools", accent: "sky", description: "Mechanics, waves, electricity, optics and thermodynamics calculators with visible formulas.", icon: "calculator" },
  { slug: "chemistry-tools", name: "Chemistry", route: "/chemistry-tools", accent: "emerald", description: "Concentration, dilution, pH and gas-law calculations with explicit scientific units.", icon: "sigma" },
  { slug: "biology-tools", name: "Biology", route: "/biology-tools", accent: "lime", description: "Genetics, DNA/RNA, population and microscopy learning tools.", icon: "braces" },
  { slug: "engineering-tools", name: "Engineering", route: "/engineering-tools", accent: "orange", description: "Mechanical, electrical, electronics and civil engineering formula calculators.", icon: "calculator" },
  { slug: "robotics-tools", name: "Robotics", route: "/robotics-tools", accent: "violet", description: "Gear, wheel, battery and PWM calculations for robotics and mechatronics learning.", icon: "calculator" },
  { slug: "health-tools", name: "Health & Fitness", route: "/health-tools", accent: "rose", description: "BMI, BMR, calorie, heart-rate and body measurement estimates for informational use.", icon: "heart-pulse" },
  { slug: "nutrition-tools", name: "Nutrition", route: "/nutrition-tools", accent: "lime", description: "Calories, macros, protein, hydration and meal planning estimates.", icon: "salad" },
];

export function getCategoryBySlug(slug) {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryRoute(slug) {
  return getCategoryBySlug(slug)?.route || `/categories/${slug}`;
}
