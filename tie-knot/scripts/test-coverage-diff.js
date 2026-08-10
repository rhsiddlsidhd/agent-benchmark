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

// 커버리지 대상을 변경 파일로 좁히는 일 자체는 vitest의 `--coverage.changed`가 한다
// (내부적으로 `git diff <base>...HEAD` + `--cached` + `ls-files --other --modified`).
// 여기서 git을 다시 보는 이유는 하나뿐이다 — 변경된 소스가 없을 때 전체 스위트를
// 통째로 건너뛰기 위해서다. `--coverage.changed`는 측정 범위만 좁히고 테스트는
// 전부 실행하므로, 문서만 고친 커밋에서도 스위트 전체(수백 초)를 그대로 태운다.
const committed = gitDiffFiles(`${BASE}...HEAD`);
const staged = gitDiffFiles("--cached");
const changed = [...new Set([...committed, ...staged])].filter(isCoverableSource);

if (changed.length === 0) {
  console.log(
    `[test:coverage:diff] ${BASE} 대비 변경된 소스 파일 없음 — 커버리지 체크 스킵.`,
  );
  process.exit(0);
}

// 파일 목록을 여기서 나열하지 않는다 — vitest는 unstaged/untracked까지 대상에
// 넣으므로 이 목록과 실제 측정 범위가 어긋난다. 최종 범위는 커버리지 리포트가 보여준다.
console.log(
  `[test:coverage:diff] ${BASE} 대비 변경된 소스 ${changed.length}개 — 커버리지 체크 실행.`,
);

try {
  execSync(`npx vitest run --coverage --coverage.changed ${BASE}`, {
    stdio: "inherit",
  });
} catch {
  process.exit(1);
}
