import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductJSON } from "@/server/models";

vi.mock("./ProductTableRow", () => ({
  ProductTableRow: ({ product }: { product: { title: string } }) => (
    <tr>
      <td>{product.title}</td>
    </tr>
  ),
}));

import { AdminProductsTemplate } from "./AdminProductsTemplate";

const buildProduct = (overrides?: Partial<ProductJSON>): ProductJSON =>
  ({
    _id: "product-1",
    title: "봄맞이 청첩장",
    ...overrides,
  }) as ProductJSON;

describe("AdminProductsTemplate", () => {
  it("상품 개수와 테이블 헤더를 렌더링한다", () => {
    render(<AdminProductsTemplate products={[buildProduct()]} />);

    expect(screen.getByText("등록된 템플릿 상품을 관리합니다. (총 1개)")).toBeInTheDocument();
    expect(screen.getByText("썸네일")).toBeInTheDocument();
  });

  it("상품이 없으면 빈 상태 메시지를 렌더링한다", () => {
    render(<AdminProductsTemplate products={[]} />);

    expect(screen.getByText("등록된 상품이 없습니다.")).toBeInTheDocument();
  });
});
