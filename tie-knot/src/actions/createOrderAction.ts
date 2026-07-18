"use server";

import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";
import { redirect } from "next/navigation";

import { getCookie } from "@/lib/cookies/get";
import { decrypt } from "@/lib/token";
import { getUser } from "@/services/auth.service";
import { createOrderService } from "@/services/order.service";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { createOrderSchema } from "@/schemas/order.schema";
import { PayMethod } from "@/models/payment";

export type CreateOrderResult = {
  merchantUid: string;
  finalPrice: number;
  payMethod: PayMethod;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  title: string;
  userId: string;
  productId: string;
  message: string;
};

export async function createOrderAction(
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<CreateOrderResult>> {
  try {
    // 쿠키에서 Refresh Token 가져와서 사용자 검증
    const cookie = await getCookie("token");
    const refreshToken = cookie?.value;

    if (!refreshToken) {
      redirect("/login");
    }

    const { payload } = await decrypt({ token: refreshToken, type: "REFRESH" });

    if (!payload.id) {
      throw new HTTPError("유효하지 않은 토큰입니다.", 401);
    }

    const user = await getUser({ id: payload.id });

    if (!user) {
      throw new HTTPError("사용자를 찾을 수 없습니다.", 404);
    }

    // FormData에서 주문 정보 추출
    const selectedOptionsRaw = formData.get("selectedFeatures") as string;

    const data = {
      coupleInfoId: formData.get("coupleInfoId") as string,
      buyerName: formData.get("buyerName") as string,
      buyerEmail: formData.get("buyerEmail") as string,
      buyerPhone: formData.get("buyerPhone") as string,
      payMethod: formData.get("payMethod") as PayMethod,
      product: {
        productId: formData.get("productId") as string,
        title: formData.get("productTitle") as string,
        thumbnail: formData.get("productThumbnail") as string,
        pricing: {
          originalPrice: Number(formData.get("originalPrice")),
          discountedPrice: Number(formData.get("discountedPrice")),
        },
        quantity: Number(formData.get("productQuantity")),
        selectedFeatures: JSON.parse(selectedOptionsRaw) ?? [],
      },
    };

    // Zod 스키마로 유효성 검증
    const parsed = validateAndFlatten(createOrderSchema, data);

    if (!parsed.success) {
      throw new HTTPError("입력값이 올바르지 않습니다.", 400, parsed.error);
    }

    const order = await createOrderService({
      ...parsed.data,
      userId: user._id,
    });

    return success<CreateOrderResult>({
      merchantUid: order.merchantUid,
      finalPrice: order.finalPrice,
      payMethod: order.payMethod,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      buyerPhone: order.buyerPhone,
      title: order.product.title,
      userId: order.userId.toString(),
      productId: order.product.productId.toString(),
      message: "주문이 성공적으로 생성되었습니다. 결제를 진행해주세요.",
    });
  } catch (e) {
    return handleActionError(e);
  }
}
