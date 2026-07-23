"use server";

import { APIResponse } from "@/shared/types";
import { HTTPError } from "@/shared/types";
import { requireAuth, updateCoupleInfoService, isValidSubwayStationName } from "@/server/services";
import { validateAndFlatten } from "@/shared/utils";
import { coupleInfoSchema } from "@/shared/schemas";

export const updateCoupleInfo = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string; _id: string }>> => {
  const coupleInfoId = formData.get("couple_info_id") as string;

  if (!coupleInfoId) {
    return {
      success: false,
      error: { message: "잘못된 접근입니다.", code: 400 },
    };
  }

  const thumbnailRaw = formData.get("thumbnailSource") as string;
  const galleryRaw = formData.get("gallerySource") as string;

  const galleryData: string[] = galleryRaw ? JSON.parse(galleryRaw) : [];

  const buildParentData = (prefix: string) => {
    const name = formData.get(`${prefix}_name`) as string;
    const phone = formData.get(`${prefix}_phone`) as string;

    if (!name || !phone) return undefined;

    return {
      name,
      phone,
      bankName: formData.get(`${prefix}_bank_name`) as string,
      accountNumber: formData.get(`${prefix}_account_number`) as string,
    };
  };

  const data = {
    groom: {
      name: formData.get("groom_name") as string,
      phone: formData.get("groom_phone") as string,
      bankName: formData.get("groom_bank_name") as string,
      accountNumber: formData.get("groom_account_number") as string,
      father: buildParentData("groom_parents_father"),
      mother: buildParentData("groom_parents_mother"),
    },
    bride: {
      name: formData.get("bride_name") as string,
      phone: formData.get("bride_phone") as string,
      bankName: formData.get("bride_bank_name") as string,
      accountNumber: formData.get("bride_account_number") as string,
      father: buildParentData("bride_parents_father"),
      mother: buildParentData("bride_parents_mother"),
    },
    weddingDate: formData.get("wedding_date") as string,
    weddingTime: formData.get("wedding_time") as string,
    venue: formData.get("venue_name") as string,
    address: formData.get("venue_address") as string,
    addressDetail: formData.get("venue_address_detail") as string,
    subwayStation: formData.get("subway_station") as string,
    guestbookEnabled: formData.get("guestbook_enabled") === "on",
    thumbnailImages: thumbnailRaw ? JSON.parse(thumbnailRaw) : [],
    galleryImages: galleryData,
  };

  const parsed = validateAndFlatten(coupleInfoSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: { message: "입력값을 확인해주세요", code: 400, fieldErrors: parsed.error },
    };
  }

  if (
    parsed.data.subwayStation &&
    !(await isValidSubwayStationName(parsed.data.subwayStation))
  ) {
    return {
      success: false,
      error: {
        message: "입력값을 확인해주세요",
        code: 400,
        fieldErrors: { subwayStation: ["존재하지 않는 지하철역입니다."] },
      },
    };
  }

  try {
    const { userId } = await requireAuth();

    const updated = await updateCoupleInfoService(coupleInfoId, userId, parsed.data);

    if (!updated) {
      return {
        success: false,
        error: { message: "커플 정보 업데이트에 실패하였습니다.", code: 500 },
      };
    }

    return {
      success: true,
      data: {
        message: "커플 정보가 성공적으로 업데이트되었습니다.",
        _id: coupleInfoId,
      },
    };
  } catch (e) {
    if (e instanceof HTTPError) {
      return { success: false, error: { message: e.message, code: e.code } };
    }
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
};
