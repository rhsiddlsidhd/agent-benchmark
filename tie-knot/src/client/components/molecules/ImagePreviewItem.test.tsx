import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImagePreviewItem } from "./ImagePreviewItem";

describe("ImagePreviewItem", () => {
  it("preview 이미지를 렌더링한다", () => {
    render(
      <ImagePreviewItem id="1" preview="https://example.com/a.jpg" onRemove={vi.fn()} />,
    );

    expect(screen.getByAltText("Preview 1")).toBeInTheDocument();
  });

  it("삭제 버튼 클릭 시 onRemove를 id와 함께 호출한다", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <ImagePreviewItem id="1" preview="https://example.com/a.jpg" onRemove={onRemove} />,
    );

    await user.click(screen.getByRole("button"));

    expect(onRemove).toHaveBeenCalledWith("1");
  });
});
