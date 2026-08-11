import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const related: string[] = JSON.parse(process.env.STRYKER_RELATED_TESTS ?? "[]");
const take = (predicate: (file: string) => boolean) => related.filter(predicate);
const server = (file: string) => file.includes(".integration.test.")
  && (file.startsWith("src/server/") || file.startsWith("src/app/api/") || file.startsWith("tests/integration/server/"));
const rsc = (file: string) => file.includes(".integration.test.") && file.startsWith("src/app/") && !file.startsWith("src/app/api/");
const client = (file: string) => file.startsWith("tests/integration/client/") || file.startsWith("src/client/") && file.includes(".integration.test.");
const groups = [
  { name: "mutation-unit", files: take((file) => !server(file) && !rsc(file) && !client(file)), environment: "jsdom" },
  { name: "mutation-client", files: take(client), environment: "jsdom" },
  { name: "mutation-server", files: take(server), environment: "node", mongo: true },
  { name: "mutation-rsc", files: take(rsc), environment: "jsdom", mongo: true },
].filter((group) => group.files.length);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup/jsdom-polyfill.ts"],
    projects: groups.map((group) => ({
      extends: true,
      test: {
        name: group.name,
        include: group.files,
        environment: group.environment,
        setupFiles: group.environment === "node" ? ["./src/test/setup/node-polyfill.ts"] : ["./src/test/setup/jsdom-polyfill.ts"],
        globalSetup: group.mongo ? ["./src/test/setup/mongo-server.ts"] : [],
        fileParallelism: !group.mongo,
        maxWorkers: group.mongo ? 1 : 2,
      },
    })),
  },
});
