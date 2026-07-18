"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import StatusSelect from "@/components/molecules/StatusSelect";
import { useOrderStore } from "@/store/order.store";
import { Product } from "@/services/product.service";
import { PremiumFeature } from "@/services/premiumFeature.service";
import { CheckoutItem } from "@/types/checkout";
import { SelectFeatureDto } from "@/schemas/order.schema";
import { calculatePrice, formatPriceWithComma } from "@/utils/price";

const ProductOptions = ({
  product,
  options,
}: {
  product: Product;
  options: PremiumFeature[];
}) => {
  const router = useRouter();
  const setOrder = useOrderStore((state) => state.setOrder);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  const optionsMap = useMemo(() => {
    const map = new Map<string, PremiumFeature>();
    options.forEach((option) => map.set(option._id.toString(), option));
    return map;
  }, [options]);

  const discountedPrice = useMemo(() => {
    return calculatePrice(product.price, product.discount);
  }, [product.price, product.discount]);

  const handleSelectOption = useCallback((value: string) => {
    setSelectedOptionIds((prev) => {
      if (prev.includes(value)) {
        toast.warning("이미 선택한 옵션입니다.");
        return prev;
      }
      return [...prev, value];
    });
  }, []);

  const _options = useMemo(() => {
    return options.map((option) => ({
      label: `${option.label} (+${formatPriceWithComma(
        option.additionalPrice,
      )}원)`,
      value: option._id.toString(),
      originalFeature: option,
    }));
  }, [options]);

  const handleDeselectOption = useCallback((value: string) => {
    setSelectedOptionIds((prev) => prev.filter((id) => id !== value));
  }, []);

  const { selectedOptionsDetails, totalPrice } = useMemo(() => {
    let currentSelectedOptionPrice = 0;
    const currentSelectedOptionsDetails: SelectFeatureDto[] = [];

    selectedOptionIds.forEach((id) => {
      const selectedOpt = optionsMap.get(id);
      if (selectedOpt) {
        currentSelectedOptionsDetails.push({
          featureId: selectedOpt._id.toString(),
          code: selectedOpt.code,
          label: selectedOpt.label,
          price: selectedOpt.additionalPrice,
        });
        currentSelectedOptionPrice += selectedOpt.additionalPrice;
      }
    });

    const currentTotalPrice = discountedPrice + currentSelectedOptionPrice;

    return {
      selectedOptionsDetails: currentSelectedOptionsDetails,
      selectedOptionPrice: currentSelectedOptionPrice,
      totalPrice: currentTotalPrice,
    };
  }, [selectedOptionIds, optionsMap, discountedPrice]);

  const handlePurchase = useCallback(() => {
    const quantity = 1;
    const optionsTotalPrice = selectedOptionsDetails.reduce((sum, f) => sum + f.price, 0);
    const discountAmount = product.price - discountedPrice;

    const checkoutData: CheckoutItem = {
      productId: product._id.toString(),
      title: product.title,
      thumbnail: product.thumbnail,
      originalPrice: product.price,
      discountedPrice,
      discountAmount,
      optionsTotalPrice,
      finalPrice: discountedPrice * quantity + optionsTotalPrice,
      quantity,
      selectedFeatures: selectedOptionsDetails,
    };

    setOrder(checkoutData);
    router.push("/couple-info");
  }, [
    product,
    discountedPrice,
    selectedOptionsDetails,
    router,
    setOrder,
  ]);

  return (
    <div>
      {options.length > 0 && (
        <div className="col-span-2 w-full space-y-4">
          <StatusSelect
            value=""
            onValueChange={handleSelectOption}
            disabled={selectedOptionIds.length === options.length}
            items={_options}
            placeholder="프리미엄 옵션 선택"
          />
          {selectedOptionIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedOptionIds.map((id) => {
                const option = optionsMap.get(id); // optionsMap 사용
                if (!option) return null;
                return (
                  <Badge
                    key={id}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {option.label}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleDeselectOption(id)}
                      className="hover:bg-background/20 h-auto rounded-full p-0.5"
                      aria-label={`${option.label} 옵션 제거`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Total Price */}
      <div className="flex items-center justify-between py-4">
        <span className="text-md font-medium">총 상품 금액</span>
        <span className="text-destructive text-xl font-bold">
          {formatPriceWithComma(totalPrice)}원
        </span>
      </div>
      <div>
        <Button size="lg" className="w-full" onClick={handlePurchase}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          구매하기
        </Button>
      </div>
    </div>
  );
};

export default ProductOptions;
