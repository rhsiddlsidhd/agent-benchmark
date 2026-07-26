import { globSync } from "glob";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnvConfig } from "@next/env";
import testScopeExclude from "./test-scope-exclude.json";

loadEnvConfig(process.cwd());

// 커버리지 게이트를 ".test.ts(x)"가 실제로 존재하는 소스 파일로만 한정한다 —
// 배럴 import 캐스케이드로 우연히 로드된 무관 레거시 파일까지 게이트에 걸리는 걸 막는다.
const testedSourceFiles = globSync("src/**/*.test.{ts,tsx}").map((testFile) =>
  testFile.replace(/\.test\.(ts|tsx)$/, ".$1"),
);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/testing-library-setup.ts"],
    globalSetup: ["./src/test/setup.ts"],
    // mongodb-memory-server 인스턴스를 스위트 전체가 공유한다(docs/TESTING_GUIDELINE.md
    // DB 테스트 섹션) — 파일을 병렬로 돌리면 한 파일의 beforeEach(clearCollections)가
    // 다른 파일이 막 써넣은 데이터를 지워버리는 크로스파일 오염이 생긴다.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: testedSourceFiles,
      exclude: testScopeExclude,
      thresholds: {
        perFile: true,
        lines: 80,
      },
    },
  },
});
