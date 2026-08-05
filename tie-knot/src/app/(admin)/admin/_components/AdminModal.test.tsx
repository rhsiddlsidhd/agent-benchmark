import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { useAdminModalStoreMock } = vi.hoisted(() => ({
  useAdminModalStoreMock: vi.fn(),
}));

vi.mock("@/client/store", () => ({ useAdminModalStore: useAdminModalStoreMock }));
vi.mock("@/app/(admin)/admin/products/_components", () => ({
  ProductEditDialog: () => <div>product-edit-dialog</div>,
}));
vi.mock("@/app/(admin)/admin/premium-features/_components", () => ({
  PremiumFeatureDialog: () => <div>premium-feature-dialog</div>,
}));

import { AdminModal } from "./AdminModal";

type State = {
  isOpen: boolean;
  type: "EDIT-PRODUCT" | "EDIT-PREMIUMFEATURE" | null;
  props: unknown;
  closeModal: () => void;
};

const mockState = (state: Partial<State>) => {
  const full: State = { isOpen: true, type: null, props: {}, closeModal: vi.fn(), ...state };
  useAdminModalStoreMock.mockImplementation((selector: (s: State) => unknown) => selector(full));
};

describe("AdminModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("type이 없으면 아무것도 렌더하지 않는다", () => {
    mockState({ type: null });

    const { container } = render(<AdminModal />);

    expect(container).toBeEmptyDOMElement();
  });

  it("EDIT-PRODUCT면 ProductEditDialog를 렌더한다", () => {
    mockState({ type: "EDIT-PRODUCT" });

    render(<AdminModal />);

    expect(screen.getByText("product-edit-dialog")).toBeInTheDocument();
    expect(screen.getByText("상품 수정")).toBeInTheDocument();
  });

  it("EDIT-PREMIUMFEATURE면 PremiumFeatureDialog를 렌더한다", () => {
    mockState({ type: "EDIT-PREMIUMFEATURE" });

    render(<AdminModal />);

    expect(screen.getByText("premium-feature-dialog")).toBeInTheDocument();
    expect(screen.getByText("프리미엄 기능 수정")).toBeInTheDocument();
  });
});
