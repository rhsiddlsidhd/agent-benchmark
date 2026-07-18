"use server";

import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { premiumFeatureSchema } from "@/schemas/premiumFeature.schema";
import { updatePremiumFeatureService } from "@/services/premiumFeature.service";
import { revalidatePath } from "next/cache";

export const updatePremiumFeatureAction = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const featureId = formData.get("featureId") as string;

    if (!featureId) {
      throw new HTTPError("기능 ID가 필요합니다.", 400);
    }

    const data = {
      code: formData.get("code") as string,
      label: formData.get("label") as string,
      description: formData.get("description") as string,
      additionalPrice: Number(formData.get("additionalPrice")),
    };

    const parsed = validateAndFlatten(premiumFeatureSchema, data);

    if (!parsed.success) {
      throw new HTTPError("입력값을 확인해주세요", 400, parsed.error);
    }

    await updatePremiumFeatureService(featureId, parsed.data);

    revalidatePath("/admin/premium-features");

    return success<{ message: string }>({
      message: "프리미엄 기능이 수정되었습니다.",
    });
  } catch (e) {
    return handleActionError(e);
  }
};
