"use server";

import { APIResponse } from "@/types";
import { HTTPError } from "@/types";
import { redirect } from "next/navigation";

import { getCookie } from "@/lib/cookies";
import { requireAuth } from "@/services/auth.service";
import { createOrderService } from "@/services/order.service";
import { validateAndFlatten } from "@/utils";
import { createOrderSchema } from "@/schemas/order.schema";
import { PayMethod } from "@/models/payment.model";

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

export async function createOrder(
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<CreateOrderResult>> {
  // 로그인 안 된 상태면 로그인 페이지로(리다이렉트는 try/catch 밖에서)
  const cookie = await getCookie("token");
  if (!cookie?.value) {
    redirect("/login");
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
    return {
      success: false,
      error: { message: "입력값이 올바르지 않습니다.", code: 400, fieldErrors: parsed.error },
    };
  }

  try {
    const { userId } = await requireAuth();

    const order = await createOrderService({
      ...parsed.data,
      userId,
    });

    return {
      success: true,
      data: {
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
}
