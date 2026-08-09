// @vitest-environment node
//
// route.test.ts(같은 디렉토리)는 searchProductsService를 vi.mock으로 대체한
// 단위 테스트다 — route.ts의 얇은 파싱/응답 wrapping 로직만 검증한다.
// 이 파일은 그 mock을 걷어내고 실제 mongodb-memory-server DB까지 관통시켜서,
// route.ts → searchProductsService → MongoDB → 응답 envelope으로 이어지는
// 골든패스/에러 흐름이 실제로 맞물려 동작하는지를 검증한다(docs/TESTING_GUIDELINE.md
// 의 "route.ts는 얇은 wrapper라 중복"이라는 후순위 원칙은 서비스 단위 로직
// 재검증에는 적용되지만, 여러 레이어를 가로지르는 통합 시나리오에는 해당하지
// 않는다).
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { buildProductInput, clearCollections } from "@/test";
import { createProductService } from "@/server/services";
import { GET } from "./route";

const buildRequest = (query: string) =>
  new NextRequest(`http://localhost/api/products/search${query}`);

describe("GET /api/products/search — 통합(DB~route)", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("골든패스: title 부분일치 검색이 실제 DB를 관통해 매칭 상품만 반환한다", async () => {
    await createProductService(
      buildProductInput({ title: "웨딩청첩장 프리미엄" }),
    );
    await createProductService(buildProductInput({ title: "완전히 다른 제목" }));

    const res = await GET(buildRequest("?q=웨딩"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // 배열 그대로, { items, total } 래핑 없음 (01_api_contract.md §5.1)
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("웨딩청첩장 프리미엄");
  });

  it("골든패스(핵심): '돌잔' 검색이 라벨 부분일치 역조회로 subCategory=first-birthday(라벨 '돌잔치') 상품을 찾는다 — 정확일치였다면 실패했을 케이스", async () => {
    await createProductService(
      buildProductInput({ title: "무관한 제목1", subCategory: "first-birthday" }),
    );
    await createProductService(
      buildProductInput({ title: "무관한 제목2", subCategory: "wedding" }),
    );

    const res = await GET(buildRequest("?q=돌잔"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].subCategory).toBe("first-birthday");
  });

  it("빈 쿼리(q 파라미터 자체가 없음)는 에러가 아니라 200 + 빈 배열이다 — DB에 매칭 가능한 상품이 있어도 비검색 상태에서는 반환하지 않는다", async () => {
    await createProductService(buildProductInput({ title: "청첩장 상품" }));

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: [] });
  });

  it("공백만 있는 쿼리(q=%20%20)도 undefined와 동일 취급돼 200 + 빈 배열이다", async () => {
    await createProductService(buildProductInput({ title: "청첩장 상품" }));

    const res = await GET(buildRequest("?q=%20%20"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: [] });
  });

  it("q가 101자를 넘으면 400 VALIDATION 에러 shape을 반환하고 DB는 조회되지 않는다", async () => {
    await createProductService(buildProductInput({ title: "가".repeat(101) }));

    const res = await GET(buildRequest(`?q=${"가".repeat(101)}`));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.category).toBe("VALIDATION");
    expect(body.error.fieldErrors?.q).toBeDefined();
    // 검증 실패는 서비스 호출 전에 막혀야 한다 — data 필드 자체가 없어야 한다.
    expect(body.data).toBeUndefined();
  });
});
