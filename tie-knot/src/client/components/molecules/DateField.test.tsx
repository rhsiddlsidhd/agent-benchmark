import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateField } from "./DateField";

describe("DateField", () => {
  it("defaultValue가 없으면 placeholder를 보여준다", () => {
    render(
      <DateField id="weddingDate" name="weddingDate">
        예식일
      </DateField>,
    );

    expect(screen.getByText("날짜를 선택하세요")).toBeInTheDocument();
    expect(screen.getByText("예식일")).toBeInTheDocument();
  });

  it("defaultValue가 있으면 포맷된 날짜를 보여준다", () => {
    render(
      <DateField id="weddingDate" name="weddingDate" defaultValue={new Date("2026-05-01")}>
        예식일
      </DateField>,
    );

    expect(screen.getByText("2026년 5월 1일")).toBeInTheDocument();
  });

  it("defaultValue가 없으면 hidden input 값이 빈 문자열이다", () => {
    const { container } = render(
      <DateField id="weddingDate" name="weddingDate">
        예식일
      </DateField>,
    );

    const hiddenInput = container.querySelector(
      'input[name="weddingDate"]',
    ) as HTMLInputElement;
    expect(hiddenInput.value).toBe("");
  });

  it("달력에서 날짜를 선택하면 버튼 텍스트와 hidden input 값이 갱신된다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DateField id="weddingDate" name="weddingDate">
        예식일
      </DateField>,
    );

    await user.click(screen.getByText("날짜를 선택하세요"));
    const dayButton = (await screen.findAllByRole("button", { hidden: false }))
      .find((el) => el.hasAttribute("data-day")) as HTMLButtonElement;
    await user.click(dayButton);

    expect(screen.queryByText("날짜를 선택하세요")).not.toBeInTheDocument();
    const hiddenInput = container.querySelector(
      'input[name="weddingDate"]',
    ) as HTMLInputElement;
    expect(hiddenInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("defaultValue가 리렌더 중 바뀌면 값이 재동기화된다", () => {
    const { rerender } = render(
      <DateField id="weddingDate" name="weddingDate" defaultValue={new Date("2026-05-01")}>
        예식일
      </DateField>,
    );

    expect(screen.getByText("2026년 5월 1일")).toBeInTheDocument();

    rerender(
      <DateField id="weddingDate" name="weddingDate" defaultValue={new Date("2026-09-10")}>
        예식일
      </DateField>,
    );

    expect(screen.getByText("2026년 9월 10일")).toBeInTheDocument();
  });
});
