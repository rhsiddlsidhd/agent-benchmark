import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Product, PremiumFeature } from "@/server/services";

vi.mock("./ProductViewTracker", () => ({
  ProductViewTracker: (): null => null,
}));

vi.mock("./ProductSummary", () => ({
  ProductSummary: ({ product }: { product: { title: string } }) => (
    <div>{product.title}</div>
  ),
}));

vi.mock("@/client/components/organisms", () => ({
  ProductFeatures: ({ options }: { options: { label: string }[] }) => (
    <div>{options.map((o) => o.label).join(",")}</div>
  ),
}));

import { ProductDetailTemplate } from "./ProductDetailTemplate";

const buildProduct = (): Product => ({ title: "봄맞이 청첩장" }) as Product;
const buildOptions = (): PremiumFeature[] =>
  [{ label: "고급 테마" }] as PremiumFeature[];

describe("ProductDetailTemplate", () => {
  it("상품 요약과 상세 옵션을 함께 렌더링한다", () => {
    render(
      <ProductDetailTemplate product={buildProduct()} options={buildOptions()} />,
    );

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.getByText("고급 테마")).toBeInTheDocument();
  });
});
