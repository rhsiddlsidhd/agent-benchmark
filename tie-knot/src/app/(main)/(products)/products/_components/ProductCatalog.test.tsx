import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Product } from "@/server/services";

const { useProductsMock, usePremiumFeatureMock } = vi.hoisted(() => ({
  useProductsMock: vi.fn(),
  usePremiumFeatureMock: vi.fn(),
}));

vi.mock("@/client/hooks", () => ({
  useProducts: useProductsMock,
  usePremiumFeature: usePremiumFeatureMock,
}));

vi.mock("@/client/components/organisms", () => ({
  ProductCatalog: ({
    products,
    category,
    premiumFeatures,
    initialSubCategory,
  }: {
    products: { title: string }[];
    category: string;
    premiumFeatures: { label: string }[];
    initialSubCategory: string;
  }) => (
    <div>
      <span data-testid="category">{category}</span>
      <span data-testid="initial-sub-category">{initialSubCategory}</span>
      <span data-testid="premium-count">{premiumFeatures.length}</span>
      {products.map((p) => (
        <div key={p.title}>{p.title}</div>
      ))}
    </div>
  ),
}));

import { ProductCatalog } from "./ProductCatalog";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({ title: "봄맞이 청첩장", ...overrides }) as Product;

describe("ProductCatalog (container)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useProducts/usePremiumFeature 결과를 View에 그대로 전달한다", () => {
    useProductsMock.mockReturnValue([buildProduct()]);
    usePremiumFeatureMock.mockReturnValue({
      premiumFeatures: [{ label: "고급 테마" }],
    });

    render(
      <ProductCatalog
        products={[buildProduct()]}
        category="invitation"
        initialSubCategory="wedding"
      />,
    );

    expect(screen.getByTestId("category")).toHaveTextContent("invitation");
    expect(screen.getByTestId("initial-sub-category")).toHaveTextContent(
      "wedding",
    );
    expect(screen.getByTestId("premium-count")).toHaveTextContent("1");
    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
  });

  it("category와 초기 products를 useProducts에 그대로 넘긴다", () => {
    useProductsMock.mockReturnValue([]);
    usePremiumFeatureMock.mockReturnValue({ premiumFeatures: [] });
    const initialProducts = [buildProduct({ title: "첫돌 세트" })];

    render(
      <ProductCatalog
        products={initialProducts}
        category="favor"
        initialSubCategory="all"
      />,
    );

    expect(useProductsMock).toHaveBeenCalledWith("favor", initialProducts);
  });
});
