import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup/jsdom-polyfill.ts"],
    // 실행 조건이 다른 두 묶음으로 나눈다 — mongodb-memory-server 인스턴스는 스위트
    // 전체가 1개를 공유하므로 DB 테스트는 순차로 돌려야 한다. 그 제약이 DB를 안 쓰는
    // 나머지 테스트까지 직렬로 묶이지 않도록 실행 경계를 분리한다.
    // 파일명 접미사가 두 묶음을 가르는 셀렉터다.
    projects: [
      {
        extends: true,
        test: {
          name: "guard",
          environment: "node",
          include: ["scripts/**/*.test.mjs"],
          setupFiles: [],
          maxWorkers: 2,
        },
      },
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.integration.test.{ts,tsx}"],
          // globalSetup 없음 — mongod를 띄우지 않고, fileParallelism 기본값(병렬)을 쓴다.
          // 워커 수는 CPU 개수가 아니라 메모리가 정한다. jsdom worker 하나가 수백 MB를
          // 쓸 수 있어 8코어·4GB 로컬에서도 안정적으로 실행되는 상한을 둔다.
          maxWorkers: 2,
        },
      },
      {
        extends: true,
        test: {
          name: "integration-client",
          environment: "jsdom",
          include: [
            "src/client/**/*.integration.test.{ts,tsx}",
            "src/app/**/_hooks/**/*.integration.test.{ts,tsx}",
          ],
          setupFiles: ["./src/test/setup/jsdom-polyfill.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration-server",
          environment: "node",
          include: [
            "src/server/**/*.integration.test.{ts,tsx}",
            "src/app/api/**/*.integration.test.{ts,tsx}",
          ],
          globalSetup: ["./src/test/setup/mongo-server.ts"],
          // 파일을 병렬로 돌리면 한 파일의 beforeEach(clearCollections)가 다른 파일이
          // 막 써넣은 데이터를 지워버리는 크로스파일 오염이 생긴다.
          fileParallelism: false,
          maxWorkers: 1,
          setupFiles: ["./src/test/setup/node-polyfill.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration-rsc",
          environment: "jsdom",
          include: ["src/app/**/*.integration.test.{ts,tsx}"],
          exclude: [
            "src/app/api/**/*.integration.test.{ts,tsx}",
            "src/app/**/_hooks/**/*.integration.test.{ts,tsx}",
          ],
          globalSetup: ["./src/test/setup/mongo-server.ts"],
          fileParallelism: false,
          maxWorkers: 1,
        },
      },
    ],
  },
});
