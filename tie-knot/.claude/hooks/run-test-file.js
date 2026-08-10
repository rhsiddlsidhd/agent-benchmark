#!/usr/bin/env node
// 편집 직후 관련 테스트 하나만 돌려서 결과를 돌려준다.
//
// tdd-gate.js와 짝이지만 성격이 반대다 — 저쪽은 게이트(차단), 이쪽은 정보 전달이다.
// 그래서 에러 정책도 반대로 fail-OPEN이다: vitest가 크래시하든 타임아웃이든 exit 0으로
// 빠진다. 게이트가 고장 나면 뚫린 채 통과시키므로 닫아야 하지만, 정보 훅이 고장 나도
// 잘못 허용되는 건 없고 닫으면 작업만 막힌다. 이 파일에 process.exit(2)를 넣지 마라.
const { execFileSync } = require("child_process");
const path = require("path");
const { pairedTestFor } = require("../../scripts/paired-test");

const projectDir = path.resolve(__dirname, "..", "..");
const TIMEOUT_MS = 110_000;

// CLAUDE_PROJECT_DIR는 세션을 어디서 띄웠는지에 따라 달라진다(레포 루트는 tie-knot의
// 부모다) — projectDir을 훅 파일 위치로 고정해야 relPath가 항상 같게 나온다.
function toRelPath(filePath) {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(projectDir, filePath);
  return path.relative(projectDir, abs).split(path.sep).join("/");
}

const isTestFile = (relPath) => /\.test\.(ts|tsx)$/.test(relPath);

// 편집된 파일에서 "돌릴 테스트"와 "그래서 기대하는 결과"를 정한다.
function resolveTarget(relPath) {
  if (!/^src\/.*\.(ts|tsx)$/.test(relPath)) return null;

  // 테스트 파일을 고쳤다 — Red 단계일 가능성이 크므로 실패가 기대값이다.
  if (isTestFile(relPath)) return { testPath: relPath, expect: "fail" };

  // 소스를 고쳤다 — 짝 테스트가 여전히 통과해야 한다(회귀 감지).
  // 짝이 없으면 애초에 tdd-gate가 막았어야 할 상황이거나 게이트 제외 대상이다.
  const testPath = pairedTestFor(relPath);
  return testPath ? { testPath, expect: "pass" } : null;
}

function runVitest(testPath) {
  try {
    const stdout = execFileSync(
      "npx",
      ["vitest", "run", testPath, "--reporter=dot"],
      { cwd: projectDir, encoding: "utf8", timeout: TIMEOUT_MS, stdio: "pipe" },
    );
    return { passed: true, output: stdout };
  } catch (err) {
    // 테스트 실패도 여기로 온다(vitest exit 1). 실행 자체가 불가능한 경우와는
    // stdout 유무로 갈린다 — 크래시/타임아웃이면 vitest가 리포트를 못 남긴다.
    const output = `${err.stdout || ""}${err.stderr || ""}`;
    if (err.killed || !err.stdout) return { crashed: true, output };
    return { passed: false, output };
  }
}

// vite-tsconfig-paths 마이그레이션 안내가 실행마다 3줄씩 붙는다 — 신호가 아니다.
const denoise = (text) =>
  text
    .split("\n")
    .filter((line) => !line.includes("vite-tsconfig-paths"))
    .join("\n")
    .trim();

function buildReport(relPath, target, result) {
  const header =
    relPath === target.testPath
      ? `[red-check] ${relPath}`
      : `[red-check] ${relPath} → ${target.testPath}`;

  if (result.crashed) {
    return [
      `${header}`,
      `  ⚠️ 테스트를 실행하지 못했다(크래시 또는 ${TIMEOUT_MS / 1000}s 타임아웃).`,
      `  판정 보류 — 손으로 확인하라: npx vitest run ${target.testPath}`,
      "",
      denoise(result.output).split("\n").slice(-15).join("\n"),
    ].join("\n");
  }

  const tail = denoise(result.output).split("\n").slice(-30).join("\n");

  if (result.passed) {
    const guidance =
      target.expect === "fail"
        ? [
            "  Red 단계라면: 이 테스트는 새 동작을 검사하지 않고 있다. 소스가 아니라 테스트를 고쳐라.",
            "  Refactor 단계이거나 기존 테스트를 정리한 것이라면: 정상.",
          ]
        : ["  회귀 없음. 계속 진행."];
    return [`${header} → PASSED`, ...guidance, "", tail].join("\n");
  }

  const guidance =
    target.expect === "fail"
      ? [
          "  Red 확인됨 — 소스 작성에 들어가도 된다.",
          "  단 실패 이유를 읽어라: assertion 불일치면 진짜 Red다.",
          "  'Cannot find module' / 'Failed to resolve import'이면 미구현이 아니라 경로 오류다.",
        ]
      : ["  ❗ 회귀다. 방금 수정한 소스가 기존 테스트를 깨뜨렸다."];
  return [`${header} → FAILED`, ...guidance, "", tail].join("\n");
}

// 결과를 Claude에게 넘기는 경로는 stdout JSON 하나뿐이다. 사람이 읽을 사본은
// stderr로 보낸다 — stdout에 JSON 외의 것을 섞으면 파싱이 깨진다.
function emit(report) {
  process.stderr.write(`\n${report}\n`);
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: report,
      },
    }),
  );
  process.exit(0);
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const payload = JSON.parse(input);
    const filePath = (payload.tool_input || {}).file_path;
    if (!filePath) process.exit(0);

    const relPath = toRelPath(filePath);
    const target = resolveTarget(relPath);
    if (!target) process.exit(0);

    emit(buildReport(relPath, target, runVitest(target.testPath)));
  } catch {
    // fail-open. 훅 자체의 버그로 작업을 막지 않는다.
    process.exit(0);
  }
});
