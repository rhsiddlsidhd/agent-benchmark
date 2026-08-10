import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

export function head(root) {
  return git(root, ["rev-parse", "HEAD"]).trim();
}

export function changedFiles(root) {
  const top = git(root, ["rev-parse", "--show-toplevel"]).trim();
  const prefix = path.relative(top, root).split(path.sep).join("/");
  return git(root, ["status", "--porcelain=v1", "--untracked-files=all", "-z", "--", "."])
    .split("\0")
    .filter(Boolean)
    .map((line) => line.slice(3))
    .map((file) => prefix && file.startsWith(`${prefix}/`) ? file.slice(prefix.length + 1) : file);
}

export function diffHash(root, files) {
  const chunks = [];
  for (const file of [...files].sort()) {
    let content = "<deleted>";
    try { content = fs.readFileSync(new URL(`file://${root}/${file}`)); } catch {}
    chunks.push(file, "\0", content, "\0");
  }
  return sha256(Buffer.concat(chunks.map((chunk) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))));
}

export function configHash(root) {
  return diffHash(root, ["package.json", "package-lock.json", "vitest.config.ts", "stryker.config.mjs"]);
}
