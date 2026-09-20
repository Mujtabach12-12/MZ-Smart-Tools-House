import assert from "node:assert/strict";
import fs from "node:fs";
import { detectDocumentBoundary, detectDocumentCorners, orderCorners, validateDocumentCorners } from "../src/lib/scanner/detectDocument.js";
function fixture(poly,bg=30,paper=235){const w=200,h=200,data=new Uint8ClampedArray(w*h*4);const inside=(x,y)=>{let sign=0;for(let i=0;i<4;i++){const a=poly[i],b=poly[(i+1)%4],cross=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(cross&&sign&&Math.sign(cross)!==sign)return false;if(cross)sign=Math.sign(cross);}return true;};for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=inside(x,y)?paper:bg,i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}return data;}
const cases=[["normal",[[35,25],[165,25],[165,175],[35,175]]],["rotated",[[55,15],[180,45],[145,185],[20,150]]],["tilted",[[30,30],[170,22],[178,176],[24,184]]],["perspective",[[55,18],[155,35],[185,180],[18,165]]],["near edge",[[5,8],[190,15],[185,190],[8,180]]],["small",[[65,60],[140,55],[145,145],[60,150]]],["large",[[12,10],[188,12],[190,190],[10,188]]]];
for(const[name,poly]of cases){const analysis=detectDocumentBoundary(fixture(poly),200,200);assert.ok(analysis,`${name}: detection failed`);assert.equal(analysis.corners.length,4);assert.ok(analysis.confidence>=0.38&&analysis.confidence<=1,`${name}: invalid confidence score`);const averageError=analysis.corners.reduce((sum,p,i)=>sum+Math.hypot(p[0]-poly[i][0],p[1]-poly[i][1]),0)/4;assert.ok(averageError<18,`${name}: detected corners drifted too far (${averageError.toFixed(1)}px)`);}
assert.ok(detectDocumentCorners(fixture(cases[0][1],5,250),200,200),"bright document");
assert.ok(detectDocumentCorners(fixture(cases[0][1],220,35),200,200),"dark document");
assert.equal(detectDocumentBoundary(new Uint8ClampedArray(200*200*4).fill(128),200,200),null,"blank image should fail gracefully");
const scrambled=[[180,180],[20,20],[180,20],[20,180]];
assert.deepEqual(orderCorners(scrambled),[[20,20],[180,20],[180,180],[20,180]],"manual corners should be normalized into TL/TR/BR/BL order");
assert.ok(validateDocumentCorners(scrambled,200,200),"valid manual crop should be accepted");
assert.equal(validateDocumentCorners([[10,10],[11,10],[11,11],[10,11]],200,200),null,"tiny manual crop should be rejected");
assert.equal(validateDocumentCorners([[10,10],[10,10],[190,190],[10,190]],200,200),null,"duplicate/crossed manual handles should be rejected");

const scannerSource=fs.readFileSync(new URL("../src/tools/scanner/SmartDocumentScanner.jsx",import.meta.url),"utf8");
assert.ok(scannerSource.includes("const handle = e.currentTarget"),"crop drag must capture the handle before the async pointer-move callback");
assert.ok(!scannerSource.includes("e.currentTarget.parentElement.parentElement"),"crop drag must not read a cleared React currentTarget");
assert.ok(scannerSource.includes("willReadFrequently: true"),"scanner readback canvases should be optimized for repeated pixel access");
assert.ok(scannerSource.includes("sourceData || pages[selected].data"),"manual crop preview must use the original source image coordinate space");
assert.ok(scannerSource.includes("touch-none"),"manual crop handles should be touch-friendly");
assert.ok(scannerSource.includes("cropZoom") && scannerSource.includes("Zoom in") && scannerSource.includes("Zoom out"),"manual crop should provide explicit zoom controls");

assert.ok(scannerSource.includes('[mode, setMode] = useState("original")'),"scanner must preserve the original appearance by default");
for (const preset of ['["auto", "Auto"]','["light", "Light"]','["sharpen", "Sharpen"]']) assert.ok(scannerSource.includes(preset),`scanner missing enhancement preset ${preset}`);
assert.ok(scannerSource.includes("Before / After") && scannerSource.includes("original photo"),"scanner should offer a truthful before/after comparison");
assert.ok(scannerSource.includes("withPageHistory") && scannerSource.includes("undoPage") && scannerSource.includes("redoPage"),"scanner edits should support page-level undo/redo");
assert.ok(scannerSource.includes("PDF page size") && scannerSource.includes("US Letter") && scannerSource.includes("PDF margins"),"scanner PDF export should expose page size and margins");
console.log("Scanner detection and crop-drag regression tests passed.");
