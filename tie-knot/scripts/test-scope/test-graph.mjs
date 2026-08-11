import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { globSync } from "glob";
import { isTestFile, normalizePath } from "../tdd-guard/core/classify-file.mjs";
import { shouldGuard } from "../tdd-guard/core/policy.mjs";

const TEST_PATTERNS = [
  "src/**/*.test.{ts,tsx}",
  "tests/integration/**/*.{test,spec}.{ts,tsx}",
  "scripts/**/*.test.mjs",
];
const CODE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"]);

function compilerOptions(root) {
  const configFile = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (configFile) {
    const config = ts.readConfigFile(configFile, ts.sys.readFile);
    if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
    return ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  }
  return {
    allowJs: true,
    baseUrl: root,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    paths: { "@/*": ["src/*"] },
  };
}

function runtimeSpecifiers(source, file) {
  const kind = file.endsWith("x") ? ts.ScriptKind.TSX : file.endsWith(".mjs") ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const specifiers = [];
  const add = (node) => {
    if (node && ts.isStringLiteralLike(node)) specifiers.push(node.text);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      const bindings = node.importClause?.namedBindings;
      const onlyNamedTypes = bindings && ts.isNamedImports(bindings) && bindings.elements.length > 0
        && bindings.elements.every((element) => element.isTypeOnly);
      if (!node.importClause?.isTypeOnly && !onlyNamedTypes) add(node.moduleSpecifier);
    } else if (ts.isExportDeclaration(node) && !node.isTypeOnly) {
      add(node.moduleSpecifier);
    } else if (ts.isImportEqualsDeclaration(node) && !node.isTypeOnly && ts.isExternalModuleReference(node.moduleReference)) {
      add(node.moduleReference.expression);
    } else if (ts.isCallExpression(node) && node.arguments.length === 1) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) add(node.arguments[0]);
      if (ts.isIdentifier(node.expression) && node.expression.text === "require") add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return specifiers;
}

function relative(root, absolute) {
  return normalizePath(path.relative(root, absolute));
}

function resolveSpecifier(root, importer, specifier, options) {
  const local = specifier.startsWith(".") || specifier.startsWith("@/");
  if (!local) return null;
  const resolved = ts.resolveModuleName(specifier, path.join(root, importer), options, ts.sys).resolvedModule?.resolvedFileName;
  let absolute = resolved && path.resolve(resolved);
  if (!absolute) {
    const base = specifier.startsWith("@/")
      ? path.join(root, "src", specifier.slice(2))
      : path.resolve(root, path.dirname(importer), specifier);
    absolute = [base, ...[".ts", ".tsx", ".js", ".mjs", ".json", "/index.ts", "/index.tsx", "/index.js", "/index.mjs"].map((suffix) => `${base}${suffix}`)]
      .find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  }
  if (!absolute) throw new Error(`unresolved local import: ${importer} -> ${specifier}`);
  if (!absolute.startsWith(`${path.resolve(root)}${path.sep}`)) return null;
  return CODE_EXTENSIONS.has(path.extname(absolute)) ? relative(root, absolute) : null;
}

export function buildTestGraph(root = process.cwd()) {
  const options = compilerOptions(root);
  const tests = [...new Set(globSync(TEST_PATTERNS, { cwd: root, nodir: true }))].sort();
  const bySource = new Map();
  const byTest = new Map();

  for (const test of tests) {
    const pending = [test];
    const seen = new Set();
    const sources = new Set();
    while (pending.length) {
      const file = pending.pop();
      if (!file || seen.has(file)) continue;
      seen.add(file);
      const absolute = path.join(root, file);
      if (!fs.existsSync(absolute)) continue;
      const source = fs.readFileSync(absolute, "utf8");
      for (const specifier of runtimeSpecifiers(source, file)) {
        const dependency = resolveSpecifier(root, file, specifier, options);
        if (!dependency || seen.has(dependency)) continue;
        pending.push(dependency);
        if (!isTestFile(dependency) && shouldGuard(root, dependency)) sources.add(dependency);
      }
    }
    const connected = [...sources].sort();
    byTest.set(test, connected);
    for (const source of connected) {
      const related = bySource.get(source) ?? [];
      related.push(test);
      bySource.set(source, related);
    }
  }

  const sources = [...bySource.keys()].sort();
  for (const source of sources) bySource.set(source, [...new Set(bySource.get(source))].sort());
  return {
    tests,
    sources,
    testsFor: (source) => bySource.get(normalizePath(source)) ?? [],
    sourcesFor: (test) => byTest.get(normalizePath(test)) ?? [],
  };
}
