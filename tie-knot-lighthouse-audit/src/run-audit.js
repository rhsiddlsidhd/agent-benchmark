const fs = require("fs/promises");
const { execSync } = require("child_process");

const { routes, FORM_FACTORS, NUMBER_OF_RUNS } = require("./config/routes");
const { getCookieHeader } = require("./auth/get-auth-cookie");
const { runLighthouseCli } = require("./lighthouse/run-lighthouse-cli");
const { auditCoupleInfo } = require("./lighthouse/audit-couple-info");
const { medianOfRuns } = require("./report/extract-metrics");
const { loadHistory, hasRecord, saveHistory } = require("./report/history");

const ROLES_NEEDING_COOKIE = ["entry", "user", "admin"];

async function main() {
  const baseUrl = process.env.AUDIT_BASE_URL || "http://localhost:3000";
  const commit =
    process.env.GITHUB_SHA || execSync("git rev-parse HEAD").toString().trim();
  const date = new Date().toISOString();

  const history = await loadHistory();

  const neededRoles = new Set(
    routes.filter((r) => ROLES_NEEDING_COOKIE.includes(r.auth)).map((r) => r.auth),
  );
  const cookieByRole = {};
  for (const role of neededRoles) {
    console.log(`쿠키 발급 중: ${role}`);
    cookieByRole[role] = await getCookieHeader(role, { baseUrl });
  }

  const failed = [];
  let succeeded = 0;
  let skipped = 0;

  for (const route of routes) {
    for (const formFactor of FORM_FACTORS) {
      if (hasRecord(history, { commit, page: route.key, formFactor })) {
        skipped++;
        console.log(`skip (이미 기록됨): ${route.key} [${formFactor}]`);
        continue;
      }

      try {
        const resolvedPath = typeof route.path === "function" ? route.path() : route.path;
        const lhrList = [];
        for (let i = 0; i < NUMBER_OF_RUNS; i++) {
          if (route.auth === "couple-info") {
            lhrList.push(await auditCoupleInfo({ baseUrl, formFactor }));
          } else {
            const cookieHeader =
              route.auth === "none" ? undefined : cookieByRole[route.auth];
            lhrList.push(
              await runLighthouseCli(`${baseUrl}${resolvedPath}`, {
                formFactor,
                cookieHeader,
              }),
            );
          }
        }

        const { scores, webVitals, lighthouseVersion } = medianOfRuns(lhrList);
        history.push({
          date,
          commit,
          page: route.key,
          formFactor,
          status: "success",
          scores,
          webVitals,
          lighthouseVersion,
        });
        succeeded++;
        console.log(`완료: ${route.key} [${formFactor}]`);
      } catch (e) {
        failed.push(`${route.key} (${formFactor})`);
        console.error(`::warning::${route.key} [${formFactor}] 감사 실패 — ${e.message}`);
        history.push({
          date,
          commit,
          page: route.key,
          formFactor,
          status: "failed",
          error: e.message,
          scores: null,
          webVitals: null,
          lighthouseVersion: null,
        });
      }
    }
  }

  await saveHistory(history);

  console.log(
    `\n요약: 성공 ${succeeded}건, 스킵 ${skipped}건, 실패 ${failed.length}건`,
  );
  if (failed.length) console.log(`실패 목록: ${failed.join(", ")}`);

  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(
      process.env.GITHUB_OUTPUT,
      `failed=${failed.join(", ")}\nfailed_count=${failed.length}\n`,
      "utf8",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
