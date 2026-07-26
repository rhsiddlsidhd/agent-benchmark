import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

vi.mock("@/server/actions", () => ({
  incrementProductViews: vi.fn(),
}));

import { incrementProductViews } from "@/server/actions";
import { ProductViewTracker } from "./ProductViewTracker";

describe("ProductViewTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("마운트되면 incrementProductViews를 productId와 함께 1회 호출한다", async () => {
    render(<ProductViewTracker productId="product-1" />);

    await waitFor(() => {
      expect(incrementProductViews).toHaveBeenCalledWith("product-1");
    });
    expect(incrementProductViews).toHaveBeenCalledTimes(1);
  });

  it("아무것도 렌더하지 않는다", () => {
    const { container } = render(<ProductViewTracker productId="product-1" />);

    expect(container).toBeEmptyDOMElement();
  });
});
