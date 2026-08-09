import { describe, it, expect } from "vitest";
import { escapeRegExp } from "./escape-regexp";

describe("escapeRegExp", () => {
  it("일반 문자열은 그대로 반환한다", () => {
    expect(escapeRegExp("돌잔치")).toBe("돌잔치");
  });

  it("regex 메타문자를 이스케이프한다", () => {
    expect(escapeRegExp("a.b")).toBe("a\\.b");
    expect(escapeRegExp("a*b")).toBe("a\\*b");
    expect(escapeRegExp("a+b")).toBe("a\\+b");
    expect(escapeRegExp("a?b")).toBe("a\\?b");
    expect(escapeRegExp("a^b")).toBe("a\\^b");
    expect(escapeRegExp("a$b")).toBe("a\\$b");
    expect(escapeRegExp("a{b}")).toBe("a\\{b\\}");
    expect(escapeRegExp("a(b)")).toBe("a\\(b\\)");
    expect(escapeRegExp("a|b")).toBe("a\\|b");
    expect(escapeRegExp("a[b]")).toBe("a\\[b\\]");
    expect(escapeRegExp("a\\b")).toBe("a\\\\b");
  });

  it("이스케이프한 결과를 RegExp 생성자에 넣어도 컴파일 에러가 나지 않는다", () => {
    const malicious = "(a+)+$";

    expect(() => new RegExp(escapeRegExp(malicious))).not.toThrow();
  });

  it("이스케이프한 패턴은 원래 리터럴 문자열에 대해서만 매칭된다", () => {
    const escaped = escapeRegExp("a.b");
    const regex = new RegExp(escaped);

    expect(regex.test("a.b")).toBe(true);
    expect(regex.test("axb")).toBe(false);
  });

  it("빈 문자열을 넣으면 빈 문자열을 반환한다", () => {
    expect(escapeRegExp("")).toBe("");
  });
});
