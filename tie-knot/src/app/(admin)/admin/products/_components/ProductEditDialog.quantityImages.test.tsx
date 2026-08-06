import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/server/actions", () => ({
  updateProduct: () => async (): Promise<null> => null,
}));

vi.mock("@/client/hooks", () => ({
  usePremiumFeature: (): { premiumFeatures: never[]; loading: boolean } => ({
    premiumFeatures: [],
    loading: false,
  }),
  useImageList: (defaultUrls?: string[]) => {
    const items = (defaultUrls ?? []).map((url) => ({
      id: url,
      type: "existing" as const,
      preview: url,
      originalUrl: url,
    }));
    return {
      items,
      add: vi.fn(),
      remove: vi.fn(),
      getPayload: () => ({ existing: defaultUrls ?? [], newFiles: [] as File[] }),
    };
  },
}));

// REQ-6 검증용 — 실제 category.ts(REQ-1, backend-impl 담당)와 무관하게 조건부 렌더 로직만 검증.
vi.mock("@/shared/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/utils")>();
  return {
    ...actual,
    getCategoryOptions: () => [
      { value: "invitation", label: "초대장" },
      { value: "favor", label: "답례품" },
    ],
    getSubCategoryOptions: (category: string) =>
      category === "invitation"
        ? [{ value: "wedding", label: "청첩장" }]
        : [{ value: "candle", label: "캔들" }],
  };
});

import { Product } from "@/server/services";
import { ProductEditDialog } from "./ProductEditDialog";

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
  images: [],
  minQuantity: 1,
  maxQuantity: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  ...overrides,
});

describe("ProductEditDialog — REQ-6 invitation 전용 필드 조건부 렌더", () => {
  it("invitation 상품은 테마 필드가 보인다", () => {
    render(<ProductEditDialog product={buildProduct()} />);

    expect(screen.getByText("테마")).toBeInTheDocument();
  });

  it("invitation이 아닌 상품은 테마 필드가 보이지 않는다", () => {
    render(
      <ProductEditDialog
        product={buildProduct({ category: "favor" as never, subCategory: "candle" as never, theme: undefined })}
      />,
    );

    expect(screen.queryByText("테마")).not.toBeInTheDocument();
  });

  it("카테고리를 invitation이 아닌 값으로 바꾸면 테마 필드가 사라진다", async () => {
    const user = userEvent.setup();
    render(<ProductEditDialog product={buildProduct()} />);

    expect(screen.getByText("테마")).toBeInTheDocument();

    const categoryTrigger = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("초대장"));
    await user.click(categoryTrigger!);
    await user.click(await screen.findByRole("option", { name: "답례품" }));

    expect(screen.queryByText("테마")).not.toBeInTheDocument();
  });
});

describe("ProductEditDialog — 상세 이미지 갤러리(REQ-2/3)", () => {
  it("기존 이미지 URL이 갤러리에 표시되고 currentImages hidden input으로 전송된다", () => {
    const { container } = render(
      <ProductEditDialog
        product={buildProduct({ images: ["https://example.com/a.jpg", "https://example.com/b.jpg"] })}
      />,
    );

    const hiddenInputs = container.querySelectorAll('input[type="hidden"][name="currentImages"]');
    expect(hiddenInputs).toHaveLength(2);
    expect((hiddenInputs[0] as HTMLInputElement).value).toBe("https://example.com/a.jpg");
    expect((hiddenInputs[1] as HTMLInputElement).value).toBe("https://example.com/b.jpg");
  });

  it("images 필드 에러가 렌더된다", () => {
    render(<ProductEditDialog product={buildProduct()} />);
    // fieldErrors는 useActionState의 state를 통해서만 오므로 초기 렌더에선 없음을 확인.
    expect(screen.queryByText(/상세 이미지를 1장 이상/)).not.toBeInTheDocument();
  });

  // boundary-verifier 지적: 이미지 갤러리는 REQ-6(theme/previewUrl) 조건부 렌더 대상이
  // 아니다 — invitation이어도 항상 렌더돼야 한다. 렌더 안 되면 updateProduct가
  // images=[...existing, ...신규]로 통째 덮어써서 invitation 상품의 기존 이미지가
  // 에러 없이 조용히 사라진다(물리 상품은 required라 에러로라도 막히지만 invitation만 무증상).
  it("invitation 상품이어도(REQ-6 대상 아님) 상세 이미지 갤러리와 currentImages hidden input이 항상 렌더된다", () => {
    const { container } = render(
      <ProductEditDialog
        product={buildProduct({
          category: "invitation",
          images: ["https://example.com/a.jpg"],
        })}
      />,
    );

    // 이미지 갤러리 자체(및 업로드용 file input)는 항상 존재 — REQ-6 조건부 대상이 아니다.
    expect(document.getElementById("edit-images-upload")).not.toBeNull();
    expect(container.querySelector('input[type="file"][name="images"]')).not.toBeNull();

    const hidden = container.querySelectorAll(
      'input[type="hidden"][name="currentImages"]',
    );
    expect(hidden).toHaveLength(1);
    expect((hidden[0] as HTMLInputElement).value).toBe("https://example.com/a.jpg");
  });
});

describe("ProductEditDialog — 구매 수량(REQ-2/3, §3-4)", () => {
  it("product.maxQuantity===0이면 무제한 체크됨 + 숫자 Input 비활성 + hidden 0 전송", () => {
    const { container } = render(
      <ProductEditDialog product={buildProduct({ minQuantity: 2, maxQuantity: 0 })} />,
    );

    expect(screen.getByLabelText("최소 구매 수량 *")).toHaveValue(2);
    expect(screen.getByPlaceholderText("무제한")).toBeDisabled();
    const hidden = container.querySelector(
      'input[type="hidden"][name="maxQuantity"]',
    ) as HTMLInputElement;
    expect(hidden.value).toBe("0");
    expect(container.querySelectorAll('[name="maxQuantity"]')).toHaveLength(1);
  });

  it("product.maxQuantity>0이면 무제한 체크 해제 + 숫자 Input에 기존 값이 채워진다", () => {
    const { container } = render(
      <ProductEditDialog product={buildProduct({ minQuantity: 2, maxQuantity: 8 })} />,
    );

    const active = screen.getByLabelText("최대 구매 수량 *") as HTMLInputElement;
    expect(active).not.toBeDisabled();
    expect(active.value).toBe("8");
    expect(container.querySelectorAll('[name="maxQuantity"]')).toHaveLength(1);
  });

  it("무제한 체크를 다시 켜면 hidden 0으로 전환되고 활성 Input은 사라진다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProductEditDialog product={buildProduct({ minQuantity: 1, maxQuantity: 8 })} />,
    );

    await user.click(screen.getByLabelText("무제한"));

    const hidden = container.querySelector(
      'input[type="hidden"][name="maxQuantity"]',
    ) as HTMLInputElement;
    expect(hidden.value).toBe("0");
    expect(container.querySelectorAll('[name="maxQuantity"]')).toHaveLength(1);
  });
});
