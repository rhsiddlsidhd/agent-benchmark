import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageField } from "./ImageField";

describe("ImageField", () => {
  it("항목이 없으면 업로드 안내를 보여준다", () => {
    render(<ImageField id="thumb" items={[]} onAdd={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText("클릭하여 이미지 업로드")).toBeInTheDocument();
  });

  it("항목이 있으면 미리보기와 추가 버튼을 보여준다", () => {
    render(
      <ImageField
        id="thumb"
        items={[
          {
            type: "new",
            id: "1",
            preview: "https://example.com/a.jpg",
            file: new File(["a"], "a.png", { type: "image/png" }),
          },
        ]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByAltText("Preview 1")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("maxCount에 도달하면 추가 버튼을 숨긴다(삭제 버튼만 남는다)", () => {
    render(
      <ImageField
        id="thumb"
        items={[
          {
            type: "new",
            id: "1",
            preview: "https://example.com/a.jpg",
            file: new File(["a"], "a.png", { type: "image/png" }),
          },
        ]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        maxCount={1}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("파일 선택 시 onAdd를 호출한다", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(<ImageField id="thumb" items={[]} onAdd={onAdd} onRemove={vi.fn()} />);

    const file = new File(["a"], "a.png", { type: "image/png" });
    const input = document.getElementById("thumb") as HTMLInputElement;
    await user.upload(input, file);

    expect(onAdd).toHaveBeenCalledWith([file]);
  });
});
