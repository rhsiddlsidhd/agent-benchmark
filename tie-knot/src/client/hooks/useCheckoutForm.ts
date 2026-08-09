"use client";

import { useState, startTransition } from "react";
import type React from "react";
import { toast } from "sonner";
import { validateAndFlatten } from "@/shared/utils";
import { BuyerInfo, BuyerInfoSchema } from "@/shared/schemas";
import { CheckoutItem } from "@/shared/types";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { routes } from "@/shared/constants";

interface UseCheckoutFormOptions {
  order: CheckoutItem | null;
  action: (formData: FormData) => void;
  router: AppRouterInstance;
}

export function useCheckoutForm({
  order,
  action,
  router,
}: UseCheckoutFormOptions) {
  const [errors, setErrors] = useState<Partial<Record<keyof BuyerInfo, string[]>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!order) {
      toast.error("주문 정보를 찾을 수 없습니다. 다시 시도해주세요.");
      router.replace(routes.products.root);
      return;
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const parsed = validateAndFlatten<BuyerInfo>(BuyerInfoSchema, {
      buyerName: formData.get("buyerName") as string,
      buyerEmail: formData.get("buyerEmail") as string,
      buyerPhone: formData.get("buyerPhone") as string,
      payMethod: formData.get("payMethod") as string,
    });

    if (!parsed.success) {
      setErrors(parsed.error);
      return;
    }

    const { productId, originalPrice, discountedPrice, quantity, selectedFeatures, thumbnail, title, coupleInfoId } = order;
    formData.append("productId", productId);
    formData.append("productTitle", title);
    formData.append("productThumbnail", thumbnail);
    formData.append("productQuantity", String(quantity));
    formData.append("originalPrice", String(originalPrice));
    formData.append("discountedPrice", String(discountedPrice));
    formData.append("selectedFeatures", JSON.stringify(selectedFeatures ?? []));
    // 결제 이후 my-orders 흐름에서 채워지는 콘텐츠라 결제 시점엔 없을 수 있다.
    if (coupleInfoId) formData.append("coupleInfoId", coupleInfoId);

    startTransition(() => action(formData));
  };

  return { errors, handleSubmit };
}
