const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const REPO_ROOT = path.join(__dirname, "../..");

function ping(baseUrl) {
  return new Promise((resolve) => {
    const req = http.get(baseUrl, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForReady(baseUrl, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await ping(baseUrl)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/**
 * 이미 떠있는 dev 서버가 있으면 그대로 재사용, 없으면 직접 기동한다.
 * 반환된 stop()은 우리가 직접 띄웠을 때만 실제로 프로세스를 종료한다.
 */
async function ensureDevServer(baseUrl) {
  if (await ping(baseUrl)) {
    console.log(`[server] 이미 떠있는 dev 서버 재사용: ${baseUrl}`);
    return { startedByScript: false, stop: async () => {} };
  }

  console.log("[server] dev 서버 기동 중 (next dev --turbopack)...");
  const child = spawn(path.join(REPO_ROOT, "node_modules/.bin/next"), ["dev", "--turbopack"], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: "pipe",
    env: process.env,
  });

  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});

  const ready = await waitForReady(baseUrl, 60000);
  if (!ready) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {}
    throw new Error("dev 서버가 60초 안에 준비되지 않음");
  }
  console.log("[server] dev 서버 준비 완료");

  return {
    startedByScript: true,
    stop: async () => {
      console.log("[server] dev 서버 종료 중...");
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    },
  };
}

module.exports = { ensureDevServer };
