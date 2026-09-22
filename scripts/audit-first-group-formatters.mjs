import assert from 'node:assert/strict';

function currentFormatter(input) {
  return input
    .replace(/>\s*</g, '>\n<')
    .replace(/;\s*/g, ';\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n  ');
}

const jsSource = 'const s = "a;b"; console.log(s);';
const jsOutput = currentFormatter(jsSource);
let jsBroken = false;
try { new Function(jsOutput); } catch { jsBroken = true; }
assert.equal(jsBroken, true, 'current JavaScript formatter should be proven unsafe for semicolons inside strings');

const cssSource = '.x::before{content:"a;b";color:red;}';
const cssOutput = currentFormatter(cssSource);
assert.ok(cssOutput.includes('"a;\n'), 'current CSS formatter inserts a raw newline into quoted content');

const htmlSource = '<span>a;b</span>';
const htmlOutput = currentFormatter(htmlSource);
assert.notEqual(htmlOutput, htmlSource, 'current HTML formatter mutates text content whitespace');

console.log('First-group formatter defect audit confirmed:');
console.log('- JavaScript: syntax can be broken by semicolons inside strings.');
console.log('- CSS: quoted content can receive invalid raw newlines.');
console.log('- HTML: text-node whitespace/content can be changed.');
