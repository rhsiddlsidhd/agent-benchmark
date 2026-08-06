// PopularProductsSection.test.tsx(같은 디렉토리)는 손으로 만든 Product 객체로
// 렌더링 로직만 검증하는 컴포넌트 단위 테스트다. product.service.test.ts는
// getPopularProductsService의 정렬/tie-break/제외 조건을 서비스 레벨에서
// 실제 DB로 검증한다. 이 파일은 그 둘 사이의 연결부 — 즉 "서비스가 리턴한
// 실제 정렬 결과가 컴포넌트에 그대로, 순서를 바꾸지 않고, rank 배지와 함께
// 렌더되는가" — 를 mongodb-memory-server 시딩으로 검증한다.
//
// 04_integration_report.md §6 필독 검증 함정: dev DB(2건)로는 화면에서
// 이 경로를 구분할 수 없다 — 화면 확인은 증거로 인정하지 않고, 아래처럼
// 실제 시딩 + 자동 테스트만을 근거로 삼는다.
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildProductInput } from "@/test/factories/product.factory";
import { ProductModel } from "@/server/models";
import {
  createProductService,
  deleteProductService,
  getPopularProductsService,
  updateProductLikeService,
} from "@/server/services";
import { PopularProductsSection } from "./PopularProductsSection";

// 좋아요 N개를 만들기 위해 서로 다른 userId N명으로 각각 1회씩 toggle한다
// (product.service.test.ts와 동일한 헬퍼 — updateProductLikeService는 유저
// 1명당 1회 토글이라 이렇게 해야 정확한 개수가 만들어진다).
const likeNTimes = async (productId: string, n: number) => {
  for (let i = 0; i < n; i++) {
    await updateProductLikeService(
      productId,
      new mongoose.Types.ObjectId().toString(),
    );
  }
};

describe("PopularProductsSection — 통합(DB~컴포넌트)", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("골든패스: 좋아요 5/3/3(동점,featured)/2/1로 시딩 + 0개/soft-deleted 섞기 → 실제 서비스 결과가 순서 그대로, rank 배지와 함께 렌더된다", async () => {
    await createProductService(buildProductInput({ title: "1위-글래스민트" }));
    await createProductService(
      buildProductInput({ title: "2위-로즈핑크-featured", isFeatured: true }),
    );
    await createProductService(
      buildProductInput({ title: "3위-선셋오렌지-일반", isFeatured: false }),
    );
    await createProductService(buildProductInput({ title: "4위-라벤더" }));
    await createProductService(buildProductInput({ title: "5위-스카이블루" }));
    await createProductService(buildProductInput({ title: "제외-좋아요없음" }));
    await createProductService(buildProductInput({ title: "제외-소프트삭제" }));

    const first = await ProductModel.findOne({ title: "1위-글래스민트" }).lean();
    const second = await ProductModel.findOne({
      title: "2위-로즈핑크-featured",
    }).lean();
    const third = await ProductModel.findOne({
      title: "3위-선셋오렌지-일반",
    }).lean();
    const fourth = await ProductModel.findOne({ title: "4위-라벤더" }).lean();
    const fifth = await ProductModel.findOne({ title: "5위-스카이블루" }).lean();
    const deleted = await ProductModel.findOne({ title: "제외-소프트삭제" }).lean();

    await likeNTimes(first!._id.toString(), 5);
    await likeNTimes(second!._id.toString(), 3);
    await likeNTimes(third!._id.toString(), 3); // 동점 — isFeatured가 앞선 second가 이겨야 한다
    await likeNTimes(fourth!._id.toString(), 2);
    await likeNTimes(fifth!._id.toString(), 1);
    // "제외-좋아요없음"은 아무것도 하지 않아 좋아요 0개로 남는다.
    await likeNTimes(deleted!._id.toString(), 8); // 좋아요는 최다지만 soft-delete로 제외돼야 한다
    await deleteProductService(deleted!._id.toString());

    const products = await getPopularProductsService();
    render(<PopularProductsSection products={products} />);

    // 헤딩 + 정확히 5장(0개/삭제 2건 제외)
    expect(screen.getByText("인기 상품")).toBeInTheDocument();
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "1위-글래스민트",
      "2위-로즈핑크-featured",
      "3위-선셋오렌지-일반",
      "4위-라벤더",
      "5위-스카이블루",
    ]);

    // 제외 대상은 DOM에 아예 없어야 한다
    expect(screen.queryByText("제외-좋아요없음")).not.toBeInTheDocument();
    expect(screen.queryByText("제외-소프트삭제")).not.toBeInTheDocument();

    // rank 배지가 문서 순서대로 1~5 (sr-only 텍스트 기준)
    const rankTexts = screen
      .getAllByText(/^인기 \d+위$/)
      .map((el) => el.textContent);
    expect(rankTexts).toEqual([
      "인기 1위",
      "인기 2위",
      "인기 3위",
      "인기 4위",
      "인기 5위",
    ]);
  });

  it("REQ-2 골든패스(실 DB): 좋아요 상품이 2개뿐이면 서비스 결과를 그대로 넘겨도 섹션이 DOM에 렌더되지 않는다", async () => {
    await createProductService(buildProductInput({ title: "상품A" }));
    await createProductService(buildProductInput({ title: "상품B" }));
    const a = await ProductModel.findOne({ title: "상품A" }).lean();
    const b = await ProductModel.findOne({ title: "상품B" }).lean();
    await likeNTimes(a!._id.toString(), 2);
    await likeNTimes(b!._id.toString(), 1);

    const products = await getPopularProductsService();
    expect(products).toHaveLength(2); // 서비스는 3개 미만이어도 그대로 리턴한다(게이트는 UI 책임)

    const { container } = render(<PopularProductsSection products={products} />);

    expect(screen.queryByText("인기 상품")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
