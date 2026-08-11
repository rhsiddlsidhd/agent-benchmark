import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildTestGraph } from "./test-graph.mjs";

export function fullMutationPaths(env = process.env, home = os.homedir()) {
  const state = env.XDG_STATE_HOME || path.join(home, ".local", "state");
  const root = path.join(state, "tie-knot", "mutation", "full");
  return {
    root,
    latest: env.STRYKER_REPORT_DIR || path.join(root, "latest"),
    incremental:
      env.STRYKER_INCREMENTAL_FILE || path.join(root, "incremental.json"),
  };
}

export function planFullMutation(root = process.cwd(), env = process.env) {
  const started = performance.now();
  const graph = buildTestGraph(root);
  const productSources = graph.sources.filter((file) =>
    file.startsWith("src/"),
  );
  const productTests = graph.tests.filter((test) =>
    productSources.some((source) => graph.testsFor(source).includes(test)),
  );
  const paths = fullMutationPaths(env);
  return {
    tests: productTests.length,
    sources: productSources.length,
    discoveryMs: Math.round(performance.now() - started),
    ...paths,
  };
}

function summary(reportFile) {
  if (!fs.existsSync(reportFile)) return {};
  const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  const mutants = Object.values(report.files ?? {}).flatMap(
    (entry) => entry.mutants ?? [],
  );
  const count = (status) =>
    mutants.filter((mutant) => mutant.status === status).length;
  return {
    total: mutants.length,
    killed: count("Killed"),
    survived: count("Survived"),
    noCoverage: count("NoCoverage"),
  };
}

function writeCiSummary(file, benchmark) {
  if (!file) return;
  const score = benchmark.total
    ? `${((benchmark.killed / benchmark.total) * 100).toFixed(2)}%`
    : "N/A";
  fs.appendFileSync(
    file,
    [
      "## Full mutation",
      "",
      "| Status | Score | Mutants | Killed | Survived | No coverage | Duration |",
      "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
      `| ${benchmark.status} | ${score} | ${benchmark.total ?? 0} | ${benchmark.killed ?? 0} | ${benchmark.survived ?? 0} | ${benchmark.noCoverage ?? 0} | ${Math.round(benchmark.durationMs / 1000)}s |`,
      "",
    ].join("\n"),
  );
}

export function runFullMutation(root = process.cwd(), env = process.env) {
  const plan = planFullMutation(root, env);
  fs.mkdirSync(plan.root, { recursive: true });
  fs.mkdirSync(plan.latest, { recursive: true });
  for (const file of ["index.html", "mutation.json", "benchmark.json"])
    fs.rmSync(path.join(plan.latest, file), { force: true });
  const startedAt = new Date();
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const run = spawnSync(command, ["stryker", "run"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...env,
      STRYKER_REPORT_DIR: plan.latest,
      STRYKER_INCREMENTAL_FILE: plan.incremental,
    },
  });
  if (run.error) throw run.error;
  const benchmark = {
    status: run.status === 0 ? "PASSED" : "FAILED",
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.valueOf(),
    tests: plan.tests,
    sources: plan.sources,
    discoveryMs: plan.discoveryMs,
    incrementalFile: plan.incremental,
    ...summary(path.join(plan.latest, "mutation.json")),
  };
  fs.writeFileSync(
    path.join(plan.latest, "benchmark.json"),
    JSON.stringify(benchmark, null, 2),
  );
  writeCiSummary(env.GITHUB_STEP_SUMMARY, benchmark);
  if (run.status !== 0) process.exitCode = run.status ?? 1;
  return benchmark;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = process.argv.includes("--plan")
      ? planFullMutation()
      : runFullMutation();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
