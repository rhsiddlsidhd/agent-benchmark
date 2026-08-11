import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runVitest } from "./run-vitest.mjs";

export function runBaseline(root, tests, scope) {
  const prefix = execFileSync("git", ["rev-parse", "--show-prefix"], { cwd: root, encoding: "utf8" }).trim().replace(/\/$/, "");
  const tracked = tests.filter((test) => {
    const objectPath = prefix ? `${prefix}/${test}` : test;
    try { execFileSync("git", ["cat-file", "-e", `HEAD:${objectPath}`], { cwd: root, stdio: "ignore" }); return true; } catch { return false; }
  });
  if (!tracked.length) return { failedTests: [], passed: true, environmentError: false };

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-baseline-"));
  const archive = path.join(temp, "repo.tar");
  try {
    const treeish = prefix ? `HEAD:${prefix}` : "HEAD";
    fs.writeFileSync(archive, execFileSync("git", ["archive", "--format=tar", treeish], { cwd: root, maxBuffer: 100 * 1024 * 1024 }));
    const checkout = path.join(temp, "checkout");
    fs.mkdirSync(checkout);
    execFileSync("tar", ["-xf", archive, "-C", checkout]);
    fs.symlinkSync(path.join(root, "node_modules"), path.join(checkout, "node_modules"), "dir");
    return runVitest(checkout, tracked, scope);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
