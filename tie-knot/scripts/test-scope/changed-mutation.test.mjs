import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { evaluateReport, mutationPlan } from "./changed-mutation.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "changed-mutation-"));
  fs.writeFileSync(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { moduleResolution: "Bundler" } }));
  fs.mkdirSync(path.join(root, "src"));
  fs.writeFileSync(path.join(root, "src/value.ts"), "export const value = 1;\n");
  fs.writeFileSync(path.join(root, "src/value.test.ts"), 'import { value } from "./value"; void value;\n');
  execFileSync("git", ["init", "-b", "dev"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "baseline"], { cwd: root });
  execFileSync("git", ["branch", "baseline"], { cwd: root });
  return root;
}

describe("changed mutation plan", () => {
  it("merge-base 이후 바뀐 제품 줄과 관련 테스트만 선택한다", () => {
    const root = fixture();
    fs.writeFileSync(path.join(root, "src/value.ts"), "export const value = 2;\nexport const next = 3;\n");
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "change"], { cwd: root });
    expect(mutationPlan(root, "baseline")).toMatchObject({ targets: ["src/value.ts:1-2"], tests: ["src/value.test.ts"] });
  });

  it("mutant가 없으면 실패가 아니라 N/A다", () => {
    expect(evaluateReport({ files: {} })).toMatchObject({ status: "N/A", total: 0 });
  });

  it("명시한 동등 mutant만 survived 예외로 인정한다", () => {
    const report = { files: { "src/value.ts": { mutants: [{ status: "Survived", mutatorName: "BooleanLiteral", location: { start: { line: 4 } } }] } } };
    expect(evaluateReport(report).status).toBe("FAILED");
    expect(evaluateReport(report, [{ file: "src/value.ts", mutant: "4:BooleanLiteral" }]).status).toBe("PASSED");
  });
});
