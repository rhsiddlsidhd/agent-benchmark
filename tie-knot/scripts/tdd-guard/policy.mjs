import fs from "node:fs";
import path from "node:path";
import { classifyFile } from "./classify-file.mjs";

const MAX_DAYS = 30 * 24 * 60 * 60 * 1000;

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\0").replace(/\*/g, "[^/]*").replace(/\0/g, ".*");
  return new RegExp(`^${escaped}$`);
}

export function loadExceptions(root, now = new Date()) {
  const file = path.join(root, "tdd-exceptions.json");
  if (!fs.existsSync(file)) return [];
  const entries = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(entries)) throw new Error("tdd-exceptions.json must be an array");
  for (const entry of entries) {
    if (!entry.id || !entry.owner || !entry.reason || !entry.expiresAt || !Array.isArray(entry.paths) || !Array.isArray(entry.rules)) {
      throw new Error(`invalid exception: ${entry.id ?? "unknown"}`);
    }
    const expiry = new Date(entry.expiresAt);
    if (Number.isNaN(expiry.valueOf()) || expiry <= now) throw new Error(`expired exception: ${entry.id}`);
    if (expiry.valueOf() - now.valueOf() > MAX_DAYS) throw new Error(`exception exceeds 30 days: ${entry.id}`);
  }
  return entries;
}

export function exceptionAllows(entries, file, rule) {
  return entries.some((entry) => entry.rules.includes(rule) && entry.paths.some((glob) => globToRegExp(glob).test(file)));
}

export function shouldGuard(root, file) {
  if (!classifyFile(file).guarded) return false;
  return !exceptionAllows(loadExceptions(root), file, "test-not-required");
}
