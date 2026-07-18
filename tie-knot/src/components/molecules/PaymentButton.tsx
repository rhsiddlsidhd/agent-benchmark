"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "../atoms/button";
import { CreditCard } from "lucide-react";
import { useOrderStore } from "@/store/order.store";
import { IOrder } from "@/models/order.model";
import { CheckoutItem } from "@/types/checkout";

const PaymentButton = ({ order }: { order: IOrder }) => {
  const router = useRouter();
  const setOrder = useOrderStore((state) => state.setOrder);

  const handleClick = () => {
    const optionsTotalPrice = order.product.selectedFeatures.reduce(
      (sum, f) => sum + f.price,
      0,
    );

    const checkoutItem: CheckoutItem = {
      productId: order.product.productId.toString(),
      coupleInfoId: order.coupleInfoId.toString(),
      title: order.product.title,
      thumbnail: order.product.thumbnail,
      originalPrice: order.product.pricing.originalPrice,
      discountedPrice: order.product.pricing.discountedPrice,
      discountAmount:
        order.product.pricing.originalPrice - order.product.pricing.discountedPrice,
      optionsTotalPrice,
      finalPrice: order.finalPrice,
      quantity: order.product.quantity,
      selectedFeatures: order.product.selectedFeatures.map((f) => ({
        featureId: f.featureId.toString(),
        code: f.code,
        label: f.label,
        price: f.price,
      })),
    };

    setOrder(checkoutItem);
    router.push(`/payment?q=${order.coupleInfoId.toString()}`);
  };

  return (
    <Button size="lg" variant="default" onClick={handleClick}>
      <CreditCard className="mr-1 h-4 w-4" />
      결제하기
    </Button>
  );
};

export default PaymentButton;
