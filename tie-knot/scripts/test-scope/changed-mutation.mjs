import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildTestGraph } from "./test-graph.mjs";

const REPORT = "reports/mutation/mutation.json";
const PROOF = "reports/mutation/changed-proof.json";

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function changedRanges(root, mergeBase) {
  const output = git(root, ["diff", "--relative", "--unified=0", "--diff-filter=ACMR", mergeBase, "--", "src"]);
  const ranges = new Map();
  let file;
  for (const line of output.split("\n")) {
    if (line.startsWith("+++ b/")) file = line.slice(6);
    const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (!file || !match) continue;
    const start = Number(match[1]);
    const count = Number(match[2] ?? 1);
    if (!count) continue;
    const end = start + count - 1;
    const entries = ranges.get(file) ?? [];
    entries.push([start, end]);
    ranges.set(file, entries);
  }
  return ranges;
}

export function mutationPlan(root = process.cwd(), base = "origin/dev") {
  const mergeBase = git(root, ["merge-base", base, "HEAD"]);
  const graph = buildTestGraph(root);
  const sourceSet = new Set(graph.sources);
  const ranges = changedRanges(root, mergeBase);
  const targets = [];
  const tests = new Set();
  for (const [file, entries] of ranges) {
    if (!sourceSet.has(file)) continue;
    for (const [start, end] of entries) targets.push(`${file}:${start}-${end}`);
    for (const test of graph.testsFor(file)) tests.add(test);
  }
  const sourceHash = sha256(targets.map((target) => {
    const file = target.slice(0, target.lastIndexOf(":"));
    return `${target}\0${fs.readFileSync(path.join(root, file))}`;
  }).join("\0"));
  return {
    base,
    mergeBase,
    head: git(root, ["rev-parse", "HEAD"]),
    targets: targets.sort(),
    tests: [...tests].sort(),
    sourceHash,
  };
}

function exceptions(root) {
  const file = path.join(root, "mutation-equivalents.json");
  if (!fs.existsSync(file)) return [];
  const entries = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(entries)) throw new Error("mutation-equivalents.json must be an array");
  const now = new Date();
  for (const entry of entries) {
    if (!entry.id || !entry.file || !entry.owner || !entry.reason || !entry.expiresAt) throw new Error("invalid mutation equivalent exception");
    const expiresAt = new Date(entry.expiresAt);
    if (Number.isNaN(expiresAt.valueOf()) || expiresAt <= now) throw new Error(`expired mutation equivalent exception: ${entry.id}`);
    if (expiresAt.valueOf() - now.valueOf() > 30 * 24 * 60 * 60 * 1000) throw new Error(`mutation equivalent exception exceeds 30 days: ${entry.id}`);
  }
  return entries;
}

function mutantKey(mutant) {
  return `${mutant.location?.start?.line ?? 0}:${mutant.mutatorName ?? ""}`;
}

export function evaluateReport(report, equivalentExceptions = []) {
  const surviving = [];
  let killed = 0;
  let total = 0;
  for (const [file, result] of Object.entries(report.files ?? {})) {
    for (const mutant of result.mutants ?? []) {
      total += 1;
      if (mutant.status === "Killed") killed += 1;
      if (mutant.status !== "Survived") continue;
      const allowed = equivalentExceptions.some((entry) => entry.file === file && entry.mutant === mutantKey(mutant));
      if (!allowed) surviving.push({ file, mutant: mutantKey(mutant) });
    }
  }
  return { status: total === 0 ? "N/A" : surviving.length ? "FAILED" : "PASSED", total, killed, surviving };
}

export function runChangedMutation(root = process.cwd(), base = "origin/dev") {
  const plan = mutationPlan(root, base);
  fs.mkdirSync(path.join(root, "reports", "mutation"), { recursive: true });
  if (!plan.targets.length) {
    const result = { ...plan, status: "N/A", reason: "no changed tested source lines" };
    fs.writeFileSync(path.join(root, PROOF), JSON.stringify(result, null, 2));
    return result;
  }
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const run = spawnSync(command, ["stryker", "run", "stryker.changed.config.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STRYKER_MUTATE_TARGETS: JSON.stringify(plan.targets), STRYKER_RELATED_TESTS: JSON.stringify(plan.tests) },
  });
  if (run.error) throw run.error;
  const reportFile = path.join(root, REPORT);
  if (!fs.existsSync(reportFile) && run.status === 0) {
    const proof = { ...plan, status: "N/A", reason: "no mutants generated", createdAt: new Date().toISOString() };
    fs.writeFileSync(path.join(root, PROOF), JSON.stringify(proof, null, 2));
    return proof;
  }
  if (!fs.existsSync(reportFile)) throw new Error("mutation report missing");
  const reportText = fs.readFileSync(reportFile, "utf8");
  const result = evaluateReport(JSON.parse(reportText), exceptions(root));
  const proof = { ...plan, ...result, reportHash: sha256(reportText), createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(root, PROOF), JSON.stringify(proof, null, 2));
  if (run.status !== 0 || result.status === "FAILED") process.exitCode = 1;
  return proof;
}

function baseArgument(argv) {
  const index = argv.indexOf("--base");
  return index >= 0 ? argv[index + 1] : process.env.MUTATION_BASE ?? "origin/dev";
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = runChangedMutation(process.cwd(), baseArgument(process.argv.slice(2)));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
