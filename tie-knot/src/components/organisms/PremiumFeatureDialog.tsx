import { Button } from "@/components/atoms/button";
import { DialogFooter } from "@/components/atoms/dialog";
import { Input } from "@/components/atoms/input";
import { TypographyMuted } from "@/components/atoms/typography";

import { Textarea } from "@/components/atoms/textarea";

import { PremiumFeature } from "@/services/premiumFeature.service";
import Alert from "@/components/molecules/Alert";
import { Label } from "@/components/atoms/label";
import { APIResponse } from "@/types";
import { getFieldError } from "@/utils";
import TextField from "@/components/molecules/TextField";

interface PremiumFeatureDialogProps {
  premiumFeature: PremiumFeature;
  action: (formData: FormData) => void;
  pending: boolean;
  state: APIResponse<{ message: string }> | null;
}

export function PremiumFeatureDialog({
  premiumFeature: feature,
  action,
  pending,
  state,
}: PremiumFeatureDialogProps) {
  const codeError = getFieldError(state, "code");
  const labelError = getFieldError(state, "label");
  const descriptionError = getFieldError(state, "description");
  const additionalPriceError = getFieldError(state, "additionalPrice");

  return (
    <form action={action}>
      <div className="space-y-4 py-4">
        <TextField
            id="code"
            name="code"
            type="text"
            placeholder="예: ANIMATION"
            defaultValue={feature.code}
            required
            error={codeError}
          >
            기능 코드 *
          </TextField>
          <TypographyMuted>
            영문 대문자와 언더스코어만 사용 가능합니다.
          </TypographyMuted>

        <TextField
            id="label"
            name="label"
            type="text"
            placeholder="예: 애니메이션 효과"
            defaultValue={feature.label}
            required
            error={labelError}
          >
            기능 이름 *
          </TextField>

        <div className="space-y-2">
          <Label htmlFor="description">
            기능 설명 *
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder="기능에 대한 자세한 설명을 입력하세요."
            rows={3}
            defaultValue={feature.description}
            required
          />
          {descriptionError && <Alert type="error">{descriptionError}</Alert>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalPrice">
            추가 비용 *
          </Label>
          <div className="relative">
            <Input
              id="additionalPrice"
              name="additionalPrice"
              type="number"
              placeholder="0"
              min={0}
              step={1000}
              defaultValue={feature.additionalPrice}
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
        </div>

        <input
          type="hidden"
          id="featureId"
          name="featureId"
          value={feature._id}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline">
          취소
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "수정 중..." : "수정"}
        </Button>
      </DialogFooter>
    </form>
  );
}
