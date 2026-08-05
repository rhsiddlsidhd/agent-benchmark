import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MAIN_NAV_ITEMS } from "@/shared/constants";
import { MobileNav } from "./MobileNav";

describe("MobileNav", () => {
  it("메뉴 버튼 클릭 시 MAIN_NAV_ITEMS 전체를 링크로 보여준다", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    for (const item of MAIN_NAV_ITEMS) {
      expect(screen.getByRole("link", { name: new RegExp(item.label) })).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });

  it("닫기 버튼 클릭 시 메뉴가 닫힌다", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));

    expect(screen.queryByRole("link", { name: new RegExp(MAIN_NAV_ITEMS[0].label) })).not.toBeInTheDocument();
  });
});
