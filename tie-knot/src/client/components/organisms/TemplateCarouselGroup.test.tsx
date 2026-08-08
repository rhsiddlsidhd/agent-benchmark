import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Product } from "@/server/services";

vi.mock("@/client/components/atoms", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/client/components/atoms")>();
  return {
    ...actual,
    Carousel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    CarouselContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    CarouselItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    CarouselPrevious: (): null => null,
    CarouselNext: (): null => null,
  };
});

import { TemplateCarouselGroup } from "./TemplateCarouselGroup";

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
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  }) as Product;

describe("TemplateCarouselGroup", () => {
  it("data가 있으면 제목/설명과 카드를 렌더링한다", async () => {
    const jsx = await TemplateCarouselGroup({
      data: [buildProduct(), buildProduct({ _id: "product-2", title: "여름 청첩장" })],
      title: "초대장",
      description: "소중한 순간을 함께할 분들께 마음을 전하는 초대장",
    });
    render(jsx);

    expect(screen.getByText("초대장")).toBeInTheDocument();
    expect(
      screen.getByText("소중한 순간을 함께할 분들께 마음을 전하는 초대장"),
    ).toBeInTheDocument();
    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.getByText("여름 청첩장")).toBeInTheDocument();
  });

  it("data가 비어있으면 아무것도 렌더링하지 않는다", async () => {
    const jsx = await TemplateCarouselGroup({ data: [], title: "초대장", description: "설명" });
    const { container } = render(jsx);

    expect(container).toBeEmptyDOMElement();
  });
});
