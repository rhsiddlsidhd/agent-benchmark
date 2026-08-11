import { describe, expect, it } from "vitest";
import { escapeGlobPath, testedSourceFiles } from "./tested-source-files.mjs";

describe("테스트 소스 범위", () => {
  it("실제 테스트와 연결된 소스를 수집한다", () => {
    expect(testedSourceFiles).toContain("src/shared/schemas/request/product.schema.ts");
  });

  it("Next.js route segment 문자를 glob에서 이스케이프한다", () => {
    expect(escapeGlobPath("src/app/(main)/preview/[id]/page.tsx"))
      .toBe("src/app/\\(main\\)/preview/\\[id\\]/page.tsx");
  });
});
