"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { formatPriceWithComma } from "@/utils/price";
import ProductThumbnail from "@/components/molecules/ProductThumbnail";
import { DELIVERY_FEE } from "@/constants/price";

import { useCheckoutData } from "@/hooks/useCheckoutData";
import { SelectFeatureDto } from "@/schemas/order.schema";
import { TypographyH3, TypographyMuted, TypographyP, TypographySmall } from "@/components/atoms/typoqraphy";


export const OrderSummary = () => {
  const { data, loading } = useCheckoutData();

  if (loading) {
    return (
      <main className="bg-background flex min-h-screen items-center justify-center">
        <TypographyP>주문 정보를 불러오는 중...</TypographyP>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="bg-background flex min-h-screen items-center justify-center">
        <TypographyP>상품 정보를 찾을 수 없습니다.</TypographyP>
      </main>
    );
  }

  const {
    title,
    thumbnail,
    originalPrice,
    discountedPrice,
    discountAmount,
    optionsTotalPrice,
    finalPrice,
    selectedFeatures,
    quantity,
  } = data;

  const total = finalPrice + DELIVERY_FEE;
  return (
    <div className="lg:sticky lg:top-24">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>주문 내역</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="bg-muted relative h-24 w-20 shrink-0 overflow-hidden rounded-lg">
              <ProductThumbnail src={thumbnail} sizes="80px" />
            </div>
            <div className="min-w-0 flex-1">
              <TypographyH3 className="mb-1 truncate font-medium">
                {title}
              </TypographyH3>
              <TypographyMuted>청첩장 템플릿</TypographyMuted>
              <TypographyMuted className="mt-2 font-semibold text-foreground">
                {formatPriceWithComma(discountedPrice)}원
              </TypographyMuted>
            </div>
          </div>

          {selectedFeatures && selectedFeatures.length > 0 && (
            <div className="space-y-1">
              <TypographySmall className="font-medium">선택 옵션:</TypographySmall>
              {selectedFeatures.map((option: SelectFeatureDto) => (
                <div
                  key={option.featureId}
                  className="flex justify-between text-xs"
                >
                  <span className="text-muted-foreground ml-2">
                    - {option.label}
                  </span>
                  <span className="text-foreground">
                    +{formatPriceWithComma(option.price)}원
                  </span>
                </div>
              ))}
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">옵션 총액</span>
                <span className="text-foreground">
                  +{formatPriceWithComma(optionsTotalPrice)}원
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">수량</span>
            <span className="text-foreground">{quantity}개</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">상품 원가</span>
              <span className="text-foreground">
                {formatPriceWithComma(originalPrice)}원
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">할인</span>
                <span className="text-red-500">
                  -{formatPriceWithComma(discountAmount)}원
                </span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">할인 적용가</span>
                <span className="text-foreground font-medium">
                  {formatPriceWithComma(discountedPrice)}원
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">배송비</span>
              <span className="text-foreground">
                {DELIVERY_FEE === 0 ? "무료" : `${DELIVERY_FEE}원`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-foreground text-lg font-semibold">
              총 결제금액
            </span>
            <span className="text-primary text-2xl font-bold">
              {formatPriceWithComma(total)}원
            </span>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/50 flex-col items-start gap-3">
          <div className="flex items-start gap-2">
            <div className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
            <TypographyMuted className="leading-relaxed">
              구매 후 즉시 다운로드 링크가 이메일로 발송됩니다.
            </TypographyMuted>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
            <TypographyMuted className="leading-relaxed">
              디지털 상품 특성상 구매 후 환불이 불가합니다.
            </TypographyMuted>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-muted-foreground mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
            <TypographyMuted className="leading-relaxed">
              평생 무료 호스팅이 제공됩니다.
            </TypographyMuted>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
