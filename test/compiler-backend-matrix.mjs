/**
 * Deployment test matrix for the separate MZ compiler service.
 *
 * Run only against a disposable/test deployment:
 *   MZ_COMPILER_TEST_URL=https://compiler.example.com node test/compiler-backend-matrix.mjs
 *
 * The service advertises only languages the operator explicitly enabled after
 * installing/pinning their runtime images. This test never turns a language on.
 */
import assert from "node:assert/strict";

const base = String(process.env.MZ_COMPILER_TEST_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("MZ_COMPILER_TEST_URL is required. No compiler execution tests were run.");
  process.exit(2);
}

const cases = {
  c: {
    io: '#include <stdio.h>\nint main(){int a,b;if(scanf("%d %d",&a,&b)!=2)return 2;printf("%d\\n",a+b);return 0;}',
    syntax: '#include <stdio.h>\nint main( { return 0; }',
    timeout: 'int main(){for(;;){}return 0;}',
  },
  cpp: {
    io: '#include <iostream>\nusing namespace std; int main(){int a,b;cin>>a>>b;cout<<a+b<<"\\n";}',
    syntax: '#include <iostream>\nint main( { std::cout << "x"; }',
    timeout: 'int main(){for(;;){}return 0;}',
  },
  python: {
    io: 'a,b=map(int,input().split())\nprint(a+b)',
    syntax: 'def broken(:\n  pass',
    timeout: 'while True:\n    pass',
  },
  java: {
    io: 'import java.util.*; class Main{public static void main(String[]a){Scanner s=new Scanner(System.in);System.out.println(s.nextInt()+s.nextInt());}}',
    syntax: 'class Main { public static void main(String[] a) { System.out.println("x") } }',
    timeout: 'class Main{public static void main(String[]a){while(true){}}}',
  },
  javascript: {
    io: 'const fs=require("fs");const [a,b]=fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);console.log(a+b);',
    syntax: 'console.log(',
    timeout: 'while(true){}',
  },
  typescript: {
    io: 'const text = await new Response(Deno.stdin.readable).text(); const [a,b]=text.trim().split(/\\s+/).map(Number); console.log(a+b);',
    syntax: 'const value: = 5;',
    timeout: 'while(true){}',
  },
  go: {
    io: 'package main\nimport "fmt"\nfunc main(){var a,b int;fmt.Scan(&a,&b);fmt.Println(a+b)}',
    syntax: 'package main\nfunc main( {',
    timeout: 'package main\nfunc main(){for{}}',
  },
  rust: {
    io: 'use std::io::{self,Read};fn main(){let mut s=String::new();io::stdin().read_to_string(&mut s).unwrap();let v:Vec<i32>=s.split_whitespace().map(|x|x.parse().unwrap()).collect();println!("{}",v[0]+v[1]);}',
    syntax: 'fn main( { println!("x"); }',
    timeout: 'fn main(){loop{}}',
  },
  php: {
    io: '<?php $p=preg_split("/\\s+/",trim(stream_get_contents(STDIN))); echo intval($p[0])+intval($p[1]),"\\n";',
    syntax: '<?php function broken( {',
    timeout: '<?php while(true){}',
  },
  ruby: {
    io: 'a,b=STDIN.read.split.map(&:to_i); puts a+b',
    syntax: 'def broken(',
    timeout: 'loop do end',
  },
  kotlin: {
    io: 'fun main(){val p=readLine()!!.trim().split(" ").map{it.toInt()};println(p[0]+p[1])}',
    syntax: 'fun main( { println("x") }',
    timeout: 'fun main(){while(true){}}',
  },
  swift: {
    io: 'if let line=readLine(){let p=line.split(separator:" ").compactMap{Int($0)};print(p[0]+p[1])}',
    syntax: 'func broken( {',
    timeout: 'while true {}',
  },
  dart: {
    io: "import 'dart:io';void main(){final p=stdin.readLineSync()!.split(' ').map(int.parse).toList();print(p[0]+p[1]);}",
    syntax: 'void main( {',
    timeout: 'void main(){while(true){}}',
  },
  csharp: {
    io: 'using System;class Program{static void Main(){var p=Console.ReadLine()!.Split();Console.WriteLine(int.Parse(p[0])+int.Parse(p[1]));}}',
    syntax: 'class Program { static void Main( { }',
    timeout: 'class Program{static void Main(){while(true){}}}',
  },
};

async function execute(language, source, stdin = "", timeoutMs = 3500) {
  const response = await fetch(`${base}/execute`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ language, source, stdin, limits: { timeoutMs } }),
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

const statusResponse = await fetch(`${base}/status`, { headers:{accept:"application/json"} });
assert.equal(statusResponse.status, 200, "Compiler status endpoint must be reachable");
const status = await statusResponse.json();
assert.ok(Array.isArray(status.languages), "Compiler /status must return languages[]");
assert.equal(status.isolation?.network, "disabled", "Network must be disabled inside execution containers");
assert.equal(status.isolation?.rootFilesystem, "read-only", "Container root filesystem must be read-only");

if (!status.languages.length) {
  console.error("Compiler service advertises no enabled languages; no execution matrix was run.");
  process.exit(3);
}

const results = [];
for (const language of status.languages) {
  const sample = cases[language];
  assert.ok(sample, `No deployment test case exists for advertised language ${language}`);

  const io = await execute(language, sample.io, "5 7\n");
  assert.equal(io.response.status, 200, `${language}: input/output request failed`);
  assert.equal(io.payload.exitCode, 0, `${language}: input/output exit code`);
  assert.match(String(io.payload.stdout || ""), /(^|\s)12(\s|$)/, `${language}: expected real output 12`);

  const syntax = await execute(language, sample.syntax);
  assert.equal(syntax.response.status, 200, `${language}: syntax-error request failed`);
  assert.notEqual(syntax.payload.exitCode, 0, `${language}: invalid code must fail`);
  assert.ok(String(syntax.payload.stderr || "").trim(), `${language}: invalid code must return real compiler/runtime stderr`);

  const timeout = await execute(language, sample.timeout, "", 900);
  assert.equal(timeout.response.status, 200, `${language}: timeout request failed`);
  assert.notEqual(timeout.payload.exitCode, 0, `${language}: infinite loop must be stopped`);
  assert.ok(timeout.payload.timedOut || /timed out/i.test(String(timeout.payload.stderr || "")), `${language}: timeout must be reported`);

  const largeSource = `${sample.io}\n${"// safe source-size padding\n".repeat(3000)}`;
  const large = await execute(language, largeSource, "5 7\n");
  assert.ok([200,413].includes(large.response.status), `${language}: large source must either run inside configured limit or be rejected explicitly`);

  results.push({ language, io:"PASS", syntax:"PASS", timeout:"PASS", largeSource:large.response.status===200?"PASS":"LIMITED" });
  console.log(`${language}: I/O PASS · syntax error PASS · timeout PASS · large source ${results.at(-1).largeSource}`);
}

console.log(`Compiler deployment matrix passed for ${results.length} advertised language(s).`);
