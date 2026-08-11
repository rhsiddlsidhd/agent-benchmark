import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { globSync } from "glob";

export function resolveTests(root, source) {
  const extension = source.split(".").pop();
  const base = source.replace(/\.[^.]+$/, "");
  const direct = [`${base}.test.${extension}`, `${base}.unit.test.${extension}`, `${base}.integration.test.${extension}`]
    .filter((file) => fs.existsSync(path.join(root, file)));
  if (direct.length) return direct;
  const tracked = execFileSync("git", ["ls-files", "*.test.ts", "*.test.tsx", "*.test.mjs"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const candidates = [...new Set([
    ...tracked,
    ...globSync("**/*.test.{ts,tsx,mjs}", { cwd: root, nodir: true, ignore: ["node_modules/**", ".next/**"] }),
  ])].filter((file) => fs.existsSync(path.join(root, file)));
  return candidates.filter((file) => reachesSource(root, file, source));
}

function existingSource(root, candidate) {
  for (const suffix of ["", ".js", ".ts", ".tsx", ".mjs", "/index.js", "/index.ts", "/index.tsx", "/index.mjs"]) {
    const file = `${candidate}${suffix}`;
    const absolute = path.join(root, file);
    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) return file;
  }
  return null;
}

function localImports(root, file) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const imports = [];
  for (const match of text.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)) {
    const specifier = match[1];
    let candidate;
    if (specifier.startsWith("@/")) candidate = `src/${specifier.slice(2)}`;
    else if (specifier.startsWith(".")) candidate = path.normalize(path.join(path.dirname(file), specifier)).split(path.sep).join("/");
    const resolved = candidate && existingSource(root, candidate);
    if (resolved) imports.push(resolved);
  }
  return imports;
}

function reachesSource(root, test, source) {
  const target = source.split(path.sep).join("/");
  const pending = [test];
  const seen = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (!current || seen.has(current)) continue;
    if (current === target) return true;
    seen.add(current);
    pending.push(...localImports(root, current));
  }
  return false;
}

export function resolveSources(root, tests) {
  const sources = new Set();
  for (const test of tests) {
    const direct = test.replace(/\.(?:unit\.|integration\.)?test\.(ts|tsx)$/, ".$1");
    if (fs.existsSync(path.join(root, direct))) sources.add(direct);
    const text = fs.readFileSync(path.join(root, test), "utf8");
    for (const match of text.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)) {
      const specifier = match[1];
      let candidate;
      if (specifier.startsWith("@/")) candidate = `src/${specifier.slice(2)}`;
      else if (specifier.startsWith(".")) candidate = path.normalize(path.join(path.dirname(test), specifier)).split(path.sep).join("/");
      if (!candidate) continue;
      const resolved = existingSource(root, candidate);
      if (resolved && !/\.(?:unit\.|integration\.)?test\.[jt]sx?$/.test(resolved)) sources.add(resolved);
    }
  }
  return [...sources].sort();
}
