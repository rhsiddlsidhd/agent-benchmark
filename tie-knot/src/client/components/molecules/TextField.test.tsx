import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("label과 defaultValue를 렌더링한다", () => {
    render(
      <TextField id="title" name="title" defaultValue="봄맞이 청첩장">
        제목
      </TextField>,
    );

    expect(screen.getByText("제목")).toBeInTheDocument();
    expect(screen.getByDisplayValue("봄맞이 청첩장")).toBeInTheDocument();
  });

  it("입력하면 값이 갱신된다", async () => {
    const user = userEvent.setup();
    render(
      <TextField id="title" name="title">
        제목
      </TextField>,
    );

    await user.type(screen.getByRole("textbox"), "가을 청첩장");

    expect(screen.getByDisplayValue("가을 청첩장")).toBeInTheDocument();
  });
});
