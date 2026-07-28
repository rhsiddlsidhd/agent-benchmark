import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComingSoonPage } from "./ComingSoonPage";

describe("ComingSoonPage", () => {
  it("title/description과 홈으로 돌아가기 링크를 렌더링한다", () => {
    render(<ComingSoonPage title="준비 중입니다" description="곧 찾아뵐게요" />);

    expect(screen.getByText("준비 중입니다")).toBeInTheDocument();
    expect(screen.getByText("곧 찾아뵐게요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈으로 돌아가기" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("secondaryLink를 넘기면 보조 링크도 렌더링한다", () => {
    render(
      <ComingSoonPage
        title="준비 중입니다"
        description="곧 찾아뵐게요"
        secondaryLink={{ href: "/products/invitation", label: "상품 구경하기" }}
      />,
    );

    expect(screen.getByRole("link", { name: "상품 구경하기" })).toHaveAttribute(
      "href",
      "/products/invitation",
    );
  });

  it("secondaryLink가 없으면 보조 링크를 렌더링하지 않는다", () => {
    render(<ComingSoonPage title="준비 중입니다" description="곧 찾아뵐게요" />);

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
