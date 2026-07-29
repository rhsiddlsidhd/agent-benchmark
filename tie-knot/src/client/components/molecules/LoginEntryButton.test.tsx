import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginEntryButton } from "./LoginEntryButton";

describe("LoginEntryButton", () => {
  it("/login으로 이동하는 링크를 렌더링한다", () => {
    render(<LoginEntryButton />);

    const link = screen.getByRole("link", { name: "로그인" });
    expect(link).toHaveAttribute("href", "/login");
  });
});
