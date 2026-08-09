import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnvConfig } from "@next/env";
import testScopeExclude from "./test-scope-exclude.json";
import { testedSourceFiles, escapeGlobPath } from "./scripts/tested-source-files.mjs";

loadEnvConfig(process.cwd());

// scripts/test-coverage-diff.js가 설정하는 값 — 있으면 "이번에 바뀐 파일"로만
// 커버리지 범위를 좁힌다(patch coverage). 기존 파일의 미달 커버리지 때문에
// 무관한 커밋까지 막히는 걸 방지한다. 없으면(로컬 `npm run test:coverage`) 전체 그대로.
// 좁히기는 원본 경로로 하고, 글롭 이스케이프는 그 뒤에 적용한다.
const scopedSourceFiles = process.env.COVERAGE_DIFF_FILES
  ? testedSourceFiles.filter((file) =>
      process.env.COVERAGE_DIFF_FILES.split(",").includes(file),
    )
  : testedSourceFiles;

const coverageInclude = scopedSourceFiles.map(escapeGlobPath);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup/jsdom-polyfill.ts"],
    globalSetup: ["./src/test/setup/mongo-server.ts"],
    // mongodb-memory-server 인스턴스를 스위트 전체가 공유한다(docs/TESTING_GUIDELINE.md
    // DB 테스트 섹션) — 파일을 병렬로 돌리면 한 파일의 beforeEach(clearCollections)가
    // 다른 파일이 막 써넣은 데이터를 지워버리는 크로스파일 오염이 생긴다.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: coverageInclude,
      exclude: testScopeExclude,
      thresholds: {
        perFile: true,
        lines: 80,
      },
    },
  },
});
