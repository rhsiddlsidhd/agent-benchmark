"use client";

import { createPremiumFeatureAction } from "@/actions/createPremiumFeatureAction";
import Alert from "@/components/molecules/Alert";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { TypographyMuted } from "@/components/atoms/typoqraphy";
import { useActionState, useEffect } from "react";
import { getFieldError } from "@/utils/error";
import { APIResponse } from "@/types/error";

const PremiumFeatureRegistrationForm = () => {
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(createPremiumFeatureAction, null);
  useEffect(() => {
    if (state && state.success && state.data) alert(state.data.message);
  }, [state]);

  const codeError = getFieldError(state, "code");
  const labelError = getFieldError(state, "label");
  const descriptionError = getFieldError(state, "description");
  const additionalPriceError = getFieldError(state, "additionalPrice");

  return (
    <form className="space-y-6" action={action}>
      <div className="space-y-2">
        <Label htmlFor="code">기능 코드 *</Label>
        <Input
          id="code"
          name="code"
          placeholder="예: ANIMATION, MUSIC, MAP"
          required
        />
        {codeError && <Alert type="error">{codeError}</Alert>}
        <TypographyMuted>
          영문 대문자와 언더스코어만 사용 가능합니다. (예: PREMIUM_ANIMATION)
        </TypographyMuted>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">기능 이름 *</Label>
        <Input
          id="label"
          name="label"
          placeholder="예: 애니메이션 효과"
          required
        />
        {labelError && <Alert type="error">{labelError}</Alert>}
        <TypographyMuted>
          고객에게 표시될 기능의 이름입니다.
        </TypographyMuted>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">기능 설명 *</Label>
        <Textarea
          id="description"
          placeholder="기능에 대한 자세한 설명을 입력하세요."
          rows={5}
          required
          name="description"
          className="resize-none"
        />
        {descriptionError && <Alert type="error">{descriptionError}</Alert>}
        <TypographyMuted>
          기능의 특징과 장점을 상세하게 작성해주세요. (최소 20자 이상)
        </TypographyMuted>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalPrice">추가 비용 *</Label>
        <div className="relative">
          <Input
            id="additionalPrice"
            name="additionalPrice"
            type="number"
            placeholder="0"
            min={0}
            step={1000}
            required
            className="pr-12"
          />
          <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
            원
          </span>
        </div>
        {additionalPriceError && (
          <Alert type="error">{additionalPriceError}</Alert>
        )}
        <TypographyMuted>
          이 기능을 추가할 때 부과되는 추가 비용입니다.
        </TypographyMuted>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit">등록{`${!pending ? "하기" : "중"}`}</Button>
      </div>
    </form>
  );
};

export default PremiumFeatureRegistrationForm;
