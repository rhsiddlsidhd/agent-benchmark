#!/usr/bin/env node
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeTestQuality } from "../core/analyze-test-quality.mjs";
import { classifyFile, isTestFile, normalizePath } from "../core/classify-file.mjs";
import { classifyScope, requiredScopePolicy } from "../core/classify-scope.mjs";
import { changedFiles, configHash, diffHash, head } from "../core/hash-worktree.mjs";
import { mutationStatus } from "../core/mutation.mjs";
import { shouldGuard } from "../core/policy.mjs";
import { invalidate, readProof, writeProof } from "../core/proof-store.mjs";
import { implementingProof, greenProof, mutationProof, proofValidity, redProof, verifiedProof } from "../core/proof-state.mjs";
import { resolveSources, resolveTests } from "../core/resolve-tests.mjs";
import { runBaseline } from "../core/run-baseline.mjs";
import { runVitest } from "../core/run-vitest.mjs";
import { assertGreen, newRedFailures } from "../core/result-policy.mjs";
import { verifyCiPolicy } from "../core/ci-policy.mjs";

export const root = path.resolve(process.env.TDD_GUARD_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.."));

function snapshot(repo = root) {
  const changed = changedFiles(repo);
  const tests = changed.filter(isTestFile);
  const product = changed.filter((file) => classifyFile(file).guarded);
  const sessionBinding = process.env.TDD_GUARD_SESSION_ID || process.env.CLAUDE_SESSION_ID || process.env.CODEX_THREAD_ID || null;
  const scopePolicy = requiredScopePolicy(product, repo);
  return { changed, tests, product, head: head(repo), productHash: diffHash(repo, product), testHash: diffHash(repo, tests), configHash: configHash(repo), sessionBinding, ...scopePolicy };
}

export function validateProof(repo = root) {
  const proof = readProof(repo);
  return proofValidity(proof, snapshot(repo));
}

function output(value, code = 0) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); process.exitCode = code; }

async function stdinJson() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  try { return input ? JSON.parse(input) : {}; } catch { return {}; }
}

export function extractFiles(payload) {
  const input = payload.tool_input ?? payload.toolInput ?? payload;
  const direct = input.file_path ?? input.filePath ?? input.path;
  if (direct) return [normalizePath(direct.startsWith(root) ? path.relative(root, direct) : direct)];
  const patch = input.command ?? input.patch ?? input.input ?? "";
  return [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)].map((match) => normalizePath(match[1])).filter((file) => !file.includes(".."));
}

export async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "status") return output(validateProof());
  if (command === "invalidate") { invalidate(root); return output({ state: "CLEAN" }); }
  if (command === "classify") return output(args.map((file) => ({
    file,
    ...classifyFile(file),
    testScope: classifyScope(file),
    ...requiredScopePolicy([file], root),
  })));
  if (command === "affected") { const state = snapshot(); return output(Object.fromEntries(state.product.map((file) => [file, resolveTests(root, file)]))); }
  if (command === "pre-edit") {
    const payload = await stdinJson();
    const files = extractFiles(payload);
    const proof = validateProof();
    const payloadSession = payload.session_id ?? payload.sessionId;
    const sessionMismatch = Boolean(payloadSession && proof.proof?.sessionBinding && payloadSession !== proof.proof.sessionBinding);
    const denied = files.filter((file) => shouldGuard(root, file) && (!proof.valid || sessionMismatch || !["RED_PROVEN", "IMPLEMENTING", "GREEN_PROVEN", "MUTATION_PROVEN", "VERIFIED"].some((state) => proof.state.startsWith(state)) || !proof.proof.allowedProductFiles.includes(file)));
    if (denied.length) return output({ permissionDecision: "deny", reason: `TDD Guard: ${denied.join(", ")} 편집 전 테스트를 변경하고 npm run test:red -- --scope <scope>를 실행하세요.` }, 2);
    return output({ permissionDecision: "allow" });
  }
  if (command === "post-edit") {
    const payload = await stdinJson();
    const files = extractFiles(payload);
    if (files.some(isTestFile)) invalidate(root);
    const proof = readProof(root);
    if (proof && files.some((file) => proof.allowedProductFiles.includes(file))) writeProof(root, implementingProof(proof, snapshot()));
    return output(validateProof());
  }
  if (command === "prove-red" || command === "prove-green") {
    const scope = args[args.indexOf("--scope") + 1];
    if (!["unit", "integration"].includes(scope)) return output({ error: "--scope unit|integration required" }, 2);
    const state = snapshot();
    const tests = state.tests.filter((file) => classifyScope(file) === scope);
    if (!tests.length) return output({ error: `changed ${scope} test required` }, 2);
    const quality = tests.map((file) => ({ file, ...analyzeTestQuality(path.join(root, file)) }));
    if (quality.some((item) => !item.valid)) return output({ error: "test quality rejected", quality }, 2);
    const result = runVitest(root, tests, scope);
    const red = command === "prove-red";
    const previous = readProof(root);
    let proof;
    if (red) {
      const baseline = runBaseline(root, tests, scope);
      let newFailures;
      try { newFailures = newRedFailures(result, baseline); }
      catch (error) { return output({ error: error.message, result, baseline }, 2); }
      const allowedProductFiles = resolveSources(root, tests).filter((file) => classifyFile(file).guarded);
      if (!allowedProductFiles.length) return output({ error: "changed tests are not connected to a guarded product module" }, 2);
      proof = redProof({ ...state, previous }, { scope, sessionId: state.sessionBinding ?? previous?.sessionId ?? crypto.randomUUID(), failedTestIds: newFailures, allowedProductFiles, createdAt: new Date().toISOString() });
    } else {
      try { assertGreen(result); proof = greenProof(previous, state, scope, new Date().toISOString()); }
      catch (error) { return output({ error: error.message }, 2); }
    }
    writeProof(root, proof); return output(proof);
  }
  if (command === "verify") {
    if (args.includes("--ci")) {
      try {
        const baseIndex = args.indexOf("--base");
        const result = verifyCiPolicy(root, baseIndex >= 0 ? args[baseIndex + 1] : undefined);
        return output(result, result.valid ? 0 : 2);
      } catch (error) {
        return output({ valid: false, error: error.message }, 2);
      }
    }
    const validity = validateProof();
    const mutation = mutationStatus(root);
    if (!validity.valid) return output({ error: "verification incomplete", validity, mutation }, 2);
    try {
      const mutationProven = mutationProof(validity.proof, mutation, new Date().toISOString());
      writeProof(root, mutationProven);
      const proof = verifiedProof(mutationProven, new Date().toISOString());
      writeProof(root, proof); return output(proof);
    } catch (error) { return output({ error: error.message, validity, mutation }, 2); }
  }
  return output({ error: "usage: guard pre-edit|post-edit|prove-red|prove-green|verify|invalidate|status|classify|affected" }, 2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
