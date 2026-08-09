import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("label과 children을 렌더링한다", () => {
    render(
      <FormField label="이름">
        <input />
      </FormField>,
    );

    expect(screen.getByText("이름")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("required면 asterisk를 보여준다", () => {
    const { container } = render(
      <FormField label="이름" required>
        <input />
      </FormField>,
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("error가 있으면 Alert를 보여준다", () => {
    render(
      <FormField label="이름" error="필수 항목입니다.">
        <input />
      </FormField>,
    );

    expect(screen.getByText("필수 항목입니다.")).toBeInTheDocument();
  });
});
