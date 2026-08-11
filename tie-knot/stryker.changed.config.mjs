/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  mutate: JSON.parse(process.env.STRYKER_MUTATE_TARGETS ?? "[]"),
  testRunner: "vitest",
  vitest: { configFile: "vitest.mutation.config.ts" },
  reporters: ["clear-text", "json"],
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  coverageAnalysis: "perTest",
  dryRunTimeoutMinutes: 10,
  concurrency: 1,
  ignoreStatic: false,
  thresholds: { high: 100, low: 100, break: 0 },
  tempDirName: "stryker-tmp-changed",
};

export default config;
