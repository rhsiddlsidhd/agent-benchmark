import { describe, it, expect } from "vitest";
import { productSearchRequestSchema } from "./productSearch.schema";

describe("productSearchRequestSchema", () => {
  it("q가 없으면 undefined로 통과한다", () => {
    const result = productSearchRequestSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBeUndefined();
    }
  });

  it("q가 undefined면 통과한다", () => {
    const result = productSearchRequestSchema.safeParse({ q: undefined });

    expect(result.success).toBe(true);
  });

  it("정상 검색어는 그대로 통과한다", () => {
    const result = productSearchRequestSchema.safeParse({ q: "돌잔치" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("돌잔치");
    }
  });

  it("빈 문자열은 undefined로 정규화된다", () => {
    const result = productSearchRequestSchema.safeParse({ q: "" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBeUndefined();
    }
  });

  it("공백만 있는 문자열은 trim 후 undefined로 정규화된다", () => {
    const result = productSearchRequestSchema.safeParse({ q: "   " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBeUndefined();
    }
  });

  it("앞뒤 공백은 trim된다", () => {
    const result = productSearchRequestSchema.safeParse({ q: "  청첩장  " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("청첩장");
    }
  });

  it("100자는 통과한다 (경계값)", () => {
    const result = productSearchRequestSchema.safeParse({ q: "가".repeat(100) });

    expect(result.success).toBe(true);
  });

  it("101자는 실패한다 (경계값 초과)", () => {
    const result = productSearchRequestSchema.safeParse({ q: "가".repeat(101) });

    expect(result.success).toBe(false);
  });

  it("regex 메타문자가 포함된 검색어도 문자열이면 통과한다 (이스케이프는 서비스 책임)", () => {
    const result = productSearchRequestSchema.safeParse({ q: "a.*b(c)" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("a.*b(c)");
    }
  });

  it("q가 문자열이 아니면 실패한다", () => {
    const result = productSearchRequestSchema.safeParse({ q: 123 });

    expect(result.success).toBe(false);
  });
});
