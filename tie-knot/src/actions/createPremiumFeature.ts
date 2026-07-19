"use server";
import { APIResponse } from "@/types";
import { premiumFeatureSchema } from "@/schemas/premiumFeature.schema";
import { createPremiumFeatureService } from "@/services/premiumFeature.service";
import { validateAndFlatten } from "@/utils";
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
      error: { message: "입력 값을 확인해주세요", code: 400, fieldErrors: parsed.error },
    };
  }

  try {
    await createPremiumFeatureService(parsed.data);
    revalidatePath("/admin/premium-features");
    return { success: true, data: { message: "프리미엄 기능을 등록하였습니다." } };
  } catch {
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
};
