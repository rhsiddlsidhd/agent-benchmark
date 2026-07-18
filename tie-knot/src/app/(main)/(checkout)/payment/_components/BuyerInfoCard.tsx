"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import TextField from "@/components/organisms/fields/TextField";
import type { BuyerInfo } from "@/schemas/order.schema";

interface BuyerInfoCardProps {
  errors: Partial<Record<keyof BuyerInfo, string[]>>;
}

export function BuyerInfoCard({ errors }: BuyerInfoCardProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
            1
          </span>
          구매자 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="name"
            name="buyerName"
            type="text"
            placeholder="홍길동"
            required
            error={errors.buyerName?.[0]}
          >
            이름
          </TextField>
          <TextField
            id="phone"
            name="buyerPhone"
            type="tel"
            placeholder="010-1234-5678"
            required
            error={errors.buyerPhone?.[0]}
          >
            연락처
          </TextField>
        </div>
        <TextField
          id="email"
          name="buyerEmail"
          type="email"
          placeholder="your@email.com"
          required
          error={errors.buyerEmail?.[0]}
        >
          이메일
        </TextField>
      </CardContent>
    </Card>
  );
}
