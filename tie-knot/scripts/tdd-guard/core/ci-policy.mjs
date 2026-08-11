import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { analyzeTestQuality } from "./analyze-test-quality.mjs";
import { classifyFile } from "./classify-file.mjs";
import { loadExceptions, shouldGuard } from "./policy.mjs";
import { resolveTests } from "./resolve-tests.mjs";
import { changedFiles as worktreeChangedFiles } from "./hash-worktree.mjs";

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

export function ciChangedFiles(root, baseRef) {
  const base = baseRef || process.env.GITHUB_BASE_REF;
  const mergeBase = base
    ? git(root, ["merge-base", "HEAD", `origin/${base}`])
    : git(root, ["rev-parse", "HEAD^"]);
  const repositoryRoot = git(root, ["rev-parse", "--show-toplevel"]);
  const projectPrefix = path.relative(repositoryRoot, root).split(path.sep).join("/");
  return git(root, ["diff", "--name-only", "--diff-filter=ACMRT", `${mergeBase}...HEAD`, "--", "."])
    .split("\n")
    .filter(Boolean)
    .map((file) => projectPrefix && file.startsWith(`${projectPrefix}/`)
      ? file.slice(projectPrefix.length + 1)
      : file);
}

export function verifyCiPolicy(root, baseRef) {
  loadExceptions(root);
  const changed = [...new Set([...ciChangedFiles(root, baseRef), ...worktreeChangedFiles(root)])].sort();
  const guarded = changed.filter((file) =>
    fs.existsSync(path.join(root, file)) && classifyFile(file).guarded && shouldGuard(root, file)
  );
  const failures = [];
  const affected = {};

  for (const file of guarded) {
    const tests = resolveTests(root, file);
    affected[file] = tests;
    if (!tests.length) {
      failures.push({ file, rule: "missing-related-test" });
      continue;
    }
    for (const test of tests) {
      if (!fs.existsSync(path.join(root, test))) {
        failures.push({ file, test, rule: "missing-test-file" });
        continue;
      }
      const quality = analyzeTestQuality(path.join(root, test));
      if (!quality.valid) failures.push({ file, test, rule: "test-quality", errors: quality.errors });
    }
  }

  return { valid: failures.length === 0, changed, guarded, affected, failures };
}
