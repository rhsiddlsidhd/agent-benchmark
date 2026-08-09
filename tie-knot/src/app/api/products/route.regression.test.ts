// @vitest-environment node
//
// feat/product-search 회귀 스모크 — 이번 기능이 product.service.ts에
// escapeRegExp/findProductCategoriesByTerm/findSubCategoriesByTerm import와
// searchProductsService를 추가하면서, 바로 옆에 있는 기존
// getAllProductsService(및 그걸 감싸는 이 route.ts)의 동작을 건드리지
// 않았는지 실제 DB를 관통해 확인한다. 이 route.ts는 지금까지 route 레벨
// 테스트가 없었다(docs/TESTING_GUIDELINE.md 상 서비스 레이어가 이미
// getAllProductsService를 커버해 후순위였음) — 이번 기능 변경 범위에
// 인접한 파일이라 최소 스모크만 추가한다.
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildProductInput } from "@/test/factories/product.factory";
import { createProductService } from "@/server/services";
import { GET } from "./route";

const buildRequest = (query: string) =>
  new NextRequest(`http://localhost/api/products${query}`);

describe("GET /api/products — 회귀 스모크 (feat/product-search 병합 후 기존 카테고리 필터 동작 확인)", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("category 파라미터 없이 호출하면 전체 상품을 반환한다", async () => {
    await createProductService(buildProductInput({ title: "상품1" }));
    await createProductService(buildProductInput({ title: "상품2" }));

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it("category=invitation으로 필터링하면 해당 카테고리 상품만 반환한다 (완전일치 — 검색 기능의 부분일치와 무관하게 동작 유지)", async () => {
    await createProductService(
      buildProductInput({ title: "상품1", category: "invitation" }),
    );

    const res = await GET(buildRequest("?category=invitation"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].category).toBe("invitation");
  });

  it("존재하지 않는 category로 필터링하면 빈 배열을 반환한다 (에러 아님)", async () => {
    await createProductService(buildProductInput({ title: "상품1" }));

    const res = await GET(buildRequest("?category=nonexistent"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });
});
