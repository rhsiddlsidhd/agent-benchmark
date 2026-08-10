const fs = require("fs");
const path = require("path");

const projectDir = path.resolve(__dirname, "..");

// 소스 파일이 겨냥하는 짝 테스트. 실물 mongod에 붙는 테스트는
// `*.integration.test.ts(x)`로 짓기 때문에 두 이름을 모두 인정한다.
function pairedTestFor(relPath) {
  const extension = relPath.endsWith(".tsx") ? "tsx" : "ts";
  const base = relPath.replace(/\.(ts|tsx)$/, "");
  return [
    `${base}.test.${extension}`,
    `${base}.integration.test.${extension}`,
  ].find((candidate) => fs.existsSync(path.join(projectDir, candidate)));
}

module.exports = { pairedTestFor };
