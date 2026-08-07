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
  // 전체 mutant의 5%가 dry run 이후 실행시간의 74%를 먹는 원인이라 꺼둔다 — 로직
  // 분기(함수 내부 if/비교연산자/반환값)의 mutation 커버리지는 그대로 유지된다.
  ignoreStatic: true,
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
