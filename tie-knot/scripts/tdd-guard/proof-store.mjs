import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sha256 } from "./hash-worktree.mjs";

export function storeDir(root) {
  const base = process.env.XDG_STATE_HOME || path.join(os.tmpdir(), `tdd-guard-${process.getuid?.() ?? "user"}`);
  const dir = path.join(base, "tie-knot", sha256(root).slice(0, 16));
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

export function readProof(root) {
  const file = path.join(storeDir(root), "proof.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeProof(root, proof) {
  const file = path.join(storeDir(root), "proof.json");
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(proof, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file);
}

export function invalidate(root) {
  fs.rmSync(path.join(storeDir(root), "proof.json"), { force: true });
}
