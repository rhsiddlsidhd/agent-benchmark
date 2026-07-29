import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
