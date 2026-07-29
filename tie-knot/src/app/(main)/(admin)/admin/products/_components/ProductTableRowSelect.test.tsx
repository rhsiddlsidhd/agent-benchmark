import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/server/actions", () => ({
  updateProductStatus: vi.fn(),
}));

import { updateProductStatus } from "@/server/actions";
import { Product } from "@/server/services";
import { ProductTableRowSelect } from "./ProductTableRowSelect";

const buildProduct = (overrides?: Partial<Product>): Product => ({
  _id: "507f1f77bcf86cd799439011",
  authorId: "507f1f77bcf86cd799439012",
  title: "봄맞이 청첩장",
  description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
  thumbnail: "https://example.com/thumbnail.jpg",
  price: 9900,
  category: "invitation",
  subCategory: "wedding",
  isPremium: false,
  featureIds: [],
  isFeatured: false,
  priority: 0,
  likes: [],
  views: 0,
  salesCount: 0,
  discount: { discountType: "rate", value: 0 },
  status: "active",
  theme: "default",
  isLiked: false,
  discountedPrice: 9900,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  ...overrides,
});

describe("ProductTableRowSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("현재 상품 status를 선택값으로 렌더링한다", () => {
    render(<ProductTableRowSelect product={buildProduct({ status: "active" })} />);

    expect(screen.getByText("판매중")).toBeInTheDocument();
  });

  it("status 변경 성공 시 서버 액션을 호출하고 라우터를 refresh한다", async () => {
    const user = userEvent.setup();
    vi.mocked(updateProductStatus).mockResolvedValue({
      success: true,
      data: { message: "상태가 변경되었습니다." },
    });

    render(<ProductTableRowSelect product={buildProduct({ status: "active" })} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "비활성" }));

    expect(updateProductStatus).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      "inactive",
    );
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("status 변경 실패 시 이전 status로 되돌린다", async () => {
    const user = userEvent.setup();
    vi.mocked(updateProductStatus).mockResolvedValue({
      success: false,
      error: { category: "INTERNAL", message: "상태 변경에 실패했습니다." },
    });

    render(<ProductTableRowSelect product={buildProduct({ status: "active" })} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "비활성" }));

    expect(await screen.findByText("판매중")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
