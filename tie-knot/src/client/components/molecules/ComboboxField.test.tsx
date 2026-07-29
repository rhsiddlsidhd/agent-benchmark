import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComboboxField } from "./ComboboxField";

const options = [
  { value: "seoul", label: "서울" },
  { value: "seoul-station", label: "서울역" },
  { value: "busan", label: "부산" },
];

describe("ComboboxField", () => {
  it("defaultValue에 해당하는 라벨을 입력값으로 보여준다", () => {
    render(
      <ComboboxField id="station" name="station" placeholder="역을 검색하세요" options={options} defaultValue="busan">
        지하철역
      </ComboboxField>,
    );

    expect(screen.getByDisplayValue("부산")).toBeInTheDocument();
  });

  it("입력값에 매칭되는 후보를 선택하면 hidden input에 value가 확정된다", async () => {
    const user = userEvent.setup();
    render(
      <ComboboxField id="station" name="station" placeholder="역을 검색하세요" options={options}>
        지하철역
      </ComboboxField>,
    );

    const input = screen.getByPlaceholderText("역을 검색하세요");
    await user.type(input, "서울");
    await user.click(await screen.findByText("서울역"));

    const hiddenInput = document.querySelector(
      'input[type="hidden"][name="station"]',
    ) as HTMLInputElement;
    expect(hiddenInput.value).toBe("seoul-station");
  });
});
