import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectField } from "./SelectField";

const data = [
  { value: "seoul", label: "서울" },
  { value: "busan", label: "부산" },
];

describe("SelectField", () => {
  it("label과 placeholder를 렌더링한다", () => {
    render(
      <SelectField id="city" name="city" placeholder="도시를 선택하세요" data={data}>
        도시
      </SelectField>,
    );

    expect(screen.getByText("도시")).toBeInTheDocument();
    expect(screen.getByText("도시를 선택하세요")).toBeInTheDocument();
  });

  it("옵션 선택 시 onValueChange를 호출한다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <SelectField
        id="city"
        name="city"
        placeholder="도시를 선택하세요"
        data={data}
        onValueChange={onValueChange}
      >
        도시
      </SelectField>,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "부산" }));

    expect(onValueChange).toHaveBeenCalledWith("busan");
    expect(screen.getByText("부산")).toBeInTheDocument();
  });
});
