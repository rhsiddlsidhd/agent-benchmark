import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/server/actions", () => ({
  issueEntryToken: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), message: vi.fn() },
}));

import { toast } from "sonner";
import { issueEntryToken } from "@/server/actions";
import { useEntry } from "./useEntry";

describe("useEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("정상 경로: entry 토큰 발급 성공 시 목적지로 이동한다", async () => {
    vi.mocked(issueEntryToken).mockResolvedValue({
      success: true,
      data: { path: "/login" },
    });

    const { result } = renderHook(() => useEntry("/login"));

    await act(async () => {
      result.current.handleEntry();
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
    expect(issueEntryToken).toHaveBeenCalledWith("/login");
  });

  it("실패 시 이동하지 않고 에러 토스트를 띄운다", async () => {
    vi.mocked(issueEntryToken).mockResolvedValue({
      success: false,
      error: { category: "UNAUTHENTICATED", message: "잘못된 요청입니다." },
    });

    const { result } = renderHook(() => useEntry("/login"));

    await act(async () => {
      result.current.handleEntry();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("잘못된 요청입니다.");
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
