import http from "node:http";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const PORT = integerEnv("PORT", 8787, 1, 65535);
const MAX_SOURCE_BYTES = integerEnv("MZ_MAX_SOURCE_BYTES", 1_048_576, 1_024, 5_242_880);
const MAX_STDIN_BYTES = integerEnv("MZ_MAX_STDIN_BYTES", 262_144, 0, 1_048_576);
const MAX_OUTPUT_BYTES = integerEnv("MZ_MAX_OUTPUT_BYTES", 1_048_576, 1_024, 5_242_880);
const DEFAULT_TIMEOUT_MS = integerEnv("MZ_DEFAULT_TIMEOUT_MS", 5_000, 500, 20_000);
const MAX_TIMEOUT_MS = integerEnv("MZ_MAX_TIMEOUT_MS", 10_000, DEFAULT_TIMEOUT_MS, 30_000);
const CONCURRENCY = integerEnv("MZ_COMPILER_CONCURRENCY", 2, 1, 8);
const MAX_QUEUE = integerEnv("MZ_COMPILER_MAX_QUEUE", 24, 0, 200);
const MEMORY_MB = integerEnv("MZ_COMPILER_MEMORY_MB", 256, 64, 1024);
const CPUS = numericEnv("MZ_COMPILER_CPUS", 0.75, 0.1, 2);
const PIDS_LIMIT = integerEnv("MZ_COMPILER_PIDS", 64, 16, 256);
const ALLOWED_ORIGINS = new Set(splitEnv("MZ_ALLOWED_ORIGINS"));
const ENABLED_LANGUAGES = new Set(splitEnv("MZ_COMPILER_LANGUAGES"));

// Images are configurable so a deployment can pin digests/tags it has actually tested.
// Merely having a definition here does NOT make a language "supported". A language
// only appears from /status after it is explicitly enabled with MZ_COMPILER_LANGUAGES.
const DEFAULT_LANGUAGE_CONFIG = Object.freeze({
  c: { image: "gcc:14", file: "main.c", command: "gcc -O2 -std=c17 main.c -o app && ./app" },
  cpp: { image: "gcc:14", file: "main.cpp", command: "g++ -O2 -std=c++20 main.cpp -o app && ./app" },
  python: { image: "python:3.13-alpine", file: "main.py", command: "python main.py" },
  java: { image: "eclipse-temurin:21-jdk", file: "Main.java", command: "javac Main.java && java Main" },
  javascript: { image: "node:22-alpine", file: "main.js", command: "node main.js" },
  typescript: { image: "denoland/deno:alpine", file: "main.ts", command: "deno run --no-prompt main.ts" },
  go: { image: "golang:1.24-alpine", file: "main.go", command: "go run main.go" },
  rust: { image: "rust:1.87-alpine", file: "main.rs", command: "rustc -O main.rs -o app && ./app" },
  php: { image: "php:8.4-cli-alpine", file: "main.php", command: "php main.php" },
  ruby: { image: "ruby:3.4-alpine", file: "main.rb", command: "ruby main.rb" },
  kotlin: { image: "mz-kotlin-runner:local", file: "Main.kt", command: "kotlinc Main.kt -include-runtime -d main.jar && java -jar main.jar" },
  swift: { image: "mz-swift-runner:local", file: "main.swift", command: "swift main.swift" },
  dart: { image: "mz-dart-runner:local", file: "main.dart", command: "dart run main.dart" },
  csharp: { image: "mz-dotnet-runner:local", file: "Program.cs", command: "dotnet run --project /workspace --no-restore" },
});

const languageConfig = loadLanguageConfig();
const queue = [];
let running = 0;

function integerEnv(name, fallback, min, max) {
  const value = Number.parseInt(process.env[name] || "", 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}
function numericEnv(name, fallback, min, max) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}
function splitEnv(name) {
  return String(process.env[name] || "").split(",").map((value) => value.trim()).filter(Boolean);
}
function loadLanguageConfig() {
  const overrideRaw = process.env.MZ_COMPILER_CONFIG_JSON;
  if (!overrideRaw) return DEFAULT_LANGUAGE_CONFIG;
  let override;
  try { override = JSON.parse(overrideRaw); }
  catch { throw new Error("MZ_COMPILER_CONFIG_JSON must be valid JSON."); }
  const merged = { ...DEFAULT_LANGUAGE_CONFIG };
  for (const [language, config] of Object.entries(override || {})) {
    if (!config || typeof config !== "object") continue;
    merged[language] = { ...(merged[language] || {}), ...config };
  }
  return Object.freeze(merged);
}
function enabledLanguages() {
  return [...ENABLED_LANGUAGES].filter((id) => languageConfig[id]?.image && languageConfig[id]?.file && languageConfig[id]?.command).sort();
}
function json(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), ...extraHeaders });
  res.end(body);
}
function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin) return {};
  if (ALLOWED_ORIGINS.has("*") || ALLOWED_ORIGINS.has(origin)) {
    return { "access-control-allow-origin": origin, "vary": "Origin", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,accept" };
  }
  return {};
}
function acceptsOrigin(req) {
  const origin = req.headers.origin;
  return !origin || ALLOWED_ORIGINS.has("*") || ALLOWED_ORIGINS.has(origin);
}
async function readJson(req) {
  const chunks = [];
  let bytes = 0;
  const limit = MAX_SOURCE_BYTES + MAX_STDIN_BYTES + 65_536;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > limit) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
  catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}
function validateExecution(payload) {
  const language = String(payload?.language || "").trim().toLowerCase();
  const source = String(payload?.source ?? "");
  const stdin = String(payload?.stdin ?? "");
  if (!languageConfig[language]) return { error: [400, "Unknown language."] };
  if (!ENABLED_LANGUAGES.has(language)) return { error: [501, "Execution backend is not enabled for this language."] };
  if (!source.trim()) return { error: [400, "Source code is required."] };
  if (Buffer.byteLength(source) > MAX_SOURCE_BYTES) return { error: [413, `Source exceeds the ${MAX_SOURCE_BYTES} byte limit.`] };
  if (Buffer.byteLength(stdin) > MAX_STDIN_BYTES) return { error: [413, `Input exceeds the ${MAX_STDIN_BYTES} byte limit.`] };
  const requestedTimeout = Number(payload?.limits?.timeoutMs);
  const timeoutMs = Number.isFinite(requestedTimeout) ? Math.max(500, Math.min(MAX_TIMEOUT_MS, Math.round(requestedTimeout))) : DEFAULT_TIMEOUT_MS;
  return { language, source, stdin, timeoutMs };
}
function enqueue(job) {
  if (running >= CONCURRENCY && queue.length >= MAX_QUEUE) {
    const error = new Error("Compiler queue is full. Try again shortly.");
    error.status = 503;
    return Promise.reject(error);
  }
  return new Promise((resolve, reject) => {
    queue.push({ job, resolve, reject });
    pumpQueue();
  });
}
function pumpQueue() {
  while (running < CONCURRENCY && queue.length) {
    const item = queue.shift();
    running += 1;
    runInSandbox(item.job).then(item.resolve, item.reject).finally(() => { running -= 1; pumpQueue(); });
  }
}

async function runInSandbox({ language, source, stdin, timeoutMs }) {
  const config = languageConfig[language];
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "mz-compiler-"));
  const containerName = `mz-run-${randomUUID().replaceAll("-", "")}`;
  const sourcePath = path.join(workspace, config.file);
  const started = performance.now();
  try {
    await fs.chmod(workspace, 0o777);
    await fs.writeFile(sourcePath, source, { encoding: "utf8", mode: 0o644 });

    // C# needs a minimal project file. It is generated by the service, never by user input.
    if (language === "csharp") {
      await fs.writeFile(path.join(workspace, "MZRunner.csproj"), "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>enable</Nullable></PropertyGroup></Project>", { mode: 0o644 });
    }

    const dockerArgs = [
      "run", "--rm", "--name", containerName,
      "--network", "none",
      "--memory", `${MEMORY_MB}m`, "--memory-swap", `${MEMORY_MB}m`,
      "--cpus", String(CPUS), "--pids-limit", String(PIDS_LIMIT),
      "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
      "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m",
      "--ulimit", "nofile=64:64",
      "--user", "65534:65534",
      "-v", `${workspace}:/workspace:rw`, "-w", "/workspace",
      config.image, "sh", "-lc", config.command,
    ];
    const execution = await spawnLimited("docker", dockerArgs, { stdin, timeoutMs, containerName });
    return { ...execution, durationMs: Math.round(performance.now() - started), language };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true }).catch(() => {});
  }
}

function spawnLimited(command, args, { stdin, timeoutMs, containerName }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let settled = false;
    let outputExceeded = false;
    const append = (current, chunk) => {
      const room = MAX_OUTPUT_BYTES - current.length;
      if (room <= 0) return current;
      return Buffer.concat([current, chunk.subarray(0, room)]);
    };
    const killContainer = () => {
      const killer = spawn("docker", ["kill", containerName], { stdio: "ignore", windowsHide: true });
      killer.unref();
    };
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const timer = setTimeout(() => {
      killContainer();
      finish(resolve, { stdout: stdout.toString("utf8"), stderr: `${stderr.toString("utf8")}\nExecution timed out after ${timeoutMs} ms.`.trim(), exitCode: 124, timedOut: true });
    }, timeoutMs);

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        const wrapped = new Error("Docker CLI is not installed or not available to the compiler service.");
        wrapped.status = 503;
        finish(reject, wrapped);
      } else finish(reject, error);
    });
    child.stdout.on("data", (chunk) => {
      stdout = append(stdout, chunk);
      if (stdout.length + stderr.length >= MAX_OUTPUT_BYTES && !outputExceeded) {
        outputExceeded = true;
        killContainer();
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr = append(stderr, chunk);
      if (stdout.length + stderr.length >= MAX_OUTPUT_BYTES && !outputExceeded) {
        outputExceeded = true;
        killContainer();
      }
    });
    child.on("close", (code, signal) => {
      const suffix = outputExceeded ? "\nOutput limit exceeded; execution was stopped." : "";
      finish(resolve, { stdout: stdout.toString("utf8"), stderr: `${stderr.toString("utf8")}${suffix}`.trim(), exitCode: Number.isInteger(code) ? code : 1, signal: signal || null, outputLimited: outputExceeded });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(stdin);
  });
}

export function createCompilerServer() {
  return http.createServer(async (req, res) => {
    const cors = corsHeaders(req);
    if (req.method === "OPTIONS") {
      if (!acceptsOrigin(req)) return json(res, 403, { message: "Origin is not allowed." });
      res.writeHead(204, cors); res.end(); return;
    }
    if (!acceptsOrigin(req)) return json(res, 403, { message: "Origin is not allowed." });
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/status")) {
      const payload = {
        ok: true,
        service: "mz-compiler-service",
        languages: enabledLanguages(),
        queue: { running, queued: queue.length, concurrency: CONCURRENCY, maxQueue: MAX_QUEUE },
        limits: { sourceBytes: MAX_SOURCE_BYTES, stdinBytes: MAX_STDIN_BYTES, outputBytes: MAX_OUTPUT_BYTES, defaultTimeoutMs: DEFAULT_TIMEOUT_MS, maxTimeoutMs: MAX_TIMEOUT_MS, memoryMb: MEMORY_MB, cpus: CPUS, pids: PIDS_LIMIT },
        isolation: { network: "disabled", rootFilesystem: "read-only", capabilityDrop: "all", noNewPrivileges: true, temporaryWorkspace: true },
      };
      return json(res, 200, payload, cors);
    }
    if (req.method === "POST" && url.pathname === "/execute") {
      try {
        const payload = await readJson(req);
        const validated = validateExecution(payload);
        if (validated.error) return json(res, validated.error[0], { message: validated.error[1] }, cors);
        const result = await enqueue(validated);
        return json(res, 200, result, cors);
      } catch (error) {
        return json(res, error?.status || 500, { message: error?.message || "Compiler execution failed." }, cors);
      }
    }
    return json(res, 404, { message: "Not found." }, cors);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const server = createCompilerServer();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`MZ compiler service listening on :${PORT}; enabled languages: ${enabledLanguages().join(", ") || "none"}`);
  });
}
