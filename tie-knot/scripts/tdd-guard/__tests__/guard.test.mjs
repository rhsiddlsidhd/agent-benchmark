import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeTestQuality } from "../core/analyze-test-quality.mjs";
import { extractFiles } from "../bin/guard.mjs";
import { classifyScope, requiredScopePolicy, requiredScopes } from "../core/classify-scope.mjs";
import { ciChangedFiles } from "../core/ci-policy.mjs";
import { configHash, diffHash, head } from "../core/hash-worktree.mjs";
import { exceptionAllows, loadExceptions } from "../core/policy.mjs";
import { invalidate, readProof, writeProof } from "../core/proof-store.mjs";
import { greenProof, implementingProof, mutationProof, proofValidity, redProof, verifiedProof } from "../core/proof-state.mjs";
import { newRedFailures } from "../core/result-policy.mjs";
import { resolveSources, resolveTests } from "../core/resolve-tests.mjs";
import { mutationStatus } from "../core/mutation.mjs";
import { verifyUnitShards } from "../core/unit-shards.mjs";
import { projectFor } from "../core/run-vitest.mjs";

const dirs = [];
afterEach(() => { for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });

function temp() { const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-guard-test-")); dirs.push(dir); return dir; }
function write(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); }
function repo() {
  const dir = temp();
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "guard@example.test"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "TDD Guard"], { cwd: dir });
  for (const file of ["package.json", "package-lock.json", "vitest.config.ts", "stryker.config.mjs"]) write(path.join(dir, file), "{}\n");
  write(path.join(dir, "src/value.ts"), "export const value = 1;\n");
  execFileSync("git", ["add", "package.json", "package-lock.json", "vitest.config.ts", "stryker.config.mjs", "src/value.ts"], { cwd: dir });
  execFileSync("git", ["commit", "-qm", "initial"], { cwd: dir });
  return dir;
}

describe("test quality guard", () => {
  for (const [name, source, error] of [
    ["빈 테스트", `import { it } from "vitest"; import "@/value"; it("x", () => {});`, "empty test"],
    ["테스트 0개", `import "@/value";`, "zero tests"],
    ["assertion 없음", `import { it } from "vitest"; import "@/value"; it("x", () => { const x = 1; });`, "no assertions"],
    ["상수 assertion", `import { it, expect } from "vitest"; import "@/value"; it("x", () => expect(true).toBe(true));`, "constant assertion"],
    ["제품 미연결", `import { it, expect } from "vitest"; it("x", () => expect(Date.now()).toBeGreaterThan(0));`, "not connected to product module"],
    ["snapshot only", `import { it, expect } from "vitest"; import value from "@/value"; it("x", () => expect(value).toMatchSnapshot());`, "snapshot-only test"],
  ]) it(`${name}을 차단한다`, () => { const file = path.join(temp(), "x.test.ts"); write(file, source); expect(analyzeTestQuality(file).errors).toContain(error); });

  it("skip/todo를 차단한다", () => { const file = path.join(temp(), "x.test.ts"); write(file, `import { it, expect } from "vitest"; import value from "@/value"; it.skip("x", () => expect(value).toBe(1));`); expect(analyzeTestQuality(file).errors).toContain("skip/todo test"); });
  it("제품 계약 assertion을 인정한다", () => { const file = path.join(temp(), "x.test.ts"); write(file, `import { it, expect } from "vitest"; import { value } from "@/value"; it("x", () => expect(value).toBe(1));`); expect(analyzeTestQuality(file).valid).toBe(true); });
  it("timeout 인자가 있는 제품 계약 assertion을 인정한다", () => { const file = path.join(temp(), "x.test.ts"); write(file, `import { it, expect } from "vitest"; import { value } from "@/value"; it("x", () => expect(value).toBe(1), 30_000);`); expect(analyzeTestQuality(file).valid).toBe(true); });
});

describe("scope, proof hash and adapters", () => {
  it("모든 unit test가 정확히 한 CI shard에 속한다", () => expect(verifyUnitShards(process.cwd())).toMatchObject({ valid: true, missing: [], duplicated: [] }));
  it("monorepo Git diff 경로를 프로젝트 상대 경로로 정규화한다", () => {
    const top = temp();
    const project = path.join(top, "app");
    execFileSync("git", ["init", "-q"], { cwd: top });
    execFileSync("git", ["config", "user.email", "guard@example.test"], { cwd: top });
    execFileSync("git", ["config", "user.name", "TDD Guard"], { cwd: top });
    write(path.join(project, "src/value.ts"), "export const value = 1;\n");
    execFileSync("git", ["add", "app/src/value.ts"], { cwd: top });
    execFileSync("git", ["commit", "-qm", "initial"], { cwd: top });
    write(path.join(project, "src/value.ts"), "export const value = 2;\n");
    execFileSync("git", ["add", "app/src/value.ts"], { cwd: top });
    execFileSync("git", ["commit", "-qm", "change"], { cwd: top });
    const githubBaseRef = process.env.GITHUB_BASE_REF;
    delete process.env.GITHUB_BASE_REF;
    try {
      expect(ciChangedFiles(project)).toEqual(["src/value.ts"]);
    } finally {
      if (githubBaseRef) process.env.GITHUB_BASE_REF = githubBaseRef;
    }
  });
  it("unit/integration/e2e를 분류한다", () => { expect(classifyScope("src/a.test.ts")).toBe("unit"); expect(classifyScope("src/a.integration.test.ts")).toBe("integration"); expect(classifyScope("e2e/a.spec.ts")).toBe("e2e"); });
  it("폴더 계층과 무관하게 모든 component 공개 계약은 unit 후보다", () => {
    const dir = temp();
    write(path.join(dir, "src/client/components/molecules/A.tsx"), "export const A = () => null;\n");
    write(path.join(dir, "src/client/components/organisms/B.tsx"), "export const B = () => null;\n");
    expect(requiredScopes(["src/client/components/molecules/A.tsx"], dir)).toEqual(["unit"]);
    expect(requiredScopes(["src/client/components/organisms/B.tsx"], dir)).toEqual(["unit"]);
  });
  it("client integration은 폴더명이 아니라 실제 상태·HTTP 경계 import로 요구한다", () => {
    const dir = temp();
    write(path.join(dir, "src/ui/Search.tsx"), `import useSWR from "swr"; export const Search = () => useSWR("/api/search");\n`);
    expect(requiredScopePolicy(["src/ui/Search.tsx"], dir)).toEqual({
      requiredScopes: ["integration", "unit"],
      reasons: { unit: "변경된 공개 계약을 격리해 검증", integration: "실제 client HTTP 경계 변경" },
    });
  });
  it("server integration은 경로가 아니라 의존 그래프의 Mongoose 경계로 요구한다", () => {
    const dir = temp();
    write(path.join(dir, "src/features/save.ts"), `import { Product } from "./product"; export const save = Product.create;\n`);
    write(path.join(dir, "src/features/product.ts"), `import mongoose from "mongoose"; export const Product = mongoose.model("Product", new mongoose.Schema({}));\n`);
    expect(requiredScopes(["src/features/save.ts"], dir)).toEqual(["integration", "unit"]);
  });
  it("integration 실행 프로젝트는 atomic 폴더가 아니라 테스트 runtime 경계로 선택한다", () => {
    const dir = temp();
    write(path.join(dir, "src/anything/ui.integration.test.tsx"), `import { render } from "@testing-library/react";\n`);
    write(path.join(dir, "src/anything/db.integration.test.ts"), `import mongoose from "mongoose";\n`);
    expect(projectFor(dir, "src/anything/ui.integration.test.tsx", "integration")).toBe("integration-client");
    expect(projectFor(dir, "src/anything/db.integration.test.ts", "integration")).toBe("integration-server");
  });
  it("HEAD 변경을 검출한다", () => { const dir = repo(); const before = head(dir); write(path.join(dir, "new"), "x"); execFileSync("git", ["add", "new"], { cwd: dir }); execFileSync("git", ["commit", "-qm", "next"], { cwd: dir }); expect(head(dir)).not.toBe(before); });
  it("제품 변경 시 hash가 바뀐다", () => { const dir = repo(); const before = diffHash(dir, ["src/value.ts"]); write(path.join(dir, "src/value.ts"), "export const value = 2;\n"); expect(diffHash(dir, ["src/value.ts"])).not.toBe(before); });
  it("설정 변경 시 hash가 바뀐다", () => { const dir = repo(); const before = configHash(dir); write(path.join(dir, "vitest.config.ts"), "changed"); expect(configHash(dir)).not.toBe(before); });
  it("proof를 OS 상태 경로에 쓰고 무효화한다", () => { const dir = repo(); writeProof(dir, { state: "RED_PROVEN[unit]" }); expect(readProof(dir).state).toContain("RED"); invalidate(dir); expect(readProof(dir)).toBeNull(); });
  it("Claude Write schema에서 파일을 읽는다", () => expect(extractFiles({ tool_input: { file_path: "src/a.ts" } })).toEqual(["src/a.ts"]));
  it("Codex apply_patch 공식 command 대상만 안전하게 읽는다", () => expect(extractFiles({ tool_input: { command: "*** Update File: src/a.ts\n*** Add File: ../escape.ts" } })).toEqual(["src/a.ts"]));
});

describe("필수 Guard 상태 전이", () => {
  const state = (overrides = {}) => ({
    changed: ["src/value.test.ts"], tests: ["src/value.test.ts"], product: [],
    head: "head-1", productHash: "product-1", testHash: "test-1", configHash: "config-1", sessionBinding: "session-1",
    requiredScopes: ["unit"], ...overrides,
  });
  const red = () => redProof(state(), {
    scope: "unit", sessionId: "session-1", failedTestIds: ["value changes"],
    allowedProductFiles: ["src/value.ts"], createdAt: "2026-08-10T00:00:00.000Z",
  });

  it("대응 테스트가 없으면 resolver가 빈 배열을 반환한다", () => {
    const dir = repo();
    expect(resolveTests(dir, "src/value.ts")).toEqual([]);
  });
  it("이동으로 삭제된 tracked 테스트는 건너뛰고 새 경로를 연결한다", () => {
    const dir = repo();
    write(path.join(dir, "scripts/old.mjs"), "export const value = 1;\n");
    write(path.join(dir, "scripts/old.test.mjs"), `import { value } from "./old.mjs";\n`);
    execFileSync("git", ["add", "scripts/old.mjs", "scripts/old.test.mjs"], { cwd: dir });
    execFileSync("git", ["commit", "-qm", "add scripts"], { cwd: dir });
    fs.renameSync(path.join(dir, "scripts/old.mjs"), path.join(dir, "scripts/new.mjs"));
    fs.renameSync(path.join(dir, "scripts/old.test.mjs"), path.join(dir, "scripts/new.test.mjs"));
    write(path.join(dir, "scripts/new.test.mjs"), `import { value } from "./new.mjs";\n`);

    expect(resolveTests(dir, "scripts/new.mjs")).toEqual(["scripts/new.test.mjs"]);
  });
  it("신규 assertion 실패만 Red로 인정한다", () => {
    expect(newRedFailures(
      { passed: false, environmentError: false, failedTests: ["new assertion"] },
      { environmentError: false, failedTests: [] },
    )).toEqual(["new assertion"]);
  });
  it("syntax/import/config/timeout 오류를 Red로 인정하지 않는다", () => {
    expect(() => newRedFailures(
      { passed: false, environmentError: true, failedTests: [] },
      { environmentError: false, failedTests: [] },
    )).toThrow(/environment/);
  });
  it("기존 실패 재사용을 Red로 인정하지 않는다", () => {
    expect(() => newRedFailures(
      { passed: false, environmentError: false, failedTests: ["old failure"] },
      { environmentError: false, failedTests: ["old failure"] },
    )).toThrow(/existing failures/);
  });
  it("테스트 import에서 허용 제품 파일을 계산한다", () => {
    const dir = repo();
    write(path.join(dir, "src/value.test.ts"), `import { value } from "./value";`);
    expect(resolveSources(dir, ["src/value.test.ts"])).toEqual(["src/value.ts"]);
  });
  it("Red 이후 허용 제품 변경은 IMPLEMENTING으로 전이한다", () => {
    expect(implementingProof(red(), state({ product: ["src/value.ts"], productHash: "product-2" }))).toMatchObject({ state: "IMPLEMENTING", productHash: "product-2" });
  });
  it("테스트 변경은 proof를 무효화한다", () => {
    expect(proofValidity(red(), state({ testHash: "test-2" }))).toMatchObject({ valid: false, reason: "testHash changed" });
  });
  it("Git HEAD/session/hash 변경은 proof를 무효화한다", () => {
    expect(proofValidity(red(), state({ head: "head-2" }))).toMatchObject({ valid: false, reason: "head changed" });
    expect(proofValidity(red(), state({ configHash: "config-2" }))).toMatchObject({ valid: false, reason: "configHash changed" });
    expect(proofValidity(red(), state({ sessionBinding: "session-2" }))).toMatchObject({ valid: false, reason: "sessionBinding changed" });
  });
  it("범위 밖 파일은 allowedProductFiles에 포함되지 않는다", () => {
    expect(red().allowedProductFiles).not.toContain("src/outside.ts");
  });
  it("scope별 Green은 선행 Red가 있어야 생성된다", () => {
    expect(greenProof(red(), state({ productHash: "product-2" }), "unit", "now")).toMatchObject({ state: "GREEN_PROVEN[unit]", greenScopes: ["unit"] });
    expect(() => greenProof(red(), state(), "integration", "now")).toThrow(/RED_PROVEN/);
  });
  it("Green proof 이후 변경은 무효화한다", () => {
    const green = greenProof(red(), state({ productHash: "product-2" }), "unit", "now");
    expect(proofValidity(green, state({ productHash: "product-3" }))).toMatchObject({ valid: false, reason: "productHash changed" });
  });
  it("survived mutant는 검증을 차단하고 killed mutant는 mutation proof를 만든다", () => {
    const green = greenProof(red(), state({ productHash: "product-2" }), "unit", "now");
    expect(() => mutationProof(green, { proven: false, killed: 1, survived: 1 }, "now")).toThrow(/survived/);
    expect(mutationProof(green, { proven: true, killed: 1, survived: 0 }, "now")).toMatchObject({ state: "MUTATION_PROVEN" });
  });
  it("모든 required scope와 mutation이 통과하면 VERIFIED다", () => {
    const green = greenProof(red(), state({ productHash: "product-2" }), "unit", "now");
    const mutated = mutationProof(green, { proven: true, killed: 1, survived: 0 }, "now");
    expect(verifiedProof(mutated, "now")).toMatchObject({ state: "VERIFIED" });
  });
  it("실제 Stryker JSON에서 killed/survived를 구분한다", () => {
    const dir = temp();
    write(path.join(dir, "reports/mutation/mutation.json"), JSON.stringify({ files: { "src/value.ts": { mutants: [{ status: "Killed" }] } } }));
    expect(mutationStatus(dir)).toMatchObject({ proven: true, killed: 1, survived: 0 });
  });
});

describe("exceptions", () => {
  it("유효 예외는 지정 범위만 허용한다", () => { const dir = temp(); write(path.join(dir, "tdd-exceptions.json"), JSON.stringify([{ id: "TDD-EX-001", paths: ["src/generated/**"], rules: ["test-not-required"], owner: "team", reason: "generated fixture", expiresAt: "2026-08-20T00:00:00.000Z" }])); const entries = loadExceptions(dir, new Date("2026-08-10T00:00:00.000Z")); expect(exceptionAllows(entries, "src/generated/a.ts", "test-not-required")).toBe(true); expect(exceptionAllows(entries, "src/a.ts", "test-not-required")).toBe(false); });
  it("만료 예외를 차단한다", () => { const dir = temp(); write(path.join(dir, "tdd-exceptions.json"), JSON.stringify([{ id: "TDD-EX-001", paths: ["src/a.ts"], rules: ["test-not-required"], owner: "team", reason: "temporary", expiresAt: "2026-08-09T00:00:00.000Z" }])); expect(() => loadExceptions(dir, new Date("2026-08-10T00:00:00.000Z"))).toThrow(/expired/); });
  it("30일 초과 예외를 차단한다", () => { const dir = temp(); write(path.join(dir, "tdd-exceptions.json"), JSON.stringify([{ id: "TDD-EX-001", paths: ["src/a.ts"], rules: ["test-not-required"], owner: "team", reason: "too broad", expiresAt: "2026-10-10T00:00:00.000Z" }])); expect(() => loadExceptions(dir, new Date("2026-08-10T00:00:00.000Z"))).toThrow(/30 days/); });
});
