import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubCategoryNavSection } from "./SubCategoryNavSection";

describe("SubCategoryNavSection", () => {
  it("전체 카테고리의 서브카테고리를 전부 링크로 렌더한다", () => {
    render(<SubCategoryNavSection />);

    expect(screen.getByRole("link", { name: "청첩장" })).toHaveAttribute(
      "href",
      "/products/invitation?subCategory=wedding",
    );
    expect(screen.getByRole("link", { name: "돌잔치" })).toHaveAttribute(
      "href",
      "/products/invitation?subCategory=first-birthday",
    );
    expect(screen.getByRole("link", { name: "캔들" })).toHaveAttribute(
      "href",
      "/products/favor?subCategory=candle",
    );
    expect(screen.getByRole("link", { name: "아일 러너" })).toHaveAttribute(
      "href",
      "/products/ceremony?subCategory=aisle-runner",
    );
  });

  it("캐러셀 region 랜드마크로 렌더한다", () => {
    render(<SubCategoryNavSection />);

    expect(
      screen.getByRole("region", { name: "서브카테고리 바로가기" }),
    ).toBeInTheDocument();
  });
});
