#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        i++;
        if (glob[i + 1] === "/") {
          // "**/"는 "디렉토리 세그먼트 0개 이상"이다. ".*"로 펴면 경계를
          // 잃어 "**/index.ts"가 "myindex.ts"까지 잡아 게이트가 뚫린다.
          i++;
          re += "(?:[^/]*/)*";
        } else {
          re += ".*";
        }
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

// 종료코드 2가 Claude Code의 유일한 "차단" 신호다. 그 외 코드는 경고만 남고
// 도구 호출이 그대로 진행된다.
function block(lines) {
  const sep = "━".repeat(40);
  process.stderr.write(`\n${sep}\n${lines.join("\n")}\n${sep}\n`);
  process.exit(2);
}

const projectDir = path.resolve(__dirname, "..", "..");

function loadExcludeGlobs() {
  // 프로젝트 루트에 둔다 — 이 훅뿐 아니라 vitest.config.ts의 coverage.exclude도
  // 같은 목록을 읽는다. .claude/hooks/ 아래 두면 훅 전용처럼 보인다.
  const excludeListPath = path.join(projectDir, "test-scope-exclude.json");

  // 제외목록을 못 읽으면 통과가 아니라 차단이다. 여기서 throw하면 종료코드가
  // 1이 되는데 Claude Code는 2만 차단으로 취급한다 — 즉 목록 파일 하나가
  // 깨지는 순간 TDD 게이트가 조용히 꺼진다.
  let globs;
  try {
    globs = JSON.parse(fs.readFileSync(excludeListPath, "utf8"));
  } catch (err) {
    block([
      `⚠️  TDD 훅 오류 — 제외목록을 읽을 수 없음`,
      `   ${excludeListPath}`,
      `   ${err.message}`,
      `   목록을 고치기 전까지 src 수정을 차단한다.`,
    ]);
  }
  if (!Array.isArray(globs) || globs.some((g) => typeof g !== "string")) {
    block([
      `⚠️  TDD 훅 오류 — 제외목록이 문자열 배열이 아님`,
      `   ${excludeListPath}`,
      `   목록을 고치기 전까지 src 수정을 차단한다.`,
    ]);
  }
  return globs;
}

// 절대경로든 상대경로든 projectDir 기준 POSIX 상대경로로 정규화한다.
// CLAUDE_PROJECT_DIR는 세션을 어디서 띄웠는지에 따라 달라진다(레포 루트는
// tie-knot의 부모인 agent-benchmark다) — projectDir을 훅 파일 위치로 고정해야
// 어느 디렉토리에서 세션을 열어도 relPath가 동일하게 계산된다.
function toRelPath(filePath) {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(projectDir, filePath);
  return path.relative(projectDir, abs).split(path.sep).join("/");
}

// TDD 게이트가 지키는 파일인가 — src 아래 소스이고 테스트 파일 자신은 아님.
function isGuarded(relPath) {
  if (!/^src\/.*\.(ts|tsx)$/.test(relPath)) return false;
  if (/\.test\.(ts|tsx)$/.test(relPath)) return false;
  return true;
}

// 짝 테스트 파일이 없으면 기본 경로를, 있으면(또는 제외 대상이면) null을 준다.
// 실물 mongod에 붙는 테스트는 `*.integration.test.ts(x)`로 짓기 때문에(vitest
// `projects` 셀렉터, docs/TESTING_GUIDELINE.md "파일 네이밍 = 실행 묶음") 두 이름을
// 모두 짝으로 인정한다 — 하나만 보면 services처럼 DB 테스트를 가진 파일이 테스트가
// 아예 없는 것으로 오판된다.
function missingTestFor(relPath, globs) {
  if (globs.some((g) => globToRegExp(g).test(relPath))) return null;

  const extension = relPath.endsWith(".tsx") ? "tsx" : "ts";
  const base = relPath.replace(/\.(ts|tsx)$/, "");
  const candidates = [
    `${base}.test.${extension}`,
    `${base}.integration.test.${extension}`,
  ];

  if (candidates.some((c) => fs.existsSync(path.join(projectDir, c)))) return null;
  return candidates[0];
}

// ── Bash 우회 탐지 ────────────────────────────────────────────────────────
// Write/Edit 훅만으로는 `sed -i`, `cat > f`, `tee` 같은 셸 편집이 그대로
// 통과한다. 명령문 전체를 훑어 "쓰기 대상"만 뽑아 같은 게이트에 태운다.
// 읽기 명령(grep/cat/git diff)은 대상이 안 잡히므로 통과한다.

function stripQuotes(token) {
  return token.replace(/^['"]|['"]$/g, "");
}

function tokenize(segment) {
  const tokens = [];
  const re = /'([^']*)'|"((?:[^"\\]|\\.)*)"|(\S+)/g;
  let m;
  while ((m = re.exec(segment)) !== null) {
    tokens.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  }
  return tokens;
}

function isFlag(token) {
  return token.startsWith("-");
}

// 한 파이프라인 세그먼트에서 파일을 새로 쓰는 대상 경로들을 모은다.
function writeTargetsInSegment(segment) {
  const tokens = tokenize(segment);
  const targets = [];

  // 리다이렉션: `> f`, `>>f`, `cat >f`. `2>&1`, `>&2`는 fd 복제라 대상이 아니다.
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const m = /^\d*(>>?)\|?(.*)$/.exec(t);
    if (!m) continue;
    const rest = m[2];
    if (rest.startsWith("&")) continue;
    if (rest) targets.push(rest);
    else if (tokens[i + 1] && !tokens[i + 1].startsWith("&"))
      targets.push(tokens[++i]);
  }

  const argv = tokens.filter((t) => !/^\d*>>?/.test(t) && !t.startsWith("<"));
  const cmd = path.basename(argv[0] || "");
  const rest = argv.slice(1);
  const operands = rest.filter((t) => !isFlag(t));

  if (cmd === "tee") {
    targets.push(...operands);
  } else if (cmd === "sed" || cmd === "perl" || cmd === "ruby") {
    // 인플레이스 편집일 때만. 첫 operand는 스크립트라 대상에서 뺀다.
    const inPlace = rest.some((t) => /^--in-place/.test(t) || /^-\w*i/.test(t));
    if (inPlace) targets.push(...operands.slice(cmd === "sed" ? 1 : 0));
  } else if (cmd === "mv" || cmd === "cp" || cmd === "install") {
    if (operands.length >= 2) targets.push(operands[operands.length - 1]);
  } else if (cmd === "touch" || cmd === "truncate") {
    targets.push(...operands);
  } else if (cmd === "dd") {
    for (const t of rest) if (t.startsWith("of=")) targets.push(t.slice(3));
  }

  return targets;
}

function bashWriteTargets(command) {
  const targets = [];
  for (const segment of command.split(/\|\||&&|[;\n|&]/)) {
    if (segment.trim()) targets.push(...writeTargetsInSegment(segment));
  }

  const repoDirName = path.basename(projectDir);
  const relPaths = [];
  for (const raw of targets) {
    let rel = toRelPath(stripQuotes(raw));
    // 셸 cwd는 알 수 없다. 레포 루트에서 실행된 경우("tie-knot/src/...")도
    // 같은 relPath로 접히도록 프로젝트 디렉토리명 접두사를 벗긴다.
    if (rel.startsWith(`${repoDirName}/`))
      rel = rel.slice(repoDirName.length + 1);
    if (isGuarded(rel)) relPaths.push(rel);
  }
  return [...new Set(relPaths)];
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
  const toolInput = payload.tool_input || {};

  if (toolName === "Write" || toolName === "Edit") {
    if (!toolInput.file_path) process.exit(0);

    const relPath = toRelPath(toolInput.file_path);
    if (!isGuarded(relPath)) process.exit(0);

    const testPath = missingTestFor(relPath, loadExcludeGlobs());
    if (!testPath) process.exit(0);

    block([
      `❌ TDD 위반 — ${testPath} 없음`,
      `   ${relPath} 수정/작성 전에 테스트부터 작성하세요.`,
      `   Bash 우회 금지. 예외는 자체 판단 말고 사용자에게 물어라.`,
    ]);
  }

  if (toolName === "Bash") {
    if (typeof toolInput.command !== "string") process.exit(0);

    const relPaths = bashWriteTargets(toolInput.command);
    if (relPaths.length === 0) process.exit(0);

    const globs = loadExcludeGlobs();
    const violations = relPaths
      .map((rel) => [rel, missingTestFor(rel, globs)])
      .filter(([, testPath]) => testPath);
    if (violations.length === 0) process.exit(0);

    block([
      `❌ TDD 위반 — Bash로 src 파일을 쓰려 한다`,
      ...violations.map(([rel, testPath]) => `   ${rel} → ${testPath} 없음`),
      `   Write/Edit 훅과 동일한 규칙이다. 테스트부터 작성하세요.`,
      `   예외는 자체 판단 말고 사용자에게 물어라.`,
    ]);
  }

  process.exit(0);
});
