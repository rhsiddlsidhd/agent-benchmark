const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "../../src");
const API_DIR = path.join(SRC_DIR, "app/api");
const OUTPUT_DIR = path.join(__dirname, "output");
const OWN_HOSTS = ["tie-knot-pi.vercel.app", "localhost"];

// ---------- 파일 수집 ----------

function walk(dir, exts, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, exts, files);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

function lineOf(content, index) {
  return content.slice(0, index).split("\n").length;
}

// ---------- 내부 라우트 정의 수집 (src/app/api/**/route.ts) ----------

function routePathFromFile(file) {
  const rel = path
    .relative(API_DIR, file)
    .replace(/\\/g, "/")
    .replace(/\/route\.ts$/, "");
  return `/api/${rel}`;
}

function normalizeRoutePath(routePath) {
  return routePath.replace(/\[([^\]]+)\]/g, ":param");
}

function collectRouteDefinitions() {
  const routeFiles = walk(API_DIR, [".ts"]).filter((f) =>
    f.endsWith("route.ts"),
  );
  return routeFiles.map((file) => {
    const content = fs.readFileSync(file, "utf8");
    const methods = [
      ...content.matchAll(/^export const (GET|POST|PUT|PATCH|DELETE)\s*=/gm),
    ].map((m) => m[1]);
    const routePath = routePathFromFile(file);
    return {
      file: path.relative(path.join(__dirname, "../.."), file),
      routePath,
      normalizedPath: normalizeRoutePath(routePath),
      methods,
    };
  });
}

// ---------- 호출부 수집 (fetch / apiRequest / useSWR) ----------

const STRING_LITERAL = `(?:\`[^\`]*\`|'[^']*'|"[^"]*")`;
const CALL_PATTERNS = [
  { kind: "fetch", re: new RegExp(`\\bfetch\\s*\\(\\s*(${STRING_LITERAL})`, "g") },
  {
    kind: "apiRequest",
    re: new RegExp(`\\bapiRequest\\s*(?:<[^>]*>)?\\s*\\(\\s*(${STRING_LITERAL})`, "g"),
  },
  {
    kind: "useSWR",
    re: new RegExp(
      `\\buseSWR\\s*(?:<[^>]*>)?\\s*\\(\\s*(${STRING_LITERAL}|[A-Za-z0-9_$.]+)`,
      "g",
    ),
  },
];

function stripQuotes(raw) {
  return raw.slice(1, -1);
}

function normalizeCallPath(raw) {
  return raw
    .replace(/\$\{[^}]*\}/g, ":param")
    .replace(/\?.*$/, "");
}

function classify(rawPath) {
  if (rawPath.startsWith("/api/")) return "internal";
  if (/^https?:\/\//.test(rawPath)) {
    const host = rawPath.replace(/^https?:\/\//, "").split(/[/?]/)[0];
    if (OWN_HOSTS.some((h) => host.includes(h))) return "internal";
    return "external";
  }
  return "dynamic"; // 변수 등 정적 분석으로 URL 특정 불가
}

// 변수에 담긴 뒤 useSWR/apiRequest에 전달되는 경우 (예: `const swrKey = ... \`/api/x\` ...`)
// — 같은 파일 안에서 그 변수를 대입하는 줄을 찾아 문자열 리터럴을 역추적한다.
function resolveIdentifier(content, ident) {
  const lineRe = new RegExp(
    `\\b${ident.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b\\s*=[^\\n]*`,
  );
  const lineMatch = content.match(lineRe);
  if (!lineMatch) return null;
  const literalMatch = lineMatch[0].match(new RegExp(STRING_LITERAL));
  return literalMatch ? stripQuotes(literalMatch[0]) : null;
}

function collectCallSites() {
  const files = walk(SRC_DIR, [".ts", ".tsx"]).filter(
    (f) => !f.endsWith("CLAUDE.md") && !/[\\/]api[\\/](fetcher|apiRequest)\.ts$/.test(f),
  );
  const calls = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const { kind, re } of CALL_PATTERNS) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(content))) {
        const raw = match[1];
        const isLiteral = /^[`'"]/.test(raw);
        let value = isLiteral ? stripQuotes(raw) : raw;
        let resolvedFrom = null;

        if (!isLiteral) {
          const resolved = resolveIdentifier(content, raw);
          if (resolved) {
            resolvedFrom = value; // 원래 식별자명 보존
            value = resolved;
          }
        }

        const settled = isLiteral || resolvedFrom !== null;
        const type = settled ? classify(value) : "dynamic";
        calls.push({
          kind,
          file: path.relative(path.join(__dirname, "../.."), file),
          line: lineOf(content, match.index),
          raw: value,
          resolvedFrom,
          normalizedPath: settled ? normalizeCallPath(value) : null,
          type,
        });
      }
    }
  }
  return calls;
}

// ---------- fetch 기반이 아닌 외부 연동(SDK/프로토콜) 훑기 ----------

function collectOtherIntegrations() {
  const targets = [
    { dir: "src/lib/nodemailer", desc: "SMTP 메일 발송 (nodemailer)" },
    { dir: "src/lib/cloudinary", desc: "Cloudinary SDK/서명 업로드" },
    { dir: "src/lib/kakao", desc: "Kakao Maps SDK 로더" },
    { dir: "src/lib/mongodb", desc: "MongoDB 커넥션 (DB, HTTP API 아님)" },
  ];
  const result = [];
  for (const { dir, desc } of targets) {
    const abs = path.join(__dirname, "../..", dir);
    if (!fs.existsSync(abs)) continue;
    const files = walk(abs, [".ts", ".tsx"]).filter(
      (f) => !f.endsWith("index.ts") && !f.endsWith("type.ts"),
    );
    result.push({
      dir,
      desc,
      files: files.map((f) => path.relative(path.join(__dirname, "../.."), f)),
    });
  }
  return result;
}

// ---------- 매칭: 정의 vs 호출부 ----------

function buildReport() {
  const routes = collectRouteDefinitions();
  const calls = collectCallSites();
  const otherIntegrations = collectOtherIntegrations();

  const internalCalls = calls.filter((c) => c.type === "internal");
  const externalCalls = calls.filter((c) => c.type === "external");
  const dynamicCalls = calls.filter((c) => c.type === "dynamic");

  const routesWithCalls = routes.map((route) => {
    const matched = internalCalls.filter(
      (c) => c.normalizedPath === route.normalizedPath,
    );
    return { ...route, callCount: matched.length, calls: matched };
  });

  const unusedRoutes = routesWithCalls.filter((r) => r.callCount === 0);

  const matchedNormalizedPaths = new Set(routes.map((r) => r.normalizedPath));
  const unmatchedCalls = internalCalls.filter(
    (c) => !matchedNormalizedPaths.has(c.normalizedPath),
  );

  const externalByHost = {};
  for (const c of externalCalls) {
    const host = c.raw.replace(/^https?:\/\//, "").split(/[/?]/)[0];
    externalByHost[host] = externalByHost[host] || [];
    externalByHost[host].push(c);
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      internalRoutesDefined: routes.length,
      internalRoutesUnused: unusedRoutes.length,
      internalCallSites: internalCalls.length,
      internalCallSitesUnmatched: unmatchedCalls.length,
      externalCallSites: externalCalls.length,
      externalHosts: Object.keys(externalByHost).length,
      dynamicCallSites: dynamicCalls.length,
      otherIntegrations: otherIntegrations.length,
    },
    internalRoutes: routesWithCalls,
    unusedRoutes: unusedRoutes.map((r) => ({
      routePath: r.routePath,
      methods: r.methods,
      file: r.file,
    })),
    unmatchedInternalCalls: unmatchedCalls,
    externalCallSites: externalCalls,
    externalByHost: Object.fromEntries(
      Object.entries(externalByHost).map(([host, list]) => [host, list.length]),
    ),
    dynamicCallSites: dynamicCalls,
    otherIntegrations,
  };
}

// ---------- 콘솔 출력 ----------

function printSummary(report) {
  const s = report.summary;
  console.log("=== API 호출 리포트 ===");
  console.log(`생성 시각: ${report.generatedAt}`);
  console.log();
  console.log(`내부 라우트 정의: ${s.internalRoutesDefined}개 (미사용 후보 ${s.internalRoutesUnused}개)`);
  console.log(`내부 API 호출부: ${s.internalCallSites}건 (매칭 안 되는 호출 ${s.internalCallSitesUnmatched}건)`);
  console.log(`외부 API 호출(fetch 기반): ${s.externalCallSites}건 / 호스트 ${s.externalHosts}개`);
  console.log(`정적 분석 불가(동적 URL): ${s.dynamicCallSites}건`);
  console.log(`fetch 외 외부 연동(SDK/프로토콜): ${s.otherIntegrations}개 영역`);
  console.log();

  console.log("--- 내부 라우트별 호출 횟수 ---");
  for (const r of report.internalRoutes) {
    const methods = r.methods.join(",") || "?";
    console.log(`  [${methods}] ${r.routePath}  →  ${r.callCount}건  (${r.file})`);
  }
  console.log();

  if (report.unusedRoutes.length) {
    console.log("--- 호출부를 찾지 못한 라우트 (미사용 후보) ---");
    for (const r of report.unusedRoutes) {
      console.log(`  [${r.methods.join(",") || "?"}] ${r.routePath}  (${r.file})`);
    }
    console.log();
  }

  console.log("--- 외부 API 호스트별 호출 ---");
  for (const [host, count] of Object.entries(report.externalByHost)) {
    console.log(`  ${host}: ${count}건`);
  }
  console.log();

  console.log("--- fetch 외 외부 연동 ---");
  for (const i of report.otherIntegrations) {
    console.log(`  ${i.dir} — ${i.desc} (${i.files.length}개 파일)`);
  }
}

// ---------- 실행 ----------

function main() {
  const report = buildReport();

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const timestamp = report.generatedAt.replace(/[:.]/g, "-");
  const timestampedPath = path.join(OUTPUT_DIR, `api-report-${timestamp}.json`);
  const latestPath = path.join(OUTPUT_DIR, "latest.json");

  fs.writeFileSync(timestampedPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));

  printSummary(report);
  console.log();
  console.log(`데이터 저장: ${path.relative(process.cwd(), timestampedPath)}`);
  console.log(`최신본: ${path.relative(process.cwd(), latestPath)}`);
}

main();
