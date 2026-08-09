import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageField } from "./ImageField";

const buildItem = (id: string) => ({
  type: "new" as const,
  id,
  preview: `https://example.com/${id}.jpg`,
  file: new File(["a"], `${id}.png`, { type: "image/png" }),
});

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

  it("파일 선택을 취소하면(0개) onAdd를 호출하지 않고 입력값을 리셋한다", () => {
    const onAdd = vi.fn();
    render(<ImageField id="thumb" items={[]} onAdd={onAdd} onRemove={vi.fn()} />);

    const input = document.getElementById("thumb") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });

    expect(onAdd).not.toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("maxCount 여유분(remaining)만큼만 잘라서 onAdd를 호출한다", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <ImageField
        id="thumb"
        items={[buildItem("existing")]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        maxCount={3}
      />,
    );

    const fileA = new File(["a"], "a.png", { type: "image/png" });
    const fileB = new File(["b"], "b.png", { type: "image/png" });
    const fileC = new File(["c"], "c.png", { type: "image/png" });
    const input = document.getElementById("thumb") as HTMLInputElement;
    await user.upload(input, [fileA, fileB, fileC]);

    // items 1개 + maxCount 3 → remaining 2, 3개 선택해도 앞 2개만 onAdd
    expect(onAdd).toHaveBeenCalledWith([fileA, fileB]);
  });

  it("remaining이 0 이하이면(이미 maxCount만큼 채워짐) onAdd를 호출하지 않는다", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <ImageField
        id="thumb"
        items={[buildItem("a"), buildItem("b")]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        maxCount={2}
      />,
    );

    const file = new File(["c"], "c.png", { type: "image/png" });
    const input = document.getElementById("thumb") as HTMLInputElement;
    await user.upload(input, file);

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("삭제 버튼 클릭 시 onRemove를 해당 id로 호출한다", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <ImageField
        id="thumb"
        items={[buildItem("target")]}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    expect(onRemove).toHaveBeenCalledWith("target");
  });
});
