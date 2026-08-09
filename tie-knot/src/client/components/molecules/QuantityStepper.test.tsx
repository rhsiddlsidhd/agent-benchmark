import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuantityStepper } from "./QuantityStepper";

describe("QuantityStepper", () => {
  it("value/min/max를 받아 입력값을 표시한다", () => {
    render(
      <QuantityStepper id="quantity" value={3} min={1} max={10} onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText("수량")).toHaveValue(3);
  });

  it("+ 클릭 시 onChange(value+1)을 호출한다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <QuantityStepper id="quantity" value={3} min={1} max={10} onChange={onChange} />,
    );

    await user.click(screen.getByLabelText("수량 증가"));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("- 클릭 시 onChange(value-1)을 호출한다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <QuantityStepper id="quantity" value={3} min={1} max={10} onChange={onChange} />,
    );

    await user.click(screen.getByLabelText("수량 감소"));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("value가 min이면 감소 버튼이 disabled다", () => {
    render(
      <QuantityStepper id="quantity" value={1} min={1} max={10} onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText("수량 감소")).toBeDisabled();
  });

  it("value가 max면 증가 버튼이 disabled다", () => {
    render(
      <QuantityStepper id="quantity" value={10} min={1} max={10} onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText("수량 증가")).toBeDisabled();
  });

  it("min===max면 두 버튼 모두 자연히 disabled된다(별도 fixed 분기 없이)", () => {
    render(
      <QuantityStepper id="quantity" value={5} min={5} max={5} onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText("수량 감소")).toBeDisabled();
    expect(screen.getByLabelText("수량 증가")).toBeDisabled();
  });

  it("타이핑 중에는 clamp하지 않고 입력값을 그대로 onChange에 전달한다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <QuantityStepper id="quantity" value={1} min={2} max={10} onChange={onChange} />,
    );

    await user.type(screen.getByLabelText("수량"), "2");

    // 입력 중간값("12")도 clamp 없이 그대로 전달된다.
    expect(onChange).toHaveBeenLastCalledWith(12);
  });

  it("blur 시 범위 밖 값이 clamp된다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <QuantityStepper id="quantity" value={999} min={1} max={10} onChange={onChange} />,
    );

    const input = screen.getByLabelText("수량");
    await user.click(input);
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("disabled면 버튼과 입력이 모두 비활성화된다", () => {
    render(
      <QuantityStepper id="quantity" value={1} min={1} max={1} onChange={vi.fn()} disabled />,
    );

    expect(screen.getByLabelText("수량 감소")).toBeDisabled();
    expect(screen.getByLabelText("수량 증가")).toBeDisabled();
    expect(screen.getByLabelText("수량")).toBeDisabled();
  });
});
