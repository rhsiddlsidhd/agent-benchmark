#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const command = process.argv[2];
let input = "";
for await (const chunk of process.stdin) input += chunk;

const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), "../bin/guard.mjs");
const result = spawnSync(process.execPath, [cli, command], { input, encoding: "utf8" });

if (command !== "pre-edit") {
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  process.exit(result.status ?? 2);
}

if (result.status === 0) {
  process.stdout.write("{}\n");
  process.exit(0);
}

let reason;
try { reason = JSON.parse(result.stdout).reason; } catch {}
reason ||= `TDD Guard 실행 오류. 편집을 차단합니다. node scripts/tdd-guard/bin/guard.mjs ${command}를 직접 실행하세요.`;

process.stdout.write(`${JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: reason,
  },
}, null, 2)}\n`);
process.stderr.write(result.stderr || "");
process.exit(0);
