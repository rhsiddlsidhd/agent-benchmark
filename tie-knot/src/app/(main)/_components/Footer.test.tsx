import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Footer } from "./Footer";

describe("Footer", () => {
  it("브랜드명과 갱신된 저작권 표기를 렌더한다", () => {
    render(<Footer />);

    expect(screen.getByText("Tie Knot")).toBeInTheDocument();
    expect(screen.getByText("© 2026 Tie Knot. All rights reserved.")).toBeInTheDocument();
  });

  it("href=\"#\" 데드링크를 렌더하지 않는다", () => {
    const { container } = render(<Footer />);

    const deadLinks = container.querySelectorAll('a[href="#"]');
    expect(deadLinks).toHaveLength(0);
  });
});
