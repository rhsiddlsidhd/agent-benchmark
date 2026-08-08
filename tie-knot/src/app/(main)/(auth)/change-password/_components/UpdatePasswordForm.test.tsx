import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("?t=token-1"),
}));

vi.mock("@/server/actions", () => ({
  updateUserPassword: vi.fn(),
  clearUserEmailCookie: vi.fn().mockResolvedValue(undefined),
}));

import { clearUserEmailCookie } from "@/server/actions";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

describe("UpdatePasswordForm (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("언마운트 시 userEmail 쿠키 정리 액션을 호출한다", () => {
    const { unmount } = render(<UpdatePasswordForm />);

    unmount();

    expect(clearUserEmailCookie).toHaveBeenCalled();
  });
});
