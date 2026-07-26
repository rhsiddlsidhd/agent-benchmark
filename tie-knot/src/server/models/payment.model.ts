import { PAY_METHOD } from "@/shared/constants";
import mongoose, { Schema, Types, Model } from "mongoose";

// --- Enums --- TRANS 실시간 계좌이체 VBANK 가상 계좌

export type PayMethod = (typeof PAY_METHOD)[number]; // 카드 , 계좌이체, 가상계좌, 휴대폰 소액결제

// PortOne이 반환하는 PG사 식별자는 동적이므로 string으로 처리
type PgProvider = string;
export type PayStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "PARTIAL_CANCELLED"
  | "REFUNDED";

// PortOne 결제수단 판별값(@portone/server-sdk PaymentMethod.type) + 미인식 폴백.
export type PaymentMethodDetailType =
  | "PaymentMethodCard"
  | "PaymentMethodVirtualAccount"
  | "PaymentMethodTransfer"
  | "PaymentMethodMobile"
  | "PaymentMethodEasyPay"
  | "PaymentMethodGiftCertificate"
  | "PaymentMethodConvenienceStore"
  | "Unrecognized";

// 필드명은 PortOne 원문 그대로 쓴다(한글 의미 기반 재명명 안 함) — API 응답과
// 1:1 매핑을 유지해 번역 없이 그대로 소비하기 위함(TODO.md #10 확정 사항).
export interface PaymentMethodDetail {
  type?: PaymentMethodDetailType;
  card?: {
    publisher?: string;
    issuer?: string;
    brand?: string;
    type?: string;
    ownerType?: string;
    bin?: string;
    name?: string;
    number?: string;
    approvalNumber?: string;
    installment?: {
      month: number;
      isInterestFree: boolean;
    };
    pointUsed?: boolean;
  };
  virtualAccount?: {
    bank?: string;
    accountNumber: string;
    accountType?: string;
    remitteeName?: string;
    remitterName?: string;
    expiredAt?: Date;
    issuedAt?: Date;
    refundStatus?: string;
  };
  transfer?: {
    bank?: string;
    accountNumber?: string;
  };
  mobile?: {
    phoneNumber?: string;
  };
  easyPay?: {
    provider?: string;
    easyPayMethod?: unknown;
  };
  giftCertificate?: {
    giftCertificateType?: string;
    approvalNumber: string;
  };
  convenienceStore?: {
    convenienceStoreBrand?: string;
    confirmationNumber?: string;
    receiptNumber?: string;
    paymentDeadline?: Date;
  };
}

export interface IPayment {
  // 식별자
  _id: Types.ObjectId;
  merchantUid: string; // PortOne의 주문번호 (우리 서버에서 생성)
  impUid?: string; // PortOne 트랜잭션 고유 ID

  // 주문 참조
  orderId: mongoose.Types.ObjectId;

  // 구매자
  buyerName: string;
  buyerEmail: string;
  buyerTel: string;

  // 결제 금액
  requestAmount: number; // 결제 요청 금액 (order.finalPrice와 동일)
  paidAmount?: number; // 실제 결제된 금액 (PortOne에서 제공)

  // PG 결제 정보
  payMethod?: PayMethod; // 결제 수단(이 프로젝트가 노출하는 카테고리 — CARD/TRANSFER/VIRTUAL_ACCOUNT/MOBILE)
  pgProvider?: PgProvider; // PG사
  pgTid?: string; // PG사 거래 고유 ID
  methodDetail?: PaymentMethodDetail; // payMethod 카테고리 안의 PG 응답 상세 정보(PortOne PaymentMethod discriminated union)

  // 결제 상태
  status: PayStatus; // 결제 상태 (PENDING, PAID, FAILED, CANCELLED 등)

  // 결제 이력 (Timestamp)
  paidAt?: Date; // 결제 완료 일시
  failedAt?: Date; // 결제 실패 일시
  failReason?: string; // 결제 실패 사유

  cancelledAt?: Date; // 결제 취소 일시
  cancelAmount?: number; // 취소/환불 금액
  cancelReason?: string; // 취소/환불 사유

  // 영수증
  receiptUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

// PG사/은행/브랜드류(Bank, CardBrand, EasyPayProvider 등)는 SDK 타입 자체가
// "고정 목록 | string"인 open union이다(PG가 계속 값을 추가) — 위 pgProvider와
// 같은 이유로 enum을 걸지 않는다. type만 예외 — SDK가 정의한 7종 판별값 +
// Unrecognized 폴백은 고정된 닫힌 집합이라 다르다.
const methodDetailSchema = new Schema<PaymentMethodDetail>(
  {
    type: {
      type: String,
      enum: [
        "PaymentMethodCard",
        "PaymentMethodVirtualAccount",
        "PaymentMethodTransfer",
        "PaymentMethodMobile",
        "PaymentMethodEasyPay",
        "PaymentMethodGiftCertificate",
        "PaymentMethodConvenienceStore",
        "Unrecognized",
      ],
    },
    card: {
      publisher: { type: String },
      issuer: { type: String },
      brand: { type: String },
      type: { type: String },
      ownerType: { type: String },
      bin: { type: String },
      name: { type: String },
      number: { type: String },
      approvalNumber: { type: String },
      installment: {
        month: { type: Number },
        isInterestFree: { type: Boolean },
      },
      pointUsed: { type: Boolean },
    },
    virtualAccount: {
      bank: { type: String },
      accountNumber: { type: String },
      accountType: { type: String },
      remitteeName: { type: String },
      remitterName: { type: String },
      expiredAt: { type: Date },
      issuedAt: { type: Date },
      refundStatus: { type: String },
    },
    transfer: {
      bank: { type: String },
      accountNumber: { type: String },
    },
    mobile: {
      phoneNumber: { type: String },
    },
    easyPay: {
      provider: { type: String },
      easyPayMethod: { type: Schema.Types.Mixed },
    },
    giftCertificate: {
      giftCertificateType: { type: String },
      approvalNumber: { type: String },
    },
    convenienceStore: {
      convenienceStoreBrand: { type: String },
      confirmationNumber: { type: String },
      receiptNumber: { type: String },
      paymentDeadline: { type: Date },
    },
  },
  { _id: false },
);

const paymentSchema = new Schema<IPayment>(
  {
    // 식별자
    merchantUid: { type: String, required: true, unique: true }, // 우리 서버에서 생성, 필수, 고유
    impUid: { type: String, unique: true, sparse: true }, // 포트원에서 생성, 고유 (null 허용)

    // 주문 참조
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true }, // Order 모델 참조, 필수

    // 구매자
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerTel: { type: String, required: true },

    // 결제 금액
    requestAmount: { type: Number, required: true }, // 결제 요청 금액, 필수
    paidAmount: { type: Number }, // 실제 결제 금액

    // PG 결제 정보
    payMethod: {
      type: String,
      enum: ["CARD", "TRANSFER", "VIRTUAL_ACCOUNT", "MOBILE"],
    },
    pgProvider: {
      type: String,
      // enum 제거: PortOne이 반환하는 다양한 PG사 값을 모두 허용
      // 예: "INICIS_V2", "INICIS", "HTML5_INICIS", "NICE_V2", "TOSSPAYMENTS" 등
    },
    pgTid: { type: String },
    methodDetail: { type: methodDetailSchema },

    // 결제 상태
    status: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
        "CANCELLED",
        "PARTIAL_CANCELLED",
        "REFUNDED",
      ],
      required: true,
      default: "PENDING", // 초기 상태 PENDING
    },

    // 결제 이력
    paidAt: { type: Date },
    failedAt: { type: Date },
    failReason: { type: String },

    cancelledAt: { type: Date },
    cancelAmount: { type: Number }, // 취소/환불 금액
    cancelReason: { type: String },

    // 영수증
    receiptUrl: { type: String },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 추가
  },
);

export const PaymentModel =
  (mongoose.models.Payment as Model<IPayment>) ||
  mongoose.model<IPayment>("Payment", paymentSchema);
