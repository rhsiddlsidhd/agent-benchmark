#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
        if (glob[i + 1] === "/") i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if (".+^${}()|[]\\".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp("^" + re + "$");
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const toolName = payload.tool_name;
  if (toolName !== "Write" && toolName !== "Edit") process.exit(0);

  const filePath = payload.tool_input && payload.tool_input.file_path;
  if (!filePath) process.exit(0);

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const relPath = path
    .relative(projectDir, filePath)
    .split(path.sep)
    .join("/");

  if (!/^src\/.*\.(ts|tsx)$/.test(relPath)) process.exit(0);
  if (/\.test\.(ts|tsx)$/.test(relPath)) process.exit(0);

  const excludeListPath = path.join(
    projectDir,
    ".claude/hooks/test-scope-exclude.json",
  );
  const globs = JSON.parse(fs.readFileSync(excludeListPath, "utf8"));

  if (globs.some((g) => globToRegExp(g).test(relPath))) process.exit(0);

  const testPath = relPath.endsWith(".tsx")
    ? relPath.replace(/\.tsx$/, ".test.tsx")
    : relPath.replace(/\.ts$/, ".test.ts");

  const testAbsPath = path.join(projectDir, testPath);
  if (fs.existsSync(testAbsPath)) process.exit(0);

  const sep = "━".repeat(40);
  process.stderr.write(`\n${sep}\n`);
  process.stderr.write(`❌ TDD 위반 — ${testPath} 없음\n`);
  process.stderr.write(`   ${relPath} 수정/작성 전에 테스트부터 작성하세요.\n`);
  process.stderr.write(`${sep}\n`);
  process.exit(2);
});
