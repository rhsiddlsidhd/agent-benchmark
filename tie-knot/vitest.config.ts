import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import testScopeExclude from "./.claude/hooks/test-scope-exclude.json";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/testing-library-setup.ts"],
    globalSetup: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      exclude: testScopeExclude,
      thresholds: {
        perFile: true,
        lines: 80,
      },
    },
  },
});
