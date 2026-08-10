import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "./classify-file.mjs";

export function classifyScope(file) {
  const normalized = normalizePath(file);
  if (/^e2e\/.*\.spec\.[jt]s$/.test(normalized)) return "e2e";
  if (/\.integration\.test\.[jt]sx?$/.test(normalized) || normalized.startsWith("tests/integration/")) {
    return "integration";
  }
  return "unit";
}

const INTEGRATION_BOUNDARIES = [
  { pattern: /(?:from\s+|import\s*)["'](?:mongoose|mongodb)["']|mongodb-memory-server/, reason: "Mongoose/MongoDB 실행 경계 변경" },
  { pattern: /["']use server["']|(?:from\s+|import\s*)["']next\/server["']/, reason: "Server Action 또는 Route Handler 실행 경계 변경" },
  { pattern: /(?:from\s+|import\s*)["'](?:swr|msw)["']|\bfetch\s*\(/, reason: "실제 client HTTP 경계 변경" },
  { pattern: /(?:from\s+|import\s*)["'](?:cloudinary|@portone\/)[^"']*["']/, reason: "외부 서비스 adapter 경계 변경" },
];

function localDependencies(root, file) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) return [];
  const source = fs.readFileSync(absolute, "utf8");
  const dependencies = [];
  for (const match of source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)) {
    const specifier = match[1];
    let candidate;
    if (specifier.startsWith("@/")) candidate = `src/${specifier.slice(2)}`;
    else if (specifier.startsWith(".")) candidate = normalizePath(path.join(path.dirname(file), specifier));
    if (!candidate) continue;
    for (const suffix of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
      const resolved = `${candidate}${suffix}`;
      const absolute = path.join(root, resolved);
      if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) { dependencies.push(resolved); break; }
    }
  }
  return dependencies;
}

export function requiredScopePolicy(files, root = process.cwd()) {
  const scopes = new Set();
  const reasons = {};
  const pending = files.map(normalizePath);
  const seen = new Set();
  for (const file of files) {
    if (/\.[cm]?[jt]sx?$/.test(file)) {
      scopes.add("unit");
      reasons.unit ??= "변경된 공개 계약을 격리해 검증";
    }
  }
  while (pending.length) {
    const file = pending.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    const source = fs.readFileSync(absolute, "utf8");
    const boundary = INTEGRATION_BOUNDARIES.find(({ pattern }) => pattern.test(source));
    if (boundary) {
      scopes.add("integration");
      reasons.integration ??= boundary.reason;
    }
    pending.push(...localDependencies(root, file));
  }
  return { requiredScopes: [...scopes].sort(), reasons };
}

export function requiredScopes(files, root = process.cwd()) {
  return requiredScopePolicy(files, root).requiredScopes;
}
