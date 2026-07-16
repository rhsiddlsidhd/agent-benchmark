import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { PayMethod } from "@/models/payment";
import { ArrowRightLeft, CreditCard, Landmark, Phone } from "lucide-react";
import React from "react";
import RadioField, {
  RadioFieldOption,
} from "@/components/molecules/RadioField";
import Alert from "@/components/molecules/Alert";

const PAYMENT_METHODS: RadioFieldOption<PayMethod>[] = [
  {
    id: "card",
    value: "CARD",
    title: "신용/체크카드",
    icon: CreditCard,
    description: "모든 카드 사용 가능",
  },
  {
    id: "virtualAccount",
    value: "VIRTUAL_ACCOUNT",
    title: "가상계좌",
    icon: Landmark,
    description: "입금 전용 계좌 발급",
  },
  {
    id: "transfer",
    value: "TRANSFER",
    title: "실시간 계좌이체",
    icon: ArrowRightLeft,
    description: "은행 계좌 바로 이체",
  },
  {
    id: "mobile",
    value: "MOBILE",
    title: "휴대폰",
    icon: Phone,
    description: "휴대폰 소액결제",
  },
];

const PaymentMethodSelector = ({ error }: { error?: string }) => {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
            2
          </span>
          결제 수단 {error && <Alert type="error">{error}</Alert>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioField
          options={PAYMENT_METHODS}
          id="PaymentMethod"
          name="payMethod"
          defaultValue="CARD"
        />
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;
