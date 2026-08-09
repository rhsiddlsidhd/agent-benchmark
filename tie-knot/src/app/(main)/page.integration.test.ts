// @vitest-environment node
//
// 이 프로젝트에 app router page.tsx를 직접 렌더링해서 테스트하는 선례는
// 없다. 이 파일은 route.integration.test.ts(app/api/products/search)와
// 같은 원리를 쓴다 — 실제 mongodb-memory-server DB를 관통시켜 page.tsx가
// 리턴하는 React 엘리먼트의 props를 검사한다. 렌더링은 하지 않는다: JSX는
// 함수 호출이 아니라 엘리먼트 서술자라, `<HomeTemplate ... />`를 await한
// 시점엔 HomeTemplate/EcommerceHero/TemplateCarouselGroup 등 하위 컴포넌트
// 바디가 전혀 실행되지 않는다 — 그래서 이 파일은 jsdom도, 하위 organism
// mock도 필요 없다("@vitest-environment node").
//
// 검증 대상(04_integration_report.md §6 인계 사항):
// 1. 골든패스 — DB → getPopularProductsService(실제 aggregate) → page.tsx →
//    HomeTemplate에 전달되는 popularProducts prop이 실제 정렬 결과와 일치.
// 2. 에러 흐름 — getPopularProductsService가 throw할 때 page.tsx의
//    `.catch(() => [])`가 실제로 흡수해서 page() 자체가 reject하지 않는지
//    (01_api_contract.md §3, §4의 계약을 실행으로 확인).
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { buildProductInput, clearCollections } from "@/test";
import { ProductModel } from "@/server/models";
import { POPULAR_PRODUCTS_LIMIT } from "@/shared/constants";

// getPopularProductsService만 vi.fn으로 감싸 개별 테스트에서 override할 수
// 있게 하고, 기본 동작은 실제 구현(actual)을 그대로 위임한다 — 그 외
// createProductService/updateProductLikeService/getFeaturedTemplatesService/
// getProductService는 실제 구현 그대로(spread) 둔다.
vi.mock("@/server/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/services")>();
  return {
    ...actual,
    getPopularProductsService: vi.fn(actual.getPopularProductsService),
  };
});

import {
  createProductService,
  updateProductLikeService,
  getPopularProductsService,
} from "@/server/services";
import page from "./page";

// product.service.test.ts / PopularProductsSection.integration.test.tsx와 동일한 헬퍼.
const likeNTimes = async (productId: string, n: number) => {
  for (let i = 0; i < n; i++) {
    await updateProductLikeService(
      productId,
      new mongoose.Types.ObjectId().toString(),
    );
  }
};

describe("(main)/page — 통합(DB~page.tsx 데이터 배선)", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
    vi.mocked(getPopularProductsService).mockClear();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("골든패스: DB에 좋아요 상품을 시딩하면 실제 getPopularProductsService 결과가 그대로 HomeTemplate의 popularProducts prop으로 전달된다", async () => {
    await createProductService(buildProductInput({ title: "1위" }));
    await createProductService(buildProductInput({ title: "2위" }));
    await createProductService(buildProductInput({ title: "3위" }));
    await createProductService(buildProductInput({ title: "4위" }));
    const p1 = await ProductModel.findOne({ title: "1위" }).lean();
    const p2 = await ProductModel.findOne({ title: "2위" }).lean();
    const p3 = await ProductModel.findOne({ title: "3위" }).lean();
    const p4 = await ProductModel.findOne({ title: "4위" }).lean();

    await likeNTimes(p1!._id.toString(), 4);
    await likeNTimes(p2!._id.toString(), 3);
    await likeNTimes(p3!._id.toString(), 2);
    await likeNTimes(p4!._id.toString(), 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = (await page()) as any;

    expect(
      element.props.popularProducts.map((p: { title: string }) => p.title),
    ).toEqual(["1위", "2위", "3위", "4위"]);
    // ISR 공유 캐시(revalidate=3600)라 userId를 넘기지 않는다 — 항상 isLiked: false
    // (01_api_contract.md §3, 01_ui_flow.md §1.1).
    expect(
      element.props.popularProducts.every(
        (p: { isLiked: boolean }) => p.isLiked === false,
      ),
    ).toBe(true);
    // page.tsx가 POPULAR_PRODUCTS_LIMIT을 명시적으로 넘겨 호출하는 배선 확인.
    expect(getPopularProductsService).toHaveBeenCalledWith(POPULAR_PRODUCTS_LIMIT);
  });

  it("에러 흐름: getPopularProductsService가 throw해도 page()는 reject하지 않고 popularProducts가 빈 배열로 흡수된다 (.catch(() => []))", async () => {
    vi.mocked(getPopularProductsService).mockRejectedValueOnce(
      new Error("DB 커넥션 실패 시뮬레이션"),
    );

    // reject가 흡수되지 않으면 이 await 자체가 던지면서 테스트가 실패한다 —
    // 즉 "Home 전체가 죽지 않는다"는 이 await가 정상 resolve된다는 사실 자체로 증명된다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = (await page()) as any;

    expect(element.props.popularProducts).toEqual([]);
  });
});
