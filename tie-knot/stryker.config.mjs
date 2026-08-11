import { buildTestGraph } from "./scripts/test-scope/test-graph.mjs";

const mutationSources = buildTestGraph().sources.filter((file) => file.startsWith("src/"));
const reportDir = process.env.STRYKER_REPORT_DIR;
const incrementalFile = process.env.STRYKER_INCREMENTAL_FILE;

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  mutate: mutationSources,
  testRunner: "vitest",
  reporters: ["html", "clear-text", "progress", "json"],
  htmlReporter: { fileName: reportDir ? `${reportDir}/index.html` : "reports/mutation/full/index.html" },
  jsonReporter: { fileName: reportDir ? `${reportDir}/mutation.json` : "reports/mutation/full/mutation.json" },
  incremental: true,
  incrementalFile: incrementalFile || "reports/mutation/full-incremental.json",
  coverageAnalysis: "perTest",
  // 최상위 상수와 기본 파라미터도 제품 동작이므로 기본 정책(false)대로 검사한다.
  ignoreStatic: false,
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

export default config;
