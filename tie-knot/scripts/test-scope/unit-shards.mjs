import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { globSync } from "glob";

const SHARDS = {
  server: {
    paths: ["src/server"],
    matches: (file) => file.startsWith("src/server/"),
  },
  "client-components": {
    paths: ["src/client/components"],
    matches: (file) => file.startsWith("src/client/components/"),
  },
  "client-state": {
    paths: ["src/client/hooks", "src/client/store", "src/client/lib", "src/client/context", "src/client/utils"],
    matches: (file) => /^(src\/client\/(?:hooks|store|lib|context|utils)\/)/.test(file),
  },
  "app-admin": {
    paths: ["src/app/(admin)"],
    matches: (file) => file.startsWith("src/app/(admin)/"),
  },
  "app-main": {
    paths: ["src/app/(main)"],
    matches: (file) => file.startsWith("src/app/(main)/"),
  },
  "app-api": {
    paths: ["src/app/api", "src/app/global-error.test.tsx"],
    matches: (file) => file.startsWith("src/app/api/") || file === "src/app/global-error.test.tsx",
  },
  shared: {
    paths: ["src/shared", "src/proxy.test.ts"],
    matches: (file) => file.startsWith("src/shared/") || file === "src/proxy.test.ts",
  },
};

function unitFiles(root) {
  return globSync("src/**/*.test.{ts,tsx}", { cwd: root, nodir: true })
    .filter((file) => !file.includes(".integration.test."))
    .sort();
}

export function verifyUnitShards(root) {
  const files = unitFiles(root);
  const assignments = Object.fromEntries(files.map((file) => [
    file,
    Object.entries(SHARDS).filter(([, shard]) => shard.matches(file)).map(([name]) => name),
  ]));
  const missing = files.filter((file) => assignments[file].length === 0);
  const duplicated = files.filter((file) => assignments[file].length > 1);
  return { valid: missing.length === 0 && duplicated.length === 0, files: files.length, missing, duplicated };
}

export function argsForUnitShard(name) {
  const shard = SHARDS[name];
  if (!shard) throw new Error(`unknown unit shard: ${name}`);
  return ["run", "--project", "unit", ...shard.paths];
}

export function runUnitShard(root, name, run = spawnSync) {
  const files = unitFiles(root).filter(SHARDS[name]?.matches ?? (() => false));
  const startedAt = Date.now();
  const result = run(process.execPath, ["node_modules/vitest/vitest.mjs", ...argsForUnitShard(name)], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0" },
    maxBuffer: 100 * 1024 * 1024,
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const tests = Number(output.match(/Tests\s+(\d+) passed/)?.[1] ?? 0);
  const summary = { shard: name, files: files.length, tests, durationSeconds: Math.ceil((Date.now() - startedAt) / 1000) };
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `| ${name} | ${summary.files} | ${summary.tests} | ${summary.durationSeconds}s |\n`);
  }
  return result.status ?? 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [command = "verify", name] = process.argv.slice(2);
  if (command === "verify") {
    const result = verifyUnitShards(process.cwd());
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.valid) process.exitCode = 2;
  } else if (command === "run") {
    process.exitCode = runUnitShard(process.cwd(), name);
  } else {
    process.stderr.write("usage: unit-shards.mjs verify|run <shard>\n");
    process.exitCode = 2;
  }
}
