const { execFileSync } = require("child_process");
const path = require("path");
const { pairedTestFor } = require("./paired-test");

const projectDir = path.resolve(__dirname, "..");
const BASE = process.env.COVERAGE_DIFF_BASE || "dev";

function gitDiffFiles(args) {
  try {
    return execFileSync("git", ["diff", "--relative", "--name-only", ...args], {
      cwd: projectDir,
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isSourceFile(file) {
  return /^src\/.*\.(ts|tsx)$/.test(file) && !/\.test\.(ts|tsx)$/.test(file);
}

const committed = gitDiffFiles([`${BASE}...HEAD`]);
const staged = gitDiffFiles(["--cached"]);
const tests = [
  ...new Set(
    [...committed, ...staged]
      .filter(isSourceFile)
      .map(pairedTestFor)
      .filter(Boolean),
  ),
];

if (tests.length === 0) {
  console.log(`[test:paired] ${BASE} 대비 변경된 소스의 짝 테스트 없음 — 스킵.`);
  process.exit(0);
}

console.log(`[test:paired] 짝 테스트 ${tests.length}개 실행:`);
tests.forEach((test) => console.log(`  ${test}`));

try {
  execFileSync("npx", ["vitest", "run", ...tests], {
    cwd: projectDir,
    stdio: "inherit",
  });
} catch {
  process.exit(1);
}
