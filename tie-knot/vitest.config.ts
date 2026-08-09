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
          // 대신 connect.ts가 모듈 로드 시점에 MONGO_TEST_URI 존재를 요구하므로(프로덕션 DB
          // 오염 방지 가드) 더미 값을 넣는다 — 배럴 캐스케이드로 이 모듈이 딸려 들어오는
          // 것만으로 가드가 던지기 때문이다. 이 묶음엔 DB를 쓰는 테스트가 없어 실제로
          // 연결되지 않고, 설령 실수로 dbConnect가 호출돼도 프로덕션이 아닌 이 주소로 향한다.
          env: { MONGO_TEST_URI: "mongodb://127.0.0.1:1/unit-project-never-connects" },
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
