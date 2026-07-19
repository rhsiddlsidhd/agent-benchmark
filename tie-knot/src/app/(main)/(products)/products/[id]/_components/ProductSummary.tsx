"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useOrderStore } from "@/store/order.store";
import { Product } from "@/services/product.service";
import { PremiumFeature } from "@/services/premiumFeature.service";
import { CheckoutItem } from "@/types";
import { ProductSummary as PureProductSummary } from "@/components/organisms/ProductSummary";

export function ProductSummary({
  product,
  options,
}: {
  product: Product;
  options: PremiumFeature[];
}) {
  const router = useRouter();
  const setOrder = useOrderStore((state) => state.setOrder);

  const handlePurchase = useCallback(
    (checkoutData: CheckoutItem) => {
      setOrder(checkoutData);
      router.push("/couple-info");
    },
    [setOrder, router],
  );

  return (
    <PureProductSummary
      product={product}
      options={options}
      onPurchase={handlePurchase}
    />
  );
}
