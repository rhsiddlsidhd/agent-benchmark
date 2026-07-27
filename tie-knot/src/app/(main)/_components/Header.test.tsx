import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/client/hooks", () => ({ useAuth: () => ({ session: null as unknown, isLoading: false }) }));

import { Header } from "./Header";

describe("Header", () => {
  it("로고는 홈으로 이동하는 링크다", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute("href", "/");
  });
});
