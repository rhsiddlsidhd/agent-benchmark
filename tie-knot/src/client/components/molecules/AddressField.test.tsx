import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useDaumPopupMock = vi.fn();

vi.mock("@/client/lib/daum", () => ({
  useDaumPopup: () => useDaumPopupMock(),
}));

import { AddressField } from "./AddressField";

describe("AddressField", () => {
  it("defaultValue를 입력값으로 렌더링한다", () => {
    useDaumPopupMock.mockReturnValue({
      address: "",
      handleDaumAddressPopup: vi.fn(),
    });

    render(<AddressField name="wedding" defaultValue="서울시 강남구" />);

    expect(screen.getByRole("textbox")).toHaveValue("서울시 강남구");
  });

  it("입력 필드 클릭 시 handleDaumAddressPopup을 호출한다", async () => {
    const user = userEvent.setup();
    const handleDaumAddressPopup = vi.fn();
    useDaumPopupMock.mockReturnValue({
      address: "",
      handleDaumAddressPopup,
    });

    render(<AddressField name="wedding" />);

    await user.click(screen.getByRole("textbox"));

    expect(handleDaumAddressPopup).toHaveBeenCalledOnce();
  });

  it("훅이 새 address를 리턴하면 입력값을 그 주소로 갱신한다", () => {
    useDaumPopupMock.mockReturnValue({
      address: "",
      handleDaumAddressPopup: vi.fn(),
    });

    const { rerender } = render(<AddressField name="wedding" />);

    useDaumPopupMock.mockReturnValue({
      address: "서울시 서초구",
      handleDaumAddressPopup: vi.fn(),
    });
    rerender(<AddressField name="wedding" />);

    expect(screen.getByRole("textbox")).toHaveValue("서울시 서초구");
  });
});
