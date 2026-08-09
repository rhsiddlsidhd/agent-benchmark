const { execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const execFileAsync = promisify(execFile);

/**
 * plain `lighthouse` CLI를 한 번 실행하고 결과 lhr JSON을 반환한다.
 * 쿠키가 필요한 라우트는 extraHeaders로 Cookie 헤더만 실어 보낸다
 * (sessionStorage가 필요한 /couple-info는 이 경로를 안 타고 audit-couple-info.js를 씀).
 */
async function runLighthouseCli(url, { formFactor, cookieHeader }) {
  const outputPath = path.join(
    os.tmpdir(),
    `lh-${crypto.randomUUID()}.json`,
  );

  const args = [
    "lighthouse",
    url,
    "--output=json",
    `--output-path=${outputPath}`,
    "--chrome-flags=--headless --no-sandbox",
    "--quiet",
  ];

  if (formFactor === "desktop") {
    args.push("--preset=desktop");
  }

  if (cookieHeader) {
    args.push(`--extra-headers=${JSON.stringify({ Cookie: cookieHeader })}`);
  }

  if (process.env.CHROME_PATH) {
    args.push(`--chrome-path=${process.env.CHROME_PATH}`);
  }

  try {
    await execFileAsync("npx", args, { maxBuffer: 1024 * 1024 * 20 });
    const raw = await fs.readFile(outputPath, "utf8");
    return JSON.parse(raw);
  } finally {
    await fs.rm(outputPath, { force: true });
  }
}

module.exports = { runLighthouseCli };
