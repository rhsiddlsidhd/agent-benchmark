import { existsSync } from "node:fs";
import { globSync } from "glob";

const SOURCE_EXTENSIONS = ["ts", "tsx"];

/**
 * 테스트 파일 경로에서 그 테스트가 겨냥한 소스 파일 경로를 역산한다.
 *
 * `.test` 앞에 한정 접미사가 붙는 경우(`page.integration.test.ts`,
 * `ProductEditDialog.quantityImages.test.tsx`)와 소스 파일명 자체에 점이 든 경우
 * (`auth.service.test.ts`)를 문자열 규칙만으로는 구분할 수 없다 — 후보를 만들어
 * 실제 존재하는 파일을 고른다. 확장자도 교차 확인한다(`.test.ts`가 `.tsx` 소스를
 * 겨냥하는 경우가 있다).
 *
 * @param {string} testFile
 * @returns {string | null} 대응하는 소스 파일 경로. 못 찾으면 null.
 */
const resolveSourceFile = (testFile) => {
  const withoutTest = testFile.replace(/\.test\.(ts|tsx)$/, "");
  const bases = [withoutTest, withoutTest.replace(/\.[^./]+$/, "")];

  for (const base of bases) {
    for (const extension of SOURCE_EXTENSIONS) {
      const candidate = `${base}.${extension}`;
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
};

/**
 * `.test.ts(x)`가 실제로 존재하는 소스 파일 목록.
 *
 * 커버리지 게이트(`vitest.config.ts`)와 mutation 대상(`stryker.config.mjs`)이
 * 같은 스코프를 쓰도록 이 한 곳에서 만든다 — 배럴 import 캐스케이드로 우연히
 * 로드된 무관한 레거시 파일까지 게이트에 걸리는 걸 막는 것이 목적이다.
 *
 * @type {string[]}
 */
export const testedSourceFiles = globSync("src/**/*.test.{ts,tsx}")
  .map(resolveSourceFile)
  .filter((sourceFile) => sourceFile !== null);

/**
 * 파일 경로를 글롭 패턴 자리에 넣기 전에 Next.js 라우트 규약 문자를 이스케이프한다.
 *
 * vitest는 `coverage.include`를 tinyglobby로 순회하는데, `(main)`/`[id]` 같은
 * 세그먼트가 든 경로를 그대로 패턴으로 주면 글롭 문법으로 해석돼 매칭에 실패하고
 * 그 파일이 조용히 커버리지 집계에서 빠진다(리포트 `0/0/0/0`, 게이트는 exit 0).
 *
 * @param {string} filePath
 * @returns {string}
 */
export const escapeGlobPath = (filePath) => filePath.replace(/[()[\]{}]/g, "\\$&");
