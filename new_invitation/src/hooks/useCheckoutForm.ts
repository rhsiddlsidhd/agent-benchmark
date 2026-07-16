import { useState, startTransition } from "react";
import type React from "react";
import { toast } from "sonner";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { BuyerInfo, BuyerInfoSchema } from "@/schemas/order.schema";
import { CheckoutItem } from "@/types/checkout";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface UseCheckoutFormOptions {
  query: string;
  order: CheckoutItem | null;
  action: (formData: FormData) => void;
  router: AppRouterInstance;
}

export function useCheckoutForm({
  query,
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
      router.replace("/products");
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
    formData.append("coupleInfoId", coupleInfoId ?? query);

    startTransition(() => action(formData));
  };

  return { errors, handleSubmit };
}
