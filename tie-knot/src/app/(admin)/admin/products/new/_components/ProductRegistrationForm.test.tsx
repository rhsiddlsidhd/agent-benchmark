import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/server/actions", () => ({ createProduct: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/client/hooks", () => ({
  usePremiumFeature: () => ({ premiumFeatures: [] as unknown[], loading: false }),
  useImageList: () => ({
    items: [] as unknown[],
    add: vi.fn(),
    remove: vi.fn(),
    getPayload: () => ({ existing: [] as string[], newFiles: [] as File[] }),
  }),
}));

import { ProductRegistrationForm } from "./ProductRegistrationForm";

describe("ProductRegistrationForm (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("취소 버튼 클릭 시 /admin/products로 이동한다", async () => {
    const user = userEvent.setup();
    render(<ProductRegistrationForm premiumFeatures={[]} />);

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/products");
  });
});
