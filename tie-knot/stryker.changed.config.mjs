/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  mutate: ["src/shared/schemas/request/product.schema.ts:15-25"],
  testRunner: "vitest",
  vitest: { configFile: "vitest.mutation.config.ts" },
  reporters: ["clear-text", "json"],
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  coverageAnalysis: "perTest",
  concurrency: 1,
  thresholds: { high: 100, low: 100, break: 100 },
  tempDirName: "stryker-tmp-changed",
};

export default config;
