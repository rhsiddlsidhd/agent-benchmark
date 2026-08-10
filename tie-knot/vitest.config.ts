import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnvConfig } from "@next/env";
import testScopeExclude from "./test-scope-exclude.json";
import { testedSourceFiles, escapeGlobPath } from "./scripts/tested-source-files.mjs";

loadEnvConfig(process.cwd());

// 여기는 항상 전체 스코프다. "이번에 바뀐 파일"로만 좁히는 patch coverage는
// `npm run test:coverage:diff`가 vitest의 `--coverage.changed`로 처리한다 —
// 기존 파일의 미달 커버리지 때문에 무관한 커밋까지 막히는 걸 방지하는 용도다.
const coverageInclude = testedSourceFiles.map(escapeGlobPath);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup/jsdom-polyfill.ts"],
    // 실행 조건이 다른 두 묶음으로 나눈다 — mongodb-memory-server 인스턴스는 스위트
    // 전체가 1개를 공유하므로 DB 테스트는 순차로 돌려야 하지만(docs/TESTING_GUIDELINE.md
    // DB 테스트 섹션), 그 제약이 DB를 안 쓰는 나머지 테스트까지 직렬로 묶고 있었다.
    // 파일명 접미사가 두 묶음을 가르는 셀렉터다.
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.integration.test.{ts,tsx}"],
          // globalSetup 없음 — mongod를 띄우지 않고, fileParallelism 기본값(병렬)을 쓴다.
          // 다만 워커 수는 CPU 개수가 아니라 메모리가 정한다 — jsdom 환경에 v8 커버리지
          // 계측까지 얹히면 워커 하나가 수백 MB를 쓴다. 기본값(코어 수만큼)으로 두면
          // `test:coverage`에서 "Failed to start forks worker / Timeout waiting for worker"로
          // 무더기 실패한다(8코어·4GB 로컬에서 재현). 계측 없는 `npm test`는 통과하므로
          // 커버리지를 돌릴 때만 드러난다.
          maxWorkers: "50%",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.{ts,tsx}"],
          globalSetup: ["./src/test/setup/mongo-server.ts"],
          // 파일을 병렬로 돌리면 한 파일의 beforeEach(clearCollections)가 다른 파일이
          // 막 써넣은 데이터를 지워버리는 크로스파일 오염이 생긴다.
          fileParallelism: false,
        },
      },
    ],
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
