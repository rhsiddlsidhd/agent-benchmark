import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusSelect } from "./StatusSelect";

const items = [
  { value: "active", label: "판매중" },
  { value: "inactive", label: "비활성" },
] as const;

describe("StatusSelect", () => {
  it("현재 value에 해당하는 라벨을 렌더링한다", () => {
    render(<StatusSelect value="active" onValueChange={vi.fn()} items={items} />);

    expect(screen.getByText("판매중")).toBeInTheDocument();
  });

  it("옵션 선택 시 onValueChange를 호출한다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<StatusSelect value="active" onValueChange={onValueChange} items={items} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "비활성" }));

    expect(onValueChange).toHaveBeenCalledWith("inactive");
  });
});
