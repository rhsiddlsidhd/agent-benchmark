import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { useActionStateMock, routerPushMock, uploadMock, getPayloadMock, searchParamsMock } =
  vi.hoisted(() => ({
    useActionStateMock: vi.fn(),
    routerPushMock: vi.fn(),
    uploadMock: vi.fn(),
    getPayloadMock: vi.fn(),
    searchParamsMock: vi.fn(() => new URLSearchParams()),
  }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useActionState: useActionStateMock };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
  useSearchParams: searchParamsMock,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

vi.mock("@/server/actions", () => ({
  createCoupleInfo: vi.fn(),
  updateCoupleInfo: vi.fn(),
}));

vi.mock("./useImageUpload", () => ({
  useImageUpload: () => ({ upload: uploadMock, uploadProgress: 0, isUploading: false }),
}));
vi.mock("./useImageList", () => ({
  useImageList: () => ({ getPayload: getPayloadMock }),
}));
vi.mock("./useFetchCoupleInfo", () => ({
  useFetchCoupleInfo: () => ({ data: undefined as unknown, isLoading: false }),
}));
vi.mock("./useBanks", () => ({ useBanks: () => ({ banks: [] as unknown[] }) }));
vi.mock("./useSubwayStations", () => ({
  useSubwayStations: () => ({ subwayStations: [] as unknown[] }),
}));

import { useCoupleInfoForm } from "./useCoupleInfoForm";

const buildSubmitEvent = () =>
  ({
    preventDefault: vi.fn(),
    currentTarget: document.createElement("form"),
  }) as unknown as React.FormEvent<HTMLFormElement>;

describe("useCoupleInfoForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("URL의 orderId를 그대로 리턴한다(결제 완료 후 my-orders 진입 흐름)", () => {
    useActionStateMock.mockReturnValue([null, vi.fn()]);
    searchParamsMock.mockReturnValue(new URLSearchParams({ orderId: "order-1" }));

    const { result } = renderHook(() => useCoupleInfoForm({ type: "create" }));

    expect(result.current.orderId).toBe("order-1");
  });

  it("create 성공 시(결제 이후 my-orders 흐름) /my-orders로 이동한다", () => {
    useActionStateMock.mockReturnValue([
      { success: true, data: { _id: "abc", message: "등록 완료" } },
      vi.fn(),
    ]);

    renderHook(() => useCoupleInfoForm({ type: "create" }));

    expect(routerPushMock).toHaveBeenCalledWith("/my-orders");
  });

  it("edit 성공 시 /my-orders로 이동한다", () => {
    useActionStateMock.mockReturnValue([
      { success: true, data: { _id: "abc", message: "수정 완료" } },
      vi.fn(),
    ]);

    renderHook(() => useCoupleInfoForm({ type: "edit" }));

    expect(routerPushMock).toHaveBeenCalledWith("/my-orders");
  });

  it("state가 없으면 이동하지 않는다", () => {
    useActionStateMock.mockReturnValue([null, vi.fn()]);

    renderHook(() => useCoupleInfoForm({ type: "create" }));

    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("업로드가 실패(null)하면 action을 호출하지 않는다", async () => {
    const actionMock = vi.fn();
    useActionStateMock.mockReturnValue([null, actionMock]);
    uploadMock.mockResolvedValue(null);

    const { result } = renderHook(() => useCoupleInfoForm({ type: "create" }));

    await act(async () => {
      await result.current.handleSubmit(buildSubmitEvent());
    });

    expect(actionMock).not.toHaveBeenCalled();
  });

  it("업로드 성공 시 폼데이터를 세팅하고 action을 호출한다", async () => {
    const actionMock = vi.fn();
    useActionStateMock.mockReturnValue([null, actionMock]);
    uploadMock.mockResolvedValue({ thumbnailUrls: ["a"], galleryUrls: ["b"] });

    const { result } = renderHook(() => useCoupleInfoForm({ type: "create" }));

    await act(async () => {
      await result.current.handleSubmit(buildSubmitEvent());
    });

    expect(actionMock).toHaveBeenCalled();
  });
});
