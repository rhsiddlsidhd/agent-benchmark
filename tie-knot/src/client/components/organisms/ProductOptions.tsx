"use client";
import React, { useCallback, useMemo, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

import { Badge, Button } from "@/client/components/atoms";

import { QuantityStepper, StatusSelect } from "@/client/components/molecules";
import { Product, PremiumFeature } from "@/server/services";

import { CheckoutItem } from "@/shared/types";
import { SelectFeatureDto } from "@/shared/schemas";
import { calculatePrice, formatPriceWithComma } from "@/shared/utils";

// 무제한(maxQuantity===0) 모드의 stepper 상한 — DB/서버 제약이 아니라 순수 UI 편의 상한이다.
// 서버(createOrder)는 maxQuantity===0이면 상한 검증 자체를 스킵한다(진짜 무제한).
// 경계면 검증에서 "UI 99 vs 서버 무제한 = 불일치"로 오판하지 말 것(01_ui_flow.md §7-1).
const UNLIMITED_SOFT_MAX = 99;

type QuantityMode = "fixed" | "open" | "range";

// 분기 입력은 오직 minQuantity/maxQuantity 두 숫자뿐이다 — product.category를 읽지 않는다.
const deriveQuantityMode = (minQuantity: number, maxQuantity: number): QuantityMode => {
  if (minQuantity === 1 && maxQuantity === 1) return "fixed";
  if (maxQuantity === 0) return "open";
  return "range";
};

const ProductOptions = ({
  product,
  options,
  onPurchase,
}: {
  product: Product;
  options: PremiumFeature[];
  onPurchase: (checkoutData: CheckoutItem) => void;
}) => {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  const mode = useMemo(
    () => deriveQuantityMode(product.minQuantity, product.maxQuantity),
    [product.minQuantity, product.maxQuantity],
  );

  // 1로 초기화하지 않는다 — min이 2 이상인 상품에서 즉시 범위 밖이 된다.
  const [quantity, setQuantity] = useState(product.minQuantity);

  const upperBound = mode === "open" ? UNLIMITED_SOFT_MAX : product.maxQuantity;

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

    // 수량을 곱하지 않던 기존 버그 수정 — 화면 "총 상품 금액"이 /payment의
    // finalPrice(discountedPrice * quantity + optionsTotalPrice)와 어긋나면 안 된다.
    const currentTotalPrice = discountedPrice * quantity + currentSelectedOptionPrice;

    return {
      selectedOptionsDetails: currentSelectedOptionsDetails,
      selectedOptionPrice: currentSelectedOptionPrice,
      totalPrice: currentTotalPrice,
    };
  }, [selectedOptionIds, optionsMap, discountedPrice, quantity]);

  const handlePurchase = useCallback(() => {
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

    onPurchase(checkoutData);
  }, [product, discountedPrice, selectedOptionsDetails, onPurchase, quantity]);

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

      {/* Quantity */}
      <div className="flex items-center justify-between border-t py-4">
        <span className="text-md font-medium">수량</span>
        {mode === "fixed" ? (
          <span
            aria-disabled="true"
            className="text-muted-foreground rounded-md border px-3 py-1.5 text-sm opacity-60"
          >
            1개
          </span>
        ) : (
          <QuantityStepper
            id="quantity"
            value={quantity}
            min={product.minQuantity}
            max={upperBound}
            onChange={setQuantity}
            unlimited={mode === "open"}
          />
        )}
      </div>

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

export { ProductOptions };
