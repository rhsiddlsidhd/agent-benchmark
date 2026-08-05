import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubCategoryNavSection } from "./SubCategoryNavSection";

describe("SubCategoryNavSection", () => {
  it("invitation 카테고리의 서브카테고리 전부를 링크로 렌더한다", () => {
    render(<SubCategoryNavSection category="invitation" />);

    expect(screen.getByRole("link", { name: "청첩장" })).toHaveAttribute(
      "href",
      "/products/invitation?subCategory=wedding",
    );
    expect(screen.getByRole("link", { name: "돌잔치" })).toHaveAttribute(
      "href",
      "/products/invitation?subCategory=first-birthday",
    );
  });

  it("가로 스크롤 리스트 랜드마크(nav)로 렌더한다", () => {
    render(<SubCategoryNavSection category="invitation" />);

    expect(
      screen.getByRole("navigation", { name: "서브카테고리 바로가기" }),
    ).toBeInTheDocument();
  });
});
