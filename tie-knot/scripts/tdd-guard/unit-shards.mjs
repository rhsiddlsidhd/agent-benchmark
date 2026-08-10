import { globSync } from "glob";

const SHARDS = {
  server: (file) => file.startsWith("src/server/"),
  "client-components": (file) => file.startsWith("src/client/components/"),
  "client-state": (file) => /^(src\/client\/(?:hooks|store|lib|context|utils)\/)/.test(file),
  "app-admin": (file) => file.startsWith("src/app/(admin)/"),
  "app-main": (file) => file.startsWith("src/app/(main)/"),
  "app-api": (file) => file.startsWith("src/app/api/") || file === "src/app/global-error.test.tsx",
  shared: (file) => file.startsWith("src/shared/") || file === "src/proxy.test.ts",
};

export function verifyUnitShards(root) {
  const files = globSync("src/**/*.test.{ts,tsx}", { cwd: root, nodir: true })
    .filter((file) => !file.includes(".integration.test."))
    .sort();
  const assignments = Object.fromEntries(files.map((file) => [
    file,
    Object.entries(SHARDS).filter(([, matches]) => matches(file)).map(([name]) => name),
  ]));
  const missing = files.filter((file) => assignments[file].length === 0);
  const duplicated = files.filter((file) => assignments[file].length > 1);
  return { valid: missing.length === 0 && duplicated.length === 0, files: files.length, missing, duplicated };
}

if (process.argv[1]?.endsWith("unit-shards.mjs")) {
  const result = verifyUnitShards(process.cwd());
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid) process.exitCode = 2;
}
