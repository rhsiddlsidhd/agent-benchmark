import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductJSON } from "@/server/models";
import { LiveDemoSection } from "./LiveDemoSection";

const buildProduct = (): ProductJSON =>
  ({
    _id: "product-1",
    title: "봄맞이 청첩장",
    thumbnail: "https://example.com/thumb.jpg",
  }) as ProductJSON;

describe("LiveDemoSection", () => {
  it("미리보기 링크가 새 창에서 열리도록 렌더링된다", () => {
    render(<LiveDemoSection product={buildProduct()} infoId="couple-1" />);

    const links = screen.getAllByRole("link", { name: /미리보기|열기/ });
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "/preview/couple-1?product=product-1");
      expect(link).toHaveAttribute("target", "_blank");
    });
  });
});
