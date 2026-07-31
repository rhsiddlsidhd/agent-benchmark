import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SearchEmptyState } from "./SearchEmptyState";

describe("SearchEmptyState", () => {
  it("검색결과가 없습니다 문구를 렌더한다", () => {
    render(<SearchEmptyState query="청첩장" />);

    expect(screen.getByText("검색결과가 없습니다")).toBeInTheDocument();
  });

  it("검색어를 문구에 노출한다", () => {
    render(<SearchEmptyState query="청첩장" />);

    expect(
      screen.getByText(/'청첩장'와 일치하는 상품을 찾지 못했어요\./),
    ).toBeInTheDocument();
  });

  it("전체 상품 보기 링크가 /products/invitation으로 연결된다", () => {
    render(<SearchEmptyState query="abc" />);

    expect(
      screen.getByRole("link", { name: "전체 상품 보기" }),
    ).toHaveAttribute("href", "/products/invitation");
  });
});
