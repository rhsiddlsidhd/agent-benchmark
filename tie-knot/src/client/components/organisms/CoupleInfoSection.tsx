"use client";

import { Card, CardContent, CardHeader, CardTitle, TypographyH3 } from "@/client/components/atoms";

import { BankField, TextField } from "@/client/components/molecules";

import { ICoupleInfo } from "@/server/models";
import type { BanksResponse } from "@/shared/schemas";

type CoupleInfoSectionProps = {
  data?: Pick<ICoupleInfo, "groom" | "bride">;
  banks?: BanksResponse;
};

export function CoupleInfoSection({ data, banks }: CoupleInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>신랑 & 신부 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 sm:grid-cols-2">
          {/* Groom Info */}
          <div className="space-y-4">
            <TypographyH3 className="text-foreground border-border border-b pb-2 text-lg font-semibold">
              신랑 정보
            </TypographyH3>

            <TextField
              id="groom.name"
              name="groom_name"
              type="text"
              placeholder="신랑 이름"
              defaultValue={data?.groom?.name}
              required
            >
              이름
            </TextField>

            <TextField
              id="groom.phone"
              name="groom_phone"
              type="tel"
              placeholder="010-1234-5678"
              defaultValue={data?.groom?.phone}
              required
            >
              연락처
            </TextField>

            <BankField
              id="groom"
              defaultBankName={data?.groom?.bankName}
              defaultAccountNumber={data?.groom?.accountNumber}
              banks={banks}
            />
          </div>

          {/* Bride Info */}
          <div className="space-y-4">
            <TypographyH3 className="text-foreground border-border border-b pb-2 text-lg font-semibold">
              신부 정보
            </TypographyH3>

            <TextField
              id="bride.name"
              name="bride_name"
              type="text"
              placeholder="신부 이름"
              defaultValue={data?.bride?.name}
              required
            >
              이름
            </TextField>

            <TextField
              id="bride.phone"
              name="bride_phone"
              type="tel"
              placeholder="010-1234-5678"
              defaultValue={data?.bride?.phone}
              required
            >
              연락처
            </TextField>

            <BankField
              id="bride"
              defaultBankName={data?.bride?.bankName}
              defaultAccountNumber={data?.bride?.accountNumber}
              banks={banks}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
