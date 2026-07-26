import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorFallback } from "./ErrorFallback";

const error = Object.assign(new Error("boom"), { digest: "abc123" });

describe("ErrorFallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("title/description을 렌더링한다", () => {
    render(
      <ErrorFallback
        error={error}
        retry={vi.fn()}
        title="오류가 발생했습니다"
        description="문제가 발생했습니다."
      />,
    );

    expect(screen.getByText("오류가 발생했습니다")).toBeInTheDocument();
    expect(screen.getByText("문제가 발생했습니다.")).toBeInTheDocument();
  });

  it("다시 시도 버튼 클릭 시 retry를 호출한다", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();

    render(<ErrorFallback error={error} retry={retry} />);

    await user.click(screen.getByRole("button", { name: /다시 시도/ }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("backPath/backLabel로 돌아가기 링크를 렌더링한다", () => {
    render(
      <ErrorFallback
        error={error}
        retry={vi.fn()}
        backPath="/admin/dashboard"
        backLabel="관리자 대시보드로"
      />,
    );

    const link = screen.getByRole("link", { name: /관리자 대시보드로/ });
    expect(link).toHaveAttribute("href", "/admin/dashboard");
  });

  it("개발 모드에서는 에러 메시지와 digest를 보여준다", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(<ErrorFallback error={error} retry={vi.fn()} />);

    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it("프로덕션 모드에서는 에러 상세를 보여주지 않는다", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(<ErrorFallback error={error} retry={vi.fn()} />);

    expect(screen.queryByText("boom")).not.toBeInTheDocument();
  });
});
