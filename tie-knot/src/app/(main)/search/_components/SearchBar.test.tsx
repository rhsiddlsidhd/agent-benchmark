import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("value를 입력창에 그대로 반영한다", () => {
    render(<SearchBar value="청첩장" onChange={vi.fn()} />);

    expect(
      screen.getByRole("searchbox", { name: "상품 검색" }),
    ).toHaveValue("청첩장");
  });

  it("입력 시 onChange를 호출한다", async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    await userEvent.type(
      screen.getByRole("searchbox", { name: "상품 검색" }),
      "a",
    );

    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("폼 제출 시 기본 동작(새로고침)을 막는다", () => {
    render(<SearchBar value="a" onChange={vi.fn()} />);

    const form = screen.getByRole("search");
    const submitEvent = new Event("submit", {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(submitEvent, "preventDefault");

    form.dispatchEvent(submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
