import assert from 'node:assert/strict';
import { formulaDefinitions, calculateFormulaTool } from '../src/tools/science/formulaEngine.js';
import { formulaToolRecords } from '../src/tools/science/formulaRegistry.js';
import fs from 'node:fs';

assert.equal(formulaToolRecords.length, 49, 'Expected 49 verified formula tools in this expansion');
assert.equal(Object.keys(formulaDefinitions).length, formulaToolRecords.length, 'Every formula registry item needs an engine definition');

const defaults = {
  distance:100,time:10,mass:2,acceleration:3,force:10,angle:0,velocity:5,height:10,volume:2,speed:340,frequency:170,period:.5,current:2,resistance:10,voltage:12,specificHeat:4184,temperatureChange:2,objectDistance:2,imageDistance:2,
  moles:1,solventMass:1,equivalents:1,c1:2,v1:100,v2:200,hydrogen:.001,temperature:300,componentMass:20,totalMass:100,
  p:.6,initial:100,rate:.1,eyepiece:10,objective:40,sequence:'ATCG',parent1:'Aa',parent2:'Aa',a:1,b:4,c:2,x:3,y:4,z:12,n:5,r:2,
  area:.5,change:.01,original:2,vin:12,r1:1000,r2:1000,r3:1000,supply:5,forward:2,currentMa:20,capacitanceUf:100,driver:20,driven:40,diameter:.1,rpm:60,capacity:5,efficiency:80,onTime:2,offTime:8,length:2,width:3,depth:.1,rise:1,run:10,
  fixed:1000,price:50,variable:30,start:100,end:121,years:2,gain:150,cost:100,sales:1000,
};
const overrides = {
  'dna-complement-tool': {sequence:'ATCG'},
  'dna-to-rna-tool': {sequence:'ATCG'},
  'rna-to-protein-tool': {sequence:'AUGGCUUAA'},
  'quadratic-equation-calculator': {a:1,b:-3,c:2},
};

for (const tool of formulaToolRecords) {
  const def = formulaDefinitions[tool.id];
  assert.ok(def?.calculate, `${tool.id} needs a calculate function`);
  const values = {};
  for (const [key] of def.fields) values[key] = key in (overrides[tool.id]||{}) ? overrides[tool.id][key] : defaults[key];
  const result = calculateFormulaTool(tool.id, values);
  assert.ok(result?.display && result.display !== '—', `${tool.id} should produce a visible result`);
}

function close(actual, expected, tolerance=1e-9){ assert.ok(Math.abs(actual-expected)<=tolerance, `${actual} should be close to ${expected}`); }
close(calculateFormulaTool('velocity-calculator',{distance:100,time:10}).value,10);
close(calculateFormulaTool('force-calculator',{mass:2,acceleration:3}).value,6);
close(calculateFormulaTool('kinetic-energy-calculator',{mass:2,velocity:3}).value,9);
close(calculateFormulaTool('molarity-calculator',{moles:1,volume:2}).value,.5);
close(calculateFormulaTool('ph-calculator',{hydrogen:.001}).value,3,1e-12);
close(calculateFormulaTool('voltage-divider-calculator',{vin:12,r1:1000,r2:1000}).value,6);
close(calculateFormulaTool('parallel-resistance-calculator',{r1:100,r2:100}).value,50);
close(calculateFormulaTool('pwm-duty-cycle-calculator',{onTime:2,offTime:8}).value,20);
close(calculateFormulaTool('break-even-calculator',{fixed:1000,price:50,variable:30}).value,50);
close(calculateFormulaTool('cagr-calculator',{start:100,end:121,years:2}).value,10,1e-9);
assert.equal(calculateFormulaTool('dna-complement-tool',{sequence:'ATCG'}).display,'TAGC');
assert.equal(calculateFormulaTool('dna-to-rna-tool',{sequence:'ATCG'}).display,'AUCG');
assert.equal(calculateFormulaTool('rna-to-protein-tool',{sequence:'AUGGCUUAA'}).display,'M–A–Stop');
assert.match(calculateFormulaTool('quadratic-equation-calculator',{a:1,b:-3,c:2}).display,/x₁ = 2.*x₂ = 1/);
assert.throws(()=>calculateFormulaTool('ph-calculator',{hydrogen:0}),/greater than zero/);
assert.throws(()=>calculateFormulaTool('dilution-calculator',{c1:1,v1:1,v2:0}),/greater than zero/);
assert.throws(()=>calculateFormulaTool('led-resistor-calculator',{supply:2,forward:3,currentMa:20}),/greater than LED forward voltage/);
assert.throws(()=>calculateFormulaTool('punnett-square-calculator',{parent1:'Aa',parent2:'Bb'}),/one gene only/);

console.log(`Science/engineering formula tests passed: ${formulaToolRecords.length} tools smoke-tested plus reference/validation cases.`);

const routes = fs.readFileSync('src/router/AppRoutes.jsx','utf8');
for (const slug of ['mathematics-tools','physics-tools','chemistry-tools','biology-tools','engineering-tools','robotics-tools']) assert.ok(routes.includes(`[\"${slug}\",\"${slug}\"]`), `Missing direct category route for ${slug}`);
console.log('Science category route aliases verified.');
