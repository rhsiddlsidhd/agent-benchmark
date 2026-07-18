"use client";

import { Card, CardContent } from "@/components/atoms/card";
import { Checkbox } from "@/components/atoms/checkbox";
import { Label } from "@/components/atoms/label";

interface TermsAgreementCardProps {
  agreed: boolean;
  onAgreedChange: (value: boolean) => void;
}

export function TermsAgreementCard({ agreed, onAgreedChange }: TermsAgreementCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => onAgreedChange(checked as boolean)}
          />
          <Label
            htmlFor="terms"
            className="cursor-pointer text-sm leading-relaxed font-normal"
          >
            구매조건 확인 및 결제 진행에 동의합니다.
            <br />
            <span className="text-muted-foreground">
              (전자상거래법 제 8조 2항) 주문 내용을 확인하였으며, 구매에
              동의하시겠습니까?
            </span>
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
