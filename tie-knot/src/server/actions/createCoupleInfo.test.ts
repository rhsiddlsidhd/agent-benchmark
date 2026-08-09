import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  createCoupleInfoService: vi.fn(),
  isValidSubwayStationName: vi.fn(),
  attachCoupleInfoToOrder: vi.fn(),
}));

import {
  requireAuth,
  createCoupleInfoService,
  isValidSubwayStationName,
  attachCoupleInfoToOrder,
} from "@/server/services";
import { createCoupleInfo } from "./createCoupleInfo";

const USER_ID = "user-1";
const COUPLE_INFO_ID = "couple-1";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    groom_name: "홍길동",
    groom_phone: "010-1111-2222",
    bride_name: "김철수",
    bride_phone: "010-3333-4444",
    wedding_date: "2026-10-10",
    wedding_time: "13:00",
    venue_name: "더채플앳청담",
    venue_address: "서울 강남구",
    venue_address_detail: "3층",
    groom_bank_name: "",
    groom_account_number: "",
    bride_bank_name: "",
    bride_account_number: "",
    subway_station: "",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("createCoupleInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await createCoupleInfo(null, buildFormData({ groom_name: "" }));

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: expect.any(Object) },
    });
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("지하철역이 존재하지 않으면 VALIDATION을 리턴한다", async () => {
    vi.mocked(isValidSubwayStationName).mockResolvedValue(false);

    const result = await createCoupleInfo(null, buildFormData({ subway_station: "없는역" }));

    expect(result).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요",
        fieldErrors: { subwayStation: ["존재하지 않는 지하철역입니다."] },
      },
    });
    expect(createCoupleInfoService).not.toHaveBeenCalled();
  });

  it("정상 경로: 커플 정보를 등록하고 성공 메시지를 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ userId: USER_ID } as never);
    vi.mocked(createCoupleInfoService).mockResolvedValue({
      _id: COUPLE_INFO_ID,
    } as never);

    const result = await createCoupleInfo(null, buildFormData());

    expect(createCoupleInfoService).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, venue: "더채플앳청담" }),
    );
    expect(result).toEqual({
      success: true,
      data: {
        message: "커플 정보가 성공적으로 등록되었습니다.",
        _id: COUPLE_INFO_ID,
      },
    });
  });

  it("orderId가 없으면 attachCoupleInfoToOrder를 호출하지 않는다(기존 흐름)", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ userId: USER_ID } as never);
    vi.mocked(createCoupleInfoService).mockResolvedValue({ _id: COUPLE_INFO_ID } as never);

    await createCoupleInfo(null, buildFormData());

    expect(attachCoupleInfoToOrder).not.toHaveBeenCalled();
  });

  it("orderId가 있으면 생성된 커플 정보를 해당 주문에 연결한다(결제 이후 흐름)", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ userId: USER_ID } as never);
    vi.mocked(createCoupleInfoService).mockResolvedValue({ _id: COUPLE_INFO_ID } as never);
    vi.mocked(attachCoupleInfoToOrder).mockResolvedValue({} as never);

    const result = await createCoupleInfo(null, buildFormData({ orderId: "order-1" }));

    expect(attachCoupleInfoToOrder).toHaveBeenCalledWith("order-1", COUPLE_INFO_ID, USER_ID);
    expect(result.success).toBe(true);
  });

  it("attachCoupleInfoToOrder가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ userId: USER_ID } as never);
    vi.mocked(createCoupleInfoService).mockResolvedValue({ _id: COUPLE_INFO_ID } as never);
    vi.mocked(attachCoupleInfoToOrder).mockRejectedValue(
      new AppError("FORBIDDEN", "본인 주문만 연결할 수 있습니다."),
    );

    const result = await createCoupleInfo(null, buildFormData({ orderId: "order-1" }));

    expect(result).toEqual({
      success: false,
      error: { category: "FORBIDDEN", message: "본인 주문만 연결할 수 있습니다.", fieldErrors: undefined },
    });
  });

  it("서비스가 falsy를 리턴하면 INTERNAL을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ userId: USER_ID } as never);
    vi.mocked(createCoupleInfoService).mockResolvedValue(null as never);

    const result = await createCoupleInfo(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "INTERNAL", message: "커플 정보 등록에 실패하였습니다." },
    });
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AppError("UNAUTHENTICATED", "로그인이 필요합니다."));

    const result = await createCoupleInfo(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "UNAUTHENTICATED", message: "로그인이 필요합니다.", fieldErrors: undefined },
    });
  });
});
