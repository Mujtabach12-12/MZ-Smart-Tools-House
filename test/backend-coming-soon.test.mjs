import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(file, 'utf8');

const ai = read('src/tools/ai/AiWritingAssistant.jsx');
assert.match(ai, /Coming soon/);
assert.match(ai, /Thanks for your interest/);
assert.doesNotMatch(ai, /Netlify|API key|server-backed|configured endpoint|HTTP 404/i);

const programming = read('src/tools/programming/ProgrammingLab.jsx');
assert.match(programming, /Thanks for your interest/);
assert.doesNotMatch(programming, /secure execution service is not currently reachable|isolated compiler service/i);

const expanded = read('src/tools/expanded/ExpandedTool.jsx');
assert.match(expanded, /AI · Coming soon/);
assert.match(expanded, /AI-assisted processing is coming soon/);
assert.doesNotMatch(expanded, /Use configured AI|configured server only|API keys are never placed/i);

const contact = read('src/pages/Contact.jsx');
assert.doesNotMatch(contact, /Netlify deployment/i);
assert.match(contact, /Contact messaging is coming soon/);

console.log('backend-coming-soon.test: PASS');
