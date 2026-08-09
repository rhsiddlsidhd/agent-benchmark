import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BaseSelect } from "./BaseSelect";

const options = [
  { value: "a", label: "옵션 A" },
  { value: "b", label: "옵션 B" },
];

describe("BaseSelect", () => {
  it("placeholder를 렌더링한다", () => {
    render(<BaseSelect options={options} placeholder="골라주세요" />);

    expect(screen.getByText("골라주세요")).toBeInTheDocument();
  });

  it("옵션 선택 시 onValueChange를 선택한 값으로 호출한다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<BaseSelect options={options} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "옵션 B" }));

    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});
