const fs = require("fs");
const path = require("path");

const { loadEnv } = require("./env");
loadEnv();

const { ensureDevServer } = require("./server");
const { buildChecks } = require("./checks");
const { envelopeFor, loadDataSchemas } = require("./schemas");

const OUTPUT_DIR = path.join(__dirname, "output");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function getCookieHeaderSafe() {
  try {
    const { getCookieHeader } = require("../lighthouse-audit/get-auth-cookie");
    return await getCookieHeader("user", { baseUrl: BASE_URL });
  } catch (e) {
    console.warn(`[login] 로그인 실패, 인증 없이 진행: ${e.message}`);
    return null;
  }
}

async function runCheck(check, cookieHeader, dataSchemas) {
  const url = `${BASE_URL}${check.path}`;
  const headers = check.auth && cookieHeader ? { Cookie: cookieHeader } : {};

  const started = Date.now();
  let httpStatus = null;
  let json = null;
  let networkError = null;

  try {
    const res = await fetch(url, { method: check.method, headers });
    httpStatus = res.status;
    json = await res.json();
  } catch (e) {
    networkError = e.message;
  }
  const elapsedMs = Date.now() - started;

  if (networkError) {
    return {
      ...check,
      url,
      httpStatus,
      elapsedMs,
      result: "NETWORK_ERROR",
      detail: networkError,
    };
  }

  const dataSchema = dataSchemas[check.schemaKey];
  const envelope = envelopeFor(dataSchema);
  const parsed = envelope.safeParse(json);

  if (!parsed.success) {
    return {
      ...check,
      url,
      httpStatus,
      elapsedMs,
      result: "SCHEMA_MISMATCH",
      detail: parsed.error.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      ),
      rawSuccess: json && json.success,
      rawError: json && json.success === false ? json.error : undefined,
    };
  }

  if (parsed.data.success === false) {
    return {
      ...check,
      url,
      httpStatus,
      elapsedMs,
      result: "API_ERROR",
      detail: `${parsed.data.error.code} ${parsed.data.error.message}`,
    };
  }

  if (check.extraAssert) {
    const assertError = check.extraAssert(parsed.data.data);
    if (assertError) {
      return {
        ...check,
        url,
        httpStatus,
        elapsedMs,
        result: "ASSERT_FAIL",
        detail: assertError,
      };
    }
  }

  return {
    ...check,
    url,
    httpStatus,
    elapsedMs,
    result: "OK",
    dataPreview: summarize(parsed.data.data),
  };
}

function summarize(data) {
  if (Array.isArray(data)) return `array(${data.length})`;
  if (data && typeof data === "object") return `object{${Object.keys(data).join(",")}}`;
  return String(data);
}

function printResult(r) {
  const icon =
    r.result === "OK" ? "PASS" : r.result === "API_ERROR" ? "API_ERR" : "FAIL";
  console.log(`[${icon}] ${r.method} ${r.path}  (${r.httpStatus ?? "-"}, ${r.elapsedMs}ms)`);
  if (r.result === "OK") {
    console.log(`       데이터 shape: ${r.dataPreview}`);
  } else if (r.result === "API_ERROR") {
    console.log(`       API 에러 응답: ${r.detail}`);
  } else {
    const detail = Array.isArray(r.detail) ? r.detail.join(" / ") : r.detail;
    console.log(`       ${r.result}: ${detail}`);
  }
  if (r.note) console.log(`       note: ${r.note}`);
}

async function main() {
  const server = await ensureDevServer(BASE_URL);

  try {
    const env = process.env;
    if (!env.NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID) {
      console.warn(
        "[warn] NEXT_PUBLIC_MAIN_PREVIEW_INFO_ID 없음 — couple-info/guestbook 체크는 실패할 가능성 높음",
      );
    }

    console.log("[login] 테스트 유저로 로그인 중...");
    const cookieHeader = await getCookieHeaderSafe();
    console.log(cookieHeader ? "[login] 세션 쿠키 확보함" : "[login] 세션 쿠키 없음");
    console.log();

    const dataSchemas = await loadDataSchemas();
    const checks = buildChecks(env);
    const results = [];
    for (const check of checks) {
      const r = await runCheck(check, cookieHeader, dataSchemas);
      printResult(r);
      results.push(r);
    }

    const summary = {
      total: results.length,
      pass: results.filter((r) => r.result === "OK").length,
      apiError: results.filter((r) => r.result === "API_ERROR").length,
      fail: results.filter(
        (r) => !["OK", "API_ERROR"].includes(r.result),
      ).length,
    };

    console.log();
    console.log(
      `=== 요약: ${summary.pass}/${summary.total} 통과, API 에러 ${summary.apiError}건, 검증 실패 ${summary.fail}건 ===`,
    );

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportPath = path.join(OUTPUT_DIR, `api-verify-${timestamp}.json`);
    fs.writeFileSync(
      reportPath,
      JSON.stringify({ generatedAt: new Date().toISOString(), summary, results }, null, 2),
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "latest.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), summary, results }, null, 2),
    );
    console.log(`데이터 저장: ${path.relative(process.cwd(), reportPath)}`);

    process.exitCode = summary.fail > 0 ? 1 : 0;
  } finally {
    await server.stop();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
