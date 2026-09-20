/**
 * Whole-app static integrity check.
 *
 * esbuild is not installable in the offline sandbox this project is developed
 * in, so this script does the same job with Node + the TypeScript parser that
 * ships with the toolchain:
 *
 *   1. Parses EVERY .js/.jsx file under src/ and scripts/ (JSX-aware) and
 *      reports syntax errors.
 *   2. Extracts every import/export specifier and resolves relative ones
 *      against the filesystem, exactly like Vite would (extensionless,
 *      .js/.jsx, /index.*). Unresolvable imports are hard failures — this is
 *      the class of bug that bit Phase 3.
 *   3. Checks bare specifiers against package.json dependencies.
 *   4. Walks the module graph from src/main.jsx and reports files that are
 *      never reached (dead code) as warnings.
 *   5. Verifies named imports actually exist as exports in the target module.
 *   6. Verifies registry integrity: every "active" tool has a component, every
 *      component maps to a real tool, and every icon name resolves.
 *
 * Run with: node test/bundle-check.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, resolve, relative, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Prefer the project dependency. The fallback is derived from the active Node
// executable (rather than a hard-coded version path) so the audit can still run
// in constrained/offline environments that expose TypeScript globally.
let ts;
try {
  ts = (await import("typescript")).default;
} catch {
  const derived = resolve(dirname(process.execPath), "..", "lib", "node_modules", "typescript", "lib", "typescript.js");
  if (!existsSync(derived)) throw new Error("TypeScript parser is unavailable. Run npm install before the whole-app bundle audit.");
  ts = (await import(pathToFileURL(derived).href)).default;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = join(ROOT, "src");

const errors = [];
const warnings = [];

/* ------------------------------------------------------------ file walk */

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if ([".js", ".jsx", ".mjs"].includes(extname(entry))) files.push(full);
  }
  return files;
}

const files = [...walk(SRC), ...walk(join(ROOT, "scripts"))];
const rel = (p) => relative(ROOT, p);

/* --------------------------------------------------- parse + collect imports */

const EXTENSIONS = [".js", ".jsx", ".mjs", ".ts", ".tsx"];

function resolveRelative(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of EXTENSIONS) {
    if (existsSync(base + ext)) return base + ext;
  }
  for (const ext of EXTENSIONS) {
    const indexFile = join(base, `index${ext}`);
    if (existsSync(indexFile)) return indexFile;
  }
  return null;
}

const modules = new Map(); // absolute path -> { imports: [{ spec, names, resolved }], exports: Set }

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const kind = file.endsWith(".jsx") ? ts.ScriptKind.JSX : ts.ScriptKind.JS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, kind);

  for (const diagnostic of source.parseDiagnostics || []) {
    const { line, character } = source.getLineAndCharacterOfPosition(diagnostic.start || 0);
    errors.push(
      `SYNTAX  ${rel(file)}:${line + 1}:${character + 1}  ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`
    );
  }

  const imports = [];
  const exportNames = new Set();

  const visit = (node) => {
    // import ... from "x"
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const names = [];
      const clause = node.importClause;
      if (clause?.name) names.push("default");
      if (clause?.namedBindings) {
        if (ts.isNamedImports(clause.namedBindings)) {
          for (const el of clause.namedBindings.elements) {
            names.push((el.propertyName || el.name).text);
          }
        } else {
          names.push("*");
        }
      }
      imports.push({ spec: node.moduleSpecifier.text, names, node });
    }

    // dynamic import("x") — used for code-splitting large libraries
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      imports.push({ spec: node.arguments[0].text, names: ["*"], node, dynamic: true });
    }

    // export ... from "x"
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const names = [];
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          names.push((el.propertyName || el.name).text);
          exportNames.add(el.name.text);
        }
      } else {
        names.push("*");
      }
      imports.push({ spec: node.moduleSpecifier.text, names, node });
    }

    // export declarations defined locally
    if (ts.isExportDeclaration(node) && !node.moduleSpecifier && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const el of node.exportClause.elements) exportNames.add(el.name.text);
    }
    if (ts.isExportAssignment(node)) exportNames.add("default");

    const mods = ts.canHaveModifiers(node) ? ts.getModifiers(node) || [] : [];
    const isExported = mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefault = mods.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (isExported) {
      if (isDefault) exportNames.add("default");
      if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
        if (node.name) exportNames.add(node.name.text);
      }
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) exportNames.add(decl.name.text);
          else if (ts.isObjectBindingPattern(decl.name)) {
            for (const el of decl.name.elements) {
              if (ts.isIdentifier(el.name)) exportNames.add(el.name.text);
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(source, visit);
  modules.set(file, { imports, exports: exportNames, source });
}

/* ------------------------------------------------------- resolve imports */

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const declaredDeps = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
]);
const NODE_BUILTINS = /^node:/;

for (const [file, mod] of modules) {
  for (const imp of mod.imports) {
    const { spec } = imp;

    // Vite query suffixes (?url, ?raw, ?worker) aren't part of the path.
    const cleanSpec = spec.split("?")[0];

    if (cleanSpec.startsWith(".") || cleanSpec.startsWith("/")) {
      const resolved = resolveRelative(file, cleanSpec);
      if (!resolved) {
        errors.push(`IMPORT  ${rel(file)}  cannot resolve "${spec}"`);
        continue;
      }
      imp.resolved = resolved;

      const target = modules.get(resolved);
      if (target) {
        for (const name of imp.names) {
          if (name === "*" || name === "default") continue;
          if (!target.exports.has(name)) {
            errors.push(
              `EXPORT  ${rel(file)}  imports { ${name} } from "${spec}" but ${rel(resolved)} does not export it`
            );
          }
        }
        if (imp.names.includes("default") && !target.exports.has("default")) {
          errors.push(`EXPORT  ${rel(file)}  imports a default from "${spec}" but ${rel(resolved)} has no default export`);
        }
      }
      continue;
    }

    if (NODE_BUILTINS.test(spec)) continue;

    const packageName = cleanSpec.startsWith("@") ? cleanSpec.split("/").slice(0, 2).join("/") : cleanSpec.split("/")[0];
    if (!declaredDeps.has(packageName)) {
      errors.push(`DEPS    ${rel(file)}  imports "${spec}" but "${packageName}" is not in package.json`);
    }
  }
}

/* ------------------------------------------------------ reachability walk */

const entry = join(SRC, "main.jsx");
const reached = new Set();
(function reach(file) {
  if (!file || reached.has(file)) return;
  reached.add(file);
  const mod = modules.get(file);
  if (!mod) return;
  for (const imp of mod.imports) {
    if (imp.resolved) reach(imp.resolved);
  }
})(entry);

for (const file of modules.keys()) {
  if (file.startsWith(join(ROOT, "scripts"))) continue;
  if (!reached.has(file)) warnings.push(`UNUSED  ${rel(file)} is never imported from src/main.jsx`);
}

/* ------------------------------------------------- registry integrity */

const toolsSource = readFileSync(join(SRC, "data/tools.js"), "utf8");
const converterSource = readFileSync(join(SRC, "tools/converters/conversionRegistry.js"), "utf8");
const formulaSource = readFileSync(join(SRC, "tools/science/formulaRegistry.js"), "utf8");
const registryEntries = [...toolsSource.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*?status:\s*"([^"]+)"[^}]*?\}/g)].map(
  (m) => ({ id: m[1], status: m[2] })
);
const existingRegistryIds = new Set(registryEntries.map((entry) => entry.id));
for (const match of converterSource.matchAll(/toolId:"([^"]+)"/g)) {
  if (!existingRegistryIds.has(match[1])) { registryEntries.push({ id: match[1], status: "active" }); existingRegistryIds.add(match[1]); }
}
if (!existingRegistryIds.has("universal-conversion-hub")) registryEntries.push({ id: "universal-conversion-hub", status: "active" });
for (const match of formulaSource.matchAll(/^\s*\['([a-z0-9-]+)'\s*,\s*'[^']+'/gm)) {
  if (!existingRegistryIds.has(match[1])) { registryEntries.push({ id: match[1], status: "active" }); existingRegistryIds.add(match[1]); }
}
const iconNames = [...toolsSource.matchAll(/icon:\s*"([^"]+)"/g)].map((m) => m[1]);

const componentsSource = readFileSync(join(SRC, "tools/index.js"), "utf8");
const mapBody = componentsSource.slice(componentsSource.indexOf("const loaders"));
const mappedIds = [...mapBody.matchAll(/"([a-z0-9-]+)":\s*\(\)\s*=>\s*import\(/g)].map((m) => m[1]);

const registryIds = new Set(registryEntries.map((e) => e.id));
const activeIds = registryEntries.filter((e) => e.status === "active").map((e) => e.id);

for (const id of activeIds) {
  if (!mappedIds.includes(id)) {
    errors.push(`REGISTRY  tool "${id}" is marked active but has no component in src/tools/index.js`);
  }
}
for (const id of mappedIds) {
  if (!registryIds.has(id)) {
    errors.push(`REGISTRY  src/tools/index.js maps "${id}" but no such tool exists in src/data/tools.js`);
  }
  const entry = registryEntries.find((e) => e.id === id);
  if (entry && entry.status !== "active") {
    warnings.push(`REGISTRY  "${id}" has a component but status is "${entry.status}" — it will show "Coming soon"`);
  }
}

const iconSource = readFileSync(join(SRC, "components/ui/ToolIcon.jsx"), "utf8");
const iconMapBody = iconSource.slice(iconSource.indexOf("const ICONS"));
const knownIcons = new Set([...iconMapBody.matchAll(/"?([a-z0-9-]+)"?:\s*[A-Z]/g)].map((m) => m[1]));
for (const icon of new Set(iconNames)) {
  if (!knownIcons.has(icon)) {
    warnings.push(`ICON    "${icon}" is used in the registry but not mapped in ToolIcon.jsx (falls back to HelpCircle)`);
  }
}

/* -------------------------------------------------------------- report */

console.log(`Checked ${modules.size} modules, ${reached.size} reachable from src/main.jsx.`);
console.log(`Registry: ${registryEntries.length} tools, ${activeIds.length} active, ${mappedIds.length} wired to components.`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ${w}`);
}

if (errors.length) {
  console.error(`\n${errors.length} ERROR(S):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exitCode = 1;
} else {
  console.log("\nNo syntax errors, no unresolved imports, no missing exports, registry consistent.");
}
