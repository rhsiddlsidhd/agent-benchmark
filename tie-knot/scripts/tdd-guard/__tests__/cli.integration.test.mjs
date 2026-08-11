import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";
import { main } from "../bin/guard.mjs";
import { sha256 } from "../core/hash-worktree.mjs";

void main;

const projectRoot = path.resolve(import.meta.dirname, "../../..");
const cli = path.join(projectRoot, "scripts/tdd-guard/bin/guard.mjs");
const codexAdapter = path.join(projectRoot, "scripts/tdd-guard/adapters/codex.mjs");
const roots = [];

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-cli-fixture-"));
  const state = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-cli-state-"));
  roots.push(root, state);
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "guard@example.test"], { cwd: root });
  execFileSync("git", ["config", "user.name", "TDD Guard"], { cwd: root });
  write(path.join(root, "package.json"), "{}\n");
  write(path.join(root, "package-lock.json"), "{}\n");
  write(path.join(root, "stryker.config.mjs"), "export default {};\n");
  write(path.join(root, "tdd-exceptions.json"), "[]\n");
  write(path.join(root, "vitest.config.ts"), `
    import { defineConfig } from "vitest/config";
    export default defineConfig({ test: { projects: [{ test: { name: "unit", environment: "node", include: ["src/**/*.test.ts"] } }] } });
  `);
  write(path.join(root, "src/value.ts"), "export const value = 1;\n");
  fs.symlinkSync(path.join(projectRoot, "node_modules"), path.join(root, "node_modules"), "dir");
  execFileSync("git", ["add", "package.json", "package-lock.json", "stryker.config.mjs", "tdd-exceptions.json", "vitest.config.ts", "src/value.ts"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });
  return { root, state };
}

function run(root, state, args, input) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    input: input ? JSON.stringify(input) : undefined,
    encoding: "utf8",
    env: { ...process.env, TDD_GUARD_ROOT: root, TDD_GUARD_SESSION_ID: "fixture-session", XDG_STATE_HOME: state },
  });
}

function runCodexAdapter(root, state, input) {
  return spawnSync(process.execPath, [codexAdapter, "pre-edit"], {
    cwd: root,
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, TDD_GUARD_ROOT: root, TDD_GUARD_SESSION_ID: "fixture-session", XDG_STATE_HOME: state },
  });
}

afterAll(() => roots.forEach((root) => fs.rmSync(root, { recursive: true, force: true })));

describe("공통 Guard CLI 전체 상태 전이", () => {
  it("Codex apply_patch를 수정 전에 차단하고 사용자용 사유를 출력한다", () => {
    const { root, state } = fixture();
    const result = runCodexAdapter(root, state, {
      session_id: "fixture-session",
      tool_name: "apply_patch",
      tool_input: { command: "*** Begin Patch\n*** Update File: src/value.ts\n*** End Patch" },
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "TDD Guard: src/value.ts 편집 전 테스트를 변경하고 npm run test:red -- --scope <scope>를 실행하세요.",
      },
    });
  });

  it("Red, 구현 허용, Green, mutation, VERIFIED와 테스트 변경 무효화를 증명한다", () => {
    const { root, state } = fixture();
    write(path.join(root, "src/value.test.ts"), `
      import { describe, expect, it } from "vitest";
      import { value } from "./value";
      describe("value", () => { it("새 계약", () => { expect(value).toBe(2); }); });
    `);

    const red = run(root, state, ["prove-red", "--scope", "unit"]);
    expect(red.status, red.stderr || red.stdout).toBe(0);
    expect(JSON.parse(red.stdout)).toMatchObject({ state: "RED_PROVEN[unit]", redScopes: ["unit"], allowedProductFiles: ["src/value.ts"] });

    const allowed = run(root, state, ["pre-edit"], { session_id: "fixture-session", tool_name: "Write", tool_input: { file_path: path.join(root, "src/value.ts") } });
    expect(allowed.status).toBe(0);
    expect(JSON.parse(allowed.stdout)).toMatchObject({ permissionDecision: "allow" });

    const outside = run(root, state, ["pre-edit"], { session_id: "fixture-session", tool_name: "Write", tool_input: { file_path: path.join(root, "src/outside.ts") } });
    expect(outside.status).toBe(2);
    expect(JSON.parse(outside.stdout)).toMatchObject({ permissionDecision: "deny" });

    write(path.join(root, "src/value.ts"), "export const value = 2;\n");
    const post = run(root, state, ["post-edit"], { tool_name: "Write", tool_input: { file_path: path.join(root, "src/value.ts") } });
    expect(post.status).toBe(0);
    expect(JSON.parse(post.stdout)).toMatchObject({ state: "IMPLEMENTING" });

    const green = run(root, state, ["prove-green", "--scope", "unit"]);
    expect(green.status, green.stderr || green.stdout).toBe(0);
    expect(JSON.parse(green.stdout)).toMatchObject({ state: "GREEN_PROVEN[unit]", greenScopes: ["unit"] });

    const report = JSON.stringify({ files: { "src/value.ts": { mutants: [{ status: "Killed" }] } } });
    write(path.join(root, "reports/mutation/mutation.json"), report);
    const sourceHash = sha256(`src/value.ts:1-1\0${fs.readFileSync(path.join(root, "src/value.ts"))}`);
    write(path.join(root, "reports/mutation/changed-proof.json"), JSON.stringify({ status: "PASSED", targets: ["src/value.ts:1-1"], sourceHash, reportHash: sha256(report), surviving: [] }));
    const verified = run(root, state, ["verify"]);
    expect(verified.status, verified.stderr || verified.stdout).toBe(0);
    expect(JSON.parse(verified.stdout)).toMatchObject({ state: "VERIFIED", mutation: { killed: 1, survived: 0 } });

    write(path.join(root, "src/value.test.ts"), `import { expect, it } from "vitest"; import { value } from "./value"; it("changed", () => expect(value).toBe(3));`);
    const invalidated = run(root, state, ["post-edit"], { tool_name: "Write", tool_input: { file_path: path.join(root, "src/value.test.ts") } });
    expect(invalidated.status).toBe(0);
    expect(JSON.parse(invalidated.stdout)).toMatchObject({ valid: false, state: "TEST_CHANGED", reason: "proof missing" });
  }, 30_000);
});
