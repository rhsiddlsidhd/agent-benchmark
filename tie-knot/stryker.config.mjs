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
