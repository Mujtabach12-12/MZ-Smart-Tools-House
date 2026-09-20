import assert from "node:assert/strict";
import { cellKey, colName, computeCell, parseRef, rangeKeys } from "../src/lib/spreadsheet/formulas.js";

assert.equal(colName(0), "A");
assert.equal(colName(25), "Z");
assert.equal(colName(26), "AA");
assert.equal(cellKey(4, 1), "B5");
assert.deepEqual(parseRef("aa10"), { row:9, col:26, key:"AA10" });
assert.deepEqual(rangeKeys("A1:B2"), ["A1","B1","A2","B2"]);

const sheet = { cells:{
  A1:"10", A2:"20", A3:"30",
  B1:"=SUM(A1:A3)",
  B2:"=AVERAGE(A1:A3)",
  B3:"=MIN(A1:A3)",
  B4:"=MAX(A1:A3)",
  C1:"=COUNT(A1:A3)",
  C2:"=COUNTA(A1:A3)",
  C3:"=ROUND(B2,1)",
  C4:"=IF(A1>5,\"yes\",\"no\")",
  D1:"=A1+A2",
  D2:"=A2/A1",
  D3:"=A1/0",
  E1:"=E2",
  E2:"=E1",
  F1:"=UNKNOWN(A1)",
  G1:"=ROUNDUP(2.341,2)", G2:"=ROUNDDOWN(2.349,2)", G3:"=ABS(-12)", G4:"=MOD(17,5)",
  H1:"=CONCAT(\"MZ\",\" Tools\")", H2:"=LEN(\"hello\")", H3:"=LEFT(\"abcdef\",3)", H4:"=RIGHT(\"abcdef\",2)", H5:"=MID(\"abcdef\",2,3)",
  I1:"=TODAY()", I2:"=NOW()",
}};
assert.equal(computeCell(sheet,"B1"),60);
assert.equal(computeCell(sheet,"B2"),20);
assert.equal(computeCell(sheet,"B3"),10);
assert.equal(computeCell(sheet,"B4"),30);
assert.equal(computeCell(sheet,"C1"),3);
assert.equal(computeCell(sheet,"C2"),3);
assert.equal(computeCell(sheet,"C3"),20);
assert.equal(computeCell(sheet,"C4"),"yes");
assert.equal(computeCell(sheet,"D1"),30);
assert.equal(computeCell(sheet,"D2"),2);
assert.equal(computeCell(sheet,"D3"),"#DIV/0!");
assert.equal(computeCell(sheet,"E1"),"#CYCLE!");
assert.equal(computeCell(sheet,"F1"),"#NAME?");
assert.equal(computeCell(sheet,"G1"),2.35);
assert.equal(computeCell(sheet,"G2"),2.34);
assert.equal(computeCell(sheet,"G3"),12);
assert.equal(computeCell(sheet,"G4"),2);
assert.equal(computeCell(sheet,"H1"),"MZ Tools");
assert.equal(computeCell(sheet,"H2"),5);
assert.equal(computeCell(sheet,"H3"),"abc");
assert.equal(computeCell(sheet,"H4"),"ef");
assert.equal(computeCell(sheet,"H5"),"bcd");
assert.match(String(computeCell(sheet,"I1")),/^\d{4}-\d{2}-\d{2}$/);
assert.match(String(computeCell(sheet,"I2")),/^\d{4}-\d{2}-\d{2}T/);

console.log("Spreadsheet formula regression checks passed.");
