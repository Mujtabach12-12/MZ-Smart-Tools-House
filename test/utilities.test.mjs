import assert from 'node:assert/strict';
import { percentageOf, valueFromPercentage, percentageChange } from '../src/lib/calculators/percentage.js';
import { calculateAge } from '../src/lib/calculators/age.js';
import { applyDiscount, discountPercentFromPrices } from '../src/lib/calculators/discount.js';
import { computeAverage } from '../src/lib/calculators/average.js';
import { simplifyRatio, solveProportion } from '../src/lib/calculators/ratio.js';
import { combineDurations, clockTimeDifference } from '../src/lib/calculators/time.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ok - ${name}`); }
  catch (error) { console.error(`  FAIL - ${name}`); console.error(`    ${error.message}`); process.exitCode = 1; }
}
function close(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);
}

console.log('Percentage Calculator');
test('20% of 150 = 30', () => close(valueFromPercentage(20, 150), 30));
test('15% of 200 = 30', () => close(valueFromPercentage(15, 200), 30));
test('7.5% of 80 = 6', () => close(valueFromPercentage(7.5, 80), 6));
test('12.5% of 64 = 8', () => close(valueFromPercentage(12.5, 64), 8));
test('25 is 12.5% of 200', () => close(percentageOf(25, 200), 12.5));
test('100 to 120 = +20%', () => close(percentageChange(100, 120), 20));
test('100 to 80 = -20%', () => close(percentageChange(100, 80), -20));
test('0% of 500 = 0', () => close(valueFromPercentage(0, 500), 0));
test('zero whole rejected', () => assert.throws(() => percentageOf(1, 0), /cannot be zero/));
test('zero baseline change rejected', () => assert.throws(() => percentageChange(0, 10), /zero baseline is undefined/));
test('empty percentage input rejected', () => assert.throws(() => valueFromPercentage('', 10), /required/));
test('negative values remain mathematical rather than silently changed', () => close(valueFromPercentage(-10, 50), -5));

console.log('Age Calculator');
test('2000-01-01 to 2020-01-01 = 20y 0m 0d', () => assert.deepEqual(calculateAge('2000-01-01', '2020-01-01'), { years:20, months:0, days:0, totalDays:7305 }));
test('2000-01-15 to 2020-01-20 = 20y 0m 5d', () => { const r=calculateAge('2000-01-15','2020-01-20'); assert.deepEqual([r.years,r.months,r.days],[20,0,5]); });
test('month end Jan 31 to Mar 1 uses real calendar = 0y 1m 1d in leap 2000', () => { const r=calculateAge('2000-01-31','2000-03-01'); assert.deepEqual([r.years,r.months,r.days],[0,1,1]); });
test('leap-day birthday to 2020-02-28 stays before Feb-29 anniversary', () => { const r=calculateAge('2000-02-29','2020-02-28'); assert.deepEqual([r.years,r.months,r.days],[19,11,30]); });
test('leap-day birthday exact 2020-02-29 = 20y', () => { const r=calculateAge('2000-02-29','2020-02-29'); assert.deepEqual([r.years,r.months,r.days],[20,0,0]); });
test('same date = zero', () => { const r=calculateAge('2024-06-30','2024-06-30'); assert.deepEqual([r.years,r.months,r.days,r.totalDays],[0,0,0,0]); });
test('future DOB rejected', () => assert.throws(() => calculateAge('2025-01-01','2024-12-31'), /cannot be in the future/));
test('invalid non-leap February 29 rejected', () => assert.throws(() => calculateAge('1900-02-29','2000-01-01'), /valid calendar date/));
test('valid century leap year accepted', () => { const r=calculateAge('2000-02-29','2004-02-29'); assert.equal(r.years,4); });

console.log('Discount Calculator');
test('1000 at 20% -> save 200 final 800', () => assert.deepEqual(applyDiscount(1000,20), { finalPrice:800, saved:200 }));
test('2500 at 15% -> save 375 final 2125', () => assert.deepEqual(applyDiscount(2500,15), { finalPrice:2125, saved:375 }));
test('999 at 10% -> save 99.9 final 899.1', () => { const r=applyDiscount(999,10); close(r.saved,99.9); close(r.finalPrice,899.1); });
test('0% leaves price unchanged', () => assert.deepEqual(applyDiscount(999,0), { finalPrice:999, saved:0 }));
test('100% produces zero final price', () => assert.deepEqual(applyDiscount(999,100), { finalPrice:0, saved:999 }));
test('discount above 100 rejected', () => assert.throws(() => applyDiscount(100,101), /between 0 and 100/));
test('negative price rejected', () => assert.throws(() => applyDiscount(-1,10), /greater than or equal to 0/));
test('reverse discount works', () => close(discountPercentFromPrices(1000,800).percent,20));
test('reverse discount with zero original rejected', () => assert.throws(() => discountPercentFromPrices(0,0), /greater than 0/));

console.log('Average Calculator');
test('10 20 30 average = 20', () => close(computeAverage([10,20,30]).average,20));
test('5 10 15 20 25 average = 15', () => close(computeAverage([5,10,15,20,25]).average,15));
test('2.5 3.5 4.5 average = 3.5', () => close(computeAverage([2.5,3.5,4.5]).average,3.5));
test('-10 and 10 average = 0', () => close(computeAverage([-10,10]).average,0));
test('mixed signed values average = 2.5', () => close(computeAverage([-5,10,15,-10]).average,2.5));
test('single value average equals value', () => close(computeAverage([50]).average,50));
test('empty list rejected', () => assert.throws(() => computeAverage([]), /at least one/));
test('invalid token rejected', () => assert.throws(() => computeAverage([10,20,'abc',30]), /Value #3/));
test('large list remains correct', () => { const data=Array.from({length:10000},(_,i)=>i+1); close(computeAverage(data).average,5000.5); });
test('overflowing sum rejected', () => assert.throws(() => computeAverage([Number.MAX_VALUE, Number.MAX_VALUE]), /too large/));

console.log('Ratio Calculator');
test('8:12 -> 2:3', () => assert.deepEqual(simplifyRatio(8,12), {a:2,b:3}));
test('15:25 -> 3:5', () => assert.deepEqual(simplifyRatio(15,25), {a:3,b:5}));
test('100:250 -> 2:5', () => assert.deepEqual(simplifyRatio(100,250), {a:2,b:5}));
test('1.5:3 -> 1:2', () => assert.deepEqual(simplifyRatio(1.5,3), {a:1,b:2}));
test('very small decimal ratio does not recurse forever', () => assert.deepEqual(simplifyRatio(0.0000001,0.0000002), {a:1,b:2}));
test('2:3 = 8:X -> X=12', () => close(solveProportion({a:2,b:3,c:8,d:null}).d,12));
test('5:7 = X:21 -> X=15', () => close(solveProportion({a:5,b:7,c:null,d:21}).c,15));
test('4:9 = 20:X -> X=45', () => close(solveProportion({a:4,b:9,c:20,d:null}).d,45));
test('zero ratio rejected clearly', () => assert.throws(() => simplifyRatio(0,5), /greater than 0/));
test('multiple missing proportion values rejected', () => assert.throws(() => solveProportion({a:null,b:3,c:null,d:4}), /exactly one/));

console.log('Time Calculator');
test('1h30 + 2h45 = 4h15', () => assert.deepEqual(combineDurations({h:1,m:30,s:0},{h:2,m:45,s:0},'add'), {h:4,m:15,s:0,negative:false}));
test('2h40m30s + 1h30m40s = 4h11m10s', () => assert.deepEqual(combineDurations({h:2,m:40,s:30},{h:1,m:30,s:40},'add'), {h:4,m:11,s:10,negative:false}));
test('2h50 + 1h20 = 4h10', () => assert.deepEqual(combineDurations({h:2,m:50,s:0},{h:1,m:20,s:0},'add'), {h:4,m:10,s:0,negative:false}));
test('1:59:50 + 0:00:20 = 2:00:10', () => assert.deepEqual(combineDurations({h:1,m:59,s:50},{h:0,m:0,s:20},'add'), {h:2,m:0,s:10,negative:false}));
test('5h30 - 2h15 = 3h15', () => assert.deepEqual(combineDurations({h:5,m:30,s:0},{h:2,m:15,s:0},'subtract'), {h:3,m:15,s:0,negative:false}));
test('5:10:20 - 2:40:50 = 2:29:30', () => assert.deepEqual(combineDurations({h:5,m:10,s:20},{h:2,m:40,s:50},'subtract'), {h:2,m:29,s:30,negative:false}));
test('equal durations = zero', () => assert.deepEqual(combineDurations({h:5,m:30,s:0},{h:5,m:30,s:0},'subtract'), {h:0,m:0,s:0,negative:false}));
test('negative subtraction is represented explicitly', () => assert.deepEqual(combineDurations({h:2,m:0,s:0},{h:5,m:0,s:0},'subtract'), {h:3,m:0,s:0,negative:true}));
test('20h + 8h = 28h duration, no 24h rollover', () => assert.deepEqual(combineDurations({h:20,m:0,s:0},{h:8,m:0,s:0},'add'), {h:28,m:0,s:0,negative:false}));
test('minutes above 59 rejected', () => assert.throws(() => combineDurations({h:0,m:90,s:0},{h:0,m:0,s:0}),'Minutes'));
test('decimal duration units rejected', () => assert.throws(() => combineDurations({h:1.5,m:0,s:0},{h:0,m:0,s:0}), /whole number/));
test('clock difference same day', () => assert.deepEqual(clockTimeDifference('09:00','17:30'), {h:8,m:30}));
test('clock difference crossing midnight', () => assert.deepEqual(clockTimeDifference('22:00','02:00'), {h:4,m:0}));
test('empty clock time rejected', () => assert.throws(() => clockTimeDifference('','10:00'), /required/));

console.log(`\n${passed} utilities tests passed.`);
if (process.exitCode === 1) process.exitCode = 1;
