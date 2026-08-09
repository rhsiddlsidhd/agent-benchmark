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

  it("error가 있으면 aria-invalid와 에러 메시지를 렌더링한다", () => {
    render(
      <TextField id="title" name="title" error="제목을 입력해주세요">
        제목
      </TextField>,
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("제목을 입력해주세요")).toBeInTheDocument();
  });

  it("readOnly면 입력 필드가 readOnly 속성을 가진다", () => {
    render(
      <TextField id="title" name="title" defaultValue="고정값" readOnly>
        제목
      </TextField>,
    );

    expect(screen.getByDisplayValue("고정값")).toHaveAttribute("readonly");
  });

  it("type을 커스텀 값으로 지정할 수 있다", () => {
    render(
      <TextField id="password" name="password" type="password">
        비밀번호
      </TextField>,
    );

    const input = screen.getByLabelText("비밀번호") as HTMLInputElement;
    expect(input.type).toBe("password");
  });

  it("defaultValue가 리렌더 중 바뀌면 값이 재동기화된다", () => {
    const { rerender } = render(
      <TextField id="title" name="title" defaultValue="첫번째">
        제목
      </TextField>,
    );

    expect(screen.getByDisplayValue("첫번째")).toBeInTheDocument();

    rerender(
      <TextField id="title" name="title" defaultValue="두번째">
        제목
      </TextField>,
    );

    expect(screen.getByDisplayValue("두번째")).toBeInTheDocument();
  });
});
