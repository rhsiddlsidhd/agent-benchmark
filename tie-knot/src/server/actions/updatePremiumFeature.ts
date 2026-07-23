"use server";

import { APIResponse } from "@/shared/types";
import { validateAndFlatten } from "@/shared/utils";
import { premiumFeatureSchema } from "@/shared/schemas";
import { updatePremiumFeatureService } from "@/server/services";
import { revalidatePath } from "next/cache";

export const updatePremiumFeature = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const featureId = formData.get("featureId") as string;

  if (!featureId) {
    return {
      success: false,
      error: { message: "기능 ID가 필요합니다.", code: 400 },
    };
  }

  const data = {
    code: formData.get("code") as string,
    label: formData.get("label") as string,
    description: formData.get("description") as string,
    additionalPrice: Number(formData.get("additionalPrice")),
  };

  const parsed = validateAndFlatten(premiumFeatureSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: { message: "입력값을 확인해주세요", code: 400, fieldErrors: parsed.error },
    };
  }

  try {
    await updatePremiumFeatureService(featureId, parsed.data);

    revalidatePath("/admin/premium-features");

    return {
      success: true,
      data: { message: "프리미엄 기능이 수정되었습니다." },
    };
  } catch {
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
};
