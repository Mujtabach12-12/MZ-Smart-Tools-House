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
const scannerPipeline=fs.readFileSync(new URL("../src/lib/scanner/qualityPipeline.js",import.meta.url),"utf8");
assert.ok(scannerSource.includes('useState("capture")'),"scanner should start on the capture step");
for (const step of ["STEP 1 OF 4","STEP 2 OF 4","STEP 3 OF 4","STEP 4 OF 4"]) assert.ok(scannerSource.includes(step),`guided scanner missing ${step}`);
assert.ok(scannerSource.includes("Auto crop is ready. Drag any corner directly"),"auto detection must lead directly into editable crop review");
assert.ok(scannerSource.includes("mz-scanner-crop-handle"),"crop handles must be directly draggable without a manual-crop mode button");
assert.ok(scannerSource.includes("Confirm Crop & Continue"),"crop step must explicitly continue to filtering");
assert.ok(scannerSource.includes("Apply Filter & Continue"),"filter step must explicitly continue to export");
assert.ok(scannerSource.includes("Export or add another image"),"export step must offer export or another page");
assert.ok(scannerSource.includes("Add another image") && scannerSource.includes("Scan another page"),"multi-page flow must support another image or camera capture");
assert.ok(scannerSource.includes("previewData"),"filter page must use a live preview");
for (const preset of ['["original", "Original"]','["document", "Document"]','["grayscale", "Grayscale"]','["bw", "Black & White"]','["auto", "Enhanced"]']) assert.ok(scannerSource.includes(preset),`scanner missing enhancement preset ${preset}`);
assert.ok(scannerPipeline.includes('mode === "document"') && scannerPipeline.includes('mode === "grayscale"') && scannerPipeline.includes('mode === "bw"'),"scanner must implement real document/grayscale/B&W enhancement paths");
assert.ok(scannerSource.includes("ImageCapture") && scannerSource.includes("takePhoto"),"scanner should prefer a high-resolution still capture when ImageCapture is supported");
assert.ok(scannerSource.includes("SwitchCamera") && scannerSource.includes("torchSupported"),"scanner camera should expose capability-based camera switching/flash controls");
assert.ok(scannerSource.includes("retakeSelected"),"scanner crop review should allow a real retake without accepting a bad page");
assert.ok(scannerSource.includes("thumbnailUrl") && scannerSource.includes("outputBlob"),"scanner must keep UI thumbnails separate from processed page masters");
assert.ok(scannerSource.includes("draggable") && scannerSource.includes("reorderPage"),"scanner page manager should support direct desktop reordering with touch-friendly fallback controls");
assert.ok(scannerSource.includes("PDF page size") && scannerSource.includes("US Letter") && scannerSource.includes("PDF margins"),"scanner PDF export should expose page size and margins");
assert.ok(scannerSource.includes("Searchable PDF") && scannerSource.includes("OCR Page"),"scanner should retain OCR/searchable PDF export paths");
assert.ok(scannerSource.includes("withPageHistory"),"scanner page changes should continue to preserve history snapshots");
console.log("Scanner detection and guided Capture/Crop/Filter/Export regression tests passed.");
