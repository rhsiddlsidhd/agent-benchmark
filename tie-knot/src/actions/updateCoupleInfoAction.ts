"use server";

import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";
import { getCookie } from "@/lib/cookies/get";
import { decrypt } from "@/lib/token";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { coupleInfoSchema } from "@/schemas/coupleInfo.schema";
import { updateCoupleInfoService } from "@/services/coupleInfo.service";

export const updateCoupleInfoAction = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string; _id: string }>> => {
  try {
    const coupleInfoId = formData.get("couple_info_id") as string;

    if (!coupleInfoId) {
      throw new HTTPError("잘못된 접근입니다.", 400);
    }

    // 2. 인증 확인
    const cookie = await getCookie("token");

    if (!cookie?.value) {
      throw new HTTPError("로그인이 필요합니다.", 401);
    }

    const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });

    if (!payload.id) throw new HTTPError("유효하지 않은 토큰입니다.", 401);

    // 3. FormData 파싱
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

    // 4. Validation
    const parsed = validateAndFlatten(coupleInfoSchema, data);

    if (!parsed.success) {
      throw new HTTPError("입력값을 확인해주세요", 400, parsed.error);
    }

    // 5. DB 업데이트
    const updated = await updateCoupleInfoService(coupleInfoId, payload.id, parsed.data);

    if (!updated) {
      throw new HTTPError("커플 정보 업데이트에 실패하였습니다.", 500);
    }

    return success<{ message: string; _id: string }>({
      message: "커플 정보가 성공적으로 업데이트되었습니다.",
      _id: coupleInfoId,
    });
  } catch (error) {
    return handleActionError(error);
  }
};
