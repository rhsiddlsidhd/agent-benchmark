import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Product } from "@/server/services";

vi.mock("@/client/components/organisms", () => ({
  EcommerceHero: () => <div>hero</div>,
  TemplateCarouselGroup: ({ title }: { title: string }) => <div>{title}</div>,
  LiveDemoSection: ({ infoId }: { infoId: string }) => <div>live-demo-{infoId}</div>,
  StartActionCTA: () => <div>cta</div>,
  ProductCard: ({ product }: { product: Product }) => <div>card-{product._id}</div>,
}));

import { HomeTemplate } from "./HomeTemplate";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({ _id: "product-1", title: "봄맞이 청첩장", ...overrides }) as Product;

const buildProducts = (count: number): Product[] =>
  Array.from({ length: count }, (_, i) => buildProduct({ _id: `product-${i + 1}` }));

describe("HomeTemplate", () => {
  it("hero와 cta는 항상 렌더링한다", () => {
    render(
      <HomeTemplate invitation={[]} product={null} infoId={undefined} popularProducts={[]} />,
    );

    expect(screen.getByText("hero")).toBeInTheDocument();
    expect(screen.getByText("cta")).toBeInTheDocument();
  });

  it("invitation이 있으면 추천 템플릿 섹션을 렌더링한다", () => {
    render(
      <HomeTemplate
        invitation={[buildProduct()]}
        product={null}
        infoId={undefined}
        popularProducts={[]}
      />,
    );

    expect(screen.getByText("초대장")).toBeInTheDocument();
  });

  it("invitation이 비어있으면 추천 템플릿 섹션을 렌더링하지 않는다", () => {
    render(
      <HomeTemplate invitation={[]} product={null} infoId={undefined} popularProducts={[]} />,
    );

    expect(screen.queryByText("초대장")).not.toBeInTheDocument();
  });

  it("product와 infoId가 모두 있으면 라이브 데모 섹션을 렌더링한다", () => {
    render(
      <HomeTemplate
        invitation={[]}
        product={buildProduct()}
        infoId="info-1"
        popularProducts={[]}
      />,
    );

    expect(screen.getByText("live-demo-info-1")).toBeInTheDocument();
  });

  it("infoId가 없으면 라이브 데모 섹션을 렌더링하지 않는다", () => {
    render(
      <HomeTemplate
        invitation={[]}
        product={buildProduct()}
        infoId={undefined}
        popularProducts={[]}
      />,
    );

    expect(screen.queryByText(/live-demo-/)).not.toBeInTheDocument();
  });

  it("SubCategoryNavSection → 인기 상품 → 초대장 순서로 배치된다", () => {
    render(
      <HomeTemplate
        invitation={[buildProduct()]}
        product={null}
        infoId={undefined}
        popularProducts={buildProducts(3)}
      />,
    );

    const html = document.body.innerHTML;
    const subCategoryNavIndex = html.indexOf("카테고리 둘러보기");
    const popularSectionIndex = html.indexOf("인기 상품");
    const bestTemplateIndex = html.indexOf("초대장</div>");

    expect(subCategoryNavIndex).toBeGreaterThan(-1);
    expect(popularSectionIndex).toBeGreaterThan(subCategoryNavIndex);
    expect(bestTemplateIndex).toBeGreaterThan(popularSectionIndex);
  });
});
