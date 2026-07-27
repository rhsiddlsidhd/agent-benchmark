"use server";

import { APIResponse } from "@/shared/types";
import { validateAndFlatten } from "@/shared/utils";
import { premiumFeatureSchema } from "@/shared/schemas";
import { updatePremiumFeatureService, requireAuth } from "@/server/services";
import { handleActionError } from "@/server/actions/handleActionError";
import { routes } from "@/shared/constants";
import { revalidatePath } from "next/cache";

export const updatePremiumFeature = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const featureId = formData.get("featureId") as string;

  if (!featureId) {
    return {
      success: false,
      error: { category: "VALIDATION", message: "기능 ID가 필요합니다." },
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
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: parsed.error },
    };
  }

  try {
    const { role } = await requireAuth();
    if (role !== "ADMIN") {
      return {
        success: false,
        error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
      };
    }

    await updatePremiumFeatureService(featureId, parsed.data);

    revalidatePath(routes.admin.premiumFeatures.root);

    return {
      success: true,
      data: { message: "프리미엄 기능이 수정되었습니다." },
    };
  } catch (e) {
    return handleActionError(e);
  }
};
