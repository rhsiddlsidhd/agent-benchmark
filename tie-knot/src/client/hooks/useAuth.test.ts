import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));

vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/client/fetcher", () => ({ fetcher: vi.fn() }));

import { useAuth } from "./useAuth";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("세션이 있으면 session과 isLoading:false를 리턴한다", () => {
    useSWRMock.mockReturnValue({
      data: { role: "USER", email: "a@b.com", userId: "user-1" },
      isLoading: false,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.session).toEqual({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("세션이 없으면(null) session이 null이다", () => {
    useSWRMock.mockReturnValue({ data: null, isLoading: false });

    const { result } = renderHook(() => useAuth());

    expect(result.current.session).toBeNull();
  });

  it("로딩 중이면 isLoading:true를 리턴한다", () => {
    useSWRMock.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
  });
});
