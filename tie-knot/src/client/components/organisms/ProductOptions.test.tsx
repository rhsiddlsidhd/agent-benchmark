import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Product, PremiumFeature } from "@/server/services";
import { ProductOptions } from "./ProductOptions";

const buildOption = (overrides?: Partial<PremiumFeature>): PremiumFeature => ({
  _id: "feature-1",
  code: "GUEST_BOOK",
  label: "방명록",
  description: "모바일 방명록",
  additionalPrice: 5000,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    _id: "product-1",
    authorId: "author-1",
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    thumbnail: "https://example.com/thumb.jpg",
    price: 10000,
    category: "invitation",
    subCategory: "wedding",
    isPremium: false,
    isFeatured: false,
    priority: 0,
    discount: { discountType: "rate", value: 0 },
    status: "active",
    likes: [],
    featureIds: [],
    isLiked: false,
    discountedPrice: 10000,
    images: [],
    minQuantity: 1,
    maxQuantity: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  }) as Product;

describe("ProductOptions — 수량 모드 파생(REQ-4)", () => {
  it("minQuantity===1 && maxQuantity===1이면 '1개' 고정 표시고 stepper가 없다(invitation 회귀 없음)", () => {
    render(
      <ProductOptions
        product={buildProduct({ minQuantity: 1, maxQuantity: 1 })}
        options={[]}
        onPurchase={vi.fn()}
      />,
    );

    expect(screen.getByText("1개")).toBeInTheDocument();
    expect(screen.queryByLabelText("수량")).not.toBeInTheDocument();
  });

  it("maxQuantity===0이면 상한 없는 stepper(소프트 상한 99)로 렌더한다", () => {
    render(
      <ProductOptions
        product={buildProduct({ minQuantity: 1, maxQuantity: 0 })}
        options={[]}
        onPurchase={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("수량") as HTMLInputElement;
    expect(input).not.toBeDisabled();
    expect(input.max).toBe("");
  });

  it("그 외(min/max 둘 다 유효)에는 [min, max] stepper로 렌더한다", () => {
    render(
      <ProductOptions
        product={buildProduct({ minQuantity: 2, maxQuantity: 5 })}
        options={[]}
        onPurchase={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("수량") as HTMLInputElement;
    expect(input).toHaveValue(2);
    expect(input.min).toBe("2");
    expect(input.max).toBe("5");
  });
});

describe("ProductOptions — 총 상품 금액/구매 (수량 반영, 회귀 방지)", () => {
  it("초기 수량이 product.minQuantity다(1이 아님)", () => {
    render(
      <ProductOptions
        product={buildProduct({ minQuantity: 3, maxQuantity: 10 })}
        options={[]}
        onPurchase={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("수량")).toHaveValue(3);
  });

  it("수량을 늘리면 총 상품 금액이 수량만큼 곱해진다", async () => {
    const user = userEvent.setup();
    render(
      <ProductOptions
        product={buildProduct({ price: 10000, discountedPrice: 10000, minQuantity: 1, maxQuantity: 5 })}
        options={[]}
        onPurchase={vi.fn()}
      />,
    );

    expect(screen.getByText("10,000원")).toBeInTheDocument();

    await user.click(screen.getByLabelText("수량 증가"));

    expect(screen.getByText("20,000원")).toBeInTheDocument();
  });

  it("구매하기 클릭 시 checkoutData.quantity/finalPrice가 변경된 수량을 반영한다(stale quantity 회귀 방지)", async () => {
    const user = userEvent.setup();
    const onPurchase = vi.fn();
    render(
      <ProductOptions
        product={buildProduct({ price: 10000, discountedPrice: 10000, minQuantity: 1, maxQuantity: 5 })}
        options={[]}
        onPurchase={onPurchase}
      />,
    );

    await user.click(screen.getByLabelText("수량 증가"));
    await user.click(screen.getByLabelText("수량 증가"));
    await user.click(screen.getByRole("button", { name: /구매하기/ }));

    expect(onPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 3, finalPrice: 30000 }),
    );
  });
});

describe("ProductOptions — 프리미엄 옵션 선택/해제", () => {
  it("옵션을 선택하면 배지로 표시되고 총 상품 금액에 옵션가가 더해진다(수량 미곱)", async () => {
    const user = userEvent.setup();
    render(
      <ProductOptions
        product={buildProduct({ price: 10000, discountedPrice: 10000, minQuantity: 1, maxQuantity: 1 })}
        options={[buildOption()]}
        onPurchase={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /방명록/ }));

    expect(screen.getByText("방명록")).toBeInTheDocument();
    expect(screen.getByText("15,000원")).toBeInTheDocument();
  });

  it("이미 선택한 옵션을 다시 선택하면 경고만 뜨고 중복 추가되지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <ProductOptions
        product={buildProduct({ minQuantity: 1, maxQuantity: 1 })}
        options={[buildOption(), buildOption({ _id: "feature-2", code: "PHOTO", label: "포토북" })]}
        onPurchase={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /방명록/ }));
    // 아직 1개(포토북)가 남아있어 콤보박스가 비활성화되지 않는다 — 같은 옵션을 다시 클릭.
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /방명록/ }));

    // 배지는 여전히 1개뿐 — 중복 추가되지 않았다.
    expect(screen.getAllByText("방명록")).toHaveLength(1);
  });

  it("배지의 제거 버튼을 클릭하면 옵션이 해제되고 금액이 원복된다", async () => {
    const user = userEvent.setup();
    render(
      <ProductOptions
        product={buildProduct({ price: 10000, discountedPrice: 10000, minQuantity: 1, maxQuantity: 1 })}
        options={[buildOption()]}
        onPurchase={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /방명록/ }));
    expect(screen.getByText("15,000원")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "방명록 옵션 제거" }));

    expect(screen.getByText("10,000원")).toBeInTheDocument();
  });

  it("구매하기 클릭 시 선택된 옵션이 selectedFeatures로 전달된다", async () => {
    const user = userEvent.setup();
    const onPurchase = vi.fn();
    render(
      <ProductOptions
        product={buildProduct({ price: 10000, discountedPrice: 10000, minQuantity: 1, maxQuantity: 1 })}
        options={[buildOption()]}
        onPurchase={onPurchase}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /방명록/ }));
    await user.click(screen.getByRole("button", { name: /구매하기/ }));

    expect(onPurchase).toHaveBeenCalledWith(
      expect.objectContaining({
        finalPrice: 15000,
        selectedFeatures: [
          expect.objectContaining({ featureId: "feature-1", label: "방명록", price: 5000 }),
        ],
      }),
    );
  });
});
