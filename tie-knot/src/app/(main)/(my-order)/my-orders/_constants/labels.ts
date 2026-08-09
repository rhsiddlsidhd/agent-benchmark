import { PayMethod } from "@/server/models";
import { OrderStatus } from "../_types";

export const PAYMENT_STATUS: Record<OrderStatus, string> = {
  PENDING: "주문대기",
  CONFIRMED: "결제완료",
  COMPLETED: "제작완료",
  CANCELLED: "취소",
};

export const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  CARD: "신용카드",
  TRANSFER: "실시간 계좌이체",
  VIRTUAL_ACCOUNT: "가상계좌",
  MOBILE: "휴대폰 소액결제",
  GIFT_CERTIFICATE: "상품권",
  EASY_PAY: "간편결제",
};
