import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnnouncementBar } from "./AnnouncementBar";

describe("AnnouncementBar", () => {
  it("items가 비어있으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<AnnouncementBar items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("공지 문구와 링크 텍스트를 렌더한다", () => {
    render(
      <AnnouncementBar
        items={[
          { id: "1", text: "신규 가입 시 프리미엄 템플릿 즉시 할인!", link: "/signup", isActive: true },
        ]}
      />,
    );

    expect(
      screen.getByText("신규 가입 시 프리미엄 템플릿 즉시 할인!"),
    ).toBeInTheDocument();
    expect(screen.getByText("지금 확인")).toBeInTheDocument();
  });

  it("링크가 없으면 CTA를 렌더하지 않는다", () => {
    render(<AnnouncementBar items={[{ id: "1", text: "공지 문구", isActive: true }]} />);

    expect(screen.getByText("공지 문구")).toBeInTheDocument();
    expect(screen.queryByText("지금 확인")).not.toBeInTheDocument();
  });
});
