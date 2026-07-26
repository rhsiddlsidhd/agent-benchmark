import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GlobalError from "./global-error";

const error = Object.assign(new Error("boom"), { digest: "abc123" });

describe("GlobalError", () => {
  it("ErrorFallback 기본 문구를 렌더링한다", () => {
    render(<GlobalError error={error} unstable_retry={vi.fn()} />);

    expect(screen.getByText("오류가 발생했습니다")).toBeInTheDocument();
  });

  it("다시 시도 버튼 클릭 시 unstable_retry를 호출한다", async () => {
    const unstable_retry = vi.fn();
    const user = userEvent.setup();

    render(<GlobalError error={error} unstable_retry={unstable_retry} />);

    await user.click(screen.getByRole("button", { name: /다시 시도/ }));

    expect(unstable_retry).toHaveBeenCalledTimes(1);
  });
});
