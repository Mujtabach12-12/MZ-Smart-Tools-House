import fs from 'node:fs';
import path from 'node:path';
import { tools } from '../src/data/tools.js';
import { converterToolRecords } from '../src/tools/converters/conversionRegistry.js';
import { formulaToolIds } from '../src/tools/science/formulaRegistry.js';
import { SIMPLE_CALCULATOR_FIELDS } from '../src/lib/simpleCalculators.js';

const converterIds = new Set(converterToolRecords.map((record) => record.id || record.toolId).filter(Boolean));
const formulaIds = new Set(formulaToolIds);
const simpleIds = new Set(Object.keys(SIMPLE_CALCULATOR_FIELDS));
const calculatorIds = new Set([
  'gpa-calculator','cgpa-calculator','percentage-calculator','marks-calculator','grade-calculator',
  'attendance-calculator','age-calculator','discount-calculator','average-calculator','ratio-calculator',
  'time-calculator','study-hours-calculator',
]);
const phase4Ids = new Set(['mz-pdf-viewer','smart-document-scanner']);
const phase3ContractIds = new Set(['image-rotator','pdf-rotate','scanned-pdf-to-searchable-pdf']);
const knownBlocked = new Map([
  ['ai-writing-assistant','Requires a configured server/provider before end-to-end generation can be verified.'],
  ['programming-lab','Compiled-language execution depends on the external compiler service; browser-only paths do not verify every advertised runtime.'],
  ['html-formatter','Known regex formatter correctness defect; complex source can be changed incorrectly.'],
  ['css-formatter','Known regex formatter correctness defect; quoted/complex CSS can be changed incorrectly.'],
  ['javascript-formatter','Known regex formatter correctness defect; strings/statements can be changed incorrectly.'],
  ['image-metadata-viewer','Current viewer does not provide full EXIF/IPTC/XMP metadata coverage implied by the tool name.'],
]);

const rows = tools.map((tool) => {
  if (knownBlocked.has(tool.id)) return { ...tool, verification:'BLOCKED_OR_KNOWN_ISSUE', evidence:'repository audit', note:knownBlocked.get(tool.id) };
  if (converterIds.has(tool.id)) return { ...tool, verification:'SAMPLE_LOGIC_EXECUTED', evidence:'test/converters.test.mjs', note:'Shared conversion engine executed reference, round-trip and validation samples.' };
  if (formulaIds.has(tool.id)) return { ...tool, verification:'SAMPLE_LOGIC_EXECUTED', evidence:'test/science-formulas.test.mjs', note:'Formula engine executed a smoke/reference sample and validation coverage.' };
  if (simpleIds.has(tool.id)) return { ...tool, verification:'SAMPLE_LOGIC_EXECUTED', evidence:'test/simple-calculators.test.mjs', note:'Shared simple-calculator engine executed formula and validation samples.' };
  if (calculatorIds.has(tool.id)) return { ...tool, verification:'SAMPLE_LOGIC_EXECUTED', evidence:'test/calculators.test.mjs', note:'Dedicated calculator logic executed numeric reference and error samples.' };
  if (phase4Ids.has(tool.id)) return { ...tool, verification:'SOURCE_AND_INTERACTION_CONTRACT_TESTED', evidence:'test/phase4-reader-scanner.test.mjs', note:'Reader/scanner interaction and quality contracts passed; real browser/device QA is still required.' };
  if (phase3ContractIds.has(tool.id)) return { ...tool, verification:'QUALITY_CONTRACT_TESTED', evidence:'test/quality-architecture.test.mjs', note:'Source-quality contract passed; browser output inspection is still required.' };
  return { ...tool, verification:'WIRED_NOT_SAMPLE_EXECUTED', evidence:'registry + functional + bundle audits', note:'Implementation is wired, but no truthful per-tool sample output execution was completed in this environment.' };
});

const counts = rows.reduce((acc,row) => { acc[row.verification] = (acc[row.verification] || 0) + 1; return acc; }, {});
const outDir = path.resolve('audit');
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'tool-verification-ledger.json'), JSON.stringify({generatedAt:new Date().toISOString(), total:rows.length, counts, rows}, null, 2));

const md = [];
md.push('# MZ Smart Tool House — Truthful Tool Verification Ledger');
md.push('');
md.push('This ledger separates code wiring from actual sample execution. It must not be used to claim browser/mobile/output verification that did not happen.');
md.push('');
md.push(`Total registered tools: **${rows.length}**`);
for (const [status,count] of Object.entries(counts)) md.push(`- **${status}:** ${count}`);
md.push('');
md.push('| Tool | Category | Verification | Evidence | Note |');
md.push('|---|---|---|---|---|');
for (const row of rows) md.push(`| ${row.name.replaceAll('|','\\|')} | ${row.category} | ${row.verification} | ${row.evidence} | ${row.note.replaceAll('|','\\|')} |`);
fs.writeFileSync(path.join(outDir,'TOOL-VERIFICATION-LEDGER.md'), md.join('\n')+'\n');
console.log('Tool verification ledger generated:', rows.length, counts);
