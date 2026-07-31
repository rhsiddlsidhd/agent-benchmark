const { execSync } = require("child_process");

const BASE = process.env.COVERAGE_DIFF_BASE || "dev";

function gitDiffFiles(args) {
  try {
    // --relative: 저장소 루트가 이 프로젝트 디렉토리보다 한 단계 위일 수 있다
    // (모노레포성 배치) — 경로를 항상 이 프로젝트 기준(src/...)으로 맞춘다.
    return execSync(`git diff --relative --name-only ${args}`, {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isCoverableSource(file) {
  return (
    /^src\/.*\.(ts|tsx)$/.test(file) &&
    !/\.test\.(ts|tsx)$/.test(file)
  );
}

const committed = gitDiffFiles(`${BASE}...HEAD`);
const staged = gitDiffFiles("--cached");
const changed = [...new Set([...committed, ...staged])].filter(isCoverableSource);

if (changed.length === 0) {
  console.log(
    `[test:coverage:diff] ${BASE} 대비 변경된 소스 파일 없음 — 커버리지 체크 스킵.`,
  );
  process.exit(0);
}

console.log(
  `[test:coverage:diff] ${BASE} 대비 변경 파일 ${changed.length}개 커버리지 체크:`,
);
changed.forEach((file) => console.log(`  ${file}`));

process.env.COVERAGE_DIFF_FILES = changed.join(",");

try {
  execSync("npx vitest run --coverage", {
    stdio: "inherit",
    env: process.env,
  });
} catch {
  process.exit(1);
}
