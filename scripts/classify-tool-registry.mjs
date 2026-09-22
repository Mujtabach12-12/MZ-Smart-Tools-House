import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tools } from '../src/data/tools.js';
import { categories } from '../src/data/categories.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexSource = fs.readFileSync(path.join(root, 'src/tools/index.js'), 'utf8');
const loaderMap = new Map();
for (const match of indexSource.matchAll(/^\s*"([^"]+)":\s*\(\)\s*=>\s*import\("([^"]+)"\)/gm)) {
  loaderMap.set(match[1], match[2]);
}

// Grade A is deliberately reserved for tools that have passed real browser/mobile/output QA.
// The current repository has strong source/unit coverage but no completed browser/mobile E2E pass.
const gradeD = new Map([
  ['ai-writing-assistant', 'Server/API configuration is required for the advertised AI generation path; the repository cannot prove a production provider is configured.'],
  ['programming-lab', 'The UI publicly exposes compiled/runtime languages that show a “Coming soon” state when the external compiler service is unavailable.'],
  ['image-metadata-viewer', 'The current implementation reports basic file/dimension properties, not the EXIF/IPTC/XMP metadata implied by a full metadata viewer.'],
  ['html-formatter', 'The shared formatter uses regex-based line insertion rather than a parser/formatter and can produce incorrect formatting for non-trivial markup.'],
  ['css-formatter', 'The shared formatter splits source text with simple regex replacements and is not syntax-aware; complex CSS can be reformatted incorrectly.'],
  ['javascript-formatter', 'The shared formatter is not syntax-aware and can insert whitespace/newlines inside JavaScript constructs; output correctness is not production-grade.'],
]);

const gradeC = new Map([
  ['mz-pdf-editor', 'Known fidelity debt remains in the editor preview/export path: page previews are still based on a fixed raster render rather than the Phase 4 reader architecture.'],
  ['mz-powerpoint-viewer', 'The compatibility viewer extracts/render approximations and cannot preserve all PowerPoint layout, SmartArt, animation, font and theme behavior.'],
  ['pdf-compressor', 'Balanced/small-file modes intentionally rasterize pages, trading vector/text fidelity for size; this needs clearer professional quality controls and verification.'],
  ['pdf-to-word', 'Conversion is primarily extracted text rebuilt as DOCX, so original PDF layout, images, columns and tables are not faithfully preserved.'],
  ['pdf-to-excel', 'Conversion maps extracted text into worksheet rows rather than reconstructing original table/layout semantics.'],
  ['pdf-to-powerpoint', 'Conversion rebuilds slides from extracted text and does not preserve source PDF layout/graphics with presentation fidelity.'],
  ['pdf-ocr', 'OCR is real but recognition quality, language coverage, bounding-box fidelity and large-document performance still need production QA.'],
  ['scanned-pdf-to-searchable-pdf', 'The searchable-PDF path preserves source pages but OCR text positioning remains approximate and needs output-level validation.'],
  ['pdf-repair', 'Implementation is parse-and-resave normalization; it cannot repair PDFs that are too corrupted to parse, so capability remains narrower than the tool name.'],
  ['pdf-compare', 'Comparison is extracted-text/word-position based, not a visual/layout-aware PDF comparison.'],
  ['word-to-pdf', 'DOCX conversion extracts paragraph text and does not preserve complex Word layout, tables, images or pagination.'],
  ['markdown-to-pdf', 'Markdown handling is intentionally simplified and strips formatting rather than rendering a complete Markdown document model.'],
  ['docx-viewer', 'Viewer extracts OOXML paragraph text but does not render a faithful DOCX page/layout view.'],
  ['docx-text-extractor', 'Extraction is limited mainly to word/document.xml paragraph text and does not cover all document structures/content.'],
  ['html-to-docx', 'HTML-to-DOCX output simplifies source structure/styles and does not preserve full CSS/layout fidelity.'],
  ['image-metadata-remover', 'Metadata removal works by full image re-encoding; JPEG output can incur quality loss and the path has not yet migrated to the Phase 3 shared image lifecycle.'],
  ['image-flipper', 'Legacy generic canvas path bypasses the Phase 3 shared Source/Preview/Output validation pipeline.'],
  ['image-brightness', 'Legacy generic canvas path bypasses the Phase 3 shared Source/Preview/Output validation pipeline.'],
  ['image-contrast', 'Legacy generic canvas path bypasses the Phase 3 shared Source/Preview/Output validation pipeline.'],
  ['grayscale-image', 'Legacy generic canvas path bypasses the Phase 3 shared Source/Preview/Output validation pipeline.'],
  ['image-blur', 'Legacy generic canvas path bypasses the Phase 3 shared Source/Preview/Output validation pipeline.'],
  ['image-sharpen', 'Legacy generic canvas path bypasses the Phase 3 shared Source/Preview/Output validation pipeline and performs CPU-heavy per-pixel work on the main thread.'],
  ['favicon-generator', 'Current implementation always renders a single 32×32 PNG canvas rather than producing a complete favicon asset set/ICO workflow.'],
]);

const sourceBackedB = new Map([
  ['mz-pdf-viewer', 'Phase 4 professional reader architecture and source-contract tests pass; real browser/mobile E2E verification is still pending.'],
  ['smart-document-scanner', 'Phase 4 high-quality scanner workflow and source-contract tests pass; real camera/device QA is still pending.'],
  ['image-rotator', 'Phase 3 lifecycle/dimension regressions pass; benchmark UX and real-browser output inspection are still pending.'],
]);

function classify(tool) {
  if (gradeD.has(tool.id)) return { grade:'D', reason:gradeD.get(tool.id), recommendation:'DISABLED' };
  if (gradeC.has(tool.id)) return { grade:'C', reason:gradeC.get(tool.id), recommendation:'TESTING' };
  const loader = loaderMap.get(tool.id) || 'unmapped';
  const reason = sourceBackedB.get(tool.id)
    || (loader.includes('/converters/ConversionTool') ? 'Real deterministic conversion logic exists and converter regression tests cover the shared engine; category-specific benchmark/mobile polish is still pending.'
      : loader.includes('/science/FormulaTool') ? 'Real formula implementation is wired and science/engineering regression tests cover the shared engine; benchmark/mobile polish is still pending.'
      : loader.includes('/UtilityTool') ? 'Real local browser logic is implemented through the shared utility engine, but the workspace remains generic and has not passed per-tool benchmark/browser/mobile QA.'
      : loader.includes('/expanded/ExpandedTool') ? 'A real implementation path exists in ExpandedTool, but it has not completed exact-tool benchmark/browser/mobile/output verification.'
      : loader.includes('/pdf/') ? 'A real PDF implementation exists and structural/source tests are available, but exact-tool benchmark/browser/output QA is still pending.'
      : loader.includes('/image/') ? 'A real image implementation exists using the dedicated image stack; exact-tool benchmark/browser/output QA is still pending.'
      : loader.includes('/calculators/') ? 'Dedicated calculator logic exists and calculator regressions pass, but benchmark/mobile/interaction QA is still pending.'
      : 'A real implementation is wired with no known placeholder path, but full benchmark/browser/mobile/output verification is still pending.');
  return { grade:'B', reason, recommendation:'TESTING' };
}

const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
const rows = tools.map((tool) => {
  const result = classify(tool);
  return {
    id: tool.id,
    name: tool.name,
    category: tool.category,
    categoryName: categoryBySlug.get(tool.category)?.name || tool.category,
    currentRegistryStatus: tool.status,
    implementation: loaderMap.get(tool.id) || null,
    grade: result.grade,
    recommendedRegistryStatus: result.recommendation,
    reason: result.reason,
  };
});

const gradeCounts = Object.fromEntries(['A','B','C','D','E'].map((g) => [g, rows.filter((r) => r.grade === g).length]));
const recommendationCounts = Object.fromEntries(['ACTIVE','TESTING','DISABLED'].map((s) => [s, rows.filter((r) => r.recommendedRegistryStatus === s).length]));
const categoryCounts = Object.fromEntries(categories.map((category) => {
  const categoryRows = rows.filter((row) => row.category === category.slug);
  return [category.slug, {
    name: category.name,
    total: categoryRows.length,
    grades: Object.fromEntries(['A','B','C','D','E'].map((g) => [g, categoryRows.filter((row) => row.grade === g).length])),
  }];
}));

const output = {
  generatedAt: new Date().toISOString(),
  methodology: {
    A: 'Professional + functional and verified through browser/mobile/output QA.',
    B: 'Real functional implementation exists; benchmark/UX/mobile/browser verification remains.',
    C: 'Real implementation exists but known fidelity/quality limitations remain.',
    D: 'Broken/incomplete/configuration-dependent behavior prevents production-ready use as advertised.',
    E: 'Placeholder/mock/fake implementation.',
    caveat: 'This classification is conservative. No tool is graded A because a complete real-browser + mobile + output QA pass has not been executed in this environment.',
  },
  summary: { total: rows.length, grades: gradeCounts, recommendedRegistryStatuses: recommendationCounts, categories: categories.length },
  categoryCounts,
  rows,
};

const auditDir = path.join(root, 'audit');
fs.mkdirSync(auditDir, { recursive: true });
fs.writeFileSync(path.join(auditDir, 'professional-tool-classification.json'), JSON.stringify(output, null, 2));

const lines = [];
lines.push('# MZ Smart Tool House — Professional Tool Classification Audit');
lines.push('');
lines.push(`Generated: ${output.generatedAt}`);
lines.push('');
lines.push(`Registry audited: **${rows.length} tools across ${categories.length} categories**.`);
lines.push('');
lines.push('## Classification summary');
lines.push('');
lines.push('| Grade | Meaning | Count |');
lines.push('|---|---|---:|');
for (const [grade, meaning] of Object.entries(output.methodology).filter(([key]) => /^[A-E]$/.test(key))) lines.push(`| ${grade} | ${meaning} | ${gradeCounts[grade]} |`);
lines.push('');
lines.push(`**Conservative release recommendation:** ACTIVE ${recommendationCounts.ACTIVE}, TESTING ${recommendationCounts.TESTING}, DISABLED ${recommendationCounts.DISABLED}.`);
lines.push('');
lines.push('> No tool is promoted to A/ACTIVE by this audit because full real-browser, mobile and output QA has not been completed. Source/unit tests are evidence, not a substitute for runtime verification.');
lines.push('');
for (const category of categories) {
  const categoryRows = rows.filter((row) => row.category === category.slug);
  lines.push(`## ${category.name} (${categoryRows.length})`);
  lines.push('');
  lines.push('| Grade | Tool | ID | Implementation | Release recommendation |');
  lines.push('|---|---|---|---|---|');
  for (const row of categoryRows) lines.push(`| ${row.grade} | ${row.name.replace(/\|/g,'\\|')} | \`${row.id}\` | \`${row.implementation || 'UNMAPPED'}\` | ${row.recommendedRegistryStatus} |`);
  lines.push('');
  lines.push('### Findings');
  lines.push('');
  for (const row of categoryRows) lines.push(`- **${row.grade} — ${row.name}:** ${row.reason}`);
  lines.push('');
}
fs.writeFileSync(path.join(auditDir, 'PROFESSIONAL-TOOL-CLASSIFICATION.md'), lines.join('\n'));

console.log(`Classified ${rows.length} tools across ${categories.length} categories.`);
console.log('Grades:', gradeCounts);
console.log('Recommended statuses:', recommendationCounts);
