import { globSync } from "glob";

// mutation 대상도 커버리지 게이트(vitest.config.ts)와 동일 원칙 —
// test.ts(x)가 실제로 존재하는 소스 파일로만 스코프를 한정한다.
const testedSourceFiles = globSync("src/**/*.test.{ts,tsx}").map((testFile) =>
  testFile.replace(/\.test\.(ts|tsx)$/, ".$1"),
);

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "npm",
  mutate: testedSourceFiles,
  testRunner: "vitest",
  reporters: ["html", "clear-text", "progress", "json"],
  coverageAnalysis: "perTest",
  // static mutant(모듈 로드 시 1회성 코드 — 최상위 상수/기본 파라미터/정규식 리터럴)는
  // per-test coverage 매핑이 안 붙어서 mutant 하나당 전체 스위트를 재실행한다.
  // dry run 이후 실제 mutant 테스트 단계에서 전체 mutant의 5%가 74%의 시간을 먹는
  // 원인이라 꺼둔다(dry run 자체의 소요시간과는 무관 — 그건 dryRunTimeoutMinutes 참고).
  // 로직 분기(함수 내부 if/비교연산자/반환값)의 mutation 커버리지는 그대로 유지된다.
  ignoreStatic: true,
  // 기본값 5분 — 이 프로젝트 dry run(전체 731테스트를 perTest coverage
  // instrumentation 얹은 채 1회 실행)이 로컬(바이너리 캐시 warm)에서도 3분20초라
  // 여유가 거의 없고, CI 콜드러너에서는 그대로 5분을 넘겨 매번 실패했다(실측,
  // ignoreStatic 적용 전후 동일 지점에서 재현 — dry run 자체의 병목과는 무관함을 확인).
  dryRunTimeoutMinutes: 10,
  tempDirName: "stryker-tmp",
  // mutant마다 vitest worker 여러 개가 동시에 뜨고, 각 worker가 globalSetup에서
  // MongoMemoryServer를 새로 띄운다 — 동시성을 낮게 잡아 리소스 경합을 줄인다.
  concurrency: 2,
  thresholds: {
    high: 80,
    low: 60,
    break: 60,
  },
};
