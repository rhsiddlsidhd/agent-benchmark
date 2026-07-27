"use server";
import { APIResponse } from "@/shared/types";
import { premiumFeatureSchema } from "@/shared/schemas";
import { createPremiumFeatureService, requireAuth } from "@/server/services";
import { handleActionError } from "@/server/actions/handleActionError";
import { validateAndFlatten } from "@/shared/utils";
import { routes } from "@/shared/constants";
import { revalidatePath } from "next/cache";

export const createPremiumFeature = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    code: formData.get("code"),
    label: formData.get("label"),
    description: formData.get("description"),
    additionalPrice: Number(formData.get("additionalPrice")),
  };

  const parsed = validateAndFlatten(premiumFeatureSchema, data);
  if (!parsed.success) {
    return {
      success: false,
      error: { category: "VALIDATION", message: "입력 값을 확인해주세요", fieldErrors: parsed.error },
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

    await createPremiumFeatureService(parsed.data);
    revalidatePath(routes.admin.premiumFeatures.root);
    return { success: true, data: { message: "프리미엄 기능을 등록하였습니다." } };
  } catch (e) {
    return handleActionError(e);
  }
};
