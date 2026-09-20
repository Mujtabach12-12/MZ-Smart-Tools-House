import assert from "node:assert/strict";
import { createCompilerServer } from "../compiler-service/server.mjs";

const server = createCompilerServer();
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;
try {
  const statusResponse = await fetch(`${base}/status`);
  assert.equal(statusResponse.status,200);
  const status = await statusResponse.json();
  assert.equal(status.ok,true);
  assert.deepEqual(status.languages,[],"No native language should be advertised until explicitly enabled/tested");
  assert.equal(status.isolation.network,"disabled");
  assert.equal(status.isolation.rootFilesystem,"read-only");

  const disabled = await fetch(`${base}/execute`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({language:"cpp",source:"int main(){}"})});
  assert.equal(disabled.status,501,"Disabled C++ must not execute or pretend to execute");
  const disabledBody = await disabled.json();
  assert.match(disabledBody.message,/not enabled/i);

  const empty = await fetch(`${base}/execute`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({language:"unknown",source:"x"})});
  assert.equal(empty.status,400);
} finally {
  await new Promise((resolve)=>server.close(resolve));
}
console.log("Compiler service API/security-gate regression checks passed (container execution intentionally not exercised here).");
