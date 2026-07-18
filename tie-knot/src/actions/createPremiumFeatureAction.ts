"use server";
import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";
import { premiumFeatureSchema } from "@/schemas/premiumFeature.schema";
import { createPremiumFeatureService } from "@/services/premiumFeature.service";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { revalidatePath } from "next/cache";

export const createPremiumFeatureAction = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const data = {
      code: formData.get("code"),
      label: formData.get("label"),
      description: formData.get("description"),
      additionalPrice: Number(formData.get("additionalPrice")),
    };

    const parsed = validateAndFlatten(premiumFeatureSchema, data);
    if (!parsed.success) {
      throw new HTTPError("입력 값을 확인해주세요", 400, parsed.error);
    }

    await createPremiumFeatureService(parsed.data);
    revalidatePath("/admin/premium-features");
    return success({ message: "프리미엄 기능을 등록하였습니다." });
  } catch (e) {
    return handleActionError(e);
  }
};
